import React, { useEffect, useState } from "react";
import "./HUD.css";

const IntroLightning: React.FC = () => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), 3200);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="intro-lightning" aria-hidden="true">
      <div className="intro-lightning-bg" />
      <div className="intro-border intro-border-left" />
      <div className="intro-border intro-border-right" />
      <div className="intro-arc intro-arc-left" />
      <div className="intro-arc intro-arc-right" />
      <div className="intro-flash" />
      <div className="intro-sparks">
        {Array.from({ length: 14 }).map((_, idx) => (
          <span key={idx} className="intro-spark" style={{ animationDelay: `${idx * 0.08}s` }} />
        ))}
      </div>
    </div>
  );
};

export default IntroLightning;
