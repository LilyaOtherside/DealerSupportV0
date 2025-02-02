import './globals.css';
import { UserProvider } from '@/lib/contexts/UserContext';

export const metadata = {
  title: 'Dealer Support',
  description: 'Система підтримки дилерів',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
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
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body className="bg-tg-theme-bg text-white">
        <UserProvider>
          {children}
        </UserProvider>
      </body>
    </html>
  )
}
