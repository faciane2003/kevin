import { useEffect } from "react";
import {
  Color3,
  DynamicTexture,
  MeshBuilder,
  Scene,
  StandardMaterial,
  TransformNode,
  Vector3,
} from "@babylonjs/core";

type Props = {
  scene: Scene | null;
  count?: number;
  scale?: number;
  buildings?: Array<{ mesh: { position: Vector3 }; width: number; depth: number }>;
  signPositions?: Vector3[];
};

const TreeField: React.FC<Props> = ({ scene, count = 100, scale = 4, buildings = [], signPositions = [] }) => {
  useEffect(() => {
    if (!scene) return;
    const treeTrunkMat = new StandardMaterial("treeTrunkMat", scene);
    treeTrunkMat.diffuseColor = new Color3(1, 1, 1);
    treeTrunkMat.specularColor = new Color3(0.03, 0.03, 0.03);
    const trunkTexture = new DynamicTexture("treeTrunkTex", { width: 32, height: 256 }, scene, false);
    const trunkCtx = trunkTexture.getContext();
    const trunkGrad = trunkCtx.createLinearGradient(0, 0, 0, 256);
    trunkGrad.addColorStop(0, "#5c3a1b");
    trunkGrad.addColorStop(1, "#0b0a0a");
    trunkCtx.fillStyle = trunkGrad;
    trunkCtx.fillRect(0, 0, 32, 256);
    trunkTexture.update();
    treeTrunkMat.diffuseTexture = trunkTexture;

    const leafTextures: DynamicTexture[] = [];
    const leafPalette = ["#6c8f2f", "#8fa13b", "#b5702c", "#d2a23a", "#8c6a3e", "#5f7a2b"];
    const treeLeafMats = Array.from({ length: 8 }, (_, idx) => {
      const mat = new StandardMaterial(`treeLeafMat_${idx}`, scene);
      mat.diffuseColor = new Color3(1, 1, 1);
      mat.specularColor = new Color3(0.02, 0.02, 0.02);
      const texture = new DynamicTexture(`treeLeafTex_${idx}`, { width: 256, height: 256 }, scene, false);
      const ctx = texture.getContext();
      const base = leafPalette[Math.floor(Math.random() * leafPalette.length)];
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, 256, 256);
      for (let d = 0; d < 140; d += 1) {
        const radius = 4 + Math.random() * 10;
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const dot = leafPalette[Math.floor(Math.random() * leafPalette.length)];
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = dot;
        ctx.fill();
      }
      texture.update();
      mat.diffuseTexture = texture;
      leafTextures.push(texture);
      return mat;
    });
    const treeBlacklist = new Vector3(-207, 0, -7);
    const nodes: TransformNode[] = [];
    const placedPositions: Vector3[] = [];
    const minTreeDistance = 20;

    const buildingBuffers = buildings.map((b) => ({
      position: b.mesh.position.clone(),
      radius: Math.max(b.width, b.depth) / 2 + 20,
    }));
    const signBuffers = signPositions.map((pos) => ({
      position: pos.clone(),
      radius: 20,
    }));

    const isNearBuilding = (pos: Vector3) => {
      for (const b of buildingBuffers) {
        const dx = pos.x - b.position.x;
        const dz = pos.z - b.position.z;
        if (dx * dx + dz * dz < b.radius * b.radius) return true;
      }
      for (const s of signBuffers) {
        const dx = pos.x - s.position.x;
        const dz = pos.z - s.position.z;
        if (dx * dx + dz * dz < s.radius * s.radius) return true;
      }
      return false;
    };

    for (let i = 0; i < count; i += 1) {
      const base = new TransformNode(`tree_${i}`, scene);
      const scaleJitter = 0.75 + Math.random() * 0.5;
      const treeScale = scale * scaleJitter;
      const trunkHeight = (4.5 + Math.random() * 2.2) * treeScale;
      const trunkScale = 0.4 + Math.random() * 1.2;
      const trunk = MeshBuilder.CreateCylinder(
        `tree_trunk_${i}`,
        { height: trunkHeight, diameter: 0.6 * treeScale * trunkScale },
        scene
      );
      trunk.material = treeTrunkMat;
      trunk.position = new Vector3(0, trunkHeight / 2, 0);
      trunk.parent = base;
      const leafMat = treeLeafMats[i % treeLeafMats.length];
      const variant = i % 5;
      let crownHeight = 6 * treeScale;
      if (variant === 0) {
        const size = 5.2 * treeScale * (0.85 + Math.random() * 0.6);
        const crown = MeshBuilder.CreateSphere(`tree_crown_${i}`, { diameter: size }, scene);
        crown.material = leafMat;
        crown.position = new Vector3(0, 5.5 * treeScale, 0);
        crown.parent = base;
        crownHeight = 6 * treeScale;
      } else if (variant === 1) {
        const crown = MeshBuilder.CreateCylinder(
          `tree_crown_${i}`,
          { height: 7.2 * treeScale, diameterTop: 0, diameterBottom: 6.2 * treeScale },
          scene
        );
        crown.material = leafMat;
        crown.position = new Vector3(0, 6.4 * treeScale, 0);
        crown.parent = base;
        crownHeight = 7.2 * treeScale;
      } else {
        const crownA = MeshBuilder.CreateSphere(`tree_crown_a_${i}`, { diameter: 4.2 * treeScale }, scene);
        crownA.material = leafMat;
        crownA.position = new Vector3(0, 5.2 * treeScale, 0);
        crownA.parent = base;
        const crownB = MeshBuilder.CreateSphere(`tree_crown_b_${i}`, { diameter: 3.4 * treeScale }, scene);
        crownB.material = leafMat;
        crownB.position = new Vector3(0.8 * treeScale, 6.9 * treeScale, 0.4 * treeScale);
        crownB.parent = base;
        if (variant === 3) {
          const crownC = MeshBuilder.CreateSphere(`tree_crown_c_${i}`, { diameter: 3 * treeScale }, scene);
          crownC.material = leafMat;
          crownC.position = new Vector3(-0.8 * treeScale, 6.3 * treeScale, -0.2 * treeScale);
          crownC.parent = base;
        }
        crownHeight = 7.2 * treeScale;
      }
      const collider = MeshBuilder.CreateCylinder(
        `tree_collider_${i}`,
        { height: crownHeight * 1.1, diameter: 3.2 * treeScale * 1.1 },
        scene
      );
      collider.isVisible = false;
      collider.checkCollisions = true;
      collider.parent = base;
      collider.position = new Vector3(0, crownHeight / 2, 0);
      let placed = false;
      for (let attempt = 0; attempt < 40; attempt += 1) {
        base.position = new Vector3(
          (Math.random() - 0.5) * 700,
          0,
          (Math.random() - 0.5) * 700 - 100
        );
        if (Vector3.Distance(base.position, treeBlacklist) < 12) continue;
        if (isNearBuilding(base.position)) continue;
        let tooClose = false;
        for (const pos of placedPositions) {
          if (Vector3.Distance(base.position, pos) < minTreeDistance) {
            tooClose = true;
            break;
          }
        }
        if (tooClose) continue;
        placed = true;
        break;
      }
      if (!placed) {
        base.dispose();
        continue;
      }
      placedPositions.push(base.position.clone());
      nodes.push(base);
    }

    window.dispatchEvent(
      new CustomEvent("tree-positions", {
        detail: placedPositions.map((p) => ({ x: p.x, y: p.y, z: p.z })),
      })
    );

    return () => {
      nodes.forEach((node) => node.dispose());
      treeTrunkMat.dispose();
      trunkTexture.dispose();
      treeLeafMats.forEach((mat) => mat.dispose());
      leafTextures.forEach((tex) => tex.dispose());
    };
  }, [scene, count, scale, buildings, signPositions]);

  return null;
};

export default TreeField;
