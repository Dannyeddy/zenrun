import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Activity,
  Bell,
  Calendar,
  ChevronRight,
  Flame,
  Heart,
  LogOut,
  ShoppingBag,
  Sparkles,
  Utensils,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDemo } from '../context/DemoContext';
import { usePet } from '../context/PetContext';
import { getPetFullImage } from '../lib/petAppearance';
import { petFoodAssets } from '../lib/petWearables';
import { PetAssetKey } from '../data/assets';
import { cn } from '../lib/utils';
import {
  addNotification,
  getNotifications,
  getRunStats,
  getUnreadNotificationCount,
  getWeeklyGoal,
  markAllNotificationsRead,
  ZenrunNotification,
  USER_PROGRESS_UPDATED_EVENT,
} from '../lib/userProgressService';

interface CompanionStatusNotice {
  id: string;
  title: string;
  message: string;
  tone: 'attention' | 'calm';
}

const companionAccent: Record<PetAssetKey, string> = {
  dog: '#F4C078',
  cat: '#A8DADC',
  rabbit: '#F8C8DC',
};

const foodLabelByPet: Record<PetAssetKey, string> = {
  dog: 'a bone treat',
  cat: 'fish',
  rabbit: 'a carrot',
};

const formatNotificationTime = (createdAt: string) => {
  const deltaMs = Date.now() - new Date(createdAt).getTime();
  const deltaMinutes = Math.max(0, Math.floor(deltaMs / 60000));

  if (deltaMinutes < 1) {
    return 'Just now';
  }

  if (deltaMinutes < 60) {
    return `${deltaMinutes} min ago`;
  }

  if (deltaMinutes < 24 * 60) {
    return 'Today';
  }

  return new Date(createdAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
};

const Profile = () => {
  const navigate = useNavigate();
  const {
    companions,
    selectedCompanion,
    updateCurrentCompanion,
    userState,
    runHistory,
    treasureRewards,
    signOut,
  } = useDemo();
  const {
    foodInventory,
    petVitality,
    petAffinity,
    feedPet,
    getEquippedTreasureForPet,
  } = usePet();
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [heartBurst, setHeartBurst] = useState<number[]>([]);
  const [isFeeding, setIsFeeding] = useState(false);
  const [feedFlightKey, setFeedFlightKey] = useState<number | null>(null);
  const [statsOpen, setStatsOpen] = useState(false);
  const [weeklyGoalKm, setWeeklyGoalKm] = useState(getWeeklyGoal);
  const [notifications, setNotifications] = useState<ZenrunNotification[]>(getNotifications);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(getUnreadNotificationCount);

  const petSeed = selectedCompanion?.assetKey ?? 'dog';
  const equippedItem = getEquippedTreasureForPet(petSeed);
  const petImage = getPetFullImage(selectedCompanion, equippedItem, petSeed);
  const accent = companionAccent[petSeed];
  const foodImage = petFoodAssets[petSeed];
  const feedLabel = foodLabelByPet[petSeed];
  const totalDistance = runHistory.reduce((total, run) => total + run.distance, 0);
  const petLevel = Math.max(1, Math.floor(totalDistance / 10) + 1);
  const runStats = useMemo(() => getRunStats(runHistory, weeklyGoalKm), [runHistory, weeklyGoalKm]);

  useEffect(() => {
    const refreshProfileData = () => {
      setWeeklyGoalKm(getWeeklyGoal());
      setNotifications(getNotifications());
      setUnreadNotificationCount(getUnreadNotificationCount());
    };

    window.addEventListener(USER_PROGRESS_UPDATED_EVENT, refreshProfileData);
    return () => window.removeEventListener(USER_PROGRESS_UPDATED_EVENT, refreshProfileData);
  }, []);

  const handleFeed = () => {
    if (foodInventory <= 0 || isFeeding) {
      return;
    }

    const flightId = Date.now();
    setIsFeeding(true);
    setFeedFlightKey(flightId);

    window.setTimeout(() => {
      feedPet();
      addNotification({
        type: 'feed',
        title: 'Feeding complete',
        message: `${selectedCompanion?.name ?? 'Your companion'} enjoyed ${feedLabel}. Vitality increased.`,
        petId: String(selectedCompanion?.id ?? petSeed),
        itemId: petSeed,
        itemName: feedLabel,
      });
      setFeedFlightKey(null);
      setIsFeeding(false);
    }, 780);

    const id = Date.now();
    window.setTimeout(() => setHeartBurst((prev) => [...prev, id]), 620);
    window.setTimeout(() => setHeartBurst((prev) => prev.filter((item) => item !== id)), 1500);
  };

  const handleSignOut = () => {
    signOut();
    navigate('/login', { replace: true });
  };

  const notificationSummary =
    unreadNotificationCount > 0
      ? `${unreadNotificationCount} new companion update${unreadNotificationCount === 1 ? '' : 's'}`
      : foodInventory <= 0
        ? 'Food inventory is empty'
        : !equippedItem
          ? 'No treasure equipped yet'
          : 'Equipment and feeding updates';

  const statusNotices = useMemo<CompanionStatusNotice[]>(() => {
    const notices: CompanionStatusNotice[] = [];

    if (foodInventory <= 0) {
      notices.push({
        id: 'no-food',
        title: 'No food available',
        message: `${selectedCompanion?.name ?? 'Your companion'} has no snacks left. Complete a food route or visit Collection to find feeding options.`,
        tone: 'attention',
      });
    }

    if (!equippedItem) {
      notices.push({
        id: 'no-equipment',
        title: 'No treasure equipped',
        message: `${selectedCompanion?.name ?? 'Your companion'} is not wearing a treasure yet. Earn or equip one from Collection when available.`,
        tone: treasureRewards.length > 0 ? 'attention' : 'calm',
      });
    }

    if (!notices.length) {
      notices.push({
        id: 'all-good',
        title: 'Companion setup looks good',
        message: `${selectedCompanion?.name ?? 'Your companion'} has food status and equipment ready for the next run.`,
        tone: 'calm',
      });
    }

    return notices;
  }, [equippedItem, foodInventory, selectedCompanion?.name, treasureRewards.length]);

  const handleOpenNotifications = () => {
    setNotificationsOpen(true);
    setNotifications(getNotifications());
    setUnreadNotificationCount(getUnreadNotificationCount());
  };

  const handleMarkAllNotificationsRead = () => {
    const readNotifications = markAllNotificationsRead();
    setNotifications(readNotifications);
    setUnreadNotificationCount(0);
  };

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-[#FDFBF7] pb-28"
    >
      <div className="mx-auto min-h-screen w-full max-w-md px-5 pt-10">
        <header className="mb-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted">
              Profile
            </p>
            <h1 className="mt-1 font-display text-3xl font-bold text-text-main">
              {userState.userName || 'Traveler'}
            </h1>
          </div>
        </header>

        <section
          className="relative mb-5 overflow-hidden rounded-[36px] p-6 text-center shadow-[0_20px_55px_rgba(45,74,72,0.12)]"
          style={{
            background: `linear-gradient(160deg, ${accent}55, ${accent}18 72%, #FFFFFF 100%)`,
          }}
        >
          <motion.div
            animate={isFeeding ? { y: [0, -6, 0], scale: [1, 1.04, 1] } : { y: 0, scale: 1 }}
            transition={{ duration: 0.65, ease: 'easeOut' }}
            className="relative mx-auto mb-4 h-44 w-44 rounded-full bg-white p-3 shadow-2xl"
          >
            <img
              src={petImage}
              alt={selectedCompanion?.name ?? 'Companion'}
              className="h-full w-full rounded-full object-cover"
            />
            <span className="absolute right-1 top-2 rounded-full bg-text-main px-3 py-1 text-[11px] font-black text-white">
              Lv {petLevel}
            </span>
            <AnimatePresence>
              {heartBurst.map((id) => (
                <motion.span
                  key={id}
                  initial={{ opacity: 1, y: 0, scale: 0.6 }}
                  animate={{ opacity: 0, y: -95, scale: 1.35 }}
                  exit={{ opacity: 0 }}
                  className="absolute left-1/2 top-10 -translate-x-1/2 text-[#F8C8DC]"
                >
                  <Heart fill="currentColor" size={28} />
                </motion.span>
              ))}
            </AnimatePresence>
            <AnimatePresence>
              {feedFlightKey && (
                <motion.img
                  key={feedFlightKey}
                  src={foodImage}
                  alt=""
                  initial={{ opacity: 1, x: 82, y: 98, scale: 0.62, rotate: -12 }}
                  animate={{ opacity: 0, x: 12, y: -12, scale: 0.18, rotate: 18 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.78, ease: [0.22, 1, 0.36, 1] }}
                  className="pointer-events-none absolute left-1/2 top-1/2 z-30 h-14 w-14 object-contain drop-shadow-lg"
                />
              )}
            </AnimatePresence>
            <AnimatePresence>
              {isFeeding && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.4, rotate: -18 }}
                  animate={{ opacity: [0, 1, 0], scale: [0.4, 1, 1.2], rotate: 8 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.9 }}
                  className="absolute right-8 top-8 text-amber-300"
                >
                  <Sparkles size={22} />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>

          <h2 className="font-display text-2xl font-bold text-text-main">
            {selectedCompanion?.name ?? 'Aqua Pup'}
          </h2>
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-text-muted">
            {selectedCompanion?.type ?? 'Energetic'} companion
          </p>

          <button
            type="button"
            onClick={() => setStatsOpen(true)}
            className="mb-5 w-full rounded-[28px] bg-white/78 p-3 text-left shadow-soft transition-transform active:scale-[0.99]"
          >
            <div className="mb-3 flex items-center justify-between px-1">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.22em] text-text-muted">
                  Weekly Activity
                </p>
                <p className="font-display text-lg font-bold text-text-main">Running Summary</p>
              </div>
              <ChevronRight size={18} className="text-text-muted" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <ProfileMetric icon={<Activity size={15} />} label="Runs" value={String(runHistory.length)} />
              <ProfileMetric icon={<Flame size={15} />} label="Vitality" value={`${petVitality}%`} />
              <ProfileMetric icon={<Heart size={15} />} label="Affinity" value={`${petAffinity}`} />
            </div>
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleFeed}
              disabled={foodInventory <= 0 || isFeeding}
              className="rounded-2xl bg-white px-4 py-3 text-[10px] font-black uppercase tracking-widest text-text-main shadow-soft disabled:opacity-45"
            >
              <span className="flex items-center justify-center gap-2">
                <Utensils size={15} /> Feed ({foodInventory})
              </span>
            </button>
            <button
              onClick={() => setSelectorOpen((prev) => !prev)}
              className="rounded-2xl bg-text-main px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-soft"
            >
              Switch
            </button>
          </div>
        </section>

        <AnimatePresence>
          {selectorOpen && (
            <motion.section
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-5 overflow-hidden rounded-[30px] bg-white p-4 shadow-soft"
            >
              <div className="grid grid-cols-3 gap-3">
                {companions.map((companion) => (
                  <button
                    key={companion.id}
                    onClick={() => {
                      updateCurrentCompanion(companion.id);
                      setSelectorOpen(false);
                    }}
                    className={cn(
                      'rounded-3xl border p-3 text-center transition-all',
                      selectedCompanion?.id === companion.id
                        ? 'border-text-main/20 bg-[#FDFBF7]'
                        : 'border-transparent bg-surface/50',
                    )}
                  >
                    <img
                      src={companion.headImage}
                      alt={companion.name}
                      className="mx-auto mb-2 h-14 w-14 rounded-2xl object-cover"
                    />
                    <p className="text-xs font-black text-text-main">{companion.name}</p>
                  </button>
                ))}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        <section className="mb-5 rounded-[32px] bg-white p-5 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-text-muted">
                Weekly Collection
              </p>
              <h3 className="font-display text-xl font-bold text-text-main">Treasure & Food</h3>
            </div>
            <button
              onClick={() => navigate('/collection')}
              className="flex items-center gap-1 rounded-full bg-text-main px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white"
            >
              View <ChevronRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <CollectionStat
              icon={<ShoppingBag size={18} />}
              label="Treasures"
              value={String(treasureRewards.length)}
              detail={equippedItem ? `Equipped: ${equippedItem.title}` : 'No accessory equipped'}
            />
            <CollectionStat
              icon={<Utensils size={18} />}
              label="Food"
              value={String(foodInventory)}
              detail="Available for feeding"
            />
          </div>
        </section>

        <section className="mb-5 rounded-[32px] bg-white p-5 shadow-soft">
          <p className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-text-muted">
            Preferences
          </p>
          <button
            onClick={handleOpenNotifications}
            className="mb-3 flex w-full items-center justify-between rounded-3xl bg-[#FDFBF7] p-4 text-left"
          >
            <span className="flex items-center gap-3">
              <span className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/20 text-text-main">
                <Bell size={18} />
                {unreadNotificationCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-[#FDFBF7] bg-rose-500" />
                )}
              </span>
              <span>
                <span className="block text-sm font-black text-text-main">Notifications</span>
                <span className="block text-xs font-medium text-text-muted">{notificationSummary}</span>
              </span>
            </span>
            <ChevronRight className="text-text-muted" size={18} />
          </button>

          <button
            onClick={handleSignOut}
            className="flex w-full items-center justify-between rounded-3xl bg-rose-50 p-4 text-left text-rose-500"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-soft">
                <LogOut size={18} />
              </span>
              <span>
                <span className="block text-sm font-black">Sign Out</span>
                <span className="block text-xs font-medium opacity-70">Clear session and return to login</span>
              </span>
            </span>
            <ChevronRight size={18} />
          </button>
        </section>
      </div>

      <NotificationsSheet
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        notifications={notifications}
        statusNotices={statusNotices}
        unreadCount={unreadNotificationCount}
        onMarkAllRead={handleMarkAllNotificationsRead}
      />
      <RunStatsSheet
        open={statsOpen}
        onClose={() => setStatsOpen(false)}
        stats={runStats}
        runCount={runHistory.length}
        petVitality={petVitality}
        petAffinity={petAffinity}
      />
    </motion.main>
  );
};

