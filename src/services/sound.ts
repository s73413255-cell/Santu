/**
 * Procedural Web Audio API Sound Engine
 * Provides authentic, instant, zero-latency cartoon tycoon sound effects and happy background music.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private musicGainNode: GainNode | null = null;
  private sfxGainNode: GainNode | null = null;
  private isMusicPlaying = false;
  private musicIntervalId: number | null = null;
  private musicStep = 0;

  private initContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();

      this.musicGainNode = this.ctx.createGain();
      this.musicGainNode.gain.setValueAtTime(0.2, this.ctx.currentTime);
      this.musicGainNode.connect(this.ctx.destination);

      this.sfxGainNode = this.ctx.createGain();
      this.sfxGainNode.gain.setValueAtTime(0.4, this.ctx.currentTime);
      this.sfxGainNode.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Play a soft tap/button click sound
  playClick() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGainNode) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.sfxGainNode);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.06);
    } catch {
      // AudioContext autoplay restrictions handled silently
    }
  }

  // Play customer footsteps / cart wheel tick
  playFootstep() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGainNode) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220 + Math.random() * 40, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.sfxGainNode);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.045);
    } catch {
      // Silent catch
    }
  }

  // Play authentic Cash Register sound ("Ka-Ching!!")
  playCashRegister() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGainNode) return;

      const now = this.ctx.currentTime;

      // Bell 1 (high ping)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1800, now);
      osc1.frequency.exponentialRampToValueAtTime(1200, now + 0.15);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc1.connect(gain1);
      gain1.connect(this.sfxGainNode);
      osc1.start(now);
      osc1.stop(now + 0.16);

      // Bell 2 ("Ching!" harmonic)
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(2400, now + 0.08);
      osc2.frequency.exponentialRampToValueAtTime(2000, now + 0.35);
      gain2.gain.setValueAtTime(0.35, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc2.connect(gain2);
      gain2.connect(this.sfxGainNode);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.36);

      // Mechanical gear drawer pop
      const osc3 = this.ctx.createOscillator();
      const gain3 = this.ctx.createGain();
      osc3.type = 'square';
      osc3.frequency.setValueAtTime(320, now);
      osc3.frequency.exponentialRampToValueAtTime(80, now + 0.1);
      gain3.gain.setValueAtTime(0.12, now);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc3.connect(gain3);
      gain3.connect(this.sfxGainNode);
      osc3.start(now);
      osc3.stop(now + 0.11);
    } catch {
      // Ignore
    }
  }

  // Play coin pickup chime
  playCoin() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGainNode) return;

      const now = this.ctx.currentTime;
      const freqs = [987.77, 1318.51]; // B5, E6
      freqs.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        gain.gain.setValueAtTime(0.2, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.18);

        osc.connect(gain);
        gain.connect(this.sfxGainNode!);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.2);
      });
    } catch {
      // Ignore
    }
  }

  // Play upgrade sound (positive rising chord)
  playUpgrade() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGainNode) return;

      const now = this.ctx.currentTime;
      const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);

        gain.gain.setValueAtTime(0.25, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.25);

        osc.connect(gain);
        gain.connect(this.sfxGainNode!);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.26);
      });
    } catch {
      // Ignore
    }
  }

  // Play level up celebration fanfare
  playLevelUp() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGainNode) return;

      const now = this.ctx.currentTime;
      const melody = [
        { f: 523.25, t: 0.0, d: 0.1 },  // C5
        { f: 659.25, t: 0.1, d: 0.1 },  // E5
        { f: 783.99, t: 0.2, d: 0.1 },  // G5
        { f: 1046.5, t: 0.3, d: 0.3 },  // C6
      ];

      melody.forEach(({ f, t, d }) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + t);

        gain.gain.setValueAtTime(0.3, now + t);
        gain.gain.exponentialRampToValueAtTime(0.001, now + t + d);

        osc.connect(gain);
        gain.connect(this.sfxGainNode!);
        osc.start(now + t);
        osc.stop(now + t + d + 0.05);
      });
    } catch {
      // Ignore
    }
  }

  // Play clean floor spill pop
  playCleanSpill() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGainNode) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.12);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.sfxGainNode);
      osc.start(now);
      osc.stop(now + 0.13);
    } catch {
      // Ignore
    }
  }

  // Play sparkle sound for mini-game window taps
  playSparkle() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGainNode) return;

      const now = this.ctx.currentTime;
      const pitches = [1400, 1800, 2200];
      pitches.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);
        gain.gain.setValueAtTime(0.18, now + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.14);

        osc.connect(gain);
        gain.connect(this.sfxGainNode!);
        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 0.15);
      });
    } catch {
      // Ignore
    }
  }

  // Play triumph fanfare for mini-game reward completion
  playFanfare() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGainNode) return;

      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5]; // C5, E5, G5, C6, E6
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.24, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);

        osc.connect(gain);
        gain.connect(this.sfxGainNode!);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.36);
      });
    } catch {
      // Ignore
    }
  }

  // Cheerful background music synthesis
  startMusic() {
    if (this.isMusicPlaying) return;
    this.initContext();
    this.isMusicPlaying = true;
    this.musicStep = 0;

    // Upbeat gentle pentatonic melody loop in C Major (C4, E4, G4, A4, C5)
    const melodyScale = [261.63, 329.63, 392.0, 440.0, 523.25, 659.25];
    const bassScale = [130.81, 164.81, 196.0, 220.0];

    const melodySequence = [0, 2, 4, 2, 1, 3, 2, 0, 4, 3, 2, 4, 1, 2, 0, 2];
    const bassSequence = [0, 0, 2, 2, 1, 1, 3, 2];

    const tempoMs = 280; // ~107 BPM, chill & bouncy

    this.musicIntervalId = window.setInterval(() => {
      if (!this.isMusicPlaying || !this.ctx || !this.musicGainNode) return;

      try {
        const now = this.ctx.currentTime;

        // Lead note
        const noteIdx = melodySequence[this.musicStep % melodySequence.length];
        const freq = melodyScale[noteIdx];
        const osc = this.ctx.createOscillator();
        const noteGain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        noteGain.gain.setValueAtTime(0.04, now);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        osc.connect(noteGain);
        noteGain.connect(this.musicGainNode);
        osc.start(now);
        osc.stop(now + 0.24);

        // Bass note every 2 steps
        if (this.musicStep % 2 === 0) {
          const bassIdx = bassSequence[Math.floor(this.musicStep / 2) % bassSequence.length];
          const bassFreq = bassScale[bassIdx];
          const bassOsc = this.ctx.createOscillator();
          const bassGain = this.ctx.createGain();

          bassOsc.type = 'triangle';
          bassOsc.frequency.setValueAtTime(bassFreq, now);

          bassGain.gain.setValueAtTime(0.06, now);
          bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

          bassOsc.connect(bassGain);
          bassGain.connect(this.musicGainNode);
          bassOsc.start(now);
          bassOsc.stop(now + 0.38);
        }

        this.musicStep++;
      } catch {
        // Safe fail
      }
    }, tempoMs);
  }

  stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicIntervalId !== null) {
      clearInterval(this.musicIntervalId);
      this.musicIntervalId = null;
    }
  }

  setMusicVolume(enabled: boolean) {
    if (this.musicGainNode && this.ctx) {
      this.musicGainNode.gain.setValueAtTime(enabled ? 0.18 : 0, this.ctx.currentTime);
    }
    if (!enabled) {
      this.stopMusic();
    } else {
      this.startMusic();
    }
  }

  setSfxVolume(enabled: boolean) {
    if (this.sfxGainNode && this.ctx) {
      this.sfxGainNode.gain.setValueAtTime(enabled ? 0.35 : 0, this.ctx.currentTime);
    }
  }
}

export const soundService = new SoundEngine();
