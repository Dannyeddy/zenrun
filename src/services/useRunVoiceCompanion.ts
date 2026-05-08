import { useCallback, useEffect, useRef, useState } from 'react';
import { PetAssetKey } from '../data/assets';
import { getRunVoiceEnabled, saveRunVoiceEnabled } from '../lib/userProgressService';

export type RunVoiceType =
  | 'start'
  | 'navigation'
  | 'encouragement'
  | 'landmarkNearby'
  | 'fragmentCollected'
  | 'pause'
  | 'resume'
  | 'routeCompleted';

export interface PetVoiceProfile {
  petKey: PetAssetKey;
  lang: string;
  rate: number;
  pitch: number;
  volume: number;
  preferredVoices: string[];
  encouragements: string[];
}

export interface SpeakOptions {
  immediate?: boolean;
  cooldownMs?: number;
  onStart?: () => void;
  onEnd?: () => void;
}

const DEFAULT_PET_KEY: PetAssetKey = 'dog';

const PET_VOICE_PROFILES: Record<PetAssetKey, PetVoiceProfile> = {
  rabbit: {
    petKey: 'rabbit',
    lang: 'en-US',
    rate: 0.95,
    pitch: 1.25,
    volume: 0.85,
    preferredVoices: [
      'Samantha',
      'Google US English',
      'Microsoft Jenny',
      'Microsoft Aria',
      'Female',
    ],
    encouragements: [
      "You're doing great! Tiny steps, big journey.",
      "Let's keep going together!",
      'Soft steps, bright heart. We are doing this.',
    ],
  },
  cat: {
    petKey: 'cat',
    lang: 'en-GB',
    rate: 0.85,
    pitch: 0.9,
    volume: 0.8,
    preferredVoices: [
      'Daniel',
      'Google UK English Male',
      'Microsoft George',
      'Microsoft Guy',
      'Male',
    ],
    encouragements: [
      'Excellent rhythm. Keep your breathing calm.',
      'Steady pace. I shall guide you from here.',
      'Very good. Let the route unfold at your pace.',
    ],
  },
  dog: {
    petKey: 'dog',
    lang: 'en-US',
    rate: 1.05,
    pitch: 1.05,
    volume: 0.85,
    preferredVoices: [
      'Google US English',
      'Microsoft Guy',
      'Microsoft Andrew',
      'Andrew',
      'Guy',
    ],
    encouragements: [
      "Nice pace! I'm right here with you.",
      "Come on! We're getting closer!",
      "Looking good! Let's keep this energy.",
    ],
  },
};

const VOICE_TYPE_COOLDOWNS: Record<RunVoiceType, number> = {
  start: 0,
  navigation: 90_000,
  encouragement: 90_000,
  landmarkNearby: 0,
  fragmentCollected: 0,
  pause: 0,
  resume: 0,
  routeCompleted: 0,
};

const canSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

export const getPetVoiceProfile = (selectedPetId?: number | PetAssetKey | null) => {
  if (selectedPetId === 3 || selectedPetId === 'rabbit') {
    return PET_VOICE_PROFILES.rabbit;
  }

  if (selectedPetId === 2 || selectedPetId === 'cat') {
    return PET_VOICE_PROFILES.cat;
  }

  return PET_VOICE_PROFILES.dog;
};

const pickVoiceForPet = (profile: PetVoiceProfile) => {
  if (!canSpeak()) {
    return null;
  }

  const voices = window.speechSynthesis.getVoices();
  const englishVoices = voices.filter((voice) => voice.lang.toLowerCase().startsWith('en'));
  const langVoices = englishVoices.filter((voice) =>
    voice.lang.toLowerCase().startsWith(profile.lang.toLowerCase().slice(0, 2)),
  );
  const candidateVoices = langVoices.length > 0 ? langVoices : englishVoices;

  return (
    candidateVoices.find((voice) =>
      profile.preferredVoices.some((preferredName) =>
        voice.name.toLowerCase().includes(preferredName.toLowerCase()),
      ),
    ) ??
    candidateVoices[0] ??
    null
  );
};

export const stopPetVoice = () => {
  if (canSpeak()) {
    window.speechSynthesis.cancel();
  }
};

export const getPetVoiceEnabled = () => getRunVoiceEnabled();

export const setPetVoiceEnabled = (enabled: boolean) => saveRunVoiceEnabled(enabled);

export const useRunVoiceCompanion = (selectedPetId?: number | PetAssetKey | null) => {
  const [voiceEnabled, setVoiceEnabledState] = useState(getRunVoiceEnabled);
  const profile = getPetVoiceProfile(selectedPetId ?? DEFAULT_PET_KEY);
  const lastVoiceAtRef = useRef<Record<string, number>>({});
  const lastMessageRef = useRef('');
  const encouragementIndexRef = useRef(0);

  useEffect(() => {
    if (!canSpeak()) {
      return;
    }

    const warmVoices = () => {
      pickVoiceForPet(profile);
    };

    window.speechSynthesis.addEventListener?.('voiceschanged', warmVoices);
    warmVoices();

    return () => {
      window.speechSynthesis.removeEventListener?.('voiceschanged', warmVoices);
      stopPetVoice();
    };
  }, [profile]);

  const setVoiceEnabled = useCallback((enabled: boolean) => {
    setVoiceEnabledState(setPetVoiceEnabled(enabled));
    if (!enabled) {
      stopPetVoice();
    }
  }, []);

  const speakAsPet = useCallback(
    (text: string, type: RunVoiceType, options: SpeakOptions = {}) => {
      if (!voiceEnabled || !canSpeak()) {
        return false;
      }

      const now = Date.now();
      const cooldownMs = options.cooldownMs ?? VOICE_TYPE_COOLDOWNS[type];
      const lastVoiceAt = lastVoiceAtRef.current[type] ?? 0;
      const normalizedText = text.trim();

      if (!normalizedText || (!options.immediate && now - lastVoiceAt < cooldownMs)) {
        return false;
      }

      if (normalizedText === lastMessageRef.current && now - lastVoiceAt < 90_000) {
        return false;
      }

      const utterance = new SpeechSynthesisUtterance(normalizedText);
      utterance.lang = profile.lang;
      utterance.rate = profile.rate;
      utterance.pitch = profile.pitch;
      utterance.volume = profile.volume;
      utterance.voice = pickVoiceForPet(profile);
      utterance.onstart = options.onStart ?? null;
      utterance.onend = options.onEnd ?? null;
      utterance.onerror = options.onEnd ?? null;

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
      lastVoiceAtRef.current[type] = now;
      lastMessageRef.current = normalizedText;
      return true;
    },
    [profile, voiceEnabled],
  );

  const speakEncouragement = useCallback(
    (options: SpeakOptions = {}) => {
      const message = profile.encouragements[encouragementIndexRef.current % profile.encouragements.length];
      encouragementIndexRef.current += 1;
      return speakAsPet(message, 'encouragement', options);
    },
    [profile.encouragements, speakAsPet],
  );

  return {
    voiceEnabled,
    setVoiceEnabled,
    speak: speakAsPet,
    speakAsPet,
    speakEncouragement,
    stopVoice: stopPetVoice,
    isSupported: canSpeak(),
    voiceProfile: profile,
  };
};
