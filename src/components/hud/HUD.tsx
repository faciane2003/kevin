// File: src/components/hud/HUD.tsx
import React, { useEffect, useMemo, useState } from "react";
import { HUDProvider, useHUD } from "./HUDContext";
import MenuTabs from "./MenuTabs";
import JournalPanel from "./JournalPanel";
import DebugPanel from "./DebugPanel";
import PerformanceMonitor from "./PerformanceMonitor";
import { RpgProvider } from "../rpg/RpgContext";
import RpgSystemsPanel from "../rpg/RpgSystemsPanel";
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

const extractWords = (text: string) =>
  text
    .replace(/[^a-zA-Z'\s]/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 4);

const pickEchoWord = (text: string) => {
  const words = extractWords(text);
  if (words.length === 0) return "that";
  return words[Math.floor(Math.random() * words.length)];
};

const hashSeed = (input: string) => {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
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
        text: "Hey. How are you holding up today?",
        options: [
          { text: "I’m doing alright, just tired.", next: "doing" },
          { text: "I’ve had a rough morning, honestly.", next: "doing" },
          { text: "Somewhere in the middle, not great but not awful.", next: "doing" },
        ],
      },
      doing: {
        text:
          "I’m waiting on a call from my mom’s doctor and trying not to spiral. " +
          "Last week my kid had an accident at school and I’m still embarrassed about it. " +
          "What have you been up to?",
        options: [
          { text: "About {echoNpc}, I’ve been keeping things together and trying to be kind.", next: "responseWarm" },
          { text: "When you said {echoNpc}, it felt like juggling plates on a windy balcony.", next: "responseHumor" },
          { text: "Hearing {echoNpc} reminds me I’m just trying to get through the day.", next: "responseWit" },
        ],
      },
      responseWarm: {
        text:
          "I hear you about {echoPlayer}. It’s a lot to carry, and you’re still standing.",
        options: [],
      },
      responseHumor: {
        text:
          "Yeah, {echoPlayer} sounds like a slapstick routine with real feelings mixed in.",
        options: [],
      },
      responseWit: {
        text:
          "You mentioned {echoPlayer}—that sticks. Some days that’s the only win.",
        options: [],
      },
    },
  },
  kade: {
    name: "Kade N7",
    nodes: {
      start: {
        text: "Hey. How are you doing?",
        options: [
          { text: "I’m okay, just stretched thin.", next: "doing" },
          { text: "Not great. Everything feels heavy lately.", next: "doing" },
          { text: "I’m hanging in, one hour at a time.", next: "doing" },
        ],
      },
      doing: {
        text:
          "My partner and I had another argument last night, and I slept on the couch. " +
          "I’m in the middle of fixing a leaky sink that’s been dripping for weeks. " +
          "What have you been up to?",
        options: [
          { text: "About {echoNpc}, I’m trying to be patient with people I love.", next: "responseTragic" },
          { text: "When you said {echoNpc}, it felt like trying to carry groceries in the rain.", next: "responseHumor" },
          { text: "Hearing {echoNpc} makes me think I should slow down and breathe.", next: "responseHurry" },
        ],
      },
      responseTragic: {
        text:
          "I hear you about {echoPlayer}. I’ve been there and it still hurts.",
        options: [],
      },
      responseHumor: {
        text:
          "That {echoPlayer} moment? Yeah, that’s the universe slipping on a banana peel.",
        options: [],
      },
      responseHurry: {
        text:
          "You mentioned {echoPlayer}. Take the slow way if you can—it helps.",
        options: [],
      },
    },
  },
  mira: {
    name: "Mira Sol",
    nodes: {
      start: {
        text: "Hi. How are you feeling?",
        options: [
          { text: "Honestly, I’m worn out.", next: "doing" },
          { text: "Pretty good, just thinking a lot.", next: "doing" },
          { text: "I’m focused, but my head’s loud.", next: "doing" },
        ],
      },
      doing: {
        text:
          "I’m in the middle of helping my neighbor move because her back is shot. " +
          "My kid spilled juice on my last clean shirt, so I’m wearing this. " +
          "What have you been up to?",
        options: [
          { text: "About {echoNpc}, I’ve been trying to show up for people.", next: "responseWarm" },
          { text: "When you said {echoNpc}, it felt like carrying a backpack full of bricks.", next: "responseHumor" },
          { text: "Hearing {echoNpc} makes me want to call someone I miss.", next: "responseRomantic" },
        ],
      },
      responseWarm: {
        text:
          "I hear you about {echoPlayer}. Small kindnesses add up, even when it doesn’t feel like it.",
        options: [],
      },
      responseHumor: {
        text:
          "That {echoPlayer} vibe? It’s like tripping over your own shoelaces in public.",
        options: [],
      },
      responseRomantic: {
        text:
          "You mentioned {echoPlayer}. That’s brave—some calls are harder than the rest.",
        options: [],
      },
    },
  },
  vex: {
    name: "Vex Orin",
    nodes: {
      start: {
        text: "Yo. How are you doing today?",
        options: [
          { text: "I’m okay, just broke and tired.", next: "doing" },
          { text: "Not great. Things are piling up.", next: "doing" },
          { text: "I’m hanging in there, I guess.", next: "doing" },
        ],
      },
      doing: {
        text:
          "I’m trying to figure out if I should quit my second job. " +
          "My roommate ate my leftovers again and I’m still mad about it. " +
          "What have you been up to?",
        options: [
          { text: "About {echoNpc}, I’ve been counting my wins no matter how small.", next: "responseSarcasm" },
          { text: "When you said {echoNpc}, it felt like chasing a bus that’s already gone.", next: "responseAnger" },
          { text: "Hearing {echoNpc} makes me want to take a long walk.", next: "responseWit" },
        ],
      },
      responseSarcasm: {
        text:
          "You mentioned {echoPlayer}. Yeah, we’re all out here collecting tiny victories.",
        options: [],
      },
      responseAnger: {
        text:
          "That {echoPlayer} energy? I get it. Just don’t burn yourself out.",
        options: [],
      },
      responseWit: {
        text:
          "I hear you about {echoPlayer}. A long walk fixes more than people admit.",
        options: [],
      },
    },
  },
  lux: {
    name: "Lux",
    nodes: {
      start: {
        text: "Hey there. How are you holding up?",
        options: [
          { text: "I’m alright, just distracted.", next: "doing" },
          { text: "I’m tired. It’s been a week.", next: "doing" },
          { text: "I’m okay, but my heart’s heavy.", next: "doing" },
        ],
      },
      doing: {
        text:
          "I’m stuck deciding if I should stay in this relationship. " +
          "We keep arguing about little things that feel huge. " +
          "What have you been up to?",
        options: [
          { text: "About {echoNpc}, I’ve been trying to be honest even when it’s awkward.", next: "responseWit" },
          { text: "When you said {echoNpc}, it felt like carrying an umbrella in a storm.", next: "responseRomantic" },
          { text: "Hearing {echoNpc} makes me want a quiet night and warm food.", next: "responseHurry" },
        ],
      },
      responseWit: {
        text:
          "I hear you about {echoPlayer}. Honest is hard, but it saves time.",
        options: [],
      },
      responseRomantic: {
        text:
          "You mentioned {echoPlayer}. That’s sweet—and kind of scary too.",
        options: [],
      },
      responseHurry: {
        text:
          "That {echoPlayer} feeling? I’m right there with you. Rest if you can.",
        options: [],
      },
    },
  },
  zed: {
    name: "Zed-9",
    nodes: {
      start: {
        text: "Hello. How are you doing?",
        options: [
          { text: "I’m stable, just exhausted.", next: "doing" },
          { text: "Complicated. There’s a lot going on.", next: "doing" },
          { text: "I’m okay, but my nerves are shot.", next: "doing" },
        ],
      },
      doing: {
        text:
          "I’m coordinating a care check for a neighbor who hasn’t been outside in days. " +
          "Also, my cat knocked over a plant and now my floor is a swamp. " +
          "What have you been up to?",
        options: [
          { text: "About {echoNpc}, I’ve been trying to show up for family.", next: "responseHurry" },
          { text: "When you said {echoNpc}, it felt like walking a tightrope in slow motion.", next: "responseAnger" },
          { text: "Hearing {echoNpc} makes me want to laugh and cry at the same time.", next: "responseDrunk" },
        ],
      },
      responseHurry: {
        text:
          "I hear you about {echoPlayer}. Showing up counts more than you think.",
        options: [],
      },
      responseAnger: {
        text:
          "That {echoPlayer} edge? It’s real. Take a breath before it takes you.",
        options: [],
      },
      responseDrunk: {
        text:
          "You mentioned {echoPlayer}. Honestly, same. Life’s a weird drink.",
        options: [],
      },
    },
  },
};

