// File: src/components/hud/HUD.tsx
import React, { useEffect, useState } from "react";
import { HUDProvider, useHUD } from "./HUDContext";
import StatsBars from "./StatsBars";
import MenuTabs from "./MenuTabs";
import JournalPanel from "./JournalPanel";
import "./HUD.css";

type DialogueOption = { text: string; next?: string };
type DialogueNode = { text: string; options: DialogueOption[] };
type DialogueTree = { name: string; nodes: Record<string, DialogueNode> };

const NPC_DIALOGUE: Record<string, DialogueTree> = {
  aria: {
    name: "Aria Vex",
    nodes: {
      start: {
        text: "The grid's humming tonight. You looking for work or answers?",
        options: [
          { text: "Work.", next: "work" },
          { text: "Answers.", next: "answers" },
          { text: "Just passing by.", next: "bye" },
        ],
      },
      work: {
        text: "Deliver this relay core to Sector 9. Quietly.",
        options: [
          { text: "I'm in.", next: "accept" },
          { text: "Too risky.", next: "bye" },
        ],
      },
      answers: {
        text: "Answers cost credits. I take secrets, too.",
        options: [
          { text: "I have a secret.", next: "secret" },
          { text: "Never mind.", next: "bye" },
        ],
      },
      secret: {
        text: "Interesting. Keep digging around the bazaar.",
        options: [{ text: "Got it.", next: "bye" }],
      },
      accept: {
        text: "Meet my courier at the neon bridge.",
        options: [{ text: "On my way.", next: "bye" }],
      },
      bye: {
        text: "Stay alive out there.",
        options: [{ text: "Close" }],
      },
    },
  },
  kade: {
    name: "Kade N7",
    nodes: {
      start: {
        text: "Your optics are glitching. Need a tune?",
        options: [
          { text: "Upgrade me.", next: "upgrade" },
          { text: "Seen any drones?", next: "drones" },
          { text: "Later.", next: "bye" },
        ],
      },
      upgrade: {
        text: "Bring me two glowcells and I'll boost your jump.",
        options: [
          { text: "Deal.", next: "bye" },
          { text: "No thanks.", next: "bye" },
        ],
      },
      drones: {
        text: "They circle the old yard. Avoid the blue ones.",
        options: [{ text: "Thanks.", next: "bye" }],
      },
      bye: { text: "Catch you in the neon.", options: [{ text: "Close" }] },
    },
  },
  mira: {
    name: "Mira Sol",
    nodes: {
      start: {
        text: "I've charted a safe route through the alleys.",
        options: [
          { text: "Show me.", next: "route" },
          { text: "Any rumors?", next: "rumors" },
          { text: "Not now.", next: "bye" },
        ],
      },
      route: {
        text: "Follow the cyan lamps. Avoid the red haze.",
        options: [{ text: "Got it.", next: "bye" }],
      },
      rumors: {
        text: "Someone is selling fake keycards nearby.",
        options: [{ text: "Thanks.", next: "bye" }],
      },
      bye: { text: "Stay quiet out there.", options: [{ text: "Close" }] },
    },
  },
  vex: {
    name: "Vex Orin",
    nodes: {
      start: {
        text: "Looking for a blade that cuts light?",
        options: [
          { text: "Show me.", next: "blade" },
          { text: "Any jobs?", next: "jobs" },
          { text: "No.", next: "bye" },
        ],
      },
      blade: {
        text: "Find the ghost merchant under the bridge.",
        options: [{ text: "I'll check.", next: "bye" }],
      },
      jobs: {
        text: "Hack the relay tower and I pay double.",
        options: [{ text: "Consider it done.", next: "bye" }],
      },
      bye: { text: "Stay sharp.", options: [{ text: "Close" }] },
    },
  },
  lux: {
    name: "Lux",
    nodes: {
      start: {
        text: "You glow. The city notices.",
        options: [
          { text: "Who are you?", next: "who" },
          { text: "Teach me magic.", next: "magic" },
          { text: "Goodbye.", next: "bye" },
        ],
      },
      who: {
        text: "Just a whisper in the neon. Keep moving.",
        options: [{ text: "Alright.", next: "bye" }],
      },
      magic: {
        text: "Start with Lumina Thread. Feel the current.",
        options: [{ text: "Thanks.", next: "bye" }],
      },
      bye: { text: "Return when the lights flicker.", options: [{ text: "Close" }] },
    },
  },
  zed: {
    name: "Zed-9",
    nodes: {
      start: {
        text: "Protocol says you owe me a favor.",
        options: [
          { text: "What favor?", next: "favor" },
          { text: "I'm busy.", next: "bye" },
          { text: "Override protocol.", next: "override" },
        ],
      },
      favor: {
        text: "Recover my memory shard from the yard.",
        options: [{ text: "I'll look.", next: "bye" }],
      },
      override: {
        text: "Denied. Try again later.",
        options: [{ text: "Close" }],
      },
      bye: { text: "Awaiting compliance.", options: [{ text: "Close" }] },
    },
  },
};

