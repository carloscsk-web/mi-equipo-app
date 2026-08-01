import { useState, useEffect, useRef } from "react";
import {
  Home, Calendar as CalendarIcon, Wallet, Users, User, Plus, X, Check,
  Camera, LogOut, ChevronRight, ChevronLeft, Shield, MapPin, Clock,
  Trash2, Pencil, ShieldCheck, CircleDot
} from "lucide-react";

const BASE_TOKENS = {
  chalk: "#F7F8FA",
  amber: "#D98E2B",
  redCard: "#C94B4B",
  ink: "#16202A",
  inkSoft: "#57626C",
  line: "#DDE2E6",
};

const THEMES = [
  { id: "blue", name: "Azul y blanco", pitchDark: "#0B2C4D", pitch: "#1D5FA8", grass: "#5B9BDB" },
  { id: "green", name: "Verde clásico", pitchDark: "#0B3D2E", pitch: "#1B5E3F", grass: "#4CAF7D" },
  { id: "red", name: "Rojo", pitchDark: "#4A0E0E", pitch: "#B22222", grass: "#E38C8C" },
  { id: "navy-gold", name: "Marino y oro", pitchDark: "#0D1B2A", pitch: "#8A6D1F", grass: "#E9C46A" },
  { id: "orange", name: "Naranja", pitchDark: "#7A2E00", pitch: "#E1690C", grass: "#F4A261" },
  { id: "purple", name: "Morado", pitchDark: "#2E1065", pitch: "#6A3FBF", grass: "#B39DDB" },
  { id: "maroon", name: "Granate", pitchDark: "#4A0D1F", pitch: "#7B1E3D", grass: "#D98BA0" },
  { id: "sky", name: "Celeste", pitchDark: "#0B3550", pitch: "#2E86C1", grass: "#8FCBF2" },
  { id: "black-yellow", name: "Negro y amarillo", pitchDark: "#141414", pitch: "#3A3A3A", grass: "#E9C400" },
];

function themeById(id) {
  return THEMES.find((t) => t.id === id) || THEMES[0];
}

let TOKENS = { ...BASE_TOKENS, ...THEMES[0] };

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function fmtDate(iso) {
  try {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" });
  } catch (e) {
    return iso;
  }
}

function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function eventTypeLabel(type) {
  if (type === "training") return "Entrenamiento";
  if (type === "league") return "Liga";
  if (type === "friendly") return "Amistoso";
  return "Evento";
}

function isMatchType(type) {
  return type === "friendly" || type === "league";
}

