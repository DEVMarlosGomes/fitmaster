import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { MainLayout } from "../components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { CalendarDays, CheckCircle2, ClipboardList } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import api from "../lib/api";
import { toast } from "sonner";

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
  const [updatingStudentStatus, setUpdatingStudentStatus] = useState(false);

  useEffect(() => {
    if (isPersonal) {
      loadStudents();
      return;
    }
    if (user?.id) {
      setSelectedStudent(user.id);
    }
  }, [isPersonal, user?.id]);

  useEffect(() => {
    if (!selectedStudent) return;
    loadCheckins(selectedStudent);
    loadFrequency(selectedStudent);
  }, [selectedStudent]);

  const selectedStudentData = useMemo(
    () => students.find((student) => student.id === selectedStudent) || null,
    [students, selectedStudent]
  );

  const isSelectedStudentActive = selectedStudentData?.is_active !== false;

  const frequencyData = useMemo(() => {
    if (!frequency?.frequency_by_date) return [];
    return Object.entries(frequency.frequency_by_date)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [frequency]);

  const loadStudents = async () => {
    try {
      const response = await api.get("/students");
      const loadedStudents = response.data || [];
      setStudents(loadedStudents);
      if (loadedStudents.length > 0) {
        setSelectedStudent((current) => current || loadedStudents[0].id);
      } else {
        setSelectedStudent("");
      }
    } catch (error) {
      toast.error("Erro ao carregar alunos");
    }
  };

  const loadCheckins = async (studentId = selectedStudent) => {
    setLoading(true);
    try {
      const response = await api.get(
        isPersonal ? `/checkins?student_id=${studentId}` : "/checkins"
      );
      setCheckins(response.data || []);
    } catch (error) {
      toast.error("Erro ao carregar check-ins");
      setCheckins([]);
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

  const handleToggleStudentActive = async () => {
    if (!selectedStudentData) return;

    const nextIsActive = !isSelectedStudentActive;
    setUpdatingStudentStatus(true);
    try {
      await api.patch(`/students/${selectedStudentData.id}/active`, { is_active: nextIsActive });
      setStudents((previous) =>
        previous.map((student) =>
          student.id === selectedStudentData.id
            ? { ...student, is_active: nextIsActive }
            : student
        )
      );
      toast.success(nextIsActive ? "Aluno ativado com sucesso." : "Aluno inativado com sucesso.");
    } catch (error) {
      const message = error?.response?.data?.detail || "Erro ao atualizar status do aluno";
      toast.error(message);
    } finally {
      setUpdatingStudentStatus(false);
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

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase">
              Check-ins
            </h1>
            <p className="text-muted-foreground mt-1">
              {isPersonal
                ? "Acompanhe a frequencia e o historico de presenca dos seus alunos."
                : "Registre sua presenca e acompanhe sua frequencia recente."}
            </p>
          </div>

          {isPersonal && (
            <div className="flex flex-wrap items-center gap-2">
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger className="w-[220px] bg-secondary/50 border-white/10">
                  <SelectValue placeholder="Selecione o aluno" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedStudentData && (
                <>
                  <Badge
                    variant="outline"
                    className={
                      isSelectedStudentActive
                        ? "border-emerald-400/40 text-emerald-300"
                        : "border-red-400/40 text-red-300"
                    }
                  >
                    {isSelectedStudentActive ? "Ativo" : "Inativo"}
                  </Badge>
                  <Button
                    variant={isSelectedStudentActive ? "outline" : "default"}
                    onClick={handleToggleStudentActive}
                    disabled={updatingStudentStatus}
                    className="gap-2"
                  >
                    {updatingStudentStatus
                      ? "Atualizando..."
                      : isSelectedStudentActive
                      ? "Inativar Aluno"
                      : "Ativar Aluno"}
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        {!isPersonal && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-xl font-bold uppercase flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                Registrar Check-in
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="Observacoes (opcional)"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
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
            </CardContent>
          </Card>
        )}

        {isPersonal && !selectedStudent && (
          <Card className="bg-card border-border">
            <CardContent className="p-6 text-sm text-muted-foreground">
              Nenhum aluno cadastrado para acompanhar check-ins.
            </CardContent>
          </Card>
        )}

        {selectedStudent && frequency && (
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

        {selectedStudent && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-xl font-bold uppercase flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-primary" />
                Frequencia (30 dias)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {frequencyData.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  Nenhum dado de frequencia disponivel
                </div>
              ) : (
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={frequencyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis
                        dataKey="date"
                        stroke="#71717a"
                        tick={{ fill: "#a1a1aa", fontSize: 12 }}
                      />
                      <YAxis stroke="#71717a" tick={{ fill: "#a1a1aa", fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {selectedStudent && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-xl font-bold uppercase flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-cyan-400" />
                Historico de Check-ins
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
                  {checkins.slice(0, 10).map((checkin) => (
                    <div key={checkin.id} className="p-3 rounded-lg bg-secondary/30">
                      <p className="text-sm font-semibold">
                        {new Date(checkin.check_in_time).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      {checkin.notes && (
                        <p className="text-xs text-muted-foreground mt-1">{checkin.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
