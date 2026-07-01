/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Team, PlayerRegistration, AppUser } from '../types';
import { 
  Users, UserPlus, Phone, MapPin, Star, Plus, Trash2, CheckCircle2, ShieldAlert, Sparkles, HelpCircle, UserCheck 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RegistrationFormProps {
  teams: Team[];
  onAddTeam: (team: Team) => void;
  players: PlayerRegistration[];
  onAddPlayer: (player: PlayerRegistration) => void;
  currentUser: AppUser | null;
  onOpenAuthModal: () => void;
}

export default function RegistrationForm({ 
  teams, 
  onAddTeam, 
  players, 
  onAddPlayer,
  currentUser,
  onOpenAuthModal
}: RegistrationFormProps) {
  const [activeTab, setActiveTab] = useState<'team' | 'player'>('team');
  
  // Team Form State
  const [teamName, setTeamName] = useState('');
  const [captainName, setCaptainName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [village, setVillage] = useState('');
  const [iconPlayer, setIconPlayer] = useState('');
  const [playerInput, setPlayerInput] = useState('');
  const [teamRoster, setTeamRoster] = useState<string[]>([]);
  const [teamColor, setTeamColor] = useState('from-blue-600 to-indigo-800');
  const [teamError, setTeamError] = useState('');
  const [teamSuccess, setTeamSuccess] = useState(false);

  // Player Form State
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'Batsman' | 'Bowler' | 'Allrounder' | 'Wicketkeeper'>('Batsman');
  const [playerVillage, setPlayerVillage] = useState('');
  const [playerContact, setPlayerContact] = useState('');
  const [experience, setExperience] = useState('');
  const [playerError, setPlayerError] = useState('');
  const [playerSuccess, setPlayerSuccess] = useState(false);

  // Auto-fill form fields when user logs in or switches tabs
  React.useEffect(() => {
    if (currentUser) {
      if (activeTab === 'team') {
        setCaptainName(currentUser.fullName);
        setContactNumber(currentUser.mobileNumber);
      } else {
        setFullName(currentUser.fullName);
        setPlayerContact(currentUser.mobileNumber);
      }
    }
  }, [currentUser, activeTab]);

  // Available Colors
  const colors = [
    { value: 'from-blue-600 to-indigo-800', name: 'Ocean Royal' },
    { value: 'from-orange-500 to-red-700', name: 'Fiery Blaster' },
    { value: 'from-emerald-500 to-teal-800', name: 'Forest Sardar' },
    { value: 'from-violet-600 to-fuchsia-800', name: 'Cosmic Strike' },
    { value: 'from-rose-600 to-pink-800', name: 'Cherry Willow' },
    { value: 'from-yellow-500 to-amber-700', name: 'Golden Sun' },
  ];

  // Roster Management
  const addRosterPlayer = () => {
    if (!playerInput.trim()) return;
    if (teamRoster.length >= 9) {
      setTeamError('Strict village roster cap: maximum of 9 additional players allowed (Total 11 players including Captain and Icon).');
      return;
    }
    setTeamRoster([...teamRoster, playerInput.trim()]);
    setPlayerInput('');
    setTeamError('');
  };

  const removeRosterPlayer = (index: number) => {
    setTeamRoster(teamRoster.filter((_, i) => i !== index));
    setTeamError('');
  };

  const handleTeamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTeamError('');
    setTeamSuccess(false);

    if (!teamName || !captainName || !contactNumber || !village || !iconPlayer) {
      setTeamError('Please fill in all mandatory fields.');
      return;
    }

    if (teamRoster.length === 0) {
      setTeamError('Please add at least 1 player to the team roster.');
      return;
    }

    // Rules verification
    // 1 icon player checked (it's a text input, must be designated)
    // 9 players max check
    if (teamRoster.length > 9) {
      setTeamError('Rule violation: Max 9 additional players permitted from one village (Total 11 including Captain & Icon).');
      return;
    }

    const newTeam: Team = {
      id: `team-${Date.now()}`,
      teamName,
      captainName,
      contactNumber,
      village,
      iconPlayer,
      players: [captainName + ' (C)', iconPlayer + ' (Icon)', ...teamRoster],
      teamColor,
      registeredAt: new Date().toISOString(),
      status: 'pending',
    };

    onAddTeam(newTeam);
    setTeamSuccess(true);
    
    // Reset Form
    setTeamName('');
    setCaptainName('');
    setContactNumber('');
    setVillage('');
    setIconPlayer('');
    setTeamRoster([]);
    
    setTimeout(() => setTeamSuccess(false), 5000);
  };

  const handlePlayerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPlayerError('');
    setPlayerSuccess(false);

    if (!fullName || !playerVillage || !playerContact || !experience) {
      setPlayerError('Please fill in all mandatory fields.');
      return;
    }

    const newPlayer: PlayerRegistration = {
      id: `player-${Date.now()}`,
      fullName,
      role,
      village: playerVillage,
      contactNumber: playerContact,
      experience,
      registeredAt: new Date().toISOString(),
    };

    onAddPlayer(newPlayer);
    setPlayerSuccess(true);

    // Reset Form
    setFullName('');
    setPlayerVillage('');
    setPlayerContact('');
    setExperience('');
    setRole('Batsman');

    setTimeout(() => setPlayerSuccess(false), 5000);
  };

  const approvedTeams = teams.filter(t => !t.status || t.status === 'approved');
  const filledSlotsCount = approvedTeams.length;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 mb-16">
      {/* Registration Form Panel (7 Columns) */}
      <div className="xl:col-span-7 glass-panel p-6 rounded-3xl relative overflow-hidden flex flex-col justify-between">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
        
        {/* Team Registration Form */}
        <div>
          <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-400">
                <Users className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-display font-bold text-white">Team Registration Portal</h3>
              </div>
            </div>

            {currentUser ? (
              <span className="text-[10px] bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-full text-blue-300 font-bold flex items-center gap-1 font-sans">
                <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>Auto-filled as {currentUser.fullName}</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="text-[10px] bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full text-amber-300 font-bold hover:bg-amber-500/20 transition-all cursor-pointer font-sans"
              >
                🔑 Sign in to Auto-fill
              </button>
            )}
          </div>

          <motion.form
            key="team-form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onSubmit={handleTeamSubmit}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 font-display">Team Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Andharia Warriors"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full glass-input px-3.5 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 font-display">Village Origin *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Andharia"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  className="w-full glass-input px-3.5 py-2 text-sm text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 font-display">Captain Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Full Name"
                  value={captainName}
                  onChange={(e) => setCaptainName(e.target.value)}
                  className="w-full glass-input px-3.5 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 font-display">Captain Contact (Mobile) *</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g., +91 XXXXX XXXXX"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="w-full glass-input px-3.5 py-2 text-sm text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 font-display">
                Designated Icon Player *
              </label>
              <input
                type="text"
                required
                placeholder="Each team requires exactly 1 icon player"
                value={iconPlayer}
                onChange={(e) => setIconPlayer(e.target.value)}
                className="w-full glass-input px-3.5 py-2 text-sm text-white"
              />
            </div>

            {/* Team Roster Construction */}
            <div className="bg-slate-950/30 p-4 rounded-xl border border-white/5">
              <label className="block text-xs font-semibold text-white mb-2 font-display flex justify-between items-center">
                <span>Village Roster (Captain and Icon automatically included)</span>
                <span className="text-[10px] text-blue-400 font-mono">
                  {teamRoster.length}/9 players (Total 11 players)
                </span>
              </label>

              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="Player Name"
                  value={playerInput}
                  onChange={(e) => setPlayerInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRosterPlayer())}
                  className="flex-1 glass-input px-3.5 py-1.5 text-xs text-white"
                />
                <button
                  type="button"
                  onClick={addRosterPlayer}
                  className="px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center justify-center gap-1 text-xs font-bold transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>

              {teamRoster.length === 0 ? (
                <p className="text-slate-500 text-[11px] italic font-sans py-2">
                  Roster is empty. Add other team members from the village.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                  {teamRoster.map((player, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full text-xs text-white"
                    >
                      <span>{player}</span>
                      <button
                        type="button"
                        onClick={() => removeRosterPlayer(idx)}
                        className="text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Team Color Picker */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 font-display">
                Select Team Color/Gradient
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {colors.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setTeamColor(c.value)}
                    className={`py-2 rounded-lg text-[10px] font-bold text-white transition-all text-center border capitalize bg-gradient-to-r ${c.value} ${
                      teamColor === c.value
                        ? 'ring-2 ring-blue-400 border-white font-extrabold scale-105'
                        : 'border-transparent opacity-80 hover:opacity-100'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Status messages */}
            {teamError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-300 text-xs rounded-lg flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{teamError}</span>
              </div>
            )}

            {teamSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Team registration submitted successfully! It will appear on the board once approved by administrators.</span>
              </div>
            )}

            <button
              type="submit"
              id="submit-team-registration"
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-display font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Users className="w-4 h-4" />
              Submit Team Registration
            </button>
          </motion.form>
        </div>
      </div>

      {/* Registered Teams (5 Columns) */}
      <div className="xl:col-span-5 flex flex-col gap-6">
        {/* Slot Progress Header */}
        <div className="glass-panel p-5 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full blur-2xl" />
          
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 font-display uppercase tracking-widest">
              Tournament Status
            </span>
            <span className="text-lg font-display font-extrabold text-white">
              {filledSlotsCount} <span className="text-slate-400 text-sm font-medium">Registered Teams</span>
            </span>
          </div>
          
          <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1 font-mono">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Registrations are active! Open to all village teams.</span>
          </p>
        </div>

        {/* Tournament Teams */}
        <div className="glass-panel p-5 rounded-3xl flex-1">
          <h3 className="text-sm font-display font-bold text-slate-300 mb-4 uppercase tracking-widest flex items-center gap-1.5">
            <Users className="w-4 h-4 text-blue-400" />
            Tournament Teams
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-3 overflow-y-auto max-h-[380px] pr-1">
            {approvedTeams.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs italic">
                No approved teams yet. Register your team to get started!
              </div>
            ) : (
              approvedTeams.map((team, index) => (
                <motion.div
                  key={team.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  id={`registered-team-${index + 1}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950/20 border border-white/5 hover:border-white/10 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${team.teamColor} flex items-center justify-center font-display font-bold text-sm text-white shadow`}>
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white font-display truncate max-w-[130px]">
                        {team.teamName}
                      </h4>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1 font-sans mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        {team.village} village
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 font-mono">
                      {team.players.length} Players
                    </span>
                    <p className="text-[9px] text-slate-500 font-sans mt-0.5 truncate max-w-[100px]">
                      Cap: {team.captainName}
                    </p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
