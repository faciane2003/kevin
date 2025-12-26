// File: src/components/hud/HUD.tsx
import React, { useEffect, useState } from "react";
import { HUDProvider, useHUD } from "./HUDContext";
import MenuTabs from "./MenuTabs";
import JournalPanel from "./JournalPanel";
import DebugPanel from "./DebugPanel";
import "./HUD.css";

type DialogueOption = { text: string; next?: string };
type DialogueNode = { text: string; options: DialogueOption[] };
type DialogueTree = { name: string; nodes: Record<string, DialogueNode> };

const NPC_PORTRAITS: Record<string, string> = {
  aria: "/portraits/aria.jpg",
  kade: "/portraits/kade.jpg",
  mira: "/portraits/mira.jpg",
  vex: "/portraits/vex.jpg",
  lux: "/portraits/lux.jpg",
  zed: "/portraits/zed.jpg",
};

const DIALOGUE_SPARKLES = [
  { left: "8%", top: "8px" },
  { left: "32%", top: "8px" },
  { right: "8%", top: "8px" },
  { right: "8px", top: "40%" },
  { right: "8px", bottom: "12px" },
  { left: "50%", bottom: "8px" },
  { left: "8px", bottom: "12px" },
  { left: "8px", top: "40%" },
];

const PORTRAIT_SPARKLES = [
  { left: "6%", top: "6%" },
  { left: "50%", top: "4%" },
  { right: "6%", top: "8%" },
  { right: "4%", top: "50%" },
  { right: "8%", bottom: "8%" },
  { left: "50%", bottom: "4%" },
  { left: "6%", bottom: "8%" },
  { left: "4%", top: "50%" },
  { left: "18%", top: "10%" },
  { left: "72%", top: "12%" },
  { right: "18%", top: "14%" },
  { left: "86%", top: "32%" },
  { right: "14%", bottom: "16%" },
  { left: "68%", bottom: "12%" },
  { left: "16%", bottom: "18%" },
  { left: "12%", top: "68%" },
];

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
  const [isClosing, setIsClosing] = useState(false);
  const tree = npcId ? NPC_DIALOGUE[npcId] : null;
  const node = tree?.nodes[nodeId];
  const visibleOptions = node ? node.options.filter((opt) => opt.next) : [];
  const isTerminal = !!node && visibleOptions.length === 0;

  useEffect(() => {
    setNodeId("start");
    setIsClosing(false);
  }, [npcId]);

  useEffect(() => {
    if (!isTerminal) return;
    let fadeTimer: number | undefined;
    let closeTimer: number | undefined;
    fadeTimer = window.setTimeout(() => {
      setIsClosing(true);
      closeTimer = window.setTimeout(() => onClose(), 450);
    }, 1000);
    return () => {
      if (fadeTimer) window.clearTimeout(fadeTimer);
      if (closeTimer) window.clearTimeout(closeTimer);
    };
  }, [isTerminal, onClose, nodeId]);

  useEffect(() => {
    if (!node) return;
    const onKey = (evt: KeyboardEvent) => {
      if (!/^[1-4]$/.test(evt.key)) return;
      const idx = parseInt(evt.key, 10) - 1;
      const option = visibleOptions[idx];
      if (!option?.next) return;
      setNodeId(option.next);
      setIsClosing(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [node, visibleOptions]);

  if (!tree || !node) return null;
  const portraitSrc = npcId ? NPC_PORTRAITS[npcId] : undefined;

  return (
    <div
      className={`dialogue-overlay${isClosing ? " dialogue-overlay-closing" : ""}`}
      role="dialog"
      aria-label="NPC Dialogue"
    >
      <div className="dialogue-stack">
        {portraitSrc ? (
          <div className="dialogue-portrait dialogue-portrait-floating">
            <div className="portrait-sparkles" aria-hidden="true">
              {PORTRAIT_SPARKLES.map((pos, idx) => (
                <span
                  key={`portrait-${idx}`}
                  className="portrait-sparkle"
                  style={{
                    ...pos,
                    animationDelay: `${idx * 0.15}s`,
                    animationDuration: `${2.4 + (idx % 4) * 0.4}s`,
                  }}
                />
              ))}
            </div>
            <img src={portraitSrc} alt={tree.name} />
          </div>
        ) : null}
        <div className="dialogue-panel">
        <div className="dialogue-sparkles dialogue-sparkles-back" aria-hidden="true">
          {DIALOGUE_SPARKLES.map((pos, idx) => (
            <span
              key={`back-${idx}`}
              className="dialogue-sparkle"
              style={{
                ...pos,
                animationDelay: `${idx * 0.18}s`,
                animationDuration: `${2.6 + (idx % 4) * 0.35}s`,
              }}
            />
          ))}
        </div>
        <div className="dialogue-header">
          <span className="dialogue-name">{tree.name}</span>
        </div>
        <div className="dialogue-body">{node.text}</div>
        <div className="dialogue-options">
          {visibleOptions.map((opt) => (
            <button
              key={opt.text}
              className="dialogue-option"
              onClick={() => {
                if (opt.next) {
                  setNodeId(opt.next);
                  setIsClosing(false);
                }
              }}
            >
              {opt.text}
            </button>
          ))}
        </div>
        <div className="dialogue-sparkles dialogue-sparkles-front" aria-hidden="true">
          {DIALOGUE_SPARKLES.map((pos, idx) => (
            <span
              key={`front-${idx}`}
              className="dialogue-sparkle"
              style={{
                ...pos,
                animationDelay: `${0.08 + idx * 0.14}s`,
                animationDuration: `${2.2 + (idx % 5) * 0.32}s`,
              }}
            />
          ))}
        </div>
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
      {/* Stats bars hidden per request */}
      <MenuTabs />
      <JournalPanel />
      <DialoguePanel npcId={activeNpc} onClose={() => setActiveNpc(null)} />
      <DebugPanel />
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
