import { useEffect, useRef } from "react";
import {
  AbstractMesh,
  Color3,
  Mesh,
  MeshBuilder,
  PBRMaterial,
  Scene,
  SpotLight,
  StandardMaterial,
  TransformNode,
  Vector3,
} from "@babylonjs/core";

const randRange = (min: number, max: number) => min + Math.random() * (max - min);

type CameraBobProps = {
  scene: Scene | null;
  camera: { position: Vector3 } | null;
  enabled: boolean;
  amount?: number;
  speed?: number;
};

export const CameraBob: React.FC<CameraBobProps> = ({
  scene,
  camera,
  enabled,
  amount = 0.08,
  speed = 1.6,
}) => {
  const lastBob = useRef(0);
  useEffect(() => {
    if (!scene || !camera || !enabled) return;
    const start = performance.now();
    const obs = scene.onBeforeRenderObservable.add(() => {
      const t = (performance.now() - start) / 1000;
      const bob = Math.sin(t * speed * Math.PI * 2) * amount;
      camera.position.y += bob - lastBob.current;
      lastBob.current = bob;
    });
    return () => {
      scene.onBeforeRenderObservable.remove(obs);
      if (camera) camera.position.y -= lastBob.current;
      lastBob.current = 0;
    };
  }, [scene, camera, enabled, amount, speed]);
  return null;
};

type AOProps = {
  scene: Scene | null;
  enabled: boolean;
  buildings: Array<{ mesh: AbstractMesh; width: number; depth: number }>;
  opacity?: number;
  coverage?: number;
};

export const AmbientOcclusionDecals: React.FC<AOProps> = ({
  scene,
  enabled,
  buildings,
  opacity = 0.3,
  coverage = 0.35,
}) => {
  useEffect(() => {
    if (!scene || !enabled || buildings.length === 0) return;
    const root = new TransformNode("ao_decals_root", scene);
    const mat = new StandardMaterial("aoDecalMat", scene);
    mat.diffuseColor = new Color3(0, 0, 0);
    mat.alpha = opacity;
    mat.backFaceCulling = false;
    const decals: Mesh[] = [];
    buildings.forEach((b, idx) => {
      if (Math.random() > coverage) return;
      const width = Math.max(2, b.width * 1.05);
      const depth = Math.max(2, b.depth * 1.05);
      const decal = MeshBuilder.CreateGround(`ao_decal_${idx}`, { width, height: depth }, scene);
      decal.position = new Vector3(b.mesh.position.x, 0.02, b.mesh.position.z);
      decal.material = mat;
      decal.parent = root;
      decal.isPickable = false;
      decals.push(decal);
    });
    return () => {
      decals.forEach((d) => d.dispose());
      mat.dispose();
      root.dispose();
    };
  }, [scene, enabled, buildings, opacity, coverage]);
  return null;
};

type PuddleProps = {
  scene: Scene | null;
  enabled: boolean;
  count?: number;
  radius?: number;
};

export const PuddleDecals: React.FC<PuddleProps> = ({ scene, enabled, count = 40, radius = 600 }) => {
  useEffect(() => {
    if (!scene || !enabled) return;
    const root = new TransformNode("puddle_root", scene);
    const mat = new PBRMaterial("puddleMat", scene);
    mat.albedoColor = new Color3(0.05, 0.05, 0.06);
    mat.metallic = 0.9;
    mat.roughness = 0.1;
    mat.alpha = 0.35;
    const puddles: Mesh[] = [];
    for (let i = 0; i < count; i += 1) {
      const size = randRange(2, 6);
      const puddle = MeshBuilder.CreateGround(`puddle_${i}`, { width: size, height: size }, scene);
      puddle.position = new Vector3(randRange(-radius, radius), 0.03, randRange(-radius, radius));
      puddle.rotation.y = randRange(0, Math.PI * 2);
      puddle.material = mat;
      puddle.parent = root;
      puddle.isPickable = false;
      puddles.push(puddle);
    }
    return () => {
      puddles.forEach((p) => p.dispose());
      mat.dispose();
      root.dispose();
    };
  }, [scene, enabled, count, radius]);
  return null;
};

type LightConeProps = {
  scene: Scene | null;
  enabled: boolean;
  count?: number;
  radius?: number;
};

