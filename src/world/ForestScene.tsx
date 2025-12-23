// File: src/world/ForestScene.tsx
import React, { useEffect, useRef } from "react";
import {
  Engine,
  Scene,
  Vector3,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Texture,
  HemisphericLight,
  FreeCamera,
} from "@babylonjs/core";
import "@babylonjs/loaders";

const ForestScene: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
    const scene = new Scene(engine);

    // First-person camera
    const camera = new FreeCamera("fpCamera", new Vector3(0, 1.6, -5), scene); // eye height 1.6
    camera.attachControl(canvas, true);
    camera.speed = 0.2;

    // Light
    const light = new HemisphericLight("hemiLight", new Vector3(0, 1, 0), scene);
    light.intensity = 0.9;

    // Ground
    const ground = MeshBuilder.CreateGround("ground", { width: 50, height: 50 }, scene);
    const groundMat = new StandardMaterial("groundMat", scene);
    const grassTexture = new Texture("https://assets.babylonjs.com/environments/grass.jpg", scene);
    groundMat.diffuseTexture = grassTexture;
    ground.material = groundMat;

    // Player mesh (optional visual)
    const player = MeshBuilder.CreateBox("player", { height: 2, width: 1, depth: 1 }, scene);
    player.position.y = 1;
    player.isVisible = false; // hide since we're in 1st person

    // Ground interaction example
    ground.actionManager = new BABYLON.ActionManager(scene as any);
    ground.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(
        { trigger: BABYLON.ActionManager.OnPickTrigger },
        (evt: any) => {
          console.log("Ground clicked", evt);
        }
      )
    );

    engine.runRenderLoop(() => scene.render());

    window.addEventListener("resize", () => engine.resize());

    return () => {
      engine.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} style={{ width: "100%", height: "100vh", display: "block" }} />;
};

export default ForestScene;
