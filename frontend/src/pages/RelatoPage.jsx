import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNotifications } from "../contexts/NotificationContext";
import { MainLayout } from "../components/MainLayout";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import {
  PersonalRequestedFeedbackPanel,
} from "../components/RelatoFeedbackPanel";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Flame,
  Dumbbell,
  Moon,
  Heart,
  AlertCircle,
  Trophy,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  User,
  Utensils,
  Activity,
  Zap,
  RefreshCw,
  Star,
  Camera,
  Ruler,
  Scale,
} from "lucide-react";
import api from "../lib/api";
import { BACKEND_URL } from "../lib/backend";
import { toast } from "sonner";

// ==================== HELPERS ====================
const toLocalDateISO = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const getWeekStart = () => {
  const now = new Date();
  const diff = now.getDay() === 0 ? 6 : now.getDay() - 1; // Monday = 0
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  return toLocalDateISO(monday);
};

const formatWeekPeriod = (weekStart) => {
  if (!weekStart) return "";
  const start = new Date(`${weekStart}T00:00:00`);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const opts = { day: "2-digit", month: "2-digit" };
  return `${start.toLocaleDateString("pt-BR", opts)} – ${end.toLocaleDateString("pt-BR", opts)}`;
};

const calcScore = (form) => {
  const qualMap = { Excelente: 100, Boa: 75, Regular: 50, Ruim: 25 };
  const sentMap = { "Muito bem": 100, Bem: 75, Normal: 50, Mal: 25 };

  const dietaPct = Number(form.dieta_aderencia) || 0;
  const trainPct = Number(form.treino_aderencia) || 0;

  const sonoQ = qualMap[form.sono_qualidade] || 0;
  const horas = Number(form.sono_media_horas) || 0;
  const horasPct = horas >= 7 ? 100 : horas >= 6 ? 80 : horas >= 5 ? 60 : 30;
  const sonoCombined = sonoQ ? (sonoQ + horasPct) / 2 : horasPct;

  const bemPct = sentMap[form.bem_estar_sentimento] || 0;

  const sd = dietaPct * 0.4;
  const st = trainPct * 0.3;
  const ss = sonoCombined * 0.2;
  const sb = bemPct * 0.1;
  const total = Math.round(sd + st + ss + sb);

  return { total, sd: sd.toFixed(1), st: st.toFixed(1), ss: ss.toFixed(1), sb: sb.toFixed(1) };
};

const scoreColor = (score) => {
  if (score >= 80) return "#22c55e";
  if (score >= 60) return "#eab308";
  if (score >= 40) return "#f97316";
  return "#ef4444";
};

const scoreLabel = (score) => {
  if (score >= 85) return "Semana Excelente! 🔥";
  if (score >= 70) return "Boa Semana! 💪";
  if (score >= 50) return "Semana Regular";
  return "Precisa Melhorar";
};

const RELATO_PHOTO_FIELDS = [
  { key: "foto_frente_url", label: "Foto de frente" },
  { key: "foto_lateral_url", label: "Foto lateral" },
  { key: "foto_costas_url", label: "Foto de costas" },
];

const EMPTY_PHOTO_FILES = {
  foto_frente_url: null,
  foto_lateral_url: null,
  foto_costas_url: null,
};

const parsePositiveNumber = (value) => {
  const normalized = String(value || "").replace(",", ".");
  const numberValue = Number(normalized);
  if (!Number.isFinite(numberValue) || numberValue <= 0) return null;
  return numberValue;
};

const resolveUploadUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/uploads/")) return `${BACKEND_URL}/api${url}`;
  return `${BACKEND_URL}${url}`;
};

// ==================== STUDENT FORM ====================
const EMPTY_FORM = {
  dieta_aderencia: "",
  dieta_qualidade: "",
  dieta_relato: "",
  treino_aderencia: "",
  treino_realizados: "",
  treino_total_planejados: "",
  treino_progressao_carga: null,
  treino_relato: "",
  sono_media_horas: "",
  sono_qualidade: "",
  sono_relato: "",
  bem_estar_sentimento: "",
  bem_estar_percepcoes: [],
  bem_estar_relato: "",
  dificuldades: [],
  dificuldades_descricao: "",
  calorias_semana: "",
  carga_total_semana: "",
  repeticoes_semana: "",
  peso_atual: "",
  quadril_cm: "",
  abdomen_cm: "",
  cintura_cm: "",
  foto_frente_url: "",
  foto_lateral_url: "",
  foto_costas_url: "",
};

function OptionButton({ label, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
        selected
          ? "bg-primary/20 border-primary text-primary"
          : "border-white/10 text-muted-foreground hover:border-white/30 hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

function CheckOption({ label, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all ${
        selected
          ? "bg-primary/15 border-primary/50 text-primary"
          : "border-white/10 text-muted-foreground hover:border-white/20"
      }`}
    >
      <div
        className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center flex-shrink-0 ${
          selected ? "bg-primary border-primary" : "border-white/30"
        }`}
      >
        {selected && <CheckCircle2 className="w-3 h-3 text-background" />}
      </div>
      {label}
    </button>
  );
}

function SectionHeader({ icon: Icon, label, number }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <h3 className="text-base font-bold uppercase tracking-wider text-foreground">
        {number}. {label}
      </h3>
      <div className="flex-1 h-px bg-white/5" />
    </div>
  );
}

