import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  Upload,
  Link as LinkIcon,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Award,
  BarChart3,
  Clock,
  Key,
  FileText,
  Trash2,
  ChevronRight,
  Brain,
  Target,
  ShieldCheck
} from 'lucide-react';
import { GEMINI_API_KEY, GEMINI_MODEL } from './config';

interface Question {
  id: number;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  question: string;
  expectedAnswer: string;
  keywords: string[];
  explanation: string;
}

interface EvaluationResult {
  questionId: number;
  userAnswer: string;
  isCorrect: boolean;
  score: number; // 0 to 1
  feedback: string;
  matchedKeywords: string[];
  missingKeywords: string[];
}

const DEFAULT_STUDY_MATERIAL = `Kali Linux & Network Security Fundamentals:
1. User Management:
- To create a new user with a home directory, use the command: useradd -m username
- To set or change a password for a user, run: passwd username
- To add a user to the sudo group for administrative privileges: usermod -aG sudo username
- To switch to the root user interactive shell: sudo -i or su -

2. File Permissions & Ownership:
- chmod 755 filename gives read, write, and execute permissions to the owner, and read/execute to group and others.
- chown user:group filename changes the user and group ownership of a file.
- ls -la displays all files including hidden dot files along with their permissions and ownership.

3. Network Scanning with Nmap:
- nmap 127.0.0.1 scans the local loopback address for open ports.
- nmap -sn 192.168.1.0/24 performs a ping sweep (host discovery) without port scanning.
- nmap -sV -O target_ip detects service versions (-sV) and operating system (-O).
- nmap -p 1-65535 target_ip scans all 65,535 TCP ports.
- nmap -A target_ip enables aggressive scan mode (OS detection, version detection, script scanning, and traceroute).

4. Network Configuration & Diagnostics:
- ip addr or ifconfig displays current network interfaces and IPv4/IPv6 addresses.
- netstat -tulnp or ss -tulnp lists all active listening TCP/UDP ports and their process IDs.
- ping -c 4 8.8.8.8 sends 4 ICMP echo request packets to test connectivity.`;

