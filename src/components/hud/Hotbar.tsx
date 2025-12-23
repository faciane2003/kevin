// src/components/hud/Hotbar.tsx
import React from "react";
import { useHUD } from "./HUDContext";

const Hotbar: React.FC = () => {
  const { hotbar, activeSlot, setActiveSlot } = useHUD();
  return (
    <div className="hotbar" role="toolbar" aria-label="Hotbar">
      {hotbar.map((item, idx) => {
        const isActive = activeSlot === idx;
        return (
          <button
            key={item?.id ?? idx}
            className={`hotbar-slot ${isActive ? "active" : ""}`}
            onMouseDown={() => {
              setActiveSlot(idx);
              setTimeout(() => setActiveSlot(null), 120);
            }}
            aria-pressed={isActive}
            title={item?.name ?? `Slot ${idx + 1}`}>
            <div className="hotbar-top">{item?.icon ? <img src={item.icon} alt={item?.name ?? ""} /> : <span>{idx === 9 ? "0" : idx + 1}</span>}</div>
            <div className="cooldown-overlay" style={{ width: `${(item?.cooldown ?? 0) * 100}%` }} />
          </button>
        );
      })}
    </div>
  );
};

export default Hotbar;
