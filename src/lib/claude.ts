import Anthropic from '@anthropic-ai/sdk'
import type { AiAnalysisResult } from './types'
import { DEFAULT_CATEGORIES } from './constants'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function analyzeRepo(params: {
  readme: string
  languages: Record<string, number>
  description: string | null
  repoName: string
}): Promise<AiAnalysisResult> {
  const categoryNames = DEFAULT_CATEGORIES.map((c) => c.name).join(', ')
  const langList = Object.keys(params.languages).join(', ')

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Analyze this GitHub repository and return JSON.

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
}`,
      },
    ],
  })

  const text =
    message.content[0].type === 'text' ? message.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('AI response did not contain valid JSON')
  }

  return JSON.parse(jsonMatch[0]) as AiAnalysisResult
}
