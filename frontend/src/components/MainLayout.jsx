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
import {
  Dumbbell,
  Users,
  LayoutDashboard,
  TrendingUp,
  Bell,
  LogOut,
  Menu,
  User,
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
  Settings,
  CalendarCheck,
  Camera,
  Activity,
  FileSpreadsheet
} from "lucide-react";

// Links do Personal Trainer para Sidebar
const personalLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/alunos", label: "Alunos", icon: Users },
  { href: "/rotinas", label: "Rotinas", icon: FolderOpen },
  { href: "/treinos", label: "Treinos", icon: Upload },
  { href: "/importar", label: "Importar", icon: FileSpreadsheet },
  { href: "/biblioteca", label: "Exercícios", icon: BookOpen },
  { href: "/avaliacoes", label: "Avaliações", icon: ClipboardList },
  { href: "/frequencia", label: "Frequência", icon: CalendarCheck },
  { href: "/fotos-evolucao", label: "Fotos", icon: Camera },
  { href: "/periodizacao", label: "Periodizacao", icon: Activity },
  { href: "/financeiro", label: "Financeiro", icon: DollarSign },
  { href: "/evolucao", label: "Evolução", icon: TrendingUp },
  { href: "/conquistas", label: "Ranking", icon: Trophy },
  { href: "/chat", label: "Chat", icon: MessageCircle },
];

// Links do Aluno
const studentLinks = [
  { href: "/treino", label: "Meu Treino", icon: Dumbbell },
  { href: "/meu-progresso", label: "Evolução", icon: TrendingUp },
  { href: "/minhas-avaliacoes", label: "Avaliações", icon: ClipboardList },
  { href: "/periodizacao", label: "Periodizacao", icon: Activity },
  { href: "/frequencia", label: "Check-in", icon: CalendarCheck },
  { href: "/fotos-evolucao", label: "Fotos", icon: Camera },
  { href: "/meu-financeiro", label: "Mensalidade", icon: DollarSign },
  { href: "/conquistas", label: "Conquistas", icon: Trophy },
  { href: "/chat", label: "Chat", icon: MessageCircle },
];

// Links principais para aluno (navbar horizontal)
const studentMainLinks = [
  { href: "/treino", label: "Treino", icon: Dumbbell },
  { href: "/meu-progresso", label: "Evolução", icon: TrendingUp },
  { href: "/periodizacao", label: "Periodizacao", icon: Activity },
  { href: "/frequencia", label: "Check-in", icon: CalendarCheck },
  { href: "/meu-financeiro", label: "Mensalidade", icon: DollarSign },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/conquistas", label: "Conquistas", icon: Trophy },
];

