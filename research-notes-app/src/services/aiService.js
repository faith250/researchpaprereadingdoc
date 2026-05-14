export const FREE_MODELS = [
  { label: 'Gemini 2.5 Flash (Recommended)', value: 'gemini-2.5-flash' },
  { label: 'Gemini 2.5 Pro', value: 'gemini-2.5-pro' },
  { label: 'Gemini 2.0 Flash', value: 'gemini-2.0-flash' },
  { label: 'Gemini 1.5 Flash', value: 'gemini-1.5-flash' },
]

export const GROQ_MODELS = [
  { label: 'Llama 3.1 8B — fastest', value: 'llama-3.1-8b-instant' },
  { label: 'Llama 3.3 70B — best quality', value: 'llama-3.3-70b-versatile' },
  { label: 'Gemma 2 9B — balanced', value: 'gemma2-9b-it' },
  { label: 'Mixtral 8x7B — large context', value: 'mixtral-8x7b-32768' },
]

export const OLLAMA_MODELS = [
  { label: 'Llama 3.2 (3B) — fast & light', value: 'llama3.2' },
  { label: 'Llama 3.3 (8B) — best quality', value: 'llama3.3' },
  { label: 'Gemma 3 (4B)', value: 'gemma3' },
  { label: 'Mistral Small', value: 'mistral-small' },
  { label: 'Phi-4 Mini — very fast', value: 'phi4-mini' },
]

// ─────────────────────────────────────────────
// Prompt builders
// ─────────────────────────────────────────────

function summarySection(paperSummary) {
  return paperSummary
    ? `\nPaper Summary (for context):\n---\n${paperSummary}\n---\n`
    : ''
}

function buildExplainPrompt(highlightedText, pageContext, paperSummary) {
  const contextSection = pageContext
    ? `\nSurrounding page text:\n---\n${pageContext.slice(0, 2500)}\n---\n`
    : ''

  return `You are a research paper reading assistant with full knowledge of the paper.
${summarySection(paperSummary)}
A user highlighted this passage:
"${highlightedText}"
${contextSection}
Explain this concisely (3–5 sentences):
1. What it means in plain English
2. Why it matters in the context of this paper
3. Any key terms, simply defined

Be direct and specific. No filler phrases.`
}

function buildAskPrompt(question, highlightedText, pageContext, paperSummary) {
  const contextSection = pageContext
    ? `\nSurrounding page text:\n---\n${pageContext.slice(0, 2500)}\n---\n`
    : ''

  return `You are a research paper reading assistant with full knowledge of the paper.
${summarySection(paperSummary)}
A user highlighted this passage:
"${highlightedText}"
${contextSection}
The user asks: "${question}"

Answer specifically and concisely (3–5 sentences), referencing the highlighted text and the paper. Be direct.`
}

function buildGeneralAskPrompt(question, paperSummary, fullPaperText) {
  const fullTextSection = fullPaperText
    ? `\nFull paper text (use for detailed answers):\n---\n${fullPaperText.slice(0, 12000)}\n---\n`
    : ''

  return `You are a research paper reading assistant with full knowledge of the paper.
${summarySection(paperSummary)}${fullTextSection}
The user asks a general question about this paper:
"${question}"

Answer clearly and concisely (4–6 sentences). Reference specific parts of the paper where relevant. Be direct and informative.`
}

function buildSummarizePrompt(fullText) {
  return `You are a research paper summarizer. Read the following paper text and produce a structured summary.

Paper text:
---
${fullText.slice(0, 15000)}
---

Provide a concise structured summary with these sections:
1. **Title & Authors**: (if mentioned in the text)
2. **Research Question**: What problem or question does this paper address?
3. **Methods**: How did the authors approach it? (techniques, datasets, experiments)
4. **Key Findings**: What are the main results and discoveries?
5. **Contributions**: What does this paper contribute to the field?
6. **Limitations**: Any limitations mentioned?

Keep each section to 2–3 sentences. Be specific and factual.`
}

// ─────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────

export async function explainText(highlightedText, settings, pageContext = '', paperSummary = '') {
  const prompt = buildExplainPrompt(highlightedText, pageContext, paperSummary)
  if (settings.provider === 'ollama') return callOllama(prompt, settings.model)
  if (settings.provider === 'groq')   return callGroq(prompt, settings.model, settings.groqApiKey)
  return callGemini(prompt, settings.model, settings.apiKey)
}

export async function askQuestion(question, highlightedText, settings, pageContext = '', paperSummary = '') {
  const prompt = buildAskPrompt(question, highlightedText, pageContext, paperSummary)
  if (settings.provider === 'ollama') return callOllama(prompt, settings.model)
  if (settings.provider === 'groq')   return callGroq(prompt, settings.model, settings.groqApiKey)
  return callGemini(prompt, settings.model, settings.apiKey)
}

export async function generalAsk(question, settings, paperSummary = '', fullPaperText = '') {
  const prompt = buildGeneralAskPrompt(question, paperSummary, fullPaperText)
  if (settings.provider === 'ollama') return callOllama(prompt, settings.model)
  if (settings.provider === 'groq')   return callGroq(prompt, settings.model, settings.groqApiKey)
  return callGemini(prompt, settings.model, settings.apiKey, 800)
}

export async function summarizePaper(fullText, settings) {
  const prompt = buildSummarizePrompt(fullText)
  if (settings.provider === 'ollama') return callOllama(prompt, settings.model)
  if (settings.provider === 'groq')   return callGroq(prompt, settings.model, settings.groqApiKey)
  return callGemini(prompt, settings.model, settings.apiKey, 1000)
}

// ─────────────────────────────────────────────
// Provider implementations
// ─────────────────────────────────────────────

async function callGemini(prompt, model, apiKey, maxTokens = 600) {
  const modelName = model || 'gemini-2.0-flash'
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: maxTokens },
    }),
  })

  const data = await response.json()
  if (!response.ok) throw new Error(data.error?.message || 'Gemini request failed')
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!content) throw new Error('Empty response from Gemini')
  return content
}

async function callGroq(prompt, model, apiKey) {
  if (!apiKey) throw new Error('Add your free Groq API key in ⚙️ Settings → Groq')
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1024,
    }),
  })

  const data = await response.json()
  if (!response.ok) throw new Error(data.error?.message || 'Groq request failed')
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('Empty response from Groq')
  return content
}

async function callOllama(prompt, model) {
  const response = await fetch('http://localhost:11434/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model || 'llama3.2',
      messages: [{ role: 'user', content: prompt }],
      stream: false,
      options: { num_ctx: 32768 }, // extended context for full paper
    }),
  })

  if (!response.ok) throw new Error('Ollama not running — start it with: ollama serve')
  const data = await response.json()
  return data.message.content
}

// ─────────────────────────────────────────────
// Ollama model management
// ─────────────────────────────────────────────

/**
 * Pull (install) an Ollama model with streaming progress.
 * Calls onProgress({ status, percent }) for each chunk.
 */
export async function pullOllamaModel(modelName, onProgress) {
  const response = await fetch('http://localhost:11434/api/pull', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: modelName, stream: true }),
  })

  if (!response.ok) {
    throw new Error('Ollama not running — start it with: ollama serve')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value, { stream: true })
    for (const line of chunk.split('\n')) {
      if (!line.trim()) continue
      try {
        const json = JSON.parse(line)
        const percent =
          json.completed && json.total
            ? Math.round((json.completed / json.total) * 100)
            : null
        onProgress({ status: json.status || '', percent })
        if (json.status === 'success') return
      } catch {
        // ignore malformed lines
      }
    }
  }
}
