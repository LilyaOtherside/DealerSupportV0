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
  priority: 'low' | 'medium' | 'high';
  status: 'new' | 'in_progress' | 'resolved' | 'closed';
  media_urls: string[];
  assigned_admin_id?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Message {
  id: string;
  request_id: string;
  user_id: string;
  content: string;
  created_at: Date;
}