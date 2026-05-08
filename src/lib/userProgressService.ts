import { RunHistoryItem } from '../context/DemoContext';

const WEEKLY_GOAL_KEY = 'weeklyGoalKm';
const RUN_VOICE_ENABLED_KEY = 'runVoiceEnabled';
const PET_COMPANION_SETTINGS_KEY = 'petCompanionSettings';
const NOTIFICATIONS_KEY = 'zenrun.notifications';
const DEFAULT_WEEKLY_GOAL_KM = 20;
export const USER_PROGRESS_UPDATED_EVENT = 'zenrun-progress-updated';

export type RunMood = 'happy' | 'calm' | 'sad' | 'none';
export type ZenrunNotificationType = 'equip' | 'feed';

export interface ZenrunNotification {
  id: string;
  type: ZenrunNotificationType;
  title: string;
  message: string;
  petId?: string;
  itemId?: string;
  itemName?: string;
  createdAt: string;
  read: boolean;
}

export interface PetCompanionSettings {
  voiceEnabled: boolean;
  musicEnabled: boolean;
  preferredMood: RunMood;
  selectedVoicePetId?: number;
}

const DEFAULT_PET_COMPANION_SETTINGS: PetCompanionSettings = {
  voiceEnabled: true,
  musicEnabled: true,
  preferredMood: 'calm',
};

const canUseStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const notifyProgressUpdated = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(USER_PROGRESS_UPDATED_EVENT));
  }
};

const sortNotifications = (notifications: ZenrunNotification[]) =>
  [...notifications].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );

export const getWeeklyGoal = () => {
  if (!canUseStorage()) {
    return DEFAULT_WEEKLY_GOAL_KM;
  }

  const stored = Number(window.localStorage.getItem(WEEKLY_GOAL_KEY));
  return Number.isFinite(stored) && stored >= 1 ? stored : DEFAULT_WEEKLY_GOAL_KM;
};

export const saveWeeklyGoal = (goalKm: number) => {
  const normalizedGoal = Math.max(1, Math.round(goalKm));
  if (canUseStorage()) {
    window.localStorage.setItem(WEEKLY_GOAL_KEY, String(normalizedGoal));
  }
  notifyProgressUpdated();
  return normalizedGoal;
};

export const getPetCompanionSettings = (): PetCompanionSettings => {
  if (!canUseStorage()) {
    return DEFAULT_PET_COMPANION_SETTINGS;
  }

  try {
    const stored = window.localStorage.getItem(PET_COMPANION_SETTINGS_KEY);
    const parsed = stored ? (JSON.parse(stored) as Partial<PetCompanionSettings>) : {};
    const legacyVoiceEnabled = window.localStorage.getItem(RUN_VOICE_ENABLED_KEY) !== 'false';
    const preferredMood: RunMood =
      parsed.preferredMood === 'happy' ||
      parsed.preferredMood === 'sad' ||
      parsed.preferredMood === 'none' ||
      parsed.preferredMood === 'calm'
        ? parsed.preferredMood
        : DEFAULT_PET_COMPANION_SETTINGS.preferredMood;

    return {
      voiceEnabled:
        typeof parsed.voiceEnabled === 'boolean' ? parsed.voiceEnabled : legacyVoiceEnabled,
      musicEnabled:
        typeof parsed.musicEnabled === 'boolean'
          ? parsed.musicEnabled
          : DEFAULT_PET_COMPANION_SETTINGS.musicEnabled,
      preferredMood,
      selectedVoicePetId:
        typeof parsed.selectedVoicePetId === 'number' ? parsed.selectedVoicePetId : undefined,
    };
  } catch {
    return DEFAULT_PET_COMPANION_SETTINGS;
  }
};

export const savePetCompanionSettings = (settings: Partial<PetCompanionSettings>) => {
  const nextSettings = {
    ...getPetCompanionSettings(),
    ...settings,
  };

  if (canUseStorage()) {
    window.localStorage.setItem(PET_COMPANION_SETTINGS_KEY, JSON.stringify(nextSettings));
    window.localStorage.setItem(RUN_VOICE_ENABLED_KEY, String(nextSettings.voiceEnabled));
  }

  notifyProgressUpdated();
  return nextSettings;
};

export const getRunVoiceEnabled = () => {
  return getPetCompanionSettings().voiceEnabled;
};

export const saveRunVoiceEnabled = (enabled: boolean) => {
  return savePetCompanionSettings({ voiceEnabled: enabled }).voiceEnabled;
};

export const getRunMusicEnabled = () => getPetCompanionSettings().musicEnabled;

export const saveRunMusicEnabled = (enabled: boolean) =>
  savePetCompanionSettings({ musicEnabled: enabled }).musicEnabled;

export const getPreferredRunMood = () => getPetCompanionSettings().preferredMood;