function AderenciaSlider({ value, onChange, label }) {
  const pct = Number(value) || 0;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-2xl font-black stat-number" style={{ color: scoreColor(pct) }}>
          {pct}%
        </span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={pct}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, ${scoreColor(pct)} 0%, ${scoreColor(pct)} ${pct}%, rgba(255,255,255,0.1) ${pct}%, rgba(255,255,255,0.1) 100%)`,
          }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>0%</span>
        <span>25%</span>
        <span>50%</span>
        <span>75%</span>
        <span>100%</span>
      </div>
    </div>
  );
}

function LiveScorePanel({ form }) {
  const score = calcScore(form);
  const color = scoreColor(score.total);

  return (
    <div className="bento-card rounded-2xl p-5 sticky top-4">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-yellow-400" />
        <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Score da Semana
        </span>
        <Badge variant="outline" className="ml-auto text-xs border-white/20">
          Automático
        </Badge>
      </div>

      {/* Big score */}
      <div className="text-center mb-4">
        <div
          className="text-7xl font-black stat-number leading-none mb-1"
          style={{ color }}
        >
          {score.total}
        </div>
        <p className="text-sm font-semibold" style={{ color }}>
          {scoreLabel(score.total)}
        </p>
      </div>

      {/* Arc progress */}
      <div className="relative mb-4">
        <Progress value={score.total} className="h-3 rounded-full" />
      </div>

      {/* Breakdown */}
      <div className="space-y-2">
        {[
          { label: "Dieta", value: score.sd, weight: "40%" },
          { label: "Treino", value: score.st, weight: "30%" },
          { label: "Sono", value: score.ss, weight: "20%" },
          { label: "Bem-estar", value: score.sb, weight: "10%" },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {item.label}
              <span className="ml-1 text-white/30">({item.weight})</span>
            </span>
            <span className="font-bold text-foreground">{item.value} pts</span>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-white/5">
        <p className="text-xs text-muted-foreground text-center">
          Preencha os campos para calcular seu score em tempo real
        </p>
      </div>
    </div>
  );
}

function StudentRelatoForm() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [photoFiles, setPhotoFiles] = useState(EMPTY_PHOTO_FILES);
  const [uploadingPhotoKey, setUploadingPhotoKey] = useState("");
  const [saved, setSaved] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const { fetchUnreadCount } = useNotifications();
  const weekStart = getWeekStart();

  useEffect(() => {
    checkPendingRequest();
  }, []);

  const checkPendingRequest = async () => {
    setLoading(true);
    try {
      const res = await api.get("/checkins/pending-feedback-request");
      if (res.data?.has_pending) {
        setHasPendingRequest(true);
        await loadCurrentRelato();
      }
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentRelato = async () => {
    setLoading(true);
    try {
      const res = await api.get("/relatos/meu-relato-atual");
      if (res.data) {
        const r = res.data;
        setForm({
          dieta_aderencia: r.dieta_aderencia ?? "",
          dieta_qualidade: r.dieta_qualidade ?? "",
          dieta_relato: r.dieta_relato ?? "",
          treino_aderencia: r.treino_aderencia ?? "",
          treino_realizados: r.treino_realizados ?? "",
          treino_total_planejados: r.treino_total_planejados ?? "",
          treino_progressao_carga: r.treino_progressao_carga ?? null,
          treino_relato: r.treino_relato ?? "",
          sono_media_horas: r.sono_media_horas ?? "",
          sono_qualidade: r.sono_qualidade ?? "",
          sono_relato: r.sono_relato ?? "",
          bem_estar_sentimento: r.bem_estar_sentimento ?? "",
          bem_estar_percepcoes: r.bem_estar_percepcoes ?? [],
          bem_estar_relato: r.bem_estar_relato ?? "",
          dificuldades: r.dificuldades ?? [],
          dificuldades_descricao: r.dificuldades_descricao ?? "",
          calorias_semana: r.calorias_semana ?? "",
          carga_total_semana: r.carga_total_semana ?? "",
          repeticoes_semana: r.repeticoes_semana ?? "",
          peso_atual: r.peso_atual ?? "",
          quadril_cm: r.quadril_cm ?? "",
          abdomen_cm: r.abdomen_cm ?? "",
          cintura_cm: r.cintura_cm ?? "",
          foto_frente_url: r.foto_frente_url ?? "",
          foto_lateral_url: r.foto_lateral_url ?? "",
          foto_costas_url: r.foto_costas_url ?? "",
        });
        setPhotoFiles(EMPTY_PHOTO_FILES);
        setSaved(true);
      }
    } catch {
      // no relato yet
    } finally {
      setLoading(false);
    }
  };

  const toggleList = (field, value) => {
    setForm((prev) => {
      const list = prev[field] || [];
      return {
        ...prev,
        [field]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
      };
    });
  };

  const uploadRelatoPhoto = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post("/checkins/feedback-submissions/upload-photo", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data?.photo_url;
  };

  const handleSubmit = async () => {
    const pesoAtual = parsePositiveNumber(form.peso_atual);
    const quadrilCm = parsePositiveNumber(form.quadril_cm);
    const abdomenCm = parsePositiveNumber(form.abdomen_cm);
    const cinturaCm = parsePositiveNumber(form.cintura_cm);

    if (!pesoAtual || !quadrilCm || !abdomenCm || !cinturaCm) {
      toast.error("Peso, quadril, abdomen e cintura sao obrigatorios.");
      return;
    }

    setSubmitting(true);
    try {
      const uploadedPhotos = {
        foto_frente_url: form.foto_frente_url,
        foto_lateral_url: form.foto_lateral_url,
        foto_costas_url: form.foto_costas_url,
      };

      for (const photoField of RELATO_PHOTO_FIELDS) {
        const selectedFile = photoFiles[photoField.key];
        if (!selectedFile) continue;
        setUploadingPhotoKey(photoField.key);
        uploadedPhotos[photoField.key] = await uploadRelatoPhoto(selectedFile);
      }

      if (RELATO_PHOTO_FIELDS.some((photoField) => !uploadedPhotos[photoField.key])) {
        toast.error("Fotos de frente, lateral e costas sao obrigatorias.");
        return;
      }

      const payload = {
        ...form,
        dieta_aderencia: form.dieta_aderencia !== "" ? Number(form.dieta_aderencia) : null,
        treino_aderencia: form.treino_aderencia !== "" ? Number(form.treino_aderencia) : null,
        treino_realizados: form.treino_realizados !== "" ? Number(form.treino_realizados) : null,
        treino_total_planejados:
          form.treino_total_planejados !== "" ? Number(form.treino_total_planejados) : null,
        sono_media_horas: form.sono_media_horas !== "" ? Number(form.sono_media_horas) : null,
        calorias_semana: form.calorias_semana !== "" ? Number(form.calorias_semana) : null,
        carga_total_semana:
          form.carga_total_semana !== "" ? Number(form.carga_total_semana) : null,
        repeticoes_semana:
          form.repeticoes_semana !== "" ? Number(form.repeticoes_semana) : null,
        peso_atual: pesoAtual,
        quadril_cm: quadrilCm,
        abdomen_cm: abdomenCm,
        cintura_cm: cinturaCm,
        ...uploadedPhotos,
      };
      await api.post("/relatos", payload);
      setForm((prev) => ({ ...prev, ...uploadedPhotos }));
      setPhotoFiles(EMPTY_PHOTO_FILES);
      setSaved(true);
      fetchUnreadCount();
      toast.success("Relato semanal enviado! 🔥");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Erro ao enviar relato");
    } finally {
      setUploadingPhotoKey("");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!hasPendingRequest) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
        <div
          className="flex h-20 w-20 items-center justify-center rounded-full"
          style={{ background: "rgba(0,129,253,0.10)", border: "1px solid rgba(0,129,253,0.25)" }}
        >
          <ClipboardCheck className="h-9 w-9" style={{ color: "#0081fd" }} />
        </div>
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-foreground">
            Nenhuma solicitacao pendente
          </h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            Seu personal ainda nao solicitou um relato. Quando ele solicitar, o formulario aparecera aqui automaticamente.
          </p>
        </div>
        <Badge
          variant="outline"
          className="border-primary/30 text-primary px-4 py-1.5 text-xs uppercase tracking-widest"
        >
          Aguardando solicitacao do personal
        </Badge>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main form */}
      <div className="lg:col-span-2 space-y-5">
        {/* Header */}
        <div className="bento-card rounded-2xl p-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight gradient-text">
                Relato Semanal
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Consultoria Fitness Gold — {formatWeekPeriod(weekStart)}
              </p>
            </div>
            {saved && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Enviado
              </Badge>
            )}
          </div>
        </div>

        {/* 1. Dieta */}
        <div className="bento-card rounded-2xl p-5 space-y-4">
          <SectionHeader icon={Utensils} label="Dieta" number="1" />

          <AderenciaSlider
            label="Aderência ao plano (%)"
            value={form.dieta_aderencia}
            onChange={(v) => setForm((p) => ({ ...p, dieta_aderencia: v }))}
          />

          <div>
            <p className="text-sm text-muted-foreground mb-2">Como foi sua semana:</p>
            <div className="flex flex-wrap gap-2">
              {["Excelente", "Boa", "Regular", "Ruim"].map((opt) => (
                <OptionButton
                  key={opt}
                  label={opt}
                  selected={form.dieta_qualidade === opt}
                  onClick={() =>
                    setForm((p) => ({
                      ...p,
                      dieta_qualidade: p.dieta_qualidade === opt ? "" : opt,
                    }))
                  }
                />
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2 label-uppercase">Relato</p>
            <Textarea
              placeholder="Ex: Segui bem o plano durante a semana, perdi apenas 1 refeição e fiz uma refeição livre no final de semana."
              value={form.dieta_relato}
              onChange={(e) => setForm((p) => ({ ...p, dieta_relato: e.target.value }))}
              className="bg-white/5 border-white/10 resize-none h-20 text-sm"
            />
          </div>
        </div>

        {/* 2. Treino */}
        <div className="bento-card rounded-2xl p-5 space-y-4">
          <SectionHeader icon={Dumbbell} label="Treino" number="2" />

          <AderenciaSlider
            label="Aderência ao treino (%)"
            value={form.treino_aderencia}
            onChange={(v) => setForm((p) => ({ ...p, treino_aderencia: v }))}
          />

          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1 label-uppercase">Treinos realizados</p>
              <input
                type="number"
                min={0}
                max={14}
                value={form.treino_realizados}
                onChange={(e) => setForm((p) => ({ ...p, treino_realizados: e.target.value }))}
                placeholder="0"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-center text-2xl font-black stat-number text-primary"
              />
            </div>
            <div className="flex items-center pt-5 text-muted-foreground text-xl">/</div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1 label-uppercase">Planejados</p>
              <input
                type="number"
                min={0}
                max={14}
                value={form.treino_total_planejados}
                onChange={(e) =>
                  setForm((p) => ({ ...p, treino_total_planejados: e.target.value }))
                }
                placeholder="0"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-center text-2xl font-black stat-number text-muted-foreground"
              />
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">Teve progressão de carga?</p>
            <div className="flex gap-2">
              <OptionButton
                label="✅ Sim"
                selected={form.treino_progressao_carga === true}
                onClick={() =>
                  setForm((p) => ({
                    ...p,
                    treino_progressao_carga: p.treino_progressao_carga === true ? null : true,
                  }))
                }
              />
              <OptionButton
                label="❌ Não"
                selected={form.treino_progressao_carga === false}
                onClick={() =>
                  setForm((p) => ({
                    ...p,
                    treino_progressao_carga: p.treino_progressao_carga === false ? null : false,
                  }))
                }
              />
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2 label-uppercase">Relato</p>
            <Textarea
              placeholder="Ex: Semana muito produtiva, cumpri todos os treinos e consegui aumentar carga no agachamento."
              value={form.treino_relato}
              onChange={(e) => setForm((p) => ({ ...p, treino_relato: e.target.value }))}
              className="bg-white/5 border-white/10 resize-none h-20 text-sm"
            />
          </div>
        </div>

        {/* 3. Sono */}
        <div className="bento-card rounded-2xl p-5 space-y-4">
          <SectionHeader icon={Moon} label="Sono" number="3" />

          <div>
            <p className="text-sm text-muted-foreground mb-2">Média de horas por noite</p>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={0}
                max={24}
                step={0.5}
                value={form.sono_media_horas}
                onChange={(e) => setForm((p) => ({ ...p, sono_media_horas: e.target.value }))}
                placeholder="7.5"
                className="w-28 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-center text-3xl font-black stat-number text-primary"
              />
              <span className="text-2xl font-bold text-muted-foreground">h</span>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">Qualidade do sono:</p>
            <div className="flex flex-wrap gap-2">
              {["Excelente", "Boa", "Regular", "Ruim"].map((opt) => (
                <OptionButton
                  key={opt}
                  label={opt}
                  selected={form.sono_qualidade === opt}
                  onClick={() =>
                    setForm((p) => ({
                      ...p,
                      sono_qualidade: p.sono_qualidade === opt ? "" : opt,
                    }))
                  }
                />
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2 label-uppercase">Relato</p>
            <Textarea
              placeholder="Ex: Dormi em média 7h por noite e acordei bem disposto na maioria dos dias."
              value={form.sono_relato}
              onChange={(e) => setForm((p) => ({ ...p, sono_relato: e.target.value }))}
              className="bg-white/5 border-white/10 resize-none h-20 text-sm"
            />
          </div>
        </div>

        {/* 4. Bem-estar */}
        <div className="bento-card rounded-2xl p-5 space-y-4">
          <SectionHeader icon={Heart} label="Bem-estar e Evolução" number="4" />

          <div>
            <p className="text-sm text-muted-foreground mb-2">Como você se sentiu na semana:</p>
            <div className="flex flex-wrap gap-2">
              {["Muito bem", "Bem", "Normal", "Mal"].map((opt) => (
                <OptionButton
                  key={opt}
                  label={opt}
                  selected={form.bem_estar_sentimento === opt}
                  onClick={() =>
                    setForm((p) => ({
                      ...p,
                      bem_estar_sentimento: p.bem_estar_sentimento === opt ? "" : opt,
                    }))
                  }
                />
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">Percepções físicas:</p>
            <div className="flex flex-wrap gap-2">
              {[
                "Mais força",
                "Mais resistência",
                "Mais disposição",
                "Melhor aparência física",
                "Sem mudanças",
              ].map((opt) => (
                <CheckOption
                  key={opt}
                  label={opt}
                  selected={(form.bem_estar_percepcoes || []).includes(opt)}
                  onClick={() => toggleList("bem_estar_percepcoes", opt)}
                />
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2 label-uppercase">Relato</p>
            <Textarea
              placeholder="Ex: Estou me sentindo mais forte nos treinos e já percebo o abdômen mais seco."
              value={form.bem_estar_relato}
              onChange={(e) => setForm((p) => ({ ...p, bem_estar_relato: e.target.value }))}
              className="bg-white/5 border-white/10 resize-none h-20 text-sm"
            />
          </div>
        </div>

        {/* 5. Dificuldades */}
        <div className="bento-card rounded-2xl p-5 space-y-4">
          <SectionHeader icon={AlertCircle} label="Dificuldades da Semana" number="5" />

          <div className="flex flex-wrap gap-2">
            {["Dieta", "Treino", "Rotina", "Fome", "Falta de tempo", "Motivação"].map((opt) => (
              <CheckOption
                key={opt}
                label={opt}
                selected={(form.dificuldades || []).includes(opt)}
                onClick={() => toggleList("dificuldades", opt)}
              />
            ))}
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2 label-uppercase">Explique</p>
            <Textarea
              placeholder="Descreva as dificuldades que encontrou durante a semana..."
              value={form.dificuldades_descricao}
              onChange={(e) => setForm((p) => ({ ...p, dificuldades_descricao: e.target.value }))}
              className="bg-white/5 border-white/10 resize-none h-20 text-sm"
            />
          </div>
        </div>

        {/* 6. Check visual e medidas */}
        <div className="bento-card rounded-2xl p-5 space-y-5">
          <SectionHeader icon={Camera} label="Check Visual e Medidas" number="6" />

          <div className="rounded-[1.35rem] border border-primary/20 bg-gradient-to-r from-primary/10 via-sky-400/6 to-transparent p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-bold text-foreground">
                  Finalize o relato com medidas atuais e fotos de progresso
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Peso, quadril, abdomen, cintura e fotos de frente, lateral e costas sao obrigatorios.
                </p>
              </div>
              <Badge className="border-primary/30 bg-primary/15 text-primary">Obrigatorio</Badge>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { key: "peso_atual", label: "Peso atual", unit: "kg", icon: Scale, placeholder: "Ex: 72.4" },
              { key: "quadril_cm", label: "Quadril", unit: "cm", icon: Ruler, placeholder: "Ex: 98" },
              { key: "abdomen_cm", label: "Abdomen", unit: "cm", icon: Ruler, placeholder: "Ex: 84" },
              { key: "cintura_cm", label: "Cintura", unit: "cm", icon: Ruler, placeholder: "Ex: 76" },
            ].map((field) => {
              const Icon = field.icon;
              return (
                <div
                  key={field.key}
                  className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4 shadow-[0_18px_45px_-35px_rgba(14,165,233,0.7)]"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-[1rem] border border-primary/20 bg-primary/10 p-2.5">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{field.label}</p>
                      <p className="text-xs text-muted-foreground">Obrigatorio</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <input
                      type="number"
                      min={0}
                      step={0.1}
                      value={form[field.key]}
                      onChange={(event) => setForm((prev) => ({ ...prev, [field.key]: event.target.value }))}
                      placeholder={field.placeholder}
                      className="w-full rounded-xl border border-white/10 bg-background/60 px-4 py-3 text-lg font-bold text-foreground outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                    />
                    <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-muted-foreground">
                      {field.unit}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            {RELATO_PHOTO_FIELDS.map((field) => (
              <div
                key={field.key}
                className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4 shadow-[0_18px_45px_-35px_rgba(14,165,233,0.7)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{field.label}</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">Envio obrigatorio</p>
                  </div>
                  <div className="rounded-[1rem] border border-primary/20 bg-primary/10 p-2.5">
                    <Camera className="h-4 w-4 text-primary" />
                  </div>
                </div>

                <div className="mt-4 overflow-hidden rounded-[1rem] border border-dashed border-white/15 bg-background/45 px-3 py-6 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      setPhotoFiles((prev) => ({
                        ...prev,
                        [field.key]: event.target.files?.[0] || null,
                      }))
                    }
                    className="w-full cursor-pointer text-sm text-muted-foreground file:mr-3 file:rounded-full file:border-0 file:bg-primary/15 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-primary"
                  />

                  {photoFiles[field.key] ? (
                    <p className="mt-3 truncate text-xs text-primary">{photoFiles[field.key].name}</p>
                  ) : form[field.key] ? (
                    <a
                      href={resolveUploadUrl(form[field.key])}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex text-xs font-semibold text-primary underline underline-offset-4"
                    >
                      Visualizar foto atual
                    </a>
                  ) : (
                    <p className="mt-3 text-xs text-muted-foreground">
                      Envie uma imagem nítida para registrar sua evolução.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {uploadingPhotoKey && (
            <p className="text-sm text-primary">
              Enviando {RELATO_PHOTO_FIELDS.find((field) => field.key === uploadingPhotoKey)?.label || "foto"}...
            </p>
          )}
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full h-14 text-base font-bold bg-primary hover:bg-primary/90 text-background rounded-2xl"
        >
          {submitting ? (
            <>
              <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
              {uploadingPhotoKey
                ? `Enviando ${RELATO_PHOTO_FIELDS.find((field) => field.key === uploadingPhotoKey)?.label || "foto"}...`
                : "Enviando..."}
            </>
          ) : (
            <>
              <Zap className="w-5 h-5 mr-2" />
              {saved ? "Atualizar Relato" : "Enviar Relato Semanal"}
            </>
          )}
        </Button>
      </div>

      {/* Score sidebar */}
      <div className="lg:col-span-1">
        <LiveScorePanel form={form} />
      </div>
    </div>
  );
}

// ==================== PERSONAL OVERVIEW ====================
const EvolutionArrow = ({ direction }) => {
  if (direction === "up")
    return <TrendingUp className="w-4 h-4 text-green-400 flex-shrink-0" />;
  if (direction === "down")
    return <TrendingDown className="w-4 h-4 text-red-400 flex-shrink-0" />;
  if (direction === "stable")
    return <Minus className="w-4 h-4 text-yellow-400 flex-shrink-0" />;
  return null;
};

const MetricBadge = ({ icon: Icon, value, unit, label, evolution }) => {
  const hasValue = value !== null && value !== undefined;
  return (
    <div className="flex flex-col items-center gap-0.5 min-w-[72px]">
      <div className="flex items-center gap-1">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        {evolution && <EvolutionArrow direction={evolution} />}
      </div>
      <span className={`text-base font-black stat-number ${hasValue ? "text-foreground" : "text-muted-foreground"}`}>
        {hasValue ? `${value}` : "—"}
      </span>
      <span className="text-[10px] text-muted-foreground leading-tight text-center">{label}</span>
    </div>
  );
};

function PersonalOverview() {
  const [overview, setOverview] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentRelatos, setStudentRelatos] = useState([]);
  const [loadingRelatos, setLoadingRelatos] = useState(false);
  const [relatoDetail, setRelatoDetail] = useState(null);
  const [updatingStudentStatus, setUpdatingStudentStatus] = useState(false);

  useEffect(() => {
    loadOverview();
  }, []);

  const loadOverview = async () => {
    setLoading(true);
    try {
      const res = await api.get("/relatos/personal/overview");
      setOverview(res.data || []);
    } catch {
      toast.error("Erro ao carregar overview de relatos");
    } finally {
      setLoading(false);
    }
  };

  const openStudentRelatos = async (student) => {
    setSelectedStudent(student);
    setRelatoDetail(null);
    setLoadingRelatos(true);
    try {
      const res = await api.get(`/relatos/personal/aluno/${student.student_id}`);
      setStudentRelatos(res.data || []);
      if (res.data?.length > 0) setRelatoDetail(res.data[0]);
    } catch {
      toast.error("Erro ao carregar relatos do aluno");
    } finally {
      setLoadingRelatos(false);
    }
  };

  const handleToggleStudentActive = async () => {
    if (!selectedStudent) return;

    const nextIsActive = selectedStudent.is_active === false;
    setUpdatingStudentStatus(true);
    try {
      await api.patch(`/students/${selectedStudent.student_id}/active`, {
        is_active: nextIsActive,
      });
      setOverview((previous) =>
        previous.map((item) =>
          item.student_id === selectedStudent.student_id
            ? { ...item, is_active: nextIsActive }
            : item
        )
      );
      setSelectedStudent((previous) =>
        previous ? { ...previous, is_active: nextIsActive } : previous
      );
      toast.success(nextIsActive ? "Aluno ativado com sucesso." : "Aluno inativado com sucesso.");
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Erro ao atualizar status do aluno");
    } finally {
      setUpdatingStudentStatus(false);
    }
  };

  const getInitials = (name) =>
    (name || "")
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  if (selectedStudent) {
    // Student detail view
    return (
      <div className="space-y-5 animate-slide-up">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-white/5"
              onClick={() => setSelectedStudent(null)}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight">
                Relatos de {selectedStudent.student_name}
              </h2>
              <p className="text-xs text-muted-foreground">
                Historico semanal e relatos do periodo
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={
                selectedStudent.is_active !== false
                  ? "border-emerald-400/40 text-emerald-300"
                  : "border-red-400/40 text-red-300"
              }
            >
              {selectedStudent.is_active !== false ? "Ativo" : "Inativo"}
            </Badge>
            <Button
              variant={selectedStudent.is_active !== false ? "outline" : "default"}
              onClick={handleToggleStudentActive}
              disabled={updatingStudentStatus}
            >
              {updatingStudentStatus
                ? "Atualizando..."
                : selectedStudent.is_active !== false
                ? "Inativar Aluno"
                : "Ativar Aluno"}
            </Button>
          </div>
        </div>

        <PersonalRequestedFeedbackPanel student={selectedStudent} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Relato list */}
          <div className="space-y-2">
            {loadingRelatos ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : studentRelatos.length === 0 ? (
              <div className="bento-card rounded-2xl p-6 text-center text-muted-foreground text-sm">
                Nenhum relato encontrado.
              </div>
            ) : (
              studentRelatos.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRelatoDetail(r)}
                  className={`w-full text-left bento-card rounded-xl p-4 transition-all ${
                    relatoDetail?.id === r.id
                      ? "border-primary/50 bg-primary/5"
                      : "hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold">{formatWeekPeriod(r.week_start)}</span>
                    {r.score_final !== null && r.score_final !== undefined && (
                      <span
                        className="text-lg font-black stat-number"
                        style={{ color: scoreColor(r.score_final) }}
                      >
                        {r.score_final}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span>🥗 {r.dieta_aderencia ?? "—"}%</span>
                    <span>💪 {r.treino_aderencia ?? "—"}%</span>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Relato detail */}
          <div className="lg:col-span-2">
            {relatoDetail ? (
              <RelatoDetailView relato={relatoDetail} />
            ) : (
              <div className="bento-card rounded-2xl p-8 text-center text-muted-foreground">
                Selecione um relato para visualizar
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Overview grid
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight gradient-text">
            Relatos Semanais
          </h2>
          <p className="text-sm text-muted-foreground">Consultoria Fitness Gold — Overview de Alunos</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={loadOverview}
          className="gap-2 hover:bg-white/5"
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </Button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "Total de alunos",
            value: overview.length,
            color: "text-primary",
          },
          {
            label: "Enviaram esta semana",
            value: overview.filter((o) => o.has_relato_semana_atual).length,
            color: "text-green-400",
          },
          {
            label: "Pendentes",
            value: overview.filter((o) => !o.has_relato_semana_atual).length,
            color: "text-yellow-400",
          },
        ].map((stat) => (
          <div key={stat.label} className="bento-card rounded-xl p-4 text-center">
            <div className={`text-3xl font-black stat-number ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Student cards grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : overview.length === 0 ? (
        <div className="bento-card rounded-2xl p-10 text-center text-muted-foreground">
          <User className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Nenhum aluno cadastrado ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {overview.map((item) => {
            const lr = item.latest_relato;
            const evo = item.evolution || {};
            const score = lr?.score_final;
            const hasRelato = item.has_relato_semana_atual;

            return (
              <button
                key={item.student_id}
                onClick={() => openStudentRelatos(item)}
                className="w-full text-left bento-card card-hover rounded-2xl p-4 flex items-center gap-4"
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
                    <span className="text-lg font-black text-primary">
                      {getInitials(item.student_name)}
                    </span>
                  </div>
                  {hasRelato && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background" />
                  )}
                </div>

                {/* Name + status */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm truncate">{item.student_name}</p>
                    {!item.is_active && (
                      <Badge variant="outline" className="text-[10px] border-red-500/30 text-red-400">
                        Inativo
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {hasRelato ? (
                      <span className="text-green-400">✓ Relato desta semana enviado</span>
                    ) : lr ? (
                      <span className="text-yellow-400">
                        Último: {formatWeekPeriod(lr.week_start)}
                      </span>
                    ) : (
                      <span>Sem relatos ainda</span>
                    )}
                  </p>
                </div>

                {/* Metrics */}
                {lr && (
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <MetricBadge
                      icon={Flame}
                      value={lr.calorias_semana ? Math.round(lr.calorias_semana) : null}
                      unit="kcal"
                      label="Calorias"
                      evolution={evo.calorias}
                    />
                    <div className="h-10 w-px bg-white/5" />
                    <MetricBadge
                      icon={Dumbbell}
                      value={lr.carga_total_semana ? `${Math.round(lr.carga_total_semana)}kg` : null}
                      unit=""
                      label="Carga Total"
                      evolution={evo.carga}
                    />
                    <div className="h-10 w-px bg-white/5" />
                    <MetricBadge
                      icon={Activity}
                      value={lr.repeticoes_semana}
                      unit="reps"
                      label="Repetições"
                      evolution={evo.repeticoes}
                    />
                    <div className="h-10 w-px bg-white/5" />
                    {score !== null && score !== undefined ? (
                      <div className="flex flex-col items-center gap-0.5 min-w-[48px]">
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-yellow-400" />
                        </div>
                        <span
                          className="text-base font-black stat-number"
                          style={{ color: scoreColor(score) }}
                        >
                          {Math.round(score)}
                        </span>
                        <span className="text-[10px] text-muted-foreground">Score</span>
                      </div>
                    ) : (
                      <div className="min-w-[48px]" />
                    )}
                  </div>
                )}

                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ==================== RELATO DETAIL VIEW (read-only for personal) ====================
function RelatoDetailView({ relato: r }) {
  const score = r.score_final;
  const color = score !== null && score !== undefined ? scoreColor(score) : "#888";

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Score card */}
      <div className="bento-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs label-uppercase text-muted-foreground">Semana</p>
            <p className="text-sm font-semibold">{formatWeekPeriod(r.week_start)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs label-uppercase text-muted-foreground">Score Final</p>
            <p className="text-4xl font-black stat-number" style={{ color }}>
              {score !== null && score !== undefined ? Math.round(score) : "—"}
            </p>
          </div>
        </div>
        {score !== null && score !== undefined && (
          <Progress value={score} className="h-2 rounded-full" />
        )}
        <div className="grid grid-cols-4 gap-2 mt-3 text-center">
          {[
            { label: "Dieta", v: r.score_dieta, w: "40%" },
            { label: "Treino", v: r.score_treino, w: "30%" },
            { label: "Sono", v: r.score_sono, w: "20%" },
            { label: "Bem-estar", v: r.score_bem_estar, w: "10%" },
          ].map((s) => (
            <div key={s.label} className="bg-white/5 rounded-xl p-2">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-sm font-bold">{s.v ?? "—"}</p>
              <p className="text-[10px] text-white/30">{s.w}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Detail sections */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Dieta */}
        <Section title="🥗 Dieta" color="text-green-400">
          <Row label="Aderência" value={r.dieta_aderencia !== null ? `${r.dieta_aderencia}%` : "—"} />
          <Row label="Qualidade" value={r.dieta_qualidade || "—"} />
          {r.dieta_relato && <p className="text-xs text-muted-foreground italic mt-1">"{r.dieta_relato}"</p>}
        </Section>

        {/* Treino */}
        <Section title="💪 Treino" color="text-blue-400">
          <Row label="Aderência" value={r.treino_aderencia !== null ? `${r.treino_aderencia}%` : "—"} />
          <Row
            label="Treinos"
            value={
              r.treino_realizados !== null
                ? `${r.treino_realizados}/${r.treino_total_planejados ?? "?"}`
                : "—"
            }
          />
          <Row
            label="Progressão de Carga"
            value={r.treino_progressao_carga === true ? "Sim ✅" : r.treino_progressao_carga === false ? "Não ❌" : "—"}
          />
          {r.treino_relato && <p className="text-xs text-muted-foreground italic mt-1">"{r.treino_relato}"</p>}
        </Section>

        {/* Sono */}
        <Section title="🌙 Sono" color="text-purple-400">
          <Row label="Média/noite" value={r.sono_media_horas ? `${r.sono_media_horas}h` : "—"} />
          <Row label="Qualidade" value={r.sono_qualidade || "—"} />
          {r.sono_relato && <p className="text-xs text-muted-foreground italic mt-1">"{r.sono_relato}"</p>}
        </Section>

        {/* Bem-estar */}
        <Section title="❤️ Bem-estar" color="text-pink-400">
          <Row label="Sentimento" value={r.bem_estar_sentimento || "—"} />
          {(r.bem_estar_percepcoes || []).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {r.bem_estar_percepcoes.map((p) => (
                <Badge key={p} variant="outline" className="text-[10px] border-white/20">
                  {p}
                </Badge>
              ))}
            </div>
          )}
          {r.bem_estar_relato && <p className="text-xs text-muted-foreground italic mt-1">"{r.bem_estar_relato}"</p>}
        </Section>
      </div>

      {/* Dificuldades */}
      {((r.dificuldades || []).length > 0 || r.dificuldades_descricao) && (
        <div className="bento-card rounded-xl p-4">
          <p className="text-sm font-bold mb-2">⚠️ Dificuldades</p>
          <div className="flex flex-wrap gap-1 mb-2">
            {(r.dificuldades || []).map((d) => (
              <Badge key={d} variant="outline" className="text-xs border-yellow-500/30 text-yellow-400">
                {d}
              </Badge>
            ))}
          </div>
          {r.dificuldades_descricao && (
            <p className="text-xs text-muted-foreground italic">"{r.dificuldades_descricao}"</p>
          )}
        </div>
      )}

      {/* Check visual e medidas */}
      {(r.peso_atual || r.quadril_cm || r.abdomen_cm || r.cintura_cm || r.foto_frente_url || r.foto_lateral_url || r.foto_costas_url) && (
        <div className="bento-card rounded-xl p-4">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold">Check visual e medidas</p>
              <p className="text-xs text-muted-foreground">Atualizacao corporal enviada no fechamento do relato</p>
            </div>
            <Badge variant="outline" className="w-fit border-primary/30 text-primary">
              Obrigatorio
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
            {[
              { label: "Peso", value: r.peso_atual ? `${r.peso_atual} kg` : "-", icon: Scale },
              { label: "Quadril", value: r.quadril_cm ? `${r.quadril_cm} cm` : "-", icon: Ruler },
              { label: "Abdomen", value: r.abdomen_cm ? `${r.abdomen_cm} cm` : "-", icon: Ruler },
              { label: "Cintura", value: r.cintura_cm ? `${r.cintura_cm} cm` : "-", icon: Ruler },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <Icon className="mx-auto mb-2 h-4 w-4 text-primary" />
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{item.label}</p>
                  <p className="mt-1 text-sm font-black">{item.value}</p>
                </div>
              );
            })}
          </div>

          {(r.foto_frente_url || r.foto_lateral_url || r.foto_costas_url) && (
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                { key: "foto_frente_url", label: "Foto de frente" },
                { key: "foto_lateral_url", label: "Foto lateral" },
                { key: "foto_costas_url", label: "Foto de costas" },
              ].map((photo) => (
                <a
                  key={photo.key}
                  href={resolveUploadUrl(r[photo.key])}
                  target="_blank"
                  rel="noreferrer"
                  className={`rounded-xl border p-4 transition-colors ${
                    r[photo.key]
                      ? "border-primary/20 bg-primary/8 hover:border-primary/40"
                      : "pointer-events-none border-white/10 bg-white/5 opacity-50"
                  }`}
                >
                  <Camera className="mb-2 h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold">{photo.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {r[photo.key] ? "Abrir imagem" : "Sem imagem enviada"}
                  </p>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Training metrics */}
      <div className="bento-card rounded-xl p-4">
        <p className="text-sm font-bold mb-3">📊 Métricas Semanais de Treino</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Calorias</p>
            <p className="text-xl font-black stat-number text-orange-400">
              {r.calorias_semana ? Math.round(r.calorias_semana) : "—"}
            </p>
            <p className="text-[10px] text-muted-foreground">kcal</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Carga Total</p>
            <p className="text-xl font-black stat-number text-cyan-400">
              {r.carga_total_semana ? `${Math.round(r.carga_total_semana)}` : "—"}
            </p>
            <p className="text-[10px] text-muted-foreground">kg</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Repetições</p>
            <p className="text-xl font-black stat-number text-green-400">
              {r.repeticoes_semana ?? "—"}
            </p>
            <p className="text-[10px] text-muted-foreground">reps</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, color, children }) {
  return (
    <div className="bento-card rounded-xl p-4">
      <p className={`text-sm font-bold mb-2 ${color}`}>{title}</p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}

// ==================== MAIN PAGE ====================
export default function RelatoPage() {
  const { user } = useAuth();
  const isPersonal = user?.role === "personal";

  return (
    <MainLayout>
      <div className="animate-slide-up">
        {isPersonal ? (
          <PersonalOverview />
        ) : (
          <StudentRelatoForm />
        )}
      </div>
    </MainLayout>
  );
}
