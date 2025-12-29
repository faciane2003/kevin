import React, { useEffect, useRef, useState } from "react";
import "./HUD.css";

type MinimapBuilding = {
  x: number;
  z: number;
  width: number;
  depth: number;
};

type MinimapPayload = {
  buildings: MinimapBuilding[];
  roads: { x: number[]; z: number[] };
  signs: { x: number; z: number }[];
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const MiniMap: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [mapData, setMapData] = useState<MinimapPayload | null>(null);
  const [playerPos, setPlayerPos] = useState<{ x: number; z: number } | null>(null);

  useEffect(() => {
    const onMapData = (evt: Event) => {
      const detail = (evt as CustomEvent<MinimapPayload>).detail;
      if (detail?.buildings) setMapData(detail);
    };
    const onCamera = (evt: Event) => {
      const detail = (evt as CustomEvent<{ pos: { x: number; z: number } }>).detail;
      if (detail?.pos) setPlayerPos({ x: detail.pos.x, z: detail.pos.z });
    };
    window.addEventListener("minimap-data", onMapData as EventListener);
    window.addEventListener("camera-info", onCamera as EventListener);
    return () => {
      window.removeEventListener("minimap-data", onMapData as EventListener);
      window.removeEventListener("camera-info", onCamera as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!canvasRef.current || !mapData) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { buildings, roads, signs, bounds } = mapData;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = "#061018";
    ctx.fillRect(0, 0, w, h);

    const pad = 4;
    const spanX = bounds.maxX - bounds.minX;
    const spanZ = bounds.maxZ - bounds.minZ;
    const scaleX = (w - pad * 2) / (spanX || 1);
    const scaleZ = (h - pad * 2) / (spanZ || 1);
    const scale = Math.min(scaleX, scaleZ) * zoom;

    const toMap = (x: number, z: number) => {
      const mx = pad + (x - bounds.minX) * scale;
      const mz = pad + (z - bounds.minZ) * scale;
      return { x: mx, y: h - mz };
    };

    ctx.strokeStyle = "rgba(90,140,200,0.25)";
    ctx.lineWidth = 1;
    roads.z.forEach((z) => {
      const p1 = toMap(bounds.minX, z);
      const p2 = toMap(bounds.maxX, z);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    });
    roads.x.forEach((x) => {
      const p1 = toMap(x, bounds.minZ);
      const p2 = toMap(x, bounds.maxZ);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    });

    ctx.fillStyle = "rgba(190,210,230,0.6)";
    buildings.forEach((b) => {
      const p = toMap(b.x, b.z);
      const bw = b.width * scale;
      const bd = b.depth * scale;
      ctx.fillRect(p.x - bw / 2, p.y - bd / 2, bw, bd);
    });

    ctx.fillStyle = "rgba(255,200,120,0.85)";
    signs.forEach((s) => {
      const p = toMap(s.x, s.z);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    if (playerPos) {
      const p = toMap(playerPos.x, playerPos.z);
      ctx.fillStyle = "#20ffe0";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [mapData, playerPos, zoom]);

  return (
    <div className={`minimap${embedded ? " minimap-embedded" : ""}`}>
      <canvas ref={canvasRef} width={128} height={128} />
      <div className="minimap-controls">
        <button onClick={() => setZoom((z) => clamp(z + 0.1, 0.6, 2))}>+</button>
        <button onClick={() => setZoom((z) => clamp(z - 0.1, 0.6, 2))}>-</button>
      </div>
    </div>
  );
};

export default MiniMap;
