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
- Real projector screen support for a live TBPN stream via `THREE.VideoTexture`

## Projector Live Stream

The hangar projector can now swap from the baked `projector-screen.png` image to a real live stream when the Supabase edge function at `tbpn-live-status` reports:

```json
{
  "live": true,
  "playbackUrl": "https://your-stream-origin.example.com/tbpn/index.m3u8",
  "mimeType": "application/vnd.apple.mpegurl"
}
```

Important:

- The projector needs a direct video playback URL that the browser can play, such as HLS or MP4.
- A normal YouTube watch URL or YouTube iframe URL will not work as a three.js video texture.
- The playback origin must allow cross-origin video requests from your site.
