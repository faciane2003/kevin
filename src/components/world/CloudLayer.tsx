import { useEffect } from "react";
import {
  Color3,
  DynamicTexture,
  Mesh,
  MeshBuilder,
  Scene,
  StandardMaterial,
  TransformNode,
  Vector3,
} from "@babylonjs/core";

type Props = {
  scene: Scene | null;
  count?: number;
};

const CloudLayer: React.FC<Props> = ({ scene, count = 14 }) => {
  useEffect(() => {
    if (!scene) return;
    const root = new TransformNode("cloudLayerRoot", scene);
    const clouds: { mesh: Mesh; drift: Vector3 }[] = [];

    const texture = new DynamicTexture("cloudBlobTex", { width: 256, height: 256 }, scene, true);
    const ctx = texture.getContext();
    ctx.clearRect(0, 0, 256, 256);
    ctx.filter = "blur(8px)";
    for (let i = 0; i < 6; i += 1) {
      const radius = 48 + Math.random() * 40;
      const x = 60 + Math.random() * 140;
      const y = 60 + Math.random() * 140;
      const alpha = 0.35 + Math.random() * 0.3;
      ctx.beginPath();
      ctx.fillStyle = `rgba(200,200,210,${alpha})`;
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.filter = "none";
    texture.update();

    const mat = new StandardMaterial("cloudMat", scene);
    mat.diffuseTexture = texture;
    mat.opacityTexture = texture;
    mat.emissiveColor = new Color3(0.8, 0.82, 0.85);
    mat.disableLighting = true;
    mat.backFaceCulling = false;
    mat.alpha = 0.55;
    mat.fogEnabled = false;

    for (let i = 0; i < count; i += 1) {
      const cloud = MeshBuilder.CreatePlane(`cloud_${i}`, { width: 180, height: 120 }, scene);
      cloud.parent = root;
      cloud.material = mat;
      cloud.isPickable = false;
      cloud.position = new Vector3(
        (Math.random() - 0.5) * 900,
        160 + Math.random() * 120,
        (Math.random() - 0.5) * 900
      );
      cloud.rotation.y = Math.random() * Math.PI * 2;
      cloud.rotation.x = (Math.random() - 0.5) * 0.15;
      const drift = new Vector3((Math.random() - 0.5) * 0.6, 0, (Math.random() - 0.5) * 0.6);
      clouds.push({ mesh: cloud, drift });
    }

    const onBeforeRender = scene.onBeforeRenderObservable.add(() => {
      const dt = scene.getEngine().getDeltaTime() / 1000;
      clouds.forEach((c) => {
        c.mesh.position.addInPlace(c.drift.scale(dt * 8));
        if (c.mesh.position.x > 520) c.mesh.position.x = -520;
        if (c.mesh.position.x < -520) c.mesh.position.x = 520;
        if (c.mesh.position.z > 520) c.mesh.position.z = -520;
        if (c.mesh.position.z < -520) c.mesh.position.z = 520;
      });
    });

    return () => {
      scene.onBeforeRenderObservable.remove(onBeforeRender);
      clouds.forEach((c) => c.mesh.dispose());
      mat.dispose();
      texture.dispose();
      root.dispose();
    };
  }, [scene, count]);

  return null;
};

export default CloudLayer;
