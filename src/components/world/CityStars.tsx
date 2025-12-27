import { useEffect } from "react";
import {
  Color3,
  GlowLayer,
  MeshBuilder,
  Scene,
  StandardMaterial,
  TransformNode,
  Vector3,
} from "@babylonjs/core";

type Star = {
  mesh: any;
  phase: number;
};

type Props = {
  scene: Scene | null;
  count?: number;
  radius?: number;
  minHeight?: number;
  maxHeight?: number;
  scale?: number;
  glowLayer?: GlowLayer | null;
  rotationY?: number;
};

const CityStars: React.FC<Props> = ({
  scene,
  count = 80,
  radius = 700,
  minHeight = 140,
  maxHeight = 260,
  scale = 1,
  glowLayer = null,
  rotationY = 0,
}) => {
  useEffect(() => {
    if (!scene) return;
    const stars: Star[] = [];
    const root = new TransformNode("cityStarsRoot", scene);
    root.rotation.y = rotationY;
    const mat = new StandardMaterial("cityStarsMat", scene);
    mat.emissiveColor = new Color3(1, 1, 1);
    mat.diffuseColor = new Color3(1, 1, 1);
    mat.disableLighting = true;
    mat.fogEnabled = false;

    for (let i = 0; i < count; i += 1) {
      const size = Math.max(0.4, scale) * 1.1;
      const star = MeshBuilder.CreateSphere(
        `city_star_${i}`,
        { diameter: size, segments: 6 },
        scene
      );
      star.material = mat;
      star.isPickable = false;
      star.parent = root;
      star.position = new Vector3(
        (Math.random() - 0.5) * radius * 2,
        minHeight + Math.random() * (maxHeight - minHeight),
        (Math.random() - 0.5) * radius * 2
      );
      glowLayer?.addExcludedMesh(star);
      stars.push({
        mesh: star,
        phase: Math.random() * Math.PI * 2,
      });
    }

    const onRender = () => {
      const t = performance.now() * 0.001;
      stars.forEach((s) => {
        const osc = 0.5 + 0.5 * Math.sin(t * Math.PI * 2 + s.phase);
        const twinkle = 0.1 + 0.6 * osc;
        s.mesh.visibility = twinkle;
      });
    };
    scene.onBeforeRenderObservable.add(onRender);

    return () => {
      scene.onBeforeRenderObservable.removeCallback(onRender);
      stars.forEach((s) => s.mesh.dispose());
      mat.dispose();
      root.dispose();
    };
  }, [scene, count, radius, minHeight, maxHeight, scale, glowLayer, rotationY]);

  return null;
};

export default CityStars;
