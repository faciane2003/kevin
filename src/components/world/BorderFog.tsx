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
} from "@babylonjs/core";

type BorderFogSettings = {
  enabled: boolean;
  opacity: number;
  height: number;
  inset: number;
  color: Color3;
};

type Props = {
  scene: Scene | null;
  groundSize: number;
  settings: BorderFogSettings;
};

const BorderFog: React.FC<Props> = ({ scene, groundSize, settings }) => {
  const rootRef = useRef<TransformNode | null>(null);
  const planesRef = useRef<Mesh[]>([]);
  const matRef = useRef<StandardMaterial | null>(null);
  const gradientRef = useRef<DynamicTexture | null>(null);

  const buildGradient = useMemo(() => {
    return (texture: DynamicTexture, opacity: number) => {
      const ctx = texture.getContext();
      const size = texture.getSize();
      const grad = ctx.createLinearGradient(0, 0, 0, size.height);
      grad.addColorStop(0, `rgba(255,255,255,${opacity})`);
      grad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.clearRect(0, 0, size.width, size.height);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size.width, size.height);
      texture.update();
    };
  }, []);

  useEffect(() => {
    if (!scene) return;
    const root = new TransformNode("borderFogRoot", scene);
    rootRef.current = root;

    const gradient = new DynamicTexture("borderFogGradient", { width: 2, height: 256 }, scene, false);
    gradientRef.current = gradient;

    const mat = new StandardMaterial("borderFogMat", scene);
    mat.diffuseTexture = gradient;
    mat.opacityTexture = gradient;
    mat.emissiveTexture = gradient;
    mat.emissiveColor = settings.color.clone();
    mat.diffuseColor = settings.color.clone();
    mat.disableLighting = true;
    mat.backFaceCulling = false;
    mat.transparencyMode = Material.MATERIAL_ALPHABLEND;
    mat.alpha = 1;
    matRef.current = mat;

    const makePlane = (name: string) => {
      const plane = MeshBuilder.CreatePlane(name, { width: 1, height: 1 }, scene);
      plane.material = mat;
      plane.parent = root;
      return plane;
    };

    planesRef.current = [
      makePlane("borderFog_north"),
      makePlane("borderFog_south"),
      makePlane("borderFog_east"),
      makePlane("borderFog_west"),
    ];

    return () => {
      planesRef.current.forEach((plane) => plane.dispose());
      planesRef.current = [];
      gradient.dispose();
      mat.dispose();
      root.dispose();
    };
  }, [scene, settings.color, buildGradient]);

  useEffect(() => {
    if (!scene || !rootRef.current || !matRef.current || !gradientRef.current) return;
    const half = groundSize / 2;
    const inset = Math.max(0, settings.inset);
    const width = Math.max(10, groundSize - inset * 2);
    const height = Math.max(10, settings.height);
    const zOffset = half - inset;
    const xOffset = half - inset;

    buildGradient(gradientRef.current, settings.opacity);
    matRef.current.emissiveColor = settings.color.clone();
    matRef.current.diffuseColor = settings.color.clone();
    matRef.current.alpha = settings.enabled ? 1 : 0;

    const [north, south, east, west] = planesRef.current;
    if (!north) return;

    north.scaling = new Vector3(width, height, 1);
    south.scaling = new Vector3(width, height, 1);
    east.scaling = new Vector3(width, height, 1);
    west.scaling = new Vector3(width, height, 1);

    north.position = new Vector3(0, height / 2, zOffset);
    south.position = new Vector3(0, height / 2, -zOffset);
    east.position = new Vector3(xOffset, height / 2, 0);
    west.position = new Vector3(-xOffset, height / 2, 0);

    north.rotation.y = 0;
    south.rotation.y = Math.PI;
    east.rotation.y = Math.PI / 2;
    west.rotation.y = -Math.PI / 2;
  }, [scene, groundSize, settings, buildGradient]);

  return null;
};

export default BorderFog;
