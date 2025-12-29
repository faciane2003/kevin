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

  const buildGradient = useMemo(() => {
    return (
      texture: DynamicTexture,
      opacity: number,
      blur: number,
      fadeTop: number,
      fadeBottom: number
    ) => {
      const ctx = texture.getContext() as CanvasRenderingContext2D;
      const size = texture.getSize();
      ctx.clearRect(0, 0, size.width, size.height);
      const blurPx = Math.max(0, blur);
      ctx.filter = `blur(${blurPx}px)`;
      const topStart = Math.max(0, 1 - Math.min(1, Math.max(0.01, fadeTop)));
      const bottomEnd = Math.min(1, Math.max(0, fadeBottom));
      for (let y = 0; y < size.height; y += 1) {
        const t = y / (size.height - 1);
        let alpha = opacity;
        if (t > topStart) {
          alpha *= 1 - (t - topStart) / Math.max(0.001, 1 - topStart);
        }
        if (bottomEnd > 0 && t < bottomEnd) {
          alpha *= t / Math.max(0.001, bottomEnd);
        }
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.fillRect(0, size.height - y - 1, size.width, 1);
      }
      ctx.filter = "none";
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
    buildGradient(
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
  }, [scene, settings, buildGradient]);

  return null;
};

export default FogSphere;
