import { User } from '../../types';

export const DEMO_STUDENT: User = {
  id: 'usr-student-01',
  name: 'Rohan Sharma',
  email: 'rohan.sharma@campus.edu',
  role: 'student',
  studentId: 'CS-2023-042',
  department: 'Computer Science & Engineering',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  joinedDate: 'August 2023'
};

export const DEMO_ADMIN: User = {
  id: 'usr-admin-01',
  name: 'Dr. Aris Thorne',
  email: 'admin@campusfix.edu',
  role: 'admin',
  department: 'Campus Administration',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  joinedDate: 'January 2021'
};

export const ADDITIONAL_USERS: User[] = [
  {
    id: 'usr-student-02',
    name: 'Priya Patel',
    email: 'priya.patel@campus.edu',
    role: 'student',
    studentId: 'EE-2024-019',
    department: 'Electrical Engineering',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    joinedDate: 'August 2024'
  },
  {
    id: 'usr-student-03',
    name: 'Alex Chen',
    email: 'alex.chen@campus.edu',
    role: 'student',
    studentId: 'ME-2023-112',
    department: 'Mechanical Engineering',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    joinedDate: 'August 2023'
  },
  {
    id: 'usr-student-04',
    name: 'Ananya Rao',
    email: 'ananya.rao@campus.edu',
    role: 'student',
    studentId: 'BT-2025-008',
    department: 'Biotechnology',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
    joinedDate: 'August 2025'
  }
];

export const ALL_USERS = [DEMO_STUDENT, DEMO_ADMIN, ...ADDITIONAL_USERS];
