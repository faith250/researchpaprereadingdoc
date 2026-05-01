export const FREE_MODELS = [
  // Gemini 3 is the latest high-performance preview
  { label: 'Gemini 3 Flash (Latest)', value: 'gemini-3-flash-preview' },
  // Gemini 3.1 Flash-Lite is the ultra-fast workhorse for simple tasks
  { label: 'Gemini 3.1 Flash-Lite', value: 'gemini-3.1-flash-lite-preview' },
  // Gemini 2.5 is the current stable generation
  { label: 'Gemini 2.5 Pro (Stable)', value: 'gemini-2.5-pro' },
  { label: 'Gemini 2.5 Flash (Stable)', value: 'gemini-2.5-flash' },
]

export const OLLAMA_MODELS = [
  // Updated versions for 2026
  { label: 'Llama 3.3 (8B)', value: 'llama3.3' }, 
  { label: 'Gemma 3 (4B)', value: 'gemma3' },
  { label: 'Mistral Small', value: 'mistral-small' },
  { label: 'Phi-4 Mini', value: 'phi4:mini' },
]

function buildPrompt(highlightedText) {
  return `You are a research paper assistant. A user highlighted this text from a research paper:

"${highlightedText}"

Give a concise explanation (3-5 sentences):
1. What this means in plain English
2. Why it matters in context
3. Any key terms defined simply

Be direct, no fluff.`
}

export async function explainText(highlightedText, settings) {
  const { provider, model, apiKey } = settings
  if (provider === 'ollama') return await callOllama(highlightedText, model)
  return await callGemini(highlightedText, model, apiKey)
}

async function callGemini(text, model, apiKey) {
  const modelName = model || 'gemini-2.0-flash'
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: buildPrompt(text) }]
      }],
      generationConfig: { maxOutputTokens: 500 }
    }),
  })

  const data = await response.json()
  console.log('Gemini response:', data)

  if (!response.ok) {
    throw new Error(data.error?.message || 'Gemini request failed')
  }

  const content = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!content) throw new Error('Empty response from Gemini')

  return content
}

async function callOllama(text, model) {
  const response = await fetch('http://localhost:11434/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model || 'llama3',
      messages: [{ role: 'user', content: buildPrompt(text) }],
      stream: false,
    }),
  })

  if (!response.ok) throw new Error('Ollama not running — start it with: ollama serve')
  const data = await response.json()
  return data.message.content
}