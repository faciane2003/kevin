import { useEffect } from "react";
import { Scene, SceneLoader, TransformNode, Vector3 } from "@babylonjs/core";

type Props = {
  scene: Scene | null;
  flocks?: number;
  birdsPerFlock?: number;
};

const BirdFlocks: React.FC<Props> = ({ scene, flocks = 6, birdsPerFlock = 6 }) => {
  useEffect(() => {
    if (!scene) return;
    let disposed = false;
    let root: TransformNode | null = null;
    let instances: any[] = [];
    let baseMeshes: any[] = [];
    const birds: { mesh: any; center: Vector3; angle: number; radius: number; speed: number; height: number }[] = [];

    const build = async () => {
      const container = await SceneLoader.LoadAssetContainerAsync("", "/models/bird.glb", scene);
      if (disposed) {
        container.dispose();
        return;
      }
      root = new TransformNode("bird_root", scene);
      container.addAllToScene();
      baseMeshes = container.meshes.filter((m) => (m as any).createInstance);
      baseMeshes.forEach((mesh) => {
        mesh.setEnabled(false);
        mesh.isVisible = false;
      });

      for (let f = 0; f < flocks; f += 1) {
        const center = new Vector3((Math.random() - 0.5) * 500, 90 + Math.random() * 60, (Math.random() - 0.5) * 500);
        for (let b = 0; b < birdsPerFlock; b += 1) {
          const base = baseMeshes[0];
          if (!base) break;
          const inst = base.createInstance(`bird_${f}_${b}`);
          inst.parent = root;
          inst.scaling = new Vector3(0.7, 0.7, 0.7);
          instances.push(inst);
          birds.push({
            mesh: inst,
            center: center.clone(),
            angle: Math.random() * Math.PI * 2,
            radius: 12 + Math.random() * 16,
            speed: 0.4 + Math.random() * 0.3,
            height: center.y + Math.random() * 6,
          });
        }
      }
    };

    build();

    const onRender = () => {
      const dt = scene.getEngine().getDeltaTime() / 1000;
      birds.forEach((b) => {
        b.angle += b.speed * dt;
        const x = b.center.x + Math.cos(b.angle) * b.radius;
        const z = b.center.z + Math.sin(b.angle) * b.radius;
        const y = b.height + Math.sin(b.angle * 2) * 3;
        b.mesh.position.set(x, y, z);
        b.mesh.rotation.y = -b.angle + Math.PI / 2;
      });
    };
    scene.onBeforeRenderObservable.add(onRender);

    return () => {
      disposed = true;
      scene.onBeforeRenderObservable.removeCallback(onRender);
      birds.splice(0, birds.length);
      instances.forEach((mesh) => mesh.dispose());
      baseMeshes.forEach((mesh) => mesh.dispose());
      if (root) root.dispose();
    };
  }, [scene, flocks, birdsPerFlock]);

  return null;
};

export default BirdFlocks;
