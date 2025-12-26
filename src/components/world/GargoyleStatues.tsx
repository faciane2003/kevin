import { useEffect } from "react";
import { Scene, SceneLoader, TransformNode, Vector3 } from "@babylonjs/core";

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
    let baseMeshes: any[] = [];

    const build = async () => {
      const container = await SceneLoader.LoadAssetContainerAsync("", "/models/CesiumMan.glb", scene);
      if (disposed) {
        container.dispose();
        return;
      }
      root = new TransformNode("gargoyle_root", scene);
      container.addAllToScene();
      baseMeshes = container.meshes.filter((m) => (m as any).createInstance);
      baseMeshes.forEach((mesh) => {
        mesh.setEnabled(false);
        mesh.isVisible = false;
      });

      buildings.forEach((b, idx) => {
        const halfW = b.width / 2 - 1.6;
        const halfD = b.depth / 2 - 1.6;
        const y = b.height / 2 + 1.4;
        const corners = [
          new Vector3(halfW, y, halfD),
          new Vector3(-halfW, y, halfD),
          new Vector3(halfW, y, -halfD),
          new Vector3(-halfW, y, -halfD),
        ];
        corners.forEach((corner, cidx) => {
          baseMeshes.forEach((mesh) => {
            const inst = mesh.createInstance(`gargoyle_${idx}_${cidx}_${mesh.name}`);
            inst.parent = b.mesh;
            inst.position = corner.clone();
            inst.scaling = new Vector3(2.4, 2.4, 2.4);
            inst.rotation.y = Math.PI;
            instances.push(inst);
          });
        });
      });
    };

    build();

    return () => {
      disposed = true;
      instances.forEach((mesh) => mesh.dispose());
      baseMeshes.forEach((mesh) => mesh.dispose());
      if (root) root.dispose();
    };
  }, [scene, buildings]);

  return null;
};

export default GargoyleStatues;
