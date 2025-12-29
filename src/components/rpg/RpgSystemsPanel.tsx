import React, { useEffect, useMemo, useState } from "react";
import { useRpg } from "./RpgContext";
import "../hud/HUD.css";

type WorldEvent = {
  id: string;
  name: string;
  description: string;
  remaining: number;
  active: boolean;
};

type Buff = {
  id: string;
  name: string;
  duration: number;
  remaining: number;
};

type StatusEffect = {
  id: string;
  name: string;
  severity: "minor" | "moderate" | "severe";
  duration: number;
  remaining: number;
};

type Companion = {
  id: string;
  name: string;
  role: string;
  active: boolean;
};

type Pet = {
  id: string;
  name: string;
  stage: number;
  xp: number;
  maxXp: number;
};

type Mount = {
  id: string;
  name: string;
  speed: number;
  staminaBonus: number;
  active: boolean;
};

type Skill = {
  id: string;
  name: string;
  rank: number;
  maxRank: number;
};

type Quest = {
  id: string;
  title: string;
  objective: string;
  status: "active" | "complete";
};

type Landmark = {
  id: string;
  name: string;
  unlocked: boolean;
};

type MailItem = {
  id: string;
  subject: string;
  reward: { id: string; name: string; count: number; weight: number; type: "material" | "consumable" | "key" | "quest" | "gear" };
  claimed: boolean;
};

type Cosmetic = {
  id: string;
  name: string;
  slot: "mask" | "jacket" | "boots" | "cloak";
  owned: boolean;
  equipped: boolean;
};

type HousingModule = {
  id: string;
  name: string;
  level: number;
};

type MiniGame = {
  id: string;
  name: string;
  plays: number;
  bestScore: number;
};

type StoryChapter = {
  id: string;
  name: string;
  unlocked: boolean;
  requirement: string;
};

type Recipe = {
  id: string;
  name: string;
  inputs: Array<{ id: string; name: string; count: number }>;
  output: { id: string; name: string; count: number; weight: number; type: "material" | "consumable" | "key" | "quest" | "gear" };
};

type GearItem = {
  id: string;
  name: string;
  level: number;
  maxLevel: number;
};

type LootChest = {
  id: string;
  name: string;
  requiresKey: boolean;
  opened: boolean;
  reward: { id: string; name: string; count: number; weight: number; type: "material" | "consumable" | "key" | "quest" | "gear" };
};

const BASE_EVENTS: WorldEvent[] = [
  { id: "relay", name: "Relay Surge", description: "Stabilize the street relay nodes.", remaining: 180, active: false },
  { id: "blackout", name: "Sector Blackout", description: "Restore lights across the district.", remaining: 210, active: false },
  { id: "raid", name: "Supply Raid", description: "Defend the caravan from raiders.", remaining: 150, active: false },
];

const RECIPES: Recipe[] = [
  {
    id: "medkit_plus",
    name: "Medkit Plus",
    inputs: [
      { id: "medkit", name: "Medkit", count: 1 },
      { id: "scrap", name: "Scrap Metal", count: 2 },
    ],
    output: { id: "medkit_plus", name: "Medkit Plus", count: 1, weight: 0.8, type: "consumable" },
  },
  {
    id: "glowcell_pack",
    name: "Glowcell Pack",
    inputs: [
      { id: "glowcell", name: "Glowcell", count: 2 },
      { id: "focus", name: "Focus Lens", count: 1 },
    ],
    output: { id: "glowcell_pack", name: "Glowcell Pack", count: 1, weight: 0.5, type: "material" },
  },
];

const GEAR_ITEMS: GearItem[] = [
  { id: "neon_blade", name: "Neon Blade", level: 1, maxLevel: 5 },
  { id: "pulse_rig", name: "Pulse Rig", level: 2, maxLevel: 7 },
  { id: "warden_armor", name: "Warden Armor", level: 1, maxLevel: 6 },
];

const CHESTS: LootChest[] = [
  {
    id: "chest_alpha",
    name: "Alpha Cache",
    requiresKey: true,
    opened: false,
    reward: { id: "credit", name: "Credit Bundle", count: 120, weight: 0, type: "quest" },
  },
  {
    id: "chest_beta",
    name: "Neon Crate",
    requiresKey: false,
    opened: false,
    reward: { id: "focus", name: "Focus Lens", count: 2, weight: 0.2, type: "material" },
  },
];

