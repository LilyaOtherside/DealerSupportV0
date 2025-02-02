import './globals.css';
import { UserProvider } from '@/lib/contexts/UserContext';
import { ThemeProvider } from '@/lib/contexts/ThemeContext';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: 'no',
}

export const metadata = {
  title: 'Dealer Support',
  description: 'Система підтримки дилерів',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="uk">
      <head>
        <script src="https://telegram.org/js/telegram-web-app.js" />
      </head>
      <body className="bg-tg-theme-bg text-white">
        <UserProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </UserProvider>
      </body>
    </html>
  )
}
