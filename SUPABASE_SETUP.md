# Supabase Setup

1. In Supabase Auth, enable `Email` + `Password`.
2. Disable email confirmation so brand-new accounts enter the game immediately after signup.
3. Run the SQL in [`supabase/schema.sql`](/Users/benmock/Downloads/TBPNSim/supabase/schema.sql) in the Supabase SQL editor.
4. Keep the `anon` key in the client only. Never put the `service_role` key in browser code.
5. Because the service-role key was exposed here, rotate it in Supabase before shipping.
6. Multiplayer uses a Supabase Realtime channel named `tbpn-sim:world:<room>` with Presence for room membership and broadcast events for live movement updates. No extra SQL table is required, but authenticated browser clients must be able to connect to Realtime.
7. For the projector live stream, deploy the edge function in [`supabase/functions/tbpn-live-status/index.ts`](/Users/benmock/Downloads/TBPNSim/supabase/functions/tbpn-live-status/index.ts).
8. Set these edge-function secrets before deploying:
   `YOUTUBE_API_KEY`
   `TBPN_YOUTUBE_CHANNEL_ID`
   `TBPN_PROJECTOR_STREAM_URL`
   `TBPN_PROJECTOR_STREAM_MIME_TYPE` optional, defaults to `application/vnd.apple.mpegurl`
   `TBPN_PROJECTOR_FORCE_LIVE` optional, set to `true` for testing
9. `TBPN_PROJECTOR_STREAM_URL` must be your own direct playback URL, such as Mux, Cloudflare Stream, Bunny, or another HLS/MP4 origin. Do not use a YouTube watch page URL for the projector surface.

The game now uses Supabase Auth sessions in the browser, stores subscriber totals in `public.profiles`, and shares live player positions through Realtime. Players join the default `main` room automatically, or can share a `?room=<name>` URL to meet in a private room.
