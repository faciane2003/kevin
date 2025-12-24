// src/components/hud/HUDContext.tsx
import React, { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

type HotbarItem = { id: string; name?: string; icon?: string; cooldown?: number } | null;

type HUDState = {
  health: number;
  mana: number;
  xp: number;
  hotbar: HotbarItem[];
  inventory: string[];
  activeTab: string | null;
  activeSlot: number | null;
  setHealth: (v: number) => void;
  setMana: (v: number) => void;
  setXp: (v: number) => void;
  addInventoryItem: (item: string) => void;
  setActiveTab: React.Dispatch<React.SetStateAction<string | null>>;
  setActiveSlot: React.Dispatch<React.SetStateAction<number | null>>;
};

const defaultItems: HotbarItem[] = new Array(10).fill(null).map((_, i) => ({
  id: String(i + 1),
  name: i === 0 ? "Heal" : undefined,
  icon: undefined,
  cooldown: 0,
}));
const defaultInventory: string[] = [
  "Not much toilet paper",
  "SEPTA Transit Keycard",
  "Two Joints",
  "Half a pound of bananas and peanut butter (each)",
];

const HUDContext = createContext<HUDState | undefined>(undefined);

export const HUDProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [health, setHealth] = useState(70);
  const [mana, setMana] = useState(50);
  const [xp, setXp] = useState(30);
  const [hotbar, _setHotbar] = useState<HotbarItem[]>(defaultItems);
  const [inventory, setInventory] = useState<string[]>(defaultInventory);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const addInventoryItem = (item: string) => setInventory((items) => [item, ...items]);

  return (
    <HUDContext.Provider
      value={{
        health,
        setHealth,
        mana,
        setMana,
        xp,
        setXp,
        hotbar,
        inventory,
        activeTab,
        setActiveTab,
        activeSlot,
        setActiveSlot,
        addInventoryItem,
      }}
    >
      {children}
    </HUDContext.Provider>
  );
};

export const useHUD = () => {
  const ctx = useContext(HUDContext);
  if (!ctx) throw new Error("useHUD must be used within HUDProvider");
  return ctx;
};
