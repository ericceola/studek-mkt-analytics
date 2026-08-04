import {
  Fragment,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  Link,
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  BarChart3,
  BrainCircuit,
  Camera as Instagram,
  Check,
  ChevronRight,
  Clock3,
  Download,
  FolderKanban,
  Gauge,
  Heart,
  Layers3,
  KeyRound,
  LockKeyhole,
  LogOut,
  Mail,
  Menu,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Save,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  X,
  Zap,
} from "lucide-react";
import { api, errorMessage } from "./api";
import { PostThumbnail } from "./components/PostThumbnail";
import ContentDashboard from "./pages/ContentDashboard";
import StrategyDashboard from "./pages/StrategyDashboard";
import ComparisonDashboard from "./pages/ComparisonDashboard";
import PostDetail from "./pages/PostDetail";
import {AccessProfilesPage,SystemUsersPage} from "./pages/AccessManagement";

type AnyObj = Record<string, any>;
const COLORS = [
  "#7c5cff",
  "#36c5a1",
  "#ffb547",
  "#ff6b81",
  "#56a8f5",
  "#a982ff",
];
const number = (value: any) =>
  new Intl.NumberFormat("pt-BR", {
    notation: Number(value) > 999999 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(Number(value) || 0);
const percent = (value: any) =>
  `${Number(value || 0)
    .toFixed(2)
    .replace(".", ",")}%`;
const date = (value: any) =>
  value
    ? new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "—";

function Toast({ text, onClose }: { text: string; onClose: () => void }) {
  useEffect(() => {
    const id = setTimeout(onClose, 3500);
    return () => clearTimeout(id);
  }, [onClose]);
  return (
    <div className="toast">
      <Check size={18} />
      {text}
    </div>
  );
}
function Empty({
  icon = Instagram,
  title,
  description,
  action,
}: {
  icon?: any;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  const Icon = icon;
  return (
    <div className="empty">
      <div className="empty-icon">
        <Icon />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
function Loader() {
  return (
    <div className="loader">
      <span />
      <span />
      <span />
    </div>
  );
}
function Badge({ status }: { status: string }) {
  const labels: AnyObj = {
    running: "Em andamento",
    pending: "Na fila",
    succeeded: "Concluída",
    failed: "Falhou",
    aborted: "Cancelada",
    timed_out: "Expirou",
  };
  return (
    <span className={`badge ${status}`}>
      {status === "running" && <span className="pulse" />}
      {labels[status] || status}
    </span>
  );
}
function Metric({ label, value, detail, icon: Icon, tone = "purple" }: AnyObj) {
  return (
    <article className="metric">
      <div className={`metric-icon ${tone}`}>
        <Icon size={20} />
      </div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        {detail && <small>{detail}</small>}
      </div>
    </article>
  );
}

function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("studek_token", data.token);
      localStorage.setItem("studek_user", JSON.stringify(data.user));
      nav("/dashboard");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login-page">
      <section className="login-brand">
        <div className="brand">
          <div className="logo">
            <BarChart3 />
          </div>
          <b>
            Studek<span>Analytics</span>
          </b>
        </div>
        <div className="hero-copy">
          <span className="eyebrow">
            <Sparkles size={15} /> Inteligência para Instagram
          </span>
          <h1>
            Decisões melhores começam com <em>dados claros.</em>
          </h1>
          <p>
            Monitore seus perfis, encontre padrões e compare resultados em um só
            lugar.
          </p>
          <div className="mini-chart">
            <div className="mini-bars">
              {[32, 47, 42, 63, 58, 78, 86, 70, 92].map((h, i) => (
                <i key={i} style={{ height: `${h}%` }} />
              ))}
            </div>
            <div>
              <small>Crescimento nos últimos 30 dias</small>
              <strong>+18,4%</strong>
            </div>
          </div>
        </div>
        <small>© 2026 Studek · Marketing Analytics</small>
      </section>
      <section className="login-panel">
        <form onSubmit={submit} autoComplete="off">
          <span className="eyebrow">Bem-vindo de volta</span>
          <h2>Acesse seu painel</h2>
          <p>Use suas credenciais para continuar.</p>
          {error && <div className="error">{error}</div>}
          <label>
            E-mail
            <input
              type="email"
              name="studek_login_email"
              autoComplete="off"
              data-1p-ignore
              data-lpignore="true"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@empresa.com"
            />
          </label>
          <label>
            Senha
            <input
              type="password"
              name="studek_login_password"
              autoComplete="new-password"
              data-1p-ignore
              data-lpignore="true"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </label>
          <button className="button primary wide" disabled={busy}>
            {busy ? "Entrando..." : "Entrar no painel"}
            <ChevronRight size={18} />
          </button>
          <div className="secure">
            <ShieldCheck size={17} />
            <span>Seus dados são protegidos e criptografados.</span>
          </div>
        </form>
      </section>
    </main>
  );
}

const navItems = [
  ["/dashboard", Gauge, "Visão geral", "dashboard"],
  ["/profiles", Instagram, "Perfis", "profiles"],
  ["/comparisons", BarChart3, "Comparações", "comparisons"],
  ["/comparison-groups", FolderKanban, "Grupos", "comparison_groups"],
  ["/collections", Activity, "Coletas", "collections"],
  ["/settings", Settings, "Configurações", "settings"],
] as const;
const adminNavItems = [
  ["/system-users", Users, "Usuários", "system_users"],
  ["/access-profiles", LockKeyhole, "Perfis de acesso", "access_profiles"],
] as const;
function Shell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("studek_sidebar_collapsed") === "true");
  const user = JSON.parse(
    localStorage.getItem("studek_user") ||
      '{"name":"Administrador","role":"admin"}',
  );
  const allowed=(permission:string)=>user.role==='admin'||user.permissions?.includes(permission);
  const current =
    [...navItems,...adminNavItems].find((n) => location.pathname.startsWith(n[0]))?.[2] || "Painel";
  useEffect(() => {
    if (!showLogoutConfirm) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowLogoutConfirm(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [showLogoutConfirm]);
  const logout = () => {
    localStorage.clear();
    nav("/login");
  };
  return (
    <div className={`app-shell ${collapsed ? "sidebar-collapsed" : ""}`}>
      <aside className={`${open ? "open " : ""}${collapsed ? "collapsed" : ""}`}>
        <div className="side-head">
          <div className="brand">
            <div className="logo">
              <BarChart3 />
            </div>
            <b>
              Studek<span>Analytics</span>
            </b>
          </div>
          <button className="icon-btn mobile" onClick={() => setOpen(false)}>
            <X />
          </button>
        </div>
        <button type="button" className="sidebar-collapse" title={collapsed ? "Expandir menu" : "Recolher menu"} aria-label={collapsed ? "Expandir menu lateral" : "Recolher menu lateral"} onClick={() => { const next=!collapsed;setCollapsed(next);localStorage.setItem("studek_sidebar_collapsed",String(next)); }}><ChevronRight/></button>
        <nav>
          <small>ANÁLISES</small>
          {navItems.slice(0, 3).filter(([, , ,permission])=>allowed(permission)).map(([to, Icon, label]) => (
            <NavLink key={to} to={to} onClick={() => setOpen(false)} aria-label={label} data-label={label}>
              <Icon />
              <span>{label}</span>
            </NavLink>
          ))}
          <small>GESTÃO</small>
          {navItems.slice(3).filter(([, , ,permission])=>allowed(permission)).map(([to, Icon, label]) => (
            <NavLink key={to} to={to} onClick={() => setOpen(false)} aria-label={label} data-label={label}>
              <Icon />
              <span>{label}</span>
            </NavLink>
          ))}
          {adminNavItems.filter(([, , ,permission])=>allowed(permission)).map(([to,Icon,label])=><NavLink key={to} to={to} onClick={()=>setOpen(false)} aria-label={label} data-label={label}><Icon/><span>{label}</span></NavLink>)}
        </nav>
        <div className="side-foot">
          <div className="user-avatar">{user.name?.[0] || "A"}</div>
          <div>
            <b>{user.name}</b>
            <small>{user.role === "admin" ? "Administrador" : user.accessProfileName||"Usuário"}</small>
          </div>
          <button
            className="icon-btn"
            title="Sair"
            aria-label="Sair"
            onClick={() => setShowLogoutConfirm(true)}
          >
            <LogOut size={17} />
          </button>
        </div>
      </aside>
      {open && <div className="backdrop" onClick={() => setOpen(false)} />}
      <section className="main">
        <header>
          <button className="icon-btn mobile" onClick={() => setOpen(true)}>
            <Menu />
          </button>
          <div>
            <small>Workspace /</small>
            <b>{current}</b>
          </div>
          <div className="header-actions">
            <button className="icon-btn">
              <Search />
            </button>
            <span className="live">
              <i /> Sistema online
            </span>
          </div>
        </header>
        <div className="content">{children}</div>
      </section>
      {showLogoutConfirm && (
        <div className="modal-wrap" role="dialog" aria-modal="true" aria-labelledby="logout-confirm-title">
          <div className="backdrop" onClick={() => setShowLogoutConfirm(false)} />
          <div className="modal logout-confirm-modal">
            <div className="logout-confirm-icon"><LogOut /></div>
            <h2 id="logout-confirm-title">Deseja realmente sair?</h2>
            <p>Sua sessão será encerrada e você precisará entrar novamente para acessar o painel.</p>
            <div className="modal-actions">
              <button type="button" className="button ghost" autoFocus onClick={() => setShowLogoutConfirm(false)}>
                Cancelar
              </button>
              <button type="button" className="button logout-confirm-button" onClick={logout}>
                <LogOut /> Sim, sair
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
function PageHead({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-head">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="head-actions">{children}</div>
    </div>
  );
}

function Dashboard() {
  const [data, setData] = useState<AnyObj | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api
      .get("/dashboard/summary")
      .then((r) => setData(r.data))
      .finally(() => setLoading(false));
  }, []);
  if (loading) return <Loader />;
  const s = data?.summary || {};
  const chart = (data?.profiles || []).map((p: AnyObj) => ({
    name: p.username,
    Seguidores: Number(p.followers_count),
    Engajamento: Number(p.engagement_rate),
  }));
  return (
    <>
      <PageHead
        eyebrow="PAINEL PRINCIPAL"
        title="Panorama dos seus perfis"
        description="Acompanhe o que está crescendo e onde concentrar seus próximos esforços."
      >
        <NavLink to="/profiles" className="button primary">
          <Plus />
          Adicionar perfil
        </NavLink>
      </PageHead>
      <div className="metrics">
        <Metric
          label="Perfis monitorados"
          value={number(s.profiles)}
          detail={`${s.running || 0} coleta em andamento`}
          icon={Instagram}
        />
        <Metric
          label="Audiência total"
          value={number(s.followers)}
          detail="Todos os perfis ativos"
          icon={Users}
          tone="green"
        />
        <Metric
          label="Publicações"
          value={number(s.posts)}
          detail="Conteúdos analisados"
          icon={Layers3}
          tone="orange"
        />
        <Metric
          label="Engajamento médio"
          value={percent(s.engagement_rate)}
          detail="Curtidas + comentários"
          icon={Heart}
          tone="pink"
        />
      </div>
      <div className="grid two">
        <section className="panel chart-panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">AUDIÊNCIA</span>
              <h2>Seguidores por perfil</h2>
            </div>
          </div>
          {chart.length ? (
            <ResponsiveContainer width="100%" height={285}>
              <BarChart data={chart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar
                  dataKey="Seguidores"
                  radius={[7, 7, 0, 0]}
                  fill="#7c5cff"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Empty
              title="Seu painel começa aqui"
              description="Cadastre o primeiro perfil para acompanhar audiência e desempenho."
              action={
                <NavLink className="button secondary" to="/profiles">
                  Cadastrar perfil
                </NavLink>
              }
            />
          )}
        </section>
        <section className="panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">DESTAQUES</span>
              <h2>Melhor desempenho</h2>
            </div>
            <MoreHorizontal />
          </div>
          {data?.profiles?.length ? (
            <div className="profile-rank">
              {data.profiles.map((p: AnyObj, i: number) => (
                <NavLink to={`/profiles/${p.id}`} key={p.id}>
                  <span className="rank">{i + 1}</span>
                  <div className="avatar">
                    {p.username[0].toUpperCase()}
                    {p.profile_picture_url && <img src={`/api/media/profiles/${p.id}/picture`} alt={`@${p.username}`} onError={event => { event.currentTarget.style.display="none"; }}/>} 
                  </div>
                  <div>
                    <b>@{p.username}</b>
                    <small>{number(p.followers_count)} seguidores</small>
                  </div>
                  <strong>{percent(p.engagement_rate)}</strong>
                  <ChevronRight />
                </NavLink>
              ))}
            </div>
          ) : (
            <Empty
              icon={Zap}
              title="Sem destaques ainda"
              description="Os perfis com maior engajamento aparecerão aqui."
            />
          )}
        </section>
      </div>
    </>
  );
}

function Profiles() {
  const presetPeriods = ["7 days", "30 days", "90 days", "1 year"];
  const [profiles, setProfiles] = useState<AnyObj[]>([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState({
    username: "",
    internalName: "",
  });
  const [collectionSettings, setCollectionSettings] = useState({ resultsLimit: 100, onlyPostsNewerThan: "30 days", postsUntil: "" });
  const [savingSettings, setSavingSettings] = useState(false);
  const [toast, setToast] = useState("");
  const collectingRef = useRef(new Set<number>());
  const [collectingIds, setCollectingIds] = useState<number[]>([]);
  const load = useCallback(() =>
    api
      .get("/profiles", { params: { q: query } })
      .then((r) => setProfiles(r.data.data))
      .finally(() => setLoading(false)), [query]);
  useEffect(() => {
    const id = setTimeout(load, 250);
    const polling = setInterval(load, 5000);
    return () => { clearTimeout(id); clearInterval(polling); };
  }, [load]);
  useEffect(() => { api.get("/collection-settings").then(response => setCollectionSettings({...response.data,postsUntil:response.data.postsUntil||""})).catch(() => undefined); }, []);
  async function save(e: FormEvent) {
    e.preventDefault();
    try {
      await api.post("/profiles", form);
      setShow(false);
      setToast("Perfil cadastrado com sucesso.");
      setForm({
        username: "",
        internalName: "",
      });
      load();
    } catch (e) {
      alert(errorMessage(e));
    }
  }
  async function collect(id: number) {
    if (collectingRef.current.has(id)) return;
    collectingRef.current.add(id);
    setCollectingIds([...collectingRef.current]);
    try {
      const response = await api.post(`/profiles/${id}/collect`, {
        type: "full",
      });
      setToast(response.data.reused ? "Já existe um lote em andamento para este perfil." : "Lote enviado: perfil, publicações/Reels e Stories.");
      await load();
    } catch (e) {
      alert(errorMessage(e));
    } finally {
      collectingRef.current.delete(id);
      setCollectingIds([...collectingRef.current]);
    }
  }
  async function remove(id: number) {
    if (confirm("Remover este perfil e todo o histórico?")) {
      await api.delete(`/profiles/${id}`);
      load();
    }
  }
  async function saveCollectionSettings(e: FormEvent) {
    e.preventDefault(); setSavingSettings(true);
    try { const response = await api.put("/collection-settings", {...collectionSettings,postsUntil:collectionSettings.postsUntil||null}); setCollectionSettings({...response.data,postsUntil:response.data.postsUntil||""}); setToast("Parâmetros globais de coleta salvos para todos os perfis."); }
    catch (e) { alert(errorMessage(e)); } finally { setSavingSettings(false); }
  }
  return (
    <>
      <PageHead
        eyebrow="GESTÃO"
        title="Perfis monitorados"
        description="Cadastre contas públicas e mantenha seus dados sempre atualizados."
      >
        <button className="button primary" onClick={() => setShow(true)}>
          <Plus />
          Novo perfil
        </button>
      </PageHead>
      <form className="collection-settings-panel" onSubmit={saveCollectionSettings}>
        <div className="collection-settings-copy"><div className="setting-icon"><Settings/></div><div><span>PADRÃO GLOBAL DE COLETA</span><h2>Parâmetros iguais para todos os perfis</h2><p>Esses valores serão usados em todo novo lote de perfil, publicações/Reels e Stories.</p></div></div>
        <label><span>resultsLimit</span><input type="number" min="1" max="500" required value={collectionSettings.resultsLimit} onChange={e => setCollectionSettings({...collectionSettings,resultsLimit:Number(e.target.value)})}/><small>Quantidade máxima de resultados por perfil</small></label>
        <div className="collection-period-field"><span>Período das publicações</span><select value={presetPeriods.includes(collectionSettings.onlyPostsNewerThan)&&!collectionSettings.postsUntil ? collectionSettings.onlyPostsNewerThan : "custom"} onChange={e => setCollectionSettings({...collectionSettings,onlyPostsNewerThan:e.target.value === "custom" ? "" : e.target.value,postsUntil:""})}><option value="7 days">Últimos 7 dias</option><option value="30 days">Últimos 30 dias</option><option value="90 days">Últimos 90 dias</option><option value="1 year">Último ano</option><option value="custom">Intervalo personalizado</option></select>{(!presetPeriods.includes(collectionSettings.onlyPostsNewerThan)||Boolean(collectionSettings.postsUntil))&&<div className="collection-range-fields"><label><small>Data inicial</small><input type="date" required value={collectionSettings.onlyPostsNewerThan} max={collectionSettings.postsUntil||undefined} onChange={e=>setCollectionSettings({...collectionSettings,onlyPostsNewerThan:e.target.value})}/></label><label><small>Data final</small><input type="date" required value={collectionSettings.postsUntil} min={collectionSettings.onlyPostsNewerThan||undefined} onChange={e=>setCollectionSettings({...collectionSettings,postsUntil:e.target.value})}/></label></div>}<small>O mesmo intervalo será aplicado a todos os perfis</small></div>
        <button className="button primary" type="submit" disabled={savingSettings}><Check/>{savingSettings?"Salvando…":"Salvar padrão"}</button>
        <div className="comparison-warning"><ShieldCheck/><div><b>Comparação fidedigna</b><span>Preserve o mesmo limite e período para todos os perfis. Alterações passam a valer nos próximos lotes.</span></div></div>
      </form>
      <section className="panel">
        <div className="toolbar">
          <div className="search">
            <Search />
            <input
              placeholder="Buscar por perfil ou nome interno"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <span>{profiles.length} perfis</span>
        </div>
        {loading ? (
          <Loader />
        ) : profiles.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Perfil</th>
                  <th>Seguidores</th>
                  <th>Publicações</th>
                  <th>Engajamento</th>
                  <th>Última coleta</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {profiles.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <NavLink
                        className="profile-cell"
                        to={`/profiles/${p.id}`}
                      >
                        <div className="avatar">
                          {p.username[0].toUpperCase()}
                          {p.profile_picture_url && <img src={`/api/media/profiles/${p.id}/picture`} alt={`@${p.username}`} onError={event => { event.currentTarget.style.display="none"; }}/>} 
                        </div>
                        <div>
                          <b>
                            {p.internal_name || p.full_name || `@${p.username}`}
                          </b>
                          <small>@{p.username}</small>
                        </div>
                      </NavLink>
                    </td>
                    <td>
                      <b>{number(p.followers_count)}</b>
                    </td>
                    <td>{number(p.posts_count)}</td>
                    <td>
                      <span className="positive">
                        {percent(p.engagement_rate)}
                      </span>
                    </td>
                    <td>{date(p.last_collected_at)}</td>
                    <td>
                      {p.run_status ? (
                        <Badge status={p.run_status} />
                      ) : (
                        <span className="muted">Nunca coletado</span>
                      )}
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="icon-btn"
                          title={['pending','running'].includes(p.run_status) ? "Coleta já em andamento" : "Coletar"}
                          onClick={() => collect(p.id)}
                          disabled={collectingIds.includes(p.id) || ['pending','running'].includes(p.run_status)}
                        >
                          <RefreshCw className={collectingIds.includes(p.id) ? "spin" : ""} />
                        </button>
                        <button
                          className="icon-btn danger"
                          title="Remover"
                          onClick={() => remove(p.id)}
                        >
                          <Trash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="Nenhum perfil cadastrado"
            description="Adicione uma conta pública do Instagram para iniciar suas análises."
            action={
              <button className="button primary" onClick={() => setShow(true)}>
                <Plus />
                Adicionar primeiro perfil
              </button>
            }
          />
        )}
      </section>
      {show && (
        <div className="modal-wrap">
          <div className="backdrop" onClick={() => setShow(false)} />
          <form className="modal" onSubmit={save}>
            <div className="modal-head">
              <div>
                <span className="eyebrow">NOVO MONITORAMENTO</span>
                <h2>Adicionar perfil</h2>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShow(false)}
              >
                <X />
              </button>
            </div>
            <label>
              Username ou URL do Instagram
              <input
                autoFocus
                required
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="@perfil ou instagram.com/perfil"
              />
            </label>
            <label>
              Nome interno <small>(opcional)</small>
              <input
                value={form.internalName}
                onChange={(e) =>
                  setForm({ ...form, internalName: e.target.value })
                }
                placeholder="Ex.: Concorrente principal"
              />
            </label>
            <div className="notice">
              <ShieldCheck />O token da Apify fica protegido no servidor.
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="button ghost"
                onClick={() => setShow(false)}
              >
                Cancelar
              </button>
              <button className="button primary">Cadastrar perfil</button>
            </div>
          </form>
        </div>
      )}
      {toast && <Toast text={toast} onClose={() => setToast("")} />}
    </>
  );
}

function ProfileDetail() {
  const { id } = useParams();
  const [data, setData] = useState<AnyObj | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api
      .get(`/profiles/${id}/dashboard`)
      .then((r) => setData(r.data))
      .finally(() => setLoading(false));
  }, [id]);
  if (loading) return <Loader />;
  if (!data?.profile)
    return (
      <Empty
        title="Perfil não encontrado"
        description="Este perfil não existe ou foi removido."
      />
    );
  const p = data.profile;
  const growth =
    Number(p.followers_count || 0) -
    Number(p.first_followers || p.followers_count || 0);
  return (
    <>
      <PageHead
        eyebrow="ANÁLISE INDIVIDUAL"
        title={`@${p.username}`}
        description={
          p.biography ||
          p.internal_name ||
          "Desempenho, audiência e conteúdo em uma visão unificada."
        }
      >
        <a className="button secondary" href={`/api/profiles/${id}/export.csv`}>
          <Download />
          Exportar CSV
        </a>
      </PageHead>
      <section className="profile-hero panel">
        <div className="big-avatar">
          {p.username[0].toUpperCase()}
          {p.profile_picture_url && <img src={`/api/media/profiles/${p.id}/picture`} alt={`@${p.username}`} onError={event => { event.currentTarget.style.display="none"; }}/>} 
        </div>
        <div>
          <div className="verified-line">
            <h2>{p.full_name || p.internal_name || p.username}</h2>
            {p.is_verified ? <ShieldCheck /> : null}
          </div>
          <p>{p.biography || "Biografia ainda não coletada."}</p>
          <small>Última coleta: {date(p.last_collected_at)}</small>
        </div>
      </section>
      <div className="metrics">
        <Metric
          label="Seguidores"
          value={number(p.followers_count)}
          detail={
            growth >= 0
              ? `+${number(growth)} no período`
              : `${number(growth)} no período`
          }
          icon={Users}
        />
        <Metric
          label="Publicações"
          value={number(p.posts_count)}
          detail="Total do perfil"
          icon={Layers3}
          tone="green"
        />
        <Metric
          label="Média de curtidas"
          value={number(p.average_likes)}
          detail="Por publicação"
          icon={Heart}
          tone="pink"
        />
        <Metric
          label="Taxa de engajamento"
          value={percent(p.engagement_rate)}
          detail="Por seguidores"
          icon={Activity}
          tone="orange"
        />
      </div>
      <div className="grid two">
        <section className="panel chart-panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">EVOLUÇÃO</span>
              <h2>Crescimento de seguidores</h2>
            </div>
          </div>
          {data.history.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={data.history}>
                <defs>
                  <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c5cff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7c5cff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="collected_at"
                  tickFormatter={(v) => new Date(v).toLocaleDateString("pt-BR")}
                />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="followers_count"
                  stroke="#7c5cff"
                  fill="url(#area)"
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <Empty
              title="Histórico ainda vazio"
              description="Execute duas ou mais coletas para visualizar a evolução."
            />
          )}
        </section>
        <section className="panel chart-panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">FORMATOS</span>
              <h2>Desempenho por conteúdo</h2>
            </div>
          </div>
          {data.formats.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={data.formats}
                  dataKey="engagement"
                  nameKey="name"
                  innerRadius={62}
                  outerRadius={96}
                  paddingAngle={4}
                >
                  {data.formats.map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <Empty
              title="Sem conteúdo analisado"
              description="Os formatos aparecerão após a primeira coleta de posts."
            />
          )}
        </section>
      </div>
      <section className="panel">
        <div className="panel-head">
          <div>
            <span className="eyebrow">RANKING</span>
            <h2>Conteúdos com melhor desempenho</h2>
          </div>
        </div>
        {data.topPosts.length ? (
          <div className="post-grid">
            {data.topPosts.map((post: AnyObj) => (
              <Link
                to={`/posts/${post.id}`}
                className="post-card"
                key={post.id}
              >
                <div className="post-image">
                  {post.display_url ? (
                    <PostThumbnail postId={post.id} />
                  ) : (
                    <Instagram />
                  )}
                  <span>{post.post_type}</span>
                </div>
                <div>
                  <p>{post.caption || "Publicação sem legenda"}</p>
                  <div>
                    <span>
                      <Heart />
                      {number(post.likes_count)}
                    </span>
                    <span>
                      <Activity />
                      {number(post.comments_count)}
                    </span>
                    <strong>{percent(post.engagement_rate)}</strong>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <Empty
            title="Nenhuma publicação encontrada"
            description="Execute uma coleta completa para montar o ranking."
          />
        )}
      </section>
    </>
  );
}

function Comparisons() {
  const [profiles, setProfiles] = useState<AnyObj[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [data, setData] = useState<AnyObj | null>(null);
  useEffect(() => {
    api
      .get("/profiles", { params: { limit: 100 } })
      .then((r) => setProfiles(r.data.data));
  }, []);
  async function compare() {
    if (selected.length < 2) return;
    setData(
      (await api.post("/comparisons/preview", { profileIds: selected })).data,
    );
  }
  const timeline = useMemo(() => {
    const map = new Map<string, AnyObj>();
    for (const row of data?.history || []) {
      const key = new Date(row.collected_at).toLocaleDateString("pt-BR");
      map.set(key, {
        ...(map.get(key) || { date: key }),
        [row.username]: Number(row.followers_count),
      });
    }
    return [...map.values()];
  }, [data]);
  return (
    <>
      <PageHead
        eyebrow="BENCHMARK"
        title="Comparar perfis"
        description="Coloque concorrentes lado a lado e descubra quem está avançando."
      >
        <button
          className="button primary"
          disabled={selected.length < 2}
          onClick={compare}
        >
          <BarChart3 />
          Comparar {selected.length || ""}
        </button>
      </PageHead>
      <section className="panel selection">
        <h3>Escolha pelo menos dois perfis</h3>
        <div>
          {profiles.map((p) => (
            <button
              className={
                selected.includes(p.id)
                  ? "profile-chip selected"
                  : "profile-chip"
              }
              key={p.id}
              onClick={() =>
                setSelected((s) =>
                  s.includes(p.id) ? s.filter((x) => x !== p.id) : [...s, p.id],
                )
              }
            >
              <span>{p.username[0].toUpperCase()}</span>@{p.username}
              {selected.includes(p.id) && <Check />}
            </button>
          ))}
        </div>
        {!profiles.length && (
          <Empty
            title="Cadastre perfis primeiro"
            description="Você precisa de pelo menos dois perfis para criar uma comparação."
          />
        )}
      </section>
      {data && (
        <>
          <div className="comparison-cards">
            {data.profiles.map((p: AnyObj, i: number) => (
              <article
                className="panel"
                key={p.id}
                style={{ "--accent": COLORS[i] } as any}
              >
                <div className="compare-name">
                  <i />@{p.username}
                </div>
                <strong>{number(p.followers_count)}</strong>
                <small>seguidores</small>
                <dl>
                  <div>
                    <dt>Engajamento</dt>
                    <dd>{percent(p.engagement_rate)}</dd>
                  </div>
                  <div>
                    <dt>Média de likes</dt>
                    <dd>{number(p.average_likes)}</dd>
                  </div>
                  <div>
                    <dt>Publicações</dt>
                    <dd>{number(p.posts_count)}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
          <section className="panel chart-panel">
            <div className="panel-head">
              <div>
                <span className="eyebrow">COMPARATIVO</span>
                <h2>Evolução da audiência</h2>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={330}>
              <LineChart data={timeline}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                {data.profiles.map((p: AnyObj, i: number) => (
                  <Line
                    key={p.id}
                    type="monotone"
                    dataKey={p.username}
                    stroke={COLORS[i]}
                    strokeWidth={3}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </section>
        </>
      )}
    </>
  );
}

function Collections() {
  const [runs, setRuns] = useState<AnyObj[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCollections, setExpandedCollections] = useState<string[]>([]);
  const [clearTarget, setClearTarget] = useState<AnyObj | null>(null);
  const [clearing, setClearing] = useState(false);
  const load = useCallback(() =>
    api
      .get("/runs")
      .then((r) => setRuns(r.data))
      .finally(() => setLoading(false)), []);
  useEffect(() => {
    load();
    const polling = setInterval(load, 5000);
    return () => clearInterval(polling);
  }, [load]);
  const collections = useMemo(() => {
    const grouped = new Map<number, AnyObj>();
    const standalone: AnyObj[] = [];
    for (const run of runs) {
      if (!run.batch_id) { standalone.push({ ...run, children: [run], isBatch: false }); continue; }
      const batchId = Number(run.batch_id);
      const group = grouped.get(batchId) || { id: `batch-${batchId}`, batch_id: batchId, username: run.username, internal_name: run.internal_name, created_at: run.created_at, started_at: run.started_at, children: [], isBatch: true };
      group.children.push(run);
      if (new Date(run.created_at) < new Date(group.created_at)) group.created_at = run.created_at;
      grouped.set(batchId, group);
    }
    const aggregate = (group: AnyObj) => {
      const statuses = group.children.map((child: AnyObj) => child.status);
      group.status = statuses.every((status: string) => status === "succeeded") ? "succeeded" : statuses.some((status: string) => ["pending", "running"].includes(status)) ? "running" : statuses.includes("failed") ? "failed" : statuses.includes("timed_out") ? "timed_out" : "aborted";
      group.finished_at = group.children.every((child: AnyObj) => child.finished_at) ? group.children.map((child: AnyObj) => child.finished_at).sort().at(-1) : null;
      group.duration_seconds = group.children.reduce((max: number, child: AnyObj) => Math.max(max, Number(child.duration_seconds) || 0), 0);
      group.items = group.children.reduce((total: number, child: AnyObj) => { const summary = typeof child.result_summary === "string" ? JSON.parse(child.result_summary || "{}") : child.result_summary; return total + Number(summary?.itemsProcessed || 0); }, 0);
      return group;
    };
    return [...Array.from(grouped.values()).map(aggregate), ...standalone.map(aggregate)].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
  }, [runs]);
  async function action(id: number, type: "refresh" | "retry" | "abort") {
    try {
      await api.post(`/runs/${id}/${type}`);
      load();
    } catch (e) {
      alert(errorMessage(e));
    }
  }
  async function batchAction(collection: AnyObj, type: "refresh" | "abort") {
    const active = collection.children.filter((child: AnyObj) => ["pending", "running"].includes(child.status) && child.apify_run_id);
    try { await Promise.all(active.map((child: AnyObj) => api.post(`/runs/${child.id}/${type}`))); await load(); } catch (e) { alert(errorMessage(e)); }
  }
  const stepName = (type: string) => ({ profile_details: "Perfil", posts: "Publicações e Reels", stories: "Stories" }[type] || type.replace("_", " "));
  const stepStatus = (status: string) => ({ pending: "Aguardando", running: "Em andamento", succeeded: "Finalizado", failed: "Falhou", aborted: "Cancelado", timed_out: "Expirou" }[status] || status);
  const processedItems = (run: AnyObj) => { try { const summary = typeof run?.result_summary === "string" ? JSON.parse(run.result_summary || "{}") : run?.result_summary; return Number(summary?.itemsProcessed || 0); } catch { return 0; } };
  const toggleCollection = (id: string) => setExpandedCollections(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  const hasActiveCollections = collections.some(collection => ["pending", "running"].includes(collection.status));
  async function confirmClear() {
    if (!clearTarget) return; setClearing(true);
    try {
      if (clearTarget.scope === "all") await api.delete("/runs");
      else if (clearTarget.isBatch) await api.delete(`/collection-batches/${clearTarget.batch_id}`);
      else await api.delete(`/runs/${clearTarget.id}`);
      setClearTarget(null); setExpandedCollections([]); await load();
    } catch (error) { alert(errorMessage(error)); } finally { setClearing(false); }
  }
  return (
    <>
      <PageHead
        eyebrow="PROCESSAMENTO"
        title="Coletas"
        description="Acompanhe cada sincronização executada pela Apify."
      >
        {collections.length > 0 && <button className="button collection-clear-all" disabled={hasActiveCollections} title={hasActiveCollections ? "Aguarde ou cancele as coletas em andamento" : "Limpar todo o histórico de coletas"} onClick={() => setClearTarget({ scope: "all" })}><Trash2 />Limpar todas</button>}
        <button className="button secondary" onClick={load}>
          <RefreshCw />
          Atualizar
        </button>
      </PageHead>
      <section className="panel">
        {loading ? (
          <Loader />
        ) : collections.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Perfil</th>
                  <th>Etapas da coleta</th>
                  <th>Status</th>
                  <th>Itens</th>
                  <th>Início</th>
                  <th>Duração</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {collections.map((r) => { const expanded = expandedCollections.includes(String(r.id)); const completed = r.children.filter((child: AnyObj) => child.status === "succeeded").length; return (
                  <Fragment key={r.id}>
                  <tr className={expanded ? "collection-row expanded" : "collection-row"}>
                    <td>
                      <b>@{r.username}</b>
                    </td>
                    <td>
                      {r.isBatch ? <button className="collection-toggle" onClick={() => toggleCollection(String(r.id))} aria-expanded={expanded}><div><b>Lote completo</b><small>{completed} de {r.children.length} etapas finalizadas</small></div><ChevronRight className={expanded ? "expanded" : ""}/></button> : <div className="collection-kind"><b>{stepName(r.collection_type)}</b><small>{stepStatus(r.status)}</small></div>}
                    </td>
                    <td>
                      <Badge status={r.status} />
                    </td>
                    <td>
                      {r.isBatch ? r.items : (typeof r.result_summary === "string" ? JSON.parse(r.result_summary || "{}").itemsProcessed : r.result_summary?.itemsProcessed) || r.requested_posts_limit}
                    </td>
                    <td>{date(r.started_at || r.created_at)}</td>
                    <td>
                      {r.duration_seconds ? `${r.duration_seconds}s` : "—"}
                    </td>
                    <td>
                      <div className="row-actions">
                        {["pending", "running"].includes(r.status) && (
                          <>
                            <button
                              className="icon-btn"
                              onClick={() => r.isBatch ? batchAction(r, "refresh") : action(r.id, "refresh")}
                              title="Atualizar"
                            >
                              <RefreshCw />
                            </button>
                            <button
                              className="icon-btn danger"
                              onClick={() => r.isBatch ? batchAction(r, "abort") : action(r.id, "abort")}
                              title="Cancelar"
                            >
                              <X />
                            </button>
                          </>
                        )}
                        {!r.isBatch && ["failed", "aborted", "timed_out"].includes(
                          r.status,
                        ) && (
                          <button
                            className="button tiny"
                            onClick={() => action(r.id, "retry")}
                          >
                            Reexecutar
                          </button>
                        )}
                        {!["pending", "running"].includes(r.status) && <button className="icon-btn danger" onClick={() => setClearTarget(r)} title="Limpar esta coleta" aria-label={`Limpar coleta de @${r.username}`}><Trash2 /></button>}
                      </div>
                    </td>
                  </tr>
                  {r.isBatch && expanded && <tr className="collection-detail-row"><td colSpan={7}><div className="collection-detail-component"><div className="collection-detail-head"><div><span>DETALHES DO LOTE</span><b>Acompanhamento por tipo de conteúdo</b></div><small>Atualização automática a cada 5 segundos</small></div><div className="collection-detail-grid">{["profile_details", "posts", "stories"].map(type => { const child = r.children.find((item: AnyObj) => item.collection_type === type); const status = child?.status || "pending"; return <article className={`collection-detail-card ${status}`} key={type}><div className="collection-detail-title"><i/><div><b>{stepName(type)}</b><span>{stepStatus(status)}</span></div><Badge status={status}/></div><dl><div><dt>Itens processados</dt><dd>{processedItems(child)}</dd></div><div><dt>Início</dt><dd>{child ? date(child.started_at || child.created_at) : "—"}</dd></div><div><dt>Duração</dt><dd>{child?.duration_seconds ? `${child.duration_seconds}s` : status === "running" ? "Em processamento" : "—"}</dd></div></dl>{child?.error_message && <p>{child.error_message}</p>}</article>; })}</div></div></td></tr>}
                  </Fragment>
                );})}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            icon={Clock3}
            title="Nenhuma coleta executada"
            description="Inicie uma coleta pela tela de perfis para acompanhar o processamento aqui."
          />
        )}
      </section>
      {clearTarget && <div className="modal-wrap" role="dialog" aria-modal="true" aria-labelledby="clear-collection-title"><div className="backdrop" onClick={() => !clearing && setClearTarget(null)} /><div className="modal collection-clear-modal"><div className="collection-clear-icon"><Trash2 /></div><span className="eyebrow">LIMPAR HISTÓRICO</span><h2 id="clear-collection-title">{clearTarget.scope === "all" ? "Limpar todas as coletas?" : "Limpar esta coleta?"}</h2><p>{clearTarget.scope === "all" ? "Todo o histórico de execuções e lotes será removido da tela." : `O registro da coleta de @${clearTarget.username} será removido da tela.`}</p><div className="collection-preserve-note"><ShieldCheck /><span><b>Seus dados serão preservados</b>Perfis, grupos, publicações, métricas e dashboards não serão apagados.</span></div><div className="modal-actions"><button type="button" className="button ghost" disabled={clearing} onClick={() => setClearTarget(null)}>Cancelar</button><button type="button" className="button collection-confirm-clear" disabled={clearing} onClick={confirmClear}><Trash2 />{clearing ? "Limpando…" : clearTarget.scope === "all" ? "Limpar todas" : "Limpar coleta"}</button></div></div></div>}
    </>
  );
}

function Groups() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<AnyObj[]>([]);
  const [profiles, setProfiles] = useState<AnyObj[]>([]);
  const [form, setForm] = useState({ name: "", description: "", profileIds: [] as number[] });
  const [editing, setEditing] = useState<AnyObj | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const load = useCallback(() => Promise.all([
    api.get("/comparison-groups").then((r) => setGroups(r.data)),
    api.get("/profiles", { params: { limit: 100 } }).then((r) => setProfiles(r.data.data)),
  ]), []);
  useEffect(() => {
    load();
  }, [load]);
  const toggle = (ids: number[], id: number) => ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];
  async function add(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true); setMessage("");
    try {
      await api.post("/comparison-groups", form);
      setForm({ name: "", description: "", profileIds: [] });
      setMessage("Grupo criado com sucesso.");
      await load();
    } catch (error) { setMessage(errorMessage(error)); } finally { setSaving(false); }
  }
  async function openEditor(group: AnyObj) {
    setMessage("");
    try { const { data } = await api.get(`/comparisons/${group.id}`); setEditing({ ...data.group, profileIds: data.profiles.map((profile: AnyObj) => Number(profile.id)) }); }
    catch (error) { setMessage(errorMessage(error)); }
  }
  async function saveGroup(e: FormEvent) {
    e.preventDefault(); if (!editing) return; setSaving(true); setMessage("");
    try { await api.put(`/comparison-groups/${editing.id}`, { name: editing.name, description: editing.description || "", profileIds: editing.profileIds }); setEditing(null); setMessage("Grupo atualizado com sucesso."); await load(); }
    catch (error) { setMessage(errorMessage(error)); } finally { setSaving(false); }
  }
  function compare(group: AnyObj) { const ids=String(group.profile_ids||"").split(",").map(Number).filter(Number.isInteger); if(ids.length>=2)navigate(`/comparisons?profileIds=${ids.join(",")}`); }
  return (
    <>
      <PageHead
        eyebrow="ORGANIZAÇÃO"
        title="Grupos de comparação"
        description="Organize perfis por segmento, região ou estratégia."
      />
      <div className="grid aside-grid">
        <form className="panel quick-form" onSubmit={add}>
          <span className="eyebrow">NOVO GRUPO</span>
          <h2>Criar grupo</h2>
          <label>
            Nome
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex.: Concorrentes diretos"
            />
          </label>
          <label>Descrição <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Objetivo ou segmento do grupo" rows={3}/></label>
          <div className="group-form-profiles"><span>Perfis do grupo</span>{profiles.length?<div>{profiles.map(profile=><button type="button" className={form.profileIds.includes(Number(profile.id))?'selected':''} key={profile.id} onClick={()=>setForm({...form,profileIds:toggle(form.profileIds,Number(profile.id))})}><span>{String(profile.username||'?')[0].toUpperCase()}{profile.profile_picture_url&&<img src={`/api/media/profiles/${profile.id}/picture`} alt="" onError={event=>{event.currentTarget.style.display='none'}}/>}</span><b>@{profile.username}</b>{form.profileIds.includes(Number(profile.id))&&<Check/>}</button>)}</div>:<small>Cadastre perfis antes de criar um grupo.</small>}</div>
          <button className="button primary wide" disabled={saving || !form.name.trim()}>
            <Plus />
            {saving ? "Salvando…" : "Criar grupo"}
          </button>
        </form>
        <section className="panel">
          {groups.length ? (
            <div className="group-list">
              {groups.map((g) => (
                <article className="group-row" key={g.id}>
                  <div className="group-icon">
                    <FolderKanban />
                  </div>
                  <div className="group-row-copy">
                    <b>{g.name}</b>
                    <small>{g.description || "Sem descrição"}</small>
                  </div>
                  <span className={Number(g.profile_count)>=2?'ready':''}>{g.profile_count} {Number(g.profile_count)===1?'perfil':'perfis'}</span>
                  <div className="group-row-actions"><button className="button ghost" onClick={()=>openEditor(g)}><Settings/>Gerenciar</button><button className="button primary" disabled={Number(g.profile_count)<2} title={Number(g.profile_count)<2?'Adicione pelo menos dois perfis ao grupo':'Abrir comparação'} onClick={()=>compare(g)}>Comparar<ChevronRight/></button></div>
                  <button
                    className="icon-btn danger"
                    aria-label={`Excluir grupo ${g.name}`}
                    onClick={async () => {
                      if (!window.confirm(`Excluir o grupo “${g.name}”?`)) return;
                      await api.delete(`/comparison-groups/${g.id}`);
                      load();
                    }}
                  >
                    <Trash2 />
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <Empty
              icon={FolderKanban}
              title="Nenhum grupo criado"
              description="Crie grupos para guardar comparações recorrentes."
            />
          )}
        </section>
      </div>
      {message&&<div className="group-message"><Check/>{message}</div>}
      {editing&&<div className="modal-wrap" role="dialog" aria-modal="true" aria-labelledby="group-editor-title"><div className="backdrop" onClick={()=>setEditing(null)}/><form className="modal group-editor-modal" onSubmit={saveGroup}><div className="modal-head"><div><span className="eyebrow">GERENCIAR GRUPO</span><h2 id="group-editor-title">Editar comparação</h2><p>Escolha as contas que devem fazer parte deste conjunto.</p></div><button type="button" className="icon-btn" onClick={()=>setEditing(null)} aria-label="Fechar"><X/></button></div><label>Nome<input value={editing.name} onChange={e=>setEditing({...editing,name:e.target.value})}/></label><label>Descrição<textarea rows={3} value={editing.description||""} onChange={e=>setEditing({...editing,description:e.target.value})} placeholder="Objetivo ou segmento do grupo"/></label><div className="group-editor-profiles"><div><b>Perfis selecionados</b><span>{editing.profileIds.length} de {profiles.length}</span></div>{profiles.map(profile=>{const selected=editing.profileIds.includes(Number(profile.id));return <button type="button" className={selected?'selected':''} key={profile.id} onClick={()=>setEditing({...editing,profileIds:toggle(editing.profileIds,Number(profile.id))})}><span className="group-profile-avatar">{String(profile.username||'?')[0].toUpperCase()}{profile.profile_picture_url&&<img src={`/api/media/profiles/${profile.id}/picture`} alt="" onError={event=>{event.currentTarget.style.display='none'}}/>}</span><span><b>@{profile.username}</b><small>{profile.internal_name||profile.full_name||'Perfil monitorado'}</small></span><i>{selected?<Check/>:<Plus/>}</i></button>})}</div><div className="group-editor-hint">{editing.profileIds.length<2?<><Users/>Selecione ao menos dois perfis para habilitar a comparação.</>:<><Check/>Grupo pronto para comparar.</>}</div><div className="modal-actions"><button type="button" className="button ghost" onClick={()=>setEditing(null)}>Cancelar</button><button className="button primary" disabled={saving||!String(editing.name).trim()}>{saving?'Salvando…':'Salvar alterações'}</button></div></form></div>}
    </>
  );
}
function SettingsPage() {
  const storedUser=JSON.parse(localStorage.getItem('studek_user')||'{}');
  const [settings,setSettings]=useState<AnyObj|null>(null);const [keys,setKeys]=useState({openai:'',anthropic:''});const [loading,setLoading]=useState(true);const [saving,setSaving]=useState(false);const [testing,setTesting]=useState(false);const [message,setMessage]=useState('');const [error,setError]=useState('');
  const [emailSettings,setEmailSettings]=useState<AnyObj|null>(null);const [emailPassword,setEmailPassword]=useState('');const [emailTestTo,setEmailTestTo]=useState(storedUser.email||'');const [emailSaving,setEmailSaving]=useState(false);const [emailTesting,setEmailTesting]=useState(false);const [emailMessage,setEmailMessage]=useState('');const [emailError,setEmailError]=useState('');
  const load=useCallback(async()=>{setLoading(true);try{const [aiResponse,emailResponse]=await Promise.all([api.get('/ai/settings'),api.get('/email/settings')]);setSettings(aiResponse.data);setEmailSettings(emailResponse.data)}catch(e){setError(errorMessage(e))}finally{setLoading(false)}},[]);useEffect(()=>{load()},[load]);
  async function saveAi(){if(!settings)return;setSaving(true);setError('');setMessage('');try{const response=await api.put('/ai/settings',{enabled:Boolean(settings.enabled),provider:settings.provider,openaiModel:settings.openaiModel,anthropicModel:settings.anthropicModel,openaiApiKey:keys.openai||undefined,anthropicApiKey:keys.anthropic||undefined});setSettings(response.data);setKeys({openai:'',anthropic:''});setMessage('Configuração de IA salva com segurança.')}catch(e){setError(errorMessage(e))}finally{setSaving(false)}}
  async function testConnection(){if(!settings)return;setTesting(true);setError('');setMessage('');const provider=settings.provider as 'openai'|'anthropic';try{const response=await api.post('/ai/settings/test',{provider,model:provider==='openai'?settings.openaiModel:settings.anthropicModel,apiKey:keys[provider]||undefined});setSettings({...settings,lastTestedAt:response.data.testedAt});setMessage(`Conexão com ${provider==='openai'?'OpenAI':'Claude'} validada. Salve para manter qualquer chave nova.`)}catch(e){setError(errorMessage(e))}finally{setTesting(false)}}
  function emailPayload(){return{...emailSettings,password:emailPassword||undefined}}
  async function saveEmail(){if(!emailSettings)return;setEmailSaving(true);setEmailError('');setEmailMessage('');try{const response=await api.put('/email/settings',emailPayload());setEmailSettings(response.data);setEmailPassword('');setEmailMessage('Configuração de e-mail salva com segurança.')}catch(e){setEmailError(errorMessage(e))}finally{setEmailSaving(false)}}
  async function testEmail(){if(!emailSettings||!emailTestTo)return;setEmailTesting(true);setEmailError('');setEmailMessage('');try{const response=await api.post('/email/settings/test',{...emailPayload(),testTo:emailTestTo});setEmailSettings({...emailSettings,lastTestedAt:response.data.testedAt});setEmailMessage(`Mensagem de teste enviada para ${emailTestTo}. Salve para manter qualquer senha nova.`)}catch(e){setEmailError(errorMessage(e))}finally{setEmailTesting(false)}}
  return (
    <>
      <PageHead
        eyebrow="SISTEMA"
        title="Configurações"
        description="Integrações, segurança e inteligência estratégica da plataforma."
      />
      <section className="panel ai-settings-panel">
        <div className="ai-settings-head"><div className="setting-icon"><BrainCircuit/></div><div><span className="eyebrow">INTELIGÊNCIA ARTIFICIAL</span><h2>Análise estratégica do perfil base</h2><p>Conecte OpenAI ou Claude para comparar conteúdos, formatos, hashtags e horários dos concorrentes e gerar um plano de marketing, social media e mídia paga.</p></div>{settings&&<label className="ai-toggle"><input type="checkbox" checked={Boolean(settings.enabled)} onChange={e=>setSettings({...settings,enabled:e.target.checked})}/><span/><b>{settings.enabled?'IA ativa':'IA desativada'}</b></label>}</div>
        {loading?<div className="settings-loading"><RefreshCw/>Carregando configuração…</div>:settings&&<div className="ai-settings-body">
          <div className="ai-provider-picker" role="radiogroup" aria-label="Provedor de inteligência artificial"><button type="button" role="radio" aria-checked={settings.provider==='openai'} className={settings.provider==='openai'?'selected':''} onClick={()=>setSettings({...settings,provider:'openai'})}><Sparkles/><span><b>OpenAI</b><small>{settings.openaiConfigured?'Chave configurada':'Aguardando chave da API'}</small></span>{settings.provider==='openai'&&<Check/>}</button><button type="button" role="radio" aria-checked={settings.provider==='anthropic'} className={settings.provider==='anthropic'?'selected':''} onClick={()=>setSettings({...settings,provider:'anthropic'})}><BrainCircuit/><span><b>Claude</b><small>{settings.anthropicConfigured?'Chave configurada':'Aguardando chave da API'}</small></span>{settings.provider==='anthropic'&&<Check/>}</button></div>
          <div className="ai-fields"><label><span>Modelo</span><input list={`${settings.provider}-models`} value={settings.provider==='openai'?settings.openaiModel:settings.anthropicModel} onChange={e=>setSettings({...settings,[settings.provider==='openai'?'openaiModel':'anthropicModel']:e.target.value})}/><small>O campo é editável para aceitar novos modelos.</small></label><datalist id="openai-models"><option value="gpt-5.6-sol"/><option value="gpt-5.6-terra"/><option value="gpt-5.6-luna"/></datalist><datalist id="anthropic-models"><option value="claude-sonnet-4-6"/><option value="claude-opus-4-6"/><option value="claude-haiku-4-5"/></datalist><label><span><KeyRound/> Chave da API</span><input type="password" autoComplete="off" data-1p-ignore data-lpignore="true" spellCheck={false} value={keys[settings.provider as 'openai'|'anthropic']} onChange={e=>setKeys({...keys,[settings.provider]:e.target.value})} placeholder={settings[`${settings.provider}Configured`]?'•••••••••••••••• (já configurada)':'Cole a chave do provedor'}/><small>Deixe vazio para manter a chave atual. Ela nunca é enviada de volta ao navegador.</small></label></div>
          <div className="ai-security-note"><ShieldCheck/><div><b>Credencial protegida</b><span>A chave é criptografada no servidor e usada somente nas solicitações iniciadas por você.</span></div></div>
          {error&&<div className="settings-feedback error">{error}</div>}{message&&<div className="settings-feedback success"><Check/>{message}</div>}
          <div className="ai-settings-actions"><span>{settings.lastTestedAt?`Último teste: ${date(settings.lastTestedAt)}`:'Conexão ainda não testada'}</span><button type="button" className="button ghost" onClick={testConnection} disabled={testing}>{testing?<RefreshCw/>:<Zap/>}{testing?'Testando…':'Testar conexão'}</button><button type="button" className="button primary" onClick={saveAi} disabled={saving}>{saving?<RefreshCw/>:<Save/>}{saving?'Salvando…':'Salvar configuração'}</button></div>
        </div>}
      </section>
      <section className="panel email-settings-panel">
        <div className="ai-settings-head"><div className="setting-icon email-icon"><Mail/></div><div><span className="eyebrow">E-MAIL E NOTIFICAÇÕES</span><h2>Servidor de envio SMTP</h2><p>Configure o remetente usado para mensagens de acesso, redefinição de senha, relatórios e avisos enviados aos usuários cadastrados.</p></div>{emailSettings&&<label className="ai-toggle"><input type="checkbox" checked={Boolean(emailSettings.enabled)} onChange={e=>setEmailSettings({...emailSettings,enabled:e.target.checked})}/><span/><b>{emailSettings.enabled?'Envio ativo':'Envio desativado'}</b></label>}</div>
        {loading?<div className="settings-loading"><RefreshCw/>Carregando configuração…</div>:emailSettings&&<div className="email-settings-body">
          <div className="email-fields-grid"><label><span>Servidor SMTP</span><input value={emailSettings.host} onChange={e=>setEmailSettings({...emailSettings,host:e.target.value})} placeholder="smtp.seudominio.com"/></label><label><span>Porta</span><input type="number" min="1" max="65535" value={emailSettings.port} onChange={e=>setEmailSettings({...emailSettings,port:Number(e.target.value)})}/></label><label><span>Segurança</span><select value={emailSettings.secure?'tls':emailSettings.requireTls?'starttls':'none'} onChange={e=>setEmailSettings({...emailSettings,secure:e.target.value==='tls',requireTls:e.target.value==='starttls'})}><option value="starttls">STARTTLS (recomendado)</option><option value="tls">SSL/TLS</option><option value="none">Sem criptografia</option></select></label><label><span>Usuário SMTP</span><input value={emailSettings.user} onChange={e=>setEmailSettings({...emailSettings,user:e.target.value})} placeholder="usuario@seudominio.com"/></label><label><span><KeyRound/> Senha SMTP</span><input type="password" autoComplete="new-password" value={emailPassword} onChange={e=>setEmailPassword(e.target.value)} placeholder={emailSettings.passwordConfigured?'•••••••••••• (já configurada)':'Informe a senha SMTP'}/><small>Deixe vazio para manter a senha atual.</small></label></div>
          <div className="email-section-title"><b>Identidade do remetente</b><span>Dados exibidos na caixa de entrada dos usuários.</span></div>
          <div className="email-sender-grid"><label><span>Nome do remetente</span><input value={emailSettings.fromName} onChange={e=>setEmailSettings({...emailSettings,fromName:e.target.value})} placeholder="Studek Analytics"/></label><label><span>E-mail do remetente</span><input type="email" value={emailSettings.fromAddress} onChange={e=>setEmailSettings({...emailSettings,fromAddress:e.target.value})} placeholder="notificacoes@seudominio.com"/></label><label><span>Responder para (opcional)</span><input type="email" value={emailSettings.replyTo} onChange={e=>setEmailSettings({...emailSettings,replyTo:e.target.value})} placeholder="suporte@seudominio.com"/></label></div>
          <div className="email-section-title"><b>Tipos de mensagem</b><span>Defina quais comunicações poderão utilizar este servidor.</span></div>
          <div className="email-notification-grid"><label className={emailSettings.notifyPasswords?'selected':''}><input type="checkbox" checked={Boolean(emailSettings.notifyPasswords)} onChange={e=>setEmailSettings({...emailSettings,notifyPasswords:e.target.checked})}/><KeyRound/><span><b>Acesso e senhas</b><small>Convites e links seguros de definição ou redefinição de senha.</small></span><i>{emailSettings.notifyPasswords&&<Check/>}</i></label><label className={emailSettings.notifyReports?'selected':''}><input type="checkbox" checked={Boolean(emailSettings.notifyReports)} onChange={e=>setEmailSettings({...emailSettings,notifyReports:e.target.checked})}/><Download/><span><b>Relatórios</b><small>Relatórios concluídos e arquivos disponibilizados pelo sistema.</small></span><i>{emailSettings.notifyReports&&<Check/>}</i></label><label className={emailSettings.notifySystem?'selected':''}><input type="checkbox" checked={Boolean(emailSettings.notifySystem)} onChange={e=>setEmailSettings({...emailSettings,notifySystem:e.target.checked})}/><Activity/><span><b>Notificações</b><small>Alertas de coletas, integrações e eventos importantes.</small></span><i>{emailSettings.notifySystem&&<Check/>}</i></label></div>
          <div className="ai-security-note"><ShieldCheck/><div><b>Senha protegida</b><span>A senha SMTP é criptografada no servidor e nunca é retornada ao navegador.</span></div></div>
          {emailError&&<div className="settings-feedback error">{emailError}</div>}{emailMessage&&<div className="settings-feedback success"><Check/>{emailMessage}</div>}
          <div className="email-settings-actions"><span>{emailSettings.lastTestedAt?`Último envio: ${date(emailSettings.lastTestedAt)}`:'Nenhum e-mail de teste enviado'}</span><div className="email-test-field"><Mail/><input type="email" value={emailTestTo} onChange={e=>setEmailTestTo(e.target.value)} placeholder="Destinatário do teste"/></div><button type="button" className="button ghost" onClick={testEmail} disabled={emailTesting||!emailTestTo}>{emailTesting?<RefreshCw/>:<Send/>}{emailTesting?'Enviando…':'Enviar teste'}</button><button type="button" className="button primary" onClick={saveEmail} disabled={emailSaving}>{emailSaving?<RefreshCw/>:<Save/>}{emailSaving?'Salvando…':'Salvar e-mail'}</button></div>
        </div>}
      </section>
      <div className="grid two">
        <section className="panel settings-card">
          <div className="setting-icon">
            <ShieldCheck />
          </div>
          <h2>Segurança</h2>
          <p>
            A autenticação JWT está ativa e as senhas são protegidas com hash
            bcrypt.
          </p>
          <span className="status-ok">
            <i /> Proteções ativas
          </span>
        </section>
        <section className="panel settings-card">
          <div className="setting-icon">
            <Zap />
          </div>
          <h2>Integração Apify</h2>
          <p>
            O token é configurado exclusivamente no servidor por variável de
            ambiente.
          </p>
          <span className="status-info">Configure APIFY_TOKEN no ambiente</span>
        </section>
      </div>
    </>
  );
}

function Protected() {
  const token=localStorage.getItem("studek_token");
  const [user,setUser]=useState<AnyObj|null>(()=>{try{return JSON.parse(localStorage.getItem('studek_user')||'null')}catch{return null}});
  const [checking,setChecking]=useState(Boolean(token&&user?.role!=='admin'&&!Array.isArray(user?.permissions)));
  useEffect(()=>{if(!token)return;let active=true;api.get('/auth/me').then(({data})=>{if(!active)return;localStorage.setItem('studek_user',JSON.stringify(data));setUser(data)}).catch(()=>{}).finally(()=>active&&setChecking(false));return()=>{active=false}},[token]);
  if(!token)return <Navigate to="/login"/>;
  if(checking)return <Loader/>;
  const allowed=(permission:string)=>user?.role==='admin'||user?.permissions?.includes(permission);
  const firstRoute=[...navItems,...adminNavItems].find(([, , ,permission])=>allowed(permission))?.[0]||'/login';
  const route=(permission:string,element:ReactNode)=>allowed(permission)?element:<Navigate to={firstRoute} replace/>;
  return (
    <Shell>
      <Routes>
        <Route path="/dashboard" element={route('dashboard',<StrategyDashboard/>)} />
        <Route path="/profiles" element={route('profiles',<Profiles/>)} />
        <Route path="/profiles/:id" element={route('profiles',<ContentDashboard/>)} />
        <Route path="/posts/:id" element={route('profiles',<PostDetail/>)} />
        <Route path="/comparisons" element={route('comparisons',<ComparisonDashboard/>)} />
        <Route path="/comparison-groups" element={route('comparison_groups',<Groups/>)} />
        <Route path="/collections" element={route('collections',<Collections/>)} />
        <Route path="/settings" element={route('settings',<SettingsPage/>)} />
        <Route path="/system-users" element={route('system_users',<SystemUsersPage/>)} />
        <Route path="/access-profiles" element={route('access_profiles',<AccessProfilesPage/>)} />
        <Route path="*" element={<Navigate to={firstRoute} replace/>} />
      </Routes>
    </Shell>
  );
}
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/*" element={<Protected />} />
    </Routes>
  );
}
