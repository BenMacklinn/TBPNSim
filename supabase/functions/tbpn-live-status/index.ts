declare const Deno: {
  env: { get: (key: string) => string | undefined };
  serve: (handler: (req: Request) => Promise<Response> | Response) => void;
};

// @ts-expect-error - Deno ESM import
import { createClient } from "https://esm.sh/@supabase/supabase-js@2?target=deno";

type ProjectorMode = "offline" | "live" | "replay" | "archive_pending";

type ProjectorStateRow = {
  id: string;
  mode: ProjectorMode;
  live_video_id: string;
  replay_video_id: string;
  replay_clock_video_id: string;
  replay_started_at: string | null;
  replay_duration_seconds: number | null;
  pending_archive_video_id: string;
  uploads_playlist_id: string;
  check_lease_expires_at: string | null;
  last_live_check_at: string | null;
  last_archive_check_at: string | null;
  last_source: string;
  last_error: string;
  created_at: string;
  updated_at: string;
};

type YoutubeSearchResponse = {
  items?: Array<{
    id?: {
      videoId?: string;
    };
    snippet?: {
      title?: string;
    };
  }>;
};

type YoutubeChannelsResponse = {
  items?: Array<{
    contentDetails?: {
      relatedPlaylists?: {
        uploads?: string;
      };
    };
  }>;
};

type YoutubePlaylistItemsResponse = {
  items?: Array<{
    snippet?: {
      resourceId?: {
        videoId?: string;
      };
    };
  }>;
};

