"use client";

import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, KeyRound, Loader2, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    if (!supabase) {
      setMessage("Configure o Supabase no arquivo .env.local antes de entrar.");
      setLoading(false);
      return;
    }

    const payload = { email, password };
    const result =
      mode === "signin"
        ? await supabase.auth.signInWithPassword(payload)
        : await supabase.auth.signUp(payload);

    if (result.error) {
      setMessage(result.error.message);
      setLoading(false);
      return;
    }

    if (mode === "signup" && !result.data.session) {
      setMessage("Cadastro criado. Confirme o email antes de entrar.");
      setLoading(false);
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
      <section className="flex min-h-[42vh] flex-col justify-between bg-[#103b35] p-6 text-white sm:p-10 lg:min-h-screen">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-lg bg-white text-[#103b35]">
            <KeyRound size={22} />
          </div>
          <div>
            <p className="font-semibold">RareCouple</p>
            <p className="text-sm text-white/70">Financas do casal</p>
          </div>
        </div>
        <div className="max-w-xl py-12">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-[#a4ddd2]">
            Privado, diario e claro
          </p>
          <h1 className="text-4xl font-semibold leading-tight sm:text-6xl">
            Uma rotina financeira para duas pessoas decidirem melhor.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-white/76">
            Lancamentos rapidos, despesas fixas, parcelas, dashboard e CSV
            padronizado desde a primeira versao.
          </p>
        </div>
        <p className="text-sm text-white/60">
          Use apenas emails autorizados no Supabase Auth para manter o acesso
          exclusivo.
        </p>
      </section>

      <section className="flex items-center justify-center p-6 sm:p-10">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md rounded-lg border border-border bg-panel p-6 shadow-sm sm:p-8"
        >
          <div className="mb-8">
            <p className="text-sm font-semibold text-accent">
              {mode === "signin" ? "Entrar" : "Criar acesso"}
            </p>
            <h2 className="mt-2 text-3xl font-semibold">
              {mode === "signin" ? "Bem-vindos de volta" : "Comecar o RareCouple"}
            </h2>
          </div>

          <div className="grid gap-4">
            <label className="label">
              Email
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                <input
                  className="field pl-10"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
            </label>

            <label className="label">
              Senha
              <div className="relative">
                <input
                  className="field pr-11"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
          </div>

          {message ? (
            <p className="mt-4 rounded-lg border border-warning/30 bg-[#fff4d8] px-3 py-2 text-sm text-[#6b4b09]">
              {message}
            </p>
          ) : null}

          <button
            className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 font-semibold text-white transition hover:bg-accent-strong"
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : null}
            {mode === "signin" ? "Entrar" : "Criar conta"}
          </button>

          <button
            type="button"
            className="mt-4 w-full text-sm font-semibold text-accent"
            onClick={() => {
              setMode((value) => (value === "signin" ? "signup" : "signin"));
              setMessage("");
            }}
          >
            {mode === "signin" ? "Criar uma nova conta" : "Ja tenho conta"}
          </button>
        </form>
      </section>
    </main>
  );
}

