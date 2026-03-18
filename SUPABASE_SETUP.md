# Supabase Setup

1. In Supabase Auth, enable `Email` + `Password`.
2. Disable email confirmation so brand-new accounts enter the game immediately after signup.
3. Run the SQL in [`supabase/schema.sql`](/Users/benmock/Downloads/TBPNSim/supabase/schema.sql) in the Supabase SQL editor.
4. Keep the `anon` key in the client only. Never put the `service_role` key in browser code.
5. Because the service-role key was exposed here, rotate it in Supabase before shipping.
6. Multiplayer uses Supabase Realtime Presence on the `tbpn-sim:world:<room>` channel. No extra SQL table is required, but authenticated browser clients must be able to connect to Realtime.

The game now uses Supabase Auth sessions in the browser, stores subscriber totals in `public.profiles`, and shares live player positions through Realtime Presence. Players join the default `main` room automatically, or can share a `?room=<name>` URL to meet in a private room.
