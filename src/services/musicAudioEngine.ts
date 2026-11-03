import { DEFAULT_MUSIC_TRACKS, MusicStateDto } from '@virtual-bus/shared';

class MusicAudioEngine {
  private ctx: AudioContext | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private currentMusicState: MusicStateDto | null = null;
  private localVolume = 0.45;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {
        // Ignore autoplay restriction until user interacts
      });
    }
    return this.ctx;
  }

  public syncState(state: MusicStateDto): void {
    this.currentMusicState = state;
    this.localVolume = state.volume;

    if (state.isPlaying) {
      this.startLoop();
    } else {
      this.stopLoop();
    }
  }

  public setLocalVolume(vol: number): void {
    this.localVolume = Math.max(0, Math.min(1, vol));
  }

  private startLoop(): void {
    if (this.timer) return;

    this.timer = setInterval(() => {
      const music = this.currentMusicState;
      if (!music || !music.isPlaying || this.localVolume <= 0.01) return;

      const ctx = this.ensureContext();
      if (!ctx || ctx.state !== 'running') return;

      const track =
        DEFAULT_MUSIC_TRACKS[
          music.currentTrackIndex % DEFAULT_MUSIC_TRACKS.length
        ] ?? DEFAULT_MUSIC_TRACKS[0];

      // Synchronize note index across all clients using server timestamp
      const elapsedSec = Math.max(
        0,
        (Date.now() - music.startedAtServerMs) / 1000
      );
      const beatsPerSec = track.tempoBpm / 60;
      const noteIndex =
        Math.floor(elapsedSec * beatsPerSec) % track.notesHz.length;
      const freq = track.notesHz[noteIndex];

      this.playSoftNote(ctx, freq, this.localVolume * 0.12);
    }, 620);
  }

  private playSoftNote(ctx: AudioContext, freq: number, gainValue: number): void {
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(
        Math.max(0.002, gainValue),
        now + 0.08
      );
      gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.52);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.55);
    } catch {
      // Ignore WebAudio transient errors
    }
  }

  public stopLoop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

export const musicAudioEngine = new MusicAudioEngine();

