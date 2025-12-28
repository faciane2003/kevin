import { useEffect } from "react";
import {
  Color3,
  Mesh,
  MeshBuilder,
  Scene,
  StandardMaterial,
  TransformNode,
  Vector3,
} from "@babylonjs/core";

type AtmospherePropsSettings = {
  enabled: boolean;
  count: number;
  seed: number;
  horror: boolean;
  action: boolean;
  thriller: boolean;
  dystopian: boolean;
  neon: boolean;
};

type AtmosphereProps = {
  scene: Scene | null;
  settings: AtmospherePropsSettings;
};

const mulberry32 = (seed: number) => {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

const pick = <T,>(list: T[], rnd: () => number) => list[Math.floor(rnd() * list.length)];

export const AtmosphereProps: React.FC<AtmosphereProps> = ({ scene, settings }) => {
  useEffect(() => {
    if (!scene || !settings.enabled || settings.count <= 0) return;
    const categories = [
      settings.horror ? "horror" : null,
      settings.action ? "action" : null,
      settings.thriller ? "thriller" : null,
      settings.dystopian ? "dystopian" : null,
      settings.neon ? "neon" : null,
    ].filter(Boolean) as string[];
    if (categories.length === 0) return;

    const rnd = mulberry32(settings.seed || 1);
    const root = new TransformNode("atmosphere_props_root", scene);
    const meshes: Mesh[] = [];
    const materials: StandardMaterial[] = [];
    const radius = 520;

    const makeMaterial = (name: string, color: Color3, emissive = 0.2) => {
      const mat = new StandardMaterial(name, scene);
      mat.diffuseColor = color;
      mat.emissiveColor = color.scale(emissive);
      mat.specularColor = new Color3(0.1, 0.1, 0.1);
      materials.push(mat);
      return mat;
    };

    const palettes: Record<string, Color3[]> = {
      horror: [new Color3(0.6, 0.05, 0.05), new Color3(0.2, 0.02, 0.02)],
      action: [new Color3(0.7, 0.45, 0.1), new Color3(0.4, 0.3, 0.1)],
      thriller: [new Color3(0.15, 0.25, 0.35), new Color3(0.25, 0.3, 0.4)],
      dystopian: [new Color3(0.2, 0.2, 0.22), new Color3(0.12, 0.12, 0.14)],
      neon: [new Color3(0.2, 0.8, 1.0), new Color3(0.9, 0.2, 0.8)],
    };

    const shapes = ["obelisk", "crate", "spike", "console", "ring", "totem", "pillar"];
    for (let i = 0; i < settings.count; i += 1) {
      const category = pick(categories, rnd);
      const palette = palettes[category];
      const color = pick(palette, rnd);
      const variant = pick(shapes, rnd);
      const size = 2 + rnd() * 6;
      let mesh: Mesh;
      if (variant === "obelisk") {
        mesh = MeshBuilder.CreateCylinder(`prop_obelisk_${i}`, { diameterTop: 0.8, diameterBottom: size * 0.8, height: size * 2 }, scene);
      } else if (variant === "spike") {
        mesh = MeshBuilder.CreateCylinder(`prop_spike_${i}`, { diameterTop: 0, diameterBottom: size, height: size * 2.2, tessellation: 6 }, scene);
      } else if (variant === "console") {
        mesh = MeshBuilder.CreateBox(`prop_console_${i}`, { width: size * 1.4, height: size * 0.6, depth: size }, scene);
      } else if (variant === "ring") {
        mesh = MeshBuilder.CreateTorus(`prop_ring_${i}`, { diameter: size * 1.6, thickness: size * 0.2 }, scene);
      } else if (variant === "totem") {
        mesh = MeshBuilder.CreateCylinder(`prop_totem_${i}`, { diameterTop: size * 0.6, diameterBottom: size * 0.6, height: size * 2.5 }, scene);
      } else if (variant === "pillar") {
        mesh = MeshBuilder.CreateBox(`prop_pillar_${i}`, { width: size * 0.8, height: size * 2.4, depth: size * 0.8 }, scene);
      } else {
        mesh = MeshBuilder.CreateBox(`prop_crate_${i}`, { size }, scene);
      }
      const mat = makeMaterial(`prop_mat_${i}`, color, category === "neon" ? 0.6 : 0.2);
      mesh.material = mat;
      mesh.position = new Vector3((rnd() - 0.5) * radius * 2, size * 0.5, (rnd() - 0.5) * radius * 2);
      mesh.rotation = new Vector3(0, rnd() * Math.PI * 2, 0);
      mesh.parent = root;
      mesh.isPickable = false;
      mesh.checkCollisions = false;
      mesh.freezeWorldMatrix();
      meshes.push(mesh);
    }

    return () => {
      meshes.forEach((m) => m.dispose());
      materials.forEach((m) => m.dispose());
      root.dispose();
    };
  }, [scene, settings]);

  return null;
};

export default AtmosphereProps;
