import { useEffect, useMemo, useRef } from "react";
import {
  Color3,
  DynamicTexture,
  Material,
  Mesh,
  MeshBuilder,
  Scene,
  StandardMaterial,
  TransformNode,
  Vector3,
  VertexBuffer,
} from "@babylonjs/core";

type TopFogSettings = {
  enabled: boolean;
  opacity: number;
  height: number;
  radius: number;
  fadeTop: number;
  offsetX: number;
  offsetY: number;
  offsetZ: number;
  color: Color3;
};

type Props = {
  scene: Scene | null;
  settings: TopFogSettings;
};

const TopFog: React.FC<Props> = ({ scene, settings }) => {
  const rootRef = useRef<TransformNode | null>(null);
  const fogRef = useRef<Mesh | null>(null);
  const matRef = useRef<StandardMaterial | null>(null);
  const gradientRef = useRef<DynamicTexture | null>(null);
  const basePositionsRef = useRef<Float32Array | null>(null);

  const buildGradient = useMemo(() => {
    return (texture: DynamicTexture, opacity: number, fadeTop: number) => {
      const ctx = texture.getContext();
      const size = texture.getSize();
      ctx.clearRect(0, 0, size.width, size.height);
      const clampedFade = Math.min(1, Math.max(0.02, fadeTop));
      const fadeStart = Math.max(0, 1 - clampedFade);
      for (let y = 0; y < size.height; y += 1) {
        const t = y / (size.height - 1);
        const fadeT = t < fadeStart ? 0 : (t - fadeStart) / (1 - fadeStart);
        const smooth = fadeT <= 0 ? 1 : fadeT >= 1 ? 0 : 1 - fadeT * fadeT * (3 - 2 * fadeT);
        const noise = 0.85 + 0.15 * (0.5 + 0.5 * Math.sin((y + 13.7) * 0.21));
        const alpha = opacity * smooth * noise;
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.fillRect(0, size.height - y - 1, size.width, 1);
      }
      texture.update();
    };
  }, []);

  const applySurfaceNoise = (fog: Mesh, strength = 0.22) => {
    const base = basePositionsRef.current;
    const positions = fog.getVerticesData(VertexBuffer.PositionKind) as Float32Array | null;
    if (!base || !positions) return;
    for (let i = 0; i < positions.length; i += 3) {
      const bx = base[i];
      const by = base[i + 1];
      const bz = base[i + 2];
      const heightNorm = Math.max(0, (by + 0.5) * 2);
      const noise =
        Math.sin(bx * 12.9898 + bz * 78.233) * 43758.5453 -
        Math.floor(Math.sin(bx * 12.9898 + bz * 78.233) * 43758.5453);
      const bump = (noise - 0.5) * strength * heightNorm;
      positions[i] = bx;
      positions[i + 1] = by + bump;
      positions[i + 2] = bz;
    }
    fog.updateVerticesData(VertexBuffer.PositionKind, positions);
  };

  useEffect(() => {
    if (!scene) return;
    const root = new TransformNode("topFogRoot", scene);
    rootRef.current = root;

    const gradient = new DynamicTexture("topFogGradient", { width: 64, height: 256 }, scene, false);
    gradientRef.current = gradient;

    const mat = new StandardMaterial("topFogMat", scene);
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

    const fog = MeshBuilder.CreateCylinder(
      "topFogCylinder",
      { diameter: 2, height: 1, tessellation: 32 },
      scene
    );
    fog.parent = root;
    fog.material = mat;
    fog.isPickable = false;
    fogRef.current = fog;
    basePositionsRef.current = (fog.getVerticesData(VertexBuffer.PositionKind) || []).slice() as Float32Array;
    applySurfaceNoise(fog);

    return () => {
      fog.dispose();
      gradient.dispose();
      mat.dispose();
      root.dispose();
    };
  }, [scene, settings.color, buildGradient]);

  useEffect(() => {
    if (!scene || !fogRef.current || !matRef.current || !gradientRef.current || !rootRef.current) return;
    buildGradient(gradientRef.current, settings.opacity, settings.fadeTop);
    matRef.current.emissiveColor = settings.color.clone();
    matRef.current.diffuseColor = settings.color.clone();
    matRef.current.alpha = settings.enabled ? 1 : 0;

    fogRef.current.scaling = new Vector3(settings.radius, settings.height, settings.radius);
    rootRef.current.position = new Vector3(settings.offsetX, settings.offsetY + settings.height / 2, settings.offsetZ);
    applySurfaceNoise(fogRef.current);
  }, [scene, settings, buildGradient]);

  return null;
};

export default TopFog;
