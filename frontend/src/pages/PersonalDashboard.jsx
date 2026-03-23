import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { MainLayout } from "../components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Users,
  Dumbbell,
  TrendingUp,
  Plus,
  Upload,
  ChevronRight,
  Target,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "../lib/api";
import { toast } from "sonner";

const statCards = [
  {
    key: "students_count",
    label: "Alunos ativos",
    accent: "text-primary",
    icon: Users,
    href: "/alunos",
  },
  {
    key: "workouts_count",
    label: "Treinos ativos",
    accent: "text-cyan-400",
    icon: Dumbbell,
    href: "/treinos",
  },
  {
    key: "recent_progress",
    label: "Progressos em 7 dias",
    accent: "text-emerald-400",
    icon: TrendingUp,
    href: "/evolucao",
  },
];

const actionCards = [
  {
    title: "Upload inteligente de treino",
    description: "Envie planilhas ou rotinas com um fluxo mais elegante e pronto para escalar sua operacao.",
    href: "/treinos",
    icon: Upload,
    cta: "Abrir treinos",
  },
  {
    title: "Monitoramento premium da evolucao",
    description: "Acompanhe consistencia, carga, adesao e progresso visual dos seus alunos em uma unica camada.",
    href: "/evolucao",
    icon: Target,
    cta: "Ver evolucao",
  },
];

export default function PersonalDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ students_count: 0, workouts_count: 0, recent_progress: 0 });
  const [recentStudents, setRecentStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [statsRes, studentsRes] = await Promise.all([api.get("/stats/personal"), api.get("/students")]);
      setStats(statsRes.data);
      setRecentStudents((studentsRes.data || []).slice(0, 5));
    } catch (error) {
      toast.error("Erro ao carregar dashboard");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in" data-testid="personal-dashboard">
        <section className="page-hero p-6 sm:p-8 lg:p-10">
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)] xl:items-end">
            <div>
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <Badge variant="outline">Studio command center</Badge>
                <Badge variant="secondary">
                  <Sparkles className="mr-1 h-3.5 w-3.5" />
                  Rebranding premium
                </Badge>
              </div>

              <p className="label-uppercase text-primary">Cockpit do personal</p>
              <h1 className="mt-2 text-4xl font-black uppercase tracking-[-0.07em] text-white sm:text-5xl lg:text-6xl">
                Ola, <span className="gradient-text">{user?.name?.split(" ")[0]}</span>
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Centralize operacao, acompanhamento e entrega com uma interface mais sofisticada, responsiva e
                pronta para alto volume.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/alunos">
                  <Button
                    variant="outline"
                    className="w-full gap-2 rounded-[1.1rem] sm:w-auto"
                    data-testid="add-student-btn"
                  >
                    <Plus className="h-4 w-4" />
                    Novo aluno
                  </Button>
                </Link>
                <Link to="/treinos">
                  <Button className="w-full gap-2 rounded-[1.1rem] sm:w-auto" data-testid="upload-workout-btn">
                    <Upload className="h-4 w-4" />
                    Estruturar treino
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              {statCards.map((card) => (
                <Link key={card.key} to={card.href}>
                  <div className="metric-tile h-full rounded-[1.5rem] p-4 transition-all hover:-translate-y-1 hover:border-primary/25">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="label-uppercase">{card.label}</p>
                        <p className="stat-number mt-2 text-4xl text-white">{stats[card.key] || 0}</p>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-[1rem] bg-white/5">
                        <card.icon className={`h-6 w-6 ${card.accent}`} strokeWidth={1.7} />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <Card className="bento-card">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <p className="label-uppercase">Relacionamento</p>
                <CardTitle className="mt-2 text-2xl font-black uppercase tracking-[-0.05em]">
                  Alunos recentes
                </CardTitle>
              </div>
              <Link to="/alunos">
                <Button variant="ghost" size="sm" className="rounded-full">
                  Ver todos
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="h-9 w-9 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                </div>
              ) : recentStudents.length === 0 ? (
                <div className="metric-tile rounded-[1.5rem] px-5 py-10 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Users className="h-8 w-8 text-primary" strokeWidth={1.5} />
                  </div>
                  <p className="text-lg font-semibold">Nenhum aluno cadastrado</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Comece adicionando seu primeiro aluno para estruturar o studio.
                  </p>
                  <Link to="/alunos" className="mt-5 inline-flex">
                    <Button variant="outline" className="rounded-[1rem]">
                      <Plus className="h-4 w-4" />
                      Adicionar aluno
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentStudents.map((student, index) => (
                    <Link
                      key={student.id}
                      to={`/treinos?student=${student.id}`}
                      className="group flex items-center justify-between gap-3 rounded-[1.35rem] border border-border/60 bg-secondary/35 px-4 py-4 transition-all hover:-translate-y-1 hover:border-primary/20 hover:bg-secondary/55"
                      style={{ animationDelay: `${index * 50}ms` }}
                      data-testid={`student-item-${student.id}`}
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-[1rem] bg-gradient-to-br from-primary/18 to-blue-500/10 text-sm font-bold text-primary">
                          {student.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{student.name}</p>
                          <p className="truncate text-sm text-muted-foreground">{student.email}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" />
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            {actionCards.map((card) => (
              <Card key={card.title} className="bento-card h-full">
                <CardContent className="flex h-full flex-col justify-between">
                  <div>
                    <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-[1.15rem] bg-primary/12 text-primary">
                      <card.icon className="h-6 w-6" strokeWidth={1.6} />
                    </div>
                    <h3 className="text-2xl font-black tracking-[-0.05em]">{card.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">{card.description}</p>
                  </div>

                  <Link to={card.href} className="mt-6 inline-flex">
                    <Button variant="outline" className="rounded-[1rem]">
                      {card.cta}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
