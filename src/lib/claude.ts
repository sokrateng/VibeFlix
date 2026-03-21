import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createServerClient } from './supabase-server'
import type { AiAnalysisResult } from './types'
import { DEFAULT_CATEGORIES } from './constants'

interface AiConfig {
  provider: string
  geminiKey: string
  geminiModel: string
  claudeKey: string
  claudeModel: string
}

async function getAiConfig(): Promise<AiConfig> {
  const supabase = createServerClient()
  const { data } = await supabase.from('settings').select('key, value')

  const settings: Record<string, string> = {}
  for (const row of data || []) {
    settings[row.key] = row.value
  }

  return {
    provider: settings.ai_provider || 'gemini',
    geminiKey: settings.gemini_api_key || process.env.GEMINI_API_KEY || '',
    geminiModel: settings.gemini_model || 'gemini-2.0-flash',
    claudeKey: settings.anthropic_api_key || process.env.ANTHROPIC_API_KEY || '',
    claudeModel: settings.anthropic_model || 'claude-haiku-4-5-20251001',
  }
}

function buildPrompt(params: {
  readme: string
  languages: Record<string, number>
  description: string | null
  repoName: string
}): string {
  const categoryNames = DEFAULT_CATEGORIES.map((c) => c.name).join(', ')
  const langList = Object.keys(params.languages).join(', ')

  return `Analyze this GitHub repository and return JSON.

Repository: ${params.repoName}
Description: ${params.description || 'None'}
Languages: ${langList}
README (first 2000 chars):
${params.readme.slice(0, 2000)}

Return ONLY valid JSON with these fields:
{
  "description": "1-2 sentence Turkish description of what this project does",
  "category": "one of: ${categoryNames}",
  "ai_trailer": "3-4 sentence engaging Turkish summary, like a Netflix trailer",
  "activity": "aktif or arsiv (based on how maintained it looks)",
  "tech_stack": ["array", "of", "technologies", "used"]
}`
}

function parseAiResponse(text: string): AiAnalysisResult {
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('AI response did not contain valid JSON')
  }
  return JSON.parse(jsonMatch[0]) as AiAnalysisResult
}

async function analyzeWithClaude(prompt: string, apiKey: string, model: string): Promise<string> {
  const anthropic = new Anthropic({ apiKey })
  const message = await anthropic.messages.create({
    model,
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })
  return message.content[0].type === 'text' ? message.content[0].text : ''
}

async function analyzeWithGemini(prompt: string, apiKey: string, model: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey)
  const genModel = genAI.getGenerativeModel({ model })
  const result = await genModel.generateContent(prompt)
  return result.response.text()
}

export async function analyzeRepo(params: {
  readme: string
  languages: Record<string, number>
  description: string | null
  repoName: string
}): Promise<AiAnalysisResult> {
  const config = await getAiConfig()
  const prompt = buildPrompt(params)

  // Primary provider first, then fallback
  const providers = []

  if (config.provider === 'gemini' && config.geminiKey) {
    providers.push({ name: 'Gemini', fn: () => analyzeWithGemini(prompt, config.geminiKey, config.geminiModel) })
  }
  if (config.provider === 'claude' && config.claudeKey) {
    providers.push({ name: 'Claude', fn: () => analyzeWithClaude(prompt, config.claudeKey, config.claudeModel) })
  }
  // Fallback: the other provider
  if (config.provider !== 'gemini' && config.geminiKey) {
    providers.push({ name: 'Gemini (fallback)', fn: () => analyzeWithGemini(prompt, config.geminiKey, config.geminiModel) })
  }
  if (config.provider !== 'claude' && config.claudeKey) {
    providers.push({ name: 'Claude (fallback)', fn: () => analyzeWithClaude(prompt, config.claudeKey, config.claudeModel) })
  }

  if (providers.length === 0) {
    throw new Error('AI ayari yapilmamis — Admin panelden AI Ayarlari sekmesinde key girin')
  }

  const errors: string[] = []

  for (const provider of providers) {
    try {
      console.log(`Trying AI provider: ${provider.name}`)
      const text = await provider.fn()
      const result = parseAiResponse(text)
      console.log(`AI analysis succeeded with ${provider.name}`)
      return result
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      errors.push(`${provider.name}: ${msg}`)
      console.error(`${provider.name} failed: ${msg}`)
    }
  }

  throw new Error(`Tum AI saglayicilar basarisiz — ${errors.join(' | ')}`)
}
