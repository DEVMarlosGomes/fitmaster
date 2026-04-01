import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Mail, Lock, User, Eye, EyeOff, Moon, Sun, Rocket } from "lucide-react";
import { toast } from "sonner";
import { BRAND } from "../lib/brand";

const steps = [
  { num: "01", title: "Crie sua conta", desc: "Cadastro com email e senha de acesso profissional." },
  { num: "02", title: "Aguarde aprovacao", desc: "Solicitacao enviada para o administrador da plataforma." },
  { num: "03", title: "Acesso liberado", desc: "Opere alunos, treinos e evolucao com a identidade RC." },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const isLight = theme === "light";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      toast.error("Preencha todos os campos");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("As senhas nao coincidem");
      return;
    }
    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    setLoading(true);
    try {
      const response = await register(name, email, password);
      toast.success(response.message || "Cadastro enviado para aprovacao do administrador");
      navigate("/login", { replace: true });
    } catch (error) {
      const message = error.response?.data?.detail || "Erro ao criar conta";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative flex min-h-dvh w-full overflow-hidden"
      style={{ background: isLight ? "#f4f7fc" : "#000000" }}
    >
      {/* ── Painel esquerdo: fundo geométrico ── */}
      <div
        className="relative hidden flex-col lg:flex lg:w-[55%] xl:w-[58%]"
        style={{
          backgroundImage: "url('/brand/login-bg.svg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div
          className="absolute inset-0"
          style={{ background: isLight ? "rgba(5,10,25,0.48)" : "rgba(0,0,0,0.42)" }}
        />

        <div className="relative z-10 flex flex-1 flex-col justify-between p-10 xl:p-14">
          {/* Logo */}
          <Link to="/login">
            <img
              src="/brand/rogerio-costa-logo-dark.png"
              alt="Rogério Costa"
              className="h-14 w-auto object-contain xl:h-18"
            />
          </Link>

          {/* Conteúdo central */}
          <div className="max-w-lg">
            <div
              className="mb-4 inline-block px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em]"
              style={{
                background: "rgba(0,129,253,0.18)",
                border: "1px solid rgba(0,129,253,0.40)",
                borderRadius: "4px",
                color: "#0081fd",
              }}
            >
              Cadastro Profissional
            </div>

            <h1
              className="text-5xl font-black uppercase xl:text-6xl"
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                letterSpacing: "-0.01em",
                lineHeight: "1.05",
                color: "#ffffff",
              }}
            >
              SOLICITE ACESSO<br />
              AO PAINEL DE<br />
              <span style={{ color: "#0081fd" }}>ATENDIMENTO</span>
            </h1>

            <p
              className="mt-5 text-sm leading-7"
              style={{ color: "rgba(255,255,255,0.60)", maxWidth: "400px" }}
            >
              O cadastro libera o ambiente usado para organizar treinos, alunos,
              relatos, evolucao e comunicacao dentro da identidade do cliente.
            </p>

            {/* Steps */}
            <div className="mt-8 space-y-4">
              {steps.map((step) => (
                <div key={step.num} className="flex items-start gap-4">
                  <div
                    className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-black"
                    style={{
                      background: "rgba(0,129,253,0.15)",
                      border: "1px solid rgba(0,129,253,0.35)",
                      color: "#0081fd",
                      fontFamily: "'Barlow Condensed', sans-serif",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {step.num}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>
                      {step.title}
                    </p>
                    <p className="mt-0.5 text-[12px] leading-5" style={{ color: "rgba(255,255,255,0.45)" }}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.25)" }}>
            © {new Date().getFullYear()} {BRAND.name} · Todos os direitos reservados
          </p>
        </div>
      </div>

      {/* ── Painel direito: formulário ── */}
      <div
        className="flex flex-1 flex-col items-center justify-center px-5 py-10 sm:px-8 lg:px-12 xl:px-16"
        style={{ background: isLight ? "#ffffff" : "#000000" }}
      >
        {/* Mobile: logo + theme */}
        <div className="mb-8 flex w-full max-w-md items-center justify-between lg:hidden">
          <Link to="/login">
            <img
              src={isLight ? "/brand/rogerio-costa-logo-light.png" : "/brand/rogerio-costa-logo-dark.png"}
              alt="Rogério Costa"
              className="h-9 w-auto object-contain"
              onError={(e) => { e.target.src = "/brand/rogerio-costa-logo-dark.png"; }}
            />
          </Link>
          <button
            id="auth-theme-toggle-reg"
            onClick={toggleTheme}
            className="theme-toggle"
            style={{ width: "2.25rem", height: "2.25rem" }}
            aria-label="Alternar tema"
          >
            <span key={theme} className="animate-theme-switch flex items-center justify-center">
              {isLight ? <Moon className="h-4 w-4" strokeWidth={1.8} /> : <Sun className="h-4 w-4" strokeWidth={1.8} />}
            </span>
          </button>
        </div>

        <div className="hidden w-full max-w-md justify-end lg:flex mb-6">
          <button
            id="auth-theme-toggle-desktop-reg"
            onClick={toggleTheme}
            className="theme-toggle"
            style={{ width: "2.25rem", height: "2.25rem" }}
            aria-label="Alternar tema"
          >
            <span key={theme} className="animate-theme-switch flex items-center justify-center">
              {isLight ? <Moon className="h-4 w-4" strokeWidth={1.8} /> : <Sun className="h-4 w-4" strokeWidth={1.8} />}
            </span>
          </button>
        </div>

        {/* Card principal */}
        <div
          className="w-full max-w-md rounded-[1.4rem] overflow-hidden"
          style={{
            background: isLight ? "rgba(255,255,255,1)" : "rgba(12,12,12,0.94)",
            border: isLight ? "1px solid rgba(0,129,253,0.14)" : "1px solid rgba(0,129,253,0.18)",
            boxShadow: isLight
              ? "0 16px 50px -16px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,129,253,0.06)"
              : "0 32px 80px -24px rgba(0,0,0,0.90), 0 0 0 1px rgba(0,129,253,0.08)",
            backdropFilter: "blur(24px)",
          }}
        >
          {/* Header do card */}
          <div className="space-y-3 px-6 pt-7 pb-5 text-center">
            <div
              className="mx-auto inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.20em]"
              style={{
                background: "rgba(0,129,253,0.10)",
                border: "1px solid rgba(0,129,253,0.28)",
                borderRadius: "4px",
                color: "#0081fd",
              }}
            >
              <Rocket className="h-3 w-3" />
              Criar conta profissional
            </div>
            <div>
              <h2
                className="text-4xl font-black uppercase"
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  letterSpacing: "0.04em",
                  color: isLight ? "#0f1523" : "#ffffff",
                }}
              >
                Cadastro
              </h2>
              <p
                className="mt-2 text-sm leading-6"
                style={{ color: isLight ? "rgba(15,25,50,0.50)" : "rgba(255,255,255,0.42)" }}
              >
                Cadastre-se como personal trainer e envie sua solicitacao para aprovacao.
              </p>
            </div>
          </div>

          {/* Body do card */}
          <div className="px-6 pt-2 pb-8">
            <form onSubmit={handleSubmit} className="space-y-4" id="register-form">
              {/* Nome */}
              <div className="space-y-2">
                <Label
                  htmlFor="reg-name"
                  className="text-[11px] font-bold uppercase tracking-[0.18em] themed-label"
                >
                  Nome completo
                </Label>
                <div className="relative">
                  <User
                    className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2"
                    style={{ color: isLight ? "rgba(15,25,50,0.30)" : "rgba(255,255,255,0.30)" }}
                  />
                  <Input
                    id="reg-name"
                    type="text"
                    placeholder="Seu nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="themed-input h-[3.25rem] pl-11"
                    data-testid="register-name-input"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label
                  htmlFor="reg-email"
                  className="text-[11px] font-bold uppercase tracking-[0.18em] themed-label"
                >
                  Email
                </Label>
                <div className="relative">
                  <Mail
                    className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2"
                    style={{ color: isLight ? "rgba(15,25,50,0.30)" : "rgba(255,255,255,0.30)" }}
                  />
                  <Input
                    id="reg-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="themed-input h-[3.25rem] pl-11"
                    data-testid="register-email-input"
                  />
                </div>
              </div>

              {/* Senha e confirmação */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label
                    htmlFor="reg-password"
                    className="text-[11px] font-bold uppercase tracking-[0.18em] themed-label"
                  >
                    Senha
                  </Label>
                  <div className="relative">
                    <Lock
                      className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2"
                      style={{ color: isLight ? "rgba(15,25,50,0.30)" : "rgba(255,255,255,0.30)" }}
                    />
                    <Input
                      id="reg-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="themed-input h-[3.25rem] pl-11 pr-11"
                      data-testid="register-password-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 hover:opacity-70 transition-opacity"
                      style={{ color: isLight ? "rgba(15,25,50,0.30)" : "rgba(255,255,255,0.30)" }}
                      aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="reg-confirm"
                    className="text-[11px] font-bold uppercase tracking-[0.18em] themed-label"
                  >
                    Confirmar
                  </Label>
                  <div className="relative">
                    <Lock
                      className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2"
                      style={{ color: isLight ? "rgba(15,25,50,0.30)" : "rgba(255,255,255,0.30)" }}
                    />
                    <Input
                      id="reg-confirm"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="themed-input h-[3.25rem] pl-11"
                      data-testid="register-confirm-password-input"
                    />
                  </div>
                </div>
              </div>

              {/* Botão */}
              <button
                type="submit"
                className="btn-primary mt-2 h-12 w-full rounded-[0.85rem] font-bold uppercase disabled:cursor-not-allowed"
                disabled={loading}
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: "1rem",
                  letterSpacing: "0.12em",
                }}
                data-testid="register-submit-btn"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Enviando...</span>
                  </div>
                ) : (
                  "Enviar cadastro"
                )}
              </button>
            </form>

            <div
              className="mt-8 flex flex-col gap-3 pt-6 text-sm sm:flex-row sm:items-center sm:justify-between"
              style={{
                borderTop: isLight ? "1px solid rgba(0,0,0,0.07)" : "1px solid rgba(255,255,255,0.06)",
                color: isLight ? "rgba(15,25,50,0.38)" : "rgba(255,255,255,0.35)",
              }}
            >
              <span className="text-[13px]">O acesso e liberado apos aprovacao do administrador.</span>
              <span className="text-[13px]">
                Ja tem conta?{" "}
                <Link
                  to="/login"
                  className="font-semibold hover:underline"
                  style={{ color: "#0081fd" }}
                  data-testid="login-link"
                >
                  Entrar
                </Link>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
