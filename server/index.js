import 'dotenv/config'
import express from 'express'
import { randomUUID } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import nodemailer from 'nodemailer'
import mysql from 'mysql2/promise'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDirectory = path.join(__dirname, '..', 'data')
const messagesFile = path.join(dataDirectory, 'messages.json')
const port = process.env.PORT || 3001
const recipientEmail = process.env.CONTACT_EMAIL || 'baroutyoussef@gmail.com'
const app = express()
const smtpConfigured = Boolean(
  process.env.SMTP_HOST &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS &&
  !process.env.SMTP_USER.startsWith('your-') &&
  !process.env.SMTP_PASS.startsWith('your-'),
)
const database = process.env.MYSQL_HOST
  ? mysql.createPool({
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE || 'portfolio',
    waitForConnections: true,
    connectionLimit: 10,
  })
  : null
const mailTransport = smtpConfigured
  ? nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: process.env.SMTP_SECURE !== 'false',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })
  : null

app.use(express.json({ limit: '10kb' }))

async function readMessages() {
  try {
    return JSON.parse(await readFile(messagesFile, 'utf8'))
  } catch (error) {
    if (error.code === 'ENOENT') return []
    throw error
  }
}

app.post('/api/messages', async (request, response) => {
  const { name, email, message } = request.body

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return response.status(400).json({ error: 'Name, email and message are required.' })
  }

  try {
    const newMessage = {
      id: randomUUID(),
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
      createdAt: new Date().toISOString(),
    }

    if (database) {
      await database.execute(
        'INSERT INTO messages (id, name, email, message, created_at) VALUES (?, ?, ?, ?, ?)',
        [newMessage.id, newMessage.name, newMessage.email, newMessage.message, newMessage.createdAt],
      )
    } else {
      await mkdir(dataDirectory, { recursive: true })
      const messages = await readMessages()
      messages.push(newMessage)
      await writeFile(messagesFile, JSON.stringify(messages, null, 2))
    }

    if (!mailTransport) {
      console.warn('SMTP is not configured. Message saved without sending email.')
      return response.status(201).json({ message: 'Message saved. Configure SMTP to send email.', emailSent: false })
    }

    await mailTransport.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: recipientEmail,
      replyTo: newMessage.email,
      subject: `New portfolio message from ${newMessage.name}`,
      text: `Name: ${newMessage.name}\nEmail: ${newMessage.email}\n\n${newMessage.message}`,
    })
    return response.status(201).json({ message: 'Message saved.' })
  } catch (error) {
    console.error(error)
    return response.status(500).json({ error: 'Message saved, but email could not be sent. Check SMTP settings.' })
  }
})

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok', storage: database ? 'mysql' : 'json', email: smtpConfigured ? 'configured' : 'not-configured' })
})

app.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`)
})
