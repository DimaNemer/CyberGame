import { supabase } from "./supabase";

// ── Constants ─────────────────────────────────────────────
const MAX_RETRIES  = 2;
const QUERY_LIMIT  = 50; // never fetch unlimited rows

// ── Safe fetch wrapper ────────────────────────────────────
// Wraps every Supabase call with timeout + error handling
async function safeQuery(queryFn, fallback = null) {
  try {
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request timeout")), 8000)
    );
    const result = await Promise.race([queryFn(), timeout]);
    return result;
  } catch (err) {
    // Never expose raw errors to UI
    console.error("[safeQuery]", err.message);
    return fallback;
  }
}

// ── Input validation ──────────────────────────────────────
function isValidUUID(str) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    .test(str);
}

function isValidScore(score) {
  return typeof score === "number" &&
    Number.isInteger(score) &&
    score >= 0 &&
    score <= 999999;
}

function isValidDuration(secs) {
  return typeof secs === "number" &&
    Number.isInteger(secs) &&
    secs >= 0 &&
    secs <= 86400; // max 24 hours
}

// ── Auth ──────────────────────────────────────────────────

export async function getSession() {
  return safeQuery(async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) return null;
    return data?.session ?? null;
  }, null);
}

export async function getCurrentUser() {
  return safeQuery(async () => {
    // getUser() is more secure than getSession()
    // It verifies the token with Supabase server
    // getSession() only checks local storage
    const { data, error } = await supabase.auth.getUser();
    if (error) return null;
    return data?.user ?? null;
  }, null);
}

// ── Profile ───────────────────────────────────────────────

export async function getProfile(userId) {
  // Validate input before hitting database
  if (!userId || !isValidUUID(userId)) {
    console.warn("[getProfile] Invalid userId");
    return null;
  }

  return safeQuery(async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        // Only select what UI actually needs
        // Never select sensitive fields like role unless needed
        "id, username, avatar_url, xp, level, total_wins, total_games, bio, badge_title, streak"
      )
      .eq("id", userId)
      .eq("is_banned", false) // banned users get no data
      .single();

    if (error) return null;
    return data;
  }, null);
}

export async function updateProfile(userId, updates) {
  if (!userId || !isValidUUID(userId)) {
    throw new Error("Invalid request.");
  }

  // Whitelist allowed fields — never let user update role/xp/wins directly
  const ALLOWED_FIELDS = ["username", "avatar_url", "bio"];
  const safeUpdates = {};

  for (const key of ALLOWED_FIELDS) {
    if (updates[key] !== undefined) {
      safeUpdates[key] = typeof updates[key] === "string"
        ? updates[key].trim().slice(0, 500) // limit length
        : updates[key];
    }
  }

  if (Object.keys(safeUpdates).length === 0) {
    throw new Error("No valid fields to update.");
  }

  return safeQuery(async () => {
    const { data, error } = await supabase
      .from("profiles")
      .update(safeUpdates)
      .eq("id", userId)
      .select("id, username, avatar_url, bio")
      .single();

    if (error) throw new Error("Could not update profile.");
    return data;
  }, null);
}

// ── Games ─────────────────────────────────────────────────

export async function getPublishedGames() {
  return safeQuery(async () => {
    const { data, error } = await supabase
      .from("games")
      .select(
        "id, title, description, category, difficulty, icon, plays, is_live, is_paid, price"
      )
      .eq("is_published", true)
      .eq("status", "approved")
      .order("plays", { ascending: false })
      .limit(QUERY_LIMIT); // always limit

    if (error) return [];
    return data ?? [];
  }, []);
}

export async function getFeaturedGames() {
  return safeQuery(async () => {
    const { data, error } = await supabase
      .from("games")
      .select(
        "id, title, category, difficulty, icon, plays, is_live"
      )
      .eq("is_published", true)
      .eq("status", "approved")
      .order("plays", { ascending: false })
      .limit(3);

    if (error) return [];
    return data ?? [];
  }, []);
}

// ── Leaderboard ───────────────────────────────────────────

export async function getGlobalLeaderboard(limit = 10) {
  // Cap limit — never allow unlimited queries
  const safeLimit = Math.min(Math.max(1, limit), 100);

  return safeQuery(async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        // Never expose email or sensitive data in leaderboard
        "id, username, avatar_url, xp, streak, total_wins, total_games"
      )
      .eq("is_banned", false)
      .order("streak", { ascending: false })
      .limit(safeLimit);

    if (error) return [];
    return data ?? [];
  }, []);
}

// ── Recent Activity ───────────────────────────────────────

export async function getRecentActivity(limit = 5) {
  const safeLimit = Math.min(Math.max(1, limit), 20);

  return safeQuery(async () => {
    const { data, error } = await supabase
      .from("game_sessions")
      .select(`
        id,
        score,
        played_at,
        result,
        profiles:player_id ( username, avatar_url ),
        games:game_id ( title, category )
      `)
      .order("played_at", { ascending: false })
      .limit(safeLimit);

    if (error) return [];

    // Sanitize output — remove any null/undefined entries
    return (data ?? []).filter(
      item => item.profiles?.username && item.games?.title
    );
  }, []);
}

// ── Streak ────────────────────────────────────────────────

export async function getStreak(userId) {
  if (!userId || !isValidUUID(userId)) return { current_streak: 0 };

  return safeQuery(async () => {
    const { data, error } = await supabase
      .from("streaks")
      .select("current_streak, longest_streak, last_played_date")
      .eq("user_id", userId)
      .single();

    if (error) return { current_streak: 0, longest_streak: 0 };
    return data;
  }, { current_streak: 0, longest_streak: 0 });
}

