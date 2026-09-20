// ============================================================
// CHAIN MASTERS PRO — SUPABASE CLIENT
// Drop this file next to your chain-masters-pro.jsx
// Replace the two constants below with your actual values from:
// Supabase Dashboard → Settings → API
// ============================================================

const SUPABASE_URL  = "https://atezezziqrnhparwixvk.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0ZXplenppcXJuaHBhcndpeHZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzNjQ0MTgsImV4cCI6MjA5Nzk0MDQxOH0.earPtPk9zr0AHjAOvdsKBEVK8ErTkg2kVQSwK57ZkkA";

// ── Minimal Supabase REST client (no npm needed) ─────────────
// Wraps fetch so you can call the Supabase REST and Auth APIs
// directly from the browser without installing anything.

const headers = (token) => ({
  "Content-Type": "application/json",
  "apikey": SUPABASE_ANON,
  "Authorization": `Bearer ${token || SUPABASE_ANON}`,
  "Prefer": "return=representation",
});

// ── AUTH ─────────────────────────────────────────────────────
export const auth = {
  // Sign up with email + password + username
  async signUp(email, password, username) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ email, password, data: { username } }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message || data.msg);
    if (data.access_token) saveSession(data);
    return data;
  },

  // Sign in
  async signIn(email, password) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message || data.msg);
    saveSession(data);
    return data;
  },

  // Sign out
  async signOut() {
    const token = getToken();
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: "POST",
      headers: headers(token),
    });
    clearSession();
  },

  // Get current session from localStorage
  getSession() {
    try {
      const raw = localStorage.getItem("cmp_session");
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },

  // Refresh access token using refresh_token
  async refreshSession() {
    const session = this.getSession();
    if (!session?.refresh_token) return null;
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ refresh_token: session.refresh_token }),
    });
    const data = await res.json();
    if (data.access_token) saveSession(data);
    return data;
  },

  // Reset password email
  async resetPassword(email) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ email }),
    });
    return res.json();
  },
};

// ── SESSION HELPERS ──────────────────────────────────────────
function saveSession(data) {
  localStorage.setItem("cmp_session", JSON.stringify({
    access_token:  data.access_token,
    refresh_token: data.refresh_token,
    user:          data.user,
    expires_at:    Date.now() + (data.expires_in ?? 3600) * 1000,
  }));
}

function clearSession() {
  localStorage.removeItem("cmp_session");
}

export function getToken() {
  const s = auth.getSession();
  return s?.access_token ?? null;
}

export function getCurrentUser() {
  const s = auth.getSession();
  return s?.user ?? null;
}

// ── REST QUERY BUILDER ───────────────────────────────────────
// Usage:
//   db("leagues").select("*").eq("id", leagueId).single()
//   db("profiles").insert({ username: "Charlie" })
//   db("rosters").update({ is_starter: true }).eq("id", rosterId)
//   db("rosters").delete().eq("id", rosterId)

export function db(table) {
  let url    = `${SUPABASE_URL}/rest/v1/${table}`;
  let params = [];
  let method = "GET";
  let body   = null;
  let single = false;

  const builder = {
    select(cols = "*") { params.push(`select=${cols}`); return builder; },
    eq(col, val)       { params.push(`${col}=eq.${val}`); return builder; },
    neq(col, val)      { params.push(`${col}=neq.${val}`); return builder; },
    in(col, vals)      { params.push(`${col}=in.(${vals.join(",")})`); return builder; },
    order(col, { ascending = true } = {}) {
      params.push(`order=${col}.${ascending ? "asc" : "desc"}`);
      return builder;
    },
    limit(n)           { params.push(`limit=${n}`); return builder; },
    single()           { single = true; return builder; },

    insert(data) {
      method = "POST";
      body   = JSON.stringify(Array.isArray(data) ? data : [data]);
      return builder;
    },
    upsert(data, { onConflict } = {}) {
      method = "POST";
      body   = JSON.stringify(Array.isArray(data) ? data : [data]);
      params.push(`on_conflict=${onConflict ?? ""}`);
      return builder;
    },
    update(data) {
      method = "PATCH";
      body   = JSON.stringify(data);
      return builder;
    },
    delete() {
      method = "DELETE";
      return builder;
    },

    async then(resolve, reject) {
      try {
        const fullUrl = params.length ? `${url}?${params.join("&")}` : url;
        const token   = getToken();
        const hdrs    = { ...headers(token) };
        if (single) hdrs["Accept"] = "application/vnd.pgrst.object+json";

        const res  = await fetch(fullUrl, { method, headers: hdrs, body });
        const text = await res.text();
        const data = text ? JSON.parse(text) : null;

        if (!res.ok) {
          const err = new Error(data?.message || data?.hint || `DB error ${res.status}`);
          err.code  = data?.code;
          return reject ? reject(err) : Promise.reject(err);
        }
        return resolve ? resolve({ data, error: null }) : { data, error: null };
      } catch (e) {
        return reject ? reject(e) : Promise.reject(e);
      }
    },
  };

  return builder;
}

