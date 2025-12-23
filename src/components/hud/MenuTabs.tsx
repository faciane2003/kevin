// File: src/components/hud/MenuTabs.tsx
import React from "react";
import "./HUD.css";
import { useHUD } from "./HUDContext";

const TABS = ["Quests", "Journal", "Map", "Spells", "Items", "Magic"];

const MenuTabs: React.FC = () => {
  const { activeTab, setActiveTab } = useHUD();

  return (
    <div className="menu-tabs" role="tablist" aria-label="Game Menu Tabs">
      {TABS.map((t) => {
        const active = activeTab === t;
        return (
          <button
            key={t}
            role="tab"
            aria-selected={active}
            tabIndex={0}
            className={`menu-tab-button ${active ? "active" : ""}`}
            onClick={() => setActiveTab(active ? null : t)}
          >
            {t}
          </button>
        );
      })}
    </div>
  );
};

export default MenuTabs;