export const LightCones: React.FC<LightConeProps> = ({ scene, enabled, count = 24, radius = 520 }) => {
  useEffect(() => {
    if (!scene || !enabled) return;
    const root = new TransformNode("light_cones_root", scene);
    const mat = new StandardMaterial("lightConeMat", scene);
    mat.diffuseColor = new Color3(1, 0.9, 0.7);
    mat.emissiveColor = new Color3(0.8, 0.7, 0.5);
    mat.alpha = 0.2;
    mat.backFaceCulling = false;
    const cones: Mesh[] = [];
    for (let i = 0; i < count; i += 1) {
      const cone = MeshBuilder.CreateCylinder(
        `light_cone_${i}`,
        { diameterTop: 0.2, diameterBottom: randRange(4, 8), height: randRange(8, 16), tessellation: 18 },
        scene
      );
      cone.position = new Vector3(randRange(-radius, radius), cone.scaling.y + 5, randRange(-radius, radius));
      cone.material = mat;
      cone.parent = root;
      cone.isPickable = false;
      cones.push(cone);
    }
    return () => {
      cones.forEach((c) => c.dispose());
      mat.dispose();
      root.dispose();
    };
  }, [scene, enabled, count, radius]);
  return null;
};

type SkylineProps = {
  scene: Scene | null;
  enabled: boolean;
  radius?: number;
  count?: number;
};

export const SkylineBackdrop: React.FC<SkylineProps> = ({ scene, enabled, radius = 1300, count = 24 }) => {
  useEffect(() => {
    if (!scene || !enabled) return;
    const root = new TransformNode("skyline_root", scene);
    const mat = new StandardMaterial("skylineMat", scene);
    mat.diffuseColor = new Color3(0.04, 0.05, 0.08);
    mat.emissiveColor = new Color3(0.02, 0.02, 0.03);
    const blocks: Mesh[] = [];
    for (let i = 0; i < count; i += 1) {
      const height = randRange(120, 260);
      const width = randRange(80, 160);
      const depth = randRange(50, 120);
      const box = MeshBuilder.CreateBox(`skyline_${i}`, { width, height, depth }, scene);
      const angle = (i / count) * Math.PI * 2;
      box.position = new Vector3(Math.cos(angle) * radius, height / 2, Math.sin(angle) * radius);
      box.material = mat;
      box.parent = root;
      box.isPickable = false;
      blocks.push(box);
    }
    return () => {
      blocks.forEach((b) => b.dispose());
      mat.dispose();
      root.dispose();
    };
  }, [scene, enabled, radius, count]);
  return null;
};

type FootstepZoneProps = {
  scene: Scene | null;
  camera: { position: Vector3 } | null;
  enabled: boolean;
};

export const FootstepZones: React.FC<FootstepZoneProps> = ({ scene, camera, enabled }) => {
  useEffect(() => {
    if (!scene || !camera || !enabled) return;
    let lastSurface = "";
    const obs = scene.onBeforeRenderObservable.add(() => {
      const surface = Math.abs(camera.position.x) < 150 ? "concrete" : "asphalt";
      if (surface !== lastSurface) {
        lastSurface = surface;
        window.dispatchEvent(new CustomEvent("footstep-surface", { detail: { surface } }));
      }
    });
    return () => {
      scene.onBeforeRenderObservable.remove(obs);
    };
  }, [scene, camera, enabled]);
  return null;
};

type SteamVentsProps = {
  scene: Scene | null;
  enabled: boolean;
  count?: number;
  radius?: number;
};

export const SteamVents: React.FC<SteamVentsProps> = ({ scene, enabled, count = 12, radius = 520 }) => {
  useEffect(() => {
    if (!scene || !enabled) return;
    const root = new TransformNode("steam_root", scene);
    const vents: Mesh[] = [];
    const mats: StandardMaterial[] = [];
    for (let i = 0; i < count; i += 1) {
      const plane = MeshBuilder.CreatePlane(`steam_${i}`, { size: randRange(8, 14) }, scene);
      plane.position = new Vector3(randRange(-radius, radius), randRange(8, 16), randRange(-radius, radius));
      plane.billboardMode = Mesh.BILLBOARDMODE_Y;
      const mat = new StandardMaterial(`steam_mat_${i}`, scene);
      mat.diffuseColor = new Color3(0.9, 0.9, 0.95);
      mat.alpha = 0.15;
      plane.material = mat;
      plane.parent = root;
      vents.push(plane);
      mats.push(mat);
    }
    const start = performance.now();
    const obs = scene.onBeforeRenderObservable.add(() => {
      const t = (performance.now() - start) / 1000;
      vents.forEach((v, idx) => {
        v.position.y += Math.sin(t * 0.6 + idx) * 0.01;
      });
    });
    return () => {
      scene.onBeforeRenderObservable.remove(obs);
      vents.forEach((v) => v.dispose());
      mats.forEach((m) => m.dispose());
      root.dispose();
    };
  }, [scene, enabled, count, radius]);
  return null;
};