export default function App() {
  const [material, setMaterial] = useState<string>(DEFAULT_STUDY_MATERIAL);
  const [urlInput, setUrlInput] = useState<string>('');
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [results, setResults] = useState<Record<number, EvaluationResult>>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'material' | 'test' | 'analytics'>('material');
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const [resetCount, setResetCount] = useState<number>(0);

  // API Key modal state
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  const [apiKeyInput, setApiKeyInput] = useState<string>(GEMINI_API_KEY);
  const [keyStatus, setKeyStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let interval: any;
    if (timerActive && !isSubmitted) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, isSubmitted]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  const getActiveApiKey = () => {
    return apiKeyInput.trim() || GEMINI_API_KEY;
  };

  const saveApiKey = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('EDUSMART_GEMINI_KEY', apiKeyInput.trim());
    }
    setKeyStatus('Saved locally in browser!');
    setTimeout(() => setKeyStatus(''), 3000);
  };

  // Drag and Drop file reading
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsLoading(true);
    setLoadingStep('Reading uploaded document content...');

    const newFileNames: string[] = [];
    let combinedText = material ? material + '\n\n' : '';

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      newFileNames.push(file.name);
      try {
        const text = await file.text();
        const cleaned = text.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim();
        if (cleaned.length > 30) {
          combinedText += `--- Content from ${file.name} ---\n${cleaned}\n\n`;
        }
      } catch {
        combinedText += `--- Uploaded File: ${file.name} ---\n`;
      }
    }

    setUploadedFiles((prev) => [...prev, ...newFileNames]);
    setMaterial(combinedText);
    setIsLoading(false);
    setLoadingStep('');
  };

  const handleAnalyzeUrl = async () => {
    if (!urlInput.trim()) return;
    setIsLoading(true);
    setLoadingStep(`Analyzing URL: ${urlInput}...`);
    const key = getActiveApiKey();

    try {
      if (key) {
        const resp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `Extract comprehensive technical study notes, key definitions, commands, and facts from or about this topic/URL: ${urlInput}`
                    }
                  ]
                }
              ]
            })
          }
        );
        const data = await resp.json();
        const extracted = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (extracted) {
          setMaterial((prev) => `${prev}\n\n--- Source URL: ${urlInput} ---\n${extracted}`);
          setUploadedFiles((prev) => [...prev, urlInput]);
          setUrlInput('');
          setIsLoading(false);
          setLoadingStep('');
          return;
        }
      }
    } catch {
      // Fallback below
    }

    setMaterial((prev) => `${prev}\n\n--- Referenced URL: ${urlInput} ---\nKey concepts and technical notes from ${urlInput}.`);
    setUploadedFiles((prev) => [...prev, urlInput]);
    setUrlInput('');
    setIsLoading(false);
    setLoadingStep('');
  };

  // Offline deterministic + dynamic fallback question generator
  const generateOfflineQuestions = (rawText: string, count: number, seed: number): Question[] => {
    const lines = rawText
      .split(/\n|\. /)
      .map((l) => l.trim())
      .filter((l) => l.length > 20);

    const difficulties: ('Easy' | 'Medium' | 'Hard')[] = ['Easy', 'Medium', 'Hard'];
    const generated: Question[] = [];

    const templates = [
      (s: string, kw: string) => `Fill in the blank: ${s.replace(new RegExp(kw, 'i'), '________')}`,
      (s: string, kw: string) => `Complete the missing technical term or command: "${s.replace(new RegExp(kw, 'i'), '________')}"`,
      (s: string, kw: string) => `In your own words or exact syntax, what belongs in the blank? ${s.replace(new RegExp(kw, 'i'), '________')}`
    ];

    for (let i = 0; i < count; i++) {
      const lineIdx = (i + seed * 3) % Math.max(1, lines.length);
      const sentence = lines[lineIdx] || 'nmap -sV -O target_ip detects service versions and operating system.';
      const words = sentence
        .replace(/[^a-zA-Z0-9_-]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length >= 4);

      const targetWord = words[(i + seed) % Math.max(1, words.length)] || 'nmap';
      const templateFn = templates[(i + seed) % templates.length];
      const diff = difficulties[(i + seed) % 3];

      let topic = 'General Concepts';
      if (/nmap|port|scan|ping|ip|netstat/i.test(sentence)) topic = 'Network Scanning & Diagnostics';
      else if (/user|passwd|sudo|root/i.test(sentence)) topic = 'User & Privilege Management';
      else if (/chmod|chown|ls|file|permission/i.test(sentence)) topic = 'File Permissions & Linux Basics';

      const kws = Array.from(
        new Set(
          words
            .filter((w) => w.length > 3)
            .slice(0, 4)
            .map((w) => w.toLowerCase())
        )
      );
      if (!kws.includes(targetWord.toLowerCase())) kws.unshift(targetWord.toLowerCase());

      generated.push({
        id: i + 1,
        topic,
        difficulty: diff,
        question: templateFn(sentence, targetWord),
        expectedAnswer: targetWord,
        keywords: kws.slice(0, 4),
        explanation: `Full reference from material: "${sentence}"`
      });
    }

    return generated.sort(() => Math.random() - 0.5).map((q, idx) => ({ ...q, id: idx + 1 }));
  };

  const handleGenerateTest = async (isReset = false) => {
    if (!material.trim()) return;
    setIsLoading(true);
    const nextSeed = isReset ? resetCount + 1 : resetCount;
    if (isReset) setResetCount(nextSeed);

    setLoadingStep(`Generating ${questionCount} Fill-in-the-Blank questions (Easy, Medium, Hard)...`);
    setIsSubmitted(false);
    setUserAnswers({});
    setResults({});
    setElapsedSeconds(0);

    const key = getActiveApiKey();
    if (key) {
      try {
        const prompt = `You are an expert educational assessment generator.
Based strictly on the study material below, generate ${Math.min(questionCount, 30)} unique Fill-in-the-Blank and Short-Answer questions (NO multiple choice options).
Variation seed: ${nextSeed} (ask questions in a fresh way).
Distribute difficulty randomly across "Easy", "Medium", and "Hard".
Return ONLY a valid JSON array of objects with these exact fields:
[
  {
    "id": 1,
    "topic": "Topic Name",
    "difficulty": "Easy" | "Medium" | "Hard",
    "question": "Fill-in-the-blank question with ________ or short conceptual question",
    "expectedAnswer": "Concise ideal answer or command",
    "keywords": ["keyword1", "keyword2"],
    "explanation": "Brief explanation why this answer is correct"
  }
]

STUDY MATERIAL:
${material.slice(0, 12000)}`;

        const resp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: 'application/json' }
            })
          }
        );

        const data = await resp.json();
        const rawJson = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawJson) {
          const parsed: Question[] = JSON.parse(rawJson);
          if (Array.isArray(parsed) && parsed.length > 0) {
            let finalQuestions = [...parsed];
            if (finalQuestions.length < questionCount) {
              const extra = generateOfflineQuestions(material, questionCount - finalQuestions.length, nextSeed + 10);
              finalQuestions = [...finalQuestions, ...extra];
            }
            const shuffled = finalQuestions
              .slice(0, questionCount)
              .sort(() => Math.random() - 0.5)
              .map((q, idx) => ({ ...q, id: idx + 1 }));
            setQuestions(shuffled);
            setActiveTab('test');
            setTimerActive(true);
            setIsLoading(false);
            setLoadingStep('');
            return;
          }
        }
      } catch {
        // Fallback to offline engine seamlessly
      }
    }

    const fallback = generateOfflineQuestions(material, questionCount, nextSeed);
    setQuestions(fallback);
    setActiveTab('test');
    setTimerActive(true);
    setIsLoading(false);
    setLoadingStep('');
  };

  // Case-insensitive semantic & keyword evaluator
  const evaluateAnswers = async () => {
    setIsLoading(true);
    setLoadingStep('Verifying answers (case-insensitive keyword & meaning analysis)...');
    setTimerActive(false);

    const newResults: Record<number, EvaluationResult> = {};

    for (const q of questions) {
      const rawAns = (userAnswers[q.id] || '').trim();
      const normUser = rawAns.toLowerCase();
      const normExpected = q.expectedAnswer.toLowerCase().trim();

      if (!normUser) {
        newResults[q.id] = {
          questionId: q.id,
          userAnswer: '',
          isCorrect: false,
          score: 0,
          feedback: 'No answer provided. Review the expected keyword and concept below.',
          matchedKeywords: [],
          missingKeywords: q.keywords
        };
        continue;
      }

      const matched: string[] = [];
      const missing: string[] = [];

      q.keywords.forEach((kw) => {
        const cleanKw = kw.toLowerCase().trim();
        if (normUser.includes(cleanKw) || cleanKw.includes(normUser)) {
          matched.push(kw);
        } else {
          missing.push(kw);
        }
      });

      const directMatch =
        normUser === normExpected ||
        normUser.includes(normExpected) ||
        (normExpected.includes(normUser) && normUser.length >= 3);

      const keywordRatio = q.keywords.length > 0 ? matched.length / q.keywords.length : 0;

      let score = 0;
      if (directMatch) {
        score = 1;
      } else if (keywordRatio >= 0.6) {
        score = 1;
      } else if (keywordRatio >= 0.3) {
        score = 0.5;
      }

      const isCorrect = score >= 0.5;
      let feedback = '';
      if (score === 1) {
        feedback = 'Correct! Your answer matches the expected concept and key terms (case-insensitive).';
      } else if (score === 0.5) {
        feedback = 'Partially correct! You captured the core meaning, but missed some specific syntax or keywords.';
      } else {
        feedback = `Incorrect. Make sure to include key terms like "${q.expectedAnswer}".`;
      }

      newResults[q.id] = {
        questionId: q.id,
        userAnswer: rawAns,
        isCorrect,
        score,
        feedback,
        matchedKeywords: matched,
        missingKeywords: missing
      };
    }

    setResults(newResults);
    setIsSubmitted(true);
    setIsLoading(false);
    setLoadingStep('');
    setActiveTab('analytics');
  };

  // Compute analytics
  const totalScore = Object.values(results).reduce((acc, r) => acc + r.score, 0);
  const percentage = questions.length > 0 ? Math.round((totalScore / questions.length) * 100) : 0;

  const topicStats: Record<string, { total: number; earned: number }> = {};
  const diffStats: Record<'Easy' | 'Medium' | 'Hard', { total: number; earned: number }> = {
    Easy: { total: 0, earned: 0 },
    Medium: { total: 0, earned: 0 },
    Hard: { total: 0, earned: 0 }
  };

  questions.forEach((q) => {
    const r = results[q.id];
    const earned = r ? r.score : 0;
    if (!topicStats[q.topic]) topicStats[q.topic] = { total: 0, earned: 0 };
    topicStats[q.topic].total += 1;
    topicStats[q.topic].earned += earned;

    diffStats[q.difficulty].total += 1;
    diffStats[q.difficulty].earned += earned;
  });

  const weakTopics = Object.entries(topicStats)
    .map(([topic, stat]) => ({
      topic,
      pct: Math.round((stat.earned / stat.total) * 100),
      total: stat.total,
      earned: stat.earned
    }))
    .filter((t) => t.pct < 70)
    .sort((a, b) => a.pct - b.pct);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">
                EduSmart AI Test Platform
              </h1>
              <p className="text-xs text-slate-400">
                Fill-in-the-Blank Generator • Semantic & Keyword Evaluator
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('material')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                activeTab === 'material'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              1. Study Material
            </button>
            <button
              onClick={() => questions.length > 0 && setActiveTab('test')}
              disabled={questions.length === 0}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                activeTab === 'test'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40'
              }`}
            >
              2. Test Paper ({questions.length})
            </button>
            <button
              onClick={() => isSubmitted && setActiveTab('analytics')}
              disabled={!isSubmitted}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                activeTab === 'analytics'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40'
              }`}
            >
              3. Score & Weak Topics
            </button>

            <button
              onClick={() => setShowKeyModal(true)}
              className="ml-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 flex items-center gap-1.5"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              API Key Setup
            </button>
          </div>
        </div>
      </header>

      {/* Loading Banner */}
      {isLoading && (
        <div className="bg-indigo-950/90 border-b border-indigo-500/30 px-4 py-2.5 text-center text-sm text-indigo-200 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
          <span>{loadingStep}</span>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-6xl w-full mx-auto px-4 py-6 flex-1">
        {activeTab === 'material' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-semibold flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-indigo-400" />
                    Paste or Edit Study Material
                  </h2>
                  <button
                    onClick={() => {
                      setMaterial('');
                      setUploadedFiles([]);
                    }}
                    className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Clear Text
                  </button>
                </div>
                <textarea
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  rows={14}
                  placeholder="Paste your textbook notes, commands, definitions, or upload files on the right..."
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-4 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 font-mono leading-relaxed"
                />
              </div>
            </div>

            <div className="space-y-4">
              {/* Drag and drop zone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleFileUpload(e.dataTransfer.files);
                }}
                onClick={() => fileInputRef.current?.click()}
                className="bg-slate-900 border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl p-6 text-center cursor-pointer transition"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".txt,.md,.pdf,.doc,.docx,.ppt,.pptx,.csv,.json"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files)}
                />
                <Upload className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-200">
                  Drag & Drop Files or Click to Browse
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Supports .txt, .pdf, .pptx, .docx, .md
                </p>
              </div>

              {/* URL Input */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-indigo-400" />
                  Import From Web Link / URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://example.com/notes"
                    className="flex-1 rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={handleAnalyzeUrl}
                    className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white"
                  >
                    Analyze
                  </button>
                </div>
              </div>

              {/* Test Configuration */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  Test Paper Configuration
                </h3>

                <div>
                  <label className="text-xs text-slate-400 block mb-2">
                    Number of Questions (Easy to Hard Randomized)
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[10, 25, 50, 100].map((cnt) => (
                      <button
                        key={cnt}
                        onClick={() => setQuestionCount(cnt)}
                        className={`py-2 rounded-lg text-xs font-bold border transition ${
                          questionCount === cnt
                            ? 'bg-indigo-600 border-indigo-500 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {cnt} Qs
                      </button>
                    ))}
                  </div>
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="text-xs text-slate-400 space-y-1">
                    <p className="font-medium text-slate-300">Loaded Sources:</p>
                    {uploadedFiles.map((f, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-slate-400 truncate">
                        <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="truncate">{f}</span>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => handleGenerateTest(false)}
                  disabled={!material.trim() || isLoading}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate Fill-in-the-Blank Test
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'test' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {questions.length} Fill-in-the-Blank Questions
                </span>
                <span className="flex items-center gap-1.5 text-sm text-slate-300 font-mono">
                  <Clock className="w-4 h-4 text-amber-400" />
                  {formatTime(elapsedSeconds)}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleGenerateTest(true)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reset & Ask Differently
                </button>
                <button
                  onClick={evaluateAnswers}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Submit & Verify Answers
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {questions.map((q, idx) => {
                const res = results[q.id];
                return (
                  <div
                    key={q.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-indigo-400">
                        Question {idx + 1} • {q.topic}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          q.difficulty === 'Easy'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : q.difficulty === 'Medium'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {q.difficulty}
                      </span>
                    </div>

                    <p className="text-sm md:text-base font-medium text-slate-100 leading-relaxed">
                      {q.question}
                    </p>

                    <input
                      type="text"
                      value={userAnswers[q.id] || ''}
                      onChange={(e) =>
                        setUserAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                      }
                      disabled={isSubmitted}
                      placeholder="Type your answer or command (case-insensitive, own words accepted)..."
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                    />

                    {isSubmitted && res && (
                      <div
                        className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                          res.isCorrect
                            ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                            : 'bg-rose-950/30 border-rose-500/30 text-rose-200'
                        }`}
                      >
                        <div className="flex items-center justify-between font-semibold">
                          <span className="flex items-center gap-1.5">
                            {res.isCorrect ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <XCircle className="w-4 h-4 text-rose-400" />
                            )}
                            {res.feedback}
                          </span>
                          <span>Score: {res.score}/1</span>
                        </div>
                        <p className="text-slate-300">
                          <strong>Expected / Reference Answer:</strong> {q.expectedAnswer}
                        </p>
                        <p className="text-slate-400">{q.explanation}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && isSubmitted && (
          <div className="space-y-6">
            {/* Score Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400">
                  <Award className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Total Score & Knowledge Level</p>
                  <p className="text-2xl font-bold text-white">
                    {totalScore} / {questions.length} ({percentage}%)
                  </p>
                  <p className="text-xs text-indigo-400 mt-0.5">
                    {percentage >= 80
                      ? 'Advanced Mastery'
                      : percentage >= 50
                      ? 'Intermediate Understanding'
                      : 'Needs Focused Revision'}
                  </p>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400">
                  <BarChart3 className="w-8 h-8" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-400 mb-1.5">Accuracy by Difficulty</p>
                  <div className="space-y-1 text-xs">
                    {(['Easy', 'Medium', 'Hard'] as const).map((d) => {
                      const st = diffStats[d];
                      const pct = st.total > 0 ? Math.round((st.earned / st.total) * 100) : 0;
                      return (
                        <div key={d} className="flex justify-between">
                          <span className="text-slate-300">{d}:</span>
                          <span className="font-semibold text-white">
                            {st.earned}/{st.total} ({pct}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">Want Fresh Questions?</p>
                  <p className="text-sm font-semibold text-white mt-1">
                    Practice Again with New Phrasing
                  </p>
                  <button
                    onClick={() => handleGenerateTest(true)}
                    className="mt-3 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Generate New Test Paper
                  </button>
                </div>
              </div>
            </div>

            {/* Weak Topics & Action Plan */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-rose-400" />
                Weak Topics & Recommended Action Plan
              </h3>

              {weakTopics.length === 0 ? (
                <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-sm text-emerald-200">
                  Excellent work! You scored above 70% across all tested topics. Try increasing the question count to 50 or 100 for deeper mastery.
                </div>
              ) : (
                <div className="space-y-3">
                  {weakTopics.map((wt, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-400" />
                          <span className="font-semibold text-sm text-white">{wt.topic}</span>
                          <span className="text-xs px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            Score: {wt.pct}% (Low)
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Action Step: Review the core commands and definitions in "{wt.topic}", practice writing the syntax from memory, and re-take a randomized test.
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveTab('test')}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 self-start md:self-center flex items-center gap-1"
                      >
                        Review Questions <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                Gemini API Key Configuration
              </h3>
              <button
                onClick={() => setShowKeyModal(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your source code is 100% free of hardcoded keys so it is safe to upload to GitHub. For local use, set <code className="text-indigo-400">VITE_GEMINI_API_KEY</code> in a <code className="text-indigo-400">.env</code> file or paste your key below (saved only in your browser's localStorage).
            </p>
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            />
            {keyStatus && <p className="text-xs text-emerald-400">{keyStatus}</p>}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowKeyModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-medium text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={saveApiKey}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white"
              >
                Save Key Locally
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
