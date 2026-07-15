/**
 * Lightweight Web Audio synthesizer for LostSeahorse SFX.
 * Avoids shipping binary assets while keeping a polished underwater feel.
 */

export type SynthKind =
  | "projectile"
  | "letterHit"
  | "wrongLetter"
  | "bubblePop"
  | "explosion"
  | "countdown"
  | "hover"
  | "click"
  | "gameOver"
  | "results"
  | "damage"
  | "ambientWater"
  | "ambientBubble";

let sharedCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!sharedCtx) {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return null;
    sharedCtx = new Ctx();
  }
  return sharedCtx;
}

export async function resumeAudioContext(): Promise<boolean> {
  const ctx = getAudioContext();
  if (!ctx) return false;
  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      return false;
    }
  }
  return ctx.state === "running";
}

function tone(
  ctx: AudioContext,
  dest: AudioNode,
  opts: {
    freq: number;
    type?: OscillatorType;
    duration: number;
    attack?: number;
    decay?: number;
    gain?: number;
    detune?: number;
    freqEnd?: number;
  },
): void {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = opts.type ?? "sine";
  osc.frequency.setValueAtTime(opts.freq, now);
  if (opts.freqEnd != null) {
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(20, opts.freqEnd),
      now + opts.duration,
    );
  }
  if (opts.detune) osc.detune.setValueAtTime(opts.detune, now);

  const attack = opts.attack ?? 0.01;
  const decay = opts.decay ?? opts.duration * 0.85;
  const peak = opts.gain ?? 0.2;

  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(peak, now + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, now + attack + decay);

  osc.connect(g);
  g.connect(dest);
  osc.start(now);
  osc.stop(now + opts.duration + 0.05);
}

function noiseBurst(
  ctx: AudioContext,
  dest: AudioNode,
  opts: {
    duration: number;
    gain?: number;
    highpass?: number;
    lowpass?: number;
  },
): void {
  const len = Math.floor(ctx.sampleRate * opts.duration);
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  }
  const src = ctx.createBufferSource();
  src.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = opts.highpass ?? 800;
  filter.Q.value = 0.7;

  if (opts.lowpass) {
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = opts.lowpass;
    const g = ctx.createGain();
    g.gain.value = opts.gain ?? 0.15;
    src.connect(filter);
    filter.connect(lp);
    lp.connect(g);
    g.connect(dest);
  } else {
    const g = ctx.createGain();
    g.gain.value = opts.gain ?? 0.15;
    src.connect(filter);
    filter.connect(g);
    g.connect(dest);
  }

  src.start();
  src.stop(ctx.currentTime + opts.duration);
}