type MovingShadowProps = {
  scene: Scene | null;
  enabled: boolean;
};

export const MovingShadows: React.FC<MovingShadowProps> = ({ scene, enabled }) => {
  useEffect(() => {
    if (!scene || !enabled) return;
    const root = new TransformNode("shadow_root", scene);
    const mat = new StandardMaterial("movingShadowMat", scene);
    mat.diffuseColor = new Color3(0, 0, 0);
    mat.alpha = 0.08;
    const plane = MeshBuilder.CreateGround("moving_shadow", { width: 1800, height: 1800 }, scene);
    plane.position = new Vector3(0, 0.06, 0);
    plane.material = mat;
    plane.parent = root;
    const start = performance.now();
    const obs = scene.onBeforeRenderObservable.add(() => {
      const t = (performance.now() - start) / 1000;
      plane.position.x = Math.sin(t * 0.05) * 40;
      plane.position.z = Math.cos(t * 0.05) * 40;
    });
    return () => {
      scene.onBeforeRenderObservable.remove(obs);
      plane.dispose();
      mat.dispose();
      root.dispose();
    };
  }, [scene, enabled]);
  return null;
};

type DebrisProps = {
  scene: Scene | null;
  enabled: boolean;
  count?: number;
  radius?: number;
};

export const DebrisScatter: React.FC<DebrisProps> = ({ scene, enabled, count = 120, radius = 600 }) => {
  useEffect(() => {
    if (!scene || !enabled) return;
    const root = new TransformNode("debris_root", scene);
    const mat = new StandardMaterial("debrisMat", scene);
    mat.diffuseColor = new Color3(0.2, 0.2, 0.22);
    const debris: Mesh[] = [];
    for (let i = 0; i < count; i += 1) {
      const size = randRange(0.3, 0.8);
      const box = MeshBuilder.CreateBox(`debris_${i}`, { size }, scene);
      box.position = new Vector3(randRange(-radius, radius), 0.05, randRange(-radius, radius));
      box.rotation.y = randRange(0, Math.PI * 2);
      box.material = mat;
      box.parent = root;
      box.isPickable = false;
      box.metadata = { lodGroup: "debris", lodDistance: 700 };
      debris.push(box);
    }
    return () => {
      debris.forEach((d) => d.dispose());
      mat.dispose();
      root.dispose();
    };
  }, [scene, enabled, count, radius]);
  return null;
};

type TrafficLightProps = {
  scene: Scene | null;
  enabled: boolean;
  count?: number;
  radius?: number;
};

export const TrafficLights: React.FC<TrafficLightProps> = ({ scene, enabled, count = 18, radius = 520 }) => {
  useEffect(() => {
    if (!scene || !enabled) return;
    const root = new TransformNode("traffic_light_root", scene);
    const poleMat = new StandardMaterial("trafficPoleMat", scene);
    poleMat.diffuseColor = new Color3(0.08, 0.08, 0.09);
    const lights: Mesh[] = [];
    const mats: StandardMaterial[] = [];
    for (let i = 0; i < count; i += 1) {
      const pole = MeshBuilder.CreateCylinder(`traffic_pole_${i}`, { height: 8, diameter: 0.3 }, scene);
      pole.position = new Vector3(randRange(-radius, radius), 4, randRange(-radius, radius));
      pole.material = poleMat;
      pole.parent = root;
      const lamp = MeshBuilder.CreateSphere(`traffic_light_${i}`, { diameter: 0.6 }, scene);
      lamp.position = new Vector3(0, 3.2, 0);
      lamp.parent = pole;
      const mat = new StandardMaterial(`traffic_light_mat_${i}`, scene);
      mat.emissiveColor = new Color3(1, 0.2, 0.2);
      lamp.material = mat;
      lights.push(lamp);
      mats.push(mat);
    }
    const start = performance.now();
    const obs = scene.onBeforeRenderObservable.add(() => {
      const t = (performance.now() - start) / 1000;
      const phase = Math.floor(t / 6) % 3;
      mats.forEach((m) => {
        if (phase === 0) m.emissiveColor = new Color3(1, 0.2, 0.2);
        if (phase === 1) m.emissiveColor = new Color3(1, 0.7, 0.1);
        if (phase === 2) m.emissiveColor = new Color3(0.2, 1, 0.3);
      });
    });
    return () => {
      scene.onBeforeRenderObservable.remove(obs);
      lights.forEach((l) => l.dispose());
      mats.forEach((m) => m.dispose());
      poleMat.dispose();
      root.dispose();
    };
  }, [scene, enabled, count, radius]);
  return null;
};

