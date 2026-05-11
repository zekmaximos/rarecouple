"use client";

import { evaAvatar, evaQuotes, memories } from "@/lib/brand-assets";
import { Eye, EyeOff, Heart, Loader2, Mail, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

const allowedEmails = new Set([
  "samuel.morais@rarecouple.com",
  "stephanie.carvalho@rarecouple.com",
]);

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const loginMemories = [memories[0], memories[2], memories[4], memories[7]];
  const evaLine = evaQuotes[2];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    const normalizedEmail = email.trim().toLowerCase();

    if (!allowedEmails.has(normalizedEmail)) {
      setMessage("Este app e exclusivo para Samuel e Stephanie.");
      setLoading(false);
      return;
    }

    const result = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: normalizedEmail, password }),
    });

    if (!result.ok) {
      const data = (await result.json()) as { message?: string };
      setMessage(data.message ?? "Usuario ou senha invalidos.");
      setLoading(false);
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <main className="grid min-h-screen bg-[#fff8f4] lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative flex min-h-[48vh] flex-col justify-between overflow-hidden bg-[#783b5e] p-6 text-white sm:p-10 lg:min-h-screen">
        <div className="pointer-events-none absolute inset-0 opacity-20">
          <Image
            src="/memories/couple-sunny.jpeg"
            alt=""
            fill
            priority
            sizes="52vw"
            className="object-cover"
            aria-hidden="true"
          />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(82,38,67,0.94),rgba(120,59,94,0.72)_52%,rgba(47,159,144,0.45))]" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-2xl bg-white text-[#853f66] shadow-sm">
            <Heart size={22} fill="currentColor" />
          </div>
          <div>
            <p className="font-semibold">RareCouple</p>
            <p className="text-sm text-white/75">Financas do casal</p>
          </div>
        </div>
        <div className="relative z-10 max-w-xl py-12">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-[#ffd6e7]">
            Privado, leve e organizado
          </p>
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl xl:text-6xl">
            Uma rotina financeira para duas pessoas decidirem melhor.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-white/76">
            Lancamentos rapidos, despesas fixas, parcelas, dashboard e CSV
            padronizado desde a primeira versao.
          </p>
        </div>
        <div className="relative z-10 grid gap-4">
          <div className="grid grid-cols-4 gap-2 sm:max-w-xl">
            {loginMemories.map((memory) => (
              <div key={memory.src} className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-white/18 bg-white/10 shadow-xl">
                <Image src={memory.src} alt={memory.alt} fill sizes="(max-width: 1024px) 25vw, 12vw" className="object-cover" />
              </div>
            ))}
          </div>
          <div className="flex max-w-xl items-start gap-3 rounded-2xl border border-white/18 bg-white/12 p-3 text-sm text-white shadow-xl backdrop-blur">
            <Image src={evaAvatar} alt="Eva Flor" width={48} height={48} className="size-12 shrink-0 rounded-full object-cover ring-2 ring-white/40" />
            <div>
              <p className="font-semibold">Eva Flor</p>
              <p className="mt-1 text-white/78">{evaLine}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-white/72">
            <ShieldCheck size={17} />
            Acesso pensado para apenas duas contas autorizadas.
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center p-6 sm:p-10">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md rounded-2xl border border-[#ead7dd] bg-white p-6 shadow-[0_18px_70px_rgba(133,63,102,0.12)] sm:p-8"
        >
          <div className="mb-8">
            <p className="text-sm font-semibold text-accent">Acesso privado</p>
            <h2 className="mt-2 text-2xl font-semibold leading-tight sm:text-3xl">
              Bem-vindos de volta
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              Entram somente os dois emails autorizados do RareCouple.
            </p>
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
                  autoComplete="current-password"
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
            className="mt-6 flex h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-accent px-4 font-semibold text-white transition hover:bg-accent-strong"
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : null}
            Entrar
          </button>
        </form>
      </section>
    </main>
  );
}