type YoutubeVideosResponse = {
  items?: Array<{
    contentDetails?: {
      duration?: string;
    };
  }>;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const PROJECTOR_STATE_ID = "main";
const PROJECTOR_TIME_ZONE = "America/Los_Angeles";
const EXPECTED_LIVE_WINDOW_START_MINUTES = 10 * 60 + 55;
const EXPECTED_LIVE_WINDOW_END_MINUTES = 11 * 60 + 10;
const LIVE_CHECK_INTERVAL_MS = 60_000;
const ARCHIVE_CHECK_INTERVAL_MS = 180_000;
const REPLAY_BOOTSTRAP_CHECK_INTERVAL_MS = 1_800_000;
const REFRESH_LEASE_SECONDS = 20;
const RECENT_UPLOAD_SCAN_LIMIT = 12;

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

function trimString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isoNow() {
  return new Date().toISOString();
}

function getPacificTimeParts(now = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: PROJECTOR_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = formatter.formatToParts(now);
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");
  return {
    hour,
    minute,
    minutesSinceMidnight: hour * 60 + minute,
    localTimeLabel: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
  };
}

function isInsideExpectedLiveWindow(minutesSinceMidnight: number) {
  return (
    minutesSinceMidnight >= EXPECTED_LIVE_WINDOW_START_MINUTES &&
    minutesSinceMidnight <= EXPECTED_LIVE_WINDOW_END_MINUTES
  );
}

function parseTimestamp(value: string | null | undefined) {
  if (!value) {
    return 0;
  }

  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function parsePositiveInteger(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : 0;
}

function parseIso8601DurationSeconds(duration: string) {
  const match = trimString(duration).match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/);
  if (!match) {
    return 0;
  }

  const days = Number(match[1] ?? 0);
  const hours = Number(match[2] ?? 0);
  const minutes = Number(match[3] ?? 0);
  const seconds = Number(match[4] ?? 0);
  return days * 86_400 + hours * 3_600 + minutes * 60 + seconds;
}

function shouldRunLiveCheck(state: ProjectorStateRow, nowMs: number, minutesSinceMidnight: number) {
  if (trimString(state.live_video_id)) {
    return nowMs - parseTimestamp(state.last_live_check_at) >= LIVE_CHECK_INTERVAL_MS;
  }

  if (!isInsideExpectedLiveWindow(minutesSinceMidnight)) {
    return false;
  }

  return nowMs - parseTimestamp(state.last_live_check_at) >= LIVE_CHECK_INTERVAL_MS;
}

function shouldRunArchiveCheck(state: ProjectorStateRow, nowMs: number) {
  const replayVideoId = trimString(state.replay_video_id);
  const pendingArchiveVideoId = trimString(state.pending_archive_video_id);

  if (!replayVideoId) {
    return nowMs - parseTimestamp(state.last_archive_check_at) >= REPLAY_BOOTSTRAP_CHECK_INTERVAL_MS;
  }

  if (!pendingArchiveVideoId) {
    return false;
  }

  return nowMs - parseTimestamp(state.last_archive_check_at) >= ARCHIVE_CHECK_INTERVAL_MS;
}

function needsReplayClockRefresh(state: ProjectorStateRow) {
  const replayVideoId = trimString(state.replay_video_id);
  const replayClockVideoId = trimString(state.replay_clock_video_id);

  if (!replayVideoId) {
    return Boolean(
      replayClockVideoId ||
        state.replay_started_at ||
        parsePositiveInteger(state.replay_duration_seconds),
    );
  }

  return (
    replayClockVideoId !== replayVideoId ||
    !state.replay_started_at ||
    parsePositiveInteger(state.replay_duration_seconds) <= 0
  );
}

function shouldRunReplayClockRepair(state: ProjectorStateRow, nowMs: number) {
  if (!needsReplayClockRefresh(state)) {
    return false;
  }

  if (trimString(state.replay_video_id)) {
    return true;
  }

  return nowMs - parseTimestamp(state.last_archive_check_at) >= ARCHIVE_CHECK_INTERVAL_MS;
}

function buildProjectorResponse(
  state: ProjectorStateRow,
  playbackUrl: string,
  mimeType: string,
  checkedAtLocalTime: string,
  forceLive = false,
) {
  const liveVideoId = trimString(state.live_video_id);
  const replayVideoId = trimString(state.replay_video_id);
  const pendingArchiveVideoId = trimString(state.pending_archive_video_id);
  const mode: ProjectorMode =
    forceLive && liveVideoId
      ? "live"
      : forceLive && replayVideoId
      ? "replay"
      : forceLive
      ? "live"
      : state.mode;
  const videoId = mode === "live" ? liveVideoId : replayVideoId;
  const replay = mode !== "live" && Boolean(videoId);

  return {
    live: mode === "live",
    mode,
    videoId,
    replay,
    liveVideoId,
    replayVideoId,
    pendingArchiveVideoId,
    playbackUrl: playbackUrl || "",
    mimeType: playbackUrl ? mimeType : "",
    replayStartedAt: state.replay_started_at,
    replayDurationSeconds: parsePositiveInteger(state.replay_duration_seconds) || null,
    source: trimString(state.last_source) || "projector_state",
    error: trimString(state.last_error),
    updatedAt: state.updated_at,
    timezone: PROJECTOR_TIME_ZONE,
    checkedAtLocalTime,
  };
}

function createProjectorStateDefaults(): ProjectorStateRow {
  const now = isoNow();
  return {
    id: PROJECTOR_STATE_ID,
    mode: "offline",
    live_video_id: "",
    replay_video_id: "",
    replay_clock_video_id: "",
    replay_started_at: null,
    replay_duration_seconds: null,
    pending_archive_video_id: "",
    uploads_playlist_id: "",
    check_lease_expires_at: null,
    last_live_check_at: null,
    last_archive_check_at: null,
    last_source: "",
    last_error: "",
    created_at: now,
    updated_at: now,
  };
}

function createAdminClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase service-role configuration");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function ensureProjectorState(client: ReturnType<typeof createAdminClient>) {
  const insertedAt = isoNow();
  const { error: insertError } = await client
    .from("projector_state")
    .upsert(
      {
        id: PROJECTOR_STATE_ID,
        created_at: insertedAt,
        updated_at: insertedAt,
      },
      { onConflict: "id", ignoreDuplicates: true },
    );

  if (insertError) {
    throw insertError;
  }

  const { data, error } = await client
    .from("projector_state")
    .select("*")
    .eq("id", PROJECTOR_STATE_ID)
    .single();

  if (error) {
    throw error;
  }

  return data as ProjectorStateRow;
}

async function claimProjectorRefresh(client: ReturnType<typeof createAdminClient>) {
  const { data, error } = await client.rpc("claim_projector_refresh", {
    lease_seconds: REFRESH_LEASE_SECONDS,
  });

  if (error) {
    throw error;
  }

  return Boolean(data);
}

