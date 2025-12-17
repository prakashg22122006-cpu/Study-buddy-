import React, { useState, useEffect } from 'react';
import { Timer, Plus, Trash2, Calendar, Clock, X, Sparkles } from 'lucide-react';
import { usePersistentState } from '../hooks/usePersistentState';
import { CountdownItem } from '../types';
import { formatDate } from '../utils/helpers';

const THEMES = [
  { name: 'Sunset', bg: 'bg-gradient-to-br from-orange-400 to-pink-500' },
  { name: 'Ocean', bg: 'bg-gradient-to-br from-blue-400 to-cyan-500' },
  { name: 'Forest', bg: 'bg-gradient-to-br from-emerald-400 to-teal-500' },
  { name: 'Berry', bg: 'bg-gradient-to-br from-pink-500 to-rose-500' },
  { name: 'Lavender', bg: 'bg-gradient-to-br from-violet-400 to-purple-500' },
  { name: 'Midnight', bg: 'bg-gradient-to-br from-slate-700 to-slate-900' },
  { name: 'Aurora', bg: 'bg-gradient-to-br from-green-300 via-blue-500 to-purple-600' },
  { name: 'Fire', bg: 'bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500' },
];

export const Countdown: React.FC = () => {
  const [countdowns, setCountdowns] = usePersistentState<CountdownItem[]>('cm_countdowns', []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Form State
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('00:00');
  const [selectedTheme, setSelectedTheme] = useState(THEMES[0].bg);

  // Update timer every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date) return;

    const targetDateTime = new Date(`${date}T${time}`).toISOString();

    setCountdowns([...countdowns, {
      id: Date.now(),
      title,
      date: targetDateTime,
      theme: selectedTheme
    }]);

    setTitle('');
    setDate('');
    setTime('00:00');
    setIsModalOpen(false);
  };

  const deleteCountdown = (id: number) => {
    if(confirm("Remove this countdown?")) {
        setCountdowns(countdowns.filter(c => c.id !== id));
    }
  };

  const calculateTimeLeft = (targetDate: string) => {
    const difference = new Date(targetDate).getTime() - currentTime;
    
    if (difference <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      isPast: false
    };
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-20">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
             <Timer className="text-pink-500" /> Countdowns
           </h1>
           <p className="text-gray-500 dark:text-gray-400 text-sm">Track upcoming exams, deadlines, and events.</p>
        </div>
        <button 
           onClick={() => setIsModalOpen(true)}
           className="bg-pink-500 text-white px-5 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-pink-600 transition-colors shadow-lg shadow-pink-200 dark:shadow-none"
        >
           <Plus size={20} /> New Event
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {countdowns.length === 0 && (
            <div className="col-span-full py-20 text-center opacity-50">
               <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Timer size={40} className="text-gray-400"/>
               </div>
               <p className="text-gray-500 font-medium">No countdowns yet. Add one to get started!</p>
            </div>
         )}

         {countdowns.map(item => {
            const timeLeft = calculateTimeLeft(item.date);
            
            return (
               <div key={item.id} className={`rounded-3xl p-6 text-white relative overflow-hidden shadow-xl group transition-transform hover:-translate-y-1 ${item.theme}`}>
                  {/* Glass Overlay */}
                  <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px] group-hover:bg-white/5 transition-colors"></div>
                  
                  {/* Content */}
                  <div className="relative z-10">
                     <div className="flex justify-between items-start mb-6">
                        <div>
                           <h3 className="text-xl font-bold leading-tight mb-1 drop-shadow-md">{item.title}</h3>
                           <p className="text-xs font-medium opacity-90 flex items-center gap-1">
                              <Calendar size={12}/> {formatDate(item.date)}
                           </p>
                        </div>
                        <button 
                           onClick={() => deleteCountdown(item.id)}
                           className="w-8 h-8 flex items-center justify-center rounded-full bg-black/20 hover:bg-red-500/80 transition-colors text-white/80 hover:text-white"
                        >
                           <Trash2 size={14}/>
                        </button>
                     </div>

                     {timeLeft.isPast ? (
                        <div className="bg-white/20 rounded-xl p-4 text-center backdrop-blur-md">
                           <span className="font-bold text-lg flex items-center justify-center gap-2"><Sparkles size={18}/> Event Completed</span>
                        </div>
                     ) : (
                        <div className="grid grid-cols-4 gap-2 text-center">
                           <div className="bg-black/20 rounded-xl p-2 backdrop-blur-sm">
                              <div className="text-2xl font-bold">{timeLeft.days}</div>
                              <div className="text-[10px] uppercase opacity-70">Days</div>
                           </div>
                           <div className="bg-black/20 rounded-xl p-2 backdrop-blur-sm">
                              <div className="text-2xl font-bold">{timeLeft.hours}</div>
                              <div className="text-[10px] uppercase opacity-70">Hrs</div>
                           </div>
                           <div className="bg-black/20 rounded-xl p-2 backdrop-blur-sm">
                              <div className="text-2xl font-bold">{timeLeft.minutes}</div>
                              <div className="text-[10px] uppercase opacity-70">Mins</div>
                           </div>
                           <div className="bg-black/20 rounded-xl p-2 backdrop-blur-sm">
                              <div className="text-2xl font-bold">{timeLeft.seconds}</div>
                              <div className="text-[10px] uppercase opacity-70">Secs</div>
                           </div>
                        </div>
                     )}
                  </div>
               </div>
            );
         })}
      </div>

      {/* Add Modal */}
      {isModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl p-6 animate-fade-in shadow-2xl">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-xl text-gray-800 dark:text-white">New Countdown</h3>
                  <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
               </div>
               
               <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Event Title</label>
                     <input 
                        required
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="e.g. Final Exams"
                        className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 dark:text-white"
                     />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                        <input 
                           type="date"
                           required
                           value={date}
                           onChange={e => setDate(e.target.value)}
                           className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 dark:text-white"
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time</label>
                        <input 
                           type="time"
                           value={time}
                           onChange={e => setTime(e.target.value)}
                           className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 dark:text-white"
                        />
                     </div>
                  </div>

                  <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Theme</label>
                     <div className="grid grid-cols-4 gap-2">
                        {THEMES.map((t, i) => (
                           <button 
                              type="button"
                              key={i}
                              onClick={() => setSelectedTheme(t.bg)}
                              className={`h-10 rounded-lg ${t.bg} transition-transform hover:scale-105 ${selectedTheme === t.bg ? 'ring-2 ring-offset-2 ring-pink-500 dark:ring-offset-gray-800' : ''}`}
                              title={t.name}
                           ></button>
                        ))}
                     </div>
                  </div>

                  <div className="pt-4 flex justify-end gap-3">
                     <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-gray-500 hover:bg-gray-100 rounded-xl font-medium">Cancel</button>
                     <button type="submit" className="px-5 py-2 bg-pink-500 text-white rounded-xl font-bold hover:bg-pink-600">Start Countdown</button>
                  </div>
               </form>
            </div>
         </div>
      )}
    </div>
  );
};