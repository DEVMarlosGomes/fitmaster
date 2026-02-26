import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { MainLayout } from "../components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Switch } from "../components/ui/switch";
import { Calendar as CalendarPicker } from "../components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { CalendarDays, CheckCircle2, ClipboardList, MessageSquareText, SendHorizontal } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import api from "../lib/api";
import { toast } from "sonner";
/* eslint-disable react-hooks/exhaustive-deps */

const FEEDBACK_CATEGORIES = [
  { key: "dieta", label: "Dieta", prompt: "Como foi sua dieta nessa semana?" },
  { key: "treino", label: "Treino", prompt: "Como foi seu treino nessa semana?" },
  { key: "sono", label: "Sono", prompt: "Como foi seu sono nessa semana?" },
  { key: "bem_estar", label: "Bem-estar", prompt: "Como foi seu bem-estar nessa semana?" },
  { key: "fotos_medidas", label: "Fotos e Medidas", prompt: "Como foi sua evolucao em fotos e medidas?" },
];

const WEEKDAY_OPTIONS = [
  { value: 0, label: "Dom" },
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
  { value: 6, label: "Sab" },
];

const DEFAULT_REMINDER = "Lembrete: hoje e dia de responder seu feedback semanal.";

const toLocalDateISO = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const emptyFeedbackMap = () =>
  FEEDBACK_CATEGORIES.reduce((acc, category) => {
    acc[category.key] = "";
    return acc;
  }, {});

const defaultFeedbackPlan = () => ({
  mode: "weekly",
  weekly_days: [1],
  monthly_days: [1],
  period_start: toLocalDateISO(),
  period_end: "",
  reminder_enabled: true,
  reminder_message: DEFAULT_REMINDER,
  active: true,
});

const normalizeFeedbackPlan = (plan) => {
  if (!plan) return defaultFeedbackPlan();
  const base = defaultFeedbackPlan();
  return {
    ...base,
    ...plan,
    mode: plan.mode === "monthly" ? "monthly" : "weekly",
    weekly_days: [...new Set((plan.weekly_days || []).map(Number))]
      .filter((value) => Number.isInteger(value) && value >= 0 && value <= 6)
      .sort((a, b) => a - b),
    monthly_days: [...new Set((plan.monthly_days || []).map(Number))]
      .filter((value) => Number.isInteger(value) && value >= 1 && value <= 31)
      .sort((a, b) => a - b),
    period_start: plan.period_start || base.period_start,
    period_end: plan.period_end || "",
    reminder_enabled: typeof plan.reminder_enabled === "boolean" ? plan.reminder_enabled : base.reminder_enabled,
    reminder_message: plan.reminder_message || base.reminder_message,
    active: typeof plan.active === "boolean" ? plan.active : true,
  };
};

const buildFeedbackMapFromItems = (items, valueKey) => {
  const map = emptyFeedbackMap();
  (items || []).forEach((item) => {
    if (item?.key in map) {
      map[item.key] = item[valueKey] || "";
    }
  });
  return map;
};

const isFeedbackDay = (plan, date) => {
  if (!plan || !plan.active) return false;
  const dateISO = toLocalDateISO(date);
  if (plan.period_start && dateISO < plan.period_start) return false;
  if (plan.period_end && dateISO > plan.period_end) return false;
  if (plan.mode === "monthly") return (plan.monthly_days || []).includes(date.getDate());
  return (plan.weekly_days || []).includes(date.getDay());
};

