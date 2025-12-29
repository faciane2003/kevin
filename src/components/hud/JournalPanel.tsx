import React from "react";
import { useHUD } from "./HUDContext";
import MiniMap from "./MiniMap";
import "./HUD.css";

const TAB_CONTENT: Record<string, { title: string; body: string[] }> = {
  Quests: {
    title: "Quests",
    body: [
      "Find the best burger place in town and see how thick the chedda is.",
      "Trace the broadcast near Sector 7",
      "'Stinky Pete ain't gunna be happy about this'",
      "Aquire Skates"
    ],
  },
  Journal: {
    title: "Journal",
    body: [
      "Ain't life great!",
      "Had that dream again...the one where I was in a Jacuzzi.",
      "I heard the most interesting music by a guy banging on the side of the subway. I looked at him and smiled and he looked back and felt heard. I can't imagine night after night screaming and no one cares. Anyway, it was a good song.",
    ],
  },
  Map: {
    title: "Map",
    body: [],
  },
  Spells: {
    title: "Tech",
    body: [
      "Camera",
      "Rollerblades",
      "Broken Lightsaber",
    ],
  },
  Items: {
    title: "Items",
    body: [
      "Not much toilet paper",
      "SEPTA Transit Keycard",
      "Half a bottle of OJ",
      "1 lb mostly ripe bananas",
       "1 lb crunchy peanut butter",
    ],
  },
  Magic: {
    title: "Skills",
    body: [
      "Composite",
      "Imagine",
      "Anxiety",
    ],
  },
  Tech: {
    title: "Tech",
    body: [
      "Camera",
      "Rollerblades",
      "Broken Lightsaber",
    ],
  },
};

const SPARKLE_POSITIONS = [
  { left: "6%", top: "6px" },
  { left: "16%", top: "6px" },
  { left: "84%", top: "6px" },
  { left: "94%", top: "6px" },
  { right: "6px", top: "10%" },
  { right: "6px", top: "22%" },
  { right: "6px", top: "78%" },
  { right: "6px", top: "90%" },
  { left: "94%", bottom: "6px" },
  { left: "84%", bottom: "6px" },
  { left: "16%", bottom: "6px" },
  { left: "6%", bottom: "6px" },
  { left: "6px", top: "10%" },
  { left: "6px", top: "22%" },
  { left: "6px", top: "78%" },
  { left: "6px", top: "90%" },
];

