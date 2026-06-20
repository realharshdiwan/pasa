-- Migration 002: Add room_players and rooms to realtime publication
-- The original migration only included the moves table, preventing
-- real-time lobby updates (player joins, ready status, room state changes).

drop publication if exists supabase_realtime;
create publication supabase_realtime for table moves, room_players, rooms;
