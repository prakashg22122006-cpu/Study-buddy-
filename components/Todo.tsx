import React, { useState } from 'react';
import { CheckSquare, Plus, Trash2, Settings, X, Pencil } from 'lucide-react';
import { usePersistentState } from '../hooks/usePersistentState';
import { TodoItem } from '../types';

export const Todo: React.FC = () => {
  const [todos, setTodos] = usePersistentState<TodoItem[]>('cm_todos', []);
  const [categories, setCategories] = usePersistentState<string[]>('cm_todo_cats', ['General', 'Assignment', 'Lab Record', 'Project', 'Personal']);
  
  const [input, setInput] = useState('');
  const [category, setCategory] = useState('General');
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Category Management State
  const [isManagingCats, setIsManagingCats] = useState(false);
  const [newCat, setNewCat] = useState('');

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    if (editingId) {
      setTodos(todos.map(t => t.id === editingId ? { ...t, text: input, category } : t));
      setEditingId(null);
    } else {
      setTodos([{ id: Date.now(), text: input, completed: false, category }, ...todos]);
    }
    setInput('');
  };

  const editTodo = (todo: TodoItem) => {
    setEditingId(todo.id);
    setInput(todo.text);
    setCategory(todo.category);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setInput('');
  };

  const toggleTodo = (id: number) => {
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTodo = (id: number) => {
    setTodos(todos.filter(t => t.id !== id));
    if (editingId === id) cancelEdit();
  };

  // Category Logic
  const addCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCat && !categories.includes(newCat)) {
      setCategories([...categories, newCat]);
      setNewCat('');
    }
  };

  const removeCategory = (cat: string) => {
    if (categories.length > 1) {
      setCategories(categories.filter(c => c !== cat));
      if (category === cat) setCategory(categories[0]); // Reset selected if deleted
    } else {
      alert("You must have at least one category.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <CheckSquare className="text-blue-500" /> Tasks
        </h2>
        <button 
          onClick={() => setIsManagingCats(!isManagingCats)}
          className="text-xs flex items-center gap-1 text-gray-500 hover:text-blue-500 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full transition-colors"
        >
          <Settings size={14} /> {isManagingCats ? 'Done' : 'Manage Categories'}
        </button>
      </div>

      {isManagingCats ? (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm mb-6 border-2 border-dashed border-blue-200 dark:border-blue-900 animate-fade-in">
          <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-3 text-sm">Manage Categories</h3>
          <form onSubmit={addCategory} className="flex gap-2 mb-4">
            <input 
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              placeholder="New Category Name..."
              className="flex-1 p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent dark:text-white text-sm"
            />
            <button className="bg-blue-600 text-white px-3 rounded-lg text-sm">Add</button>
          </form>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <div key={cat} className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-sm dark:text-gray-200">
                {cat}
                <button onClick={() => removeCategory(cat)} className="text-gray-400 hover:text-red-500"><X size={12} /></button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <form onSubmit={addTodo} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm mb-6 flex gap-2 flex-wrap relative">
          {editingId && <span className="absolute -top-3 left-4 text-xs bg-blue-100 text-blue-600 px-2 rounded">Editing Task</span>}
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ex: Submit OS Assignment..."
            className="flex-1 p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select 
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent dark:text-white focus:outline-none"
          >
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button type="submit" className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 flex items-center gap-1">
             {editingId ? <Pencil size={20} /> : <Plus size={24} />}
          </button>
          {editingId && (
            <button type="button" onClick={cancelEdit} className="bg-gray-200 dark:bg-gray-700 text-gray-500 p-2 rounded-lg hover:bg-gray-300">
              <X size={20} />
            </button>
          )}
        </form>
      )}

      <div className="space-y-3">
        {todos.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p>No tasks yet. Enjoy your free time! 🎉</p>
          </div>
        ) : (
          todos.map(todo => (
            <div key={todo.id} className={`flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 ${todo.completed ? 'opacity-50' : ''}`}>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => toggleTodo(todo.id)}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${todo.completed ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}
                >
                  {todo.completed && <CheckSquare size={14} className="text-white" />}
                </button>
                <div>
                  <p className={`font-medium text-gray-800 dark:text-white ${todo.completed ? 'line-through' : ''}`}>{todo.text}</p>
                  <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">{todo.category}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => editTodo(todo)} className="text-gray-300 hover:text-blue-500"><Pencil size={18} /></button>
                <button onClick={() => deleteTodo(todo.id)} className="text-red-400 hover:text-red-600"><Trash2 size={18} /></button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};