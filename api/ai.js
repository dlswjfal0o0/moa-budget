import { GoogleGenerativeAI } from '@google/generative-ai'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  if (!process.env.GEMINI_API_KEY) {
    return res.status(200).json({ content: [{ text: 'GEMINI_API_KEY가 설정되지 않았어요.' }] })
  }

  const { messages, system } = req.body || {}
  const prompt = [system, messages?.[0]?.content].filter(Boolean).join('\n\n')

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: { maxOutputTokens: 1024, temperature: 0.7 }
    })
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    res.status(200).json({ content: [{ text }] })
  } catch (err) {
    console.error('Gemini error:', err.message)
    res.status(200).json({ content: [{ text: `오류가 발생했어요: ${err.message}` }] })
  }
}