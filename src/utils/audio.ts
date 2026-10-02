// Industrial Audio Alert Synthesizer using Web Audio API

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private activeOscillators: OscillatorNode[] = [];

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopAlarm();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // Play urgent two-tone industrial alarm siren
  public playIndustrialAlarm() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';

      // Modulate frequency between 750Hz and 1100Hz
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.linearRampToValueAtTime(1150, now + 0.25);
      osc.frequency.linearRampToValueAtTime(800, now + 0.5);
      osc.frequency.linearRampToValueAtTime(1150, now + 0.75);
      osc.frequency.linearRampToValueAtTime(800, now + 1.0);

      // Volume envelope with pulsation
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.05);
      gain.gain.setValueAtTime(0.25, now + 0.9);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 1.15);

      this.activeOscillators.push(osc);
      osc.onended = () => {
        this.activeOscillators = this.activeOscillators.filter((o) => o !== osc);
      };
    } catch (e) {
      console.warn('Audio play failed:', e);
    }
  }

  // Play a soft positive chime when resolved
  public playSuccessChime() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      freqs.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.09);

        gain.gain.setValueAtTime(0.001, now + idx * 0.09);
        gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.09 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.09 + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 0.4);
      });
    } catch (e) {
      console.warn('Audio play failed:', e);
    }
  }

  // Play phone push sound notification (ding-dong)
  public playPushSound() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, now); // B5
      osc.frequency.setValueAtTime(1318.51, now + 0.12); // E6

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.55);
    } catch (e) {
      console.warn('Audio push sound error:', e);
    }
  }

  public stopAlarm() {
    this.activeOscillators.forEach((osc) => {
      try {
        osc.stop();
      } catch (e) {
        // ignore
      }
    });
    this.activeOscillators = [];
  }
}

export const soundManager = new SoundManager();
