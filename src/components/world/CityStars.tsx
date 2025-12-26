import { useEffect } from "react";
import { Color3, GlowLayer, MeshBuilder, Scene, StandardMaterial, Vector3 } from "@babylonjs/core";

type Star = {
  mesh: any;
  base: number;
  speed: number;
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
};

const CityStars: React.FC<Props> = ({
  scene,
  count = 80,
  radius = 700,
  minHeight = 140,
  maxHeight = 260,
  scale = 1,
  glowLayer = null,
}) => {
  useEffect(() => {
    if (!scene) return;
    const stars: Star[] = [];
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
      star.position = new Vector3(
        (Math.random() - 0.5) * radius * 2,
        minHeight + Math.random() * (maxHeight - minHeight),
        (Math.random() - 0.5) * radius * 2
      );
      glowLayer?.addExcludedMesh(star);
      stars.push({
        mesh: star,
        base: 0.35 + Math.random() * 0.4,
        speed: 0.6 + Math.random() * 1.2,
        phase: Math.random() * Math.PI * 2,
      });
    }

    const onRender = () => {
      const t = performance.now() * 0.001;
      stars.forEach((s) => {
        const twinkle = s.base + Math.sin(t * s.speed + s.phase) * 0.25;
        s.mesh.visibility = Math.max(0.1, Math.min(1, twinkle));
      });
    };
    scene.onBeforeRenderObservable.add(onRender);

    return () => {
      scene.onBeforeRenderObservable.removeCallback(onRender);
      stars.forEach((s) => s.mesh.dispose());
      mat.dispose();
    };
  }, [scene, count, radius, minHeight, maxHeight, scale, glowLayer]);

  return null;
};

export default CityStars;
