import { randomUUID } from 'node:crypto'
import nodemailer from 'nodemailer'
import mysql from 'mysql2/promise'

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
    connectionLimit: 3,
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

export async function saveMessage({ name, email, message }) {
  const newMessage = {
    id: randomUUID(),
    name: name.trim(),
    email: email.trim(),
    message: message.trim(),
    createdAt: new Date(),
  }

  if (!database) throw new Error('MYSQL_HOST is not configured.')

  await database.execute(
    'INSERT INTO messages (id, name, email, message, created_at) VALUES (?, ?, ?, ?, ?)',
    [newMessage.id, newMessage.name, newMessage.email, newMessage.message, newMessage.createdAt],
  )

  if (mailTransport) {
    await mailTransport.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: process.env.CONTACT_EMAIL || 'baroutyoussef@gmail.com',
      replyTo: newMessage.email,
      subject: `New portfolio message from ${newMessage.name}`,
      text: `Name: ${newMessage.name}\nEmail: ${newMessage.email}\n\n${newMessage.message}`,
    })
  }

  return { emailSent: Boolean(mailTransport) }
}

export function getHealth() {
  return {
    status: 'ok',
    storage: database ? 'mysql' : 'not-configured',
    email: smtpConfigured ? 'configured' : 'not-configured',
  }
}
