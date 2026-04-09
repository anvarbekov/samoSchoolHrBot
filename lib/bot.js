// lib/bot.js
import { adminDb } from './firebase-admin.js'
import { uploadFromUrl } from './cloudinary.js'
import { appendToSheet } from './google-sheets.js'
import axios from 'axios'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`

export const STEPS = {
  FULL_NAME: 'full_name',
  SPECIALTY: 'specialty',
  SPECIALTY_CUSTOM: 'specialty_custom',
  CV: 'cv',
  PHONE: 'phone',
}

const SPECIALTY_OPTIONS = [
  "👩‍🏫 O'qituvchi",
  "🧠 Psixolog",
  "🔧 Tex. Xodim",
  "🏢 Administratsiya xodimi",
  "📝 Boshqa",
]

export async function sendMessage(chatId, text, options = {}) {
  try {
    const res = await axios.post(`${API_URL}/sendMessage`, {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      ...options,
    })
    return res.data
  } catch (e) {
    console.error('sendMessage error:', e?.response?.data)
  }
}

export async function getFileUrl(fileId) {
  try {
    const res = await axios.get(`${API_URL}/getFile?file_id=${fileId}`)
    return `https://api.telegram.org/file/bot${BOT_TOKEN}/${res.data.result.file_path}`
  } catch { return null }
}

async function getSession(chatId) {
  const doc = await adminDb.collection('sessions').doc(String(chatId)).get()
  return doc.exists ? doc.data() : null
}

async function setSession(chatId, data) {
  await adminDb.collection('sessions').doc(String(chatId)).set(data, { merge: true })
}

async function clearSession(chatId) {
  await adminDb.collection('sessions').doc(String(chatId)).delete()
}

async function saveCandidate(data) {
  const ref = adminDb.collection('candidates').doc()
  const candidate = { ...data, id: ref.id, status: 'new', createdAt: new Date().toISOString() }
  await ref.set(candidate)
  await appendToSheet(candidate)
  return candidate
}

