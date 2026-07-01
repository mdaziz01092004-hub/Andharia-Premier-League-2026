/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Team {
  id: string;
  teamName: string;
  captainName: string;
  contactNumber: string;
  village: string;
  iconPlayer: string;
  players: string[]; // up to 11 players total (Captain, Icon, and 9 village players)
  teamColor: string;
  registeredAt: string;
  status?: 'pending' | 'approved' | 'rejected';
}

export interface PlayerRegistration {
  id: string;
  fullName: string;
  role: 'Batsman' | 'Bowler' | 'Allrounder' | 'Wicketkeeper';
  village: string;
  contactNumber: string;
  experience: string;
  registeredAt: string;
}

export interface Poll {
  id: string;
  option: string;
  votes: number;
}

export interface VisibilityConfig {
  prizesFees: boolean;
  officialRules: boolean;
  registrations: boolean;
  votingPopularity: boolean;
  bgMusicPlayer: boolean;
}

export interface Rule {
  id: string;
  title: string;
  desc: string;
  badge: string;
  badgeColor?: string;
  iconName: 'Swords' | 'Users' | 'Ban' | 'Trophy' | 'Shield' | 'Clock' | 'Info';
  visible: boolean;
}

export interface UserActivity {
  type: 'signup' | 'login' | 'logout';
  timestamp: string;
}

export interface AppUser {
  fullName: string;
  mobileNumber: string;
  registeredAt?: string;
  lastLoginAt?: string;
  lastLogoutAt?: string;
  loginCount?: number;
  logoutCount?: number;
  activities?: UserActivity[];
}

export interface WhatsAppContact {
  id: string;
  name: string;
  phone: string;
  message: string;
  visible: boolean;
}



