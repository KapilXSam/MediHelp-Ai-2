import { Database } from './database.types';

type DbTables = Database['public']['Tables'];

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export enum AppView {
  TRIAGE,
  DASHBOARD,
}

export enum Role {
  PATIENT = 'Patient',
  DOCTOR = 'Doctor',
  ADMIN = 'Admin',
}

// Corresponds to the 'profiles' table in Supabase
export type Profile = DbTables['profiles']['Row'];

// Corresponds to the 'triage_sessions' table
// We are augmenting the generated type to be more specific about the chat_history JSONB column
export type TriageSession = Omit<DbTables['triage_sessions']['Row'], 'chat_history'> & {
  chat_history: ChatMessage[];
};

// Corresponds to the 'appointments' table
export type Appointment = DbTables['appointments']['Row'];

// Corresponds to the 'prescriptions' table
export type Prescription = DbTables['prescriptions']['Row'];

// Corresponds to the 'live_chat_messages' table
export type LiveChatMessage = DbTables['live_chat_messages']['Row'];