import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { Progress } from "./ui/progress";
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Check,
  CheckCircle2,
  Clock,
  Target,
  Bell,
  BellOff,
  Settings,
  Flame,
} from "lucide-react";
import api from "../lib/api";
import { BACKEND_URL } from "../lib/backend";
import { toast } from "sonner";

export const SetTracker = ({ exercise, workoutId, dayName, onClose, onProgressLogged }) => {
  const [sets, setSets] = useState([]);
  const [saving, setSaving] = useState(false);
  const [previousData, setPreviousData] = useState(null);
  const [resolvedVideoUrl, setResolvedVideoUrl] = useState("");
  const [loadingVideo, setLoadingVideo] = useState(false);
  const [mp4VideoUrl, setMp4VideoUrl] = useState(null);
  const [caloriesEstimate, setCaloriesEstimate] = useState(null);

  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerDuration, setTimerDuration] = useState(exercise.rest_time || 90);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const timerRef = useRef(null);

  const difficulty = 3;
  const defaultImage =
    "https://images.unsplash.com/photo-1700784795176-7ff886439d79?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200";

  useEffect(() => {
    const numSets = exercise.sets || 4;
    const initialSets = Array.from({ length: numSets }, (_, i) => ({
      set: i + 1,
      weight: "",
      reps: "",
      completed: false,
    }));

    setSets(initialSets);
    setTimerDuration(exercise.rest_time || 90);
    setTimerSeconds(0);

    loadPreviousProgress();
    resolveVideoUrl();
    checkMp4Video();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [exercise]);

  const checkMp4Video = async () => {
    try {
      const response = await api.get(`/exercises/video-mp4/${encodeURIComponent(exercise.name)}`);
      if (response.data?.video_url) {
        setMp4VideoUrl(response.data.video_url);
      }
    } catch (error) {
      console.log("No MP4 video found");
    }
  };

  // Calcular calorias quando peso ou reps mudam
  const calculateCalories = useCallback(async () => {
    const completedSets = sets.filter(s => s.weight && s.reps);
    if (completedSets.length === 0) {
      setCaloriesEstimate(null);
      return;
    }

    const totalWeight = completedSets.reduce((sum, s) => sum + (parseFloat(s.weight) || 0), 0);
    const totalReps = completedSets.reduce((sum, s) => sum + (parseInt(s.reps) || 0), 0);
    const avgWeight = totalWeight / completedSets.length;

    try {
      const formData = new FormData();
      formData.append("load_kg", avgWeight);
      formData.append("reps", totalReps);
      formData.append("sets", completedSets.length);
      
      const response = await api.post("/calculate-calories", formData);
      setCaloriesEstimate(response.data);
    } catch (error) {
      // Fallback: cálculo local simples
      const volume = totalWeight * totalReps;
      const calories = (volume / 1000) * 5 + (totalReps * 0.5);
      setCaloriesEstimate({
        total_calories: Math.round(calories * 10) / 10,
        total_volume: Math.round(volume)
      });
    }
  }, [sets]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      calculateCalories();
    }, 500);
    return () => clearTimeout(debounceTimer);
  }, [sets, calculateCalories]);

  useEffect(() => {
    if (timerActive && timerSeconds > 0) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setTimerActive(false);
            if (soundEnabled) {
              playTimerEndSound();
            }
            toast.success("Tempo de descanso finalizado");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerActive, soundEnabled]);

  const playTimerEndSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 880;
      oscillator.type = "sine";
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.log("Audio not supported");
    }
  };

  const loadPreviousProgress = async () => {
    try {
      const response = await api.get(`/progress?exercise_name=${encodeURIComponent(exercise.name)}`);
      if (response.data.length > 0) {
        setPreviousData(response.data[0]);
      } else {
        setPreviousData(null);
      }
    } catch (error) {
      console.error("Error loading previous progress:", error);
      setPreviousData(null);
    }
  };

  const getEmbedUrl = (url) => {
    if (!url) return null;
    try {
      if (url.includes("youtube.com")) {
        const videoId = new URL(url).searchParams.get("v");
        return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
      }
      if (url.includes("youtu.be")) {
        const videoId = url.split("/").pop();
        return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
      }
      if (url.includes("/embed/")) return url;
      const match = url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]+)/);
      if (match) return `https://www.youtube.com/embed/${match[1]}`;
    } catch (error) {
      const match = url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]+)/);
      if (match) return `https://www.youtube.com/embed/${match[1]}`;
      return null;
    }
    return null;
  };

  const resolveVideoUrl = async () => {
    const directUrl = exercise?.video_url || "";
    if (directUrl && getEmbedUrl(directUrl)) {
      setResolvedVideoUrl(directUrl);
      return;
    }
    if (!exercise?.name) return;
    setLoadingVideo(true);
    try {
      const response = await api.get(`/exercises/video/${encodeURIComponent(exercise.name)}`);
      setResolvedVideoUrl(response.data?.video_url || "");
    } catch (error) {
      setResolvedVideoUrl("");
    } finally {
      setLoadingVideo(false);
    }
  };

  const updateSet = (index, field, value) => {
    setSets((prev) => prev.map((set, i) => (i === index ? { ...set, [field]: value } : set)));
  };

  const toggleSetComplete = (index) => {
    const set = sets[index];
    const newCompleted = !set.completed;

    setSets((prev) => prev.map((s, i) => (i === index ? { ...s, completed: newCompleted } : s)));

    if (newCompleted && index < sets.length - 1) {
      startTimer();
    }
  };

  const formatPreviousWeight = (value) => {
    if (value === null || value === undefined || value === "") return "-";
    const num = Number(value);
    if (Number.isNaN(num)) return "-";
    return `${num.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} kg`;
  };

  const formatPreviousReps = (value) => {
    if (value === null || value === undefined || value === "") return "-";
    const num = Number(value);
    if (Number.isNaN(num)) return "-";
    return `${num.toLocaleString("pt-BR")} rep`;
  };

  const getPreviousSetData = (setNumber, index) => {
    if (!previousData?.sets_completed?.length) return null;
    return (
      previousData.sets_completed.find((s) => Number(s?.set) === Number(setNumber)) ||
      previousData.sets_completed[index] ||
      null
    );
  };

  const startTimer = useCallback(() => {
    setTimerSeconds(timerDuration);
    setTimerActive(true);
  }, [timerDuration]);

  const pauseTimer = () => {
    setTimerActive(false);
  };

  const resetTimer = () => {
    setTimerActive(false);
    setTimerSeconds(0);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSave = async () => {
    const completedSets = sets.filter((s) => s.completed && (s.weight || s.reps));

    if (completedSets.length === 0) {
      toast.error("Complete pelo menos uma serie");
      return;
    }

    setSaving(true);
    try {
      await api.post("/progress", {
        workout_id: workoutId,
        exercise_name: exercise.name,
        day_name: dayName || null,
        sets_completed: completedSets.map((s) => ({
          set: s.set,
          weight: parseFloat(s.weight) || 0,
          reps: parseInt(s.reps) || 0,
        })),
        difficulty,
      });

      onProgressLogged();
      onClose();
    } catch (error) {
      toast.error("Erro ao salvar progresso");
    } finally {
      setSaving(false);
    }
  };

  const videoUrl = resolvedVideoUrl || exercise.video_url || "";
  const embedUrl = getEmbedUrl(videoUrl);
  const completedSets = sets.filter((s) => s.completed).length;
  const completionPercent = sets.length ? Math.round((completedSets / sets.length) * 100) : 0;
  const workoutHeadline = dayName
    ? `Treino ${dayName} - ${exercise.muscle_group || exercise.name}`
    : exercise.name;
  const observationLines = String(exercise.notes || "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .flatMap((line) => line.split("|"))
    .map((line) => line.trim())
    .filter(Boolean);
  const instructionText =
    exercise.description ||
    (observationLines.length === 0
      ? "Mantenha a tecnica controlada e finalize todas as series com boa execucao."
      : "");

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.22),_transparent_36%),radial-gradient(circle_at_bottom,_rgba(34,211,238,0.14),_transparent_46%)] bg-background/90 backdrop-blur-xl">
      <div className="flex min-h-full items-start justify-center p-2 sm:p-5 lg:p-6">
        <Card
          className="premium-panel-strong w-full max-w-4xl overflow-hidden rounded-[2rem] border-border/70 shadow-[0_30px_90px_-40px_rgba(15,23,42,0.82)]"
          data-testid="set-tracker-modal"
        >
          <div className="border-b border-border/60 bg-gradient-to-r from-primary/12 via-background/82 to-blue-500/10 px-4 pb-4 pt-5 sm:px-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="label-uppercase text-primary">Treino em andamento</p>
                <h2 className="gradient-text truncate text-xl font-black tracking-[-0.05em] sm:text-3xl">
                  {workoutHeadline}
                </h2>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-[1rem] border border-border/60 bg-background/55 text-muted-foreground hover:bg-secondary/55 hover:text-foreground"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  data-testid="toggle-sound"
                >
                  {soundEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-[1rem] border border-border/60 bg-background/55 text-muted-foreground hover:bg-secondary/55 hover:text-foreground"
                  onClick={resetTimer}
                  data-testid="reset-timer"
                >
                  <Settings className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-[1rem] border border-border/60 bg-background/55 text-muted-foreground hover:bg-secondary/55 hover:text-foreground"
                  onClick={onClose}
                  data-testid="close-set-tracker"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
              <div className="premium-soft flex items-center gap-2 rounded-[1rem] px-3 py-2 text-muted-foreground">
                <Clock className="h-4 w-4 text-primary" />
                {completedSets}/{sets.length}
              </div>
              <div className="premium-soft flex items-center gap-2 rounded-[1rem] px-3 py-2 text-muted-foreground">
                <RotateCcw className="h-4 w-4 text-primary" />
                {formatTime(timerSeconds)}
              </div>
              <div className="premium-soft rounded-[1rem] px-3 py-2 text-right font-semibold text-primary">
                {completionPercent}% concluido
              </div>
            </div>
            <Progress
              value={completionPercent}
              className="mt-3 h-2.5 bg-secondary/45 [&>div]:bg-gradient-to-r [&>div]:from-blue-600 [&>div]:to-cyan-400"
            />

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {!timerActive ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-full border-primary/30 bg-primary/10 px-4 text-primary hover:bg-primary/15"
                  onClick={startTimer}
                  data-testid="start-timer"
                >
                  <Play className="mr-1 h-3 w-3 fill-current" />
                  Iniciar descanso
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-full border-orange-400/30 bg-orange-500/10 px-4 text-orange-400 hover:bg-orange-500/15"
                  onClick={pauseTimer}
                  data-testid="pause-timer"
                >
                  <Pause className="mr-1 h-3 w-3" />
                  Pausar
                </Button>
              )}
              <select
                value={timerDuration}
                onChange={(e) => setTimerDuration(parseInt(e.target.value))}
                className="h-9 rounded-full border border-border/60 bg-background/75 px-3 text-xs font-semibold text-foreground outline-none transition-colors hover:border-primary/35 focus:border-primary/45"
                data-testid="timer-duration-select"
              >
                <option value={30}>30s</option>
                <option value={45}>45s</option>
                <option value={60}>1min</option>
                <option value={90}>1:30</option>
                <option value={120}>2min</option>
                <option value={180}>3min</option>
              </select>
            </div>
          </div>

          <div className="max-h-[74vh] overflow-y-auto p-4 sm:p-6">
            <div className="premium-soft rounded-[1.8rem] border border-border/60 bg-secondary/22 p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-primary/20 bg-gradient-to-br from-primary/16 to-blue-500/10 font-black text-primary">
                  {completedSets}/{sets.length}
                </div>
                <div className="min-w-0">
                  <h3 className="text-2xl font-extrabold tracking-tight text-foreground">{exercise.name}</h3>
                  <p className="text-sm text-muted-foreground">{exercise.muscle_group || "Exercicio"}</p>
                  <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
                    <Target className="h-3 w-3" />
                    {exercise.sets}x {exercise.reps}
                  </div>
                  {loadingVideo && <p className="mt-2 text-xs text-muted-foreground">Carregando video...</p>}
                </div>
              </div>

              <div className="mt-4 overflow-hidden rounded-[1.6rem] border border-border/60 bg-background/45">
                <div className={`relative ${mp4VideoUrl || embedUrl ? "aspect-video" : "h-52 sm:h-72"}`}>
                  {mp4VideoUrl ? (
                    <video
                      controls
                      className="h-full w-full"
                      src={`${BACKEND_URL}/api${mp4VideoUrl}`}
                      data-testid="exercise-video-mp4"
                    >
                      Seu navegador não suporta o elemento de vídeo.
                    </video>
                  ) : embedUrl ? (
                    <iframe
                      title={`video-${exercise.name}`}
                      src={embedUrl}
                      className="h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <img src={exercise.image_url || defaultImage} alt={exercise.name} className="h-full w-full object-cover" />
                  )}

                  {!mp4VideoUrl && !embedUrl && videoUrl && (
                    <a
                      href={videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 flex items-center justify-center bg-background/20 transition-colors hover:bg-background/35"
                    >
                      <div className="flex h-20 w-20 items-center justify-center rounded-full border border-primary/35 bg-primary/35 backdrop-blur-sm">
                        <Play className="ml-1 h-9 w-9 fill-white text-white" />
                      </div>
                    </a>
                  )}
                </div>

                {observationLines.length > 0 && (
                  <div className="border-t border-border/50 bg-background/55 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/80">
                      Observacoes
                    </p>
                    <div className="mt-2 space-y-2">
                      {observationLines.map((line, lineIndex) => {
                        const compactLine = line.replace(/\s+/g, "");
                        const isDivider = /^[_-]{5,}$/.test(compactLine);

                        if (isDivider) {
                          return (
                            <div
                              key={`${exercise.name}-observation-divider-${lineIndex}`}
                              className="border-t border-border/60"
                            />
                          );
                        }

                        return (
                          <p
                            key={`${exercise.name}-observation-${lineIndex}`}
                            className="text-sm leading-relaxed text-foreground"
                          >
                            {line}
                          </p>
                        );
                      })}
                    </div>
                  </div>
                )}

                {instructionText && (
                  <div className="border-t border-border/50 bg-secondary/18 px-4 py-3">
                    <p className="text-sm leading-relaxed text-muted-foreground">{instructionText}</p>
                  </div>
                )}
              </div>



              <div className="mt-4 rounded-[1.6rem] border border-border/60 bg-background/38 p-3 sm:p-4">
                <div className="grid grid-cols-12 gap-2 border-b border-border/50 px-1 pb-2 text-xs uppercase tracking-wide text-muted-foreground">
                  <div className="col-span-2">Serie</div>
                  <div className="col-span-4 text-center">Carga</div>
                  <div className="col-span-4 text-center">Repeticoes</div>
                  <div className="col-span-2 text-center">OK</div>
                </div>

                <div className="space-y-2 pt-2">
                  {sets.map((set, index) => {
                    const previousSetData = getPreviousSetData(set.set, index);
                    return (
                      <div
                        key={set.set}
                        className={`grid grid-cols-12 gap-2 items-center rounded-xl border p-2 transition-all ${
                          set.completed
                            ? "border-primary/35 bg-primary/10 shadow-[0_18px_45px_-32px_rgba(59,130,246,0.6)]"
                            : "border-border/50 bg-secondary/25"
                        }`}
                        data-testid={`set-row-${index}`}
                      >
                        <div className="col-span-2">
                          <div className="flex h-10 items-center justify-center rounded-[0.95rem] border border-border/60 bg-background/65 text-xl font-black text-foreground">
                            {set.set}
                          </div>
                        </div>

                        <div className="col-span-4">
                          <Input
                            type="number"
                            value={set.weight}
                            onChange={(e) => updateSet(index, "weight", e.target.value)}
                            placeholder="0"
                            className="h-10 rounded-[0.95rem] border-border/60 bg-background/80 text-center text-lg font-bold text-primary [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            data-testid={`weight-input-${index}`}
                          />
                          <p className="mt-1 text-center text-[11px] text-muted-foreground">
                            ant: {formatPreviousWeight(previousSetData?.weight)}
                          </p>
                        </div>

                        <div className="col-span-4">
                          <Input
                            type="number"
                            value={set.reps}
                            onChange={(e) => updateSet(index, "reps", e.target.value)}
                            placeholder="0"
                            className="h-10 rounded-[0.95rem] border-border/60 bg-background/80 text-center text-lg font-bold text-foreground [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            data-testid={`reps-input-${index}`}
                          />
                          <p className="mt-1 text-center text-[11px] text-muted-foreground">
                            ant: {formatPreviousReps(previousSetData?.reps)}
                          </p>
                        </div>

                        <div className="col-span-2 flex justify-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-10 w-10 rounded-xl border ${
                              set.completed
                                ? "border-primary bg-primary text-primary-foreground shadow-[0_0_20px_rgba(59,130,246,0.38)]"
                                : "border-primary/30 bg-primary/10 text-primary hover:bg-primary/18"
                            }`}
                            onClick={() => toggleSetComplete(index)}
                            data-testid={`complete-set-${index}`}
                          >
                            <Check className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {caloriesEstimate && caloriesEstimate.total_calories > 0 && (
                <div
                  className="mt-4 rounded-[1.6rem] border border-orange-400/25 bg-orange-500/10 p-4"
                  data-testid="calories-display"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Flame className="h-5 w-5 text-orange-400" />
                      <span className="text-sm text-zinc-300">Gasto Calórico Estimado</span>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-orange-400">
                        {caloriesEstimate.total_calories} <span className="text-sm font-normal">kcal</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Volume: {caloriesEstimate.total_volume} kg
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-5 text-center text-[11px] tracking-[0.32em] text-primary/70">FITMASTER</div>
            </div>
          </div>

          <div className="border-t border-border/60 bg-background/55 p-4">
            <Button
              className="h-12 w-full gap-2 rounded-[1.15rem] text-sm font-bold uppercase tracking-[0.18em]"
              onClick={handleSave}
              disabled={saving}
              data-testid="save-progress-btn"
            >
              {saving ? (
                <div className="h-5 w-5 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  Salvar progresso
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
