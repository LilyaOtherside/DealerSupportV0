'use client';

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from 'next/navigation';
import { Archive, Plus, MessageCircle, Home } from "lucide-react";
import { supabase } from '@/lib/supabase';
import { useUser } from '@/lib/contexts/UserContext';

interface BottomNavProps {
  onArchiveClick: () => void;
  isArchiveActive: boolean;
}

export const BottomNav = ({ onArchiveClick, isArchiveActive }: BottomNavProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUser();
  const [unreadCount, setUnreadCount] = useState(0);

  // Визначаємо активну іконку на основі поточного шляху
  const getActiveIcon = () => {
    if (pathname.includes('/requests/new')) return 'plus';
    if (pathname.includes('/chat')) return 'chat';
    return 'home';
  };

  const [activeIcon, setActiveIcon] = useState(getActiveIcon());

  // Оновлюємо активну іконку при зміні шляху
  useEffect(() => {
    setActiveIcon(getActiveIcon());
  }, [pathname]);

  // Отримуємо кількість непрочитаних повідомлень
  useEffect(() => {
    if (!user) return;
    
    const fetchUnreadCount = async () => {
      try {
        const { count, error } = await supabase
          .from('messages')
          .select('*', { count: 'exact' })
          .eq('is_read', false)
          .not('user_id', 'eq', user.id);
        
        if (error) throw error;
        setUnreadCount(count || 0);
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };
    
    fetchUnreadCount();
    
    // Підписуємося на нові повідомлення
    const subscription = supabase
      .channel('messages_count')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages'
      }, (payload) => {
        if (payload.new.user_id !== user.id) {
          setUnreadCount(prev => prev + 1);
        }
      })
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'messages',
        filter: 'is_read=eq.true'
      }, () => {
        fetchUnreadCount();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user]);

  const handleHomeClick = () => {
    setActiveIcon("home");
    if (isArchiveActive) {
      onArchiveClick();
    }
    router.push('/requests');
  };

  const handlePlusClick = () => {
    setActiveIcon("plus");
    router.push('/requests/new');
  };

  const handleArchiveClick = () => {
    setActiveIcon("archive");
    onArchiveClick();
  };

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center bg-black/80 backdrop-blur-lg rounded-full px-4 py-3 gap-8 z-50">
      <button
        onClick={handleArchiveClick}
        className={`relative transition-all duration-500 ease-in-out rounded-2xl p-2 hover:scale-110 active:scale-95 ${
          isArchiveActive
            ? "text-white bg-gray-800/50 scale-110 px-4" 
            : "text-gray-400 hover:text-white hover:bg-gray-800/50"
        }`}
      >
        <Archive
          size={22}
          className={`transform transition-all duration-500 ${
            activeIcon === "archive" ? "rotate-12" : "hover:rotate-12"
          }`}
        />
      </button>
      <button
        onClick={handleHomeClick}
        className={`relative transition-all duration-500 ease-in-out rounded-2xl p-2 hover:scale-110 active:scale-95 ${
          activeIcon === "home" 
            ? "text-white bg-gray-800/50 scale-110 px-4" 
            : "text-gray-400 hover:text-white hover:bg-gray-800/50"
        }`}
      >
        <Home
          size={22}
          className={`transform transition-all duration-500 ${
            activeIcon === "home" ? "rotate-12" : "hover:rotate-12"
          }`}
        />
      </button>
      <button
        onClick={handlePlusClick}
        className={`relative transition-all duration-500 ease-in-out rounded-2xl p-2 hover:scale-110 active:scale-95 ${
          activeIcon === "plus" 
            ? "text-white bg-gray-800/50 scale-110 px-4" 
            : "text-gray-400 hover:text-white hover:bg-gray-800/50"
        }`}
      >
        <Plus
          size={26}
          className={`transform transition-all duration-500 ${
            activeIcon === "plus" ? "rotate-180" : "hover:rotate-180"
          }`}
        />
      </button>
      <button
        onClick={() => {
          router.push('/chat');
          setActiveIcon("chat");
        }}
        className={`relative transition-all duration-500 ease-in-out rounded-2xl p-2 hover:scale-110 active:scale-95 ${
          activeIcon === "chat" 
            ? "text-white bg-gray-800/50 scale-110 px-4" 
            : "text-gray-400 hover:text-white hover:bg-gray-800/50"
        }`}
      >
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        <MessageCircle
          size={22}
          className={`transform transition-all duration-500 ${
            activeIcon === "chat" ? "rotate-12" : "hover:rotate-12"
          }`}
        />
      </button>
    </nav>
  );
}; 