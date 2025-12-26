import { useEffect } from "react";
import { DynamicTexture, Scene, StandardMaterial } from "@babylonjs/core";

type WindowRect = { x: number; y: number; w: number; h: number; lit: boolean };

type WindowMeta = {
  windowTex: DynamicTexture;
  windowRects: WindowRect[];
  windowOn: string;
  windowOff: string;
  ctx: CanvasRenderingContext2D;
};

type Props = {
  scene: Scene | null;
  materials: StandardMaterial[];
  intervalMs?: number;
};

const BuildingWindowFlicker: React.FC<Props> = ({ scene, materials, intervalMs = 1800 }) => {
  useEffect(() => {
    if (!scene || materials.length === 0) return;

    const updateMat = (mat: StandardMaterial) => {
      const meta = mat.metadata as WindowMeta | undefined;
      if (!meta?.windowRects?.length) return;

      const { windowRects, windowOn, windowOff, ctx, windowTex } = meta;
      const toggleCount = Math.max(1, Math.floor(windowRects.length * 0.25));
      for (let i = 0; i < toggleCount; i += 1) {
        const idx = Math.floor(Math.random() * windowRects.length);
        const rect = windowRects[idx];
        const lit = Math.random() > 0.5;
        rect.lit = lit;
        ctx.fillStyle = lit ? windowOn : windowOff;
        ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      }
      windowTex.update();
    };

    const timer = window.setInterval(() => {
      materials.forEach(updateMat);
    }, intervalMs);

    return () => {
      window.clearInterval(timer);
    };
  }, [scene, materials, intervalMs]);

  return null;
};

export default BuildingWindowFlicker;
