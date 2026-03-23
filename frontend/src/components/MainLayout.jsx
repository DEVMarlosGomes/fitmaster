import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { Button } from "../components/ui/button";
import { ScrollArea } from "../components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "../components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Badge } from "../components/ui/badge";
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

const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "FM";

function Brand({ compact = false }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex h-11 w-11 items-center justify-center rounded-[1.15rem] border border-primary/20 bg-gradient-to-br from-primary/20 via-sky-400/10 to-blue-500/15 shadow-[0_18px_36px_-26px_rgba(34,211,238,0.7)]">
        <div className="absolute inset-[1px] rounded-[1rem] bg-background/70" />
        <Dumbbell className="relative z-[1] h-5 w-5 text-primary" strokeWidth={1.7} />
      </div>
      {!compact && (
        <div className="min-w-0">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.26em] text-muted-foreground">
            High Performance
          </p>
          <p className="truncate text-lg font-black uppercase tracking-[-0.04em] gradient-text">
            FitMaster
          </p>
        </div>
      )}
    </div>
  );
}

function ThemeToggle({ theme, toggleTheme }) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      className="h-10 gap-2 rounded-full px-3"
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      <span className="hidden sm:inline">{theme === "dark" ? "Modo Claro" : "Modo Escuro"}</span>
    </Button>
  );
}

function NavItem({ link, active, compact = false, onClick }) {
  return (
    <Link
      to={link.href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`sidebar-link group flex items-center gap-3 rounded-[1.05rem] border px-3 py-3 transition-all ${
        active
          ? "nav-active border-primary/20 text-foreground"
          : "border-transparent text-muted-foreground hover:border-border/70 hover:bg-secondary/45 hover:text-foreground"
      } ${compact ? "justify-center px-2.5" : ""}`}
      title={compact ? link.label : undefined}
    >
      <link.icon
        className={`h-5 w-5 shrink-0 transition-transform group-hover:scale-[1.06] ${
          active ? "text-primary" : ""
        }`}
        strokeWidth={active ? 2 : 1.7}
      />
      {!compact && <span className="truncate text-sm font-medium">{link.label}</span>}
      {!compact && active && <ChevronRight className="ml-auto h-4 w-4 text-primary" />}
    </Link>
  );
}

