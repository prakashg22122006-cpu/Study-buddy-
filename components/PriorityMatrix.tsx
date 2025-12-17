import React, { useState } from 'react';
import { Filter, X, Pencil } from 'lucide-react';
import { usePersistentState } from '../hooks/usePersistentState';
import { MatrixState, MatrixItem } from '../types';

export const PriorityMatrix: React.FC = () => {
  const [matrix, setMatrix] = usePersistentState<MatrixState>('cm_matrix', {
    q1: [], // Urgent & Important
    q2: [], // Not Urgent & Important
    q3: [], // Urgent & Not Important
    q4: []  // Not Urgent & Not Important
  });
  const [text, setText] = useState('');
  const [targetQ, setTargetQ] = useState<'q1' | 'q2' | 'q3' | 'q4'>('q1');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingSourceQ, setEditingSourceQ] = useState<'q1' | 'q2' | 'q3' | 'q4' | null>(null);

  const addToMatrix = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text) return;

    if (editingId && editingSourceQ) {
        // If updating, we remove from source and add to target (which might be different)
        const newMatrix = { ...matrix };
        
        // Remove from old location
        newMatrix[editingSourceQ] = newMatrix[editingSourceQ].filter(i => i.id !== editingId);
        
        // Add to new location (even if same)
        newMatrix[targetQ] = [...newMatrix[targetQ], { id: editingId, text }];
        
        setMatrix(newMatrix);
        setEditingId(null);
        setEditingSourceQ(null);
    } else {
        setMatrix({ ...matrix, [targetQ]: [...matrix[targetQ], { id: Date.now(), text }] });
    }
    setText('');
  };

  const editItem = (qKey: 'q1' | 'q2' | 'q3' | 'q4', item: MatrixItem) => {
      setEditingId(item.id);
      setEditingSourceQ(qKey);
      setText(item.text);
      setTargetQ(qKey); // Pre-select current quadrant
  };

  const cancelEdit = () => {
      setEditingId(null);
      setEditingSourceQ(null);
      setText('');
  };

  const removeItem = (q: keyof MatrixState, id: number) => {
    setMatrix({ ...matrix, [q]: matrix[q].filter(i => i.id !== id) });
    if (editingId === id) cancelEdit();
  };

  const Quadrant = ({ title, qKey, color, items }: { title: string, qKey: keyof MatrixState, color: string, items: MatrixItem[] }) => (
    <div className={`p-4 rounded-xl border ${color} bg-white dark:bg-gray-800 min-h-[150px]`}>
      <h3 className="font-bold mb-2 text-sm uppercase tracking-wider opacity-70">{title}</h3>
      <ul className="space-y-2">
        {items.map(item => (
          <li key={item.id} className="flex justify-between items-start text-sm group">
            <span className="dark:text-white break-words w-full pr-2">{item.text}</span>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button onClick={() => editItem(qKey as any, item)} className="text-gray-400 hover:text-teal-500"><Pencil size={12}/></button>
                 <button onClick={() => removeItem(qKey, item.id)} className="text-gray-400 hover:text-red-500"><X size={12}/></button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
       <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
        <Filter className="text-teal-500" /> Priority Matrix
      </h2>

      <form onSubmit={addToMatrix} className="flex gap-2 mb-4 relative">
        {editingId && <span className="absolute -top-5 left-0 text-xs text-teal-600 font-bold">Editing Task</span>}
        <input 
          value={text} 
          onChange={e => setText(e.target.value)} 
          placeholder="Add task..." 
          className="flex-1 p-2 rounded-lg border dark:bg-gray-800 dark:border-gray-700 dark:text-white"
        />
        <select 
          value={targetQ} 
          onChange={e => setTargetQ(e.target.value as 'q1' | 'q2' | 'q3' | 'q4')}
          className="p-2 rounded-lg border dark:bg-gray-800 dark:border-gray-700 dark:text-white"
        >
          <option value="q1">Do First</option>
          <option value="q2">Schedule</option>
          <option value="q3">Delegate</option>
          <option value="q4">Don't Do</option>
        </select>
        <button className="bg-teal-600 text-white px-4 rounded-lg">
            {editingId ? 'Update' : 'Add'}
        </button>
        {editingId && (
            <button type="button" onClick={cancelEdit} className="bg-gray-200 text-gray-600 px-3 rounded-lg hover:bg-gray-300">
                <X size={20} />
            </button>
        )}
      </form>

      <div className="grid grid-cols-2 gap-4 flex-1 overflow-y-auto">
        <Quadrant title="Do First (Urgent/Imp)" qKey="q1" color="border-red-200 dark:border-red-900" items={matrix.q1} />
        <Quadrant title="Schedule (Not Urgent/Imp)" qKey="q2" color="border-blue-200 dark:border-blue-900" items={matrix.q2} />
        <Quadrant title="Delegate (Urgent/Not Imp)" qKey="q3" color="border-yellow-200 dark:border-yellow-900" items={matrix.q3} />
        <Quadrant title="Eliminate (Not Urgent/Not Imp)" qKey="q4" color="border-green-200 dark:border-green-900" items={matrix.q4} />
      </div>
    </div>
  );
};