const DialoguePanel: React.FC<{
  npcId: string | null;
  onClose: () => void;
}> = ({ npcId, onClose }) => {
  const [nodeId, setNodeId] = useState("start");
  const tree = npcId ? NPC_DIALOGUE[npcId] : null;

  useEffect(() => {
    setNodeId("start");
  }, [npcId]);

  if (!tree) return null;
  const node = tree.nodes[nodeId];
  if (!node) return null;

  return (
    <div className="dialogue-overlay" role="dialog" aria-label="NPC Dialogue">
      <div className="dialogue-panel">
        <div className="dialogue-header">
          <span className="dialogue-name">{tree.name}</span>
          <button className="dialogue-close" onClick={onClose} aria-label="Close dialogue">
            Close
          </button>
        </div>
        <div className="dialogue-body">{node.text}</div>
        <div className="dialogue-options">
          {node.options.map((opt) => (
            <button
              key={opt.text}
              className="dialogue-option"
              onClick={() => {
                if (opt.next) setNodeId(opt.next);
                else onClose();
              }}
            >
              {opt.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const HUDInner: React.FC = () => {
  const { setActiveTab, setActiveSlot, addInventoryItem } = useHUD();
  const [activeNpc, setActiveNpc] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "m") setActiveTab((t) => (t === "Map" ? null : "Map"));
      if (e.key === "i") setActiveTab((t) => (t === "Items" ? null : "Items"));
      if (/^[1-9]$/.test(e.key) || e.key === "0") {
        // keep numeric shortcuts available but do not show the HUD hotbar
        const idx = e.key === "0" ? 9 : parseInt(e.key, 10) - 1;
        setActiveSlot(idx);
        setTimeout(() => setActiveSlot(null), 200);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setActiveTab, setActiveSlot]);

  useEffect(() => {
    const onNpc = (evt: Event) => {
      const detail = (evt as CustomEvent<{ npcId: string }>).detail;
      if (detail?.npcId) setActiveNpc(detail.npcId);
    };
    const onPickup = (evt: Event) => {
      const detail = (evt as CustomEvent<{ item: string }>).detail;
      if (detail?.item) addInventoryItem(detail.item);
    };
    window.addEventListener("npc-dialogue", onNpc as EventListener);
    window.addEventListener("pickup-item", onPickup as EventListener);
    return () => {
      window.removeEventListener("npc-dialogue", onNpc as EventListener);
      window.removeEventListener("pickup-item", onPickup as EventListener);
    };
  }, [addInventoryItem]);

  return (
    <div className="hud-container" aria-hidden={false}>
      <StatsBars />
      <MenuTabs />
      <JournalPanel />
      <DialoguePanel npcId={activeNpc} onClose={() => setActiveNpc(null)} />
      {/* Hotbar removed from UI per request */}
    </div>
  );
};

const HUD: React.FC = () => (
  <HUDProvider>
    <HUDInner />
  </HUDProvider>
);

export default HUD;