// ── REALTIME SUBSCRIPTION ────────────────────────────────────
// Usage:
//   const unsub = realtime("chat_messages", "league_id=eq.XYZ", (payload) => { ... });
//   unsub(); // to unsubscribe

export function realtime(table, filter, callback) {
  const token  = getToken();
  const wsUrl  = SUPABASE_URL.replace("https://", "wss://").replace("http://", "ws://");
  const ws     = new WebSocket(`${wsUrl}/realtime/v1/websocket?apikey=${SUPABASE_ANON}&vsn=1.0.0`);

  ws.onopen = () => {
    ws.send(JSON.stringify({ topic: "realtime:*", event: "phx_join", payload: {}, ref: null }));
    ws.send(JSON.stringify({
      topic:   `realtime:${table}`,
      event:   "phx_join",
      payload: {
        config: {
          broadcast:  { self: false },
          presence:   { key: "" },
          postgres_changes: [{ event: "*", schema: "public", table, filter }],
        },
        access_token: token,
      },
      ref: "1",
    }));
  };

  ws.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data);
      if (msg.event === "postgres_changes" || msg.event === "INSERT" || msg.event === "UPDATE" || msg.event === "DELETE") {
        callback(msg.payload);
      }
    } catch {}
  };

  ws.onerror = (e) => console.warn("Realtime error:", e);

  // Return unsubscribe function
  return () => ws.close();
}

// ── HIGH-LEVEL API ───────────────────────────────────────────
// Convenience wrappers for common operations

// -- Leagues --
export const leagues = {
  async create(name, commissionerId, settings, draftSettings) {
    const inviteCode = Math.random().toString(36).slice(2, 8).toUpperCase();
    const { data, error } = await db("leagues").insert({
      name, invite_code: inviteCode,
      commissioner_id: commissionerId,
      settings, draft_settings: draftSettings,
    });
    if (error) throw error;
    return data[0];
  },

  async getById(id) {
    const { data, error } = await db("leagues").select("*").eq("id", id).single();
    if (error) throw error;
    return data;
  },

  async getByInviteCode(code) {
    const { data, error } = await db("leagues").select("*").eq("invite_code", code.toUpperCase()).single();
    if (error) throw error;
    return data;
  },

  async updateSettings(id, settings) {
    return db("leagues").update({ settings }).eq("id", id);
  },

  async setDraftStatus(id, status, currentPick = 0) {
    return db("leagues").update({ draft_status: status, current_pick: currentPick }).eq("id", id);
  },
};

// -- Members --
export const members = {
  async join(leagueId, userId, teamName) {
    // Get existing member count to assign draft order
    const { data: existing } = await db("league_members")
      .select("id").eq("league_id", leagueId);
    const draftOrder = (existing?.length ?? 0) + 1;

    const { data, error } = await db("league_members").insert({
      league_id: leagueId, user_id: userId,
      team_name: teamName, draft_order: draftOrder,
    });
    if (error) throw error;
    return data[0];
  },

  async getByLeague(leagueId) {
    const { data, error } = await db("league_members")
      .select("*").eq("league_id", leagueId).order("draft_order");
    if (error) throw error;
    return data ?? [];
  },

  async getMyMembership(leagueId, userId) {
    const { data, error } = await db("league_members")
      .select("*").eq("league_id", leagueId).eq("user_id", userId).single();
    if (error) return null;
    return data;
  },
};

// -- Rosters --
export const rosters = {
  async getByLeague(leagueId) {
    const { data, error } = await db("rosters").select("*").eq("league_id", leagueId);
    if (error) throw error;
    return data ?? [];
  },

  async getByMember(memberId) {
    const { data, error } = await db("rosters").select("*").eq("member_id", memberId);
    if (error) throw error;
    return data ?? [];
  },

  async addPlayer(memberId, leagueId, playerId, playerName, via = "draft") {
    const { data, error } = await db("rosters").insert({
      member_id: memberId, league_id: leagueId,
      player_id: playerId, player_name: playerName,
      acquired_via: via,
    });
    if (error) throw error;
    return data[0];
  },

  async dropPlayer(memberId, playerId) {
    return db("rosters").delete().eq("member_id", memberId).eq("player_id", playerId);
  },

  async setStarter(memberId, playerId, isStarter) {
    return db("rosters").update({ is_starter: isStarter })
      .eq("member_id", memberId).eq("player_id", playerId);
  },
};

// -- Draft --
export const draft = {
  async recordPick(leagueId, memberId, playerId, playerName, pickNumber, round, bidAmount = null) {
    // Record the pick
    await db("draft_picks").insert({
      league_id: leagueId, member_id: memberId,
      player_id: playerId, player_name: playerName,
      pick_number: pickNumber, round, bid_amount: bidAmount,
    });
    // Add to roster
    await rosters.addPlayer(memberId, leagueId, playerId, playerName, "draft");
    // Advance league pick counter
    await db("leagues").update({ current_pick: pickNumber + 1 }).eq("id", leagueId);
  },

  async getPicksByLeague(leagueId) {
    const { data, error } = await db("draft_picks")
      .select("*").eq("league_id", leagueId).order("pick_number");
    if (error) throw error;
    return data ?? [];
  },
};

