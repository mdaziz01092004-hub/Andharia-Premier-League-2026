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
  players: string[]; // up to 10 players from one village
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


