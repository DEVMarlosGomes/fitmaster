import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Mail, Lock, Eye, EyeOff, Moon, Sun, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { BRAND } from "../lib/brand";

export default function LoginPage() {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const isLight = theme === "light";

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
    <div
      className="relative flex min-h-dvh w-full overflow-hidden"
      style={{ background: isLight ? "#f4f7fc" : "#000000" }}
    >
      {/* ── Painel esquerdo: fundo geométrico do cliente ── */}
      <div
        className="relative hidden flex-col lg:flex lg:w-[55%] xl:w-[58%]"
        style={{
          backgroundImage: "url('/brand/login-bg.svg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Overlay para legibilidade */}
        <div
          className="absolute inset-0"
          style={{ background: isLight ? "rgba(5,10,25,0.48)" : "rgba(0,0,0,0.40)" }}
        />

        {/* Conteúdo sobre o fundo */}
        <div className="relative z-10 flex flex-1 flex-col justify-between p-10 xl:p-14">
          {/* Logo */}
          <div>
            <img
              src="/brand/rogerio-costa-logo-dark.png"
              alt="Rogério Costa – Treinador e Nutricionista"
              className="h-14 w-auto object-contain xl:h-18"
            />
          </div>

          {/* Tagline */}
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
              {BRAND.role}
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
              PLATAFORMA DE<br />
              <span style={{ color: "#0081fd" }}>ACOMPANHAMENTO</span><br />
              DO ALUNO
            </h1>

            <p
              className="mt-5 text-sm leading-7"
              style={{ color: "rgba(255,255,255,0.65)", maxWidth: "420px" }}
            >
              Treino, nutrição, evolução, fotos e rotina do aluno organizados em
              uma interface coerente com a identidade do atendimento.
            </p>

            {/* 3 bullets */}
            <div className="mt-8 space-y-3">
              {[
                "Treinos, relatos, fotos e evolução reunidos no mesmo ambiente.",
                "Identidade visual alinhada à marca Rogério Costa.",
                "Fluxo direto para personal e aluno com leitura forte em qualquer tela.",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <div
                    className="mt-0.5 h-5 w-5 shrink-0 flex items-center justify-center rounded-sm"
                    style={{ background: "#0081fd" }}
                  >
                    <svg width="10" height="8" fill="none" viewBox="0 0 10 8">
                      <path d="M1 4l2.5 2.5L9 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <p className="text-[13px] leading-6" style={{ color: "rgba(255,255,255,0.70)" }}>
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Rodapé */}
          <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.28)" }}>
            © {new Date().getFullYear()} {BRAND.name} · Todos os direitos reservados
          </p>
        </div>
      </div>

      {/* ── Painel direito: formulário ── */}
      <div
        className="flex flex-1 flex-col items-center justify-center px-5 py-10 sm:px-8 lg:px-12 xl:px-16"
        style={{ background: isLight ? "#ffffff" : "#000000" }}
      >
        {/* Theme toggle + logo mobile */}
        <div className="mb-8 flex w-full max-w-md items-center justify-between lg:hidden">
          <img
            src={isLight ? "/brand/rogerio-costa-logo-light.png" : "/brand/rogerio-costa-logo-dark.png"}
            alt="Rogério Costa"
            className="h-9 w-auto object-contain"
            onError={(e) => { e.target.src = "/brand/rogerio-costa-logo-dark.png"; }}
          />
          <button
            id="auth-theme-toggle"
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
            id="auth-theme-toggle-desktop"
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
            {/* Badge */}
            <div
              className="mx-auto inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.20em]"
              style={{
                background: "rgba(0,129,253,0.10)",
                border: "1px solid rgba(0,129,253,0.28)",
                borderRadius: "4px",
                color: "#0081fd",
              }}
            >
              <ShieldCheck className="h-3 w-3" />
              Acesso seguro
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
                Entrar
              </h2>
              <p
                className="mt-2 text-sm leading-6"
                style={{ color: isLight ? "rgba(15,25,50,0.50)" : "rgba(255,255,255,0.45)" }}
              >
                Acesse sua conta para continuar no ambiente de acompanhamento.
              </p>
            </div>
          </div>

          {/* Body do card */}
          <div className="px-6 pt-2 pb-8">
            <form onSubmit={handleSubmit} className="space-y-5" id="login-form">
              {/* Email */}
              <div className="space-y-2">
                <Label
                  htmlFor="login-email"
                  className="text-[11px] font-bold uppercase tracking-[0.18em] themed-label"
                >
                  Email
                </Label>
                <div className="relative">
                  <Mail
                    className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2"
                    style={{ color: isLight ? "rgba(15,25,50,0.35)" : "rgba(255,255,255,0.35)" }}
                  />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="themed-input h-[3.25rem] pl-11"
                    data-testid="login-email-input"
                  />
                </div>
              </div>

              {/* Senha */}
              <div className="space-y-2">
                <Label
                  htmlFor="login-password"
                  className="text-[11px] font-bold uppercase tracking-[0.18em] themed-label"
                >
                  Senha
                </Label>
                <div className="relative">
                  <Lock
                    className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2"
                    style={{ color: isLight ? "rgba(15,25,50,0.35)" : "rgba(255,255,255,0.35)" }}
                  />
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="themed-input h-[3.25rem] pl-11 pr-11"
                    data-testid="login-password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
                    style={{ color: isLight ? "rgba(15,25,50,0.35)" : "rgba(255,255,255,0.35)" }}
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Botão */}
              <button
                type="submit"
                className="btn-primary h-12 w-full rounded-[0.85rem] text-sm font-bold uppercase tracking-[0.14em] disabled:cursor-not-allowed"
                disabled={loading}
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: "1rem",
                  letterSpacing: "0.12em",
                }}
                data-testid="login-submit-btn"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Entrando...</span>
                  </div>
                ) : (
                  "Entrar no painel"
                )}
              </button>
            </form>

            {/* Footer */}
            <div
              className="mt-8 flex flex-col gap-3 pt-6 text-sm sm:flex-row sm:items-center sm:justify-between"
              style={{
                borderTop: isLight ? "1px solid rgba(0,0,0,0.07)" : "1px solid rgba(255,255,255,0.06)",
                color: isLight ? "rgba(15,25,50,0.40)" : "rgba(255,255,255,0.38)",
              }}
            >
              <span className="text-[13px]">Alunos recebem acesso diretamente do personal.</span>
              <span className="text-[13px]">
                É personal trainer?{" "}
                <Link
                  to="/register"
                  className="font-semibold hover:underline"
                  style={{ color: "#0081fd" }}
                  data-testid="register-link"
                >
                  Criar conta
                </Link>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
