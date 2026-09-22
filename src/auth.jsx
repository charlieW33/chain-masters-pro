import { useState, useEffect, useCallback } from "react";
import { auth, getCurrentUser, leagues, members, rosters, draft, scores, chat, trades, waivers, realtime } from "./supabase.js";

// ── THEME (copy from main app) ───────────────────────────────
const T = {
  darkGreen: "#1a2e1a", green: "#2d5a2d", lightGreen: "#e8f0e8",
  accent: "#c9a84c", red: "#c0392b", text: "#1a1a1a", subtext: "#666",
  bg: "#f0f2f0", card: "#ffffff", border: "#e0e8e0",
};

// ── SHARED INPUT STYLE ───────────────────────────────────────
const inp = {
  width: "100%", padding: "13px 14px", borderRadius: 12,
  border: `1.5px solid ${T.border}`, fontSize: 15, marginBottom: 12,
  boxSizing: "border-box", background: "#fff", outline: "none", fontFamily: "inherit",
  color: T.text,
};

const Btn = ({ children, onClick, style = {}, outline = false, loading = false }) => (
  <button onClick={onClick} disabled={loading} style={{
    padding: "13px 18px", borderRadius: 12, fontWeight: 700, fontSize: 15,
    cursor: loading ? "default" : "pointer",
    border: outline ? `1.5px solid ${T.border}` : "none",
    background: loading ? "#aaa" : outline ? "#fff" : T.green,
    color: outline ? T.text : "#fff",
    fontFamily: "inherit", opacity: loading ? 0.7 : 1, ...style,
  }}>{loading ? "Loading…" : children}</button>
);

