/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Team, PlayerRegistration, Poll, VisibilityConfig, Rule, AppUser, WhatsAppContact } from './types';
import { INITIAL_TEAMS, INITIAL_PLAYERS, INITIAL_POLLS, INITIAL_RULES } from './initialData';
import AudioPlayer from './components/AudioPlayer';
import PrizeMoney from './components/PrizeMoney';
import Rules from './components/Rules';
import RegistrationForm from './components/RegistrationForm';
import VotingSystem from './components/VotingSystem';
import AdminPanel from './components/AdminPanel';
import UserAuthModal from './components/UserAuthModal';

import { 
  Trophy, Calendar, MapPin, Users, Flame, Heart, AlertCircle, ShieldCheck, Mail, Phone, Info, Shield, Eye, EyeOff, Database, Menu, X, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import {
  isSupabaseConfigured,
  fetchTeamsDb,
  saveTeamDb,
  deleteTeamDb,
  fetchPlayersDb,
  savePlayerDb,
  deletePlayerDb,
  fetchPollsDb,
  savePollDb,
  deletePollDb,
  fetchRulesDb,
  saveRuleDb,
  deleteRuleDb,
  fetchSubAdminsDb,
  saveSubAdminDb,
  deleteSubAdminDb,
  fetchAdminPasswordDb,
  saveAdminPasswordDb,
  fetchUsersDb,
  saveUserDb,
  deleteUserDb,
  fetchWhatsAppContactsDb,
  saveWhatsAppContactsDb
} from './utils/supabase';

export default function App() {
  // Load initial states with localStorage persistence
  const [teams, setTeams] = useState<Team[]>(() => {
    const saved = localStorage.getItem('apl_2026_teams');
    return saved ? JSON.parse(saved) : INITIAL_TEAMS;
  });

  const [players, setPlayers] = useState<PlayerRegistration[]>(() => {
    const saved = localStorage.getItem('apl_2026_players');
    return saved ? JSON.parse(saved) : INITIAL_PLAYERS;
  });

  const [polls, setPolls] = useState<Poll[]>(() => {
    const saved = localStorage.getItem('apl_2026_polls');
    return saved ? JSON.parse(saved) : INITIAL_POLLS;
  });

  const [rules, setRules] = useState<Rule[]>(() => {
    const saved = localStorage.getItem('apl_2026_rules');
    return saved ? JSON.parse(saved) : INITIAL_RULES;
  });

  const [visibility, setVisibility] = useState<VisibilityConfig>(() => {
    const saved = localStorage.getItem('apl_2026_visibility');
    const defaults = {
      prizesFees: true,
      officialRules: true,
      registrations: true,
      votingPopularity: true,
      bgMusicPlayer: false // Hidden by default as requested!
    };
    if (saved) {
      try {
        return { ...defaults, ...JSON.parse(saved) };
      } catch (e) {
        return defaults;
      }
    }
    return defaults;
  });

  const [loggedInEmail, setLoggedInEmail] = useState<string | null>(() => {
    return localStorage.getItem('apl_logged_in_admin');
  });

  const [isAdminMode, setIsAdminMode] = useState<boolean>(() => {
    const loggedIn = localStorage.getItem('apl_logged_in_admin');
    if (!loggedIn) return false;
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash;
    return params.get('admin') === 'true' || hash === '#admin' || hash === '#admin-dashboard-deck';
  });

  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const [subAdmins, setSubAdmins] = useState<string[]>(() => {
    const saved = localStorage.getItem('apl_sub_admins');
    return saved ? JSON.parse(saved) : [];
  });

  const [adminPassword, setAdminPassword] = useState<string>(() => {
    return localStorage.getItem('apl_admin_password') || 'v93h13q49';
  });

  // User Accounts & Login state
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    const saved = localStorage.getItem('apl_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [registeredUsers, setRegisteredUsers] = useState<AppUser[]>(() => {
    const saved = localStorage.getItem('apl_registered_users');
    return saved ? JSON.parse(saved) : [];
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleRegisterUser = async (user: AppUser) => {
    const now = new Date().toISOString();
    const newUser: AppUser = {
      fullName: user.fullName.trim(),
      mobileNumber: user.mobileNumber.trim(),
      registeredAt: now,
      lastLoginAt: now,
      loginCount: 1,
      logoutCount: 0,
      activities: [
        { type: 'signup', timestamp: now },
        { type: 'login', timestamp: now }
      ]
    };

    const updated = [...registeredUsers, newUser];
    setRegisteredUsers(updated);
    localStorage.setItem('apl_registered_users', JSON.stringify(updated));
    if (isSupabaseConfigured) {
      try {
        await saveUserDb(newUser);
      } catch (err) {
        console.error('Error saving user to database:', err);
      }
    }
  };

  const handleDeleteUser = async (mobileNumber: string) => {
    const updated = registeredUsers.filter(u => u.mobileNumber !== mobileNumber);
    setRegisteredUsers(updated);
    localStorage.setItem('apl_registered_users', JSON.stringify(updated));
    if (isSupabaseConfigured) {
      try {
        await deleteUserDb(mobileNumber);
      } catch (err) {
        console.error('Error deleting user from database:', err);
      }
    }
  };

  const handleUpdateUser = async (oldMobile: string, updatedUser: AppUser) => {
    let updated = [...registeredUsers];
    const index = updated.findIndex(u => u.mobileNumber === oldMobile);
    
    // Preserve existing activities and login details if we are just updating info
    const target = index !== -1 ? updated[index] : null;
    const resolvedUser: AppUser = {
      ...updatedUser,
      registeredAt: updatedUser.registeredAt || target?.registeredAt || new Date().toISOString(),
      lastLoginAt: updatedUser.lastLoginAt || target?.lastLoginAt || undefined,
      lastLogoutAt: updatedUser.lastLogoutAt || target?.lastLogoutAt || undefined,
      loginCount: updatedUser.loginCount !== undefined ? updatedUser.loginCount : (target?.loginCount || 0),
      logoutCount: updatedUser.logoutCount !== undefined ? updatedUser.logoutCount : (target?.logoutCount || 0),
      activities: updatedUser.activities || target?.activities || []
    };

    if (index !== -1) {
      updated[index] = resolvedUser;
    } else {
      updated.push(resolvedUser);
    }
    setRegisteredUsers(updated);
    localStorage.setItem('apl_registered_users', JSON.stringify(updated));

    if (isSupabaseConfigured) {
      try {
        if (oldMobile !== resolvedUser.mobileNumber) {
          await deleteUserDb(oldMobile);
        }
        await saveUserDb(resolvedUser);
      } catch (err) {
        console.error('Error updating user in database:', err);
      }
    }
  };

  const handleLoginUser = async (user: AppUser) => {
    const now = new Date().toISOString();
    const target = registeredUsers.find(u => u.mobileNumber === user.mobileNumber);
    
    // Check if the last activity was already a login within the last 5 seconds to avoid duplication
    const lastActivity = target?.activities?.[target.activities.length - 1];
    const isRecentLogin = lastActivity && 
      lastActivity.type === 'login' && 
      (new Date(now).getTime() - new Date(lastActivity.timestamp).getTime() < 5000);

    if (target && isRecentLogin) {
      setCurrentUser(target);
      localStorage.setItem('apl_current_user', JSON.stringify(target));
      return;
    }

    const updatedUser: AppUser = {
      fullName: user.fullName,
      mobileNumber: user.mobileNumber,
      registeredAt: target?.registeredAt || user.registeredAt || now,
      lastLoginAt: now,
      lastLogoutAt: target?.lastLogoutAt || user.lastLogoutAt || undefined,
      loginCount: (target?.loginCount || user.loginCount || 0) + 1,
      logoutCount: target?.logoutCount || user.logoutCount || 0,
      activities: [
        ...(target?.activities || user.activities || []),
        { type: 'login', timestamp: now }
      ]
    };

    const updatedList = registeredUsers.map(u => 
      u.mobileNumber === user.mobileNumber ? updatedUser : u
    );
    if (!registeredUsers.some(u => u.mobileNumber === user.mobileNumber)) {
      updatedList.push(updatedUser);
    }
    
    setRegisteredUsers(updatedList);
    localStorage.setItem('apl_registered_users', JSON.stringify(updatedList));
    setCurrentUser(updatedUser);
    localStorage.setItem('apl_current_user', JSON.stringify(updatedUser));

    if (isSupabaseConfigured) {
      try {
        await saveUserDb(updatedUser);
      } catch (err) {
        console.error('Error updating user login database state:', err);
      }
    }
  };

  const handleLogoutUser = async () => {
    if (!currentUser) return;
    
    const now = new Date().toISOString();
    const target = registeredUsers.find(u => u.mobileNumber === currentUser.mobileNumber);
    
    const updatedUser: AppUser = {
      fullName: currentUser.fullName,
      mobileNumber: currentUser.mobileNumber,
      registeredAt: target?.registeredAt || currentUser.registeredAt || now,
      lastLoginAt: target?.lastLoginAt || currentUser.lastLoginAt || undefined,
      lastLogoutAt: now,
      loginCount: target?.loginCount || currentUser.loginCount || 1,
      logoutCount: (target?.logoutCount || currentUser.logoutCount || 0) + 1,
      activities: [
        ...(target?.activities || currentUser.activities || []),
        { type: 'logout', timestamp: now }
      ]
    };

    const updatedList = registeredUsers.map(u => 
      u.mobileNumber === currentUser.mobileNumber ? updatedUser : u
    );
    
    setRegisteredUsers(updatedList);
    localStorage.setItem('apl_registered_users', JSON.stringify(updatedList));
    setCurrentUser(null);
    localStorage.removeItem('apl_current_user');

    if (isSupabaseConfigured) {
      try {
        await saveUserDb(updatedUser);
      } catch (err) {
        console.error('Error updating user logout database state:', err);
      }
    }
  };

  // Automatically trigger mandatory signup modal after a few seconds if user is not logged in
  useEffect(() => {
    if (!currentUser) {
      const timer = setTimeout(() => {
        setIsAuthModalOpen(true);
      }, 4000); // 4 seconds delay
      return () => clearTimeout(timer);
    }
  }, [currentUser]);

  // WhatsApp Contacts State
  const [whatsAppContacts, setWhatsAppContacts] = useState<WhatsAppContact[]>(() => {
    const saved = localStorage.getItem('apl_whatsapp_contacts');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing WhatsApp contacts:', e);
      }
    }
    return [
      {
        id: 'wa-1',
        name: 'Aminul Islam Chowdhury',
        phone: '919883177907',
        message: "Hello Aminul Islam Chowdhury, I'm inquiring about the Andharia Premier League.",
        visible: true
      },
      {
        id: 'wa-2',
        name: 'MD Aziz',
        phone: '919593874231',
        message: "Hello MD Aziz, I'm inquiring about the Andharia Premier League.",
        visible: true
      }
    ];
  });

  const handleUpdateWhatsAppContacts = async (contacts: WhatsAppContact[]) => {
    setWhatsAppContacts(contacts);
    localStorage.setItem('apl_whatsapp_contacts', JSON.stringify(contacts));
    if (isSupabaseConfigured) {
      try {
        await saveWhatsAppContactsDb(contacts);
      } catch (err) {
        console.error('Error saving WhatsApp contacts to DB:', err);
      }
    }
  };

  useEffect(() => {
    const handleUrlChange = () => {
      const loggedIn = localStorage.getItem('apl_logged_in_admin');
      const params = new URLSearchParams(window.location.search);
      const isTryingAdmin = params.get('admin') === 'true' || window.location.hash === '#admin' || window.location.hash === '#admin-dashboard-deck';
      
      if (isTryingAdmin) {
        if (loggedIn) {
          setIsAdminMode(true);
        } else {
          setIsLoginModalOpen(true);
          setLoginError(null);
          setLoginEmail('');
          setLoginPassword('');
          // Revert hash/query to avoid loop if rejected
          window.location.hash = '';
        }
      }
    };
    window.addEventListener('hashchange', handleUrlChange);
    window.addEventListener('popstate', handleUrlChange);
    // Run once on mount to handle initial URL
    handleUrlChange();
    return () => {
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);

  const [supabaseStatus, setSupabaseStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [supabaseErrorMessage, setSupabaseErrorMessage] = useState<string | null>(null);

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Dynamic Supabase Fetching
  useEffect(() => {
    async function loadDataFromSupabase() {
      if (!isSupabaseConfigured) return;
      setSupabaseStatus('loading');
      try {
        // Fetch each main dataset individually with catch fallbacks so one missing table doesn't block others or crash the sync
        const dbTeams = await fetchTeamsDb().catch((err) => {
          console.warn('Failed to fetch teams from Supabase:', err);
          return null;
        });
        const dbPlayers = await fetchPlayersDb().catch((err) => {
          console.warn('Failed to fetch players from Supabase:', err);
          return null;
        });
        const dbPolls = await fetchPollsDb().catch((err) => {
          console.warn('Failed to fetch polls from Supabase:', err);
          return null;
        });
        const dbRules = await fetchRulesDb().catch((err) => {
          console.warn('Failed to fetch rules from Supabase:', err);
          return null;
        });

        let loadedAny = false;

        if (dbTeams && dbTeams.length > 0) {
          setTeams(dbTeams);
          localStorage.setItem('apl_2026_teams', JSON.stringify(dbTeams));
          loadedAny = true;
        }
        if (dbPlayers && dbPlayers.length > 0) {
          setPlayers(dbPlayers);
          localStorage.setItem('apl_2026_players', JSON.stringify(dbPlayers));
          loadedAny = true;
        }
        if (dbPolls && dbPolls.length > 0) {
          setPolls(dbPolls);
          localStorage.setItem('apl_2026_polls', JSON.stringify(dbPolls));
          loadedAny = true;
        }
        if (dbRules && dbRules.length > 0) {
          setRules(dbRules);
          localStorage.setItem('apl_2026_rules', JSON.stringify(dbRules));
          loadedAny = true;
        }

        // Try to fetch admins, settings, and users from database (completely non-blocking/isolated try-catch)
        try {
          const [dbSubAdmins, dbPassword, dbUsers, dbWhatsApp] = await Promise.all([
            fetchSubAdminsDb().catch(() => []),
            fetchAdminPasswordDb().catch(() => null),
            fetchUsersDb().catch(() => []),
            fetchWhatsAppContactsDb().catch(() => null)
          ]);
          if (dbSubAdmins && dbSubAdmins.length > 0) {
            setSubAdmins(dbSubAdmins);
            localStorage.setItem('apl_sub_admins', JSON.stringify(dbSubAdmins));
            loadedAny = true;
          }
          if (dbPassword) {
            setAdminPassword(dbPassword);
            localStorage.setItem('apl_admin_password', dbPassword);
            loadedAny = true;
          }
          if (dbUsers && dbUsers.length > 0) {
            setRegisteredUsers(dbUsers);
            localStorage.setItem('apl_registered_users', JSON.stringify(dbUsers));
            loadedAny = true;
          }
          if (dbWhatsApp && dbWhatsApp.length > 0) {
            setWhatsAppContacts(dbWhatsApp);
            localStorage.setItem('apl_whatsapp_contacts', JSON.stringify(dbWhatsApp));
            loadedAny = true;
          }
        } catch (adminErr) {
          console.warn('Could not load admins, users, whatsapp contacts or custom password from Supabase tables:', adminErr);
        }

        if (loadedAny) {
          setSupabaseStatus('success');
        } else {
          // If connection works but all tables are completely empty or don't exist yet
          setSupabaseStatus('error');
          setSupabaseErrorMessage('Supabase is connected but tables are empty. Make sure to run the setup SQL script in your Supabase dashboard.');
        }
      } catch (err: any) {
        console.error('Failed to load from Supabase:', err);
        setSupabaseStatus('error');
        setSupabaseErrorMessage(err.message || 'Make sure your Supabase credentials are correct and tables are set up.');
      }
    }
    loadDataFromSupabase();
  }, []);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date('2026-07-09T09:00:00') - +new Date();
      let left = { days: 0, hours: 0, minutes: 0, seconds: 0 };

      if (difference > 0) {
        left = {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        };
      }
      return left;
    };

    setTimeLeft(calculateTimeLeft());
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Sync team registration
  const handleAddTeam = async (newTeam: Team) => {
    const updated = [...teams, newTeam];
    setTeams(updated);
    localStorage.setItem('apl_2026_teams', JSON.stringify(updated));

    if (isSupabaseConfigured) {
      saveTeamDb(newTeam).catch(e => console.error('Supabase team sync failed:', e));
    }

    // Automatically register as voting option if not already present AND team is approved
    if (newTeam.status !== 'pending' && !polls.some(p => p.option.toLowerCase() === newTeam.teamName.toLowerCase())) {
      const newPoll: Poll = {
        id: `poll-${Date.now()}`,
        option: newTeam.teamName,
        votes: 0
      };
      const updatedPolls = [...polls, newPoll];
      setPolls(updatedPolls);
      localStorage.setItem('apl_2026_polls', JSON.stringify(updatedPolls));

      if (isSupabaseConfigured) {
        savePollDb(newPoll).catch(e => console.error('Supabase poll sync failed:', e));
      }
    }
  };

  // Sync individual player registration
  const handleAddPlayer = async (newPlayer: PlayerRegistration) => {
    const updated = [...players, newPlayer];
    setPlayers(updated);
    localStorage.setItem('apl_2026_players', JSON.stringify(updated));

    if (isSupabaseConfigured) {
      savePlayerDb(newPlayer).catch(e => console.error('Supabase player sync failed:', e));
    }
  };

  // Sync voting
  const handleVote = async (pollId: string) => {
    const updated = polls.map(p => p.id === pollId ? { ...p, votes: p.votes + 1 } : p);
    setPolls(updated);
    localStorage.setItem('apl_2026_polls', JSON.stringify(updated));

    if (isSupabaseConfigured) {
      const votedPoll = updated.find(p => p.id === pollId);
      if (votedPoll) {
        savePollDb(votedPoll).catch(e => console.error('Supabase vote sync failed:', e));
      }
    }
  };

  const handleUpdateTeams = (newTeams: Team[]) => {
    const prevTeams = teams;
    setTeams(newTeams);
    localStorage.setItem('apl_2026_teams', JSON.stringify(newTeams));

    if (isSupabaseConfigured) {
      const deleted = prevTeams.filter(t => !newTeams.some(nt => nt.id === t.id));
      deleted.forEach(t => {
        deleteTeamDb(t.id).catch(e => console.error('Failed to delete team in Supabase:', e));
      });
      newTeams.forEach(t => {
        saveTeamDb(t).catch(e => console.error('Failed to save team in Supabase:', e));
      });
    }

    // Check for newly approved teams and automatically create poll options for them
    let pollsUpdated = false;
    let currentPolls = [...polls];

    newTeams.forEach(t => {
      const isTeamApproved = !t.status || t.status === 'approved';
      if (isTeamApproved) {
        const hasPoll = currentPolls.some(p => p.option.toLowerCase() === t.teamName.toLowerCase());
        if (!hasPoll) {
          const newPoll: Poll = {
            id: `poll-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            option: t.teamName,
            votes: 0
          };
          currentPolls.push(newPoll);
          pollsUpdated = true;
          
          if (isSupabaseConfigured) {
            savePollDb(newPoll).catch(e => console.error('Supabase poll sync failed on approval:', e));
          }
        }
      }
    });

    if (pollsUpdated) {
      setPolls(currentPolls);
      localStorage.setItem('apl_2026_polls', JSON.stringify(currentPolls));
    }
  };

  const handleUpdatePlayers = (newPlayers: PlayerRegistration[]) => {
    const prevPlayers = players;
    setPlayers(newPlayers);
    localStorage.setItem('apl_2026_players', JSON.stringify(newPlayers));

    if (isSupabaseConfigured) {
      const deleted = prevPlayers.filter(p => !newPlayers.some(np => np.id === p.id));
      deleted.forEach(p => {
        deletePlayerDb(p.id).catch(e => console.error('Failed to delete player in Supabase:', e));
      });
      newPlayers.forEach(p => {
        savePlayerDb(p).catch(e => console.error('Failed to save player in Supabase:', e));
      });
    }
  };

  const handleUpdatePolls = (newPolls: Poll[]) => {
    const prevPolls = polls;
    setPolls(newPolls);
    localStorage.setItem('apl_2026_polls', JSON.stringify(newPolls));

    if (isSupabaseConfigured) {
      const deleted = prevPolls.filter(p => !newPolls.some(np => np.id === p.id));
      deleted.forEach(p => {
        deletePollDb(p.id).catch(e => console.error('Failed to delete poll in Supabase:', e));
      });
      newPolls.forEach(p => {
        savePollDb(p).catch(e => console.error('Failed to save poll in Supabase:', e));
      });
    }
  };

  const handleUpdateRules = (newRules: Rule[]) => {
    const prevRules = rules;
    setRules(newRules);
    localStorage.setItem('apl_2026_rules', JSON.stringify(newRules));

    if (isSupabaseConfigured) {
      const deleted = prevRules.filter(r => !newRules.some(nr => nr.id === r.id));
      deleted.forEach(r => {
        deleteRuleDb(r.id).catch(e => console.error('Failed to delete rule in Supabase:', e));
      });
      newRules.forEach(r => {
        saveRuleDb(r).catch(e => console.error('Failed to save rule in Supabase:', e));
      });
    }
  };

  const handleUpdateVisibility = (newVisibility: VisibilityConfig) => {
    setVisibility(newVisibility);
    localStorage.setItem('apl_2026_visibility', JSON.stringify(newVisibility));
  };

  const handleAddSubAdmin = async (email: string) => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    if (trimmed === 'mdaziz01092004@gmail.com') return; // already main
    if (subAdmins.includes(trimmed)) return; // already added

    const newSubAdmins = [...subAdmins, trimmed];
    setSubAdmins(newSubAdmins);
    localStorage.setItem('apl_sub_admins', JSON.stringify(newSubAdmins));

    if (isSupabaseConfigured) {
      try {
        await saveSubAdminDb(trimmed);
      } catch (err) {
        console.error('Failed to save sub-admin to Supabase:', err);
      }
    }
  };

  const handleRemoveSubAdmin = async (email: string) => {
    const trimmed = email.trim().toLowerCase();
    const newSubAdmins = subAdmins.filter(e => e !== trimmed);
    setSubAdmins(newSubAdmins);
    localStorage.setItem('apl_sub_admins', JSON.stringify(newSubAdmins));

    if (isSupabaseConfigured) {
      try {
        await deleteSubAdminDb(trimmed);
      } catch (err) {
        console.error('Failed to delete sub-admin from Supabase:', err);
      }
    }
  };

  const handleUpdatePassword = async (newPassword: string) => {
    const trimmed = newPassword.trim();
    if (!trimmed) return;
    setAdminPassword(trimmed);
    localStorage.setItem('apl_admin_password', trimmed);

    if (isSupabaseConfigured) {
      try {
        await saveAdminPasswordDb(trimmed);
      } catch (err) {
        console.error('Failed to save password to Supabase:', err);
      }
    }
  };

  const handleLogout = () => {
    setLoggedInEmail(null);
    setIsAdminMode(false);
    localStorage.removeItem('apl_logged_in_admin');
    localStorage.removeItem('apl_admin_mode');
    window.location.hash = ''; // Clear hash so it doesn't trigger admin check on reload
  };

  const handleActivateAdminClick = () => {
    if (loggedInEmail) {
      setIsAdminMode(true);
      localStorage.setItem('apl_admin_mode', 'true');
    } else {
      setIsLoginModalOpen(true);
      setLoginError(null);
      setLoginEmail('');
      setLoginPassword('');
    }
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-x-hidden selection:bg-blue-500/30 selection:text-blue-200">
      
      {/* Sticky Site Header with Logo and Hamburger Menu */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/5 py-3.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400 animate-pulse" />
            <span className="font-display font-black text-lg tracking-wider text-white">
              APL <span className="text-blue-400">2026</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* User Portal Profile indicator */}
            {currentUser ? (
              <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-xl">
                <User className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs font-semibold text-blue-300 max-w-[100px] truncate">{currentUser.fullName}</span>
                <button
                  onClick={handleLogoutUser}
                  className="text-[10px] text-rose-400 hover:text-rose-300 font-bold ml-1.5 hover:underline cursor-pointer"
                  title="Log out from user portal"
                >
                  LOGOUT
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}

            {/* Supabase Status Indicator (discreet, if configured) */}
            {isSupabaseConfigured && (
              <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono ${
                supabaseStatus === 'success' 
                  ? 'bg-emerald-500/10 text-emerald-400' 
                  : supabaseStatus === 'loading'
                  ? 'bg-amber-500/10 text-amber-400 animate-pulse'
                  : 'bg-rose-500/10 text-rose-400'
              }`} title={supabaseErrorMessage || "Supabase Sync Status"}>
                <Database className="w-3 h-3" />
                {supabaseStatus === 'success' ? 'SYNCED' : supabaseStatus === 'loading' ? 'SYNCING' : 'OFFLINE'}
              </span>
            )}

            {/* Hamburger Button */}
            <button
              onClick={() => setIsMenuOpen(true)}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer flex items-center justify-center"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Side Hamburger Menu Drawer */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="absolute inset-y-0 right-0 max-w-xs w-full bg-slate-900/95 border-l border-white/10 p-6 shadow-2xl flex flex-col justify-between backdrop-blur-md z-10 animate-fade-in">
            <div>
              {/* Header inside drawer */}
              <div className="flex items-center justify-between pb-6 border-b border-white/5 mb-6">
                <span className="font-display font-black text-lg tracking-wider text-white">
                  APL <span className="text-blue-400">2026</span>
                </span>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Navigation links */}
              <div className="space-y-4">
                <span className="block text-[10px] font-mono tracking-widest text-slate-500 uppercase">Navigation</span>
                
                {visibility.prizesFees && (
                  <a
                    href="#prizes-fees"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/5 text-slate-300 hover:text-white transition-all text-sm font-medium"
                  >
                    <Trophy className="w-4 h-4 text-amber-400" />
                    Prize Pool & Estimator
                  </a>
                )}

                {visibility.officialRules && (
                  <a
                    href="#official-rules"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/5 text-slate-300 hover:text-white transition-all text-sm font-medium"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Official Rules
                  </a>
                )}

                {visibility.registrations && (
                  <a
                    href="#registrations"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/5 text-slate-300 hover:text-white transition-all text-sm font-medium"
                  >
                    <Users className="w-4 h-4 text-blue-400" />
                    Register Player/Team
                  </a>
                )}

                {visibility.votingPopularity && (
                  <a
                    href="#voting-popularity"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/5 text-slate-300 hover:text-white transition-all text-sm font-medium"
                  >
                    <Flame className="w-4 h-4 text-indigo-400" />
                    Popularity Voting
                  </a>
                )}
              </div>

              {/* User Portal section inside Hamburger Drawer */}
              <div className="mt-6 pt-6 border-t border-white/5 space-y-3">
                <span className="block text-[10px] font-mono tracking-widest text-slate-500 uppercase">User Portal</span>
                {currentUser ? (
                  <div className="p-3 bg-slate-950/40 rounded-2xl border border-white/5 space-y-2">
                    <div className="flex items-center gap-2 text-white">
                      <User className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-bold truncate max-w-[150px]">{currentUser.fullName}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-sans font-mono">{currentUser.mobileNumber}</p>
                    <button
                      onClick={() => {
                        handleLogoutUser();
                        setIsMenuOpen(false);
                      }}
                      className="w-full py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-[10px] font-bold transition-all border border-rose-500/15 cursor-pointer text-center"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setIsAuthModalOpen(true);
                      setIsMenuOpen(false);
                    }}
                    className="w-full py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <User className="w-4 h-4" />
                    Sign In / Sign Up
                  </button>
                )}
              </div>
            </div>

            {/* Bottom Admin Control inside Hamburger Drawer */}
            <div className="pt-6 border-t border-white/5 space-y-4">
              <span className="block text-[10px] font-mono tracking-widest text-slate-500 uppercase">Controls</span>
              
              <div className="p-3 bg-slate-950/40 rounded-2xl border border-white/5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-semibold text-slate-300">Admin Console</span>
                  </div>
                  <span className={`w-2 h-2 rounded-full ${isAdminMode ? 'bg-indigo-400 animate-pulse' : 'bg-slate-600'}`} />
                </div>

                {loggedInEmail ? (
                  <div className="space-y-2">
                    <p className="text-[10px] text-slate-400 leading-relaxed break-all">
                      Logged in as: <strong className="text-indigo-300">{loggedInEmail}</strong>
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          setIsAdminMode(!isAdminMode);
                          setIsMenuOpen(false);
                        }}
                        className={`py-2 px-3 rounded-xl text-[10px] font-bold font-mono tracking-wider transition-all flex items-center justify-center cursor-pointer ${
                          isAdminMode
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20'
                            : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20'
                        }`}
                      >
                        {isAdminMode ? 'HIDE PANEL' : 'SHOW PANEL'}
                      </button>
                      <button
                        onClick={() => {
                          handleLogout();
                          setIsMenuOpen(false);
                        }}
                        className="py-2 px-3 bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-white/10 rounded-xl text-[10px] font-bold font-mono tracking-wider transition-all flex items-center justify-center cursor-pointer"
                      >
                        LOGOUT
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-[10px] text-slate-400 mb-3 leading-relaxed">
                      Password-protected area. Log in to update tournament details.
                    </p>
                    <button
                      onClick={handleActivateAdminClick}
                      className="w-full py-2 px-3 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 rounded-xl text-xs font-bold font-mono tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      ACTIVATE ADMIN
                    </button>
                  </div>
                )}
              </div>

              <div className="text-[10px] text-slate-500 text-center font-mono">
                APL Portal v2.6
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Infinite Sliding Marquee Ticker */}
      <div className="w-full bg-slate-900/60 border-b border-white/5 py-2.5 overflow-hidden relative z-40 backdrop-blur-sm">
        <div className="flex whitespace-nowrap min-w-full">
          <div className="animate-marquee flex flex-shrink-0 items-center justify-around gap-12 text-sm text-slate-300 font-medium">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              Andharia Premier League 2026, APL 2026 • 12 দলের খেলা
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-emerald-400 font-semibold font-sans">গ্রামের মাটি, গ্রামের খেলা, গ্রামের গর্ব</span>
            <span className="text-slate-600">|</span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              Andharia Premier League 2026, APL 2026 • 12 দলের খেলা
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-emerald-400 font-semibold font-sans">গ্রামের মাটি, গ্রামের খেলা, গ্রামের গর্ব</span>
            <span className="text-slate-600">|</span>
          </div>
          <div className="animate-marquee flex flex-shrink-0 items-center justify-around gap-12 text-sm text-slate-300 font-medium" aria-hidden="true">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              Andharia Premier League 2026, APL 2026 • 12 দলের খেলা
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-emerald-400 font-semibold font-sans">গ্রামের মাটি, গ্রামের খেলা, গ্রামের গর্ব</span>
            <span className="text-slate-600">|</span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              Andharia Premier League 2026, APL 2026 • 12 দলের খেলা
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-emerald-400 font-semibold font-sans">গ্রামের মাটি, গ্রামের খেলা, গ্রামের গর্ব</span>
            <span className="text-slate-600">|</span>
          </div>
        </div>
      </div>

      {/* Dynamic Cosmic Blur Orbs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none -translate-x-1/2 -translate-y-1/2 animate-pulse-slow" />
      <div className="absolute top-1/3 right-0 w-[450px] h-[450px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none translate-x-1/3 animate-pulse-slow" />
      <div className="absolute bottom-10 left-10 w-[600px] h-[600px] bg-teal-500/5 rounded-full blur-[160px] pointer-events-none" />

      {/* Decorative Grid Mesh Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* Header & Hero Section */}
      <header className="relative z-10 pt-10 pb-8 text-center px-4 max-w-7xl mx-auto">
        
        {/* Animated Banner Tag */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/15 to-indigo-500/15 border border-blue-500/30 rounded-2xl sm:rounded-full text-xs font-semibold text-blue-300 mb-6 backdrop-blur-md mx-auto w-max"
        >
          <div className="flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
            <span className="font-display tracking-wider font-extrabold text-blue-200">APL 2026 • 12 দলের খেলা</span>
          </div>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="text-emerald-300 font-sans tracking-wide">গ্রামের মাটি, গ্রামের খেলা, গ্রামের গর্ব</span>
        </motion.div>

        {/* Brand Display Title */}
        <motion.h1 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-4xl sm:text-6xl lg:text-7xl font-display font-extrabold tracking-tight text-white mb-2"
        >
          Andharia Premier <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-teal-400 text-glow">League 2026</span>
        </motion.h1>

        {/* Tournament descriptors */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="text-xs sm:text-sm font-semibold tracking-wider text-indigo-300 font-display mb-4 uppercase"
        >
          Village System Cricket Tournament • Through Ball Tournament
        </motion.div>

        {/* Location & Date Subhead */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base mb-8 flex flex-wrap items-center justify-center gap-y-2 gap-x-6"
        >
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-blue-400" />
            July 9, 2026 (09/07/2026)
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-indigo-400" />
            Andharia Village Ground
          </span>

        </motion.p>

        {/* Live Countdown Timer Grid */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="max-w-xl mx-auto grid grid-cols-4 gap-3 bg-slate-950/55 border border-white/10 backdrop-blur-xl p-4 rounded-3xl shadow-xl mb-10"
        >
          <div className="text-center p-2 rounded-xl bg-white/[0.02] border border-white/5">
            <span className="block text-2xl sm:text-4xl font-display font-extrabold text-white text-glow-gold">
              {timeLeft.days}
            </span>
            <span className="text-[10px] sm:text-xs font-mono uppercase tracking-widest text-slate-400 mt-1 block">Days</span>
          </div>
          <div className="text-center p-2 rounded-xl bg-white/[0.02] border border-white/5">
            <span className="block text-2xl sm:text-4xl font-display font-extrabold text-white text-glow-gold">
              {timeLeft.hours}
            </span>
            <span className="text-[10px] sm:text-xs font-mono uppercase tracking-widest text-slate-400 mt-1 block">Hours</span>
          </div>
          <div className="text-center p-2 rounded-xl bg-white/[0.02] border border-white/5">
            <span className="block text-2xl sm:text-4xl font-display font-extrabold text-white text-glow-gold">
              {timeLeft.minutes}
            </span>
            <span className="text-[10px] sm:text-xs font-mono uppercase tracking-widest text-slate-400 mt-1 block">Mins</span>
          </div>
          <div className="text-center p-2 rounded-xl bg-white/[0.02] border border-white/5">
            <span className="block text-2xl sm:text-4xl font-display font-extrabold text-white text-glow-gold">
              {timeLeft.seconds}
            </span>
            <span className="text-[10px] sm:text-xs font-mono uppercase tracking-widest text-slate-400 mt-1 block">Secs</span>
          </div>
        </motion.div>

        {/* Audio Ambient Synthesizer widget */}
        <AudioPlayer visibility={visibility} isAdminMode={isAdminMode} />
      </header>

      {/* Main Content Layout */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 pb-24 space-y-12">
        
        {/* Conditional Rendering of Admin Panel or Public Board */}
        {isAdminMode ? (
          <motion.section 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            id="admin-dashboard-deck"
          >
            <AdminPanel 
              teams={teams}
              players={players}
              polls={polls}
              rules={rules}
              onUpdateTeams={handleUpdateTeams}
              onUpdatePlayers={handleUpdatePlayers}
              onUpdatePolls={handleUpdatePolls}
              onUpdateRules={handleUpdateRules}
              visibility={visibility}
              onUpdateVisibility={handleUpdateVisibility}
              adminEmail={loggedInEmail}
              subAdmins={subAdmins}
              onAddSubAdmin={handleAddSubAdmin}
              onRemoveSubAdmin={handleRemoveSubAdmin}
              onUpdatePassword={handleUpdatePassword}
              whatsAppContacts={whatsAppContacts}
              onUpdateWhatsAppContacts={handleUpdateWhatsAppContacts}
              registeredUsers={registeredUsers}
              onDeleteUser={handleDeleteUser}
              onUpdateUser={handleUpdateUser}
              onLogout={handleLogout}
            />
          </motion.section>
        ) : null}

        {/* Section 1: Prizes & Fees */}
        {visibility.prizesFees && (
          <section id="prizes-fees">
            <PrizeMoney />
          </section>
        )}

        {/* Section 2: Official Rules */}
        {visibility.officialRules && (
          <section id="official-rules">
            <Rules rules={rules} />
          </section>
        )}

        {/* Section 3: Registrations Panel */}
        {visibility.registrations && (
          <section id="registrations">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-2.5 h-6 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full" />
              <h2 className="text-2xl font-display font-extrabold text-white">Enrollment Portal</h2>
            </div>
            <RegistrationForm 
              teams={teams} 
              onAddTeam={handleAddTeam} 
              players={players} 
              onAddPlayer={handleAddPlayer} 
              currentUser={currentUser}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
            />
          </section>
        )}



        {/* Section 5: Voting System */}
        {visibility.votingPopularity && (
          <section id="voting-popularity">
            <VotingSystem 
              polls={polls} 
              onVote={handleVote} 
              currentUser={currentUser}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
            />
          </section>
        )}

        {/* Fallback when all sections are hidden */}
        {!visibility.prizesFees && !visibility.officialRules && !visibility.registrations && !visibility.votingPopularity && (
          <div className="glass-panel p-8 rounded-3xl text-center max-w-xl mx-auto border-blue-500/10">
            <Info className="w-8 h-8 text-blue-400 mx-auto mb-3 animate-pulse" />
            <h3 className="text-lg font-display font-bold text-white mb-1">Portal Sections Temporarily Off</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              The tournament administrators have temporarily toggled off public views. Please switch to Admin Console to manage tournament data or toggle visibility back on.
            </p>
          </div>
        )}
      </main>

      {/* Footer Area */}
      <footer className="relative z-10 border-t border-white/10 bg-slate-950/80 backdrop-blur-md py-12 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-center text-center md:text-left">
          
          <div>
            <h4 className="text-lg font-display font-bold text-white mb-2">Andharia Premier League</h4>
            <p className="text-xs text-slate-400 font-sans leading-relaxed max-w-sm">
              The premier grassroots cricket tournament celebrating village athletic pride and through ball traditions. Powered by local sports coordinators and verified referees.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center gap-2">
            <div className="flex items-center gap-2 text-xs text-slate-300 font-mono bg-slate-900 border border-white/5 px-4.5 py-2.5 rounded-full">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Official Tournament Board Approved</span>
            </div>
            <p className="text-[10px] text-slate-500 font-sans">© 2026 APL Commission. All rights reserved.</p>
          </div>

          <div className="text-center md:text-right space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-widest text-slate-400 font-display">Need Info & Registration?</h5>
            <div className="flex flex-col gap-2.5 text-xs text-slate-300 font-sans items-center md:items-end">
              {whatsAppContacts.filter(c => c.visible).map((contact) => (
                <div key={contact.id} className="flex flex-col md:items-end">
                  <span className="font-bold text-white">{contact.name}</span>
                  <span className="flex items-center gap-1.5 text-emerald-400 font-mono text-xs mt-0.5">
                    <Phone className="w-3.5 h-3.5" />
                    {contact.phone.startsWith('91') && contact.phone.length === 12 ? `+91 ${contact.phone.substring(2)}` : contact.phone}
                  </span>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t border-white/5">
              <p className="text-[11px] font-display font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300 tracking-wider">
                Play Together, Win Together.
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Animating WhatsApp Buttons Stack */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4 items-end">
        {whatsAppContacts.filter(c => c.visible).map((contact, index) => {
          const encodedText = encodeURIComponent(contact.message);
          return (
            <motion.a
              key={contact.id}
              href={`https://wa.me/${contact.phone}?text=${encodedText}`}
              target="_blank"
              rel="noopener noreferrer"
              id={`whatsapp-floating-btn-${contact.id}`}
              className="relative flex items-center justify-center w-14 h-14 bg-emerald-500 hover:bg-emerald-400 text-white rounded-full shadow-[0_0_20px_rgba(16,185,129,0.6)] hover:shadow-[0_0_30px_rgba(16,185,129,0.9)] transition-all duration-300 group cursor-pointer"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: [1, 1.06, 1],
                opacity: 1
              }}
              transition={{
                scale: {
                  repeat: Infinity,
                  duration: 2.5,
                  ease: "easeInOut",
                  delay: index * 0.5 // Staggered delay for alternating pulse
                },
                opacity: { duration: 0.5 }
              }}
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.93 }}
            >
              {/* Pulsing Outer Rings */}
              <span className="absolute inset-0 rounded-full bg-emerald-500/40 animate-ping opacity-75" style={{ animationDuration: `${2 + index * 0.2}s` }} />
              <span className="absolute -inset-1 rounded-full border border-emerald-500/20 animate-pulse" />

              {/* WhatsApp SVG Icon */}
              <svg
                className="w-7 h-7 fill-current relative z-10 drop-shadow-md"
                viewBox="0 0 16 16"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.618-4.993c-.198-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
              </svg>

              {/* Hover Tooltip */}
              <span className="absolute right-16 scale-0 group-hover:scale-100 transition-all duration-200 origin-right bg-slate-900 border border-emerald-500/20 text-emerald-300 font-sans text-xs py-1.5 px-3 rounded-xl whitespace-nowrap shadow-xl font-bold">
                💬 Contact {contact.name} ({contact.phone.startsWith('91') && contact.phone.length === 12 ? `+91 ${contact.phone.substring(2)}` : contact.phone})
              </span>
            </motion.a>
          );
        })}
      </div>

      {/* Admin Login Modal */}
      <AnimatePresence>
        {isLoginModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
              onClick={() => setIsLoginModalOpen(false)}
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md glass-panel p-8 rounded-3xl border border-indigo-500/20 shadow-2xl z-10"
            >
              {/* Close Button */}
              <button
                onClick={() => setIsLoginModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-indigo-400 animate-pulse" />
                </div>
                <h3 className="text-xl font-display font-extrabold text-white">APL Admin Access</h3>
                <p className="text-xs text-slate-400 mt-1 font-sans">
                  Enter your registered administrator email and password to access the console.
                </p>
              </div>

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const trimmedEmail = loginEmail.trim().toLowerCase();
                  const isMainAdmin = trimmedEmail === 'mdaziz01092004@gmail.com';
                  const isSubAdmin = subAdmins.map(x => x.toLowerCase()).includes(trimmedEmail);

                  if (!isMainAdmin && !isSubAdmin) {
                    setLoginError('Access Denied: This email is not registered as an administrator.');
                    return;
                  }

                  if (loginPassword !== adminPassword) {
                    setLoginError('Incorrect password. Please try again.');
                    return;
                  }

                  // Success
                  setLoggedInEmail(trimmedEmail);
                  setIsAdminMode(true);
                  localStorage.setItem('apl_logged_in_admin', trimmedEmail);
                  localStorage.setItem('apl_admin_mode', 'true');
                  setIsLoginModalOpen(false);
                  setLoginEmail('');
                  setLoginPassword('');
                }}
                className="space-y-4"
              >
                {loginError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{loginError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 font-sans">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. mdaziz01092004@gmail.com"
                    value={loginEmail}
                    onChange={(e) => { setLoginEmail(e.target.value); setLoginError(null); }}
                    className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/40 transition-all font-sans"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-slate-300 font-sans">Password</label>
                    <span className="text-[10px] text-slate-500 font-sans italic">Default is v93h13q49</span>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => { setLoginPassword(e.target.value); setLoginError(null); }}
                      className="w-full bg-slate-900/60 border border-white/10 rounded-xl pl-4 pr-10 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/40 transition-all font-sans"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded transition-all cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold text-sm py-3.5 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 mt-2"
                >
                  <Shield className="w-4 h-4" />
                  Authenticate & Login
                </button>
              </form>

              <div className="mt-6 pt-4 border-t border-white/5 text-center">
                <p className="text-[10px] text-slate-500 leading-relaxed font-sans">
                  The primary administrator account is managed by <strong className="text-slate-400">mdaziz01092004@gmail.com</strong>. Only the main administrator is allowed to configure and add sub-admins.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* User Login & Signup Modal */}
      <UserAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={handleLoginUser}
        registeredUsers={registeredUsers}
        onRegisterUser={handleRegisterUser}
        isMandatory={!currentUser}
      />
    </div>
  );
}
