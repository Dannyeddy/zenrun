import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Home } from 'lucide-react';
import { DEFAULT_SHARE_IMAGE, getShareCardBackground } from '../lib/shareCardAssets';

const readParam = (params: URLSearchParams, key: string, fallback = '') => {
  const value = params.get(key);
  return value && value.trim() ? value : fallback;
};

const formatDate = (value: string) => {
  const date = value ? new Date(value) : new Date();
  if (!Number.isFinite(date.getTime())) {
    return 'ZenRun finish';
  }

  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const ShareResult = () => {
  const [params] = useSearchParams();
  const shareData = useMemo(() => {
    const routeId = readParam(params, 'routeId');
    const routeTitle = readParam(params, 'routeTitle', 'ZenRun Route');
    const routeType = readParam(params, 'routeType', 'Historical');
    const image =
      readParam(params, 'image') ||
      getShareCardBackground(routeTitle, routeType, routeId) ||
      DEFAULT_SHARE_IMAGE;

    return {
      routeId,
      routeTitle,
      routeType,
      distance: readParam(params, 'distance', '0.00'),
      time: readParam(params, 'time', '--:--'),
      pace: readParam(params, 'pace', '--'),
      date: formatDate(readParam(params, 'date')),
      image,
      reward: readParam(params, 'reward'),
      fragments: readParam(params, 'fragments'),
    };
  }, [params]);

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-[#FDFBF7] px-5 py-10"
    >
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md flex-col">
        <header className="mb-5">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted">
            Shared run
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold text-text-main">ZenRun Result</h1>
        </header>

        <section className="relative overflow-hidden rounded-[34px] bg-white p-3 shadow-2xl">
          <div className="relative min-h-[520px] overflow-hidden rounded-[30px] bg-text-main">
            <img
              src={shareData.image}
              alt={shareData.routeTitle}
              className="absolute inset-0 h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-text-main/10 via-text-main/10 to-text-main/82" />
            <div className="absolute left-5 top-5 rounded-full bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-text-main">
              zenrun share
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/18 backdrop-blur-md">
                <CheckCircle2 size={27} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/70">
                {shareData.date}
              </p>
              <h2 className="mt-2 font-display text-3xl font-bold leading-tight">
                {shareData.routeTitle}
              </h2>
              <div className="mt-5 grid grid-cols-3 gap-2">
                <ShareMetric label="Distance" value={`${shareData.distance} km`} />
                <ShareMetric label="Time" value={shareData.time} />
                <ShareMetric label="Pace" value={shareData.pace} />
              </div>
              {(shareData.reward || shareData.fragments) && (
                <div className="mt-3 rounded-2xl bg-white/16 px-3 py-2 text-xs font-bold text-white backdrop-blur-md">
                  {shareData.reward || 'Memory progress'} {shareData.fragments ? `| ${shareData.fragments}` : ''}
                </div>
              )}
            </div>
          </div>
        </section>

        <Link
          to="/"
          className="mt-5 flex items-center justify-center gap-2 rounded-3xl bg-text-main px-5 py-4 text-sm font-black uppercase tracking-widest text-white shadow-soft"
        >
          <Home size={16} />
          Open ZenRun
        </Link>
      </div>
    </motion.main>
  );
};

const ShareMetric = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl bg-white/16 px-2 py-2 text-center shadow-soft backdrop-blur-md">
    <p className="text-[8px] font-black uppercase tracking-widest text-white/62">{label}</p>
    <p className="mt-1 truncate text-[13px] font-black text-white">{value}</p>
  </div>
);

export default ShareResult;
