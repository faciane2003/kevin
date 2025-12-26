import { useEffect } from "react";
import { Scene, SceneLoader, TransformNode, Vector3 } from "@babylonjs/core";

type Props = {
  scene: Scene | null;
};

const TrainSystem: React.FC<Props> = ({ scene }) => {
  useEffect(() => {
    if (!scene) return;
    let disposed = false;
    let root: TransformNode | null = null;
    let trainRoot: TransformNode | null = null;
    let baseTrack: any = null;
    let trackInstances: any[] = [];
    let trainMeshes: any[] = [];
    let trainProgress = 0;

    const build = async () => {
      const trackContainer = await SceneLoader.LoadAssetContainerAsync("", "/models/box_textured.glb", scene);
      const trainContainer = await SceneLoader.LoadAssetContainerAsync("", "/models/train.glb", scene);
      if (disposed) {
        trackContainer.dispose();
        trainContainer.dispose();
        return;
      }

      root = new TransformNode("train_track_root", scene);
      trainRoot = new TransformNode("train_root", scene);

      trackContainer.addAllToScene();
      const trackMeshes = trackContainer.meshes.filter((m) => (m as any).createInstance);
      baseTrack = trackMeshes[0] || null;
      trackMeshes.forEach((mesh) => {
        mesh.setEnabled(false);
        mesh.isVisible = false;
      });

      if (baseTrack) {
        const startX = -500;
        const endX = 500;
        const step = 40;
        for (let x = startX; x <= endX; x += step) {
          const inst = (baseTrack as any).createInstance(`track_${x}`);
          inst.parent = root;
          inst.scaling = new Vector3(18, 0.2, 4);
          inst.position = new Vector3(x, 0.2, 340);
          trackInstances.push(inst);
        }
      }

      trainContainer.addAllToScene();
      const trainBases = trainContainer.meshes.filter((m) => (m as any).createInstance);
      trainBases.forEach((mesh) => {
        mesh.setEnabled(false);
        mesh.isVisible = false;
      });
      const baseTrain = trainBases[0] || null;
      if (baseTrain && trainRoot) {
        const inst = (baseTrain as any).createInstance("train_main");
        inst.parent = trainRoot;
        inst.scaling = new Vector3(6.5, 6.5, 6.5);
        inst.position = new Vector3(-500, 2.2, 340);
        trainMeshes.push(inst);
      }
    };

    build();

    const onRender = () => {
      if (!trainRoot || trainMeshes.length === 0) return;
      const dt = scene.getEngine().getDeltaTime() / 1000;
      trainProgress += dt * 22;
      const span = 1000;
      const offset = ((trainProgress % span) + span) % span;
      const x = -500 + offset;
      trainRoot.position = new Vector3(x, 0, 0);
      trainRoot.rotation.y = 0;
    };
    scene.onBeforeRenderObservable.add(onRender);

    return () => {
      disposed = true;
      scene.onBeforeRenderObservable.removeCallback(onRender);
      trackInstances.forEach((mesh) => mesh.dispose());
      trainMeshes.forEach((mesh) => mesh.dispose());
      baseTrack?.dispose();
      if (root) root.dispose();
      if (trainRoot) trainRoot.dispose();
    };
  }, [scene]);

  return null;
};

export default TrainSystem;
