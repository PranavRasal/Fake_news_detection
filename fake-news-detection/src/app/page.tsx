"use client";

import { useState, useEffect, useRef } from "react";

// Types
type UrgencyLevel = "Low" | "Medium" | "High" | "Critical";

type ActionStep = {
  step: number;
  title: string;
  description: string;
};

type Authority = {
  name: string;
  role: string;
  helpline: string;
};

type FormalLetter = {
  recipient: string;
  subject: string;
  body: string;
  callToAction: string;
};

type AnalysisResult = {
  title: string;
  language: string;
  summary: string;
  category: string;
  urgency: {
    level: UrgencyLevel;
    score: number;
    reason: string;
  };
  actionPlan: ActionStep[];
  authoritiesToContact: Authority[];
  applicableLawsOrSchemes: string[];
  formalLetter: FormalLetter | null;
  timestamp: string;
};

type HistoryItem = {
  id: string;
  title: string;
  category: string;
  urgencyLevel: UrgencyLevel;
  urgencyScore: number;
  timestamp: string;
};

const SAMPLE_DEMO_ITEMS: HistoryItem[] = [
  {
    id: "hist-1",
    title: "Contaminated municipal tap water with dark sewage residue",
    category: "Public Health & Safety",
    urgencyLevel: "Critical",
    urgencyScore: 92,
    timestamp: "2026-10-06T14:30:00Z",
  },
  {
    id: "hist-2",
    title: "Uncovered high-voltage transformer wires near community park",
    category: "Water & Electricity Supply",
    urgencyLevel: "Critical",
    urgencyScore: 89,
    timestamp: "2026-10-06T18:15:00Z",
  },
  {
    id: "hist-3",
    title: "Overflowing garbage dump not cleared for past 3 weeks",
    category: "Sanitation & Waste Management",
    urgencyLevel: "High",
    urgencyScore: 78,
    timestamp: "2026-10-07T09:40:00Z",
  },
  {
    id: "hist-4",
    title: "Dangerous potholes causing bike accidents during monsoon",
    category: "Roads & Infrastructure",
    urgencyLevel: "High",
    urgencyScore: 75,
    timestamp: "2026-10-07T11:20:00Z",
  },
  {
    id: "hist-5",
    title: "Phishing SMS scam spoofing electricity bill disconnection",
    category: "Cyber & Financial Fraud",
    urgencyLevel: "Medium",
    urgencyScore: 62,
    timestamp: "2026-10-07T13:05:00Z",
  },
  {
    id: "hist-6",
    title: "Street lights non-functional along 2 km residential stretch",
    category: "Roads & Infrastructure",
    urgencyLevel: "Medium",
    urgencyScore: 58,
    timestamp: "2026-10-07T16:50:00Z",
  },
];

const PRESET_PROBLEMS = [
  "Overflowing garbage dump near primary school attracting stray animals and foul smell.",
  "Deep potholes and broken streetlights causing repeated night vehicle accidents.",
  "Tap water running brown and muddy for 5 days with cases of stomach infections.",
  "Online fake job fee fraud demanding money via UPI payment link.",
];

