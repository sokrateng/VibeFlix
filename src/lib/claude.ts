import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'
import type { AiAnalysisResult } from './types'
import { DEFAULT_CATEGORIES } from './constants'

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

async function analyzeWithClaude(prompt: string): Promise<string> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  })

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  return message.content[0].type === 'text' ? message.content[0].text : ''
}

async function analyzeWithGemini(prompt: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' })
  const result = await model.generateContent(prompt)
  return result.response.text()
}

export async function analyzeRepo(params: {
  readme: string
  languages: Record<string, number>
  description: string | null
  repoName: string
}): Promise<AiAnalysisResult> {
  const prompt = buildPrompt(params)

  // Try Gemini first (free tier), fallback to Claude
  const providers = []

  if (process.env.GEMINI_API_KEY) {
    providers.push({ name: 'Gemini', fn: () => analyzeWithGemini(prompt) })
  }
  if (process.env.ANTHROPIC_API_KEY) {
    providers.push({ name: 'Claude', fn: () => analyzeWithClaude(prompt) })
  }

  if (providers.length === 0) {
    throw new Error('No AI provider configured (GEMINI_API_KEY or ANTHROPIC_API_KEY required)')
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

  throw new Error(`All AI providers failed — ${errors.join(' | ')}`)
}
