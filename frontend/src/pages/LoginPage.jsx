import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Dumbbell, Mail, Lock, Eye, EyeOff, Moon, Sun, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const highlights = [
  "Controle alunos, treino, evolucao e rotina em uma unica experiencia.",
  "Visual premium em claro e escuro, com foco em leitura, contraste e ritmo visual.",
  "Performance mobile-first para coach e aluno em qualquer tela.",
];

export default function LoginPage() {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Preencha todos os campos");
      return;
    }

    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Bem-vindo, ${user.name}!`);
    } catch (error) {
      const message = error.response?.data?.detail || "Erro ao fazer login";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell bg-background px-4 py-4 sm:px-6 sm:py-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-7xl flex-col gap-5 lg:grid lg:grid-cols-[1.08fr_0.92fr]">
        <section className="page-hero flex min-h-[320px] flex-col justify-between p-6 sm:p-8 lg:p-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative flex h-14 w-14 items-center justify-center rounded-[1.35rem] border border-primary/20 bg-gradient-to-br from-primary/25 via-sky-400/10 to-blue-500/15 shadow-[0_22px_50px_-30px_rgba(34,211,238,0.85)]">
                <div className="absolute inset-[1px] rounded-[1.2rem] bg-background/70" />
                <Dumbbell className="relative z-[1] h-7 w-7 text-primary" strokeWidth={1.7} />
              </div>
              <div>
                <p className="label-uppercase text-primary">Premium Coaching OS</p>
                <h1 className="text-2xl font-black uppercase tracking-[-0.05em] gradient-text sm:text-3xl">
                  FitMaster
                </h1>
              </div>
            </div>

            <Button variant="outline" size="icon" className="rounded-full" onClick={toggleTheme}>
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>

          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Interface reimaginada
            </div>
            <h2 className="max-w-3xl text-4xl font-black uppercase tracking-[-0.06em] text-white sm:text-5xl lg:text-6xl">
              Gestao de treino com acabamento de projeto high-end.
            </h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              Uma experiencia refinada para personal e aluno, com hierarquia visual forte, navegacao limpa e
              consistencia de ponta a ponta.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {highlights.map((item) => (
              <div key={item} className="metric-tile px-4 py-4 text-sm leading-6 text-slate-200">
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <ChevronRight className="h-4 w-4" />
                </div>
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center">
          <Card className="glass-strong w-full max-w-xl rounded-[2rem]">
            <CardHeader className="space-y-3 border-b border-white/5 pb-6 text-center sm:text-left">
              <div className="inline-flex w-fit items-center gap-2 self-center rounded-full border border-border/70 bg-secondary/50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:self-start">
                Acesso seguro
              </div>
              <div>
                <CardTitle className="text-3xl font-black uppercase tracking-[-0.05em]">Entrar</CardTitle>
                <CardDescription className="mt-2 text-sm leading-6">
                  Acesse sua conta para continuar com a operacao do studio.
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="label-uppercase">
                    Email
                  </Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-[3.25rem] pl-11"
                      data-testid="login-email-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="label-uppercase">
                    Senha
                  </Label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="********"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-[3.25rem] pl-11 pr-11"
                      data-testid="login-password-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="h-12 w-full rounded-[1.1rem] text-sm font-bold uppercase tracking-[0.18em]"
                  disabled={loading}
                  data-testid="login-submit-btn"
                >
                  {loading ? (
                    <div className="h-5 w-5 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                  ) : (
                    "Entrar no painel"
                  )}
                </Button>
              </form>

              <div className="mt-8 flex flex-col gap-4 border-t border-white/5 pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <span>Alunos recebem acesso diretamente do personal.</span>
                <span>
                  E personal trainer?{" "}
                  <Link to="/register" className="font-semibold text-primary hover:underline" data-testid="register-link">
                    Criar conta
                  </Link>
                </span>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
