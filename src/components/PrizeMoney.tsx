/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { Trophy, Award, Coins, IndianRupee, ArrowRight, TrendingUp, Play, Pause } from 'lucide-react';
import { motion } from 'motion/react';

export default function PrizeMoney() {
  const [extraFunds, setExtraFunds] = useState<number>(5000);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(true);
  const resumeTimeoutRef = useRef<any>(null);

  const baseFirst = 11000;
  const baseSecond = 7000;

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      const elapsed = Date.now();
      const period = 10000; // 10 seconds for a full oscillation cycle
      const angle = (elapsed / period) * 2 * Math.PI;
      
      const minVal = 0;
      const maxVal = 25000;
      const midVal = (maxVal + minVal) / 2;
      const amplitude = (maxVal - minVal) / 2;
      
      const newVal = Math.round((midVal + amplitude * Math.sin(angle)) / 500) * 500;
      setExtraFunds(newVal);
    }, 80);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const handleSliderChange = (val: number) => {
    setExtraFunds(val);
    setIsAutoPlaying(false);

    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
    }
    resumeTimeoutRef.current = setTimeout(() => {
      setIsAutoPlaying(true);
    }, 10000); // Resume auto oscillation after 10 seconds of slider inactivity
  };

  useEffect(() => {
    return () => {
      if (resumeTimeoutRef.current) {
        clearTimeout(resumeTimeoutRef.current);
      }
    };
  }, []);

  const firstExtra = Math.round(extraFunds * 0.60);
  const secondExtra = Math.round(extraFunds * 0.40);

  const totalFirst = baseFirst + firstExtra;
  const totalSecond = baseSecond + secondExtra;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
      {/* Gold Card: First Place */}
      <motion.div
        whileHover={{ y: -8, scale: 1.01 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="glass-panel p-6 rounded-3xl relative overflow-hidden flex flex-col justify-between min-h-[300px] border-amber-500/30 group"
      >
        {/* Glow behind */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-amber-500/25 rounded-full blur-3xl group-hover:bg-amber-500/35 transition-all duration-500" />
        <div className="absolute top-0 right-0 p-4">
          <Trophy className="w-12 h-12 text-amber-400 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)] animate-float" />
        </div>

        <div>
          <span className="px-3 py-1 bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase rounded-full border border-amber-500/30 tracking-wider font-display">
            CHAMPIONS • ১ম পুরস্কার
          </span>
          <h3 className="text-xl font-display font-bold text-white mt-4">1st Prize (প্রথম পুরস্কার)</h3>
          <p className="text-slate-300 text-xs mt-1.5 font-sans leading-relaxed">
            বেস প্রাইজ: <span className="font-bold text-amber-300">₹১১,০০০</span> <br />
            <span className="text-amber-200/85">৬০% অতিরিক্ত টাকা</span> প্রথম পুরস্কারে যোগ করা হবে।
          </p>
        </div>

        <div className="mt-8">
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-bold text-slate-400">₹</span>
            <span className="text-5xl font-display font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 drop-shadow-sm">
              {totalFirst.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="mt-2 text-[11px] font-mono text-amber-400/80 flex flex-col gap-0.5 bg-amber-500/5 p-2 rounded-lg border border-amber-500/10">
            <span>₹{baseFirst.toLocaleString('en-IN')} Base + ₹{firstExtra.toLocaleString('en-IN')} Extra (60%)</span>
          </div>
        </div>
      </motion.div>

      {/* Silver Card: Second Place */}
      <motion.div
        whileHover={{ y: -8, scale: 1.01 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="glass-panel p-6 rounded-3xl relative overflow-hidden flex flex-col justify-between min-h-[300px] border-slate-400/30 group"
      >
        {/* Glow behind */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-slate-400/15 rounded-full blur-3xl group-hover:bg-slate-400/25 transition-all duration-500" />
        <div className="absolute top-0 right-0 p-4">
          <Trophy className="w-12 h-12 text-slate-300 drop-shadow-[0_0_15px_rgba(203,213,225,0.4)] animate-float-delayed" />
        </div>

        <div>
          <span className="px-3 py-1 bg-slate-400/20 text-slate-300 text-[10px] font-bold uppercase rounded-full border border-slate-400/30 tracking-wider font-display">
            RUNNERS-UP • ২য় পুরস্কার
          </span>
          <h3 className="text-xl font-display font-bold text-white mt-4">2nd Prize (দ্বিতীয় পুরস্কার)</h3>
          <p className="text-slate-300 text-xs mt-1.5 font-sans leading-relaxed">
            বেস প্রাইজ: <span className="font-bold text-slate-300">₹৭,০০০</span> <br />
            <span className="text-slate-300/85">৪০% অতিরিক্ত টাকা</span> দ্বিতীয় পুরস্কারে যোগ করা হবে।
          </p>
        </div>

        <div className="mt-8">
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-bold text-slate-400">₹</span>
            <span className="text-5xl font-display font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-200 via-slate-100 to-slate-400">
              {totalSecond.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="mt-2 text-[11px] font-mono text-slate-300/80 flex flex-col gap-0.5 bg-slate-300/5 p-2 rounded-lg border border-slate-300/10">
            <span>₹{baseSecond.toLocaleString('en-IN')} Base + ₹{secondExtra.toLocaleString('en-IN')} Extra (40%)</span>
          </div>
        </div>
      </motion.div>

      {/* Entry Fee & Interactive Split Modeler */}
      <div className="glass-panel p-6 rounded-3xl relative overflow-hidden flex flex-col justify-between border-blue-500/20">
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-blue-500/15 rounded-full blur-3xl" />
        
        <div>
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 bg-blue-500/20 text-blue-300 text-[10px] font-bold uppercase rounded-full border border-blue-500/30 tracking-wider font-display">
              ENTRY FEE • এন্ট্রি ফি
            </span>
            <Coins className="w-6 h-6 text-blue-400" />
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-bold text-slate-400">₹</span>
              <span className="text-3xl font-display font-extrabold text-white">1,500</span>
              <span className="text-xs text-slate-400 ml-1">প্রতিটি টিম (per team)</span>
            </div>
            
            <div className="mt-3.5 p-3 bg-blue-500/5 rounded-2xl border border-blue-500/10 text-xs text-slate-300 space-y-1">
              <p className="font-bold text-blue-300">টিম সংখ্যা বৃদ্ধি পেলে:</p>
              <p className="leading-relaxed">প্রতি অতিরিক্ত টিমে <span className="font-bold text-emerald-400">₹১,০০০</span> যোগ করা হবে।</p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-white/5">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 font-display">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              অতিরিক্ত টাকার বন্টন হিসাবকারী (PRIZE ESTIMATOR)
            </label>
            {/* Pulsing indicator/toggle button */}
            <button
              onClick={() => {
                if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
                setIsAutoPlaying(!isAutoPlaying);
              }}
              className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                isAutoPlaying 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : 'bg-white/5 text-slate-400 border border-white/10 hover:text-white'
              }`}
              title={isAutoPlaying ? "Click to Pause Auto-Simulation" : "Click to Start Auto-Simulation"}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isAutoPlaying ? 'bg-emerald-400' : 'bg-slate-400'} ${isAutoPlaying ? 'animate-pulse' : ''}`} />
              {isAutoPlaying ? 'AUTO ON' : 'PAUSED'}
            </button>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1">
                অতিরিক্ত ফান্ড (Extra Funds):
                {isAutoPlaying && (
                  <span className="text-[10px] text-emerald-500/80 animate-pulse font-sans font-semibold italic">(Auto-simulating...)</span>
                )}
              </span>
              <span className="text-emerald-400 font-bold">₹{extraFunds.toLocaleString('en-IN')}</span>
            </div>
            <input
              type="range"
              min="0"
              max="25000"
              step="500"
              value={extraFunds}
              onChange={(e) => handleSliderChange(parseInt(e.target.value))}
              id="prize-pool-slider"
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-400 transition-all focus:outline-none focus:ring-1 focus:ring-blue-500/30"
            />
            <p className="text-[10px] text-slate-500 italic font-sans leading-relaxed">
              *অটো-প্লে সক্রিয় আছে এবং প্রতি ১০ সেকেন্ড পর ড্র্যাগ না করলে পুনরায় চলতে শুরু করবে।
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
