import { useEffect } from "react";
import {
  Color3,
  Color4,
  Mesh,
  MeshBuilder,
  Scene,
  StandardMaterial,
  TransformNode,
  Vector3,
} from "@babylonjs/core";

type Star = {
  head: Mesh;
  tail: Mesh;
  trailPoints: Vector3[];
  velocity: Vector3;
  life: number;
  maxLife: number;
  phase: number;
};

type Props = {
  scene: Scene | null;
  enabled: boolean;
  count?: number;
  radius?: number;
  minHeight?: number;
  maxHeight?: number;
};

const randRange = (min: number, max: number) => min + Math.random() * (max - min);

const ShootingStars: React.FC<Props> = ({
  scene,
  enabled,
  count = 6,
  radius = 800,
  minHeight = 260,
  maxHeight = 520,
}) => {
  useEffect(() => {
    if (!scene || !enabled) return;
    const root = new TransformNode("shootingStarsRoot", scene);
    const starMat = new StandardMaterial("shootingStarMat", scene);
    starMat.emissiveColor = new Color3(1, 0.45, 0.05);
    starMat.diffuseColor = new Color3(1, 0.35, 0.05);
    starMat.disableLighting = true;
    starMat.backFaceCulling = false;
    starMat.fogEnabled = false;

    const tailColors = Array.from({ length: 14 }, (_, idx) => {
      const t = 1 - idx / 13;
      return new Color4(1, 0.45, 0.05, t * 0.8);
    });

    const spawnStar = (star: Star) => {
      const start = new Vector3(
        (Math.random() - 0.5) * radius * 2,
        randRange(minHeight, maxHeight),
        (Math.random() - 0.5) * radius * 2
      );
      const dir = new Vector3(randRange(-1, 1), randRange(-0.15, 0.1), randRange(-1, 1));
      if (dir.lengthSquared() < 0.01) dir.x = 1;
      dir.normalize();
      const speed = randRange(120, 220);
      star.head.position.copyFrom(start);
      star.velocity = dir.scale(speed);
      star.life = 0;
      star.maxLife = randRange(3, 5);
      star.trailPoints = Array.from({ length: tailColors.length }, () => start.clone());
    };

    const stars: Star[] = [];
    for (let i = 0; i < count; i += 1) {
      const head = MeshBuilder.CreateSphere(`shooting_star_${i}`, { diameter: 2.2, segments: 8 }, scene);
      head.material = starMat;
      head.parent = root;
      head.isPickable = false;
      const trailPoints = Array.from({ length: tailColors.length }, () => new Vector3(0, 0, 0));
      const tail = MeshBuilder.CreateLines(
        `shooting_star_tail_${i}`,
        { points: trailPoints, updatable: true, colors: tailColors },
        scene
      );
      tail.parent = root;
      tail.isPickable = false;
      (tail as any).fogEnabled = false;
      const star: Star = {
        head,
        tail,
        trailPoints,
        velocity: new Vector3(0, 0, 0),
        life: 0,
        maxLife: 0,
        phase: Math.random() * Math.PI * 2,
      };
      spawnStar(star);
      stars.push(star);
    }

    const startTime = performance.now();
    const obs = scene.onBeforeRenderObservable.add(() => {
      const now = performance.now();
      const dt = scene.getEngine().getDeltaTime() / 1000;
      const t = (now - startTime) / 1000;
      stars.forEach((star, idx) => {
        star.life += dt;
        if (star.life >= star.maxLife) {
          spawnStar(star);
        }
        star.head.position.addInPlace(star.velocity.scale(dt));
        const flicker = 0.55 + 0.45 * Math.sin(t * 12 + star.phase + idx);
        star.head.visibility = flicker;
        star.trailPoints.pop();
        star.trailPoints.unshift(star.head.position.clone());
        MeshBuilder.CreateLines(
          "shooting_star_tail_update",
          { points: star.trailPoints, colors: tailColors, instance: star.tail },
          scene
        );
      });
    });

    return () => {
      scene.onBeforeRenderObservable.remove(obs);
      stars.forEach((s) => {
        s.head.dispose();
        s.tail.dispose();
      });
      starMat.dispose();
      root.dispose();
    };
  }, [scene, enabled, count, radius, minHeight, maxHeight]);

  return null;
};

export default ShootingStars;
