/**
 * Web Audio API synthesizer for sound effects.
 * Safe, offline, zero-latency, and requires no external audio assets.
 */

let audioCtx: AudioContext | null = null;
let soundEnabled = true;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function isAudioMuted(): boolean {
  return !soundEnabled;
}

export function toggleAudioMute(muted?: boolean): boolean {
  if (muted !== undefined) {
    soundEnabled = !muted;
  } else {
    soundEnabled = !soundEnabled;
  }
  return soundEnabled;
}

/**
 * Play a ticking sound effect during random rolling
 */
export function playTickSound(pitchMultiplier = 1) {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const baseFreq = 440 * pitchMultiplier;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.05);
  } catch (e) {
    console.warn('Audio tick error', e);
  }
}

/**
 * Play celebratory chime/fanfare when winner is selected
 */
export function playFanfareSound() {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Major chord arpeggio: C5, E5, G5, C6 with warm harmonics
    const notes = [
      { freq: 523.25, time: 0.0, dur: 0.2 },   // C5
      { freq: 659.25, time: 0.12, dur: 0.2 },  // E5
      { freq: 783.99, time: 0.24, dur: 0.25 }, // G5
      { freq: 1046.50, time: 0.38, dur: 0.7 }, // C6 (sustained)
      { freq: 1318.51, time: 0.45, dur: 0.65 } // E6 harmony
    ];

    notes.forEach(({ freq, time, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + time);

      const startTime = ctx.currentTime + time;
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.25, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + dur);
    });
  } catch (e) {
    console.warn('Audio fanfare error', e);
  }
}

/**
 * Gentle click/pop sound
 */
export function playPopSound() {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.04);
  } catch {
    // ignore
  }
}
