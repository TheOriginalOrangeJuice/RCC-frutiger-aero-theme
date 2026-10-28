import CTFd from "@ctfdio/ctfd-js";
import { initializeArtwork } from "./utils/artwork";

const SOUND_STORAGE_KEY = "ctfd-frutiger-aero-sound";
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let lastCelebratedResponse = null;

window.aeroHandleSubmissionResponse = response => {
  if (response?.data?.status !== "correct" || response === lastCelebratedResponse) {
    return;
  }

  lastCelebratedResponse = response;
  window.dispatchEvent(new CustomEvent("aero:solve"));
};

// localStorage throws in some privacy modes; sound settings are a convenience.
function readSoundSetting() {
  try {
    return window.localStorage.getItem(SOUND_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeSoundSetting(value) {
  try {
    window.localStorage.setItem(SOUND_STORAGE_KEY, value);
  } catch {
    // Setting simply won't persist across pages.
  }
}

let soundSetting = readSoundSetting();

function soundEnabled() {
  // Sound is on for new visitors; always respect an explicitly saved mute.
  return soundSetting !== "false";
}

// The admin-chosen notification chime plays by default, but a participant who
// explicitly switches sound off gets silence everywhere.
function syncNotificationSound() {
  CTFd.events?.howl?.mute(soundSetting === "false");
}

let audioContext = null;

// One shared context: browsers cap concurrent contexts, and Safari only lets a
// context start after it has been resumed inside a user gesture.
function getAudioContext() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext || navigator.userActivation?.hasBeenActive === false) {
    return null;
  }

  audioContext ??= new AudioContext();
  if (audioContext.state === "suspended") {
    audioContext.resume().catch(() => {});
  }
  return audioContext;
}

function updateSoundControls() {
  const enabled = soundEnabled();

  document.querySelectorAll("[data-aero-sound-toggle]").forEach(button => {
    button.setAttribute("aria-pressed", enabled ? "true" : "false");

    const icon = button.querySelector("i");
    icon?.classList.toggle("fa-volume-high", enabled);
    icon?.classList.toggle("fa-volume-xmark", !enabled);

    button.querySelectorAll("[data-aero-sound-state]").forEach(state => {
      state.textContent = enabled ? state.dataset.on : state.dataset.off;
    });
  });

  syncNotificationSound();
}

function playSolveChime() {
  if (!soundEnabled()) {
    return;
  }

  const context = getAudioContext();
  if (!context) {
    return;
  }
  const gain = context.createGain();
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.13, context.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.7);
  gain.connect(context.destination);

  [523.25, 659.25, 783.99].forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    oscillator.connect(gain);
    oscillator.start(context.currentTime + index * 0.1);
    oscillator.stop(context.currentTime + 0.72);
  });
}

function playBubblePop() {
  if (!soundEnabled()) {
    return;
  }

  const context = getAudioContext();
  // Don't queue hover sounds to play later when the browser unlocks audio.
  if (!context || context.state !== "running") {
    return;
  }
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(390, context.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(980, context.currentTime + 0.08);
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.065, context.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.11);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.12);
}

function celebrateSolve() {
  playSolveChime();

  if (reduceMotion.matches) {
    return;
  }

  const celebration = document.querySelector(".aero-celebration");
  if (!celebration) {
    return;
  }

  celebration.classList.remove("is-active");
  window.requestAnimationFrame(() => {
    celebration.classList.add("is-active");
    window.setTimeout(() => celebration.classList.remove("is-active"), 1900);
  });
}

