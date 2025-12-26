import { useEffect } from "react";
import { Color3, MeshBuilder, Scene, StandardMaterial, TransformNode, Vector3 } from "@babylonjs/core";

type Props = {
  scene: Scene | null;
  count?: number;
  scale?: number;
};

const TreeField: React.FC<Props> = ({ scene, count = 250, scale = 4 }) => {
  useEffect(() => {
    if (!scene) return;
    const treeTrunkMat = new StandardMaterial("treeTrunkMat", scene);
    treeTrunkMat.diffuseColor = new Color3(0.25, 0.18, 0.1);
    const treeLeafMat = new StandardMaterial("treeLeafMat", scene);
    treeLeafMat.diffuseColor = new Color3(0.08, 0.35, 0.18);
    const treeBlacklist = new Vector3(-207, 0, -7);
    const nodes: TransformNode[] = [];

    for (let i = 0; i < count; i += 1) {
      const base = new TransformNode(`tree_${i}`, scene);
      const trunk = MeshBuilder.CreateCylinder(
        `tree_trunk_${i}`,
        { height: 5 * scale, diameter: 1.2 * scale },
        scene
      );
      trunk.material = treeTrunkMat;
      trunk.position = new Vector3(0, (2.5 * scale), 0);
      trunk.parent = base;
      const crown = MeshBuilder.CreateSphere(`tree_crown_${i}`, { diameter: 6 * scale }, scene);
      crown.material = treeLeafMat;
      crown.position = new Vector3(0, 6 * scale, 0);
      crown.parent = base;
      base.position = new Vector3((Math.random() - 0.5) * 700, 0, (Math.random() - 0.5) * 700 - 100);
      if (Vector3.Distance(base.position, treeBlacklist) < 12) {
        base.dispose();
        continue;
      }
      nodes.push(base);
    }

    return () => {
      nodes.forEach((node) => node.dispose());
      treeTrunkMat.dispose();
      treeLeafMat.dispose();
    };
  }, [scene, count, scale]);

  return null;
};

export default TreeField;
