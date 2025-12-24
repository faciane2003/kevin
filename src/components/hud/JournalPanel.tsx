import React from "react";
import { useHUD } from "./HUDContext";
import "./HUD.css";

const TAB_CONTENT: Record<string, { title: string; body: string[] }> = {
  Quests: {
    title: "Active Quests",
    body: [
      "Neon Relay: Route power to the East District.",
      "Ghost Signal: Trace the broadcast near Sector 7.",
      "Courier Run: Deliver the shard before dawn.",
    ],
  },
  Journal: {
    title: "Field Journal",
    body: [
      "Streetlights hum louder when the rain starts.",
      "The market drones follow me more than usual.",
      "Someone keeps tagging the skybridge with a spiral.",
    ],
  },
  Map: {
    title: "City Grid",
    body: [
      "North: Arcadia Tower",
      "East: Neon Bazaar",
      "South: Transit Yards",
      "West: The Old Dock",
    ],
  },
  Spells: {
    title: "Spellbook",
    body: [
      "Pulse Nova — short-range shockwave.",
      "Phase Step — blink through a wall.",
      "Signal Scramble — disorient nearby drones.",
    ],
  },
  Items: {
    title: "Inventory",
    body: [
      "Glowcell Battery x3",
      "Transit Keycard",
      "Med Patch x2",
      "Scrap Alloy x14",
    ],
  },
  Magic: {
    title: "Arcane Nodes",
    body: [
      "Synth Ward — reduces incoming damage.",
      "Lumina Thread — highlights hidden routes.",
      "Echo Bind — temporarily freeze a target.",
    ],
  },
};

const JournalPanel: React.FC = () => {
  const { activeTab, setActiveTab, inventory } = useHUD();
  if (!activeTab) return null;

  const content =
    activeTab === "Items"
      ? { title: "Inventory", body: inventory.length ? inventory : ["No items collected yet."] }
      : TAB_CONTENT[activeTab] ?? { title: activeTab, body: ["No entries yet."] };

  return (
    <div className="journal-overlay" role="dialog" aria-label={`${activeTab} Journal`}>
      <div className="journal-panel">
        <div className="hud-sparkles hud-sparkles-back" aria-hidden="true">
          {Array.from({ length: 12 }).map((_, idx) => (
            <span key={`back-${idx}`} className="hud-sparkle" />
          ))}
        </div>
        <div className="journal-header">
          <span className="journal-title">{content.title}</span>
          <button className="journal-close" onClick={() => setActiveTab(null)} aria-label="Close journal">
            Close
          </button>
        </div>
        <div className="journal-body">
          {content.body.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
        <div className="hud-sparkles hud-sparkles-front" aria-hidden="true">
          {Array.from({ length: 12 }).map((_, idx) => (
            <span key={`front-${idx}`} className="hud-sparkle" />
          ))}
        </div>
      </div>
    </div>
  );
};

export default JournalPanel;
