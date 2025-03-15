export interface User {
  id: string;
  telegram_id: string;
  name: string;
  photo_url?: string;
  role: 'dealer' | 'admin' | 'superadmin';
  city?: string;
  dealer_center?: string;
  created_at: Date;
}

export interface Request {
  id: string;
  user_id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  media_urls: MediaFile[];
  is_archived: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Message {
  id: string;
  request_id: string;
  user_id: string;
  sender_name: string;
  sender_photo?: string;
  sender_role: 'dealer' | 'admin' | 'superadmin';
  content: string;
  created_at: Date;
  is_read: boolean;
  attachments?: MediaFile[];
}

export interface Chat {
  request_id: string;
  request_title: string;
  last_message: string;
  last_message_time: Date;
  unread_count: number;
  participants: string[];
}

export interface MediaFile {
  url: string;
  type: 'image' | 'video' | 'document';
  name?: string;
  icon?: string;
  originalName?: string;
}