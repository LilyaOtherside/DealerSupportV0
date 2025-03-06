-- Створення таблиці повідомлень
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  sender_photo TEXT,
  sender_role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_read BOOLEAN DEFAULT FALSE NOT NULL,
  attachments JSONB
);

-- Індекси для швидкого пошуку
CREATE INDEX IF NOT EXISTS idx_messages_request_id ON public.messages(request_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON public.messages(is_read);

-- Політики безпеки
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Дозволяємо читати повідомлення, якщо користувач є автором запиту або адміністратором
CREATE POLICY "Users can read messages for their requests" 
  ON public.messages FOR SELECT 
  USING (
    user_id = auth.uid() OR 
    request_id IN (
      SELECT id FROM public.requests WHERE user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND (role = 'admin' OR role = 'superadmin')
    )
  );

-- Дозволяємо створювати повідомлення, якщо користувач є автором запиту або адміністратором
CREATE POLICY "Users can create messages for their requests" 
  ON public.messages FOR INSERT 
  WITH CHECK (
    user_id = auth.uid() AND (
      request_id IN (
        SELECT id FROM public.requests WHERE user_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND (role = 'admin' OR role = 'superadmin')
      )
    )
  );

-- Дозволяємо оновлювати повідомлення, якщо користувач є автором повідомлення або адміністратором
CREATE POLICY "Users can update their own messages" 
  ON public.messages FOR UPDATE 
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND (role = 'admin' OR role = 'superadmin')
    )
  ); 