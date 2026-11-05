import { saveMessage } from './_lib/config.js'

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed.' })
  }

  const { name, email, message } = request.body || {}
  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return response.status(400).json({ error: 'Name, email and message are required.' })
  }

  try {
    const result = await saveMessage({ name, email, message })
    return response.status(201).json({ message: 'Message saved.', ...result })
  } catch (error) {
    console.error(error)
    return response.status(500).json({ error: 'Message could not be saved or sent.' })
  }
}
