import { createClient } from '@supabase/supabase-js';

/**
 * SUPABASE SETUP — run this SQL in your Supabase SQL Editor:
 *
 *   create table rooms (
 *     room_code text primary key,
 *     current_word text,
 *     team_a_score integer default 0,
 *     team_b_score integer default 0,
 *     team_a_name text default 'Team A',
 *     team_b_name text default 'Team B',
 *     active_power_up jsonb,
 *     buzzer_locked_by text,
 *     buzzer_locked_at timestamptz,
 *     team_a_players jsonb default '[]',
 *     team_b_players jsonb default '[]',
 *     updated_at timestamptz default now()
 *   );
 *
 * If updating an existing table, run:
 *   alter table rooms add column if not exists team_a_players jsonb default '[]';
 *   alter table rooms add column if not exists team_b_players jsonb default '[]';
 *   alter table rooms add column if not exists describer_names jsonb default '[]';
 *   alter table rooms add column if not exists skip_votes jsonb default '[]';
 *   alter table rooms add column if not exists game_mode text default 'teams';
 *   alter table rooms add column if not exists solo_score integer default 0;
 *   alter table rooms add column if not exists solo_words jsonb default '[]';
 *
 *   alter table rooms enable row level security;
 *   create policy "Allow all" on rooms for all using (true) with check (true);
 *   alter publication supabase_realtime add table rooms;
 *
 * Then go to Supabase Dashboard → Table Editor → rooms → Realtime (toggle ON).
 *
 * Create a .env file in the project root:
 *   VITE_SUPABASE_URL=https://your-project-id.supabase.co
 *   VITE_SUPABASE_ANON_KEY=your-anon-key
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder'
);