function buildMonthGrid(year, month) {
  const first = new Date(year, month, 1);
  const startWeekday = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function resizeImage(file, maxSize = 160) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width, h = img.height;
        if (w > h) {
          if (w > maxSize) { h = Math.round((h * maxSize) / w); w = maxSize; }
        } else {
          if (h > maxSize) { w = Math.round((w * maxSize) / h); h = maxSize; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.62));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function Avatar({ name, dorsal, photo, size = 44 }) {
  if (photo) {
    return (
      <img
        src={photo}
        alt={name || "Jugador"}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", border: `2px solid ${TOKENS.pitch}` }}
      />
    );
  }
  return (
    <div
      style={{
        width: size, height: size, borderRadius: "50%", background: TOKENS.pitch,
        color: TOKENS.chalk, display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: size * 0.42,
      }}
    >
      {dorsal !== undefined && dorsal !== null && dorsal !== "" ? dorsal : (name ? name[0].toUpperCase() : "?")}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 13, color: TOKENS.inkSoft, marginBottom: 5, fontWeight: 600 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${TOKENS.line}`,
  fontSize: 15, color: TOKENS.ink, background: "#fff", boxSizing: "border-box", fontFamily: "'Inter', sans-serif",
};

function Btn({ children, onClick, variant = "primary", style = {}, type = "button", disabled }) {
  const base = {
    padding: "11px 18px", borderRadius: 12, border: "none", fontWeight: 700, fontSize: 15,
    cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.5 : 1,
    fontFamily: "'Inter', sans-serif", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
  };
  const variants = {
    primary: { background: TOKENS.pitch, color: "#fff" },
    ghost: { background: "transparent", color: TOKENS.pitch, border: `1.5px solid ${TOKENS.pitch}` },
    danger: { background: TOKENS.redCard, color: "#fff" },
    subtle: { background: TOKENS.chalk, color: TOKENS.ink, border: `1.5px solid ${TOKENS.line}` },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant], ...style }}>
      {children}
    </button>
  );
}

function TopBar({ title, subtitle, onBack, onLogout, crest }) {
  return (
    <div style={{
      background: TOKENS.pitchDark, color: TOKENS.chalk, padding: "16px 18px",
      display: "flex", alignItems: "center", gap: 10, position: "sticky", top: 0, zIndex: 5,
    }}>
      {onBack && (
        <button onClick={onBack} aria-label="Volver" style={{ background: "none", border: "none", color: TOKENS.chalk, cursor: "pointer", padding: 4 }}>
          <ChevronLeft size={22} />
        </button>
      )}
      {crest && (
        <img src={crest} alt="Escudo del club" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", border: `1.5px solid ${TOKENS.grass}` }} />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 20, letterSpacing: 0.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {title}
        </div>
        {subtitle && <div style={{ fontSize: 12, color: TOKENS.grass, marginTop: 1 }}>{subtitle}</div>}
      </div>
      {onLogout && (
        <button onClick={onLogout} aria-label="Cerrar sesión" style={{ background: "none", border: "none", color: TOKENS.chalk, cursor: "pointer", padding: 4, opacity: 0.85 }}>
          <LogOut size={20} />
        </button>
      )}
    </div>
  );
}

function BottomNav({ tab, setTab, role }) {
  const coachTabs = [
    { id: "home", label: "Inicio", icon: Home },
    { id: "calendar", label: "Calendario", icon: CalendarIcon },
    { id: "fines", label: "Multas", icon: Wallet },
    { id: "team", label: "Equipo", icon: Users },
  ];
  const playerTabs = [
    { id: "home", label: "Inicio", icon: Home },
    { id: "calendar", label: "Calendario", icon: CalendarIcon },
    { id: "fines", label: "Multas", icon: Wallet },
    { id: "profile", label: "Perfil", icon: User },
  ];
  const tabs = role === "coach" ? coachTabs : playerTabs;
  return (
    <div style={{
      position: "sticky", bottom: 0, background: "#fff", borderTop: `1px solid ${TOKENS.line}`,
      display: "flex", zIndex: 5,
    }}>
      {tabs.map((t) => {
        const Icon = t.icon;
        const active = tab === t.id;
        return (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, background: "none", border: "none", padding: "10px 4px 8px",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer",
            color: active ? TOKENS.pitch : "#9AA39B",
          }}>
            <Icon size={21} strokeWidth={active ? 2.4 : 2} />
            <span style={{ fontSize: 11, fontWeight: active ? 700 : 500, fontFamily: "'Inter', sans-serif" }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function Card({ children, style = {}, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: "#fff", borderRadius: 14, border: `1px solid ${TOKENS.line}`,
      padding: "14px 16px", marginBottom: 12, cursor: onClick ? "pointer" : "default", ...style,
    }}>
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{
      fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 15, letterSpacing: 0.4,
      color: TOKENS.inkSoft, textTransform: "uppercase", margin: "18px 0 8px",
    }}>
      {children}
    </div>
  );
}

function EmptyState({ text }) {
  return <div style={{ textAlign: "center", color: TOKENS.inkSoft, fontSize: 14, padding: "26px 10px" }}>{text}</div>;
}

export default function TeamApp() {
  const [ready, setReady] = useState(false);
  const [identity, setIdentity] = useState(null);
  const [roster, setRoster] = useState(null);
  const [events, setEvents] = useState([]);
  const [fines, setFines] = useState([]);
  const [screen, setScreen] = useState("loading");
  const [tab, setTab] = useState("home");
  const [modal, setModal] = useState(null);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    let idn = null, ros = null, evs = [], fns = [];
    try { const r = await window.storage.get("my-identity", false); if (r && r.value) idn = JSON.parse(r.value); } catch (e) {}
    try { const r = await window.storage.get("roster", true); if (r && r.value) ros = JSON.parse(r.value); } catch (e) {}
    try { const r = await window.storage.get("events", true); if (r && r.value) evs = JSON.parse(r.value).events || []; } catch (e) {}
    try { const r = await window.storage.get("fines", true); if (r && r.value) fns = JSON.parse(r.value).fines || []; } catch (e) {}
    setIdentity(idn); setRoster(ros); setEvents(evs); setFines(fns);
    setReady(true);
    if (idn && ros) setScreen("app"); else setScreen("welcome");
  }

  async function saveRoster(next) {
    setRoster(next);
    try { await window.storage.set("roster", JSON.stringify(next), true); } catch (e) {}
  }
  async function saveEvents(next) {
    setEvents(next);
    try { await window.storage.set("events", JSON.stringify({ events: next }), true); } catch (e) {}
  }
  async function saveFines(next) {
    setFines(next);
    try { await window.storage.set("fines", JSON.stringify({ fines: next }), true); } catch (e) {}
  }
  async function saveIdentity(next) {
    setIdentity(next);
    try { await window.storage.set("my-identity", JSON.stringify(next), false); } catch (e) {}
  }
  async function logout() {
    setIdentity(null);
    try { await window.storage.delete("my-identity", false); } catch (e) {}
    setScreen("welcome"); setTab("home");
  }

  TOKENS = { ...BASE_TOKENS, ...themeById(roster?.themeId) };

  if (!ready || screen === "loading") {
    return (
      <Wrapper><div style={{ padding: 40, textAlign: "center", color: TOKENS.inkSoft }}>Cargando…</div></Wrapper>
    );
  }

  if (screen === "welcome") {
    return (
      <Wrapper>
        <div style={{ padding: "60px 24px 24px", textAlign: "center" }}>
          <Shield size={46} color={TOKENS.pitch} style={{ marginBottom: 10 }} />
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 30, color: TOKENS.ink }}>Mi Equipo</div>
          <div style={{ color: TOKENS.inkSoft, fontSize: 14, marginTop: 4, marginBottom: 34 }}>
            Calendario, asistencia, multas y resultados del equipo.
          </div>
          <Btn style={{ width: "100%", marginBottom: 12 }} onClick={() => setScreen("coach-entry")}>
            <ShieldCheck size={18} /> Soy el entrenador
          </Btn>
          <Btn variant="ghost" style={{ width: "100%" }} onClick={() => setScreen("player-entry")}>
            <User size={18} /> Soy jugador
          </Btn>
          <div style={{ fontSize: 11, color: "#9AA3AC", marginTop: 26 }}>Carlos Cabezas</div>
        </div>
      </Wrapper>
    );
  }

  if (screen === "coach-entry") {
    if (!roster) {
      return <CoachSetup onBack={() => setScreen("welcome")} onCreate={async (teamName, pin) => {
        const next = { teamName, coachPin: pin, players: [], themeId: "blue", clubPhoto: null };
        await saveRoster(next);
        await saveIdentity({ role: "coach", name: "Entrenador" });
        setScreen("app");
      }} />;
    }
    return <CoachLogin teamName={roster.teamName} onBack={() => setScreen("welcome")} onSubmit={async (pin) => {
      if (pin === roster.coachPin) { await saveIdentity({ role: "coach", name: "Entrenador" }); setScreen("app"); return true; }
      return false;
    }} />;
  }

  if (screen === "player-entry") {
    if (!roster) {
      return (
        <Wrapper>
          <TopBar title="Jugador" onBack={() => setScreen("welcome")} />
          <div style={{ padding: 24 }}>
            <EmptyState text="Aún no se ha creado el equipo. Pídele al entrenador que configure la app primero." />
          </div>
        </Wrapper>
      );
    }
    return (
      <PlayerEntry
        roster={roster}
        onBack={() => setScreen("welcome")}
        onJoin={async (p) => {
          const next = { ...roster, players: [...roster.players, p] };
          await saveRoster(next);
          await saveIdentity({ role: "player", playerId: p.id, name: p.name });
          setScreen("app");
        }}
        onLogin={async (player, pin) => {
          if (player.pin === pin) { await saveIdentity({ role: "player", playerId: player.id, name: player.name }); setScreen("app"); return true; }
          return false;
        }}
      />
    );
  }

  if (screen === "app" && identity && roster) {
    return (
      <AppShell
        identity={identity} roster={roster} events={events} fines={fines}
        tab={tab} setTab={setTab} modal={modal} setModal={setModal}
        saveRoster={saveRoster} saveEvents={saveEvents} saveFines={saveFines} saveIdentity={saveIdentity}
        onLogout={logout}
      />
    );
  }

  return (
    <Wrapper><EmptyState text="Algo no ha ido bien. Recarga la página." /></Wrapper>
  );
}

function Wrapper({ children }) {
  return (
    <div style={{
      maxWidth: 420, margin: "0 auto", minHeight: 500, background: TOKENS.chalk,
      fontFamily: "'Inter', sans-serif", display: "flex", flexDirection: "column", borderRadius: 16, overflow: "hidden",
      border: `1px solid ${TOKENS.line}`, position: "relative",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Barlow+Condensed:wght@600;700&display=swap');
      `}</style>
      {children}
    </div>
  );
}

