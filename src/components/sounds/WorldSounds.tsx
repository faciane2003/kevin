import React, { useEffect, useRef } from "react";
import { AudioEngine, Engine, Scene, Sound, Vector3 } from "@babylonjs/core";
import "@babylonjs/core/Audio/audioEngine";
import "@babylonjs/core/Audio/audioSceneComponent";

type WorldSoundsProps = {
  scene: Scene | null;
};

const WorldSounds: React.FC<WorldSoundsProps> = ({ scene }) => {
  const htmlAmbientRef = useRef<HTMLAudioElement | null>(null);
  const htmlAirplaneRef = useRef<HTMLAudioElement | null>(null);
  const htmlCatRef = useRef<HTMLAudioElement | null>(null);
  const htmlWindRef = useRef<HTMLAudioElement | null>(null);
  const htmlMusicRefs = useRef<HTMLAudioElement[]>([]);
  const useHtmlAudioRef = useRef(false);

  useEffect(() => {
    if (!scene) return;

    if (!Engine.audioEngine) {
      Engine.audioEngine = new AudioEngine();
    }
    scene.audioEnabled = true;

    const soundUrl = (name: string) => `/sounds/${encodeURIComponent(name)}`;

    const ambientCity = new Sound(
      "ambient-city",
      soundUrl("ambientcity.m4a"),
      scene,
      undefined,
      { loop: true, autoplay: false, volume: 0.6 }
    );
    const airplaneFx = new Sound(
      "airplane-fx",
      soundUrl("airplane.m4a"),
      scene,
      undefined,
      { loop: false, autoplay: false, volume: 0.7 }
    );
    const catMeowFx = new Sound(
      "cat-meow",
      soundUrl("cat-meow.m4a"),
      scene,
      undefined,
      { loop: false, autoplay: false, volume: 0.343 }
    );
    const windFx = new Sound(
      "wind-fx",
      soundUrl("wind.m4a"),
      scene,
      undefined,
      { loop: false, autoplay: false, volume: 0.6 }
    );
    const peopleTalking = new Sound(
      "people-talking",
      soundUrl("people%20talking.m4a"),
      scene,
      undefined,
      { loop: true, autoplay: false, volume: 0.5 }
    );
    const footsteps = new Sound(
      "footsteps",
      soundUrl("footsteps.m4a"),
      scene,
      undefined,
      { loop: true, autoplay: false, volume: 0.6 }
    );

    const playlistDefs = [
      { name: "music-elliot", file: "elliot.m4a", volume: 0.225 },
      { name: "music-sycamore", file: "sycamore.m4a", volume: 0.225 },
      { name: "music-synthwave1", file: "synthwave1.m4a", volume: 0.1575 },
      { name: "music-synthwave2", file: "synthwave2.m4a", volume: 0.1575 },
    ];
    const musicTracks = playlistDefs.map(
      (track) =>
        new Sound(track.name, soundUrl(track.file), scene, undefined, {
          loop: false,
          autoplay: false,
          volume: track.volume,
        })
    );

    const htmlAmbient = new Audio(soundUrl("ambientcity.m4a"));
    htmlAmbient.loop = true;
    htmlAmbient.volume = 0.6;
    const htmlAirplane = new Audio(soundUrl("airplane.m4a"));
    htmlAirplane.volume = 0.7;
    const htmlCat = new Audio(soundUrl("cat-meow.m4a"));
    htmlCat.volume = 0.343;
    const htmlWind = new Audio(soundUrl("wind.m4a"));
    htmlWind.volume = 0.6;
    const htmlPeopleTalking = new Audio(soundUrl("people%20talking.m4a"));
    htmlPeopleTalking.loop = true;
    htmlPeopleTalking.volume = 0.5;
    const htmlFootsteps = new Audio(soundUrl("footsteps.m4a"));
    htmlFootsteps.loop = true;
    htmlFootsteps.volume = 0.6;
    const htmlMusicTracks = playlistDefs.map((track) => {
      const audio = new Audio(soundUrl(track.file));
      audio.volume = track.volume;
      return audio;
    });

    htmlAmbientRef.current = htmlAmbient;
    htmlAirplaneRef.current = htmlAirplane;
    htmlCatRef.current = htmlCat;
    htmlWindRef.current = htmlWind;
    htmlMusicRefs.current = htmlMusicTracks;

    let audioUnlocked = false;
    let airplaneTimer: number | undefined;
    let catTimer: number | undefined;
    let windTimer: number | undefined;

    const startLoopedSfx = () => {
      airplaneTimer = window.setInterval(() => {
        if (useHtmlAudioRef.current) {
          htmlAirplane.currentTime = 0;
          htmlAirplane.play();
          return;
        }
        if (!airplaneFx.isPlaying) airplaneFx.play();
      }, 15000);
      catTimer = window.setInterval(() => {
        if (useHtmlAudioRef.current) {
          htmlCat.currentTime = 0;
          htmlCat.play();
          return;
        }
        if (!catMeowFx.isPlaying) catMeowFx.play();
      }, 60000);
      windTimer = window.setInterval(() => {
        if (useHtmlAudioRef.current) {
          htmlWind.currentTime = 0;
          htmlWind.play();
          return;
        }
        if (!windFx.isPlaying) windFx.play();
      }, 20000);
    };

    let playlistIndex = Math.floor(Math.random() * playlistDefs.length);
    const playMusic = (index: number) => {
      if (useHtmlAudioRef.current) {
        const audio = htmlMusicRefs.current[index];
        if (!audio) return;
        audio.currentTime = 0;
        audio.play();
        return;
      }
      const track = musicTracks[index];
      track.play();
    };
    const onTrackEnded = (idx: number) => {
      if (!audioUnlocked) return;
      if (playlistIndex !== idx) return;
      playlistIndex = (idx + 1) % playlistDefs.length;
      playMusic(playlistIndex);
    };
    musicTracks.forEach((track, idx) => {
      track.onEndedObservable.add(() => onTrackEnded(idx));
    });
    const htmlEndedHandlers: Array<(event: Event) => void> = [];
    htmlMusicTracks.forEach((track, idx) => {
      const handler = () => onTrackEnded(idx);
      htmlEndedHandlers.push(handler);
      track.addEventListener("ended", handler);
    });

    const onUserGesture = () => {
      if (audioUnlocked) return;
      audioUnlocked = true;
      try { Engine.audioEngine?.unlock(); } catch {}
      try { Engine.audioEngine?.audioContext?.resume(); } catch {}
      try { Engine.audioEngine?.setGlobalVolume(0.9); } catch {}

      htmlAmbient
        .play()
        .then(() => {
          htmlAmbient.pause();
          htmlAmbient.currentTime = 0;
        })
        .catch(() => {});
      htmlFootsteps
        .play()
        .then(() => {
          htmlFootsteps.pause();
          htmlFootsteps.currentTime = 0;
        })
        .catch(() => {});
      htmlMusicTracks[0]?.play().then(() => {
        htmlMusicTracks[0].pause();
        htmlMusicTracks[0].currentTime = 0;
      }).catch(() => {});

      if (useHtmlAudioRef.current) {
        htmlAmbient.play().catch(() => {});
        htmlPeopleTalking.play().catch(() => {});
      } else if (!ambientCity.isPlaying) {
        ambientCity.play();
        if (!peopleTalking.isPlaying) peopleTalking.play();
      }
      startLoopedSfx();
      playMusic(playlistIndex);
      window.removeEventListener("pointerdown", onUserGesture);
      window.removeEventListener("keydown", onUserGesture);
    };

    window.addEventListener("pointerdown", onUserGesture);
    window.addEventListener("keydown", onUserGesture);

    const fallbackTimer = window.setTimeout(() => {
      const allNotReady =
        !ambientCity.isReady() &&
        !airplaneFx.isReady() &&
        !catMeowFx.isReady() &&
        !windFx.isReady() &&
        musicTracks.every((track) => !track.isReady());
      if (allNotReady) {
        useHtmlAudioRef.current = true;
        if (audioUnlocked) {
          try { ambientCity.stop(); } catch {}
          try { peopleTalking.stop(); } catch {}
          try { footsteps.stop(); } catch {}
          musicTracks.forEach((track) => {
            try { track.stop(); } catch {}
          });
          htmlAmbient.play().catch(() => {});
          htmlPeopleTalking.play().catch(() => {});
          playMusic(playlistIndex);
        }
      }
    }, 4000);

    let moving = false;
    let walkActive: boolean | null = null;
    const startFootsteps = () => {
      if (useHtmlAudioRef.current || !footsteps.isReady()) {
        htmlFootsteps.play().catch(() => {});
      } else if (!footsteps.isPlaying) {
        footsteps.play();
      }
    };
    const stopFootsteps = () => {
      if (useHtmlAudioRef.current) {
        htmlFootsteps.pause();
        htmlFootsteps.currentTime = 0;
      } else {
        footsteps.stop();
      }
    };
    const onMoveEvent = (event: Event) => {
      if (!audioUnlocked) return;
      const detail = (event as CustomEvent<{ moving: boolean }>).detail;
      if (detail?.moving === undefined) return;
      if (walkActive === false) return;
      if (detail.moving === moving) return;
      moving = detail.moving;
      if (moving) startFootsteps();
      else stopFootsteps();
    };
    window.addEventListener("player-move", onMoveEvent as EventListener);

    const onWalkInput = (event: Event) => {
      if (!audioUnlocked) return;
      const detail = (event as CustomEvent<{ active: boolean }>).detail;
      if (detail?.active === undefined) return;
      walkActive = detail.active;
      if (walkActive) startFootsteps();
      else stopFootsteps();
    };
    window.addEventListener("walk-input", onWalkInput as EventListener);

    let lastPos: Vector3 | null = null;
    const movementObserver = scene.onBeforeRenderObservable.add(() => {
      if (!audioUnlocked) return;
      if (walkActive === false) return;
      const cam = scene.activeCamera;
      if (!cam) return;
      if (!lastPos) {
        lastPos = cam.position.clone();
        return;
      }
      const dist = Vector3.Distance(lastPos, cam.position);
      const isMovingNow = dist > 0.05;
      if (isMovingNow !== moving) {
        moving = isMovingNow;
        if (moving) startFootsteps();
        else stopFootsteps();
      }
      lastPos = cam.position.clone();
    });

    return () => {
      try { window.removeEventListener("pointerdown", onUserGesture); } catch {}
      try { window.removeEventListener("keydown", onUserGesture); } catch {}
      try { window.removeEventListener("player-move", onMoveEvent as EventListener); } catch {}
      try { window.removeEventListener("walk-input", onWalkInput as EventListener); } catch {}
      try { scene.onBeforeRenderObservable.remove(movementObserver); } catch {}
      try { if (airplaneTimer) window.clearInterval(airplaneTimer); } catch {}
      try { if (catTimer) window.clearInterval(catTimer); } catch {}
      try { if (windTimer) window.clearInterval(windTimer); } catch {}
      try { window.clearTimeout(fallbackTimer); } catch {}
      try { ambientCity.stop(); } catch {}
      try { peopleTalking.stop(); } catch {}
      try { footsteps.stop(); } catch {}
      musicTracks.forEach((track) => {
        try { track.stop(); } catch {}
      });
      ambientCity.dispose();
      airplaneFx.dispose();
      catMeowFx.dispose();
      windFx.dispose();
      peopleTalking.dispose();
      footsteps.dispose();
      musicTracks.forEach((track) => track.dispose());
      htmlMusicTracks.forEach((track, idx) => {
        track.pause();
        track.currentTime = 0;
        const handler = htmlEndedHandlers[idx];
        if (handler) track.removeEventListener("ended", handler);
      });
    };
  }, [scene]);

  return null;
};

export default WorldSounds;