const COMPANIONS: Companion[] = [
  { id: "shade", name: "Shade", role: "Scout", active: true },
  { id: "nova", name: "Nova", role: "Support", active: false },
  { id: "raze", name: "Raze", role: "Bruiser", active: false },
];

const PETS: Pet[] = [
  { id: "sparkkit", name: "Sparkkit", stage: 1, xp: 0, maxXp: 100 },
  { id: "wirehound", name: "Wirehound", stage: 2, xp: 30, maxXp: 120 },
];

const MOUNTS: Mount[] = [
  { id: "hover", name: "Hoverhound", speed: 12, staminaBonus: 15, active: true },
  { id: "runner", name: "Metro Runner", speed: 9, staminaBonus: 10, active: false },
];

const SKILL_TREE: Skill[] = [
  { id: "dash", name: "Pulse Dash", rank: 1, maxRank: 4 },
  { id: "shield", name: "Photon Shield", rank: 0, maxRank: 3 },
  { id: "scan", name: "Street Scan", rank: 2, maxRank: 5 },
];

const CLASSES = ["Courier", "Riftblade", "Signal Witch", "Neon Ranger"];

const BUFFS: Buff[] = [
  { id: "focus", name: "Focus Brew", duration: 120, remaining: 0 },
  { id: "speed", name: "Slipstream Syrup", duration: 90, remaining: 0 },
];

const STATUS_EFFECTS: StatusEffect[] = [
  { id: "slow", name: "Slow", severity: "moderate", duration: 15, remaining: 0 },
  { id: "burn", name: "Burn", severity: "severe", duration: 8, remaining: 0 },
];

const LANDMARKS: Landmark[] = [
  { id: "core", name: "Core Plaza", unlocked: true },
  { id: "bridge", name: "Neon Bridge", unlocked: false },
  { id: "market", name: "Undercity Market", unlocked: false },
];

const MAIL: MailItem[] = [
  {
    id: "daily",
    subject: "Daily drop",
    reward: { id: "glowcell", name: "Glowcell", count: 2, weight: 0.4, type: "material" },
    claimed: false,
  },
  {
    id: "event",
    subject: "Event thanks",
    reward: { id: "keycard", name: "Keycard", count: 1, weight: 0.1, type: "key" },
    claimed: false,
  },
];

const COSMETICS: Cosmetic[] = [
  { id: "mask_ember", name: "Ember Mask", slot: "mask", owned: true, equipped: true },
  { id: "jacket_ion", name: "Ion Jacket", slot: "jacket", owned: false, equipped: false },
  { id: "boots_rail", name: "Rail Boots", slot: "boots", owned: true, equipped: false },
  { id: "cloak_mist", name: "Mist Cloak", slot: "cloak", owned: false, equipped: false },
];

const HOUSING: HousingModule[] = [
  { id: "core_room", name: "Core Room", level: 2 },
  { id: "armory", name: "Armory", level: 1 },
  { id: "garden", name: "Hydro Garden", level: 1 },
];

const MINI_GAMES: MiniGame[] = [
  { id: "lockpick", name: "Lockpick", plays: 0, bestScore: 0 },
  { id: "signal", name: "Signal Match", plays: 0, bestScore: 0 },
  { id: "drone", name: "Drone Hack", plays: 0, bestScore: 0 },
];

const STORY_CHAPTERS: StoryChapter[] = [
  { id: "ch1", name: "Chapter 1: Signal Lost", unlocked: true, requirement: "Complete tutorial." },
  { id: "ch2", name: "Chapter 2: Neon Rift", unlocked: false, requirement: "Reach level 5." },
  { id: "ch3", name: "Chapter 3: The Overlook", unlocked: false, requirement: "Complete 3 side quests." },
];

