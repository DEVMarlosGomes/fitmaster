import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MainLayout } from "../components/MainLayout";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Progress } from "../components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogBody,
} from "../components/ui/dialog";
import { Textarea } from "../components/ui/textarea";
import {
  Dumbbell,
  Calendar,
  TrendingUp,
  CheckCircle2,
  Target,
  Trophy,
  HeartPulse,
  Gauge,
  Flame,
  Repeat2,
  FileText,
  Download,
} from "lucide-react";
import api from "../lib/api";
import { BACKEND_URL } from "../lib/backend";
import { toast } from "sonner";
import { ExerciseCard } from "../components/ExerciseCard";
import { SetTracker } from "../components/SetTracker";
import { FAQChatPopup } from "../components/FAQChatPopup";

const FEELING_OPTIONS = [
  { value: "excelente", label: "Excelente" },
  { value: "bom", label: "Bom" },
  { value: "ok", label: "Ok" },
  { value: "pesado", label: "Pesado" },
  { value: "ruim", label: "Ruim" },
];

const EFFORT_SCALE_ITEMS = [
  { value: 1, label: "Minimo esforco", barClass: "from-amber-200/95 to-yellow-200/90", textClass: "text-zinc-950" },
  { value: 2, label: "", barClass: "from-amber-200/90 to-yellow-200/85", textClass: "text-zinc-900" },
  { value: 3, label: "", barClass: "from-orange-300/90 to-amber-300/85", textClass: "text-zinc-950" },
  { value: 4, label: "Muito leve", barClass: "from-orange-400/90 to-amber-400/85", textClass: "text-zinc-950" },
  { value: 5, label: "", barClass: "from-orange-500/85 to-amber-500/80", textClass: "text-white" },
  { value: 6, label: "Esforco moderado", barClass: "from-orange-600/85 to-red-500/80", textClass: "text-white" },
  { value: 7, label: "", barClass: "from-orange-700/85 to-red-500/85", textClass: "text-white" },
  { value: 8, label: "Pesado", barClass: "from-red-600/85 to-rose-500/85", textClass: "text-white" },
  { value: 9, label: "", barClass: "from-rose-600/85 to-red-600/85", textClass: "text-white" },
  { value: 10, label: "Muito pesado", barClass: "from-red-700/90 to-rose-700/90", textClass: "text-white" },
];

const RECOVERY_SCALE_ITEMS = [
  { value: 1, label: "Exausto", barClass: "from-red-700/90 to-rose-700/90", textClass: "text-white" },
  { value: 2, label: "", barClass: "from-red-600/85 to-rose-600/85", textClass: "text-white" },
  { value: 3, label: "", barClass: "from-orange-600/85 to-red-500/80", textClass: "text-white" },
  { value: 4, label: "Mal recuperado", barClass: "from-orange-500/85 to-amber-500/80", textClass: "text-white" },
  { value: 5, label: "", barClass: "from-amber-400/85 to-orange-400/80", textClass: "text-zinc-950" },
  { value: 6, label: "Pouco recuperado", barClass: "from-amber-200/90 to-orange-200/85", textClass: "text-zinc-950" },
  { value: 7, label: "", barClass: "from-slate-200/90 to-zinc-100/90", textClass: "text-zinc-950" },
  { value: 8, label: "Recuperado", barClass: "from-cyan-200/85 to-slate-100/90", textClass: "text-zinc-950" },
  { value: 9, label: "", barClass: "from-cyan-100/85 to-white/90", textClass: "text-zinc-950" },
  { value: 10, label: "Muito recuperado", barClass: "from-cyan-100/90 to-emerald-100/90", textClass: "text-zinc-950" },
];

const formatVolume = (value) =>
  Number(value || 0).toLocaleString("pt-BR", { maximumFractionDigits: 1 });

