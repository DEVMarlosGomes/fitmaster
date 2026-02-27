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
import { Slider } from "../components/ui/slider";
import { Progress } from "../components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { BellRing, CalendarDays, CheckCircle2, ClipboardList, MessageSquareText, SendHorizontal, Camera } from "lucide-react";
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
  { key: "dieta", label: "Dieta", prompt: "Adesao da dieta no periodo." },
  { key: "treino", label: "Treino", prompt: "Adesao ao treino no periodo." },
  { key: "sono", label: "Sono", prompt: "Qualidade do sono no periodo." },
  { key: "bem_estar", label: "Bem-estar", prompt: "Percepcao de bem-estar no periodo." },
];

const PHOTO_FIELDS = [
  { key: "front", label: "Foto de frente" },
  { key: "side", label: "Foto de lado" },
  { key: "back", label: "Foto de costas" },
];

const MODE_FILTER_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "daily", label: "Diariamente" },
  { value: "weekly", label: "Semanalmente" },
  { value: "monthly", label: "Mensalmente" },
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

const DEFAULT_REMINDER = "Lembrete: responda seu check-in e relato.";

const DEFAULT_MEASUREMENTS = {
  fasting_weight: "",
  waist_circumference: "",
  abdominal_circumference: "",
  hip_circumference: "",
};

const DEFAULT_PHOTOS = {
  front: "",
  side: "",
  back: "",
};

const DEFAULT_PHOTO_FILES = {
  front: null,
  side: null,
  back: null,
};

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

const emptyScoreMap = () =>
  FEEDBACK_CATEGORIES.reduce((acc, category) => {
    acc[category.key] = { completion_percentage: 0, observation: "" };
    return acc;
  }, {});