const LANGUAGES = [
  { code: "English", label: "English" },
  { code: "Hindi", label: "हिन्दी (Hindi)" },
  { code: "Spanish", label: "Español (Spanish)" },
  { code: "French", label: "Français (French)" },
  { code: "Tamil", label: "தமிழ் (Tamil)" },
  { code: "Telugu", label: "తెలుగు (Telugu)" },
  { code: "Bengali", label: "বাংলা (Bengali)" },
  { code: "Marathi", label: "मराठी (Marathi)" },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<"solver" | "analytics" | "about">("solver");
  const [problemText, setProblemText] = useState("");
  const [language, setLanguage] = useState("English");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");

  // Speech & Audio states
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Community Analytics history
  const [history, setHistory] = useState<HistoryItem[]>(SAMPLE_DEMO_ITEMS);

  // Initialize history from localStorage if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem("civic_history_v1");
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch {
      // LocalStorage not available or parse error
    }
  }, []);

  const saveHistory = (newItem: HistoryItem) => {
    const updated = [newItem, ...history];
    setHistory(updated);
    try {
      localStorage.setItem("civic_history_v1", JSON.stringify(updated));
    } catch {
      // Ignore storage errors
    }
  };

  const handleResetHistory = () => {
    setHistory(SAMPLE_DEMO_ITEMS);
    try {
      localStorage.setItem("civic_history_v1", JSON.stringify(SAMPLE_DEMO_ITEMS));
    } catch {
      // Ignore
    }
  };

  // Web Speech API - Voice Input (Speech to Text)
  const toggleListening = () => {
    if (typeof window === "undefined") return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      // Map language code for recognition
      const langMap: Record<string, string> = {
        English: "en-US",
        Hindi: "hi-IN",
        Spanish: "es-ES",
        French: "fr-FR",
        Tamil: "ta-IN",
        Telugu: "te-IN",
        Bengali: "bn-IN",
        Marathi: "mr-IN",
      };
      recognition.lang = langMap[language] || "en-US";

      recognition.onstart = () => setIsListening(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setProblemText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
    } catch (err) {
      console.error("Speech recognition error:", err);
      setIsListening(false);
    }
  };

  // Web Speech Synthesis - Voice Output (Text to Speech)
  const toggleSpeech = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("Text-to-speech audio is not supported in this browser.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if (!result) return;

    const speechText = `${result.summary}. Urgency level is ${result.urgency.level}. First recommended action: ${
      result.actionPlan[0]?.description || ""
    }`;

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Form Submission
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!problemText.trim()) return;

    setLoading(true);
    setError("");
    setResult(null);
    if (isSpeaking && typeof window !== "undefined") {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    try {
      const response = await fetch("/api/check-news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problem: problemText.trim(),
          language,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to process the problem statement.");
      }

      setResult(data);

      // Save to community analytics history
      saveHistory({
        id: `hist-${Date.now()}`,
        title: problemText.trim(),
        category: data.category || "General Civic Issue",
        urgencyLevel: data.urgency?.level || "Medium",
        urgencyScore: data.urgency?.score || 50,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }


  // Analytics Aggregation
  const totalIssues = history.length;
  const criticalCount = history.filter((h) => h.urgencyLevel === "Critical").length;
  const highCount = history.filter((h) => h.urgencyLevel === "High").length;
  const mediumCount = history.filter((h) => h.urgencyLevel === "Medium").length;
  const lowCount = history.filter((h) => h.urgencyLevel === "Low").length;

  const categoryCounts = history.reduce<Record<string, number>>((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});

  const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "None";

  // Urgency color helper
  const getUrgencyBadge = (level: UrgencyLevel, score?: number) => {
    switch (level) {
      case "Critical":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700 border border-red-200">
            <span className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />
            CRITICAL SEVERITY {score ? `(${score}/100)` : ""}
          </span>
        );
      case "High":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 border border-amber-200">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            HIGH PRIORITY {score ? `(${score}/100)` : ""}
          </span>
        );
      case "Medium":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800 border border-blue-200">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            MEDIUM PRIORITY {score ? `(${score}/100)` : ""}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            LOW PRIORITY {score ? `(${score}/100)` : ""}
          </span>
        );
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white font-black text-xl shadow-md shadow-emerald-600/20">
              ⚖️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-slate-900">CivicResolve AI</span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                  Open Source
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                AI System for Citizen Grievance Resolution & Policy Redressal
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 sm:gap-2 rounded-xl bg-slate-100 p-1 text-sm font-medium">
            <button
              onClick={() => setActiveTab("solver")}
              className={`rounded-lg px-3 py-1.5 transition ${
                activeTab === "solver"
                  ? "bg-white text-emerald-700 font-semibold shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              🛠️ Grievance Desk
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`rounded-lg px-3 py-1.5 transition ${
                activeTab === "analytics"
                  ? "bg-white text-emerald-700 font-semibold shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              📊 Analytics ({totalIssues})
            </button>
            <button
              onClick={() => setActiveTab("about")}
              className={`rounded-lg px-3 py-1.5 transition ${
                activeTab === "about"
                  ? "bg-white text-emerald-700 font-semibold shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              ℹ️ How to Use
            </button>
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {/* ========================================================================= */}
        {/* TAB 1: PROBLEM SOLVER & GRIEVANCE DESK */}
        {/* ========================================================================= */}
        {activeTab === "solver" && (
          <div className="flex flex-col gap-8">
            {/* Hero Header */}
            <section className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-teal-50/50 p-6 shadow-sm sm:p-8">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 mb-3">
                  <span>🏛️ Civic Action & Legal Redressal</span>
                  <span>•</span>
                  <span>Zero Bureaucracy Barrier</span>
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                  Turn Everyday Social Grievances into <span className="text-emerald-700">Official Action</span>.
                </h1>
                <p className="mt-2.5 text-base leading-relaxed text-slate-600 sm:text-lg">
                  Report issues like road hazards, water contamination, sanitation failures, or fraud. 
                  Our AI classifies the problem, identifies statutory rights, and generates practical resolution roadmaps.
                </p>
              </div>

              {/* Form Input Card */}
              <form onSubmit={handleSubmit} className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-md">
                {/* Form Controls: Language Selector */}
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <label className="text-xs font-semibold text-slate-700">
                      🌐 Output Language:
                    </label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none shadow-sm"
                    >
                      {LANGUAGES.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <span className="text-xs text-slate-500 hidden sm:inline">
                    Automatic severity triage & actionable resolution steps
                  </span>
                </div>

                {/* Main Problem Textarea with Voice Dictation */}
                <div className="relative">
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Describe the Social Problem in Detail:</span>
                    <span className="text-[11px] text-slate-500">
                      Supports speech-to-text in selected language
                    </span>
                  </label>
                  <textarea
                    rows={4}
                    value={problemText}
                    onChange={(e) => setProblemText(e.target.value)}
                    placeholder="Describe what happened, location, duration, and how it impacts people (or click the microphone icon to speak)..."
                    className="w-full rounded-xl border border-slate-300 bg-slate-50/50 p-4 text-base text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none transition resize-y"
                    required
                  />

                  {/* Mic button embedded in corner */}
                  <button
                    type="button"
                    onClick={toggleListening}
                    title={isListening ? "Stop listening" : "Click to speak your problem"}
                    className={`absolute bottom-4 right-3 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition shadow-sm ${
                      isListening
                        ? "bg-red-600 text-white animate-pulse"
                        : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                    }`}
                  >
                    <span>{isListening ? "🔴 Recording..." : "🎙️ Voice Input"}</span>
                  </button>
                </div>

                {/* Preset Chips */}
                <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
                  <span className="font-semibold text-slate-500">Try common issues:</span>
                  {PRESET_PROBLEMS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setProblemText(preset)}
                      className="rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1 text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 transition truncate max-w-xs text-left"
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                {/* Submit button */}
                <div className="mt-5 flex flex-col sm:flex-row items-center gap-3">
                  <button
                    type="submit"
                    disabled={loading || !problemText.trim()}
                    className="w-full sm:flex-1 rounded-xl bg-emerald-600 py-3.5 px-6 font-bold text-white shadow-md shadow-emerald-600/25 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2 text-base"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        Analyzing Civic Problem & Generating Action Plan...
                      </>
                    ) : (
                      <>
                        <span>⚡ Analyze Severity & Generate Resolution Roadmap</span>
                      </>
                    )}
                  </button>

                  {problemText && (
                    <button
                      type="button"
                      onClick={() => setProblemText("")}
                      className="w-full sm:w-auto rounded-xl border border-slate-200 px-4 py-3.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </form>
            </section>

            {/* Error Message */}
            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800 flex items-start gap-3">
                <span className="text-xl">⚠️</span>
                <div>
                  <h4 className="font-bold text-sm">Analysis Request Failed</h4>
                  <p className="text-sm mt-0.5">{error}</p>
                </div>
              </div>
            )}

            {/* Analysis Results Display */}
            {result && (
              <div className="flex flex-col gap-6">
                {/* 1. Triage & Overview Card */}
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-xl bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 border border-indigo-200">
                        📁 {result.category}
                      </span>
                      {getUrgencyBadge(result.urgency.level, result.urgency.score)}
                      <span className="rounded-xl bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                        🌐 {result.language}
                      </span>
                    </div>

                    {/* Audio Read-Out Button */}
                    <button
                      type="button"
                      onClick={toggleSpeech}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition shadow-sm ${
                        isSpeaking
                          ? "bg-amber-600 text-white animate-pulse"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      <span>{isSpeaking ? "⏹️ Stop Audio" : "🔊 Listen to Summary"}</span>
                    </button>
                  </div>

                  <div className="mt-4">
                    <h2 className="text-xl font-bold text-slate-900">Executive Grievance Summary</h2>
                    <p className="mt-2 text-base leading-relaxed text-slate-700 bg-slate-50 rounded-2xl p-4 border border-slate-100">
                      {result.summary}
                    </p>

                    {result.urgency.reason && (
                      <div className="mt-3 text-xs text-slate-500 flex items-center gap-1.5">
                        <span className="font-semibold text-slate-700">Urgency Assessment Rationale:</span>
                        <span>{result.urgency.reason}</span>
                      </div>
                    )}
                  </div>
                </section>

                {/* 2. Step-by-Step Resolution Roadmap */}
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">3-Step Action & Escalation Roadmap</h2>
                      <p className="text-xs text-slate-500">
                        Follow these sequential stages to hold administrative bodies accountable.
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                      Practical Steps
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {result.actionPlan.map((stepItem, idx) => (
                      <div
                        key={idx}
                        className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 relative flex flex-col justify-between hover:border-emerald-300 transition"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-black">
                              {stepItem.step || idx + 1}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                              Phase {idx + 1}
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-slate-900">{stepItem.title}</h3>
                          <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                            {stepItem.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 3. Authorities & Applicable Legal Acts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Authorities */}
                  <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <span>🏢 Designated Authorities & Portals</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Direct departments mandated to address this grievance
                    </p>

                    <div className="mt-4 space-y-3">
                      {result.authoritiesToContact?.map((auth, idx) => (
                        <div key={idx} className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                          <h4 className="text-sm font-bold text-slate-900">{auth.name}</h4>
                          <p className="text-xs text-slate-600 mt-0.5">{auth.role}</p>
                          <p className="text-xs font-mono text-emerald-700 mt-1.5 font-semibold">
                            📞 {auth.helpline}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Legal Acts */}
                  <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <span>⚖️ Statutory Laws & Citizen Rights</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Constitutional provisions and civic acts that protect you
                    </p>

                    <ul className="mt-4 space-y-2.5">
                      {result.applicableLawsOrSchemes?.map((law, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-800"
                        >
                          <span className="text-emerald-600 font-bold mt-0.5">§</span>
                          <span className="leading-relaxed font-medium">{law}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: COMMUNITY IMPACT ANALYTICS DASHBOARD (FEATURE 2) */}
        {/* ========================================================================= */}
        {activeTab === "analytics" && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  Community Grievance Analytics
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Real-time aggregation of citizen-reported issues, severity metrics, and departmental heatmaps.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetHistory}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
                >
                  🔄 Reset Demo Data
                </button>
              </div>
            </div>

            {/* Top Stat Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-medium text-slate-500">Total Grievances</p>
                <p className="text-3xl font-black text-slate-900 mt-1">{totalIssues}</p>
                <p className="text-[11px] text-emerald-600 font-semibold mt-1">100% Analyzed</p>
              </div>

              <div className="rounded-2xl border border-red-200 bg-red-50/50 p-4 shadow-sm">
                <p className="text-xs font-medium text-red-700">Critical Emergencies</p>
                <p className="text-3xl font-black text-red-700 mt-1">{criticalCount}</p>
                <p className="text-[11px] text-red-600 font-semibold mt-1">Requires immediate intervention</p>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm">
                <p className="text-xs font-medium text-amber-800">High Priority Grievances</p>
                <p className="text-3xl font-black text-amber-800 mt-1">{highCount}</p>
                <p className="text-[11px] text-amber-700 font-semibold mt-1">Severe civic disruption</p>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
                <p className="text-xs font-medium text-emerald-800">Most Affected Domain</p>
                <p className="text-base font-bold text-emerald-900 mt-2 truncate">{topCategory}</p>
                <p className="text-[11px] text-emerald-700 font-semibold mt-1">Highest frequency cluster</p>
              </div>
            </div>

            {/* Category Breakdown & Urgency Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category Breakdown Progress Bars */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-base font-bold text-slate-900">Issue Category Breakdown</h3>
                <p className="text-xs text-slate-500 mb-4">Distribution across civic departments</p>

                <div className="space-y-3">
                  {Object.entries(categoryCounts).map(([cat, count]) => {
                    const pct = Math.round((count / totalIssues) * 100);
                    return (
                      <div key={cat}>
                        <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                          <span>{cat}</span>
                          <span>
                            {count} ({pct}%)
                          </span>
                        </div>
                        <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Urgency Severity Distribution */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-base font-bold text-slate-900">Urgency Severity Breakdown</h3>
                <p className="text-xs text-slate-500 mb-4">Emergency triage spectrum</p>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                      <span className="text-red-700 font-bold">🔴 Critical Hazard</span>
                      <span>{criticalCount} ({Math.round((criticalCount / totalIssues) * 100)}%)</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-red-600"
                        style={{ width: `${(criticalCount / totalIssues) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                      <span className="text-amber-700 font-bold">🟠 High Priority</span>
                      <span>{highCount} ({Math.round((highCount / totalIssues) * 100)}%)</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-500"
                        style={{ width: `${(highCount / totalIssues) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                      <span className="text-blue-700 font-bold">🔵 Medium Priority</span>
                      <span>{mediumCount} ({Math.round((mediumCount / totalIssues) * 100)}%)</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-500"
                        style={{ width: `${(mediumCount / totalIssues) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                      <span className="text-emerald-700 font-bold">🟢 Low Priority</span>
                      <span>{lowCount} ({Math.round((lowCount / totalIssues) * 100)}%)</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${(lowCount / totalIssues) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Logged Issues Table */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-4">
                Recent Grievance Ledger ({history.length} logged entries)
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-3">Problem Statement</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Urgency Rating</th>
                      <th className="p-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {history.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3 font-medium text-slate-900 max-w-sm truncate">
                          {item.title}
                        </td>
                        <td className="p-3 text-slate-600">{item.category}</td>
                        <td className="p-3">{getUrgencyBadge(item.urgencyLevel, item.urgencyScore)}</td>
                        <td className="p-3">
                          <button
                            onClick={() => {
                              setProblemText(item.title);
                              setActiveTab("solver");
                            }}
                            className="font-bold text-emerald-600 hover:text-emerald-800"
                          >
                            Re-analyze ↗
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: ABOUT US & HOW TO USE THIS PLATFORM */}
        {/* ========================================================================= */}
        {activeTab === "about" && (
          <div className="flex flex-col gap-8 max-w-4xl mx-auto">
            {/* About Card */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 mb-2">
                🌟 Open-Source College Engineering Project
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900">About CivicResolve AI</h1>
              <p className="mt-3 text-base leading-relaxed text-slate-700">
                Millions of citizens encounter persistent civic and social hurdles daily—from broken municipal 
                pipelines and unsafe roads to consumer fraud and administrative inertia. However, most people face 
                two critical bottlenecks: <strong>they do not know which department is legally responsible</strong>, and 
                <strong>they lack the formal administrative vocabulary to file an enforceable grievance</strong>.
              </p>
              <p className="mt-3 text-base leading-relaxed text-slate-700">
                <strong>CivicResolve AI</strong> bridges this divide. Built with Gemini 2.5 and open-source civic principles, 
                it acts as a 24/7 civic assistant that translates natural citizen grievances into structured action roadmaps, 
                assigns triage urgency, and tracks community pain points on public dashboards.
              </p>
            </section>

            {/* How to Use Step-by-Step Guide */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                How to Use This Website (4 Simple Steps)
              </h2>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white font-bold text-base shadow-sm">
                    1
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Speak or Type Your Issue in Any Language</h3>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                      Select your preferred language (English, हिन्दी, Español, etc.). Describe your problem naturally in the input box, 
                      or click the <strong>🎙️ Voice Input</strong> button to speak your grievance directly through your microphone.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white font-bold text-base shadow-sm">
                    2
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Instant AI Severity & Urgency Triage</h3>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                      Click <em>Analyze Severity</em>. The system evaluates the problem and tags it with an automated 
                      <strong> Urgency Score</strong> (Critical, High, Medium, Low) and category domain (e.g. Sanitation, Roads, Public Health).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white font-bold text-base shadow-sm">
                    3
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Review 3-Step Practical Action Roadmap</h3>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                      Get immediate clarity on what evidence to gather (photos, timestamps), which specific officer or portal 
                      to approach, and what statutory provisions protect you.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white font-bold text-base shadow-sm">
                    4
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Track Civic Impact via Analytics</h3>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                      Switch to the <strong>📊 Analytics</strong> tab anytime to see city-wide distribution of grievances, 
                      percentage of critical hazards, and most neglected civic sectors for community advocacy.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Architecture Highlights for Evaluators */}
            <section className="rounded-3xl border border-slate-200 bg-slate-900 text-white p-6 sm:p-8 shadow-sm">
              <h2 className="text-xl font-bold text-emerald-400 mb-2">
                Technical Highlights (For College Evaluators & Viva)
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mt-4">
                <div className="rounded-2xl bg-slate-800/80 p-4 border border-slate-700">
                  <h4 className="font-bold text-white text-sm">🧠 LLM Structured Schema (Gemini 2.5)</h4>
                  <p className="text-slate-300 mt-1">
                    Uses strict JSON schema responses rather than unstructured chat output, enabling systematic triage and actionable roadmap planning.
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-800/80 p-4 border border-slate-700">
                  <h4 className="font-bold text-white text-sm">🎙️ Zero-Cost Web Speech API</h4>
                  <p className="text-slate-300 mt-1">
                    Integrated native browser speech recognition & synthesis for grassroots voice accessibility without external billable audio APIs.
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-800/80 p-4 border border-slate-700">
                  <h4 className="font-bold text-white text-sm">🌐 Multilingual Civic Reasoning</h4>
                  <p className="text-slate-300 mt-1">
                    Accepts and produces resolution roadmaps across vernacular and international languages to democratize justice.
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-800/80 p-4 border border-slate-700">
                  <h4 className="font-bold text-white text-sm">📊 Aggregated Community Dashboard</h4>
                  <p className="text-slate-300 mt-1">
                    Provides real-time categorization and severity ratings so civic organizers and municipal bodies can analyze pain points.
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500 mt-auto">
        <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 CivicResolve AI • Open-Source Solution for Civic & Social Problems</p>
          <div className="flex items-center gap-4 text-slate-600 font-medium">
            <span>Powered by Gemini 2.5 Flash</span>
            <span>•</span>
            <span>Next.js 16 & Tailwind CSS</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
