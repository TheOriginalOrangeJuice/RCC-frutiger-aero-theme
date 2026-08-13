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

function soundEnabled() {
  return window.localStorage.getItem(SOUND_STORAGE_KEY) === "true";
}

function updateSoundControls() {
  const enabled = soundEnabled();

  document.querySelectorAll("[data-aero-sound-toggle]").forEach(button => {
    const labelOn = button.dataset.labelOn;
    const labelOff = button.dataset.labelOff;
    button.setAttribute("aria-pressed", enabled ? "true" : "false");
    button.title = enabled ? button.dataset.titleOn : button.dataset.titleOff;

    const icon = button.querySelector("i");
    icon?.classList.toggle("fa-volume-high", enabled);
    icon?.classList.toggle("fa-volume-xmark", !enabled);

    button.querySelectorAll("[data-aero-sound-label]").forEach(label => {
      label.textContent = enabled ? labelOn : labelOff;
    });
  });
}

function playSolveChime() {
  if (!soundEnabled()) {
    return;
  }

  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) {
    return;
  }

  const context = new AudioContext();
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

  window.setTimeout(() => context.close(), 900);
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
  document.documentElement.setAttribute("data-bs-theme", "light");

  const root = document.documentElement;
  const finePointer = window.matchMedia("(pointer: fine)");
  let pointerFrame = 0;

  const updateAmbientParallax = event => {
    if (pointerFrame || reduceMotion.matches || !finePointer.matches) {
      return;
    }

    pointerFrame = window.requestAnimationFrame(() => {
      const horizontal = event.clientX / window.innerWidth - 0.5;
      const vertical = event.clientY / window.innerHeight - 0.5;
      root.style.setProperty("--aero-parallax-x", `${horizontal * 12}px`);
      root.style.setProperty("--aero-parallax-y", `${vertical * 8}px`);
      root.style.setProperty("--aero-pointer-x", `${event.clientX}px`);
      root.style.setProperty("--aero-pointer-y", `${event.clientY}px`);
      pointerFrame = 0;
    });
  };

  window.addEventListener("pointermove", updateAmbientParallax, { passive: true });

  const clock = document.querySelector("[data-aero-clock]");
  const updateClock = () => {
    if (clock) {
      clock.textContent = new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date());
    }
  };
  updateClock();
  window.setInterval(updateClock, 30000);

  document.querySelectorAll("[data-aero-sound-toggle]").forEach(button => {
    button.addEventListener("click", () => {
      window.localStorage.setItem(SOUND_STORAGE_KEY, (!soundEnabled()).toString());
      updateSoundControls();
    });
  });

  updateSoundControls();
});

window.addEventListener("aero:solve", celebrateSolve);
