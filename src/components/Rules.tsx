/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ShieldAlert, Users, Ban, Swords, Info, Trophy, Shield, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { Rule } from '../types';

const iconMap = {
  Swords: <Swords className="w-8 h-8 text-indigo-400" />,
  Users: <Users className="w-8 h-8 text-emerald-400" />,
  Ban: <Ban className="w-8 h-8 text-red-400" />,
  Trophy: <Trophy className="w-8 h-8 text-amber-400" />,
  Shield: <Shield className="w-8 h-8 text-blue-400" />,
  Clock: <Clock className="w-8 h-8 text-cyan-400" />,
  Info: <Info className="w-8 h-8 text-slate-400" />
};

export default function Rules({ rules = [] }: { rules?: Rule[] }) {
  // Only display visible rules
  const visibleRules = rules.filter(rule => rule.visible);

  return (
    <div className="mb-12">
      <div className="flex items-center gap-2 mb-6">
        <ShieldAlert className="w-6 h-6 text-blue-400" />
        <h2 className="text-2xl font-display font-bold text-white">Official Tournament Rules</h2>
      </div>

      {visibleRules.length === 0 ? (
        <div className="glass-panel p-8 rounded-2xl border border-white/5 text-center">
          <Info className="w-8 h-8 text-slate-500 mx-auto mb-2 animate-pulse" />
          <p className="text-sm text-slate-400 font-sans">No rules listed at this time.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {visibleRules.map((rule) => (
            <motion.div
              key={rule.id}
              whileHover={{ scale: 1.02 }}
              id={rule.id}
              className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                    {iconMap[rule.iconName] || <Info className="w-8 h-8 text-slate-400" />}
                  </div>
                  <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${rule.badgeColor || 'bg-slate-500/10 text-slate-300 border-slate-500/20'}`}>
                    {rule.badge}
                  </span>
                </div>
                <h3 className="text-lg font-display font-bold text-white mb-2">{rule.title}</h3>
                <p className="text-sm text-slate-300 leading-relaxed font-sans">{rule.desc}</p>
              </div>
              
              <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                <Info className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                <span>Checked by tournament committee</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
