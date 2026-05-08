import React from 'react';
import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BarChart2, TrendingUp, Zap, Heart, MapPin, Calendar } from 'lucide-react';

const data = [
  { name: 'Mon', value: 3.2 },
  { name: 'Tue', value: 4.5 },
  { name: 'Wed', value: 2.1 },
  { name: 'Thu', value: 5.8 },
  { name: 'Fri', value: 3.9 },
  { name: 'Sat', value: 8.4 },
  { name: 'Sun', value: 6.2 },
];

const Insights = () => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-surface flex flex-col items-center p-8 pb-32"
    >
      <div className="max-w-5xl w-full">
        <header className="space-y-4 mb-10">
          <div className="inline-flex items-center gap-2 bg-brand/10 text-brand-dark px-5 py-2 rounded-full border border-brand/20 shadow-sm">
            <BarChart2 size={16} fill="currentColor" />
            <span className="text-[11px] font-black uppercase tracking-[0.2em]">Vitality Insights</span>
          </div>
          <h1 className="text-4xl font-display font-bold text-text-main tracking-tight">Your Progress Journey</h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chart Section */}
          <div className="lg:col-span-2 space-y-8">
            <div className="card-rounded p-8 bg-white shadow-lg border border-brand/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 rounded-full -mr-32 -mt-32 blur-3xl" />
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 relative z-10">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-text-main">Weekly Performance Analysis</h3>
                  <p className="text-[11px] text-text-muted font-black uppercase tracking-widest">April 10 - April 16, 2024</p>
                </div>
                <div className="text-left md:text-right p-4 bg-brand/5 rounded-2xl border border-brand/10">
                  <div className="text-3xl font-display font-bold text-brand-dark">34.1<span className="text-sm ml-1 opacity-60">km</span></div>
                  <div className="text-[10px] font-black text-emerald-500 flex items-center justify-start md:justify-end gap-1 uppercase tracking-widest mt-1">
                    <TrendingUp size={12} /> +12% Growth
                  </div>
                </div>
              </div>

              <div className="h-64 w-full relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fontWeight: 800, fill: '#6B8A87' }} 
                      dy={15}
                    />
                    <Tooltip 
                      cursor={{ fill: '#7EE8E0', opacity: 0.1 }}
                      contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 40px rgba(126,232,224,0.2)', padding: '16px' }}
                    />
                    <Bar dataKey="value" radius={[12, 12, 0, 0]}>
                      {data.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={index === 5 ? '#7EE8E0' : '#E0FAF9'} 
                          className="hover:fill-brand-dark transition-colors duration-300"
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Consistency Section */}
            <div className="card-rounded p-8 bg-white/60 backdrop-blur-md border-2 border-brand/10 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-brand/10 rounded-full blur-2xl" />
              <div className="space-y-6 flex-1 relative z-10">
                <div className="space-y-2">
                  <h3 className="text-xl font-display font-bold text-text-main">Consistency Score</h3>
                  <p className="text-sm text-text-muted max-w-sm">Your rhythm is stabilizing. 5 sessions completed this week!</p>
                </div>
                <div className="flex items-center gap-3">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => {
                    const active = i < 5;
                    return (
                      <div 
                        key={i} 
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center text-[12px] font-black transition-all ${active ? 'bg-brand text-white shadow-soft scale-110' : 'bg-white text-text-muted border border-brand/20'}`}
                      >
                        {day}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="text-center md:text-right bg-white p-6 rounded-[32px] shadow-sm border border-brand/10 shrink-0 relative z-10">
                <div className="text-5xl font-display font-bold text-brand-dark">82</div>
                <div className="text-[12px] font-black text-text-muted uppercase tracking-[0.2em] mt-1">Vitality Pts</div>
              </div>
            </div>
          </div>

          {/* Side Panels - Summary Metrics */}
          <div className="space-y-6">
            <h3 className="text-sm font-black text-text-muted uppercase tracking-[0.3em] pl-2">Session Metrics</h3>
            <div className="grid grid-cols-1 gap-6">
              {[
                { icon: Zap, label: 'Average Pace', value: "5'12\"", unit: "/km", color: 'text-brand-dark', bg: 'bg-brand/10' },
                { icon: Heart, label: 'Average BPM', value: "142", unit: "bpm", color: 'text-pink-500', bg: 'bg-pink-50' },
                { icon: MapPin, label: 'Total Steps', value: "48.2k", unit: "steps", color: 'text-indigo-500', bg: 'bg-indigo-50' },
                { icon: Calendar, label: 'Active Days', value: "24", unit: "days", color: 'text-emerald-500', bg: 'bg-emerald-50' },
              ].map((metric, i) => (
                <motion.div 
                  key={i}
                  whileHover={{ x: 10 }}
                  className="card-rounded p-6 bg-white flex items-center gap-6 shadow-md border border-brand/5"
                >
                  <div className={`w-14 h-14 ${metric.bg} rounded-2xl flex items-center justify-center ${metric.color} shrink-0`}>
                    <metric.icon size={28} fill="currentColor" className="opacity-80" />
                  </div>
                  <div>
                    <div className="text-[11px] font-black text-text-muted uppercase tracking-widest leading-none mb-1">{metric.label}</div>
                    <div className="text-2xl font-display font-bold text-text-main leading-none">
                      {metric.value} <span className="text-xs font-medium opacity-60 ml-0.5">{metric.unit}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Insights;
