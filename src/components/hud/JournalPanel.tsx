import React, { useEffect, useState } from "react";
import { useHUD } from "./HUDContext";
import { TABS } from "./MenuTabs";
import "./HUD.css";

const TAB_CONTENT: Record<string, { title: string; body: string[] }> = {
  Quests: {
    title: "Quests",
    body: [
      "Find enough money to pay overdue rent",
      "Trace the broadcast near Sector 7.",
      "Deliver the cybershard before dawn.",
      "Get new skates."
    ],
  },
  Journal: {
    title: "Journal",
    body: [
      "Had that dream again...the one where I was in a Jacuzzi.",
      "I heard the most interesting music by a guy banging on the side of the subway. I looked at him and smiled and he looked back and felt heard. I can't imagine night after night screaming and no one cares. Anyway, it was a good song.",
    ],
  },
  Map: {
    title: "Map",
    body: [
      "Error 404: Snow Crash",
      "Location...Tracking",
      "Ninja en route..."
    ],
  },
  Items: {
    title: "Items",
    body: [
      "Not much toilet paper",
      "SEPTA Transit Keycard",
      "Half a pound of bananas and peanut butter (each)",
    ],
  },
  Skills: {
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
  { left: "8%", top: "6px" },
  { left: "22%", top: "6px" },
  { left: "38%", top: "6px" },
  { left: "52%", top: "6px" },
  { left: "66%", top: "6px" },
  { left: "82%", top: "6px" },
  { right: "6px", top: "14%" },
  { right: "6px", top: "32%" },
  { right: "6px", top: "50%" },
  { right: "6px", top: "68%" },
  { right: "6px", top: "86%" },
  { left: "82%", bottom: "6px" },
  { left: "66%", bottom: "6px" },
  { left: "52%", bottom: "6px" },
  { left: "38%", bottom: "6px" },
  { left: "22%", bottom: "6px" },
  { left: "8%", bottom: "6px" },
  { left: "6px", top: "14%" },
  { left: "6px", top: "50%" },
  { left: "6px", top: "86%" },
];

const JournalPanel: React.FC = () => {
  const { activeTab, inventory } = useHUD();
  if (!activeTab) return null;

  const tabKey = activeTab.toLowerCase();
  const [panelPos, setPanelPos] = useState<{ top: number; left: number }>({
    top: 12,
    left: 70,
  });

  useEffect(() => {
    const updatePos = () => {
      const isMobile = window.matchMedia("(max-width: 600px)").matches;
      const baseTop = isMobile ? 10 : 12;
      const baseLeft = isMobile ? 10 : 12;
      const buttonSize = isMobile ? 36 : 40;
      const gap = isMobile ? 6 : 8;
      const idx = Math.max(0, TABS.indexOf(activeTab as (typeof TABS)[number]));
      setPanelPos({
        top: baseTop + idx * (buttonSize + gap),
        left: baseLeft + buttonSize + 14,
      });
    };
    updatePos();
    window.addEventListener("resize", updatePos);
    return () => window.removeEventListener("resize", updatePos);
  }, [activeTab]);
  const content =
    activeTab === "Items"
      ? { title: "Items", body: inventory.length ? inventory : ["No items collected yet."] }
      : TAB_CONTENT[activeTab] ?? { title: activeTab, body: ["No entries yet."] };

  return (
    <div className="journal-overlay" role="dialog" aria-label={`${activeTab} Journal`}>
      <div
        className={`journal-panel journal-panel-${tabKey}`}
        style={{ top: `${panelPos.top}px`, left: `${panelPos.left}px` }}
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
          {content.body.map((line) => (
            <p key={line}>{line}</p>
          ))}
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