const DialoguePanel: React.FC<{
  npcId: string | null;
  onClose: () => void;
}> = ({ npcId, onClose }) => {
  const [nodeId, setNodeId] = useState("start");
  const [isClosing, setIsClosing] = useState(false);
  const [lastNpcLine, setLastNpcLine] = useState("");
  const [lastPlayerLine, setLastPlayerLine] = useState("");
  const tree = npcId ? NPC_DIALOGUE[npcId] : null;
  const node = tree?.nodes[nodeId];
  const visibleOptions = node ? node.options.filter((opt) => opt.next) : [];
  const isTerminal = !!node && visibleOptions.length === 0;
  const npcLineForEcho = lastNpcLine || node?.text || "";
  const echoNpcWord = pickEchoWord(npcLineForEcho);
  const echoPlayerWord = pickEchoWord(lastPlayerLine);
  const renderedText =
    nodeId === "start" || !node
      ? node?.text ?? ""
      : node.text.replace(/\{echoPlayer\}/g, echoPlayerWord);
  const displayOptions = useMemo(() => {
    if (!node) return [];
    return visibleOptions.map((opt, idx) => {
      const seed = hashSeed(`${npcId ?? ""}:${nodeId}:${idx}`);
      const useMetaphor = seed % 2 === 0;
      const base = opt.text.includes("{echoNpc}")
        ? opt.text.replace(/\{echoNpc\}/g, echoNpcWord)
        : opt.text;
      const text = useMetaphor
        ? `${base} It feels like ${echoNpcWord} is a storm you can't see coming.`
        : `${base} I keep thinking about ${echoNpcWord}.`;
      return { ...opt, text };
    });
  }, [echoNpcWord, node, nodeId, npcId, visibleOptions]);

  useEffect(() => {
    setNodeId("start");
    setIsClosing(false);
    setLastNpcLine("");
    setLastPlayerLine("");
  }, [npcId]);

  useEffect(() => {
    if (!npcId) return;
    window.dispatchEvent(new CustomEvent("npc-dialogue-open", { detail: { npcId } }));
    return () => {
      window.dispatchEvent(new CustomEvent("npc-dialogue-close"));
    };
  }, [npcId]);

  useEffect(() => {
    if (!isTerminal) return;
    let fadeTimer: number | undefined;
    let closeTimer: number | undefined;
    fadeTimer = window.setTimeout(() => {
      setIsClosing(true);
      closeTimer = window.setTimeout(() => onClose(), 450);
    }, 5000);
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
      const option = displayOptions[idx];
      if (!option?.next) return;
      if (npcId) {
        window.dispatchEvent(
          new CustomEvent("dialogue-choice", { detail: { npcId, text: option.text } })
        );
      }
      setLastPlayerLine(option.text);
      setNodeId(option.next);
      setIsClosing(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [displayOptions, node, npcId]);

  useEffect(() => {
    if (!node) return;
    setLastNpcLine(renderedText);
  }, [nodeId, renderedText]);


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
            <div className="portrait-sparkles portrait-sparkles-back" aria-hidden="true">
              {PORTRAIT_SPARKLES.map((pos, idx) => (
                <span
                  key={`portrait-back-${idx}`}
                  className="portrait-sparkle portrait-sparkle-back"
                  style={{
                    ...pos,
                    animationDelay: `${0.05 + idx * 0.12}s`,
                    animationDuration: `${2 + (idx % 4)}s`,
                  }}
                />
              ))}
            </div>
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
        <div className="dialogue-body">{renderedText}</div>
        <div className="dialogue-options">
          {displayOptions.map((opt) => (
            <button
              key={opt.text}
              className="dialogue-option"
              onClick={() => {
                if (opt.next) {
                  if (npcId) {
                    window.dispatchEvent(
                      new CustomEvent("dialogue-choice", { detail: { npcId, text: opt.text } })
                    );
                  }
                  setLastPlayerLine(opt.text);
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
  const [hudPanelOpen, setHudPanelOpen] = useState(false);
  const [rpgPanelOpen, setRpgPanelOpen] = useState(false);

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

  useEffect(() => {
    const onPanelState = (evt: Event) => {
      const detail = (evt as CustomEvent<{ open?: boolean }>).detail;
      setHudPanelOpen(!!detail?.open);
    };
    window.addEventListener("hud-panel-state", onPanelState as EventListener);
    return () => window.removeEventListener("hud-panel-state", onPanelState as EventListener);
  }, []);

  useEffect(() => {
    const onRpgPanel = (evt: Event) => {
      const detail = (evt as CustomEvent<{ open?: boolean }>).detail;
      if (typeof detail?.open === "boolean") {
        setRpgPanelOpen(detail.open);
      } else {
        setRpgPanelOpen((prev) => !prev);
      }
    };
    window.addEventListener("rpg-panel", onRpgPanel as EventListener);
    return () => window.removeEventListener("rpg-panel", onRpgPanel as EventListener);
  }, []);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("rpg-panel-state", { detail: { open: rpgPanelOpen } }));
  }, [rpgPanelOpen]);

  const closeHudPanels = () => {
    setActiveTab(null);
    setRpgPanelOpen(false);
    window.dispatchEvent(new CustomEvent("hud-close"));
  };

  const overlayOpen = hudPanelOpen || rpgPanelOpen;

  return (
    <div className="hud-container" aria-hidden={false}>
      {overlayOpen && (
        <button
          type="button"
          className="hud-overlay"
          aria-label="Close HUD"
          onClick={closeHudPanels}
        />
      )}
      {/* Stats bars hidden per request */}
      <MenuTabs />
      <JournalPanel />
      <DialoguePanel npcId={activeNpc} onClose={() => setActiveNpc(null)} />
      <RpgSystemsPanel open={rpgPanelOpen} onClose={() => setRpgPanelOpen(false)} />
      <DebugPanel />
      <PerformanceMonitor />
      {/* Hotbar removed from UI per request */}
    </div>
  );
};

const HUD: React.FC = () => (
  <RpgProvider>
    <HUDProvider>
      <HUDInner />
    </HUDProvider>
  </RpgProvider>
);

export default HUD;
