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

type Props = {
  scene: Scene | null;
  count?: number;
};

const ShootingStars: React.FC<Props> = ({ scene, count = 6 }) => {
  useEffect(() => {
    if (!scene) return;
    const stars: {
      root: TransformNode;
      head: Mesh;
      trailA: Mesh;
      trailB: Mesh;
      trailPoints: Vector3[];
      trailPointsA: Vector3[];
      trailPointsB: Vector3[];
      trailColors: Color4[];
      velocity: Vector3;
      trailOffset: number;
      ttl: number;
      active: boolean;
    }[] = [];

    const headMat = new StandardMaterial("shootingStarHeadMat", scene);
    headMat.emissiveColor = new Color3(1, 0.65, 0.1);
    headMat.diffuseColor = new Color3(1, 0.55, 0.05);
    headMat.disableLighting = true;
    headMat.fogEnabled = false;

    for (let i = 0; i < count; i += 1) {
      const root = new TransformNode(`shooting_star_root_${i}`, scene);
      const head = MeshBuilder.CreateDisc(`shooting_star_head_${i}`, { radius: 9, tessellation: 18 }, scene);
      head.material = headMat;
      head.parent = root;
      head.scaling = new Vector3(1.9, 1, 1);

      const trailLength = 26;
      const trailPoints = Array.from({ length: trailLength }, () => root.position.clone());
      const trailPointsA = trailPoints.map((p) => p.clone());
      const trailPointsB = trailPoints.map((p) => p.clone());
      const trailColors = Array.from({ length: trailLength }, (_, idx) => {
        const t = 1 - idx / (trailLength - 1);
        const alpha = 0.9 * t;
        return new Color4(1, 0.78, 0.3, alpha);
      });
      const trailA = MeshBuilder.CreateLines(
        `shooting_star_trail_a_${i}`,
        { points: trailPointsA, updatable: true, colors: trailColors },
        scene
      );
      const trailB = MeshBuilder.CreateLines(
        `shooting_star_trail_b_${i}`,
        { points: trailPointsB, updatable: true, colors: trailColors },
        scene
      );
      [trailA, trailB].forEach((trail) => {
        trail.color = new Color3(1, 0.78, 0.3);
        trail.alpha = 1;
        (trail as any).fogEnabled = false;
        trail.isPickable = false;
      });
      root.setEnabled(false);
      stars.push({
        root,
        head,
        trailA,
        trailB,
        trailPoints,
        trailPointsA,
        trailPointsB,
        trailColors,
        velocity: Vector3.Zero(),
        trailOffset: 3.2,
        ttl: 0,
        active: false,
      });
    }

    const spawnStar = (star: typeof stars[number]) => {
      star.root.setEnabled(true);
      star.active = true;
      star.ttl = 3 + Math.random() * 2;
      const startX = (Math.random() - 0.5) * 1600;
      const startY = 450 + Math.random() * 300;
      const startZ = (Math.random() - 0.5) * 1600;
      star.root.position = new Vector3(startX, startY, startZ);
      const dir = new Vector3(Math.random() * 0.6 + 0.2, -0.2 - Math.random() * 0.4, Math.random() * 0.6 + 0.2);
      dir.normalize();
      star.velocity = dir.scale(220 + Math.random() * 120);
      const yaw = Math.atan2(dir.x, dir.z);
      const pitch = Math.atan2(dir.y, Math.sqrt(dir.x * dir.x + dir.z * dir.z));
      star.root.rotation = new Vector3(-pitch, yaw, 0);
    };

    const onBeforeRender = scene.onBeforeRenderObservable.add(() => {
      const dt = scene.getEngine().getDeltaTime() / 1000;
      stars.forEach((star) => {
        if (!star.active) {
          if (Math.random() < 0.002) spawnStar(star);
          return;
        }
        star.ttl -= dt;
        if (star.ttl <= 0) {
          star.active = false;
          star.root.setEnabled(false);
          return;
        }
        star.root.position.addInPlace(star.velocity.scale(dt));
        star.trailPoints.pop();
        star.trailPoints.unshift(star.root.position.clone());
        const dir = star.velocity.clone().normalize();
        const right = Vector3.Cross(dir, Vector3.Up()).normalize().scale(star.trailOffset);
        const left = right.scale(-1);
        for (let i = 0; i < star.trailPoints.length; i += 1) {
          star.trailPointsA[i].copyFrom(star.trailPoints[i]).addInPlace(right);
          star.trailPointsB[i].copyFrom(star.trailPoints[i]).addInPlace(left);
        }
        MeshBuilder.CreateLines(
          "shooting_star_trail_update_a",
          { points: star.trailPointsA, colors: star.trailColors, instance: star.trailA },
          scene
        );
        MeshBuilder.CreateLines(
          "shooting_star_trail_update_b",
          { points: star.trailPointsB, colors: star.trailColors, instance: star.trailB },
          scene
        );
      });
    });

    return () => {
      scene.onBeforeRenderObservable.remove(onBeforeRender);
      stars.forEach((star) => {
        star.head.dispose();
        star.trailA.dispose();
        star.trailB.dispose();
        star.root.dispose();
      });
      headMat.dispose();
    };
  }, [scene, count]);

  return null;
};

export default ShootingStars;
