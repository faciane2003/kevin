import { useEffect, useRef } from "react";
import {
  Color4,
  DynamicTexture,
  ParticleSystem,
  Scene,
  Texture,
  Vector3,
} from "@babylonjs/core";

type RainSettings = {
  enabled: boolean;
  intensity: number;
  speed: number;
  dropSize: number;
  opacity: number;
  windX: number;
  windZ: number;
  height: number;
  radius: number;
};

const DEFAULTS: RainSettings = {
  enabled: false,
  intensity: 2200,
  speed: 50,
  dropSize: 0.2,
  opacity: 0.6,
  windX: 4,
  windZ: -2,
  height: 200,
  radius: 520,
};

const RainSystem: React.FC<{ scene: Scene | null }> = ({ scene }) => {
  const settingsRef = useRef<RainSettings>({ ...DEFAULTS });

  useEffect(() => {
    if (!scene) return;
    const emitter = new Vector3(0, 0, 0);
    const texture = new DynamicTexture("rainTex", { width: 2, height: 2 }, scene, false);
    const ctx = texture.getContext();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 2, 2);
    texture.update();

    const ps = new ParticleSystem("rainSystem", settingsRef.current.intensity, scene);
    ps.particleTexture = texture as unknown as Texture;
    ps.emitter = emitter;
    ps.minLifeTime = 1;
    ps.maxLifeTime = 2;
    ps.minEmitPower = 1;
    ps.maxEmitPower = 1;
    ps.gravity = new Vector3(0, -9.81, 0);
    ps.blendMode = ParticleSystem.BLENDMODE_STANDARD;
    ps.start();

    const applySettings = (s: RainSettings) => {
      ps.updateSpeed = 0.02;
      ps.emitRate = s.enabled ? s.intensity : 0;
      ps.minSize = s.dropSize * 0.6;
      ps.maxSize = s.dropSize * 1.2;
      const alpha = Math.max(0.05, Math.min(1, s.opacity));
      ps.color1 = new Color4(0.8, 0.9, 1.0, alpha);
      ps.color2 = new Color4(0.8, 0.9, 1.0, alpha);
      const speed = Math.max(1, s.speed);
      ps.direction1 = new Vector3(s.windX, -speed, s.windZ);
      ps.direction2 = new Vector3(s.windX, -speed * 0.8, s.windZ);
      const life = Math.max(0.6, s.height / speed);
      ps.minLifeTime = life * 0.8;
      ps.maxLifeTime = life * 1.1;
      const radius = Math.max(20, s.radius);
      ps.minEmitBox = new Vector3(-radius, 0, -radius);
      ps.maxEmitBox = new Vector3(radius, 0, radius);
    };

    applySettings(settingsRef.current);

    const onSettings = (evt: Event) => {
      const detail = (evt as CustomEvent<Partial<RainSettings>>).detail;
      if (!detail) return;
      settingsRef.current = { ...settingsRef.current, ...detail };
      applySettings(settingsRef.current);
    };
    window.addEventListener("rain-settings", onSettings as EventListener);

    const onRender = () => {
      const cam = scene.activeCamera;
      if (!cam) return;
      emitter.set(cam.position.x, cam.position.y + settingsRef.current.height, cam.position.z);
    };
    scene.onBeforeRenderObservable.add(onRender);

    return () => {
      scene.onBeforeRenderObservable.removeCallback(onRender);
      window.removeEventListener("rain-settings", onSettings as EventListener);
      ps.stop();
      ps.dispose();
      texture.dispose();
    };
  }, [scene]);

  return null;
};

export default RainSystem;
