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
import { Badge } from "../components/ui/badge";
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
  Sparkles,
} from "lucide-react";
import api from "../lib/api";
import { BACKEND_URL } from "../lib/backend";
import { toast } from "sonner";
import { ExerciseCard } from "../components/ExerciseCard";
import { SetTracker } from "../components/SetTracker";
import { FAQChatPopup } from "../components/FAQChatPopup";
import { BRAND } from "../lib/brand";

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
    <div className="overflow-hidden rounded-[1.5rem] border border-border/70 bg-card/72 shadow-[0_24px_55px_-36px_rgba(15,23,42,0.55)] backdrop-blur-xl">
      <div className="border-b border-border/60 bg-background/55 px-4 py-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-[1rem] border border-primary/20 bg-primary/12 p-2">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{title}</p>
            <h3 className="text-lg font-black tracking-tight">{subtitle}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{prompt}</p>
          </div>
        </div>
      </div>

      <div className="border-b border-border/60 bg-gradient-to-r from-primary/16 via-blue-500/10 to-blue-700/10 px-4 py-2.5">
        <p className="text-sm font-semibold tracking-wide text-foreground">
          Escala de 1 a 10 com legendas de referencia
        </p>
      </div>

      <div className="bg-secondary/20 p-3">
        <div className="overflow-hidden rounded-[1rem] border border-border/60">
          {items.map((item) => {
            const selected = item.value === value;
            return (
              <button
                key={`${title}-${item.value}`}
                type="button"
                onClick={() => onChange(item.value)}
                className={`grid w-full grid-cols-[44px,1fr,auto] items-center gap-3 border-b border-black/15 px-3 py-2.5 text-left transition-all last:border-b-0 ${
                  selected
                    ? "ring-2 ring-primary/70 ring-inset shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                    : "hover:brightness-110"
                } bg-gradient-to-r ${item.barClass}`}
              >
                <span className={`text-xl font-black ${item.textClass}`}>{item.value}</span>
                <span className={`text-sm font-black uppercase tracking-wide sm:text-base ${item.textClass}`}>
                  {item.label || " "}
                </span>
                <span
                  className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${
                    selected
                      ? "border border-white/10 bg-background/80 text-foreground"
                      : "border border-transparent bg-black/10 text-transparent"
                  }`}
                >
                  {selected ? "Atual" : "."}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-3 rounded-[1rem] border border-border/60 bg-background/55 px-3 py-2.5">
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Selecionado</p>
          <p className="mt-1 text-sm text-foreground">
            <span className="font-black">{selectedItem.value}</span>
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
  const [downloadingAerobicPdf, setDownloadingAerobicPdf] = useState(false);
  const [lastSessionSummary, setLastSessionSummary] = useState(null);

  useEffect(() => {
    loadData();
    // Intentional one-time bootstrap for the dashboard.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hydrateWorkoutPdf = async (workoutData) => {
    if (!workoutData?.id || workoutData?.aerobic_pdf_url) return workoutData;

    try {
      const pdfRes = await api.get(`/workouts/${workoutData.id}/pdf`);
      const pdfUrl = pdfRes.data?.pdf_url;
      if (!pdfUrl) return workoutData;
      return { ...workoutData, aerobic_pdf_url: pdfUrl };
    } catch (error) {
      if (error?.response?.status !== 404) {
        console.error("Erro ao carregar PDF de aerobio", error);
      }
      return workoutData;
    }
  };

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
        const hydratedWorkout = await hydrateWorkoutPdf(workoutsRes.data[0]);
        setWorkout(hydratedWorkout);
        if (hydratedWorkout.days?.length > 0) {
          setSelectedDay(hydratedWorkout.days[0]);
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

  const handleDownloadAerobicPdf = async () => {
    if (!aerobicPdfUrl || downloadingAerobicPdf) return;

    setDownloadingAerobicPdf(true);
    try {
      const response = await fetch(aerobicPdfUrl);
      if (!response.ok) {
        throw new Error("download_failed");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const normalizedWorkoutName = String(workout?.name || "aerobio")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase();

      link.href = objectUrl;
      link.download = `${normalizedWorkoutName || "aerobio"}-protocolo.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      toast.error("Erro ao baixar PDF do aerobio");
    } finally {
      setDownloadingAerobicPdf(false);
    }
  };

  const resetSessionForm = () => {
    setSessionNotes("");
    setSessionFeeling("bom");
    setRecoveryScore(7);
    setEffortScore(8);
  };

  const refreshSessions = async () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 6);
    const startStr = startDate.toISOString().split("T")[0];

    const [sessionsRes, weeklyRes] = await Promise.all([
      api.get("/workout-sessions"),
      api.get(`/workout-sessions?start_date=${startStr}`),
    ]);

    setSessions(sessionsRes.data);
    setWeeklySessions(weeklyRes.data);
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
      await refreshSessions();
    } catch (error) {
      toast.error("Erro ao concluir treino");
    } finally {
      setCompleting(false);
    }
  };

  const plannedExercises = selectedDay?.exercises?.length || 0;
  const plannedSets =
    selectedDay?.exercises?.reduce((acc, ex) => acc + (Number(ex.sets) || 0), 0) || 0;
  const weeklyGoalProgress = Math.min((weeklySessions.length / 3) * 100, 100);
  const aerobicPdfUrl = workout?.aerobic_pdf_url ? `${BACKEND_URL}/api${workout.aerobic_pdf_url}` : "";

  if (loading) {
    return (
      <MainLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
        <FAQChatPopup />
      </MainLayout>
    );
  }

  if (!workout) {
    return (
      <MainLayout>
        <div className="page-hero flex min-h-[60vh] flex-col items-center justify-center px-6 py-10 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/5">
            <Dumbbell className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-3xl font-black uppercase tracking-[-0.06em] text-foreground">
            Nenhum treino disponivel
          </h2>
          <p className="mt-4 max-w-lg text-sm leading-7 text-muted-foreground sm:text-base">
            Seu treino ainda nao foi liberado. Assim que {BRAND.shortName} enviar o plano, ele aparecera aqui.
          </p>
        </div>
        <FAQChatPopup />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in" data-testid="student-dashboard">
        <section className="page-hero p-6 sm:p-8">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] xl:items-end">
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Badge variant="outline">{BRAND.studentLabel}</Badge>
                <Badge variant="secondary">
                  <Sparkles className="mr-1 h-3.5 w-3.5" />
                  Treino estruturado
                </Badge>
              </div>

              <p className="label-uppercase text-primary">{BRAND.name}</p>
              <h1 className="mt-2 text-4xl font-black uppercase tracking-[-0.07em] text-foreground sm:text-5xl">
                {workout.name}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                Execute seu plano com foco, registre progresso rapidamente e acompanhe sua consistencia dentro da
                metodologia do {BRAND.name}.
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                Versao {workout.version} | Atualizado em{" "}
                {new Date(workout.updated_at).toLocaleDateString("pt-BR")}
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:max-w-2xl xl:grid-cols-4">
                <div className="metric-tile rounded-[1.35rem] px-4 py-4 text-center">
                  <Target className="mx-auto mb-2 h-5 w-5 text-primary" />
                  <p className="text-2xl font-black">{stats?.total_exercises || 0}</p>
                  <p className="text-xs uppercase text-muted-foreground">Exercicios</p>
                </div>
                <div className="metric-tile rounded-[1.35rem] px-4 py-4 text-center">
                  <CheckCircle2 className="mx-auto mb-2 h-5 w-5 text-emerald-400" />
                  <p className="text-2xl font-black">{stats?.progress_logged || 0}</p>
                  <p className="text-xs uppercase text-muted-foreground">Registros</p>
                </div>
                <div className="metric-tile rounded-[1.35rem] px-4 py-4 text-center">
                  <Calendar className="mx-auto mb-2 h-5 w-5 text-blue-400" />
                  <p className="text-2xl font-black">{workout.days?.length || 0}</p>
                  <p className="text-xs uppercase text-muted-foreground">Dias</p>
                </div>
                <div className="metric-tile rounded-[1.35rem] px-4 py-4 text-center">
                  <TrendingUp className="mx-auto mb-2 h-5 w-5 text-orange-400" />
                  <p className="text-2xl font-black">{stats?.workout_streak || 0}</p>
                  <p className="text-xs uppercase text-muted-foreground">Sequencia</p>
                </div>
              </div>
            </div>

            <div className="metric-tile rounded-[1.6rem] p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-400" />
                  <p className="font-semibold">Desafio semanal</p>
                </div>
                <span className="text-sm text-muted-foreground">{weeklySessions.length}/3 treinos</span>
              </div>
              <Progress value={weeklyGoalProgress} />
              <p className="mt-3 text-sm text-muted-foreground">
                Meta de consistencia: concluir 3 treinos nesta semana.
              </p>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row xl:flex-col">
                <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full gap-2 rounded-[1rem]" data-testid="complete-workout-btn">
                      <CheckCircle2 className="h-4 w-4" />
                      Concluir treino
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-4xl">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold uppercase">Como foi o treino?</DialogTitle>
                      <DialogDescription>Registre sua percepcao para acompanhar a periodizacao.</DialogDescription>
                    </DialogHeader>

                    <DialogBody>
                      <div className="space-y-5">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-[1rem] border border-border/60 bg-secondary/30 p-3">
                            <p className="text-xs uppercase text-muted-foreground">Exercicios do dia</p>
                            <p className="text-2xl font-black">{plannedExercises}</p>
                          </div>
                          <div className="rounded-[1rem] border border-border/60 bg-secondary/30 p-3">
                            <p className="text-xs uppercase text-muted-foreground">Series planejadas</p>
                            <p className="text-2xl font-black">{plannedSets}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
                          <p className="mb-2 text-sm font-semibold">Como voce sentiu o treino?</p>
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
                            className="bg-secondary/50"
                          />
                        </div>
                      </div>
                    </DialogBody>

                    <DialogFooter>
                      <Button onClick={handleCompleteWorkout} disabled={completing} className="w-full sm:w-auto">
                        {completing ? (
                          <div className="h-5 w-5 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                        ) : (
                          "Salvar e concluir"
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </section>

        <Dialog
          open={!!lastSessionSummary}
          onOpenChange={(open) => {
            if (!open) setLastSessionSummary(null);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-center text-xl font-bold uppercase">Treino concluido</DialogTitle>
              <DialogDescription className="text-center">
                Aqui esta o resumo da sua sessao.
              </DialogDescription>
            </DialogHeader>
            <DialogBody>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[1rem] border border-border/60 bg-secondary/30 p-3">
                  <p className="flex items-center gap-1 text-xs uppercase text-muted-foreground">
                    <Flame className="h-3 w-3 text-orange-400" />
                    Gasto calorico
                  </p>
                  <p className="text-xl font-black">{lastSessionSummary?.estimated_calories || 0} kcal</p>
                </div>
                <div className="rounded-[1rem] border border-border/60 bg-secondary/30 p-3">
                  <p className="text-xs uppercase text-muted-foreground">Volume total</p>
                  <p className="text-xl font-black">{formatVolume(lastSessionSummary?.total_volume_kg)} kg</p>
                </div>
                <div className="rounded-[1rem] border border-border/60 bg-secondary/30 p-3">
                  <p className="text-xs uppercase text-muted-foreground">Exercicios</p>
                  <p className="text-xl font-black">{lastSessionSummary?.exercises_completed || 0}</p>
                </div>
                <div className="rounded-[1rem] border border-border/60 bg-secondary/30 p-3">
                  <p className="flex items-center gap-1 text-xs uppercase text-muted-foreground">
                    <Repeat2 className="h-3 w-3 text-blue-400" />
                    Repeticoes
                  </p>
                  <p className="text-xl font-black">{lastSessionSummary?.total_reps || 0}</p>
                </div>
              </div>
              <div className="mt-4 rounded-[1rem] border border-border/50 bg-secondary/20 p-3 text-sm">
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
          <Card className="bento-card overflow-hidden">
            <CardContent className="p-4 sm:p-6">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="label-uppercase">Execucao do plano</p>
                  <h2 className="mt-1 text-2xl font-black uppercase tracking-[-0.05em]">Escolha o dia de treino</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  Toque em um exercicio para registrar series, carga e progresso.
                </p>
              </div>

              {aerobicPdfUrl && (
                <div className="mb-6 rounded-[1.35rem] border border-orange-400/20 bg-orange-500/8 p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <p className="label-uppercase text-orange-400">Aerobio complementar</p>
                      <h3 className="mt-1 text-lg font-black uppercase tracking-[-0.04em] text-foreground">
                        PDF disponivel no treino
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Visualize o protocolo de aerobio do seu treino ou baixe o PDF para consultar durante a
                        sessao.
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        variant="outline"
                        className="gap-2 rounded-[1rem] border-orange-400/25 text-orange-400 hover:bg-orange-500/10"
                        onClick={() => window.open(aerobicPdfUrl, "_blank", "noopener,noreferrer")}
                        data-testid="view-aerobic-pdf"
                      >
                        <FileText className="h-4 w-4" />
                        Visualizar PDF
                      </Button>
                      <Button
                        variant="outline"
                        className="gap-2 rounded-[1rem] border-orange-400/25 text-orange-400 hover:bg-orange-500/10"
                        onClick={handleDownloadAerobicPdf}
                        disabled={downloadingAerobicPdf}
                        data-testid="download-aerobic-pdf"
                      >
                        <Download className="h-4 w-4" />
                        {downloadingAerobicPdf ? "Baixando..." : "Baixar PDF"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <Tabs
                defaultValue={workout.days[0]?.day_name}
                className="w-full"
                onValueChange={(value) => {
                  const day = workout.days.find((d) => d.day_name === value);
                  setSelectedDay(day);
                  setSelectedExercise(null);
                }}
              >
                <TabsList className="flex w-full gap-1 overflow-x-auto p-1.5">
                  {workout.days.map((day) => (
                    <TabsTrigger
                      key={day.day_name}
                      value={day.day_name}
                      className="min-w-[120px] flex-1 text-xs font-semibold uppercase tracking-[0.16em] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
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
            </CardContent>
          </Card>
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

        <Card className="bento-card">
          <CardContent className="p-4 sm:p-6">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="label-uppercase">Consistencia</p>
                <h3 className="mt-1 text-2xl font-black uppercase tracking-[-0.05em]">Historico de sessoes</h3>
              </div>
              <p className="text-sm text-muted-foreground">Ultimas 8 sessoes concluidas.</p>
            </div>

            {sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Ainda nao ha treinos concluidos.</p>
            ) : (
              <div className="space-y-3">
                {sessions.slice(0, 8).map((session) => (
                  <div key={session.id} className="rounded-[1.15rem] border border-border/50 bg-secondary/30 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold">{session.day_name || "Treino"}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(session.completed_at).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-xs text-muted-foreground sm:text-right">
                        <p>Volume: {formatVolume(session.total_volume_kg)} kg</p>
                        <p>Exercicios: {session.exercises_completed || 0}</p>
                        <p>Reps: {session.total_reps || 0}</p>
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-muted-foreground">
                      PSR {session.recovery_score || "-"} | PSE {session.effort_score || "-"} | Sensacao:{" "}
                      <span className="capitalize">{session.feedback || "-"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <FAQChatPopup />
    </MainLayout>
  );
}
