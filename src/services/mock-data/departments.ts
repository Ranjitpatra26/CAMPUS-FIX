import { DepartmentInfo } from '../../types';

export const INITIAL_DEPARTMENTS: DepartmentInfo[] = [
  {
    id: 'dept-it',
    name: 'IT Services',
    headName: 'Prof. David Miller',
    email: 'it-helpdesk@campusfix.edu',
    openTickets: 4,
    resolvedTickets: 32,
    slaHours: 24,
    location: 'Tech Tower, Block B, Room 102'
  },
  {
    id: 'dept-maint',
    name: 'Campus Maintenance',
    headName: 'Eng. Sarah Jenkins',
    email: 'maintenance@campusfix.edu',
    openTickets: 3,
    resolvedTickets: 45,
    slaHours: 48,
    location: 'Estate Office, Ground Floor'
  },
  {
    id: 'dept-elec',
    name: 'Electrical Works',
    headName: 'Vikram Mehta',
    email: 'electrical@campusfix.edu',
    openTickets: 2,
    resolvedTickets: 28,
    slaHours: 12,
    location: 'Power Substation Unit 2'
  },
  {
    id: 'dept-class',
    name: 'Classroom Support',
    headName: 'Dr. Anita Roy',
    email: 'classroom-support@campusfix.edu',
    openTickets: 3,
    resolvedTickets: 19,
    slaHours: 18,
    location: 'Academic Complex 1, Room 204'
  },
  {
    id: 'dept-sanit',
    name: 'Sanitation & Health',
    headName: 'Mohan Lal',
    email: 'sanitation@campusfix.edu',
    openTickets: 2,
    resolvedTickets: 51,
    slaHours: 8,
    location: 'Health Centre & Admin Wing'
  },
  {
    id: 'dept-acad',
    name: 'Academic Affairs',
    headName: 'Dr. Katherine Brooks',
    email: 'dean-academics@campusfix.edu',
    openTickets: 1,
    resolvedTickets: 14,
    slaHours: 72,
    location: 'Main Senate Hall, 2nd Floor'
  },
  {
    id: 'dept-fin',
    name: 'Finance & Accounts',
    headName: 'Sanjay Deshmukh',
    email: 'accounts@campusfix.edu',
    openTickets: 1,
    resolvedTickets: 22,
    slaHours: 48,
    location: 'Bursar Office, Admin Block'
  },
  {
    id: 'dept-gen',
    name: 'General Administration',
    headName: 'Registrar Office',
    email: 'admin-office@campusfix.edu',
    openTickets: 1,
    resolvedTickets: 18,
    slaHours: 36,
    location: 'Central Administrative Building'
  }
];
