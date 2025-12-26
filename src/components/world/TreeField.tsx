import { useEffect } from "react";
import { Color3, MeshBuilder, Scene, StandardMaterial, TransformNode, Vector3 } from "@babylonjs/core";

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
    treeTrunkMat.diffuseColor = new Color3(0.25, 0.18, 0.1);
    const treeLeafMats = Array.from({ length: 6 }, (_, idx) => {
      const mat = new StandardMaterial(`treeLeafMat_${idx}`, scene);
      const base = 0.06 + Math.random() * 0.08;
      const green = 0.28 + Math.random() * 0.18;
      const blue = 0.12 + Math.random() * 0.08;
      mat.diffuseColor = new Color3(base, green, blue);
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
      const trunkScale = 0.7 + Math.random() * 0.9;
      const trunk = MeshBuilder.CreateCylinder(
        `tree_trunk_${i}`,
        { height: trunkHeight, diameter: 1.2 * treeScale * trunkScale },
        scene
      );
      trunk.material = treeTrunkMat;
      trunk.position = new Vector3(0, trunkHeight / 2, 0);
      trunk.parent = base;
      const leafMat = treeLeafMats[i % treeLeafMats.length];
      const variant = i % 3;
      let crownHeight = 6 * treeScale;
      if (variant === 0) {
        const crown = MeshBuilder.CreateSphere(`tree_crown_${i}`, { diameter: 6 * treeScale }, scene);
        crown.material = leafMat;
        crown.position = new Vector3(0, 6 * treeScale, 0);
        crown.parent = base;
      } else if (variant === 1) {
        const crown = MeshBuilder.CreateCylinder(
          `tree_crown_${i}`,
          { height: 6.5 * treeScale, diameterTop: 0, diameterBottom: 6 * treeScale },
          scene
        );
        crown.material = leafMat;
        crown.position = new Vector3(0, 6.5 * treeScale, 0);
        crown.parent = base;
        crownHeight = 6.5 * treeScale;
      } else {
        const crownA = MeshBuilder.CreateSphere(`tree_crown_a_${i}`, { diameter: 4.5 * treeScale }, scene);
        crownA.material = leafMat;
        crownA.position = new Vector3(0, 5.5 * treeScale, 0);
        crownA.parent = base;
        const crownB = MeshBuilder.CreateSphere(`tree_crown_b_${i}`, { diameter: 3.5 * treeScale }, scene);
        crownB.material = leafMat;
        crownB.position = new Vector3(0.6 * treeScale, 7 * treeScale, 0.3 * treeScale);
        crownB.parent = base;
        crownHeight = 7 * treeScale;
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
      treeLeafMats.forEach((mat) => mat.dispose());
    };
  }, [scene, count, scale, buildings, signPositions]);

  return null;
};

export default TreeField;