// -- Scores --
export const scores = {
  async enterEventScores(leagueId, eventName, eventDates, playerScores, recordedBy) {
    // playerScores = [{ playerId, playerName, strokesVsPar, didWin }]
    const rows = playerScores.map(s => ({
      league_id:      leagueId,
      event_name:     eventName,
      event_dates:    eventDates,
      player_id:      s.playerId,
      player_name:    s.playerName,
      strokes_vs_par: s.strokesVsPar,
      fantasy_pts:    (s.strokesVsPar * -1) + (s.didWin ? 1 : 0),
      did_win:        s.didWin ?? false,
      recorded_by:    recordedBy,
    }));
    const { data, error } = await db("event_scores").upsert(rows, { onConflict: "league_id,event_name,player_id" });
    if (error) throw error;
    return data;
  },

  async getByEvent(leagueId, eventName) {
    const { data, error } = await db("event_scores")
      .select("*").eq("league_id", leagueId).eq("event_name", eventName);
    if (error) throw error;
    return data ?? [];
  },

  async getSeasonTotals(leagueId) {
    // Returns { playerId -> totalFantasyPts }
    const { data, error } = await db("event_scores")
      .select("player_id,fantasy_pts").eq("league_id", leagueId);
    if (error) throw error;
    return (data ?? []).reduce((acc, row) => {
      acc[row.player_id] = (acc[row.player_id] ?? 0) + row.fantasy_pts;
      return acc;
    }, {});
  },
};

// -- Matchups --
export const matchups = {
  async generateWeek(leagueId, eventName, weekNumber, memberIds) {
    // Simple round-robin pairing
    const shuffled = [...memberIds].sort(() => Math.random() - 0.5);
    const pairs = [];
    for (let i = 0; i < shuffled.length - 1; i += 2) {
      pairs.push({ league_id: leagueId, event_name: eventName, week_number: weekNumber, team_a_id: shuffled[i], team_b_id: shuffled[i + 1] });
    }
    if (pairs.length === 0) return [];
    const { data, error } = await db("matchups").insert(pairs);
    if (error) throw error;
    return data;
  },

  async updateScores(matchupId, teamAPts, teamBPts, winnerId) {
    return db("matchups").update({ team_a_pts: teamAPts, team_b_pts: teamBPts, winner_id: winnerId }).eq("id", matchupId);
  },

  async getByLeague(leagueId) {
    const { data, error } = await db("matchups").select("*").eq("league_id", leagueId).order("week_number");
    if (error) throw error;
    return data ?? [];
  },
};

// -- Chat --
export const chat = {
  async send(leagueId, userId, teamName, message) {
    const { data, error } = await db("chat_messages").insert({ league_id: leagueId, user_id: userId, team_name: teamName, message });
    if (error) throw error;
    return data[0];
  },

  async getRecent(leagueId, limit = 50) {
    const { data, error } = await db("chat_messages")
      .select("*").eq("league_id", leagueId).order("sent_at", { ascending: false }).limit(limit);
    if (error) throw error;
    return (data ?? []).reverse();
  },

  subscribeToLeague(leagueId, onMessage) {
    return realtime("chat_messages", `league_id=eq.${leagueId}`, onMessage);
  },
};

// -- Trades --
export const trades = {
  async propose(leagueId, proposerId, receiverId, offeredPlayerIds, requestedPlayerIds) {
    const { data, error } = await db("trades").insert({
      league_id: leagueId, proposer_id: proposerId, receiver_id: receiverId,
      offered_player_ids: offeredPlayerIds, requested_player_ids: requestedPlayerIds,
    });
    if (error) throw error;
    return data[0];
  },

  async respond(tradeId, status) {
    // status = 'accepted' | 'rejected'
    return db("trades").update({ status, resolved_at: new Date().toISOString() }).eq("id", tradeId);
  },

  async getByLeague(leagueId) {
    const { data, error } = await db("trades").select("*").eq("league_id", leagueId).order("proposed_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
};

// -- Waivers --
export const waivers = {
  async claim(leagueId, memberId, playerId, playerName, dropPlayerId = null) {
    const { data, error } = await db("waiver_claims").insert({
      league_id: leagueId, member_id: memberId,
      player_id: playerId, player_name: playerName,
      drop_player_id: dropPlayerId,
    });
    if (error) throw error;
    return data[0];
  },
};

// -- Announcements --
export const announcements = {
  async post(leagueId, authorId, message) {
    return db("announcements").insert({ league_id: leagueId, author_id: authorId, message });
  },

  async getByLeague(leagueId) {
    const { data, error } = await db("announcements")
      .select("*").eq("league_id", leagueId).order("posted_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
};
