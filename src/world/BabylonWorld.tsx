// File: src/world/BabylonWorld.tsx
import React, { useEffect, useRef } from "react";
import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders";
import "@babylonjs/inspector";
import "@babylonjs/serializers";

const BabylonWorld: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
    const scene = new BABYLON.Scene(engine);

    // Camera
    const camera = new BABYLON.UniversalCamera("Camera", new BABYLON.Vector3(0, 2, -10), scene);
    camera.attachControl(canvas, true);
    camera.speed = 0.2;

    // Light
    const light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);

    // Ground
    const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 50, height: 50 }, scene);
    const groundMaterial = new BABYLON.StandardMaterial("groundMat", scene);
    groundMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.8, 0.2); // grass green
    ground.material = groundMaterial;

    // Skybox (simple gradient)
    const skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 1000.0 }, scene);
    const skyboxMaterial = new BABYLON.StandardMaterial("skyBoxMaterial", scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.7, 1); // blue sky
    skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    skybox.material = skyboxMaterial;

    // Mountains (simple grey boxes as placeholder)
    for (let i = 0; i < 10; i++) {
      const mountain = BABYLON.MeshBuilder.CreateBox(`mountain${i}`, { width: 5, height: 10, depth: 5 }, scene);
      mountain.position = new BABYLON.Vector3(Math.random() * 50 - 25, 5, Math.random() * 50 - 25);
      const mountainMat = new BABYLON.StandardMaterial(`mountMat${i}`, scene);
      mountainMat.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
      mountain.material = mountainMat;
    }

    // Character (placeholder)
    const player = BABYLON.MeshBuilder.CreateSphere("player", { diameter: 1 }, scene);
    player.position.y = 1;

    // Movement
    const inputMap: { [key: string]: boolean } = {};
    scene.actionManager = new BABYLON.ActionManager(scene);

    scene.onKeyboardObservable.add((kbInfo) => {
      const code = kbInfo.event.key.toLowerCase();
      if (kbInfo.type === BABYLON.KeyboardEventTypes.KEYDOWN) {
        inputMap[code] = true;
      } else if (kbInfo.type === BABYLON.KeyboardEventTypes.KEYUP) {
        inputMap[code] = false;
      }
    });

    scene.onBeforeRenderObservable.add(() => {
      const delta = 0.1;
      if (inputMap["w"]) player.position.z += delta;
      if (inputMap["s"]) player.position.z -= delta;
      if (inputMap["a"]) player.position.x -= delta;
      if (inputMap["d"]) player.position.x += delta;
    });

    engine.runRenderLoop(() => scene.render());

    window.addEventListener("resize", () => engine.resize());

    return () => {
      scene.dispose();
      engine.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} />;
};

export default BabylonWorld;
