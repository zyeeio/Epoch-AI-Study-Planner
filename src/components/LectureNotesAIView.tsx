import React, { useState } from 'react';
import {
  BookOpen,
  Sparkles,
  Search,
  Plus,
  Trash2,
  ExternalLink,
  Code2,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  RotateCw,
  FileText,
  Bookmark,
  Layers,
  GraduationCap,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import confetti from 'canvas-confetti';
import { LectureNote, Flashcard } from '../types';
import { playAudioFeedback } from '../utils/audio';

interface LectureNotesAIViewProps {
  notes: LectureNote[];
  onUpdateNotes: (notes: LectureNote[]) => void;
  onSendToResearch: (query: string, subject: string) => void;
  isMuted: boolean;
}

export const LectureNotesAIView: React.FC<LectureNotesAIViewProps> = ({
  notes,
  onUpdateNotes,
  onSendToResearch,
  isMuted,
}) => {
  const [selectedNoteId, setSelectedNoteId] = useState<string>(notes[0]?.id || '');
  const [isCreatingNote, setIsCreatingNote] = useState<boolean>(false);
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [activeNoteTab, setActiveNoteTab] = useState<'summary' | 'flashcards' | 'raw' | 'code'>('summary');
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [synthesisError, setSynthesisError] = useState<string | null>(null);

  // New note form
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('Computer Science (Java)');
  const [newRawContent, setNewRawContent] = useState('');

  const activeNote = notes.find(n => n.id === selectedNoteId) || notes[0];

  const handleSynthesizeWithAI = async () => {
    if (!activeNote) return;
    setIsSynthesizing(true);
    setSynthesisError(null);
    playAudioFeedback('start', isMuted);

    try {
      const response = await fetch('/api/ai/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `Synthesize and structure lecture notes for: "${activeNote.title}" in subject: "${activeNote.subject}"`,
          mode: 'notes',
          context: activeNote.rawContent,
        }),
      });

      const data = await response.json();
      if (data.answer) {
        // Parse generated takeaways or synthesize cleanly
        const updatedNotes = notes.map(n => {
          if (n.id === activeNote.id) {
            return {
              ...n,
              summary: data.answer,
              lastUpdated: new Date().toISOString(),
            };
          }
          return n;
        });
        onUpdateNotes(updatedNotes);
        playAudioFeedback('complete', isMuted);

        try {
          confetti({
            particleCount: 35,
            spread: 50,
            origin: { y: 0.7 },
          });
        } catch {}
      } else {
        setSynthesisError('Synthesis completed without content. Please try again.');
      }
    } catch (_error: any) {
      setSynthesisError('Temporarily unable to connect to synthesis service. Please check your network.');
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newNote: LectureNote = {
      id: `note-${Date.now()}`,
      title: newTitle.trim(),
      subject: newSubject.trim() || 'General Study',
      date: new Date().toISOString().split('T')[0],
      rawContent: newRawContent.trim() || 'Lecture notes pending entry...',
      tags: [newSubject],
      lastUpdated: new Date().toISOString(),
    };

    onUpdateNotes([newNote, ...notes]);
    setSelectedNoteId(newNote.id);
    setIsCreatingNote(false);
    setNewTitle('');
    setNewRawContent('');
    playAudioFeedback('start', isMuted);
  };

  const handleDeleteNote = (noteId: string) => {
    const remaining = notes.filter(n => n.id !== noteId);
    onUpdateNotes(remaining);
    if (selectedNoteId === noteId && remaining.length > 0) {
      setSelectedNoteId(remaining[0].id);
    }
    playAudioFeedback('click', isMuted);
  };

  const flashcards = activeNote?.flashcards || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            Lecture Notes AI Navigator
            <span className="text-[11px] font-bold uppercase tracking-wider bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded-full">
              Active Recall &amp; Synthesis
            </span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Paste raw syllabus topics or transcripts to generate structured conceptual breakdowns, flashcards, and code examples.
          </p>
        </div>

        <button
          id="create-new-note-btn"
          onClick={() => setIsCreatingNote(true)}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center gap-2 transition self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Lecture Notes
        </button>
      </div>

      {/* Main Grid: Sidebar + Note Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sidebar: Notes List */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Saved Lectures ({notes.length})
            </span>
            <span className="text-[10px] text-slate-400">Select to navigate</span>
          </div>

          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {notes.map(note => {
              const isSelected = note.id === selectedNoteId;

              return (
                <div
                  key={note.id}
                  onClick={() => {
                    setSelectedNoteId(note.id);
                    setCurrentFlashcardIndex(0);
                    setIsFlipped(false);
                  }}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all duration-150 ${
                    isSelected
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 block uppercase truncate">
                        {note.subject}
                      </span>
                      <h3 className="font-semibold text-xs text-slate-900 dark:text-white mt-0.5 line-clamp-2">
                        {note.title}
                      </h3>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {note.date} {note.flashcards ? `• ${note.flashcards.length} cards` : ''}
                      </span>
                    </div>

                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleDeleteNote(note.id);
                      }}
                      className="text-slate-300 hover:text-rose-500 transition p-1"
                      title="Delete note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Note Inspector & AI Breakdown */}
        <div className="lg:col-span-8 space-y-4">
          {activeNote ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5">
              {/* Note Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    {activeNote.subject}
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                    {activeNote.title}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    id="synthesize-notes-ai-btn"
                    onClick={handleSynthesizeWithAI}
                    disabled={isSynthesizing}
                    className="px-3.5 py-2 rounded-xl bg-linear-to-r from-indigo-600 to-teal-600 hover:from-indigo-700 hover:to-teal-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isSynthesizing ? 'animate-spin' : ''}`} />
                    {isSynthesizing ? 'Synthesizing with Google AI...' : 'Navigate with AI'}
                  </button>

                  <button
                    onClick={() => onSendToResearch(activeNote.title, activeNote.subject)}
                    className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 transition flex items-center gap-1.5"
                    title="Search literature and citations for this topic"
                  >
                    <Search className="w-3.5 h-3.5 text-indigo-500" />
                    Research Citations
                  </button>
                </div>
              </div>

              {synthesisError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between">
                  <span>{synthesisError}</span>
                  <button
                    onClick={() => setSynthesisError(null)}
                    className="ml-2 font-bold hover:underline"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Sub-tabs: Summary vs Flashcards vs Code vs Raw */}
              <div className="flex gap-2 border-b border-slate-100 dark:border-slate-800 pb-2 text-xs font-semibold">
                <button
                  onClick={() => setActiveNoteTab('summary')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    activeNoteTab === 'summary'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  AI Conceptual Synthesis
                </button>

                {flashcards.length > 0 && (
                  <button
                    onClick={() => setActiveNoteTab('flashcards')}
                    className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
                      activeNoteTab === 'flashcards'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    Flashcards ({flashcards.length})
                  </button>
                )}

                {activeNote.codeSnippets && activeNote.codeSnippets.length > 0 && (
                  <button
                    onClick={() => setActiveNoteTab('code')}
                    className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
                      activeNoteTab === 'code'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    <Code2 className="w-3 h-3" />
                    Java/Python Code
                  </button>
                )}

                <button
                  onClick={() => setActiveNoteTab('raw')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    activeNoteTab === 'raw'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  Raw Transcript / Notes
                </button>
              </div>

              {/* Content Panels */}
              {activeNoteTab === 'summary' && (
                <div className="space-y-4">
                  {/* Takeaways pill box */}
                  {activeNote.keyTakeaways && activeNote.keyTakeaways.length > 0 && (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Bookmark className="w-3.5 h-3.5 text-indigo-500" />
                        Key Exam &amp; College Level Takeaways
                      </h4>
                      <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                        {activeNote.keyTakeaways.map((takeaway, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-indigo-500 font-bold">•</span>
                            <span>{takeaway}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Markdown structured synthesis */}
                  <div className="prose prose-sm dark:prose-invert max-w-none text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    <ReactMarkdown>{activeNote.summary || activeNote.rawContent}</ReactMarkdown>
                  </div>
                </div>
              )}

              {activeNoteTab === 'flashcards' && flashcards.length > 0 && (
                <div className="space-y-4 py-4 text-center">
                  <div className="text-xs text-slate-400">
                    Card {currentFlashcardIndex + 1} of {flashcards.length} • Click card to flip
                  </div>

                  <div
                    onClick={() => {
                      playAudioFeedback('click', isMuted);
                      setIsFlipped(!isFlipped);
                    }}
                    className="cursor-pointer min-h-[180px] p-6 rounded-2xl bg-linear-to-br from-indigo-50/70 via-white to-slate-50 dark:from-slate-800 dark:via-slate-850 dark:to-slate-900 border-2 border-indigo-200 dark:border-indigo-900/60 shadow-md flex flex-col items-center justify-center transition-all hover:scale-[1.01]"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-2">
                      {isFlipped ? 'Answer (Recall Check)' : 'Question'}
                    </span>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white max-w-lg leading-relaxed">
                      {isFlipped
                        ? flashcards[currentFlashcardIndex].answer
                        : flashcards[currentFlashcardIndex].question}
                    </p>
                    <span className="text-[11px] text-slate-400 mt-4">
                      {isFlipped ? 'Tap to view question' : 'Tap to reveal answer'}
                    </span>
                  </div>

                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      disabled={currentFlashcardIndex === 0}
                      onClick={() => {
                        setCurrentFlashcardIndex(prev => Math.max(0, prev - 1));
                        setIsFlipped(false);
                      }}
                      className="px-4 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold disabled:opacity-30"
                    >
                      Previous
                    </button>
                    <button
                      disabled={currentFlashcardIndex === flashcards.length - 1}
                      onClick={() => {
                        setCurrentFlashcardIndex(prev => Math.min(flashcards.length - 1, prev + 1));
                        setIsFlipped(false);
                      }}
                      className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-30"
                    >
                      Next Card
                    </button>
                  </div>
                </div>
              )}

              {activeNoteTab === 'code' && activeNote.codeSnippets && (
                <div className="space-y-4">
                  {activeNote.codeSnippets.map((snippet, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold uppercase text-indigo-600 dark:text-indigo-400">
                          {snippet.language} Implementation
                        </span>
                      </div>
                      <pre className="p-4 rounded-xl bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto border border-slate-800">
                        {snippet.code}
                      </pre>
                      <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                        <strong>Analysis:</strong> {snippet.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {activeNoteTab === 'raw' && (
                <div className="space-y-2">
                  <textarea
                    rows={8}
                    value={activeNote.rawContent}
                    onChange={e => {
                      const updated = notes.map(n =>
                        n.id === activeNote.id ? { ...n, rawContent: e.target.value } : n
                      );
                      onUpdateNotes(updated);
                    }}
                    className="w-full p-3 font-mono text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-slate-900 dark:text-white"
                  />
                  <p className="text-[11px] text-slate-400">
                    Changes here are saved automatically. Click "Navigate with AI" to regenerate synthesis.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
              <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-60" />
              <h3 className="font-semibold text-slate-700 dark:text-slate-300 text-sm">
                No lecture notes selected
              </h3>
            </div>
          )}
        </div>
      </div>

      {/* Add New Note Modal */}
      {isCreatingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <form
            onSubmit={handleCreateNote}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Add New Lecture Notes / Syllabus Topic
              </h3>
              <button
                type="button"
                onClick={() => setIsCreatingNote(false)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Cancel
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Topic Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Java Hash Maps & Collision Resolution or Multivariable Limits"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Subject / Course
                </label>
                <input
                  type="text"
                  value={newSubject}
                  onChange={e => setNewSubject(e.target.value)}
                  placeholder="e.g. Computer Science, Calculus, College Admissions"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Raw Notes or Lecture Outline
                </label>
                <textarea
                  rows={6}
                  value={newRawContent}
                  onChange={e => setNewRawContent(e.target.value)}
                  placeholder="Paste teacher slides, book excerpts, or your own bullet points here..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsCreatingNote(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Save &amp; Open
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