function CoachSetup({ onBack, onCreate }) {
  const [teamName, setTeamName] = useState("");
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [err, setErr] = useState("");
  return (
    <Wrapper>
      <TopBar title="Crear equipo" onBack={onBack} />
      <div style={{ padding: 22 }}>
        <Field label="Nombre del equipo">
          <input style={inputStyle} value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Ej: CD Los Álamos Alevín A" />
        </Field>
        <Field label="Crea un PIN de entrenador (para acceder tú, y otros entrenadores/delegados si lo compartes)">
          <input style={inputStyle} value={pin} onChange={(e) => setPin(e.target.value)} placeholder="Ej: 2468" inputMode="numeric" />
        </Field>
        <Field label="Repite el PIN">
          <input style={inputStyle} value={pin2} onChange={(e) => setPin2(e.target.value)} inputMode="numeric" />
        </Field>
        {err && <div style={{ color: TOKENS.redCard, fontSize: 13, marginBottom: 10 }}>{err}</div>}
        <Btn style={{ width: "100%" }} onClick={() => {
          if (!teamName.trim()) return setErr("Ponle un nombre al equipo.");
          if (!pin.trim() || pin.length < 4) return setErr("El PIN debe tener al menos 4 dígitos.");
          if (pin !== pin2) return setErr("Los PIN no coinciden.");
          onCreate(teamName.trim(), pin.trim());
        }}>Crear equipo</Btn>
      </div>
    </Wrapper>
  );
}

function CoachLogin({ teamName, onBack, onSubmit }) {
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  return (
    <Wrapper>
      <TopBar title={teamName} subtitle="Acceso entrenador" onBack={onBack} />
      <div style={{ padding: 22 }}>
        <Field label="PIN de entrenador">
          <input style={inputStyle} value={pin} onChange={(e) => setPin(e.target.value)} inputMode="numeric" autoFocus />
        </Field>
        {err && <div style={{ color: TOKENS.redCard, fontSize: 13, marginBottom: 10 }}>{err}</div>}
        <Btn style={{ width: "100%" }} onClick={async () => {
          const ok = await onSubmit(pin.trim());
          if (!ok) setErr("PIN incorrecto.");
        }}>Entrar</Btn>
      </div>
    </Wrapper>
  );
}

