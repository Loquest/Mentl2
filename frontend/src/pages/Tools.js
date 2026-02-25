import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import api from '../utils/api';
import { 
  Wrench, ListTodo, Timer, Zap, Plus, Check, ChevronRight, 
  Play, Pause, RotateCcw, Coffee, Star, Trash2, RefreshCw,
  Clock, Target, TrendingUp, Sparkles, X, ChevronLeft, 
  FastForward, PartyPopper, Rocket, Volume2, VolumeX, 
  Battery, BatteryLow, BatteryMedium, BatteryFull, Flame,
  Award, Trophy, Zap as Lightning, Calendar, Sun, Moon, Sunset
} from 'lucide-react';

// Sound notification utility
const playNotificationSound = (type = 'complete') => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    if (type === 'complete') {
      // Pleasant completion chime (two ascending tones)
      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
      oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.15); // E5
      oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.3); // G5
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } else if (type === 'break') {
      // Soft bell for break time
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4
      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime + 0.2); // C5
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.4);
    } else if (type === 'celebration') {
      // Victory fanfare
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.frequency.setValueAtTime(freq, audioContext.currentTime + i * 0.12);
        gain.gain.setValueAtTime(0.25, audioContext.currentTime + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.12 + 0.3);
        osc.start(audioContext.currentTime + i * 0.12);
        osc.stop(audioContext.currentTime + i * 0.12 + 0.3);
      });
    }
  } catch (e) {
    console.log('Audio not supported:', e);
  }
};

// Vibration utility
const vibrate = (pattern = [200]) => {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
};

