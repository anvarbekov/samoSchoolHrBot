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
      candidate.phone || '',
      candidate.username ? '@' + candidate.username : '',
      candidate.cvUrl || '',
      candidate.userId || '',
    ]]
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: 'Sheet1!A:G',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    })
  } catch (e) {
    console.error('Google Sheets error:', e)
  }
}

export async function initSheet() {
  try {
    const auth = getAuth()
    const sheets = google.sheets({ version: 'v4', auth })
    const headers = [[
      'Sana', 'Ism Familiya', 'Mutaxassislik',
      'Telefon', 'Telegram', 'CV', 'Telegram ID'
    ]]
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: 'Sheet1!A1:G1',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: headers },
    })
    return true
  } catch (e) {
    console.error('Init sheet error:', e)
    return false
  }
}