type StreetSignProps = {
  scene: Scene | null;
  enabled: boolean;
  count?: number;
  radius?: number;
};

export const StreetSigns: React.FC<StreetSignProps> = ({ scene, enabled, count = 20, radius = 520 }) => {
  useEffect(() => {
    if (!scene || !enabled) return;
    const root = new TransformNode("street_sign_root", scene);
    const mat = new StandardMaterial("street_sign_mat", scene);
    mat.diffuseColor = new Color3(0.1, 0.25, 0.6);
    mat.specularColor = new Color3(0.4, 0.4, 0.4);
    const signs: Mesh[] = [];
    for (let i = 0; i < count; i += 1) {
      const pole = MeshBuilder.CreateCylinder(`sign_pole_${i}`, { height: 5, diameter: 0.15 }, scene);
      pole.position = new Vector3(randRange(-radius, radius), 2.5, randRange(-radius, radius));
      pole.material = mat;
      pole.parent = root;
      const sign = MeshBuilder.CreatePlane(`street_sign_${i}`, { width: 2.4, height: 1.2 }, scene);
      sign.position = new Vector3(0, 1.8, 0);
      sign.material = mat;
      sign.parent = pole;
      sign.rotation.y = randRange(0, Math.PI * 2);
      sign.isPickable = false;
      sign.metadata = { lodGroup: "signs", lodDistance: 800 };
      signs.push(sign);
    }
    return () => {
      signs.forEach((s) => s.dispose());
      mat.dispose();
      root.dispose();
    };
  }, [scene, enabled, count, radius]);
  return null;
};

type SirenProps = {
  scene: Scene | null;
  enabled: boolean;
};

export const SirenSweep: React.FC<SirenProps> = ({ scene, enabled }) => {
  useEffect(() => {
    if (!scene || !enabled) return;
    const root = new TransformNode("siren_root", scene);
    const red = new SpotLight("siren_red", new Vector3(0, 60, 0), new Vector3(1, -1, 0), 0.6, 6, scene);
    red.diffuse = new Color3(1, 0.2, 0.2);
    const blue = new SpotLight("siren_blue", new Vector3(0, 60, 0), new Vector3(-1, -1, 0), 0.6, 6, scene);
    blue.diffuse = new Color3(0.2, 0.4, 1);
    red.parent = root;
    blue.parent = root;
    const start = performance.now();
    const obs = scene.onBeforeRenderObservable.add(() => {
      const t = (performance.now() - start) / 1000;
      const yaw = t * 0.4;
      red.direction = new Vector3(Math.cos(yaw), -1, Math.sin(yaw));
      blue.direction = new Vector3(Math.cos(yaw + Math.PI), -1, Math.sin(yaw + Math.PI));
    });
    return () => {
      scene.onBeforeRenderObservable.remove(obs);
      red.dispose();
      blue.dispose();
      root.dispose();
    };
  }, [scene, enabled]);
  return null;
};

type BannerProps = {
  scene: Scene | null;
  enabled: boolean;
  count?: number;
  radius?: number;
};

export const Banners: React.FC<BannerProps> = ({ scene, enabled, count = 16, radius = 520 }) => {
  useEffect(() => {
    if (!scene || !enabled) return;
    const root = new TransformNode("banner_root", scene);
    const mat = new StandardMaterial("banner_mat", scene);
    mat.diffuseColor = new Color3(0.4, 0.1, 0.6);
    mat.alpha = 0.9;
    const banners: Mesh[] = [];
    for (let i = 0; i < count; i += 1) {
      const banner = MeshBuilder.CreatePlane(`banner_${i}`, { width: 2.5, height: 4 }, scene);
      banner.position = new Vector3(randRange(-radius, radius), randRange(6, 16), randRange(-radius, radius));
      banner.material = mat;
      banner.parent = root;
      banners.push(banner);
    }
    const start = performance.now();
    const obs = scene.onBeforeRenderObservable.add(() => {
      const t = (performance.now() - start) / 1000;
      banners.forEach((b, idx) => {
        b.rotation.y += Math.sin(t * 0.6 + idx) * 0.0006;
        b.scaling.x = 1 + Math.sin(t * 1.2 + idx) * 0.03;
      });
    });
    return () => {
      scene.onBeforeRenderObservable.remove(obs);
      banners.forEach((b) => b.dispose());
      mat.dispose();
      root.dispose();
    };
  }, [scene, enabled, count, radius]);
  return null;
};

