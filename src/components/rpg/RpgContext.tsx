import React, { createContext, useContext, useMemo, useState } from "react";

type InventoryItem = {
  id: string;
  name: string;
  count: number;
  weight: number;
  type: "material" | "consumable" | "key" | "quest" | "gear";
};

type FactionMap = Record<string, number>;

type RpgContextValue = {
  gold: number;
  setGold: React.Dispatch<React.SetStateAction<number>>;
  inventory: InventoryItem[];
  addItem: (item: InventoryItem) => void;
  removeItem: (id: string, count?: number) => boolean;
  capacity: number;
  weight: number;
  stamina: number;
  maxStamina: number;
  setStamina: React.Dispatch<React.SetStateAction<number>>;
  energy: number;
  maxEnergy: number;
  setEnergy: React.Dispatch<React.SetStateAction<number>>;
  factions: FactionMap;
  setFaction: (name: string, value: number) => void;
};

const RpgContext = createContext<RpgContextValue | null>(null);

const DEFAULT_INVENTORY: InventoryItem[] = [
  { id: "glowcell", name: "Glowcell", count: 4, weight: 0.4, type: "material" },
  { id: "keycard", name: "Keycard", count: 1, weight: 0.1, type: "key" },
  { id: "medkit", name: "Medkit", count: 2, weight: 0.6, type: "consumable" },
  { id: "scrap", name: "Scrap Metal", count: 6, weight: 0.3, type: "material" },
  { id: "focus", name: "Focus Lens", count: 1, weight: 0.2, type: "material" },
];

const DEFAULT_FACTIONS: FactionMap = {
  Arcadia: 15,
  NeonFold: 0,
  Greyline: -5,
  Verdant: 8,
};

export const RpgProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gold, setGold] = useState(120);
  const [inventory, setInventory] = useState<InventoryItem[]>(DEFAULT_INVENTORY);
  const [stamina, setStamina] = useState(90);
  const [energy, setEnergy] = useState(70);
  const [factions, setFactions] = useState<FactionMap>(DEFAULT_FACTIONS);
  const capacity = 60;
  const maxStamina = 100;
  const maxEnergy = 100;

  const addItem = (item: InventoryItem) => {
    setInventory((prev) => {
      const existing = prev.find((entry) => entry.id === item.id);
      if (existing) {
        return prev.map((entry) =>
          entry.id === item.id ? { ...entry, count: entry.count + item.count } : entry
        );
      }
      return [...prev, item];
    });
  };

  const removeItem = (id: string, count = 1) => {
    let removed = false;
    setInventory((prev) =>
      prev
        .map((entry) => {
          if (entry.id !== id) return entry;
          if (entry.count < count) return entry;
          removed = true;
          return { ...entry, count: entry.count - count };
        })
        .filter((entry) => entry.count > 0)
    );
    return removed;
  };

  const setFaction = (name: string, value: number) => {
    setFactions((prev) => ({ ...prev, [name]: value }));
  };

  const weight = useMemo(
    () => inventory.reduce((sum, item) => sum + item.weight * item.count, 0),
    [inventory]
  );

  return (
    <RpgContext.Provider
      value={{
        gold,
        setGold,
        inventory,
        addItem,
        removeItem,
        capacity,
        weight,
        stamina,
        maxStamina,
        setStamina,
        energy,
        maxEnergy,
        setEnergy,
        factions,
        setFaction,
      }}
    >
      {children}
    </RpgContext.Provider>
  );
};

export const useRpg = () => {
  const ctx = useContext(RpgContext);
  if (!ctx) {
    throw new Error("useRpg must be used inside RpgProvider");
  }
  return ctx;
};
