let context;

export function unlockAudio() {
  if (typeof window === "undefined") return null;
  context ||= new (window.AudioContext || window.webkitAudioContext)();
  if (context.state === "suspended") context.resume();
  return context;
}

export function playTone(frequency, duration = 0.16, volume = 0.055) {
  const ctx = unlockAudio();
  if (!ctx) return;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
  gain.gain.setValueAtTime(0.001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start();
  oscillator.stop(ctx.currentTime + duration + 0.02);
}

export function playFeedback(correct) {
  if (correct) {
    playTone(660, 0.1, 0.04);
    setTimeout(() => playTone(880, 0.12, 0.04), 80);
  } else {
    playTone(180, 0.18, 0.045);
  }
}