async function saveProjectorState(
  client: ReturnType<typeof createAdminClient>,
  state: ProjectorStateRow,
) {
  const { data, error } = await client
    .from("projector_state")
    .update({
      mode: state.mode,
      live_video_id: trimString(state.live_video_id),
      replay_video_id: trimString(state.replay_video_id),
      replay_clock_video_id: trimString(state.replay_clock_video_id),
      replay_started_at: state.replay_started_at,
      replay_duration_seconds: parsePositiveInteger(state.replay_duration_seconds) || null,
      pending_archive_video_id: trimString(state.pending_archive_video_id),
      uploads_playlist_id: trimString(state.uploads_playlist_id),
      check_lease_expires_at: null,
      last_live_check_at: state.last_live_check_at,
      last_archive_check_at: state.last_archive_check_at,
      last_source: trimString(state.last_source),
      last_error: trimString(state.last_error),
    })
    .eq("id", PROJECTOR_STATE_ID)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as ProjectorStateRow;
}

async function releaseProjectorLease(client: ReturnType<typeof createAdminClient>) {
  const { error } = await client
    .from("projector_state")
    .update({ check_lease_expires_at: null })
    .eq("id", PROJECTOR_STATE_ID);

  if (error) {
    throw error;
  }
}

async function fetchYoutubeJson<T>(url: URL) {
  const response = await fetch(url);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`YouTube request failed (${response.status}): ${errorText.slice(0, 300)}`);
  }
  return (await response.json()) as T;
}

async function fetchActiveLiveVideoId(youtubeApiKey: string, channelId: string) {
  const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
  searchUrl.searchParams.set("part", "id,snippet");
  searchUrl.searchParams.set("channelId", channelId);
  searchUrl.searchParams.set("eventType", "live");
  searchUrl.searchParams.set("type", "video");
  searchUrl.searchParams.set("maxResults", "1");
  searchUrl.searchParams.set("videoEmbeddable", "true");
  searchUrl.searchParams.set("key", youtubeApiKey);

  const payload = await fetchYoutubeJson<YoutubeSearchResponse>(searchUrl);
  const item = Array.isArray(payload.items) ? payload.items[0] : null;
  return trimString(item?.id?.videoId);
}

async function fetchLatestCompletedBroadcastVideoId(youtubeApiKey: string, channelId: string) {
  const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
  searchUrl.searchParams.set("part", "id");
  searchUrl.searchParams.set("channelId", channelId);
  searchUrl.searchParams.set("eventType", "completed");
  searchUrl.searchParams.set("type", "video");
  searchUrl.searchParams.set("order", "date");
  searchUrl.searchParams.set("maxResults", "1");
  searchUrl.searchParams.set("videoEmbeddable", "true");
  searchUrl.searchParams.set("key", youtubeApiKey);

  const payload = await fetchYoutubeJson<YoutubeSearchResponse>(searchUrl);
  const item = Array.isArray(payload.items) ? payload.items[0] : null;
  return trimString(item?.id?.videoId);
}

async function fetchUploadsPlaylistId(youtubeApiKey: string, channelId: string) {
  const channelsUrl = new URL("https://www.googleapis.com/youtube/v3/channels");
  channelsUrl.searchParams.set("part", "contentDetails");
  channelsUrl.searchParams.set("id", channelId);
  channelsUrl.searchParams.set("key", youtubeApiKey);

  const payload = await fetchYoutubeJson<YoutubeChannelsResponse>(channelsUrl);
  const item = Array.isArray(payload.items) ? payload.items[0] : null;
  return trimString(item?.contentDetails?.relatedPlaylists?.uploads);
}

async function fetchRecentUploadVideoIds(youtubeApiKey: string, uploadsPlaylistId: string) {
  const playlistUrl = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
  playlistUrl.searchParams.set("part", "snippet");
  playlistUrl.searchParams.set("playlistId", uploadsPlaylistId);
  playlistUrl.searchParams.set("maxResults", String(RECENT_UPLOAD_SCAN_LIMIT));
  playlistUrl.searchParams.set("key", youtubeApiKey);

  const payload = await fetchYoutubeJson<YoutubePlaylistItemsResponse>(playlistUrl);
  return Array.isArray(payload.items)
    ? payload.items
        .map((item) => trimString(item?.snippet?.resourceId?.videoId))
        .filter(Boolean)
    : [];
}