export const MainLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const isPersonal = user?.role === "personal";

  // ==================== LAYOUT PARA PERSONAL (COM SIDEBAR) ====================
  if (isPersonal) {
    return (
      <div className="min-h-screen bg-background flex">
        {/* Sidebar Fixa - Desktop */}
        <aside className={`hidden lg:flex flex-col border-r border-white/5 bg-card/40 backdrop-blur-xl transition-all duration-300 ${sidebarCollapsed ? 'w-[72px]' : 'w-[260px]'}`}>
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-white/5">
            <Link to="/dashboard" className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                <Dumbbell className="w-5 h-5 text-primary" strokeWidth={1.5} />
              </div>
              {!sidebarCollapsed && (
                <span className="text-lg font-black tracking-tight uppercase gradient-text">
                  FitMaster
                </span>
              )}
            </Link>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-muted-foreground hover:text-primary"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </Button>
          </div>

          {/* Nav Links */}
          <ScrollArea className="flex-1 py-4">
            <nav className="px-3 space-y-1">
              {personalLinks.map((link) => {
                const isActive = location.pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={`sidebar-link flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                      isActive
                        ? "bg-primary/15 text-primary font-semibold border-l-2 border-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    } ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
                    title={sidebarCollapsed ? link.label : ''}
                  >
                    <link.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-primary' : ''}`} strokeWidth={isActive ? 2 : 1.5} />
                    {!sidebarCollapsed && <span className="text-sm">{link.label}</span>}
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>

          {/* Bottom Section */}
          <div className="p-3 border-t border-white/5 space-y-1">
            <Link
              to="/notificacoes"
              className={`sidebar-link flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
              title={sidebarCollapsed ? 'Notificações' : ''}
            >
              <Bell className="w-5 h-5" strokeWidth={1.5} />
              {!sidebarCollapsed && <span className="text-sm">Notificações</span>}
            </Link>
            <button
              onClick={logout}
              className={`sidebar-link flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-red-400 hover:bg-red-500/10 transition-all ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
              title={sidebarCollapsed ? 'Sair' : ''}
            >
              <LogOut className="w-5 h-5" strokeWidth={1.5} />
              {!sidebarCollapsed && <span className="text-sm">Sair</span>}
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Header */}
          <header className="sticky top-0 z-50 h-16 border-b border-white/5 bg-background/60 backdrop-blur-2xl">
            <div className="h-full px-4 lg:px-8 flex items-center justify-between">
              {/* Mobile Menu + Logo */}
              <div className="flex items-center gap-3 lg:hidden">
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="hover:bg-white/5">
                      <Menu className="w-5 h-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[280px] glass-strong border-white/5 p-0">
                    <ScrollArea className="h-full">
                      <div className="p-5">
                        {/* Logo */}
                        <div className="flex items-center gap-3 mb-6 pb-5 border-b border-white/10">
                          <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                            <Dumbbell className="w-5 h-5 text-primary" strokeWidth={1.5} />
                          </div>
                          <span className="text-lg font-black tracking-tight uppercase gradient-text">
                            FitMaster
                          </span>
                        </div>

                        {/* User Info */}
                        <div className="flex items-center gap-3 mb-6 pb-5 border-b border-white/10">
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
                            <User className="w-5 h-5 text-primary" strokeWidth={1.5} />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{user?.name}</p>
                            <p className="text-xs text-muted-foreground">Personal Trainer</p>
                          </div>
                        </div>

                        {/* Nav Links */}
                        <nav className="space-y-1">
                          {personalLinks.map((link) => {
                            const isActive = location.pathname === link.href;
                            return (
                              <Link
                                key={link.href}
                                to={link.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                                  isActive
                                    ? "bg-primary/15 text-primary font-semibold"
                                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                                }`}
                              >
                                <link.icon className="w-5 h-5" strokeWidth={isActive ? 2 : 1.5} />
                                <span className="text-sm">{link.label}</span>
                              </Link>
                            );
                          })}
                        </nav>

                        {/* Divider */}
                        <div className="my-5 border-t border-white/10" />

                        {/* Bottom Links */}
                        <Link
                          to="/notificacoes"
                          onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/5"
                      >
                          <Bell className="w-5 h-5" strokeWidth={1.5} />
                          <span className="text-sm">Notificações</span>
                        </Link>
                        <button
                          onClick={() => { logout(); setMobileMenuOpen(false); }}
                          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-red-400 hover:bg-red-500/10 mt-1"
                        >
                          <LogOut className="w-5 h-5" strokeWidth={1.5} />
                          <span className="text-sm">Sair</span>
                        </button>
                      </div>
                    </ScrollArea>
                  </SheetContent>
                </Sheet>

                <Link to="/dashboard" className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
                    <Dumbbell className="w-4 h-4 text-primary" strokeWidth={1.5} />
                  </div>
                  <span className="text-base font-black tracking-tight uppercase gradient-text">
                    FitMaster
                  </span>
                </Link>
              </div>

              {/* Page Title (Desktop) */}
              <div className="hidden lg:block">
                <p className="label-uppercase text-primary">
                  {personalLinks.find(l => l.href === location.pathname)?.label || ''}
                </p>
              </div>

              {/* Right Section */}
              <div className="flex items-center gap-2">
                {/* Theme Toggle */}
                <Button variant="ghost" size="icon" onClick={toggleTheme} className="hover:bg-white/5">
                  {theme === "dark" ? <Sun className="w-5 h-5" strokeWidth={1.5} /> : <Moon className="w-5 h-5" strokeWidth={1.5} />}
                </Button>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-2 hover:bg-white/5">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" strokeWidth={1.5} />
                      </div>
                      <span className="hidden sm:inline text-sm font-medium">{user?.name?.split(' ')[0]}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="glass-strong border-white/10 w-56">
                    <div className="px-3 py-3">
                      <p className="font-semibold">{user?.name}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem onClick={toggleTheme} className="cursor-pointer">
                      {theme === "dark" ? <Sun className="w-4 h-4 mr-2" strokeWidth={1.5} /> : <Moon className="w-4 h-4 mr-2" strokeWidth={1.5} />}
                      {theme === "dark" ? "Modo Claro" : "Modo Escuro"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem onClick={logout} className="text-red-400 focus:text-red-400 cursor-pointer">
                      <LogOut className="w-4 h-4 mr-2" strokeWidth={1.5} />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    );
  }

  // ==================== LAYOUT PARA ALUNO (NAVBAR SIMPLES) ====================
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-background/60 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/treino" className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                <Dumbbell className="w-5 h-5 text-primary" strokeWidth={1.5} />
              </div>
              <span className="text-xl font-black tracking-tight uppercase gradient-text hidden sm:block">
                FitMaster
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {studentMainLinks.map((link) => {
                const isActive = location.pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                      isActive
                        ? "bg-primary/15 text-primary font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    }`}
                  >
                    <link.icon className="w-4 h-4" strokeWidth={isActive ? 2 : 1.5} />
                    <span className="text-sm">{link.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right Section */}
            <div className="flex items-center gap-2">
              {/* Theme Toggle */}
              <Button variant="ghost" size="icon" onClick={toggleTheme} className="hover:bg-white/5">
                {theme === "dark" ? <Sun className="w-5 h-5" strokeWidth={1.5} /> : <Moon className="w-5 h-5" strokeWidth={1.5} />}
              </Button>

              {/* Notifications */}
              <Link to="/notificacoes">
                <Button variant="ghost" size="icon" className="relative hover:bg-white/5">
                  <Bell className="w-5 h-5" strokeWidth={1.5} />
                </Button>
              </Link>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 hidden sm:flex hover:bg-white/5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" strokeWidth={1.5} />
                    </div>
                    <span className="text-sm font-medium">{user?.name?.split(' ')[0]}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="glass-strong border-white/10 w-56">
                  <div className="px-3 py-3">
                    <p className="font-semibold">{user?.name}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem onClick={toggleTheme} className="cursor-pointer">
                    {theme === "dark" ? <Sun className="w-4 h-4 mr-2" strokeWidth={1.5} /> : <Moon className="w-4 h-4 mr-2" strokeWidth={1.5} />}
                    {theme === "dark" ? "Modo Claro" : "Modo Escuro"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem onClick={logout} className="text-red-400 focus:text-red-400 cursor-pointer">
                    <LogOut className="w-4 h-4 mr-2" strokeWidth={1.5} />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile Menu */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden hover:bg-white/5">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px] glass-strong border-white/5 p-0">
                  <ScrollArea className="h-full">
                    <div className="p-6">
                      {/* User Info */}
                      <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/10">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
                          <User className="w-6 h-6 text-primary" strokeWidth={1.5} />
                        </div>
                        <div>
                          <p className="font-semibold">{user?.name}</p>
                          <p className="text-xs text-muted-foreground">Aluno</p>
                        </div>
                      </div>

                      {/* Nav Links */}
                      <nav className="space-y-1">
                        {studentLinks.map((link) => {
                          const isActive = location.pathname === link.href;
                          return (
                            <Link
                              key={link.href}
                              to={link.href}
                              onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                              isActive
                                ? "bg-primary/15 text-primary font-semibold"
                                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                            }`}
                          >
                              <link.icon className="w-5 h-5" strokeWidth={isActive ? 2 : 1.5} />
                              <span className="text-sm">{link.label}</span>
                              {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                            </Link>
                          );
                        })}
                      </nav>

                      {/* Notifications */}
                      <Link
                        to="/notificacoes"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 mt-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
                      >
                        <Bell className="w-5 h-5" strokeWidth={1.5} />
                        <span className="text-sm">Notificações</span>
                      </Link>

                      {/* Logout */}
                      <button
                        onClick={() => { logout(); setMobileMenuOpen(false); }}
                        className="flex items-center gap-3 px-4 py-3 mt-6 w-full rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
                      >
                        <LogOut className="w-5 h-5" strokeWidth={1.5} />
                        <span className="text-sm">Sair</span>
                      </button>
                    </div>
                  </ScrollArea>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};
