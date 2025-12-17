import React, { useState } from 'react';
import { BookOpen, Save, Trash2, Pencil, X } from 'lucide-react';
import { usePersistentState } from '../hooks/usePersistentState';
import { JournalEntry } from '../types';

export const Journal: React.FC = () => {
  const [entries, setEntries] = usePersistentState<JournalEntry[]>('cm_journal', []);
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  const addEntry = () => {
    if(!content.trim()) return;
    
    if (editingId) {
       setEntries(entries.map(e => e.id === editingId ? { ...e, text: content } : e));
       setEditingId(null);
    } else {
       setEntries([{ id: Date.now(), text: content, date: new Date().toISOString() }, ...entries]);
    }
    setContent('');
  };

  const editEntry = (entry: JournalEntry) => {
      setEditingId(entry.id);
      setContent(entry.text);
  };

  const deleteEntry = (id: number) => {
      setEntries(entries.filter(e => e.id !== id));
      if (editingId === id) {
          setEditingId(null);
          setContent('');
      }
  };

  const cancelEdit = () => {
      setEditingId(null);
      setContent('');
  };

  return (
    <div className="max-w-2xl mx-auto h-[calc(100vh-140px)] flex flex-col">
       <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
        <BookOpen className="text-yellow-500" /> Daily Journal
      </h2>
      
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
        {entries.map(entry => (
          <div key={entry.id} className={`bg-white dark:bg-gray-800 p-4 rounded-xl border ${editingId === entry.id ? 'border-yellow-500' : 'border-gray-100 dark:border-gray-700'} relative group`}>
             <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => editEntry(entry)} className="text-gray-300 hover:text-yellow-500"><Pencil size={14}/></button>
                <button onClick={() => deleteEntry(entry.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={14}/></button>
             </div>
            <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{entry.text}</p>
            <p className="text-xs text-gray-400 mt-2 text-right">{new Date(entry.date).toLocaleString()}</p>
          </div>
        ))}
        {entries.length === 0 && <div className="text-center text-gray-400 mt-10">Write about your day...</div>}
      </div>

      <div className="relative">
        {editingId && <div className="absolute -top-6 left-0 text-xs text-yellow-600 font-bold flex items-center gap-2">Editing Entry... <button onClick={cancelEdit} className="underline text-gray-500">Cancel</button></div>}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What did you learn today?"
          className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 h-32 resize-none"
        ></textarea>
        <button 
          onClick={addEntry}
          className="absolute bottom-4 right-4 bg-yellow-500 text-white p-2 rounded-lg shadow hover:bg-yellow-600"
        >
          <Save size={20} />
        </button>
      </div>
    </div>
  );
};