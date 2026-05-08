import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Medal, ChevronUp, MapPin, Heart, Zap } from 'lucide-react';
import { petAssets } from '../data/assets';

const Rankings = () => {
  const topUsers = [
    { id: 1, name: 'Luna', rank: 1, distance: '124.5', pet: 'Aqua Pup', img: petAssets.dog.head },
    { id: 2, name: 'Kai', rank: 2, distance: '118.2', pet: 'Zen Rabbit', img: petAssets.rabbit.head },
    { id: 3, name: 'Mina', rank: 3, distance: '105.8', pet: 'Mint Cat', img: petAssets.cat.head },
  ];

  const others = [
    { id: 4, name: 'Hiro', rank: 4, distance: '98.4', trend: 'up' },
    { id: 5, name: 'Sora', rank: 5, distance: '92.1', trend: 'down' },
    { id: 6, name: 'Yuki', rank: 6, distance: '88.7', trend: 'up' },
    { id: 7, name: 'Ren', rank: 7, distance: '85.3', trend: 'up' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-surface flex flex-col items-center p-8 pb-32"
    >
      <div className="max-w-5xl w-full">
        <header className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 bg-brand/10 text-brand-dark px-5 py-2 rounded-full border border-brand/20 shadow-sm">
            <Trophy size={16} fill="currentColor" />
            <span className="text-[11px] font-black uppercase tracking-[0.2em]">Global Rankings</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-text-main tracking-tight">Zen Masters Leaderboard</h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left Column: Podium */}
          <div className="space-y-12 order-2 lg:order-1">
            <h3 className="text-sm font-black text-text-muted uppercase tracking-[0.3em] pl-2">Podium Finishers</h3>
            <div className="flex justify-center items-end gap-6 h-[320px]">
              {/* Rank 2 */}
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="relative group">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-white shadow-xl overflow-hidden group-hover:scale-105 transition-transform">
                    <img src={topUsers[1].img} alt={topUsers[1].name} />
                  </div>
                  <div className="absolute -bottom-2 -right-1 w-8 h-8 md:w-10 md:h-10 bg-slate-400 rounded-full flex items-center justify-center text-white text-sm font-bold border-4 border-white shadow-md">2</div>
                </div>
                <div className="text-center bg-white p-4 rounded-3xl shadow-sm border border-brand/5 w-full">
                  <div className="text-base font-bold text-text-main">{topUsers[1].name}</div>
                  <div className="text-[10px] font-black text-brand-dark uppercase tracking-widest mt-1">{topUsers[1].distance}km</div>
                </div>
              </motion.div>

              {/* Rank 1 */}
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex flex-col items-center gap-5"
              >
                <div className="relative group">
                  <motion.div 
                    animate={{ y: [0, -12, 0], scale: [1, 1.1, 1] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="absolute -top-12 left-1/2 -translate-x-1/2 text-yellow-500 z-10"
                  >
                    <Medal size={48} fill="currentColor" className="drop-shadow-lg" />
                  </motion.div>
                  <div className="w-28 h-28 md:w-36 md:h-36 rounded-full border-8 border-brand shadow-[0_20px_50px_rgba(126,232,224,0.4)] overflow-hidden p-1 bg-white group-hover:scale-105 transition-transform">
                    <img src={topUsers[0].img} alt={topUsers[0].name} className="rounded-full" />
                  </div>
                  <div className="absolute -bottom-2 -right-1 w-12 h-12 md:w-14 md:h-14 bg-yellow-500 rounded-full flex items-center justify-center text-white text-xl font-bold border-4 border-white shadow-lg">1</div>
                </div>
                <div className="text-center bg-brand text-white p-5 rounded-[32px] shadow-lg w-full scale-110">
                  <div className="text-lg font-bold">{topUsers[0].name}</div>
                  <div className="text-[11px] font-black uppercase tracking-widest opacity-80 mt-1">{topUsers[0].distance}km</div>
                </div>
              </motion.div>

              {/* Rank 3 */}
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="relative group">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-white shadow-xl overflow-hidden group-hover:scale-105 transition-transform">
                    <img src={topUsers[2].img} alt={topUsers[2].name} />
                  </div>
                  <div className="absolute -bottom-2 -right-1 w-8 h-8 md:w-10 md:h-10 bg-amber-700 rounded-full flex items-center justify-center text-white text-sm font-bold border-4 border-white shadow-md">3</div>
                </div>
                <div className="text-center bg-white p-4 rounded-3xl shadow-sm border border-brand/5 w-full">
                  <div className="text-base font-bold text-text-main">{topUsers[2].name}</div>
                  <div className="text-[10px] font-black text-brand-dark uppercase tracking-widest mt-1">{topUsers[2].distance}km</div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Right Column: Leaderboard List */}
          <div className="space-y-6 order-1 lg:order-2">
            <h3 className="text-sm font-black text-text-muted uppercase tracking-[0.3em] pl-2">Top Performers</h3>
            <div className="space-y-4">
              {others.map((user, i) => (
                <motion.div 
                  key={user.id}
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ x: 10 }}
                  className="card-rounded p-5 flex items-center gap-6 bg-white shadow-md hover:shadow-xl transition-all duration-300 border border-brand/5"
                >
                  <div className="w-12 text-center font-display font-black text-xl text-text-muted tracking-tighter">{user.rank}</div>
                  <div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center text-brand-dark font-black text-lg shadow-inner">
                    {user.name[0]}
                  </div>
                  <div className="flex-1">
                    <div className="text-lg font-bold text-text-main leading-none">{user.name}</div>
                    <div className="text-[10px] font-black text-text-muted uppercase tracking-widest mt-2">Level 4 zenrun runner</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-display font-bold text-text-main">{user.distance}km</div>
                    <div className={`flex items-center justify-end gap-1.5 text-[11px] font-black uppercase tracking-widest mt-1.5 ${user.trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {user.trend === 'up' ? <ChevronUp size={12} strokeWidth={3} /> : <ChevronUp size={12} strokeWidth={3} className="rotate-180" />}
                      {user.trend === 'up' ? '+2.4' : '-1.1'}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Your Rank Box */}
            <div className="mt-12 card-rounded p-8 bg-brand text-white flex items-center gap-8 shadow-2xl shadow-brand/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
              <div className="w-16 h-16 rounded-3xl bg-white/20 flex items-center justify-center font-black text-2xl shadow-inner relative z-10">24</div>
              <div className="flex-1 relative z-10">
                <div className="text-[11px] font-black uppercase tracking-[0.2em] opacity-80">Your Personal Standing</div>
                <div className="text-2xl font-display font-bold">Wellness Master</div>
              </div>
              <div className="text-right relative z-10">
                <div className="text-3xl font-display font-bold">42.8km</div>
                <div className="text-[11px] font-black uppercase tracking-widest opacity-80">Top 15%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Rankings;