export async function handleUpdate(update) {
  const message = update.message
  if (!message) return

  const chatId = message.chat.id
  const userId = message.from.id
  const username = message.from.username || ''
  const firstName = message.from.first_name || ''

  const session = await getSession(chatId)

  // ── /start ────────────────────────────────────────────────────
  if (message.text === '/start') {
    await clearSession(chatId)
    await setSession(chatId, { step: STEPS.FULL_NAME, userId, username, data: {} })
    await sendMessage(chatId,
      `👋 <b>Assalomu alaykum, ${firstName}!</b>\n\n` +
      `🏫 <b>Samo School HR Bot</b>ga xush kelibsiz!\n\n` +
      `Maktabimizga ishga ariza topshirish uchun quyidagi savollarga javob bering.\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `<b>1-qadam:</b> Ism va Familiyangizni kiriting:\n` +
      `<i>Masalan: Abdullayev Jasur</i>`,
      { reply_markup: { remove_keyboard: true } }
    )
    return
  }

  if (message.text === '/cancel') {
    await clearSession(chatId)
    await sendMessage(chatId, `❌ Ariza bekor qilindi.\n\n/start — qaytadan boshlash`)
    return
  }

  if (!session) {
    await sendMessage(chatId, `👋 Ariza topshirish uchun /start yuboring.`)
    return
  }

  const { step, data } = session

  // ── STEP 1: Ism Familiya ──────────────────────────────────────
  if (step === STEPS.FULL_NAME) {
    if (!message.text || message.text.length < 3) {
      await sendMessage(chatId, `⚠️ Iltimos, to'liq ism va familiyangizni kiriting.`)
      return
    }
    await setSession(chatId, { step: STEPS.SPECIALTY, data: { ...data, fullName: message.text.trim() } })
    await sendMessage(chatId,
      `✅ <b>${message.text.trim()}</b>\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `<b>2-qadam:</b> Mutaxassisligingizni tanlang:`,
      {
        reply_markup: {
          keyboard: SPECIALTY_OPTIONS.map(s => [{ text: s }]),
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      }
    )
    return
  }

  // ── STEP 2: Mutaxassislik ─────────────────────────────────────
  if (step === STEPS.SPECIALTY) {
    if (!message.text) {
      await sendMessage(chatId, `⚠️ Iltimos, tugmalardan birini tanlang.`)
      return
    }

    // "Boshqa" tanlasa — qo'lda yozishga o'tkazadi
    if (message.text.trim() === '📝 Boshqa') {
      await setSession(chatId, { step: STEPS.SPECIALTY_CUSTOM, data })
      await sendMessage(chatId,
        `✏️ Mutaxassisligingizni yozing:`,
        { reply_markup: { remove_keyboard: true } }
      )
      return
    }

    const specialty = message.text.trim()
    await setSession(chatId, { step: STEPS.CV, data: { ...data, specialty } })
    await sendMessage(chatId,
      `✅ <b>${specialty}</b>\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `<b>3-qadam:</b> CV yoki rezyumengizni yuboring:\n\n` +
      `<i>PDF, Word yoki rasm formatida</i>`,
      {
        reply_markup: {
          keyboard: [[{ text: "⏭️ CV yo'q, o'tkazib yuborish" }]],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      }
    )
    return
  }

  // ── STEP 2b: Boshqa mutaxassislik (qo'lda) ───────────────────
  if (step === STEPS.SPECIALTY_CUSTOM) {
    if (!message.text || message.text.length < 2) {
      await sendMessage(chatId, `⚠️ Iltimos, mutaxassisligingizni yozing.`)
      return
    }
    const specialty = message.text.trim()
    await setSession(chatId, { step: STEPS.CV, data: { ...data, specialty } })
    await sendMessage(chatId,
      `✅ <b>${specialty}</b>\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `<b>3-qadam:</b> CV yoki rezyumengizni yuboring:\n\n` +
      `<i>PDF, Word yoki rasm formatida</i>`,
      {
        reply_markup: {
          keyboard: [[{ text: "⏭️ CV yo'q, o'tkazib yuborish" }]],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      }
    )
    return
  }

  // ── STEP 3: CV ────────────────────────────────────────────────
  if (step === STEPS.CV) {
    let cvUrl = null

    if (message.text !== "⏭️ CV yo'q, o'tkazib yuborish") {
      let fileId = null
      let resourceType = 'raw'

      if (message.document) {
        fileId = message.document.file_id
        if (message.document.mime_type?.startsWith('image/')) resourceType = 'image'
      } else if (message.photo) {
        fileId = message.photo[message.photo.length - 1].file_id
        resourceType = 'image'
      }

      if (!fileId) {
        await sendMessage(chatId,
          `⚠️ Iltimos, fayl yuboring yoki o'tkazib yuborish tugmasini bosing.`,
          {
            reply_markup: {
              keyboard: [[{ text: "⏭️ CV yo'q, o'tkazib yuborish" }]],
              resize_keyboard: true,
              one_time_keyboard: true,
            },
          }
        )
        return
      }

      const fileUrl = await getFileUrl(fileId)
      if (fileUrl) {
        try {
          const result = await uploadFromUrl(fileUrl, {
            folder: 'hr-candidates/cvs',
            resource_type: resourceType,
          })
          cvUrl = result.secure_url
        } catch (e) {
          console.error('CV upload error:', e)
        }
      }
    }

    await setSession(chatId, { step: STEPS.PHONE, data: { ...data, cvUrl } })
    await sendMessage(chatId,
      `${cvUrl ? '✅ CV yuklandi!\n\n' : "⏭️ CV o'tkazib yuborildi.\n\n"}` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `<b>4-qadam (so'nggi):</b> Telefon raqamingizni yuboring:`,
      {
        reply_markup: {
          keyboard: [[{ text: '📱 Raqamni avtomatik yuborish', request_contact: true }]],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      }
    )
    return
  }

  // ── STEP 4: Telefon ───────────────────────────────────────────
  if (step === STEPS.PHONE) {
    let phone = null

    if (message.contact) {
      phone = message.contact.phone_number
    } else if (message.text) {
      phone = message.text.trim()
    }

    if (!phone || phone.replace(/\D/g, '').length < 9) {
      await sendMessage(chatId,
        `⚠️ Iltimos, to'g'ri telefon raqam kiriting yoki tugmani bosing.`,
        {
          reply_markup: {
            keyboard: [[{ text: '📱 Raqamni avtomatik yuborish', request_contact: true }]],
            resize_keyboard: true,
            one_time_keyboard: true,
          },
        }
      )
      return
    }

    const finalData = {
      ...data,
      phone,
      userId: String(userId),
      username,
      firstName,
    }

    const candidate = await saveCandidate(finalData)
    await clearSession(chatId)

    await sendMessage(chatId,
      `🎉 <b>Arizangiz qabul qilindi!</b>\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `👤 <b>Ism:</b> ${finalData.fullName}\n` +
      `🎯 <b>Mutaxassislik:</b> ${finalData.specialty}\n` +
      `📄 <b>CV:</b> ${finalData.cvUrl ? '✅ Yuklandi' : '❌ Yuklanmadi'}\n` +
      `📱 <b>Telefon:</b> ${phone}\n` +
      `🔗 <b>Telegram:</b> ${username ? '@' + username : '—'}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🆔 <b>Ariza ID:</b> <code>${candidate.id.slice(0, 8).toUpperCase()}</code>\n\n` +
      `⏳ Tez orada maktabimiz HR bo'limi siz bilan bog'lanadi!`,
      { reply_markup: { remove_keyboard: true } }
    )

    await notifyAdmins(finalData, candidate.id)
    return
  }
}

async function notifyAdmins(data, candidateId) {
  const adminChatIds = process.env.ADMIN_CHAT_IDS?.split(',') || []
  const msg =
    `🔔 <b>YANGI ARIZA!</b>\n\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `👤 <b>${data.fullName}</b>\n` +
    `🎯 ${data.specialty}\n` +
    `📱 ${data.phone}\n` +
    `🔗 ${data.username ? '@' + data.username : "username yo'q"}\n` +
    `📄 CV: ${data.cvUrl ? '✅ Bor' : '❌ Yo\'q'}\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `🆔 <code>${candidateId.slice(0, 8).toUpperCase()}</code>\n` +
    `${data.cvUrl ? `\n📎 <a href="${data.cvUrl}">CV ni ko'rish</a>` : ''}`

  for (const adminId of adminChatIds) {
    await sendMessage(adminId.trim(), msg)
  }
}