// ─────────────────────────────────────────────────────────────
// AUTH SCREEN — Sign Up / Sign In / Forgot Password
// ─────────────────────────────────────────────────────────────
export function AuthScreen({ onAuthed, onSignIn, onSignUp, loading: extLoading, error: extError }) {
  const [mode, setMode]       = useState("signin"); // signin | signup | forgot
  const [email, setEmail]     = useState("");
  const [password, setPass]   = useState("");
  const [username, setUser]   = useState("");
  const [localError, setLocalError] = useState("");
  const [info, setInfo]       = useState("");
  const [localLoading, setLocalLoading] = useState(false);

  const loading = extLoading || localLoading;
  const error = localError || (extError && !extError.startsWith("✓") ? extError : "");
  if (extError?.startsWith("✓") && !info) setInfo(extError);

  const handleSignUp = async () => {
    if (!username.trim() || !email.trim() || !password.trim())
      return setLocalError("Please fill in all fields.");
    if (password.length < 6)
      return setLocalError("Password must be at least 6 characters.");
    setLocalError("");
    if (onSignUp) {
      await onSignUp(email.trim(), password, username.trim());
      setMode("signin");
    } else {
      setLocalLoading(true);
      try {
        await auth.signUp(email.trim(), password, username.trim());
        setInfo("Check your email to confirm your account, then sign in.");
        setMode("signin");
      } catch (e) { setLocalError(e.message); }
      finally { setLocalLoading(false); }
    }
  };

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) return setLocalError("Please fill in all fields.");
    setLocalError("");
    if (onSignIn) {
      await onSignIn(email.trim(), password);
    } else {
      setLocalLoading(true);
      try {
        await auth.signIn(email.trim(), password);
        onAuthed?.(getCurrentUser());
      } catch (e) { setLocalError(e.message); }
      finally { setLocalLoading(false); }
    }
  };

  const handleForgot = async () => {
    if (!email.trim()) return setLocalError("Enter your email first.");
    setLocalError(""); setLocalLoading(true);
    try {
      await auth.resetPassword(email.trim());
      setInfo("Password reset email sent! Check your inbox.");
      setMode("signin");
    } catch (e) { setLocalError(e.message); }
    finally { setLocalLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: T.darkGreen, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ fontSize: 64, marginBottom: 10 }}>⚔️</div>
        <h1 style={{ color: "#fff", fontSize: 30, fontFamily: "'Georgia',serif", margin: "0 0 6px" }}>Warrior Fantasy DG</h1>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, margin: 0 }}>Draft. Compete. Conquer.</p>
      </div>

      <div style={{ background: T.card, borderRadius: 20, padding: 24, width: "100%", maxWidth: 380 }}>
        {/* Tab switcher */}
        <div style={{ display: "flex", background: T.bg, borderRadius: 12, padding: 4, marginBottom: 20 }}>
          {[["signin","Sign In"],["signup","Create Account"]].map(([m, label]) => (
            <button key={m} onClick={() => { setMode(m); setError(""); setInfo(""); }} style={{
              flex: 1, padding: "8px", borderRadius: 10, border: "none",
              background: mode === m ? T.green : "transparent",
              color: mode === m ? "#fff" : T.subtext,
              fontWeight: 700, fontSize: 13, cursor: "pointer",
            }}>{label}</button>
          ))}
        </div>

        {mode === "signup" && (
          <input style={inp} placeholder="Username" value={username} onChange={e => setUser(e.target.value)} />
        )}
        <input style={inp} type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} />
        {mode !== "forgot" && (
          <input style={{ ...inp, marginBottom: 4 }} type="password" placeholder="Password" value={password} onChange={e => setPass(e.target.value)}
            onKeyDown={e => e.key === "Enter" && (mode === "signin" ? handleSignIn() : handleSignUp())} />
        )}

        {mode === "signin" && (
          <button onClick={() => { setMode("forgot"); setError(""); }} style={{ background: "none", border: "none", color: T.green, fontSize: 13, cursor: "pointer", marginBottom: 14, padding: 0 }}>
            Forgot password?
          </button>
        )}

        {error && <p style={{ color: T.red, fontSize: 13, margin: "0 0 12px", textAlign: "center" }}>{error}</p>}
        {info  && <p style={{ color: T.green, fontSize: 13, margin: "0 0 12px", textAlign: "center" }}>{info}</p>}

        {mode === "signin"  && <Btn style={{ width: "100%" }} onClick={handleSignIn}  loading={loading}>Sign In</Btn>}
        {mode === "signup"  && <Btn style={{ width: "100%" }} onClick={handleSignUp}  loading={loading}>Create Account</Btn>}
        {mode === "forgot"  && (
          <>
            <Btn style={{ width: "100%", marginBottom: 10 }} onClick={handleForgot} loading={loading}>Send Reset Email</Btn>
            <Btn style={{ width: "100%" }} outline onClick={() => setMode("signin")}>Back to Sign In</Btn>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// HOOKS — wrap all Supabase calls so the main app stays clean
// ─────────────────────────────────────────────────────────────

// useAuth — tracks current user session
export function useAuth() {
  const [user, setUser] = useState(() => getCurrentUser());

  useEffect(() => {
    // Try refresh on mount in case token expired
    const session = auth.getSession();
    if (session && session.expires_at < Date.now()) {
      auth.refreshSession().then(d => {
        if (d?.user) setUser(d.user);
        else { auth.signOut(); setUser(null); }
      });
    }
  }, []);

  const signOut = useCallback(async () => {
    await auth.signOut();
    setUser(null);
  }, []);

  return { user, setUser, signOut };
}

// useLeague — load a league + its members + rosters
export function useLeague(leagueId) {
  const [league,  setLeague]  = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [allRosters,  setAllRosters]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = useCallback(async () => {
    if (!leagueId) return;
    setLoading(true);
    try {
      const [lg, mems, rosts] = await Promise.all([
        leagues.getById(leagueId),
        members.getByLeague(leagueId),
        rosters.getByLeague(leagueId),
      ]);
      setLeague(lg);
      setTeamMembers(mems);
      setAllRosters(rosts);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [leagueId]);

  useEffect(() => { load(); }, [load]);

  // Real-time: re-fetch when rosters change
  useEffect(() => {
    if (!leagueId) return;
    const unsub = realtime("rosters", `league_id=eq.${leagueId}`, load);
    return unsub;
  }, [leagueId, load]);

  return { league, teamMembers, allRosters, loading, error, reload: load };
}

// useMyRoster — the current user's roster for a league
export function useMyRoster(memberId) {
  const [roster,  setRoster]  = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!memberId) return;
    const data = await rosters.getByMember(memberId);
    setRoster(data);
    setLoading(false);
  }, [memberId]);

  useEffect(() => { load(); }, [load]);

  const setStarter = useCallback(async (playerId, isStarter) => {
    await rosters.setStarter(memberId, playerId, isStarter);
    setRoster(prev => prev.map(p => p.player_id === playerId ? { ...p, is_starter: isStarter } : p));
  }, [memberId]);

  const dropPlayer = useCallback(async (playerId) => {
    await rosters.dropPlayer(memberId, playerId);
    setRoster(prev => prev.filter(p => p.player_id !== playerId));
  }, [memberId]);

  return { roster, loading, setStarter, dropPlayer, reload: load };
}

// useChat — real-time league chat
export function useChat(leagueId) {
  const [messages, setMessages] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!leagueId) return;
    chat.getRecent(leagueId).then(msgs => {
      setMessages(msgs);
      setLoading(false);
    });
    // Subscribe to new messages
    const unsub = chat.subscribeToLeague(leagueId, (payload) => {
      const newMsg = payload?.data?.record ?? payload?.record;
      if (newMsg) setMessages(prev => [...prev, newMsg]);
    });
    return unsub;
  }, [leagueId]);

  const sendMessage = useCallback(async (userId, teamName, message) => {
    if (!message.trim()) return;
    const msg = await chat.send(leagueId, userId, teamName, message.trim());
    // Optimistic update
    setMessages(prev => [...prev, { ...msg, sent_at: new Date().toISOString() }]);
    return msg;
  }, [leagueId]);

  return { messages, loading, sendMessage };
}

