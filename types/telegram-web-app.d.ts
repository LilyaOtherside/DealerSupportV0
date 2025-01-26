interface TelegramWebApp {
  expand: () => void;
  close: () => void;
  ready: () => void;
  initData: string;
  initDataUnsafe: {
    user?: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      photo_url?: string;
    };
  };
}

interface Window {
  Telegram: {
    WebApp: TelegramWebApp;
  };
} 