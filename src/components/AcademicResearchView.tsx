import React, { useState } from 'react';
import {
  Search,
  Sparkles,
  ExternalLink,
  BookOpen,
  Bookmark,
  Send,
  Loader2,
  Copy,
  Check,
  GraduationCap,
  FileCode,
  Globe,
  Clock,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { AcademicResearchEntry, GroundingSource } from '../types';
import { playAudioFeedback } from '../utils/audio';

interface AcademicResearchViewProps {
  researchEntries: AcademicResearchEntry[];
  onSaveEntry: (entry: AcademicResearchEntry) => void;
  onSendToNotes: (title: string, subject: string, content: string) => void;
  initialQuery?: string;
  initialSubject?: string;
  isMuted: boolean;
}

const SUGGESTED_RESEARCH_PROMPTS = [
  {
    title: 'Java vs Python: Memory Layout',
    query: 'Explain how memory management, pointers/references, and garbage collection differ between Java (JVM) and Python with real code examples.',
    subject: 'Computer Science',
  },
  {
    title: 'Freshman CS Algorithm Syllabi',
    query: 'What data structures and algorithms are covered in university freshman/sophomore computer science courses at top universities?',
    subject: 'College Prep',
  },
  {
    title: 'Calculus: Integration by Parts Proof',
    query: 'Derive the formula for Integration by Parts from the Product Rule, and explain the LIATE mnemonic with practical examples.',
    subject: 'Mathematics',
  },
  {
    title: 'Data Structures & Big-O Complexity',
    query: 'Compare time and space complexity of HashMaps, Balanced Trees, and Priority Queues with practical STEM examples.',
    subject: 'Computer Science',
  },
];

export const AcademicResearchView: React.FC<AcademicResearchViewProps> = ({
  researchEntries,
  onSaveEntry,
  onSendToNotes,
  initialQuery = '',
  initialSubject = 'Computer Science',
  isMuted,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [subject, setSubject] = useState(initialSubject);
  const [isLoading, setIsLoading] = useState(false);
  const [activeEntry, setActiveEntry] = useState<AcademicResearchEntry | null>(
    researchEntries[0] || null
  );
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSearch = async (searchQuery: string, searchSubject: string) => {
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    setErrorMsg(null);
    playAudioFeedback('start', isMuted);

    try {
      const response = await fetch('/api/ai/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          mode: 'research',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch academic research');
      }

      const newEntry: AcademicResearchEntry = {
        id: `res-${Date.now()}`,
        query: searchQuery,
        subject: searchSubject,
        timestamp: new Date().toISOString(),
        answer: data.answer,
        sources: data.sources || [],
        webSearchQueries: data.webSearchQueries || [],
      };

      onSaveEntry(newEntry);
      setActiveEntry(newEntry);
      playAudioFeedback('complete', isMuted);
    } catch (err: any) {
      let friendlyMsg = typeof err === 'string' ? err : err?.message || 'Error communicating with Google AI research service.';
      if (friendlyMsg.includes('429') || friendlyMsg.includes('quota') || friendlyMsg.includes('RESOURCE_EXHAUSTED')) {
        friendlyMsg = 'Gemini API quota rate limit reached on this key. Switching to local academic synthesis reference.';
      }
      setErrorMsg(friendlyMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyAnswer = () => {
    if (!activeEntry) return;
    navigator.clipboard.writeText(activeEntry.answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          Academic Research &amp; Google AI Search
          <span className="text-[11px] font-bold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Globe className="w-3 h-3 text-indigo-500" />
            Live Search Grounding
          </span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Grounded academic queries with verified citations, literature synthesis, and STEM problem solving for college preparation.
        </p>
      </div>

      {/* Search Input Bar */}
      <form
        onSubmit={e => {
          e.preventDefault();
          handleSearch(query, subject);
        }}
        className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3"
      >
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Ask an academic question, request algorithm breakdown in Java/Python, or syllabus review..."
              className="w-full pl-11 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <select
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="px-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300"
            >
              <option value="Computer Science">Computer Science</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Physics">Physics</option>
              <option value="College Admissions">College Admissions</option>
              <option value="General Academic">General Academic</option>
            </select>

            <button
              id="submit-academic-search-btn"
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Searching...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" /> Research
                </>
              )}
            </button>
          </div>
        </div>

        {/* Suggested Prompts Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-[11px] font-bold text-slate-400 shrink-0">Suggested:</span>
          {SUGGESTED_RESEARCH_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setQuery(prompt.query);
                setSubject(prompt.subject);
                handleSearch(prompt.query, prompt.subject);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/40 shrink-0 transition"
            >
              {prompt.title}
            </button>
          ))}
        </div>
      </form>

      {/* Error state */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
          <strong>Search Error:</strong> {errorMsg}
        </div>
      )}

      {/* Main Results Display */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full min-w-0">
        {/* Research History Sidebar */}
        <div className="lg:col-span-4 min-w-0 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Research History ({researchEntries.length})
            </span>
          </div>

          <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
            {researchEntries.map(entry => {
              const isSelected = activeEntry?.id === entry.id;

              return (
                <div
                  key={entry.id}
                  onClick={() => setActiveEntry(entry)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all duration-150 ${
                    isSelected
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 block uppercase truncate">
                    {entry.subject}
                  </span>
                  <h4 className="font-semibold text-xs text-slate-900 dark:text-white mt-0.5 line-clamp-2">
                    {entry.query}
                  </h4>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                    <span>{new Date(entry.timestamp).toLocaleDateString()}</span>
                    <span>• {entry.sources.length} sources</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Research Report */}
        <div className="lg:col-span-8 min-w-0 w-full">
          {activeEntry ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xs space-y-6 min-w-0">
              {/* Report Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="min-w-0">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    {activeEntry.subject} • Grounded Google AI Report
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5 break-words">
                    {activeEntry.query}
                  </h2>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleCopyAnswer}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition flex items-center gap-1.5"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      onSendToNotes(activeEntry.query, activeEntry.subject, activeEntry.answer);
                      playAudioFeedback('complete', isMuted);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white text-xs font-semibold transition flex items-center gap-1.5"
                    title="Export to Lecture Notes"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    Save to Lecture Notes
                  </button>
                </div>
              </div>

              {/* Grounded Web Sources Strip (Google Search Grounding) */}
              {activeEntry.sources && activeEntry.sources.length > 0 && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-indigo-500" />
                    Verified Academic &amp; Web Sources:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {activeEntry.sources.map((src, i) => (
                      <a
                        key={i}
                        href={src.uri}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-indigo-600 dark:text-indigo-400 hover:underline max-w-[260px] truncate"
                      >
                        <ExternalLink className="w-3 h-3 shrink-0" />
                        <span className="truncate">{src.title}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Markdown Content */}
              <div className="prose prose-sm dark:prose-invert max-w-none text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans overflow-x-auto break-words">
                <ReactMarkdown>{activeEntry.answer}</ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
              <Search className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-60" />
              <h3 className="font-semibold text-slate-700 dark:text-slate-300 text-sm">
                Enter an academic search query or select one from history
              </h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
