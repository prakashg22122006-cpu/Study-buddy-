import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Play, Pause, RotateCcw, Maximize2, Minimize2, 
  Settings2, Image as ImageIcon, Plus, X, Check,
  Layers, Volume2, Volume1, VolumeX, Bell, BellOff, 
  Zap, ZapOff, Monitor, Smartphone, BarChart2,
  Headphones, Wind, CloudRain, Coffee, Trees, Move,
  Clock, Upload, Music, Trash2, Flame, RefreshCw
} from 'lucide-react';
import { usePersistentState } from '../hooks/usePersistentState';
import { FocusSession } from '../types';

// --- Types ---
interface FlowTask {
  id: string;
  text: string;
  done: boolean;
}

interface FlowSettings {
  snd: boolean;
  vib: boolean;
  not: boolean;
  wake: boolean;
  autoBreak: boolean;
  theme: string;
}

interface AudioState {
  rain: number;
  forest: number;
  cafe: number;
  fire: number;
  whiteNoise: number;
  masterMute: boolean;
}

// --- Presets ---
const PRESETS: Record<string, { name: string, time: number, type?: string }> = {
  pomo: { name: 'Pomodoro', time: 25 },
  sprint: { name: 'Sprint', time: 50 },
  short: { name: 'Short Break', time: 5 },
  long: { name: 'Long Break', time: 15 },
  custom: { name: 'Custom', time: 45 },
  flow: { name: 'Flow Mode', time: 0, type: 'stop' }
};

// --- Audio URLs ---
const AUDIO_SOURCES = {
  rain: "https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg",
  forest: "https://actions.google.com/sounds/v1/ambiences/forest_morning.ogg",
  cafe: "https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg", 
  fire: "https://actions.google.com/sounds/v1/ambiences/fireplace.ogg",
  // White noise is generated synthetically
};

