import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useNotifications } from "../contexts/NotificationContext";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { ScrollArea } from "../components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "../components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import {
  Dumbbell,
  Users,
  LayoutDashboard,
  TrendingUp,
  Bell,
  LogOut,
  Menu,
  ChevronRight,
  ChevronLeft,
  Upload,
  MessageCircle,
  Sun,
  Moon,
  Trophy,
  ClipboardList,
  BookOpen,
  DollarSign,
  FolderOpen,
  CalendarCheck,
  Camera,
  Activity,
  FileSpreadsheet,
  ClipboardCheck,
} from "lucide-react";
import { BRAND } from "../lib/brand";
import { ProfilePhotoDialog } from "./ProfilePhotoDialog";
import { UserAvatar } from "./UserAvatar";

const personalLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/alunos", label: "Alunos", icon: Users },
  { href: "/rotinas", label: "Rotinas", icon: FolderOpen },
  { href: "/treinos", label: "Treinos", icon: Upload },
  { href: "/importar", label: "Importar", icon: FileSpreadsheet },
  { href: "/biblioteca", label: "Exercicios", icon: BookOpen },
  { href: "/avaliacoes", label: "Avaliacoes", icon: ClipboardList },
  { href: "/frequencia", label: "Frequencia", icon: CalendarCheck },
  { href: "/fotos-evolucao", label: "Fotos", icon: Camera },
  { href: "/periodizacao", label: "Periodizacao", icon: Activity },
  { href: "/financeiro", label: "Financeiro", icon: DollarSign },
  { href: "/evolucao", label: "Evolucao", icon: TrendingUp },
  { href: "/relatos", label: "Relatos", icon: ClipboardCheck },
  { href: "/conquistas", label: "Ranking", icon: Trophy },
  { href: "/chat", label: "Chat", icon: MessageCircle },
];

const studentLinks = [
  { href: "/treino", label: "Meu Treino", icon: Dumbbell },
  { href: "/meu-relato", label: "Relato Semanal", icon: ClipboardCheck },
  { href: "/meu-progresso", label: "Evolucao", icon: TrendingUp },
  { href: "/minhas-avaliacoes", label: "Avaliacoes", icon: ClipboardList },
  { href: "/periodizacao", label: "Periodizacao", icon: Activity },
  { href: "/frequencia", label: "Check-in", icon: CalendarCheck },
  { href: "/fotos-evolucao", label: "Fotos", icon: Camera },
  { href: "/meu-financeiro", label: "Mensalidade", icon: DollarSign },
  { href: "/conquistas", label: "Conquistas", icon: Trophy },
  { href: "/chat", label: "Chat", icon: MessageCircle },
];

const studentDockLinks = [
  { href: "/treino", label: "Treino", icon: Dumbbell },
  { href: "/meu-relato", label: "Relato", icon: ClipboardCheck },
  { href: "/meu-progresso", label: "Evolucao", icon: TrendingUp },
  { href: "/chat", label: "Chat", icon: MessageCircle },
];

const getCurrentLink = (links, pathname) =>
  links.find((link) => pathname === link.href) ||
  links.find((link) => pathname.startsWith(link.href) && link.href !== "/") ||
  null;

/* ─── Brand mark: ícone azul compacto para uso na sidebar ─── */
function SidebarBrandMark() {
  return (
    <img
      src="/brand/rogerio-costa-mark.png"
      alt="RC"
      className="h-8 w-auto object-contain"
      decoding="async"
    />
  );
}

/* ─── Logo completo para uso em headers e mobile ─── */
function SidebarBrandFull({ theme }) {
  return (
    <img
      src={theme === "light" ? "/brand/rogerio-costa-logo-light.png" : "/brand/rogerio-costa-logo-dark.png"}
      alt="Rogério Costa"
      className="h-9 w-auto max-w-[160px] object-contain"
      decoding="async"
      onError={(e) => {
        // Fallback to dark logo if light version doesn't exist
        e.target.src = "/brand/rogerio-costa-logo-dark.png";
      }}
    />
  );
}

