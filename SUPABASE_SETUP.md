# Supabase Setup

1. In Supabase Auth, enable `Email` + `Password`.
2. Disable email confirmation so brand-new accounts enter the game immediately after signup.
3. Run the SQL in [`supabase/schema.sql`](/Users/benmock/Downloads/TBPNSim/supabase/schema.sql) in the Supabase SQL editor.
4. Keep the `anon` key in the client only. Never put the `service_role` key in browser code.
5. Because the service-role key was exposed here, rotate it in Supabase before shipping.
6. Multiplayer uses a Supabase Realtime channel named `tbpn-sim:world:<room>` with Presence for room membership and broadcast events for live movement updates. No extra SQL table is required, but authenticated browser clients must be able to connect to Realtime.
7. Chat now persists in `public.chat_messages`, scoped by the current `?room=<name>` value. New messages are saved in Supabase and also broadcast over the existing Realtime room channel for instant delivery.
8. The suspended vertical hangar monitors use the saved chat feed as their livestream texture, so running the latest schema is required for the truss chat screens to populate.
9. The latest schema now creates `public.projector_state`, which caches the YouTube live/replay state for the projector.
10. For the projector live stream, deploy the edge function in [`supabase/functions/tbpn-live-status/index.ts`](/Users/benmock/Downloads/TBPNSim/supabase/functions/tbpn-live-status/index.ts).
11. Set these edge-function secrets before deploying:
   `YOUTUBE_API_KEY`
   `TBPN_YOUTUBE_CHANNEL_ID`
   `TBPN_PROJECTOR_FORCE_LIVE` optional, set to `true` for testing
12. The projector now uses YouTube-only logic:
   it checks for a new live stream around the expected start window, keeps checking while live, and falls back to replaying the most recent completed VOD the rest of the day.
13. When a stream ends, the projector keeps replaying the previously known VOD until YouTube finishes processing the newest archive. Once the archived video appears, the edge function promotes it automatically.

The game now uses Supabase Auth sessions in the browser, stores subscriber totals in `public.profiles`, stores suggestions in `public.suggestions`, persists room chat in `public.chat_messages`, and shares live player positions through Realtime. Players join the default `main` room automatically, or can share a `?room=<name>` URL to meet in a private room with its own live chat feed.