type NightGradeProps = {
  scene: Scene | null;
  enabled: boolean;
};

export const NightColorGrade: React.FC<NightGradeProps> = ({ scene, enabled }) => {
  useEffect(() => {
    if (!scene) return;
    const cfg = scene.imageProcessingConfiguration;
    if (enabled) {
      cfg.exposure = 0.85;
      cfg.contrast = 1.08;
      cfg.vignetteEnabled = true;
      cfg.vignetteWeight = 0.6;
    } else {
      cfg.vignetteEnabled = false;
    }
  }, [scene, enabled]);
  return null;
};

type AlleyRumbleProps = {
  enabled: boolean;
};

export const AlleyRumble: React.FC<AlleyRumbleProps> = ({ enabled }) => {
  useEffect(() => {
    if (!enabled) return;
    const ctx = window.AudioContext ? new AudioContext() : null;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 45;
    gain.gain.value = 0.02;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    return () => {
      try { osc.stop(); } catch {}
      try { osc.disconnect(); } catch {}
      try { gain.disconnect(); } catch {}
      try { ctx.close(); } catch {}
    };
  }, [enabled]);
  return null;
};

type LODProps = {
  scene: Scene | null;
  enabled: boolean;
  maxDistance?: number;
};

export const LODManager: React.FC<LODProps> = ({ scene, enabled, maxDistance = 900 }) => {
  useEffect(() => {
    if (!scene || !enabled) return;
    const obs = scene.onBeforeRenderObservable.add(() => {
      const camera = scene.activeCamera;
      if (!camera) return;
      scene.meshes.forEach((mesh) => {
        const meta = mesh.metadata as { lodGroup?: string; lodDistance?: number } | undefined;
        if (!meta?.lodGroup) return;
        const dist = Vector3.Distance(mesh.position, camera.position);
        const limit = meta.lodDistance ?? maxDistance;
        mesh.setEnabled(dist < limit);
      });
    });
    return () => {
      scene.onBeforeRenderObservable.remove(obs);
    };
  }, [scene, enabled, maxDistance]);
  return null;
};

type VegetationSwayProps = {
  scene: Scene | null;
  enabled: boolean;
  amount?: number;
  speed?: number;
};

export const VegetationSway: React.FC<VegetationSwayProps> = ({
  scene,
  enabled,
  amount = 0.03,
  speed = 0.6,
}) => {
  useEffect(() => {
    if (!scene || !enabled) return;
    const crownMeshes = scene.meshes.filter((m) => m.name.startsWith("tree_crown"));
    const getTreeId = (name: string) => {
      const match = name.match(/_(\d+)$/);
      return match ? parseInt(match[1], 10) : null;
    };
    const swayTargets = crownMeshes
      .map((mesh) => ({ mesh, id: getTreeId(mesh.name) }))
      .filter((entry) => entry.id !== null) as Array<{ mesh: AbstractMesh; id: number }>;
    const basePositions = swayTargets.map((entry) => entry.mesh.position.clone());
    const windOffsets = swayTargets.map((entry) => (entry.id * 0.37) % (Math.PI * 2));
    const windPeriods = swayTargets.map((entry) => 3 + ((entry.id * 17) % 50) / 10); // 3..8s
    const swayMultipliers = swayTargets.map(() => 3 + Math.random() * 3);
    const start = performance.now();
    const obs = scene.onBeforeRenderObservable.add(() => {
      const t = (performance.now() - start) / 1000;
      swayTargets.forEach((entry, idx) => {
        const windPhase = (Math.sin((t * Math.PI * 2) / windPeriods[idx] + windOffsets[idx]) + 1) * 0.5;
        const swayAmount = amount * swayMultipliers[idx] * (0.35 + windPhase * 0.65);
        const offset = Math.sin(t * speed + entry.id) * swayAmount;
        const base = basePositions[idx];
        entry.mesh.position.x = base.x + offset;
        entry.mesh.position.z = base.z + offset * 0.6;
      });
    });
    return () => {
      scene.onBeforeRenderObservable.remove(obs);
      swayTargets.forEach((entry, idx) => {
        const base = basePositions[idx];
        entry.mesh.position.x = base.x;
        entry.mesh.position.z = base.z;
      });
    };
  }, [scene, enabled, amount, speed]);
  return null;
};
