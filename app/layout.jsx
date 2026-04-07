// app/layout.jsx
import { Toaster } from 'react-hot-toast'
import './globals.css'

export const metadata = {
  title: 'HR Recruitment Admin Panel',
  description: 'Ishga qabul qilish boshqaruv tizimi',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="uz" data-theme="hrdark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Unbounded:wght@300;400;500;600;700;800&family=Manrope:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body bg-surface min-h-screen">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#16162a',
              color: '#e2e8f0',
              border: '1px solid #2a2a45',
              fontFamily: 'Manrope, sans-serif',
            },
          }}
        />
      </body>
    </html>
  )
}