const nextFeedbackDates = (plan, count = 4) => {
  if (!plan || !plan.active) return [];
  const result = [];
  const cursor = new Date();
  for (let index = 0; index < 120 && result.length < count; index += 1) {
    if (isFeedbackDay(plan, cursor)) {
      result.push(toLocalDateISO(cursor));
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
};

export default function CheckinsPage() {
  const { user } = useAuth();
  const isPersonal = user?.role === "personal";

  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [checkins, setCheckins] = useState([]);
  const [frequency, setFrequency] = useState(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedbackPlan, setFeedbackPlan] = useState(null);
  const [feedbackPlanForm, setFeedbackPlanForm] = useState(defaultFeedbackPlan());
  const [feedbackCalendarMonth, setFeedbackCalendarMonth] = useState(new Date());
  const [loadingFeedbackPlan, setLoadingFeedbackPlan] = useState(false);
  const [savingFeedbackPlan, setSavingFeedbackPlan] = useState(false);
  const [feedbackSubmissions, setFeedbackSubmissions] = useState([]);
  const [loadingFeedbackSubmissions, setLoadingFeedbackSubmissions] = useState(false);
  const [studentFeedback, setStudentFeedback] = useState(emptyFeedbackMap());
  const [personalReplies, setPersonalReplies] = useState(emptyFeedbackMap());
  const [submittingStudentFeedback, setSubmittingStudentFeedback] = useState(false);
  const [submittingPersonalReplyKey, setSubmittingPersonalReplyKey] = useState("");
  const todayISO = useMemo(() => toLocalDateISO(), []);

  useEffect(() => {
    if (isPersonal) {
      loadStudents();
    } else if (user?.id) {
      setSelectedStudent(user.id);
    }
  }, [isPersonal, user]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (selectedStudent) {
      loadCheckins(selectedStudent);
      loadFrequency(selectedStudent);
      loadFeedbackPlan(selectedStudent);
      loadFeedbackSubmissions(selectedStudent);
    }
  }, [selectedStudent]);

  const latestFeedbackSubmission = feedbackSubmissions[0] || null;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (isPersonal) {
      setPersonalReplies(
        buildFeedbackMapFromItems(latestFeedbackSubmission?.items, "personal_reply")
      );
    }
  }, [isPersonal, latestFeedbackSubmission?.id]);

  const loadStudents = async () => {
    try {
      const response = await api.get("/students");
      setStudents(response.data);
      if (response.data.length > 0) {
        setSelectedStudent(response.data[0].id);
      }
    } catch (error) {
      toast.error("Erro ao carregar alunos");
    }
  };

  const loadCheckins = async (studentId = selectedStudent) => {
    setLoading(true);
    try {
      const url = isPersonal
        ? `/checkins?student_id=${studentId}`
        : "/checkins";
      const response = await api.get(url);
      setCheckins(response.data);
    } catch (error) {
      toast.error("Erro ao carregar check-ins");
    } finally {
      setLoading(false);
    }
  };

  const loadFrequency = async (studentId = selectedStudent) => {
    try {
      const response = await api.get(`/checkins/frequency/${studentId}`);
      setFrequency(response.data);
    } catch (error) {
      setFrequency(null);
    }
  };

  const loadFeedbackPlan = async (studentId = selectedStudent) => {
    setLoadingFeedbackPlan(true);
    try {
      const response = await api.get(`/checkins/feedback-plan/${studentId}`);
      const normalizedPlan = normalizeFeedbackPlan(response.data);
      setFeedbackPlan(normalizedPlan);
      setFeedbackPlanForm(normalizedPlan);
    } catch (error) {
      if (error?.response?.status === 404) {
        setFeedbackPlan(null);
        setFeedbackPlanForm(defaultFeedbackPlan());
      } else {
        toast.error("Erro ao carregar planejamento de feedback");
      }
    } finally {
      setLoadingFeedbackPlan(false);
    }
  };

  const loadFeedbackSubmissions = async (studentId = selectedStudent) => {
    setLoadingFeedbackSubmissions(true);
    try {
      const url = isPersonal
        ? `/checkins/feedback-submissions?student_id=${studentId}&limit=12`
        : "/checkins/feedback-submissions?limit=12";
      const response = await api.get(url);
      const submissions = response.data || [];
      setFeedbackSubmissions(submissions);

      if (!isPersonal) {
        const todaySubmission = submissions.find((submission) => submission.reference_date === todayISO);
        if (todaySubmission) {
          setStudentFeedback(buildFeedbackMapFromItems(todaySubmission.items, "student_feedback"));
        } else {
          setStudentFeedback(emptyFeedbackMap());
        }
      }
    } catch (error) {
      toast.error("Erro ao carregar feedback semanal");
      setFeedbackSubmissions([]);
    } finally {
      setLoadingFeedbackSubmissions(false);
    }
  };

  const handleCheckin = async () => {
    setSubmitting(true);
    try {
      await api.post("/checkins", { notes: notes || null });
      toast.success("Check-in realizado!");
      setNotes("");
      loadCheckins(selectedStudent);
      loadFrequency(selectedStudent);
    } catch (error) {
      toast.error("Erro ao realizar check-in");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFeedbackCalendarClick = (date) => {
    setFeedbackPlanForm((previous) => {
      if (previous.mode === "monthly") {
        const day = date.getDate();
        const monthlyDays = previous.monthly_days.includes(day)
          ? previous.monthly_days.filter((value) => value !== day)
          : [...previous.monthly_days, day].sort((a, b) => a - b);
        return { ...previous, monthly_days: monthlyDays };
      }

      const weekday = date.getDay();
      const weeklyDays = previous.weekly_days.includes(weekday)
        ? previous.weekly_days.filter((value) => value !== weekday)
        : [...previous.weekly_days, weekday].sort((a, b) => a - b);
      return { ...previous, weekly_days: weeklyDays };
    });
  };

  const handleSaveFeedbackPlan = async () => {
    setSavingFeedbackPlan(true);
    try {
      const payload = {
        mode: feedbackPlanForm.mode,
        weekly_days: feedbackPlanForm.weekly_days,
        monthly_days: feedbackPlanForm.monthly_days,
        period_start: feedbackPlanForm.period_start || null,
        period_end: feedbackPlanForm.period_end || null,
        reminder_enabled: feedbackPlanForm.reminder_enabled,
        reminder_message: feedbackPlanForm.reminder_message || null,
        active: feedbackPlanForm.active,
      };

      const response = await api.put(`/checkins/feedback-plan/${selectedStudent}`, payload);
      const normalizedPlan = normalizeFeedbackPlan(response.data);
      setFeedbackPlan(normalizedPlan);
      setFeedbackPlanForm(normalizedPlan);
      toast.success("Planejamento salvo");
    } catch (error) {
      const message = error?.response?.data?.detail || "Erro ao salvar planejamento";
      toast.error(message);
    } finally {
      setSavingFeedbackPlan(false);
    }
  };

  const handleSubmitStudentFeedback = async () => {
    const hasContent = FEEDBACK_CATEGORIES.some(
      (category) => (studentFeedback[category.key] || "").trim().length > 0
    );
    if (!hasContent) {
      toast.error("Preencha ao menos um item do feedback");
      return;
    }

    setSubmittingStudentFeedback(true);
    try {
      await api.post("/checkins/feedback-submissions", {
        reference_date: todayISO,
        answers: studentFeedback,
      });
      toast.success("Feedback enviado");
      loadFeedbackSubmissions(selectedStudent);
    } catch (error) {
      const message = error?.response?.data?.detail || "Erro ao enviar feedback";
      toast.error(message);
    } finally {
      setSubmittingStudentFeedback(false);
    }
  };

  const handleSubmitPersonalReply = async (feedbackKey) => {
    if (!latestFeedbackSubmission?.id) {
      return;
    }

    setSubmittingPersonalReplyKey(feedbackKey);
    try {
      await api.patch(`/checkins/feedback-submissions/${latestFeedbackSubmission.id}/replies`, {
        replies: [{ key: feedbackKey, reply: personalReplies[feedbackKey] || null }],
      });
      toast.success("Devolutiva enviada");
      loadFeedbackSubmissions(selectedStudent);
    } catch (error) {
      const message = error?.response?.data?.detail || "Erro ao enviar devolutiva";
      toast.error(message);
    } finally {
      setSubmittingPersonalReplyKey("");
    }
  };

  const latestItemsByKey = useMemo(() => {
    const map = {};
    (latestFeedbackSubmission?.items || []).forEach((item) => {
      map[item.key] = item;
    });
    return map;
  }, [latestFeedbackSubmission]);

  const isTodayFeedbackDay = useMemo(
    () => isFeedbackDay(feedbackPlan, new Date()),
    [feedbackPlan]
  );

  const feedbackPlanSummary = useMemo(() => {
    if (!feedbackPlan) return "Sem planejamento de feedback definido.";
    if (!feedbackPlan.active) return "Planejamento de feedback inativo.";

    const periodStart = feedbackPlan.period_start
      ? new Date(`${feedbackPlan.period_start}T00:00:00`).toLocaleDateString("pt-BR")
      : null;
    const periodEnd = feedbackPlan.period_end
      ? new Date(`${feedbackPlan.period_end}T00:00:00`).toLocaleDateString("pt-BR")
      : null;
    const periodText = periodStart
      ? `Periodo: ${periodStart}${periodEnd ? ` ate ${periodEnd}` : ""}.`
      : "";

    if (feedbackPlan.mode === "monthly") {
      return `Feedback mensal nos dias ${(feedbackPlan.monthly_days || []).join(", ") || "-"}. ${periodText}`;
    }

    const weekdayText = (feedbackPlan.weekly_days || [])
      .map((value) => WEEKDAY_OPTIONS.find((day) => day.value === value)?.label || value)
      .join(", ");
    return `Feedback semanal em ${weekdayText || "-"}. ${periodText}`;
  }, [feedbackPlan]);

  const upcomingPlanDates = useMemo(() => nextFeedbackDates(feedbackPlan), [feedbackPlan]);

  const feedbackCalendarModifiers = useMemo(
    () => ({
      planned: (date) =>
        feedbackPlanForm.mode === "monthly"
          ? feedbackPlanForm.monthly_days.includes(date.getDate())
          : feedbackPlanForm.weekly_days.includes(date.getDay()),
    }),
    [feedbackPlanForm.mode, feedbackPlanForm.monthly_days, feedbackPlanForm.weekly_days]
  );

  const frequencyData = frequency?.frequency_by_date
    ? Object.entries(frequency.frequency_by_date)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date))
    : [];

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase">
              {isPersonal ? "Check-ins e Feedback" : "Check-in e Feedback"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isPersonal
                ? "Defina os dias de feedback e envie devolutivas para os alunos."
                : "Registre seu check-in e envie feedback semanal do treino."}
            </p>
          </div>

          {isPersonal && (
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger className="w-[220px] bg-secondary/50 border-white/10">
                <SelectValue placeholder="Selecione o aluno" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {!isPersonal && (
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="space-y-3">
                <Textarea
                  placeholder="Observações (opcional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-secondary/50 border-white/10"
                />
                <Button onClick={handleCheckin} disabled={submitting} className="gap-2">
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Fazer Check-in
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isPersonal && selectedStudent && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-xl font-bold uppercase flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-primary" />
                Planejamento de Feedback
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingFeedbackPlan ? (
                <div className="flex justify-center py-8">
                  <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Periodicidade</Label>
                      <Select
                        value={feedbackPlanForm.mode}
                        onValueChange={(value) =>
                          setFeedbackPlanForm((previous) => ({ ...previous, mode: value }))
                        }
                      >
                        <SelectTrigger className="bg-secondary/50 border-white/10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          <SelectItem value="weekly">Semanal</SelectItem>
                          <SelectItem value="monthly">Mensal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Início</Label>
                        <Input
                          type="date"
                          value={feedbackPlanForm.period_start}
                          onChange={(event) =>
                            setFeedbackPlanForm((previous) => ({
                              ...previous,
                              period_start: event.target.value,
                            }))
                          }
                          className="bg-secondary/50 border-white/10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Fim</Label>
                        <Input
                          type="date"
                          value={feedbackPlanForm.period_end}
                          onChange={(event) =>
                            setFeedbackPlanForm((previous) => ({
                              ...previous,
                              period_end: event.target.value,
                            }))
                          }
                          className="bg-secondary/50 border-white/10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div>
                        <p className="text-sm font-semibold">Feedback ativo</p>
                        <p className="text-xs text-muted-foreground">Permite envio de respostas do aluno</p>
                      </div>
                      <Switch
                        checked={feedbackPlanForm.active}
                        onCheckedChange={(value) =>
                          setFeedbackPlanForm((previous) => ({ ...previous, active: value }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div>
                        <p className="text-sm font-semibold">Lembrete</p>
                        <p className="text-xs text-muted-foreground">Mensagem para o dia do feedback</p>
                      </div>
                      <Switch
                        checked={feedbackPlanForm.reminder_enabled}
                        onCheckedChange={(value) =>
                          setFeedbackPlanForm((previous) => ({ ...previous, reminder_enabled: value }))
                        }
                      />
                    </div>
                  </div>

                  {feedbackPlanForm.reminder_enabled && (
                    <div className="space-y-2">
                      <Label>Mensagem de lembrete</Label>
                      <Textarea
                        value={feedbackPlanForm.reminder_message}
                        onChange={(event) =>
                          setFeedbackPlanForm((previous) => ({
                            ...previous,
                            reminder_message: event.target.value,
                          }))
                        }
                        className="bg-secondary/50 border-white/10"
                        placeholder="Mensagem exibida para o aluno"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Clique no calendário para marcar dias da semana ou do mês.
                    </p>
                    <div className="rounded-lg border border-border bg-secondary/20 p-2 overflow-auto">
                      <CalendarPicker
                        month={feedbackCalendarMonth}
                        onMonthChange={setFeedbackCalendarMonth}
                        showOutsideDays={false}
                        onDayClick={handleFeedbackCalendarClick}
                        modifiers={feedbackCalendarModifiers}
                        modifiersClassNames={{
                          planned:
                            "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(feedbackPlanForm.mode === "monthly"
                      ? feedbackPlanForm.monthly_days
                      : feedbackPlanForm.weekly_days
                    ).length === 0 ? (
                      <Badge variant="outline" className="border-white/20 text-muted-foreground">
                        Nenhum dia selecionado
                      </Badge>
                    ) : feedbackPlanForm.mode === "monthly" ? (
                      feedbackPlanForm.monthly_days.map((day) => (
                        <Badge key={day} className="bg-primary/20 text-primary border-transparent">
                          Dia {day}
                        </Badge>
                      ))
                    ) : (
                      feedbackPlanForm.weekly_days.map((day) => (
                        <Badge key={day} className="bg-primary/20 text-primary border-transparent">
                          {WEEKDAY_OPTIONS.find((option) => option.value === day)?.label || day}
                        </Badge>
                      ))
                    )}
                  </div>

                  <Button onClick={handleSaveFeedbackPlan} disabled={savingFeedbackPlan}>
                    {savingFeedbackPlan ? "Salvando..." : "Salvar Planejamento"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-xl font-bold uppercase flex items-center gap-2">
              <MessageSquareText className="w-5 h-5 text-primary" />
              {isPersonal ? "Devolutiva Semanal" : "Feedback Semanal"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-secondary/30 p-3 text-sm">
              <p className="font-semibold">Planejamento atual</p>
              <p className="text-muted-foreground mt-1">{feedbackPlanSummary}</p>
              {!isPersonal && (
                <div className="text-xs text-muted-foreground mt-2">
                  <p>{isTodayFeedbackDay ? "Hoje é dia de feedback." : "Hoje não é dia de feedback."}</p>
                  {upcomingPlanDates.length > 0 && (
                    <p className="mt-1">
                      Próximas datas:{" "}
                      {upcomingPlanDates
                        .map((date) => new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR"))
                        .join(", ")}
                    </p>
                  )}
                </div>
              )}
            </div>

            {loadingFeedbackSubmissions ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : isPersonal ? (
              !latestFeedbackSubmission ? (
                <p className="text-sm text-muted-foreground">Nenhum feedback do aluno registrado até agora.</p>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-sm font-semibold">
                      Referência:{" "}
                      {new Date(`${latestFeedbackSubmission.reference_date}T00:00:00`).toLocaleDateString("pt-BR")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Progresso: {latestFeedbackSubmission.replied_items}/
                      {latestFeedbackSubmission.answered_items} ({latestFeedbackSubmission.completion_percentage}%)
                    </p>
                  </div>

                  {FEEDBACK_CATEGORIES.map((category) => {
                    const item = latestItemsByKey[category.key];
                    const hasStudentFeedback = Boolean(item?.student_feedback);
                    const hasReply = Boolean(item?.personal_reply);

                    return (
                      <div key={category.key} className="rounded-lg border border-border p-3 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="font-semibold">{category.label}</p>
                            <p className="text-xs text-muted-foreground">{category.prompt}</p>
                          </div>
                          <Badge
                            variant="outline"
                            className={
                              hasReply
                                ? "border-emerald-400/40 text-emerald-300"
                                : "border-amber-400/40 text-amber-300"
                            }
                          >
                            {hasReply ? "Completo" : "Pendente"}
                          </Badge>
                        </div>

                        <div className="rounded-md bg-secondary/40 p-2">
                          <p className="text-xs text-muted-foreground">Resposta do aluno</p>
                          <p className="text-sm mt-1">{item?.student_feedback || "Sem resposta nessa categoria."}</p>
                        </div>

                        <Textarea
                          value={personalReplies[category.key] || ""}
                          onChange={(event) =>
                            setPersonalReplies((previous) => ({
                              ...previous,
                              [category.key]: event.target.value,
                            }))
                          }
                          placeholder="Escreva sua devolutiva"
                          className="bg-secondary/50 border-white/10"
                          disabled={!hasStudentFeedback}
                        />

                        <Button
                          onClick={() => handleSubmitPersonalReply(category.key)}
                          disabled={!hasStudentFeedback || submittingPersonalReplyKey === category.key}
                          className="gap-2"
                        >
                          {submittingPersonalReplyKey === category.key ? (
                            "Enviando..."
                          ) : (
                            <>
                              <SendHorizontal className="w-4 h-4" />
                              Responder
                            </>
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              <div className="space-y-4">
                {FEEDBACK_CATEGORIES.map((category) => {
                  const item = latestItemsByKey[category.key];
                  return (
                    <div key={category.key} className="rounded-lg border border-border p-3 space-y-3">
                      <div>
                        <p className="font-semibold">{category.label}</p>
                        <p className="text-xs text-muted-foreground">{category.prompt}</p>
                      </div>
                      <Textarea
                        value={studentFeedback[category.key] || ""}
                        onChange={(event) =>
                          setStudentFeedback((previous) => ({
                            ...previous,
                            [category.key]: event.target.value,
                          }))
                        }
                        placeholder="Escreva seu feedback"
                        className="bg-secondary/50 border-white/10"
                      />
                      {item?.personal_reply && (
                        <div className="rounded-md bg-secondary/40 p-2">
                          <p className="text-xs text-muted-foreground">Devolutiva do personal</p>
                          <p className="text-sm mt-1">{item.personal_reply}</p>
                        </div>
                      )}
                    </div>
                  );
                })}

                <Button
                  onClick={handleSubmitStudentFeedback}
                  disabled={submittingStudentFeedback || !feedbackPlan || !isTodayFeedbackDay}
                  className="gap-2"
                >
                  {submittingStudentFeedback ? (
                    "Enviando..."
                  ) : (
                    <>
                      <SendHorizontal className="w-4 h-4" />
                      Enviar Feedback
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        {frequency && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Total de check-ins (30 dias)</p>
                <p className="text-2xl font-black">{frequency.total_checkins}</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Dias presentes</p>
                <p className="text-2xl font-black">{frequency.unique_days}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Frequency Chart */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-xl font-bold uppercase flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-primary" />
              Frequência (30 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {frequencyData.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                Nenhum dado de frequência disponível
              </div>
            ) : (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={frequencyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="date" stroke="#71717a" tick={{ fill: "#a1a1aa", fontSize: 12 }} />
                    <YAxis stroke="#71717a" tick={{ fill: "#a1a1aa", fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Check-in History */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-xl font-bold uppercase flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-cyan-400" />
              Histórico de Check-ins
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : checkins.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum check-in registrado.</p>
            ) : (
              <div className="space-y-3">
                {checkins.slice(0, 10).map((c) => (
                  <div key={c.id} className="p-3 rounded-lg bg-secondary/30">
                    <p className="text-sm font-semibold">
                      {new Date(c.check_in_time).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </p>
                    {c.notes && <p className="text-xs text-muted-foreground mt-1">{c.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