/** Play a one-shot synthesized effect into `dest` (usually a GainNode). */
export function playSynth(
  kind: SynthKind,
  dest: AudioNode,
  ctx: AudioContext,
): void {
  switch (kind) {
    case "projectile":
      tone(ctx, dest, {
        freq: 520,
        freqEnd: 880,
        type: "triangle",
        duration: 0.09,
        gain: 0.12,
        attack: 0.005,
      });
      tone(ctx, dest, {
        freq: 240,
        freqEnd: 160,
        type: "sine",
        duration: 0.07,
        gain: 0.06,
      });
      break;

    case "letterHit":
      tone(ctx, dest, {
        freq: 740,
        freqEnd: 420,
        type: "sine",
        duration: 0.08,
        gain: 0.1,
      });
      noiseBurst(ctx, dest, {
        duration: 0.05,
        gain: 0.05,
        highpass: 1200,
        lowpass: 4000,
      });
      break;

    case "wrongLetter":
      // Short harsh buzz — distinct from correct hits
      tone(ctx, dest, {
        freq: 220,
        freqEnd: 95,
        type: "sawtooth",
        duration: 0.11,
        gain: 0.16,
        attack: 0.004,
      });
      tone(ctx, dest, {
        freq: 340,
        freqEnd: 140,
        type: "square",
        duration: 0.08,
        gain: 0.07,
        attack: 0.003,
      });
      noiseBurst(ctx, dest, {
        duration: 0.07,
        gain: 0.1,
        highpass: 600,
        lowpass: 2200,
      });
      break;

    case "bubblePop":
      tone(ctx, dest, {
        freq: 380,
        freqEnd: 120,
        type: "sine",
        duration: 0.12,
        gain: 0.14,
        attack: 0.002,
      });
      tone(ctx, dest, {
        freq: 900,
        freqEnd: 200,
        type: "triangle",
        duration: 0.08,
        gain: 0.05,
      });
      break;

    case "explosion":
      noiseBurst(ctx, dest, {
        duration: 0.35,
        gain: 0.22,
        highpass: 180,
        lowpass: 1400,
      });
      tone(ctx, dest, {
        freq: 120,
        freqEnd: 45,
        type: "sine",
        duration: 0.4,
        gain: 0.2,
        attack: 0.01,
      });
      tone(ctx, dest, {
        freq: 280,
        freqEnd: 90,
        type: "triangle",
        duration: 0.28,
        gain: 0.1,
      });
      break;

    case "damage":
      tone(ctx, dest, {
        freq: 180,
        freqEnd: 90,
        type: "sawtooth",
        duration: 0.22,
        gain: 0.1,
      });
      noiseBurst(ctx, dest, {
        duration: 0.15,
        gain: 0.08,
        highpass: 300,
        lowpass: 900,
      });
      break;

    case "countdown":
      tone(ctx, dest, {
        freq: 440,
        type: "sine",
        duration: 0.15,
        gain: 0.14,
      });
      tone(ctx, dest, {
        freq: 660,
        type: "triangle",
        duration: 0.12,
        gain: 0.08,
        attack: 0.02,
      });
      break;

    case "hover":
      // Intentionally silent — hover SFX disabled for cleaner UX
      break;

    case "click":
      tone(ctx, dest, {
        freq: 520,
        freqEnd: 360,
        type: "triangle",
        duration: 0.08,
        gain: 0.32,
        attack: 0.004,
      });
      tone(ctx, dest, {
        freq: 780,
        freqEnd: 420,
        type: "sine",
        duration: 0.055,
        gain: 0.18,
        attack: 0.003,
      });
      break;

    case "gameOver":
      tone(ctx, dest, {
        freq: 330,
        freqEnd: 110,
        type: "sine",
        duration: 0.7,
        gain: 0.16,
        attack: 0.05,
      });
      tone(ctx, dest, {
        freq: 220,
        freqEnd: 80,
        type: "triangle",
        duration: 0.85,
        gain: 0.1,
        attack: 0.08,
      });
      break;

    case "results":
      tone(ctx, dest, {
        freq: 392,
        type: "sine",
        duration: 0.2,
        gain: 0.1,
      });
      tone(ctx, dest, {
        freq: 523,
        type: "sine",
        duration: 0.22,
        gain: 0.1,
        attack: 0.08,
      });
      tone(ctx, dest, {
        freq: 659,
        type: "triangle",
        duration: 0.35,
        gain: 0.09,
        attack: 0.16,
      });
      break;

    case "ambientWater":
      // Soft low drone pulse (short one-shot used by loop scheduler)
      tone(ctx, dest, {
        freq: 55 + Math.random() * 8,
        type: "sine",
        duration: 2.2,
        gain: 0.035,
        attack: 0.4,
        decay: 1.6,
      });
      tone(ctx, dest, {
        freq: 90 + Math.random() * 12,
        type: "triangle",
        duration: 1.8,
        gain: 0.018,
        attack: 0.5,
      });
      break;

    case "ambientBubble":
      tone(ctx, dest, {
        freq: 280 + Math.random() * 220,
        freqEnd: 80 + Math.random() * 40,
        type: "sine",
        duration: 0.18 + Math.random() * 0.12,
        gain: 0.025 + Math.random() * 0.02,
        attack: 0.01,
      });
      break;
  }
}
