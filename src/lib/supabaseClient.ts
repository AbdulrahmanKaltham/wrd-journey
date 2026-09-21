import { createClient } from '@supabase/supabase-js';

const getEnvVar = (key: string): string | undefined => {
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.[key]) {
      return (import.meta as any).env[key];
    }
  } catch {}
  try {
    if (typeof process !== 'undefined' && process.env?.[key]) {
      return process.env[key];
    }
  } catch {}
  return undefined;
};

const rawUrl = (getEnvVar('VITE_SUPABASE_URL') || 'https://olhruwqwdiehbqwzbxso.supabase.co').trim();
// Strip any appended API paths like /rest/v1 or trailing slashes to guarantee root Supabase URL
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const supabaseAnonKey = (getEnvVar('VITE_SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9saHJ1d3F3ZGllaGJxd3pieHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxMTg5NTIsImV4cCI6MjEwMjY5NDk1Mn0.LB2r-fNh3UoEwDAeeobEJJMoY5QroNY9owwhEH0lJiY').trim();


export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

// أنواع قاعدة البيانات (سنضيفها لاحقاً)
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: 'teacher' | 'student';
          gender: 'male' | 'female';
          circle_id: string | null;
          teacher_id: string | null;
          xp: number;
          streak: number;
          current_week: number;
          completed_nodes: string[];
          completed_weeks: number[];
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          role: 'teacher' | 'student';
          gender: 'male' | 'female';
          circle_id?: string | null;
          teacher_id?: string | null;
          xp?: number;
          streak?: number;
          current_week?: number;
          completed_nodes?: string[];
          completed_weeks?: number[];
        };
      };
      circles: {
        Row: {
          id: string;
          name: string;
          teacher_id: string;
          teacher_name: string;
          gender: 'male' | 'female';
          student_ids: string[];
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          teacher_id: string;
          teacher_name: string;
          gender: 'male' | 'female';
          student_ids?: string[];
          is_active?: boolean;
        };
      };
      recordings: {
        Row: {
          id: string;
          student_id: string;
          circle_id: string;
          node_id: string;
          audio_url: string;
          status: 'pending' | 'reviewed' | 'approved';
          teacher_notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          circle_id: string;
          node_id: string;
          audio_url: string;
          status?: 'pending' | 'reviewed' | 'approved';
          teacher_notes?: string | null;
        };
      };
    };
  };
};