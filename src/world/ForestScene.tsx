// File: src/world/ForestScene.tsx
import { Engine, Scene, MeshBuilder, UniversalCamera, HemisphericLight, ActionManager, ExecuteCodeAction, Vector3 } from '@babylonjs/core';
import { useEffect, useRef } from 'react';

export default function ForestScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new Engine(canvasRef.current, true);
    const scene = new Scene(engine);

    const camera = new UniversalCamera("camera", new Vector3(0, 2, -10), scene);
    camera.attachControl(canvasRef.current, true);

    const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);

    const ground = MeshBuilder.CreateGround("ground", { width: 50, height: 50 }, scene);
    const sphere = MeshBuilder.CreateSphere("sphere", { diameter: 1 }, scene);
    sphere.position.y = 1;

    light.intensity = 0.8;
    ground.receiveShadows = true;


    const inputMap: Record<string, boolean> = {};
    scene.actionManager = new ActionManager(scene);

    scene.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnKeyDownTrigger, evt => {
        inputMap[evt.sourceEvent.key] = true;
      })
    );
    scene.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnKeyUpTrigger, evt => {
        inputMap[evt.sourceEvent.key] = false;
      })
    );

    scene.onBeforeRenderObservable.add(() => {
      if (inputMap["w"]) sphere.position.z += 0.1;
      if (inputMap["s"]) sphere.position.z -= 0.1;
      if (inputMap["a"]) sphere.position.x -= 0.1;
      if (inputMap["d"]) sphere.position.x += 0.1;

      camera.position.x = sphere.position.x;
      camera.position.z = sphere.position.z - 5;
      camera.position.y = sphere.position.y + 2;
    });

    engine.runRenderLoop(() => scene.render());
    window.addEventListener('resize', () => engine.resize());

    return () => {
      scene.dispose();
      engine.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} style={{ width: '100vw', height: '100vh' }} />;
}
