'use client'

import { useState, useEffect } from 'react'

interface AiSettingsProps {
  token: string
}

interface TestResult {
  provider: string
  model: string
  status: 'success' | 'error'
  message: string
  latency_ms: number
}

const GEMINI_MODELS = [
  'gemini-2.5-flash-preview-05-20',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-pro',
]

const CLAUDE_MODELS = [
  'claude-haiku-4-5-20251001',
  'claude-sonnet-4-20250514',
]

export function AiSettings({ token }: AiSettingsProps) {
  const [provider, setProvider] = useState('gemini')
  const [geminiKey, setGeminiKey] = useState('')
  const [geminiModel, setGeminiModel] = useState('gemini-2.0-flash')
  const [claudeKey, setClaudeKey] = useState('')
  const [claudeModel, setClaudeModel] = useState('claude-haiku-4-5-20251001')
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState<string | null>(null)
  const [aiEnabled, setAiEnabled] = useState(true)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [saveMsg, setSaveMsg] = useState('')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/settings', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (json.success && json.data) {
        const s = json.data
        if (s.ai_enabled !== undefined) setAiEnabled(s.ai_enabled !== 'false')
        if (s.ai_provider) setProvider(s.ai_provider)
        if (s.gemini_api_key) setGeminiKey(s.gemini_api_key)
        if (s.gemini_model) setGeminiModel(s.gemini_model)
        if (s.anthropic_api_key) setClaudeKey(s.anthropic_api_key)
        if (s.anthropic_model) setClaudeModel(s.anthropic_model)
      }
      setLoaded(true)
    }
    load()
  }, [token])

  async function handleSave() {
    setSaving(true)
    setSaveMsg('')
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ai_enabled: aiEnabled ? 'true' : 'false',
        ai_provider: provider,
        gemini_api_key: geminiKey,
        gemini_model: geminiModel,
        anthropic_api_key: claudeKey,
        anthropic_model: claudeModel,
      }),
    })
    const json = await res.json()
    setSaving(false)
    setSaveMsg(json.success ? 'Kaydedildi!' : `Hata: ${json.error}`)
    setTimeout(() => setSaveMsg(''), 3000)
  }

  async function handleTest(testProvider: string) {
    setTesting(testProvider)
    setTestResult(null)
    const apiKey = testProvider === 'gemini' ? geminiKey : claudeKey
    const model = testProvider === 'gemini' ? geminiModel : claudeModel

    if (!apiKey) {
      setTestResult({
        provider: testProvider,
        model,
        status: 'error',
        message: 'API key bos! Once key girin.',
        latency_ms: 0,
      })
      setTesting(null)
      return
    }

    const res = await fetch('/api/settings/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ provider: testProvider, apiKey, model }),
    })
    const json = await res.json()
    if (json.success && json.data) {
      setTestResult(json.data)
    } else {
      setTestResult({
        provider: testProvider,
        model,
        status: 'error',
        message: json.error || 'Test basarisiz',
        latency_ms: 0,
      })
    }
    setTesting(null)
  }

  if (!loaded) {
    return (
      <div className="bg-[#1F1F1F] rounded-lg p-6 text-gray-500">
        Yukleniyor...
      </div>
    )
  }

  return (
    <div className="bg-[#1F1F1F] rounded-lg p-6">
      <h2 className="text-xl font-bold text-white mb-4">AI Ayarlari</h2>

      {/* AI Enable/Disable */}
      <div className="mb-6 flex items-center justify-between p-4 rounded-lg bg-black/20">
        <div>
          <p className="text-white font-bold">AI Analiz</p>
          <p className="text-gray-500 text-xs mt-1">
            {aiEnabled
              ? 'Repolar AI ile analiz edilir (aciklama, kategori, trailer)'
              : 'AI kapali — GitHub bilgileriyle basit analiz yapilir'}
          </p>
        </div>
        <button
          onClick={() => setAiEnabled(!aiEnabled)}
          className={`relative w-14 h-7 rounded-full transition-colors ${
            aiEnabled ? 'bg-green-600' : 'bg-gray-600'
          }`}
        >
          <span
            className={`absolute top-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
              aiEnabled ? 'translate-x-7' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      {/* Provider Selection */}
      <div className="mb-6">
        <label className="text-gray-400 text-sm block mb-2">
          Aktif AI Saglayici
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => setProvider('gemini')}
            className={`px-4 py-2 rounded font-bold text-sm ${
              provider === 'gemini'
                ? 'bg-blue-600 text-white'
                : 'bg-black/30 text-gray-400 hover:text-white'
            }`}
          >
            Google Gemini
          </button>
          <button
            onClick={() => setProvider('claude')}
            className={`px-4 py-2 rounded font-bold text-sm ${
              provider === 'claude'
                ? 'bg-orange-600 text-white'
                : 'bg-black/30 text-gray-400 hover:text-white'
            }`}
          >
            Anthropic Claude
          </button>
        </div>
      </div>

      {/* Gemini Config */}
      <div className={`mb-6 p-4 rounded-lg ${provider === 'gemini' ? 'bg-blue-900/20 border border-blue-800' : 'bg-black/20'}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-bold">
            Google Gemini {provider === 'gemini' && <span className="text-blue-400 text-xs ml-2">AKTIF</span>}
          </h3>
          <button
            onClick={() => handleTest('gemini')}
            disabled={testing === 'gemini'}
            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {testing === 'gemini' ? 'Test ediliyor...' : 'Test Et'}
          </button>
        </div>
        <div className="mb-3">
          <label className="text-gray-500 text-xs block mb-1">API Key</label>
          <input
            type="password"
            value={geminiKey}
            onChange={(e) => setGeminiKey(e.target.value)}
            placeholder="AIzaSy..."
            className="w-full bg-black/30 text-white border border-gray-600 rounded px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-gray-500 text-xs block mb-1">Model</label>
          <select
            value={geminiModel}
            onChange={(e) => setGeminiModel(e.target.value)}
            className="w-full bg-black/30 text-white border border-gray-600 rounded px-3 py-2 text-sm"
          >
            {GEMINI_MODELS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Claude Config */}
      <div className={`mb-6 p-4 rounded-lg ${provider === 'claude' ? 'bg-orange-900/20 border border-orange-800' : 'bg-black/20'}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-bold">
            Anthropic Claude {provider === 'claude' && <span className="text-orange-400 text-xs ml-2">AKTIF</span>}
          </h3>
          <button
            onClick={() => handleTest('claude')}
            disabled={testing === 'claude'}
            className="bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700 disabled:opacity-50"
          >
            {testing === 'claude' ? 'Test ediliyor...' : 'Test Et'}
          </button>
        </div>
        <div className="mb-3">
          <label className="text-gray-500 text-xs block mb-1">API Key</label>
          <input
            type="password"
            value={claudeKey}
            onChange={(e) => setClaudeKey(e.target.value)}
            placeholder="sk-ant-..."
            className="w-full bg-black/30 text-white border border-gray-600 rounded px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-gray-500 text-xs block mb-1">Model</label>
          <select
            value={claudeModel}
            onChange={(e) => setClaudeModel(e.target.value)}
            className="w-full bg-black/30 text-white border border-gray-600 rounded px-3 py-2 text-sm"
          >
            {CLAUDE_MODELS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Test Result */}
      {testResult && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          testResult.status === 'success'
            ? 'bg-green-900/30 border border-green-700 text-green-300'
            : 'bg-red-900/30 border border-red-700 text-red-300'
        }`}>
          <div className="font-bold mb-1">
            {testResult.status === 'success' ? 'Basarili' : 'Basarisiz'}
            {testResult.latency_ms > 0 && ` (${testResult.latency_ms}ms)`}
          </div>
          <div className="break-all">{testResult.message}</div>
        </div>
      )}

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#E50914] text-white px-6 py-2 rounded font-bold hover:bg-red-700 disabled:opacity-50"
        >
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
        {saveMsg && (
          <span className={`text-sm ${saveMsg.startsWith('Hata') ? 'text-red-400' : 'text-green-400'}`}>
            {saveMsg}
          </span>
        )}
      </div>
    </div>
  )
}
