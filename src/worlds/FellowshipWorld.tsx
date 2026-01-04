// File: src/worlds/FellowshipWorld.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  Color3,
  Color4,
  DynamicTexture,
  Engine,
  HemisphericLight,
  ActionManager,
  ExecuteCodeAction,
  Mesh,
  MeshBuilder,
  ParticleSystem,
  PointerEventTypes,
  PointLight,
  Scene,
  SceneLoader,
  SpotLight,
  StandardMaterial,
  Texture,
  TransformNode,
  UniversalCamera,
  Vector3,
  VideoTexture,
} from "@babylonjs/core";
import { GLTF2Export } from "@babylonjs/serializers";
import WorldSounds from "../components/sounds/WorldSounds";

type FellowshipManifest = {
  images?: string[];
  videos?: string[];
};

const FALLBACK_FRAMES = 240;
const PHOTO_BASE_PATH = "/photos/fellowship/";
const VIDEO_BASE_PATH = "/videos/fellowship/";
const isAbsolutePath = (value: string) => value.startsWith("/") || value.startsWith("http");

const FellowshipWorld: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sceneInstance, setSceneInstance] = useState<Scene | null>(null);
  const sprintModeRef = useRef(false);
  const walkInputActiveRef = useRef(false);
  const rollerSparkleTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new Engine(canvasRef.current, true);
    const scene = new Scene(engine);
    setSceneInstance(scene);
    scene.clearColor = new Color4(0.02, 0.03, 0.05, 1);

    const camera = new UniversalCamera("galleryCamera", new Vector3(0, 2, -18), scene);
    camera.attachControl(canvasRef.current, true);
    camera.inputs.removeByType("FreeCameraKeyboardMoveInput");
    camera.speed = 0.6;
    camera.angularSensibility = 4000;
    camera.minZ = 0.1;
    camera.keysUp = [];
    camera.keysDown = [];
    camera.keysLeft = [];
    camera.keysRight = [];
    scene.collisionsEnabled = true;
    camera.checkCollisions = true;
    camera.applyGravity = false;
    camera.ellipsoid = new Vector3(0.9, 1.3, 0.9);
    camera.ellipsoidOffset = new Vector3(0, 1.3, 0);
    scene.gravity = new Vector3(0, -0.6, 0);

    const light = new HemisphericLight("galleryLight", new Vector3(0, 1, 0), scene);
    light.intensity = 0.9;
    light.diffuse = new Color3(1, 1, 1);
    light.groundColor = new Color3(0.1, 0.1, 0.1);

    const isTextInputActive = () => {
      const active = document.activeElement as HTMLElement | null;
      if (!active) return false;
      const tag = active.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || active.isContentEditable;
    };

    const inputMap: { [key: string]: boolean } = {};
    scene.actionManager = new ActionManager(scene);
    let jumpRequested = false;
    let verticalVel = 0;
    const gravity = -20;
    const jumpSpeed = 8;
    const eyeHeight = camera.ellipsoidOffset.y;

    const sparkleTexture = new DynamicTexture("gallerySparkleTexture", { width: 64, height: 64 }, scene, true);
    const sparkleCtx = sparkleTexture.getContext();
    const sparkleGrad = sparkleCtx.createRadialGradient(32, 32, 2, 32, 32, 30);
    sparkleGrad.addColorStop(0, "rgba(255,255,255,1)");
    sparkleGrad.addColorStop(0.4, "rgba(255,255,255,0.9)");
    sparkleGrad.addColorStop(1, "rgba(255,255,255,0)");
    sparkleCtx.clearRect(0, 0, 64, 64);
    sparkleCtx.fillStyle = sparkleGrad;
    sparkleCtx.fillRect(0, 0, 64, 64);
    sparkleTexture.update();

    const sparkleAnchor = new TransformNode("gallerySparkleAnchor", scene);
    const spawnFootSparkles = (color: Color4) => {
      const system = new ParticleSystem("galleryFootSparkles", 140, scene);
      system.particleTexture = sparkleTexture;
      const forward = camera.getDirection(new Vector3(0, 0, 1));
      sparkleAnchor.position = camera.position.add(forward.scale(2.1));
      sparkleAnchor.position.y = camera.position.y - 1.1;
      system.emitter = sparkleAnchor as any;
      system.minEmitBox = new Vector3(-1.2, -0.4, -1.2);
      system.maxEmitBox = new Vector3(1.2, 0.4, 1.2);
      system.color1 = color;
      system.color2 = color;
      system.colorDead = new Color4(color.r, color.g, color.b, 0);
      system.minSize = 0.14;
      system.maxSize = 0.38;
      system.minLifeTime = 0.25;
      system.maxLifeTime = 0.6;
      system.emitRate = 320;
      system.blendMode = ParticleSystem.BLENDMODE_ADD;
      system.gravity = new Vector3(0, -3, 0);
      system.minEmitPower = 0.4;
      system.maxEmitPower = 1.2;
      system.updateSpeed = 0.012;
      system.start();
      window.setTimeout(() => {
        system.stop();
        system.dispose();
      }, 450);
    };

    const scheduleRollerSparkles = () => {
      if (!sprintModeRef.current) return;
      if (!walkInputActiveRef.current) return;
      const delay = 900 + Math.random() * 900;
      rollerSparkleTimerRef.current = window.setTimeout(() => {
        if (sprintModeRef.current && walkInputActiveRef.current) {
          spawnFootSparkles(new Color4(1, 0.25, 0.2, 1));
        }
        scheduleRollerSparkles();
      }, delay);
    };
    const updateRollerSparkles = () => {
      if (rollerSparkleTimerRef.current) {
        window.clearTimeout(rollerSparkleTimerRef.current);
        rollerSparkleTimerRef.current = null;
      }
      scheduleRollerSparkles();
    };

    const setWalkActive = (active: boolean) => {
      if (walkInputActiveRef.current === active) return;
      walkInputActiveRef.current = active;
      window.dispatchEvent(new CustomEvent("walk-input", { detail: { active } }));
      updateRollerSparkles();
    };

    const onHudItemClick = (evt: Event) => {
      const { detail } = evt as CustomEvent<{ label?: string }>;
      const { label } = detail ?? {};
      if (label !== "Rollerblades") return;
      sprintModeRef.current = !sprintModeRef.current;
      spawnFootSparkles(
        sprintModeRef.current ? new Color4(1, 0.84, 0.2, 1) : new Color4(0.3, 0.6, 1, 1)
      );
      updateRollerSparkles();
    };
    window.addEventListener("hud-item-click", onHudItemClick as EventListener);

    scene.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnKeyDownTrigger, (evt) => {
        if (isTextInputActive()) return;
        const key = evt.sourceEvent.key.toLowerCase();
        if (key === "w" || key === "a" || key === "s" || key === "d" || key === " ") {
          try { evt.sourceEvent.preventDefault(); } catch {}
        }
        inputMap[key] = true;
        const walkActive = !!(inputMap["w"] || inputMap["a"] || inputMap["s"] || inputMap["d"]);
        setWalkActive(walkActive);
        if (evt.sourceEvent.code === "Space") {
          jumpRequested = true;
          inputMap["space"] = true;
        }
      })
    );

    scene.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnKeyUpTrigger, (evt) => {
        if (isTextInputActive()) return;
        inputMap[evt.sourceEvent.key.toLowerCase()] = false;
        const walkActive = !!(inputMap["w"] || inputMap["a"] || inputMap["s"] || inputMap["d"]);
        setWalkActive(walkActive);
        if (evt.sourceEvent.code === "Space") {
          inputMap["space"] = false;
        }
      })
    );

    const onJumpInput = (evt: Event) => {
      const { detail } = evt as CustomEvent<{ active: boolean }>;
      if (detail?.active) jumpRequested = true;
    };
    window.addEventListener("jump-input", onJumpInput as EventListener);

    const clearWalkInput = () => {
      inputMap["w"] = false;
      inputMap["a"] = false;
      inputMap["s"] = false;
      inputMap["d"] = false;
      inputMap["shift"] = false;
      inputMap["space"] = false;
      setWalkActive(false);
    };

    const onWindowBlur = () => {
      clearWalkInput();
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        clearWalkInput();
      }
    };

    window.addEventListener("blur", onWindowBlur);
    document.addEventListener("visibilitychange", onVisibilityChange);

    const moveSpeed = 10.67;
    let lastMoving = false;
    scene.onBeforeRenderObservable.add(() => {
      const dt = engine.getDeltaTime() / 1000;
      const forward = camera.getDirection(new Vector3(0, 0, 1));
      forward.y = 0;
      forward.normalize();
      const right = Vector3.Cross(forward, Vector3.Up());
      right.normalize();

      const move = new Vector3(0, 0, 0);
      if (inputMap["w"]) move.addInPlace(forward);
      if (inputMap["s"]) move.addInPlace(forward.scale(-1));
      if (inputMap["a"]) move.addInPlace(right);
      if (inputMap["d"]) move.addInPlace(right.scale(-1));

      const isMoving = move.lengthSquared() > 0;
      if (isMoving) {
        move.normalize();
        const sprintMultiplier = sprintModeRef.current ? 2 : 1;
        const baseMultiplier = sprintModeRef.current ? sprintMultiplier : (inputMap["shift"] ? 4 : 1);
        const speed = moveSpeed * baseMultiplier;
        move.scaleInPlace(speed * dt);
      }
      if (isMoving !== lastMoving) {
        lastMoving = isMoving;
        window.dispatchEvent(new CustomEvent("player-move", { detail: { moving: isMoving } }));
      }

      const tryMove = (delta: Vector3) => {
        const horizontal = new Vector3(delta.x, 0, delta.z);
        if (horizontal.lengthSquared() > 0) {
          if (camera.checkCollisions && scene.collisionsEnabled && typeof (camera as any)._collideWithWorld === "function") {
            (camera as any)._collideWithWorld(horizontal);
          } else {
            camera.position.addInPlace(horizontal);
          }
        }
        const proposedPos = camera.position.clone();
        const groundY = 0;
        if (jumpRequested && Math.abs(camera.position.y - (groundY + eyeHeight)) < 0.12) {
          verticalVel = jumpSpeed;
          jumpRequested = false;
        }
        verticalVel += gravity * dt;
        proposedPos.y += verticalVel * dt;

        const minY = groundY + eyeHeight;
        if (proposedPos.y <= minY) {
          proposedPos.y = minY;
          verticalVel = 0;
        }
        camera.position = proposedPos;
      };

      tryMove(move);
    });

    const placeholderTexture = new DynamicTexture("galleryPlaceholder", { width: 512, height: 384 }, scene, true);
    const placeholderCtx = placeholderTexture.getContext() as CanvasRenderingContext2D;
    placeholderCtx.fillStyle = "#0b0f1c";
    placeholderCtx.fillRect(0, 0, 512, 384);
    placeholderCtx.strokeStyle = "rgba(255,255,255,0.2)";
    placeholderCtx.lineWidth = 8;
    placeholderCtx.strokeRect(10, 10, 492, 364);
    placeholderCtx.fillStyle = "rgba(255,255,255,0.65)";
    placeholderCtx.font = "28px Consolas, Menlo, monospace";
    placeholderCtx.textAlign = "center";
    placeholderCtx.fillText("Fellowship Gallery", 256, 180);
    placeholderCtx.fillText("Add images to", 256, 230);
    placeholderCtx.fillText("public/photos/fellowship", 256, 270);
    placeholderTexture.update();

    const createdMeshes: Mesh[] = [];
    const createdMaterials: StandardMaterial[] = [];
    const createdTextures: Array<Texture | VideoTexture | DynamicTexture> = [placeholderTexture, sparkleTexture];
    const createdObservers: Array<{ remove: () => void }> = [];

    const createWall = (name: string, width: number, height: number, position: Vector3, rotationY = 0) => {
      const wall = MeshBuilder.CreatePlane(name, { width, height }, scene);
      wall.position = position;
      wall.rotation.y = rotationY;
      wall.checkCollisions = true;
      wall.isPickable = false;
      const wallMat = new StandardMaterial(`${name}Mat`, scene);
      wallMat.diffuseColor = new Color3(0.12, 0.12, 0.14);
      wallMat.specularColor = new Color3(0, 0, 0);
      wall.material = wallMat;
      createdMeshes.push(wall);
      createdMaterials.push(wallMat);
      return wall;
    };

    const createFrame = (
      name: string,
      texture: Texture | VideoTexture | DynamicTexture,
      position: Vector3,
      rotationY: number,
      width = 4,
      height = 3
    ) => {
      const plane = MeshBuilder.CreatePlane(name, { width, height }, scene);
      plane.position = position;
      plane.rotation.y = rotationY;
      const mat = new StandardMaterial(`${name}Mat`, scene);
      mat.diffuseTexture = texture;
      mat.emissiveTexture = texture;
      mat.emissiveColor = new Color3(1, 1, 1);
      mat.specularColor = new Color3(0.1, 0.1, 0.1);
      mat.backFaceCulling = false;
      mat.disableLighting = true;
      plane.material = mat;
      createdMeshes.push(plane);
      createdMaterials.push(mat);
    };

    const createReturnDoor = (roomDepth: number) => {
      const door = MeshBuilder.CreateBox("returnDoor", { width: 3.5, height: 5.5, depth: 0.3 }, scene);
      door.position = new Vector3(0, 2.75, roomDepth / 2 - 0.4);
      door.rotation.y = 0;
      door.isPickable = true;
      door.checkCollisions = true;
      const doorMat = new StandardMaterial("returnDoorMat", scene);
      doorMat.diffuseColor = new Color3(0.05, 0.08, 0.12);
      doorMat.emissiveColor = new Color3(0.15, 0.25, 0.4);
      door.material = doorMat;
      createdMeshes.push(door);
      createdMaterials.push(doorMat);

      const sign = MeshBuilder.CreatePlane("returnDoorSign", { width: 6.5, height: 1.4 }, scene);
      sign.position = new Vector3(0, 6.2, roomDepth / 2 - 0.2);
      sign.rotation.y = 0;
      sign.isPickable = false;
      const signTex = new DynamicTexture("returnDoorSignTex", { width: 512, height: 128 }, scene, true);
      const signCtx = signTex.getContext() as CanvasRenderingContext2D;
      signCtx.clearRect(0, 0, 512, 128);
      signCtx.fillStyle = "rgba(0,0,0,0.6)";
      signCtx.fillRect(0, 0, 512, 128);
      signCtx.fillStyle = "#e6f3ff";
      signCtx.font = "bold 54px Consolas, Menlo, monospace";
      signCtx.textAlign = "center";
      signCtx.textBaseline = "middle";
      signCtx.fillText("Jacuzzi City", 256, 64);
      signTex.update();
      const signMat = new StandardMaterial("returnDoorSignMat", scene);
      signMat.diffuseTexture = signTex;
      signMat.emissiveTexture = signTex;
      signMat.backFaceCulling = true;
      sign.material = signMat;
      createdMeshes.push(sign);
      createdMaterials.push(signMat);
      createdTextures.push(signTex);

      const switchToBabylon = () => {
        window.dispatchEvent(new CustomEvent("world-switch", { detail: { world: "babylon" } }));
      };
      door.actionManager = door.actionManager || new ActionManager(scene);
      door.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPickTrigger, switchToBabylon));
      const pointerObserver = scene.onPointerObservable.add((pointerInfo) => {
        if (pointerInfo.type !== PointerEventTypes.POINTERTAP) return;
        const picked = pointerInfo.pickInfo?.pickedMesh;
        if (!picked) return;
        if (picked === door || picked === sign) {
          switchToBabylon();
        }
      });
      createdObservers.push({ remove: () => scene.onPointerObservable.remove(pointerObserver) });
    };

    const layoutGallery = (items: Array<{ type: "image" | "video"; src?: string }>) => {
      const columns = 6;
      const rows = 3;
      const spacingX = 6.0;
      const spacingY = 5.2;
      const wallWidth = columns * spacingX + 24;
      const wallHeight = rows * spacingY + 18;
      const roomWidth = wallWidth + 35;
      const roomDepth = wallWidth + 35;
      const roomHeight = Math.max(20, wallHeight + 16);

      const floor = MeshBuilder.CreateGround("galleryFloor", { width: roomWidth, height: roomDepth }, scene);
      floor.position.y = 0;
      floor.checkCollisions = true;
      const floorMat = new StandardMaterial("galleryFloorMat", scene);
      floorMat.diffuseColor = new Color3(0.03, 0.03, 0.035);
      floorMat.specularColor = new Color3(0.7, 0.7, 0.75);
      floor.material = floorMat;
      createdMeshes.push(floor);
      createdMaterials.push(floorMat);

      createWall("galleryWallNorth", roomWidth, roomHeight, new Vector3(0, roomHeight / 2, -roomDepth / 2), 0);
      createWall("galleryWallSouth", roomWidth, roomHeight, new Vector3(0, roomHeight / 2, roomDepth / 2), Math.PI);
      createWall("galleryWallEast", roomDepth, roomHeight, new Vector3(roomWidth / 2, roomHeight / 2, 0), Math.PI / 2);
      createWall("galleryWallWest", roomDepth, roomHeight, new Vector3(-roomWidth / 2, roomHeight / 2, 0), -Math.PI / 2);

      const ceilingLightCount = Math.max(8, Math.ceil(roomWidth / 14));
      for (let i = 0; i < ceilingLightCount; i += 1) {
        const offset = i - (ceilingLightCount - 1) / 2;
        const point = new PointLight(
          `galleryPointLight_${i}`,
          new Vector3(offset * 10, roomHeight - 1.5, 0),
          scene
        );
        point.intensity = 0.4;
        point.diffuse = new Color3(0.95, 0.97, 1);
      }

      const spotlightY = roomHeight - 2;
      const spotIntensity = 0.75;
      const spotAngle = Math.PI / 3.3;
      const spotExponent = 2;
      const spotNorth = new SpotLight(
        "gallerySpotNorth",
        new Vector3(0, spotlightY, -roomDepth / 2 + 3),
        new Vector3(0, -0.8, 1),
        spotAngle,
        spotExponent,
        scene
      );
      spotNorth.intensity = spotIntensity;
      const spotSouth = new SpotLight(
        "gallerySpotSouth",
        new Vector3(0, spotlightY, roomDepth / 2 - 3),
        new Vector3(0, -0.8, -1),
        spotAngle,
        spotExponent,
        scene
      );
      spotSouth.intensity = spotIntensity;
      const spotEast = new SpotLight(
        "gallerySpotEast",
        new Vector3(roomWidth / 2 - 3, spotlightY, 0),
        new Vector3(-1, -0.8, 0),
        spotAngle,
        spotExponent,
        scene
      );
      spotEast.intensity = spotIntensity;
      const spotWest = new SpotLight(
        "gallerySpotWest",
        new Vector3(-roomWidth / 2 + 3, spotlightY, 0),
        new Vector3(1, -0.8, 0),
        spotAngle,
        spotExponent,
        scene
      );
      spotWest.intensity = spotIntensity;

      const guardHeight = roomHeight;
      const guardThickness = 1.2;
      const guardDepth = roomDepth + guardThickness * 2;
      const guardWidth = roomWidth + guardThickness * 2;
      const guardNorth = MeshBuilder.CreateBox(
        "galleryGuardNorth",
        { width: guardWidth, height: guardHeight, depth: guardThickness },
        scene
      );
      guardNorth.position = new Vector3(0, guardHeight / 2, -roomDepth / 2 - guardThickness / 2);
      guardNorth.checkCollisions = true;
      guardNorth.visibility = 0;
      guardNorth.isPickable = false;
      const guardSouth = guardNorth.clone("galleryGuardSouth");
      guardSouth.position = new Vector3(0, guardHeight / 2, roomDepth / 2 + guardThickness / 2);
      guardSouth.checkCollisions = true;
      guardSouth.isPickable = false;
      const guardEast = MeshBuilder.CreateBox(
        "galleryGuardEast",
        { width: guardThickness, height: guardHeight, depth: guardDepth },
        scene
      );
      guardEast.position = new Vector3(roomWidth / 2 + guardThickness / 2, guardHeight / 2, 0);
      guardEast.checkCollisions = true;
      guardEast.visibility = 0;
      guardEast.isPickable = false;
      const guardWest = guardEast.clone("galleryGuardWest");
      guardWest.position = new Vector3(-roomWidth / 2 - guardThickness / 2, guardHeight / 2, 0);
      guardWest.checkCollisions = true;
      guardWest.isPickable = false;
      createdMeshes.push(guardNorth, guardSouth, guardEast, guardWest);

      const wallCenterY = 2.4 + (rows - 1) * spacingY * 0.5;
      const wallCenters = [
        { origin: new Vector3(0, wallCenterY, -roomDepth / 2 + 0.1), rot: 0 },
        { origin: new Vector3(0, wallCenterY, roomDepth / 2 - 0.1), rot: Math.PI },
        { origin: new Vector3(roomWidth / 2 - 0.1, wallCenterY, 0), rot: Math.PI / 2 },
        { origin: new Vector3(-roomWidth / 2 + 0.1, wallCenterY, 0), rot: -Math.PI / 2 },
      ];
      const wallUp = new Vector3(0, 1, 0);
      const frameWalls = [wallCenters[2], wallCenters[3]];
      const perWall = rows * columns;
      const maxFrames = perWall * frameWalls.length;
      const framesToPlace = Math.min(items.length, maxFrames);
      for (let index = 0; index < framesToPlace; index += 1) {
        const item = items[index];
        const wallIndex = Math.floor(index / perWall) % frameWalls.length;
        const wall = frameWalls[wallIndex];
        const wallOffset = index % perWall;
        const row = Math.floor(wallOffset / columns);
        const col = wallOffset % columns;
        const offsetX = (col - (columns - 1) / 2) * spacingX;
        const offsetY = (rows - 1) / 2 * spacingY - row * spacingY;
        const wallRight = new Vector3(Math.cos(wall.rot), 0, -Math.sin(wall.rot));
        const wallNormal = new Vector3(Math.sin(wall.rot), 0, Math.cos(wall.rot));
        const position = wall.origin
          .add(wallRight.scale(offsetX))
          .add(wallUp.scale(offsetY))
          .add(wallNormal.scale(-0.25));
        const name = `galleryFrame_${index}`;
        let texture: Texture | VideoTexture | DynamicTexture = placeholderTexture;

        if (item.src) {
          if (item.type === "image") {
            const tex = new Texture(item.src, scene, true, false, Texture.TRILINEAR_SAMPLINGMODE);
            createdTextures.push(tex);
            texture = tex;
          } else {
            const videoTex = new VideoTexture(
              `video_${index}`,
              item.src,
              scene,
              true,
              true,
              Texture.TRILINEAR_SAMPLINGMODE
            );
            if (videoTex.video) {
              videoTex.video.muted = true;
              videoTex.video.loop = true;
              videoTex.video.play().catch(() => {});
            }
            createdTextures.push(videoTex);
            texture = videoTex;
          }
        }

        const width = 4.6;
        const height = 3.3;
        createFrame(name, texture, position, wall.rot, width, height);
      }

      createReturnDoor(roomDepth);

      camera.position = new Vector3(0, 2, roomDepth / 2 - 6);
      camera.setTarget(new Vector3(0, 2, 0));
    };
    const loadManifest = async () => {
      try {
        const response = await fetch(`${PHOTO_BASE_PATH}manifest.json`, { cache: "no-store" });
        if (!response.ok) return null;
        return (await response.json()) as FellowshipManifest;
      } catch {
        return null;
      }
    };

    let disposed = false;
    const loadExternalScene = async () => {
      try {
        await SceneLoader.AppendAsync("/worlds/fellowship/", "scene.glb", scene);
        return true;
      } catch {
        return false;
      }
    };

    const initWorld = async () => {
      const sceneLoaded = await loadExternalScene();
      if (disposed) return;
      if (sceneLoaded) {
        camera.position = new Vector3(0, 2, 6);
        camera.setTarget(new Vector3(0, 2, 0));
        return;
      }

      const manifest = await loadManifest();
      if (disposed) return;
      const images = manifest?.images ?? [];
      const videos = manifest?.videos ?? [];
      const items: Array<{ type: "image" | "video"; src: string }> = [];

      if (images.length || videos.length) {
        images.forEach((file) => {
          const src = isAbsolutePath(file) ? file : `${PHOTO_BASE_PATH}${file}`;
          items.push({ type: "image", src });
        });
        videos.forEach((file) => {
          const src = isAbsolutePath(file) ? file : `${VIDEO_BASE_PATH}${file}`;
          items.push({ type: "video", src });
        });
      }
      if (items.length < FALLBACK_FRAMES) {
        const needed = FALLBACK_FRAMES - items.length;
        for (let i = 0; i < needed; i += 1) {
          items.push({ type: "image", src: "" });
        }
      }

      layoutGallery(items);
    };

    initWorld();

    engine.runRenderLoop(() => {
      scene.render();
    });

    const onExportGlb = () => {
      GLTF2Export.GLBAsync(scene, "fellowship-world", { exportWithoutWaitingForScene: true })
        .then((result) => {
          const file = result.glTFFiles["fellowship-world.glb"];
          if (file) {
            const blob = typeof file === "string" ? new Blob([file]) : file;
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "fellowship-world.glb";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.setTimeout(() => URL.revokeObjectURL(url), 1000);
            return;
          }
          result.downloadFiles();
        })
        .catch((err) => {
          console.error("[export glb] failed", err);
        });
    };
    window.addEventListener("export-glb", onExportGlb as EventListener);

    const requestLock = () => {
      canvasRef.current?.requestPointerLock?.();
    };
    canvasRef.current.addEventListener("click", requestLock);
    const onResize = () => engine.resize();
    window.addEventListener("resize", onResize);

    return () => {
      disposed = true;
      try { canvasRef.current?.removeEventListener("click", requestLock); } catch {}
      try { window.removeEventListener("hud-item-click", onHudItemClick as EventListener); } catch {}
      try { window.removeEventListener("jump-input", onJumpInput as EventListener); } catch {}
      try { window.removeEventListener("blur", onWindowBlur); } catch {}
      try { document.removeEventListener("visibilitychange", onVisibilityChange); } catch {}
      window.removeEventListener("export-glb", onExportGlb as EventListener);
      window.removeEventListener("resize", onResize);
      if (rollerSparkleTimerRef.current) {
        try { window.clearTimeout(rollerSparkleTimerRef.current); } catch {}
        rollerSparkleTimerRef.current = null;
      }
      createdMeshes.forEach((mesh) => mesh.dispose());
      createdMaterials.forEach((mat) => mat.dispose());
      createdTextures.forEach((tex) => tex.dispose());
      createdObservers.forEach((obs) => obs.remove());
      scene.dispose();
      engine.dispose();
      setSceneInstance(null);
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} style={{ width: "100vw", height: "100vh", display: "block" }} />
      {sceneInstance ? <WorldSounds scene={sceneInstance} /> : null}
    </>
  );
};

export default FellowshipWorld;
