import { useCallback, useEffect, useRef, useState } from 'react';
import { publicAsset } from '../lib/publicAsset';
import {
  getPreferredRunMood,
  getRunMusicEnabled,
  RunMood,
  savePetCompanionSettings,
  savePreferredRunMood,
  saveRunMusicEnabled,
} from '../lib/userProgressService';

export const RUN_MOOD_MUSIC_PATHS: Record<Exclude<RunMood, 'none'>, string> = {
  happy: publicAsset('audio/music/happy.mp3'),
  calm: publicAsset('audio/music/calm.mp3'),
  sad: publicAsset('audio/music/sad.mp3'),
};

const BASE_MUSIC_VOLUME = 0.22;
const DUCKED_MUSIC_VOLUME = 0.04;

export const getMoodMusicPath = (mood: RunMood) =>
  mood === 'none' ? null : RUN_MOOD_MUSIC_PATHS[mood];

export const useRunMoodMusic = () => {
  const [musicEnabled, setMusicEnabledState] = useState(getRunMusicEnabled);
  const [preferredMood, setPreferredMoodState] = useState<RunMood>(getPreferredRunMood);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [activeMood, setActiveMood] = useState<RunMood>('none');
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeTimerRef = useRef<number | null>(null);
  const warningShownRef = useRef<Set<string>>(new Set());
  const isPlayingRef = useRef(false);
  const isPausedByRunRef = useRef(false);
  const moodRef = useRef(preferredMood);

  const clearFade = useCallback(() => {
    if (fadeTimerRef.current !== null) {
      window.clearInterval(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
  }, []);

  const warnMissingOnce = useCallback((path: string) => {
    if (warningShownRef.current.has(path)) {
      return;
    }

    warningShownRef.current.add(path);
    console.warn(`[run-mood-music] Unable to play ${path}. The run will continue without music.`);
  }, []);

  const ensureAudio = useCallback(
    (mood: RunMood) => {
      const path = getMoodMusicPath(mood);
      if (!path) {
        return null;
      }

      if (!audioRef.current) {
        const audio = new Audio(path);
        audio.loop = true;
        audio.volume = BASE_MUSIC_VOLUME;
        audio.preload = 'auto';
        audio.addEventListener('error', () => warnMissingOnce(path));
        audioRef.current = audio;
        return audio;
      }

      const audio = audioRef.current;
      const targetSrc = new URL(path, window.location.origin).toString();
      if (audio.src !== targetSrc) {
        audio.pause();
        audio.src = path;
        audio.currentTime = 0;
        audio.volume = BASE_MUSIC_VOLUME;
        isPlayingRef.current = false;
        setIsMusicPlaying(false);
      }
      return audio;
    },
    [warnMissingOnce],
  );

  const fadeTo = useCallback(
    (targetVolume: number, durationMs: number) => {
      const audio = audioRef.current;
      if (!audio) {
        return;
      }

      clearFade();
      const startVolume = audio.volume;
      const startAt = Date.now();
      const duration = Math.max(1, durationMs);

      fadeTimerRef.current = window.setInterval(() => {
        const progress = Math.min(1, (Date.now() - startAt) / duration);
        audio.volume = startVolume + (targetVolume - startVolume) * progress;

        if (progress >= 1) {
          clearFade();
        }
      }, 50);
    },
    [clearFade],
  );

  const pauseMoodMusic = useCallback(() => {
    clearFade();
    if (audioRef.current) {
      audioRef.current.pause();
    }
    isPlayingRef.current = false;
    setIsMusicPlaying(false);
    isPausedByRunRef.current = true;
  }, [clearFade]);

  const stopMoodMusic = useCallback(() => {
    clearFade();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.volume = BASE_MUSIC_VOLUME;
    }
    isPlayingRef.current = false;
    setIsMusicPlaying(false);
    isPausedByRunRef.current = false;
    setActiveMood('none');
  }, [clearFade]);

  const playMoodMusic = useCallback(
    (mood: RunMood = moodRef.current) => {
      moodRef.current = mood;
      if (!musicEnabled || mood === 'none') {
        stopMoodMusic();
        return;
      }

      const audio = ensureAudio(mood);
      if (!audio) {
        setPlaybackError('Music is not available for this mood.');
        return;
      }

      isPausedByRunRef.current = false;
      audio.loop = true;
      setPlaybackError(null);
      setActiveMood(mood);
      if (audio.volume <= DUCKED_MUSIC_VOLUME) {
        audio.volume = BASE_MUSIC_VOLUME;
      }

      audio
        .play()
        .then(() => {
          isPlayingRef.current = true;
          setIsMusicPlaying(true);
          setPlaybackError(null);
        })
        .catch(() => {
          isPlayingRef.current = false;
          setIsMusicPlaying(false);
          setPlaybackError('Music could not start in this browser.');
          const path = getMoodMusicPath(mood);
          if (path) {
            warnMissingOnce(path);
          }
        });
    },
    [ensureAudio, musicEnabled, stopMoodMusic, warnMissingOnce],
  );

  const fadeOutMusic = useCallback(
    (durationMs = 900) => {
      fadeTo(DUCKED_MUSIC_VOLUME, durationMs);
    },
    [fadeTo],
  );

  const fadeInMusic = useCallback(
    (durationMs = 1200) => {
      if (!musicEnabled || preferredMood === 'none' || isPausedByRunRef.current) {
        return;
      }

      const audio = ensureAudio(preferredMood);
      if (!audio) {
        return;
      }

      if (audio.paused) {
        audio
          .play()
          .then(() => {
            isPlayingRef.current = true;
            setIsMusicPlaying(true);
            setActiveMood(preferredMood);
            setPlaybackError(null);
          })
          .catch(() => {
            isPlayingRef.current = false;
            setIsMusicPlaying(false);
            setPlaybackError('Music could not resume in this browser.');
            const path = getMoodMusicPath(preferredMood);
            if (path) {
              warnMissingOnce(path);
            }
          });
      }

      fadeTo(BASE_MUSIC_VOLUME, durationMs);
    },
    [ensureAudio, fadeTo, musicEnabled, preferredMood, warnMissingOnce],
  );

  const setMusicEnabled = useCallback(
    (enabled: boolean) => {
      setMusicEnabledState(saveRunMusicEnabled(enabled));
      if (!enabled) {
        stopMoodMusic();
      }
    },
    [stopMoodMusic],
  );

  const setMood = useCallback((mood: RunMood) => {
    moodRef.current = savePreferredRunMood(mood);
    setPreferredMoodState(moodRef.current);
  }, []);

  const saveRunCompanionMood = useCallback((mood: RunMood, enabled: boolean) => {
    const next = savePetCompanionSettings({
      preferredMood: mood,
      musicEnabled: enabled && mood !== 'none',
    });
    moodRef.current = next.preferredMood;
    setPreferredMoodState(next.preferredMood);
    setMusicEnabledState(next.musicEnabled);
    if (!next.musicEnabled || next.preferredMood === 'none') {
      stopMoodMusic();
    }
    return next;
  }, [stopMoodMusic]);

  useEffect(() => {
    moodRef.current = preferredMood;
  }, [preferredMood]);

  useEffect(() => {
    return () => stopMoodMusic();
  }, [stopMoodMusic]);

  return {
    musicEnabled,
    preferredMood,
    isMusicPlaying,
    activeMood,
    playbackError,
    setMusicEnabled,
    setMood,
    saveRunCompanionMood,
    playMoodMusic,
    pauseMoodMusic,
    stopMoodMusic,
    fadeOutMusic,
    fadeInMusic,
  };
};
