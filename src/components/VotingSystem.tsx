/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Poll, AppUser } from '../types';
import { BarChart3, Vote, Heart, Sparkles, CheckCircle2, UserCheck } from 'lucide-react';
import { motion } from 'motion/react';

interface VotingSystemProps {
  polls: Poll[];
  onVote: (pollId: string) => void;
  currentUser: AppUser | null;
  onOpenAuthModal: () => void;
}

export default function VotingSystem({ polls, onVote, currentUser, onOpenAuthModal }: VotingSystemProps) {
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedPollId, setSelectedPollId] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      const votedState = localStorage.getItem(`apl_voted_${currentUser.mobileNumber}`);
      if (votedState) {
        setHasVoted(true);
        setSelectedPollId(votedState);
      } else {
        setHasVoted(false);
        setSelectedPollId(null);
      }
    } else {
      const votedState = localStorage.getItem('apl_2026_voted');
      if (votedState) {
        setHasVoted(true);
        setSelectedPollId(votedState);
      } else {
        setHasVoted(false);
        setSelectedPollId(null);
      }
    }
  }, [currentUser]);

  const totalVotes = polls.reduce((acc, curr) => acc + curr.votes, 0);

  const handleVoteSubmit = (pollId: string) => {
    if (!currentUser) {
      onOpenAuthModal();
      return;
    }
    if (hasVoted) return;
    onVote(pollId);
    setSelectedPollId(pollId);
    setHasVoted(true);
    localStorage.setItem(`apl_voted_${currentUser.mobileNumber}`, pollId);
    localStorage.setItem('apl_2026_voted', pollId);
  };

  // Find the current leading team to highlight
  const maxVotes = Math.max(...polls.map(p => p.votes), 1);
  const leadingPoll = polls.find(p => p.votes === maxVotes && p.votes > 0);

  return (
    <div className="glass-panel p-6 rounded-3xl relative overflow-hidden mb-12 border-blue-500/10">
      <div className="absolute -top-16 -left-16 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-purple-600/10 rounded-full blur-3xl animate-pulse-slow" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Vote className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-display font-bold text-white">APL 2026 Popularity Poll</h2>
          </div>
          <p className="text-xs text-slate-400 font-sans">
            Cast your vote for the team you predict will lift the Andharia Premier League 2026 trophy!
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-3 self-start md:self-auto">
          <div className="text-left">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Total Ballots Cast</p>
            <p className="text-lg font-display font-black text-blue-300">
              {totalVotes.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Interactive Poll Cards */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <h3 className="text-sm font-display font-semibold text-slate-300 uppercase tracking-widest">
              {hasVoted ? 'Your Ballot Submitted' : 'Select Team to Vote'}
            </h3>
            {!currentUser && (
              <button 
                type="button"
                onClick={onOpenAuthModal}
                className="text-[10px] text-amber-400 hover:text-amber-300 font-sans font-bold hover:underline self-start cursor-pointer"
              >
                ⚠️ Sign in to vote
              </button>
            )}
            {currentUser && !hasVoted && (
              <span className="text-[10px] text-blue-400 font-sans flex items-center gap-1 font-bold">
                <UserCheck className="w-3.5 h-3.5" />
                Voting as: {currentUser.fullName}
              </span>
            )}
          </div>

          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {polls.map((poll) => {
              const isSelected = selectedPollId === poll.id;
              const isLeader = leadingPoll?.id === poll.id;
              
              return (
                <button
                  key={poll.id}
                  disabled={hasVoted}
                  onClick={() => handleVoteSubmit(poll.id)}
                  id={`vote-button-${poll.id}`}
                  className={`w-full text-left p-3.5 rounded-xl transition-all border flex items-center justify-between group ${
                    isSelected
                      ? 'bg-blue-500/20 border-blue-400/80 shadow-md shadow-blue-500/10'
                      : isLeader && !hasVoted
                      ? 'bg-amber-500/5 border-amber-500/20 hover:border-amber-500/45 hover:bg-amber-500/10'
                      : 'bg-white/[0.02] border-white/5 hover:border-white/15 hover:bg-white/5'
                  } ${hasVoted ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected 
                        ? 'border-blue-400 bg-blue-500' 
                        : 'border-slate-500 group-hover:border-slate-300'
                    }`}>
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    
                    <span className={`text-xs font-semibold ${isSelected ? 'text-blue-300 font-bold' : 'text-white'}`}>
                      {poll.option}
                    </span>
                    
                    {isLeader && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 font-mono flex items-center gap-0.5 uppercase font-bold">
                        <Sparkles className="w-2.5 h-2.5" />
                        Leader
                      </span>
                    )}
                  </div>

                  {hasVoted && (
                    <span className="text-xs font-mono font-bold text-slate-400">
                      {totalVotes > 0 ? Math.round((poll.votes / totalVotes) * 100) : 0}%
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {hasVoted && (
            <motion.p 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[11px] text-emerald-400 flex items-center gap-1.5 mt-2 bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/10 font-sans"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Thanks for participating! Real-time fan sentiments captured successfully.</span>
            </motion.p>
          )}
        </div>

        {/* Right Side: Sleek Glassmorphic Bar Charts */}
        <div className="lg:col-span-6 bg-slate-950/20 border border-white/5 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-display font-semibold text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-purple-400" />
              Live Visualizer Status
            </h3>

            <div className="space-y-4">
              {polls.map((poll) => {
                const percentage = totalVotes > 0 ? Math.round((poll.votes / totalVotes) * 100) : 0;
                const isLeader = leadingPoll?.id === poll.id;

                return (
                  <div key={poll.id} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className={`font-medium ${isLeader ? 'text-amber-300 font-bold' : 'text-slate-300'}`}>
                        {poll.option}
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">
                        {poll.votes} votes ({percentage}%)
                      </span>
                    </div>

                    <div className="w-full h-2.5 bg-slate-900/50 rounded-full overflow-hidden border border-white/5 relative">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1.2, ease: 'easeOut' }}
                        className={`h-full rounded-full ${
                          isLeader 
                            ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500' 
                            : 'bg-gradient-to-r from-blue-500 to-purple-600'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {leadingPoll && (
            <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-3 bg-white/[0.01] p-3 rounded-xl border border-white/5">
              <Heart className="w-5 h-5 text-red-500 fill-red-500/20 animate-pulse flex-shrink-0" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Fan Favorite Predicted Champion</p>
                <p className="text-xs font-display font-bold text-white mt-0.5">
                  {leadingPoll.option} leads with {leadingPoll.votes} votes!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