/* ─── Notification Bell with badge ─── */
function NotificationBell({ theme }) {
  const { unreadCount } = useNotifications();
  const capped = unreadCount > 99 ? "99+" : unreadCount;

  return (
    <Link to="/notificacoes">
      <button
        id="notifications-btn"
        aria-label={`Notificações${unreadCount > 0 ? ` – ${capped} não lidas` : ""}`}
        className={`relative flex h-9 w-9 items-center justify-center rounded-xl transition hover:text-primary ${
          theme === "light"
            ? "border border-black/8 text-foreground/50 hover:border-primary/30 hover:bg-primary/8"
            : "border border-white/8 text-white/50 hover:border-primary/40 hover:bg-primary/10"
        }`}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none text-white"
            style={{ background: "#ef4444", boxShadow: "0 0 0 2px var(--header-bg)" }}
          >
            {capped}
          </span>
        )}
      </button>
    </Link>
  );
}

/* ─── Premium Theme Toggle ─── */
function ThemeToggle({ theme, toggleTheme }) {
  return (
    <button
      id="theme-toggle-btn"
      onClick={toggleTheme}
      title={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
      aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
      className="theme-toggle"
      style={{ width: "2.25rem", height: "2.25rem" }}
    >
      <span
        key={theme}
        className="animate-theme-switch flex items-center justify-center"
      >
        {theme === "dark" ? (
          <Sun className="h-4 w-4" strokeWidth={1.8} />
        ) : (
          <Moon className="h-4 w-4" strokeWidth={1.8} />
        )}
      </span>
    </button>
  );
}

function NavItem({ link, active, compact = false, onClick, theme }) {
  return (
    <Link
      to={link.href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      title={compact ? link.label : undefined}
      className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
        compact ? "justify-center px-2.5" : ""
      } ${
        active
          ? "bg-primary text-white shadow-[0_4px_20px_-4px_rgba(0,129,253,0.50)]"
          : theme === "light"
          ? "text-foreground/50 hover:bg-black/5 hover:text-foreground/90"
          : "text-white/45 hover:bg-white/6 hover:text-white/90"
      }`}
    >
      <link.icon
        className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${
          active ? "text-white" : ""
        }`}
        strokeWidth={active ? 2.2 : 1.8}
      />
      {!compact && (
        <span className="truncate tracking-wide">{link.label}</span>
      )}
      {!compact && active && (
        <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-70" />
      )}
    </Link>
  );
}

