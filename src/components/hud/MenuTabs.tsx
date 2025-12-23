// File: src/components/hud/MenuTabs.tsx
import React from "react";
import "./HUD.css";

const tabs = ["Quests", "Journal", "Map", "Spells", "Items", "Magic"];

const MenuTabs: React.FC = () => {
  return (
    <div className="menu-tabs">
      {tabs.map((tab) => (
        <button key={tab}>{tab}</button>
      ))}
    </div>
  );
};

export default MenuTabs;
