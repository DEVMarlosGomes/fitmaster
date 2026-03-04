import { useState, useRef } from "react";
import { MainLayout } from "../components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { 
  Upload, 
  FileSpreadsheet, 
  Users, 
  Dumbbell, 
  CheckCircle2, 
  AlertCircle,
  Download,
  Trash2,
  RefreshCw
} from "lucide-react";
import api from "../lib/api";
import { toast } from "sonner";

export default function ImportPage() {
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [cadastros, setCadastros] = useState([]);
  const [loadingCadastros, setLoadingCadastros] = useState(false);
  const [workoutName, setWorkoutName] = useState("Treino Importado");
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  
  const csvInputRef = useRef(null);
  const xlsxInputRef = useRef(null);

  // Carregar alunos para seleção
  const loadStudents = async () => {
    try {
      const response = await api.get("/students");
      setStudents(response.data || []);
    } catch (error) {
      console.error("Erro ao carregar alunos:", error);
    }
  };

  // Carregar cadastros importados
  const loadCadastros = async () => {
    setLoadingCadastros(true);
    try {
      const response = await api.get("/cadastros-importados");
      setCadastros(response.data.cadastros || []);
    } catch (error) {
      toast.error("Erro ao carregar cadastros");
    } finally {
      setLoadingCadastros(false);
    }
  };

  // Importar CSV de cadastros
  const handleImportCSV = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error("Por favor, selecione um arquivo CSV");
      return;
    }

    setLoading(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post("/import/cadastros", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setImportResult({
        type: "cadastros",
        ...response.data
      });

      if (response.data.success) {
        toast.success(response.data.message);
        loadCadastros();
      }
    } catch (error) {
      const message = error.response?.data?.detail || "Erro ao importar arquivo";
      toast.error(message);
      setImportResult({
        type: "cadastros",
        success: false,
        message,
        imported_count: 0,
        errors: [message]
      });
    } finally {
      setLoading(false);
      if (csvInputRef.current) csvInputRef.current.value = "";
    }
  };

  // Importar XLSX de treino
  const handleImportXLSX = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error("Por favor, selecione um arquivo Excel (.xlsx ou .xls)");
      return;
    }

    setLoading(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("workout_name", workoutName || "Treino Importado");
      if (selectedStudent) {
        formData.append("student_id", selectedStudent);
      }

      const response = await api.post("/import/treino", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setImportResult({
        type: "treino",
        ...response.data
      });

      if (response.data.success) {
        toast.success(response.data.message);
      }
    } catch (error) {
      const message = error.response?.data?.detail || "Erro ao importar arquivo";
      toast.error(message);
      setImportResult({
        type: "treino",
        success: false,
        message,
        imported_count: 0,
        errors: [message]
      });
    } finally {
      setLoading(false);
      if (xlsxInputRef.current) xlsxInputRef.current.value = "";
    }
  };

  // Deletar cadastro
  const handleDeleteCadastro = async (id) => {
    try {
      await api.delete(`/cadastros-importados/${id}`);
      toast.success("Cadastro removido");
      loadCadastros();
    } catch (error) {
      toast.error("Erro ao remover cadastro");
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in" data-testid="import-page">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase">Importar Planilhas</h1>
          <p className="text-muted-foreground">
            Importe cadastros CSV ou treinos Excel para o sistema
          </p>
        </div>

        <Tabs defaultValue="cadastros" className="w-full" onValueChange={(v) => {
          if (v === "cadastros") loadCadastros();
          if (v === "treino") loadStudents();
        }}>
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="cadastros" className="gap-2">
              <Users className="w-4 h-4" />
              Cadastros (CSV)
            </TabsTrigger>
            <TabsTrigger value="treino" className="gap-2">
              <Dumbbell className="w-4 h-4" />
              Treino (Excel)
            </TabsTrigger>
          </TabsList>

          {/* Tab Cadastros CSV */}
          <TabsContent value="cadastros" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-green-400" />
                  Importar Cadastros CSV
                </CardTitle>
                <CardDescription>
                  Formato esperado: Nome, Telefone, Data de Cadastro
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
                  <input
                    ref={csvInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleImportCSV}
                    className="hidden"
                    id="csv-upload"
                    data-testid="csv-upload-input"
                  />
                  <label htmlFor="csv-upload" className="cursor-pointer">
                    <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg font-semibold mb-2">
                      {loading ? "Importando..." : "Clique para selecionar arquivo CSV"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ou arraste e solte aqui
                    </p>
                  </label>
                </div>

                {/* Exemplo de formato */}
                <div className="p-4 bg-secondary/30 rounded-lg">
                  <p className="text-sm font-semibold mb-2">Exemplo de formato aceito:</p>
                  <code className="text-xs text-muted-foreground">
                    Nome,Telefone,Data de Cadastro<br />
                    João Silva,11999887766,20/02/2026 18:05
                  </code>
                </div>
              </CardContent>
            </Card>

            {/* Lista de cadastros importados */}
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Cadastros Importados</CardTitle>
                  <CardDescription>{cadastros.length} registros</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={loadCadastros} disabled={loadingCadastros}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${loadingCadastros ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
              </CardHeader>
              <CardContent>
                {cadastros.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum cadastro importado ainda
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Telefone</TableHead>
                          <TableHead>Importado em</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cadastros.slice(0, 20).map((cadastro) => (
                          <TableRow key={cadastro.id}>
                            <TableCell className="font-medium">{cadastro.nome}</TableCell>
                            <TableCell>{cadastro.telefone}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(cadastro.imported_at).toLocaleDateString("pt-BR")}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteCadastro(cadastro.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Treino Excel */}
          <TabsContent value="treino" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-blue-400" />
                  Importar Treino Excel
                </CardTitle>
                <CardDescription>
                  Formato esperado: Dia, Grupo Muscular, Exercicio, Series, Repeticoes, Carga, Observacoes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Configurações do treino */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome do Treino</Label>
                    <Input
                      value={workoutName}
                      onChange={(e) => setWorkoutName(e.target.value)}
                      placeholder="Ex: Treino Hipertrofia"
                      data-testid="workout-name-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Atribuir a Aluno (opcional)</Label>
                    <Select value={selectedStudent || "none"} onValueChange={(v) => setSelectedStudent(v === "none" ? "" : v)}>
                      <SelectTrigger data-testid="student-select">
                        <SelectValue placeholder="Selecione um aluno" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum (modelo geral)</SelectItem>
                        {students.map((student) => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
                  <input
                    ref={xlsxInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleImportXLSX}
                    className="hidden"
                    id="xlsx-upload"
                    data-testid="xlsx-upload-input"
                  />
                  <label htmlFor="xlsx-upload" className="cursor-pointer">
                    <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg font-semibold mb-2">
                      {loading ? "Importando..." : "Clique para selecionar arquivo Excel"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Aceita .xlsx e .xls
                    </p>
                  </label>
                </div>

                {/* Exemplo de formato */}
                <div className="p-4 bg-secondary/30 rounded-lg">
                  <p className="text-sm font-semibold mb-2">Colunas esperadas:</p>
                  <div className="flex flex-wrap gap-2">
                    {["Dia", "Grupo Muscular", "Exercicio", "Series", "Repeticoes", "Carga", "Observacoes"].map((col) => (
                      <Badge key={col} variant="outline">{col}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Resultado da importação */}
        {importResult && (
          <Card className={`border-2 ${importResult.success ? 'border-green-500/50 bg-green-500/5' : 'border-red-500/50 bg-red-500/5'}`}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                {importResult.success ? (
                  <CheckCircle2 className="w-8 h-8 text-green-500 shrink-0" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-red-500 shrink-0" />
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-1">
                    {importResult.success ? "Importacao concluida!" : "Erro na importacao"}
                  </h3>
                  <p className="text-muted-foreground mb-3">{importResult.message}</p>
                  
                  {importResult.success && (
                    <div className="flex gap-4 text-sm">
                      <span className="text-green-400">
                        {importResult.imported_count} {importResult.type === "cadastros" ? "cadastros" : "exercicios"} importados
                      </span>
                      {importResult.errors?.length > 0 && (
                        <span className="text-yellow-400">
                          {importResult.errors.length} avisos
                        </span>
                      )}
                    </div>
                  )}

                  {importResult.errors?.length > 0 && (
                    <div className="mt-4 p-3 bg-secondary/30 rounded-lg max-h-32 overflow-y-auto">
                      <p className="text-xs font-semibold mb-2 text-muted-foreground">Detalhes:</p>
                      {importResult.errors.slice(0, 5).map((err, idx) => (
                        <p key={idx} className="text-xs text-muted-foreground">{err}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
