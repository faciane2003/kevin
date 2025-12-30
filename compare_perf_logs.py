#!/usr/bin/env python3
import json
import pathlib
from statistics import mean

ROOT = pathlib.Path(r"c:\Users\Ames\Desktop\Projects\kevin")
BACKUP_LOG = ROOT / "backup.json"
SOURCERY_LOG = ROOT / "sourcery.json"

def load_snapshots(path: pathlib.Path):
    if not path.exists():
        raise FileNotFoundError(f"Log file not found: {path}")
    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)
    return data

def parse_frame_time(entry_value: str) -> float:
    # "18.60 ms" -> 18.6
    return float(entry_value.replace(" ms", "").strip())

def extract_metrics(snapshots):
    fps_values = []
    frame_times = []

    for snap in snapshots:
        fps = snap.get("fps")
        entries = snap.get("entries", [])
        frame_entry = next((e for e in entries if e.get("label") == "Frame time"), None)
        if fps is None or frame_entry is None:
            continue
        try:
            frame_ms = parse_frame_time(frame_entry["value"])
        except Exception:
            continue
        fps_values.append(float(fps))
        frame_times.append(float(frame_ms))

    return fps_values, frame_times

def main():
    backup_snaps = load_snapshots(BACKUP_LOG)
    sourcery_snaps = load_snapshots(SOURCERY_LOG)

    backup_fps, backup_frames = extract_metrics(backup_snaps)
    sourcery_fps, sourcery_frames = extract_metrics(sourcery_snaps)

    if not backup_fps or not sourcery_fps:
        print("Not enough data in one of the logs.")
        return

    backup_fps_avg = mean(backup_fps)
    sourcery_fps_avg = mean(sourcery_fps)

    backup_frame_avg = mean(backup_frames)
    sourcery_frame_avg = mean(sourcery_frames)

    fps_improvement = ((sourcery_fps_avg - backup_fps_avg) / backup_fps_avg) * 100
    frame_improvement = ((backup_frame_avg - sourcery_frame_avg) / backup_frame_avg) * 100

    print("=== Performance comparison ===")
    print(f"Backup   avg FPS:   {backup_fps_avg:.2f}")
    print(f"Sourcery avg FPS:   {sourcery_fps_avg:.2f}")
    print(f"FPS improvement:    {fps_improvement:+.1f}%")
    print()
    print(f"Backup   frame ms:  {backup_frame_avg:.2f} ms")
    print(f"Sourcery frame ms:  {sourcery_frame_avg:.2f} ms")
    print(f"Frame time improv.: {frame_improvement:+.1f}%")

if __name__ == "__main__":
    main()
