import React from "react";
import { useHUD } from "./HUDContext";
import "./HUD.css";

const TAB_CONTENT: Record<string, { title: string; body: string[] }> = {
  Quests: {
    title: "Quests",
    body: [
      "Find enough money to pay overdue rent",
      "Ghost Signal: Trace the broadcast near Sector 7.",
      "Courier Run: Deliver the cybershard before dawn.",
      "Get new skates."
    ],
  },
  Journal: {
    title: "Journal",
    body: [
      "How am I going to pay all these bills?",
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
  Spells: {
    title: "Tech",
    body: [
      "Camera",
      "Rollerblades",
      "Fake Lightsaber",
    ],
  },
  Items: {
    title: "Items",
    body: [
      "Not much toilet paper",
      "SEPTA Transit Keycard",
      "Two Joints",
      "Half a pound of bananas and peanut butter (each)",
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
