/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';
import { Team, PlayerRegistration, Poll, Rule } from '../types';

// Read variables from import.meta.env
const supabaseUrl = (import.meta.env.NEXT_PUBLIC_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Clean up helper to map database snake_case columns back to camelCase frontend structures
export function mapTeamFromDb(dbTeam: any): Team {
  return {
    id: dbTeam.id,
    teamName: dbTeam.team_name,
    captainName: dbTeam.captain_name,
    contactNumber: dbTeam.contact_number,
    village: dbTeam.village,
    iconPlayer: dbTeam.icon_player,
    players: Array.isArray(dbTeam.players) ? dbTeam.players : JSON.parse(dbTeam.players || '[]'),
    teamColor: dbTeam.team_color,
    registeredAt: dbTeam.registered_at,
    status: dbTeam.status || 'approved'
  };
}

export function mapTeamToDb(team: Team) {
  const mapped: any = {
    id: team.id,
    team_name: team.teamName,
    captain_name: team.captainName,
    contact_number: team.contactNumber,
    village: team.village,
    icon_player: team.iconPlayer,
    players: Array.isArray(team.players) ? JSON.stringify(team.players) : team.players,
    team_color: team.teamColor,
    registered_at: team.registeredAt
  };
  
  if (team.status) {
    mapped.status = team.status;
  }
  
  return mapped;
}

export function mapPlayerFromDb(dbPlayer: any): PlayerRegistration {
  return {
    id: dbPlayer.id,
    fullName: dbPlayer.full_name,
    role: dbPlayer.role,
    village: dbPlayer.village,
    contactNumber: dbPlayer.contact_number,
    experience: dbPlayer.experience,
    registeredAt: dbPlayer.registered_at
  };
}

export function mapPlayerToDb(player: PlayerRegistration) {
  return {
    id: player.id,
    full_name: player.fullName,
    role: player.role,
    village: player.village,
    contact_number: player.contactNumber,
    experience: player.experience,
    registered_at: player.registeredAt
  };
}

export function mapRuleFromDb(dbRule: any): Rule {
  return {
    id: dbRule.id,
    title: dbRule.title,
    desc: dbRule.description || dbRule.desc,
    badge: dbRule.badge,
    badgeColor: dbRule.badge_color,
    iconName: dbRule.icon_name,
    visible: dbRule.visible
  };
}

export function mapRuleToDb(rule: Rule) {
  return {
    id: rule.id,
    title: rule.title,
    description: rule.desc,
    badge: rule.badge,
    badge_color: rule.badgeColor,
    icon_name: rule.iconName,
    visible: rule.visible
  };
}

// Database Operations
export async function fetchTeamsDb(): Promise<Team[]> {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { data, error } = await supabase.from('apl_teams').select('*');
  if (error) throw error;
  return (data || []).map(mapTeamFromDb);
}

export async function saveTeamDb(team: Team): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('apl_teams').upsert(mapTeamToDb(team));
  if (error) throw error;
}

export async function deleteTeamDb(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('apl_teams').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchPlayersDb(): Promise<PlayerRegistration[]> {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { data, error } = await supabase.from('apl_players').select('*');
  if (error) throw error;
  return (data || []).map(mapPlayerFromDb);
}

export async function savePlayerDb(player: PlayerRegistration): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('apl_players').upsert(mapPlayerToDb(player));
  if (error) throw error;
}

export async function deletePlayerDb(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('apl_players').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchPollsDb(): Promise<Poll[]> {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { data, error } = await supabase.from('apl_polls').select('*');
  if (error) throw error;
  return data || [];
}

export async function savePollDb(poll: Poll): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('apl_polls').upsert({
    id: poll.id,
    option: poll.option,
    votes: poll.votes
  });
  if (error) throw error;
}

export async function deletePollDb(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('apl_polls').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchRulesDb(): Promise<Rule[]> {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { data, error } = await supabase.from('apl_rules').select('*');
  if (error) throw error;
  return (data || []).map(mapRuleFromDb);
}

export async function saveRuleDb(rule: Rule): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('apl_rules').upsert(mapRuleToDb(rule));
  if (error) throw error;
}

export async function deleteRuleDb(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('apl_rules').delete().eq('id', id);
  if (error) throw error;
}

// Admins Database Operations
export async function fetchSubAdminsDb(): Promise<string[]> {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { data, error } = await supabase.from('apl_admins').select('email');
  if (error) throw error;
  return (data || []).map((row: any) => row.email);
}

export async function saveSubAdminDb(email: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('apl_admins').upsert({
    email: email.trim().toLowerCase(),
    role: 'sub',
    created_at: new Date().toISOString()
  });
  if (error) throw error;
}

