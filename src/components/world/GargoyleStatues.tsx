import { useEffect } from "react";
import { Color3, Mesh, Scene, SceneLoader, StandardMaterial, TransformNode, Vector3 } from "@babylonjs/core";

type BuildingInfo = { mesh: any; width: number; depth: number; height: number };

type Props = {
  scene: Scene | null;
  buildings: BuildingInfo[];
};

const GargoyleStatues: React.FC<Props> = ({ scene, buildings }) => {
  useEffect(() => {
    if (!scene || buildings.length === 0) return;
    let disposed = false;
    let root: TransformNode | null = null;
    let instances: any[] = [];
    let baseMesh: Mesh | null = null;

    const build = async () => {
      let container;
      try {
        container = await SceneLoader.LoadAssetContainerAsync("", "/models/demon.glb", scene);
      } catch {
        container = await SceneLoader.LoadAssetContainerAsync("", "/models/CesiumMan.glb", scene);
      }
      if (disposed) {
        container.dispose();
        return;
      }
      root = new TransformNode("gargoyle_root", scene);
      container.addAllToScene();
      container.animationGroups.forEach((group) => {
        group.stop();
        group.dispose();
      });

      const meshParts = container.meshes.filter(
        (m): m is Mesh => m instanceof Mesh && m.name !== "__root__"
      );
      baseMesh =
        Mesh.MergeMeshes(meshParts, true, true, undefined, false, true) ?? meshParts[0] ?? null;
      if (!baseMesh) {
        container.dispose();
        return;
      }
      const gargoyleMat = new StandardMaterial("gargoyleMat", scene);
      gargoyleMat.diffuseColor = new Color3(0.1, 0.1, 0.1);
      gargoyleMat.emissiveColor = new Color3(0.02, 0.02, 0.02);
      baseMesh.material = gargoyleMat;
      baseMesh.setEnabled(false);
      baseMesh.isVisible = false;

      buildings.forEach((b, idx) => {
        if (idx % 2 !== 0) return;
        const halfW = b.width / 2 - 1.6;
        const halfD = b.depth / 2 - 1.6;
        const y = b.height / 2 + 0.3;
        const corners = [
          new Vector3(halfW, y, halfD),
          new Vector3(-halfW, y, halfD),
          new Vector3(halfW, y, -halfD),
          new Vector3(-halfW, y, -halfD),
        ];
        corners.forEach((corner, cidx) => {
          if (!baseMesh) return;
          const inst = baseMesh.createInstance(`gargoyle_${idx}_${cidx}`);
          inst.parent = b.mesh;
          inst.position = corner.clone();
          inst.scaling = new Vector3(1.2, 1.2, 1.2);
          inst.rotation.y = Math.PI;
          instances.push(inst);
        });
      });
    };

    build();

    return () => {
      disposed = true;
      instances.forEach((mesh) => mesh.dispose());
      if (baseMesh?.material) {
        try { (baseMesh.material as StandardMaterial).dispose(); } catch {}
      }
      if (baseMesh) baseMesh.dispose();
      if (root) root.dispose();
    };
  }, [scene, buildings]);

  return null;
};

export default GargoyleStatues;
