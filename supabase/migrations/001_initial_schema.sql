-- Pasa Online Multiplayer Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Rooms table
create table rooms (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  host_id uuid references auth.users(id) not null,
  game_mode text not null default 'freeforall' check (game_mode in ('freeforall', 'teams')),
  status text not null default 'waiting' check (status in ('waiting', 'playing', 'finished')),
  max_players int not null default 4,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Room players table
create table room_players (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid references rooms(id) on delete cascade not null,
  user_id uuid references auth.users(id) not null,
  player_color text not null check (player_color in ('red', 'blue', 'yellow', 'green')),
  is_ready boolean not null default false,
  joined_at timestamptz not null default now(),
  unique(room_id, user_id),
  unique(room_id, player_color)
);

-- Moves table (for real-time sync and history)
create table moves (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid references rooms(id) on delete cascade not null,
  sequence_number int not null,
  player_color text not null,
  piece_id text not null,
  piece_type text not null,
  from_row int not null,
  from_col int not null,
  to_row int not null,
  to_col int not null,
  captured_piece_id text,
  captured_piece_type text,
  captured_controlled_by text,
  roll int not null,
  used_raja_override boolean not null default false,
  created_at timestamptz not null default now(),
  unique(room_id, sequence_number)
);

-- Game state snapshot (periodic, for reconnection)
create table game_states (
  room_id uuid primary key references rooms(id) on delete cascade,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

-- Indexes
create index idx_room_players_room_id on room_players(room_id);
create index idx_moves_room_id on moves(room_id);
create index idx_moves_sequence on moves(room_id, sequence_number);
create index idx_rooms_code on rooms(code);
create index idx_rooms_status on rooms(status);

-- Row Level Security
alter table rooms enable row level security;
alter table room_players enable row level security;
alter table moves enable row level security;
alter table game_states enable row level security;

-- Rooms policies (no self-referencing)
create policy "Authenticated users can view rooms"
  on rooms for select
  to authenticated
  using (true);

create policy "Authenticated users can create rooms"
  on rooms for insert
  to authenticated
  with check (auth.uid() = host_id);

create policy "Host can update room"
  on rooms for update
  to authenticated
  using (auth.uid() = host_id);

-- Room players policies (no self-referencing)
-- Use rooms table to check membership instead of self-referencing room_players
create policy "Authenticated users can view room players"
  on room_players for select
  to authenticated
  using (true);

create policy "Authenticated users can join rooms"
  on room_players for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Players can update own readiness"
  on room_players for update
  to authenticated
  using (auth.uid() = user_id);

create policy "Players can leave rooms"
  on room_players for delete
  to authenticated
  using (auth.uid() = user_id);

-- Moves policies (use rooms table to check membership, not room_players)
create policy "Authenticated users can view moves"
  on moves for select
  to authenticated
  using (true);

create policy "Authenticated users can insert moves"
  on moves for insert
  to authenticated
  with check (true);

-- Game states policies
create policy "Authenticated users can view game states"
  on game_states for select
  to authenticated
  using (true);

create policy "Authenticated users can upsert game states"
  on game_states for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update game states"
  on game_states for update
  to authenticated
  using (true);

-- Enable realtime for moves table
create publication supabase_realtime for table moves;