// useDraft — real-time draft state
export function useDraft(leagueId) {
  const [picks,    setPicks]   = useState([]);
  const [loading,  setLoading] = useState(true);

  const loadPicks = useCallback(async () => {
    if (!leagueId) return;
    const data = await draft.getPicksByLeague(leagueId);
    setPicks(data);
    setLoading(false);
  }, [leagueId]);

  useEffect(() => { loadPicks(); }, [loadPicks]);

  // Real-time draft picks
  useEffect(() => {
    if (!leagueId) return;
    const unsub = realtime("draft_picks", `league_id=eq.${leagueId}`, loadPicks);
    return unsub;
  }, [leagueId, loadPicks]);

  const makePick = useCallback(async (memberId, playerId, playerName, pickNumber, round, bidAmount = null) => {
    await draft.recordPick(leagueId, memberId, playerId, playerName, pickNumber, round, bidAmount);
    await loadPicks();
  }, [leagueId, loadPicks]);

  return { picks, loading, makePick };
}

// useScores — season totals + per-event scores
export function useScores(leagueId) {
  const [totals,  setTotals]  = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!leagueId) return;
    scores.getSeasonTotals(leagueId).then(t => {
      setTotals(t);
      setLoading(false);
    });
  }, [leagueId]);

  // Commissioner: enter scores for an event
  const enterScores = useCallback(async (eventName, eventDates, playerScores, userId) => {
    await scores.enterEventScores(leagueId, eventName, eventDates, playerScores, userId);
    const updated = await scores.getSeasonTotals(leagueId);
    setTotals(updated);
  }, [leagueId]);

  return { totals, loading, enterScores };
}

// useMatchups
export function useMatchups(leagueId) {
  const [allMatchups, setAllMatchups] = useState([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    if (!leagueId) return;
    import("./supabase.js").then(({ matchups: m }) =>
      m.getByLeague(leagueId).then(data => {
        setAllMatchups(data);
        setLoading(false);
      })
    );
  }, [leagueId]);

  return { allMatchups, loading };
}

