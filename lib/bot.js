// lib/bot.js - Core bot logic
import { adminDb } from './firebase-admin.js'
import { uploadFromUrl } from './cloudinary.js'
import { appendToSheet } from './google-sheets.js'
import axios from 'axios'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`

// Conversation steps
export const STEPS = {
  START: 'start',
  FULL_NAME: 'full_name',
  SPECIALTY: 'specialty',
  EXPERIENCE: 'experience',
  CURRENT_WORK: 'current_work',
  TARGET_POSITION: 'target_position',
  REGION: 'region',
  PHOTO: 'photo',
  CV: 'cv',
  DONE: 'done',
}

// Send message via Telegram API
export async function sendMessage(chatId, text, options = {}) {
  try {
    const response = await axios.post(`${API_URL}/sendMessage`, {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      ...options,
    })
    return response.data
  } catch (error) {
    console.error('Send message error:', error?.response?.data)
  }
}

// Get file URL from Telegram
export async function getFileUrl(fileId) {
  try {
    const res = await axios.get(`${API_URL}/getFile?file_id=${fileId}`)
    const filePath = res.data.result.file_path
    return `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`
  } catch {
    return null
  }
}

// Get or create user session in Firestore
export async function getSession(chatId) {
  const ref = adminDb.collection('sessions').doc(String(chatId))
  const doc = await ref.get()
  return doc.exists ? doc.data() : null
}

export async function setSession(chatId, data) {
  const ref = adminDb.collection('sessions').doc(String(chatId))
  await ref.set(data, { merge: true })
}

export async function clearSession(chatId) {
  const ref = adminDb.collection('sessions').doc(String(chatId))
  await ref.delete()
}

// Save candidate to Firestore
export async function saveCandidate(data) {
  const ref = adminDb.collection('candidates').doc()
  const candidate = {
    ...data,
    id: ref.id,
    status: 'new',
    createdAt: new Date().toISOString(),
  }
  await ref.set(candidate)

  // Also sync to Google Sheets
  await appendToSheet(candidate)

  return candidate
}

// Main message handler
export async function handleUpdate(update) {
  const message = update.message
  if (!message) return

  const chatId = message.chat.id
  const userId = message.from.id
  const username = message.from.username || ''
  const firstName = message.from.first_name || ''

  // Get current session
  let session = await getSession(chatId)

  // Handle /start command
  if (message.text === '/start') {
    await clearSession(chatId)
    await setSession(chatId, {
      step: STEPS.FULL_NAME,
      userId,
      username,
      data: {},
    })

    await sendMessage(
      chatId,
      `👋 <b>Assalomu alaykum, ${firstName}!</b>\n\n` +
      `🏢 <b>HR Recruitment Bot</b>ga xush kelibsiz!\n\n` +
      `Ushbu bot orqali siz bizning kompaniyamizga ishga ariza topshirishingiz mumkin.\n\n` +
      `📋 Bir necha savollarga javob bering va biz siz bilan bog'lanamiz!\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `<b>1-qadam:</b> Ism va Familiyangizni kiriting:\n` +
      `<i>Masalan: Abdullayev Jasur</i>`,
      {
        reply_markup: {
          remove_keyboard: true,
        },
      }
    )
    return
  }

  // Handle /cancel command
  if (message.text === '/cancel') {
    await clearSession(chatId)
    await sendMessage(
      chatId,
      `❌ Ariza bekor qilindi.\n\nQaytadan boshlash uchun /start buyrug'ini yuboring.`
    )
    return
  }

  // If no active session
  if (!session) {
    await sendMessage(
      chatId,
      `👋 Salom! Ishga ariza topshirish uchun /start buyrug'ini yuboring.`
    )
    return
  }

  const { step, data } = session

  // ─── STEP: Full Name ─────────────────────────────────────────
  if (step === STEPS.FULL_NAME) {
    if (!message.text || message.text.length < 3) {
      await sendMessage(chatId, `⚠️ Iltimos, to'liq ism va familiyangizni kiriting.\n<i>Masalan: Karimov Bobur</i>`)
      return
    }

    await setSession(chatId, {
      step: STEPS.SPECIALTY,
      data: { ...data, fullName: message.text.trim() },
    })

    await sendMessage(
      chatId,
      `✅ <b>Ism Familiya:</b> ${message.text.trim()}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `<b>2-qadam:</b> Mutaxassisligingizni kiriting:\n` +
      `<i>Masalan: Dasturchi, Buxgalter, Marketing mutaxassisi</i>`
    )
    return
  }

  // ─── STEP: Specialty ─────────────────────────────────────────
  if (step === STEPS.SPECIALTY) {
    if (!message.text || message.text.length < 2) {
      await sendMessage(chatId, `⚠️ Iltimos, mutaxassisligingizni kiriting.`)
      return
    }

    await setSession(chatId, {
      step: STEPS.EXPERIENCE,
      data: { ...data, specialty: message.text.trim() },
    })

    await sendMessage(
      chatId,
      `✅ <b>Mutaxassislik:</b> ${message.text.trim()}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `<b>3-qadam:</b> Ish stajingizni kiriting:`,
      {
        reply_markup: {
          keyboard: [
            [{ text: '🆕 Tajribam yo\'q' }, { text: '📚 1 yilgacha' }],
            [{ text: '⭐ 1-3 yil' }, { text: '🌟 3-5 yil' }],
            [{ text: '💎 5-10 yil' }, { text: '👑 10+ yil' }],
          ],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      }
    )
    return
  }

  // ─── STEP: Experience ─────────────────────────────────────────
  if (step === STEPS.EXPERIENCE) {
    const validExperiences = [
      "🆕 Tajribam yo'q", '📚 1 yilgacha', '⭐ 1-3 yil',
      '🌟 3-5 yil', '💎 5-10 yil', '👑 10+ yil',
    ]

    if (!message.text) {
      await sendMessage(chatId, `⚠️ Iltimos, tugmalardan birini tanlang.`)
      return
    }

    const exp = validExperiences.includes(message.text) ? message.text : message.text.trim()

    await setSession(chatId, {
      step: STEPS.CURRENT_WORK,
      data: { ...data, experience: exp },
    })

    await sendMessage(
      chatId,
      `✅ <b>Ish staji:</b> ${exp}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `<b>4-qadam:</b> Hozirda qayerda ishlayapsiz?\n` +
      `<i>Agar ishlamayotgan bo'lsangiz "Ishsizman" deb yozing</i>`,
      {
        reply_markup: { remove_keyboard: true },
      }
    )
    return
  }

  // ─── STEP: Current Work ────────────────────────────────────────
  if (step === STEPS.CURRENT_WORK) {
    if (!message.text || message.text.length < 2) {
      await sendMessage(chatId, `⚠️ Iltimos, hozirgi ish joyingizni kiriting.`)
      return
    }

    await setSession(chatId, {
      step: STEPS.TARGET_POSITION,
      data: { ...data, currentWork: message.text.trim() },
    })

    await sendMessage(
      chatId,
      `✅ <b>Hozirgi ish joyi:</b> ${message.text.trim()}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `<b>5-qadam:</b> Bizga qaysi yo'nalish bo'yicha ishga kirmoqchisiz?\n` +
      `<i>Masalan: Frontend dasturchi, HR manager, SMM mutaxassisi</i>`,
      {
        reply_markup: {
          keyboard: [
            [{ text: '💻 IT / Dasturlash' }, { text: '📊 Moliya / Buxgalteriya' }],
            [{ text: '📢 Marketing / SMM' }, { text: '🤝 HR / Kadrlar' }],
            [{ text: '🎨 Dizayn / Kreativ' }, { text: '📦 Logistika / Omborxona' }],
            [{ text: '🔧 Muhandislik / Texnika' }, { text: '📝 Boshqa yo\'nalish' }],
          ],
          resize_keyboard: true,
          one_time_keyboard: false,
        },
      }
    )
    return
  }

  // ─── STEP: Target Position ────────────────────────────────────
  if (step === STEPS.TARGET_POSITION) {
    if (!message.text || message.text.length < 2) {
      await sendMessage(chatId, `⚠️ Iltimos, istalgan yo'nalishingizni kiriting.`)
      return
    }

    await setSession(chatId, {
      step: STEPS.REGION,
      data: { ...data, targetPosition: message.text.trim() },
    })

    await sendMessage(
      chatId,
      `✅ <b>Istalgan yo'nalish:</b> ${message.text.trim()}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `<b>6-qadam:</b> Qaysi viloyat va tuman/shahardan ekansiz?\n` +
      `<i>Masalan: Toshkent shahri, Yunusobod tumani</i>`,
      {
        reply_markup: {
          keyboard: [
            [{ text: '🏙️ Toshkent shahri' }, { text: '🌆 Toshkent viloyati' }],
            [{ text: '🌿 Samarqand viloyati' }, { text: '🏔️ Farg\'ona viloyati' }],
            [{ text: '🌊 Andijon viloyati' }, { text: '🌾 Namangan viloyati' }],
            [{ text: '🏛️ Buxoro viloyati' }, { text: '🌅 Qashqadaryo viloyati' }],
            [{ text: '🌄 Surxondaryo viloyati' }, { text: '💧 Xorazm viloyati' }],
            [{ text: '🏜️ Navoiy viloyati' }, { text: '🌸 Jizzax viloyati' }],
            [{ text: '🌻 Sirdaryo viloyati' }, { text: '🏝️ Qoraqalpog\'iston' }],
          ],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      }
    )
    return
  }

  // ─── STEP: Region ─────────────────────────────────────────────
  if (step === STEPS.REGION) {
    if (!message.text || message.text.length < 3) {
      await sendMessage(chatId, `⚠️ Iltimos, viloyat va tuman/shahringizni kiriting.`)
      return
    }

    await setSession(chatId, {
      step: STEPS.PHOTO,
      data: { ...data, region: message.text.trim() },
    })

    await sendMessage(
      chatId,
      `✅ <b>Hudud:</b> ${message.text.trim()}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📸 <b>7-qadam:</b> O'z rasmingizni yuboring:\n\n` +
      `<i>⚠️ Iltimos, rasmiy va aniq rasm yuboring (passport yoki biznes rasmingiz)</i>`,
      {
        reply_markup: { remove_keyboard: true },
      }
    )
    return
  }

  // ─── STEP: Photo ──────────────────────────────────────────────
  if (step === STEPS.PHOTO) {
    if (!message.photo && !message.document) {
      await sendMessage(
        chatId,
        `⚠️ Iltimos, rasm yuboring.\n\n` +
        `Yoki o'tkazib yuborish uchun "O'tkazib yuborish" tugmasini bosing.`,
        {
          reply_markup: {
            keyboard: [[{ text: "⏭️ O'tkazib yuborish" }]],
            resize_keyboard: true,
            one_time_keyboard: true,
          },
        }
      )
      return
    }

    let photoUrl = null

    if (message.text === "⏭️ O'tkazib yuborish") {
      // Skip photo
    } else if (message.photo) {
      const photo = message.photo[message.photo.length - 1]
      const fileUrl = await getFileUrl(photo.file_id)
      if (fileUrl) {
        try {
          const result = await uploadFromUrl(fileUrl, {
            folder: 'hr-candidates/photos',
            transformation: [{ width: 800, height: 800, crop: 'fill' }],
          })
          photoUrl = result.secure_url
        } catch (e) {
          console.error('Photo upload error:', e)
        }
      }
    }

    await setSession(chatId, {
      step: STEPS.CV,
      data: { ...data, photoUrl },
    })

    await sendMessage(
      chatId,
      `${photoUrl ? '✅ Rasm muvaffaqiyatli yuklandi!\n\n' : '⏭️ Rasm o\'tkazib yuborildi.\n\n'}` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📄 <b>8-qadam (so'nggi):</b> CV yoki rezyumengizni yuboring:\n\n` +
      `<i>PDF, Word yoki rasm formatida yuborishingiz mumkin</i>`,
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

  // ─── STEP: CV ─────────────────────────────────────────────────
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

      if (fileId) {
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
    }

    // All steps complete - save to database
    const finalData = {
      ...data,
      cvUrl,
      userId: String(userId),
      username,
      firstName,
    }

    const candidate = await saveCandidate(finalData)

    await clearSession(chatId)

    // Send confirmation message
    await sendMessage(
      chatId,
      `🎉 <b>Tabriklaymiz! Arizangiz muvaffaqiyatli qabul qilindi!</b>\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📋 <b>Sizning ma'lumotlaringiz:</b>\n\n` +
      `👤 <b>Ism Familiya:</b> ${finalData.fullName}\n` +
      `🎯 <b>Mutaxassislik:</b> ${finalData.specialty}\n` +
      `⏱️ <b>Ish staji:</b> ${finalData.experience}\n` +
      `🏢 <b>Hozirgi ish joyi:</b> ${finalData.currentWork}\n` +
      `💼 <b>Istalgan yo'nalish:</b> ${finalData.targetPosition}\n` +
      `📍 <b>Hudud:</b> ${finalData.region}\n` +
      `🖼️ <b>Rasm:</b> ${finalData.photoUrl ? '✅ Yuklandi' : '❌ Yuklanmadi'}\n` +
      `📄 <b>CV:</b> ${finalData.cvUrl ? '✅ Yuklandi' : '❌ Yuklanmadi'}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🆔 <b>Ariza raqami:</b> <code>${candidate.id.slice(0, 8).toUpperCase()}</code>\n\n` +
      `⏳ Tez orada HR mutaxassislarimiz siz bilan bog'lanishadi!\n\n` +
      `Yangi ariza uchun /start buyrug'ini yuboring.`,
      {
        reply_markup: { remove_keyboard: true },
      }
    )

    // Notify admins
    await notifyAdmins(finalData, candidate.id)
    return
  }
}

// Notify admin Telegram channels/users
async function notifyAdmins(data, candidateId) {
  const adminChatIds = process.env.ADMIN_CHAT_IDS?.split(',') || []

  const message =
    `🔔 <b>YANGI ARIZA KELDI!</b>\n\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `👤 <b>${data.fullName}</b>\n` +
    `🎯 ${data.specialty} | ${data.targetPosition}\n` +
    `⏱️ Staj: ${data.experience}\n` +
    `🏢 ${data.currentWork}\n` +
    `📍 ${data.region}\n` +
    `📸 Rasm: ${data.photoUrl ? '✅' : '❌'} | CV: ${data.cvUrl ? '✅' : '❌'}\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `🆔 ID: <code>${candidateId.slice(0, 8).toUpperCase()}</code>\n` +
    `🔗 @${data.username || 'username yo\'q'}`

  for (const adminId of adminChatIds) {
    await sendMessage(adminId.trim(), message)
  }
}
