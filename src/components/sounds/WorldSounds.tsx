import React, { useEffect, useRef, useState } from "react";
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
  cat: 0.055,
  wind: 0.25,
  musicElliot: 0.2,
  musicSycamore: 0.2,
  musicSynth1: 0.2,
  musicSynth2: 0.2,
  musicDropTheGame: 0.2,
  musicAfterDark: 0.2,
  musicDarkAllDay: 0.2,
};

const WorldSounds: React.FC<WorldSoundsProps> = ({ scene }) => {
  const levels = DEFAULT_LEVELS;
  const levelsRef = useRef(DEFAULT_LEVELS);
  const [musicHudVisible, setMusicHudVisible] = useState(false);
  const [currentTrackName, setCurrentTrackName] = useState("—");
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [musicGain, setMusicGain] = useState(1);
  const musicControlsRef = useRef<{
    play: () => void;
    pause: () => void;
    next: () => void;
    prev: () => void;
  } | null>(null);
  const musicGainRef = useRef(1);
  const [musicPanelPos, setMusicPanelPos] = useState({ top: 12, left: 70 });
  const musicPanelRef = useRef<HTMLDivElement | null>(null);
  const musicPanelIndexRef = useRef(0);
  const musicHudVisibleRef = useRef(false);

  const MUSIC_SPARKLES = [
    { left: "10%", top: "6px" },
    { left: "30%", top: "6px" },
    { left: "50%", top: "6px" },
    { left: "70%", top: "6px" },
    { left: "90%", top: "6px" },
    { right: "6px", top: "25%" },
    { right: "6px", top: "55%" },
    { right: "6px", bottom: "10%" },
    { left: "6px", top: "25%" },
    { left: "6px", top: "55%" },
    { left: "6px", bottom: "10%" },
  ];

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
    const audioContextSupported =
      typeof AudioEngine.isAudioContextSupported === "function"
        ? AudioEngine.isAudioContextSupported()
        : !!Engine.audioEngine?.audioContext;

    const soundUrl = (name: string) => `/sounds/${encodeURIComponent(name)}`;

    const ambientTargetVolume = levelsRef.current.ambient;
    const peopleTargetVolume = levelsRef.current.people;
    const footstepsTargetVolume = levelsRef.current.footsteps;
    const catTargetVolume = levelsRef.current.cat;
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
      { loop: false, autoplay: false, volume: catTargetVolume }
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
      { name: "music-miss-misery", title: "Miss Misery", file: "Miss Misery.m4a", volume: levelsRef.current.musicElliot },
      { name: "music-sycamore", title: "Sycamore", file: "sycamore.m4a", volume: levelsRef.current.musicSycamore },
      { name: "music-synthwave1", title: "Synthwave 1", file: "synthwave1.m4a", volume: levelsRef.current.musicSynth1 },
      { name: "music-synthwave2", title: "Synthwave 2", file: "synthwave2.m4a", volume: levelsRef.current.musicSynth2 },
      { name: "music-drop-the-game", title: "Drop the Game", file: "Drop the Game.m4a", volume: levelsRef.current.musicDropTheGame },
      { name: "music-after-dark", title: "After Dark", file: "After Dark.m4a", volume: levelsRef.current.musicAfterDark },
      { name: "music-dark-all-day", title: "Dark All Day", file: "Dark All Day.m4a", volume: levelsRef.current.musicDarkAllDay },
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
    htmlCat.volume = catTargetVolume;
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

    const initialIndex = Math.max(
      0,
      playlistDefs.findIndex((track) => track.name === "music-dark-all-day")
    );
    let playlistIndex = initialIndex;
    playlistIndexRef.current = playlistIndex;
    const stopCurrentMusic = (index: number) => {
      if (useHtmlAudioRef.current) {
        const audio = htmlMusicRefs.current[index];
        if (!audio) return;
        audio.pause();
        audio.currentTime = 0;
        return;
      }
      const track = musicTracks[index];
      track.stop();
    };

    const pauseCurrentMusic = (index: number) => {
      if (useHtmlAudioRef.current) {
        const audio = htmlMusicRefs.current[index];
        if (!audio) return;
        audio.pause();
        return;
      }
      const track = musicTracks[index] as any;
      if (track?.pause) {
        track.pause();
      } else {
        track.stop();
      }
    };

    const resumeCurrentMusic = (index: number) => {
      if (useHtmlAudioRef.current) {
        const audio = htmlMusicRefs.current[index];
        if (!audio) return;
        if (audio.paused) {
          audio.play();
        }
        return;
      }
      const track = musicTracks[index] as any;
      if (track?.isPaused && track?.play) {
        track.play();
        return;
      }
      if (track?.play && !track?.isPlaying) {
        track.play();
      }
    };

    const playMusic = (index: number) => {
      const target = (playlistDefs[index]?.volume ?? 0.2) * musicGainRef.current;
      const title = playlistDefs[index]?.title ?? playlistDefs[index]?.name ?? "—";
      setCurrentTrackName(title);
      setMusicPlaying(true);
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

    musicControlsRef.current = {
      play: () => {
        if (!audioUnlocked) return;
        resumeCurrentMusic(playlistIndexRef.current);
        setMusicPlaying(true);
      },
      pause: () => {
        if (!audioUnlocked) return;
        pauseCurrentMusic(playlistIndexRef.current);
        setMusicPlaying(false);
      },
      next: () => {
        if (!audioUnlocked) return;
        stopCurrentMusic(playlistIndexRef.current);
        playlistIndexRef.current = (playlistIndexRef.current + 1) % playlistDefs.length;
        playMusic(playlistIndexRef.current);
      },
      prev: () => {
        if (!audioUnlocked) return;
        stopCurrentMusic(playlistIndexRef.current);
        playlistIndexRef.current =
          (playlistIndexRef.current - 1 + playlistDefs.length) % playlistDefs.length;
        playMusic(playlistIndexRef.current);
      },
    };
    const computePanelPos = (index: number) => {
      const isMobile = window.matchMedia("(max-width: 600px)").matches;
      const baseTop = isMobile ? 10 : 12;
      const baseLeft = isMobile ? 10 : 12;
      const buttonSize = isMobile ? 36 : 40;
      const gap = isMobile ? 6 : 8;
      return {
        top: baseTop + index * (buttonSize + gap),
        left: baseLeft + buttonSize + 14,
      };
    };
    const onMusicVisibility = (evt: Event) => {
      const detail = (evt as CustomEvent<{ visible: boolean; index?: number }>).detail;
      if (!detail) return;
      setMusicHudVisible(detail.visible);
      musicHudVisibleRef.current = detail.visible;
      if (detail.visible) {
        const idx = detail.index ?? 0;
        musicPanelIndexRef.current = idx;
        setMusicPanelPos(computePanelPos(idx));
      }
    };
    window.addEventListener("music-visibility", onMusicVisibility as EventListener);
    const onResize = () => {
      if (!musicHudVisibleRef.current) return;
      setMusicPanelPos(computePanelPos(musicPanelIndexRef.current));
    };
    window.addEventListener("resize", onResize);
    const onDocPointerDown = (event: PointerEvent) => {
      if (!musicHudVisibleRef.current) return;
      const target = event.target as Node | null;
      if (musicPanelRef.current && target && musicPanelRef.current.contains(target)) return;
      setMusicHudVisible(false);
      musicHudVisibleRef.current = false;
    };
    document.addEventListener("pointerdown", onDocPointerDown);

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
        htmlAmbient.volume = 0;
        htmlPeopleTalking.volume = 0;
        htmlAmbient.play().catch(() => {});
        htmlPeopleTalking.play().catch(() => {});
        playMusic(playlistIndexRef.current);
      } else {
        ambientCity.setVolume(0);
        peopleTalking.setVolume(0);
        if (!ambientCity.isPlaying) ambientCity.play();
        if (!peopleTalking.isPlaying) peopleTalking.play();
        playMusic(playlistIndexRef.current);
      }
      window.setTimeout(() => {
        const ctx = Engine.audioEngine?.audioContext;
        if (ctx && ctx.state !== "running") {
          useHtmlAudioRef.current = true;
          try { ambientCity.stop(); } catch {}
          try { peopleTalking.stop(); } catch {}
          try { footsteps.stop(); } catch {}
          musicTracks.forEach((track) => {
            try { track.stop(); } catch {}
          });
          htmlAmbient.volume = 0;
          htmlPeopleTalking.volume = 0;
          htmlAmbient.play().catch(() => {});
          htmlPeopleTalking.play().catch(() => {});
          playMusic(playlistIndexRef.current);
        }
      }, 250);
      startTimer = window.setTimeout(() => {
        if (useHtmlAudioRef.current) {
          fadeInHtml(htmlAmbient, ambientTargetVolume);
          fadeInHtml(htmlPeopleTalking, peopleTargetVolume);
        } else {
          fadeInSound(ambientCity, ambientTargetVolume);
          fadeInSound(peopleTalking, peopleTargetVolume);
        }
        startLoopedSfx();
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
      if (allNotReady && !audioContextSupported) {
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

    let walkActive = false;
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
    const onWalkInput = (event: Event) => {
      if (!audioUnlocked) return;
      const detail = (event as CustomEvent<{ active: boolean }>).detail;
      if (detail?.active === undefined) return;
      walkActive = detail.active;
      if (walkActive) startFootsteps();
      else stopFootsteps();
    };
    window.addEventListener("walk-input", onWalkInput as EventListener);

    return () => {
      try { window.removeEventListener("pointerdown", onUserGesture); } catch {}
      try { window.removeEventListener("keydown", onUserGesture); } catch {}
      try { window.removeEventListener("music-visibility", onMusicVisibility as EventListener); } catch {}
      try { window.removeEventListener("resize", onResize); } catch {}
      try { document.removeEventListener("pointerdown", onDocPointerDown); } catch {}
      try { window.removeEventListener("walk-input", onWalkInput as EventListener); } catch {}
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
      musicControlsRef.current = null;
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
    tracks[4]?.setVolume(lv.musicDropTheGame);
    tracks[5]?.setVolume(lv.musicAfterDark);
    tracks[6]?.setVolume(lv.musicDarkAllDay);
    const htmlTracks = htmlMusicRefs.current;
    if (htmlTracks[0]) htmlTracks[0].volume = clamp01(lv.musicElliot);
    if (htmlTracks[1]) htmlTracks[1].volume = clamp01(lv.musicSycamore);
    if (htmlTracks[2]) htmlTracks[2].volume = clamp01(lv.musicSynth1);
    if (htmlTracks[3]) htmlTracks[3].volume = clamp01(lv.musicSynth2);
    if (htmlTracks[4]) htmlTracks[4].volume = clamp01(lv.musicDropTheGame);
    if (htmlTracks[5]) htmlTracks[5].volume = clamp01(lv.musicAfterDark);
  }, []);

  useEffect(() => {
    musicGainRef.current = clamp01(musicGain);
    const lv = levelsRef.current;
    const tracks = musicTracksRef.current;
    tracks[0]?.setVolume(lv.musicElliot * musicGainRef.current);
    tracks[1]?.setVolume(lv.musicSycamore * musicGainRef.current);
    tracks[2]?.setVolume(lv.musicSynth1 * musicGainRef.current);
    tracks[3]?.setVolume(lv.musicSynth2 * musicGainRef.current);
    tracks[4]?.setVolume(lv.musicDropTheGame * musicGainRef.current);
    tracks[5]?.setVolume(lv.musicAfterDark * musicGainRef.current);
    tracks[6]?.setVolume(lv.musicDarkAllDay * musicGainRef.current);
    const htmlTracks = htmlMusicRefs.current;
    if (htmlTracks[0]) htmlTracks[0].volume = clamp01(lv.musicElliot * musicGainRef.current);
    if (htmlTracks[1]) htmlTracks[1].volume = clamp01(lv.musicSycamore * musicGainRef.current);
    if (htmlTracks[2]) htmlTracks[2].volume = clamp01(lv.musicSynth1 * musicGainRef.current);
    if (htmlTracks[3]) htmlTracks[3].volume = clamp01(lv.musicSynth2 * musicGainRef.current);
    if (htmlTracks[4]) htmlTracks[4].volume = clamp01(lv.musicDropTheGame * musicGainRef.current);
    if (htmlTracks[5]) htmlTracks[5].volume = clamp01(lv.musicAfterDark * musicGainRef.current);
    if (htmlTracks[6]) htmlTracks[6].volume = clamp01(lv.musicDarkAllDay * musicGainRef.current);
  }, [musicGain]);

  if (!musicHudVisible) return null;

  return (
    <>
      {musicHudVisible ? (
        <div
          className="music-panel music-panel-pink"
          role="status"
          aria-live="polite"
          style={{ top: `${musicPanelPos.top}px`, left: `${musicPanelPos.left}px` }}
          ref={musicPanelRef}
        >
          <div className="hud-sparkles hud-sparkles-back" aria-hidden="true">
            {MUSIC_SPARKLES.map((pos, idx) => (
              <span
                key={`music-back-${idx}`}
                className="hud-sparkle"
                style={{
                  ...pos,
                  animationDelay: `${idx * 0.12}s`,
                  animationDuration: `${2.4 + (idx % 4) * 0.3}s`,
                }}
              />
            ))}
          </div>
          <div className="music-panel-track">{currentTrackName}</div>
          <div className="music-panel-controls">
            <button type="button" onClick={() => musicControlsRef.current?.prev()}>
              {"<"}
            </button>
            <button
              type="button"
              onClick={() =>
                musicPlaying ? musicControlsRef.current?.pause() : musicControlsRef.current?.play()
              }
            >
              {musicPlaying ? "II" : ">"}
            </button>
            <button type="button" onClick={() => musicControlsRef.current?.next()}>
              {">"}
            </button>
          </div>
          <div className="hud-sparkles hud-sparkles-front" aria-hidden="true">
            {MUSIC_SPARKLES.map((pos, idx) => (
              <span
                key={`music-front-${idx}`}
                className="hud-sparkle"
                style={{
                  ...pos,
                  animationDelay: `${0.08 + idx * 0.11}s`,
                  animationDuration: `${2.2 + (idx % 5) * 0.28}s`,
                }}
              />
            ))}
          </div>
        </div>
      ) : null}
      {null}
    </>
  );
};

export default WorldSounds;