window.addEventListener("DOMContentLoaded", () => {
  initializeArtwork();
  const root = document.documentElement;
  const cursorGlow = document.querySelector(".aero-cursor-glow");
  const finePointer = window.matchMedia("(pointer: fine)");
  let pointerFrame = 0;

  let pointerX = 0;
  let pointerY = 0;

  const updateAmbientParallax = event => {
    pointerX = event.clientX;
    pointerY = event.clientY;

    if (pointerFrame || reduceMotion.matches || !finePointer.matches) {
      return;
    }

    // Read the latest position inside the frame, not the first event's.
    pointerFrame = window.requestAnimationFrame(() => {
      const horizontal = pointerX / window.innerWidth - 0.5;
      const vertical = pointerY / window.innerHeight - 0.5;
      root.style.setProperty("--aero-parallax-x", `${horizontal * 12}px`);
      root.style.setProperty("--aero-parallax-y", `${vertical * 8}px`);
      cursorGlow?.style.setProperty("--aero-pointer-x", `${pointerX}px`);
      cursorGlow?.style.setProperty("--aero-pointer-y", `${pointerY}px`);
      pointerFrame = 0;
    });
  };

  window.addEventListener("pointermove", updateAmbientParallax, { passive: true });

  // A normal first interaction unlocks hover audio without making a click sound.
  // Keep listening so a context suspended by the browser can also be resumed.
  const unlockAudio = () => {
    if (soundEnabled()) {
      getAudioContext();
    }
  };
  document.addEventListener("pointerdown", unlockAudio, {
    capture: true,
    passive: true,
  });
  document.addEventListener("keydown", unlockAudio, { capture: true });

  const clock = document.querySelector("[data-aero-clock]");
  if (clock) {
    const clockFormat = new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
    const updateClock = () => {
      const now = new Date();
      clock.textContent = clockFormat.format(now);
      clock.dateTime = now.toISOString();
    };
    // Tick on the minute boundary so the displayed time is never stale.
    const tick = () => {
      updateClock();
      window.setTimeout(tick, 60000 - (Date.now() % 60000) + 50);
    };
    tick();
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        updateClock();
      }
    });
  }

  document.querySelectorAll("[data-aero-sound-toggle]").forEach(button => {
    button.addEventListener("click", () => {
      soundSetting = soundEnabled() ? "false" : "true";
      writeSoundSetting(soundSetting);
      updateSoundControls();
      // Confirms the change and unlocks audio inside this user gesture.
      playBubblePop();
    });
  });

  document.querySelectorAll(".aero-bubble-link").forEach(link => {
    let lastPointerType = "";

    link.addEventListener("pointerenter", event => {
      if (event.pointerType === "mouse" && !link.classList.contains("active")) {
        link.classList.add("is-popped");
        playBubblePop();
      }
    });

    link.addEventListener("pointerleave", event => {
      if (!link.classList.contains("active")) {
        link.classList.remove("is-popped");
      }
    });

    link.addEventListener("pointercancel", () => {
      if (!link.classList.contains("active")) {
        link.classList.remove("is-popped");
      }
    });

    link.addEventListener("pointerdown", event => {
      lastPointerType = event.pointerType;
      if (event.pointerType !== "mouse") {
        link.classList.add("is-popped");
        playBubblePop();
      }
    });

    link.addEventListener("click", event => {
      // Keyboard, screen readers and scripted clicks have no pointerdown.
      const fromTouch =
        lastPointerType !== "" && lastPointerType !== "mouse" && event.detail !== 0;
      lastPointerType = "";

      if (
        !fromTouch ||
        reduceMotion.matches ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        link.target === "_blank"
      ) {
        return;
      }

      // Let the bubble visibly burst before the page changes.
      event.preventDefault();
      link.classList.add("is-launching");
      window.setTimeout(() => window.location.assign(link.href), 240);
    });
  });

  // Coming back via the back/forward cache must not show a half-launched bubble.
  window.addEventListener("pageshow", () => {
    document.querySelectorAll(".aero-bubble-link").forEach(link => {
      link.classList.remove("is-launching");
      if (!link.classList.contains("active")) {
        link.classList.remove("is-popped");
      }
    });
  });

  updateSoundControls();
});

window.addEventListener("aero:solve", celebrateSolve);
