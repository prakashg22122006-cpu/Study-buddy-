import React, { useState, useEffect, useMemo } from 'react';
import { 
  Wallet, TrendingUp, TrendingDown, Plus, Trash2, 
  Users, PieChart, X, Utensils, Bus, ShoppingBag, 
  Smartphone, FileText, Printer, GraduationCap, 
  MoreHorizontal, Banknote, Laptop, Gift, ArrowUpCircle, 
  ArrowDownCircle, Download, BarChart3, Calendar, Target
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { usePersistentState } from '../hooks/usePersistentState';
import { formatCurrency } from '../utils/helpers';
import { Transaction } from '../types';

// --- Configuration ---
const CATEGORIES: Record<string, { name: string, icon: any, color: string, barColor: string }> = {
  // Expense
  food: { name: 'Food', icon: Utensils, color: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20', barColor: 'bg-orange-500' },
  transport: { name: 'Transport', icon: Bus, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20', barColor: 'bg-blue-500' },
  shopping: { name: 'Shopping', icon: ShoppingBag, color: 'text-pink-500 bg-pink-50 dark:bg-pink-900/20', barColor: 'bg-pink-500' },
  recharge: { name: 'Recharge', icon: Smartphone, color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20', barColor: 'bg-purple-500' },
  bills: { name: 'Bills', icon: FileText, color: 'text-red-500 bg-red-50 dark:bg-red-900/20', barColor: 'bg-red-500' },
  print: { name: 'Print/Xerox', icon: Printer, color: 'text-gray-600 bg-gray-50 dark:bg-gray-800', barColor: 'bg-gray-500' },
  fees: { name: 'Fees', icon: GraduationCap, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20', barColor: 'bg-indigo-500' },
  other: { name: 'Other', icon: MoreHorizontal, color: 'text-gray-500 bg-gray-100 dark:bg-gray-800', barColor: 'bg-gray-400' },
  // Income
  salary: { name: 'Salary', icon: Banknote, color: 'text-green-600 bg-green-50 dark:bg-green-900/20', barColor: 'bg-green-500' },
  pocket_money: { name: 'Pocket Money', icon: Wallet, color: 'text-teal-500 bg-teal-50 dark:bg-teal-900/20', barColor: 'bg-teal-500' },
  freelance: { name: 'Freelance', icon: Laptop, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20', barColor: 'bg-blue-500' },
  gift: { name: 'Gift', icon: Gift, color: 'text-rose-500 bg-rose-50 dark:bg-rose-900/20', barColor: 'bg-rose-500' }
};

const EXPENSE_CATS = ['food', 'transport', 'shopping', 'recharge', 'bills', 'print', 'fees', 'other'];
const INCOME_CATS = ['salary', 'pocket_money', 'freelance', 'gift'];

export const Finance: React.FC = () => {
  // --- State ---
  const [transactions, setTransactions] = usePersistentState<Transaction[]>('cm_finance', []);
  const [budgets, setBudgets] = usePersistentState<Record<string, number>>('cm_finance_budgets', {});
  
  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSplitOpen, setIsSplitOpen] = useState(false);
  const [isBudgetOpen, setIsBudgetOpen] = useState(false);

  // Add Transaction Form
  const [formType, setFormType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [selectedCat, setSelectedCat] = useState('food');

  // Split Bill Form
  const [splitTotal, setSplitTotal] = useState('');
  const [splitPeople, setSplitPeople] = useState('2');
  const [splitResult, setSplitResult] = useState(0);

  // Budget Form
  const [tempBudgets, setTempBudgets] = useState<Record<string, number>>({});

  // --- Calculations ---
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = transactions
    .filter(t => (t.type === 'expense' || !t.type)) // Handle legacy data
    .reduce((acc, t) => acc + t.amount, 0);

  const balance = totalIncome - totalExpense;

  // --- Analytics Data ---
  const chartData = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    // Filter expenses for current month
    const monthlyExpenses = transactions.filter(t => {
       const d = new Date(t.date);
       return (t.type === 'expense' || !t.type) && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    // Group by category
    const grouped = monthlyExpenses.reduce((acc, t) => {
       acc[t.category] = (acc[t.category] || 0) + t.amount;
       return acc;
    }, {} as Record<string, number>);

    // Find max for scaling
    const maxVal = Math.max(...Object.values(grouped), 0) || 1;

    // Format for rendering
    return Object.keys(grouped)
       .sort((a, b) => grouped[b] - grouped[a])
       .map(key => ({
          key,
          amount: grouped[key],
          percentage: (grouped[key] / maxVal) * 100,
          ...(CATEGORIES[key] || CATEGORIES['other']) // Fallback for safety
       }));
  }, [transactions]);

  // --- Budget Progress Data ---
  const budgetData = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // Calculate spent per category for current month
    const spending = transactions.filter(t => {
       const d = new Date(t.date);
       return (t.type === 'expense' || !t.type) && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).reduce((acc, t) => {
       acc[t.category] = (acc[t.category] || 0) + t.amount;
       return acc;
    }, {} as Record<string, number>);

    return Object.keys(budgets)
        .filter(cat => budgets[cat] > 0)
        .map(cat => {
            const spent = spending[cat] || 0;
            const limit = budgets[cat];
            const percent = Math.min((spent / limit) * 100, 100);
            const isOver = spent > limit;
            
            return {
                cat,
                name: CATEGORIES[cat]?.name || cat,
                icon: CATEGORIES[cat]?.icon || MoreHorizontal,
                spent,
                limit,
                percent,
                isOver,
                color: CATEGORIES[cat]?.color || 'text-gray-500 bg-gray-100',
                barColor: isOver ? 'bg-red-500' : (percent > 90 ? 'bg-orange-500' : 'bg-emerald-500')
            };
        });
  }, [transactions, budgets]);

  // --- Handlers ---
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(parseFloat(amount))) return;

    const newTxn: Transaction = {
      id: Date.now(),
      amount: parseFloat(amount),
      desc: note,
      category: selectedCat,
      type: formType,
      date: new Date().toISOString()
    };

    setTransactions([newTxn, ...transactions]);
    resetForm();
    setIsAddOpen(false);
  };

  const deleteTransaction = (id: number) => {
    if (confirm('Delete this transaction?')) {
      setTransactions(transactions.filter(t => t.id !== id));
    }
  };

  const resetForm = () => {
    setAmount('');
    setNote('');
    setFormType('expense');
    setSelectedCat('food');
  };

  const calculateSplit = () => {
    const total = parseFloat(splitTotal) || 0;
    const people = parseInt(splitPeople) || 1;
    setSplitResult(people > 0 ? Math.ceil(total / people) : 0);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.setTextColor(79, 70, 229); // Indigo
    doc.text("Study Buddy - Finance Report", 14, 22);
    
    // Meta
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`Total Balance: ${formatCurrency(balance)}`, 14, 35);

    // Table
    const tableData = transactions.map(t => [
      new Date(t.date).toLocaleDateString(),
      t.type === 'income' ? 'Income' : 'Expense',
      CATEGORIES[t.category]?.name || t.category,
      t.desc || '-',
      formatCurrency(t.amount)
    ]);

    autoTable(doc, {
        head: [['Date', 'Type', 'Category', 'Description', 'Amount']],
        body: tableData,
        startY: 40,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [79, 70, 229] },
        columnStyles: { 
          4: { fontStyle: 'bold', halign: 'right' } 
        }
    });

    doc.save("study-buddy-finance.pdf");
  };

  // Budget Modal Handlers
  const openBudgetModal = () => {
      setTempBudgets(budgets);
      setIsBudgetOpen(true);
  };

  const handleBudgetChange = (cat: string, value: string) => {
      setTempBudgets(prev => ({ ...prev, [cat]: parseFloat(value) || 0 }));
  };

  const saveBudgets = (e: React.FormEvent) => {
      e.preventDefault();
      setBudgets(tempBudgets);
      setIsBudgetOpen(false);
  };

  useEffect(() => {
    calculateSplit();
  }, [splitTotal, splitPeople]);

  return (
    <div className="max-w-4xl mx-auto pb-24 font-sans relative min-h-[calc(100vh-100px)]">
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-xl text-indigo-600 dark:text-indigo-400">
          <Wallet size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Finance Tracker</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage your money wisely</p>
        </div>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200 dark:shadow-none mb-8 relative overflow-hidden">
        <div className="relative z-10">
          <div className="text-indigo-100 text-sm font-medium mb-1">Total Balance</div>
          <div className="text-4xl font-bold mb-8">{formatCurrency(balance)}</div>
          
          <div className="flex gap-4">
            <div className="flex-1 bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 text-indigo-100 text-xs mb-1">
                <ArrowDownCircle size={14} className="text-green-300"/> Income
              </div>
              <div className="text-xl font-bold text-green-300">{formatCurrency(totalIncome)}</div>
            </div>
            <div className="flex-1 bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 text-indigo-100 text-xs mb-1">
                <ArrowUpCircle size={14} className="text-red-300"/> Expense
              </div>
              <div className="text-xl font-bold text-red-300">{formatCurrency(totalExpense)}</div>
            </div>
          </div>
        </div>
        {/* Decorative Circles */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/30 rounded-full blur-2xl"></div>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <button 
          onClick={openBudgetModal}
          className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors flex flex-col items-center gap-2 group"
        >
          <div className="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Target size={20} />
          </div>
          <span className="font-semibold text-gray-700 dark:text-gray-200 text-sm text-center">Set Budgets</span>
        </button>
        <button 
          onClick={() => setIsSplitOpen(true)}
          className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors flex flex-col items-center gap-2 group"
        >
          <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Users size={20} />
          </div>
          <span className="font-semibold text-gray-700 dark:text-gray-200 text-sm text-center">Split Bill</span>
        </button>
        <button 
          onClick={handleExportPDF}
          className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors flex flex-col items-center gap-2 group"
        >
          <div className="w-12 h-12 rounded-full bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Download size={20} />
          </div>
          <span className="font-semibold text-gray-700 dark:text-gray-200 text-sm text-center">Export Report</span>
        </button>
      </div>

      {/* Monthly Budgets Section */}
      {budgetData.length > 0 && (
         <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-8 animate-fade-in">
            <div className="flex items-center gap-2 mb-6">
                <Target size={20} className="text-purple-500" />
                <h3 className="font-bold text-lg text-gray-800 dark:text-white">Budget Goals</h3>
            </div>
            <div className="space-y-4">
                {budgetData.map(item => (
                    <div key={item.cat}>
                        <div className="flex justify-between text-xs mb-2">
                            <span className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <item.icon size={12} className={item.color.split(' ')[0]} /> {item.name}
                            </span>
                            <span className={`font-bold ${item.isOver ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'}`}>
                                {formatCurrency(item.spent)} <span className="text-gray-400 font-normal">/ {formatCurrency(item.limit)}</span>
                            </span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                            <div 
                                className={`h-full rounded-full transition-all duration-1000 ${item.barColor}`} 
                                style={{ width: `${item.percent}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>
         </div>
      )}

      {/* Monthly Overview Chart */}
      {chartData.length > 0 && (
         <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-8">
            <div className="flex items-center gap-2 mb-6">
                <BarChart3 size={20} className="text-gray-500" />
                <h3 className="font-bold text-lg text-gray-800 dark:text-white">Spending Breakdown</h3>
            </div>
            <div className="space-y-4">
                {chartData.map(item => (
                    <div key={item.key}>
                        <div className="flex justify-between text-xs mb-2">
                            <span className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <item.icon size={12} className={item.color.split(' ')[0]} /> {item.name}
                            </span>
                            <span className="font-bold text-gray-800 dark:text-white">{formatCurrency(item.amount)}</span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                            <div 
                                className={`h-full rounded-full transition-all duration-1000 ${item.barColor}`} 
                                style={{ width: `${item.percentage}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>
         </div>
      )}

      {/* Recent Transactions */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-xl text-gray-800 dark:text-white">Recent Activity</h3>
        </div>

        <div className="space-y-4">
          {transactions.length === 0 && (
            <div className="text-center py-10 opacity-50">
               <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                 <Wallet size={24} className="text-gray-400"/>
               </div>
               <p className="text-gray-500">No transactions yet</p>
            </div>
          )}
          
          {transactions.map(txn => {
            const isExpense = txn.type === 'expense' || !txn.type;
            const catInfo = CATEGORIES[txn.category] || CATEGORIES['other'];
            const Icon = catInfo.icon;
            
            return (
              <div key={txn.id} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-colors group">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg ${catInfo.color}`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 dark:text-white text-sm">{txn.desc || catInfo.name}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(txn.date).toLocaleDateString()} • {catInfo.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-bold ${isExpense ? 'text-red-500' : 'text-green-500'}`}>
                    {isExpense ? '-' : '+'}{formatCurrency(txn.amount)}
                  </div>
                  <button onClick={() => deleteTransaction(txn.id)} className="text-xs text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Add Button */}
      <button 
        onClick={() => setIsAddOpen(true)}
        className="fixed bottom-24 right-6 md:bottom-10 md:right-10 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg shadow-indigo-600/30 flex items-center justify-center hover:scale-110 transition-transform z-40"
      >
        <Plus size={28} />
      </button>

      {/* --- ADD TRANSACTION MODAL --- */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-3xl p-6 animate-fade-in shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">New Transaction</h2>
              <button onClick={() => setIsAddOpen(false)} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-500 hover:bg-gray-200">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              {/* Type Toggle */}
              <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl mb-6">
                <button
                  type="button"
                  onClick={() => { setFormType('expense'); setSelectedCat('food'); }}
                  className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${formType === 'expense' ? 'bg-white dark:bg-gray-600 text-red-500 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => { setFormType('income'); setSelectedCat('salary'); }}
                  className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${formType === 'income' ? 'bg-white dark:bg-gray-600 text-green-500 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
                >
                  Income
                </button>
              </div>

              {/* Amount */}
              <div className="mb-6">
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">₹</span>
                  <input 
                    type="number" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl py-4 pl-10 pr-4 text-xl font-bold text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    autoFocus
                  />
                </div>
              </div>

              {/* Category Grid */}
              <div className="mb-6">
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Category</label>
                <div className="grid grid-cols-4 gap-3">
                  {(formType === 'expense' ? EXPENSE_CATS : INCOME_CATS).map(catKey => {
                    const cat = CATEGORIES[catKey];
                    const Icon = cat.icon;
                    const isSelected = selectedCat === catKey;
                    return (
                      <button
                        key={catKey}
                        type="button"
                        onClick={() => setSelectedCat(catKey)}
                        className={`flex flex-col items-center gap-2 p-2 rounded-xl transition-all ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/30 ring-2 ring-indigo-500' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isSelected ? 'bg-indigo-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                          <Icon size={18} />
                        </div>
                        <span className={`text-[10px] font-medium ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500'}`}>{cat.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Note */}
              <div className="mb-6">
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Note</label>
                <input 
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="What's this for?"
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-sm text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-transform active:scale-95">
                Save Transaction
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- BUDGET SETTINGS MODAL --- */}
      {isBudgetOpen && (
         <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-3xl p-6 animate-fade-in shadow-2xl max-h-[85vh] flex flex-col">
               <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                     <Target className="text-purple-500"/> Monthly Budgets
                  </h2>
                  <button onClick={() => setIsBudgetOpen(false)} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-500 hover:bg-gray-200">
                     <X size={20} />
                  </button>
               </div>
               
               <p className="text-sm text-gray-500 mb-6">Set spending limits for each category. Set to 0 to disable tracking.</p>

               <form onSubmit={saveBudgets} className="flex-1 overflow-y-auto pr-2 space-y-4">
                  {EXPENSE_CATS.map(catKey => {
                     const cat = CATEGORIES[catKey];
                     return (
                        <div key={catKey} className="flex items-center gap-4 p-3 border border-gray-100 dark:border-gray-700 rounded-xl">
                           <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${cat.color}`}>
                              <cat.icon size={18} />
                           </div>
                           <div className="flex-1">
                              <div className="text-sm font-bold text-gray-800 dark:text-white">{cat.name}</div>
                              <div className="text-xs text-gray-500">Monthly Limit</div>
                           </div>
                           <div className="w-24 relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₹</span>
                              <input 
                                 type="number"
                                 value={tempBudgets[catKey] || ''}
                                 onChange={(e) => handleBudgetChange(catKey, e.target.value)}
                                 placeholder="0"
                                 className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg py-2 pl-6 pr-2 text-sm font-bold text-right outline-none focus:ring-2 focus:ring-purple-500 dark:text-white"
                              />
                           </div>
                        </div>
                     )
                  })}
                  <div className="pt-4 sticky bottom-0 bg-white dark:bg-gray-800">
                     <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-purple-200 dark:shadow-none">
                        Save Budgets
                     </button>
                  </div>
               </form>
            </div>
         </div>
      )}

      {/* --- SPLIT BILL MODAL --- */}
      {isSplitOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
           <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-3xl p-6 animate-fade-in shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Split Bill</h2>
                <button onClick={() => setIsSplitOpen(false)} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-500 hover:bg-gray-200">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4 mb-8">
                 <div>
                   <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Total Amount</label>
                   <input 
                      type="number" 
                      value={splitTotal}
                      onChange={(e) => setSplitTotal(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 font-bold text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="0"
                   />
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">People</label>
                   <input 
                      type="number" 
                      value={splitPeople}
                      onChange={(e) => setSplitPeople(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 font-bold text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="1"
                   />
                 </div>
              </div>

              <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl p-6 text-center mb-6">
                 <div className="text-gray-500 dark:text-indigo-200 text-xs font-bold uppercase mb-1">Per Person</div>
                 <div className="text-4xl font-black text-indigo-600 dark:text-indigo-400">{formatCurrency(splitResult)}</div>
              </div>

              <button onClick={() => setIsSplitOpen(false)} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl">Done</button>
           </div>
        </div>
      )}

    </div>
  );
};