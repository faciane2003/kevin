// File: src/components/hud/Hotbar.tsx
import React from "react";
import "./HUD.css";

const Hotbar: React.FC = () => {
  const items = ["1", "2", "3", "4", "5", "6", "7", "8"];

  return (
    <div className="hotbar">
      {items.map((item) => (
        <button key={item}>{item}</button>
      ))}
    </div>
  );
};

export default Hotbar;
