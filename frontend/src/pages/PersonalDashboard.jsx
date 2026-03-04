import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { MainLayout } from "../components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Users, Dumbbell, TrendingUp, Plus, Upload, ChevronRight, Zap, Target, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../lib/api";
import { toast } from "sonner";

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
      const [statsRes, studentsRes] = await Promise.all([
        api.get("/stats/personal"),
        api.get("/students")
      ]);
      setStats(statsRes.data);
      setRecentStudents(studentsRes.data.slice(0, 5));
    } catch (error) {
      toast.error("Erro ao carregar dashboard");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-8 animate-fade-in" data-testid="personal-dashboard">
        {/* Bento Grid Layout */}
        <div className="grid grid-cols-12 gap-6">
          
          {/* Hero Welcome Card - Large */}
          <div className="col-span-12 lg:col-span-8">
            <Card className="bento-card overflow-hidden h-full">
              <CardContent className="p-8 relative">
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-radial from-primary/20 to-transparent opacity-50" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-radial from-blue-600/15 to-transparent opacity-50" />
                
                <div className="relative">
                  <p className="label-uppercase text-primary mb-2">Dashboard</p>
                  <h1 className="text-4xl md:text-5xl font-black tracking-tight uppercase mb-3">
                    Olá, <span className="gradient-text">{user?.name?.split(' ')[0]}</span>
                  </h1>
                  <p className="text-muted-foreground text-lg mb-8 max-w-md">
                    Gerencie seus alunos e treinos de forma eficiente
                  </p>
                  
                  <div className="flex flex-wrap gap-3">
                    <Link to="/alunos">
                      <Button variant="outline" className="gap-2 h-11 px-5 rounded-xl border-white/10 hover:border-primary/50 hover:bg-primary/10" data-testid="add-student-btn">
                        <Plus className="w-4 h-4" />
                        Novo Aluno
                      </Button>
                    </Link>
                    <Link to="/treinos">
                      <Button className="gap-2 h-11 px-5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/25" data-testid="upload-workout-btn">
                        <Upload className="w-4 h-4" />
                        Upload Treino
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stats Column */}
          <div className="col-span-12 lg:col-span-4 grid grid-rows-3 gap-6">
            {/* Alunos */}
            <Link to="/alunos">
              <Card className="bento-card h-full cursor-pointer group" data-testid="stat-card-alunos">
                <CardContent className="p-6 flex items-center justify-between h-full">
                  <div>
                    <p className="label-uppercase mb-1">Alunos</p>
                    <p className="stat-number text-4xl text-foreground">{stats.students_count}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 group-hover:bg-primary/20 transition-colors">
                    <Users className="w-6 h-6 text-primary" strokeWidth={1.5} />
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Treinos */}
            <Link to="/treinos">
              <Card className="bento-card h-full cursor-pointer group" data-testid="stat-card-treinos">
                <CardContent className="p-6 flex items-center justify-between h-full">
                  <div>
                    <p className="label-uppercase mb-1">Treinos Ativos</p>
                    <p className="stat-number text-4xl text-foreground">{stats.workouts_count}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 group-hover:bg-cyan-500/20 transition-colors">
                    <Dumbbell className="w-6 h-6 text-cyan-400" strokeWidth={1.5} />
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Progresso */}
            <Link to="/evolucao">
              <Card className="bento-card h-full cursor-pointer group" data-testid="stat-card-progresso">
                <CardContent className="p-6 flex items-center justify-between h-full">
                  <div>
                    <p className="label-uppercase mb-1">Progresso (7 dias)</p>
                    <p className="stat-number text-4xl text-foreground">{stats.recent_progress}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
                    <TrendingUp className="w-6 h-6 text-emerald-400" strokeWidth={1.5} />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Recent Students */}
          <div className="col-span-12 lg:col-span-5">
            <Card className="bento-card h-full">
              <CardHeader className="flex flex-row items-center justify-between p-6 pb-4">
                <CardTitle className="text-lg font-bold uppercase tracking-tight">
                  Alunos Recentes
                </CardTitle>
                <Link to="/alunos">
                  <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-primary">
                    Ver todos
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : recentStudents.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-muted-foreground" strokeWidth={1.5} />
                    </div>
                    <p className="text-muted-foreground mb-4">Nenhum aluno cadastrado</p>
                    <Link to="/alunos">
                      <Button variant="outline" className="gap-2 rounded-xl">
                        <Plus className="w-4 h-4" />
                        Adicionar primeiro aluno
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentStudents.map((student, index) => (
                      <Link 
                        key={student.id}
                        to={`/treinos?student=${student.id}`}
                        className="flex items-center justify-between p-4 rounded-xl bg-secondary/20 hover:bg-secondary/40 border border-transparent hover:border-primary/20 transition-all group animate-slide-in"
                        style={{ animationDelay: `${index * 50}ms` }}
                        data-testid={`student-item-${student.id}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
                            <span className="text-primary font-bold text-sm">
                              {student.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{student.name}</p>
                            <p className="text-xs text-muted-foreground">{student.email}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="col-span-12 lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Upload Card */}
            <Card className="bento-card group overflow-hidden">
              <CardContent className="p-6 relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-radial from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 w-fit mb-4">
                  <Upload className="w-5 h-5 text-primary" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-bold mb-2 tracking-tight">Upload de Planilha</h3>
                <p className="text-sm text-muted-foreground mb-5">
                  Envie um arquivo .csv, .xls ou .xlsx com o treino completo do aluno
                </p>
                <Link to="/treinos">
                  <Button className="gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold" data-testid="quick-upload-btn">
                    <Zap className="w-4 h-4" />
                    Fazer Upload
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Progress Card */}
            <Card className="bento-card group overflow-hidden">
              <CardContent className="p-6 relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-radial from-cyan-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 w-fit mb-4">
                  <Target className="w-5 h-5 text-cyan-400" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-bold mb-2 tracking-tight">Ver Evolução</h3>
                <p className="text-sm text-muted-foreground mb-5">
                  Acompanhe o progresso dos seus alunos com gráficos detalhados
                </p>
                <Link to="/evolucao">
                  <Button variant="outline" className="gap-2 rounded-xl border-cyan-500/30 hover:bg-cyan-500/10 hover:border-cyan-500/50 text-cyan-400" data-testid="quick-progress-btn">
                    <TrendingUp className="w-4 h-4" />
                    Ver Gráficos
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </MainLayout>
  );
}
