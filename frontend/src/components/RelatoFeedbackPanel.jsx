import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { Calendar as CalendarPicker } from "./ui/calendar";
import { Slider } from "./ui/slider";
import { Progress } from "./ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  BellRing,
  CalendarDays,
  Camera,
  MessageSquareText,
  SendHorizontal,
} from "lucide-react";
import api from "../lib/api";
import { BACKEND_URL } from "../lib/backend";
import { toast } from "sonner";

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

const WEEKDAY_OPTIONS = [
  { value: 0, label: "Dom" },
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
  { value: 6, label: "Sab" },
];

const DEFAULT_REMINDER = "Lembrete: responda seu relato do periodo.";

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
    reminder_enabled:
      typeof plan.reminder_enabled === "boolean" ? plan.reminder_enabled : base.reminder_enabled,
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
  if (url.startsWith("/uploads/")) return `${backendUrl}/api${url}`;
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

export function StudentRequestedFeedbackPanel() {
  const { user } = useAuth();
  const backendUrl = BACKEND_URL;
  const todayISO = useMemo(() => toLocalDateISO(), []);
  const isFemaleStudent = useMemo(
    () => String(user?.gender || "").trim().toLowerCase().startsWith("fem"),
    [user?.gender]
  );

  const [pendingFeedbackRequest, setPendingFeedbackRequest] = useState(null);
  const [loadingPendingFeedbackRequest, setLoadingPendingFeedbackRequest] = useState(true);
  const [feedbackSubmissions, setFeedbackSubmissions] = useState([]);
  const [loadingFeedbackSubmissions, setLoadingFeedbackSubmissions] = useState(false);
  const [studentScores, setStudentScores] = useState(emptyScoreMap());
  const [studentMeasurements, setStudentMeasurements] = useState(DEFAULT_MEASUREMENTS);
  const [studentPhotos, setStudentPhotos] = useState(DEFAULT_PHOTOS);
  const [studentPhotoFiles, setStudentPhotoFiles] = useState(DEFAULT_PHOTO_FILES);
  const [studentGeneralObservations, setStudentGeneralObservations] = useState("");
  const [uploadingPhotoKey, setUploadingPhotoKey] = useState("");
  const [submittingStudentFeedback, setSubmittingStudentFeedback] = useState(false);
  const [activeSubmissionId, setActiveSubmissionId] = useState("");

  const latestFeedbackSubmission = feedbackSubmissions[0] || null;
  const activeFeedbackSubmission =
    feedbackSubmissions.find((submission) => submission.id === activeSubmissionId) ||
    latestFeedbackSubmission ||
    null;

  const latestItemsByKey = useMemo(() => {
    const map = {};
    (latestFeedbackSubmission?.items || []).forEach((item) => {
      map[item.key] = item;
    });
    return map;
  }, [latestFeedbackSubmission]);

  useEffect(() => {
    loadPendingFeedbackRequest();
  }, []);

  useEffect(() => {
    if (!pendingFeedbackRequest?.id) {
      setFeedbackSubmissions([]);
      setActiveSubmissionId("");
      return;
    }
    loadFeedbackSubmissions();
  }, [pendingFeedbackRequest?.id]);

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

  const loadPendingFeedbackRequest = async () => {
    setLoadingPendingFeedbackRequest(true);
    try {
      const response = await api.get("/checkins/pending-feedback-request");
      const request = response.data?.has_pending ? response.data.request : null;
      setPendingFeedbackRequest(request);
      return request;
    } catch (error) {
      setPendingFeedbackRequest(null);
      return null;
    } finally {
      setLoadingPendingFeedbackRequest(false);
    }
  };

  const loadFeedbackSubmissions = async () => {
    setLoadingFeedbackSubmissions(true);
    try {
      const response = await api.get("/checkins/feedback-submissions?limit=12");
      const submissions = response.data || [];
      setFeedbackSubmissions(submissions);

      const todaySubmission = submissions.find((submission) => submission.reference_date === todayISO);
      if (todaySubmission) {
        setStudentScores(buildScoreMapFromItems(todaySubmission.items));
        setStudentMeasurements({
          fasting_weight: String(todaySubmission?.measurements?.fasting_weight ?? ""),
          waist_circumference: String(todaySubmission?.measurements?.waist_circumference ?? ""),
          abdominal_circumference: String(
            todaySubmission?.measurements?.abdominal_circumference ?? ""
          ),
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
    } catch (error) {
      toast.error("Erro ao carregar feedback semanal");
      setFeedbackSubmissions([]);
    } finally {
      setLoadingFeedbackSubmissions(false);
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
    let activePendingRequest = pendingFeedbackRequest;
    if (!activePendingRequest) {
      activePendingRequest = await loadPendingFeedbackRequest();
    }

    if (!activePendingRequest) {
      toast.error("Nenhuma solicitacao de devolutiva pendente.");
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
          completion_percentage: clampPercentage(
            studentScores[category.key]?.completion_percentage ?? 0
          ),
          observation: (studentScores[category.key]?.observation || "").trim() || null,
        };
        return acc;
      }, {});

      await api.post("/checkins/feedback-submissions", {
        reference_date: toLocalDateISO(),
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
      setPendingFeedbackRequest(null);
      toast.success("Relato enviado.");
      loadFeedbackSubmissions();
    } catch (error) {
      const message = error?.response?.data?.detail || "Erro ao enviar relato";
      toast.error(message);
    } finally {
      setUploadingPhotoKey("");
      setSubmittingStudentFeedback(false);
    }
  };

  if (loadingPendingFeedbackRequest) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-8 flex justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!pendingFeedbackRequest) {
    return null;
  }

  return (
    <div className="space-y-4">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-xl font-bold uppercase flex items-center gap-2">
            <MessageSquareText className="w-5 h-5 text-primary" />
            Meu Relato do Periodo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-start gap-3">
              <BellRing className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-400">Devolutiva Solicitada</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {pendingFeedbackRequest.message ||
                    "Seu personal solicitou uma devolutiva sobre seus treinos."}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Solicitado em:{" "}
                  {new Date(pendingFeedbackRequest.created_at).toLocaleString("pt-BR")}
                </p>
              </div>
            </div>
          </div>

          {loadingFeedbackSubmissions ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
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
                  <Input
                    value={studentMeasurements.fasting_weight}
                    onChange={(event) =>
                      setStudentMeasurements((previous) => ({
                        ...previous,
                        fasting_weight: event.target.value,
                      }))
                    }
                    placeholder="Peso em jejum (kg) *"
                    className="bg-secondary/50 border-white/10"
                  />
                  <Input
                    value={studentMeasurements.waist_circumference}
                    onChange={(event) =>
                      setStudentMeasurements((previous) => ({
                        ...previous,
                        waist_circumference: event.target.value,
                      }))
                    }
                    placeholder="Circunferencia cintura (cm) *"
                    className="bg-secondary/50 border-white/10"
                  />
                  <Input
                    value={studentMeasurements.abdominal_circumference}
                    onChange={(event) =>
                      setStudentMeasurements((previous) => ({
                        ...previous,
                        abdominal_circumference: event.target.value,
                      }))
                    }
                    placeholder="Circunferencia abdominal (cm) *"
                    className="bg-secondary/50 border-white/10"
                  />
                  <Input
                    value={studentMeasurements.hip_circumference}
                    onChange={(event) =>
                      setStudentMeasurements((previous) => ({
                        ...previous,
                        hip_circumference: event.target.value,
                      }))
                    }
                    placeholder={
                      isFemaleStudent
                        ? "Circunferencia quadril (cm) *"
                        : "Circunferencia quadril (cm)"
                    }
                    className="bg-secondary/50 border-white/10"
                  />
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
                        <p className="text-xs text-muted-foreground truncate">
                          {studentPhotoFiles[field.key].name}
                        </p>
                      )}
                      {studentPhotos[field.key] && !studentPhotoFiles[field.key] && (
                        <a
                          href={resolvePhotoUrl(backendUrl, studentPhotos[field.key])}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-primary underline"
                        >
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
                disabled={submittingStudentFeedback}
                className="gap-2"
              >
                {submittingStudentFeedback ? (
                  uploadingPhotoKey ? (
                    `Enviando ${PHOTO_FIELDS.find((field) => field.key === uploadingPhotoKey)?.label || "foto"
                    }...`
                  ) : (
                    "Enviando..."
                  )
                ) : (
                  <>
                    <SendHorizontal className="w-4 h-4" />
                    Enviar Relato
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-xl font-bold uppercase">
            Historico de Relatos do Periodo
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
                  className={`w-full rounded-lg border p-3 text-left ${activeSubmissionId === submission.id
                      ? "border-primary bg-primary/10"
                      : "border-border bg-secondary/20 hover:bg-secondary/30"
                    }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">
                      {new Date(`${submission.reference_date}T00:00:00`).toLocaleDateString("pt-BR")}
                    </p>
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

          {activeFeedbackSubmission && (
            <div className="mt-4 rounded-lg border border-border p-3 text-sm">
              <p className="font-semibold">
                Referencia:{" "}
                {new Date(`${activeFeedbackSubmission.reference_date}T00:00:00`).toLocaleDateString(
                  "pt-BR"
                )}
              </p>
              <p className="text-muted-foreground mt-1">
                Media:{" "}
                {typeof averageScoreFromItems(activeFeedbackSubmission.items) === "number"
                  ? `${averageScoreFromItems(activeFeedbackSubmission.items)}%`
                  : "-"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function PersonalRequestedFeedbackPanel({ student }) {
  const backendUrl = BACKEND_URL;
  const studentId = student?.student_id;
  const isStudentActive = student?.is_active !== false;

  const [feedbackPlan, setFeedbackPlan] = useState(null);
  const [feedbackPlanForm, setFeedbackPlanForm] = useState(defaultFeedbackPlan());
  const [feedbackCalendarMonth, setFeedbackCalendarMonth] = useState(new Date());
  const [loadingFeedbackPlan, setLoadingFeedbackPlan] = useState(false);
  const [savingFeedbackPlan, setSavingFeedbackPlan] = useState(false);
  const [feedbackSubmissions, setFeedbackSubmissions] = useState([]);
  const [loadingFeedbackSubmissions, setLoadingFeedbackSubmissions] = useState(false);
  const [personalReplies, setPersonalReplies] = useState(emptyFeedbackMap());
  const [submittingPersonalReplyKey, setSubmittingPersonalReplyKey] = useState("");
  const [activeSubmissionId, setActiveSubmissionId] = useState("");
  const [requestingFeedback, setRequestingFeedback] = useState(false);

  useEffect(() => {
    if (!studentId) return;
    setFeedbackCalendarMonth(new Date());
    loadFeedbackPlan(studentId);
    loadFeedbackSubmissions(studentId);
  }, [studentId]);

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
    setPersonalReplies(buildFeedbackMapFromItems(activeFeedbackSubmission?.items, "personal_reply"));
  }, [activeFeedbackSubmission?.id]);

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

  const loadFeedbackPlan = async (currentStudentId) => {
    setLoadingFeedbackPlan(true);
    try {
      const response = await api.get(`/checkins/feedback-plan/${currentStudentId}`);
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

  const loadFeedbackSubmissions = async (currentStudentId) => {
    setLoadingFeedbackSubmissions(true);
    try {
      const response = await api.get(
        `/checkins/feedback-submissions?student_id=${currentStudentId}&limit=12`
      );
      setFeedbackSubmissions(response.data || []);
    } catch (error) {
      toast.error("Erro ao carregar feedback semanal");
      setFeedbackSubmissions([]);
    } finally {
      setLoadingFeedbackSubmissions(false);
    }
  };

  const handleRequestFeedback = async () => {
    if (!studentId) return;
    if (!isStudentActive) {
      toast.error("Aluno inativo. Ative o aluno para solicitar devolutiva.");
      return;
    }
    setRequestingFeedback(true);
    try {
      await api.post(`/checkins/request-feedback/${studentId}`);
      toast.success("Solicitacao de devolutiva enviada ao aluno!");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao solicitar devolutiva");
    } finally {
      setRequestingFeedback(false);
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
    if (!studentId) return;
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

      const response = await api.put(`/checkins/feedback-plan/${studentId}`, payload);
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

  const handleSubmitPersonalReply = async (feedbackKey) => {
    if (!activeFeedbackSubmission?.id) return;

    setSubmittingPersonalReplyKey(feedbackKey);
    try {
      await api.patch(`/checkins/feedback-submissions/${activeFeedbackSubmission.id}/replies`, {
        replies: [{ key: feedbackKey, reply: personalReplies[feedbackKey] || null }],
      });
      toast.success("Devolutiva enviada");
      loadFeedbackSubmissions(studentId);
    } catch (error) {
      const message = error?.response?.data?.detail || "Erro ao enviar devolutiva";
      toast.error(message);
    } finally {
      setSubmittingPersonalReplyKey("");
    }
  };

  if (!studentId) {
    return null;
  }

  return (
    <div className="space-y-4">
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle className="text-xl font-bold uppercase flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-primary" />
              Planejamento de Relato
            </CardTitle>
            <Button
              variant="outline"
              onClick={handleRequestFeedback}
              disabled={requestingFeedback || !isStudentActive}
              className="gap-2 border-amber-400/50 text-amber-400 hover:bg-amber-400/10"
            >
              {requestingFeedback ? (
                "Enviando..."
              ) : (
                <>
                  <BellRing className="w-4 h-4" />
                  Solicitar Devolutiva
                </>
              )}
            </Button>
          </div>
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
                    <Label>Inicio</Label>
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
                    <p className="text-xs text-muted-foreground">
                      Permite envio do relato pelo aluno
                    </p>
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
                      setFeedbackPlanForm((previous) => ({
                        ...previous,
                        reminder_enabled: value,
                      }))
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

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-xl font-bold uppercase">
            Historico de Relatos do Periodo
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
                  className={`w-full rounded-lg border p-3 text-left ${activeSubmissionId === submission.id
                      ? "border-primary bg-primary/10"
                      : "border-border bg-secondary/20 hover:bg-secondary/30"
                    }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">
                      {new Date(`${submission.reference_date}T00:00:00`).toLocaleDateString("pt-BR")}
                    </p>
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
    </div>
  );
}