const JournalPanel: React.FC = () => {
  const { activeTab, setActiveTab, inventory } = useHUD();
  const [panelPos, setPanelPos] = React.useState<{ top: number; left: number }>({ top: 12, left: 70 });
  React.useEffect(() => {
    if (!activeTab) return;
    const isMobile = window.matchMedia("(max-width: 600px)").matches;
    const button = document.querySelector(`.menu-tab-button[title="${activeTab}"]`) as HTMLElement | null;
    if (button) {
      const rect = button.getBoundingClientRect();
      setPanelPos({ top: rect.top, left: rect.right + (isMobile ? 10 : 14) });
      return;
    }
    const baseTop = isMobile ? 10 : 12;
    const baseLeft = isMobile ? 10 : 12;
    const buttonSize = isMobile ? 36 : 40;
    const gap = isMobile ? 6 : 8;
    setPanelPos({ top: baseTop, left: baseLeft + buttonSize + gap + 8 });
  }, [activeTab]);
  React.useEffect(() => {
    if (!activeTab) return;
    const onResize = () => {
      const isMobile = window.matchMedia("(max-width: 600px)").matches;
      const button = document.querySelector(`.menu-tab-button[title="${activeTab}"]`) as HTMLElement | null;
      if (button) {
        const rect = button.getBoundingClientRect();
        setPanelPos({ top: rect.top, left: rect.right + (isMobile ? 10 : 14) });
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [activeTab]);
  if (!activeTab) return null;
  const sparkleColors: Record<string, { base: string; glow: string; glowSoft: string }> = {
    Quests: {
      base: "rgba(255,214,107,0.95)",
      glow: "rgba(255,214,107,0.8)",
      glowSoft: "rgba(255,214,107,0.45)",
    },
    Journal: {
      base: "rgba(255,107,107,0.95)",
      glow: "rgba(255,107,107,0.75)",
      glowSoft: "rgba(255,107,107,0.45)",
    },
    Map: {
      base: "rgba(107,183,255,0.95)",
      glow: "rgba(107,183,255,0.75)",
      glowSoft: "rgba(107,183,255,0.45)",
    },
    Items: {
      base: "rgba(107,255,157,0.95)",
      glow: "rgba(107,255,157,0.75)",
      glowSoft: "rgba(107,255,157,0.45)",
    },
    Magic: {
      base: "rgba(201,155,255,0.95)",
      glow: "rgba(201,155,255,0.75)",
      glowSoft: "rgba(201,155,255,0.45)",
    },
    Tech: {
      base: "rgba(255,141,224,0.95)",
      glow: "rgba(255,141,224,0.75)",
      glowSoft: "rgba(255,141,224,0.45)",
    },
    Spells: {
      base: "rgba(255,141,224,0.95)",
      glow: "rgba(255,141,224,0.75)",
      glowSoft: "rgba(255,141,224,0.45)",
    },
  };
  const sparkle = sparkleColors[activeTab] ?? {
    base: "rgba(120,255,240,0.95)",
    glow: "rgba(120,255,240,0.8)",
    glowSoft: "rgba(80,255,200,0.6)",
  };

  const content =
    activeTab === "Items"
      ? { title: "Items", body: inventory.length ? inventory : ["No items collected yet."] }
      : TAB_CONTENT[activeTab] ?? { title: activeTab, body: ["No entries yet."] };

  const onItemClick = (label: string) => {
    window.dispatchEvent(new CustomEvent("hud-item-click", { detail: { label } }));
  };

  const onOverlayClick = () => {
    setActiveTab(null);
    window.dispatchEvent(new CustomEvent("hud-close"));
  };

  return (
    <div
      className="journal-overlay"
      role="dialog"
      aria-label={`${activeTab} Journal`}
      onClick={onOverlayClick}
    >
      <div
        className="journal-panel"
        style={
          {
            "--sparkle-color": sparkle.base,
            "--sparkle-glow": sparkle.glow,
            "--sparkle-glow-soft": sparkle.glowSoft,
            left: `${panelPos.left}px`,
            top: `${panelPos.top}px`,
          } as React.CSSProperties
        }
        onClick={(event) => event.stopPropagation()}
      >
        <div className="hud-sparkles hud-sparkles-back" aria-hidden="true">
          {SPARKLE_POSITIONS.map((pos, idx) => (
            <span
              key={`back-${idx}`}
              className="hud-sparkle"
              style={{
                ...pos,
                animationDelay: `${idx * 0.12}s`,
                animationDuration: `${2.6 + (idx % 5) * 0.35}s`,
              }}
            />
          ))}
        </div>
        <div className={`journal-header journal-header-${activeTab?.toLowerCase() ?? ""}`}>
          <span className="journal-title">{content.title}</span>
        </div>
        <div className={`journal-body journal-body-${activeTab?.toLowerCase() ?? ""}`}>
          {activeTab === "Map" ? (
            <MiniMap embedded />
          ) : (
            content.body.map((line) => (
              <button
                key={line}
                type="button"
                className="journal-item"
                onClick={() => onItemClick(line)}
              >
                {line}
              </button>
            ))
          )}
        </div>
        <div className="hud-sparkles hud-sparkles-front" aria-hidden="true">
          {SPARKLE_POSITIONS.map((pos, idx) => (
            <span
              key={`front-${idx}`}
              className="hud-sparkle"
              style={{
                ...pos,
                animationDelay: `${0.08 + idx * 0.11}s`,
                animationDuration: `${2.4 + (idx % 6) * 0.33}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default JournalPanel;
