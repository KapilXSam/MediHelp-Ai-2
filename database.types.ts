export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      appointments: {
        Row: {
          appointment_date: string
          doctor_id: string
          id: string
          patient_id: string
          reason: string
          status: "Confirmed" | "Pending" | "Cancelled"
        }
        Insert: {
          appointment_date: string
          doctor_id: string
          id?: string
          patient_id: string
          reason: string
          status: "Confirmed" | "Pending" | "Cancelled"
        }
        Update: {
          appointment_date?: string
          doctor_id?: string
          id?: string
          patient_id?: string
          reason?: string
          status?: "Confirmed" | "Pending" | "Cancelled"
        }
        Relationships: [
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      live_chat_messages: {
        Row: {
          created_at: string
          id: string
          message_text: string
          receiver_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_text: string
          receiver_id: string
          sender_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message_text?: string
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_chat_messages_receiver_id_fkey"
            columns: ["receiver_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      prescriptions: {
        Row: {
          created_at: string
          doctor_id: string
          dosage: string
          id: string
          instructions: string
          medication: string
          patient_id: string
        }
        Insert: {
          created_at?: string
          doctor_id: string
          dosage: string
          id?: string
          instructions: string
          medication: string
          patient_id: string
        }
        Update: {
          created_at?: string
          doctor_id?: string
          dosage?: string
          id?: string
          instructions?: string
          medication?: string
          patient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_doctor_id_fkey"
            columns: ["doctor_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_patient_id_fkey"
            columns: ["patient_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          details: string | null
          id: string
          name: string
          role: "Patient" | "Doctor" | "Admin"
        }
        Insert: {
          details?: string | null
          id: string
          name: string
          role: "Patient" | "Doctor" | "Admin"
        }
        Update: {
          details?: string | null
          id?: string
          name?: string
          role?: "Patient" | "Doctor" | "Admin"
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      triage_sessions: {
        Row: {
          chat_history: Json
          created_at: string
          doctor_notes: string | null
          id: string
          patient_id: string
          summary: string
        }
        Insert: {
          chat_history: Json
          created_at?: string
          doctor_notes?: string | null
          id?: string
          patient_id: string
          summary: string
        }
        Update: {
          chat_history?: Json
          created_at?: string
          doctor_notes?: string | null
          id?: string
          patient_id?: string
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "triage_sessions_patient_id_fkey"
            columns: ["patient_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}