export const Pomodoro: React.FC = () => {
  // --- Core State ---
  const [mode, setMode] = useState('pomo');
  const [customDuration, setCustomDuration] = usePersistentState<number>('flow_custom_dur', 45);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  
  // --- Data Persistence ---
  const [tasks, setTasks] = usePersistentState<FlowTask[]>('flow_tasks', []);
  const [history, setHistory] = usePersistentState<FocusSession[]>('flow_history', []);
  const [settings, setSettings] = usePersistentState<FlowSettings>('flow_sys', {
    snd: true, vib: true, not: false, wake: false, autoBreak: false, theme: '#fbbf24'
  });

  // --- UI State ---
  const [bgImage, setBgImage] = usePersistentState<string>('flow_bg_img', '');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activePanel, setActivePanel] = useState<'none' | 'settings' | 'sounds' | 'stats'>('none');
  const [taskInput, setTaskInput] = useState('');
  const [botState, setBotState] = useState<'idle' | 'work' | 'break'>('idle');
  
  // --- Audio Mixer State ---
  const [audioState, setAudioState] = usePersistentState<AudioState>('flow_audio_mixer', {
    rain: 0, forest: 0, cafe: 0, fire: 0, whiteNoise: 0, masterMute: false
  });

  // --- Custom Music State ---
  const [customFile, setCustomFile] = useState<{name: string, url: string} | null>(null);
  const [customVolume, setCustomVolume] = usePersistentState<number>('flow_custom_vol', 50);

  // --- Refs ---
  const timerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wakeLockRef = useRef<any>(null);
  
  // Audio Refs
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});
  const customAudioRef = useRef<HTMLAudioElement | null>(null);
  const noiseCtxRef = useRef<AudioContext | null>(null);
  const whiteNoiseNodeRef = useRef<GainNode | null>(null);

  // --- Audio Logic ---
  useEffect(() => {
    // Initialize Audio Elements
    const setupAudio = (key: string, url: string) => {
      if (!audioRefs.current[key]) {
        const audio = new Audio(url);
        audio.loop = true;
        audioRefs.current[key] = audio;
      }
    };
    setupAudio('rain', AUDIO_SOURCES.rain);
    setupAudio('forest', AUDIO_SOURCES.forest);
    setupAudio('cafe', AUDIO_SOURCES.cafe);
    setupAudio('fire', AUDIO_SOURCES.fire);
    
    // Cleanup
    return () => {
      Object.values(audioRefs.current).forEach((a: HTMLAudioElement) => {
        a.pause();
        a.src = '';
      });
      if (customAudioRef.current) {
         customAudioRef.current.pause();
         customAudioRef.current.src = '';
      }
      if (noiseCtxRef.current) noiseCtxRef.current.close();
    };
  }, []);

  // Sync Volume
  useEffect(() => {
    // Master Mute Logic
    if (audioState.masterMute) {
      Object.values(audioRefs.current).forEach((a: HTMLAudioElement) => a.pause());
      if (noiseCtxRef.current && noiseCtxRef.current.state === 'running') noiseCtxRef.current.suspend();
      if (customAudioRef.current) customAudioRef.current.pause();
      return;
    }

    // Handle File Audio
    const syncAudio = (key: keyof AudioState) => {
      const audio = audioRefs.current[key as string];
      if (audio) {
        const vol = audioState[key] as number;
        if (vol > 0 && isActive) {
          audio.volume = vol / 100;
          if (audio.paused) audio.play().catch(() => {});
        } else {
          audio.pause();
        }
      }
    };

    syncAudio('rain');
    syncAudio('forest');
    syncAudio('cafe');
    syncAudio('fire');

    // Handle White Noise (Web Audio API)
    if (isActive && audioState.whiteNoise > 0) {
      if (!noiseCtxRef.current) {
        const Ctx = (window.AudioContext || (window as any).webkitAudioContext);
        noiseCtxRef.current = new Ctx();
        const bufferSize = 2 * noiseCtxRef.current.sampleRate;
        const noiseBuffer = noiseCtxRef.current.createBuffer(1, bufferSize, noiseCtxRef.current.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }
        const whiteNoise = noiseCtxRef.current.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;
        whiteNoise.start(0);
        
        const gainNode = noiseCtxRef.current.createGain();
        whiteNoise.connect(gainNode);
        gainNode.connect(noiseCtxRef.current.destination);
        whiteNoiseNodeRef.current = gainNode;
      }
      
      if (noiseCtxRef.current.state === 'suspended') noiseCtxRef.current.resume();
      if (whiteNoiseNodeRef.current) {
        whiteNoiseNodeRef.current.gain.value = (audioState.whiteNoise / 100) * 0.05; // Reduce gain as pure noise is loud
      }
    } else {
      if (noiseCtxRef.current && noiseCtxRef.current.state === 'running') {
        noiseCtxRef.current.suspend();
      }
    }

    // Handle Custom Music
    if (customAudioRef.current && customFile) {
        customAudioRef.current.volume = customVolume / 100;
        if (isActive) {
            if (customAudioRef.current.paused) customAudioRef.current.play().catch(() => {});
        } else {
            customAudioRef.current.pause();
        }
    }

  }, [audioState, isActive, customFile, customVolume]);

  // --- Handlers for Custom Music ---
  const handleMusicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const url = URL.createObjectURL(file);
        setCustomFile({ name: file.name, url });
        
        if (!customAudioRef.current) {
            customAudioRef.current = new Audio(url);
            customAudioRef.current.loop = true;
        } else {
            customAudioRef.current.src = url;
        }
    }
  };

  const removeMusic = () => {
    if (customAudioRef.current) {
        customAudioRef.current.pause();
        customAudioRef.current.src = '';
    }
    setCustomFile(null);
  };

  // --- Timer Logic ---
  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        const type = PRESETS[mode].type || 'timer';
        if (type === 'timer') {
          setTimeLeft(prev => {
            if (prev <= 0) {
              completeSession();
              return 0;
            }
            return prev - 1;
          });
        } else {
          setTimeLeft(prev => prev + 1);
        }
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isActive, mode]);

  // Update time when custom duration changes
  useEffect(() => {
    if (mode === 'custom' && !isActive) {
      setTimeLeft(customDuration * 60);
    }
  }, [customDuration]);

  // Wake Lock
  useEffect(() => {
    const handleWakeLock = async () => {
      if (settings.wake && isActive && 'wakeLock' in navigator) {
        try {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        } catch (err) {}
      } else if (!isActive && wakeLockRef.current) {
        wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    };
    handleWakeLock();
    return () => { if (wakeLockRef.current) wakeLockRef.current.release(); };
  }, [isActive, settings.wake]);

  // --- Actions ---
  const toggleTimer = () => {
    if (isActive) {
      setIsActive(false);
      setBotState('idle');
    } else {
      setIsActive(true);
      setBotState('work');
      // Resume audio context if needed (User gesture requirement)
      if (noiseCtxRef.current?.state === 'suspended') {
        noiseCtxRef.current.resume();
      }
      // Resume standard audio if mixed in
      Object.keys(audioRefs.current).forEach(key => {
         if ((audioState as any)[key] > 0) {
            audioRefs.current[key].play().catch(() => {});
         }
      });
      // Resume custom music
      if (customAudioRef.current && customFile) {
        customAudioRef.current.play().catch(() => {});
      }
    }
  };

  const resetTimer = () => {
    setIsActive(false);
    setBotState('idle');
    if (mode === 'custom') {
      setTimeLeft(customDuration * 60);
    } else {
      setTimeLeft(PRESETS[mode].time * 60);
    }
  };

  const setTimerMode = (key: string) => {
    setMode(key);
    setIsActive(false);
    setBotState('idle');
    if (key === 'custom') {
      setTimeLeft(customDuration * 60);
    } else {
      setTimeLeft(PRESETS[key].time * 60);
    }
  };

  const completeSession = () => {
    setIsActive(false);
    setBotState('break');
    
    // Save Session
    const duration = mode === 'custom' ? customDuration : PRESETS[mode].time; // in minutes
    if (mode === 'pomo' || mode === 'sprint' || mode === 'custom' || mode === 'flow') { // Only track work sessions
      setHistory(prev => [{
        id: Date.now(),
        date: new Date().toISOString(),
        durationMinutes: mode === 'flow' ? Math.floor(timeLeft / 60) : duration,
        mode
      }, ...prev]);
    }

    if (settings.snd) new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg").play().catch(() => {});
    if (settings.vib && navigator.vibrate) navigator.vibrate([200, 100, 200]);
    if (settings.not && Notification.permission === 'granted') new Notification("Study Session Complete!");

    // Auto-Break Logic
    if (settings.autoBreak) {
      if (mode === 'pomo') {
        setTimeout(() => setTimerMode('short'), 1000);
      } else if (mode === 'sprint') {
        setTimeout(() => setTimerMode('long'), 1000);
      }
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // --- Task Handlers ---
  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskInput.trim()) return;
    setTasks([...tasks, { id: Date.now().toString(), text: taskInput, done: false }]);
    setTaskInput('');
  };

  // --- Stats Calculation ---
  const today = new Date().toDateString();
  const todaysSessions = history.filter(h => new Date(h.date).toDateString() === today);
  const todayMinutes = todaysSessions.reduce((acc, curr) => acc + curr.durationMinutes, 0);
  
  // Weekly Chart Data
  const weeklyData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toDateString();
      const mins = history
        .filter(h => new Date(h.date).toDateString() === dateStr)
        .reduce((acc, curr) => acc + curr.durationMinutes, 0);
      days.push({ day: d.toLocaleDateString('en-US', { weekday: 'short' }), minutes: mins });
    }
    return days;
  }, [history]);

  const maxWeeklyMinutes = Math.max(...weeklyData.map(d => d.minutes), 1);

  // --- Render Helpers ---
  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return {
      m: m.toString(),
      s: s.toString().padStart(2, '0')
    };
  };
  const timeObj = formatTime(timeLeft);
  const themeColor = settings.theme;

  return (
    <div 
      ref={containerRef}
      className={`relative w-full overflow-hidden transition-all duration-500 font-sans text-white ${isFullscreen ? 'bg-black h-screen flex flex-col justify-center' : 'h-full md:rounded-2xl bg-[#09090b] border-gray-800 md:border'}`}
      style={{ '--theme': themeColor } as React.CSSProperties}
    >
      {/* --- Styles --- */}
      <style>{`
        .glass-panel { background: rgba(22, 22, 24, 0.75); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.08); }
        .bot-work .head { animation: bob 0.6s infinite ease-in-out; }
        @keyframes bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(2px); } }
        .t-card { background: linear-gradient(180deg, #27272a 0%, #18181b 100%); border: 1px solid rgba(255,255,255,0.05); }
        .focus-mode .timer-display { font-size: 20vw; text-shadow: 0 10px 60px rgba(0,0,0,0.5); }
        .focus-mode .glass-panel { background: transparent; border: none; }
        .range-slider { -webkit-appearance: none; width: 100%; height: 4px; border-radius: 2px; background: rgba(255,255,255,0.1); outline: none; }
        .range-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 16px; height: 16px; border-radius: 50%; background: var(--theme); cursor: pointer; transition: transform 0.1s; }
        .range-slider::-webkit-slider-thumb:hover { transform: scale(1.2); }
      `}</style>

      {/* --- Background --- */}
      <div className="absolute inset-0 bg-[#09090b] z-0">
         {!bgImage && (
           <div className="w-full h-full" style={{ background: 'radial-gradient(circle at center, #1e1e24 0%, #000 100%)' }}></div>
         )}
         {bgImage && <img src={bgImage} className="w-full h-full object-cover opacity-60" alt="bg" />}
         <div className="absolute inset-0 bg-black/40 z-10 pointer-events-none"></div>
      </div>

      {/* --- Header --- */}
      <div className={`absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-40 transition-opacity ${isFullscreen ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}>
        <div className="flex items-center gap-2 opacity-80 cursor-pointer" onClick={() => setActivePanel('none')}>
            <Clock className="text-[var(--theme)]" size={20} />
            <span className="font-bold tracking-tight text-white">Study Timer</span>
        </div>
        <div className="flex gap-2">
            <button 
              onClick={() => setActivePanel(activePanel === 'stats' ? 'none' : 'stats')} 
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${activePanel === 'stats' ? 'bg-[var(--theme)] text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
            >
                <BarChart2 size={18} />
            </button>
            <button 
              onClick={() => setActivePanel(activePanel === 'sounds' ? 'none' : 'sounds')} 
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${activePanel === 'sounds' ? 'bg-[var(--theme)] text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
            >
                <Headphones size={18} />
            </button>
            <button 
              onClick={() => setActivePanel(activePanel === 'settings' ? 'none' : 'settings')} 
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${activePanel === 'settings' ? 'bg-[var(--theme)] text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
            >
                <Settings2 size={18} />
            </button>
        </div>
      </div>

      {/* --- Main Timer Interface --- */}
      <div className={`absolute inset-0 flex flex-col justify-center items-center z-30 p-4 transition-all duration-500 ${isFullscreen ? 'focus-mode' : ''}`}>
         <div className="flex flex-col items-center w-full max-w-md">
            
            {/* Lofi Bot / Visual Anchor */}
            {!isFullscreen && activePanel === 'none' && (
              <div className={`w-24 h-24 mb-6 transition-transform cursor-pointer bot-${botState}`} onClick={toggleTimer}>
                  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
                    <g className="head">
                        <rect x="25" y="30" width="50" height="40" rx="10" fill="#27272a" stroke="var(--theme)" strokeWidth="2"/>
                        <rect x="30" y="35" width="40" height="25" rx="5" fill="#09090b"/>
                        {botState === 'work' ? (
                          <g><path d="M37 48 h6" stroke="var(--theme)" strokeWidth="2"/><path d="M57 48 h6" stroke="var(--theme)" strokeWidth="2"/></g>
                        ) : (
                          <g><circle cx="40" cy="48" r="3" fill="var(--theme)"/><circle cx="60" cy="48" r="3" fill="var(--theme)"/></g>
                        )}
                    </g>
                    <g className="body">
                        <path d="M30 70 L70 70 L65 95 L35 95 Z" fill="#27272a"/>
                    </g>
                </svg>
              </div>
            )}

            {/* Custom Time Control */}
            {!isActive && mode === 'custom' && !isFullscreen && activePanel === 'none' && (
              <div className="flex items-center gap-4 mb-6 bg-white/5 px-4 py-2 rounded-xl animate-fade-in border border-white/5">
                  <span className="text-gray-400 text-sm font-bold uppercase text-[10px]">Session Duration</span>
                  <input 
                    type="range" 
                    min="1" max="180" 
                    value={customDuration}
                    onChange={(e) => setCustomDuration(Number(e.target.value))}
                    className="range-slider w-32" 
                  />
                  <span className="text-[var(--theme)] font-mono font-bold w-12 text-right">{customDuration}m</span>
              </div>
            )}

            {/* Timer */}
            <div className="timer-display flex gap-2 cursor-pointer font-mono font-bold text-[var(--theme)] text-6xl md:text-8xl transition-all duration-500 select-none mb-8" onClick={toggleTimer}>
                {timeObj.m.padStart(2, '0').split('').map((digit, i) => (
                  <div key={`m-${i}`} className="t-card px-2 py-1 rounded relative overflow-hidden">{digit}</div>
                ))}
                <div className="opacity-50">:</div>
                <div className="t-card px-2 py-1 rounded relative overflow-hidden">{timeObj.s[0]}</div>
                <div className="t-card px-2 py-1 rounded relative overflow-hidden">{timeObj.s[1]}</div>
            </div>

            {/* Controls */}
            {!isFullscreen && activePanel === 'none' && (
              <div className="glass-panel p-2 rounded-2xl flex flex-wrap justify-center items-center gap-2 animate-fade-in">
                  {Object.keys(PRESETS).map(k => (
                      <button 
                          key={k} 
                          onClick={() => setTimerMode(k)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${mode === k ? 'bg-[var(--theme)] text-black shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                      >
                          {PRESETS[k].name}
                      </button>
                  ))}
              </div>
            )}
            
            {!isFullscreen && activePanel === 'none' && (
               <div className="mt-8 flex gap-4 animate-fade-in">
                   <button onClick={resetTimer} className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 transition-colors"><RotateCcw size={20}/></button>
                   <button 
                      onClick={toggleTimer} 
                      className="h-12 px-8 bg-[var(--theme)] rounded-full text-black font-bold flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_-5px_var(--theme)]"
                   >
                      {isActive ? <Pause fill="black" size={20} /> : <Play fill="black" size={20} />}
                      {isActive ? 'PAUSE' : 'START FOCUS'}
                   </button>
                   <button onClick={toggleFullscreen} className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 transition-colors"><Maximize2 size={20}/></button>
               </div>
            )}

            {/* Tasks Quick Input */}
            {!isFullscreen && activePanel === 'none' && (
              <form onSubmit={addTask} className="mt-8 w-full relative animate-fade-in opacity-80 hover:opacity-100 transition-opacity">
                 <input 
                    value={taskInput}
                    onChange={(e) => setTaskInput(e.target.value)}
                    placeholder="What are you studying?"
                    className="w-full bg-transparent border-b border-gray-700 py-2 text-center text-gray-300 focus:border-[var(--theme)] focus:outline-none transition-colors"
                 />
                 {tasks.length > 0 && <div className="text-center text-xs text-gray-500 mt-2">{tasks.filter(t => !t.done).length} tasks pending</div>}
              </form>
            )}
         </div>
      </div>

      {/* --- PANELS (Audio, Stats, Settings) --- */}
      
      {/* 1. Audio Mixer Panel */}
      {activePanel === 'sounds' && (
         <div className="absolute bottom-0 left-0 right-0 p-6 z-40 animate-fade-in">
            <div className="glass-panel p-6 rounded-3xl max-w-md mx-auto relative">
               <button onClick={() => setActivePanel('none')} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20}/></button>
               <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><Headphones size={20} className="text-[var(--theme)]"/> Sound Studio</h3>
               
               <div className="space-y-6">
                  
                  {/* Custom Music Upload */}
                  <div className="mb-6 pb-6 border-b border-white/10">
                     <label className="text-xs text-gray-400 uppercase font-bold mb-3 block">Study Music</label>
                     
                     {!customFile ? (
                         <label className="flex items-center gap-3 p-3 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors border border-white/5 group">
                             <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                                 <Upload size={18} />
                             </div>
                             <div className="flex-1">
                                 <div className="text-sm font-medium text-gray-200">Upload Audio File</div>
                                 <div className="text-xs text-gray-500">MP3, WAV, OGG</div>
                             </div>
                             <input type="file" accept="audio/*" hidden onChange={handleMusicUpload} />
                         </label>
                     ) : (
                         <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                             <div className="flex justify-between items-center mb-3">
                                 <div className="flex items-center gap-3 overflow-hidden">
                                     <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                                         <Music size={18} />
                                     </div>
                                     <div className="truncate">
                                         <div className="text-sm font-medium text-gray-200 truncate max-w-[150px]">{customFile.name}</div>
                                         <div className="text-xs text-green-400 flex items-center gap-1">
                                            {isActive ? 'Playing' : 'Paused (Timer Inactive)'}
                                         </div>
                                     </div>
                                 </div>
                                 <button onClick={removeMusic} className="text-gray-500 hover:text-red-400 p-2"><Trash2 size={18}/></button>
                             </div>
                             
                             <div className="flex items-center gap-3">
                                 <Volume2 size={16} className="text-gray-400"/>
                                 <input 
                                     type="range" 
                                     min="0" max="100" 
                                     value={customVolume}
                                     onChange={(e) => setCustomVolume(Number(e.target.value))}
                                     className="range-slider flex-1"
                                 />
                             </div>
                         </div>
                     )}
                  </div>

                  {/* Ambient Sounds */}
                  <div>
                    <label className="text-xs text-gray-400 uppercase font-bold mb-3 block">Ambient Mixer</label>
                    <div className="space-y-4">
                      {[
                        { key: 'rain', label: 'Heavy Rain', icon: CloudRain },
                        { key: 'forest', label: 'Deep Forest', icon: Trees },
                        { key: 'cafe', label: 'Cafe Noise', icon: Coffee },
                        { key: 'fire', label: 'Cozy Fire', icon: Flame },
                        { key: 'whiteNoise', label: 'White Noise', icon: Wind },
                      ].map((sound) => (
                        <div key={sound.key} className="flex items-center gap-4">
                            <sound.icon size={20} className="text-gray-400" />
                            <div className="flex-1">
                              <div className="flex justify-between text-xs mb-2">
                                  <span className="text-gray-300">{sound.label}</span>
                                  <span className="text-gray-500">{(audioState as any)[sound.key]}%</span>
                              </div>
                              <input 
                                  type="range" 
                                  min="0" max="100" 
                                  value={(audioState as any)[sound.key]}
                                  onChange={(e) => setAudioState({ ...audioState, [sound.key]: parseInt(e.target.value) })}
                                  className="range-slider"
                              />
                            </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                      <span className="text-sm text-gray-400">Master Audio</span>
                      <button 
                        onClick={() => setAudioState({...audioState, masterMute: !audioState.masterMute})}
                        className={`p-2 rounded-full ${audioState.masterMute ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}
                      >
                         {audioState.masterMute ? <VolumeX size={20} /> : <Volume2 size={20} />}
                      </button>
                  </div>
               </div>
            </div>
         </div>
      )}

      {/* 2. Stats Panel */}
      {activePanel === 'stats' && (
        <div className="absolute inset-0 z-40 p-6 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
           <div className="glass-panel p-8 rounded-3xl w-full max-w-2xl relative">
              <button onClick={() => setActivePanel('none')} className="absolute top-6 right-6 text-gray-500 hover:text-white"><X size={24}/></button>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                 <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <div className="text-gray-400 text-xs uppercase font-bold mb-1">Focus Today</div>
                    <div className="text-3xl font-bold text-[var(--theme)]">{todayMinutes}<span className="text-sm text-gray-500 ml-1">m</span></div>
                 </div>
                 <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <div className="text-gray-400 text-xs uppercase font-bold mb-1">Sessions</div>
                    <div className="text-3xl font-bold text-white">{todaysSessions.length}</div>
                 </div>
                 <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <div className="text-gray-400 text-xs uppercase font-bold mb-1">Total Time</div>
                    <div className="text-3xl font-bold text-white">{Math.floor(history.reduce((a,c) => a + c.durationMinutes, 0) / 60)}<span className="text-sm text-gray-500 ml-1">h</span></div>
                 </div>
              </div>

              <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><BarChart2 size={20} className="text-[var(--theme)]"/> Last 7 Days</h3>
              <div className="h-40 flex items-end gap-2 md:gap-4">
                 {weeklyData.map((d, i) => {
                    const heightPercent = maxWeeklyMinutes > 0 ? (d.minutes / maxWeeklyMinutes) * 100 : 0;
                    return (
                       <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                          <div className="w-full bg-white/5 rounded-t-lg relative h-full flex items-end overflow-hidden group-hover:bg-white/10 transition-colors">
                             <div 
                                style={{ height: `${heightPercent}%` }} 
                                className="w-full bg-[var(--theme)] opacity-80 group-hover:opacity-100 transition-all"
                             ></div>
                          </div>
                          <span className="text-xs text-gray-500 font-bold">{d.day}</span>
                       </div>
                    );
                 })}
              </div>
           </div>
        </div>
      )}

      {/* 3. Settings Panel */}
      {activePanel === 'settings' && (
         <div className="absolute bottom-0 left-0 right-0 z-40 p-4 animate-fade-in">
            <div className="glass-panel p-6 rounded-3xl max-w-md mx-auto relative max-h-[70vh] overflow-y-auto">
               <button onClick={() => setActivePanel('none')} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20}/></button>
               <h3 className="font-bold text-lg mb-6">Settings</h3>
               
               {/* Theme Picker */}
               <div className="mb-6">
                  <label className="text-xs text-gray-400 uppercase font-bold mb-3 block">Accent Color</label>
                  <div className="flex gap-3">
                      {['#fbbf24', '#ef4444', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899'].map(c => (
                          <button 
                            key={c} 
                            onClick={() => setSettings({...settings, theme: c})} 
                            className={`w-8 h-8 rounded-full border-2 ${settings.theme === c ? 'border-white scale-110' : 'border-transparent opacity-50 hover:opacity-100'}`} 
                            style={{background: c}}
                          ></button>
                      ))}
                  </div>
               </div>

               {/* Background */}
               <div className="mb-6">
                  <label className="text-xs text-gray-400 uppercase font-bold mb-3 block">Background</label>
                  <label className="flex items-center gap-3 p-3 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors border border-white/5">
                      <ImageIcon size={20} className="text-gray-300" />
                      <span className="text-sm text-gray-200">Change Wallpaper</span>
                      <input type="file" accept="image/*" hidden onChange={(e) => {
                          const file = e.target.files?.[0];
                          if(file) setBgImage(URL.createObjectURL(file));
                      }} />
                  </label>
                  {bgImage && <button onClick={() => setBgImage('')} className="text-xs text-red-400 mt-2 hover:underline">Remove Wallpaper</button>}
               </div>

               {/* Toggles */}
               <div className="space-y-2">
                   {[
                      { label: 'Sound Effects', key: 'snd', icon: settings.snd ? Volume2 : VolumeX },
                      { label: 'Haptics', key: 'vib', icon: settings.vib ? Zap : ZapOff },
                      { label: 'Notifications', key: 'not', icon: settings.not ? Bell : BellOff },
                      { label: 'Auto-Start Break', key: 'autoBreak', icon: RefreshCw },
                      { label: 'Keep Screen On', key: 'wake', icon: settings.wake ? Monitor : Smartphone },
                   ].map((item: any) => (
                      <button 
                        key={item.key}
                        onClick={() => {
                           if (item.key === 'not' && !settings.not) Notification.requestPermission();
                           setSettings({...settings, [item.key]: !(settings as any)[item.key]});
                        }}
                        className="w-full flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors"
                      >
                         <div className="flex items-center gap-3">
                            <item.icon size={18} className="text-[var(--theme)]" />
                            <span className="text-sm text-gray-200">{item.label}</span>
                         </div>
                         <div className={`w-10 h-6 rounded-full relative transition-colors ${settings[item.key] ? 'bg-[var(--theme)]' : 'bg-gray-700'}`}>
                             <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings[item.key] ? 'left-5' : 'left-1'}`}></div>
                         </div>
                      </button>
                   ))}
               </div>
            </div>
         </div>
      )}

    </div>
  );
};