// File: src/components/hud/Hotbar.tsx
import React from "react";

const Hotbar: React.FC = () => {
  const slots = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
  return (
    <div className="hotbar">
      {slots.map((slot) => (
        <button key={slot}>{slot}</button>
      ))}
    </div>
  );
};

export default Hotbar;
