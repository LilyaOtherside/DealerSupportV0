'use client';

import React, { useState } from "react";
import { Archive, Plus, Settings } from "lucide-react";

export const BottomNav = () => {
  const [activeIcon, setActiveIcon] = useState("plus");
  
  return (
    <nav className="bottom-nav">
      <button
        onClick={() => setActiveIcon("archive")}
        className={`nav-button ${activeIcon === "archive" ? "active" : ""}`}
      >
        <Archive
          size={22}
          className={`transform transition-all duration-500 ${
            activeIcon === "archive" ? "rotate-12" : "hover:rotate-12"
          }`}
        />
      </button>
      <button
        onClick={() => setActiveIcon("plus")}
        className={`nav-button ${activeIcon === "plus" ? "active" : ""}`}
      >
        <Plus
          size={26}
          className={`transform transition-all duration-500 ${
            activeIcon === "plus" ? "rotate-180" : "hover:rotate-180"
          }`}
        />
      </button>
      <button
        onClick={() => setActiveIcon("settings")}
        className={`nav-button ${activeIcon === "settings" ? "active" : ""}`}
      >
        <Settings
          size={22}
          className={`transform transition-all duration-500 ${
            activeIcon === "settings" ? "rotate-45" : "hover:rotate-45"
          }`}
        />
      </button>
    </nav>
  );
}; 