const RpgSystemsPanel: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { inventory, addItem, removeItem, factions, setFaction, stamina, setStamina, energy, setEnergy, weight } =
    useRpg();
  const [events, setEvents] = useState<WorldEvent[]>(BASE_EVENTS);
  const [gear, setGear] = useState<GearItem[]>(GEAR_ITEMS);
  const [chests, setChests] = useState<LootChest[]>(CHESTS);
  const [companions, setCompanions] = useState<Companion[]>(COMPANIONS);
  const [pets, setPets] = useState<Pet[]>(PETS);
  const [mounts, setMounts] = useState<Mount[]>(MOUNTS);
  const [skills, setSkills] = useState<Skill[]>(SKILL_TREE);
  const [skillPoints, setSkillPoints] = useState(6);
  const [classSpec, setClassSpec] = useState(CLASSES[0]);
  const [buffs, setBuffs] = useState<Buff[]>(BUFFS);
  const [effects, setEffects] = useState<StatusEffect[]>(STATUS_EFFECTS);
  const [sideQuests, setSideQuests] = useState<Quest[]>([]);
  const [landmarks, setLandmarks] = useState<Landmark[]>(LANDMARKS);
  const [mail, setMail] = useState<MailItem[]>(MAIL);
  const [collection, setCollection] = useState<string[]>([]);
  const [cosmetics, setCosmetics] = useState<Cosmetic[]>(COSMETICS);
  const [housing, setHousing] = useState<HousingModule[]>(HOUSING);
  const [miniGames, setMiniGames] = useState<MiniGame[]>(MINI_GAMES);
  const [chapters, setChapters] = useState<StoryChapter[]>(STORY_CHAPTERS);

  const inventorySlots = 30;
  const slotsUsed = inventory.length;

  const startEvent = (id: string) => {
    setEvents((prev) =>
      prev.map((evt) =>
        evt.id === id
          ? { ...evt, active: true, remaining: 180 + Math.floor(Math.random() * 90) }
          : evt
      )
    );
  };

  const craftRecipe = (recipe: Recipe) => {
    const hasAll = recipe.inputs.every((input) =>
      inventory.some((item) => item.id === input.id && item.count >= input.count)
    );
    if (!hasAll) return;
    recipe.inputs.forEach((input) => removeItem(input.id, input.count));
    addItem(recipe.output);
    setCollection((prev) => (prev.includes(recipe.output.name) ? prev : [...prev, recipe.output.name]));
  };

  const upgradeGear = (id: string) => {
    setGear((prev) =>
      prev.map((item) =>
        item.id === id && item.level < item.maxLevel ? { ...item, level: item.level + 1 } : item
      )
    );
  };

  const openChest = (id: string) => {
    setChests((prev) =>
      prev.map((chest) => {
        if (chest.id !== id || chest.opened) return chest;
        if (chest.requiresKey && !inventory.some((item) => item.id === "keycard" && item.count > 0)) {
          return chest;
        }
        if (chest.requiresKey) removeItem("keycard", 1);
        addItem(chest.reward);
        setCollection((items) =>
          items.includes(chest.reward.name) ? items : [...items, chest.reward.name]
        );
        return { ...chest, opened: true };
      })
    );
  };

  const toggleCompanion = (id: string) => {
    setCompanions((prev) => prev.map((c) => ({ ...c, active: c.id === id })));
  };

  const feedPet = (id: string) => {
    setPets((prev) =>
      prev.map((pet) => {
        if (pet.id !== id) return pet;
        const nextXp = pet.xp + 25;
        return { ...pet, xp: Math.min(nextXp, pet.maxXp) };
      })
    );
  };

  const evolvePet = (id: string) => {
    setPets((prev) =>
      prev.map((pet) => {
        if (pet.id !== id) return pet;
        if (pet.xp < pet.maxXp) return pet;
        return { ...pet, stage: pet.stage + 1, xp: 0, maxXp: pet.maxXp + 40 };
      })
    );
  };

  const setActiveMount = (id: string) => {
    setMounts((prev) => prev.map((m) => ({ ...m, active: m.id === id })));
  };

  const trainMount = (id: string) => {
    setMounts((prev) =>
      prev.map((m) => (m.id === id ? { ...m, speed: m.speed + 1 } : m))
    );
  };

  const spendSkillPoint = (id: string) => {
    if (skillPoints <= 0) return;
    setSkills((prev) =>
      prev.map((skill) => {
        if (skill.id !== id || skill.rank >= skill.maxRank) return skill;
        return { ...skill, rank: skill.rank + 1 };
      })
    );
    setSkillPoints((prev) => prev - 1);
  };

  const applyBuff = (id: string) => {
    setBuffs((prev) =>
      prev.map((buff) => (buff.id === id ? { ...buff, remaining: buff.duration } : buff))
    );
  };

  const applyEffect = (id: string) => {
    setEffects((prev) =>
      prev.map((effect) =>
        effect.id === id ? { ...effect, remaining: effect.duration } : effect
      )
    );
  };

  const generateSideQuest = () => {
    const seed = Math.floor(Math.random() * 9999);
    const quest: Quest = {
      id: `quest_${seed}`,
      title: `Side Quest ${seed}`,
      objective: Math.random() > 0.5 ? "Investigate the alley relay." : "Deliver supplies to outpost.",
      status: "active",
    };
    setSideQuests((prev) => [quest, ...prev].slice(0, 5));
  };

  const completeQuest = (id: string) => {
    setSideQuests((prev) =>
      prev.map((quest) => (quest.id === id ? { ...quest, status: "complete" } : quest))
    );
  };

  const unlockLandmark = (id: string) => {
    setLandmarks((prev) => prev.map((lm) => (lm.id === id ? { ...lm, unlocked: true } : lm)));
  };

  const travelTo = (id: string) => {
    const target = landmarks.find((lm) => lm.id === id && lm.unlocked);
    if (!target) return;
    window.dispatchEvent(new CustomEvent("fast-travel", { detail: { id, name: target.name } }));
  };

  const claimMail = (id: string) => {
    setMail((prev) =>
      prev.map((item) => {
        if (item.id !== id || item.claimed) return item;
        addItem(item.reward);
        return { ...item, claimed: true };
      })
    );
  };

  const toggleCosmetic = (id: string) => {
    setCosmetics((prev) =>
      prev.map((item) => {
        if (item.id !== id || !item.owned) return item;
        return { ...item, equipped: !item.equipped };
      })
    );
  };

  const upgradeHousing = (id: string) => {
    setHousing((prev) => prev.map((room) => (room.id === id ? { ...room, level: room.level + 1 } : room)));
  };

  const playMiniGame = (id: string) => {
    setMiniGames((prev) =>
      prev.map((game) => {
        if (game.id !== id) return game;
        const score = Math.floor(50 + Math.random() * 200);
        return {
          ...game,
          plays: game.plays + 1,
          bestScore: Math.max(game.bestScore, score),
        };
      })
    );
  };

  const unlockChapter = (id: string) => {
    setChapters((prev) =>
      prev.map((chapter) => (chapter.id === id ? { ...chapter, unlocked: true } : chapter))
    );
  };

  useEffect(() => {
    if (!open) return;
    const timer = window.setInterval(() => {
      setEvents((prev) =>
        prev.map((evt) =>
          evt.active ? { ...evt, remaining: Math.max(0, evt.remaining - 1), active: evt.remaining > 1 } : evt
        )
      );
      setBuffs((prev) =>
        prev.map((buff) => (buff.remaining > 0 ? { ...buff, remaining: buff.remaining - 1 } : buff))
      );
      setEffects((prev) =>
        prev.map((effect) =>
          effect.remaining > 0 ? { ...effect, remaining: effect.remaining - 1 } : effect
        )
      );
      setStamina((prev) => Math.min(100, prev + 1));
      setEnergy((prev) => Math.min(100, prev + 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [open, setEnergy, setStamina]);

  useEffect(() => {
    const onChoice = (evt: Event) => {
      const detail = (evt as CustomEvent<{ npcId: string; text: string }>).detail;
      if (!detail) return;
      const factionKey = detail.npcId === "aria" ? "Arcadia" : detail.npcId === "kade" ? "NeonFold" : "Greyline";
      const delta = detail.text.toLowerCase().includes("help") || detail.text.toLowerCase().includes("deal") ? 2 : -1;
      setFaction(factionKey, (factions[factionKey] ?? 0) + delta);
    };
    window.addEventListener("dialogue-choice", onChoice as EventListener);
    return () => window.removeEventListener("dialogue-choice", onChoice as EventListener);
  }, [factions, setFaction]);

  const weightLabel = useMemo(() => `${weight.toFixed(1)} / ${inventorySlots}`, [weight, inventorySlots]);

  if (!open) return null;

  return (
    <div className="rpg-panel">
      <div className="rpg-panel-header">
        <span>RPG Systems</span>
        <button onClick={onClose}>Close</button>
      </div>

      <div className="rpg-section">
        <h4>Stamina / Energy</h4>
        <div className="rpg-row">Stamina: {stamina.toFixed(0)} / 100</div>
        <div className="rpg-row">Energy: {energy.toFixed(0)} / 100</div>
        <div className="rpg-row">
          <button onClick={() => setStamina((prev) => Math.max(0, prev - 15))}>Use Stamina</button>
          <button onClick={() => setEnergy((prev) => Math.max(0, prev - 12))}>Use Energy</button>
        </div>
      </div>

      <div className="rpg-section">
        <h4>Dynamic World Events</h4>
        {events.map((evt) => (
          <div key={evt.id} className="rpg-row">
            <span>{evt.name}</span>
            <span>{evt.active ? `${evt.remaining}s` : "Idle"}</span>
            <button onClick={() => startEvent(evt.id)}>Start</button>
          </div>
        ))}
      </div>

      <div className="rpg-section">
        <h4>Crafting Recipes</h4>
        {RECIPES.map((recipe) => (
          <div key={recipe.id} className="rpg-row">
            <span>{recipe.name}</span>
            <button onClick={() => craftRecipe(recipe)}>Craft</button>
          </div>
        ))}
      </div>

      <div className="rpg-section">
        <h4>Gear Upgrades</h4>
        {gear.map((item) => (
          <div key={item.id} className="rpg-row">
            <span>{item.name} Lv {item.level}</span>
            <button onClick={() => upgradeGear(item.id)} disabled={item.level >= item.maxLevel}>
              Upgrade
            </button>
          </div>
        ))}
      </div>

      <div className="rpg-section">
        <h4>Loot Chests</h4>
        {chests.map((chest) => (
          <div key={chest.id} className="rpg-row">
            <span>{chest.name}</span>
            <button onClick={() => openChest(chest.id)} disabled={chest.opened}>
              {chest.opened ? "Opened" : "Open"}
            </button>
          </div>
        ))}
      </div>

      <div className="rpg-section">
        <h4>Faction Reputation</h4>
        {Object.entries(factions).map(([name, value]) => (
          <div key={name} className="rpg-row">
            <span>{name}</span>
            <span>{value}</span>
          </div>
        ))}
      </div>

      <div className="rpg-section">
        <h4>Companions / Pets</h4>
        {companions.map((comp) => (
          <div key={comp.id} className="rpg-row">
            <span>{comp.name}</span>
            <button onClick={() => toggleCompanion(comp.id)}>{comp.active ? "Active" : "Set Active"}</button>
          </div>
        ))}
        {pets.map((pet) => (
          <div key={pet.id} className="rpg-row">
            <span>{pet.name} (Stage {pet.stage})</span>
            <button onClick={() => feedPet(pet.id)}>Feed</button>
            <button onClick={() => evolvePet(pet.id)} disabled={pet.xp < pet.maxXp}>
              Evolve
            </button>
          </div>
        ))}
      </div>

      <div className="rpg-section">
        <h4>Mounts</h4>
        {mounts.map((mount) => (
          <div key={mount.id} className="rpg-row">
            <span>{mount.name}</span>
            <button onClick={() => setActiveMount(mount.id)}>{mount.active ? "Active" : "Mount"}</button>
            <button onClick={() => trainMount(mount.id)}>Train</button>
          </div>
        ))}
      </div>

      <div className="rpg-section">
        <h4>Skill Tree</h4>
        <div className="rpg-row">Points: {skillPoints}</div>
        {skills.map((skill) => (
          <div key={skill.id} className="rpg-row">
            <span>{skill.name} ({skill.rank}/{skill.maxRank})</span>
            <button onClick={() => spendSkillPoint(skill.id)} disabled={skillPoints <= 0}>
              Upgrade
            </button>
          </div>
        ))}
      </div>

      <div className="rpg-section">
        <h4>Class Specialization</h4>
        {CLASSES.map((cls) => (
          <div key={cls} className="rpg-row">
            <span>{cls}</span>
            <button onClick={() => setClassSpec(cls)}>{classSpec === cls ? "Selected" : "Select"}</button>
          </div>
        ))}
      </div>

      <div className="rpg-section">
        <h4>Consumable Buffs</h4>
        {buffs.map((buff) => (
          <div key={buff.id} className="rpg-row">
            <span>{buff.name}</span>
            <span>{buff.remaining > 0 ? `${buff.remaining}s` : "Idle"}</span>
            <button onClick={() => applyBuff(buff.id)}>Use</button>
          </div>
        ))}
      </div>

      <div className="rpg-section">
        <h4>Status Effects</h4>
        {effects.map((effect) => (
          <div key={effect.id} className="rpg-row">
            <span>{effect.name}</span>
            <span>{effect.remaining > 0 ? `${effect.remaining}s` : "Idle"}</span>
            <button onClick={() => applyEffect(effect.id)}>Apply</button>
          </div>
        ))}
      </div>

      <div className="rpg-section">
        <h4>Procedural Side Quests</h4>
        <button onClick={generateSideQuest}>Generate</button>
        {sideQuests.map((quest) => (
          <div key={quest.id} className="rpg-row">
            <span>{quest.title}</span>
            <button onClick={() => completeQuest(quest.id)} disabled={quest.status === "complete"}>
              {quest.status === "complete" ? "Complete" : "Complete Quest"}
            </button>
          </div>
        ))}
      </div>

      <div className="rpg-section">
        <h4>Landmark Fast Travel</h4>
        {landmarks.map((lm) => (
          <div key={lm.id} className="rpg-row">
            <span>{lm.name}</span>
            <button onClick={() => (lm.unlocked ? travelTo(lm.id) : unlockLandmark(lm.id))}>
              {lm.unlocked ? "Travel" : "Unlock"}
            </button>
          </div>
        ))}
      </div>

      <div className="rpg-section">
        <h4>Inventory Weight / Slots</h4>
        <div className="rpg-row">Weight: {weightLabel}</div>
        <div className="rpg-row">Slots: {slotsUsed} / {inventorySlots}</div>
      </div>

      <div className="rpg-section">
        <h4>Mail System</h4>
        {mail.map((item) => (
          <div key={item.id} className="rpg-row">
            <span>{item.subject}</span>
            <button onClick={() => claimMail(item.id)} disabled={item.claimed}>
              {item.claimed ? "Claimed" : "Claim"}
            </button>
          </div>
        ))}
      </div>

      <div className="rpg-section">
        <h4>Collection / Logbook</h4>
        <div className="rpg-row">Discovered: {collection.length}</div>
      </div>

      <div className="rpg-section">
        <h4>Cosmetics / Skins</h4>
        {cosmetics.map((skin) => (
          <div key={skin.id} className="rpg-row">
            <span>{skin.name}</span>
            <button onClick={() => toggleCosmetic(skin.id)} disabled={!skin.owned}>
              {skin.equipped ? "Equipped" : skin.owned ? "Equip" : "Locked"}
            </button>
          </div>
        ))}
      </div>

      <div className="rpg-section">
        <h4>Housing / Base</h4>
        {housing.map((room) => (
          <div key={room.id} className="rpg-row">
            <span>{room.name} Lv {room.level}</span>
            <button onClick={() => upgradeHousing(room.id)}>Upgrade</button>
          </div>
        ))}
      </div>

      <div className="rpg-section">
        <h4>Mini-games</h4>
        {miniGames.map((game) => (
          <div key={game.id} className="rpg-row">
            <span>{game.name}</span>
            <button onClick={() => playMiniGame(game.id)}>Play</button>
          </div>
        ))}
      </div>

      <div className="rpg-section">
        <h4>Story Chapters</h4>
        {chapters.map((chapter) => (
          <div key={chapter.id} className="rpg-row">
            <span>{chapter.name}</span>
            <button onClick={() => unlockChapter(chapter.id)} disabled={chapter.unlocked}>
              {chapter.unlocked ? "Unlocked" : "Unlock"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RpgSystemsPanel;