export const savePreferredRunMood = (preferredMood: RunMood) =>
  savePetCompanionSettings({ preferredMood }).preferredMood;

export const getNotifications = () => {
  if (!canUseStorage()) {
    return [] as ZenrunNotification[];
  }

  try {
    const stored = window.localStorage.getItem(NOTIFICATIONS_KEY);
    const parsed = stored ? (JSON.parse(stored) as ZenrunNotification[]) : [];
    return sortNotifications(
      parsed.filter(
        (notification) =>
          typeof notification?.id === 'string' &&
          (notification?.type === 'equip' || notification?.type === 'feed') &&
          typeof notification?.title === 'string' &&
          typeof notification?.message === 'string' &&
          typeof notification?.createdAt === 'string',
      ),
    ).slice(0, 20);
  } catch {
    return [];
  }
};

const saveNotifications = (notifications: ZenrunNotification[]) => {
  const nextNotifications = sortNotifications(notifications).slice(0, 20);
  if (canUseStorage()) {
    window.localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(nextNotifications));
  }
  notifyProgressUpdated();
  return nextNotifications;
};

export const addNotification = (
  notification: Omit<ZenrunNotification, 'id' | 'createdAt' | 'read'>,
) => {
  const nextNotification: ZenrunNotification = {
    ...notification,
    id: `notification-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    read: false,
  };

  const notifications = getNotifications();
  return saveNotifications([nextNotification, ...notifications]);
};

export const markAllNotificationsRead = () => {
  const notifications = getNotifications();
  if (!notifications.some((notification) => !notification.read)) {
    return notifications;
  }

  return saveNotifications(
    notifications.map((notification) => ({
      ...notification,
      read: true,
    })),
  );
};

export const getUnreadNotificationCount = () =>
  getNotifications().filter((notification) => !notification.read).length;

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const startOfWeek = (date: Date) => {
  const day = date.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const weekStart = startOfDay(date);
  weekStart.setDate(weekStart.getDate() + mondayOffset);
  return weekStart;
};

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
const startOfYear = (date: Date) => new Date(date.getFullYear(), 0, 1);
const isValidDate = (date: Date) => Number.isFinite(date.getTime());

const sumDistanceSince = (runs: RunHistoryItem[], start: Date) =>
  runs.reduce((total, run) => {
    const completedAt = new Date(run.completedAt);
    return completedAt >= start ? total + run.distance : total;
  }, 0);

const countSince = (runs: RunHistoryItem[], start: Date) =>
  runs.filter((run) => new Date(run.completedAt) >= start).length;

export const getWeeklyDistance = (runs: RunHistoryItem[], now = new Date()) =>
  sumDistanceSince(runs, startOfWeek(now));

export const getGoalProgress = (weeklyDistanceKm: number, weeklyGoalKm = getWeeklyGoal()) =>
  weeklyGoalKm > 0 ? Math.min(100, Math.round((weeklyDistanceKm / weeklyGoalKm) * 100)) : 0;

export const getRunStats = (runs: RunHistoryItem[], weeklyGoalKm = getWeeklyGoal(), now = new Date()) => {
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const yearStart = startOfYear(now);
  const weeklyDistance = sumDistanceSince(runs, weekStart);
  const monthlyDistance = sumDistanceSince(runs, monthStart);
  const yearlyDistance = sumDistanceSince(runs, yearStart);
  const totalDistance = runs.reduce((total, run) => total + run.distance, 0);
  const monthlyRunCount = countSince(runs, monthStart);
  const weeklyRunCount = countSince(runs, weekStart);
  const goalProgress = getGoalProgress(weeklyDistance, weeklyGoalKm);

  const activeMonthDays = new Set<number>(
    runs
      .map((run) => new Date(run.completedAt))
      .filter(
        (completedAt) =>
          isValidDate(completedAt) &&
          completedAt >= monthStart &&
          completedAt < nextMonthStart,
      )
      .map((completedAt) => completedAt.getDate()),
  );
  const monthlyCheckInCount = activeMonthDays.size;

  const weekdayDistances = Array.from({ length: 7 }, (_, index) => {
    const dayStart = new Date(weekStart);
    dayStart.setDate(weekStart.getDate() + index);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayStart.getDate() + 1);
    return runs.reduce((total, run) => {
      const completedAt = new Date(run.completedAt);
      return completedAt >= dayStart && completedAt < dayEnd ? total + run.distance : total;
    }, 0);
  });

  return {
    weeklyGoalKm,
    weeklyDistance,
    monthlyDistance,
    yearlyDistance,
    totalDistance,
    monthlyRunCount,
    monthlyCheckInCount,
    weeklyRunCount,
    goalProgress,
    activeMonthDays,
    weekdayDistances,
  };
};
