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
  Quests: "/icons/quests.webp",
  Journal: "/icons/journal.webp",
  Map: "/icons/map.webp",
  Items: "/icons/items.webp",
  Skills: "/icons/magic.webp",
  Tech: "/icons/tech.webp",
};
const MUSIC_ICON = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <path d="M42 10v28.5a9.5 9.5 0 1 1-4-7.8V18l-18 4.5V40a9.5 9.5 0 1 1-4-7.8V18.5L42 10z" fill="#ff8de0"/>
  </svg>`
)}`;
const POWER_ICON = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <circle cx="32" cy="32" r="24" fill="none" stroke="#6bfffb" stroke-width="6"/>
    <line x1="32" y1="8" x2="32" y2="30" stroke="#6bfffb" stroke-width="6" stroke-linecap="round"/>
  </svg>`
)}`;

const MenuTabs: React.FC = () => {
  const { activeTab, setActiveTab } = useHUD();
  const [iconsExpanded, setIconsExpanded] = React.useState(false);
  const [musicOpen, setMusicOpen] = React.useState(false);
  const musicIndex = TABS.length;
  const powerIndex = TABS.length + 1;
  const collapseTimerRef = React.useRef<number | null>(null);

  const collapseIcons = React.useCallback(() => {
    setIconsExpanded(false);
    setActiveTab(null);
    setMusicOpen(false);
    window.dispatchEvent(new CustomEvent("music-visibility", { detail: { visible: false } }));
  }, [setActiveTab]);

  const togglePower = () => {
    setIconsExpanded((prev) => {
      const next = !prev;
      window.dispatchEvent(new CustomEvent("power-toggle", { detail: { expanded: next } }));
      if (!next) {
        collapseIcons();
      }
      return next;
    });
  };

  React.useEffect(() => {
    const onHotkey = (evt: KeyboardEvent) => {
      if (evt.key.toLowerCase() !== "m") return;
      const active = document.activeElement;
      if (active && ["input", "textarea"].includes(active.tagName.toLowerCase())) return;
      setMusicOpen((prev) => !prev);
    };
    window.addEventListener("keydown", onHotkey);
    return () => window.removeEventListener("keydown", onHotkey);
  }, []);

  React.useEffect(() => {
    const onClose = () => {
      setActiveTab(null);
      setMusicOpen(false);
      window.dispatchEvent(new CustomEvent("music-visibility", { detail: { visible: false } }));
    };
    window.addEventListener("hud-close", onClose as EventListener);
    return () => window.removeEventListener("hud-close", onClose as EventListener);
  }, [setActiveTab]);

  React.useEffect(() => {
    const scheduleCollapse = () => {
      if (collapseTimerRef.current) window.clearTimeout(collapseTimerRef.current);
      collapseTimerRef.current = window.setTimeout(() => {
        collapseIcons();
      }, 6000);
    };
    const onWalk = (event: Event) => {
      const detail = (event as CustomEvent<{ active: boolean }>).detail;
      if (!detail?.active) return;
      scheduleCollapse();
    };
    window.addEventListener("walk-input", onWalk as EventListener);
    return () => {
      try { window.removeEventListener("walk-input", onWalk as EventListener); } catch {}
      if (collapseTimerRef.current) window.clearTimeout(collapseTimerRef.current);
    };
  }, [collapseIcons]);

  React.useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("hud-panel-state", { detail: { open: !!(activeTab || musicOpen) } })
    );
    if (!iconsExpanded && musicOpen) {
      setMusicOpen(false);
      window.dispatchEvent(new CustomEvent("music-visibility", { detail: { visible: false } }));
      return;
    }
    if (activeTab && musicOpen) {
      setMusicOpen(false);
      window.dispatchEvent(new CustomEvent("music-visibility", { detail: { visible: false } }));
      return;
    }
    window.dispatchEvent(
      new CustomEvent("music-visibility", {
        detail: { visible: musicOpen, index: musicIndex },
      })
    );
  }, [musicOpen, iconsExpanded, musicIndex, activeTab]);

  return (
    <div
      className={`menu-tabs${iconsExpanded ? "" : " menu-tabs-collapsed"}`}
      role="tablist"
      aria-label="Game Menu Tabs"
      style={
        {
          "--power-index": powerIndex,
          "--power-offset": "66vh",
        } as React.CSSProperties
      }
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
            onClick={() => {
              setActiveTab(active ? null : t);
              if (!active && musicOpen) {
                setMusicOpen(false);
                window.dispatchEvent(new CustomEvent("music-visibility", { detail: { visible: false } }));
              }
            }}
            title={t}
            style={
              {
                "--collapse-offset": `calc((var(--tab-size) + var(--tab-gap)) * ${
                  powerIndex - idx
                })`,
              } as React.CSSProperties
            }
          >
            <span className="menu-tab-sparkles" aria-hidden="true">
              {Array.from({ length: 6 }).map((_, sparkleIdx) => (
                <span key={`${t}-sparkle-${sparkleIdx}`} className="menu-tab-sparkle" />
              ))}
            </span>
            <img src={TAB_ICONS[t]} alt={t} className="menu-tab-icon" />
            {!active && <span className="menu-tab-tooltip">{t}</span>}
          </button>
        );
      })}
      <button
        type="button"
        role="tab"
        aria-selected={musicOpen}
        className={`menu-tab-button menu-tab-pink ${musicOpen ? "active" : ""}`}
        onClick={() => {
          setMusicOpen((prev) => {
            const next = !prev;
            if (next) setActiveTab(null);
            return next;
          });
        }}
        title="Music"
        style={
          {
            "--collapse-offset": `calc((var(--tab-size) + var(--tab-gap)) * ${
              powerIndex - musicIndex
            })`,
          } as React.CSSProperties
        }
      >
        <span className="menu-tab-sparkles" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, sparkleIdx) => (
            <span key={`music-sparkle-${sparkleIdx}`} className="menu-tab-sparkle" />
          ))}
        </span>
        <img src={MUSIC_ICON} alt="Music" className="menu-tab-icon" />
        {!musicOpen && <span className="menu-tab-tooltip">Music</span>}
      </button>
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
        <span className="menu-tab-sparkles" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, sparkleIdx) => (
            <span key={`power-sparkle-${sparkleIdx}`} className="menu-tab-sparkle" />
          ))}
        </span>
        <img src={POWER_ICON} alt="Power" className="menu-tab-icon menu-tab-icon-power" />
        {iconsExpanded && <span className="menu-tab-tooltip">Power</span>}
      </button>
    </div>
  );
};

export default MenuTabs;
