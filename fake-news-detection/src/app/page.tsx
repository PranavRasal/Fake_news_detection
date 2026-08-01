"use client";

import { useState } from "react";

type Claim = {
  text: string;
  rating: string;
  publisher: string;
  url: string;
};

type CheckResult = {
  title: string;
  verdict: string;
  isLikelyTrue: boolean;
  confidence: number;
  summary: string;
  sourceCount: number;
  claimCount: number;
  claims: Claim[];
};

export default function Home() {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/check-news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to analyze the news title.");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#eef8f2,_#f8fafc_55%,_#f1f5f9_100%)] px-4 py-10 text-slate-800 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <section className="rounded-3xl border border-emerald-100 bg-white/90 p-6 shadow-[0_20px_60px_-20px_rgba(16,185,129,0.25)] backdrop-blur sm:p-8">
          <div className="max-w-3xl">
            <p className="mb-3 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
              Social Impact Ideas
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Turn a social problem into a clear, practical solution idea.
            </h1>
            <p className="mt-3 text-base leading-7 text-slate-600 sm:text-lg">
              Describe the challenge you care about, and this assistant will help you shape it into a thoughtful, actionable response.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-inner">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Tell me your problem, and I'll do my best to help solve it."
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none transition focus:border-emerald-500"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="mt-3 w-full rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Generating solution..." : "Generate solution"}
            </button>
          </form>
        </section>

        {error ? (
          <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </section>
        ) : null}

        {result ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="space-y-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">
              {result.claims.length > 0 ? (
                result.claims.map((claim, index) => (
                  <div key={`${claim.text}-${index}`} className="rounded-xl bg-slate-50 p-4">
                    {claim.text}
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-600">No response received.</p>
              )}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
