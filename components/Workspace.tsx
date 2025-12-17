import React from 'react';
import { PenTool } from 'lucide-react';
import { usePersistentState } from '../hooks/usePersistentState';

export const Workspace: React.FC = () => {
  const [note, setNote] = usePersistentState<string>('cm_workspace', '');
  
  return (
    <div className="h-[calc(100vh-140px)] flex flex-col">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
        <PenTool className="text-gray-500" /> Scratchpad
      </h2>
      <textarea
        className="flex-1 w-full p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-yellow-50 dark:bg-gray-800 dark:text-gray-200 focus:outline-none resize-none font-mono text-sm leading-relaxed"
        placeholder="Type temporary notes here..."
        value={note}
        onChange={(e) => setNote(e.target.value)}
      ></textarea>
      <p className="text-xs text-gray-400 mt-2">Auto-saved to local storage.</p>
    </div>
  );
};
