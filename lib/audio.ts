// Mechanical sound synthesizer for Pyraminx rotations and snaps using Web Audio API

class SoundEffectsManager {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Crisp mechanical tactile click / plastic snap
  public playClick(pitchMultiplier: number = 1.0) {
    if (!this.enabled || typeof window === 'undefined') return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      // Mechanical pop/click filter
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400 * pitchMultiplier, now);
      filter.Q.setValueAtTime(3.5, now);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(380 * pitchMultiplier, now);
      osc.frequency.exponentialRampToValueAtTime(80 * pitchMultiplier, now + 0.045);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.055);

      // Add a subtle high-frequency friction texture
      const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.03, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseBuffer.length; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.setValueAtTime(2800, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.08, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      noise.start(now);
      noise.stop(now + 0.035);
    } catch {
      // Audio playback fails silently if restricted by browser policy
    }
  }

  // Celebratory victory chord when puzzle is solved
  public playVictory() {
    if (!this.enabled || typeof window === 'undefined') return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      const now = this.ctx.currentTime;

      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.09);

        gain.gain.setValueAtTime(0, now + idx * 0.09);
        gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.09 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.6);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 0.65);
      });
    } catch {
      // Ignore audio error
    }
  }
}

export const soundManager = new SoundEffectsManager();
