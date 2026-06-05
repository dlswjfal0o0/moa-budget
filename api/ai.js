export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const key = process.env.GEMINI_API_KEY
  if (!key) {
    return res.status(200).json({ content: [{ text: 'GEMINI_API_KEY가 없어요.' }] })
  }

  const { messages, system } = req.body || {}
  const prompt = [system, messages?.[0]?.content].filter(Boolean).join('\n\n')

  // 여러 모델 순서대로 시도
  const models = [
    'gemini-pro',    
    'gemini-1.5-flash-latest',
    'gemini-1.5-flash-8b',
    'gemini-1.5-pro-latest'
  ]

  for (const modelName of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${key}`
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
        })
      })

      const data = await response.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text

      if (text) {
        console.log(`Success with model: ${modelName}`)
        return res.status(200).json({ content: [{ text }] })
      }

      // 실패 이유 로그
      console.log(`Model ${modelName} failed:`, JSON.stringify(data).slice(0, 200))
    } catch (err) {
      console.log(`Model ${modelName} error:`, err.message)
    }
  }

  res.status(200).json({ content: [{ text: '모든 모델 시도 실패. Vercel 로그를 확인해주세요.' }] })
}