async function fetchVideoDurationSeconds(youtubeApiKey: string, videoId: string) {
  const videosUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
  videosUrl.searchParams.set("part", "contentDetails");
  videosUrl.searchParams.set("id", videoId);
  videosUrl.searchParams.set("key", youtubeApiKey);

  const payload = await fetchYoutubeJson<YoutubeVideosResponse>(videosUrl);
  const item = Array.isArray(payload.items) ? payload.items[0] : null;
  return parseIso8601DurationSeconds(trimString(item?.contentDetails?.duration));
}

async function synchronizeReplayClock(
  state: ProjectorStateRow,
  youtubeApiKey: string,
) {
  const replayVideoId = trimString(state.replay_video_id);
  if (!replayVideoId) {
    state.replay_clock_video_id = "";
    state.replay_started_at = null;
    state.replay_duration_seconds = null;
    return;
  }

  const replayClockVideoId = trimString(state.replay_clock_video_id);
  const hasDuration = parsePositiveInteger(state.replay_duration_seconds) > 0;
  if (replayClockVideoId !== replayVideoId || !hasDuration) {
    state.replay_duration_seconds = await fetchVideoDurationSeconds(youtubeApiKey, replayVideoId);
  }
  if (replayClockVideoId !== replayVideoId || !state.replay_started_at) {
    state.replay_started_at = isoNow();
  }
  state.replay_clock_video_id = replayVideoId;
}

