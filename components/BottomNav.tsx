'use client';

import React, { useState } from "react";
import { useRouter } from 'next/navigation';
import { Archive, Plus, MessageCircle, Home } from "lucide-react";

interface BottomNavProps {
  onArchiveClick: () => void;
  isArchiveActive: boolean;
}

export const BottomNav = ({ onArchiveClick, isArchiveActive }: BottomNavProps) => {
  const [activeIcon, setActiveIcon] = useState("plus");
  const router = useRouter();

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
    <nav className="fixed bottom-0 left-0 right-0 flex items-center justify-center bg-tg-theme-bg/95 backdrop-blur-lg px-4 py-3 gap-8 border-t border-tg-theme-button/20 safe-bottom">
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
            isArchiveActive ? "rotate-12" : "hover:rotate-12"
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
        onClick={() => setActiveIcon("chat")}
        className={`relative transition-all duration-500 ease-in-out rounded-2xl p-2 hover:scale-110 active:scale-95 ${
          activeIcon === "chat" 
            ? "text-white bg-gray-800/50 scale-110 px-4" 
            : "text-gray-400 hover:text-white hover:bg-gray-800/50"
        }`}
      >
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