// ==================== Focus Session Component (Integrated Task + Timer) ====================
const FocusSession = ({ task, onComplete, onExit }) => {
  const { isDark } = useTheme();
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [completedChunks, setCompletedChunks] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const breakDuration = 5 * 60; // 5 minute breaks

  const currentChunk = task.chunks[currentChunkIndex];
  const totalChunks = task.chunks.length;
  const progress = ((currentChunkIndex + (isBreak ? 0.5 : 0)) / totalChunks) * 100;

  // Initialize timer with first chunk's duration
  useEffect(() => {
    if (currentChunk && !isBreak) {
      setTimeLeft(currentChunk.estimated_minutes * 60);
    }
  }, [currentChunk, isBreak]);

  // Timer countdown
  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;
    
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handlePhaseComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const handlePhaseComplete = async () => {
    setIsRunning(false);
    
    if (isBreak) {
      // Break finished, move to next chunk
      if (soundEnabled) {
        playNotificationSound('complete');
        vibrate([100, 50, 100]);
      }
      if (currentChunkIndex < totalChunks - 1) {
        setCurrentChunkIndex(prev => prev + 1);
        setIsBreak(false);
      }
    } else {
      // Work phase finished
      setCompletedChunks(prev => [...prev, currentChunk.id]);
      
      // Play sound and vibrate
      if (soundEnabled) {
        playNotificationSound('break');
        vibrate([200, 100, 200]);
      }
      
      // Mark chunk as complete in backend
      try {
        await api.put(`/tools/tasks/${task.id}/chunks/${currentChunk.id}`, {
          is_completed: true
        });
      } catch (err) {
        console.error('Error completing chunk:', err);
      }

      // Check if all chunks done
      if (currentChunkIndex >= totalChunks - 1) {
        if (soundEnabled) {
          playNotificationSound('celebration');
          vibrate([100, 50, 100, 50, 200]);
        }
        setSessionComplete(true);
      } else {
        // Start break
        setIsBreak(true);
        setTimeLeft(breakDuration);
      }
    }
  };

  const skipToNext = () => {
    if (isBreak) {
      setIsBreak(false);
      if (currentChunkIndex < totalChunks - 1) {
        setCurrentChunkIndex(prev => prev + 1);
      }
    } else {
      handlePhaseComplete();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalDuration = isBreak ? breakDuration : (currentChunk?.estimated_minutes * 60 || 0);
  const timerProgress = totalDuration > 0 ? ((totalDuration - timeLeft) / totalDuration) * 100 : 0;

  // Session Complete Screen
  if (sessionComplete) {
    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="text-center max-w-md">
          <div className="mb-6">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center animate-bounce">
              <PartyPopper className="w-12 h-12 text-white" />
            </div>
            <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Amazing Work! 🎉
            </h1>
            <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              You completed all {totalChunks} chunks of
            </p>
            <p className={`text-xl font-semibold mt-1 ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
              "{task.title}"
            </p>
          </div>
          
          <div className={`p-4 rounded-xl mb-6 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {task.estimated_total_minutes || totalChunks * 10}
                </p>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Minutes focused</p>
              </div>
              <div>
                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {totalChunks}
                </p>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Chunks completed</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => { onComplete(); onExit(); }}
            className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold text-lg hover:from-purple-600 hover:to-pink-600 transition"
            data-testid="focus-session-done-btn"
          >
            Done! Back to Tasks
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 z-50 flex flex-col ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-purple-50 to-pink-50'}`} data-testid="focus-session">
      {/* Header */}
      <div className={`p-4 flex items-center justify-between border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <button
          onClick={onExit}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDark ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-white'}`}
          data-testid="focus-session-exit-btn"
        >
          <ChevronLeft className="w-5 h-5" />
          Exit Session
        </button>
        <div className="text-center">
          <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {task.title}
          </p>
          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            Chunk {currentChunkIndex + 1} of {totalChunks}
          </p>
        </div>
        {/* Sound Toggle */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDark ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-white'}`}
          title={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
          data-testid="focus-session-sound-toggle"
        >
          {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>
      </div>

      {/* Progress Bar */}
      <div className={`h-2 ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
        <div 
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {/* Phase Indicator */}
        <div className={`mb-4 px-4 py-2 rounded-full ${
          isBreak 
            ? isDark ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-700'
            : isDark ? 'bg-purple-900/50 text-purple-400' : 'bg-purple-100 text-purple-700'
        }`}>
          {isBreak ? '☕ Break Time' : '🎯 Focus Time'}
        </div>

        {/* Current Task Display */}
        {!isBreak && currentChunk && (
          <div className={`w-full max-w-md mb-8 p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                isDark ? 'bg-purple-900 text-purple-400' : 'bg-purple-100 text-purple-600'
              }`}>
                {currentChunkIndex + 1}
              </div>
              <div className="flex-1">
                <h2 className={`text-xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {currentChunk.title}
                </h2>
                {currentChunk.description && (
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {currentChunk.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {isBreak && (
          <div className={`w-full max-w-md mb-8 p-6 rounded-2xl text-center ${isDark ? 'bg-green-900/30' : 'bg-green-50'}`}>
            <Coffee className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
            <h2 className={`text-xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Take a Break!
            </h2>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Stretch, hydrate, rest your eyes
            </p>
            {currentChunkIndex < totalChunks - 1 && (
              <p className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                Next up: {task.chunks[currentChunkIndex + 1]?.title}
              </p>
            )}
          </div>
        )}

        {/* Timer Display */}
        <div className="relative w-56 h-56 mb-8">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="112"
              cy="112"
              r="100"
              stroke={isDark ? '#374151' : '#e5e7eb'}
              strokeWidth="12"
              fill="none"
            />
            <circle
              cx="112"
              cy="112"
              r="100"
              stroke={isBreak ? '#10b981' : '#8b5cf6'}
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={628}
              strokeDashoffset={628 - (628 * timerProgress) / 100}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-5xl font-bold tabular-nums ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {formatTime(timeLeft)}
            </span>
            <span className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              {isBreak ? 'until next chunk' : `${currentChunk?.estimated_minutes || 0} min chunk`}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={skipToNext}
            className={`p-3 rounded-full ${isDark ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-100'} shadow-lg`}
            title={isBreak ? "Skip break" : "Complete early"}
            data-testid="focus-session-skip-btn"
          >
            <FastForward className="w-6 h-6" />
          </button>
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`p-5 rounded-full shadow-xl ${
              isBreak
                ? 'bg-gradient-to-br from-green-400 to-emerald-500'
                : 'bg-gradient-to-br from-purple-500 to-pink-500'
            } text-white hover:scale-105 transition-transform`}
            data-testid="focus-session-toggle-btn"
          >
            {isRunning ? <Pause className="w-10 h-10" /> : <Play className="w-10 h-10 ml-1" />}
          </button>
          <button
            onClick={() => setTimeLeft(isBreak ? breakDuration : (currentChunk?.estimated_minutes * 60 || 0))}
            className={`p-3 rounded-full ${isDark ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-100'} shadow-lg`}
            title="Reset timer"
            data-testid="focus-session-reset-btn"
          >
            <RotateCcw className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Chunk Progress at Bottom */}
      <div className={`p-4 border-t ${isDark ? 'border-gray-800 bg-gray-800/50' : 'border-gray-200 bg-white/80'}`}>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {task.chunks.map((chunk, idx) => {
            const isCompleted = completedChunks.includes(chunk.id) || chunk.is_completed;
            const isCurrent = idx === currentChunkIndex && !isBreak;
            
            return (
              <div
                key={chunk.id}
                className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isCompleted
                    ? isDark ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-700'
                    : isCurrent
                    ? isDark ? 'bg-purple-900 text-purple-300 ring-2 ring-purple-500' : 'bg-purple-100 text-purple-700 ring-2 ring-purple-500'
                    : isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {isCompleted ? '✓' : idx + 1}. {chunk.title.slice(0, 15)}{chunk.title.length > 15 ? '...' : ''}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ==================== Task Chunking Component ====================
const TaskChunking = ({ onStartFocusSession }) => {
  const { isDark } = useTheme();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '' });
  const [expandedTask, setExpandedTask] = useState(null);

  const fetchTasks = useCallback(async () => {
    try {
      const response = await api.get('/tools/tasks');
      setTasks(response.data.tasks || []);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const createTask = async () => {
    if (!newTask.title.trim()) return;
    setCreating(true);
    try {
      const response = await api.post('/tools/tasks', {
        title: newTask.title,
        description: newTask.description,
        auto_chunk: true
      });
      setTasks([response.data.task, ...tasks]);
      setNewTask({ title: '', description: '' });
      setShowNewTask(false);
      setExpandedTask(response.data.task.id);
    } catch (err) {
      console.error('Error creating task:', err);
    } finally {
      setCreating(false);
    }
  };

  const toggleChunk = async (taskId, chunkId, isCompleted) => {
    try {
      const response = await api.put(`/tools/tasks/${taskId}/chunks/${chunkId}`, {
        is_completed: !isCompleted
      });
      setTasks(tasks.map(t => t.id === taskId ? response.data.task : t));
    } catch (err) {
      console.error('Error updating chunk:', err);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await api.delete(`/tools/tasks/${taskId}`);
      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  const getProgress = (task) => {
    if (!task.chunks?.length) return 0;
    const completed = task.chunks.filter(c => c.is_completed).length;
    return Math.round((completed / task.chunks.length) * 100);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Task Chunking</h2>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Break big tasks into small, manageable steps</p>
        </div>
        <button
          onClick={() => setShowNewTask(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition"
          data-testid="new-task-btn"
        >
          <Plus className="w-4 h-4" />
          New Task
        </button>
      </div>

      {/* New Task Form */}
      {showNewTask && (
        <div className={`p-4 rounded-xl border-2 ${isDark ? 'bg-gray-800 border-purple-700' : 'bg-purple-50 border-purple-200'}`}>
          <div className="space-y-3">
            <input
              type="text"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              placeholder="What do you need to do?"
              className={`w-full px-4 py-3 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300'}`}
              data-testid="task-title-input"
              autoFocus
            />
            <textarea
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              placeholder="Any details? (optional)"
              rows={2}
              className={`w-full px-4 py-3 rounded-lg border resize-none ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300'}`}
              data-testid="task-description-input"
            />
            <div className="flex gap-2">
              <button
                onClick={createTask}
                disabled={creating || !newTask.title.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition disabled:opacity-50"
                data-testid="create-task-btn"
              >
                {creating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    AI is breaking it down...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Break into Steps
                  </>
                )}
              </button>
              <button
                onClick={() => setShowNewTask(false)}
                className={`px-4 py-2 rounded-lg border ${isDark ? 'border-gray-600 text-gray-400 hover:bg-gray-700' : 'border-gray-300 text-gray-600 hover:bg-gray-100'}`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tasks List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
        </div>
      ) : tasks.length === 0 ? (
        <div className={`text-center py-12 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <ListTodo className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>No tasks yet. Add one to get started!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const progress = getProgress(task);
            const isExpanded = expandedTask === task.id;
            
            return (
              <div
                key={task.id}
                className={`rounded-xl border transition ${
                  task.status === 'completed'
                    ? isDark ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200'
                    : isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}
                data-testid={`task-${task.id}`}
              >
                {/* Task Header */}
                <div
                  className="p-4 cursor-pointer flex items-center gap-3"
                  onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    task.status === 'completed'
                      ? 'bg-green-500 text-white'
                      : isDark ? 'bg-purple-900/50 text-purple-400' : 'bg-purple-100 text-purple-600'
                  }`}>
                    {task.status === 'completed' ? <Check className="w-5 h-5" /> : <ListTodo className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold truncate ${
                      task.status === 'completed'
                        ? isDark ? 'text-green-400 line-through' : 'text-green-700 line-through'
                        : isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      {task.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className={`flex-1 h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {progress}%
                      </span>
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''} ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                </div>

                {/* Expanded Chunks */}
                {isExpanded && task.chunks?.length > 0 && (
                  <div className={`px-4 pb-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                    {/* Start Focus Session Button */}
                    {task.status !== 'completed' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onStartFocusSession(task); }}
                        className="w-full mt-3 py-3 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 transition shadow-lg"
                        data-testid={`start-focus-session-${task.id}`}
                      >
                        <Rocket className="w-5 h-5" />
                        Start Focus Session
                        <span className="text-sm font-normal opacity-80">
                          (~{task.estimated_total_minutes || task.chunks.reduce((sum, c) => sum + c.estimated_minutes, 0)} min)
                        </span>
                      </button>
                    )}
                    
                    <div className="pt-3 space-y-2">
                      {task.chunks.map((chunk, idx) => (
                        <div
                          key={chunk.id}
                          onClick={() => toggleChunk(task.id, chunk.id, chunk.is_completed)}
                          className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition ${
                            chunk.is_completed
                              ? isDark ? 'bg-green-900/20' : 'bg-green-50'
                              : isDark ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                          data-testid={`chunk-${chunk.id}`}
                        >
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            chunk.is_completed
                              ? 'bg-green-500 border-green-500 text-white'
                              : isDark ? 'border-gray-500' : 'border-gray-300'
                          }`}>
                            {chunk.is_completed && <Check className="w-4 h-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium ${
                              chunk.is_completed
                                ? isDark ? 'text-green-400 line-through' : 'text-green-700 line-through'
                                : isDark ? 'text-white' : 'text-gray-900'
                            }`}>
                              {idx + 1}. {chunk.title}
                            </p>
                            {chunk.description && (
                              <p className={`text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {chunk.description}
                              </p>
                            )}
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                            ~{chunk.estimated_minutes}m
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end mt-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                        className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg ${isDark ? 'text-red-400 hover:bg-red-900/30' : 'text-red-600 hover:bg-red-50'}`}
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ==================== Pomodoro Timer Component ====================
const PomodoroTimer = () => {
  const { isDark } = useTheme();
  const [settings, setSettings] = useState({ default_focus_duration: 25, default_short_break: 5 });
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [stats, setStats] = useState(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [timerComplete, setTimerComplete] = useState(false);

  // Handle timer completion in a separate effect
  useEffect(() => {
    if (!timerComplete) return;
    
    const completeSession = async () => {
      setIsRunning(false);
      
      if (!isBreak && sessionId) {
        try {
          await api.put(`/tools/pomodoro/sessions/${sessionId}`, {
            status: 'completed',
            actual_duration_minutes: settings.default_focus_duration
          });
          const response = await api.get('/tools/pomodoro/stats?days=7');
          setStats(response.data);
        } catch (err) {
          console.error('Error completing session:', err);
        }
      }
      
      if (isBreak) {
        setTimeLeft(settings.default_focus_duration * 60);
        setIsBreak(false);
      } else {
        setTimeLeft(settings.default_short_break * 60);
        setIsBreak(true);
      }
      
      setTimerComplete(false);
    };
    
    completeSession();
  }, [timerComplete, isBreak, sessionId, settings.default_focus_duration, settings.default_short_break]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get('/tools/pomodoro/settings');
        setSettings(response.data.settings);
        setTimeLeft(response.data.settings.default_focus_duration * 60);
      } catch (err) {
        console.error('Error fetching settings:', err);
      }
    };
    
    const fetchStats = async () => {
      try {
        const response = await api.get('/tools/pomodoro/stats?days=7');
        setStats(response.data);
      } catch (err) {
        console.error('Error fetching stats:', err);
      }
    };
    
    fetchSettings();
    fetchStats();
  }, []);

  // Timer interval
  useEffect(() => {
    if (!isRunning) return;
    
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setTimerComplete(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isRunning]);

  const startSession = async () => {
    try {
      const response = await api.post('/tools/pomodoro/sessions', {
        task_title: taskTitle || 'Focus Session',
        planned_duration_minutes: settings.default_focus_duration,
        break_duration_minutes: settings.default_short_break
      });
      setSessionId(response.data.session.id);
      setIsRunning(true);
    } catch (err) {
      console.error('Error starting session:', err);
    }
  };

  const toggleTimer = () => {
    if (!isRunning && !sessionId && !isBreak) {
      startSession();
    } else {
      setIsRunning(!isRunning);
    }
  };

  const resetTimer = async () => {
    if (sessionId && !isBreak) {
      try {
        await api.put(`/tools/pomodoro/sessions/${sessionId}`, { status: 'abandoned' });
      } catch (err) {
        console.error('Error abandoning session:', err);
      }
    }
    setIsRunning(false);
    setSessionId(null);
    setIsBreak(false);
    setTimeLeft(settings.default_focus_duration * 60);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = isBreak
    ? ((settings.default_short_break * 60 - timeLeft) / (settings.default_short_break * 60)) * 100
    : ((settings.default_focus_duration * 60 - timeLeft) / (settings.default_focus_duration * 60)) * 100;

  return (
    <div className="space-y-6">
      {/* Timer Display */}
      <div className={`rounded-xl p-8 text-center ${
        isBreak
          ? isDark ? 'bg-green-900/30' : 'bg-green-50'
          : isDark ? 'bg-gray-800' : 'bg-white'
      }`}>
        <p className={`text-sm font-medium mb-2 ${isBreak ? (isDark ? 'text-green-400' : 'text-green-600') : (isDark ? 'text-purple-400' : 'text-purple-600')}`}>
          {isBreak ? '☕ Break Time' : '🎯 Focus Time'}
        </p>
        
        {/* Circular Progress */}
        <div className="relative w-48 h-48 mx-auto mb-6">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="88"
              stroke={isDark ? '#374151' : '#e5e7eb'}
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="96"
              cy="96"
              r="88"
              stroke={isBreak ? '#10b981' : '#8b5cf6'}
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={553}
              strokeDashoffset={553 - (553 * progress) / 100}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-5xl font-bold tabular-nums ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        {/* Task Title Input */}
        {!isRunning && !isBreak && (
          <input
            type="text"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            placeholder="What are you working on?"
            className={`w-full max-w-xs mx-auto mb-4 px-4 py-2 rounded-lg border text-center ${
              isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-200'
            }`}
            data-testid="pomodoro-task-input"
          />
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={resetTimer}
            className={`p-3 rounded-full ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            data-testid="pomodoro-reset-btn"
          >
            <RotateCcw className="w-6 h-6" />
          </button>
          <button
            onClick={toggleTimer}
            className={`p-4 rounded-full ${
              isBreak
                ? 'bg-green-500 hover:bg-green-600'
                : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
            } text-white shadow-lg`}
            data-testid="pomodoro-toggle-btn"
          >
            {isRunning ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
          </button>
          <button
            onClick={() => {
              if (isBreak) {
                setTimeLeft(settings.default_focus_duration * 60);
                setIsBreak(false);
              } else {
                setTimeLeft(settings.default_short_break * 60);
                setIsBreak(true);
              }
              setIsRunning(false);
            }}
            className={`p-3 rounded-full ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            data-testid="pomodoro-skip-btn"
          >
            <Coffee className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className={`grid grid-cols-2 gap-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center gap-2 mb-1">
              <Target className={`w-4 h-4 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Sessions (7d)</span>
            </div>
            <p className="text-2xl font-bold">{stats.total_sessions}</p>
          </div>
          <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center gap-2 mb-1">
              <Clock className={`w-4 h-4 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Focus Time</span>
            </div>
            <p className="text-2xl font-bold">{Math.round(stats.total_focus_minutes / 60)}h {stats.total_focus_minutes % 60}m</p>
          </div>
          <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className={`w-4 h-4 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Avg Focus</span>
            </div>
            <p className="text-2xl font-bold">{stats.avg_focus_rating}/10</p>
          </div>
          <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className={`w-4 h-4 ${isDark ? 'text-pink-400' : 'text-pink-600'}`} />
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Best Duration</span>
            </div>
            <p className="text-2xl font-bold">{stats.suggested_duration_minutes}m</p>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== Dopamine Menu Component ====================
const DopamineMenu = () => {
  const { isDark } = useTheme();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({ title: '', description: '', category: 'short', energy_level: 'any' });
  const [randomPick, setRandomPick] = useState(null);

  const categoryColors = {
    micro: isDark ? 'bg-blue-900/40 text-blue-400 border-blue-700' : 'bg-blue-100 text-blue-700 border-blue-300',
    short: isDark ? 'bg-green-900/40 text-green-400 border-green-700' : 'bg-green-100 text-green-700 border-green-300',
    medium: isDark ? 'bg-yellow-900/40 text-yellow-400 border-yellow-700' : 'bg-yellow-100 text-yellow-700 border-yellow-300',
    reward: isDark ? 'bg-purple-900/40 text-purple-400 border-purple-700' : 'bg-purple-100 text-purple-700 border-purple-300',
  };

  const categoryLabels = {
    micro: '1-2 min',
    short: '5-10 min',
    medium: '15-30 min',
    reward: '30+ min'
  };

  const fetchItems = useCallback(async () => {
    try {
      const response = await api.get('/tools/dopamine');
      setItems(response.data.items || []);
    } catch (err) {
      console.error('Error fetching dopamine items:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const addItem = async () => {
    if (!newItem.title.trim()) return;
    try {
      const response = await api.post('/tools/dopamine', newItem);
      setItems([...items, response.data.item]);
      setNewItem({ title: '', description: '', category: 'short', energy_level: 'any' });
      setShowAdd(false);
    } catch (err) {
      console.error('Error adding item:', err);
    }
  };

  const markItemUsed = async (itemId) => {
    try {
      const response = await api.post(`/tools/dopamine/${itemId}/use`);
      setItems(items.map(i => i.id === itemId ? response.data.item : i));
    } catch (err) {
      console.error('Error using item:', err);
    }
  };

  const toggleFavorite = async (item) => {
    try {
      const response = await api.put(`/tools/dopamine/${item.id}`, {
        is_favorite: !item.is_favorite
      });
      setItems(items.map(i => i.id === item.id ? response.data.item : i));
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  const getRandomItem = async () => {
    try {
      const response = await api.get(`/tools/dopamine/random${filter !== 'all' ? `?category=${filter}` : ''}`);
      if (response.data.item) {
        setRandomPick(response.data.item);
      }
    } catch (err) {
      console.error('Error getting random item:', err);
    }
  };

  const filteredItems = filter === 'all' 
    ? items 
    : filter === 'favorites'
    ? items.filter(i => i.is_favorite)
    : items.filter(i => i.category === filter);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Dopamine Menu</h2>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Quick rewards to boost your motivation</p>
        </div>
        <button
          onClick={getRandomItem}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg font-medium hover:from-yellow-600 hover:to-orange-600 transition"
          data-testid="random-dopamine-btn"
        >
          <Zap className="w-4 h-4" />
          Surprise Me!
        </button>
      </div>

      {/* Random Pick Modal */}
      {randomPick && (
        <div className={`p-4 rounded-xl border-2 animate-pulse ${isDark ? 'bg-yellow-900/30 border-yellow-600' : 'bg-yellow-50 border-yellow-300'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className={`w-8 h-8 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />
              <div>
                <p className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>{randomPick.title}</p>
                {randomPick.description && (
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{randomPick.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { markItemUsed(randomPick.id); setRandomPick(null); }}
                className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600"
              >
                Do it!
              </button>
              <button
                onClick={() => setRandomPick(null)}
                className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['all', 'favorites', 'micro', 'short', 'medium', 'reward'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
              filter === cat
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                : isDark ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            data-testid={`filter-${cat}`}
          >
            {cat === 'all' ? 'All' : cat === 'favorites' ? '⭐ Favorites' : categoryLabels[cat] || cat}
          </button>
        ))}
      </div>

      {/* Add Custom Item */}
      {showAdd ? (
        <div className={`p-4 rounded-xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
          <input
            type="text"
            value={newItem.title}
            onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
            placeholder="Activity name"
            className={`w-full px-4 py-2 rounded-lg border mb-2 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
          />
          <div className="flex gap-2 mb-3">
            <select
              value={newItem.category}
              onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
              className={`flex-1 px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
            >
              <option value="micro">Micro (1-2 min)</option>
              <option value="short">Short (5-10 min)</option>
              <option value="medium">Medium (15-30 min)</option>
              <option value="reward">Reward (30+ min)</option>
            </select>
            <select
              value={newItem.energy_level}
              onChange={(e) => setNewItem({ ...newItem, energy_level: e.target.value })}
              className={`flex-1 px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
            >
              <option value="any">Any Energy</option>
              <option value="low">Low Energy</option>
              <option value="medium">Medium Energy</option>
              <option value="high">High Energy</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={addItem} className="flex-1 py-2 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600">
              Add
            </button>
            <button onClick={() => setShowAdd(false)} className={`px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className={`w-full py-3 border-2 border-dashed rounded-xl flex items-center justify-center gap-2 ${
            isDark ? 'border-gray-700 text-gray-500 hover:border-gray-600 hover:text-gray-400' : 'border-gray-300 text-gray-500 hover:border-gray-400'
          }`}
        >
          <Plus className="w-5 h-5" />
          Add Custom Activity
        </button>
      )}

      {/* Items Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
              data-testid={`dopamine-item-${item.id}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.title}</h3>
                    {item.is_custom && (
                      <span className={`text-xs px-1.5 py-0.5 rounded ${isDark ? 'bg-purple-900/50 text-purple-400' : 'bg-purple-100 text-purple-600'}`}>
                        Custom
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{item.description}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full border ${categoryColors[item.category]}`}>
                      {categoryLabels[item.category]}
                    </span>
                    {item.times_used > 0 && (
                      <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        Used {item.times_used}x
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <button
                    onClick={() => toggleFavorite(item)}
                    className={`p-1.5 rounded-lg transition ${
                      item.is_favorite
                        ? 'text-yellow-500'
                        : isDark ? 'text-gray-600 hover:text-yellow-500' : 'text-gray-400 hover:text-yellow-500'
                    }`}
                  >
                    <Star className={`w-5 h-5 ${item.is_favorite ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    onClick={() => markItemUsed(item.id)}
                    className={`px-3 py-1.5 text-sm rounded-lg ${isDark ? 'bg-green-900/50 text-green-400 hover:bg-green-900' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                  >
                    Do it
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ==================== Main Tools Page ====================
const Tools = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('tasks');
  const [focusSessionTask, setFocusSessionTask] = useState(null);

  // Check if user has ADHD condition
  const hasADHD = user?.conditions?.includes('adhd');

  const tabs = [
    { id: 'tasks', label: 'Task Chunker', icon: ListTodo },
    { id: 'pomodoro', label: 'Focus Timer', icon: Timer },
    { id: 'dopamine', label: 'Dopamine Menu', icon: Zap },
  ];

  const handleStartFocusSession = (task) => {
    // Filter to only incomplete chunks
    const incompleteChunks = task.chunks.filter(c => !c.is_completed);
    if (incompleteChunks.length > 0) {
      setFocusSessionTask({
        ...task,
        chunks: incompleteChunks
      });
    }
  };

  // Show Focus Session fullscreen if active
  if (focusSessionTask) {
    return (
      <FocusSession
        task={focusSessionTask}
        onComplete={() => setFocusSessionTask(null)}
        onExit={() => setFocusSessionTask(null)}
      />
    );
  }

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto" data-testid="tools-page">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-3 rounded-xl">
              <Wrench className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>ADHD Tools</h1>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Productivity tools designed for the ADHD brain
              </p>
            </div>
          </div>
          {!hasADHD && (
            <div className={`mt-3 p-3 rounded-lg ${isDark ? 'bg-yellow-900/30 border border-yellow-700' : 'bg-yellow-50 border border-yellow-200'}`}>
              <p className={`text-sm ${isDark ? 'text-yellow-400' : 'text-yellow-800'}`}>
                💡 Tip: Add ADHD to your conditions in Settings to get personalized suggestions.
              </p>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className={`flex gap-2 mb-6 p-1 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                    : isDark ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                }`}
                data-testid={`tab-${tab.id}`}
              >
                <Icon className="w-5 h-5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className={`rounded-xl p-6 ${isDark ? 'bg-gray-800/50' : 'bg-white'} shadow-lg`}>
          {activeTab === 'tasks' && <TaskChunking onStartFocusSession={handleStartFocusSession} />}
          {activeTab === 'pomodoro' && <PomodoroTimer />}
          {activeTab === 'dopamine' && <DopamineMenu />}
        </div>
      </div>
    </Layout>
  );
};

export default Tools;
