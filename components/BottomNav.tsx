'use client';

import React, { useState } from "react";
import { useRouter } from 'next/navigation';
import { Archive, Plus, MessageCircle } from "lucide-react";

export const BottomNav = () => {
  const [activeIcon, setActiveIcon] = useState("plus");
  const router = useRouter();

  const handlePlusClick = () => {
    setActiveIcon("plus");
    router.push('/requests/new');
  };

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center bg-black/80 backdrop-blur-lg rounded-full px-4 py-3 gap-8">
      <button
        onClick={() => setActiveIcon("archive")}
        className={`relative transition-all duration-500 ease-in-out rounded-2xl p-2 hover:scale-110 active:scale-95 ${
          activeIcon === "archive" 
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