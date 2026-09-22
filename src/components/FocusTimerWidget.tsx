import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Clock, CheckCircle2, Volume2, ChevronDown, ChevronUp, Sparkles, Coffee } from 'lucide-react';
import { Task } from '../types';
import { playAudioFeedback } from '../utils/audio';

interface FocusTimerWidgetProps {
  activeTask?: Task | null;
  onClearActiveTask?: () => void;
  onSessionComplete?: (minutesStudied: number, task?: Task) => void;
  isMuted: boolean;
}

export const FocusTimerWidget: React.FC<FocusTimerWidgetProps> = ({
  activeTask,
  onClearActiveTask,
  onSessionComplete,
  isMuted,
}) => {
  const [mode, setMode] = useState<'pomodoro' | 'short_break' | 'long_break'>('pomodoro');
  const [totalSeconds, setTotalSeconds] = useState<number>(25 * 60);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  // If a new active task is assigned with estimated minutes, adapt the timer
  useEffect(() => {
    if (activeTask) {
      const minutes = Math.min(Math.max(activeTask.estimatedMinutes || 25, 10), 90);
      setTotalSeconds(minutes * 60);
      setSecondsRemaining(minutes * 60);
      setMode('pomodoro');
      setIsRunning(true);
      setIsMinimized(false);
      playAudioFeedback('start', isMuted);
    }
  }, [activeTask]);

  // Main countdown loop
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsRunning(false);
          playAudioFeedback('timer_done', isMuted);

          if (mode === 'pomodoro' && onSessionComplete) {
            onSessionComplete(Math.round(totalSeconds / 60), activeTask || undefined);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, mode, totalSeconds, activeTask, onSessionComplete, isMuted]);

  const setTimerPreset = (newMode: 'pomodoro' | 'short_break' | 'long_break', minutes: number) => {
    setMode(newMode);
    setTotalSeconds(minutes * 60);
    setSecondsRemaining(minutes * 60);
    setIsRunning(false);
    playAudioFeedback('click', isMuted);
  };

  const toggleRun = () => {
    const nextState = !isRunning;
    setIsRunning(nextState);
    playAudioFeedback(nextState ? 'start' : 'click', isMuted);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setSecondsRemaining(totalSeconds);
    playAudioFeedback('click', isMuted);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const progressPercent = totalSeconds > 0 ? ((totalSeconds - secondsRemaining) / totalSeconds) * 100 : 0;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-md overflow-hidden transition-all duration-200">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span className="font-semibold text-xs tracking-wide uppercase text-slate-700 dark:text-slate-300">
            Study Focus Timer
          </span>
          {isRunning && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          )}
        </div>

        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition"
          title={isMinimized ? 'Expand timer' : 'Minimize timer'}
        >
          {isMinimized ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      {isMinimized ? (
        <div className="px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-lg text-slate-800 dark:text-slate-100">
              {formatTime(secondsRemaining)}
            </span>
            {activeTask && (
              <span className="text-xs text-slate-500 truncate max-w-[150px]">
                {activeTask.title}
              </span>
            )}
          </div>
          <button
            onClick={toggleRun}
            className="p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
          >
            {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
        </div>
      ) : (
        <div className="p-4 space-y-4">
          {/* Preset Buttons */}
          <div className="grid grid-cols-3 gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-lg text-xs">
            <button
              onClick={() => setTimerPreset('pomodoro', 25)}
              className={`py-1.5 rounded-md font-medium transition ${
                mode === 'pomodoro'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              25m Focus
            </button>
            <button
              onClick={() => setTimerPreset('short_break', 5)}
              className={`py-1.5 rounded-md font-medium transition ${
                mode === 'short_break'
                  ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              5m Break
            </button>
            <button
              onClick={() => setTimerPreset('long_break', 15)}
              className={`py-1.5 rounded-md font-medium transition ${
                mode === 'long_break'
                  ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              15m Rest
            </button>
          </div>

          {/* Active task indicator if bound */}
          {activeTask && (
            <div className="bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 rounded-lg p-2.5 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider block">
                  Focusing on Task:
                </span>
                <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                  {activeTask.title}
                </p>
                <span className="text-[11px] text-slate-500">[{activeTask.subject}]</span>
              </div>
              {onClearActiveTask && (
                <button
                  onClick={onClearActiveTask}
                  className="text-[10px] text-slate-400 hover:text-rose-500 transition"
                  title="Unbind task"
                >
                  Unbind
                </button>
              )}
            </div>
          )}

          {/* Time Display */}
          <div className="text-center py-2">
            <div className="font-mono text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              {formatTime(secondsRemaining)}
            </div>
            {/* Progress bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  mode === 'pomodoro' ? 'bg-indigo-600' : mode === 'short_break' ? 'bg-amber-500' : 'bg-teal-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3">
            <button
              id="timer-reset-btn"
              onClick={resetTimer}
              className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              title="Reset timer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              id="timer-play-pause-btn"
              onClick={toggleRun}
              className={`px-5 py-2 rounded-lg font-medium text-white flex items-center gap-2 shadow-xs transition ${
                isRunning
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4" /> Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" /> Start Focus
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
