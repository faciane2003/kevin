import React, { useEffect, useRef } from "react";
import { AudioEngine, Engine, Scene, Sound, Vector3 } from "@babylonjs/core";
import "@babylonjs/core/Audio/audioEngine";
import "@babylonjs/core/Audio/audioSceneComponent";

type WorldSoundsProps = {
  scene: Scene | null;
};

const DEFAULT_LEVELS = {
  ambient: 0.52,
  people: 0,
  footsteps: 1,
  airplane: 1,
  cat: 0.11,
  wind: 0.25,
  musicElliot: 0.07,
  musicSycamore: 0.09,
  musicSynth1: 0.07,
  musicSynth2: 0.03,
};

const WorldSounds: React.FC<WorldSoundsProps> = ({ scene }) => {
  const levels = DEFAULT_LEVELS;
  const levelsRef = useRef(DEFAULT_LEVELS);

  const htmlAmbientRef = useRef<HTMLAudioElement | null>(null);
  const htmlAirplaneRef = useRef<HTMLAudioElement | null>(null);
  const htmlCatRef = useRef<HTMLAudioElement | null>(null);
  const htmlWindRef = useRef<HTMLAudioElement | null>(null);
  const htmlPeopleRef = useRef<HTMLAudioElement | null>(null);
  const htmlFootstepsRef = useRef<HTMLAudioElement | null>(null);
  const htmlMusicRefs = useRef<HTMLAudioElement[]>([]);
  const useHtmlAudioRef = useRef(false);
  const ambientCityRef = useRef<Sound | null>(null);
  const airplaneFxRef = useRef<Sound | null>(null);
  const catMeowFxRef = useRef<Sound | null>(null);
  const windFxRef = useRef<Sound | null>(null);
  const peopleTalkingRef = useRef<Sound | null>(null);
  const footstepsRef = useRef<Sound | null>(null);
  const musicTracksRef = useRef<Sound[]>([]);
  const playlistIndexRef = useRef(0);

  const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

  useEffect(() => {
    if (!scene) return;

    if (!Engine.audioEngine) {
      Engine.audioEngine = new AudioEngine();
    }
    scene.audioEnabled = true;

    const soundUrl = (name: string) => `/sounds/${encodeURIComponent(name)}`;

    const ambientTargetVolume = levelsRef.current.ambient;
    const peopleTargetVolume = levelsRef.current.people;
    const footstepsTargetVolume = levelsRef.current.footsteps;
    const fadeDurationMs = 2000;
    const fadeDelayMs = 1000;

    const ambientCity = new Sound(
      "ambient-city",
      soundUrl("ambientcity.m4a"),
      scene,
      undefined,
      { loop: true, autoplay: false, volume: ambientTargetVolume }
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
      { loop: true, autoplay: false, volume: peopleTargetVolume }
    );
    const footsteps = new Sound(
      "footsteps",
      soundUrl("footsteps.m4a"),
      scene,
      undefined,
      { loop: true, autoplay: false, volume: footstepsTargetVolume }
    );

    const playlistDefs = [
      { name: "music-elliot", file: "elliot.m4a", volume: levelsRef.current.musicElliot },
      { name: "music-sycamore", file: "sycamore.m4a", volume: levelsRef.current.musicSycamore },
      { name: "music-synthwave1", file: "synthwave1.m4a", volume: levelsRef.current.musicSynth1 },
      { name: "music-synthwave2", file: "synthwave2.m4a", volume: levelsRef.current.musicSynth2 },
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
    htmlAmbient.volume = ambientTargetVolume;
    const htmlAirplane = new Audio(soundUrl("airplane.m4a"));
    htmlAirplane.volume = 0.7;
    const htmlCat = new Audio(soundUrl("cat-meow.m4a"));
    htmlCat.volume = 0.343;
    const htmlWind = new Audio(soundUrl("wind.m4a"));
    htmlWind.volume = 0.6;
    const htmlPeopleTalking = new Audio(soundUrl("people%20talking.m4a"));
    htmlPeopleTalking.loop = true;
    htmlPeopleTalking.volume = peopleTargetVolume;
    const htmlFootsteps = new Audio(soundUrl("footsteps.m4a"));
    htmlFootsteps.loop = true;
    htmlFootsteps.volume = footstepsTargetVolume;
    const htmlMusicTracks = playlistDefs.map((track) => {
      const audio = new Audio(soundUrl(track.file));
      audio.volume = track.volume;
      return audio;
    });

    htmlAmbientRef.current = htmlAmbient;
    htmlAirplaneRef.current = htmlAirplane;
    htmlCatRef.current = htmlCat;
    htmlWindRef.current = htmlWind;
    htmlPeopleRef.current = htmlPeopleTalking;
    htmlFootstepsRef.current = htmlFootsteps;
    htmlMusicRefs.current = htmlMusicTracks;
    ambientCityRef.current = ambientCity;
    airplaneFxRef.current = airplaneFx;
    catMeowFxRef.current = catMeowFx;
    windFxRef.current = windFx;
    peopleTalkingRef.current = peopleTalking;
    footstepsRef.current = footsteps;
    musicTracksRef.current = musicTracks;

    let audioUnlocked = false;
    let airplaneTimer: number | undefined;
    let catTimer: number | undefined;
    let windTimer: number | undefined;
    let startTimer: number | undefined;

    const fadeInHtml = (audio: HTMLAudioElement, target: number) => {
      const start = performance.now();
      audio.volume = 0;
      const tick = () => {
        const t = (performance.now() - start) / fadeDurationMs;
        audio.volume = target * Math.min(1, t);
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const fadeInSound = (sound: Sound, target: number) => {
      const start = performance.now();
      sound.setVolume(0);
      const tick = () => {
        const t = (performance.now() - start) / fadeDurationMs;
        sound.setVolume(target * Math.min(1, t));
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

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
    playlistIndexRef.current = playlistIndex;
    const playMusic = (index: number) => {
      const target = playlistDefs[index]?.volume ?? 0.2;
      if (useHtmlAudioRef.current) {
        const audio = htmlMusicRefs.current[index];
        if (!audio) return;
        audio.currentTime = 0;
        audio.volume = 0;
        audio.play();
        fadeInHtml(audio, target);
        return;
      }
      const track = musicTracks[index];
      track.setVolume(0);
      track.play();
      fadeInSound(track, target);
    };
    const onTrackEnded = (idx: number) => {
      if (!audioUnlocked) return;
      if (playlistIndexRef.current !== idx) return;
      playlistIndexRef.current = (idx + 1) % playlistDefs.length;
      playMusic(playlistIndexRef.current);
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

      startTimer = window.setTimeout(() => {
        if (useHtmlAudioRef.current) {
          htmlAmbient.play().catch(() => {});
          fadeInHtml(htmlAmbient, ambientTargetVolume);
          htmlPeopleTalking.play().catch(() => {});
          fadeInHtml(htmlPeopleTalking, peopleTargetVolume);
        } else if (!ambientCity.isPlaying) {
          ambientCity.play();
          fadeInSound(ambientCity, ambientTargetVolume);
          if (!peopleTalking.isPlaying) peopleTalking.play();
          fadeInSound(peopleTalking, peopleTargetVolume);
        }
        startLoopedSfx();
        playMusic(playlistIndexRef.current);
      }, fadeDelayMs);
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
          playMusic(playlistIndexRef.current);
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
      try { if (startTimer) window.clearTimeout(startTimer); } catch {}
      try { window.clearTimeout(fallbackTimer); } catch {}
      try { ambientCity.stop(); } catch {}
      try { peopleTalking.stop(); } catch {}
      try { footsteps.stop(); } catch {}
      musicTracks.forEach((track) => {
        try { track.stop(); } catch {}
      });
      try { ambientCity.dispose(); } catch {}
      try { airplaneFx.dispose(); } catch {}
      try { catMeowFx.dispose(); } catch {}
      try { windFx.dispose(); } catch {}
      try { peopleTalking.dispose(); } catch {}
      try { footsteps.dispose(); } catch {}
      musicTracks.forEach((track) => {
        try { track.dispose(); } catch {}
      });
      htmlMusicTracks.forEach((track, idx) => {
        track.pause();
        track.currentTime = 0;
        const handler = htmlEndedHandlers[idx];
        if (handler) track.removeEventListener("ended", handler);
      });
    };
  }, [scene]);

  useEffect(() => {
    levelsRef.current = levels;
    const lv = levelsRef.current;
    if (ambientCityRef.current) ambientCityRef.current.setVolume(lv.ambient);
    if (peopleTalkingRef.current) peopleTalkingRef.current.setVolume(lv.people);
    if (footstepsRef.current) footstepsRef.current.setVolume(lv.footsteps);
    if (airplaneFxRef.current) airplaneFxRef.current.setVolume(lv.airplane);
    if (catMeowFxRef.current) catMeowFxRef.current.setVolume(lv.cat);
    if (windFxRef.current) windFxRef.current.setVolume(lv.wind);
    if (htmlAmbientRef.current) htmlAmbientRef.current.volume = clamp01(lv.ambient);
    if (htmlPeopleRef.current) htmlPeopleRef.current.volume = clamp01(lv.people);
    if (htmlFootstepsRef.current) htmlFootstepsRef.current.volume = clamp01(lv.footsteps);
    if (htmlAirplaneRef.current) htmlAirplaneRef.current.volume = clamp01(lv.airplane);
    if (htmlCatRef.current) htmlCatRef.current.volume = clamp01(lv.cat);
    if (htmlWindRef.current) htmlWindRef.current.volume = clamp01(lv.wind);
    const tracks = musicTracksRef.current;
    tracks[0]?.setVolume(lv.musicElliot);
    tracks[1]?.setVolume(lv.musicSycamore);
    tracks[2]?.setVolume(lv.musicSynth1);
    tracks[3]?.setVolume(lv.musicSynth2);
    const htmlTracks = htmlMusicRefs.current;
    if (htmlTracks[0]) htmlTracks[0].volume = clamp01(lv.musicElliot);
    if (htmlTracks[1]) htmlTracks[1].volume = clamp01(lv.musicSycamore);
    if (htmlTracks[2]) htmlTracks[2].volume = clamp01(lv.musicSynth1);
    if (htmlTracks[3]) htmlTracks[3].volume = clamp01(lv.musicSynth2);
  }, []);

  return null;
};

export default WorldSounds;
