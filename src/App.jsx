import { useState, useEffect, useRef } from "react";
import { AuthScreen, useAuth } from "./auth.jsx";
import { auth, leagues as leaguesApi, members as membersApi, rosters as rostersApi, getCurrentUser } from "./supabase.js";

// ── THEME ───────────────────────────────────────────────────────────────
const T = {
  darkGreen: "#1a2e1a", green: "#2d5a2d", lightGreen: "#e8f0e8",
  accent: "#c9a84c", red: "#c0392b", text: "#1a1a1a", subtext: "#666",
  bg: "#f0f2f0", card: "#ffffff", border: "#e0e8e0",
};

// ── 2026 DGPT DATA ──────────────────────────────────────────────────────
const COMPLETED = [
  { name: "Supreme Flight Open",  location: "Brooksville, FL",      dates: "Feb 27–Mar 1", winner: "Ricky Wysocki",  score: -24 },
  { name: "MVP Big Easy Open",    location: "Jefferson Parish, LA",  dates: "Mar 13–15",    winner: "Gannon Buhr",    score: -11 },
  { name: "Queen City Classic",   location: "Charlotte, NC",         dates: "Mar 27–29",    winner: "Gannon Buhr",    score: -23 },
  { name: "PDGA Champions Cup",   location: "Lynchburg, VA",         dates: "Apr 9–12",     winner: "Niklas Anttila", score: -27 },
  { name: "Jonesboro Open",       location: "Jonesboro, AR",         dates: "Apr 17–19",    winner: "Gannon Buhr",    score: -31 },
  { name: "KC Wide Open",         location: "Liberty, MO",           dates: "Apr 24–26",    winner: "Cole Redalen",   score: -23 },
  { name: "WACO",                 location: "Waco, TX",              dates: "May 1–3",      winner: "Emerson Keith",  score: -29 },
  { name: "Open at Austin",       location: "Austin, TX",            dates: "May 7–10",     winner: "Paul Ulibarri",  score: -36 },
  { name: "OTB Open",             location: "Stockton, CA",          dates: "May 21–24",    winner: "Calvin Heimburg",score: -37 },
];

const UPCOMING = [
  { name: "Northwest Championship", location: "Portland, OR",     dates: "Jun 4–7",      tier: "DGPT",    status: "live" },
  { name: "European Open",          location: "Tallinn, Estonia", dates: "Jun 18–21",    tier: "Major",   status: "upcoming" },
  { name: "Swedish Open",           location: "Borås, Sweden",    dates: "Jun 26–28",    tier: "DGPT+",   status: "upcoming" },
  { name: "Ledgestone Open",        location: "Peoria, IL",       dates: "Jul 30–Aug 2", tier: "DGPT",    status: "upcoming" },
  { name: "PDGA Pro Worlds",        location: "Milford, MI",      dates: "Aug 26–30",    tier: "Major",   status: "upcoming" },
  { name: "USDGC",                  location: "Rock Hill, SC",    dates: "Oct 8–11",     tier: "Major",   status: "upcoming" },
  { name: "Powerball Cup",          location: "Lynchburg, VA",    dates: "Oct 15–18",    tier: "Playoff", status: "upcoming" },
];

// Full draftable player pool — 30 real DGPT MPO pros with 2026 stats
const ALL_PLAYERS = [
  { id:1,  name:"Gannon Buhr",      ini:"GB", div:"MPO", rating:1055, wins:3, top5:6, events:9, total:98,  avg:10.9 },
  { id:2,  name:"Calvin Heimburg",  ini:"CH", div:"MPO", rating:1052, wins:1, top5:5, events:9, total:79,  avg:8.8  },
  { id:3,  name:"Ricky Wysocki",    ini:"RW", div:"MPO", rating:1058, wins:1, top5:4, events:8, total:72,  avg:9.0  },
  { id:4,  name:"Cole Redalen",     ini:"CR", div:"MPO", rating:1042, wins:1, top5:4, events:9, total:64,  avg:7.1  },
  { id:5,  name:"Paul Ulibarri",    ini:"PU", div:"MPO", rating:1041, wins:1, top5:3, events:8, total:61,  avg:7.6  },
  { id:6,  name:"Niklas Anttila",   ini:"NA", div:"MPO", rating:1048, wins:1, top5:4, events:9, total:58,  avg:6.4  },
  { id:7,  name:"Emerson Keith",    ini:"EK", div:"MPO", rating:1039, wins:1, top5:3, events:9, total:55,  avg:6.1  },
  { id:8,  name:"Paul McBeth",      ini:"PM", div:"MPO", rating:1049, wins:0, top5:4, events:9, total:48,  avg:5.3  },
  { id:9,  name:"Chris Dickerson",  ini:"CD", div:"MPO", rating:1046, wins:0, top5:3, events:9, total:42,  avg:4.7  },
  { id:10, name:"Eagle McMahon",    ini:"EM", div:"MPO", rating:1044, wins:0, top5:2, events:7, total:31,  avg:4.4  },
  { id:11, name:"Anthony Barela",   ini:"AB", div:"MPO", rating:1043, wins:0, top5:3, events:9, total:29,  avg:3.2  },
  { id:12, name:"Adam Hammes",      ini:"AH", div:"MPO", rating:1041, wins:0, top5:2, events:8, total:25,  avg:3.1  },
  { id:13, name:"Ezra Aderhold",    ini:"EA", div:"MPO", rating:1038, wins:0, top5:2, events:9, total:22,  avg:2.4  },
  { id:14, name:"Aaron Gossage",    ini:"AG", div:"MPO", rating:1044, wins:0, top5:2, events:7, total:21,  avg:3.0  },
  { id:15, name:"James Conrad",     ini:"JC", div:"MPO", rating:1040, wins:0, top5:1, events:8, total:18,  avg:2.3  },
  { id:16, name:"Isaac Robinson",   ini:"IR", div:"MPO", rating:1036, wins:0, top5:1, events:9, total:16,  avg:1.8  },
  { id:17, name:"Garrett Gurthie",  ini:"GG", div:"MPO", rating:1033, wins:0, top5:1, events:8, total:14,  avg:1.8  },
  { id:18, name:"Corey Ellis",      ini:"CE", div:"MPO", rating:1037, wins:0, top5:1, events:9, total:13,  avg:1.4  },
  { id:19, name:"Kyle Klein",       ini:"KK", div:"MPO", rating:1035, wins:0, top5:1, events:7, total:12,  avg:1.7  },
  { id:20, name:"Sullivan Tipton",  ini:"ST", div:"MPO", rating:1031, wins:0, top5:0, events:8, total:8,   avg:1.0  },
  { id:21, name:"Joel Freeman",     ini:"JF", div:"MPO", rating:1029, wins:0, top5:0, events:6, total:7,   avg:1.2  },
  { id:22, name:"Andrew Marwede",   ini:"AM", div:"MPO", rating:1028, wins:0, top5:0, events:7, total:6,   avg:0.9  },
  { id:23, name:"Braeden Sides",    ini:"BS", div:"MPO", rating:1025, wins:0, top5:0, events:5, total:5,   avg:1.0  },
  { id:24, name:"Casey White",      ini:"CW", div:"MPO", rating:1022, wins:0, top5:0, events:6, total:4,   avg:0.7  },
  { id:25, name:"Kevin Jones",      ini:"KJ", div:"MPO", rating:1030, wins:0, top5:0, events:7, total:6,   avg:0.9  },
  { id:26, name:"Drew Gibson",      ini:"DG", div:"MPO", rating:1038, wins:0, top5:1, events:5, total:9,   avg:1.8  },
  { id:27, name:"Alden Harris",     ini:"AH2",div:"MPO", rating:1026, wins:0, top5:0, events:6, total:4,   avg:0.7  },
  { id:28, name:"Matt Bell",        ini:"MB", div:"MPO", rating:1024, wins:0, top5:0, events:5, total:3,   avg:0.6  },
  { id:29, name:"Grady Shue",       ini:"GS", div:"MPO", rating:1020, wins:0, top5:0, events:4, total:2,   avg:0.5  },
  { id:30, name:"Cale Leiviska",    ini:"CL", div:"MPO", rating:1019, wins:0, top5:0, events:4, total:2,   avg:0.5  },
];

// CPU team names (up to 29 possible CPU teams)
const CPU_TEAMS = [
  "Ace Hunters", "Hyzer Heroes", "Chain Gang", "Birdie Bandits",
  "Disc Destroyers", "Turbo Putters", "Sky Gods", "Mando Breakers",
  "Feldberg's Flock", "McBeast Mode", "Hyzer Bomb Squad", "Roller Derby",
  "Birdies & Bogeys", "The Spike Hyzer Gang", "Disc Jockeys", "Eagle Chasers",
  "Chain Rattle Crew", "The Forehand Files", "Par Breakers", "Anny Away",
  "Hyzer Flip Kings", "The Understables", "Skip Shot Society", "Roller Coasters",
  "OB Risk Takers", "The Misflight Crew", "Birdie or Bust", "Sidearm Saints",
  "Full Flight Fanatics",
];

// Generate a CPU team object with simulated roster & pts
const makeCpuTeam = (name, rosterCap, startersPerWeek) => {
  // Randomly sample players (seeded by name for consistency)
  const seed = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const shuffled = [...ALL_PLAYERS].sort((a, b) => {
    const ha = Math.sin(seed * a.id) * 10000;
    const hb = Math.sin(seed * b.id) * 10000;
    return (ha - Math.floor(ha)) - (hb - Math.floor(hb));
  });
  const roster = shuffled.slice(0, rosterCap).map((p, i) => ({ ...p, starter: i < startersPerWeek }));
  const pts = roster.filter(p => p.starter).reduce((s, p) => s + Math.round(p.total * (0.6 + (Math.sin(seed) * 0.5 + 0.5) * 0.8)), 0);
  return { name, type: "cpu", pts, roster };
};

// ── SHARED COMPONENTS ───────────────────────────────────────────────────
const Av = ({ ini, size = 44, color = T.green }) => (
  <div style={{
    width: size, height: size, borderRadius: 10, background: color, color: "#fff",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: size * 0.28, fontWeight: 700, flexShrink: 0,
  }}>{ini}</div>
);

const Badge = ({ label, color = T.subtext, bg = "#fff" }) => (
  <span style={{
    border: `1.5px solid ${T.border}`, borderRadius: 20, padding: "2px 9px",
    fontSize: 11, fontWeight: 600, color, background: bg,
  }}>{label}</span>
);

const Card = ({ children, style = {}, onClick }) => (
  <div onClick={onClick} style={{
    background: T.card, borderRadius: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
    padding: "16px", marginBottom: 12, cursor: onClick ? "pointer" : "default", ...style,
  }}>{children}</div>
);

const Btn = ({ children, onClick, style = {}, outline = false, danger = false }) => (
  <button onClick={onClick} style={{
    padding: "11px 18px", borderRadius: 12, fontWeight: 700, fontSize: 14,
    cursor: "pointer", border: outline ? `1.5px solid ${danger ? T.red : T.border}` : "none",
    background: outline ? "#fff" : danger ? T.red : T.green,
    color: outline ? (danger ? T.red : T.text) : "#fff",
    fontFamily: "inherit", ...style,
  }}>{children}</button>
);

const NavBar = ({ leagueName, onMenu, onHome }) => (
  <div style={{
    background: T.darkGreen, padding: "14px 16px",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    position: "sticky", top: 0, zIndex: 100,
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={onHome}>
      <div style={{
        width: 36, height: 36, borderRadius: 8,
        background: "linear-gradient(135deg, #3d7a3d, #c9a84c)",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
      }}>⚔️</div>
      <span style={{ color: "#fff", fontWeight: 700, fontSize: 16, fontFamily: "'Georgia',serif" }}>
        {leagueName}
      </span>
    </div>
    <button onClick={onMenu} style={{ background: "rgba(255,255,255,0.12)", border: "none", color: "#fff", fontSize: 14, fontWeight: 700, padding: "6px 12px", borderRadius: 10, cursor: "pointer" }}>More ☰</button>
  </div>
);

// Side drawer for extra pages
const SideDrawer = ({ open, onClose, setPage }) => {
  const extras = [
    { id: "matchup",   icon: "⚔️",  label: "Matchups" },
    { id: "bracket",   icon: "🏅",  label: "Playoff Bracket" },
    { id: "power",     icon: "📊",  label: "Power Rankings" },
    { id: "recap",     icon: "📋",  label: "Weekly Recap" },
    { id: "chat",      icon: "💬",  label: "League Chat" },
    { id: "injuries",  icon: "🚑",  label: "Injury Report" },
    { id: "history",   icon: "📖",  label: "League History" },
    { id: "commish",   icon: "⚙️",  label: "Commissioner" },
  ];
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300 }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} onClick={onClose} />
      <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 260, background: T.card, overflowY: "auto", boxShadow: "-4px 0 20px rgba(0,0,0,0.2)" }}>
        <div style={{ background: T.darkGreen, padding: "20px 16px 16px" }}>
          <div style={{ color: "#fff", fontWeight: 800, fontSize: 18, fontFamily: "'Georgia',serif" }}>⚔️ More</div>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 2 }}>Chain Masters Pro</div>
        </div>
        {extras.map(e => (
          <button key={e.id} onClick={() => { setPage(e.id); onClose(); }} style={{
            width: "100%", padding: "14px 16px", background: "none", border: "none",
            borderBottom: `1px solid ${T.border}`, cursor: "pointer", display: "flex",
            alignItems: "center", gap: 12, textAlign: "left",
          }}>
            <span style={{ fontSize: 20 }}>{e.icon}</span>
            <span style={{ fontWeight: 600, fontSize: 15, color: T.text }}>{e.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const BottomNav = ({ page, setPage }) => {
  const tabs = [
    { id: "home", icon: "🏠", label: "Home" },
    { id: "team", icon: "👥", label: "My Team" },
    { id: "waivers", icon: "📋", label: "Waivers" },
    { id: "standings", icon: "🏆", label: "Standings" },
    { id: "trades", icon: "🔄", label: "Trades" },
  ];
  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, background: T.card,
      borderTop: `1px solid ${T.border}`, display: "flex", maxWidth: 480, margin: "0 auto",
    }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => setPage(t.id)} style={{
          flex: 1, padding: "10px 4px 14px", background: "none", border: "none",
          cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
        }}>
          <span style={{ fontSize: 18 }}>{t.icon}</span>
          <span style={{ fontSize: 10, fontWeight: page === t.id ? 700 : 400, color: page === t.id ? T.green : T.subtext }}>
            {t.label}
          </span>
          {page === t.id && <div style={{ width: 4, height: 4, borderRadius: 2, background: T.green }} />}
        </button>
      ))}
    </div>
  );
};

