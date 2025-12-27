import React, { useEffect, useRef, useState } from "react";
import { AudioEngine, Engine, Scene, Sound } from "@babylonjs/core";
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
  musicSycamore: 1,
  musicSynthwave: 1,
  musicDropTheGame: 1,
  musicAfterDark: 1,
  musicDarkAllDay: 1,
  musicMissMisery: 1,
  musicEarthquake: 1,
  musicFlightOfTheNavigator: 1,
};

const WorldSounds: React.FC<WorldSoundsProps> = ({ scene }) => {
  const levels = DEFAULT_LEVELS;
  const levelsRef = useRef(DEFAULT_LEVELS);
  const [musicHudVisible, setMusicHudVisible] = useState(false);
  const [currentTrackName, setCurrentTrackName] = useState("Unknown");
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [musicGain, setMusicGain] = useState(0.3);
  const musicControlsRef = useRef<{
    play: () => void;
    pause: () => void;
    next: () => void;
    prev: () => void;
  } | null>(null);
  const musicGainRef = useRef(0.3);
  const [musicPanelPos, setMusicPanelPos] = useState({ top: 12, left: 70 });
  const musicPanelRef = useRef<HTMLDivElement | null>(null);
  const musicPanelIndexRef = useRef(0);
  const musicHudVisibleRef = useRef(false);
  const audioUnlockedRef = useRef(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    setIsTouchDevice(
      "ontouchstart" in window || navigator.maxTouchPoints > 0 || window.matchMedia("(pointer: coarse)").matches
    );
  }, []);

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
  const htmlCatLeftRef = useRef<HTMLAudioElement | null>(null);
  const htmlCatRightRef = useRef<HTMLAudioElement | null>(null);
  const htmlWindRef = useRef<HTMLAudioElement | null>(null);
  const htmlPeopleRef = useRef<HTMLAudioElement | null>(null);
  const htmlFootstepsRef = useRef<HTMLAudioElement | null>(null);
  const htmlPowerOnRef = useRef<HTMLAudioElement | null>(null);
  const htmlPowerOffRef = useRef<HTMLAudioElement | null>(null);
  const htmlMusicRefs = useRef<HTMLAudioElement[]>([]);
  const htmlCarPassRef = useRef<HTMLAudioElement | null>(null);
  const useHtmlAudioRef = useRef(false);
  const htmlFootstepsActiveRef = useRef(false);
  const ambientCityRef = useRef<Sound | null>(null);
  const airplaneFxRef = useRef<Sound | null>(null);
  const catMeowLeftRef = useRef<Sound | null>(null);
  const catMeowRightRef = useRef<Sound | null>(null);
  const windFxRef = useRef<Sound | null>(null);
  const peopleTalkingRef = useRef<Sound | null>(null);
  const footstepsRef = useRef<Sound | null>(null);
  const musicTracksRef = useRef<Sound[]>([]);
  const playlistIndexRef = useRef(0);
  const carPassFxRef = useRef<Sound | null>(null);
  const powerOnFxRef = useRef<Sound | null>(null);
  const powerOffFxRef = useRef<Sound | null>(null);

  const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

  useEffect(() => {
    if (!scene) return;

    if (!Engine.audioEngine) {
      Engine.audioEngine = new AudioEngine();
    }
    scene.audioEnabled = true;
    const audioContextSupported = !!Engine.audioEngine?.audioContext;

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
    const catMeowLeft = new Sound(
      "cat-meow-left",
      soundUrl("cat-meow-left.m4a"),
      scene,
      undefined,
      { loop: false, autoplay: false, volume: catTargetVolume }
    );
    const catMeowRight = new Sound(
      "cat-meow-right",
      soundUrl("cat-meow-right.m4a"),
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
    const carPassFx = new Sound(
      "carpass",
      "/carpass.m4a",
      scene,
      undefined,
      { loop: false, autoplay: false, volume: 0.8 }
    );
    const powerOnFx = new Sound(
      "sfx-poweron",
      soundUrl("sfx_poweron.m4a"),
      scene,
      undefined,
      { loop: false, autoplay: false, volume: 0.4 }
    );
    const powerOffFx = new Sound(
      "sfx-poweroff",
      soundUrl("sfx_poweroff.m4a"),
      scene,
      undefined,
      { loop: false, autoplay: false, volume: 0.4 }
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
      { name: "music-miss-misery", title: "Miss Misery", file: "Miss Misery.m4a", volume: levelsRef.current.musicMissMisery },
      { name: "music-sycamore", title: "Sycamore", file: "sycamore.m4a", volume: levelsRef.current.musicSycamore },
      { name: "music-synthwave", title: "Synthwave", file: "Synthwave.m4a", volume: levelsRef.current.musicSynthwave },
      { name: "music-drop-the-game", title: "Drop the Game", file: "Drop the Game.m4a", volume: levelsRef.current.musicDropTheGame },
      { name: "music-after-dark", title: "After Dark", file: "After Dark.m4a", volume: levelsRef.current.musicAfterDark },
      { name: "music-dark-all-day", title: "Dark All Day", file: "Dark All Day.m4a", volume: levelsRef.current.musicDarkAllDay },
      { name: "music-earthquake", title: "Earthquake", file: "Earthquake.m4a", volume: levelsRef.current.musicEarthquake },
      {
        name: "music-flight-of-the-navigator",
        title: "Flight of the Navigator",
        file: "Flight of the Navigator.m4a",
        volume: levelsRef.current.musicFlightOfTheNavigator,
      },
    ];
    const musicTracks: Sound[] = [];

    const htmlAmbient = new Audio(soundUrl("ambientcity.m4a"));
    htmlAmbient.loop = true;
    htmlAmbient.volume = ambientTargetVolume;
    const htmlAirplane = new Audio(soundUrl("airplane.m4a"));
    htmlAirplane.volume = 0.7;
    const htmlCatLeft = new Audio(soundUrl("cat-meow-left.m4a"));
    htmlCatLeft.volume = catTargetVolume;
    const htmlCatRight = new Audio(soundUrl("cat-meow-right.m4a"));
    htmlCatRight.volume = catTargetVolume;
    const htmlWind = new Audio(soundUrl("wind.m4a"));
    htmlWind.volume = 0.6;
    const htmlCarPass = new Audio("/carpass.m4a");
    htmlCarPass.volume = 0.8;
    const htmlPowerOn = new Audio(soundUrl("sfx_poweron.m4a"));
    htmlPowerOn.volume = 0.4;
    const htmlPowerOff = new Audio(soundUrl("sfx_poweroff.m4a"));
    htmlPowerOff.volume = 0.4;
    const htmlPeopleTalking = new Audio(soundUrl("people%20talking.m4a"));
    htmlPeopleTalking.loop = true;
    htmlPeopleTalking.volume = peopleTargetVolume;
    const htmlFootsteps = new Audio(soundUrl("footsteps.m4a"));
    htmlFootsteps.loop = true;
    htmlFootsteps.volume = footstepsTargetVolume;
    const htmlMusicTracks: HTMLAudioElement[] = [];
    const htmlEndedHandlers: Array<((event: Event) => void) | null> = Array(playlistDefs.length).fill(null);

    htmlAmbientRef.current = htmlAmbient;
    htmlAirplaneRef.current = htmlAirplane;
    htmlCatLeftRef.current = htmlCatLeft;
    htmlCatRightRef.current = htmlCatRight;
    htmlWindRef.current = htmlWind;
    htmlPeopleRef.current = htmlPeopleTalking;
    htmlFootstepsRef.current = htmlFootsteps;
    htmlPowerOnRef.current = htmlPowerOn;
    htmlPowerOffRef.current = htmlPowerOff;
    htmlMusicRefs.current = htmlMusicTracks;
    htmlCarPassRef.current = htmlCarPass;
    ambientCityRef.current = ambientCity;
    airplaneFxRef.current = airplaneFx;
    catMeowLeftRef.current = catMeowLeft;
    catMeowRightRef.current = catMeowRight;
    windFxRef.current = windFx;
    peopleTalkingRef.current = peopleTalking;
    footstepsRef.current = footsteps;
    musicTracksRef.current = musicTracks;
    carPassFxRef.current = carPassFx;
    powerOnFxRef.current = powerOnFx;
    powerOffFxRef.current = powerOffFx;

    window.setTimeout(() => {
      void ambientCity.isReady();
      void peopleTalking.isReady();
      void footsteps.isReady();
      void musicTracks[0]?.isReady?.();
    }, 2000);

    let audioUnlocked = false;
    let airplaneTimer: number | undefined;
    let catTimer: number | undefined;
    let windTimer: number | undefined;
    let carPassTimer: number | undefined;
    let startTimer: number | undefined;
    let readinessTimer: number | undefined;

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

    const safeHtmlPlay = (audio: HTMLAudioElement) => audio.play().catch(() => {});

    const playCatMeow = () => {
      const pickLeft = Math.random() < 0.5;
      if (useHtmlAudioRef.current) {
        const audio = pickLeft ? htmlCatLeft : htmlCatRight;
        audio.currentTime = 0;
        safeHtmlPlay(audio);
        return;
      }
      const sound = pickLeft ? catMeowLeft : catMeowRight;
      if (!sound.isPlaying) sound.play();
    };

    const scheduleCarPass = () => {
      const delay = 20000 + Math.random() * 40000;
      carPassTimer = window.setTimeout(() => {
        if (useHtmlAudioRef.current) {
          htmlCarPass.currentTime = 0;
          safeHtmlPlay(htmlCarPass);
        } else {
          if (!carPassFx.isPlaying) carPassFx.play();
        }
        scheduleCarPass();
      }, delay);
    };

    const startLoopedSfx = () => {
      airplaneTimer = window.setInterval(() => {
        if (useHtmlAudioRef.current) {
          htmlAirplane.currentTime = 0;
          safeHtmlPlay(htmlAirplane);
          return;
        }
        if (!airplaneFx.isPlaying) airplaneFx.play();
      }, 15000);
      catTimer = window.setInterval(() => {
        playCatMeow();
      }, 60000);
      windTimer = window.setInterval(() => {
        if (useHtmlAudioRef.current) {
          htmlWind.currentTime = 0;
          safeHtmlPlay(htmlWind);
          return;
        }
        if (!windFx.isPlaying) windFx.play();
      }, 20000);
      scheduleCarPass();
    };

    const initialIndex = Math.floor(Math.random() * playlistDefs.length);
    let playlistIndex = initialIndex;
    playlistIndexRef.current = playlistIndex;
    const ensureSoundTrack = (index: number) => {
      let track = musicTracks[index];
      if (!track) {
        const def = playlistDefs[index];
        track = new Sound(def.name, soundUrl(def.file), scene, undefined, {
          loop: false,
          autoplay: false,
          volume: def.volume,
        });
        track.onEndedObservable.add(() => onTrackEnded(index));
        musicTracks[index] = track;
      }
      return track;
    };
    const ensureHtmlTrack = (index: number) => {
      let audio = htmlMusicTracks[index];
      if (!audio) {
        const def = playlistDefs[index];
        audio = new Audio(soundUrl(def.file));
        audio.volume = def.volume;
        const handler = () => onTrackEnded(index);
        audio.addEventListener("ended", handler);
        htmlEndedHandlers[index] = handler;
        htmlMusicTracks[index] = audio;
      }
      return audio;
    };
    const stopCurrentMusic = (index: number) => {
      if (useHtmlAudioRef.current) {
        const audio = ensureHtmlTrack(index);
        if (!audio) return;
        audio.pause();
        audio.currentTime = 0;
        return;
      }
      const track = musicTracks[index];
      if (!track) return;
      track.stop();
    };

    const pauseCurrentMusic = (index: number) => {
      if (useHtmlAudioRef.current) {
        const audio = ensureHtmlTrack(index);
        if (!audio) return;
        audio.pause();
        return;
      }
      const track = musicTracks[index] as any;
      if (!track) return;
      if (track?.pause) {
        track.pause();
      } else {
        track.stop();
      }
    };

    const resumeCurrentMusic = (index: number) => {
      if (useHtmlAudioRef.current) {
        const audio = ensureHtmlTrack(index);
        if (!audio) return;
        if (audio.paused) {
          audio.play();
        }
        return;
      }
      const track = musicTracks[index] as any;
      if (!track) return;
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
      const title = playlistDefs[index]?.title ?? playlistDefs[index]?.name ?? "Unknown";
      setCurrentTrackName(title);
      setMusicPlaying(true);
      if (useHtmlAudioRef.current) {
        const audio = ensureHtmlTrack(index);
        if (!audio) return;
        audio.currentTime = 0;
        audio.volume = 0;
        safeHtmlPlay(audio);
        fadeInHtml(audio, target);
        return;
      }
      const track = ensureSoundTrack(index);
      track.setVolume(0);
      track.play();
      fadeInSound(track, target);
    };
    function onTrackEnded(idx: number) {
      if (!audioUnlocked) return;
      if (playlistIndexRef.current !== idx) return;
      playlistIndexRef.current = (idx + 1) % playlistDefs.length;
      playMusic(playlistIndexRef.current);
    }

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
      const button = document.querySelector(
        `.menu-tab-button[title="Music"]`
      ) as HTMLElement | null;
      if (button) {
        const rect = button.getBoundingClientRect();
        return {
          top: rect.top,
          left: rect.right + (isMobile ? 10 : 14),
        };
      }
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
      audioUnlockedRef.current = true;
      try { Engine.audioEngine?.unlock(); } catch {}
      try { Engine.audioEngine?.audioContext?.resume(); } catch {}
      try { Engine.audioEngine?.setGlobalVolume(0.9); } catch {}

      safeHtmlPlay(htmlAmbient)
        .then(() => {
          htmlAmbient.pause();
          htmlAmbient.currentTime = 0;
        })
        .catch(() => {});
      safeHtmlPlay(htmlFootsteps)
        .then(() => {
          htmlFootsteps.pause();
          htmlFootsteps.currentTime = 0;
        })
        .catch(() => {});
      // Music tracks are lazy-loaded; no warm-up to avoid prefetching all audio.

      if (useHtmlAudioRef.current) {
        htmlAmbient.volume = 0;
        htmlPeopleTalking.volume = 0;
        safeHtmlPlay(htmlAmbient);
        safeHtmlPlay(htmlPeopleTalking);
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
          safeHtmlPlay(htmlAmbient);
          safeHtmlPlay(htmlPeopleTalking);
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
      readinessTimer = window.setTimeout(() => {
        const anyReady =
          ambientCity.isReady() ||
          peopleTalking.isReady() ||
          footsteps.isReady() ||
          musicTracks.some((track) => track.isReady());
        if (!anyReady) {
          useHtmlAudioRef.current = true;
          try { ambientCity.stop(); } catch {}
          try { peopleTalking.stop(); } catch {}
          try { footsteps.stop(); } catch {}
          musicTracks.forEach((track) => {
            try { track.stop(); } catch {}
          });
          htmlAmbient.volume = 0;
          htmlPeopleTalking.volume = 0;
          safeHtmlPlay(htmlAmbient);
          safeHtmlPlay(htmlPeopleTalking);
          playMusic(playlistIndexRef.current);
        }
      }, 3000);
      window.removeEventListener("pointerdown", onUserGesture);
      window.removeEventListener("keydown", onUserGesture);
    };

    window.addEventListener("pointerdown", onUserGesture);
    window.addEventListener("keydown", onUserGesture);

    const fallbackTimer = window.setTimeout(() => {
      const allNotReady =
        !ambientCity.isReady() &&
        !airplaneFx.isReady() &&
        !catMeowLeft.isReady() &&
        !catMeowRight.isReady() &&
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
          safeHtmlPlay(htmlAmbient);
          safeHtmlPlay(htmlPeopleTalking);
          playMusic(playlistIndexRef.current);
        }
      }
    }, 4000);

    let walkActive = false;
    const startFootsteps = () => {
      if (useHtmlAudioRef.current || !footsteps.isReady()) {
        htmlFootstepsActiveRef.current = true;
        safeHtmlPlay(htmlFootsteps);
      } else if (!footsteps.isPlaying) {
        htmlFootstepsActiveRef.current = false;
        footsteps.play();
      }
    };
    const stopFootsteps = () => {
      if (useHtmlAudioRef.current || htmlFootstepsActiveRef.current) {
        htmlFootstepsActiveRef.current = false;
        htmlFootsteps.pause();
        htmlFootsteps.currentTime = 0;
      }
      if (!useHtmlAudioRef.current) {
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

    const playPowerFx = (expanded: boolean) => {
      if (!audioUnlockedRef.current) return;
      if (useHtmlAudioRef.current) {
        const audio = expanded ? htmlPowerOnRef.current : htmlPowerOffRef.current;
        if (!audio) return;
        audio.currentTime = 0;
        safeHtmlPlay(audio);
        return;
      }
      const sound = expanded ? powerOnFxRef.current : powerOffFxRef.current;
      if (!sound) return;
      if (sound.isPlaying) sound.stop();
      sound.play();
    };

    const onPowerToggle = (evt: Event) => {
      const detail = (evt as CustomEvent<{ expanded?: boolean }>).detail;
      if (detail?.expanded === undefined) return;
      playPowerFx(detail.expanded);
    };
    window.addEventListener("power-toggle", onPowerToggle as EventListener);

    return () => {
      try { window.removeEventListener("pointerdown", onUserGesture); } catch {}
      try { window.removeEventListener("keydown", onUserGesture); } catch {}
      try { window.removeEventListener("music-visibility", onMusicVisibility as EventListener); } catch {}
      try { window.removeEventListener("resize", onResize); } catch {}
      try { document.removeEventListener("pointerdown", onDocPointerDown); } catch {}
      try { window.removeEventListener("power-toggle", onPowerToggle as EventListener); } catch {}
      try { window.removeEventListener("walk-input", onWalkInput as EventListener); } catch {}
      try { if (airplaneTimer) window.clearInterval(airplaneTimer); } catch {}
      try { if (catTimer) window.clearInterval(catTimer); } catch {}
      try { if (windTimer) window.clearInterval(windTimer); } catch {}
      try { if (carPassTimer) window.clearTimeout(carPassTimer); } catch {}
      try { if (startTimer) window.clearTimeout(startTimer); } catch {}
      try { if (readinessTimer) window.clearTimeout(readinessTimer); } catch {}
      try { window.clearTimeout(fallbackTimer); } catch {}
      try { ambientCity.stop(); } catch {}
      try { peopleTalking.stop(); } catch {}
      try { footsteps.stop(); } catch {}
      musicTracks.forEach((track) => {
        try { track.stop(); } catch {}
      });
      try { ambientCity.dispose(); } catch {}
      try { airplaneFx.dispose(); } catch {}
      try { catMeowLeft.dispose(); } catch {}
      try { catMeowRight.dispose(); } catch {}
      try { windFx.dispose(); } catch {}
      try { peopleTalking.dispose(); } catch {}
      try { footsteps.dispose(); } catch {}
      try { carPassFx.dispose(); } catch {}
      try { powerOnFx.dispose(); } catch {}
      try { powerOffFx.dispose(); } catch {}
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
    if (catMeowLeftRef.current) catMeowLeftRef.current.setVolume(lv.cat);
    if (catMeowRightRef.current) catMeowRightRef.current.setVolume(lv.cat);
    if (windFxRef.current) windFxRef.current.setVolume(lv.wind);
    if (htmlAmbientRef.current) htmlAmbientRef.current.volume = clamp01(lv.ambient);
    if (htmlPeopleRef.current) htmlPeopleRef.current.volume = clamp01(lv.people);
    if (htmlFootstepsRef.current) htmlFootstepsRef.current.volume = clamp01(lv.footsteps);
    if (htmlAirplaneRef.current) htmlAirplaneRef.current.volume = clamp01(lv.airplane);
    if (htmlCatLeftRef.current) htmlCatLeftRef.current.volume = clamp01(lv.cat);
    if (htmlCatRightRef.current) htmlCatRightRef.current.volume = clamp01(lv.cat);
    if (htmlWindRef.current) htmlWindRef.current.volume = clamp01(lv.wind);
    const tracks = musicTracksRef.current;
    tracks[0]?.setVolume(lv.musicMissMisery);
    tracks[1]?.setVolume(lv.musicSycamore);
    tracks[2]?.setVolume(lv.musicSynthwave);
    tracks[3]?.setVolume(lv.musicDropTheGame);
    tracks[4]?.setVolume(lv.musicAfterDark);
    tracks[5]?.setVolume(lv.musicDarkAllDay);
    tracks[6]?.setVolume(lv.musicEarthquake);
    tracks[7]?.setVolume(lv.musicFlightOfTheNavigator);
    const htmlTracks = htmlMusicRefs.current;
    if (htmlTracks[0]) htmlTracks[0].volume = clamp01(lv.musicMissMisery);
    if (htmlTracks[1]) htmlTracks[1].volume = clamp01(lv.musicSycamore);
    if (htmlTracks[2]) htmlTracks[2].volume = clamp01(lv.musicSynthwave);
    if (htmlTracks[3]) htmlTracks[3].volume = clamp01(lv.musicDropTheGame);
    if (htmlTracks[4]) htmlTracks[4].volume = clamp01(lv.musicAfterDark);
    if (htmlTracks[5]) htmlTracks[5].volume = clamp01(lv.musicDarkAllDay);
    if (htmlTracks[6]) htmlTracks[6].volume = clamp01(lv.musicEarthquake);
    if (htmlTracks[7]) htmlTracks[7].volume = clamp01(lv.musicFlightOfTheNavigator);
  }, []);

  useEffect(() => {
    musicGainRef.current = clamp01(musicGain);
    const lv = levelsRef.current;
    const tracks = musicTracksRef.current;
    tracks[0]?.setVolume(lv.musicMissMisery * musicGainRef.current);
    tracks[1]?.setVolume(lv.musicSycamore * musicGainRef.current);
    tracks[2]?.setVolume(lv.musicSynthwave * musicGainRef.current);
    tracks[3]?.setVolume(lv.musicDropTheGame * musicGainRef.current);
    tracks[4]?.setVolume(lv.musicAfterDark * musicGainRef.current);
    tracks[5]?.setVolume(lv.musicDarkAllDay * musicGainRef.current);
    tracks[6]?.setVolume(lv.musicEarthquake * musicGainRef.current);
    tracks[7]?.setVolume(lv.musicFlightOfTheNavigator * musicGainRef.current);
    const htmlTracks = htmlMusicRefs.current;
    if (htmlTracks[0]) htmlTracks[0].volume = clamp01(lv.musicMissMisery * musicGainRef.current);
    if (htmlTracks[1]) htmlTracks[1].volume = clamp01(lv.musicSycamore * musicGainRef.current);
    if (htmlTracks[2]) htmlTracks[2].volume = clamp01(lv.musicSynthwave * musicGainRef.current);
    if (htmlTracks[3]) htmlTracks[3].volume = clamp01(lv.musicDropTheGame * musicGainRef.current);
    if (htmlTracks[4]) htmlTracks[4].volume = clamp01(lv.musicAfterDark * musicGainRef.current);
    if (htmlTracks[5]) htmlTracks[5].volume = clamp01(lv.musicDarkAllDay * musicGainRef.current);
    if (htmlTracks[6]) htmlTracks[6].volume = clamp01(lv.musicEarthquake * musicGainRef.current);
    if (htmlTracks[7]) htmlTracks[7].volume = clamp01(lv.musicFlightOfTheNavigator * musicGainRef.current);
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
          {!isTouchDevice && (
            <label className="music-panel-slider">
              <span>Volume</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={musicGain}
                onChange={(e) => setMusicGain(parseFloat(e.target.value))}
              />
              <span>{musicGain.toFixed(2)}</span>
            </label>
          )}
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
    </>
  );
};

export default WorldSounds;
