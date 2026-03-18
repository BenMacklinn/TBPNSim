declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response> | Response) => void;
  env: { get: (key: string) => string | undefined };
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function isTruthy(value: string | undefined) {
  return /^(1|true|yes|on)$/i.test(value ?? "");
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "GET") {
    return json({ error: "Method not allowed" }, 405);
  }

  const youtubeApiKey = Deno.env.get("YOUTUBE_API_KEY") ?? "";
  const channelId = Deno.env.get("TBPN_YOUTUBE_CHANNEL_ID") ?? "";
  const playbackUrl = Deno.env.get("TBPN_PROJECTOR_STREAM_URL") ?? "";
  const mimeType = Deno.env.get("TBPN_PROJECTOR_STREAM_MIME_TYPE") ?? "application/vnd.apple.mpegurl";
  const forceLive = isTruthy(Deno.env.get("TBPN_PROJECTOR_FORCE_LIVE"));

  if (!playbackUrl) {
    return json({
      live: false,
      reason: "missing_playback_url",
    });
  }

  if (forceLive) {
    return json({
      live: true,
      playbackUrl,
      mimeType,
      source: "forced",
    });
  }

  if (!youtubeApiKey || !channelId) {
    return json({
      live: false,
      reason: "missing_youtube_configuration",
    });
  }

  const youtubeSearchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
  youtubeSearchUrl.searchParams.set("part", "id,snippet");
  youtubeSearchUrl.searchParams.set("channelId", channelId);
  youtubeSearchUrl.searchParams.set("eventType", "live");
  youtubeSearchUrl.searchParams.set("type", "video");
  youtubeSearchUrl.searchParams.set("maxResults", "1");
  youtubeSearchUrl.searchParams.set("videoEmbeddable", "true");
  youtubeSearchUrl.searchParams.set("key", youtubeApiKey);

  const youtubeResponse = await fetch(youtubeSearchUrl);
  if (!youtubeResponse.ok) {
    const errorText = await youtubeResponse.text();
    return json({
      live: false,
      reason: "youtube_lookup_failed",
      status: youtubeResponse.status,
      error: errorText.slice(0, 500),
    }, 502);
  }

  const payload = await youtubeResponse.json();
  const item = Array.isArray(payload.items) ? payload.items[0] : null;
  const videoId = typeof item?.id?.videoId === "string" ? item.id.videoId : "";

  if (!videoId) {
    return json({
      live: false,
      reason: "offline",
    });
  }

  return json({
    live: true,
    playbackUrl,
    mimeType,
    source: "youtube",
    videoId,
    title: typeof item?.snippet?.title === "string" ? item.snippet.title : "",
    thumbnailUrl:
      typeof item?.snippet?.thumbnails?.high?.url === "string"
        ? item.snippet.thumbnails.high.url
        : typeof item?.snippet?.thumbnails?.default?.url === "string"
        ? item.snippet.thumbnails.default.url
        : "",
  });
});