function PlayerEntry({ roster, onBack, onJoin, onLogin }) {
  const [mode, setMode] = useState("choice");
  const [name, setName] = useState("");
  const [dorsal, setDorsal] = useState("");
  const [pin, setPin] = useState("");
  const [photo, setPhoto] = useState(null);
  const [selected, setSelected] = useState(null);
  const [loginPin, setLoginPin] = useState("");
  const [err, setErr] = useState("");
  const fileRef = useRef(null);

  if (mode === "choice") {
    return (
      <Wrapper>
        <TopBar title={roster.teamName} subtitle="Acceso jugador" onBack={onBack} />
        <div style={{ padding: 22 }}>
          <Btn style={{ width: "100%", marginBottom: 12 }} onClick={() => setMode("join")}>Unirme por primera vez</Btn>
          <Btn variant="ghost" style={{ width: "100%" }} onClick={() => setMode("login")}>Ya tengo perfil</Btn>
        </div>
      </Wrapper>
    );
  }

  if (mode === "join") {
    return (
      <Wrapper>
        <TopBar title="Crea tu perfil" onBack={() => setMode("choice")} />
        <div style={{ padding: 22 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <div onClick={() => fileRef.current.click()} style={{ position: "relative", cursor: "pointer" }}>
              <Avatar name={name} dorsal={dorsal} photo={photo} size={84} />
              <div style={{ position: "absolute", bottom: 0, right: 0, background: TOKENS.pitch, borderRadius: "50%", padding: 5 }}>
                <Camera size={14} color="#fff" />
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={async (e) => {
              const f = e.target.files[0]; if (!f) return;
              try { const d = await resizeImage(f); setPhoto(d); } catch (er) {}
            }} />
          </div>
          <Field label="Nombre y apellido"><input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Marcos Ruiz" /></Field>
          <Field label="Dorsal"><input style={inputStyle} value={dorsal} onChange={(e) => setDorsal(e.target.value.replace(/[^0-9]/g, ""))} placeholder="Ej: 7" inputMode="numeric" /></Field>
          <Field label="Crea un PIN personal (para volver a entrar)"><input style={inputStyle} value={pin} onChange={(e) => setPin(e.target.value)} inputMode="numeric" placeholder="Ej: 1234" /></Field>
          {err && <div style={{ color: TOKENS.redCard, fontSize: 13, marginBottom: 10 }}>{err}</div>}
          <Btn style={{ width: "100%" }} onClick={() => {
            if (!name.trim()) return setErr("Escribe tu nombre.");
            if (!pin.trim() || pin.length < 4) return setErr("El PIN debe tener al menos 4 dígitos.");
            onJoin({ id: uid(), name: name.trim(), dorsal: dorsal.trim(), photo, pin: pin.trim() });
          }}>Unirme al equipo</Btn>
        </div>
      </Wrapper>
    );
  }

  if (mode === "login") {
    if (!selected) {
      return (
        <Wrapper>
          <TopBar title="Selecciona tu nombre" onBack={() => setMode("choice")} />
          <div style={{ padding: "10px 16px" }}>
            {roster.players.length === 0 && <EmptyState text="Todavía no hay jugadores registrados." />}
            {roster.players.map((p) => (
              <Card key={p.id} onClick={() => setSelected(p)} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Avatar name={p.name} dorsal={p.dorsal} photo={p.photo} />
                <div style={{ flex: 1, fontWeight: 600 }}>{p.name}</div>
                <ChevronRight size={18} color={TOKENS.inkSoft} />
              </Card>
            ))}
          </div>
        </Wrapper>
      );
    }
    return (
      <Wrapper>
        <TopBar title={selected.name} subtitle="Introduce tu PIN" onBack={() => setSelected(null)} />
        <div style={{ padding: 22 }}>
          <Field label="PIN personal"><input style={inputStyle} value={loginPin} onChange={(e) => setLoginPin(e.target.value)} inputMode="numeric" autoFocus /></Field>
          {err && <div style={{ color: TOKENS.redCard, fontSize: 13, marginBottom: 10 }}>{err}</div>}
          <Btn style={{ width: "100%" }} onClick={async () => {
            const ok = await onLogin(selected, loginPin.trim());
            if (!ok) setErr("PIN incorrecto.");
          }}>Entrar</Btn>
        </div>
      </Wrapper>
    );
  }
  return null;
}

function AppShell(props) {
  const { identity, roster, events, fines, tab, setTab, modal, setModal, saveRoster, saveEvents, saveFines, saveIdentity, onLogout } = props;
  const isCoach = identity.role === "coach";
  const me = !isCoach ? roster.players.find((p) => p.id === identity.playerId) : null;

  return (
    <Wrapper>
      <TopBar title={roster.teamName} subtitle={isCoach ? "Entrenador" : me ? me.name : ""} onLogout={onLogout} crest={roster.clubPhoto} />
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px 6px" }}>
        {tab === "home" && <HomeTab isCoach={isCoach} me={me} roster={roster} events={events} fines={fines} setTab={setTab} />}
        {tab === "calendar" && <CalendarTab isCoach={isCoach} me={me} roster={roster} events={events} saveEvents={saveEvents} modal={modal} setModal={setModal} />}
        {tab === "fines" && <FinesTab isCoach={isCoach} me={me} roster={roster} fines={fines} saveFines={saveFines} modal={modal} setModal={setModal} />}
        {tab === "team" && isCoach && <TeamTab roster={roster} saveRoster={saveRoster} />}
        {tab === "profile" && !isCoach && <ProfileTab me={me} roster={roster} saveRoster={saveRoster} saveIdentity={saveIdentity} identity={identity} />}
      </div>
      <BottomNav tab={tab} setTab={setTab} role={identity.role} />
      <div style={{ textAlign: "center", fontSize: 10, color: "#B8BFC5", padding: "4px 0 8px", background: "#fff" }}>Carlos Cabezas</div>
    </Wrapper>
  );
}

function nextEvent(events) {
  const t = todayISO();
  const upcoming = events.filter((e) => e.date >= t).sort((a, b) => (a.date + (a.time || "")).localeCompare(b.date + (b.time || "")));
  return upcoming[0] || null;
}

function HomeTab({ isCoach, me, roster, events, fines, setTab }) {
  const upNext = nextEvent(events);
  const myFinesTotal = me ? fines.filter((f) => f.playerId === me.id).reduce((s, f) => s + Number(f.amount || 0), 0) : 0;
  const totalFinesUnpaid = fines.filter((f) => !f.paid).reduce((s, f) => s + Number(f.amount || 0), 0);

  return (
    <div>
      <SectionTitle>Próximo evento</SectionTitle>
      {upNext ? (
        <Card onClick={() => setTab("calendar")}>
          <EventRow ev={upNext} />
        </Card>
      ) : (
        <Card><EmptyState text="No hay entrenamientos ni partidos programados." /></Card>
      )}

      {isCoach ? (
        <>
          <SectionTitle>Resumen</SectionTitle>
          <div style={{ display: "flex", gap: 10 }}>
            <StatCard label="Jugadores" value={roster.players.length} />
            <StatCard label="Multas sin pagar" value={`${totalFinesUnpaid.toFixed(0)} €`} />
          </div>
        </>
      ) : (
        <>
          <SectionTitle>Tus multas</SectionTitle>
          <Card onClick={() => setTab("fines")}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: TOKENS.inkSoft, fontSize: 14 }}>Total acumulado</span>
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 22, color: TOKENS.amber }}>{myFinesTotal.toFixed(2)} €</span>
            </div>
          </Card>
          {upNext && me && (
            <RsvpQuickPick ev={upNext} playerId={me.id} />
          )}
        </>
      )}
    </div>
  );
}

function RsvpQuickPick({ ev }) {
  return (
    <div style={{ color: TOKENS.inkSoft, fontSize: 13, marginTop: 4 }}>
      Ve al calendario para confirmar tu asistencia.
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div style={{ flex: 1, background: "#fff", border: `1px solid ${TOKENS.line}`, borderRadius: 14, padding: "14px 12px" }}>
      <div style={{ fontSize: 12, color: TOKENS.inkSoft, marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 24, color: TOKENS.ink }}>{value}</div>
    </div>
  );
}

