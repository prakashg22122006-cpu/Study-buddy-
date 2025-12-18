import React, { useState, useCallback, useMemo } from 'react';

/**
 * Types for Finance component
 */
interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: 'income' | 'expense' | 'investment';
  date: Date;
  tags: string[];
}

interface FinanceStats {
  totalIncome: number;
  totalExpense: number;
  totalInvestment: number;
  balance: number;
  expensePercentage: number;
}

interface FinanceContextType {
  transactions: Transaction[];
  stats: FinanceStats;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  removeTransaction: (id: string) => void;
  getTransactionsByCategory: (category: Transaction['category']) => Transaction[];
}

/**
 * Finance Component - Comprehensive financial management interface
 * Features:
 * - Transaction management (add, remove, view)
 * - Real-time statistics calculation
 * - Category-based filtering
 * - Tag system for better organization
 * - Production-ready with proper error handling
 */
export const Finance: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterCategory, setFilterCategory] = useState<Transaction['category'] | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [searchTerm, setSearchTerm] = useState('');

  /**
   * Calculate financial statistics
   */
  const stats = useMemo((): FinanceStats => {
    const income = transactions
      .filter(t => t.category === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = transactions
      .filter(t => t.category === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const investment = transactions
      .filter(t => t.category === 'investment')
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = income - expense - investment;
    const expensePercentage = income > 0 ? (expense / income) * 100 : 0;

    return {
      totalIncome: income,
      totalExpense: expense,
      totalInvestment: investment,
      balance,
      expensePercentage: Math.round(expensePercentage),
    };
  }, [transactions]);

  /**
   * Add a new transaction
   */
  const addTransaction = useCallback((transaction: Omit<Transaction, 'id'>) => {
    try {
      if (!transaction.description.trim()) {
        throw new Error('Description cannot be empty');
      }
      if (transaction.amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      const newTransaction: Transaction = {
        ...transaction,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      };

      setTransactions(prev => [...prev, newTransaction]);
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  }, []);

  /**
   * Remove a transaction by ID
   */
  const removeTransaction = useCallback((id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  }, []);

  /**
   * Get transactions filtered by category
   */
  const getTransactionsByCategory = useCallback(
    (category: Transaction['category']): Transaction[] => {
      return transactions.filter(t => t.category === category);
    },
    [transactions]
  );

  /**
   * Filter and sort transactions
   */
  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    // Apply category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(t => t.category === filterCategory);
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(
        t =>
          t.description.toLowerCase().includes(lowerSearch) ||
          t.tags.some(tag => tag.toLowerCase().includes(lowerSearch))
      );
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      return b.amount - a.amount;
    });
  }, [transactions, filterCategory, searchTerm, sortBy]);

  /**
   * Format currency for display
   */
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  /**
   * Format date for display
   */
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  /**
   * Get category color
   */
  const getCategoryColor = (category: Transaction['category']): string => {
    const colors: Record<Transaction['category'], string> = {
      income: 'text-green-600 bg-green-50',
      expense: 'text-red-600 bg-red-50',
      investment: 'text-blue-600 bg-blue-50',
    };
    return colors[category];
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Finance Manager</h1>
        <p className="text-gray-600">Manage your income, expenses, and investments</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard
          title="Total Income"
          amount={stats.totalIncome}
          color="bg-green-100 border-green-500"
          textColor="text-green-600"
          formatCurrency={formatCurrency}
        />
        <StatCard
          title="Total Expense"
          amount={stats.totalExpense}
          color="bg-red-100 border-red-500"
          textColor="text-red-600"
          formatCurrency={formatCurrency}
        />
        <StatCard
          title="Investments"
          amount={stats.totalInvestment}
          color="bg-blue-100 border-blue-500"
          textColor="text-blue-600"
          formatCurrency={formatCurrency}
        />
        <StatCard
          title="Balance"
          amount={stats.balance}
          color={stats.balance >= 0 ? 'bg-green-100 border-green-500' : 'bg-red-100 border-red-500'}
          textColor={stats.balance >= 0 ? 'text-green-600' : 'text-red-600'}
          formatCurrency={formatCurrency}
        />
        <StatCard
          title="Expense Ratio"
          amount={stats.expensePercentage}
          color="bg-purple-100 border-purple-500"
          textColor="text-purple-600"
          formatCurrency={(val) => `${val.toFixed(1)}%`}
        />
      </div>

      {/* Filters and Search */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Categories</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
          <option value="investment">Investment</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="date">Sort by Date</option>
          <option value="amount">Sort by Amount</option>
        </select>
      </div>

      {/* Transactions List */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Transactions</h2>
        {filteredTransactions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No transactions found</p>
        ) : (
          <div className="space-y-3">
            {filteredTransactions.map(transaction => (
              <TransactionItem
                key={transaction.id}
                transaction={transaction}
                onRemove={removeTransaction}
                getCategoryColor={getCategoryColor}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
              />
            ))}
          </div>
        )}
      </div>

      {/* Export Context for use in other components */}
      <FinanceContext.Provider
        value={{
          transactions,
          stats,
          addTransaction,
          removeTransaction,
          getTransactionsByCategory,
        }}
      >
        {/* Child components can access finance context */}
      </FinanceContext.Provider>
    </div>
  );
};

/**
 * StatCard Component
 */
interface StatCardProps {
  title: string;
  amount: number;
  color: string;
  textColor: string;
  formatCurrency: (val: number) => string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  amount,
  color,
  textColor,
  formatCurrency,
}) => (
  <div className={`${color} border-l-4 rounded-lg p-4`}>
    <p className="text-gray-600 text-sm font-semibold mb-1">{title}</p>
    <p className={`${textColor} text-2xl font-bold`}>{formatCurrency(amount)}</p>
  </div>
);

/**
 * TransactionItem Component
 */
interface TransactionItemProps {
  transaction: Transaction;
  onRemove: (id: string) => void;
  getCategoryColor: (category: Transaction['category']) => string;
  formatCurrency: (val: number) => string;
  formatDate: (date: Date) => string;
}

const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  onRemove,
  getCategoryColor,
  formatCurrency,
  formatDate,
}) => (
  <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
    <div className="flex-1">
      <div className="flex items-center gap-3 mb-2">
        <span
          className={`${getCategoryColor(
            transaction.category
          )} px-3 py-1 rounded-full text-xs font-semibold capitalize`}
        >
          {transaction.category}
        </span>
        <h3 className="font-semibold text-gray-800">{transaction.description}</h3>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500">{formatDate(transaction.date)}</span>
        {transaction.tags.length > 0 && (
          <div className="flex gap-2">
            {transaction.tags.map(tag => (
              <span
                key={tag}
                className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
    <div className="flex items-center gap-4">
      <span className="text-lg font-bold text-gray-800">
        {formatCurrency(transaction.amount)}
      </span>
      <button
        onClick={() => onRemove(transaction.id)}
        className="px-3 py-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        aria-label="Delete transaction"
      >
        ✕
      </button>
    </div>
  </div>
);

/**
 * Finance Context for global state management
 */
export const FinanceContext = React.createContext<FinanceContextType | undefined>(
  undefined
);

/**
 * Hook to use Finance context
 */
export const useFinance = (): FinanceContextType => {
  const context = React.useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within FinanceProvider');
  }
  return context;
};

export default Finance;
