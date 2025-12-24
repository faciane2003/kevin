import React, { useEffect, useState } from "react";
import "./HUD.css";

const Compass: React.FC = () => {
  const [heading, setHeading] = useState(0);

  useEffect(() => {
    const onHeading = (evt: Event) => {
      const detail = (evt as CustomEvent<{ heading: number }>).detail;
      if (detail && typeof detail.heading === "number") {
        setHeading(detail.heading);
      }
    };
    window.addEventListener("player-heading", onHeading as EventListener);
    return () => window.removeEventListener("player-heading", onHeading as EventListener);
  }, []);

  return (
    <div className="compass" aria-label="Compass">
      <div className="compass-ring" style={{ transform: `rotate(${-heading}deg)` }}>
        <span className="compass-letter north">N</span>
        <span className="compass-letter east">E</span>
        <span className="compass-letter south">S</span>
        <span className="compass-letter west">W</span>
      </div>
      <div className="compass-needle" />
    </div>
  );
};

export default Compass;
