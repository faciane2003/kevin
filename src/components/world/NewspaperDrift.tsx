import { useEffect } from "react";
import { Scene, SceneLoader, TransformNode, Vector3 } from "@babylonjs/core";

type Props = {
  scene: Scene | null;
  count?: number;
};

const NewspaperDrift: React.FC<Props> = ({ scene, count = 18 }) => {
  useEffect(() => {
    if (!scene) return;
    let disposed = false;
    let root: TransformNode | null = null;
    let instances: any[] = [];
    let baseMeshes: any[] = [];
    const drifts: { mesh: any; speed: Vector3; spin: Vector3 }[] = [];

    const build = async () => {
      const container = await SceneLoader.LoadAssetContainerAsync("", "/models/box_textured.glb", scene);
      if (disposed) {
        container.dispose();
        return;
      }
      root = new TransformNode("newspaper_root", scene);
      container.addAllToScene();
      baseMeshes = container.meshes.filter((m) => (m as any).createInstance);
      baseMeshes.forEach((mesh) => {
        mesh.setEnabled(false);
        mesh.isVisible = false;
      });

      for (let i = 0; i < count; i += 1) {
        const base = baseMeshes[0];
        if (!base) break;
        const inst = base.createInstance(`newspaper_${i}`);
        inst.parent = root;
        inst.scaling = new Vector3(2.2, 0.2, 1.6);
        inst.position = new Vector3(
          (Math.random() - 0.5) * 400,
          1.5 + Math.random() * 3,
          (Math.random() - 0.5) * 400
        );
        inst.rotation = new Vector3(0, Math.random() * Math.PI * 2, Math.random() * Math.PI);
        instances.push(inst);
        drifts.push({
          mesh: inst,
          speed: new Vector3(2 + Math.random() * 4, 0.4 + Math.random() * 0.6, 1 + Math.random() * 2),
          spin: new Vector3(0.6 + Math.random(), 0.5 + Math.random(), 0.8 + Math.random()),
        });
      }
    };

    build();

    const onRender = () => {
      const dt = scene.getEngine().getDeltaTime() / 1000;
      drifts.forEach((d) => {
        d.mesh.position.addInPlace(d.speed.scale(dt));
        d.mesh.rotation.x += d.spin.x * dt;
        d.mesh.rotation.y += d.spin.y * dt;
        d.mesh.rotation.z += d.spin.z * dt;
        if (d.mesh.position.x > 340) d.mesh.position.x = -340;
        if (d.mesh.position.x < -340) d.mesh.position.x = 340;
        if (d.mesh.position.z > 340) d.mesh.position.z = -340;
        if (d.mesh.position.z < -340) d.mesh.position.z = 340;
      });
    };
    scene.onBeforeRenderObservable.add(onRender);

    return () => {
      disposed = true;
      scene.onBeforeRenderObservable.removeCallback(onRender);
      drifts.splice(0, drifts.length);
      instances.forEach((mesh) => mesh.dispose());
      baseMeshes.forEach((mesh) => mesh.dispose());
      if (root) root.dispose();
    };
  }, [scene, count]);

  return null;
};

export default NewspaperDrift;
