// File: src/worlds/FellowshipWorld.tsx
import React, { useEffect, useRef } from "react";
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
  PointLight,
  Scene,
  SceneLoader,
  SpotLight,
  StandardMaterial,
  Texture,
  UniversalCamera,
  Vector3,
  VideoTexture,
} from "@babylonjs/core";
import { GLTF2Export } from "@babylonjs/serializers";

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

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new Engine(canvasRef.current, true);
    const scene = new Scene(engine);
    scene.clearColor = new Color4(0.02, 0.03, 0.05, 1);

    const camera = new UniversalCamera("galleryCamera", new Vector3(0, 2, -18), scene);
    camera.attachControl(canvasRef.current, true);
    camera.speed = 0.6;
    camera.angularSensibility = 4000;
    camera.minZ = 0.1;
    camera.keysUp = [87];
    camera.keysDown = [83];
    camera.keysLeft = [65];
    camera.keysRight = [68];
    scene.collisionsEnabled = true;
    camera.checkCollisions = true;
    camera.applyGravity = true;
    camera.ellipsoid = new Vector3(0.9, 1.3, 0.9);
    camera.ellipsoidOffset = new Vector3(0, 1.3, 0);
    scene.gravity = new Vector3(0, -0.6, 0);

    const light = new HemisphericLight("galleryLight", new Vector3(0, 1, 0), scene);
    light.intensity = 0.9;
    light.diffuse = new Color3(1, 1, 1);
    light.groundColor = new Color3(0.1, 0.1, 0.1);

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
    const createdTextures: Array<Texture | VideoTexture | DynamicTexture> = [placeholderTexture];

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

      door.actionManager = door.actionManager || new ActionManager(scene);
      door.actionManager.registerAction(
        new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
          window.dispatchEvent(new CustomEvent("world-switch", { detail: { world: "babylon" } }));
        })
      );
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

      const ceiling = MeshBuilder.CreatePlane("galleryCeiling", { width: roomWidth, height: roomDepth }, scene);
      ceiling.position = new Vector3(0, roomHeight, 0);
      ceiling.rotation.x = Math.PI / 2;
      const ceilingMat = new StandardMaterial("galleryCeilingMat", scene);
      ceilingMat.diffuseColor = new Color3(0.05, 0.05, 0.06);
      ceilingMat.specularColor = new Color3(0, 0, 0);
      ceiling.material = ceilingMat;
      createdMeshes.push(ceiling);
      createdMaterials.push(ceilingMat);

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

      const lampMat = new StandardMaterial("galleryLampMat", scene);
      lampMat.diffuseColor = new Color3(0.55, 0.42, 0.18);
      lampMat.specularColor = new Color3(0.9, 0.8, 0.4);
      const lampPositions = [
        new Vector3(-roomWidth * 0.3, 0, -roomDepth * 0.3),
        new Vector3(roomWidth * 0.3, 0, -roomDepth * 0.3),
        new Vector3(-roomWidth * 0.3, 0, roomDepth * 0.3),
        new Vector3(roomWidth * 0.3, 0, roomDepth * 0.3),
        new Vector3(0, 0, -roomDepth * 0.35),
        new Vector3(0, 0, roomDepth * 0.35),
      ];
      lampPositions.forEach((pos, index) => {
        const base = MeshBuilder.CreateCylinder(`galleryLampBase_${index}`, { height: 2.2, diameter: 0.8 }, scene);
        base.position = new Vector3(pos.x, 1.1, pos.z);
        base.material = lampMat;
        base.checkCollisions = true;
        const shade = MeshBuilder.CreateCylinder(
          `galleryLampShade_${index}`,
          { height: 1.2, diameterTop: 0.6, diameterBottom: 2.2 },
          scene
        );
        shade.position = new Vector3(pos.x, 2.6, pos.z);
        shade.material = lampMat;
        const light = new PointLight(`galleryLampLight_${index}`, new Vector3(pos.x, 2.4, pos.z), scene);
        light.intensity = 0.5;
        light.diffuse = new Color3(1, 0.85, 0.6);
        createdMeshes.push(base, shade);
      });
      createdMaterials.push(lampMat);

      const ivyPotMat = new StandardMaterial("galleryIvyPotMat", scene);
      ivyPotMat.diffuseColor = new Color3(0.2, 0.18, 0.16);
      ivyPotMat.specularColor = new Color3(0.2, 0.2, 0.2);
      const ivyMat = new StandardMaterial("galleryIvyMat", scene);
      ivyMat.diffuseColor = new Color3(0.15, 0.35, 0.2);
      ivyMat.specularColor = new Color3(0.1, 0.1, 0.1);
      const ivyCount = 12;
      for (let i = 0; i < ivyCount; i += 1) {
        const angle = (i / ivyCount) * Math.PI * 2;
        const radius = Math.min(roomWidth, roomDepth) * 0.33;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const pot = MeshBuilder.CreateCylinder(`galleryIvyPot_${i}`, { height: 1.0, diameterTop: 1.6, diameterBottom: 1.2 }, scene);
        pot.position = new Vector3(x, 0.5, z);
        pot.material = ivyPotMat;
        pot.checkCollisions = true;
        const ivy = MeshBuilder.CreateSphere(`galleryIvy_${i}`, { diameter: 2.2 }, scene);
        ivy.position = new Vector3(x, 1.8, z);
        ivy.material = ivyMat;
        createdMeshes.push(pot, ivy);
      }
      createdMaterials.push(ivyPotMat, ivyMat);

      const trimMaterial = new StandardMaterial("galleryTrimMat", scene);
      trimMaterial.diffuseColor = new Color3(0.08, 0.08, 0.09);
      trimMaterial.emissiveColor = new Color3(0.02, 0.02, 0.025);
      const baseboardHeight = 0.35;
      const baseboardDepth = 0.2;
      const baseboardNorth = MeshBuilder.CreateBox(
        "galleryBaseboardNorth",
        { width: wallWidth, height: baseboardHeight, depth: baseboardDepth },
        scene
      );
      baseboardNorth.position = new Vector3(0, baseboardHeight / 2, -roomDepth / 2 + baseboardDepth / 2);
      baseboardNorth.material = trimMaterial;
      baseboardNorth.checkCollisions = true;
      baseboardNorth.isPickable = false;
      const baseboardSouth = baseboardNorth.clone("galleryBaseboardSouth");
      baseboardSouth.position = new Vector3(0, baseboardHeight / 2, roomDepth / 2 - baseboardDepth / 2);
      const baseboardEast = MeshBuilder.CreateBox(
        "galleryBaseboardEast",
        { width: baseboardDepth, height: baseboardHeight, depth: wallWidth },
        scene
      );
      baseboardEast.position = new Vector3(roomWidth / 2 - baseboardDepth / 2, baseboardHeight / 2, 0);
      baseboardEast.material = trimMaterial;
      baseboardEast.checkCollisions = true;
      baseboardEast.isPickable = false;
      const baseboardWest = baseboardEast.clone("galleryBaseboardWest");
      baseboardWest.position = new Vector3(-roomWidth / 2 + baseboardDepth / 2, baseboardHeight / 2, 0);
      createdMeshes.push(baseboardNorth, baseboardSouth, baseboardEast, baseboardWest);
      createdMaterials.push(trimMaterial);

      const rugMat = new StandardMaterial("galleryRugMat", scene);
      rugMat.diffuseColor = new Color3(0.18, 0.16, 0.2);
      rugMat.specularColor = new Color3(0.05, 0.05, 0.05);
      const rug = MeshBuilder.CreateGround(
        "galleryRug",
        { width: roomWidth * 0.5, height: roomDepth * 0.5 },
        scene
      );
      rug.position = new Vector3(0, 0.02, 0);
      rug.material = rugMat;
      rug.isPickable = false;
      createdMeshes.push(rug);
      createdMaterials.push(rugMat);

      const benchMat = new StandardMaterial("galleryBenchMat", scene);
      benchMat.diffuseColor = new Color3(0.12, 0.1, 0.08);
      benchMat.specularColor = new Color3(0.1, 0.1, 0.1);
      const bench = MeshBuilder.CreateBox("galleryBench", { width: 6, height: 0.6, depth: 1.8 }, scene);
      bench.position = new Vector3(0, 0.3, 0);
      bench.material = benchMat;
      bench.checkCollisions = true;
      createdMeshes.push(bench);
      createdMaterials.push(benchMat);

      const plinthMat = new StandardMaterial("galleryPlinthMat", scene);
      plinthMat.diffuseColor = new Color3(0.2, 0.2, 0.22);
      plinthMat.specularColor = new Color3(0.1, 0.1, 0.1);
      const plinthPositions = [
        new Vector3(-roomWidth * 0.2, 0.6, -roomDepth * 0.2),
        new Vector3(roomWidth * 0.2, 0.6, -roomDepth * 0.2),
        new Vector3(-roomWidth * 0.2, 0.6, roomDepth * 0.2),
        new Vector3(roomWidth * 0.2, 0.6, roomDepth * 0.2),
      ];
      plinthPositions.forEach((pos, index) => {
        const plinth = MeshBuilder.CreateBox(`galleryPlinth_${index}`, { width: 1.6, height: 1.2, depth: 1.6 }, scene);
        plinth.position = pos;
        plinth.material = plinthMat;
        plinth.checkCollisions = true;
        createdMeshes.push(plinth);
      });
      createdMaterials.push(plinthMat);

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
      window.removeEventListener("export-glb", onExportGlb as EventListener);
      window.removeEventListener("resize", onResize);
      createdMeshes.forEach((mesh) => mesh.dispose());
      createdMaterials.forEach((mat) => mat.dispose());
      createdTextures.forEach((tex) => tex.dispose());
      scene.dispose();
      engine.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} style={{ width: "100vw", height: "100vh", display: "block" }} />;
};

export default FellowshipWorld;