function UserMenu({ user, theme, toggleTheme, logout, compact = false }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={`h-11 gap-3 rounded-full px-2.5 sm:px-3 ${compact ? "w-11 justify-center px-0" : ""}`}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-blue-500/10 text-sm font-bold text-primary">
            {getInitials(user?.name)}
          </div>
          {!compact && (
            <div className="hidden min-w-0 text-left sm:block">
              <p className="truncate text-sm font-semibold">{user?.name?.split(" ")[0]}</p>
              <p className="truncate text-[11px] text-muted-foreground">{user?.email}</p>
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="px-3 py-3">
          <p className="font-semibold">{user?.name}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={toggleTheme} className="cursor-pointer">
          {theme === "dark" ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
          {theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-400 focus:text-red-400">
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const MainLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const isPersonal = user?.role === "personal";
  const currentPersonalLink = getCurrentLink(personalLinks, location.pathname);
  const currentStudentLink = getCurrentLink(studentLinks, location.pathname);

  if (isPersonal) {
    return (
      <div className="app-shell bg-background">
        <div className="mx-auto flex min-h-screen max-w-[1750px] gap-4 px-3 pb-4 pt-3 sm:px-4 lg:gap-5 lg:px-5 lg:pb-5 lg:pt-5">
          <aside
            className={`premium-panel hidden lg:flex lg:min-h-[calc(100vh-2.5rem)] lg:flex-col lg:rounded-[2rem] lg:p-3 ${
              sidebarCollapsed ? "lg:w-[96px]" : "lg:w-[296px]"
            }`}
          >
            <div className="flex items-center justify-between rounded-[1.5rem] px-3 py-3">
              <Link to="/dashboard">
                <Brand compact={sidebarCollapsed} />
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full"
                onClick={() => setSidebarCollapsed((prev) => !prev)}
              >
                {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
            </div>

            <div className={`premium-soft mt-2 rounded-[1.6rem] px-3 py-3 ${sidebarCollapsed ? "text-center" : ""}`}>
              <div className={`flex items-center gap-3 ${sidebarCollapsed ? "justify-center" : ""}`}>
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-blue-500/10 text-sm font-bold text-primary">
                  {getInitials(user?.name)}
                </div>
                {!sidebarCollapsed && (
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{user?.name}</p>
                    <p className="truncate text-xs text-muted-foreground">Personal trainer</p>
                  </div>
                )}
              </div>
              {!sidebarCollapsed && (
                <div className="mt-3 flex items-center justify-between gap-2">
                  <Badge variant="outline">Painel Pro</Badge>
                  <span className="text-[11px] text-muted-foreground">Studio OS</span>
                </div>
              )}
            </div>

            <ScrollArea className="mt-4 flex-1">
              <nav className="space-y-1.5 pr-1">
                {personalLinks.map((link) => (
                  <NavItem
                    key={link.href}
                    link={link}
                    active={location.pathname === link.href}
                    compact={sidebarCollapsed}
                  />
                ))}
              </nav>
            </ScrollArea>

            <div className="mt-4 space-y-2 border-t border-border/60 pt-4">
              <Link
                to="/notificacoes"
                className={`sidebar-link flex items-center gap-3 rounded-[1.05rem] border border-transparent px-3 py-3 text-muted-foreground transition-all hover:border-border/70 hover:bg-secondary/45 hover:text-foreground ${
                  sidebarCollapsed ? "justify-center px-2.5" : ""
                }`}
                title={sidebarCollapsed ? "Notificacoes" : undefined}
              >
                <Bell className="h-5 w-5 shrink-0" strokeWidth={1.7} />
                {!sidebarCollapsed && <span className="text-sm font-medium">Notificacoes</span>}
              </Link>
              <button
                onClick={logout}
                className={`sidebar-link flex w-full items-center gap-3 rounded-[1.05rem] border border-transparent px-3 py-3 text-red-400 transition-all hover:border-red-400/20 hover:bg-red-500/10 ${
                  sidebarCollapsed ? "justify-center px-2.5" : ""
                }`}
                title={sidebarCollapsed ? "Sair" : undefined}
              >
                <LogOut className="h-5 w-5 shrink-0" strokeWidth={1.7} />
                {!sidebarCollapsed && <span className="text-sm font-medium">Sair</span>}
              </button>
            </div>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="sticky top-3 z-40">
              <div className="premium-panel-strong rounded-[1.85rem] px-4 py-3 sm:px-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                      <SheetTrigger asChild>
                        <Button variant="outline" size="icon" className="h-11 w-11 rounded-full lg:hidden">
                          <Menu className="h-5 w-5" />
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="left" className="w-[320px] max-w-[calc(100vw-1rem)] p-0">
                        <div className="flex h-full flex-col p-4">
                          <div className="premium-soft rounded-[1.5rem] p-4">
                            <Brand />
                            <div className="mt-4 flex items-center gap-3">
                              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-blue-500/10 text-sm font-bold text-primary">
                                {getInitials(user?.name)}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold">{user?.name}</p>
                                <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                              </div>
                            </div>
                          </div>

                          <ScrollArea className="mt-4 flex-1 pr-1">
                            <nav className="space-y-1.5">
                              {personalLinks.map((link) => (
                                <NavItem
                                  key={link.href}
                                  link={link}
                                  active={location.pathname === link.href}
                                  onClick={() => setMobileMenuOpen(false)}
                                />
                              ))}
                            </nav>
                          </ScrollArea>

                          <div className="mt-4 space-y-2 border-t border-border/60 pt-4">
                            <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
                            <Button
                              variant="outline"
                              className="w-full justify-start text-red-400 hover:border-red-400/20 hover:bg-red-500/10 hover:text-red-300"
                              onClick={() => {
                                logout();
                                setMobileMenuOpen(false);
                              }}
                            >
                              <LogOut className="h-4 w-4" />
                              Sair
                            </Button>
                          </div>
                        </div>
                      </SheetContent>
                    </Sheet>

                    <div className="hidden lg:block">
                      <p className="label-uppercase text-primary">
                        {currentPersonalLink?.label || "Cockpit"}
                      </p>
                      <h1 className="truncate text-xl font-black tracking-[-0.04em]">
                        Operacao FitMaster
                      </h1>
                    </div>

                    <div className="lg:hidden">
                      <Brand compact />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link to="/notificacoes">
                      <Button variant="outline" size="icon" className="h-11 w-11 rounded-full">
                        <Bell className="h-5 w-5" />
                      </Button>
                    </Link>
                    <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
                    <UserMenu user={user} theme={theme} toggleTheme={toggleTheme} logout={logout} compact />
                  </div>
                </div>
              </div>
            </header>

            <main className="flex-1 px-1 pb-2 pt-4 sm:px-0 sm:pb-4 sm:pt-5">
              <div className="mx-auto max-w-[1480px]">{children}</div>
            </main>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell bg-background">
      <div className="mx-auto flex min-h-screen max-w-[1720px] gap-4 px-3 pb-24 pt-3 sm:px-4 lg:gap-5 lg:px-5 lg:pb-5 lg:pt-5">
        <aside className="premium-panel hidden xl:flex xl:min-h-[calc(100vh-2.5rem)] xl:w-[292px] xl:flex-col xl:rounded-[2rem] xl:p-3">
          <div className="rounded-[1.5rem] px-3 py-3">
            <Link to="/treino">
              <Brand />
            </Link>
          </div>

          <div className="premium-soft mt-2 rounded-[1.6rem] px-3 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-blue-500/10 text-sm font-bold text-primary">
                {getInitials(user?.name)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{user?.name}</p>
                <p className="truncate text-xs text-muted-foreground">Aluno FitMaster</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <Badge variant="outline">Aluno Pro</Badge>
              <span className="text-[11px] text-muted-foreground">{currentStudentLink?.label || "Jornada"}</span>
            </div>
          </div>

          <ScrollArea className="mt-4 flex-1">
            <nav className="space-y-1.5 pr-1">
              {studentLinks.map((link) => (
                <NavItem key={link.href} link={link} active={location.pathname === link.href} />
              ))}
            </nav>
          </ScrollArea>

          <div className="mt-4 space-y-2 border-t border-border/60 pt-4">
            <Link
              to="/notificacoes"
              className="sidebar-link flex items-center gap-3 rounded-[1.05rem] border border-transparent px-3 py-3 text-muted-foreground transition-all hover:border-border/70 hover:bg-secondary/45 hover:text-foreground"
            >
              <Bell className="h-5 w-5 shrink-0" strokeWidth={1.7} />
              <span className="text-sm font-medium">Notificacoes</span>
            </Link>
            <button
              onClick={logout}
              className="sidebar-link flex w-full items-center gap-3 rounded-[1.05rem] border border-transparent px-3 py-3 text-red-400 transition-all hover:border-red-400/20 hover:bg-red-500/10"
            >
              <LogOut className="h-5 w-5 shrink-0" strokeWidth={1.7} />
              <span className="text-sm font-medium">Sair</span>
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-3 z-40">
            <div className="premium-panel-strong rounded-[1.85rem] px-4 py-3 sm:px-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="icon" className="h-11 w-11 rounded-full xl:hidden">
                        <Menu className="h-5 w-5" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[320px] max-w-[calc(100vw-1rem)] p-0">
                      <div className="flex h-full flex-col p-4">
                        <div className="premium-soft rounded-[1.5rem] p-4">
                          <Brand />
                          <div className="mt-4 flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-blue-500/10 text-sm font-bold text-primary">
                              {getInitials(user?.name)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-semibold">{user?.name}</p>
                              <p className="truncate text-xs text-muted-foreground">Aluno FitMaster</p>
                            </div>
                          </div>
                          <div className="mt-4 flex gap-2">
                            <Badge variant="outline">Premium mode</Badge>
                            <Badge variant="secondary">{currentStudentLink?.label || "Treino"}</Badge>
                          </div>
                        </div>

                        <ScrollArea className="mt-4 flex-1 pr-1">
                          <nav className="space-y-1.5">
                            {studentLinks.map((link) => (
                              <NavItem
                                key={link.href}
                                link={link}
                                active={location.pathname === link.href}
                                onClick={() => setMobileMenuOpen(false)}
                              />
                            ))}
                          </nav>
                        </ScrollArea>

                        <div className="mt-4 space-y-2 border-t border-border/60 pt-4">
                          <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
                          <Button
                            variant="outline"
                            className="w-full justify-start text-red-400 hover:border-red-400/20 hover:bg-red-500/10 hover:text-red-300"
                            onClick={() => {
                              logout();
                              setMobileMenuOpen(false);
                            }}
                          >
                            <LogOut className="h-4 w-4" />
                            Sair
                          </Button>
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>

                  <div className="sm:hidden xl:hidden">
                    <Brand compact />
                  </div>

                  <div className="hidden min-w-0 sm:block">
                    <p className="label-uppercase text-primary">{currentStudentLink?.label || "Jornada"}</p>
                    <h1 className="truncate text-xl font-black tracking-[-0.04em]">Area do Aluno</h1>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link to="/notificacoes">
                    <Button variant="outline" size="icon" className="h-11 w-11 rounded-full">
                      <Bell className="h-5 w-5" />
                    </Button>
                  </Link>
                  <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
                  <div className="hidden sm:block">
                    <UserMenu user={user} theme={theme} toggleTheme={toggleTheme} logout={logout} />
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 px-1 pb-2 pt-4 sm:px-0 sm:pb-4 sm:pt-5">
            <div className="mx-auto max-w-[1480px]">{children}</div>
          </main>
        </div>

        <nav className="mobile-dock fixed inset-x-3 bottom-3 z-40 rounded-[1.7rem] px-3 py-2 md:hidden">
          <div className="grid grid-cols-4 gap-1.5">
            {studentDockLinks.map((link) => {
              const active = location.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`flex flex-col items-center gap-1 rounded-[1.15rem] px-2 py-2 text-center transition-all ${
                    active ? "nav-active text-foreground" : "text-muted-foreground"
                  }`}
                >
                  <link.icon className={`h-4 w-4 ${active ? "text-primary" : ""}`} />
                  <span className="text-[11px] font-semibold">{link.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
};
