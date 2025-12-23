// File: src/world/BabylonWorld.tsx
import React, { useEffect, useRef } from "react";
import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  MeshBuilder,
  StandardMaterial,
  Color3,
  KeyboardEventTypes,
  ActionManager,
  ExecuteCodeAction,
} from "@babylonjs/core";

const BabylonWorld: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new Engine(canvasRef.current, true);
    const scene = new Scene(engine);

    // Camera
    const camera = new ArcRotateCamera(
      "camera",
      Math.PI / 2,
      Math.PI / 4,
      10,
      new Vector3(0, 1, 0),
      scene
    );
    camera.attachControl(canvasRef.current, true);

    // Light
    const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);

    // Ground
    const ground = MeshBuilder.CreateGround("ground", { width: 100, height: 100 }, scene);
    const groundMat = new StandardMaterial("groundMat", scene);
    groundMat.diffuseColor = new Color3(0.3, 0.8, 0.3); // green grass
    ground.material = groundMat;

    // Mountains (simple boxes for now)
    const mountainMat = new StandardMaterial("mountainMat", scene);
    mountainMat.diffuseColor = new Color3(0.5, 0.5, 0.5); // gray mountains
    const mountain = MeshBuilder.CreateBox("mountain", { width: 50, height: 20, depth: 10 }, scene);
    mountain.position = new Vector3(0, 10, -40);
    mountain.material = mountainMat;

    // Player sphere
    const player = MeshBuilder.CreateSphere("player", { diameter: 1 }, scene);
    player.position = new Vector3(0, 1, 0);
    const playerMat = new StandardMaterial("playerMat", scene);
    playerMat.diffuseColor = new Color3(1, 0, 0); // red
    player.material = playerMat;

    // WASD movement
    const inputMap: { [key: string]: boolean } = {};
    scene.actionManager = new ActionManager(scene);

    scene.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnKeyDownTrigger, (evt) => {
        inputMap[evt.sourceEvent.key.toLowerCase()] = true;
      })
    );

    scene.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnKeyUpTrigger, (evt) => {
        inputMap[evt.sourceEvent.key.toLowerCase()] = false;
      })
    );

    const speed = 0.2;
    scene.onBeforeRenderObservable.add(() => {
      if (inputMap["w"]) player.position.z -= speed;
      if (inputMap["s"]) player.position.z += speed;
      if (inputMap["a"]) player.position.x -= speed;
      if (inputMap["d"]) player.position.x += speed;

      // Move camera to follow player
      camera.target = player.position;
    });

    engine.runRenderLoop(() => {
      scene.render();
    });

    window.addEventListener("resize", () => {
      engine.resize();
    });

    return () => {
      scene.dispose();
      engine.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} style={{ width: "100vw", height: "100vh", display: "block" }} />;
};

export default BabylonWorld;