export async function deleteSubAdminDb(email: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('apl_admins').delete().eq('email', email.trim().toLowerCase());
  if (error) throw error;
}

// Password settings operations
export async function fetchAdminPasswordDb(): Promise<string | null> {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { data, error } = await supabase.from('apl_settings').select('value').eq('key', 'admin_password');
  if (error) throw error;
  if (data && data.length > 0) {
    return data[0].value;
  }
  return null;
}

export async function saveAdminPasswordDb(password: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('apl_settings').upsert({
    key: 'admin_password',
    value: password
  });
  if (error) throw error;
}

// SQL Script to copy-paste into Supabase Dashboard
export const SUPABASE_SQL_SCRIPT = `-- SQL script to set up Andharia Premier League 2026 database tables
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)

-- Create Teams table
CREATE TABLE IF NOT EXISTS public.apl_teams (
    id TEXT PRIMARY KEY,
    team_name TEXT NOT NULL,
    captain_name TEXT NOT NULL,
    contact_number TEXT NOT NULL,
    village TEXT NOT NULL,
    icon_player TEXT NOT NULL,
    players TEXT NOT NULL, -- JSON string representation
    team_color TEXT NOT NULL,
    registered_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'approved'
);

-- Upgrade existing teams table to support status if it was already created earlier
ALTER TABLE public.apl_teams ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'approved';

-- Create Players table
CREATE TABLE IF NOT EXISTS public.apl_players (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL,
    village TEXT NOT NULL,
    contact_number TEXT NOT NULL,
    experience TEXT NOT NULL,
    registered_at TEXT NOT NULL
);

-- Create Polls table
CREATE TABLE IF NOT EXISTS public.apl_polls (
    id TEXT PRIMARY KEY,
    option TEXT NOT NULL,
    votes INTEGER NOT NULL DEFAULT 0
);

-- Create Rules table
CREATE TABLE IF NOT EXISTS public.apl_rules (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    badge TEXT NOT NULL,
    badge_color TEXT,
    icon_name TEXT NOT NULL,
    visible BOOLEAN NOT NULL DEFAULT true
);

-- Create Admins table
CREATE TABLE IF NOT EXISTS public.apl_admins (
    email TEXT PRIMARY KEY,
    role TEXT NOT NULL DEFAULT 'sub',
    created_at TEXT NOT NULL
);

-- Create Settings table
CREATE TABLE IF NOT EXISTS public.apl_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- Enable Row Level Security (RLS) for public read and insert/update access
ALTER TABLE public.apl_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apl_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apl_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apl_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apl_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apl_settings ENABLE ROW LEVEL SECURITY;

-- Create simple policies allowing anyone to view and modify
CREATE POLICY "Allow public read of teams" ON public.apl_teams FOR SELECT USING (true);
CREATE POLICY "Allow public insert of teams" ON public.apl_teams FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update of teams" ON public.apl_teams FOR UPDATE USING (true);
CREATE POLICY "Allow public delete of teams" ON public.apl_teams FOR DELETE USING (true);

CREATE POLICY "Allow public read of players" ON public.apl_players FOR SELECT USING (true);
CREATE POLICY "Allow public insert of players" ON public.apl_players FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update of players" ON public.apl_players FOR UPDATE USING (true);
CREATE POLICY "Allow public delete of players" ON public.apl_players FOR DELETE USING (true);

CREATE POLICY "Allow public read of polls" ON public.apl_polls FOR SELECT USING (true);
CREATE POLICY "Allow public insert of polls" ON public.apl_polls FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update of polls" ON public.apl_polls FOR UPDATE USING (true);
CREATE POLICY "Allow public delete of polls" ON public.apl_polls FOR DELETE USING (true);

CREATE POLICY "Allow public read of rules" ON public.apl_rules FOR SELECT USING (true);
CREATE POLICY "Allow public insert of rules" ON public.apl_rules FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update of rules" ON public.apl_rules FOR UPDATE USING (true);
CREATE POLICY "Allow public delete of rules" ON public.apl_rules FOR DELETE USING (true);

CREATE POLICY "Allow public read of admins" ON public.apl_admins FOR SELECT USING (true);
CREATE POLICY "Allow public insert of admins" ON public.apl_admins FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update of admins" ON public.apl_admins FOR UPDATE USING (true);
CREATE POLICY "Allow public delete of admins" ON public.apl_admins FOR DELETE USING (true);

CREATE POLICY "Allow public read of settings" ON public.apl_settings FOR SELECT USING (true);
CREATE POLICY "Allow public insert of settings" ON public.apl_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update of settings" ON public.apl_settings FOR UPDATE USING (true);
CREATE POLICY "Allow public delete of settings" ON public.apl_settings FOR DELETE USING (true);
`;
