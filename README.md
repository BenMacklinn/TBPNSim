# TBPNSim

A 3D walkthrough simulation with a Forecast Frenzy minigame, NPCs, furnishings, and interactive elements. Built with Three.js.

## Run

Open a local static server from this folder, for example:

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Features

- 3D floorplan walkthrough with walls, rooms, and furnishings
- Supabase-backed multiplayer presence so logged-in players can see each other live
- Supabase-backed room chat with persisted history and live truss-screen chat feed
- Forecast Frenzy minigame (press E on Ben at the greenscreen)
- Chat NPCs including Tyler at the east desk
- Seated characters at double-layer desks and stage area
- Hangar stage with truss lighting, monitors, and round table
- Real projector screen support for a live or replaying TBPN YouTube stream

## Projector Live Stream

The hangar projector can now swap from the baked `projector-screen.png` image to a YouTube-backed live or replay stream when the Supabase edge function at `tbpn-live-status` reports:

```json
{
  "mode": "live",
  "videoId": "youtube-video-id",
  "replay": false
}
```

Important:

- The projector is now driven by YouTube state, not by a direct HLS stream URL.
- While a livestream is active, the projector shows the live YouTube video.
- When the livestream ends, the projector keeps replaying the previous VOD until the new archive is ready, then it switches to the newest completed VOD.
- The edge function caches projector state in Supabase so every browser does not hit the YouTube API independently.
