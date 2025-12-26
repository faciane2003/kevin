import { useEffect } from "react";
import { DynamicTexture, Scene, StandardMaterial } from "@babylonjs/core";

type WindowRect = { x: number; y: number; w: number; h: number; lit: boolean };

type WindowMeta = {
  windowTex: DynamicTexture;
  windowRects: WindowRect[];
  windowOn: string;
  windowOff: string;
  ctx: CanvasRenderingContext2D;
};

type Props = {
  scene: Scene | null;
  materials: StandardMaterial[];
  intervalMs?: number;
  flickerPercent?: number;
  stepMs?: number;
  offDurationMs?: number;
};

const BuildingWindowFlicker: React.FC<Props> = ({
  scene,
  materials,
  intervalMs = 8000,
  flickerPercent = 0.05,
  stepMs = 2000,
  offDurationMs = 10000,
}) => {
  useEffect(() => {
    if (!scene || materials.length === 0) return;

    let cancelled = false;
    let cycleTimer: number | null = null;
    let stepTimer: number | null = null;
    const offTimers = new Map<WindowRect, number>();

    const queue: Array<{ meta: WindowMeta; idx: number }> = [];

    const scheduleNextCycle = (delay: number) => {
      cycleTimer = window.setTimeout(() => {
        if (cancelled) return;
        buildQueue();
        runSteps();
      }, delay);
    };

    const buildQueue = () => {
      queue.length = 0;
      materials.forEach((mat) => {
        const meta = mat.metadata as WindowMeta | undefined;
        if (!meta?.windowRects?.length) return;
        const targetCount = Math.max(1, Math.floor(meta.windowRects.length * flickerPercent));
        const used = new Set<number>();
        while (used.size < targetCount) {
          used.add(Math.floor(Math.random() * meta.windowRects.length));
        }
        used.forEach((idx) => queue.push({ meta, idx }));
      });
    };

    const applyToggle = (item: { meta: WindowMeta; idx: number }) => {
      const rect = item.meta.windowRects[item.idx];
      if (!rect) return;
      if (!rect.lit) return;
      rect.lit = false;
      item.meta.ctx.fillStyle = item.meta.windowOff;
      item.meta.ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      item.meta.windowTex.update();
      const existing = offTimers.get(rect);
      if (existing) window.clearTimeout(existing);
      const timer = window.setTimeout(() => {
        rect.lit = true;
        item.meta.ctx.fillStyle = item.meta.windowOn;
        item.meta.ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
        item.meta.windowTex.update();
        offTimers.delete(rect);
      }, offDurationMs);
      offTimers.set(rect, timer);
    };

    const runSteps = () => {
      if (cancelled) return;
      if (queue.length === 0) {
        scheduleNextCycle(intervalMs);
        return;
      }
      const next = queue.shift();
      if (next) applyToggle(next);
      stepTimer = window.setTimeout(runSteps, stepMs);
    };

    scheduleNextCycle(intervalMs);

    return () => {
      cancelled = true;
      if (cycleTimer) window.clearTimeout(cycleTimer);
      if (stepTimer) window.clearTimeout(stepTimer);
      offTimers.forEach((timer) => window.clearTimeout(timer));
      offTimers.clear();
    };
  }, [scene, materials, intervalMs, flickerPercent, stepMs, offDurationMs]);

  return null;
};

export default BuildingWindowFlicker;