// ─────────────────────────────────────────────────────────────
// SCORE ENTRY PANEL — Commissioner tool for entering results
// ─────────────────────────────────────────────────────────────
export function ScoreEntryPanel({ leagueId, userId, allPlayers, onSaved }) {
  const [event,    setEvent]   = useState("");
  const [dates,    setDates]   = useState("");
  const [entries,  setEntries] = useState([]); // [{ playerId, playerName, strokesVsPar, didWin }]
  const [search,   setSearch]  = useState("");
  const [saving,   setSaving]  = useState(false);
  const [saved,    setSaved]   = useState(false);

  const filtered = allPlayers.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const setScore = (playerId, field, value) => {
    setEntries(prev => {
      const existing = prev.find(e => e.playerId === playerId);
      if (existing) return prev.map(e => e.playerId === playerId ? { ...e, [field]: value } : e);
      const player = allPlayers.find(p => p.id === playerId);
      return [...prev, { playerId, playerName: player.name, strokesVsPar: 0, didWin: false, [field]: value }];
    });
  };

  const getEntry = (playerId) => entries.find(e => e.playerId === playerId) ?? { strokesVsPar: 0, didWin: false };

  const handleSave = async () => {
    if (!event.trim()) return alert("Enter event name");
    if (entries.length === 0) return alert("Enter at least one score");
    setSaving(true);
    try {
      await scores.enterEventScores(leagueId, event, dates, entries, userId);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onSaved?.();
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ padding: "0 0 20px" }}>
      <p style={{ fontSize: 12, fontWeight: 700, color: T.subtext, letterSpacing: 1, margin: "0 0 12px" }}>ENTER EVENT SCORES</p>

      <input style={{ ...inp, marginBottom: 8 }} placeholder="Event name" value={event} onChange={e => setEvent(e.target.value)} />
      <input style={{ ...inp, marginBottom: 12 }} placeholder="Dates (e.g. Jun 4–7)" value={dates} onChange={e => setDates(e.target.value)} />
      <input style={{ ...inp, marginBottom: 12 }} placeholder="🔍 Search players" value={search} onChange={e => setSearch(e.target.value)} />

      <div style={{ maxHeight: 320, overflowY: "auto" }}>
        {filtered.map(p => {
          const entry = getEntry(p.id);
          return (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
              <div style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{p.name}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <button onClick={() => setScore(p.id, "strokesVsPar", entry.strokesVsPar - 1)}
                  style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${T.border}`, background: "#fff", cursor: "pointer", fontWeight: 700 }}>−</button>
                <div style={{ width: 40, textAlign: "center", fontWeight: 800, fontSize: 15, color: entry.strokesVsPar < 0 ? T.green : entry.strokesVsPar > 0 ? T.red : T.subtext }}>
                  {entry.strokesVsPar > 0 ? "+" : ""}{entry.strokesVsPar}
                </div>
                <button onClick={() => setScore(p.id, "strokesVsPar", entry.strokesVsPar + 1)}
                  style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${T.border}`, background: "#fff", cursor: "pointer", fontWeight: 700 }}>+</button>
              </div>
              <button onClick={() => setScore(p.id, "didWin", !entry.didWin)} style={{
                width: 32, height: 32, borderRadius: 8, border: `1.5px solid ${entry.didWin ? T.accent : T.border}`,
                background: entry.didWin ? T.accent : "#fff", color: entry.didWin ? "#fff" : T.subtext,
                cursor: "pointer", fontWeight: 700, fontSize: 14,
              }}>🏆</button>
            </div>
          );
        })}
      </div>

      <Btn style={{ width: "100%", marginTop: 16 }} onClick={handleSave} loading={saving}>
        {saved ? "✓ Scores Saved!" : "Save Scores"}
      </Btn>
      <p style={{ color: T.subtext, fontSize: 12, textAlign: "center", marginTop: 8 }}>
        Fantasy pts = (strokes vs par × −1) + 1 win bonus
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TRADE PROPOSAL UI
// ─────────────────────────────────────────────────────────────
export function TradeProposalPanel({ leagueId, myMemberId, myRoster, otherTeams, allRosters, onProposed }) {
  const [selectedTeam,     setSelectedTeam]     = useState(null);
  const [offeredPlayers,   setOfferedPlayers]   = useState([]);
  const [requestedPlayers, setRequestedPlayers] = useState([]);
  const [submitting,       setSubmitting]       = useState(false);
  const [done,             setDone]             = useState(false);

  const theirRoster = allRosters.filter(r => r.member_id === selectedTeam?.id);

  const toggle = (arr, setArr, id) =>
    setArr(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handlePropose = async () => {
    if (!selectedTeam || offeredPlayers.length === 0 || requestedPlayers.length === 0)
      return alert("Select a team and at least one player on each side.");
    setSubmitting(true);
    try {
      await trades.propose(leagueId, myMemberId, selectedTeam.id, offeredPlayers, requestedPlayers);
      setDone(true);
      onProposed?.();
    } catch (e) { alert(e.message); }
    finally { setSubmitting(false); }
  };

  if (done) return <p style={{ color: T.green, fontWeight: 700, textAlign: "center" }}>✓ Trade proposal sent!</p>;

  return (
    <div>
      <p style={{ fontSize: 12, fontWeight: 700, color: T.subtext, letterSpacing: 1, margin: "0 0 12px" }}>SELECT TEAM TO TRADE WITH</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {otherTeams.map(t => (
          <button key={t.id} onClick={() => { setSelectedTeam(t); setRequestedPlayers([]); }} style={{
            padding: "8px 14px", borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: "pointer",
            background: selectedTeam?.id === t.id ? T.green : "#fff",
            color: selectedTeam?.id === t.id ? "#fff" : T.text,
            border: `1.5px solid ${selectedTeam?.id === t.id ? T.green : T.border}`,
          }}>{t.team_name}</button>
        ))}
      </div>

      {selectedTeam && (<>
        <p style={{ fontSize: 12, fontWeight: 700, color: T.subtext, letterSpacing: 1, margin: "0 0 8px" }}>YOU OFFER (tap to select)</p>
        {myRoster.map(p => (
          <div key={p.player_id} onClick={() => toggle(offeredPlayers, setOfferedPlayers, p.player_id)}
            style={{ padding: "9px 12px", marginBottom: 6, borderRadius: 10, cursor: "pointer",
              background: offeredPlayers.includes(p.player_id) ? T.lightGreen : "#fff",
              border: `1.5px solid ${offeredPlayers.includes(p.player_id) ? T.green : T.border}`,
              fontWeight: offeredPlayers.includes(p.player_id) ? 700 : 400, fontSize: 14 }}>
            {offeredPlayers.includes(p.player_id) ? "✓ " : ""}{p.player_name}
          </div>
        ))}

        <p style={{ fontSize: 12, fontWeight: 700, color: T.subtext, letterSpacing: 1, margin: "12px 0 8px" }}>YOU WANT (tap to select)</p>
        {theirRoster.map(p => (
          <div key={p.player_id} onClick={() => toggle(requestedPlayers, setRequestedPlayers, p.player_id)}
            style={{ padding: "9px 12px", marginBottom: 6, borderRadius: 10, cursor: "pointer",
              background: requestedPlayers.includes(p.player_id) ? T.lightGreen : "#fff",
              border: `1.5px solid ${requestedPlayers.includes(p.player_id) ? T.green : T.border}`,
              fontWeight: requestedPlayers.includes(p.player_id) ? 700 : 400, fontSize: 14 }}>
            {requestedPlayers.includes(p.player_id) ? "✓ " : ""}{p.player_name}
          </div>
        ))}

        <Btn style={{ width: "100%", marginTop: 14 }} onClick={handlePropose} loading={submitting}>
          Send Trade Proposal →
        </Btn>
      </>)}
    </div>
  );
}
