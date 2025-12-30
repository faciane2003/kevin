import { useEffect, useMemo, useRef } from "react";
import {
  Color3,
  DynamicTexture,
  Material,
  Mesh,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Texture,
  TransformNode,
  Vector3,
} from "@babylonjs/core";

type FogSphereSettings = {
  enabled: boolean;
  opacity: number;
  blur: number;
  radius: number;
  fadeTop: number;
  fadeBottom: number;
  offsetX: number;
  offsetY: number;
  offsetZ: number;
  color: Color3;
};

type Props = {
  scene: Scene | null;
  settings: FogSphereSettings;
};

const FogSphere: React.FC<Props> = ({ scene, settings }) => {
  const rootRef = useRef<TransformNode | null>(null);
  const sphereRef = useRef<Mesh | null>(null);
  const matRef = useRef<StandardMaterial | null>(null);
  const gradientRef = useRef<DynamicTexture | null>(null);

  const buildTexture = useMemo(() => {
    return (
      texture: DynamicTexture,
      opacity: number,
      blur: number,
      fadeTop: number,
      fadeBottom: number
    ) => {
      const ctx = texture.getContext() as CanvasRenderingContext2D;
      const { width, height } = texture.getSize();
      const imageData = ctx.createImageData(width, height);
      const topStart = Math.max(0, 1 - Math.min(1, Math.max(0.01, fadeTop)));
      const bottomEnd = Math.min(1, Math.max(0, fadeBottom));
      const centerX = width / 2;
      const centerY = height / 2;
      const maxRadius = Math.min(centerX, centerY);
      for (let y = 0; y < height; y += 1) {
        const v = y / (height - 1);
        for (let x = 0; x < width; x += 1) {
          const dx = x - centerX;
          const dy = y - centerY;
          const dist = Math.sqrt(dx * dx + dy * dy) / maxRadius;
          if (dist > 1) continue;
          let alpha = opacity * Math.pow(1 - dist, 1.6);
          if (v > topStart) {
            alpha *= 1 - (v - topStart) / Math.max(0.001, 1 - topStart);
          }
          if (bottomEnd > 0 && v < bottomEnd) {
            alpha *= v / Math.max(0.001, bottomEnd);
          }
          const noise = 0.55 + Math.random() * 0.45;
          alpha *= noise;
          const idx = (y * width + x) * 4;
          imageData.data[idx] = 255;
          imageData.data[idx + 1] = 255;
          imageData.data[idx + 2] = 255;
          imageData.data[idx + 3] = Math.min(255, Math.max(0, Math.round(alpha * 255)));
        }
      }
      ctx.clearRect(0, 0, width, height);
      ctx.putImageData(imageData, 0, 0);
      if (blur > 0) {
        const temp = document.createElement("canvas");
        temp.width = width;
        temp.height = height;
        const tempCtx = temp.getContext("2d");
        if (tempCtx) {
          tempCtx.drawImage(ctx.canvas, 0, 0);
          ctx.clearRect(0, 0, width, height);
          ctx.filter = `blur(${blur}px)`;
          ctx.drawImage(temp, 0, 0);
          ctx.filter = "none";
        }
      }
      texture.update();
    };
  }, []);

  useEffect(() => {
    if (!scene) return;
    const root = new TransformNode("fogSphereRoot", scene);
    rootRef.current = root;

    const gradient = new DynamicTexture("fogSphereGradient", { width: 256, height: 256 }, scene, false);
    gradientRef.current = gradient;
    gradient.hasAlpha = true;
    gradient.wrapU = Texture.CLAMP_ADDRESSMODE;
    gradient.wrapV = Texture.CLAMP_ADDRESSMODE;

    const mat = new StandardMaterial("fogSphereMat", scene);
    mat.diffuseTexture = gradient;
    mat.opacityTexture = gradient;
    mat.emissiveTexture = gradient;
    mat.emissiveColor = settings.color.clone();
    mat.diffuseColor = settings.color.clone();
    mat.disableLighting = true;
    mat.backFaceCulling = false;
    mat.transparencyMode = Material.MATERIAL_ALPHABLEND;
    mat.alpha = 1;
    mat.fogEnabled = false;
    matRef.current = mat;

    const sphere = MeshBuilder.CreateSphere("fogSphere", { diameter: 2, segments: 32 }, scene);
    sphere.parent = root;
    sphere.material = mat;
    sphere.isPickable = false;
    sphereRef.current = sphere;

    return () => {
      sphere.dispose();
      gradient.dispose();
      mat.dispose();
      root.dispose();
    };
  }, [scene, settings.color]);

  useEffect(() => {
    if (!scene || !rootRef.current || !sphereRef.current || !matRef.current || !gradientRef.current) return;
    buildTexture(
      gradientRef.current,
      settings.opacity,
      settings.blur,
      settings.fadeTop,
      settings.fadeBottom
    );
    matRef.current.emissiveColor = settings.color.clone();
    matRef.current.diffuseColor = settings.color.clone();
    matRef.current.alpha = settings.enabled ? 1 : 0;
    sphereRef.current.scaling = new Vector3(settings.radius, settings.radius, settings.radius);
    rootRef.current.position = new Vector3(settings.offsetX, settings.offsetY, settings.offsetZ);
  }, [scene, settings, buildTexture]);

  return null;
};

export default FogSphere;
