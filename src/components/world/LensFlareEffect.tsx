import { useEffect } from "react";
import {
  Color3,
  LensFlare,
  LensFlareSystem,
  Scene,
} from "@babylonjs/core";

type Props = {
  scene: Scene | null;
  enabled: boolean;
};

const createFlareTexture = (size: number, inner: string, outer: string) => {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  const grad = ctx.createRadialGradient(size / 2, size / 2, size * 0.05, size / 2, size / 2, size / 2);
  grad.addColorStop(0, inner);
  grad.addColorStop(1, outer);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return canvas.toDataURL("image/png");
};

const LensFlareEffect: React.FC<Props> = ({ scene, enabled }) => {
  useEffect(() => {
    if (!scene || !enabled) return;
    const emitter = scene.getMeshByName("moon") ?? scene.activeCamera;
    if (!emitter) return;
    const system = new LensFlareSystem("moonFlare", emitter, scene);
    const coreUrl = createFlareTexture(256, "rgba(255,255,255,0.85)", "rgba(255,255,255,0)");
    const ringUrl = createFlareTexture(256, "rgba(120,160,255,0.4)", "rgba(120,160,255,0)");
    const haloUrl = createFlareTexture(256, "rgba(255,200,120,0.25)", "rgba(255,200,120,0)");

    new LensFlare(0.38, 0.0, new Color3(1, 1, 1), coreUrl, system);
    new LensFlare(0.2, 0.35, new Color3(0.6, 0.75, 1.0), ringUrl, system);
    new LensFlare(0.14, 0.65, new Color3(1.0, 0.85, 0.6), haloUrl, system);
    new LensFlare(0.08, 0.9, new Color3(0.8, 0.9, 1.0), ringUrl, system);

    return () => {
      system.dispose();
    };
  }, [scene, enabled]);

  return null;
};

export default LensFlareEffect;