const clampPercentage = (value) => {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return 0;
  return Math.max(0, Math.min(100, Math.round(numberValue)));
};

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
  const mode = ["daily", "weekly", "monthly"].includes(plan.mode) ? plan.mode : base.mode;
  return {
    ...base,
    ...plan,
    mode,
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

const buildScoreMapFromItems = (items) => {
  const map = emptyScoreMap();
  (items || []).forEach((item) => {
    if (item?.key in map) {
      map[item.key] = {
        completion_percentage: clampPercentage(item?.completion_percentage ?? 0),
        observation: item?.student_observation || item?.student_feedback || "",
      };
    }
  });
  return map;
};

const averageScoreFromItems = (items) => {
  const scores = (items || [])
    .map((item) => item?.completion_percentage)
    .filter((value) => typeof value === "number");
  if (!scores.length) return null;
  const total = scores.reduce((sum, value) => sum + value, 0);
  return Math.round(total / scores.length);
};

const resolvePhotoUrl = (backendUrl, url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${backendUrl}${url}`;
};

const parsePositiveNumber = (value) => {
  const normalized = String(value || "").replace(",", ".");
  const numberValue = Number(normalized);
  if (!Number.isFinite(numberValue) || numberValue <= 0) return null;
  return numberValue;
};

const isFeedbackDay = (plan, date) => {
  if (!plan || !plan.active) return false;
  const dateISO = toLocalDateISO(date);
  if (plan.period_start && dateISO < plan.period_start) return false;
  if (plan.period_end && dateISO > plan.period_end) return false;
  if (plan.mode === "daily") return true;
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
  const backendUrl = process.env.REACT_APP_BACKEND_URL || "";
  const isFemaleStudent = useMemo(
    () => String(user?.gender || "").trim().toLowerCase().startsWith("fem"),
    [user?.gender]
  );

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
  const [studentScores, setStudentScores] = useState(emptyScoreMap());
  const [studentMeasurements, setStudentMeasurements] = useState(DEFAULT_MEASUREMENTS);
  const [studentPhotos, setStudentPhotos] = useState(DEFAULT_PHOTOS);
  const [studentPhotoFiles, setStudentPhotoFiles] = useState(DEFAULT_PHOTO_FILES);
  const [studentGeneralObservations, setStudentGeneralObservations] = useState("");
  const [uploadingPhotoKey, setUploadingPhotoKey] = useState("");
  const [personalReplies, setPersonalReplies] = useState(emptyFeedbackMap());
  const [submittingStudentFeedback, setSubmittingStudentFeedback] = useState(false);
  const [submittingPersonalReplyKey, setSubmittingPersonalReplyKey] = useState("");
  const [activeSubmissionId, setActiveSubmissionId] = useState("");
  const [overviewFilter, setOverviewFilter] = useState("all");
  const [overviewRows, setOverviewRows] = useState([]);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [sendingReminders, setSendingReminders] = useState(false);
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
  const activeFeedbackSubmission =
    feedbackSubmissions.find((submission) => submission.id === activeSubmissionId) ||
    latestFeedbackSubmission ||
    null;
  const activeItemsByKey = useMemo(() => {
    const map = {};
    (activeFeedbackSubmission?.items || []).forEach((item) => {
      map[item.key] = item;
    });
    return map;
  }, [activeFeedbackSubmission?.id]);

  useEffect(() => {
    if (!feedbackSubmissions.length) {
      setActiveSubmissionId("");
      return;
    }
    const hasActive = feedbackSubmissions.some((submission) => submission.id === activeSubmissionId);
    if (!hasActive) {
      setActiveSubmissionId(feedbackSubmissions[0].id);
    }
  }, [feedbackSubmissions, activeSubmissionId]);

  useEffect(() => {
    if (!isPersonal) return;
    setPersonalReplies(
      buildFeedbackMapFromItems(activeFeedbackSubmission?.items, "personal_reply")
    );
  }, [isPersonal, activeFeedbackSubmission?.id]);

  useEffect(() => {
    if (!isPersonal || !students.length) return;
    loadOverviewRows();
  }, [isPersonal, students, overviewFilter]);

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
          setStudentScores(buildScoreMapFromItems(todaySubmission.items));
          setStudentMeasurements({
            fasting_weight: String(todaySubmission?.measurements?.fasting_weight ?? ""),
            waist_circumference: String(todaySubmission?.measurements?.waist_circumference ?? ""),
            abdominal_circumference: String(todaySubmission?.measurements?.abdominal_circumference ?? ""),
            hip_circumference: String(todaySubmission?.measurements?.hip_circumference ?? ""),
          });
          setStudentPhotos({
            front: todaySubmission?.photos?.front || "",
            side: todaySubmission?.photos?.side || "",
            back: todaySubmission?.photos?.back || "",
          });
          setStudentGeneralObservations(todaySubmission?.general_observations || "");
        } else {
          setStudentScores(emptyScoreMap());
          setStudentMeasurements(DEFAULT_MEASUREMENTS);
          setStudentPhotos(DEFAULT_PHOTOS);
          setStudentGeneralObservations("");
        }
        setStudentPhotoFiles(DEFAULT_PHOTO_FILES);
      }
    } catch (error) {
      toast.error("Erro ao carregar feedback semanal");
      setFeedbackSubmissions([]);
    } finally {
      setLoadingFeedbackSubmissions(false);
    }
  };

  const loadOverviewRows = async () => {
    setLoadingOverview(true);
    try {
      const today = new Date();
      const rows = await Promise.all(
        students.map(async (student) => {
          let plan = null;
          try {
            const planResponse = await api.get(`/checkins/feedback-plan/${student.id}`);
            plan = normalizeFeedbackPlan(planResponse.data);
          } catch (error) {
            plan = null;
          }

          let studentSubmissions = [];
          try {
            const submissionsResponse = await api.get(
              `/checkins/feedback-submissions?student_id=${student.id}&limit=8`
            );
            studentSubmissions = submissionsResponse.data || [];
          } catch (error) {
            studentSubmissions = [];
          }

          const todaySubmission = studentSubmissions.find((item) => item.reference_date === todayISO);
          const latestSubmission = studentSubmissions[0] || null;
          const expectedToday = isFeedbackDay(plan, today);
          const mode = plan?.mode || "none";
          let status = "inativo";

          if (plan?.active) {
            status = expectedToday
              ? (todaySubmission ? "respondido" : "pendente")
              : "aguardando";
          }

          return {
            student_id: student.id,
            student_name: student.name,
            mode,
            status,
            expectedToday,
            pendingToday: Boolean(plan?.active && expectedToday && !todaySubmission),
            latestSubmission,
            averageScore: averageScoreFromItems((todaySubmission || latestSubmission)?.items || []),
          };
        })
      );

      const filteredRows = rows.filter((row) => (
        overviewFilter === "all" ? true : row.mode === overviewFilter
      ));

      const order = { pendente: 0, respondido: 1, aguardando: 2, inativo: 3 };
      filteredRows.sort((a, b) => {
        if (order[a.status] !== order[b.status]) {
          return order[a.status] - order[b.status];
        }
        return a.student_name.localeCompare(b.student_name);
      });

      setOverviewRows(filteredRows);
    } catch (error) {
      toast.error("Erro ao montar painel de check-ins");
      setOverviewRows([]);
    } finally {
      setLoadingOverview(false);
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
      if (previous.mode === "daily") {
        return previous;
      }
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
        weekly_days: feedbackPlanForm.mode === "weekly" ? feedbackPlanForm.weekly_days : [],
        monthly_days: feedbackPlanForm.mode === "monthly" ? feedbackPlanForm.monthly_days : [],
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
      if (isPersonal) {
        loadOverviewRows();
      }
    } catch (error) {
      const message = error?.response?.data?.detail || "Erro ao salvar planejamento";
      toast.error(message);
    } finally {
      setSavingFeedbackPlan(false);
    }
  };

  const uploadStudentPhoto = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post("/checkins/feedback-submissions/upload-photo", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data?.photo_url;
  };

  const handleSubmitStudentFeedback = async () => {
    if (!feedbackPlan || !isTodayFeedbackDay) {
      toast.error("Hoje nao esta configurado para envio de relato.");
      return;
    }

    const fastingWeight = parsePositiveNumber(studentMeasurements.fasting_weight);
    const waistCircumference = parsePositiveNumber(studentMeasurements.waist_circumference);
    const abdominalCircumference = parsePositiveNumber(studentMeasurements.abdominal_circumference);
    const hipCircumference = parsePositiveNumber(studentMeasurements.hip_circumference);

    if (!fastingWeight || !waistCircumference || !abdominalCircumference) {
      toast.error("Peso em jejum, cintura e abdominal sao obrigatorios.");
      return;
    }
    if (isFemaleStudent && !hipCircumference) {
      toast.error("Para alunas, a medida de quadril e obrigatoria.");
      return;
    }

    setSubmittingStudentFeedback(true);
    try {
      const photoPayload = { ...studentPhotos };
      for (const photoField of PHOTO_FIELDS) {
        const file = studentPhotoFiles[photoField.key];
        if (!file) continue;
        setUploadingPhotoKey(photoField.key);
        photoPayload[photoField.key] = await uploadStudentPhoto(file);
      }
      setUploadingPhotoKey("");
      setStudentPhotos(photoPayload);

      if (PHOTO_FIELDS.some((photoField) => !photoPayload[photoField.key])) {
        toast.error("Fotos de frente, lado e costas sao obrigatorias.");
        return;
      }

      const scoresPayload = FEEDBACK_CATEGORIES.reduce((acc, category) => {
        acc[category.key] = {
          completion_percentage: clampPercentage(studentScores[category.key]?.completion_percentage ?? 0),
          observation: (studentScores[category.key]?.observation || "").trim() || null,
        };
        return acc;
      }, {});

      await api.post("/checkins/feedback-submissions", {
        reference_date: todayISO,
        scores: scoresPayload,
        measurements: {
          fasting_weight: fastingWeight,
          waist_circumference: waistCircumference,
          abdominal_circumference: abdominalCircumference,
          hip_circumference: hipCircumference || null,
        },
        photos: photoPayload,
        general_observations: studentGeneralObservations?.trim() || null,
      });

      setStudentPhotoFiles(DEFAULT_PHOTO_FILES);
      toast.success("Relato enviado.");
      loadFeedbackSubmissions(selectedStudent);
    } catch (error) {
      const message = error?.response?.data?.detail || "Erro ao enviar relato";
      toast.error(message);
    } finally {
      setUploadingPhotoKey("");
      setSubmittingStudentFeedback(false);
    }
  };

  const handleSubmitPersonalReply = async (feedbackKey) => {
    if (!activeFeedbackSubmission?.id) return;

    setSubmittingPersonalReplyKey(feedbackKey);
    try {
      await api.patch(`/checkins/feedback-submissions/${activeFeedbackSubmission.id}/replies`, {
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

  const handleSendReminders = async () => {
    const studentIds = overviewRows
      .filter((row) => row.pendingToday)
      .map((row) => row.student_id);
    if (!studentIds.length) {
      toast.info("Nenhum aluno pendente hoje.");
      return;
    }
    setSendingReminders(true);
    try {
      await api.post("/checkins/feedback-reminders", {
        student_ids: studentIds,
        message: feedbackPlanForm.reminder_message || null,
      });
      toast.success(`Lembrete enviado para ${studentIds.length} aluno(s).`);
    } catch (error) {
      const message = error?.response?.data?.detail || "Erro ao enviar lembretes";
      toast.error(message);
    } finally {
      setSendingReminders(false);
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

    if (feedbackPlan.mode === "daily") {
      return `Feedback diario ativo. ${periodText}`;
    }
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
        feedbackPlanForm.mode === "daily"
          ? false
          : feedbackPlanForm.mode === "monthly"
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

  const overviewExpectedCount = overviewRows.filter((row) => row.expectedToday && row.status !== "inativo").length;
  const overviewRespondedCount = overviewRows.filter((row) => row.status === "respondido").length;
  const overviewPendingCount = overviewRows.filter((row) => row.pendingToday).length;

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase">
              {isPersonal ? "Check-ins e Relatos" : "Check-in e Relato"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isPersonal
                ? "Acompanhe pendencias e historico individual por aluno."
                : "Registre check-in e envie relato com percentual, medidas e fotos."}
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

        {isPersonal && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-xl font-bold uppercase flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-primary" />
                Check-ins dos Clientes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs value={overviewFilter} onValueChange={setOverviewFilter}>
                <TabsList className="bg-secondary/40">
                  {MODE_FILTER_OPTIONS.map((filterOption) => (
                    <TabsTrigger key={filterOption.value} value={filterOption.value}>
                      {filterOption.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-lg border border-border bg-secondary/20 p-3">
                  <p className="text-xs text-muted-foreground uppercase">Esperados hoje</p>
                  <p className="text-2xl font-black">{overviewExpectedCount}</p>
                </div>
                <div className="rounded-lg border border-border bg-secondary/20 p-3">
                  <p className="text-xs text-muted-foreground uppercase">Respondidos hoje</p>
                  <p className="text-2xl font-black">{overviewRespondedCount}</p>
                </div>
                <div className="rounded-lg border border-border bg-secondary/20 p-3">
                  <p className="text-xs text-muted-foreground uppercase">Pendentes hoje</p>
                  <p className="text-2xl font-black">{overviewPendingCount}</p>
                </div>
              </div>

              {loadingOverview ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : overviewRows.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum aluno encontrado para esse filtro.
                </p>
              ) : (
                <div className="space-y-2">
                  {overviewRows.map((row) => (
                    <button
                      key={row.student_id}
                      type="button"
                      onClick={() => setSelectedStudent(row.student_id)}
                      className={`w-full rounded-lg border p-3 text-left transition-colors ${
                        selectedStudent === row.student_id
                          ? "border-primary bg-primary/10"
                          : "border-border bg-secondary/20 hover:bg-secondary/30"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold">{row.student_name}</p>
                        <Badge
                          variant="outline"
                          className={
                            row.status === "respondido"
                              ? "border-emerald-400/40 text-emerald-300"
                              : row.status === "pendente"
                              ? "border-amber-400/40 text-amber-300"
                              : row.status === "aguardando"
                              ? "border-blue-400/40 text-blue-300"
                              : "border-white/20 text-muted-foreground"
                          }
                        >
                          {row.status === "respondido"
                            ? "Respondido"
                            : row.status === "pendente"
                            ? "Pendente"
                            : row.status === "aguardando"
                            ? "Aguardando data"
                            : "Inativo"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Periodicidade: {row.mode === "none" ? "Sem plano" : row.mode}
                        {" | "}Ultimo relato: {row.latestSubmission?.reference_date
                          ? new Date(`${row.latestSubmission.reference_date}T00:00:00`).toLocaleDateString("pt-BR")
                          : "-"}
                        {" | "}Media: {typeof row.averageScore === "number" ? `${row.averageScore}%` : "-"}
                      </p>
                    </button>
                  ))}
                </div>
              )}

              <Button
                onClick={handleSendReminders}
                disabled={sendingReminders || overviewPendingCount === 0}
                className="gap-2"
              >
                {sendingReminders ? (
                  "Enviando..."
                ) : (
                  <>
                    <BellRing className="w-4 h-4" />
                    Enviar lembrete para {overviewPendingCount} aluno(s)
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {isPersonal && selectedStudent && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-xl font-bold uppercase flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-primary" />
                Planejamento de Relato
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
                          <SelectItem value="daily">Diario</SelectItem>
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
                        <p className="text-sm font-semibold">Relato ativo</p>
                        <p className="text-xs text-muted-foreground">Permite envio do relato pelo aluno</p>
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
                        <p className="text-xs text-muted-foreground">Mensagem para o dia do relato</p>
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

                  {feedbackPlanForm.mode === "daily" ? (
                    <div className="rounded-lg border border-border bg-secondary/20 p-3 text-sm text-muted-foreground">
                      No modo diario, o aluno pode enviar relato todos os dias no periodo ativo.
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">
                          Clique no calendario para marcar dias da semana ou do mes.
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
                    </>
                  )}

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
              {isPersonal ? "Relato do Periodo" : "Meu Relato do Periodo"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-secondary/30 p-3 text-sm">
              <p className="font-semibold">Planejamento atual</p>
              <p className="text-muted-foreground mt-1">{feedbackPlanSummary}</p>
              {!isPersonal && (
                <div className="text-xs text-muted-foreground mt-2">
                  <p>{isTodayFeedbackDay ? "Hoje e dia de relato." : "Hoje nao e dia de relato."}</p>
                  {upcomingPlanDates.length > 0 && (
                    <p className="mt-1">
                      Proximas datas:{" "}
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
              !activeFeedbackSubmission ? (
                <p className="text-sm text-muted-foreground">Nenhum relato registrado ate agora.</p>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-lg border border-border p-3 text-sm">
                    <p>Referencia: {new Date(`${activeFeedbackSubmission.reference_date}T00:00:00`).toLocaleDateString("pt-BR")}</p>
                    <p className="text-muted-foreground mt-1">
                      Respondidos: {activeFeedbackSubmission.answered_items} | Devolutivas: {activeFeedbackSubmission.replied_items}
                      {" | "}Media: {typeof averageScoreFromItems(activeFeedbackSubmission.items) === "number"
                        ? `${averageScoreFromItems(activeFeedbackSubmission.items)}%`
                        : "-"}
                    </p>
                  </div>

                  {activeFeedbackSubmission.measurements && (
                    <div className="rounded-lg border border-border p-3 text-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div><p className="text-xs text-muted-foreground">Peso jejum</p><p>{activeFeedbackSubmission.measurements.fasting_weight} kg</p></div>
                      <div><p className="text-xs text-muted-foreground">Cintura</p><p>{activeFeedbackSubmission.measurements.waist_circumference} cm</p></div>
                      <div><p className="text-xs text-muted-foreground">Abdominal</p><p>{activeFeedbackSubmission.measurements.abdominal_circumference} cm</p></div>
                      <div><p className="text-xs text-muted-foreground">Quadril</p><p>{activeFeedbackSubmission.measurements.hip_circumference || "-"}</p></div>
                    </div>
                  )}

                  {activeFeedbackSubmission.photos && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {PHOTO_FIELDS.map((field) => (
                        <div key={field.key} className="rounded-lg overflow-hidden border border-border bg-secondary/20">
                          {activeFeedbackSubmission.photos[field.key] ? (
                            <img
                              src={resolvePhotoUrl(backendUrl, activeFeedbackSubmission.photos[field.key])}
                              alt={field.label}
                              className="w-full h-40 object-cover"
                            />
                          ) : (
                            <div className="h-40 flex items-center justify-center text-xs text-muted-foreground">Sem foto</div>
                          )}
                          <div className="px-3 py-2 text-xs text-muted-foreground">{field.label}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="rounded-lg border border-border p-3">
                    <p className="text-sm font-semibold">Observacoes gerais</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {activeFeedbackSubmission.general_observations || "Sem observacoes gerais."}
                    </p>
                  </div>

                  {FEEDBACK_CATEGORIES.map((category) => {
                    const item = activeItemsByKey[category.key];
                    const scoreValue = clampPercentage(item?.completion_percentage ?? 0);
                    return (
                      <div key={category.key} className="rounded-lg border border-border p-3 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="font-semibold">{category.label}</p>
                            <p className="text-xs text-muted-foreground">{category.prompt}</p>
                          </div>
                          <Badge variant="outline" className={item?.personal_reply ? "border-emerald-400/40 text-emerald-300" : "border-amber-400/40 text-amber-300"}>
                            {item?.personal_reply ? "Completo" : "Pendente"}
                          </Badge>
                        </div>
                        <div className="rounded-md bg-secondary/40 p-2 space-y-2">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Percentual</span>
                            <span>{scoreValue}%</span>
                          </div>
                          <Progress value={scoreValue} />
                          <p className="text-sm">{item?.student_observation || item?.student_feedback || "Sem observacao."}</p>
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
                        />
                        <Button
                          onClick={() => handleSubmitPersonalReply(category.key)}
                          disabled={submittingPersonalReplyKey === category.key}
                          className="gap-2"
                        >
                          {submittingPersonalReplyKey === category.key ? "Enviando..." : <><SendHorizontal className="w-4 h-4" />Responder</>}
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
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold">{category.label}</p>
                          <p className="text-xs text-muted-foreground">{category.prompt}</p>
                        </div>
                        <Badge className="bg-primary/20 text-primary border-transparent">
                          {clampPercentage(studentScores[category.key]?.completion_percentage)}%
                        </Badge>
                      </div>
                      <Slider
                        min={0}
                        max={100}
                        step={1}
                        value={[clampPercentage(studentScores[category.key]?.completion_percentage)]}
                        onValueChange={(values) =>
                          setStudentScores((previous) => ({
                            ...previous,
                            [category.key]: {
                              ...previous[category.key],
                              completion_percentage: values?.[0] || 0,
                            },
                          }))
                        }
                      />
                      <Textarea
                        value={studentScores[category.key]?.observation || ""}
                        onChange={(event) =>
                          setStudentScores((previous) => ({
                            ...previous,
                            [category.key]: {
                              ...previous[category.key],
                              observation: event.target.value,
                            },
                          }))
                        }
                        placeholder="Observacao (opcional)"
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

                <div className="rounded-lg border border-border p-3 space-y-3">
                  <p className="font-semibold">Atualizacao de medidas (obrigatorio)</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input value={studentMeasurements.fasting_weight} onChange={(event) => setStudentMeasurements((previous) => ({ ...previous, fasting_weight: event.target.value }))} placeholder="Peso em jejum (kg) *" className="bg-secondary/50 border-white/10" />
                    <Input value={studentMeasurements.waist_circumference} onChange={(event) => setStudentMeasurements((previous) => ({ ...previous, waist_circumference: event.target.value }))} placeholder="Circunferencia cintura (cm) *" className="bg-secondary/50 border-white/10" />
                    <Input value={studentMeasurements.abdominal_circumference} onChange={(event) => setStudentMeasurements((previous) => ({ ...previous, abdominal_circumference: event.target.value }))} placeholder="Circunferencia abdominal (cm) *" className="bg-secondary/50 border-white/10" />
                    <Input value={studentMeasurements.hip_circumference} onChange={(event) => setStudentMeasurements((previous) => ({ ...previous, hip_circumference: event.target.value }))} placeholder={isFemaleStudent ? "Circunferencia quadril (cm) *" : "Circunferencia quadril (cm)"} className="bg-secondary/50 border-white/10" />
                  </div>
                </div>

                <div className="rounded-lg border border-border p-3 space-y-3">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-primary" />
                    <p className="font-semibold">Fotos obrigatorias</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {PHOTO_FIELDS.map((field) => (
                      <div key={field.key} className="space-y-2">
                        <Label>{field.label} *</Label>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(event) =>
                            setStudentPhotoFiles((previous) => ({
                              ...previous,
                              [field.key]: event.target.files?.[0] || null,
                            }))
                          }
                          className="bg-secondary/50 border-white/10"
                        />
                        {studentPhotoFiles[field.key] && (
                          <p className="text-xs text-muted-foreground truncate">{studentPhotoFiles[field.key].name}</p>
                        )}
                        {studentPhotos[field.key] && !studentPhotoFiles[field.key] && (
                          <a href={resolvePhotoUrl(backendUrl, studentPhotos[field.key])} target="_blank" rel="noreferrer" className="text-xs text-primary underline">
                            Visualizar foto atual
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <Textarea
                  value={studentGeneralObservations}
                  onChange={(event) => setStudentGeneralObservations(event.target.value)}
                  placeholder="Observacoes gerais (opcional)"
                  className="bg-secondary/50 border-white/10"
                />

                <Button
                  onClick={handleSubmitStudentFeedback}
                  disabled={submittingStudentFeedback || !feedbackPlan || !isTodayFeedbackDay}
                  className="gap-2"
                >
                  {submittingStudentFeedback
                    ? (uploadingPhotoKey
                      ? `Enviando ${PHOTO_FIELDS.find((field) => field.key === uploadingPhotoKey)?.label || "foto"}...`
                      : "Enviando...")
                    : <><SendHorizontal className="w-4 h-4" />Enviar Relato</>}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-xl font-bold uppercase flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-cyan-400" />
              Historico de Relatos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {feedbackSubmissions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum relato registrado.</p>
            ) : (
              <div className="space-y-2">
                {feedbackSubmissions.map((submission) => (
                  <button
                    key={submission.id}
                    type="button"
                    onClick={() => setActiveSubmissionId(submission.id)}
                    className={`w-full rounded-lg border p-3 text-left ${
                      activeSubmissionId === submission.id
                        ? "border-primary bg-primary/10"
                        : "border-border bg-secondary/20 hover:bg-secondary/30"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold">{new Date(`${submission.reference_date}T00:00:00`).toLocaleDateString("pt-BR")}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="border-white/20">
                          {typeof averageScoreFromItems(submission.items) === "number"
                            ? `Media ${averageScoreFromItems(submission.items)}%`
                            : "Sem media"}
                        </Badge>
                        <Badge variant="outline" className="border-white/20">
                          Fotos {Object.values(submission.photos || {}).filter(Boolean).length}/3
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Respondidos: {submission.answered_items} | Devolutivas: {submission.replied_items}
                    </p>
                  </button>
                ))}
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

