# 🏢 HR Recruitment Telegram Bot

Ishga qabul qilish uchun to'liq Telegram bot va Admin panel tizimi.

## 🚀 Texnologiyalar

| Texnologiya | Maqsad | Free tier |
|---|---|---|
| **Next.js 14** | Frontend + Backend API | ✅ |
| **Tailwind CSS + DaisyUI** | UI dizayn | ✅ |
| **Firebase Firestore** | Ma'lumotlar bazasi | ✅ 1GB |
| **Cloudinary** | Rasm + PDF saqlash | ✅ 25GB |
| **Vercel** | Deploy | ✅ |
| **Google Sheets** | Export (ixtiyoriy) | ✅ |

---

## 📋 Bot funksiyalari

Nomzoddan quyidagi ma'lumotlar olinadi:
1. ✅ Ism va Familiya
2. ✅ Mutaxassislik
3. ✅ Ish staji (tugmalar orqali)
4. ✅ Hozirgi ish joyi
5. ✅ Istalgan lavozim (kategoriyalar bilan)
6. ✅ Viloyat / Tuman
7. ✅ Shaxsiy rasm (Cloudinary ga yuklanadi)
8. ✅ CV / Rezyume fayl (PDF, Word, rasm)

---

## ⚡ Tezkor o'rnatish

### 1. Telegram Bot yaratish

1. [@BotFather](https://t.me/BotFather) ga boring
2. `/newbot` yuboring
3. Bot nomi va username bering
4. Token olasiz → `.env` ga saqlang

### 2. Firebase o'rnatish

1. [console.firebase.google.com](https://console.firebase.google.com) ga kiring
2. Yangi proekt yarating
3. **Firestore Database** → "Create database" → "Start in test mode"
4. **Project Settings** → **Service accounts** → "Generate new private key"
5. JSON fayldagi ma'lumotlarni `.env` ga kiriting

### 3. Cloudinary o'rnatish

1. [cloudinary.com](https://cloudinary.com) ga kiring (bepul ro'yxatdan o'ting)
2. Dashboard → API Keys
3. Cloud name, API key, API secret olasiz

### 4. Google Sheets (ixtiyoriy)

1. [console.cloud.google.com](https://console.cloud.google.com) ga kiring
2. Yangi proekt → APIs → Google Sheets API ni yoqing
3. **IAM & Admin** → **Service Accounts** → yangi sa yarating
4. JSON key yarating
5. Google Sheet yarating, service account emailini Editor sifatida qo'shing
6. Sheet ID URL dan oling: `docs.google.com/spreadsheets/d/`**`SHEET_ID`**`/edit`

### 5. .env faylini to'ldiring

```bash
cp .env.example .env.local
```

Barcha o'zgaruvchilarni to'ldiring (`.env.example` ga qarang).

### 6. Vercel ga deploy

```bash
# Vercel CLI o'rnatish
npm i -g vercel

# Deploy
vercel

# Environment variables qo'shish
vercel env add TELEGRAM_BOT_TOKEN
# ... (barcha o'zgaruvchilar uchun)
```

Yoki **Vercel Dashboard** orqali:
1. GitHub repo ulang
2. Environment Variables bo'limiga `.env.example` dagi barcha o'zgaruvchilarni qo'shing
3. Deploy!

### 7. Webhook o'rnatish

Deploy tugagach:
1. Admin panelga kiring: `https://your-app.vercel.app/login`
2. **Sozlamalar** sahifasiga boring
3. App URL ni kiriting va **"O'rnatish"** tugmasini bosing

---

## 🖥️ Admin panel

**URL:** `https://your-app.vercel.app/admin`

**Login:** `.env` dagi `ADMIN_USERNAME` va `ADMIN_PASSWORD`

### Sahifalar:
- 📊 **Dashboard** — statistika, grafiklar, so'nggi arizalar
- 👥 **Nomzodlar** — qidiruv, filter, status yangilash, CV ko'rish
- ⚙️ **Sozlamalar** — webhook, Google Sheets sync

---

## 📁 Loyiha tuzilmasi

```
hr-recruitment-bot/
├── app/
│   ├── api/
│   │   ├── webhook/       # Telegram webhook
│   │   ├── candidates/    # CRUD API
│   │   ├── auth/login/    # Admin auth
│   │   ├── setup-webhook/ # Webhook sozlash
│   │   └── sync-sheets/   # Google Sheets sync
│   ├── admin/
│   │   ├── page.jsx       # Dashboard
│   │   ├── candidates/    # Nomzodlar ro'yxati
│   │   ├── settings/      # Sozlamalar
│   │   └── layout.jsx     # Sidebar layout
│   ├── login/             # Login sahifasi
│   └── globals.css
├── lib/
│   ├── bot.js             # Bot mantiq
│   ├── firebase.js        # Client Firebase
│   ├── firebase-admin.js  # Server Firebase
│   ├── cloudinary.js      # Fayl yuklash
│   └── google-sheets.js   # Sheets integratsiya
├── middleware.js           # Auth middleware
├── tailwind.config.js
└── .env.example
```

---

## 🔒 Xavfsizlik

- Admin panel cookie-based auth bilan himoyalangan
- Webhook secret token bilan himoyalangan
- Firebase Firestore qoidalari (production da sozlang)

---

## 💡 Qo'shimcha sozlamalar

### Admin Telegram bildirishnomasi

`.env` ga qo'shing:
```
ADMIN_CHAT_IDS=123456789,987654321
```

Har yangi ariza kelganda siz Telegram orqali xabar olasiz.

### Firebase Firestore xavfsizlik qoidalari

Firebase Console → Firestore → Rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /candidates/{id} {
      allow read, write: if false; // Faqat server-side
    }
    match /sessions/{id} {
      allow read, write: if false;
    }
  }
}
```

---

## 🆓 Free tier limitlari

| Xizmat | Free limit |
|---|---|
| Firebase Firestore | 1GB saqlash, 50K o'qish/kun |
| Cloudinary | 25GB saqlash, 25GB bandwidth/oy |
| Vercel | Cheksiz deploy, 100GB bandwidth/oy |
| Google Sheets | Cheksiz |

---

**Muallif:** HR Recruitment Bot System
**Versiya:** 1.0.0
