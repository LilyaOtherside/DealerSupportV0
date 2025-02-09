import React from "react";

interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className = "" }: TabsProps) {
  return (
    <div className={`bg-tg-theme-section/50 backdrop-blur-lg rounded-xl p-1 ${className}`}>
      <nav className="flex gap-1 relative">
        <div
          className="absolute h-[calc(100%-2px)] top-[1px] w-[calc(50%-2px)] bg-tg-theme-button/50 backdrop-blur-lg rounded-lg transition-transform duration-300 ease-out"
          style={{
            transform: `translateX(${tabs.findIndex((tab) => tab.id === activeTab) === 0 ? "1px" : "100%"})`,
          }}
        />
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex-1 px-4 py-2 rounded-lg font-medium relative transition-colors duration-300 ${
              activeTab === tab.id ? "text-white" : "text-tg-theme-hint"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
} 