export async function updateStreak(userId) {
  if (!userId || !isValidUUID(userId)) return;

  // Use RPC — server controls streak logic
  // Prevents client from manipulating streak values
  return safeQuery(async () => {
    const { error } = await supabase
      .rpc("update_streak_secure", { p_user_id: userId });
    if (error) console.error("[updateStreak]", error.message);
  }, null);
}

// ── Game Session ──────────────────────────────────────────

export async function saveGameSession({
  gameId,
  playerId,
  score,
  result,
  durationSecs,
  roomId = null,
}) {
  // Strict validation — every field checked
  if (!gameId    || !isValidUUID(gameId))    throw new Error("Invalid game.");
  if (!playerId  || !isValidUUID(playerId))  throw new Error("Invalid player.");
  if (!isValidScore(score))                  throw new Error("Invalid score.");
  if (!isValidDuration(durationSecs))        throw new Error("Invalid duration.");
  if (!["win", "loss", "draw"].includes(result)) throw new Error("Invalid result.");
  if (roomId && !isValidUUID(roomId))        throw new Error("Invalid room.");

  return safeQuery(async () => {
    // 1 — Save session
    const { data, error } = await supabase
      .from("game_sessions")
      .insert({
        game_id:       gameId,
        player_id:     playerId,
        room_id:       roomId,
        score,
        result,
        duration_secs: durationSecs,
      })
      .select("id")
      .single();

    if (error) throw new Error("Could not save game result.");

    // 2 — Use RPC for all counter updates
    // Server handles logic — client never touches counters directly
    await supabase.rpc("increment_total_games", { user_id: playerId });

    if (result === "win") {
      await supabase.rpc("increment_wins", { user_id: playerId });
      await supabase.rpc("increment_xp", { user_id: playerId, amount: 25 });
    } else {
      // Even losses give small XP reward
      await supabase.rpc("increment_xp", { user_id: playerId, amount: 5 });
    }

    // 3 — Update streak via secure RPC
    await supabase.rpc("update_streak_secure", { p_user_id: playerId });

    return data;
  }, null);
}

// ── Notifications ─────────────────────────────────────────

export async function getNotifications(userId) {
  if (!userId || !isValidUUID(userId)) return [];

  return safeQuery(async () => {
    const { data, error } = await supabase
      .from("notifications")
      .select("id, type, content, is_read, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) return [];
    return data ?? [];
  }, []);
}

export async function markNotificationRead(notifId) {
  if (!notifId || !isValidUUID(notifId)) return;

  return safeQuery(async () => {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notifId);
  }, null);
}

// ── Friends ───────────────────────────────────────────────

export async function getFriends(userId) {
  if (!userId || !isValidUUID(userId)) return [];

  return safeQuery(async () => {
    const { data, error } = await supabase
      .from("friendships")
      .select(`
        id, status, created_at,
        requester:requester_id ( id, username, avatar_url, streak ),
        receiver:receiver_id  ( id, username, avatar_url, streak )
      `)
      .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
      .eq("status", "accepted")
      .limit(QUERY_LIMIT);

    if (error) return [];
    return data ?? [];
  }, []);
}

export async function sendFriendRequest(requesterId, receiverId) {
  if (!isValidUUID(requesterId) || !isValidUUID(receiverId)) {
    throw new Error("Invalid request.");
  }
  if (requesterId === receiverId) {
    throw new Error("Cannot add yourself.");
  }

  return safeQuery(async () => {
    const { error } = await supabase
      .from("friendships")
      .insert({ requester_id: requesterId, receiver_id: receiverId });

    if (error) {
      if (error.code === "23505") throw new Error("Request already sent.");
      throw new Error("Could not send request.");
    }
  }, null);
}

// ── Messages ──────────────────────────────────────────────

export async function getDirectMessages(userId, friendId) {
  if (!isValidUUID(userId) || !isValidUUID(friendId)) return [];

  return safeQuery(async () => {
    const { data, error } = await supabase
      .from("messages")
      .select("id, content, is_read, created_at, sender_id, receiver_id")
      .or(
        `and(sender_id.eq.${userId},receiver_id.eq.${friendId}),` +
        `and(sender_id.eq.${friendId},receiver_id.eq.${userId})`
      )
      .order("created_at", { ascending: true })
      .limit(100); // limit message history

    if (error) return [];
    return data ?? [];
  }, []);
}

export async function sendMessage({ senderId, receiverId = null, roomId = null, content }) {
  // Validate
  if (!isValidUUID(senderId))          throw new Error("Invalid sender.");
  if (!receiverId && !roomId)          throw new Error("No recipient.");
  if (receiverId && !isValidUUID(receiverId)) throw new Error("Invalid recipient.");
  if (roomId && !isValidUUID(roomId))  throw new Error("Invalid room.");

  // Sanitize content
  if (typeof content !== "string")     throw new Error("Invalid message.");
  const clean = content.trim().slice(0, 1000); // max 1000 chars
  if (clean.length === 0)              throw new Error("Empty message.");

  // Basic XSS prevention
  const sanitized = clean.replace(/[<>]/g, "");

  return safeQuery(async () => {
    const { data, error } = await supabase
      .from("messages")
      .insert({
        sender_id:   senderId,
        receiver_id: receiverId,
        room_id:     roomId,
        content:     sanitized,
      })
      .select("id, content, created_at")
      .single();

    if (error) throw new Error("Could not send message.");
    return data;
  }, null);
}