const ProfileMetric = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <div className="rounded-2xl bg-white/75 p-3 text-center shadow-soft">
    <div className="mb-1 flex justify-center text-text-main/65">{icon}</div>
    <p className="font-display text-lg font-bold text-text-main">{value}</p>
    <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">{label}</p>
  </div>
);

const CollectionStat = ({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}) => (
  <div className="rounded-3xl bg-[#FDFBF7] p-4">
    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-text-main shadow-soft">
      {icon}
    </div>
    <p className="font-display text-2xl font-bold text-text-main">{value}</p>
    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">{label}</p>
    <p className="mt-2 line-clamp-2 text-xs font-medium text-text-muted">{detail}</p>
  </div>
);

const NotificationsSheet = ({
  open,
  onClose,
  notifications,
  statusNotices,
  unreadCount,
  onMarkAllRead,
}: {
  open: boolean;
  onClose: () => void;
  notifications: ZenrunNotification[];
  statusNotices: CompanionStatusNotice[];
  unreadCount: number;
  onMarkAllRead: () => void;
}) => (
  <AnimatePresence>
    {open && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[80] flex items-end justify-center bg-text-main/45 backdrop-blur-sm"
      >
        <motion.div
          initial={{ y: 280 }}
          animate={{ y: 0 }}
          exit={{ y: 280 }}
          onClick={(event) => event.stopPropagation()}
          className="max-h-[82vh] w-full max-w-md overflow-y-auto rounded-t-[32px] bg-[#FDFBF7] p-5 shadow-2xl"
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                Preferences
              </p>
              <h2 className="font-display text-2xl font-bold text-text-main">Notifications</h2>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllRead}
                  className="rounded-full bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-text-main shadow-soft"
                >
                  Mark read
                </button>
              )}
              <button onClick={onClose} className="h-9 w-9 rounded-full bg-white shadow-soft">
                <X className="mx-auto" size={17} />
              </button>
            </div>
          </div>
          <div className="mb-4 space-y-3">
            {statusNotices.map((notice) => (
              <div
                key={notice.id}
                className={cn(
                  'rounded-3xl border p-4 shadow-soft',
                  notice.tone === 'attention'
                    ? 'border-rose-100 bg-rose-50'
                    : 'border-white/80 bg-white',
                )}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      'mt-1 h-2.5 w-2.5 shrink-0 rounded-full',
                      notice.tone === 'attention' ? 'bg-rose-500' : 'bg-brand',
                    )}
                  />
                  <div>
                    <p className="text-sm font-black text-text-main">{notice.title}</p>
                    <p className="mt-1 text-xs font-medium leading-relaxed text-text-muted">
                      {notice.message}
                    </p>
                    <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-text-muted">
                      Live status
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {notifications.length === 0 ? (
            <div className="rounded-3xl bg-white p-5">
              <Sparkles className="mb-3 text-brand-dark" size={22} />
              <p className="text-sm font-black text-text-main">No notifications yet.</p>
              <p className="mt-2 text-sm font-medium leading-relaxed text-text-muted">
                Equip treasures or feed your companion to see updates here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.slice(0, 20).map((notification) => (
                <div
                  key={notification.id}
                  className="relative rounded-3xl border border-white/80 bg-white p-4 pr-20 shadow-soft"
                >
                  <span
                    className={cn(
                      'absolute right-4 top-4 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-widest',
                      notification.read
                        ? 'bg-[#F1EFE7] text-text-muted'
                        : 'bg-rose-500 text-white',
                    )}
                  >
                    {notification.read ? 'Read' : 'Unread'}
                  </span>
                  <div className="flex items-start gap-3">
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                        notification.type === 'equip'
                          ? 'bg-brand/20 text-text-main'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {notification.type === 'equip' ? (
                        <ShoppingBag size={18} />
                      ) : (
                        <Utensils size={18} />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-black text-text-main">{notification.title}</p>
                        </div>
                        {!notification.read && (
                          <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-rose-500" />
                        )}
                      </div>
                      <p className="mt-1 text-xs font-medium leading-relaxed text-text-muted">
                        {notification.message}
                      </p>
                      <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-text-muted">
                        {formatNotificationTime(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const RunStatsSheet = ({
  open,
  onClose,
  stats,
  runCount,
  petVitality,
  petAffinity,
}: {
  open: boolean;
  onClose: () => void;
  stats: ReturnType<typeof getRunStats>;
  runCount: number;
  petVitality: number;
  petAffinity: number;
}) => {
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const calendarDays = Array.from({ length: daysInMonth }, (_, index) => index + 1);
  const maxBar = Math.max(1, ...stats.weekdayDistances);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[80] flex items-end justify-center bg-text-main/45 backdrop-blur-sm"
        >
          <motion.div
            initial={{ y: 420 }}
            animate={{ y: 0 }}
            exit={{ y: 420 }}
            onClick={(event) => event.stopPropagation()}
            className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-[34px] bg-[#FDFBF7] p-5 shadow-2xl"
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.26em] text-text-muted">
                  Training records
                </p>
                <h2 className="mt-1 font-display text-3xl font-bold text-text-main">Run Stats</h2>
              </div>
              <button onClick={onClose} className="h-11 w-11 rounded-full bg-white text-text-main shadow-soft">
                <X className="mx-auto" size={18} />
              </button>
            </div>

            <section className="mb-4 rounded-[30px] bg-white p-4 shadow-soft">
              <div className="mb-4 flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/20 text-text-main">
                  <Calendar size={18} />
                </span>
                <p className="font-display text-2xl font-bold text-text-main">{stats.monthlyCheckInCount}</p>
              </div>
              <p className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-text-muted">
                This month check-ins
              </p>
              <div className="grid grid-cols-7 gap-1.5">
                {calendarDays.map((day) => {
                  const active = stats.activeMonthDays.has(day);
                  return (
                    <span
                      key={day}
                      className={cn(
                        'flex aspect-square items-center justify-center rounded-full text-[10px] font-black',
                        active ? 'bg-brand text-white shadow-soft' : 'bg-[#FDFBF7] text-text-muted/45',
                      )}
                    >
                      {day}
                    </span>
                  );
                })}
              </div>
            </section>

            <section className="mb-4 rounded-[30px] bg-white p-4 shadow-soft">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-text-muted">
                    Goal progress
                  </p>
                  <p className="mt-1 font-display text-3xl font-bold text-text-main">
                    {stats.goalProgress}%
                  </p>
                </div>
                <div className="text-right text-xs font-bold text-text-muted">
                  <p>{stats.weeklyDistance.toFixed(1)} km done</p>
                  <p>{stats.weeklyGoalKm} km / week</p>
                  <p>{stats.weeklyRunCount} runs</p>
                </div>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-[#F1EFE7]">
                <div
                  className="h-full rounded-full bg-brand"
                  style={{ width: `${stats.goalProgress}%` }}
                />
              </div>
            </section>

            <section className="mb-4 grid grid-cols-2 gap-3">
              <SummaryTile label="Total" value={`${stats.totalDistance.toFixed(1)} km`} />
              <SummaryTile label="This week" value={`${stats.weeklyDistance.toFixed(1)} km`} />
              <SummaryTile label="This month" value={`${stats.monthlyDistance.toFixed(1)} km`} />
              <SummaryTile label="This year" value={`${stats.yearlyDistance.toFixed(1)} km`} />
            </section>

            <section className="rounded-[30px] bg-white p-4 shadow-soft">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-text-muted">
                    Weekly trend
                  </p>
                  <p className="font-display text-xl font-bold text-text-main">Running rhythm</p>
                </div>
                <div className="text-right text-[10px] font-black uppercase tracking-widest text-text-muted">
                  <p>{runCount} runs</p>
                  <p>V {petVitality}% / A {petAffinity}</p>
                </div>
              </div>
              <div className="flex h-28 items-end gap-2">
                {stats.weekdayDistances.map((distance, index) => (
                  <div key={index} className="flex flex-1 flex-col items-center gap-2">
                    <div className="flex h-20 w-full items-end rounded-full bg-[#FDFBF7] px-1">
                      <div
                        className="w-full rounded-full bg-text-main/80"
                        style={{ height: `${Math.max(8, (distance / maxBar) * 100)}%` }}
                      />
                    </div>
                    <span className="text-[9px] font-black uppercase text-text-muted">
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const SummaryTile = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-3xl bg-white p-4 shadow-soft">
    <p className="font-display text-xl font-bold text-text-main">{value}</p>
    <p className="mt-1 text-[9px] font-black uppercase tracking-widest text-text-muted">{label}</p>
  </div>
);

export default Profile;
