// File: src/components/hud/MenuTabs.tsx
import React from "react";
import "./HUD.css";
import { useHUD } from "./HUDContext";

export const TABS = ["Quests", "Journal", "Map", "Items", "Skills", "Tech"] as const;
export const TAB_COLORS: Record<(typeof TABS)[number], string> = {
  Quests: "gold",
  Journal: "red",
  Map: "blue",
  Items: "green",
  Skills: "purple",
  Tech: "pink",
};
const TAB_ICONS: Record<(typeof TABS)[number], string> = {
  Quests: "/icons/quests.png",
  Journal: "/icons/journal.png",
  Map: "/icons/map.png",
  Items: "/icons/items.png",
  Skills: "/icons/magic.png",
  Tech: "/icons/tech.png",
};

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
            className={`menu-tab-button menu-tab-${TAB_COLORS[t]} ${active ? "active" : ""}`}
            onClick={() => setActiveTab(active ? null : t)}
            title={t}
          >
            <img src={TAB_ICONS[t]} alt={t} className="menu-tab-icon" />
            {!active && <span className="menu-tab-tooltip">{t}</span>}
          </button>
        );
      })}
    </div>
  );
};

export default MenuTabs;
