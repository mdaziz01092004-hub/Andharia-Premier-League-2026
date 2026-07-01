/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Team, PlayerRegistration, Poll, VisibilityConfig, Rule, WhatsAppContact, AppUser } from '../types';
import { 
  Shield, Settings, Trash2, Edit2, Plus, CheckCircle2, XCircle, Users, Award, Vote, IndianRupee, Save, Undo, Eye, EyeOff, Music, Upload, Trash, Play, Pause, ShieldAlert, Database, Copy, AlertTriangle,
  ClipboardList, Check, X, Phone, MapPin, Calendar, HelpCircle, MessageSquare, UserPlus, UserCheck, Key,
  Activity, Clock, LogIn, LogOut, BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getCustomAudio, saveCustomAudio, deleteCustomAudio } from '../utils/audioDb';
import { isSupabaseConfigured, SUPABASE_SQL_SCRIPT } from '../utils/supabase';

interface AdminPanelProps {
  teams: Team[];
  players: PlayerRegistration[];
  polls: Poll[];
  rules: Rule[];
  whatsAppContacts: WhatsAppContact[];
  onUpdateWhatsAppContacts: (contacts: WhatsAppContact[]) => void;
  onUpdateTeams: (teams: Team[]) => void;
  onUpdatePlayers: (players: PlayerRegistration[]) => void;
  onUpdatePolls: (polls: Poll[]) => void;
  onUpdateRules: (rules: Rule[]) => void;
  visibility: VisibilityConfig;
  onUpdateVisibility: (visibility: VisibilityConfig) => void;
  adminEmail: string | null;
  subAdmins: string[];
  onAddSubAdmin: (email: string) => void;
  onRemoveSubAdmin: (email: string) => void;
  onUpdatePassword: (password: string) => void;
  registeredUsers: AppUser[];
  onDeleteUser: (mobileNumber: string) => Promise<void>;
  onUpdateUser: (oldMobile: string, user: AppUser) => Promise<void>;
  onLogout: () => void;
}

