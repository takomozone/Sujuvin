export type RideSound = 'ordered' | 'changed' | 'pickup' | 'fare';

// Small synthesized cues keep the standalone app self-contained.
export class RideSounds {
  private context: AudioContext | null = null;
  private voices = new Set<OscillatorNode>();
  private generation = 0;
  muted = false;

  unlock() {
    try {
      this.context ??= new AudioContext();
      if (this.context.state === 'suspended') void this.context.resume().catch(() => {});
    } catch { /* Audio is optional; booking still works without it. */ }
  }

  stop() {
    this.generation++;
    for (const voice of this.voices) {
      try { voice.stop(); } catch { /* Already ended. */ }
    }
    this.voices.clear();
  }

  async play(sound: RideSound) {
    const ctx = this.context, generation = this.generation;
    if (!ctx || this.muted || ctx.state === 'closed') return;
    try {
      if (ctx.state === 'suspended') await ctx.resume();
      if (this.muted || generation !== this.generation || ctx.state !== 'running') return;
      const start = ctx.currentTime + .025;
      const tone = (frequency: number, delay: number, duration: number, volume = .055, type: OscillatorType = 'sine') => {
        const oscillator = ctx.createOscillator(), gain = ctx.createGain();
        const at = start + delay;
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0, at);
        gain.gain.linearRampToValueAtTime(volume, at + .008);
        gain.gain.exponentialRampToValueAtTime(.0001, at + duration);
        oscillator.connect(gain); gain.connect(ctx.destination);
        this.voices.add(oscillator);
        oscillator.onended = () => { this.voices.delete(oscillator); oscillator.disconnect(); gain.disconnect(); };
        oscillator.start(at); oscillator.stop(at + duration + .02);
      };
      if (sound === 'ordered') {
        tone(523.25, 0, .22); tone(659.25, .11, .25); tone(783.99, .23, .4);
      } else if (sound === 'changed') {
        tone(659.25, 0, .2, .045); tone(440, .13, .25, .045); tone(587.33, .31, .35, .045);
      } else if (sound === 'pickup') {
        tone(783.99, 0, .45); tone(1046.5, .22, .6); tone(1568, .22, .35, .018);
      } else {
        // Two bright coin strikes, with quiet metallic overtones.
        for (const [delay, frequency] of [[0, 1318.51], [.25, 1760]]) {
          tone(frequency, delay, .7, .045);
          tone(frequency * 2.76, delay, .25, .012);
          tone(frequency * 4.07, delay, .14, .006);
        }
        tone(2093, .46, .55, .025);
      }
    } catch { /* A disabled audio device must not interrupt the ride. */ }
  }

  dispose() { this.stop(); void this.context?.close().catch(() => {}); this.context = null; }
}