function EventRow({ ev }) {
  const isMatch = isMatchType(ev.type);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{
        width: 46, height: 46, borderRadius: 10, background: isMatch ? "#FBEAF0" : "#E1F5EE",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        {isMatch ? <Shield size={20} color="#993556" /> : <CircleDot size={20} color="#0F6E56" />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: TOKENS.ink }}>
          {isMatch ? `${eventTypeLabel(ev.type)} vs ${ev.opponent || "?"}` : "Entrenamiento"}
        </div>
        <div style={{ fontSize: 12.5, color: TOKENS.inkSoft, display: "flex", gap: 8, marginTop: 2, flexWrap: "wrap" }}>
          <span>{fmtDate(ev.date)}</span>
          {ev.time && <span><Clock size={11} style={{ verticalAlign: -1 }} /> {ev.time}</span>}
          {ev.location && <span><MapPin size={11} style={{ verticalAlign: -1 }} /> {ev.location}</span>}
        </div>
        {isMatch && ev.golesFavor !== undefined && ev.golesFavor !== "" && (
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 16, marginTop: 4, color: TOKENS.pitch }}>
            {ev.golesFavor} - {ev.golesContra}
          </div>
        )}
      </div>
      <ChevronRight size={18} color={TOKENS.inkSoft} />
    </div>
  );
}