export default function AdminPanel({
  teams,
  players,
  polls,
  rules = [],
  whatsAppContacts = [],
  onUpdateWhatsAppContacts,
  onUpdateTeams,
  onUpdatePlayers,
  onUpdatePolls,
  onUpdateRules,
  visibility,
  onUpdateVisibility,
  adminEmail,
  subAdmins,
  onAddSubAdmin,
  onRemoveSubAdmin,
  onUpdatePassword,
  registeredUsers = [],
  onDeleteUser,
  onUpdateUser,
  onLogout
}: AdminPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<'teams' | 'submissions' | 'players' | 'polls' | 'visibility' | 'music' | 'rules' | 'security' | 'whatsapp' | 'users'>('teams');
  
  // Edit / Add States for Users
  const [editingUserPhone, setEditingUserPhone] = useState<string | null>(null);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [selectedUserForLogs, setSelectedUserForLogs] = useState<string | null>(null);
  const [userForm, setUserForm] = useState<Partial<AppUser>>({
    fullName: '',
    mobileNumber: ''
  });
  const [userSearch, setUserSearch] = useState('');
  const [newSubAdminEmail, setNewSubAdminEmail] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [passwordUpdateStatus, setPasswordUpdateStatus] = useState<string | null>(null);
  const [submissionFilter, setSubmissionFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [submissionSearch, setSubmissionSearch] = useState('');
  const [expandedRosterTeamId, setExpandedRosterTeamId] = useState<string | null>(null);
  const [showSqlScript, setShowSqlScript] = useState(false);
  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCRIPT);
    showNotification('Supabase SQL migration script copied to clipboard!');
  };

  // Edit / Add States for Teams
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [teamForm, setTeamForm] = useState<Partial<Team>>({
    teamName: '',
    captainName: '',
    contactNumber: '',
    village: '',
    iconPlayer: '',
    players: [],
    teamColor: 'from-blue-600 to-indigo-800'
  });
  const [tempPlayerName, setTempPlayerName] = useState('');

  // Edit / Add States for Players
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [playerForm, setPlayerForm] = useState<Partial<PlayerRegistration>>({
    fullName: '',
    role: 'Batsman',
    village: '',
    contactNumber: '',
    experience: ''
  });

  // Edit / Add States for Polls
  const [editingPollId, setEditingPollId] = useState<string | null>(null);
  const [pollForm, setPollForm] = useState<Partial<Poll>>({
    option: '',
    votes: 0
  });

  // Edit / Add States for WhatsApp Contacts
  const [editingWhatsAppId, setEditingWhatsAppId] = useState<string | null>(null);
  const [whatsAppForm, setWhatsAppForm] = useState<Partial<WhatsAppContact>>({
    name: '',
    phone: '',
    message: '',
    visible: true
  });

  // Background Music States
  const [adminAudioFile, setAdminAudioFile] = useState<File | null>(null);
  const [isAdminAudioPlaying, setIsAdminAudioPlaying] = useState(false);
  const adminAudioRef = useRef<HTMLAudioElement | null>(null);

  const loadAdminAudio = async () => {
    const file = await getCustomAudio();
    setAdminAudioFile(file);
  };

  useEffect(() => {
    loadAdminAudio();
  }, []);

  // Update audio source when file changes
  useEffect(() => {
    if (adminAudioRef.current) {
      if (adminAudioFile) {
        const url = URL.createObjectURL(adminAudioFile);
        adminAudioRef.current.src = url;
        return () => {
          URL.revokeObjectURL(url);
        };
      } else {
        adminAudioRef.current.src = '';
      }
    }
  }, [adminAudioFile]);

  // Handle Play preview in Admin Panel
  const playAdminAudio = () => {
    if (!adminAudioRef.current) return;
    adminAudioRef.current.play().then(() => {
      setIsAdminAudioPlaying(true);
    }).catch(err => {
      console.warn('Playback blocked', err);
    });
  };

  // Handle Pause preview in Admin Panel
  const pauseAdminAudio = () => {
    if (!adminAudioRef.current) return;
    adminAudioRef.current.pause();
    setIsAdminAudioPlaying(false);
  };

  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return 'Never';
    try {
      const d = new Date(isoString);
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return isoString;
    }
  };

  // Edit / Add States for Rules
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [ruleForm, setRuleForm] = useState<Partial<Rule>>({
    title: '',
    desc: '',
    badge: '',
    badgeColor: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
    iconName: 'Swords',
    visible: true
  });

  const handleEditRule = (rule: Rule) => {
    setEditingRuleId(rule.id);
    setRuleForm({
      title: rule.title,
      desc: rule.desc,
      badge: rule.badge,
      badgeColor: rule.badgeColor || 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
      iconName: rule.iconName,
      visible: rule.visible
    });
  };

  const cancelRuleEdit = () => {
    setEditingRuleId(null);
    setRuleForm({
      title: '',
      desc: '',
      badge: '',
      badgeColor: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
      iconName: 'Swords',
      visible: true
    });
  };

  const saveRule = () => {
    if (!ruleForm.title || !ruleForm.desc || !ruleForm.badge) {
      showNotification('Please fill in Title, Description, and Badge.', 'error');
      return;
    }

    let updatedRules: Rule[];
    if (editingRuleId && editingRuleId !== 'new') {
      updatedRules = rules.map(r => r.id === editingRuleId ? {
        ...r,
        title: ruleForm.title!,
        desc: ruleForm.desc!,
        badge: ruleForm.badge!,
        badgeColor: ruleForm.badgeColor!,
        iconName: ruleForm.iconName!,
        visible: ruleForm.visible !== false
      } : r);
      showNotification('Rule updated successfully!');
    } else {
      const newRule: Rule = {
        id: `rule-${Date.now()}`,
        title: ruleForm.title!,
        desc: ruleForm.desc!,
        badge: ruleForm.badge!,
        badgeColor: ruleForm.badgeColor || 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
        iconName: ruleForm.iconName || 'Swords',
        visible: ruleForm.visible !== false
      };
      updatedRules = [...rules, newRule];
      showNotification('New rule added successfully!');
    }

    onUpdateRules(updatedRules);
    cancelRuleEdit();
  };

  const deleteRule = (ruleId: string) => {
    const updatedRules = rules.filter(r => r.id !== ruleId);
    onUpdateRules(updatedRules);
    showNotification('Rule deleted successfully.');
  };

  const toggleRuleVisibility = (ruleId: string) => {
    const updatedRules = rules.map(r => r.id === ruleId ? { ...r, visible: !r.visible } : r);
    onUpdateRules(updatedRules);
    showNotification('Rule visibility toggled successfully.');
  };

  // ================= TEAMS CRUD =================
  const startEditTeam = (team: Team) => {
    setEditingTeamId(team.id);
    setTeamForm({ ...team });
    setTempPlayerName('');
  };

  const startAddTeam = () => {
    setEditingTeamId('new');
    setTeamForm({
      teamName: '',
      captainName: '',
      contactNumber: '',
      village: '',
      iconPlayer: '',
      players: [],
      teamColor: 'from-blue-600 to-indigo-800'
    });
    setTempPlayerName('');
  };

  const cancelTeamEdit = () => {
    setEditingTeamId(null);
    setTeamForm({});
  };

  const handleAddPlayerToRoster = () => {
    if (!tempPlayerName.trim()) return;
    const currentRoster = teamForm.players || [];
    if (currentRoster.length >= 11) {
      showNotification('Roster rule: Maximum of 11 total players (Captain, Icon, and 9 village players) are permitted.', 'error');
      return;
    }
    setTeamForm({
      ...teamForm,
      players: [...currentRoster, tempPlayerName.trim()]
    });
    setTempPlayerName('');
  };

  const handleRemovePlayerFromRoster = (idx: number) => {
    const currentRoster = teamForm.players || [];
    setTeamForm({
      ...teamForm,
      players: currentRoster.filter((_, i) => i !== idx)
    });
  };

  const saveTeam = () => {
    if (!teamForm.teamName || !teamForm.captainName || !teamForm.village) {
      showNotification('Please fill in team name, captain name, and village.', 'error');
      return;
    }

    if (editingTeamId === 'new') {
      const newTeam: Team = {
        id: `team-${Date.now()}`,
        teamName: teamForm.teamName,
        captainName: teamForm.captainName,
        contactNumber: teamForm.contactNumber || '+91 00000 00000',
        village: teamForm.village,
        iconPlayer: teamForm.iconPlayer || 'Not Designated',
        players: teamForm.players && teamForm.players.length > 0 ? teamForm.players : [teamForm.captainName],
        teamColor: teamForm.teamColor || 'from-blue-600 to-indigo-800',
        registeredAt: new Date().toISOString()
      };
      
      const updated = [...teams, newTeam];
      onUpdateTeams(updated);
      showNotification(`Team "${newTeam.teamName}" added successfully.`);
    } else {
      const updated = teams.map(t => t.id === editingTeamId ? { ...t, ...teamForm } as Team : t);
      onUpdateTeams(updated);
      showNotification(`Team "${teamForm.teamName}" updated successfully.`);
    }
    setEditingTeamId(null);
  };

  const deleteTeam = (id: string) => {
    if (window.confirm('Are you sure you want to remove this team? This slot will become open in the tournament.')) {
      const updated = teams.filter(t => t.id !== id);
      onUpdateTeams(updated);
      showNotification('Team deleted successfully.');
    }
  };

  const approveTeam = (id: string) => {
    const updated = teams.map(t => t.id === id ? { ...t, status: 'approved' as const } : t);
    onUpdateTeams(updated);
    showNotification('Team registration approved! Added to tournament slots.');
  };

  const rejectTeam = (id: string) => {
    const updated = teams.map(t => t.id === id ? { ...t, status: 'rejected' as const } : t);
    onUpdateTeams(updated);
    showNotification('Team registration marked as rejected.');
  };

  const setTeamPending = (id: string) => {
    const updated = teams.map(t => t.id === id ? { ...t, status: 'pending' as const } : t);
    onUpdateTeams(updated);
    showNotification('Team registration marked as pending review.');
  };


  // ================= PLAYERS CRUD =================
  const startEditPlayer = (player: PlayerRegistration) => {
    setEditingPlayerId(player.id);
    setPlayerForm({ ...player });
  };

  const startAddPlayer = () => {
    setEditingPlayerId('new');
    setPlayerForm({
      fullName: '',
      role: 'Batsman',
      village: '',
      contactNumber: '',
      experience: ''
    });
  };

  const cancelPlayerEdit = () => {
    setEditingPlayerId(null);
    setPlayerForm({});
  };

  const savePlayer = () => {
    if (!playerForm.fullName || !playerForm.village || !playerForm.contactNumber) {
      showNotification('Please fill in name, village, and contact info.', 'error');
      return;
    }

    if (editingPlayerId === 'new') {
      const newPlayer: PlayerRegistration = {
        id: `player-${Date.now()}`,
        fullName: playerForm.fullName,
        role: playerForm.role as any || 'Batsman',
        village: playerForm.village,
        contactNumber: playerForm.contactNumber,
        experience: playerForm.experience || 'Local Village Talent',
        registeredAt: new Date().toISOString()
      };
      const updated = [...players, newPlayer];
      onUpdatePlayers(updated);
      showNotification(`Player "${newPlayer.fullName}" added to draft.`);
    } else {
      const updated = players.map(p => p.id === editingPlayerId ? { ...p, ...playerForm } as PlayerRegistration : p);
      onUpdatePlayers(updated);
      showNotification(`Player "${playerForm.fullName}" updated.`);
    }
    setEditingPlayerId(null);
  };

  const deletePlayer = (id: string) => {
    if (window.confirm('Remove this player from the draft pool?')) {
      const updated = players.filter(p => p.id !== id);
      onUpdatePlayers(updated);
      showNotification('Player removed successfully.');
    }
  };


  // ================= POLLS CRUD =================
  const startEditPoll = (poll: Poll) => {
    setEditingPollId(poll.id);
    setPollForm({ ...poll });
  };

  const startAddPoll = () => {
    setEditingPollId('new');
    setPollForm({
      option: '',
      votes: 0
    });
  };

  const cancelPollEdit = () => {
    setEditingPollId(null);
    setPollForm({});
  };

  const savePoll = () => {
    if (!pollForm.option) {
      showNotification('Please fill in option name.', 'error');
      return;
    }

    if (editingPollId === 'new') {
      const newPoll: Poll = {
        id: `poll-${Date.now()}`,
        option: pollForm.option,
        votes: Number(pollForm.votes) || 0
      };
      const updated = [...polls, newPoll];
      onUpdatePolls(updated);
      showNotification(`Poll option "${newPoll.option}" added.`);
    } else {
      const updated = polls.map(p => p.id === editingPollId ? { ...p, option: pollForm.option, votes: Number(pollForm.votes) } as Poll : p);
      onUpdatePolls(updated);
      showNotification(`Poll option updated.`);
    }
    setEditingPollId(null);
  };

  const deletePoll = (id: string) => {
    if (window.confirm('Delete this prediction poll option?')) {
      const updated = polls.filter(p => p.id !== id);
      onUpdatePolls(updated);
      showNotification('Poll option removed.');
    }
  };

  // ================= WHATSAPP CONTACTS CRUD =================
  const startEditWhatsApp = (contact: WhatsAppContact) => {
    setEditingWhatsAppId(contact.id);
    setWhatsAppForm({ ...contact });
  };

  const startAddWhatsApp = () => {
    setEditingWhatsAppId('new');
    setWhatsAppForm({
      name: '',
      phone: '',
      message: "Hello, I'm inquiring about the Andharia Premier League.",
      visible: true
    });
  };

  const cancelWhatsAppEdit = () => {
    setEditingWhatsAppId(null);
    setWhatsAppForm({});
  };

  const saveWhatsAppContact = () => {
    if (!whatsAppForm.name || !whatsAppForm.phone) {
      showNotification('Please fill in Name and Phone Number.', 'error');
      return;
    }

    // Clean up phone number (remove space, dash, or non-numeric characters)
    const cleanedPhone = whatsAppForm.phone.replace(/[^0-9]/g, '');
    if (cleanedPhone.length < 10) {
      showNotification('Please enter a valid phone number (at least 10 digits).', 'error');
      return;
    }

    let updatedContacts: WhatsAppContact[];
    if (editingWhatsAppId === 'new') {
      const newContact: WhatsAppContact = {
        id: `wa-${Date.now()}`,
        name: whatsAppForm.name,
        phone: cleanedPhone,
        message: whatsAppForm.message || "Hello, I'm inquiring about the Andharia Premier League.",
        visible: whatsAppForm.visible !== false
      };
      updatedContacts = [...whatsAppContacts, newContact];
      showNotification(`WhatsApp contact "${newContact.name}" added successfully.`);
    } else {
      updatedContacts = whatsAppContacts.map(c => 
        c.id === editingWhatsAppId ? { 
          ...c, 
          name: whatsAppForm.name!, 
          phone: cleanedPhone, 
          message: whatsAppForm.message || '', 
          visible: whatsAppForm.visible !== false 
        } : c
      );
      showNotification(`WhatsApp contact "${whatsAppForm.name}" updated successfully.`);
    }

    onUpdateWhatsAppContacts(updatedContacts);
    setEditingWhatsAppId(null);
  };

  const deleteWhatsAppContact = (id: string) => {
    if (window.confirm('Are you sure you want to delete this WhatsApp contact button?')) {
      const updated = whatsAppContacts.filter(c => c.id !== id);
      onUpdateWhatsAppContacts(updated);
      showNotification('WhatsApp contact deleted successfully.');
    }
  };

  const toggleWhatsAppVisibility = (id: string) => {
    const updated = whatsAppContacts.map(c => c.id === id ? { ...c, visible: !c.visible } : c);
    onUpdateWhatsAppContacts(updated);
    showNotification('WhatsApp contact button visibility updated.');
  };

  const colorsList = [
    { value: 'from-blue-600 to-indigo-800', name: 'Ocean Royal' },
    { value: 'from-orange-500 to-red-700', name: 'Fiery Blaster' },
    { value: 'from-emerald-500 to-teal-800', name: 'Forest Sardar' },
    { value: 'from-violet-600 to-fuchsia-800', name: 'Cosmic Strike' },
    { value: 'from-rose-600 to-pink-800', name: 'Cherry Willow' },
    { value: 'from-yellow-500 to-amber-700', name: 'Golden Sun' },
  ];

  const toggleVisibility = (key: keyof VisibilityConfig) => {
    const updated = {
      ...visibility,
      [key]: !visibility[key]
    };
    onUpdateVisibility(updated);
    showNotification(`Section visibility updated successfully.`);
  };

  const visibilitySections = [
    {
      key: 'prizesFees' as keyof VisibilityConfig,
      title: 'Prizes & Registration Fees',
      desc: 'Displays cash prize pools, entry registration fees, and residency verification guidelines.',
      icon: <IndianRupee className="w-5 h-5 text-amber-400" />
    },
    {
      key: 'officialRules' as keyof VisibilityConfig,
      title: 'Tournament Official Rules',
      desc: 'Displays rules of play, overs, super-over rules, and code of conduct.',
      icon: <Settings className="w-5 h-5 text-blue-400" />
    },
    {
      key: 'registrations' as keyof VisibilityConfig,
      title: 'Live Enrollment Portal',
      desc: 'Displays the registration forms for teams and players, allowing visitors to sign up.',
      icon: <Users className="w-5 h-5 text-emerald-400" />
    },
    {
      key: 'votingPopularity' as keyof VisibilityConfig,
      title: 'Predictor Popularity Voting Board',
      desc: 'Displays live team fan favorite prediction polls and current cast ballots.',
      icon: <Vote className="w-5 h-5 text-purple-400" />
    },
    {
      key: 'bgMusicPlayer' as keyof VisibilityConfig,
      title: 'Background Music Player (Public Controller)',
      desc: 'Displays the custom background music player controls (volume and play/pause buttons) on the public landing page.',
      icon: <Music className="w-5 h-5 text-pink-400" />
    }
  ];

  return (
    <div className="glass-panel p-6 rounded-3xl relative overflow-hidden mb-12 border-blue-500/20">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
      
      {/* Header section with Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/30">
            <Shield className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-extrabold text-white flex items-center gap-2">
              APL control center
              <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono tracking-widest uppercase">Admin</span>
            </h2>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Live tournament database manager. Add, edit, or delete registered teams, draft players, and live polls.
            </p>
          </div>
        </div>

        {/* Action feedback banner */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                notification.type === 'error'
                  ? 'bg-red-500/15 border-red-500/30 text-red-300'
                  : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              }`}
            >
              {notification.type === 'error' ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>{notification.text}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Supabase Connection Status Card */}
      <div className="mb-6 p-4 rounded-2xl border transition-all duration-300 bg-slate-950/40 border-white/5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border flex items-center justify-center ${
              isSupabaseConfigured 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
            }`}>
              <Database className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-display font-bold text-white">
                  {isSupabaseConfigured ? 'Supabase Connected' : 'Supabase Not Connected (Offline Mode)'}
                </h3>
                <span className={`w-2 h-2 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {isSupabaseConfigured 
                  ? 'All data is live-syncing with your secure Supabase database (ready for Vercel production deployment).'
                  : 'Currently storing data locally in your browser. Configure environment variables to connect your real database.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isSupabaseConfigured ? (
              <button
                onClick={() => setShowSqlScript(!showSqlScript)}
                className="px-3.5 py-1.5 text-xs font-semibold bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/20 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                📜 SQL Schema Setup
              </button>
            ) : (
              <div className="text-xs font-mono text-amber-300/80 bg-amber-500/5 px-3 py-1.5 rounded-xl border border-amber-500/10">
                Setup variables in Settings
              </div>
            )}
          </div>
        </div>

        {/* Collapsible SQL Script panel */}
        {isSupabaseConfigured && showSqlScript && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 pt-4 border-t border-white/5 space-y-4"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-slate-300 font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Supabase Database Setup Instructions
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Copy and run this SQL script in your Supabase SQL Editor to instantly create all necessary tables and RLS policies.
                </p>
              </div>
              <button
                onClick={copySqlToClipboard}
                className="px-3 py-1.5 text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy SQL
              </button>
            </div>

            <pre className="p-3 bg-slate-950 rounded-xl border border-white/10 text-[10px] font-mono text-slate-300 overflow-x-auto max-h-48 overflow-y-auto leading-relaxed">
              {SUPABASE_SQL_SCRIPT}
            </pre>
          </motion.div>
        )}
      </div>

      {/* Admin tabs */}
      <div className="flex gap-2 border-b border-white/5 mb-6 pb-2 overflow-x-auto">
        <button
          onClick={() => { setActiveSubTab('teams'); cancelTeamEdit(); }}
          className={`px-4 py-2 text-xs font-display font-bold rounded-lg transition-all flex items-center gap-2 ${
            activeSubTab === 'teams'
              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Users className="w-4 h-4" />
          Teams CRUD ({teams.length})
        </button>
        <button
          onClick={() => { setActiveSubTab('submissions'); cancelTeamEdit(); }}
          className={`px-4 py-2 text-xs font-display font-bold rounded-lg transition-all flex items-center gap-2 relative ${
            activeSubTab === 'submissions'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <ClipboardList className="w-4 h-4 text-amber-400" />
          Form Submissions
          {teams.filter(t => t.status === 'pending').length > 0 && (
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
          )}
          <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-[10px] font-mono text-amber-300 font-bold border border-amber-500/10">
            {teams.filter(t => t.status === 'pending').length}
          </span>
        </button>
        <button
          onClick={() => { setActiveSubTab('players'); cancelPlayerEdit(); }}
          className={`px-4 py-2 text-xs font-display font-bold rounded-lg transition-all flex items-center gap-2 ${
            activeSubTab === 'players'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Award className="w-4 h-4" />
          Players Draft CRUD ({players.length})
        </button>
        <button
          onClick={() => { setActiveSubTab('polls'); cancelPollEdit(); }}
          className={`px-4 py-2 text-xs font-display font-bold rounded-lg transition-all flex items-center gap-2 ${
            activeSubTab === 'polls'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Vote className="w-4 h-4" />
          Popularity Poll CRUD ({polls.length})
        </button>
        <button
          onClick={() => { setActiveSubTab('visibility'); }}
          className={`px-4 py-2 text-xs font-display font-bold rounded-lg transition-all flex items-center gap-2 ${
            activeSubTab === 'visibility'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Eye className="w-4 h-4" />
          Section Visibility
        </button>
        <button
          onClick={() => { setActiveSubTab('music'); }}
          className={`px-4 py-2 text-xs font-display font-bold rounded-lg transition-all flex items-center gap-2 ${
            activeSubTab === 'music'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Music className="w-4 h-4" />
          Background Music
        </button>
        <button
          onClick={() => { setActiveSubTab('rules'); cancelRuleEdit(); }}
          className={`px-4 py-2 text-xs font-display font-bold rounded-lg transition-all flex items-center gap-2 ${
            activeSubTab === 'rules'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Rules CRUD ({rules.length})
        </button>

        <button
          onClick={() => { setActiveSubTab('whatsapp'); }}
          className={`px-4 py-2 text-xs font-display font-bold rounded-lg transition-all flex items-center gap-2 ${
            activeSubTab === 'whatsapp'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-emerald-400" />
          WhatsApp Customizer ({whatsAppContacts.length})
        </button>

        <button
          onClick={() => { setActiveSubTab('users'); }}
          className={`px-4 py-2 text-xs font-display font-bold rounded-lg transition-all flex items-center gap-2 ${
            activeSubTab === 'users'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <UserCheck className="w-4 h-4 text-sky-400" />
          Users & Login Manager ({registeredUsers.length})
        </button>

        {adminEmail?.toLowerCase() === 'mdaziz01092004@gmail.com' && (
          <button
            onClick={() => { setActiveSubTab('security'); }}
            className={`px-4 py-2 text-xs font-display font-bold rounded-lg transition-all flex items-center gap-2 ${
              activeSubTab === 'security'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Shield className="w-4 h-4 text-indigo-400" />
            Admins & Security
          </button>
        )}

        <button
          onClick={onLogout}
          className="ml-auto px-4 py-2 text-xs font-display font-bold rounded-lg transition-all flex items-center gap-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/5 border border-rose-500/10 hover:border-rose-500/25 cursor-pointer"
        >
          <XCircle className="w-4 h-4" />
          Logout ({adminEmail})
        </button>
      </div>

      {/* Active Form / Content Editor */}
      <div className="mb-8">
        {/* ======================= TEAMS EDITOR FORM ======================= */}
        {activeSubTab === 'teams' && editingTeamId && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-2xl bg-slate-950/40 border border-blue-500/25 space-y-4"
          >
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <h3 className="text-sm font-display font-bold text-blue-300">
                {editingTeamId === 'new' ? '✨ Create New Team Slot' : `📝 Edit Team: ${teamForm.teamName}`}
              </h3>
              <button 
                onClick={cancelTeamEdit}
                className="text-slate-400 hover:text-white text-xs flex items-center gap-1 font-semibold"
              >
                <Undo className="w-3.5 h-3.5" /> Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Team Name</label>
                <input
                  type="text"
                  value={teamForm.teamName || ''}
                  onChange={(e) => setTeamForm({ ...teamForm, teamName: e.target.value })}
                  className="w-full glass-input px-3 py-1.5 text-xs"
                  placeholder="e.g. Village Royals"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Village Origin</label>
                <input
                  type="text"
                  value={teamForm.village || ''}
                  onChange={(e) => setTeamForm({ ...teamForm, village: e.target.value })}
                  className="w-full glass-input px-3 py-1.5 text-xs"
                  placeholder="e.g. Sokhada"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Captain Name</label>
                <input
                  type="text"
                  value={teamForm.captainName || ''}
                  onChange={(e) => setTeamForm({ ...teamForm, captainName: e.target.value })}
                  className="w-full glass-input px-3 py-1.5 text-xs"
                  placeholder="Captain Full Name"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Captain Contact</label>
                <input
                  type="text"
                  value={teamForm.contactNumber || ''}
                  onChange={(e) => setTeamForm({ ...teamForm, contactNumber: e.target.value })}
                  className="w-full glass-input px-3 py-1.5 text-xs"
                  placeholder="+91 99887 XXXXX"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Designated Icon Player</label>
              <input
                type="text"
                value={teamForm.iconPlayer || ''}
                onChange={(e) => setTeamForm({ ...teamForm, iconPlayer: e.target.value })}
                className="w-full glass-input px-3 py-1.5 text-xs"
                placeholder="1 Icon player allowed per team roster"
              />
            </div>

            {/* Team color picker in editor */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Team Color Theme</label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {colorsList.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setTeamForm({ ...teamForm, teamColor: c.value })}
                    className={`py-1.5 rounded-lg text-[9px] font-bold text-white transition-all text-center border capitalize bg-gradient-to-r ${c.value} ${
                      teamForm.teamColor === c.value
                        ? 'ring-2 ring-blue-400 border-white'
                        : 'border-transparent opacity-75'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Live roster builder in editor */}
            <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
              <label className="block text-[10px] uppercase font-bold text-slate-300 mb-1">
                Edit Village Players Roster ({teamForm.players?.length || 0}/11 players max - Captain & Icon included)
              </label>
              
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={tempPlayerName}
                  onChange={(e) => setTempPlayerName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddPlayerToRoster())}
                  className="flex-1 glass-input px-3 py-1 text-xs"
                  placeholder="Player full name"
                />
                <button
                  type="button"
                  onClick={handleAddPlayerToRoster}
                  className="px-3 bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 text-xs font-bold rounded-lg border border-blue-500/30"
                >
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto pr-1">
                {(teamForm.players || []).map((p, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-2 py-0.5 rounded text-xs text-white">
                    <span>{p}</span>
                    <button
                      type="button"
                      onClick={() => handleRemovePlayerFromRoster(idx)}
                      className="text-slate-400 hover:text-red-400"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={saveTeam}
              className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-display font-bold text-xs rounded-xl flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Team Details
            </button>
          </motion.div>
        )}

        {/* ======================= PLAYERS EDITOR FORM ======================= */}
        {activeSubTab === 'players' && editingPlayerId && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-2xl bg-slate-950/40 border border-indigo-500/25 space-y-4"
          >
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <h3 className="text-sm font-display font-bold text-indigo-300">
                {editingPlayerId === 'new' ? '✨ Create New Player Profile' : `📝 Edit Player Profile`}
              </h3>
              <button 
                onClick={cancelPlayerEdit}
                className="text-slate-400 hover:text-white text-xs flex items-center gap-1 font-semibold"
              >
                <Undo className="w-3.5 h-3.5" /> Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  value={playerForm.fullName || ''}
                  onChange={(e) => setPlayerForm({ ...playerForm, fullName: e.target.value })}
                  className="w-full glass-input px-3 py-1.5 text-xs"
                  placeholder="Player Full Name"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Role/Specialty</label>
                <select
                  value={playerForm.role || 'Batsman'}
                  onChange={(e) => setPlayerForm({ ...playerForm, role: e.target.value as any })}
                  className="w-full glass-input px-3 py-1.5 text-xs"
                >
                  <option className="bg-slate-900" value="Batsman">🏏 Batsman</option>
                  <option className="bg-slate-900" value="Bowler">🥎 Bowler</option>
                  <option className="bg-slate-900" value="Allrounder">⭐ Allrounder</option>
                  <option className="bg-slate-900" value="Wicketkeeper">🧤 Wicketkeeper</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Village Origin</label>
                <input
                  type="text"
                  value={playerForm.village || ''}
                  onChange={(e) => setPlayerForm({ ...playerForm, village: e.target.value })}
                  className="w-full glass-input px-3 py-1.5 text-xs"
                  placeholder="Village Address"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={playerForm.contactNumber || ''}
                  onChange={(e) => setPlayerForm({ ...playerForm, contactNumber: e.target.value })}
                  className="w-full glass-input px-3 py-1.5 text-xs"
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Player bio / Experience</label>
              <textarea
                rows={2}
                value={playerForm.experience || ''}
                onChange={(e) => setPlayerForm({ ...playerForm, experience: e.target.value })}
                className="w-full glass-input px-3 py-1.5 text-xs"
                placeholder="Details of local league participation"
              />
            </div>

            <button
              onClick={savePlayer}
              className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-display font-bold text-xs rounded-xl flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Player Profile
            </button>
          </motion.div>
        )}

        {/* ======================= POLLS EDITOR FORM ======================= */}
        {activeSubTab === 'polls' && editingPollId && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-2xl bg-slate-950/40 border border-purple-500/25 space-y-4"
          >
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <h3 className="text-sm font-display font-bold text-purple-300">
                {editingPollId === 'new' ? '✨ Create New Poll Option' : `📝 Edit Poll Option`}
              </h3>
              <button 
                onClick={cancelPollEdit}
                className="text-slate-400 hover:text-white text-xs flex items-center gap-1 font-semibold"
              >
                <Undo className="w-3.5 h-3.5" /> Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Team/Option Label</label>
                <input
                  type="text"
                  value={pollForm.option || ''}
                  onChange={(e) => setPollForm({ ...pollForm, option: e.target.value })}
                  className="w-full glass-input px-3 py-1.5 text-xs"
                  placeholder="e.g. Patan Super Giants"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Ballots Cast / Votes</label>
                <input
                  type="number"
                  value={pollForm.votes || 0}
                  onChange={(e) => setPollForm({ ...pollForm, votes: parseInt(e.target.value) || 0 })}
                  className="w-full glass-input px-3 py-1.5 text-xs"
                />
              </div>
            </div>

            <button
              onClick={savePoll}
              className="w-full py-2.5 bg-gradient-to-r from-purple-500 to-fuchsia-600 hover:from-purple-600 hover:to-fuchsia-700 text-white font-display font-bold text-xs rounded-xl flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Poll Option
            </button>
          </motion.div>
        )}

        {/* ======================= RULES EDITOR FORM ======================= */}
        {activeSubTab === 'rules' && editingRuleId && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-2xl bg-slate-950/40 border border-amber-500/25 space-y-4"
          >
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <h3 className="text-sm font-display font-bold text-amber-300">
                {editingRuleId === 'new' ? '✨ Create New Tournament Rule' : '📝 Edit Tournament Rule'}
              </h3>
              <button 
                onClick={cancelRuleEdit}
                className="text-slate-400 hover:text-white text-xs flex items-center gap-1 font-semibold cursor-pointer"
              >
                <Undo className="w-3.5 h-3.5" /> Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Rule Title</label>
                <input
                  type="text"
                  value={ruleForm.title || ''}
                  onChange={(e) => setRuleForm({ ...ruleForm, title: e.target.value })}
                  className="w-full glass-input px-3 py-1.5 text-xs"
                  placeholder="e.g. Mandatory Helmets"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Badge Text</label>
                <input
                  type="text"
                  value={ruleForm.badge || ''}
                  onChange={(e) => setRuleForm({ ...ruleForm, badge: e.target.value })}
                  className="w-full glass-input px-3 py-1.5 text-xs"
                  placeholder="e.g. Safety First"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Rule Description</label>
              <textarea
                value={ruleForm.desc || ''}
                onChange={(e) => setRuleForm({ ...ruleForm, desc: e.target.value })}
                rows={3}
                className="w-full glass-input px-3 py-1.5 text-xs font-sans"
                placeholder="Write a clear, detailed description of this rule..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Icon Selection</label>
                <select
                  value={ruleForm.iconName || 'Swords'}
                  onChange={(e) => setRuleForm({ ...ruleForm, iconName: e.target.value as any })}
                  className="w-full glass-input px-3 py-1.5 text-xs bg-slate-900 text-white border border-white/10 rounded-xl"
                >
                  <option value="Swords">⚔️ Swords (Marquee / Combat)</option>
                  <option value="Users">👥 Users (Team / Village)</option>
                  <option value="Ban">🚫 Ban (Restriction / Ban)</option>
                  <option value="Trophy">🏆 Trophy (Prizes / Champions)</option>
                  <option value="Shield">🛡️ Shield (Safety / Governance)</option>
                  <option value="Clock">⏱️ Clock (Time limit / Duration)</option>
                  <option value="Info">ℹ️ Info (General Information)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Badge Style Presets</label>
                <select
                  value={ruleForm.badgeColor || 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'}
                  onChange={(e) => setRuleForm({ ...ruleForm, badgeColor: e.target.value })}
                  className="w-full glass-input px-3 py-1.5 text-xs bg-slate-900 text-white border border-white/10 rounded-xl"
                >
                  <option value="bg-indigo-500/10 text-indigo-300 border-indigo-500/20">Indigo (Mandatory)</option>
                  <option value="bg-emerald-500/10 text-emerald-300 border-emerald-500/20">Green (Permitted / Local)</option>
                  <option value="bg-red-500/10 text-red-300 border-red-500/20">Red (Strict Restriction)</option>
                  <option value="bg-amber-500/10 text-amber-300 border-amber-500/20">Amber (Warning / Alert)</option>
                  <option value="bg-cyan-500/10 text-cyan-300 border-cyan-500/20">Cyan (Special Category)</option>
                  <option value="bg-slate-500/10 text-slate-300 border-slate-500/20">Gray (Neutral / Standard)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Rule Default Visibility</label>
                <div className="flex items-center h-8">
                  <label className="inline-flex items-center gap-2 text-xs text-white cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={ruleForm.visible !== false}
                      onChange={(e) => setRuleForm({ ...ruleForm, visible: e.target.checked })}
                      className="rounded border-white/10 bg-slate-950/40 text-amber-500 focus:ring-0 w-4 h-4 cursor-pointer"
                    />
                    <span>Visible to visitors immediately</span>
                  </label>
                </div>
              </div>
            </div>

            <button
              onClick={saveRule}
              className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-display font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Save Tournament Rule
            </button>
          </motion.div>
        )}

        {/* ======================= WHATSAPP CONTACT EDITOR FORM ======================= */}
        {activeSubTab === 'whatsapp' && editingWhatsAppId && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-2xl bg-slate-950/40 border border-emerald-500/25 space-y-4"
          >
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <h3 className="text-sm font-display font-bold text-emerald-300">
                {editingWhatsAppId === 'new' ? '✨ Add New WhatsApp Contact' : '📝 Edit WhatsApp Contact'}
              </h3>
              <button 
                onClick={cancelWhatsAppEdit}
                className="text-slate-400 hover:text-white text-xs flex items-center gap-1 font-semibold cursor-pointer"
              >
                <Undo className="w-3.5 h-3.5" /> Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Contact Name</label>
                <input
                  type="text"
                  value={whatsAppForm.name || ''}
                  onChange={(e) => setWhatsAppForm({ ...whatsAppForm, name: e.target.value })}
                  className="w-full glass-input px-3 py-1.5 text-xs"
                  placeholder="e.g. Aminul Islam Chowdhury"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">WhatsApp Number (With Country Code)</label>
                <input
                  type="text"
                  value={whatsAppForm.phone || ''}
                  onChange={(e) => setWhatsAppForm({ ...whatsAppForm, phone: e.target.value })}
                  className="w-full glass-input px-3 py-1.5 text-xs font-mono"
                  placeholder="e.g. 919883177907"
                />
                <p className="text-[9px] text-slate-500 mt-0.5">Note: Do not include +, spaces or hyphens. Example: 919883177907 for Indian numbers.</p>
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Pre-filled Message text</label>
              <textarea
                value={whatsAppForm.message || ''}
                onChange={(e) => setWhatsAppForm({ ...whatsAppForm, message: e.target.value })}
                rows={2}
                className="w-full glass-input px-3 py-1.5 text-xs font-sans"
                placeholder="e.g. Hello Aminul, I'm inquiring about registration."
              />
              <p className="text-[9px] text-slate-500 mt-0.5">When users click the button, this text will be automatically typed in their chat.</p>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Status & Visibility</label>
              <div className="flex items-center h-8">
                <label className="inline-flex items-center gap-2 text-xs text-white cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={whatsAppForm.visible !== false}
                    onChange={(e) => setWhatsAppForm({ ...whatsAppForm, visible: e.target.checked })}
                    className="rounded border-white/10 bg-slate-950/40 text-emerald-500 focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                  <span>Show floating button and footer listing immediately</span>
                </label>
              </div>
            </div>

            <button
              onClick={saveWhatsAppContact}
              className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-display font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Save WhatsApp Contact
            </button>
          </motion.div>
        )}
      </div>

      {/* ======================= DATABASE TABLES / VIEWS ======================= */}
      {activeSubTab !== 'visibility' && activeSubTab !== 'music' && activeSubTab !== 'rules' && activeSubTab !== 'submissions' && activeSubTab !== 'whatsapp' ? (
        <div className="overflow-x-auto border border-white/5 rounded-2xl bg-slate-950/20 max-h-[400px]">
        {/* TEAMS DATA LIST */}
        {activeSubTab === 'teams' && (
          <table className="w-full text-left text-xs text-slate-300 border-collapse">
            <thead>
              <tr className="bg-slate-900/60 border-b border-white/10 text-[10px] uppercase font-bold text-slate-400 font-display">
                <th className="p-3">No.</th>
                <th className="p-3">Team details</th>
                <th className="p-3">Captain & Mobile</th>
                <th className="p-3">Village origin</th>
                <th className="p-3">Designated Icon</th>
                <th className="p-3">Roster capacity</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {teams.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-500 italic">No teams registered in system database.</td>
                </tr>
              ) : (
                teams.map((team, idx) => (
                  <tr key={team.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-3 font-mono font-bold text-slate-400">{idx + 1}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded bg-gradient-to-r ${team.teamColor}`} />
                        <span className="font-bold text-white">{team.teamName}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold">{team.captainName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{team.contactNumber}</div>
                    </td>
                    <td className="p-3">{team.village}</td>
                    <td className="p-3 font-medium text-blue-300">{team.iconPlayer}</td>
                    <td className="p-3 font-mono">{team.players?.length || 0} / 11 players</td>
                    <td className="p-3 text-right">
                      <div className="inline-flex gap-1.5">
                        <button
                          onClick={() => startEditTeam(team)}
                          className="p-1.5 hover:bg-blue-500/10 text-blue-400 rounded-lg border border-transparent hover:border-blue-500/20"
                          title="Edit Team"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteTeam(team.id)}
                          className="p-1.5 hover:bg-red-500/10 text-red-400 rounded-lg border border-transparent hover:border-red-500/20"
                          title="Delete Team"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {/* PLAYERS DRAFT DATA LIST */}
        {activeSubTab === 'players' && (
          <table className="w-full text-left text-xs text-slate-300 border-collapse">
            <thead>
              <tr className="bg-slate-900/60 border-b border-white/10 text-[10px] uppercase font-bold text-slate-400 font-display">
                <th className="p-3">ID</th>
                <th className="p-3">Player Name</th>
                <th className="p-3">Specialization Role</th>
                <th className="p-3">Village native</th>
                <th className="p-3">Experience bio</th>
                <th className="p-3">Contact</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {players.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-500 italic">No free agent players currently registered.</td>
                </tr>
              ) : (
                players.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-3 font-mono text-slate-500">#{idx + 1}</td>
                    <td className="p-3 font-bold text-white">{p.fullName}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        {p.role}
                      </span>
                    </td>
                    <td className="p-3">{p.village}</td>
                    <td className="p-3 italic text-slate-400 truncate max-w-[200px]">{p.experience}</td>
                    <td className="p-3 font-mono">{p.contactNumber}</td>
                    <td className="p-3 text-right">
                      <div className="inline-flex gap-1.5">
                        <button
                          onClick={() => startEditPlayer(p)}
                          className="p-1.5 hover:bg-indigo-500/10 text-indigo-400 rounded-lg border border-transparent hover:border-indigo-500/20"
                          title="Edit Player"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deletePlayer(p.id)}
                          className="p-1.5 hover:bg-red-500/10 text-red-400 rounded-lg border border-transparent hover:border-red-500/20"
                          title="Delete Player"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {/* POLLS DATA LIST */}
        {activeSubTab === 'polls' && (
          <table className="w-full text-left text-xs text-slate-300 border-collapse">
            <thead>
              <tr className="bg-slate-900/60 border-b border-white/10 text-[10px] uppercase font-bold text-slate-400 font-display">
                <th className="p-3">ID</th>
                <th className="p-3">Option Team Label</th>
                <th className="p-3 text-center">Vote Count</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {polls.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-500 italic">No prediction poll options designated.</td>
                </tr>
              ) : (
                polls.map((poll, idx) => (
                  <tr key={poll.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-3 font-mono text-slate-500">#{idx + 1}</td>
                    <td className="p-3 font-bold text-white">{poll.option}</td>
                    <td className="p-3 text-center font-mono font-extrabold text-blue-300 bg-blue-500/5">{poll.votes}</td>
                    <td className="p-3 text-right">
                      <div className="inline-flex gap-1.5">
                        <button
                          onClick={() => startEditPoll(poll)}
                          className="p-1.5 hover:bg-purple-500/10 text-purple-400 rounded-lg border border-transparent hover:border-purple-500/20"
                          title="Edit/Adjust Votes"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deletePoll(poll.id)}
                          className="p-1.5 hover:bg-red-500/10 text-red-400 rounded-lg border border-transparent hover:border-red-500/20"
                          title="Delete Option"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
      ) : activeSubTab === 'rules' ? (
        <div className="border border-white/5 rounded-2xl bg-slate-950/20 p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/5">
            <div>
              <h3 className="text-base font-display font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                Tournament Rules Manager
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Perform CRUD operations (Create, Read, Update, Delete) on official tournament rules and toggle individual rule visibility on the public portal.
              </p>
            </div>
            {!editingRuleId && (
              <button
                onClick={() => setEditingRuleId('new')}
                className="px-3.5 py-1.5 text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add New Rule
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rules.length === 0 ? (
              <div className="md:col-span-2 py-12 text-center text-slate-500">
                <ShieldAlert className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-sm font-semibold">No rules in the database.</p>
                <p className="text-xs text-slate-600 mt-1">Click "Add New Rule" to create one.</p>
              </div>
            ) : (
              rules.map((rule) => (
                <div 
                  key={rule.id}
                  className={`p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
                    rule.visible 
                      ? 'bg-slate-950/60 border-amber-500/20 shadow-lg shadow-amber-500/[0.03]' 
                      : 'bg-slate-950/25 border-white/5 opacity-70'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-slate-900/80 rounded-xl border border-white/10 text-amber-400 flex items-center justify-center font-bold">
                          📜
                        </div>
                        <div>
                          <h4 className="text-sm font-display font-extrabold text-white tracking-wide">{rule.title}</h4>
                          <span className={`inline-block mt-1 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded border ${rule.badgeColor || 'bg-slate-500/10 text-slate-300 border-slate-500/20'}`}>
                            {rule.badge}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleEditRule(rule)}
                          className="p-1.5 bg-white/5 hover:bg-amber-500/15 text-slate-300 hover:text-amber-300 border border-white/10 hover:border-amber-500/30 rounded-lg transition-all cursor-pointer"
                          title="Edit Rule"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this tournament rule?')) {
                              deleteRule(rule.id);
                            }
                          }}
                          className="p-1.5 bg-white/5 hover:bg-red-500/15 text-slate-300 hover:text-red-300 border border-white/10 hover:border-red-500/30 rounded-lg transition-all cursor-pointer"
                          title="Delete Rule"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed font-sans mb-5">{rule.desc}</p>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-auto">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${rule.visible ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                      <span className="text-[10px] font-mono font-bold tracking-wider uppercase">
                        {rule.visible ? (
                          <span className="text-emerald-400">Publicly Visible</span>
                        ) : (
                          <span className="text-rose-400">Hidden / Draft</span>
                        )}
                      </span>
                    </div>

                    <button
                      onClick={() => toggleRuleVisibility(rule.id)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer border ${
                        rule.visible
                          ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/20'
                          : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/20'
                      }`}
                    >
                      {rule.visible ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          Hide
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          Unhide
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : activeSubTab === 'submissions' ? (
        <div className="space-y-6">
          {/* Submissions stats overview cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Pending reviews card */}
            <div className="glass-panel p-5 rounded-2xl relative overflow-hidden border border-amber-500/20 bg-slate-950/40">
              <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-full blur-xl" />
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest font-mono">Pending Submissions</p>
                  <h4 className="text-3xl font-display font-extrabold text-white mt-1">
                    {teams.filter(t => t.status === 'pending').length}
                  </h4>
                </div>
                <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-400">
                  <ClipboardList className="w-5 h-5 animate-pulse" />
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-2 font-sans">
                Forms awaiting admin approval & roster validation.
              </p>
            </div>

            {/* Approved teams card */}
            <div className="glass-panel p-5 rounded-2xl relative overflow-hidden border border-emerald-500/20 bg-slate-950/40">
              <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl" />
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest font-mono">Approved Teams</p>
                  <h4 className="text-3xl font-display font-extrabold text-white mt-1">
                    {teams.filter(t => !t.status || t.status === 'approved').length}
                  </h4>
                </div>
                <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-2 font-sans">
                Teams fully registered & visible in tournament roster.
              </p>
            </div>

            {/* Rejected reviews card */}
            <div className="glass-panel p-5 rounded-2xl relative overflow-hidden border border-rose-500/20 bg-slate-950/40">
              <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/5 rounded-full blur-xl" />
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest font-mono">Rejected Forms</p>
                  <h4 className="text-3xl font-display font-extrabold text-white mt-1">
                    {teams.filter(t => t.status === 'rejected').length}
                  </h4>
                </div>
                <div className="p-2.5 bg-rose-500/10 rounded-xl border border-rose-500/20 text-rose-400">
                  <XCircle className="w-5 h-5" />
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-2 font-sans">
                Submitted forms marked invalid or rejected.
              </p>
            </div>
          </div>

          {/* Filtering and search control bar */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between glass-panel p-4 rounded-2xl border border-white/5 bg-slate-900/10">
            {/* Filter buttons */}
            <div className="flex flex-wrap gap-1 w-full sm:w-auto">
              {(['pending', 'approved', 'rejected', 'all'] as const).map((filter) => {
                const count = filter === 'all' 
                  ? teams.length 
                  : filter === 'approved'
                  ? teams.filter(t => !t.status || t.status === 'approved').length
                  : teams.filter(t => t.status === filter).length;
                
                return (
                  <button
                    key={filter}
                    onClick={() => setSubmissionFilter(filter)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${
                      submissionFilter === filter
                        ? 'bg-blue-600 text-white font-extrabold shadow'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {filter} ({count})
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search team, captain, or village..."
                value={submissionSearch}
                onChange={(e) => setSubmissionSearch(e.target.value)}
                className="w-full glass-input pl-3 pr-8 py-1.5 text-xs text-white bg-slate-950/40 border-white/5 focus:border-white/15 focus:ring-0 rounded-lg font-sans"
              />
              {submissionSearch && (
                <button 
                  onClick={() => setSubmissionSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Submissions List */}
          <div className="space-y-3">
            {(() => {
              const filtered = teams.filter((team) => {
                // Filter by status
                if (submissionFilter !== 'all') {
                  const isApproved = !team.status || team.status === 'approved';
                  if (submissionFilter === 'pending' && team.status !== 'pending') return false;
                  if (submissionFilter === 'approved' && !isApproved) return false;
                  if (submissionFilter === 'rejected' && team.status !== 'rejected') return false;
                }

                // Filter by search
                if (submissionSearch) {
                  const search = submissionSearch.toLowerCase();
                  const matchTeam = team.teamName.toLowerCase().includes(search);
                  const matchCap = team.captainName.toLowerCase().includes(search);
                  const matchVillage = team.village.toLowerCase().includes(search);
                  return matchTeam || matchCap || matchVillage;
                }

                return true;
              });

              if (filtered.length === 0) {
                return (
                  <div className="glass-panel p-12 rounded-3xl text-center border border-white/5">
                    <ClipboardList className="w-10 h-10 text-slate-600 mx-auto mb-3 opacity-60" />
                    <p className="text-slate-400 text-sm font-display font-semibold">No submissions found</p>
                    <p className="text-slate-500 text-xs mt-1">There are no team registrations matching your criteria.</p>
                  </div>
                );
              }

              return filtered.map((team) => {
                const isExpanded = expandedRosterTeamId === team.id;
                const isPending = team.status === 'pending';
                const isApproved = !team.status || team.status === 'approved';
                const isRejected = team.status === 'rejected';

                return (
                  <motion.div
                    key={team.id}
                    layoutId={`submission-card-${team.id}`}
                    className={`glass-panel p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
                      isPending 
                        ? 'border-amber-500/10 hover:border-amber-500/25 bg-slate-950/20' 
                        : isApproved 
                        ? 'border-emerald-500/10 hover:border-emerald-500/25 bg-slate-950/15'
                        : 'border-rose-500/10 hover:border-rose-500/25 bg-slate-950/25 opacity-75'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left: Team and Captain info */}
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${team.teamColor} flex items-center justify-center font-display font-black text-white shadow shadow-black/40 flex-shrink-0`}>
                          T
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-display font-bold text-white">{team.teamName}</h4>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
                              isPending 
                                ? 'bg-amber-500/15 border border-amber-500/20 text-amber-300' 
                                : isApproved 
                                ? 'bg-emerald-500/15 border border-emerald-500/20 text-emerald-300' 
                                : 'bg-rose-500/15 border border-rose-500/20 text-rose-300'
                            }`}>
                              {team.status || 'approved'}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1.5 mt-2.5 text-xs text-slate-400">
                            <span className="flex items-center gap-1.5">
                              <span className="text-slate-500">Captain:</span> 
                              <span className="font-semibold text-slate-200">{team.captainName}</span>
                            </span>
                            <span className="flex items-center gap-1.5">
                              <span className="text-slate-500">Village:</span> 
                              <span className="font-semibold text-slate-200 flex items-center gap-0.5">
                                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                                {team.village}
                              </span>
                            </span>
                            <span className="flex items-center gap-1.5">
                              <span className="text-slate-500">Mobile:</span> 
                              <a href={`tel:${team.contactNumber}`} className="font-mono font-bold text-blue-400 hover:underline flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {team.contactNumber}
                              </a>
                            </span>
                          </div>

                          <p className="text-[10.5px] text-slate-500 mt-2 font-sans">
                            <span className="text-blue-300 font-semibold">Designated Icon Player:</span> {team.iconPlayer} • <span className="text-slate-400 font-semibold">{team.players?.length || 0} roster spots</span>
                          </p>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex flex-wrap items-center gap-2 lg:self-center">
                        {/* Expand Roster button */}
                        <button
                          onClick={() => setExpandedRosterTeamId(isExpanded ? null : team.id)}
                          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white font-semibold text-[11px] rounded-lg border border-white/5 transition-all flex items-center gap-1 cursor-pointer"
                        >
                          {isExpanded ? 'Hide Roster' : `View Roster (${team.players?.length || 0})`}
                        </button>

                        {/* Approve button */}
                        {!isApproved && (
                          <button
                            onClick={() => approveTeam(team.id)}
                            className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-white font-extrabold text-[11px] rounded-lg border border-emerald-500/30 hover:border-emerald-500 transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve
                          </button>
                        )}

                        {/* Reject button */}
                        {!isRejected && (
                          <button
                            onClick={() => rejectTeam(team.id)}
                            className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white font-extrabold text-[11px] rounded-lg border border-rose-500/20 hover:border-rose-600 transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" /> Reject
                          </button>
                        )}

                        {/* Mark Pending button (undo approval or rejection) */}
                        {!isPending && (
                          <button
                            onClick={() => setTeamPending(team.id)}
                            className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-600 text-amber-400 hover:text-white font-extrabold text-[11px] rounded-lg border border-amber-500/20 hover:border-amber-600 transition-all flex items-center gap-1 cursor-pointer"
                            title="Send back to pending queue"
                          >
                            <Undo className="w-3.5 h-3.5" /> Mark Pending
                          </button>
                        )}

                        {/* Edit Shortcut button */}
                        <button
                          onClick={() => {
                            setActiveSubTab('teams');
                            startEditTeam(team);
                          }}
                          className="p-1.5 hover:bg-blue-500/15 text-blue-400 rounded-lg border border-transparent hover:border-blue-500/20 transition-all cursor-pointer"
                          title="Edit full submission details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete permanently button */}
                        <button
                          onClick={() => deleteTeam(team.id)}
                          className="p-1.5 hover:bg-red-500/15 text-red-400 hover:text-red-300 rounded-lg border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
                          title="Permanently delete form"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Collapsible Roster list */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 pt-4 border-t border-white/5 overflow-hidden"
                        >
                          <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-2">Team Roster Construction</h5>
                          <div className="flex flex-wrap gap-1.5">
                            {team.players && team.players.length > 0 ? (
                              team.players.map((p, pIdx) => (
                                <span 
                                  key={pIdx} 
                                  className={`px-2.5 py-1 rounded-lg text-xs font-sans ${
                                    p.includes('(C)') 
                                      ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold' 
                                      : p.includes('(Icon)') 
                                      ? 'bg-blue-500/10 text-blue-300 border border-blue-500/20 font-bold' 
                                      : 'bg-white/5 text-slate-300 border border-white/5'
                                  }`}
                                >
                                  {p}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-slate-500 italic">No players in this roster.</span>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              });
            })()}
          </div>
        </div>
      ) : activeSubTab === 'visibility' ? (
        <div className="border border-white/5 rounded-2xl bg-slate-950/20 overflow-hidden">
          {/* VISIBILITY CONTROLS GRID */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 bg-slate-900/30">
            {visibilitySections.map((sec) => {
              const isVisible = visibility[sec.key];
              return (
                <div 
                  key={sec.key} 
                  className={`p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
                    isVisible 
                      ? 'bg-slate-950/60 border-emerald-500/20 shadow-lg shadow-emerald-500/[0.03]' 
                      : 'bg-slate-950/25 border-white/5 opacity-70'
                  }`}
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-white/[0.01] rounded-full blur-2xl pointer-events-none" />
                  
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-slate-900/80 rounded-xl border border-white/10 flex items-center justify-center">
                        {sec.icon}
                      </div>
                      <h4 className="text-sm font-display font-extrabold text-white tracking-wide">{sec.title}</h4>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed font-sans mb-5">{sec.desc}</p>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-auto">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${isVisible ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                      <span className="text-[10px] font-mono font-bold tracking-wider uppercase">
                        {isVisible ? (
                          <span className="text-emerald-400">Visible</span>
                        ) : (
                          <span className="text-rose-400">Hidden</span>
                        )}
                      </span>
                    </div>

                    <button
                      onClick={() => toggleVisibility(sec.key)}
                      id={`toggle-visibility-${sec.key}`}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer border ${
                        isVisible
                          ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/20'
                          : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/20'
                      }`}
                    >
                      {isVisible ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          Hide
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          Unhide
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : activeSubTab === 'music' ? (
        /* BACKGROUND MUSIC UPLOAD/MANAGE PANEL */
        <div className="border border-white/5 rounded-2xl bg-slate-950/20 p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/5">
            <div>
              <h3 className="text-base font-display font-bold text-white flex items-center gap-2">
                <Music className="w-5 h-5 text-emerald-400" />
                Background Anthem Upload Center
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Upload your custom background theme music (MP3, WAV, or OGG). It will play infinitely and auto-loop for all visitors on the portal!
              </p>
            </div>
            {adminAudioFile && (
              <button
                onClick={async () => {
                  if (isAdminAudioPlaying) {
                    adminAudioRef.current?.pause();
                    setIsAdminAudioPlaying(false);
                  }
                  await deleteCustomAudio();
                  await loadAdminAudio();
                  showNotification('Background music removed successfully.', 'success');
                }}
                className="px-3.5 py-1.5 text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Trash className="w-3.5 h-3.5" />
                Remove Music
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* UPLOAD BOX */}
            <div className="p-8 rounded-2xl border-2 border-dashed border-white/10 hover:border-emerald-500/30 bg-slate-950/40 text-center flex flex-col items-center justify-center transition-all relative overflow-hidden group">
              <input
                type="file"
                accept="audio/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    await saveCustomAudio(file);
                    await loadAdminAudio();
                    showNotification(`"${file.name}" uploaded successfully! Looping is active.`, 'success');
                  } catch (err) {
                    showNotification('Failed to upload background music.', 'error');
                  }
                }}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
              />
              <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-300 mb-4 group-hover:scale-110 transition-transform duration-300">
                <Upload className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-display font-extrabold text-white mb-1">
                Drag & drop or Click to Upload
              </h4>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                Supports standard audio formats (MP3, WAV, OGG, M4A) up to 100MB.
              </p>
            </div>

            {/* STATUS & PREVIEW */}
            <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/40 flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-slate-500 block mb-2">
                  System Status
                </span>
                
                {adminAudioFile ? (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3.5 bg-slate-950/60 p-4 rounded-xl border border-white/5">
                      <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
                        <Music className="w-5 h-5 animate-pulse" />
                      </div>
                      <div className="overflow-hidden">
                        <h5 className="text-xs font-display font-bold text-white truncate">
                          {adminAudioFile.name}
                        </h5>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Size: {(adminAudioFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10 text-[11px] text-emerald-300/90 leading-relaxed font-sans font-medium">
                      💡 <strong>Active:</strong> This custom audio is now saved locally and will load for everyone. It will automatically loop endlessly!
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-500">
                    <Music className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    <p className="text-xs">No custom background music uploaded yet.</p>
                    <p className="text-[10px] text-slate-600 mt-1">Default APL Theme Song/Atmosphere active.</p>
                  </div>
                )}
              </div>

              {/* Preview Player Actions */}
              {adminAudioFile && (
                <div className="border-t border-white/5 pt-4 mt-6 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isAdminAudioPlaying ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                      {isAdminAudioPlaying ? 'Playing preview' : 'Idle preview'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={playAdminAudio}
                      disabled={isAdminAudioPlaying}
                      className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 border transition-all cursor-pointer ${
                        isAdminAudioPlaying
                          ? 'bg-slate-800/10 text-slate-500 border-white/5 cursor-not-allowed opacity-50'
                          : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/20'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5" /> Play Preview
                    </button>

                    <button
                      onClick={pauseAdminAudio}
                      disabled={!isAdminAudioPlaying}
                      className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 border transition-all cursor-pointer ${
                        !isAdminAudioPlaying
                          ? 'bg-slate-800/10 text-slate-500 border-white/5 cursor-not-allowed opacity-50'
                          : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/20'
                      }`}
                    >
                      <Pause className="w-3.5 h-3.5" /> Pause Preview
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Hidden Preview player audio tag */}
          <audio 
            ref={adminAudioRef} 
            onEnded={() => setIsAdminAudioPlaying(false)}
            loop 
          />
        </div>
      ) : activeSubTab === 'security' && adminEmail?.toLowerCase() === 'mdaziz01092004@gmail.com' ? (
        /* ADMINS & SECURITY PANEL */
        <div className="border border-white/5 rounded-2xl bg-slate-950/20 p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/5">
            <div>
              <h3 className="text-base font-display font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-400" />
                Admins & Console Security
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Configure who can access the admin dashboard. As the main administrator, you can add sub-admins and change the console master password.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* SUB-ADMINS MANAGEMENT */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-white font-semibold font-display text-sm">
                <Users className="w-4 h-4 text-indigo-400" />
                Sub-Admin Accounts
              </div>
              
              <div className="bg-slate-950/40 border border-white/5 p-5 rounded-2xl space-y-4">
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const email = newSubAdminEmail.trim().toLowerCase();
                    if (!email) return;
                    if (email === 'mdaziz01092004@gmail.com') {
                      showNotification('mdaziz01092004@gmail.com is already the Main Admin.', 'error');
                      return;
                    }
                    onAddSubAdmin(email);
                    setNewSubAdminEmail('');
                    showNotification(`Sub-Admin "${email}" added successfully!`, 'success');
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="email"
                    required
                    placeholder="Sub-admin email address"
                    value={newSubAdminEmail}
                    onChange={(e) => setNewSubAdminEmail(e.target.value)}
                    className="flex-1 bg-slate-900/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/40 transition-all font-sans"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Email
                  </button>
                </form>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {/* Main Admin row */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-indigo-300">mdaziz01092004@gmail.com</span>
                      <span className="text-[10px] text-slate-500 font-sans mt-0.5">Primary/Main Owner</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-[9px] font-mono text-indigo-300 font-extrabold tracking-wider border border-indigo-500/20">
                      MAIN OWNER
                    </span>
                  </div>

                  {/* Registered Sub Admins */}
                  {subAdmins.length === 0 ? (
                    <div className="text-center py-6 text-slate-500 text-xs italic">
                      No additional sub-admins registered.
                    </div>
                  ) : (
                    subAdmins.map((subEmail) => (
                      <div 
                        key={subEmail} 
                        className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all"
                      >
                        <span className="text-xs text-slate-300 truncate max-w-[200px]">{subEmail}</span>
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to remove sub-admin access for "${subEmail}"?`)) {
                              onRemoveSubAdmin(subEmail);
                              showNotification(`Removed sub-admin "${subEmail}"`, 'success');
                            }
                          }}
                          className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/10 text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 transition-all cursor-pointer"
                          title="Revoke access"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* PASSWORD SECURITY */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-white font-semibold font-display text-sm">
                <Settings className="w-4 h-4 text-indigo-400" />
                Change Master Admin Password
              </div>

              <div className="bg-slate-950/40 border border-white/5 p-5 rounded-2xl space-y-4">
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  Updating this password will change the access code for both the Main Admin and all authorized Sub-Admins. Make sure to share it securely with your team!
                </p>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const trimmed = newPasswordInput.trim();
                    if (trimmed.length < 4) {
                      setPasswordUpdateStatus('Password must be at least 4 characters long.');
                      return;
                    }
                    onUpdatePassword(trimmed);
                    setNewPasswordInput('');
                    setPasswordUpdateStatus(null);
                    showNotification('Master console password updated successfully!', 'success');
                  }}
                  className="space-y-3"
                >
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400 font-sans">New Admin Password</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        placeholder="e.g. securePass2026"
                        value={newPasswordInput}
                        onChange={(e) => setNewPasswordInput(e.target.value)}
                        className="flex-1 bg-slate-900/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/40 transition-all font-mono"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                      >
                        Update
                      </button>
                    </div>
                  </div>

                  {passwordUpdateStatus && (
                    <p className="text-[10px] text-rose-400 font-sans">{passwordUpdateStatus}</p>
                  )}
                </form>
              </div>
            </div>
          </div>
        </div>
      ) : activeSubTab === 'whatsapp' ? (
        <div className="border border-white/5 rounded-2xl bg-slate-950/20 p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/5">
            <div>
              <h3 className="text-base font-display font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-400" />
                WhatsApp Contact Customizer
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Customize contact persons, phone numbers, and default WhatsApp messages that appear on the public pages and the floating buttons.
              </p>
            </div>
            {!editingWhatsAppId && (
              <button
                onClick={startAddWhatsApp}
                className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Contact Button
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {whatsAppContacts.length === 0 ? (
              <div className="md:col-span-2 py-12 text-center text-slate-500">
                <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-sm font-semibold">No WhatsApp contact buttons created.</p>
                <p className="text-xs text-slate-600 mt-1">Click "Add Contact Button" to create one.</p>
              </div>
            ) : (
              whatsAppContacts.map((contact) => (
                <div 
                  key={contact.id}
                  className={`p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
                    contact.visible 
                      ? 'bg-slate-950/60 border-emerald-500/20 shadow-lg shadow-emerald-500/[0.03]' 
                      : 'bg-slate-950/25 border-white/5 opacity-70'
                  }`}
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/[0.02] rounded-full blur-2xl pointer-events-none" />
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-display font-bold text-white flex items-center gap-2">
                        {contact.name}
                      </h4>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider uppercase ${
                        contact.visible 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {contact.visible ? 'Visible' : 'Hidden'}
                      </span>
                    </div>

                    <div className="text-xs text-emerald-400 font-mono flex items-center gap-1.5 mb-3">
                      <Phone className="w-3.5 h-3.5" />
                      +{contact.phone}
                    </div>

                    <div className="text-xs bg-slate-950/50 border border-white/5 p-3 rounded-xl mb-4">
                      <span className="block text-[9px] text-slate-500 uppercase font-bold tracking-wider mb-1">Pre-filled Chat Message</span>
                      <p className="text-slate-300 font-sans leading-relaxed italic">"{contact.message}"</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-auto">
                    <button
                      onClick={() => toggleWhatsAppVisibility(contact.id)}
                      className={`text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                        contact.visible ? 'text-rose-400 hover:text-rose-300' : 'text-emerald-400 hover:text-emerald-300'
                      }`}
                    >
                      {contact.visible ? (
                        <>
                          <EyeOff className="w-4 h-4" /> Hide Button
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4" /> Show Button
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEditWhatsApp(contact)}
                        className="p-1.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg border border-white/5 hover:border-white/10 transition-all flex items-center gap-1 cursor-pointer text-xs font-semibold"
                        title="Edit Contact details"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => deleteWhatsAppContact(contact.id)}
                        className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 rounded-lg border border-rose-500/10 hover:border-rose-500/20 transition-all flex items-center gap-1 cursor-pointer text-xs font-semibold"
                        title="Delete contact button"
                      >
                        <Trash className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : activeSubTab === 'users' ? (
        <div className="border border-white/5 rounded-2xl bg-slate-950/20 p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/5">
            <div>
              <h3 className="text-base font-display font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-sky-400 animate-pulse" />
                User Accounts & Session Tracking Manager
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Monitor and manage registered user credentials, login/logout session frequencies, and security activity histories.
              </p>
            </div>
            {!isAddingUser && !editingUserPhone && (
              <button
                onClick={() => {
                  setIsAddingUser(true);
                  setUserForm({ fullName: '', mobileNumber: '' });
                }}
                className="px-3.5 py-1.5 text-xs font-semibold bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/20 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add User manually
              </button>
            )}
          </div>

          {/* User Session Analytics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/5 to-transparent border border-emerald-500/10 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-400 font-mono tracking-wider uppercase">Total Signups</span>
                <UserPlus className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold font-mono text-white mt-2">
                {registeredUsers.length}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">Unique registered mobile accounts</p>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-sky-500/5 to-transparent border border-sky-500/10 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-sky-400 font-mono tracking-wider uppercase">Total Logins</span>
                <LogIn className="w-4 h-4 text-sky-400" />
              </div>
              <p className="text-2xl font-bold font-mono text-white mt-2">
                {registeredUsers.reduce((sum, u) => sum + (u.loginCount || 0), 0)}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">Successful authenticate logs</p>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-rose-500/5 to-transparent border border-rose-500/10 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-rose-400 font-mono tracking-wider uppercase">Total Logouts</span>
                <LogOut className="w-4 h-4 text-rose-400" />
              </div>
              <p className="text-2xl font-bold font-mono text-white mt-2">
                {registeredUsers.reduce((sum, u) => sum + (u.logoutCount || 0), 0)}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">Graceful session endings logged</p>
            </div>
          </div>

          {/* User Add/Edit Forms */}
          {(isAddingUser || editingUserPhone) && (
            <div className="glass-panel p-5 rounded-2xl border border-white/10 bg-slate-950/30 space-y-4 max-w-xl">
              <h4 className="text-sm font-display font-bold text-white flex items-center gap-2">
                {isAddingUser ? <Plus className="w-4 h-4 text-sky-400" /> : <Edit2 className="w-4 h-4 text-sky-400" />}
                {isAddingUser ? 'Register New User Manual Account' : 'Edit User Profile / Credentials'}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
                  <input
                    type="text"
                    value={userForm.fullName || ''}
                    onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })}
                    placeholder="e.g. John Doe"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500/50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Mobile Number (Login Key)</label>
                  <input
                    type="text"
                    value={userForm.mobileNumber || ''}
                    onChange={(e) => setUserForm({ ...userForm, mobileNumber: e.target.value })}
                    placeholder="e.g. 9876543210"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500/50"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    setIsAddingUser(false);
                    setEditingUserPhone(null);
                    setUserForm({ fullName: '', mobileNumber: '' });
                  }}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!userForm.fullName?.trim() || !userForm.mobileNumber?.trim()) {
                      showNotification('Please fill in both full name and mobile number fields.', 'error');
                      return;
                    }
                    try {
                      const userToSave: AppUser = {
                        fullName: userForm.fullName.trim(),
                        mobileNumber: userForm.mobileNumber.trim()
                      };
                      if (editingUserPhone) {
                        await onUpdateUser(editingUserPhone, userToSave);
                        showNotification('User updated successfully!');
                      } else {
                        // Check if phone number already exists
                        const exists = registeredUsers.some(u => u.mobileNumber === userToSave.mobileNumber);
                        if (exists) {
                          showNotification('This mobile number is already registered.', 'error');
                          return;
                        }
                        await onUpdateUser(userToSave.mobileNumber, userToSave);
                        showNotification('New user account added successfully!');
                      }
                      setIsAddingUser(false);
                      setEditingUserPhone(null);
                      setUserForm({ fullName: '', mobileNumber: '' });
                    } catch (err: any) {
                      showNotification(err.message || 'Error saving user', 'error');
                    }
                  }}
                  className="px-4 py-1.5 text-xs font-bold bg-sky-500 text-slate-950 hover:bg-sky-400 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  {isAddingUser ? 'Register User' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {/* Search bar & statistics */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 max-w-sm w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5">
              <span className="text-slate-400 text-xs">🔍</span>
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search users by name or phone..."
                className="w-full bg-transparent border-none text-xs text-white focus:outline-none placeholder-slate-500"
              />
              {userSearch && (
                <button onClick={() => setUserSearch('')} className="text-slate-400 hover:text-white text-xs">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            
            <div className="flex gap-4 text-xs">
              <div className="px-3 py-1.5 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-slate-400 font-mono">Total Filtered:</span>{' '}
                <span className="text-sky-400 font-bold font-mono">
                  {registeredUsers.filter(u => {
                    const s = userSearch.toLowerCase();
                    return u.fullName.toLowerCase().includes(s) || u.mobileNumber.includes(s);
                  }).length}
                </span>
              </div>
            </div>
          </div>

          {/* Users List Table */}
          <div className="overflow-x-auto border border-white/5 rounded-xl bg-slate-950/45">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  <th className="p-4">Full Name & Registered</th>
                  <th className="p-4">Mobile Number / key</th>
                  <th className="p-4">Sessions metrics</th>
                  <th className="p-4">Last login time</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {registeredUsers.filter(u => {
                  const s = userSearch.toLowerCase();
                  return u.fullName.toLowerCase().includes(s) || u.mobileNumber.includes(s);
                }).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500 italic text-xs">
                      {userSearch ? 'No registered users match your search query.' : 'No users currently registered.'}
                    </td>
                  </tr>
                ) : (
                  registeredUsers
                    .filter(u => {
                      const s = userSearch.toLowerCase();
                      return u.fullName.toLowerCase().includes(s) || u.mobileNumber.includes(s);
                    })
                    .map((user) => (
                      <tr key={user.mobileNumber} className="hover:bg-white/[0.01] transition-all">
                        <td className="p-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 font-bold text-xs uppercase font-mono">
                              {user.fullName.substring(0, 2)}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-white">{user.fullName}</p>
                              <p className="text-[9px] text-slate-400 font-mono mt-0.5">
                                Reg: {formatDateTime(user.registeredAt)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-mono text-xs text-sky-300">
                          {user.mobileNumber}
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1.5 items-center">
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono font-semibold text-emerald-300" title="Signups">
                              S: 1
                            </span>
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/20 text-[10px] font-mono font-semibold text-sky-300" title="Total Logins">
                              L: {user.loginCount || 0}
                            </span>
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-[10px] font-mono font-semibold text-rose-300" title="Total Logouts">
                              O: {user.logoutCount || 0}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-xs font-mono">
                          {user.lastLoginAt ? (
                            <div>
                              <p className="text-slate-200">{formatDateTime(user.lastLoginAt)}</p>
                              {user.lastLogoutAt && new Date(user.lastLogoutAt) > new Date(user.lastLoginAt) && (
                                <p className="text-[10px] text-rose-400/80 mt-0.5">Logged out at {new Date(user.lastLogoutAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-500 italic">Never logged in</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedUserForLogs(user.mobileNumber)}
                              className="p-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 hover:bg-sky-500/20 transition-all cursor-pointer flex items-center gap-1"
                              title="View Activity Logs"
                            >
                              <Activity className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-semibold font-sans">Logs</span>
                            </button>
                            <button
                              onClick={() => {
                                setEditingUserPhone(user.mobileNumber);
                                setIsAddingUser(false);
                                setUserForm({ fullName: user.fullName, mobileNumber: user.mobileNumber });
                              }}
                              className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
                              title="Edit User Info"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={async () => {
                                if (confirm(`Are you sure you want to delete user ${user.fullName}? This will block their login and remove their registrations.`)) {
                                  try {
                                    await onDeleteUser(user.mobileNumber);
                                    showNotification(`Deleted user account: ${user.fullName}`);
                                  } catch (err: any) {
                                    showNotification(err.message || 'Error deleting user', 'error');
                                  }
                                }
                              }}
                              className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition-all cursor-pointer"
                              title="Delete User"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>

          {/* User Session History Log Detail Modal Overlay */}
          <AnimatePresence>
            {selectedUserForLogs && (() => {
              const user = registeredUsers.find(u => u.mobileNumber === selectedUserForLogs);
              if (!user) return null;
              
              // Backwards compatible fallback activities builder
              let userActivities = user.activities || [];
              if (userActivities.length === 0) {
                const generated: any[] = [];
                if (user.registeredAt) {
                  generated.push({ type: 'signup', timestamp: user.registeredAt });
                  generated.push({ type: 'login', timestamp: user.registeredAt });
                }
                if (user.lastLoginAt) {
                  const alreadyHasRegLogin = user.registeredAt && Math.abs(new Date(user.lastLoginAt).getTime() - new Date(user.registeredAt).getTime()) < 10000;
                  if (!alreadyHasRegLogin) {
                    generated.push({ type: 'login', timestamp: user.lastLoginAt });
                  }
                }
                if (user.lastLogoutAt) {
                  generated.push({ type: 'logout', timestamp: user.lastLogoutAt });
                }
                userActivities = generated;
              }

              return (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500"></div>
                    
                    <div className="flex items-center justify-between pb-4 border-b border-white/5">
                      <div>
                        <h4 className="text-base font-display font-bold text-white flex items-center gap-2">
                          <Activity className="w-5 h-5 text-sky-400 animate-pulse" />
                          User Authentication Tracker Logs
                        </h4>
                        <p className="text-xs text-slate-400 mt-1">
                          Timeline activity history for <span className="text-sky-300 font-semibold">{user.fullName}</span>
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedUserForLogs(null)}
                        className="p-1 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Stats metrics */}
                    <div className="grid grid-cols-3 gap-3 my-4">
                      <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-center">
                        <span className="block text-[10px] uppercase font-mono tracking-wider text-emerald-400">Registrations</span>
                        <span className="text-lg font-bold font-mono text-emerald-300 mt-0.5 block">1</span>
                      </div>
                      <div className="p-3 rounded-xl bg-sky-500/5 border border-sky-500/10 text-center">
                        <span className="block text-[10px] uppercase font-mono tracking-wider text-sky-400">Total Logins</span>
                        <span className="text-lg font-bold font-mono text-sky-300 mt-0.5 block">{user.loginCount || 0}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/10 text-center">
                        <span className="block text-[10px] uppercase font-mono tracking-wider text-rose-400">Total Logouts</span>
                        <span className="text-lg font-bold font-mono text-rose-300 mt-0.5 block">{user.logoutCount || 0}</span>
                      </div>
                    </div>

                    {/* Activity Timeline List */}
                    <div className="max-h-[300px] overflow-y-auto space-y-4 pr-1">
                      {userActivities.length === 0 ? (
                        <div className="text-center py-10 text-slate-500 text-xs italic">
                          No session activities logged yet.
                        </div>
                      ) : (
                        <div className="relative border-l border-white/5 ml-4 pl-6 space-y-4 py-2">
                          {[...userActivities]
                            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                            .map((act, idx) => (
                              <div key={idx} className="relative">
                                {/* Timeline icon tag */}
                                <span className={`absolute -left-[33px] top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-slate-900 border ${
                                  act.type === 'signup' 
                                    ? 'border-emerald-500 text-emerald-400 bg-emerald-950/20' 
                                    : act.type === 'login'
                                    ? 'border-sky-500 text-sky-400 bg-sky-950/20'
                                    : 'border-rose-500 text-rose-400 bg-rose-950/20'
                                }`}>
                                  {act.type === 'signup' ? (
                                    <UserPlus className="w-2.5 h-2.5" />
                                  ) : act.type === 'login' ? (
                                    <LogIn className="w-2.5 h-2.5" />
                                  ) : (
                                    <LogOut className="w-2.5 h-2.5" />
                                  )}
                                </span>
                                
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className={`text-[9px] font-semibold uppercase font-mono px-1.5 py-0.5 rounded ${
                                      act.type === 'signup'
                                        ? 'bg-emerald-500/10 text-emerald-300'
                                        : act.type === 'login'
                                        ? 'bg-sky-500/10 text-sky-300'
                                        : 'bg-rose-500/10 text-rose-300'
                                    }`}>
                                      {act.type === 'signup' ? 'Signup Successful' : act.type === 'login' ? 'User Login Session' : 'User Logout Session'}
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-mono">
                                      {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-300 mt-1">
                                    User performed {act.type === 'signup' ? 'first-time account signup' : act.type === 'login' ? 'dashboard portal login' : 'manual logout / session signout'} using mobile credential security key.
                                  </p>
                                  <p className="text-[9px] text-slate-500 font-mono mt-0.5">
                                    Timestamp: {new Date(act.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(act.timestamp).toLocaleTimeString()}
                                  </p>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center">
                      <span className="text-[10px] text-slate-500 font-mono">Device: Mobile Client Web Session</span>
                      <button
                        onClick={() => setSelectedUserForLogs(null)}
                        className="px-4 py-2 text-xs font-semibold bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all cursor-pointer"
                      >
                        Close Portal Tracker
                      </button>
                    </div>
                  </motion.div>
                </div>
              );
            })()}
          </AnimatePresence>
        </div>
      ) : (
        /* Fallback empty view or error state */
        <div className="p-8 text-center text-slate-500 italic text-xs">
          Select an administrator sub-tab from the navigation bar above.
        </div>
      )}

      {/* Global Add Item Button row for current selected Tab */}
      <div className="mt-4 flex gap-2">
        {activeSubTab === 'teams' && !editingTeamId && (
          <button
            onClick={startAddTeam}
            className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-display font-bold text-xs rounded-lg border border-blue-500/30 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Custom Team Slot
          </button>
        )}
        {activeSubTab === 'players' && !editingPlayerId && (
          <button
            onClick={startAddPlayer}
            className="px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 font-display font-bold text-xs rounded-lg border border-indigo-500/30 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Custom Draft Player
          </button>
        )}
        {activeSubTab === 'polls' && !editingPollId && (
          <button
            onClick={startAddPoll}
            className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-display font-bold text-xs rounded-lg border border-purple-500/30 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Custom Poll Option
          </button>
        )}
        {activeSubTab === 'rules' && !editingRuleId && (
          <button
            onClick={() => setEditingRuleId('new')}
            className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-display font-bold text-xs rounded-lg border border-amber-500/30 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Custom Tournament Rule
          </button>
        )}
        {activeSubTab === 'whatsapp' && !editingWhatsAppId && (
          <button
            onClick={startAddWhatsApp}
            className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-display font-bold text-xs rounded-lg border border-emerald-500/30 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add WhatsApp Contact Button
          </button>
        )}
        {activeSubTab === 'users' && !isAddingUser && !editingUserPhone && (
          <button
            onClick={() => {
              setIsAddingUser(true);
              setUserForm({ fullName: '', mobileNumber: '' });
            }}
            className="px-4 py-2 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 font-display font-bold text-xs rounded-lg border border-sky-500/30 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Custom User Account
          </button>
        )}
      </div>
    </div>
  );
}