function UserMenu({ user, theme, toggleTheme, logout, onOpenProfilePhoto }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          id="user-menu-trigger"
          className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 transition-all ${
            theme === "light"
              ? "border border-black/8 bg-black/4 hover:border-black/14 hover:bg-black/7"
              : "border border-white/8 bg-white/4 hover:border-white/16 hover:bg-white/8"
          }`}
        >
          <UserAvatar
            name={user?.name}
            photoUrl={user?.profile_photo_url}
            size="sm"
            className="rounded-xl"
            fallbackClassName="rounded-xl"
          />
          <div className="hidden min-w-0 text-left sm:block">
            <p className="truncate text-[13px] font-semibold leading-tight text-foreground/90">
              {user?.name?.split(" ")[0]}
            </p>
            <p className="truncate text-[11px] leading-tight text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        id="user-menu-content"
        className={`w-64 rounded-2xl p-2 shadow-2xl ${
          theme === "light"
            ? "border border-black/8 bg-white"
            : "border border-white/8 bg-[#0a0a0a]"
        }`}
      >
        <div className={`flex items-center gap-3 rounded-xl px-3 py-3 ${
          theme === "light" ? "bg-black/4" : "bg-white/4"
        }`}>
          <UserAvatar
            name={user?.name}
            photoUrl={user?.profile_photo_url}
            className="rounded-xl"
            fallbackClassName="rounded-xl"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground/90">{user?.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>
        <DropdownMenuSeparator className="my-2" />
        <DropdownMenuItem
          onClick={toggleTheme}
          id="theme-menu-item"
          className="cursor-pointer rounded-xl px-3 py-2.5 text-sm text-foreground/70 hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary"
        >
          {theme === "dark" ? (
            <Sun className="mr-2.5 h-4 w-4" />
          ) : (
            <Moon className="mr-2.5 h-4 w-4" />
          )}
          {theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
        </DropdownMenuItem>
        <DropdownMenuSeparator className="my-2" />
        <DropdownMenuItem
          onClick={onOpenProfilePhoto}
          className="cursor-pointer rounded-xl px-3 py-2.5 text-sm text-foreground/70 hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary"
        >
          <Camera className="mr-2.5 h-4 w-4" />
          Foto de perfil
        </DropdownMenuItem>
        <DropdownMenuSeparator className="my-2" />
        <DropdownMenuItem
          onClick={logout}
          id="logout-menu-item"
          className="cursor-pointer rounded-xl px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 focus:bg-red-500/10 focus:text-red-300"
        >
          <LogOut className="mr-2.5 h-4 w-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ═══════════════════════════════════════════════════════════
   SIDEBAR CONTENT — compartilhado para desktop e mobile
═══════════════════════════════════════════════════════════ */
function SidebarContent({ links, user, location, compact, onLinkClick, logout, theme, toggleTheme, role }) {
  return (
    <div
      className="flex h-full flex-col sidebar-container"
      style={{
        background: "var(--sidebar-bg)",
        borderRight: "1px solid var(--sidebar-border)",
      }}
    >
      {/* ── Logo ── */}
      <div
        className={`flex items-center px-4 py-4 ${compact ? "justify-center" : "gap-3"}`}
        style={{ borderBottom: "1px solid var(--sidebar-border)" }}
      >
        {compact ? (
          <SidebarBrandMark />
        ) : (
          <SidebarBrandFull theme={theme} />
        )}
      </div>

      {/* ── User card ── */}
      <div
        className={`mx-3 mt-3 rounded-2xl p-3 sidebar-user-card ${compact ? "flex justify-center" : ""}`}
      >
        <div className={`flex items-center gap-3 ${compact ? "justify-center" : ""}`}>
          <UserAvatar
            name={user?.name}
            photoUrl={user?.profile_photo_url}
            className="rounded-xl"
            fallbackClassName="rounded-xl"
          />
          {!compact && (
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-foreground/90 leading-tight">
                {user?.name?.split(" ")[0]}
              </p>
              <p className="truncate text-[11px] text-muted-foreground leading-tight mt-0.5">
                {role === "personal" ? "Treinador" : "Aluno"}
              </p>
            </div>
          )}
        </div>
        {!compact && (
          <div className="mt-2.5 flex items-center gap-1.5">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: "#22c55e" }}
            />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              Ativo
            </span>
            <span className="ml-auto text-[10px] text-muted-foreground/40">{BRAND.role}</span>
          </div>
        )}
      </div>

      {/* ── Navigation ── */}
      <ScrollArea className="mt-3 flex-1 px-2">
        <nav className="space-y-0.5 pb-4">
          {links.map((link) => (
            <NavItem
              key={link.href}
              link={link}
              active={location.pathname === link.href}
              compact={compact}
              onClick={onLinkClick}
              theme={theme}
            />
          ))}
        </nav>
      </ScrollArea>

      {/* ── Footer actions ── */}
      <div
        className="mx-3 mb-3 space-y-0.5 rounded-2xl p-2"
        style={{
          background: "var(--surface-soft)",
          border: "1px solid var(--sidebar-border)",
        }}
      >
        <Link
          to="/notificacoes"
          onClick={onLinkClick}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary ${compact ? "justify-center" : ""}`}
          title={compact ? "Notificações" : undefined}
        >
          <Bell className="h-4 w-4 shrink-0" strokeWidth={1.8} />
          {!compact && <span className="tracking-wide">Notificacoes</span>}
        </Link>
        <button
          onClick={logout}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-400/70 transition-all hover:bg-red-500/10 hover:text-red-400 ${compact ? "justify-center" : ""}`}
          title={compact ? "Sair" : undefined}
        >
          <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.8} />
          {!compact && <span className="tracking-wide">Sair</span>}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN LAYOUT EXPORT
═══════════════════════════════════════════════════════════ */
export const MainLayout = ({ children }) => {
  const { user, logout, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isProfilePhotoDialogOpen, setIsProfilePhotoDialogOpen] = useState(false);

  const isPersonal = user?.role === "personal";
  const currentLink = isPersonal
    ? getCurrentLink(personalLinks, location.pathname)
    : getCurrentLink(studentLinks, location.pathname);

  useEffect(() => {
    if (user?.role === "student" && user?.should_prompt_profile_photo) {
      setIsProfilePhotoDialogOpen(true);
    }
  }, [user?.role, user?.should_prompt_profile_photo]);

  const headerStyle = {
    background: "var(--header-bg)",
    borderBottom: "1px solid var(--header-border)",
    backdropFilter: "blur(20px) saturate(140%)",
  };

  if (isPersonal) {
    return (
      <>
        <div
          className="flex min-h-dvh"
          style={{ background: "hsl(var(--background))" }}
        >
          {/* ── Desktop Sidebar ── */}
          <aside
            className={`hidden lg:flex lg:flex-col lg:shrink-0 transition-all duration-300 ease-in-out ${
              sidebarCollapsed ? "lg:w-[72px]" : "lg:w-[260px]"
            }`}
            style={{
              position: "sticky",
              top: 0,
              height: "100vh",
              overflowY: "auto",
            }}
          >
            <SidebarContent
              links={personalLinks}
              user={user}
              location={location}
              compact={sidebarCollapsed}
              onLinkClick={undefined}
              logout={logout}
              theme={theme}
              toggleTheme={toggleTheme}
              role="personal"
            />
          </aside>

          {/* ── Main content area ── */}
          <div className="flex flex-1 flex-col min-w-0">
            {/* ── Top Header ── */}
            <header
              id="app-header"
              className="sticky top-0 z-40 flex items-center justify-between gap-3 px-4 py-2.5 sm:px-5 sm:py-3"
              style={headerStyle}
            >
              <div className="flex items-center gap-3">
                {/* Mobile menu trigger */}
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <button
                      id="mobile-menu-btn"
                      className={`flex h-9 w-9 items-center justify-center rounded-xl transition lg:hidden ${
                        theme === "light"
                          ? "border border-black/8 text-foreground/60 hover:border-black/14 hover:text-foreground"
                          : "border border-white/8 text-white/60 hover:border-white/16 hover:text-white"
                      }`}
                    >
                      <Menu className="h-4 w-4" />
                    </button>
                  </SheetTrigger>
                  <SheetContent
                    side="left"
                    className="w-[280px] max-w-[calc(100vw-2rem)] border-0 p-0"
                    style={{ background: "transparent" }}
                  >
                    <SidebarContent
                      links={personalLinks}
                      user={user}
                      location={location}
                      compact={false}
                      onLinkClick={() => setMobileMenuOpen(false)}
                      logout={logout}
                      theme={theme}
                      toggleTheme={toggleTheme}
                      role="personal"
                    />
                  </SheetContent>
                </Sheet>

                {/* Collapse toggle (desktop only) */}
                <button
                  id="sidebar-collapse-btn"
                  onClick={() => setSidebarCollapsed((p) => !p)}
                  className={`hidden h-9 w-9 items-center justify-center rounded-xl transition lg:flex ${
                    theme === "light"
                      ? "border border-black/8 text-foreground/40 hover:border-black/14 hover:text-foreground"
                      : "border border-white/8 text-white/40 hover:border-white/16 hover:text-white"
                  }`}
                  title={sidebarCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
                >
                  {sidebarCollapsed ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronLeft className="h-4 w-4" />
                  )}
                </button>

                {/* Page breadcrumb */}
                <div className="hidden sm:block">
                  <p
                    className="text-[10px] font-bold uppercase tracking-[0.20em]"
                    style={{ color: "#0081fd" }}
                  >
                    {BRAND.name}
                  </p>
                  <h1
                    className="text-base font-bold leading-tight text-foreground/90 sm:text-lg"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "-0.01em" }}
                  >
                    {currentLink?.label || "Painel do Treinador"}
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <NotificationBell theme={theme} />
                <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
                <UserMenu
                  user={user}
                  theme={theme}
                  toggleTheme={toggleTheme}
                  logout={logout}
                  onOpenProfilePhoto={() => setIsProfilePhotoDialogOpen(true)}
                />
              </div>
            </header>

            {/* ── Page content ── */}
            <main className="flex-1 overflow-auto">
              <div className="mx-auto max-w-[1440px] px-4 py-5 sm:px-5 sm:py-6 lg:px-8">
                {children}
              </div>
            </main>
          </div>
        </div>
        <ProfilePhotoDialog
          open={isProfilePhotoDialogOpen}
          onOpenChange={setIsProfilePhotoDialogOpen}
          user={user}
          onUserUpdated={updateUser}
        />
      </>
    );
  }

  // ── STUDENT LAYOUT ──
  return (
    <>
      <div className="flex min-h-dvh" style={{ background: "hsl(var(--background))" }}>
        {/* Desktop Sidebar */}
        <aside
          className="hidden xl:flex xl:flex-col xl:shrink-0 xl:w-[260px]"
          style={{ position: "sticky", top: 0, height: "100vh", overflowY: "auto" }}
        >
          <SidebarContent
            links={studentLinks}
            user={user}
            location={location}
            compact={false}
            onLinkClick={undefined}
            logout={logout}
            theme={theme}
            toggleTheme={toggleTheme}
            role="student"
          />
        </aside>

        <div className="flex flex-1 flex-col min-w-0">
          {/* Header */}
          <header
            id="student-header"
            className="sticky top-0 z-40 flex items-center justify-between gap-3 px-4 py-2.5 sm:px-5 sm:py-3"
            style={headerStyle}
          >
            <div className="flex items-center gap-3">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <button
                    id="student-mobile-menu-btn"
                    className={`flex h-9 w-9 items-center justify-center rounded-xl transition xl:hidden ${
                      theme === "light"
                        ? "border border-black/8 text-foreground/60 hover:border-black/14 hover:text-foreground"
                        : "border border-white/8 text-white/60 hover:border-white/16 hover:text-white"
                    }`}
                  >
                    <Menu className="h-4 w-4" />
                  </button>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="w-[280px] max-w-[calc(100vw-2rem)] border-0 p-0"
                  style={{ background: "transparent" }}
                >
                  <SidebarContent
                    links={studentLinks}
                    user={user}
                    location={location}
                    compact={false}
                    onLinkClick={() => setMobileMenuOpen(false)}
                    logout={logout}
                    theme={theme}
                    toggleTheme={toggleTheme}
                    role="student"
                  />
                </SheetContent>
              </Sheet>

              <div className="hidden sm:block">
                <p
                  className="text-[10px] font-bold uppercase tracking-[0.20em]"
                  style={{ color: "#0081fd" }}
                >
                  {BRAND.name}
                </p>
                <h1
                  className="text-base font-bold leading-tight text-foreground/90 sm:text-lg"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "-0.01em" }}
                >
                  {currentLink?.label || "Area do Aluno"}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <NotificationBell theme={theme} />
              <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
              <UserMenu
                user={user}
                theme={theme}
                toggleTheme={toggleTheme}
                logout={logout}
                onOpenProfilePhoto={() => setIsProfilePhotoDialogOpen(true)}
              />
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-auto pb-24 xl:pb-0">
            <div className="mx-auto max-w-[1440px] px-4 py-5 sm:px-5 sm:py-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>

        {/* ── Mobile Bottom Dock ── */}
        <nav
          id="mobile-bottom-dock"
          className="fixed inset-x-3 bottom-3 z-40 xl:hidden"
          style={{
            background: "var(--dock-bg)",
            border: "1px solid var(--dock-border)",
            borderRadius: "1.25rem",
            backdropFilter: "blur(24px) saturate(150%)",
            boxShadow: "0 16px 50px -18px var(--shadow-color)",
          }}
        >
          <div className="grid grid-cols-4 gap-1 p-2">
            {studentDockLinks.map((link) => {
              const active = location.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-center transition-all ${
                    active
                      ? "bg-primary text-white shadow-[0_2px_14px_-2px_rgba(0,129,253,0.55)]"
                      : theme === "light"
                      ? "text-foreground/40 hover:text-foreground/70"
                      : "text-white/40 hover:text-white/70"
                  }`}
                >
                  <link.icon className="h-4 w-4" strokeWidth={active ? 2.2 : 1.8} />
                  <span className="text-[10px] font-semibold tracking-wide">{link.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
      <ProfilePhotoDialog
        open={isProfilePhotoDialogOpen}
        onOpenChange={setIsProfilePhotoDialogOpen}
        user={user}
        onUserUpdated={updateUser}
        promptMode={Boolean(user?.should_prompt_profile_photo)}
      />
    </>
  );
};
