/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Team, PlayerRegistration, Poll, Rule } from './types';

export const INITIAL_TEAMS: Team[] = [
  {
    id: 'team-1',
    teamName: 'Andharia Warriors',
    captainName: 'Rajesh Patel',
    contactNumber: '+91 98765 43210',
    village: 'Andharia',
    iconPlayer: 'Amit Sharma (Icon)',
    players: [
      'Rajesh Patel (C)',
      'Amit Sharma',
      'Suresh Kumar',
      'Vikram Singh',
      'Hardik Pandya',
      'Ravi Shastri',
      'Jasprit Patel',
      'Manish Tiwari',
      'Dinesh Karthik',
      'Ashwin Joshi'
    ],
    teamColor: 'from-blue-600 to-indigo-800',
    registeredAt: '2026-06-25T10:00:00.000Z'
  },
  {
    id: 'team-2',
    teamName: 'Village Blasters',
    captainName: 'Sunil Verma',
    contactNumber: '+91 87654 32109',
    village: 'Patan',
    iconPlayer: 'Kunal Jadeja (Icon)',
    players: [
      'Sunil Verma (C)',
      'Kunal Jadeja',
      'Devendra Solanki',
      'Piyush Chawla',
      'Yuvraj Parmar',
      'Deepak Hooda',
      'Sanju Samson',
      'Irfan Pathan',
      'Munaf Patel'
    ],
    teamColor: 'from-orange-500 to-red-700',
    registeredAt: '2026-06-26T14:30:00.000Z'
  },
  {
    id: 'team-3',
    teamName: 'Royal Challengers Dhar',
    captainName: 'Vijay Rathore',
    contactNumber: '+91 76543 21098',
    village: 'Dhar',
    iconPlayer: 'Prithvi Shaw (Icon)',
    players: [
      'Vijay Rathore (C)',
      'Prithvi Shaw',
      'Mohammad Siraj',
      'Kedar Jadhav',
      'Axar Patel',
      'Rahul Tewatia',
      'Rinku Singh',
      'Shivam Dube'
    ],
    teamColor: 'from-red-600 to-rose-950',
    registeredAt: '2026-06-28T09:15:00.000Z'
  },
  {
    id: 'team-4',
    teamName: 'Sardar XI',
    captainName: 'Gurmukh Singh',
    contactNumber: '+91 99887 76655',
    village: 'Navagam',
    iconPlayer: 'Manpreet Singh (Icon)',
    players: [
      'Gurmukh Singh (C)',
      'Manpreet Singh',
      'Harpreet Brar',
      'Simranjeet Singh',
      'Arshdeep Singh',
      'Prabhsimran Singh',
      'Jitesh Sharma'
    ],
    teamColor: 'from-emerald-500 to-teal-800',
    registeredAt: '2026-06-29T11:45:00.000Z'
  }
];

export const INITIAL_PLAYERS: PlayerRegistration[] = [
  {
    id: 'player-1',
    fullName: 'Rahul Dravid Patel',
    role: 'Batsman',
    village: 'Andharia',
    contactNumber: '+91 91234 56789',
    experience: '5 Years - Local Village Tournaments, Open Stance Right-Handed Power Hitter',
    registeredAt: '2026-06-27T08:00:00.000Z'
  },
  {
    id: 'player-2',
    fullName: 'Mohit Sharma',
    role: 'Bowler',
    village: 'Sokhada',
    contactNumber: '+91 92345 67890',
    experience: '3 Years - Medium Fast Outswing specialist, good depth control',
    registeredAt: '2026-06-28T12:00:00.000Z'
  },
  {
    id: 'player-3',
    fullName: 'Karan Malhotra',
    role: 'Allrounder',
    village: 'Patan',
    contactNumber: '+91 93456 78901',
    experience: '6 Years - Hard-hitting middle-order batsman and off-spinner',
    registeredAt: '2026-06-29T15:20:00.000Z'
  }
];

export const INITIAL_POLLS: Poll[] = [
  { id: 'poll-1', option: 'Andharia Warriors', votes: 148 },
  { id: 'poll-2', option: 'Village Blasters', votes: 112 },
  { id: 'poll-3', option: 'Royal Challengers Dhar', votes: 89 },
  { id: 'poll-4', option: 'Sardar XI', votes: 76 },
  { id: 'poll-5', option: 'Other Emerging Underdog', votes: 43 }
];

export const INITIAL_RULES: Rule[] = [
  {
    id: 'rule-icon',
    title: '1 Icon Player Designation',
    desc: 'Each team is allowed exactly 1 key "Icon Player" to elevate the competition level. This player can lead as the marquee star of the team roster.',
    badge: 'Mandatory Cap',
    badgeColor: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
    iconName: 'Swords',
    visible: true
  },
  {
    id: 'rule-umpire',
    title: "Umpire's Decision Will Be Final",
    desc: 'Strict adherence to professional sportsmanship. The on-field umpire decisions are absolute, and respect must be maintained at all times.',
    badge: 'Fair Play',
    badgeColor: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    iconName: 'Shield',
    visible: true
  },
  {
    id: 'rule-plastic-ban',
    title: 'Plastic Bats Are Strictly Not Allowed',
    desc: 'Only standard high-grade English or Kashmir Willow wooden bats are permitted. Plastic or composite bats are completely prohibited to maintain professional standards.',
    badge: 'Zero Tolerance',
    badgeColor: 'bg-red-500/10 text-red-300 border-red-500/20',
    iconName: 'Ban',
    visible: true
  }
];