async function refreshProjectorState(params: {
  client: ReturnType<typeof createAdminClient>;
  state: ProjectorStateRow;
  youtubeApiKey: string;
  channelId: string;
  nowMs: number;
  minutesSinceMidnight: number;
}) {
  const { client, youtubeApiKey, channelId, nowMs, minutesSinceMidnight } = params;
  const nextState: ProjectorStateRow = {
    ...params.state,
    live_video_id: trimString(params.state.live_video_id),
    replay_video_id: trimString(params.state.replay_video_id),
    replay_clock_video_id: trimString(params.state.replay_clock_video_id),
    replay_started_at: params.state.replay_started_at,
    replay_duration_seconds: parsePositiveInteger(params.state.replay_duration_seconds) || null,
    pending_archive_video_id: trimString(params.state.pending_archive_video_id),
    uploads_playlist_id: trimString(params.state.uploads_playlist_id),
    last_source: trimString(params.state.last_source),
    last_error: trimString(params.state.last_error),
  };
  let updated = false;

  const hasYoutubeConfig = Boolean(youtubeApiKey && channelId);
  if (!hasYoutubeConfig) {
    nextState.last_error = "missing_youtube_configuration";
    if (trimString(nextState.replay_video_id)) {
      nextState.mode = "replay";
    } else if (!trimString(nextState.live_video_id)) {
      nextState.mode = "offline";
    }
    return saveProjectorState(client, nextState);
  }

  if (shouldRunLiveCheck(nextState, nowMs, minutesSinceMidnight)) {
    nextState.last_live_check_at = isoNow();
    updated = true;
    try {
      const liveVideoId = await fetchActiveLiveVideoId(youtubeApiKey, channelId);
      nextState.last_error = "";

      if (liveVideoId) {
        nextState.mode = "live";
        nextState.live_video_id = liveVideoId;
        nextState.pending_archive_video_id = "";
        nextState.last_source = "youtube.live_search";
      } else if (trimString(nextState.live_video_id)) {
        nextState.pending_archive_video_id = trimString(nextState.live_video_id);
        nextState.live_video_id = "";
        nextState.mode = trimString(nextState.replay_video_id) ? "archive_pending" : "offline";
        nextState.last_source = "youtube.live_ended";
      } else if (trimString(nextState.replay_video_id)) {
        nextState.mode = trimString(nextState.pending_archive_video_id) ? "archive_pending" : "replay";
      } else {
        nextState.mode = "offline";
      }
    } catch (error) {
      nextState.last_error = error instanceof Error ? error.message : String(error);
      nextState.last_source = "youtube.live_search_error";
    }
  }

  if (shouldRunArchiveCheck(nextState, nowMs)) {
    nextState.last_archive_check_at = isoNow();
    updated = true;
    try {
      if (!trimString(nextState.uploads_playlist_id)) {
        nextState.uploads_playlist_id = await fetchUploadsPlaylistId(youtubeApiKey, channelId);
      }

      const pendingArchiveVideoId = trimString(nextState.pending_archive_video_id);
      if (pendingArchiveVideoId && trimString(nextState.uploads_playlist_id)) {
        const recentUploadVideoIds = await fetchRecentUploadVideoIds(
          youtubeApiKey,
          nextState.uploads_playlist_id,
        );

        if (recentUploadVideoIds.includes(pendingArchiveVideoId)) {
          nextState.replay_video_id = pendingArchiveVideoId;
          nextState.pending_archive_video_id = "";
          nextState.mode = "replay";
          nextState.last_source = "youtube.archive_ready";
          nextState.last_error = "";
        } else if (trimString(nextState.replay_video_id)) {
          nextState.mode = "archive_pending";
        }
      } else if (!trimString(nextState.replay_video_id)) {
        const replayVideoId = await fetchLatestCompletedBroadcastVideoId(youtubeApiKey, channelId);
        if (replayVideoId) {
          nextState.replay_video_id = replayVideoId;
          nextState.mode = nextState.mode === "live" ? "live" : "replay";
          nextState.last_source = "youtube.completed_bootstrap";
          nextState.last_error = "";
        }
      }
    } catch (error) {
      nextState.last_error = error instanceof Error ? error.message : String(error);
      nextState.last_source = "youtube.archive_check_error";
    }
  }

  if (nextState.mode !== "live") {
    nextState.live_video_id = "";
  }

  if (needsReplayClockRefresh(nextState)) {
    updated = true;
    nextState.last_archive_check_at = isoNow();
    try {
      await synchronizeReplayClock(nextState, youtubeApiKey);
      if (trimString(nextState.replay_video_id)) {
        nextState.last_source = "youtube.replay_clock_sync";
      }
      nextState.last_error = "";
    } catch (error) {
      nextState.last_error = error instanceof Error ? error.message : String(error);
      nextState.last_source = "youtube.replay_clock_error";
    }
  }

  if (nextState.mode !== "live" && trimString(nextState.replay_video_id) && !trimString(nextState.pending_archive_video_id)) {
    nextState.mode = "replay";
  }

  if (!trimString(nextState.replay_video_id) && !trimString(nextState.pending_archive_video_id) && nextState.mode !== "live") {
    nextState.mode = "offline";
  }

  if (!updated) {
    return nextState;
  }

  return saveProjectorState(client, nextState);
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "GET") {
    return json({ error: "Method not allowed" }, 405);
  }

  const playbackUrl = Deno.env.get("TBPN_PROJECTOR_STREAM_URL") ?? "";
  const mimeType = Deno.env.get("TBPN_PROJECTOR_STREAM_MIME_TYPE") ?? "application/vnd.apple.mpegurl";
  const forceLive = isTruthy(Deno.env.get("TBPN_PROJECTOR_FORCE_LIVE"));
  const youtubeApiKey = Deno.env.get("YOUTUBE_API_KEY") ?? "";
  const channelId = Deno.env.get("TBPN_YOUTUBE_CHANNEL_ID") ?? "";

  const pacificTime = getPacificTimeParts();

  try {
    const client = createAdminClient();
    let state = await ensureProjectorState(client);

    const nowMs = Date.now();
    const shouldRefresh =
      shouldRunLiveCheck(state, nowMs, pacificTime.minutesSinceMidnight) ||
      shouldRunArchiveCheck(state, nowMs) ||
      shouldRunReplayClockRepair(state, nowMs) ||
      (forceLive && !trimString(state.live_video_id) && !trimString(state.replay_video_id));

    if (shouldRefresh) {
      const claimedRefresh = await claimProjectorRefresh(client);
      if (claimedRefresh) {
        try {
          state = await refreshProjectorState({
            client,
            state,
            youtubeApiKey,
            channelId,
            nowMs,
            minutesSinceMidnight: pacificTime.minutesSinceMidnight,
          });
        } finally {
          await releaseProjectorLease(client);
        }
      } else {
        state = await ensureProjectorState(client);
      }
    }

    return json(
      buildProjectorResponse(state, playbackUrl, mimeType, pacificTime.localTimeLabel, forceLive),
    );
  } catch (error) {
    const fallbackState = createProjectorStateDefaults();
    fallbackState.last_error = error instanceof Error ? error.message : String(error);
    fallbackState.last_source = "tbpn_live_status_error";
    return json(
      buildProjectorResponse(fallbackState, playbackUrl, mimeType, pacificTime.localTimeLabel),
      200,
    );
  }
});