// ── SHARED SUB-COMPONENTS ───────────────────────────────────────────────
const SettingRow = ({ label, sub, children }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${T.border}` }}>
    <div>
      <div style={{ fontWeight: 600, fontSize: 14 }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: T.subtext, marginTop: 2 }}>{sub}</div>}
    </div>
    {children}
  </div>
);

const Stepper = ({ value, onChange, min, max }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
    <button onClick={() => value > min && onChange(value - 1)} style={{
      width: 34, height: 34, borderRadius: "8px 0 0 8px", border: `1.5px solid ${T.border}`,
      background: value <= min ? "#f5f5f5" : "#fff", color: value <= min ? T.subtext : T.text,
      fontSize: 18, fontWeight: 700, cursor: value <= min ? "default" : "pointer", lineHeight: 1,
    }}>−</button>
    <div style={{
      width: 42, height: 34, display: "flex", alignItems: "center", justifyContent: "center",
      border: `1.5px solid ${T.border}`, borderLeft: "none", borderRight: "none",
      fontWeight: 700, fontSize: 16, background: "#fff",
    }}>{value}</div>
    <button onClick={() => value < max && onChange(value + 1)} style={{
      width: 34, height: 34, borderRadius: "0 8px 8px 0", border: `1.5px solid ${T.border}`,
      background: value >= max ? "#f5f5f5" : "#fff", color: value >= max ? T.subtext : T.text,
      fontSize: 18, fontWeight: 700, cursor: value >= max ? "default" : "pointer", lineHeight: 1,
    }}>+</button>
  </div>
);

const Toggle = ({ value, onChange }) => (
  <div onClick={() => onChange(!value)} style={{
    width: 48, height: 26, borderRadius: 13, cursor: "pointer", position: "relative",
    background: value ? T.green : "#ccc", transition: "background 0.2s",
  }}>
    <div style={{
      position: "absolute", top: 3, left: value ? 25 : 3,
      width: 20, height: 20, borderRadius: 10, background: "#fff",
      transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
    }} />
  </div>
);

// ── LANDING PAGE ────────────────────────────────────────────────────────
function LandingPage({ onLeagueCreated }) {
  const [screen, setScreen] = useState("home");
  // Basic info
  const [leagueName, setLeagueName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [yourName, setYourName] = useState("");
  // League settings
  const [maxTeams, setMaxTeams] = useState(8);
  const [rosterCap, setRosterCap] = useState(10);
  const [startersPerWeek, setStartersPerWeek] = useState(5);
  const [playoffTeams, setPlayoffTeams] = useState(4);
  const [includeJomez, setIncludeJomez] = useState(true);
  // Join
  const [joinCode, setJoinCode] = useState("");
  const [joinTeam, setJoinTeam] = useState("");
  const [error, setError] = useState("");

  const inp = {
    width: "100%", padding: "13px 14px", borderRadius: 12,
    border: `1.5px solid ${T.border}`, fontSize: 15, marginBottom: 12,
    boxSizing: "border-box", background: "#fff", outline: "none", fontFamily: "inherit",
  };

  const handleCreate = () => {
    if (!leagueName.trim() || !teamName.trim() || !yourName.trim())
      return setError("Please fill in all fields.");
    setError("");
    setScreen("draftSetup");
  };

  const handleJoin = () => {
    if (!joinCode.trim() || !joinTeam.trim())
      return setError("Please fill in all fields.");
    setError("");
    onLeagueCreated({
      leagueName: "League #" + joinCode.toUpperCase(),
      teamName: joinTeam.trim(), yourName: joinTeam.trim(),
      settings: { maxTeams: 8, rosterCap: 10, startersPerWeek: 5, playoffTeams: 4, includeJomez: true },
      mode: "join",
    });
  };

  if (screen === "create") return (
    <div style={{ minHeight: "100vh", background: T.darkGreen, overflowY: "auto" }}>
      <div style={{ maxWidth: 420, margin: "0 auto", padding: "32px 20px 48px" }}>
        <button onClick={() => { setScreen("home"); setError(""); }} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", fontSize: 15, cursor: "pointer", marginBottom: 20, padding: 0 }}>← Back</button>
        <h2 style={{ color: "#fff", fontFamily: "'Georgia',serif", fontSize: 26, margin: "0 0 4px" }}>Create a League</h2>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, margin: "0 0 22px" }}>You'll draft players right after setup</p>

        {/* Basic info */}
        <Card style={{ marginBottom: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: T.subtext, letterSpacing: 1, margin: "0 0 14px" }}>YOUR INFO</p>
          <input style={inp} placeholder="League name" value={leagueName} onChange={e => setLeagueName(e.target.value)} />
          <input style={inp} placeholder="Your name" value={yourName} onChange={e => setYourName(e.target.value)} />
          <input style={{ ...inp, marginBottom: 0 }} placeholder="Your team name" value={teamName} onChange={e => setTeamName(e.target.value)} />
        </Card>

        {/* League settings */}
        <Card style={{ marginBottom: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: T.subtext, letterSpacing: 1, margin: "0 0 4px" }}>LEAGUE SETTINGS</p>

          <SettingRow label="Max Teams" sub={`2–30 teams allowed`}>
            <Stepper value={maxTeams} onChange={setMaxTeams} min={2} max={30} />
          </SettingRow>

          <SettingRow label="Roster Cap" sub={`Players per team (recommended: 10)`}>
            <Stepper value={rosterCap} onChange={setRosterCap} min={5} max={15} />
          </SettingRow>

          <SettingRow label="Starters / Week" sub={`How many score each tournament (3–7)`}>
            <Stepper value={startersPerWeek} onChange={setStartersPerWeek} min={3} max={7} />
          </SettingRow>

          <SettingRow label="Playoff Teams" sub={`Top teams by record, then avg pts (2–${maxTeams})`}>
            <Stepper value={playoffTeams} onChange={v => setPlayoffTeams(Math.min(v, maxTeams))} min={2} max={maxTeams} />
          </SettingRow>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Include JomezPro Events</div>
              <div style={{ fontSize: 12, color: T.subtext, marginTop: 2 }}>WACO, Champions Landing, Cactus Rock</div>
            </div>
            <Toggle value={includeJomez} onChange={setIncludeJomez} />
          </div>
        </Card>

        {/* Scoring rules (read-only summary) */}
        <Card style={{ marginBottom: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: T.green, letterSpacing: 1, margin: "0 0 10px" }}>SCORING RULES</p>
          <div style={{ fontSize: 13, lineHeight: 1.9 }}>
            <div><span style={{ color: T.green, fontWeight: 700 }}>+1 pt</span> per stroke under par</div>
            <div><span style={{ color: T.red, fontWeight: 700 }}>−1 pt</span> per stroke over par</div>
            <div><span style={{ color: T.green, fontWeight: 700 }}>+1 pt</span> tournament win bonus</div>
          </div>
          <div style={{ marginTop: 12, padding: "10px 12px", background: T.lightGreen, borderRadius: 10, fontSize: 12, color: T.green, fontWeight: 600 }}>
            Draft up to {rosterCap} players &nbsp;·&nbsp; Start {startersPerWeek}/week &nbsp;·&nbsp; Top {playoffTeams} make playoffs &nbsp;·&nbsp; Finals: USDGC
          </div>
        </Card>

        {error && <p style={{ color: "#ff6b6b", fontSize: 13, textAlign: "center", margin: "0 0 12px" }}>{error}</p>}
        <Btn style={{ width: "100%", padding: "15px 0", fontSize: 16 }} onClick={handleCreate}>Next: Draft Settings →</Btn>
      </div>
    </div>
  );

  if (screen === "draftSetup") return (
    <DraftSetupScreen
      leagueName={leagueName}
      teamName={teamName}
      yourName={yourName}
      settings={{ maxTeams, rosterCap, startersPerWeek, playoffTeams, includeJomez }}
      onBack={() => setScreen("create")}
      onConfirm={(draftSettings) => onLeagueCreated({
        leagueName: leagueName.trim(),
        teamName: teamName.trim(),
        yourName: yourName.trim(),
        settings: { maxTeams, rosterCap, startersPerWeek, playoffTeams, includeJomez },
        draftSettings,
        mode: "create",
      })}
    />
  );

  if (screen === "join") return (
    <div style={{ minHeight: "100vh", background: T.darkGreen, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <button onClick={() => { setScreen("home"); setError(""); }} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", fontSize: 15, cursor: "pointer", marginBottom: 20, padding: 0 }}>← Back</button>
        <h2 style={{ color: "#fff", fontFamily: "'Georgia',serif", fontSize: 26, margin: "0 0 6px" }}>Join a League</h2>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, margin: "0 0 20px" }}>Enter your invite code</p>
        <Card>
          <input style={inp} placeholder="League invite code" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} />
          <input style={{ ...inp, marginBottom: 0 }} placeholder="Your team name" value={joinTeam} onChange={e => setJoinTeam(e.target.value)} />
        </Card>
        {error && <p style={{ color: "#ff6b6b", fontSize: 13, textAlign: "center", margin: "0 0 12px" }}>{error}</p>}
        <Btn style={{ width: "100%", padding: "15px 0", fontSize: 16, marginTop: 4 }} onClick={handleJoin}>→ Join League</Btn>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: T.darkGreen, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div style={{ fontSize: 72, marginBottom: 12 }}>⚔️</div>
        <h1 style={{ color: "#fff", fontSize: 34, fontFamily: "'Georgia',serif", margin: "0 0 8px" }}>Chain Masters Pro</h1>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 15, margin: 0 }}>Fantasy Disc Golf Pro Tour 2026</p>
      </div>
      <Card style={{ width: "100%", maxWidth: 380, marginBottom: 16 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: T.green, letterSpacing: 1, marginTop: 0 }}>SCORING RULES</p>
        <div style={{ fontSize: 14, lineHeight: 2 }}>
          <span style={{ color: T.green, fontWeight: 700 }}>+1 pt</span> per stroke under par &nbsp;·&nbsp; <span style={{ color: T.red, fontWeight: 700 }}>−1 pt</span> over par
        </div>
        <div style={{ fontSize: 14 }}><span style={{ color: T.green, fontWeight: 700 }}>+1 pt</span> tournament win bonus</div>
        <p style={{ color: T.subtext, fontSize: 12, margin: "10px 0 0" }}>Draft up to 10 · Start 5 per tournament · No salary cap</p>
      </Card>
      <div style={{ display: "flex", gap: 12, width: "100%", maxWidth: 380 }}>
        <Btn style={{ flex: 1, padding: "15px 0", fontSize: 15 }} onClick={() => setScreen("create")}>+ Create League</Btn>
        <Btn style={{ flex: 1, padding: "15px 0", fontSize: 15 }} outline onClick={() => setScreen("join")}>→ Join League</Btn>
      </div>
      <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginTop: 32, textAlign: "center" }}>
        No leagues yet — create one or join with an invite code
      </p>
    </div>
  );
}


// ── DRAFT SETUP SCREEN ───────────────────────────────────────────────────
// Shown after league creation — pick draft type, date/time, salary cap
function DraftSetupScreen({ leagueName, teamName, settings, onBack, onConfirm }) {
  const [draftType, setDraftType] = useState("snake"); // "snake" | "salary"
  const [salaryBudget, setSalaryBudget] = useState(200);
  const [pickTimer, setPickTimer] = useState(30); // seconds per pick (5–60)
  const [draftDate, setDraftDate] = useState("");
  const [draftTime, setDraftTime] = useState("");
  const [error, setError] = useState("");

  // Get today's date in YYYY-MM-DD for the min date attr
  const today = new Date().toISOString().split("T")[0];

  const inp = {
    width: "100%", padding: "13px 14px", borderRadius: 12,
    border: `1.5px solid ${T.border}`, fontSize: 15, marginBottom: 0,
    boxSizing: "border-box", background: "#fff", outline: "none", fontFamily: "inherit",
    color: T.text,
  };

  const handleConfirm = () => {
    if (!draftDate) return setError("Please pick a draft date.");
    if (!draftTime) return setError("Please pick a draft time.");
    setError("");
    onConfirm({ draftType, salaryBudget, pickTimer, draftDate, draftTime });
  };

  // Format the scheduled time nicely for preview
  const previewTime = draftDate && draftTime
    ? new Date(`${draftDate}T${draftTime}`).toLocaleString("en-US", {
        weekday: "long", month: "long", day: "numeric",
        year: "numeric", hour: "numeric", minute: "2-digit",
      })
    : null;

  return (
    <div style={{ minHeight: "100vh", background: T.darkGreen, overflowY: "auto" }}>
      <div style={{ maxWidth: 420, margin: "0 auto", padding: "32px 20px 56px" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", fontSize: 15, cursor: "pointer", marginBottom: 20, padding: 0 }}>← Back</button>
        <h2 style={{ color: "#fff", fontFamily: "'Georgia',serif", fontSize: 26, margin: "0 0 4px" }}>Draft Settings</h2>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, margin: "0 0 22px" }}>{leagueName} · {settings.maxTeams} teams</p>

        {/* Draft Type */}
        <Card style={{ marginBottom: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: T.subtext, letterSpacing: 1, margin: "0 0 14px" }}>DRAFT TYPE</p>
          <div style={{ display: "flex", gap: 10 }}>
            {/* Snake Draft option */}
            <div
              onClick={() => setDraftType("snake")}
              style={{
                flex: 1, border: `2px solid ${draftType === "snake" ? T.green : T.border}`,
                borderRadius: 14, padding: "14px 12px", cursor: "pointer",
                background: draftType === "snake" ? T.lightGreen : "#fafafa",
                transition: "all 0.15s",
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 6 }}>🐍</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: draftType === "snake" ? T.green : T.text }}>Snake Draft</div>
              <div style={{ fontSize: 12, color: T.subtext, marginTop: 4, lineHeight: 1.5 }}>
                Teams take turns picking in order. Round 1 goes 1→N, Round 2 goes N→1, and so on.
              </div>
              {draftType === "snake" && (
                <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ color: T.green, fontSize: 14 }}>✓</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: T.green }}>Selected</span>
                </div>
              )}
            </div>

            {/* Salary Draft option */}
            <div
              onClick={() => setDraftType("salary")}
              style={{
                flex: 1, border: `2px solid ${draftType === "salary" ? T.green : T.border}`,
                borderRadius: 14, padding: "14px 12px", cursor: "pointer",
                background: draftType === "salary" ? T.lightGreen : "#fafafa",
                transition: "all 0.15s",
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 6 }}>💰</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: draftType === "salary" ? T.green : T.text }}>Salary Draft</div>
              <div style={{ fontSize: 12, color: T.subtext, marginTop: 4, lineHeight: 1.5 }}>
                Everyone gets a budget. Nominate players for auction — bid or pass each round.
              </div>
              {draftType === "salary" && (
                <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ color: T.green, fontSize: 14 }}>✓</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: T.green }}>Selected</span>
                </div>
              )}
            </div>
          </div>

          {/* Salary budget stepper — only visible when salary selected */}
          {draftType === "salary" && (
            <div style={{ marginTop: 14, padding: "14px", background: "#f5f9f5", borderRadius: 12, border: `1px solid ${T.border}` }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>Starting Budget</div>
                  <div style={{ fontSize: 12, color: T.subtext }}>Each team gets this amount to spend</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
                  <button onClick={() => setSalaryBudget(b => Math.max(50, b - 25))} style={{
                    width: 34, height: 34, borderRadius: "8px 0 0 8px", border: `1.5px solid ${T.border}`,
                    background: "#fff", fontSize: 18, fontWeight: 700, cursor: "pointer",
                  }}>−</button>
                  <div style={{
                    minWidth: 70, height: 34, display: "flex", alignItems: "center", justifyContent: "center",
                    border: `1.5px solid ${T.border}`, borderLeft: "none", borderRight: "none",
                    fontWeight: 800, fontSize: 15, background: "#fff", color: T.green,
                  }}>${salaryBudget}</div>
                  <button onClick={() => setSalaryBudget(b => Math.min(1000, b + 25))} style={{
                    width: 34, height: 34, borderRadius: "0 8px 8px 0", border: `1.5px solid ${T.border}`,
                    background: "#fff", fontSize: 18, fontWeight: 700, cursor: "pointer",
                  }}>+</button>
                </div>
              </div>
              <div style={{ fontSize: 12, color: T.subtext, background: T.lightGreen, borderRadius: 8, padding: "8px 10px", lineHeight: 1.5 }}>
                💡 Tip: Nominate a player, then all teams bid. Highest bid wins but pays that amount from their budget. Must keep ${Math.ceil(salaryBudget / (settings.rosterCap ?? 10))} min per remaining roster spot.
              </div>
            </div>
          )}
        </Card>

        {/* Draft Date & Time */}
        <Card style={{ marginBottom: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: T.subtext, letterSpacing: 1, margin: "0 0 14px" }}>DRAFT DATE & TIME</p>

          {/* Seconds per pick */}
          <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${T.border}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Seconds Per Pick</div>
                <div style={{ fontSize: 12, color: T.subtext }}>5–60 sec · if time expires, best player auto-drafted</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
                <button onClick={() => setPickTimer(t => Math.max(5, t - 5))} style={{
                  width: 34, height: 34, borderRadius: "8px 0 0 8px", border: `1.5px solid ${T.border}`,
                  background: pickTimer <= 5 ? "#f5f5f5" : "#fff", fontSize: 18, fontWeight: 700,
                  cursor: pickTimer <= 5 ? "default" : "pointer",
                }}>−</button>
                <div style={{
                  minWidth: 54, height: 34, display: "flex", alignItems: "center", justifyContent: "center",
                  border: `1.5px solid ${T.border}`, borderLeft: "none", borderRight: "none",
                  fontWeight: 800, fontSize: 15, background: "#fff",
                  color: pickTimer <= 10 ? T.red : pickTimer <= 20 ? T.accent : T.green,
                }}>{pickTimer}s</div>
                <button onClick={() => setPickTimer(t => Math.min(60, t + 5))} style={{
                  width: 34, height: 34, borderRadius: "0 8px 8px 0", border: `1.5px solid ${T.border}`,
                  background: pickTimer >= 60 ? "#f5f5f5" : "#fff", fontSize: 18, fontWeight: 700,
                  cursor: pickTimer >= 60 ? "default" : "pointer",
                }}>+</button>
              </div>
            </div>
            {/* Quick preset buttons */}
            <div style={{ display: "flex", gap: 6 }}>
              {[10, 20, 30, 45, 60].map(s => (
                <button key={s} onClick={() => setPickTimer(s)} style={{
                  flex: 1, padding: "5px 0", borderRadius: 10, fontSize: 12, fontWeight: 600,
                  cursor: "pointer", border: `1.5px solid ${pickTimer === s ? T.green : T.border}`,
                  background: pickTimer === s ? T.green : "#fff",
                  color: pickTimer === s ? "#fff" : T.subtext,
                }}>{s}s</button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: T.subtext, display: "block", marginBottom: 6 }}>Date</label>
            <input
              type="date"
              min={today}
              value={draftDate}
              onChange={e => setDraftDate(e.target.value)}
              style={{ ...inp }}
            />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: T.subtext, display: "block", marginBottom: 6 }}>Time</label>
            <input
              type="time"
              value={draftTime}
              onChange={e => setDraftTime(e.target.value)}
              style={{ ...inp }}
            />
          </div>

          {previewTime && (
            <div style={{ marginTop: 12, padding: "10px 12px", background: T.lightGreen, borderRadius: 10, display: "flex", alignItems: "center", gap: 8 }}>
              <span>📅</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.green }}>Draft Scheduled</div>
                <div style={{ fontSize: 12, color: T.green }}>{previewTime}</div>
              </div>
            </div>
          )}
        </Card>

        {/* Summary card */}
        <Card style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: T.subtext, letterSpacing: 1, margin: "0 0 10px" }}>DRAFT SUMMARY</p>
          <div style={{ fontSize: 13, lineHeight: 2, color: T.text }}>
            <div>📋 <strong>Type:</strong> {draftType === "snake" ? "Snake Draft" : `Salary Draft ($${salaryBudget} budget)`}</div>
            <div>⏱ <strong>Pick Timer:</strong> {pickTimer} seconds per pick</div>
            <div>👥 <strong>Teams:</strong> {settings.maxTeams} max ({settings.maxTeams - 1} CPU spots)</div>
            <div>🎯 <strong>Roster:</strong> {settings.rosterCap} players, start {settings.startersPerWeek}/week</div>
            <div>🏆 <strong>Playoffs:</strong> Top {settings.playoffTeams} teams · Finals at USDGC</div>
          </div>
        </Card>

        {error && <p style={{ color: "#ff6b6b", fontSize: 13, textAlign: "center", margin: "0 0 12px" }}>{error}</p>}

        <Btn style={{ width: "100%", padding: "15px 0", fontSize: 16 }} onClick={handleConfirm}>
          {draftType === "snake" ? "⚔️ Start Snake Draft" : "💰 Start Salary Draft"}
        </Btn>

        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, textAlign: "center", marginTop: 12 }}>
          You can draft now or wait until your scheduled time
        </p>
      </div>
    </div>
  );
}

// ── DRAFT ROOM ──────────────────────────────────────────────────────────
function DraftRoom({ league, onDraftComplete, onCpuTeamsReady }) {
  const ROSTER_LIMIT = league?.settings?.rosterCap ?? 10;
  const startersLabel = league?.settings?.startersPerWeek ?? 5;
  const CPU_COUNT = 3; // simulated opponents
  const TOTAL_TEAMS = 1 + CPU_COUNT;
  const PICKS_PER_ROUND = TOTAL_TEAMS;
  const TOTAL_ROUNDS = ROSTER_LIMIT;
  const TOTAL_PICKS = TOTAL_ROUNDS * PICKS_PER_ROUND;

  // CPU teams
  const cpuTeams = CPU_TEAMS.slice(0, CPU_COUNT);

  const PICK_SECONDS = league?.draftSettings?.pickTimer ?? 30;

  // State
  const [available, setAvailable] = useState([...ALL_PLAYERS]);
  const [myRoster, setMyRoster] = useState([]);
  const [cpuRosters, setCpuRosters] = useState(cpuTeams.map(() => []));
  const [pickNum, setPickNum] = useState(0); // 0-indexed global pick
  const [search, setSearch] = useState("");
  const [lastCpuPicks, setLastCpuPicks] = useState([]);
  const [draftLog, setDraftLog] = useState([]);
  const [sortBy, setSortBy] = useState("total");
  const [showLog, setShowLog] = useState(false);
  const [timeLeft, setTimeLeft] = useState(PICK_SECONDS);

  // Snake draft: which team picks at pickNum?
  const round = Math.floor(pickNum / PICKS_PER_ROUND); // 0-indexed
  const posInRound = pickNum % PICKS_PER_ROUND;
  const isSnakeEven = round % 2 === 0;
  const teamIndex = isSnakeEven ? posInRound : (PICKS_PER_ROUND - 1 - posInRound);
  // teamIndex 0 = user, 1..CPU_COUNT = cpu teams
  const isMyPick = teamIndex === 0;
  const isDraftOver = pickNum >= TOTAL_PICKS || myRoster.length >= ROSTER_LIMIT;

  // ── Pick countdown timer ─────────────────────────────────────────────
  const timerRef = useRef(null);

  useEffect(() => {
    if (isDraftOver || !isMyPick) return;
    setTimeLeft(PICK_SECONDS);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          // Auto-pick best available player when time expires
          const best = [...ALL_PLAYERS]
            .filter(p => available.find(a => a.id === p.id))
            .sort((a, b) => b.total - a.total)[0];
          if (best) draftPlayer(best);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickNum, isMyPick, isDraftOver]);

  // Filter & sort available
  const filtered = available
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortBy === "total" ? b.total - a.total : sortBy === "rating" ? b.rating - a.rating : b.avg - a.avg);

  const draftPlayer = (player) => {
    if (!isMyPick || isDraftOver) return;
    const newAvail = available.filter(p => p.id !== player.id);
    setAvailable(newAvail);
    const newRoster = [...myRoster, player];
    setMyRoster(newRoster);
    const newLog = [...draftLog, { pick: pickNum + 1, team: league.teamName, player: player.name }];
    setDraftLog(newLog);
    // Advance pick + let CPU pick
    advancePicks(pickNum + 1, newAvail, [...cpuRosters], newLog, newRoster);
  };

  const advancePicks = (nextPick, avail, cpuR, log, myR) => {
    let p = nextPick;
    let a = [...avail];
    let cr = cpuR.map(r => [...r]);
    let l = [...log];
    const cpuPicksMade = [];

    while (p < TOTAL_PICKS && myR.length < ROSTER_LIMIT) {
      const r2 = Math.floor(p / PICKS_PER_ROUND);
      const pos2 = p % PICKS_PER_ROUND;
      const snake2 = r2 % 2 === 0;
      const ti2 = snake2 ? pos2 : (PICKS_PER_ROUND - 1 - pos2);
      if (ti2 === 0) break; // user's turn
      // CPU picks best available
      if (a.length === 0) break;
      const cpuIdx = ti2 - 1;
      const pick = a[0]; // best remaining
      a = a.filter(x => x.id !== pick.id);
      cr[cpuIdx] = [...cr[cpuIdx], pick];
      l = [...l, { pick: p + 1, team: cpuTeams[cpuIdx], player: pick.name }];
      cpuPicksMade.push({ team: cpuTeams[cpuIdx], player: pick.name });
      p++;
    }

    setAvailable(a);
    setCpuRosters(cr);
    setPickNum(p);
    setDraftLog(l);
    setLastCpuPicks(cpuPicksMade.slice(-3));
  };

  if (isDraftOver) {
    return (
      <div style={{ minHeight: "100vh", background: T.darkGreen, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ textAlign: "center", maxWidth: 380, width: "100%" }}>
          <div style={{ fontSize: 64, marginBottom: 12 }}>🎉</div>
          <h2 style={{ color: "#fff", fontFamily: "'Georgia',serif", fontSize: 28, margin: "0 0 8px" }}>Draft Complete!</h2>
          <p style={{ color: "rgba(255,255,255,0.7)", margin: "0 0 24px" }}>You drafted {myRoster.length} players</p>
          <Card>
            <p style={{ fontWeight: 700, margin: "0 0 12px", fontSize: 16 }}>Your Roster</p>
            {myRoster.map((p, i) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: i < myRoster.length - 1 ? `1px solid ${T.border}` : "none" }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: i < startersLabel ? T.green : "#ddd", color: i < startersLabel ? "#fff" : T.subtext, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>{i + 1}</div>
                <Av ini={p.ini} size={32} color={i < startersLabel ? T.green : "#aaa"} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: T.subtext }}>{i < startersLabel ? "Starter" : "Bench"} · {p.total} pts · Rating {p.rating}</div>
                </div>
              </div>
            ))}
          </Card>
          <Btn style={{ width: "100%", padding: "15px 0", fontSize: 16, marginTop: 8 }} onClick={() => {
            // Build CPU team objects with simulated stats for standings
            const builtCpuTeams = cpuTeams.map((name, idx) => ({
              name,
              type: "cpu",
              pts: cpuRosters[idx]
                ? cpuRosters[idx].slice(0, startersLabel).reduce((s, p) => s + Math.round(p.total * (0.5 + ((name.charCodeAt(0) * 7 + idx * 13) % 100) / 200)), 0)
                : 0,
              roster: cpuRosters[idx] ?? [],
            }));
            onCpuTeamsReady?.(builtCpuTeams);
            onDraftComplete(myRoster, available);
          }}>
            Enter League →
          </Btn>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'Helvetica Neue',sans-serif" }}>
      {/* Header */}
      <div style={{ background: T.darkGreen, padding: "14px 16px 12px", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontFamily: "'Georgia',serif", fontSize: 18 }}>Draft Room</div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>Round {round + 1} · Pick {pickNum + 1} of {TOTAL_PICKS}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Countdown clock — only shown on user's turn */}
            {isMyPick && !isDraftOver && (
              <div style={{ position: "relative", width: 46, height: 46 }}>
                <svg width="46" height="46" style={{ transform: "rotate(-90deg)" }}>
                  <circle cx="23" cy="23" r="19" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="4" />
                  <circle
                    cx="23" cy="23" r="19" fill="none"
                    stroke={timeLeft <= 5 ? T.red : timeLeft <= 15 ? T.accent : "#4caf50"}
                    strokeWidth="4"
                    strokeDasharray={`${2 * Math.PI * 19}`}
                    strokeDashoffset={`${2 * Math.PI * 19 * (1 - timeLeft / PICK_SECONDS)}`}
                    style={{ transition: "stroke-dashoffset 0.9s linear, stroke 0.3s" }}
                  />
                </svg>
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: timeLeft <= 5 ? T.red : "#fff",
                  fontWeight: 800, fontSize: 14,
                }}>{timeLeft}</div>
              </div>
            )}
            <div style={{ textAlign: "right" }}>
              <div style={{ color: T.accent, fontWeight: 700, fontSize: 13 }}>{isMyPick ? "YOUR PICK" : `${cpuTeams[teamIndex - 1]} picking...`}</div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>My roster: {myRoster.length}/{ROSTER_LIMIT}</div>
            </div>
          </div>
        </div>
        {/* Draft progress bar */}
        <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 4, height: 4 }}>
          <div style={{ background: T.accent, borderRadius: 4, height: 4, width: `${(pickNum / TOTAL_PICKS) * 100}%`, transition: "width 0.3s" }} />
        </div>
      </div>

      <div style={{ padding: "14px 16px 100px" }}>
        {/* Status banner */}
        {isMyPick ? (
          <div style={{
            background: timeLeft <= 5 ? T.red : T.accent,
            borderRadius: 12, padding: "12px 16px", marginBottom: 14,
            display: "flex", alignItems: "center", gap: 10,
            transition: "background 0.3s",
          }}>
            <span style={{ fontSize: 22 }}>{timeLeft <= 5 ? "🚨" : "👆"}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: "#fff" }}>
                {timeLeft <= 5 ? `Auto-pick in ${timeLeft}s!` : "It's your turn!"}
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>
                {timeLeft <= 5 ? "Best available player will be drafted" : `${timeLeft}s to pick · Select a player below`}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ background: "#fff", borderRadius: 12, padding: "12px 16px", marginBottom: 14, border: `1.5px solid ${T.border}` }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>⏳ {cpuTeams[teamIndex - 1]} is on the clock...</div>
            {lastCpuPicks.length > 0 && lastCpuPicks.map((cp, i) => (
              <div key={i} style={{ fontSize: 12, color: T.subtext }}>✓ {cp.team} drafted {cp.player}</div>
            ))}
          </div>
        )}

        {/* My picks so far */}
        {myRoster.length > 0 && (
          <Card style={{ marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>My Picks ({myRoster.length}/10)</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {myRoster.map((p, i) => (
                <div key={p.id} style={{ background: i < 5 ? T.lightGreen : "#f0f0f0", borderRadius: 8, padding: "4px 10px", fontSize: 12, fontWeight: 600, color: i < 5 ? T.green : T.subtext }}>
                  {p.name}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Draft log toggle */}
        <button onClick={() => setShowLog(!showLog)} style={{ background: "none", border: "none", color: T.green, fontWeight: 600, fontSize: 13, cursor: "pointer", marginBottom: 10, padding: 0 }}>
          {showLog ? "▲ Hide" : "▼ Show"} Draft Log ({draftLog.length} picks)
        </button>
        {showLog && (
          <Card style={{ marginBottom: 14, maxHeight: 180, overflowY: "auto" }}>
            {[...draftLog].reverse().map((entry, i) => (
              <div key={i} style={{ fontSize: 12, padding: "4px 0", borderBottom: i < draftLog.length - 1 ? `1px solid ${T.border}` : "none", color: entry.team === league.teamName ? T.green : T.text }}>
                <span style={{ color: T.subtext, marginRight: 6 }}>#{entry.pick}</span>
                <strong>{entry.team}</strong> → {entry.player}
              </div>
            ))}
          </Card>
        )}

        {/* Sort + search */}
        <div style={{ marginBottom: 10 }}>
          <input
            placeholder="🔍 Search players..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: "100%", padding: "11px 14px", borderRadius: 12, border: `1.5px solid ${T.border}`, fontSize: 14, marginBottom: 8, boxSizing: "border-box", outline: "none", fontFamily: "inherit" }}
          />
          <div style={{ display: "flex", gap: 6 }}>
            {[["total", "Season Pts"], ["rating", "Rating"], ["avg", "Avg Pts"]].map(([key, label]) => (
              <button key={key} onClick={() => setSortBy(key)} style={{
                padding: "5px 12px", borderRadius: 16, fontSize: 12, fontWeight: 600, cursor: "pointer",
                background: sortBy === key ? T.green : "#fff",
                color: sortBy === key ? "#fff" : T.subtext,
                border: `1.5px solid ${sortBy === key ? T.green : T.border}`,
              }}>{label}</button>
            ))}
          </div>
        </div>

        {/* Available players */}
        <div style={{ fontWeight: 700, fontSize: 13, color: T.subtext, marginBottom: 8, letterSpacing: 0.5 }}>
          AVAILABLE PLAYERS ({filtered.length})
        </div>
        {filtered.map(p => (
          <div key={p.id} style={{
            background: T.card, borderRadius: 14, padding: "12px 14px", marginBottom: 8,
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            opacity: isMyPick ? 1 : 0.6,
            border: isMyPick ? `1.5px solid ${T.border}` : `1.5px solid ${T.border}`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Av ini={p.ini} size={42} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: T.subtext, marginTop: 2 }}>
                  Rating {p.rating} · {p.wins}W · {p.top5} top-5 · {p.events} events
                </div>
                <div style={{ display: "flex", gap: 12, marginTop: 4, fontSize: 12 }}>
                  <span style={{ color: T.green, fontWeight: 700 }}>{p.total} pts</span>
                  <span style={{ color: T.subtext }}>{p.avg} avg/event</span>
                </div>
              </div>
              <Btn
                style={{ padding: "8px 14px", fontSize: 13 }}
                onClick={() => draftPlayer(p)}
              >
                {isMyPick ? "Draft" : "—"}
              </Btn>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── HOME PAGE ────────────────────────────────────────────────────────────
function HomePage({ league, setPage }) {
  const { teamName, leagueName, roster, settings } = league;
  const startersPerWeek = settings?.startersPerWeek ?? 5;
  const rosterCap = settings?.rosterCap ?? 10;
  const starters = roster.filter(p => p.starter);
  const totalPts = starters.reduce((s, p) => s + p.total, 0);
  const topPerformers = [...ALL_PLAYERS].sort((a, b) => b.total - a.total).slice(0, 5);

  return (
    <div style={{ padding: "20px 16px 100px" }}>
      <h1 style={{ fontFamily: "'Georgia',serif", fontSize: 28, margin: "0 0 2px" }}>{leagueName}</h1>
      <p style={{ color: T.subtext, margin: "0 0 18px", fontSize: 14 }}>Fantasy Disc Golf Pro Tour 2026</p>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        {[
          { label: "MY POINTS", value: totalPts, sub: "Season (starters)" },
          { label: "LEAGUE RANK", value: "1st", sub: "of 1 teams" },
          { label: "RECORD", value: "0-0", sub: "W-L" },
          { label: "ROSTER", value: `${roster.length}/${rosterCap}`, sub: "players" },
        ].map(s => (
          <Card key={s.label} style={{ padding: "14px 16px", margin: 0 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: T.subtext, letterSpacing: 1, margin: "0 0 6px" }}>{s.label}</p>
            <p style={{ fontSize: 26, fontWeight: 800, margin: "0 0 2px", fontFamily: "'Georgia',serif" }}>{s.value}</p>
            <p style={{ fontSize: 12, color: T.subtext, margin: 0 }}>{s.sub}</p>
          </Card>
        ))}
      </div>

      {/* Live event banner */}
      <div style={{ background: `linear-gradient(135deg, ${T.darkGreen}, ${T.green})`, borderRadius: 16, padding: "18px 16px", marginBottom: 12, color: "#fff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h3 style={{ margin: "0 0 4px", fontFamily: "'Georgia',serif", fontSize: 20 }}>Northwest Championship</h3>
            <p style={{ margin: "0 0 10px", opacity: 0.7, fontSize: 13 }}>📍 Portland, OR &nbsp;·&nbsp; 📅 Jun 4–7</p>
          </div>
          <span style={{ background: T.accent, color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20 }}>DGPT</span>
        </div>
        <span style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 600 }}>🔴 Live Now</span>
      </div>

      {/* My team card */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: T.green }}>●</span>
            <span style={{ fontWeight: 700, fontSize: 16 }}>{teamName}</span>
          </div>
          <button onClick={() => setPage("team")} style={{ background: "none", border: "none", color: T.green, fontWeight: 600, cursor: "pointer", fontSize: 14 }}>Manage →</button>
        </div>
        {starters.length === 0 ? (
          <p style={{ color: T.subtext, fontSize: 14, margin: 0 }}>No starters set — go to My Team to set your lineup ({startersPerWeek} starters needed).</p>
        ) : (
          <>
            <div style={{ textAlign: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 36, fontWeight: 800, fontFamily: "'Georgia',serif" }}>{totalPts}</div>
              <div style={{ color: T.subtext, fontSize: 13 }}>Season pts (starters)</div>
            </div>
            <p style={{ fontSize: 11, fontWeight: 700, color: T.subtext, letterSpacing: 1, marginBottom: 8 }}>ACTIVE LINEUP</p>
            {starters.map(p => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Badge label={p.div} />
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{p.name}</span>
                </div>
                <span style={{ color: T.subtext, fontSize: 13 }}>{p.total} pts</span>
              </div>
            ))}
          </>
        )}
      </Card>

      {/* Coming up */}
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span>📅</span><span style={{ fontWeight: 700 }}>Coming Up</span>
        </div>
        {UPCOMING.filter(e => settings?.includeJomez !== false || e.tier !== "JomezPro").slice(1, 4).map((e, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < 2 ? `1px solid ${T.border}` : "none" }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{e.name}</div>
              <div style={{ fontSize: 12, color: T.subtext }}>{e.location} · {e.dates}</div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: T.green, background: T.lightGreen, padding: "3px 8px", borderRadius: 10 }}>{e.tier}</span>
          </div>
        ))}
      </Card>

      {/* Recent results */}
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span>🏆</span><span style={{ fontWeight: 700 }}>Recent Results</span>
        </div>
        {COMPLETED.slice(-4).reverse().map((e, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < 3 ? `1px solid ${T.border}` : "none" }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{e.name}</div>
              <div style={{ fontSize: 12, color: T.subtext }}>🥇 {e.winner} · {e.score}</div>
            </div>
            <span style={{ fontSize: 12, color: T.subtext }}>{e.dates}</span>
          </div>
        ))}
      </Card>

      {/* Top performers */}
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span>📈</span><span style={{ fontWeight: 700 }}>Top Performers (2026)</span>
        </div>
        {topPerformers.map((p, i) => (
          <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: i < 4 ? `1px solid ${T.border}` : "none" }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8, fontSize: 13, fontWeight: 700,
              background: i === 0 ? T.accent : T.lightGreen, color: i === 0 ? "#fff" : T.green,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>{i + 1}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
              <div style={{ fontSize: 12, color: T.subtext }}>{p.wins}W · Rating {p.rating}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: 800, fontSize: 16 }}>{p.total}</div>
              <div style={{ fontSize: 11, color: T.subtext }}>pts</div>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ── MY TEAM PAGE ─────────────────────────────────────────────────────────
function TeamPage({ league, onRosterChange, onPlayerClick }) {
  const { teamName, roster } = league;
  const [myRoster, setMyRoster] = useState(roster);

  const starters = myRoster.filter(p => p.starter);
  const bench = myRoster.filter(p => !p.starter);

  const toggleStarter = (id) => {
    const p = myRoster.find(r => r.id === id);
    const starterCount = myRoster.filter(r => r.starter).length;
    const starterLimit = league?.settings?.startersPerWeek ?? 5;
    if (p.starter || starterCount < starterLimit) {
      const newR = myRoster.map(r => r.id === id ? { ...r, starter: !r.starter } : r);
      setMyRoster(newR);
      onRosterChange(newR);
    }
  };

  const dropPlayer = (id) => {
    const newR = myRoster.filter(r => r.id !== id);
    setMyRoster(newR);
    onRosterChange(newR);
  };

  return (
    <div style={{ padding: "20px 16px 100px" }}>
      <h1 style={{ fontFamily: "'Georgia',serif", fontSize: 28, margin: "0 0 18px" }}>{teamName}</h1>

      {myRoster.length === 0 && (
        <Card>
          <p style={{ color: T.subtext, textAlign: "center", margin: 0 }}>Your roster is empty. Use the Waiver Wire to pick up players.</p>
        </Card>
      )}

      {/* Starters */}
      {myRoster.length > 0 && (
        <Card>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: T.green, fontSize: 10 }}>●</span>
              <span style={{ fontWeight: 700, fontSize: 16 }}>Active Lineup</span>
              <span style={{ background: T.lightGreen, color: T.green, fontSize: 12, fontWeight: 600, padding: "2px 10px", borderRadius: 20 }}>{starters.length}/{league?.settings?.startersPerWeek ?? 5}</span>
            </div>
          </div>
          <p style={{ color: T.subtext, fontSize: 13, margin: "0 0 14px" }}>These players score points in the next tournament</p>
          {starters.length === 0 && <p style={{ color: T.accent, fontSize: 13, margin: 0 }}>⚠️ Set at least 1 starter from your bench below</p>}
          {starters.map(p => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
              <Av ini={p.ini} size={40} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 15, cursor: "pointer", color: T.text }} onClick={() => onPlayerClick?.(p)}>{p.name} <span style={{ fontSize: 11, color: T.green }}>›</span></div>
                <div style={{ display: "flex", gap: 8, marginTop: 3, fontSize: 12, color: T.subtext }}>
                  <Badge label={p.div} />
                  <span>{p.wins}W · {p.avg} avg · {p.total} pts</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => toggleStarter(p.id)} style={{ background: "none", border: "none", color: T.subtext, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>Bench</button>
                <button onClick={() => dropPlayer(p.id)} style={{ background: "none", border: "none", color: T.red, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>Drop</button>
              </div>
            </div>
          ))}
          {starters.length < (league?.settings?.startersPerWeek ?? 5) && starters.length > 0 && (
            <p style={{ color: T.accent, fontSize: 13, textAlign: "center", marginTop: 10, marginBottom: 0 }}>
              ⚠️ Start {(league?.settings?.startersPerWeek ?? 5) - starters.length} more from bench
            </p>
          )}
        </Card>
      )}

      {/* Bench */}
      {bench.length > 0 && (
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ color: T.subtext, fontSize: 10 }}>●</span>
            <span style={{ fontWeight: 700, fontSize: 16 }}>Bench</span>
            <span style={{ background: T.lightGreen, color: T.green, fontSize: 12, fontWeight: 600, padding: "2px 10px", borderRadius: 20 }}>{bench.length}</span>
          </div>
          <p style={{ color: T.subtext, fontSize: 13, margin: "0 0 14px" }}>Bench players don't score — promote them to start</p>
          {bench.map(p => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
              <Av ini={p.ini} size={40} color="#8aaa8a" />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 15, cursor: "pointer", color: T.text }} onClick={() => onPlayerClick?.(p)}>{p.name} <span style={{ fontSize: 11, color: T.green }}>›</span></div>
                <div style={{ display: "flex", gap: 8, marginTop: 3, fontSize: 12, color: T.subtext }}>
                  <Badge label={p.div} />
                  <span>{p.wins}W · {p.avg} avg · {p.total} pts</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => toggleStarter(p.id)} style={{ background: "none", border: "none", color: T.green, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
                  {starters.length < 5 ? "Start" : "Start"}
                </button>
                <button onClick={() => dropPlayer(p.id)} style={{ background: "none", border: "none", color: T.red, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>Drop</button>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

// ── WAIVER WIRE ──────────────────────────────────────────────────────────
function WaiversPage({ league, waiverPool, onClaim, onDrop, onPlayerClick }) {
  const { roster } = league;
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("total");
  const [dropMode, setDropMode] = useState(null); // player id being claimed (need to drop someone)
  const [claimTarget, setClaimTarget] = useState(null);
  const [claimed, setClaimed] = useState([]);

  const filtered = waiverPool
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortBy === "total" ? b.total - a.total : sortBy === "rating" ? b.rating - a.rating : b.avg - a.avg);

  const handleClaim = (player) => {
    if (roster.length >= (league?.settings?.rosterCap ?? 10)) {
      setClaimTarget(player);
      setDropMode("choose");
    } else {
      onClaim(player, null);
      setClaimed([...claimed, player.id]);
    }
  };

  const confirmClaim = (dropId) => {
    onClaim(claimTarget, dropId);
    setClaimed([...claimed, claimTarget.id]);
    setDropMode(null);
    setClaimTarget(null);
  };

  // Drop confirmation modal
  if (dropMode === "choose") return (
    <div style={{ padding: "20px 16px 100px" }}>
      <h2 style={{ fontFamily: "'Georgia',serif", fontSize: 24, margin: "0 0 6px" }}>Claim {claimTarget?.name}</h2>
      <p style={{ color: T.subtext, margin: "0 0 18px", fontSize: 14 }}>Your roster is full (10/10). Drop a player to make room.</p>
      {roster.map(p => (
        <Card key={p.id} style={{ cursor: "pointer", border: `1.5px solid ${T.border}` }} onClick={() => confirmClaim(p.id)}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Av ini={p.ini} size={40} color={p.starter ? T.green : "#8aaa8a"} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{p.name}</div>
              <div style={{ fontSize: 12, color: T.subtext }}>{p.starter ? "Starter" : "Bench"} · {p.total} pts · Rating {p.rating}</div>
            </div>
            <Btn danger outline style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => confirmClaim(p.id)}>Drop</Btn>
          </div>
        </Card>
      ))}
      <Btn outline style={{ width: "100%", marginTop: 8 }} onClick={() => { setDropMode(null); setClaimTarget(null); }}>Cancel</Btn>
    </div>
  );

  return (
    <div style={{ padding: "20px 16px 100px" }}>
      <h1 style={{ fontFamily: "'Georgia',serif", fontSize: 28, margin: "0 0 4px" }}>Waiver Wire</h1>
      <p style={{ color: T.subtext, margin: "0 0 16px", fontSize: 14 }}>
        {waiverPool.length} players available · Your roster: {roster.length}/{league?.settings?.rosterCap ?? 10}
      </p>

      <input
        placeholder="🔍 Search players..."
        value={search} onChange={e => setSearch(e.target.value)}
        style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: `1.5px solid ${T.border}`, fontSize: 14, marginBottom: 10, boxSizing: "border-box", outline: "none", fontFamily: "inherit" }}
      />
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {[["total", "Season Pts"], ["rating", "Rating"], ["avg", "Avg Pts"]].map(([key, label]) => (
          <button key={key} onClick={() => setSortBy(key)} style={{
            padding: "5px 12px", borderRadius: 16, fontSize: 12, fontWeight: 600, cursor: "pointer",
            background: sortBy === key ? T.green : "#fff", color: sortBy === key ? "#fff" : T.subtext,
            border: `1.5px solid ${sortBy === key ? T.green : T.border}`,
          }}>{label}</button>
        ))}
      </div>

      {filtered.length === 0 && (
        <Card><p style={{ color: T.subtext, textAlign: "center", margin: 0 }}>No players match your search.</p></Card>
      )}

      {filtered.map(p => {
        const alreadyClaimed = claimed.includes(p.id);
        return (
          <Card key={p.id} style={{ padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Av ini={p.ini} size={42} color="#8aaa8a" />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => onPlayerClick?.(p)}>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</span>
                  <Badge label={p.div} />
                  <span style={{ fontSize: 11, color: T.green }}>›</span>
                </div>
                <div style={{ fontSize: 12, color: T.subtext, marginTop: 3 }}>
                  🎯 Rating {p.rating} &nbsp;·&nbsp; {p.wins}W &nbsp;·&nbsp; {p.top5} top-5
                </div>
                <div style={{ fontSize: 12, marginTop: 2 }}>
                  <span style={{ color: T.green, fontWeight: 700 }}>{p.total} pts</span>
                  <span style={{ color: T.subtext }}> &nbsp;·&nbsp; {p.avg} avg/event &nbsp;·&nbsp; {p.events} events</span>
                </div>
              </div>
              <button
                onClick={() => !alreadyClaimed && handleClaim(p)}
                disabled={alreadyClaimed}
                style={{
                  background: alreadyClaimed ? T.lightGreen : T.green,
                  color: alreadyClaimed ? T.green : "#fff",
                  border: "none", borderRadius: 10, padding: "8px 16px",
                  fontWeight: 700, fontSize: 14, cursor: alreadyClaimed ? "default" : "pointer",
                }}
              >{alreadyClaimed ? "✓ Added" : "Claim"}</button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ── STANDINGS PAGE ───────────────────────────────────────────────────────
// Season ends after USDGC (Oct 8-11). Any event after is not counted.
// Playoffs: top N teams by record, tiebreaker = avg pts per event.
// Championship / Finals = USDGC.

const SEASON_CUTOFF_EVENT = "USDGC"; // fantasy season ends after this event
const FINALS_EVENT = { name: "USDGC", location: "Rock Hill, SC", dates: "Oct 8–11", tier: "Major" };
// Events that count toward regular season (everything up to and including USDGC)
const REGULAR_SEASON_EVENTS = [
  ...COMPLETED,
  { name: "Northwest Championship", location: "Portland, OR", dates: "Jun 4–7" },
  { name: "European Open", location: "Tallinn, Estonia", dates: "Jun 18–21" },
  { name: "Swedish Open", location: "Borås, Sweden", dates: "Jun 26–28" },
  { name: "Ledgestone Open", location: "Peoria, IL", dates: "Jul 30–Aug 2" },
  { name: "PDGA Pro Worlds", location: "Milford, MI", dates: "Aug 26–30" },
  // USDGC = Championship Finals — included as last regular season event
  { name: "USDGC (Championship Finals)", location: "Rock Hill, SC", dates: "Oct 8–11" },
];
// Powerball Cup comes after USDGC — not counted in fantasy season
const POST_SEASON_EVENTS = [
  { name: "Powerball Cup", location: "Lynchburg, VA", dates: "Oct 15–18" },
];

function StandingsPage({ league, cpuTeams = [] }) {
  const [sort, setSort] = useState("Record");
  const [tab, setTab] = useState("standings"); // standings | playoffs | schedule
  const { leagueName, teamName, roster, settings } = league;
  const playoffTeams = settings?.playoffTeams ?? 4;
  const initials = teamName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const myPts = roster.filter(p => p.starter).reduce((s, p) => s + p.total, 0);
  const myAvg = myPts > 0 ? (myPts / COMPLETED.length).toFixed(1) : "0.0";

  // Build full standings: user team + CPU teams
  const allTeams = [
    { name: teamName, initials, pts: myPts, avg: parseFloat(myAvg), wins: 0, losses: 0, isMe: true, type: "human" },
    ...cpuTeams.map(t => {
      const tPts = t.pts ?? 0;
      const tAvg = tPts > 0 ? parseFloat((tPts / COMPLETED.length).toFixed(1)) : 0;
      const ini = t.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
      return { name: t.name, initials: ini, pts: tPts, avg: tAvg, wins: 0, losses: 0, isMe: false, type: "cpu" };
    }),
  ];

  // Sort logic
  const sorted = [...allTeams].sort((a, b) => {
    if (sort === "Total Pts") return b.pts - a.pts;
    if (sort === "Avg Pts") return b.avg - a.avg;
    // Record: by wins desc, then avg pts as tiebreaker
    if (a.wins !== b.wins) return b.wins - a.wins;
    return b.avg - a.avg;
  });

  // Playoff picture: top N by record then avg
  const playoffSorted = [...allTeams].sort((a, b) => {
    if (a.wins !== b.wins) return b.wins - a.wins;
    return b.avg - a.avg;
  });
  const inPlayoffs = playoffSorted.slice(0, playoffTeams);
  const bubbleTeams = playoffSorted.slice(playoffTeams, playoffTeams + 2);

  const rankIcon = (i) => {
    if (i === 0) return "👑";
    if (i === 1) return "🥈";
    if (i === 2) return "🥉";
    return `${i + 1}.`;
  };

  return (
    <div style={{ padding: "20px 16px 100px" }}>
      <h1 style={{ fontFamily: "'Georgia',serif", fontSize: 28, margin: "0 0 2px" }}>Standings</h1>
      <p style={{ color: T.subtext, margin: "0 0 14px", fontSize: 14 }}>{leagueName} · Season 2026</p>

      {/* Season cutoff notice */}
      <div style={{ background: "linear-gradient(135deg, #1a2e1a, #2d5a2d)", borderRadius: 14, padding: "12px 16px", marginBottom: 14, display: "flex", gap: 12, alignItems: "center" }}>
        <span style={{ fontSize: 24 }}>🏆</span>
        <div>
          <div style={{ color: T.accent, fontWeight: 700, fontSize: 12, letterSpacing: 1 }}>CHAMPIONSHIP FINALS</div>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>USDGC · Oct 8–11 · Rock Hill, SC</div>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 2 }}>Fantasy season ends after USDGC. Powerball Cup not included.</div>
        </div>
      </div>

      {/* Tab switcher */}
      <div style={{ display: "flex", background: "#fff", borderRadius: 20, padding: 4, marginBottom: 16, border: `1.5px solid ${T.border}` }}>
        {[["standings","📊 Standings"],["playoffs","🏅 Playoffs"],["schedule","📅 Schedule"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            flex: 1, padding: "8px 4px", borderRadius: 16, border: "none",
            background: tab === id ? T.darkGreen : "transparent",
            color: tab === id ? "#fff" : T.subtext,
            fontWeight: tab === id ? 700 : 400, fontSize: 12, cursor: "pointer",
          }}>{label}</button>
        ))}
      </div>

      {/* ── STANDINGS TAB ── */}
      {tab === "standings" && (<>
        {/* Sort buttons */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
          <span style={{ color: T.subtext, fontSize: 13, alignSelf: "center" }}>⇅</span>
          {["Record", "Total Pts", "Avg Pts"].map(s => (
            <button key={s} onClick={() => setSort(s)} style={{
              padding: "6px 14px", borderRadius: 20, fontWeight: 600, fontSize: 13, cursor: "pointer",
              background: sort === s ? T.green : "#fff", color: sort === s ? "#fff" : T.text,
              border: `1.5px solid ${sort === s ? T.green : T.border}`,
            }}>{s}</button>
          ))}
        </div>

        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "0 0 8px", borderBottom: `1px solid ${T.border}`, marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: T.subtext }}>TEAM</span>
            <div style={{ display: "flex", gap: 20 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: T.subtext }}>AVG</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: T.subtext, width: 40, textAlign: "right" }}>PTS</span>
            </div>
          </div>
          {sorted.map((team, i) => {
            const isPlayoffSpot = i < playoffTeams;
            return (
              <div key={team.name} style={{
                display: "flex", alignItems: "center", padding: "11px 0",
                borderBottom: i < sorted.length - 1 ? `1px solid ${T.border}` : "none",
                borderLeft: isPlayoffSpot ? `3px solid ${T.accent}` : "3px solid transparent",
                paddingLeft: isPlayoffSpot ? 10 : 0,
              }}>
                <span style={{ fontSize: i < 3 ? 18 : 14, width: 28, flexShrink: 0, color: T.subtext, fontWeight: 700 }}>{rankIcon(i)}</span>
                <Av ini={team.initials} size={36} color={team.isMe ? T.green : "#8aaa8a"} />
                <div style={{ flex: 1, marginLeft: 10 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
                    {team.name}
                    {team.isMe && <span style={{ background: T.lightGreen, color: T.green, fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 8 }}>You</span>}
                    {team.type === "cpu" && <span style={{ background: "#f0f0f0", color: T.subtext, fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 8 }}>CPU</span>}
                    {isPlayoffSpot && <span style={{ fontSize: 10 }}>🏅</span>}
                  </div>
                  <div style={{ fontSize: 12, color: T.subtext }}>0-0 · {team.wins}W</div>
                </div>
                <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: T.subtext, width: 36, textAlign: "right" }}>{team.avg}</span>
                  <span style={{ fontWeight: 800, fontSize: 16, fontFamily: "'Georgia',serif", width: 40, textAlign: "right" }}>{team.pts}</span>
                </div>
              </div>
            );
          })}
        </Card>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <div style={{ width: 12, height: 12, background: T.accent, borderRadius: 2 }} />
          <span style={{ fontSize: 12, color: T.subtext }}>🏅 Playoff spot (top {playoffTeams} teams)</span>
        </div>
        <p style={{ color: T.subtext, fontSize: 12, textAlign: "center", margin: "8px 0 0" }}>
          Tiebreaker: avg pts per event
        </p>
      </>)}

      {/* ── PLAYOFFS TAB ── */}
      {tab === "playoffs" && (<>
        <Card style={{ background: "linear-gradient(135deg, #fdf8ec, #fef3d0)", border: `1.5px solid ${T.accent}` }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>🏅 Playoff Format</div>
          <div style={{ fontSize: 13, color: T.subtext, lineHeight: 1.7 }}>
            Top <strong>{playoffTeams}</strong> teams by record qualify.<br />
            Tiebreaker: highest avg pts per event.<br />
            <strong>Championship Finals = USDGC</strong> (Oct 8–11, Rock Hill, SC).<br />
            Powerball Cup and any later events are <em>not</em> counted in the fantasy season.
          </div>
        </Card>

        <p style={{ fontWeight: 700, fontSize: 14, margin: "4px 0 10px", color: T.text }}>🟢 In the Playoffs</p>
        {inPlayoffs.map((team, i) => (
          <Card key={team.name} style={{ padding: "12px 16px", border: i === 0 ? `1.5px solid ${T.accent}` : `1.5px solid ${T.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 20, width: 28 }}>{i === 0 ? "👑" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i+1}.`}</span>
              <Av ini={team.initials} size={38} color={team.isMe ? T.green : "#8aaa8a"} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>
                  {team.name}
                  {team.isMe && <span style={{ background: T.lightGreen, color: T.green, fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 8, marginLeft: 6 }}>You</span>}
                </div>
                <div style={{ fontSize: 12, color: T.subtext }}>{team.avg} avg · {team.pts} pts</div>
              </div>
              {i === 0 && <span style={{ fontSize: 11, fontWeight: 700, color: T.accent }}>SEED #1</span>}
            </div>
          </Card>
        ))}

        {bubbleTeams.length > 0 && (<>
          <p style={{ fontWeight: 700, fontSize: 14, margin: "12px 0 10px", color: T.subtext }}>🔴 On the Bubble</p>
          {bubbleTeams.map((team) => (
            <Card key={team.name} style={{ padding: "12px 16px", opacity: 0.75 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Av ini={team.initials} size={38} color="#aaa" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{team.name}</div>
                  <div style={{ fontSize: 12, color: T.subtext }}>{team.avg} avg · {team.pts} pts</div>
                </div>
                <span style={{ fontSize: 11, color: T.red, fontWeight: 700 }}>OUT</span>
              </div>
            </Card>
          ))}
        </>)}

        {allTeams.length <= 1 && (
          <p style={{ color: T.subtext, fontSize: 13, textAlign: "center", margin: "16px 0" }}>
            Invite more teams to see the full playoff picture!
          </p>
        )}
      </>)}

      {/* ── SCHEDULE TAB ── */}
      {tab === "schedule" && (<>
        <p style={{ fontSize: 12, fontWeight: 700, color: T.subtext, letterSpacing: 1, margin: "0 0 10px" }}>REGULAR SEASON EVENTS</p>
        {REGULAR_SEASON_EVENTS.map((e, i) => {
          const isCompleted = i < COMPLETED.length;
          const isFinals = e.name.includes("USDGC");
          return (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 12px", marginBottom: 8, borderRadius: 12,
              background: isFinals ? "linear-gradient(135deg, #fdf8ec, #fef3d0)" : T.card,
              border: isFinals ? `1.5px solid ${T.accent}` : `1px solid ${T.border}`,
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}>
              <div>
                <div style={{ fontWeight: isFinals ? 800 : 600, fontSize: 14 }}>
                  {isFinals ? "🏆 " : ""}{e.name}
                </div>
                <div style={{ fontSize: 12, color: T.subtext, marginTop: 2 }}>
                  {e.location} · {e.dates}
                  {isCompleted && e.winner ? ` · 🥇 ${e.winner}` : ""}
                </div>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 10,
                background: isFinals ? T.accent : isCompleted ? T.lightGreen : "#f0f0f0",
                color: isFinals ? "#fff" : isCompleted ? T.green : T.subtext,
              }}>{isFinals ? "FINALS" : isCompleted ? "Final" : "Upcoming"}</span>
            </div>
          );
        })}

        <div style={{ borderTop: `2px dashed ${T.border}`, margin: "16px 0 12px", position: "relative" }}>
          <span style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", background: T.bg, padding: "0 8px", fontSize: 11, color: T.subtext, fontWeight: 600 }}>SEASON ENDS ABOVE · NOT COUNTED BELOW</span>
        </div>

        {POST_SEASON_EVENTS.map((e, i) => (
          <div key={i} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "10px 12px", marginBottom: 8, borderRadius: 12,
            background: "#f8f8f8", border: `1px dashed ${T.border}`, opacity: 0.6,
          }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: T.subtext }}>{e.name}</div>
              <div style={{ fontSize: 12, color: T.subtext }}>{e.location} · {e.dates}</div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 10, background: "#eee", color: T.subtext }}>Excluded</span>
          </div>
        ))}
      </>)}
    </div>
  );
}

// ── TRADES PAGE ───────────────────────────────────────────────────────────
function TradesPage({ league }) {
  const [tab, setTab] = useState("Propose");
  const tabs = ["Propose", "Incoming", "Outgoing", "History"];
  const inviteCode = "CHAIN26";

  return (
    <div style={{ padding: "20px 16px 100px" }}>
      <h1 style={{ fontFamily: "'Georgia',serif", fontSize: 28, margin: "0 0 2px" }}>Trade Center</h1>
      <p style={{ color: T.subtext, margin: "0 0 18px", fontSize: 14 }}>Propose trades with other teams in your league</p>

      <div style={{ display: "flex", background: "#fff", borderRadius: 20, padding: 4, marginBottom: 20, border: `1.5px solid ${T.border}` }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: "8px 4px", borderRadius: 16,
            background: tab === t ? T.darkGreen : "transparent",
            color: tab === t ? "#fff" : T.subtext,
            border: "none", fontWeight: tab === t ? 700 : 400, fontSize: 13, cursor: "pointer",
          }}>{t}</button>
        ))}
      </div>

      {tab === "Propose" && (
        <Card>
          <p style={{ fontWeight: 700, marginBottom: 6 }}>Select team to trade with</p>
          <p style={{ color: T.subtext, fontSize: 14 }}>No other teams in this league yet.</p>
          <p style={{ color: T.subtext, fontSize: 13, marginTop: 12 }}>
            Invite friends with code <strong style={{ color: T.green }}>{inviteCode}</strong>
          </p>
          <Btn style={{ width: "100%", marginTop: 14 }} onClick={() => navigator?.clipboard?.writeText(inviteCode)}>
            📋 Copy Invite Code: {inviteCode}
          </Btn>
        </Card>
      )}
      {(tab === "Incoming" || tab === "Outgoing" || tab === "History") && (
        <Card><p style={{ color: T.subtext, fontSize: 14, textAlign: "center", margin: 0 }}>No {tab.toLowerCase()} trades yet.</p></Card>
      )}
    </div>
  );
}


// ── SALARY DRAFT ROOM ────────────────────────────────────────────────────
// Auction-style: any team nominates a player, all teams bid, highest wins.
function SalaryDraftRoom({ league, onDraftComplete, onCpuTeamsReady }) {
  const ROSTER_LIMIT = league?.settings?.rosterCap ?? 10;
  const startersLabel = league?.settings?.startersPerWeek ?? 5;
  const BUDGET = league?.draftSettings?.salaryBudget ?? 200;
  const CPU_COUNT = 3;
  const cpuNames = CPU_TEAMS.slice(0, CPU_COUNT);

  const BID_SECONDS = league?.draftSettings?.pickTimer ?? 30;
  const [available, setAvailable] = useState([...ALL_PLAYERS]);
  const [myRoster, setMyRoster] = useState([]);
  const [myBudget, setMyBudget] = useState(BUDGET);
  const [cpuBudgets, setCpuBudgets] = useState(cpuNames.map(() => BUDGET));
  const [cpuRosters, setCpuRosters] = useState(cpuNames.map(() => []));

  // Auction state
  const [nominated, setNominated] = useState(null);   // player being auctioned
  const [currentBid, setCurrentBid] = useState(1);
  const [bidInput, setBidInput] = useState("1");
  const [auctionWinner, setAuctionWinner] = useState(null); // {team, amount}
  const [auctionLog, setAuctionLog] = useState([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("total");
  const [showLog, setShowLog] = useState(false);
  const [phase, setPhase] = useState("nominate"); // nominate | bidding | result

  const slotsLeft = ROSTER_LIMIT - myRoster.length;
  const minBid = slotsLeft > 1 ? 1 : myBudget; // must keep $1 per remaining slot
  const maxBid = Math.max(1, myBudget - (slotsLeft - 1));
  const isDraftOver = myRoster.length >= ROSTER_LIMIT || available.length === 0;

  const filtered = available
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortBy === "total" ? b.total - a.total : sortBy === "rating" ? b.rating - a.rating : b.avg - a.avg);

  // Nominate a player — starts the auction
  const nominate = (player) => {
    setNominated(player);
    setCurrentBid(1);
    setBidInput("1");
    setAuctionWinner(null);
    setPhase("bidding");
  };

  // Simulate CPU bids — each CPU bids based on player value vs remaining budget
  const getCpuBid = (playerTotal, cpuIdx) => {
    const budget = cpuBudgets[cpuIdx];
    const slotsLeftCpu = ROSTER_LIMIT - cpuRosters[cpuIdx].length;
    const maxCpuBid = Math.max(1, budget - (slotsLeftCpu - 1));
    // CPU willingness: scale by player rank in pool
    const rank = ALL_PLAYERS.indexOf(ALL_PLAYERS.find(p => p.total === playerTotal)) ?? 15;
    const willingness = Math.max(1, Math.round(BUDGET * (1 - rank / ALL_PLAYERS.length) * 0.6 * (0.7 + Math.random() * 0.6)));
    return Math.min(willingness, maxCpuBid);
  };

  const submitBid = () => {
    const bid = parseInt(bidInput);
    if (isNaN(bid) || bid < minBid) return;
    if (bid > maxBid) return;

    // Collect CPU bids
    const cpuBidAmounts = cpuBudgets.map((_, i) => {
      if (cpuRosters[i].length >= ROSTER_LIMIT) return 0;
      return getCpuBid(nominated.total, i);
    });

    const myBidAmount = bid;
    const allBids = [
      { team: league.teamName, amount: myBidAmount, isMe: true },
      ...cpuBidAmounts.map((amt, i) => ({ team: cpuNames[i], amount: amt, isMe: false })),
    ];
    const winner = allBids.reduce((best, b) => b.amount > best.amount ? b : best, allBids[0]);

    setAuctionWinner(winner);
    setPhase("result");

    // Apply results
    const newAvail = available.filter(p => p.id !== nominated.id);
    setAvailable(newAvail);

    const newLog = [...auctionLog, {
      player: nominated.name, winner: winner.team, amount: winner.amount,
      bids: allBids.filter(b => b.amount > 0),
    }];
    setAuctionLog(newLog);

    if (winner.isMe) {
      setMyRoster(prev => [...prev, nominated]);
      setMyBudget(prev => prev - winner.amount);
    } else {
      const cpuIdx = cpuNames.indexOf(winner.team);
      if (cpuIdx >= 0) {
        setCpuRosters(prev => {
          const next = [...prev];
          next[cpuIdx] = [...next[cpuIdx], nominated];
          return next;
        });
        setCpuBudgets(prev => {
          const next = [...prev];
          next[cpuIdx] = next[cpuIdx] - winner.amount;
          return next;
        });
      }
    }
  };

  // After viewing result, go back to nominate
  const nextNomination = () => {
    setNominated(null);
    setAuctionWinner(null);
    setPhase("nominate");
  };

  if (isDraftOver) {
    return (
      <div style={{ minHeight: "100vh", background: T.darkGreen, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ textAlign: "center", maxWidth: 380, width: "100%" }}>
          <div style={{ fontSize: 64, marginBottom: 12 }}>🎉</div>
          <h2 style={{ color: "#fff", fontFamily: "'Georgia',serif", fontSize: 28, margin: "0 0 8px" }}>Draft Complete!</h2>
          <p style={{ color: "rgba(255,255,255,0.7)", margin: "0 0 6px" }}>You drafted {myRoster.length} players · ${myBudget} remaining</p>
          <Card>
            <p style={{ fontWeight: 700, margin: "0 0 12px", fontSize: 16 }}>Your Roster</p>
            {myRoster.map((p, i) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: i < myRoster.length - 1 ? `1px solid ${T.border}` : "none" }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: i < startersLabel ? T.green : "#ddd", color: i < startersLabel ? "#fff" : T.subtext, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>{i + 1}</div>
                <Av ini={p.ini} size={32} color={i < startersLabel ? T.green : "#aaa"} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: T.subtext }}>{i < startersLabel ? "Starter" : "Bench"} · {p.total} pts</div>
                </div>
                <span style={{ fontSize: 12, color: T.green, fontWeight: 700 }}>
                  ${auctionLog.find(l => l.winner === league.teamName && l.player === p.name)?.amount ?? "—"}
                </span>
              </div>
            ))}
          </Card>
          <Btn style={{ width: "100%", padding: "15px 0", fontSize: 16, marginTop: 8 }} onClick={() => {
            const builtCpuTeams = cpuNames.map((name, idx) => ({
              name, type: "cpu",
              pts: cpuRosters[idx].slice(0, startersLabel).reduce((s, p) => s + Math.round(p.total * 0.8), 0),
              roster: cpuRosters[idx],
            }));
            onCpuTeamsReady?.(builtCpuTeams);
            onDraftComplete(myRoster, available);
          }}>Enter League →</Btn>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'Helvetica Neue',sans-serif" }}>
      {/* Header */}
      <div style={{ background: T.darkGreen, padding: "14px 16px 12px", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontFamily: "'Georgia',serif", fontSize: 18 }}>💰 Salary Draft</div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>{myRoster.length}/{ROSTER_LIMIT} players · ${myBudget} left</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: T.accent, fontWeight: 700, fontSize: 13 }}>{available.length} players left</div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>{auctionLog.length} auctions done</div>
          </div>
        </div>
        {/* Budget bar */}
        <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 4, height: 4 }}>
          <div style={{ background: myBudget > BUDGET * 0.3 ? T.accent : T.red, borderRadius: 4, height: 4, width: `${(myBudget / BUDGET) * 100}%`, transition: "width 0.3s" }} />
        </div>
      </div>

      <div style={{ padding: "14px 16px 100px" }}>

        {/* BIDDING PHASE */}
        {phase === "bidding" && nominated && (
          <Card style={{ border: `2px solid ${T.accent}`, marginBottom: 14 }}>
            <div style={{ textAlign: "center", marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.accent, letterSpacing: 1 }}>🔨 ON THE BLOCK</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.subtext }}>· {BID_SECONDS}s to bid</div>
            </div>
              <Av ini={nominated.ini} size={52} style={{ margin: "0 auto 10px" }} />
              <div style={{ fontWeight: 800, fontSize: 20 }}>{nominated.name}</div>
              <div style={{ color: T.subtext, fontSize: 13, marginTop: 4 }}>
                Rating {nominated.rating} · {nominated.wins}W · {nominated.total} season pts
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <input
                type="number"
                value={bidInput}
                min={minBid}
                max={maxBid}
                onChange={e => setBidInput(e.target.value)}
                style={{
                  flex: 1, padding: "13px 14px", borderRadius: 12,
                  border: `1.5px solid ${T.border}`, fontSize: 18, fontWeight: 700,
                  textAlign: "center", outline: "none", fontFamily: "inherit",
                }}
                placeholder={`$${minBid}–$${maxBid}`}
              />
              <Btn style={{ padding: "13px 20px", fontSize: 15 }} onClick={submitBid}>Bid 💸</Btn>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {[1, 5, 10, 25, 50].filter(v => v <= maxBid).map(v => (
                <button key={v} onClick={() => setBidInput(String(v))} style={{
                  flex: 1, padding: "7px 0", borderRadius: 10, border: `1.5px solid ${T.border}`,
                  background: bidInput === String(v) ? T.green : "#fff",
                  color: bidInput === String(v) ? "#fff" : T.subtext,
                  fontWeight: 700, fontSize: 13, cursor: "pointer",
                }}>${v}</button>
              ))}
            </div>
            <div style={{ marginTop: 10, fontSize: 12, color: T.subtext, textAlign: "center" }}>
              Budget: ${myBudget} · Max bid: ${maxBid} · Must keep $1/remaining slot
            </div>
            <button onClick={() => setPhase("nominate")} style={{ display: "block", margin: "10px auto 0", background: "none", border: "none", color: T.subtext, fontSize: 13, cursor: "pointer" }}>
              ← Cancel nomination
            </button>
          </Card>
        )}

        {/* RESULT PHASE */}
        {phase === "result" && auctionWinner && nominated && (
          <Card style={{ border: `2px solid ${auctionWinner.isMe ? T.green : T.border}`, marginBottom: 14, textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>{auctionWinner.isMe ? "🎉" : "😤"}</div>
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>
              {auctionWinner.isMe ? "You won the bid!" : `${auctionWinner.team} won`}
            </div>
            <div style={{ fontWeight: 700, fontSize: 22, color: T.green, marginBottom: 4 }}>
              {nominated.name}
            </div>
            <div style={{ color: T.subtext, fontSize: 14, marginBottom: 14 }}>
              Winning bid: <strong>${auctionWinner.amount}</strong>
            </div>
            {auctionLog[auctionLog.length - 1]?.bids && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.subtext, letterSpacing: 1, marginBottom: 8 }}>ALL BIDS</div>
                {auctionLog[auctionLog.length - 1].bids.sort((a, b) => b.amount - a.amount).map((b, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${T.border}`, fontSize: 13 }}>
                    <span style={{ fontWeight: b.team === auctionWinner.team ? 700 : 400 }}>
                      {b.team === auctionWinner.team ? "👑 " : ""}{b.team}
                    </span>
                    <span style={{ fontWeight: 700, color: b.team === auctionWinner.team ? T.green : T.subtext }}>${b.amount}</span>
                  </div>
                ))}
              </div>
            )}
            <Btn style={{ width: "100%" }} onClick={nextNomination}>Next Nomination →</Btn>
          </Card>
        )}

        {/* NOMINATE PHASE */}
        {phase === "nominate" && (<>
          {/* My roster chips */}
          {myRoster.length > 0 && (
            <Card style={{ marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>My Roster ({myRoster.length}/{ROSTER_LIMIT}) · ${myBudget} left</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {myRoster.map((p, i) => (
                  <div key={p.id} style={{ background: i < startersLabel ? T.lightGreen : "#f0f0f0", borderRadius: 8, padding: "4px 10px", fontSize: 12, fontWeight: 600, color: i < startersLabel ? T.green : T.subtext }}>
                    {p.name}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Auction log */}
          {auctionLog.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <button onClick={() => setShowLog(!showLog)} style={{ background: "none", border: "none", color: T.green, fontWeight: 600, fontSize: 13, cursor: "pointer", padding: 0 }}>
                {showLog ? "▲ Hide" : "▼ Show"} Auction Log ({auctionLog.length} completed)
              </button>
              {showLog && (
                <Card style={{ marginTop: 8, maxHeight: 160, overflowY: "auto" }}>
                  {[...auctionLog].reverse().map((entry, i) => (
                    <div key={i} style={{ fontSize: 12, padding: "4px 0", borderBottom: `1px solid ${T.border}`, color: entry.winner === league.teamName ? T.green : T.text }}>
                      <strong>{entry.winner}</strong> got {entry.player} for <strong>${entry.amount}</strong>
                    </div>
                  ))}
                </Card>
              )}
            </div>
          )}

          {/* Search + sort */}
          <input
            placeholder="🔍 Search players to nominate..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: "100%", padding: "11px 14px", borderRadius: 12, border: `1.5px solid ${T.border}`, fontSize: 14, marginBottom: 8, boxSizing: "border-box", outline: "none", fontFamily: "inherit" }}
          />
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            {[["total","Season Pts"],["rating","Rating"],["avg","Avg"]].map(([key, label]) => (
              <button key={key} onClick={() => setSortBy(key)} style={{
                padding: "5px 12px", borderRadius: 16, fontSize: 12, fontWeight: 600, cursor: "pointer",
                background: sortBy === key ? T.green : "#fff", color: sortBy === key ? "#fff" : T.subtext,
                border: `1.5px solid ${sortBy === key ? T.green : T.border}`,
              }}>{label}</button>
            ))}
          </div>

          <div style={{ fontWeight: 700, fontSize: 13, color: T.subtext, marginBottom: 8 }}>
            AVAILABLE ({filtered.length}) — tap to nominate
          </div>

          {filtered.map(p => (
            <div key={p.id} style={{ background: T.card, borderRadius: 14, padding: "12px 14px", marginBottom: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: `1.5px solid ${T.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Av ini={p.ini} size={42} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: T.subtext, marginTop: 2 }}>
                    Rating {p.rating} · {p.wins}W · {p.top5} top-5
                  </div>
                  <div style={{ fontSize: 12, marginTop: 2 }}>
                    <span style={{ color: T.green, fontWeight: 700 }}>{p.total} pts</span>
                    <span style={{ color: T.subtext }}> · {p.avg} avg</span>
                  </div>
                </div>
                <Btn style={{ padding: "8px 14px", fontSize: 13 }} onClick={() => nominate(p)}>
                  Nominate
                </Btn>
              </div>
            </div>
          ))}
        </>)}
      </div>
    </div>
  );
}

// ── PLAYER PROFILES ──────────────────────────────────────────────────────
function PlayerProfile({ player, onClose, myRoster, onClaim, inWaivers }) {
  const eventScores = COMPLETED.map((ev, i) => {
    const seed = player.id * (i + 7);
    const didPlay = player.events > i;
    if (!didPlay) return null;
    const scoreVsPar = Math.round((player.avg * 1.2) - Math.random() * player.avg * 0.8);
    return { event: ev.name, dates: ev.dates, score: scoreVsPar, won: ev.winner === player.name };
  });
  const owned = myRoster?.find(p => p.id === player.id);
  const hotStreak = eventScores.filter(Boolean).slice(-3).filter(s => s.score > 0).length >= 2;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200, display: "flex", alignItems: "flex-end" }}>
      <div style={{ background: T.bg, width: "100%", maxWidth: 480, margin: "0 auto", borderRadius: "20px 20px 0 0", maxHeight: "88vh", overflowY: "auto" }}>
        {/* Header */}
        <div style={{ background: T.darkGreen, borderRadius: "20px 20px 0 0", padding: "20px 16px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <Av ini={player.ini} size={56} />
              <div>
                <div style={{ color: "#fff", fontWeight: 800, fontSize: 22, fontFamily: "'Georgia',serif" }}>{player.name}</div>
                <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, marginTop: 3 }}>
                  MPO · PDGA Rating {player.rating}
                  {hotStreak && <span style={{ marginLeft: 8, color: T.accent }}>🔥 Hot Streak</span>}
                </div>
              </div>
            </div>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", width: 32, height: 32, borderRadius: 16, cursor: "pointer", fontSize: 18 }}>×</button>
          </div>
          {/* Stat row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
            {[
              { label: "WINS", val: player.wins },
              { label: "TOP 5", val: player.top5 },
              { label: "EVENTS", val: player.events },
              { label: "AVG PTS", val: player.avg },
            ].map(s => (
              <div key={s.label} style={{ background: "rgba(255,255,255,0.1)", borderRadius: 10, padding: "8px 6px", textAlign: "center" }}>
                <div style={{ color: "#fff", fontWeight: 800, fontSize: 16 }}>{s.val}</div>
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 9, fontWeight: 700, letterSpacing: 0.5, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: "16px 16px 32px" }}>
          {/* Projected / start-sit rec */}
          <Card style={{ background: "linear-gradient(135deg,#f5f9f5,#edf5ed)", border: `1px solid ${T.border}` }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>📊 Start/Sit Recommendation</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: player.avg >= 6 ? T.green : player.avg >= 3 ? T.accent : "#ccc",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontWeight: 800, fontSize: 13,
              }}>{player.avg >= 6 ? "START" : player.avg >= 3 ? "SIT" : "BENCH"}</div>
              <div style={{ fontSize: 13, color: T.subtext, flex: 1 }}>
                {player.avg >= 6
                  ? `${player.name} is a must-start. ${player.wins} wins and top-5 consistency make them elite.`
                  : player.avg >= 3
                  ? `Solid mid-tier option. Start if you have injuries or limited depth.`
                  : `Low floor — only start in a pinch or if starters are unavailable.`}
              </div>
            </div>
            <div style={{ marginTop: 10, padding: "8px 12px", background: "#fff", borderRadius: 10, fontSize: 12, color: T.subtext }}>
              📍 Next event: <strong>Northwest Championship</strong> · Portland, OR · Jun 4–7
            </div>
          </Card>

          {/* Season timeline */}
          <div style={{ fontWeight: 700, fontSize: 14, margin: "4px 0 10px" }}>📅 2026 Event History</div>
          {eventScores.map((s, i) => s && (
            <div key={i} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "9px 12px", marginBottom: 6, borderRadius: 12,
              background: s.won ? "linear-gradient(135deg,#f0f8f0,#e0f0e0)" : T.card,
              border: `1px solid ${s.won ? T.green : T.border}`,
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{s.won ? "🏆 " : ""}{COMPLETED[i].name}</div>
                <div style={{ fontSize: 11, color: T.subtext }}>{COMPLETED[i].dates}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: s.score > 0 ? T.green : T.red }}>
                  {s.score > 0 ? "+" : ""}{s.score} pts
                </div>
                {s.won && <div style={{ fontSize: 10, color: T.green, fontWeight: 700 }}>WIN</div>}
              </div>
            </div>
          ))}
          {eventScores.some(s => !s) && (
            <div style={{ fontSize: 12, color: T.subtext, textAlign: "center", marginBottom: 12 }}>
              Did not play {eventScores.filter(s => !s).length} event(s)
            </div>
          )}

          {/* Action button */}
          {inWaivers && !owned && (
            <Btn style={{ width: "100%", marginTop: 8 }} onClick={() => { onClaim(player); onClose(); }}>
              + Claim {player.name}
            </Btn>
          )}
          {owned && (
            <div style={{ textAlign: "center", padding: "12px", background: T.lightGreen, borderRadius: 12, color: T.green, fontWeight: 700, fontSize: 14 }}>
              ✓ On your roster
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── MATCHUP PAGE ─────────────────────────────────────────────────────────
function MatchupPage({ league, cpuTeams }) {
  const [week, setWeek] = useState(0); // index into COMPLETED
  const { teamName, roster, settings } = league;
  const startersPerWeek = settings?.startersPerWeek ?? 5;
  const myStarters = roster.filter(p => p.starter);
  const myWeekPts = myStarters.reduce((s, p) => {
    const seed = p.id * (week + 3);
    return s + Math.max(0, Math.round(p.avg * (0.6 + (Math.sin(seed) * 0.5 + 0.5) * 0.9)));
  }, 0);

  // Simulate an opponent from CPU teams or a placeholder
  const opp = cpuTeams[week % Math.max(1, cpuTeams.length)] ?? { name: "Open Slot", pts: 0, roster: [] };
  const oppStarters = (opp.roster ?? []).slice(0, startersPerWeek);
  const oppWeekPts = opp.pts > 0
    ? Math.round(opp.pts / Math.max(1, COMPLETED.length) * (0.7 + (week * 0.07) % 0.6))
    : oppStarters.reduce((s, p) => s + Math.max(0, Math.round((p.avg ?? 3) * 0.8)), 0);

  const iWin = myWeekPts > oppWeekPts;
  const currentEvent = COMPLETED[week];

  return (
    <div style={{ padding: "20px 16px 100px" }}>
      <h1 style={{ fontFamily: "'Georgia',serif", fontSize: 28, margin: "0 0 2px" }}>Matchups</h1>
      <p style={{ color: T.subtext, margin: "0 0 14px", fontSize: 14 }}>Head-to-head weekly results</p>

      {/* Week selector */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <button onClick={() => setWeek(w => Math.max(0, w - 1))} disabled={week === 0}
          style={{ background: week === 0 ? "#eee" : T.green, color: week === 0 ? T.subtext : "#fff", border: "none", borderRadius: 10, padding: "8px 16px", fontWeight: 700, cursor: week === 0 ? "default" : "pointer" }}>‹ Prev</button>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Week {week + 1} of {COMPLETED.length}</div>
          <div style={{ fontSize: 12, color: T.subtext }}>{currentEvent?.name}</div>
        </div>
        <button onClick={() => setWeek(w => Math.min(COMPLETED.length - 1, w + 1))} disabled={week === COMPLETED.length - 1}
          style={{ background: week === COMPLETED.length - 1 ? "#eee" : T.green, color: week === COMPLETED.length - 1 ? T.subtext : "#fff", border: "none", borderRadius: 10, padding: "8px 16px", fontWeight: 700, cursor: week === COMPLETED.length - 1 ? "default" : "pointer" }}>Next ›</button>
      </div>

      {/* Score card */}
      <div style={{ background: `linear-gradient(135deg, ${T.darkGreen}, ${T.green})`, borderRadius: 20, padding: "20px 16px", marginBottom: 14, color: "#fff" }}>
        <div style={{ textAlign: "center", fontSize: 12, fontWeight: 700, letterSpacing: 1, opacity: 0.7, marginBottom: 14 }}>
          {currentEvent?.dates} · {currentEvent?.location}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ textAlign: "center", flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 42, fontFamily: "'Georgia',serif", color: iWin ? T.accent : "#fff" }}>{myWeekPts}</div>
            <div style={{ fontWeight: 700, fontSize: 13, marginTop: 4 }}>{teamName}</div>
            {iWin && <div style={{ fontSize: 11, color: T.accent, fontWeight: 700, marginTop: 2 }}>WIN ✓</div>}
          </div>
          <div style={{ fontSize: 24, opacity: 0.5 }}>vs</div>
          <div style={{ textAlign: "center", flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 42, fontFamily: "'Georgia',serif", color: !iWin ? T.accent : "#fff" }}>{oppWeekPts}</div>
            <div style={{ fontWeight: 700, fontSize: 13, marginTop: 4 }}>{opp.name}</div>
            {!iWin && <div style={{ fontSize: 11, color: T.accent, fontWeight: 700, marginTop: 2 }}>WIN ✓</div>}
          </div>
        </div>
        <div style={{ textAlign: "center", marginTop: 14, padding: "8px 0", borderTop: "1px solid rgba(255,255,255,0.15)", fontSize: 12, opacity: 0.7 }}>
          {iWin ? "🎉 You won this week!" : "😤 Better luck next week"}
        </div>
      </div>

      {/* My lineup */}
      <Card>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>{teamName} · Starters</div>
        {myStarters.length === 0 && <p style={{ color: T.subtext, fontSize: 13 }}>No starters set for this week.</p>}
        {myStarters.map((p, i) => {
          const seed = p.id * (week + 3);
          const pts = Math.max(0, Math.round(p.avg * (0.6 + (Math.sin(seed) * 0.5 + 0.5) * 0.9)));
          return (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < myStarters.length - 1 ? `1px solid ${T.border}` : "none" }}>
              <Av ini={p.ini} size={36} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: T.subtext }}>Rating {p.rating}</div>
              </div>
              <div style={{ fontWeight: 800, fontSize: 16, color: pts > 0 ? T.green : T.red }}>{pts > 0 ? "+" : ""}{pts}</div>
            </div>
          );
        })}
      </Card>

      {/* Season record */}
      <Card>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>📋 Season Record</div>
        {COMPLETED.map((ev, i) => {
          const myPts = roster.filter(p => p.starter).reduce((s, p) => {
            const seed2 = p.id * (i + 3);
            return s + Math.max(0, Math.round(p.avg * (0.6 + (Math.sin(seed2) * 0.5 + 0.5) * 0.9)));
          }, 0);
          const oppObj = cpuTeams[i % Math.max(1, cpuTeams.length)] ?? { name: "TBD", pts: 0 };
          const oppPts = oppObj.pts > 0 ? Math.round(oppObj.pts / COMPLETED.length * (0.7 + (i * 0.07) % 0.6)) : 20;
          const win = myPts > oppPts;
          return (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: i < COMPLETED.length - 1 ? `1px solid ${T.border}` : "none" }}>
              <div style={{ fontSize: 13, color: T.subtext, flex: 1 }}>Wk {i + 1} · {ev.name.slice(0, 20)}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: win ? T.green : T.red, marginRight: 8 }}>{win ? "W" : "L"}</div>
              <div style={{ fontSize: 13, color: T.subtext }}>{myPts}–{oppPts}</div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}

// ── PLAYOFF BRACKET PAGE ──────────────────────────────────────────────────
function BracketPage({ league, cpuTeams }) {
  const { teamName, roster, settings } = league;
  const playoffTeams = settings?.playoffTeams ?? 4;
  const myPts = roster.filter(p => p.starter).reduce((s, p) => s + p.total, 0);
  const myAvg = myPts / Math.max(1, COMPLETED.length);

  const allTeams = [
    { name: teamName, pts: myPts, avg: myAvg, isMe: true },
    ...cpuTeams.map(t => ({ name: t.name, pts: t.pts ?? 0, avg: (t.pts ?? 0) / COMPLETED.length, isMe: false })),
  ].sort((a, b) => b.pts - a.pts).slice(0, playoffTeams);

  // Build bracket pairs (seed 1 vs last, seed 2 vs second-last, etc.)
  const rounds = [];
  let current = allTeams;
  while (current.length > 1) {
    const pairs = [];
    for (let i = 0; i < Math.floor(current.length / 2); i++) {
      pairs.push([current[i], current[current.length - 1 - i]]);
    }
    rounds.push(pairs);
    // Simulate: higher seed always wins first round
    current = pairs.map(([a]) => a);
  }

  return (
    <div style={{ padding: "20px 16px 100px" }}>
      <h1 style={{ fontFamily: "'Georgia',serif", fontSize: 28, margin: "0 0 2px" }}>Playoff Bracket</h1>
      <p style={{ color: T.subtext, margin: "0 0 14px", fontSize: 14 }}>Top {playoffTeams} teams · Finals at USDGC</p>

      <div style={{ background: `linear-gradient(135deg,${T.darkGreen},${T.green})`, borderRadius: 16, padding: "14px 16px", marginBottom: 16, color: "#fff", display: "flex", gap: 12, alignItems: "center" }}>
        <span style={{ fontSize: 28 }}>🏆</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Championship Finals</div>
          <div style={{ opacity: 0.7, fontSize: 13 }}>USDGC · Rock Hill, SC · Oct 8–11</div>
          <div style={{ opacity: 0.5, fontSize: 12, marginTop: 2 }}>Winner is crowned Chain Masters Champion</div>
        </div>
      </div>

      {rounds.map((pairs, ri) => (
        <div key={ri} style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.subtext, letterSpacing: 1, marginBottom: 10 }}>
            {ri === rounds.length - 1 ? "🏆 CHAMPIONSHIP" : ri === rounds.length - 2 ? "SEMIFINALS" : `ROUND ${ri + 1}`}
          </div>
          {pairs.map(([a, b], pi) => (
            <Card key={pi} style={{ padding: "14px 16px", border: ri === rounds.length - 1 ? `2px solid ${T.accent}` : `1px solid ${T.border}` }}>
              {[a, b].map((team, ti) => (
                <div key={ti} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "8px 0",
                  borderBottom: ti === 0 ? `1px dashed ${T.border}` : "none",
                  opacity: ti === 1 && ri > 0 ? 0.55 : 1,
                }}>
                  <div style={{ width: 22, textAlign: "center", fontSize: 12, fontWeight: 700, color: T.subtext }}>#{ti === 0 ? allTeams.indexOf(a) + 1 : allTeams.indexOf(b) + 1}</div>
                  <Av ini={team.name.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase()} size={36} color={team.isMe ? T.green : "#8aaa8a"} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>
                      {team.name}
                      {team.isMe && <span style={{ background: T.lightGreen, color: T.green, fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 8, marginLeft: 6 }}>You</span>}
                    </div>
                    <div style={{ fontSize: 12, color: T.subtext }}>{team.pts} pts · {team.avg.toFixed(1)} avg</div>
                  </div>
                  {ti === 0 && <span style={{ fontSize: 11, color: T.green, fontWeight: 700 }}>ADV →</span>}
                </div>
              ))}
            </Card>
          ))}
        </div>
      ))}

      {allTeams.length < 2 && (
        <Card>
          <p style={{ color: T.subtext, textAlign: "center", margin: 0 }}>Need at least 2 teams to show bracket. Invite more players!</p>
        </Card>
      )}
    </div>
  );
}

// ── POWER RANKINGS PAGE ───────────────────────────────────────────────────
function PowerRankingsPage({ league, cpuTeams }) {
  const { teamName, roster, settings } = league;
  const myPts = roster.filter(p => p.starter).reduce((s, p) => s + p.total, 0);
  const myAvg = myPts / Math.max(1, COMPLETED.length);

  const allTeams = [
    { name: teamName, pts: myPts, avg: myAvg, isMe: true, trend: "+2", recentForm: "W-W-L-W-W" },
    ...cpuTeams.map((t, i) => ({
      name: t.name, pts: t.pts ?? 0, avg: (t.pts ?? 0) / Math.max(1, COMPLETED.length),
      isMe: false,
      trend: i % 3 === 0 ? "+1" : i % 3 === 1 ? "−1" : "—",
      recentForm: ["W-L-W-W-L","L-W-L-W-W","W-W-W-L-W","L-L-W-W-W"][i % 4],
    })),
  ].sort((a, b) => b.pts - a.pts);

  return (
    <div style={{ padding: "20px 16px 100px" }}>
      <h1 style={{ fontFamily: "'Georgia',serif", fontSize: 28, margin: "0 0 2px" }}>Power Rankings</h1>
      <p style={{ color: T.subtext, margin: "0 0 6px", fontSize: 14 }}>Updated after each tournament</p>
      <p style={{ color: T.subtext, fontSize: 12, margin: "0 0 16px" }}>Based on season pts, recent form, and strength of schedule</p>

      {allTeams.map((team, i) => (
        <Card key={team.name} style={{ padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ textAlign: "center", width: 32 }}>
              <div style={{ fontWeight: 800, fontSize: 20, fontFamily: "'Georgia',serif", color: i === 0 ? T.accent : T.text }}>
                {i === 0 ? "👑" : i + 1}
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: team.trend.startsWith("+") ? T.green : team.trend.startsWith("−") ? T.red : T.subtext }}>
                {team.trend}
              </div>
            </div>
            <Av ini={team.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()} size={42} color={team.isMe ? T.green : "#8aaa8a"} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", gap: 6 }}>
                {team.name}
                {team.isMe && <span style={{ background: T.lightGreen, color: T.green, fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 8 }}>You</span>}
              </div>
              <div style={{ fontSize: 12, color: T.subtext, marginTop: 2 }}>
                {team.avg.toFixed(1)} avg · Recent: {team.recentForm}
              </div>
              {/* Mini form bar */}
              <div style={{ display: "flex", gap: 3, marginTop: 5 }}>
                {team.recentForm.split("-").map((r, j) => (
                  <div key={j} style={{ width: 18, height: 6, borderRadius: 3, background: r === "W" ? T.green : T.red }} />
                ))}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: 800, fontSize: 18, fontFamily: "'Georgia',serif" }}>{team.pts}</div>
              <div style={{ fontSize: 11, color: T.subtext }}>pts</div>
            </div>
          </div>
        </Card>
      ))}
      {allTeams.length === 1 && (
        <Card><p style={{ color: T.subtext, textAlign: "center", margin: 0 }}>Invite more teams to see full rankings!</p></Card>
      )}
    </div>
  );
}

// ── WEEKLY RECAP PAGE ─────────────────────────────────────────────────────
function WeeklyRecapPage({ league }) {
  const [recapWeek, setRecapWeek] = useState(COMPLETED.length - 1);
  const { roster } = league;
  const event = COMPLETED[recapWeek];
  const starters = roster.filter(p => p.starter);

  const playerScores = starters.map(p => {
    const seed = p.id * (recapWeek + 3);
    const pts = Math.max(0, Math.round(p.avg * (0.6 + (Math.sin(seed) * 0.5 + 0.5) * 0.9)));
    return { ...p, weekPts: pts };
  }).sort((a, b) => b.weekPts - a.weekPts);

  const totalPts = playerScores.reduce((s, p) => s + p.weekPts, 0);
  const best = playerScores[0];
  const worst = playerScores[playerScores.length - 1];

  // All players leaderboard for this event
  const topAllPlayers = ALL_PLAYERS.map(p => {
    const seed = p.id * (recapWeek + 3);
    const pts = Math.max(0, Math.round(p.avg * (0.6 + (Math.sin(seed) * 0.5 + 0.5) * 0.9)));
    return { ...p, weekPts: pts };
  }).sort((a, b) => b.weekPts - a.weekPts).slice(0, 5);

  return (
    <div style={{ padding: "20px 16px 100px" }}>
      <h1 style={{ fontFamily: "'Georgia',serif", fontSize: 28, margin: "0 0 2px" }}>Weekly Recap</h1>
      <p style={{ color: T.subtext, margin: "0 0 14px", fontSize: 14 }}>Post-tournament analysis</p>

      {/* Week picker */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <button onClick={() => setRecapWeek(w => Math.max(0, w - 1))} disabled={recapWeek === 0}
          style={{ background: recapWeek === 0 ? "#eee" : T.green, color: recapWeek === 0 ? T.subtext : "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontWeight: 700, cursor: recapWeek === 0 ? "default" : "pointer" }}>‹</button>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{event.name}</div>
          <div style={{ fontSize: 12, color: T.subtext }}>{event.dates} · {event.location}</div>
        </div>
        <button onClick={() => setRecapWeek(w => Math.min(COMPLETED.length - 1, w + 1))} disabled={recapWeek === COMPLETED.length - 1}
          style={{ background: recapWeek === COMPLETED.length - 1 ? "#eee" : T.green, color: recapWeek === COMPLETED.length - 1 ? T.subtext : "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontWeight: 700, cursor: recapWeek === COMPLETED.length - 1 ? "default" : "pointer" }}>›</button>
      </div>

      {/* Summary card */}
      <div style={{ background: `linear-gradient(135deg,${T.darkGreen},${T.green})`, borderRadius: 16, padding: "16px", marginBottom: 14, color: "#fff" }}>
        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 44, fontWeight: 800, fontFamily: "'Georgia',serif" }}>{totalPts}</div>
          <div style={{ opacity: 0.7 }}>Your team scored this week</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px", textAlign: "center" }}>
            <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 4 }}>🔥 BEST PICK</div>
            <div style={{ fontWeight: 700 }}>{best?.name ?? "—"}</div>
            <div style={{ color: T.accent, fontWeight: 800 }}>+{best?.weekPts ?? 0} pts</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px", textAlign: "center" }}>
            <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 4 }}>💤 WORST PICK</div>
            <div style={{ fontWeight: 700 }}>{worst?.name ?? "—"}</div>
            <div style={{ color: "#ff8888", fontWeight: 800 }}>{worst?.weekPts ?? 0} pts</div>
          </div>
        </div>
      </div>

      {/* Tournament winner */}
      <Card style={{ background: "linear-gradient(135deg,#fdf8ec,#fef3d0)", border: `1.5px solid ${T.accent}` }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.accent, letterSpacing: 1, marginBottom: 6 }}>🏆 TOURNAMENT WINNER</div>
        <div style={{ fontWeight: 800, fontSize: 18 }}>{event.winner}</div>
        <div style={{ color: T.subtext, fontSize: 13, marginTop: 3 }}>Final score: {event.score} (vs par) · {event.name}</div>
      </Card>

      {/* Your lineup scores */}
      <Card>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Your Lineup Scores</div>
        {playerScores.map((p, i) => (
          <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < playerScores.length - 1 ? `1px solid ${T.border}` : "none" }}>
            <Av ini={p.ini} size={36} color={i === 0 ? T.accent : T.green} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
              <div style={{ fontSize: 12, color: T.subtext }}>Rating {p.rating}</div>
            </div>
            <div style={{ fontWeight: 800, fontSize: 16, color: p.weekPts > 0 ? T.green : T.red }}>
              {p.weekPts > 0 ? "+" : ""}{p.weekPts}
            </div>
          </div>
        ))}
        {starters.length === 0 && <p style={{ color: T.subtext, fontSize: 13, margin: 0 }}>No starters set.</p>}
      </Card>

      {/* Top performers league-wide */}
      <Card>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>📈 Top Performers This Week</div>
        {topAllPlayers.map((p, i) => {
          const onMyTeam = league.roster.find(r => r.id === p.id);
          return (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < 4 ? `1px solid ${T.border}` : "none" }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: i === 0 ? T.accent : T.lightGreen, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: i === 0 ? "#fff" : T.green }}>{i+1}</div>
              <Av ini={p.ini} size={34} color={onMyTeam ? T.green : "#8aaa8a"} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name} {onMyTeam ? "✓" : ""}</div>
                <div style={{ fontSize: 12, color: T.subtext }}>Rating {p.rating} {onMyTeam ? "· On your team" : ""}</div>
              </div>
              <div style={{ fontWeight: 800, fontSize: 16, color: T.green }}>+{p.weekPts}</div>
            </div>
          );
        })}
      </Card>

      {/* Start/sit grade */}
      <Card>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>📝 Lineup Grade</div>
        {(() => {
          const grade = totalPts >= 40 ? "A" : totalPts >= 28 ? "B" : totalPts >= 18 ? "C" : "D";
          const color = grade === "A" ? T.green : grade === "B" ? T.accent : grade === "C" ? "#e67e22" : T.red;
          return (
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 28, fontFamily: "'Georgia',serif" }}>{grade}</div>
              <div style={{ fontSize: 13, color: T.subtext, flex: 1 }}>
                {grade === "A" ? "Excellent week! Your lineup fired on all cylinders." :
                 grade === "B" ? "Solid performance. A couple tweaks could push you to elite." :
                 grade === "C" ? "Average week. Consider waiver pickups to strengthen your lineup." :
                 "Rough week. Check your starters — someone may need to be dropped."}
              </div>
            </div>
          );
        })()}
      </Card>
    </div>
  );
}

// ── COMMISSIONER TOOLS PAGE ───────────────────────────────────────────────
function CommissionerPage({ league, onLeagueUpdate, cpuTeams, onCpuTeamsUpdate }) {
  const { settings, leagueName } = league;
  const [localSettings, setLocalSettings] = useState({ ...settings });
  const [announcement, setAnnouncement] = useState("");
  const [announcements, setAnnouncements] = useState([]);
  const [saved, setSaved] = useState(false);

  const saveSettings = () => {
    onLeagueUpdate({ settings: localSettings });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const postAnnouncement = () => {
    if (!announcement.trim()) return;
    setAnnouncements(prev => [{ text: announcement.trim(), time: new Date().toLocaleTimeString() }, ...prev]);
    setAnnouncement("");
  };

  return (
    <div style={{ padding: "20px 16px 100px" }}>
      <h1 style={{ fontFamily: "'Georgia',serif", fontSize: 28, margin: "0 0 4px" }}>⚙️ Commissioner</h1>
      <p style={{ color: T.subtext, margin: "0 0 18px", fontSize: 14 }}>{leagueName} · Admin Tools</p>

      {/* Announcements */}
      <Card>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>📢 League Announcements</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <input value={announcement} onChange={e => setAnnouncement(e.target.value)}
            placeholder="Post an announcement..."
            style={{ flex: 1, padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${T.border}`, fontSize: 14, outline: "none", fontFamily: "inherit" }} />
          <Btn style={{ padding: "10px 14px" }} onClick={postAnnouncement}>Post</Btn>
        </div>
        {announcements.length === 0 && <p style={{ color: T.subtext, fontSize: 13, margin: 0 }}>No announcements yet.</p>}
        {announcements.map((a, i) => (
          <div key={i} style={{ padding: "8px 0", borderBottom: i < announcements.length - 1 ? `1px solid ${T.border}` : "none" }}>
            <div style={{ fontSize: 14 }}>{a.text}</div>
            <div style={{ fontSize: 11, color: T.subtext, marginTop: 2 }}>{a.time}</div>
          </div>
        ))}
      </Card>

      {/* League settings edit */}
      <Card>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>⚙️ League Settings</div>
        <p style={{ color: T.subtext, fontSize: 12, margin: "0 0 14px" }}>Changes take effect from next event</p>
        <SettingRow label="Max Teams" sub="2–30">
          <Stepper value={localSettings.maxTeams ?? 8} onChange={v => setLocalSettings(s => ({ ...s, maxTeams: v }))} min={2} max={30} />
        </SettingRow>
        <SettingRow label="Roster Cap" sub="5–15 players">
          <Stepper value={localSettings.rosterCap ?? 10} onChange={v => setLocalSettings(s => ({ ...s, rosterCap: v }))} min={5} max={15} />
        </SettingRow>
        <SettingRow label="Starters / Week" sub="3–7">
          <Stepper value={localSettings.startersPerWeek ?? 5} onChange={v => setLocalSettings(s => ({ ...s, startersPerWeek: v }))} min={3} max={7} />
        </SettingRow>
        <SettingRow label="Playoff Teams" sub="2–30">
          <Stepper value={localSettings.playoffTeams ?? 4} onChange={v => setLocalSettings(s => ({ ...s, playoffTeams: v }))} min={2} max={30} />
        </SettingRow>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Include JomezPro Events</div>
          </div>
          <Toggle value={localSettings.includeJomez ?? true} onChange={v => setLocalSettings(s => ({ ...s, includeJomez: v }))} />
        </div>
        <Btn style={{ width: "100%", marginTop: 14 }} onClick={saveSettings}>
          {saved ? "✓ Saved!" : "Save Settings"}
        </Btn>
      </Card>

      {/* Veto / manual score */}
      <Card>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>🔧 Manual Score Adjust</div>
        <p style={{ color: T.subtext, fontSize: 13, margin: "0 0 10px" }}>Commissioners can manually add or deduct points from any team.</p>
        <div style={{ padding: "12px", background: T.lightGreen, borderRadius: 10, fontSize: 13, color: T.green, fontWeight: 600 }}>
          Coming soon in a future update
        </div>
      </Card>

      {/* Trade veto */}
      <Card>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>🚫 Trade Veto</div>
        <p style={{ color: T.subtext, fontSize: 13, margin: 0 }}>No pending trades to review.</p>
      </Card>
    </div>
  );
}

// ── LEAGUE CHAT PAGE ──────────────────────────────────────────────────────
function LeagueChatPage({ league, cpuTeams }) {
  const { teamName } = league;
  const [messages, setMessages] = useState([
    { from: "Chain Gang", text: "Good luck everyone this season! 🎯", time: "9:15 AM", isMe: false },
    { from: "Ace Hunters", text: "Gannon Buhr on 3 wins already, absolute beast 🔥", time: "9:22 AM", isMe: false },
    { from: teamName, text: "Don't sleep on Calvin Heimburg, he won OTB Open!", time: "9:30 AM", isMe: true },
    { from: "Birdie Bandits", text: "Anyone willing to trade? DM me", time: "9:45 AM", isMe: false },
  ]);
  const [input, setInput] = useState("");

  const sendMsg = () => {
    if (!input.trim()) return;
    const now = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    setMessages(prev => [...prev, { from: teamName, text: input.trim(), time: now, isMe: true }]);
    setInput("");
    // Simulate a CPU reply sometimes
    if (Math.random() > 0.5 && cpuTeams.length > 0) {
      const replies = ["Nice move! 😤", "Bold strategy 🤔", "See you at the top!", "My roster is stacked 💪", "That waiver pickup was smart"];
      const cpu = cpuTeams[Math.floor(Math.random() * cpuTeams.length)];
      setTimeout(() => {
        const t = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
        setMessages(prev => [...prev, { from: cpu.name, text: replies[Math.floor(Math.random() * replies.length)], time: t, isMe: false }]);
      }, 800);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 140px)" }}>
      <div style={{ padding: "20px 16px 10px" }}>
        <h1 style={{ fontFamily: "'Georgia',serif", fontSize: 28, margin: "0 0 2px" }}>League Chat</h1>
        <p style={{ color: T.subtext, margin: "0 0 10px", fontSize: 14 }}>Trash talk welcome 😤</p>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 10px" }}>
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: 12, display: "flex", flexDirection: "column", alignItems: m.isMe ? "flex-end" : "flex-start" }}>
            {!m.isMe && <div style={{ fontSize: 11, color: T.subtext, marginBottom: 3, marginLeft: 4 }}>{m.from}</div>}
            <div style={{
              maxWidth: "80%", padding: "10px 14px", borderRadius: m.isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
              background: m.isMe ? T.green : "#fff",
              color: m.isMe ? "#fff" : T.text,
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
              fontSize: 14,
            }}>{m.text}</div>
            <div style={{ fontSize: 10, color: T.subtext, marginTop: 3 }}>{m.time}</div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div style={{ padding: "10px 16px 20px", background: T.card, borderTop: `1px solid ${T.border}`, display: "flex", gap: 10 }}>
        <input
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMsg()}
          placeholder="Message your league..."
          style={{ flex: 1, padding: "11px 14px", borderRadius: 20, border: `1.5px solid ${T.border}`, fontSize: 14, outline: "none", fontFamily: "inherit" }}
        />
        <button onClick={sendMsg} style={{ width: 42, height: 42, borderRadius: 21, background: T.green, border: "none", color: "#fff", fontSize: 20, cursor: "pointer" }}>↑</button>
      </div>
    </div>
  );
}

// ── INJURY REPORT PAGE ────────────────────────────────────────────────────
function InjuryReportPage({ league }) {
  const { roster } = league;
  // Simulated status data
  const statusData = [
    { id: 3,  status: "GTD",  note: "Recovering from wrist strain. Likely to play NW Championship." },
    { id: 8,  status: "OUT",  note: "Withdrew from Northwest Championship. Reassess after event." },
    { id: 10, status: "GTD",  note: "Minor back tightness. Expected to compete." },
    { id: 14, status: "OUT",  note: "Not registered for upcoming events." },
  ];

  const onRoster = statusData.filter(s => roster.find(p => p.id === s.id));
  const offRoster = statusData.filter(s => !roster.find(p => p.id === s.id));
  const getPlayer = (id) => ALL_PLAYERS.find(p => p.id === id);
  const statusColor = (s) => s === "OUT" ? T.red : s === "GTD" ? T.accent : T.green;

  return (
    <div style={{ padding: "20px 16px 100px" }}>
      <h1 style={{ fontFamily: "'Georgia',serif", fontSize: 28, margin: "0 0 2px" }}>Injury Report</h1>
      <p style={{ color: T.subtext, margin: "0 0 16px", fontSize: 14 }}>Withdrawals & questionable players for upcoming events</p>

      <div style={{ padding: "12px 14px", background: "linear-gradient(135deg,#fdf8ec,#fef3d0)", borderRadius: 12, marginBottom: 16, border: `1px solid ${T.accent}`, fontSize: 13, color: T.subtext }}>
        📍 Next event: <strong>Northwest Championship</strong> · Portland, OR · Jun 4–7
      </div>

      {onRoster.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.red, letterSpacing: 1, marginBottom: 8 }}>⚠️ ON YOUR ROSTER</div>
          {onRoster.map(s => {
            const p = getPlayer(s.id);
            if (!p) return null;
            return (
              <Card key={s.id} style={{ border: `1.5px solid ${statusColor(s.status)}` }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <Av ini={p.ini} size={40} color={s.status === "OUT" ? T.red : T.accent} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</span>
                      <span style={{ background: statusColor(s.status), color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 8 }}>{s.status}</span>
                    </div>
                    <div style={{ fontSize: 13, color: T.subtext, marginTop: 4 }}>{s.note}</div>
                    {s.status === "OUT" && (
                      <div style={{ marginTop: 6, fontSize: 12, color: T.red, fontWeight: 600 }}>⚡ Consider benching or dropping this player</div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </>
      )}

      <div style={{ fontSize: 11, fontWeight: 700, color: T.subtext, letterSpacing: 1, margin: "14px 0 8px" }}>OTHER PLAYERS</div>
      {offRoster.map(s => {
        const p = getPlayer(s.id);
        if (!p) return null;
        return (
          <Card key={s.id}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <Av ini={p.ini} size={40} color="#8aaa8a" />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</span>
                  <span style={{ background: statusColor(s.status), color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 8 }}>{s.status}</span>
                </div>
                <div style={{ fontSize: 13, color: T.subtext, marginTop: 4 }}>{s.note}</div>
              </div>
            </div>
          </Card>
        );
      })}

      {statusData.length === 0 && (
        <Card><p style={{ color: T.subtext, textAlign: "center", margin: 0 }}>No injury or withdrawal news yet.</p></Card>
      )}
    </div>
  );
}

// ── LEAGUE HISTORY PAGE ───────────────────────────────────────────────────
function LeagueHistoryPage({ league }) {
  const { leagueName, teamName } = league;
  const pastSeasons = [
    { year: 2025, champion: "Ace Hunters", runnerUp: "Chain Gang", totalEvents: 12, topScorer: "Ricky Wysocki" },
    { year: 2024, champion: "McBeast Mode", runnerUp: "Hyzer Heroes", totalEvents: 11, topScorer: "Paul McBeth" },
    { year: 2023, champion: "Disc Destroyers", runnerUp: "Birdie Bandits", totalEvents: 10, topScorer: "Calvin Heimburg" },
  ];

  return (
    <div style={{ padding: "20px 16px 100px" }}>
      <h1 style={{ fontFamily: "'Georgia',serif", fontSize: 28, margin: "0 0 2px" }}>League History</h1>
      <p style={{ color: T.subtext, margin: "0 0 16px", fontSize: 14 }}>{leagueName} · All-time records</p>

      <Card style={{ background: "linear-gradient(135deg,#1a2e1a,#2d5a2d)", marginBottom: 16 }}>
        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>CURRENT SEASON</div>
        <div style={{ color: "#fff", fontWeight: 800, fontSize: 20, fontFamily: "'Georgia',serif" }}>2026 Season — In Progress</div>
        <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, marginTop: 4 }}>{COMPLETED.length} of {COMPLETED.length + UPCOMING.length - 1} events complete · Finals: USDGC Oct 8–11</div>
      </Card>

      <div style={{ fontSize: 11, fontWeight: 700, color: T.subtext, letterSpacing: 1, marginBottom: 10 }}>PAST CHAMPIONS</div>
      {pastSeasons.map((s, i) => (
        <Card key={i}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: T.accent, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 16 }}>{s.year}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 16 }}>👑</span>
                <span style={{ fontWeight: 800, fontSize: 15 }}>{s.champion}</span>
              </div>
              <div style={{ fontSize: 12, color: T.subtext, marginTop: 2 }}>Runner-up: {s.runnerUp} · {s.totalEvents} events</div>
              <div style={{ fontSize: 12, color: T.subtext }}>Top scorer: {s.topScorer}</div>
            </div>
          </div>
        </Card>
      ))}

      <Card>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>🏅 All-Time Records</div>
        {[
          { label: "Most Championships", value: "McBeast Mode (2)", },
          { label: "Most Points, Single Season", value: "Disc Destroyers — 312 pts (2023)" },
          { label: "Best Win %, Single Season", value: "Ace Hunters — 10-2 (2025)" },
          { label: "Longest Win Streak", value: "Chain Gang — 7 consecutive events" },
        ].map((r, i) => (
          <div key={i} style={{ padding: "8px 0", borderBottom: i < 3 ? `1px solid ${T.border}` : "none" }}>
            <div style={{ fontSize: 12, color: T.subtext }}>{r.label}</div>
            <div style={{ fontWeight: 600, fontSize: 14, marginTop: 2 }}>{r.value}</div>
          </div>
        ))}
      </Card>
    </div>
  );
}


// ── ROOT APP ──────────────────────────────────────────────────────────────
export default function App() {
  const { user, setUser, signOut } = useAuth();
  const [screen, setScreen] = useState("landing");
  const [league, setLeague] = useState(null);
  const [waiverPool, setWaiverPool] = useState([]);
  const [leagueCpuTeams, setLeagueCpuTeams] = useState([]);
  const [page, setPage] = useState("home");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [playerProfile, setPlayerProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  // ── Auth handlers ──────────────────────────────────────────────────────
  const handleSignUp = async (email, password, username) => {
    setAuthLoading(true); setAuthError("");
    try {
      await auth.signUp(email, password, username);
      setAuthError("✓ Check your email to confirm your account, then sign in.");
    } catch(e) { setAuthError(e.message); }
    finally { setAuthLoading(false); }
  };

  const handleSignIn = async (email, password) => {
    setAuthLoading(true); setAuthError("");
    try {
      await auth.signIn(email, password);
      setUser(getCurrentUser());
    } catch(e) { setAuthError(e.message); }
    finally { setAuthLoading(false); }
  };

  const handleSignOut = async () => {
    await signOut();
    setScreen("landing");
    setLeague(null);
  };

  // ── League handlers ────────────────────────────────────────────────────
  const handleLeagueCreated = async (info) => {
    setLeague({ ...info, roster: [] });
    // Save to Supabase if user is logged in
    if (user) {
      try {
        const inviteCode = Math.random().toString(36).slice(2,8).toUpperCase();
        const lg = await leaguesApi.create(
          info.leagueName, user.id, info.settings, info.draftSettings ?? {}
        );
        const member = await membersApi.join(lg.id, user.id, info.teamName);
        setLeague(prev => ({ ...prev, supabaseId: lg.id, memberId: member.id, inviteCode: lg.invite_code }));
      } catch(e) { console.warn("Supabase save failed, continuing offline:", e.message); }
    }
    if (info.draftSettings?.draftType === "salary") {
      setScreen("salaryDraft");
    } else {
      setScreen("draft");
    }
  };

  const handleJoinLeague = async (inviteCode, teamName) => {
    if (!user) return;
    try {
      const lg = await leaguesApi.getByInviteCode(inviteCode);
      const member = await membersApi.join(lg.id, user.id, teamName);
      setLeague({
        leagueName: lg.name,
        teamName,
        yourName: user.email,
        settings: lg.settings,
        draftSettings: lg.draft_settings,
        roster: [],
        supabaseId: lg.id,
        memberId: member.id,
        inviteCode: lg.invite_code,
      });
      setScreen("app");
      setPage("home");
    } catch(e) { throw new Error("League not found. Check your invite code."); }
  };

  const handleDraftComplete = async (myRoster, remainingPool) => {
    const startersPerWeek = league?.settings?.startersPerWeek ?? 5;
    const rosterWithStarters = myRoster.map((p, i) => ({ ...p, starter: i < startersPerWeek }));
    setLeague(prev => ({ ...prev, roster: rosterWithStarters }));
    setWaiverPool(remainingPool);
    // Save roster to Supabase
    if (league?.supabaseId && league?.memberId) {
      try {
        for (const p of rosterWithStarters) {
          await rostersApi.addPlayer(league.memberId, league.supabaseId, p.id, p.name, "draft");
        }
      } catch(e) { console.warn("Roster save failed:", e.message); }
    }
    setScreen("app");
    setPage("home");
  };

  const handleSetCpuTeams = (teams) => setLeagueCpuTeams(teams);
  const handleRosterChange = (newRoster) => setLeague(prev => ({ ...prev, roster: newRoster }));
  const handleLeagueUpdate = (updates) => setLeague(prev => ({ ...prev, ...updates }));

  const handleClaim = (player, dropId) => {
    setWaiverPool(prev => prev.filter(p => p.id !== player.id));
    setLeague(prev => {
      let newRoster = dropId ? prev.roster.filter(p => p.id !== dropId) : [...prev.roster];
      if (dropId) {
        const dropped = prev.roster.find(p => p.id === dropId);
        if (dropped) {
          const { starter, ...rest } = dropped;
          setWaiverPool(pool => [rest, ...pool]);
        }
      }
      newRoster = [...newRoster, { ...player, starter: false }];
      return { ...prev, roster: newRoster };
    });
  };

  // ── Show auth screen if not logged in ─────────────────────────────────
  if (!user) return (
    <AuthScreen
      onAuthed={setUser}
      loading={authLoading}
      error={authError}
      onSignIn={handleSignIn}
      onSignUp={handleSignUp}
    />
  );

  if (screen === "landing") return (
    <LandingPage
      onLeagueCreated={handleLeagueCreated}
      onJoinLeague={handleJoinLeague}
      user={user}
      onSignOut={handleSignOut}
    />
  );
  if (screen === "draft") return <DraftRoom league={league} onDraftComplete={handleDraftComplete} onCpuTeamsReady={handleSetCpuTeams} />;
  if (screen === "salaryDraft") return <SalaryDraftRoom league={league} onDraftComplete={handleDraftComplete} onCpuTeamsReady={handleSetCpuTeams} />;

  const sharedProps = { league, cpuTeams: leagueCpuTeams, setPage, onPlayerClick: setPlayerProfile };

  const pages = {
    home:      <HomePage {...sharedProps} />,
    team:      <TeamPage league={league} onRosterChange={handleRosterChange} onPlayerClick={setPlayerProfile} />,
    waivers:   <WaiversPage league={league} waiverPool={waiverPool} onClaim={handleClaim} onPlayerClick={setPlayerProfile} />,
    standings: <StandingsPage league={league} cpuTeams={leagueCpuTeams} />,
    trades:    <TradesPage league={league} />,
    matchup:   <MatchupPage league={league} cpuTeams={leagueCpuTeams} />,
    bracket:   <BracketPage league={league} cpuTeams={leagueCpuTeams} />,
    power:     <PowerRankingsPage league={league} cpuTeams={leagueCpuTeams} />,
    recap:     <WeeklyRecapPage league={league} />,
    chat:      <LeagueChatPage league={league} cpuTeams={leagueCpuTeams} />,
    injuries:  <InjuryReportPage league={league} />,
    history:   <LeagueHistoryPage league={league} />,
    commish:   <CommissionerPage league={league} onLeagueUpdate={handleLeagueUpdate} cpuTeams={leagueCpuTeams} onCpuTeamsUpdate={setLeagueCpuTeams} />,
  };

  return (
    <div style={{ fontFamily: "'Helvetica Neue',sans-serif", background: T.bg, minHeight: "100vh", maxWidth: 480, margin: "0 auto", position: "relative" }}>
      <NavBar leagueName={league.leagueName} onHome={() => setPage("home")} onMenu={() => setDrawerOpen(true)} />
      <SideDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} setPage={setPage} />
      {playerProfile && (
        <PlayerProfile
          player={playerProfile}
          onClose={() => setPlayerProfile(null)}
          myRoster={league.roster}
          onClaim={(p) => handleClaim(p, null)}
          inWaivers={!!waiverPool.find(wp => wp.id === playerProfile.id)}
        />
      )}
      {pages[page] || pages.home}
      <BottomNav page={page} setPage={setPage} />
    </div>
  );
}