function CalendarGrid({ year, month, onPrev, onNext, events, onDayClick }) {
  const cells = buildMonthGrid(year, month);
  const todayStr = todayISO();
  const monthLabel = new Date(year, month, 1).toLocaleDateString("es-ES", { month: "long", year: "numeric" });
  const eventDates = new Set(events.map((e) => e.date));
  return (
    <div style={{ background: "#fff", border: `1px solid ${TOKENS.line}`, borderRadius: 14, padding: "12px 10px", marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <button onClick={onPrev} aria-label="Mes anterior" style={{ background: "none", border: "none", cursor: "pointer", color: TOKENS.inkSoft, padding: 4 }}><ChevronLeft size={20} /></button>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 16, textTransform: "capitalize" }}>{monthLabel}</div>
        <button onClick={onNext} aria-label="Mes siguiente" style={{ background: "none", border: "none", cursor: "pointer", color: TOKENS.inkSoft, padding: 4 }}><ChevronRight size={20} /></button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
        {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
          <div key={d} style={{ textAlign: "center", fontSize: 11, color: TOKENS.inkSoft, fontWeight: 600 }}>{d}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {cells.map((iso, i) => {
          if (!iso) return <div key={i} />;
          const has = eventDates.has(iso);
          const isToday = iso === todayStr;
          const dayNum = Number(iso.slice(8, 10));
          return (
            <button key={iso} onClick={() => onDayClick(iso)} style={{
              aspectRatio: "1", border: "none", borderRadius: 8, cursor: "pointer",
              background: isToday ? TOKENS.pitch : has ? TOKENS.chalk : "transparent",
              color: isToday ? "#fff" : TOKENS.ink,
              fontSize: 13, fontWeight: has || isToday ? 700 : 500, position: "relative",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {dayNum}
              {has && !isToday && <span style={{ position: "absolute", bottom: 3, width: 4, height: 4, borderRadius: "50%", background: TOKENS.pitch }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CalendarTab({ isCoach, me, roster, events, saveEvents, modal, setModal }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const t = todayISO();
  const upcoming = events.filter((e) => e.date >= t).sort((a, b) => (a.date + (a.time || "")).localeCompare(b.date + (b.time || "")));
  const past = events.filter((e) => e.date < t).sort((a, b) => (b.date + (b.time || "")).localeCompare(a.date + (a.time || "")));

  function prevMonth() { if (month === 0) { setMonth(11); setYear((y) => y - 1); } else setMonth((m) => m - 1); }
  function nextMonth() { if (month === 11) { setMonth(0); setYear((y) => y + 1); } else setMonth((m) => m + 1); }

  return (
    <div>
      <CalendarGrid year={year} month={month} onPrev={prevMonth} onNext={nextMonth} events={events}
        onDayClick={(iso) => setModal({ type: "day-detail", date: iso })} />

      <SectionTitle>Próximos</SectionTitle>
      {upcoming.length === 0 && <EmptyState text="No hay próximos eventos." />}
      {upcoming.map((ev) => (
        <Card key={ev.id} onClick={() => setModal({ type: "event-detail", id: ev.id })}><EventRow ev={ev} /></Card>
      ))}
      <SectionTitle>Pasados</SectionTitle>
      {past.length === 0 && <EmptyState text="Sin eventos anteriores." />}
      {past.map((ev) => (
        <Card key={ev.id} onClick={() => setModal({ type: "event-detail", id: ev.id })} style={{ opacity: 0.8 }}><EventRow ev={ev} /></Card>
      ))}

      {modal?.type === "day-detail" && (
        <DayDetailModal
          date={modal.date} isCoach={isCoach}
          dayEvents={events.filter((e) => e.date === modal.date)}
          onClose={() => setModal(null)}
          onPickType={(type) => setModal({ type: "new-event", date: modal.date, eventType: type })}
          onOpenEvent={(id) => setModal({ type: "event-detail", id })}
        />
      )}

      {modal?.type === "new-event" && (
        <EventFormModal roster={roster} presetDate={modal.date} presetType={modal.eventType} onClose={() => setModal(null)} onSave={async (ev) => {
          const attendance = {};
          roster.players.forEach((p) => { attendance[p.id] = { status: "pending", reason: "" }; });
          await saveEvents([...events, { ...ev, id: uid(), attendance }]);
          setModal(null);
        }} />
      )}

      {modal?.type === "event-detail" && (
        <EventDetailModal
          ev={events.find((e) => e.id === modal.id)}
          isCoach={isCoach} me={me} roster={roster}
          onClose={() => setModal(null)}
          onDelete={async (id) => { await saveEvents(events.filter((e) => e.id !== id)); setModal(null); }}
          onUpdate={async (updated) => { await saveEvents(events.map((e) => (e.id === updated.id ? updated : e))); setModal({ type: "event-detail", id: updated.id }); }}
        />
      )}
    </div>
  );
}

function DayDetailModal({ date, isCoach, dayEvents, onClose, onPickType, onOpenEvent }) {
  return (
    <ModalOverlay onClose={onClose} title={fmtDate(date)}>
      {dayEvents.length === 0 && <EmptyState text="No hay nada programado este día." />}
      {dayEvents.map((ev) => (
        <Card key={ev.id} onClick={() => onOpenEvent(ev.id)}><EventRow ev={ev} /></Card>
      ))}
      {isCoach && (
        <>
          <SectionTitle>Añadir a este día</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Btn variant="subtle" style={{ width: "100%", justifyContent: "flex-start" }} onClick={() => onPickType("training")}>
              <CircleDot size={17} /> Entrenamiento
            </Btn>
            <Btn variant="subtle" style={{ width: "100%", justifyContent: "flex-start" }} onClick={() => onPickType("friendly")}>
              <Shield size={17} /> Partido amistoso
            </Btn>
            <Btn variant="subtle" style={{ width: "100%", justifyContent: "flex-start" }} onClick={() => onPickType("league")}>
              <Shield size={17} /> Partido de liga
            </Btn>
          </div>
        </>
      )}
    </ModalOverlay>
  );
}

function EventFormModal({ roster, presetDate, presetType, onClose, onSave }) {
  const [date] = useState(presetDate || todayISO());
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [opponent, setOpponent] = useState("");
  const type = presetType || "training";
  const isMatch = isMatchType(type);
  const titleMap = { training: "Nuevo entrenamiento", friendly: "Nuevo partido amistoso", league: "Nuevo partido de liga" };
  return (
    <ModalOverlay onClose={onClose} title={titleMap[type] || "Nuevo evento"}>
      <div style={{ fontSize: 13.5, color: TOKENS.inkSoft, marginBottom: 14 }}>{fmtDate(date)}</div>
      <Field label="Hora"><input type="time" style={inputStyle} value={time} onChange={(e) => setTime(e.target.value)} /></Field>
      <Field label="Lugar"><input style={inputStyle} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ej: Polideportivo Municipal" /></Field>
      {isMatch && (
        <Field label="Rival"><input style={inputStyle} value={opponent} onChange={(e) => setOpponent(e.target.value)} placeholder="Ej: CD Rivas" /></Field>
      )}
      <Btn style={{ width: "100%", marginTop: 6 }} onClick={() => {
        onSave({ type, date, time, location, opponent: isMatch ? opponent : "" });
      }}>Guardar</Btn>
    </ModalOverlay>
  );
}

function EventDetailModal({ ev, isCoach, me, roster, onClose, onDelete, onUpdate }) {
  const [golesFavor, setGolesFavor] = useState(ev?.golesFavor ?? "");
  const [golesContra, setGolesContra] = useState(ev?.golesContra ?? "");
  const [goleadores, setGoleadores] = useState(ev?.goleadores ?? "");
  const [reasonDraft, setReasonDraft] = useState((me && ev?.attendance?.[me.id]?.reason) || "");
  if (!ev) return null;
  const isMatch = isMatchType(ev.type);

  async function setAttendance(playerId, status, reason) {
    const updated = { ...ev, attendance: { ...ev.attendance, [playerId]: { status, reason: reason ?? "" } } };
    await onUpdate(updated);
  }

  return (
    <ModalOverlay onClose={onClose} title={isMatch ? `${eventTypeLabel(ev.type)} · vs ${ev.opponent || "?"}` : "Entrenamiento"}>
      <div style={{ fontSize: 13.5, color: TOKENS.inkSoft, marginBottom: 14 }}>
        {fmtDate(ev.date)} {ev.time && `· ${ev.time}`} {ev.location && `· ${ev.location}`}
      </div>

      {isMatch && (
        <div style={{ marginBottom: 18 }}>
          <SectionTitle>Resultado</SectionTitle>
          {isCoach ? (
            <>
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
                <input style={{ ...inputStyle, textAlign: "center" }} inputMode="numeric" value={golesFavor} onChange={(e) => setGolesFavor(e.target.value.replace(/[^0-9]/g, ""))} placeholder="0" />
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700 }}>–</span>
                <input style={{ ...inputStyle, textAlign: "center" }} inputMode="numeric" value={golesContra} onChange={(e) => setGolesContra(e.target.value.replace(/[^0-9]/g, ""))} placeholder="0" />
              </div>
              <Field label="Goleadores (opcional)"><input style={inputStyle} value={goleadores} onChange={(e) => setGoleadores(e.target.value)} placeholder="Ej: Marcos (2), Ana" /></Field>
              <Btn variant="subtle" style={{ width: "100%" }} onClick={() => onUpdate({ ...ev, golesFavor, golesContra, goleadores })}>Guardar resultado</Btn>
            </>
          ) : (
            ev.golesFavor !== "" && ev.golesFavor !== undefined ? (
              <div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 26, color: TOKENS.pitch }}>{ev.golesFavor} - {ev.golesContra}</div>
                {ev.goleadores && <div style={{ fontSize: 13, color: TOKENS.inkSoft, marginTop: 4 }}>Goles: {ev.goleadores}</div>}
              </div>
            ) : <div style={{ fontSize: 13.5, color: TOKENS.inkSoft }}>Resultado aún no registrado.</div>
          )}
        </div>
      )}

      <SectionTitle>Asistencia</SectionTitle>
      {!isCoach && me && (
        <Card style={{ marginBottom: 10, background: TOKENS.chalk }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>¿Vas a asistir?</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <Btn variant={ev.attendance?.[me.id]?.status === "yes" ? "primary" : "subtle"} style={{ flex: 1 }} onClick={() => setAttendance(me.id, "yes", "")}>Sí</Btn>
            <Btn variant={ev.attendance?.[me.id]?.status === "no" ? "danger" : "subtle"} style={{ flex: 1 }} onClick={() => setAttendance(me.id, "no", reasonDraft)}>No</Btn>
          </div>
          {ev.attendance?.[me.id]?.status === "no" && (
            <input style={inputStyle} placeholder="Motivo (opcional)" value={reasonDraft}
              onChange={(e) => setReasonDraft(e.target.value)}
              onBlur={() => setAttendance(me.id, "no", reasonDraft)} />
          )}
        </Card>
      )}
      {roster.players.length === 0 && <EmptyState text="Aún no hay jugadores en el equipo." />}
      {roster.players.map((p) => {
        const a = ev.attendance?.[p.id] || { status: "pending", reason: "" };
        const color = a.status === "yes" ? "#0F6E56" : a.status === "no" ? TOKENS.redCard : "#9AA39B";
        const label = a.status === "yes" ? "Asiste" : a.status === "no" ? "No asiste" : "Pendiente";
        return (
          <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${TOKENS.line}` }}>
            <Avatar name={p.name} dorsal={p.dorsal} photo={p.photo} size={34} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</div>
              {a.status === "no" && a.reason && <div style={{ fontSize: 12, color: TOKENS.inkSoft }}>{a.reason}</div>}
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color }}>{label}</span>
          </div>
        );
      })}

      {isCoach && (
        <Btn variant="danger" style={{ width: "100%", marginTop: 20 }} onClick={() => onDelete(ev.id)}>
          <Trash2 size={16} /> Eliminar evento
        </Btn>
      )}
    </ModalOverlay>
  );
}

function FinesTab({ isCoach, me, roster, fines, saveFines, modal, setModal }) {
  const list = isCoach ? fines : fines.filter((f) => f.playerId === me?.id);
  const totals = {};
  roster.players.forEach((p) => { totals[p.id] = 0; });
  fines.forEach((f) => { totals[f.playerId] = (totals[f.playerId] || 0) + Number(f.amount || 0); });

  return (
    <div>
      {isCoach && (
        <Btn style={{ width: "100%", marginBottom: 8 }} onClick={() => setModal({ type: "new-fine" })}>
          <Plus size={17} /> Añadir multa
        </Btn>
      )}
      {isCoach && (
        <>
          <SectionTitle>Total por jugador</SectionTitle>
          {roster.players.length === 0 && <EmptyState text="No hay jugadores todavía." />}
          {roster.players.map((p) => (
            <Card key={p.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Avatar name={p.name} dorsal={p.dorsal} photo={p.photo} size={34} />
              <div style={{ flex: 1 }}>{p.name}</div>
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 18, color: TOKENS.amber }}>{totals[p.id].toFixed(2)} €</span>
            </Card>
          ))}
        </>
      )}

      <SectionTitle>{isCoach ? "Historial de multas" : "Tus multas"}</SectionTitle>
      {list.length === 0 && <EmptyState text="No hay multas registradas." />}
      {list.slice().sort((a, b) => b.date.localeCompare(a.date)).map((f) => {
        const p = roster.players.find((pl) => pl.id === f.playerId);
        return (
          <Card key={f.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {isCoach && <div style={{ fontWeight: 600, fontSize: 13.5 }}>{p?.name || "Jugador"}</div>}
              <div style={{ fontSize: 13.5, color: TOKENS.inkSoft }}>{f.reason}</div>
              <div style={{ fontSize: 11.5, color: "#9AA39B", marginTop: 2 }}>{fmtDate(f.date)}</div>
            </div>
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 17, color: TOKENS.amber }}>{Number(f.amount).toFixed(2)} €</span>
            {isCoach && (
              <button aria-label="Eliminar" onClick={() => saveFines(fines.filter((x) => x.id !== f.id))} style={{ background: "none", border: "none", cursor: "pointer", color: TOKENS.inkSoft }}>
                <Trash2 size={16} />
              </button>
            )}
          </Card>
        );
      })}

      {modal?.type === "new-fine" && (
        <NewFineModal roster={roster} onClose={() => setModal(null)} onSave={async (f) => { await saveFines([...fines, { ...f, id: uid() }]); setModal(null); }} />
      )}
    </div>
  );
}

function NewFineModal({ roster, onClose, onSave }) {
  const [playerId, setPlayerId] = useState(roster.players[0]?.id || "");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [date, setDate] = useState(todayISO());
  return (
    <ModalOverlay onClose={onClose} title="Nueva multa">
      <Field label="Jugador">
        <select style={inputStyle} value={playerId} onChange={(e) => setPlayerId(e.target.value)}>
          {roster.players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </Field>
      <Field label="Importe (€)"><input style={inputStyle} value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))} inputMode="decimal" placeholder="Ej: 5" /></Field>
      <Field label="Motivo"><input style={inputStyle} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ej: Llegar tarde al entrenamiento" /></Field>
      <Field label="Fecha"><input type="date" style={inputStyle} value={date} onChange={(e) => setDate(e.target.value)} /></Field>
      <Btn style={{ width: "100%", marginTop: 6 }} onClick={() => {
        if (!playerId || !amount) return;
        onSave({ playerId, amount, reason: reason || "Sin motivo especificado", date, paid: false });
      }}>Guardar multa</Btn>
    </ModalOverlay>
  );
}

function TeamTab({ roster, saveRoster }) {
  const [confirmDelete, setConfirmDelete] = useState(null);
  const fileRef = useRef(null);
  const [savedMsg, setSavedMsg] = useState(false);

  return (
    <div>
      <SectionTitle>Ajustes del equipo</SectionTitle>
      <Card>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Escudo o foto del club</div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 4 }}>
          <div onClick={() => fileRef.current.click()} style={{ position: "relative", cursor: "pointer" }}>
            {roster.clubPhoto ? (
              <img src={roster.clubPhoto} alt="Escudo" style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", border: `2px solid ${TOKENS.pitch}` }} />
            ) : (
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: TOKENS.chalk, border: `1.5px dashed ${TOKENS.line}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Shield size={24} color={TOKENS.inkSoft} />
              </div>
            )}
            <div style={{ position: "absolute", bottom: 0, right: 0, background: TOKENS.pitch, borderRadius: "50%", padding: 4 }}>
              <Camera size={12} color="#fff" />
            </div>
          </div>
          <div style={{ fontSize: 12.5, color: TOKENS.inkSoft, flex: 1 }}>
            Se mostrará arriba en la app, para el equipo actual en el que estés.
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={async (e) => {
          const f = e.target.files[0]; if (!f) return;
          try { const d = await resizeImage(f, 200); await saveRoster({ ...roster, clubPhoto: d }); } catch (er) {}
        }} />
        {roster.clubPhoto && (
          <Btn variant="subtle" style={{ marginTop: 8, fontSize: 12.5, padding: "6px 10px" }} onClick={() => saveRoster({ ...roster, clubPhoto: null })}>Quitar foto</Btn>
        )}
      </Card>

      <Card>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Color de la app</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {THEMES.map((th) => {
            const active = (roster.themeId || "blue") === th.id;
            return (
              <div key={th.id} onClick={() => { saveRoster({ ...roster, themeId: th.id }); setSavedMsg(true); setTimeout(() => setSavedMsg(false), 1500); }}
                style={{
                  cursor: "pointer", textAlign: "center", padding: "8px 4px", borderRadius: 10,
                  border: active ? `2px solid ${th.pitch}` : "2px solid transparent",
                }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: th.pitch, margin: "0 auto 6px", border: `2px solid ${th.pitchDark}` }} />
                <div style={{ fontSize: 10.5, color: TOKENS.inkSoft, lineHeight: 1.2 }}>{th.name}</div>
              </div>
            );
          })}
        </div>
        {savedMsg && <div style={{ color: TOKENS.pitch, fontSize: 12.5, marginTop: 8, fontWeight: 600 }}>Color actualizado.</div>}
      </Card>

      <SectionTitle>{roster.players.length} jugador{roster.players.length !== 1 ? "es" : ""}</SectionTitle>
      {roster.players.length === 0 && <EmptyState text="Comparte el enlace de esta app con tus jugadores para que se unan." />}
      {roster.players.map((p) => (
        <Card key={p.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Avatar name={p.name} dorsal={p.dorsal} photo={p.photo} size={44} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700 }}>{p.name}</div>
            <div style={{ fontSize: 12.5, color: TOKENS.inkSoft }}>Dorsal {p.dorsal || "–"}</div>
          </div>
          {confirmDelete === p.id ? (
            <div style={{ display: "flex", gap: 6 }}>
              <Btn variant="danger" style={{ padding: "6px 10px", fontSize: 12 }} onClick={() => { saveRoster({ ...roster, players: roster.players.filter((x) => x.id !== p.id) }); setConfirmDelete(null); }}>Eliminar</Btn>
              <Btn variant="subtle" style={{ padding: "6px 10px", fontSize: 12 }} onClick={() => setConfirmDelete(null)}>Cancelar</Btn>
            </div>
          ) : (
            <button aria-label="Eliminar jugador" onClick={() => setConfirmDelete(p.id)} style={{ background: "none", border: "none", cursor: "pointer", color: TOKENS.redCard }}>
              <Trash2 size={18} />
            </button>
          )}
        </Card>
      ))}
    </div>
  );
}

function ProfileTab({ me, roster, saveRoster, saveIdentity, identity }) {
  const [name, setName] = useState(me?.name || "");
  const [dorsal, setDorsal] = useState(me?.dorsal || "");
  const [photo, setPhoto] = useState(me?.photo || null);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef(null);
  if (!me) return <EmptyState text="No se ha encontrado tu perfil." />;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
        <div onClick={() => fileRef.current.click()} style={{ position: "relative", cursor: "pointer" }}>
          <Avatar name={name} dorsal={dorsal} photo={photo} size={90} />
          <div style={{ position: "absolute", bottom: 0, right: 0, background: TOKENS.pitch, borderRadius: "50%", padding: 5 }}>
            <Camera size={14} color="#fff" />
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={async (e) => {
          const f = e.target.files[0]; if (!f) return;
          try { const d = await resizeImage(f); setPhoto(d); } catch (er) {}
        }} />
      </div>
      <Field label="Nombre"><input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <Field label="Dorsal"><input style={inputStyle} value={dorsal} onChange={(e) => setDorsal(e.target.value.replace(/[^0-9]/g, ""))} /></Field>
      {saved && <div style={{ color: TOKENS.pitch, fontSize: 13, marginBottom: 8, fontWeight: 600 }}>Perfil actualizado.</div>}
      <Btn style={{ width: "100%" }} onClick={async () => {
        const updated = { ...me, name: name.trim() || me.name, dorsal, photo };
        await saveRoster({ ...roster, players: roster.players.map((p) => (p.id === me.id ? updated : p)) });
        await saveIdentity({ ...identity, name: updated.name });
        setSaved(true); setTimeout(() => setSaved(false), 2000);
      }}>Guardar cambios</Btn>
    </div>
  );
}

function ModalOverlay({ title, onClose, children }) {
  return (
    <div style={{
      position: "absolute", inset: 0, background: "rgba(11,61,46,0.4)", display: "flex",
      alignItems: "flex-end", zIndex: 20,
    }}>
      <div style={{
        background: "#fff", width: "100%", maxHeight: "88%", overflowY: "auto",
        borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: "18px 20px 26px",
      }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
          <div style={{ flex: 1, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 19 }}>{title}</div>
          <button onClick={onClose} aria-label="Cerrar" style={{ background: "none", border: "none", cursor: "pointer", color: TOKENS.inkSoft }}>
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}