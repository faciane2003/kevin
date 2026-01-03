// File: src/worlds/FellowshipWorld.tsx
import React, { useEffect, useRef } from "react";
import {
  Color3,
  Color4,
  DynamicTexture,
  Engine,
  HemisphericLight,
  Mesh,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Texture,
  UniversalCamera,
  Vector3,
  VideoTexture,
} from "@babylonjs/core";

type FellowshipManifest = {
  images?: string[];
  videos?: string[];
};

const FALLBACK_FRAMES = 24;
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
    scene.collisionsEnabled = true;
    camera.checkCollisions = true;
    camera.applyGravity = true;
    camera.ellipsoid = new Vector3(0.9, 1.3, 0.9);
    camera.ellipsoidOffset = new Vector3(0, 1.3, 0);

    const light = new HemisphericLight("galleryLight", new Vector3(0, 1, 0), scene);
    light.intensity = 0.9;
    light.diffuse = new Color3(1, 1, 1);
    light.groundColor = new Color3(0.1, 0.1, 0.1);

    const placeholderTexture = new DynamicTexture("galleryPlaceholder", { width: 512, height: 384 }, scene, true);
    const placeholderCtx = placeholderTexture.getContext();
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
      const wallMat = new StandardMaterial(`${name}Mat`, scene);
      wallMat.diffuseColor = new Color3(0.08, 0.08, 0.1);
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
      rotationY: number
    ) => {
      const plane = MeshBuilder.CreatePlane(name, { width: 4, height: 3 }, scene);
      plane.position = position;
      plane.rotation.y = rotationY;
      const mat = new StandardMaterial(`${name}Mat`, scene);
      mat.diffuseTexture = texture;
      mat.emissiveTexture = texture;
      mat.specularColor = new Color3(0.1, 0.1, 0.1);
      mat.backFaceCulling = false;
      plane.material = mat;
      createdMeshes.push(plane);
      createdMaterials.push(mat);
    };

    const createReturnDoor = (roomDepth: number) => {
      const door = MeshBuilder.CreateBox("returnDoor", { width: 3.5, height: 5.5, depth: 0.3 }, scene);
      door.position = new Vector3(0, 2.75, roomDepth / 2 - 0.4);
      door.rotation.y = Math.PI;
      door.isPickable = true;
      door.checkCollisions = false;
      const doorMat = new StandardMaterial("returnDoorMat", scene);
      doorMat.diffuseColor = new Color3(0.05, 0.08, 0.12);
      doorMat.emissiveColor = new Color3(0.15, 0.25, 0.4);
      door.material = doorMat;
      createdMeshes.push(door);
      createdMaterials.push(doorMat);

      const sign = MeshBuilder.CreatePlane("returnDoorSign", { width: 6, height: 1.2 }, scene);
      sign.position = new Vector3(0, 6.2, roomDepth / 2 - 0.2);
      sign.rotation.y = Math.PI;
      sign.isPickable = false;
      const signTex = new DynamicTexture("returnDoorSignTex", { width: 512, height: 128 }, scene, true);
      const signCtx = signTex.getContext();
      signCtx.clearRect(0, 0, 512, 128);
      signCtx.fillStyle = "rgba(0,0,0,0.6)";
      signCtx.fillRect(0, 0, 512, 128);
      signCtx.fillStyle = "#e6f3ff";
      signCtx.font = "bold 48px Consolas, Menlo, monospace";
      signCtx.textAlign = "center";
      signCtx.textBaseline = "middle";
      signCtx.fillText("Return", 256, 64);
      signTex.update();
      const signMat = new StandardMaterial("returnDoorSignMat", scene);
      signMat.diffuseTexture = signTex;
      signMat.emissiveTexture = signTex;
      signMat.backFaceCulling = false;
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
      const perWall = Math.ceil(items.length / 4);
      const columns = Math.min(12, Math.max(6, Math.ceil(Math.sqrt(perWall))));
      const rows = Math.ceil(perWall / columns);
      const spacingX = 5.2;
      const spacingY = 4.1;
      const wallWidth = columns * spacingX + 4;
      const wallHeight = rows * spacingY + 4;
      const roomWidth = wallWidth + 12;
      const roomDepth = wallWidth + 12;
      const roomHeight = Math.max(10, wallHeight + 4);

      const floor = MeshBuilder.CreateGround("galleryFloor", { width: roomWidth, height: roomDepth }, scene);
      floor.position.y = 0;
      floor.checkCollisions = true;
      const floorMat = new StandardMaterial("galleryFloorMat", scene);
      floorMat.diffuseColor = new Color3(0.04, 0.04, 0.05);
      floorMat.specularColor = new Color3(0, 0, 0);
      floor.material = floorMat;
      createdMeshes.push(floor);
      createdMaterials.push(floorMat);

      const ceiling = MeshBuilder.CreatePlane("galleryCeiling", { width: roomWidth, height: roomDepth }, scene);
      ceiling.position = new Vector3(0, roomHeight, 0);
      ceiling.rotation.x = Math.PI / 2;
      const ceilingMat = new StandardMaterial("galleryCeilingMat", scene);
      ceilingMat.diffuseColor = new Color3(0.03, 0.03, 0.04);
      ceilingMat.specularColor = new Color3(0, 0, 0);
      ceiling.material = ceilingMat;
      createdMeshes.push(ceiling);
      createdMaterials.push(ceilingMat);

      createWall("galleryWallNorth", wallWidth, roomHeight, new Vector3(0, roomHeight / 2, -roomDepth / 2), 0);
      createWall("galleryWallSouth", wallWidth, roomHeight, new Vector3(0, roomHeight / 2, roomDepth / 2), Math.PI);
      createWall("galleryWallEast", wallWidth, roomHeight, new Vector3(roomWidth / 2, roomHeight / 2, 0), -Math.PI / 2);
      createWall("galleryWallWest", wallWidth, roomHeight, new Vector3(-roomWidth / 2, roomHeight / 2, 0), Math.PI / 2);

      const wallCenters = [
        { origin: new Vector3(0, 2.5, -roomDepth / 2 + 0.1), rot: 0 },
        { origin: new Vector3(0, 2.5, roomDepth / 2 - 0.1), rot: Math.PI },
        { origin: new Vector3(roomWidth / 2 - 0.1, 2.5, 0), rot: -Math.PI / 2 },
        { origin: new Vector3(-roomWidth / 2 + 0.1, 2.5, 0), rot: Math.PI / 2 },
      ];

      items.forEach((item, index) => {
        const wallIndex = Math.floor(index / perWall);
        const wallOffset = index % perWall;
        const row = Math.floor(wallOffset / columns);
        const col = wallOffset % columns;
        const offsetX = (col - (columns - 1) / 2) * spacingX;
        const offsetY = (rows - 1) / 2 * spacingY - row * spacingY;

        const wall = wallCenters[wallIndex] ?? wallCenters[0];
        const position = wall.origin.add(new Vector3(offsetX, offsetY, 0));
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

        createFrame(name, texture, position, wall.rot);
      });

      createReturnDoor(roomDepth);

      camera.position = new Vector3(0, 2, -roomDepth / 2 + 6);
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
    loadManifest().then((manifest) => {
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
      } else {
        for (let i = 0; i < FALLBACK_FRAMES; i += 1) {
          items.push({ type: "image", src: "" });
        }
      }

      layoutGallery(items);
    });

    engine.runRenderLoop(() => {
      scene.render();
    });

    const requestLock = () => {
      canvasRef.current?.requestPointerLock?.();
    };
    canvasRef.current.addEventListener("click", requestLock);
    const onResize = () => engine.resize();
    window.addEventListener("resize", onResize);

    return () => {
      disposed = true;
      try { canvasRef.current?.removeEventListener("click", requestLock); } catch {}
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
