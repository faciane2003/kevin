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
const POWER_ICON = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <circle cx="32" cy="32" r="24" fill="none" stroke="#6bfffb" stroke-width="6"/>
    <line x1="32" y1="8" x2="32" y2="30" stroke="#6bfffb" stroke-width="6" stroke-linecap="round"/>
  </svg>`
)}`;

const MenuTabs: React.FC = () => {
  const { activeTab, setActiveTab } = useHUD();
  const [iconsExpanded, setIconsExpanded] = React.useState(true);
  const powerIndex = TABS.length;

  const togglePower = () => {
    setIconsExpanded((prev) => {
      const next = !prev;
      if (!next) setActiveTab(null);
      return next;
    });
  };

  return (
    <div
      className={`menu-tabs${iconsExpanded ? "" : " menu-tabs-collapsed"}`}
      role="tablist"
      aria-label="Game Menu Tabs"
    >
      {TABS.map((t, idx) => {
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
            style={
              {
                "--collapse-offset": `calc((var(--tab-size) + var(--tab-gap)) * ${
                  powerIndex - idx
                })`,
              } as React.CSSProperties
            }
          >
            <img src={TAB_ICONS[t]} alt={t} className="menu-tab-icon" />
            {!active && <span className="menu-tab-tooltip">{t}</span>}
          </button>
        );
      })}
      <button
        type="button"
        role="tab"
        aria-selected={false}
        className="menu-tab-button menu-tab-power"
        onClick={togglePower}
        title="Power"
        style={
          {
            "--collapse-offset": "0px",
          } as React.CSSProperties
        }
      >
        <img src={POWER_ICON} alt="Power" className="menu-tab-icon menu-tab-icon-power" />
        {iconsExpanded && <span className="menu-tab-tooltip">Power</span>}
      </button>
    </div>
  );
};

export default MenuTabs;
