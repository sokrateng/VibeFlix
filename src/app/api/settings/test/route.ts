import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'
import type { ApiResponse } from '@/lib/types'

interface TestResult {
  provider: string
  model: string
  status: 'success' | 'error'
  message: string
  latency_ms: number
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<TestResult>>> {
  if (!verifyAdminToken(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const { provider, apiKey, model } = await request.json()

    if (!provider || !apiKey || !model) {
      return NextResponse.json(
        { success: false, error: 'provider, apiKey, and model are required' },
        { status: 400 }
      )
    }

    const start = Date.now()

    if (provider === 'gemini') {
      const genAI = new GoogleGenerativeAI(apiKey)
      const genModel = genAI.getGenerativeModel({ model })
      const result = await genModel.generateContent('Say "OK" in one word.')
      const text = result.response.text()
      const latency = Date.now() - start

      return NextResponse.json({
        success: true,
        data: {
          provider: 'Gemini',
          model,
          status: 'success',
          message: `Baglanti basarili! Yanit: "${text.trim().slice(0, 50)}"`,
          latency_ms: latency,
        },
      })
    }

    if (provider === 'claude') {
      const anthropic = new Anthropic({ apiKey })
      const message = await anthropic.messages.create({
        model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Say "OK" in one word.' }],
      })
      const text = message.content[0].type === 'text' ? message.content[0].text : ''
      const latency = Date.now() - start

      return NextResponse.json({
        success: true,
        data: {
          provider: 'Claude',
          model,
          status: 'success',
          message: `Baglanti basarili! Yanit: "${text.trim().slice(0, 50)}"`,
          latency_ms: latency,
        },
      })
    }

    return NextResponse.json(
      { success: false, error: `Unknown provider: ${provider}` },
      { status: 400 }
    )
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({
      success: true,
      data: {
        provider: '',
        model: '',
        status: 'error',
        message: msg.slice(0, 300),
        latency_ms: 0,
      },
    })
  }
}
