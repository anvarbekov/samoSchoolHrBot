// lib/google-sheets.js
import { google } from 'googleapis'

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets']

function getAuth() {
  return new google.auth.JWT(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    null,
    process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    SCOPES
  )
}

export async function appendToSheet(candidate) {
  try {
    if (!process.env.GOOGLE_SHEETS_ID) return null
    
    const auth = getAuth()
    const sheets = google.sheets({ version: 'v4', auth })

    const values = [[
      new Date().toLocaleString('uz-UZ'),
      candidate.fullName || '',
      candidate.specialty || '',
      candidate.experience || '',
      candidate.currentWork || '',
      candidate.targetPosition || '',
      candidate.region || '',
      candidate.photoUrl || '',
      candidate.cvUrl || '',
      `https://t.me/${candidate.username || ''}`,
      candidate.telegramId || '',
    ]]

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: 'Sheet1!A:K',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    })

    return response.data
  } catch (error) {
    console.error('Google Sheets error:', error)
    return null
  }
}

export async function initSheet() {
  try {
    const auth = getAuth()
    const sheets = google.sheets({ version: 'v4', auth })

    const headers = [[
      'Sana', 'Ism Familiya', 'Mutaxassislik', 'Ish Staji',
      'Hozirgi Ish Joyi', 'Istalgan Lavozim', 'Hudud',
      'Rasm', 'CV', 'Telegram', 'Telegram ID'
    ]]

    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: 'Sheet1!A1:K1',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: headers },
    })

    return true
  } catch (error) {
    console.error('Init sheet error:', error)
    return false
  }
}