function ScaleLegendSelector({ title, subtitle, prompt, icon: Icon, value, onChange, items }) {
  const selectedItem = items.find((item) => item.value === value) || items[0];

  return (
    <div className="rounded-2xl overflow-hidden border border-border/60 bg-[#060b18] shadow-[0_10px_30px_rgba(2,6,23,0.45)]">
      <div className="bg-[#020617] px-4 py-4 border-b border-white/5">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 p-2 rounded-xl bg-primary/15 border border-primary/20">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">{title}</p>
            <h3 className="text-lg font-black text-white tracking-tight">{subtitle}</h3>
            <p className="text-xs text-zinc-400 mt-1">{prompt}</p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-primary/85 via-blue-500/80 to-cyan-400/75 px-4 py-2.5 border-b border-blue-300/15">
        <p className="text-sm font-semibold text-white/95 tracking-wide">
          Escala de 1 a 10 com legendas de referencia
        </p>
      </div>

      <div className="p-3 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.08),_transparent_55%)]">
        <div className="rounded-xl overflow-hidden border border-white/10">
          {items.map((item) => {
            const selected = item.value === value;
            return (
              <button
                key={`${title}-${item.value}`}
                type="button"
                onClick={() => onChange(item.value)}
                className={`grid w-full grid-cols-[44px,1fr,auto] items-center gap-3 px-3 py-2.5 text-left transition-all ${
                  selected
                    ? "ring-2 ring-primary/70 ring-inset shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                    : "hover:brightness-110"
                } bg-gradient-to-r ${item.barClass} border-b border-black/15 last:border-b-0`}
              >
                <span className={`text-xl font-black ${item.textClass}`}>{item.value}</span>
                <span className={`text-sm sm:text-base font-black uppercase tracking-wide ${item.textClass}`}>
                  {item.label || " "}
                </span>
                <span
                  className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${
                    selected
                      ? "bg-[#020617]/70 text-white border border-white/10"
                      : "bg-black/10 text-transparent border border-transparent"
                  }`}
                >
                  {selected ? "Atual" : "."}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
          <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Selecionado</p>
          <p className="text-sm text-zinc-200 mt-1">
            <span className="font-black text-white">{selectedItem.value}</span>
            {" - "}
            <span className="font-semibold">{selectedItem.label || "Nivel intermediario"}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  const [workout, setWorkout] = useState(null);
  const [stats, setStats] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [weeklySessions, setWeeklySessions] = useState([]);

  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [sessionNotes, setSessionNotes] = useState("");
  const [sessionFeeling, setSessionFeeling] = useState("bom");
  const [recoveryScore, setRecoveryScore] = useState(7);
  const [effortScore, setEffortScore] = useState(8);
  const [completing, setCompleting] = useState(false);
  const [lastSessionSummary, setLastSessionSummary] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 6);
      const startStr = startDate.toISOString().split("T")[0];

      const [workoutsRes, statsRes, sessionsRes, weeklyRes] = await Promise.all([
        api.get("/workouts"),
        api.get("/stats/student"),
        api.get("/workout-sessions"),
        api.get(`/workout-sessions?start_date=${startStr}`),
      ]);

      if (workoutsRes.data.length > 0) {
        setWorkout(workoutsRes.data[0]);
        if (workoutsRes.data[0].days?.length > 0) {
          setSelectedDay(workoutsRes.data[0].days[0]);
        }
      }

      setStats(statsRes.data);
      setSessions(sessionsRes.data);
      setWeeklySessions(weeklyRes.data);
    } catch (error) {
      toast.error("Erro ao carregar treino");
    } finally {
      setLoading(false);
    }
  };

  const handleExerciseClick = (exercise) => {
    setSelectedExercise(exercise);
  };

  const handleCloseExercise = () => {
    setSelectedExercise(null);
  };

  const handleProgressLogged = () => {
    toast.success("Progresso registrado");
  };

  const resetSessionForm = () => {
    setSessionNotes("");
    setSessionFeeling("bom");
    setRecoveryScore(7);
    setEffortScore(8);
  };

  const handleCompleteWorkout = async () => {
    if (!workout) return;

    setCompleting(true);
    try {
      const response = await api.post("/workout-sessions", {
        workout_id: workout.id,
        day_name: selectedDay?.day_name,
        notes: sessionNotes || null,
        feedback: sessionFeeling,
        recovery_score: recoveryScore,
        effort_score: effortScore,
        difficulty: Math.max(1, Math.min(5, Math.ceil(effortScore / 2))),
      });

      setLastSessionSummary(response.data);
      toast.success("Treino concluido");
      setIsCompleteDialogOpen(false);
      resetSessionForm();

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 6);
      const startStr = startDate.toISOString().split("T")[0];

      const [sessionsRes, weeklyRes] = await Promise.all([
        api.get("/workout-sessions"),
        api.get(`/workout-sessions?start_date=${startStr}`),
      ]);
      setSessions(sessionsRes.data);
      setWeeklySessions(weeklyRes.data);
    } catch (error) {
      toast.error("Erro ao concluir treino");
    } finally {
      setCompleting(false);
    }
  };

  const plannedExercises = selectedDay?.exercises?.length || 0;
  const plannedSets = selectedDay?.exercises?.reduce((acc, ex) => acc + (Number(ex.sets) || 0), 0) || 0;

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <FAQChatPopup />
      </MainLayout>
    );
  }

  if (!workout) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="p-6 rounded-full bg-secondary/50 mb-6">
            <Dumbbell className="w-16 h-16 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Nenhum treino disponivel</h2>
          <p className="text-muted-foreground max-w-md">
            Seu personal ainda nao enviou seu treino. Aguarde ou entre em contato.
          </p>
        </div>
        <FAQChatPopup />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in" data-testid="student-dashboard">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <Target className="w-5 h-5 text-primary mx-auto mb-2" />
              <p className="text-2xl font-black">{stats?.total_exercises || 0}</p>
              <p className="text-xs text-muted-foreground uppercase">Exercicios</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <CheckCircle2 className="w-5 h-5 text-green-400 mx-auto mb-2" />
              <p className="text-2xl font-black">{stats?.progress_logged || 0}</p>
              <p className="text-xs text-muted-foreground uppercase">Registros</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <Calendar className="w-5 h-5 text-cyan-400 mx-auto mb-2" />
              <p className="text-2xl font-black">{workout.days?.length || 0}</p>
              <p className="text-xs text-muted-foreground uppercase">Dias</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-5 h-5 text-orange-400 mx-auto mb-2" />
              <p className="text-2xl font-black">{stats?.workout_streak || 0}</p>
              <p className="text-xs text-muted-foreground uppercase">Sequencia</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <p className="font-semibold">Desafio semanal</p>
              </div>
              <span className="text-sm text-muted-foreground">{weeklySessions.length}/3 treinos</span>
            </div>
            <Progress value={Math.min((weeklySessions.length / 3) * 100, 100)} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">Meta: 3 treinos na semana</p>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tighter uppercase">{workout.name}</h1>
            <p className="text-muted-foreground text-sm">
              Versao {workout.version} - Atualizado em {new Date(workout.updated_at).toLocaleDateString("pt-BR")}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {workout.aerobic_pdf_url && (
              <Button
                variant="outline"
                className="gap-2 text-orange-400 border-orange-400/50 hover:bg-orange-400/10"
                onClick={() => window.open(`${BACKEND_URL}/api${workout.aerobic_pdf_url}`, "_blank")}
                data-testid="download-aerobic-pdf"
              >
                <FileText className="w-4 h-4" />
                <Download className="w-4 h-4" />
                PDF Aeróbico
              </Button>
            )}
            <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2" data-testid="complete-workout-btn">
                  <CheckCircle2 className="w-4 h-4" />
                  Concluir treino
                </Button>
              </DialogTrigger>
            <DialogContent className="bg-card border-border sm:max-w-4xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold uppercase">Como foi o treino?</DialogTitle>
                <DialogDescription>Registre sua percepcao para acompanhar a periodizacao.</DialogDescription>
              </DialogHeader>

              <DialogBody>
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-secondary/30 border border-border/60">
                      <p className="text-xs text-muted-foreground uppercase">Exercicios do dia</p>
                      <p className="text-2xl font-black">{plannedExercises}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/30 border border-border/60">
                      <p className="text-xs text-muted-foreground uppercase">Series planejadas</p>
                      <p className="text-2xl font-black">{plannedSets}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <ScaleLegendSelector
                      title="PSR"
                      subtitle="Percepcao Subjetiva de Recuperacao"
                      prompt="Como seu corpo chegou para o treino?"
                      icon={HeartPulse}
                      value={recoveryScore}
                      onChange={setRecoveryScore}
                      items={RECOVERY_SCALE_ITEMS}
                    />

                    <ScaleLegendSelector
                      title="PSE"
                      subtitle="Percepcao Subjetiva de Esforco"
                      prompt="Quao intenso foi o treino que voce realizou?"
                      icon={Gauge}
                      value={effortScore}
                      onChange={setEffortScore}
                      items={EFFORT_SCALE_ITEMS}
                    />
                  </div>

                  <div>
                    <p className="text-sm font-semibold mb-2">Como voce sentiu o treino?</p>
                    <div className="grid grid-cols-2 gap-2">
                      {FEELING_OPTIONS.map((option) => (
                        <Button
                          key={option.value}
                          type="button"
                          variant={sessionFeeling === option.value ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSessionFeeling(option.value)}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Observacoes</p>
                    <Textarea
                      placeholder="Ex.: Dormi pouco, senti dor no ombro, treino fluido..."
                      value={sessionNotes}
                      onChange={(e) => setSessionNotes(e.target.value)}
                      className="bg-secondary/50 border-white/10"
                    />
                  </div>
                </div>
              </DialogBody>

              <DialogFooter>
                <Button onClick={handleCompleteWorkout} disabled={completing} className="w-full sm:w-auto">
                  {completing ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "Salvar e concluir"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        <Dialog
          open={!!lastSessionSummary}
          onOpenChange={(open) => {
            if (!open) setLastSessionSummary(null);
          }}
        >
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold uppercase text-center">Treino concluido</DialogTitle>
              <DialogDescription className="text-center">
                Aqui esta o resumo da sua sessao.
              </DialogDescription>
            </DialogHeader>
            <DialogBody>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-secondary/30 border border-border/60">
                  <p className="text-xs text-muted-foreground uppercase flex items-center gap-1">
                    <Flame className="w-3 h-3 text-orange-400" />
                    Gasto calorico
                  </p>
                  <p className="text-xl font-black">{lastSessionSummary?.estimated_calories || 0} kcal</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/30 border border-border/60">
                  <p className="text-xs text-muted-foreground uppercase">Volume total</p>
                  <p className="text-xl font-black">{formatVolume(lastSessionSummary?.total_volume_kg)} kg</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/30 border border-border/60">
                  <p className="text-xs text-muted-foreground uppercase">Exercicios</p>
                  <p className="text-xl font-black">{lastSessionSummary?.exercises_completed || 0}</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/30 border border-border/60">
                  <p className="text-xs text-muted-foreground uppercase flex items-center gap-1">
                    <Repeat2 className="w-3 h-3 text-cyan-400" />
                    Repeticoes
                  </p>
                  <p className="text-xl font-black">{lastSessionSummary?.total_reps || 0}</p>
                </div>
              </div>
              <div className="mt-4 p-3 rounded-lg bg-secondary/20 border border-border/50 text-sm">
                <p>
                  PSR: <span className="font-semibold">{lastSessionSummary?.recovery_score || "-"}</span> | PSE:{" "}
                  <span className="font-semibold">{lastSessionSummary?.effort_score || "-"}</span> | Sensacao:{" "}
                  <span className="font-semibold capitalize">{lastSessionSummary?.feedback || "-"}</span>
                </p>
              </div>
            </DialogBody>
            <DialogFooter>
              <Button variant="outline" onClick={() => setLastSessionSummary(null)}>
                Voltar para treino
              </Button>
              <Button asChild>
                <Link to="/meu-progresso">Ver evolucao</Link>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {workout.days && workout.days.length > 0 && (
          <Tabs
            defaultValue={workout.days[0]?.day_name}
            className="w-full"
            onValueChange={(value) => {
              const day = workout.days.find((d) => d.day_name === value);
              setSelectedDay(day);
              setSelectedExercise(null);
            }}
          >
            <TabsList className="w-full flex overflow-x-auto gap-1 bg-secondary/30 p-1 rounded-lg">
              {workout.days.map((day) => (
                <TabsTrigger
                  key={day.day_name}
                  value={day.day_name}
                  className="flex-1 min-w-[100px] data-[state=active]:bg-primary data-[state=active]:text-white font-semibold uppercase text-xs tracking-wide"
                  data-testid={`day-tab-${day.day_name}`}
                >
                  {day.day_name}
                </TabsTrigger>
              ))}
            </TabsList>

            {workout.days.map((day) => (
              <TabsContent key={day.day_name} value={day.day_name} className="mt-6">
                <div className="space-y-4">
                  {day.exercises?.map((exercise, index) => (
                    <ExerciseCard
                      key={`${day.day_name}-${index}`}
                      exercise={exercise}
                      index={index}
                      onClick={() => handleExerciseClick(exercise)}
                      data-testid={`exercise-card-${index}`}
                    />
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}

        {selectedExercise && (
          <SetTracker
            exercise={selectedExercise}
            workoutId={workout.id}
            dayName={selectedDay?.day_name}
            onClose={handleCloseExercise}
            onProgressLogged={handleProgressLogged}
          />
        )}

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <h3 className="font-bold mb-3 uppercase text-sm text-muted-foreground">Historico de sessoes</h3>
            {sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Ainda nao ha treinos concluidos.</p>
            ) : (
              <div className="space-y-2">
                {sessions.slice(0, 8).map((s) => (
                  <div key={s.id} className="p-3 rounded-lg bg-secondary/30 border border-border/50">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">{s.day_name || "Treino"}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(s.completed_at).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <p>Volume: {formatVolume(s.total_volume_kg)} kg</p>
                        <p>Exercicios: {s.exercises_completed || 0}</p>
                        <p>Reps: {s.total_reps || 0}</p>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      PSR {s.recovery_score || "-"} | PSE {s.effort_score || "-"} | Sensacao:{" "}
                      <span className="capitalize">{s.feedback || "-"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* FAQ Chat Popup */}
      <FAQChatPopup />
    </MainLayout>
  );
}
