import React, { useEffect, useState, Suspense, useMemo, useRef, useCallback } from 'react';
import { transactionsAPI, pumpsAPI, Transaction, Pump } from '../services/api';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useToast } from '../hooks/use-toast';
import { FiSearch, FiFileText, FiTrash2, FiCalendar } from 'react-icons/fi';
import { ReceiptIcon, FuelPumpIcon } from '../components/icons';
import { createLazyComponent } from '../utils/lazyLoad';
import { InlineLoading, LoadingFallback } from '../components/LoadingFallback';
import { Pagination } from '../components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { getExchangeRate, usdToRiel } from '../utils/currency';

// Eagerly load critical components (always needed)
import { DailyTransactionGroup } from '../components/transactions';

// Lazy load only dialogs and optional components
const TransactionFilters = createLazyComponent(() => import('../components/transactions').then(m => ({ default: m.TransactionFilters })), 'TransactionFilters');
const TransactionDialog = createLazyComponent(() => import('../components/transactions').then(m => ({ default: m.TransactionDialog })), 'TransactionDialog');
const DeleteTransactionDialog = createLazyComponent(() => import('../components/transactions').then(m => ({ default: m.DeleteTransactionDialog })), 'DeleteTransactionDialog');
const ReportDialog = createLazyComponent(() => import('../components/transactions').then(m => ({ default: m.ReportDialog })), 'ReportDialog');
const PrintPreviewDialog = createLazyComponent(() => import('../components/transactions').then(m => ({ default: m.PrintPreviewDialog })), 'PrintPreviewDialog');

const calculateMetrics = (transactions: Transaction[]) => {
  const totalSales = transactions.reduce((sum, t) => sum + t.total, 0);
  const totalProfit = transactions.reduce((sum, t) => sum + (t.profit || 0), 0);
  const totalLiters = transactions.reduce((sum, t) => sum + t.liters, 0);
  const totalDiscounts = transactions.reduce((sum, t) => sum + (t.discount || 0), 0);
  const totalCost = transactions.reduce((sum, t) => sum + ((t.priceIn || 0) * t.liters), 0);
  const transactionCount = transactions.length;
  const avgTransactionValue = transactionCount > 0 ? totalSales / transactionCount : 0;
  const profitMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;

  return {
    totalSales,
    totalProfit,
    totalLiters,
    totalDiscounts,
    totalCost,
    transactionCount,
    avgTransactionValue,
    profitMargin,
  };
};

type MetricsSummary = ReturnType<typeof calculateMetrics>;

const Transactions: React.FC = () => {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pumps, setPumps] = useState<Pump[]>([]);
  const [allPumps, setAllPumps] = useState<Pump[]>([]);
  const [loading, setLoading] = useState(true);
  const [pumpsLoaded, setPumpsLoaded] = useState(false); // Track if pumps are already loaded
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [pagination, setPagination] = useState<{ page: number; limit: number; total: number; totalPages: number; hasMore: boolean } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportPeriod, setReportPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'>('daily');
  const [reportDateRange, setReportDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewHTML, setPreviewHTML] = useState('');
  const [pendingPDFGeneration, setPendingPDFGeneration] = useState<(() => void) | null>(null);
  
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'>('monthly');
  const nowRef = useRef(new Date());
  const [selectedYear, setSelectedYear] = useState(nowRef.current.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(nowRef.current.getMonth());

  const monthOptions = useMemo(
    () => [
      { value: 0, label: 'មករា' },
      { value: 1, label: 'កុម្ភៈ' },
      { value: 2, label: 'មីនា' },
      { value: 3, label: 'មេសា' },
      { value: 4, label: 'ឧសភា' },
      { value: 5, label: 'មិថុនា' },
      { value: 6, label: 'កក្កដា' },
      { value: 7, label: 'សីហា' },
      { value: 8, label: 'កញ្ញា' },
      { value: 9, label: 'តុលា' },
      { value: 10, label: 'វិច្ឆិកា' },
      { value: 11, label: 'ធ្នូ' },
    ],
    []
  );

  const yearOptions = useMemo(() => {
    const currentYear = nowRef.current.getFullYear();
    const years: number[] = [];
    for (let offset = 0; offset < 6; offset += 1) {
      years.push(currentYear - offset);
    }
    if (!years.includes(selectedYear)) {
      years.unshift(selectedYear);
    }
    const uniqueYears: number[] = [];
    years.forEach((year) => {
      if (!uniqueYears.includes(year)) {
        uniqueYears.push(year);
      }
    });
    return uniqueYears.sort((a, b) => b - a);
  }, [selectedYear]);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [customDateRange, setCustomDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [filterPump, setFilterPump] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Bulk selection states
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  // Currency state
  const [currency, setCurrency] = useState<'USD' | 'KHR'>(() => {
    const saved = localStorage.getItem('transactionCurrency');
    return (saved === 'KHR' || saved === 'USD') ? saved : 'USD';
  });

  // Save currency preference to localStorage
  useEffect(() => {
    localStorage.setItem('transactionCurrency', currency);
  }, [currency]);

  useEffect(() => {
    fetchData(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset and fetch data when filters change
  useEffect(() => {
    // Only fetch if not custom period or if custom period has both dates
    if (period !== 'custom' || (customDateRange.from && customDateRange.to)) {
      setCurrentPage(1);
      fetchData(1);
      // Clear selection when filters change
      setSelectedIds(new Set());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, customDateRange, filterPump, selectedMonth, selectedYear]);

  // Fetch data when page or items per page changes
  useEffect(() => {
    if (currentPage > 0) {
      fetchData(currentPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage]);

  const fetchData = async (page: number = 1) => {
    try {
      setLoading(true);

      if (period === 'custom' && (!customDateRange.from || !customDateRange.to)) {
        setLoading(false);
        return;
      }

      const filters: { startDate?: string; endDate?: string; pumpId?: string } = {};
      let startDate: Date | null = null;
      let endDate: Date | null = null;

      if (period === 'custom') {
        if (customDateRange.from && customDateRange.to) {
          startDate = new Date(customDateRange.from);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(customDateRange.to);
          endDate.setHours(23, 59, 59, 999);
        }
      } else if (period === 'monthly') {
        startDate = new Date(selectedYear, selectedMonth, 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(selectedYear, selectedMonth + 1, 0);
        endDate.setHours(23, 59, 59, 999);
      } else if (period === 'yearly') {
        startDate = new Date(selectedYear, 0, 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(selectedYear, 11, 31);
        endDate.setHours(23, 59, 59, 999);
      } else {
        const range = getDateRange(period);
        startDate = range.startDate;
        startDate.setHours(0, 0, 0, 0);
        endDate = range.endDate;
        endDate.setHours(23, 59, 59, 999);
      }

      if (startDate && endDate) {
        filters.startDate = startDate.toISOString().split('T')[0];
        filters.endDate = endDate.toISOString().split('T')[0];
      }
      
      if (filterPump && filterPump !== 'all') filters.pumpId = filterPump;

      // Fetch transactions and pumps in parallel for better performance
      // Only fetch pumps if not already loaded (cache pumps data)
      const promises: [Promise<any>, Promise<any> | null] = [
        transactionsAPI.getPaginated(page, itemsPerPage, filters),
        (page === 1 && !pumpsLoaded) ? pumpsAPI.getAll() : Promise.resolve(null)
      ];

      const [response, pumpsData] = await Promise.all(promises);
      
      // Ensure response has the expected structure
      if (!response || !response.transactions) {
        console.error('Invalid API response:', response);
        setTransactions([]);
        toast({
          variant: 'destructive',
          title: 'កំហុស',
          description: 'ទម្រង់ទិន្នន័យមិនត្រឹមត្រូវ',
        });
        return;
      }
      
      setTransactions(response.transactions || []);
      setPagination(response.pagination || null);

      // Set pumps data if fetched (only on page 1 and not already loaded)
      if (page === 1 && pumpsData && !pumpsLoaded) {
        try {
          setAllPumps(Array.isArray(pumpsData) ? pumpsData : []);
          setPumps((Array.isArray(pumpsData) ? pumpsData : []).filter(p => p.status === 'active'));
          setPumpsLoaded(true); // Mark pumps as loaded
        } catch (pumpError) {
          console.error('Error processing pumps:', pumpError);
          // Don't block the transactions display if pumps fail to load
        }
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'មានកំហុសក្នុងការទាញព័ត៌មាន';
      toast({
        variant: 'destructive',
        title: 'កំហុស',
        description: errorMessage,
      });
      // Ensure transactions is always an array, even on error
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const handlePeriodModeChange = (value: string) => {
    if (value === 'custom') {
      setPeriod('custom');
      setShowFilters(true);
      return;
    }

    const typedValue = value as 'monthly' | 'yearly';
    setPeriod(typedValue);
    setCustomDateRange({});

    // Ensure month defaults to current when switching back to monthly
    if (typedValue === 'monthly') {
      setSelectedMonth((prev) => (Number.isInteger(prev) ? prev : nowRef.current.getMonth()));
    }
  };

  const handleQuickAction = (action: 'thisMonth' | 'thisYear' | 'lastMonth' | 'lastYear') => {
    const now = new Date();
    if (action === 'thisMonth') {
      setPeriod('monthly');
      setSelectedMonth(now.getMonth());
      setSelectedYear(now.getFullYear());
    } else if (action === 'thisYear') {
      setPeriod('yearly');
      setSelectedYear(now.getFullYear());
    } else if (action === 'lastMonth') {
      setPeriod('monthly');
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      setSelectedMonth(lastMonth.getMonth());
      setSelectedYear(lastMonth.getFullYear());
    } else if (action === 'lastYear') {
      setPeriod('yearly');
      setSelectedYear(now.getFullYear() - 1);
    }
  };

  const handleOpenDialog = (transaction?: Transaction) => {
    setEditingTransaction(transaction || null);
    setDialogOpen(true);
  };

  const handleDialogSuccess = (transactionDate?: string, createdTransaction?: Transaction) => {
    // If we have the created transaction, add it to the list immediately
    // This ensures it shows up right away without waiting for a refresh
    if (createdTransaction) {
      setTransactions(prev => {
        // Check if transaction already exists (shouldn't, but just in case)
        const exists = prev.some(t => t._id === createdTransaction._id);
        if (exists) {
          return prev;
        }
        // Add to the beginning of the list and sort by date (newest first)
        const updated = [createdTransaction, ...prev].sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        return updated;
      });
      
      // Update pagination total
      setPagination(prev => prev ? { ...prev, total: prev.total + 1 } : null);
    } else {
      // If no transaction provided (e.g., update), just refresh
    setCurrentPage(1);
    fetchData(1);
    }
  };

  const handleDeleteClick = (id: string) => {
    setTransactionToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!transactionToDelete) return;
    
    // Find the transaction to delete for optimistic update
    const transaction = transactions.find(t => t._id === transactionToDelete);
    
    // Optimistic update: Remove from list immediately
    if (transaction) {
      setTransactions(prev => prev.filter(t => t._id !== transactionToDelete));
      setPagination(prev => prev ? { ...prev, total: Math.max(0, prev.total - 1) } : null);
      // Remove from selected if it was selected
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(transactionToDelete);
        return newSet;
      });
    }
    
    setDeleteDialogOpen(false);
    const transactionIdToDelete = transactionToDelete;
    setTransactionToDelete(null);
    
    try {
      await transactionsAPI.delete(transactionIdToDelete);
      // Refresh to get accurate data
      await fetchData(currentPage);
      toast({
        variant: 'success',
        title: 'ជោគជ័យ',
        description: 'លុបព័ត៌មានដោយជោគជ័យ',
      });
    } catch (error) {
      console.error('Error deleting transaction:', error);
      // Revert optimistic update on error
      if (transaction) {
        setTransactions(prev => [...prev, transaction].sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        ));
        setPagination(prev => prev ? { ...prev, total: prev.total + 1 } : null);
        // Restore selection if it was selected
        setSelectedIds(prev => {
          const newSet = new Set(prev);
          newSet.add(transactionIdToDelete);
          return newSet;
        });
      }
      toast({
        variant: 'destructive',
        title: 'កំហុស',
        description: 'មានកំហុសក្នុងការលុប',
      });
    }
  };

  // Handle selection change
  const handleSelectionChange = (id: string, selected: boolean) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  // Handle select all in a group
  const handleSelectAll = (selected: boolean, transactionIds: string[]) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (selected) {
        transactionIds.forEach(id => newSet.add(id));
      } else {
        transactionIds.forEach(id => newSet.delete(id));
      }
      return newSet;
    });
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    const idsToDelete = Array.from(selectedIds);
    const transactionsToDelete = transactions.filter(t => idsToDelete.includes(t._id));
    
    // Optimistic update: Remove selected transactions from list immediately
    setTransactions(prev => prev.filter(t => !idsToDelete.includes(t._id)));
    setPagination(prev => prev ? { 
      ...prev, 
      total: Math.max(0, prev.total - idsToDelete.length) 
    } : null);
    
    // Clear selection and close dialog
    setSelectedIds(new Set());
    setBulkDeleteDialogOpen(false);
    
    try {
      // Delete all selected transactions
      await Promise.all(idsToDelete.map(id => transactionsAPI.delete(id)));
      
      // Refresh data to get accurate state
      setCurrentPage(1);
      await fetchData(1);
      
      toast({
        variant: 'success',
        title: 'ជោគជ័យ',
        description: `លុបព័ត៌មាន ${idsToDelete.length} ដោយជោគជ័យ`,
      });
    } catch (error) {
      console.error('Error bulk deleting transactions:', error);
      // Revert optimistic update on error
      setTransactions(prev => [...prev, ...transactionsToDelete].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      ));
      setPagination(prev => prev ? { 
        ...prev, 
        total: prev.total + idsToDelete.length 
      } : null);
      // Restore selection
      setSelectedIds(new Set(idsToDelete));
      toast({
        variant: 'destructive',
        title: 'កំហុស',
        description: 'មានកំហុសក្នុងការលុប',
      });
    }
  };

  const formatCurrency = (amount: number) => {
    if (currency === 'KHR') {
      const rate = getExchangeRate();
      const rielAmount = usdToRiel(amount, rate);
      // Format with thousand separators
      const formatted = rielAmount.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      return `៛${formatted}`;
    }
    return new Intl.NumberFormat('km-KH', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatLiters = (amount: number) => {
    return amount.toLocaleString('km-KH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('km-KH', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Filter transactions
  const filteredTransactions = (transactions || []).filter((transaction) => {
    const pump = typeof transaction.pumpId === 'object' ? transaction.pumpId : null;
    const fuelType = typeof transaction.fuelTypeId === 'object' ? transaction.fuelTypeId : null;
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesPump = pump?.pumpNumber?.toLowerCase().includes(query);
      const matchesFuelType = fuelType?.name?.toLowerCase().includes(query);
      const matchesLiters = transaction.liters.toString().includes(query);
      const matchesTotal = transaction.total.toString().includes(query);
      if (!matchesPump && !matchesFuelType && !matchesLiters && !matchesTotal) {
        return false;
      }
    }
    
    // Date range filter - filter is now handled by API, but keep client-side for search
    // The API already filters by date range, so this is mainly for search results
    
    // Pump filter
    if (filterPump && filterPump !== 'all' && pump?._id !== filterPump) {
      return false;
    }
    
    return true;
  });

  const pumpSummaries = useMemo(() => {
    type Summary = {
      pumpId: string;
      pumpNumber: string;
      fuelName: string;
      totalLiters: number;
      totalSales: number;
      totalProfit: number;
      totalDiscount: number;
      transactionCount: number;
    };

    const map = new Map<string, Summary>();

    filteredTransactions.forEach((transaction) => {
      const pumpRef = typeof transaction.pumpId === 'object' ? transaction.pumpId : null;
      const pumpId = pumpRef?._id || (typeof transaction.pumpId === 'string' ? transaction.pumpId : '');
      if (!pumpId) return;

      const pumpInfo = pumpRef || allPumps.find((p) => p._id === pumpId);
      const fuelInfo = typeof transaction.fuelTypeId === 'object' ? transaction.fuelTypeId : (typeof pumpInfo?.fuelTypeId === 'object' ? pumpInfo.fuelTypeId : null);

      if (!map.has(pumpId)) {
        map.set(pumpId, {
          pumpId,
          pumpNumber: pumpInfo?.pumpNumber || pumpId,
          fuelName: fuelInfo?.name || '—',
          totalLiters: 0,
          totalSales: 0,
          totalProfit: 0,
          totalDiscount: 0,
          transactionCount: 0,
        });
      }

      const summary = map.get(pumpId)!;
      summary.totalLiters += transaction.liters;
      summary.totalSales += transaction.total;
      summary.totalProfit += transaction.profit || 0;
      summary.totalDiscount += transaction.discount || 0;
      summary.transactionCount += 1;
    });

    return Array.from(map.values()).sort((a, b) => a.pumpNumber.localeCompare(b.pumpNumber, 'km-KH', { numeric: true }));
  }, [filteredTransactions, allPumps]);

  const pumpSummaryTotals = useMemo(() => {
    return pumpSummaries.reduce(
      (acc, item) => {
        acc.totalLiters += item.totalLiters;
        acc.totalSales += item.totalSales;
        acc.totalProfit += item.totalProfit;
        acc.totalDiscount += item.totalDiscount;
        acc.transactionCount += item.transactionCount;
        return acc;
      },
      { totalLiters: 0, totalSales: 0, totalProfit: 0, totalDiscount: 0, transactionCount: 0 }
    );
  }, [pumpSummaries]);

  const periodSelectValue = period === 'monthly' || period === 'yearly' ? period : 'custom';

  // Group transactions by date for better organization
  const groupedTransactions = filteredTransactions.reduce((acc, transaction) => {
    const dateKey = formatDateShort(transaction.date);
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(transaction);
    return acc;
  }, {} as Record<string, Transaction[]>);

  // Calculate daily totals
  const calculateDailyTotal = (transactions: Transaction[]) => {
    return transactions.reduce((sum, t) => sum + t.total, 0);
  };

  const calculateDailyLiters = (transactions: Transaction[]) => {
    return transactions.reduce((sum, t) => sum + t.liters, 0);
  };

  const calculateDailyPurchasePrice = (transactions: Transaction[]) => {
    return transactions.reduce((sum, t) => sum + ((t.priceIn || 0) * t.liters), 0);
  };

  const calculateDailySellingPrice = (transactions: Transaction[]) => {
    return transactions.reduce((sum, t) => sum + ((t.priceOut || t.price || 0) * t.liters), 0);
  };

  const calculateDailyDiscount = (transactions: Transaction[]) => {
    return transactions.reduce((sum, t) => sum + (t.discount || 0), 0);
  };

  const calculateDailyProfit = (transactions: Transaction[]) => {
    return transactions.reduce((sum, t) => sum + (t.profit || 0), 0);
  };

  // Get date range for report period
  const getDateRange = (period: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom') => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let startDate: Date;
    let endDate: Date = new Date(today);
    endDate.setHours(23, 59, 59, 999);
    
    switch (period) {
      case 'daily':
        // Today only
        startDate = new Date(today);
        break;
      case 'weekly':
        // Current week: Monday to Sunday
        const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to Monday = 0
        startDate = new Date(today);
        startDate.setDate(today.getDate() - daysToMonday);
        // End date is Sunday of current week
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'monthly':
        // Current month: 1st to last day of current month
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'yearly':
        // Current year: January 1st to December 31st
        startDate = new Date(today.getFullYear(), 0, 1);
        endDate = new Date(today.getFullYear(), 11, 31);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'custom':
        // For custom, dates will be provided separately
        startDate = new Date(today);
        break;
      default:
        startDate = new Date(today);
    }
    
    return { startDate, endDate };
  };

  const getTransactionsForPeriod = useCallback(
    async (
      period: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom',
      customRange?: { from?: Date; to?: Date },
      pumpFilter?: string
    ) => {
    let startDate: Date;
    let endDate: Date;
    
    if (period === 'custom' && customRange) {
      startDate = customRange.from || new Date();
      startDate.setHours(0, 0, 0, 0);
      endDate = customRange.to || new Date();
      endDate.setHours(23, 59, 59, 999);
    } else {
      const range = getDateRange(period);
      startDate = range.startDate;
      endDate = range.endDate;
    }
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    try {
      let allPeriodTransactions: Transaction[] = [];
      let currentPage = 1;
      let hasMore = true;
      
      while (hasMore) {
        const response = await transactionsAPI.getPaginated(currentPage, 1000, {
          startDate: startDateStr,
            endDate: endDateStr,
            ...(pumpFilter ? { pumpId: pumpFilter } : {}),
        });
        
        allPeriodTransactions = [...allPeriodTransactions, ...response.transactions];
        hasMore = response.pagination.hasMore;
        currentPage++;
      }
      
      return allPeriodTransactions;
    } catch (error) {
      console.error('Error fetching transactions for report:', error);
        return (transactions || []).filter((t) => {
        const transactionDate = new Date(t.date);
          if (pumpFilter && typeof t.pumpId === 'object' && t.pumpId._id && t.pumpId._id !== pumpFilter) {
            return false;
          }
          if (pumpFilter && typeof t.pumpId === 'string' && t.pumpId !== pumpFilter) {
            return false;
          }
        return transactionDate >= startDate && transactionDate <= endDate;
      });
    }
    },
    [transactions]
  );

  // Generate and export report
  const generateReport = async () => {
    const periodTransactions = await getTransactionsForPeriod(reportPeriod, reportDateRange);
    
    if (periodTransactions.length === 0) {
      const periodLabels = {
        daily: 'ថ្ងៃនេះ',
        weekly: 'សប្តាហ៍នេះ',
        monthly: 'ខែនេះ',
        yearly: 'ឆ្នាំនេះ',
        custom: 'រយៈពេលដែលអ្នកជ្រើស'
      };
      toast({
        variant: 'destructive',
        title: 'មិនមានទិន្នន័យ',
        description: `មិនមានព័ត៌មានសម្រាប់រយៈពេល${periodLabels[reportPeriod]}`,
      });
      return;
    }

    const metrics = calculateMetrics(periodTransactions);
    
    let startDate: Date;
    let endDate: Date;
    
    if (reportPeriod === 'custom' && reportDateRange.from && reportDateRange.to) {
      startDate = new Date(reportDateRange.from);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(reportDateRange.to);
      endDate.setHours(23, 59, 59, 999);
    } else {
      const range = getDateRange(reportPeriod);
      startDate = range.startDate;
      endDate = range.endDate;
    }
    
    // Format period name
    const periodNames = {
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      yearly: 'Yearly',
      custom: 'Custom'
    };
    
    const periodLabels = {
      daily: 'ថ្ងៃនេះ',
      weekly: 'សប្តាហ៍នេះ',
      monthly: 'ខែនេះ',
      yearly: 'ឆ្នាំនេះ',
      custom: 'ផ្ទាល់ខ្លួន'
    };

    // Create CSV content with summary and detailed transactions
    const summaryRows = [
      ['រយៈពេល', `${periodNames[reportPeriod]} Report (${periodLabels[reportPeriod]})`],
      ['ចាប់ពីដល់', `${formatDateShort(startDate.toISOString())} - ${formatDateShort(endDate.toISOString())}`],
      ['', ''],
      ['សង្ខេប', ''],
      ['ចំនួនព័ត៌មាន', metrics.transactionCount.toString()],
      ['សរុបលក់', `$${metrics.totalSales.toFixed(2)}`],
      ['សរុបទិញ', `$${metrics.totalCost.toFixed(2)}`],
      ['សរុបចំណេញ', `$${metrics.totalProfit.toFixed(2)}`],
      ['ចំណេញ%', `${metrics.profitMargin.toFixed(2)}%`],
      ['សរុបលីត្រ', `${metrics.totalLiters.toFixed(2)} L`],
      ['សរុបបញ្ចុះ', `$${metrics.totalDiscounts.toFixed(2)}`],
      ['មធ្យម', `$${metrics.avgTransactionValue.toFixed(2)}`],
      ['', ''],
      ['ព័ត៌មានលម្អិត', ''],
    ];

    // Transaction details
    const transactionHeaders = [
      'ថ្ងៃ',
      'ម៉ោង',
      'ស្តុក',
      'ប្រភេទ',
      'លីត្រ',
      'តម្លៃទិញ',
      'តម្លៃលក់',
      'បញ្ចុះតម្លៃ',
      'ចំណេញ',
      'សរុប'
    ];

    const transactionRows = periodTransactions
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((t) => {
        const pump = typeof t.pumpId === 'object' ? t.pumpId : null;
        const fuelType = typeof t.fuelTypeId === 'object' ? t.fuelTypeId : null;
        return [
          formatDateShort(t.date),
          formatTime(t.date),
          pump?.pumpNumber || 'N/A',
          fuelType?.name || 'N/A',
          t.liters.toFixed(2),
          `$${(t.priceIn || 0).toFixed(2)}`,
          `$${(t.priceOut || t.price || 0).toFixed(2)}`,
          `$${(t.discount || 0).toFixed(2)}`,
          `$${(t.profit || 0).toFixed(2)}`,
          `$${t.total.toFixed(2)}`,
        ];
      });

    // Combine all rows
    const csvContent = [
      ...summaryRows.map(row => row.join(',')),
      transactionHeaders.join(','),
      ...transactionRows.map(row => row.join(',')),
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `Report_${periodNames[reportPeriod]}_${dateStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: 'ជោគជ័យ',
      description: `របាយការណ៍${periodLabels[reportPeriod]}ត្រូវបាននាំចេញដោយជោគជ័យ`,
    });
  };

  // Generate PDF Report Preview
  const generatePDFReportPreview = async () => {
    const periodTransactions = await getTransactionsForPeriod(reportPeriod, reportDateRange);
    
    if (periodTransactions.length === 0) {
      const periodLabels = {
        daily: 'ថ្ងៃនេះ',
        weekly: 'សប្តាហ៍នេះ',
        monthly: 'ខែនេះ',
        yearly: 'ឆ្នាំនេះ',
        custom: 'រយៈពេលដែលអ្នកជ្រើស'
      };
      toast({
        variant: 'destructive',
        title: 'មិនមានទិន្នន័យ',
        description: `មិនមានព័ត៌មានសម្រាប់រយៈពេល${periodLabels[reportPeriod]}`,
      });
      return;
    }

    const metrics = calculateMetrics(periodTransactions);
    
    let startDate: Date;
    let endDate: Date;
    
    if (reportPeriod === 'custom' && reportDateRange.from && reportDateRange.to) {
      startDate = new Date(reportDateRange.from);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(reportDateRange.to);
      endDate.setHours(23, 59, 59, 999);
    } else {
      const range = getDateRange(reportPeriod);
      startDate = range.startDate;
      endDate = range.endDate;
    }
    
    const periodLabels = {
      daily: 'ថ្ងៃនេះ',
      weekly: 'សប្តាហ៍នេះ',
      monthly: 'ខែនេះ',
      yearly: 'ឆ្នាំនេះ',
      custom: 'ផ្ទាល់ខ្លួន'
    };

    // Create HTML report for proper Unicode support
    const sortedTransactions = periodTransactions
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const reportHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Kantumruy+Pro:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&display=swap');
            
            * { 
              margin: 0; 
              padding: 0; 
              box-sizing: border-box; 
              font-family: 'Kantumruy Pro', 'Arial', sans-serif !important;
            }
            
            body { 
              font-family: 'Kantumruy Pro', 'Arial', sans-serif !important; 
              padding: 20mm 18mm;
              background: #ffffff;
              color: #1a1a1a;
              font-size: 11pt;
              line-height: 1.6;
              letter-spacing: 0.01em;
              min-height: 100vh;
            }
            
            .header { 
              border-bottom: 3px solid #1a1a1a;
              padding: 20px 0 18px 0;
              margin-bottom: 24px;
              text-align: center;
            }
            
            .header h1 { 
              font-size: 24pt; 
              margin-bottom: 6px; 
              font-weight: 700; 
              color: #1a1a1a;
              letter-spacing: -0.02em;
              line-height: 1.2;
            }
            
            .header h2 { 
              font-size: 14pt; 
              font-weight: 400; 
              color: #4a5568;
              letter-spacing: 0.02em;
            }
            
            .info-section { 
              padding: 16px 0; 
              margin-bottom: 20px;
              border-bottom: 1px solid #e2e8f0;
            }
            
            .info-section p { 
              margin: 6px 0; 
              font-size: 10pt;
              color: #4a5568;
              line-height: 1.5;
            }
            
            .info-section strong {
              font-weight: 600;
              color: #1a1a1a;
            }
            
            .summary { 
              padding: 20px 0;
              margin: 24px 0;
              border-top: 2px solid #e2e8f0;
              border-bottom: 2px solid #e2e8f0;
              background: #f8fafc;
            }
            
            .summary h3 { 
              font-size: 16pt; 
              margin-bottom: 16px;
              font-weight: 700;
              color: #1a1a1a;
              letter-spacing: -0.01em;
            }
            
            .summary-grid { 
              display: grid; 
              grid-template-columns: repeat(4, 1fr); 
              gap: 16px;
            }
            
            .summary-item { 
              padding: 10px 0;
              border-bottom: 1px solid #e2e8f0;
            }
            
            .summary-item:last-child {
              border-bottom: none;
            }
            
            .summary-label { 
              font-size: 9pt; 
              color: #64748b; 
              margin-bottom: 4px;
              font-weight: 500;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            
            .summary-value { 
              font-size: 14pt; 
              font-weight: 700; 
              color: #1a1a1a;
              letter-spacing: -0.01em;
            }
            
            .table-container { 
              margin-top: 28px;
              overflow-x: auto;
            }
            
            table { 
              width: 100%; 
              border-collapse: separate;
              border-spacing: 0;
              background: white;
              border: 1px solid #e2e8f0;
              border-radius: 4px;
              overflow: hidden;
            }
            
            thead { 
              background: #1a1a1a;
              color: white;
            }
            
            th { 
              padding: 12px 10px; 
              text-align: left;
              font-weight: 600;
              font-size: 9pt;
              border-right: 1px solid rgba(255, 255, 255, 0.1);
              text-transform: uppercase;
              letter-spacing: 0.05em;
              line-height: 1.4;
            }
            
            th:last-child {
              border-right: none;
            }
            
            th.text-right { 
              text-align: right; 
            }
            
            tbody tr { 
              border-bottom: 1px solid #e2e8f0;
              transition: background-color 0.1s;
            }
            
            tbody tr:hover {
              background-color: #f8fafc;
            }
            
            tbody tr:last-child { 
              border-bottom: none;
            }
            
            td { 
              padding: 10px 10px; 
              font-size: 10pt;
              border-right: 1px solid #e2e8f0;
              color: #1a1a1a;
              line-height: 1.5;
            }
            
            td:last-child { 
              border-right: none;
            }
            
            td.text-right { 
              text-align: right; 
              font-variant-numeric: tabular-nums;
            }
            
            .footer { 
              margin-top: 32px;
              padding: 16px 0;
              text-align: center;
              color: #64748b;
              font-size: 9pt;
              border-top: 1px solid #e2e8f0;
            }
            
            @media print {
              body { 
                padding: 15mm 12mm; 
              }
              .header { 
                page-break-after: avoid; 
              }
              .summary { 
                page-break-after: avoid; 
              }
              table { 
                page-break-inside: auto; 
              }
              tr { 
                page-break-inside: avoid; 
              }
              .summary {
                background: #f8fafc !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>របាយការណ៍លក់សាំង</h1>
            <h2>របាយការណ៍${periodLabels[reportPeriod]}</h2>
          </div>
          
          <div class="info-section">
            <p><strong>ចាប់ពី:</strong> ${formatDateShort(startDate.toISOString())}</p>
            <p><strong>រហូតដល់:</strong> ${formatDateShort(endDate.toISOString())}</p>
            <p><strong>កាលបរិច្ឆេទបង្កើត:</strong> ${formatDateShort(new Date().toISOString())}</p>
          </div>
          
          <div class="summary">
            <h3>សង្ខេប</h3>
            <div class="summary-grid">
              <div class="summary-item">
                <div class="summary-label">ចំនួនព័ត៌មាន</div>
                <div class="summary-value">${metrics.transactionCount}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">សរុបលក់</div>
                <div class="summary-value">$${metrics.totalSales.toFixed(2)}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">សរុបទិញ</div>
                <div class="summary-value">$${metrics.totalCost.toFixed(2)}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">ចំណេញ</div>
                <div class="summary-value">$${metrics.totalProfit.toFixed(2)}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">ចំណេញ%</div>
                <div class="summary-value">${metrics.profitMargin.toFixed(2)}%</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">បរិមាណ</div>
                <div class="summary-value">${metrics.totalLiters.toFixed(2)} L</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">បញ្ចុះ</div>
                <div class="summary-value">$${metrics.totalDiscounts.toFixed(2)}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">មធ្យម</div>
                <div class="summary-value">$${metrics.avgTransactionValue.toFixed(2)}</div>
              </div>
            </div>
          </div>
          
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>ថ្ងៃ</th>
                  <th>ម៉ោង</th>
                  <th>ស្តុក</th>
                  <th>ប្រភេទ</th>
                  <th class="text-right">លីត្រ</th>
                  <th class="text-right">តម្លៃទិញ</th>
                  <th class="text-right">តម្លៃលក់</th>
                  <th class="text-right">បញ្ចុះតម្លៃ</th>
                  <th class="text-right">ចំណេញ</th>
                  <th class="text-right">សរុប</th>
                </tr>
              </thead>
              <tbody>
                ${sortedTransactions.map((transaction) => {
                  const pump = typeof transaction.pumpId === 'object' ? transaction.pumpId : null;
                  const fuelType = typeof transaction.fuelTypeId === 'object' ? transaction.fuelTypeId : null;
                  const profit = transaction.profit || 0;
                  return `
                    <tr>
                      <td>${formatDateShort(transaction.date)}</td>
                      <td>${formatTime(transaction.date)}</td>
                      <td>${pump?.pumpNumber || 'N/A'}</td>
                      <td>${fuelType?.name || 'N/A'}</td>
                      <td class="text-right">${transaction.liters.toFixed(2)}</td>
                      <td class="text-right">$${(transaction.priceIn || 0).toFixed(2)}</td>
                      <td class="text-right">$${(transaction.priceOut || transaction.price || 0).toFixed(2)}</td>
                      <td class="text-right">$${(transaction.discount || 0).toFixed(2)}</td>
                      <td class="text-right">$${profit.toFixed(2)}</td>
                      <td class="text-right">$${transaction.total.toFixed(2)}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} Gas Station Management System</p>
          </div>
        </body>
      </html>
    `;

    // Show preview dialog
    setPreviewHTML(reportHTML);
    setPreviewDialogOpen(true);
    
    // Store the print function for later use
    setPendingPDFGeneration(() => () => {
      printReport(reportHTML, periodLabels[reportPeriod]);
    });
  };

  // Print using browser's native print dialog
  const printReport = (reportHTML: string, periodLabel: string) => {
    try {
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast({
          variant: 'destructive',
          title: 'កំហុស',
          description: 'មិនអាចបើកបង្អួចបោះពុម្ពបានទេ។ សូមពិនិត្យការរឹតបន្តឹងបង្អួច។',
        });
        return;
      }

      // Write the HTML to the new window
      printWindow.document.write(reportHTML);
      printWindow.document.close();

      // Wait for content to load, then print
      const printWhenReady = () => {
        if (printWindow.document.readyState === 'complete') {
          setTimeout(() => {
            printWindow.focus();
            printWindow.print();
          }, 250);
        } else {
          printWindow.addEventListener('load', () => {
            setTimeout(() => {
              printWindow.focus();
              printWindow.print();
            }, 250);
          });
        }
      };

      printWhenReady();

      // Close preview dialog
      setPreviewDialogOpen(false);
      setPreviewHTML('');
      setPendingPDFGeneration(null);

      toast({
        variant: 'success',
        title: 'ជោគជ័យ',
        description: 'បង្អួចបោះពុម្ពត្រូវបានបើក',
      });
    } catch (error) {
      console.error('Error opening print window:', error);
      toast({
        variant: 'destructive',
        title: 'កំហុស',
        description: 'មានកំហុសក្នុងការបើកបង្អួចបោះពុម្ព',
      });
    }
  };

  // Handle preview confirmation - print using browser's native print dialog
  const handlePreviewConfirm = () => {
    if (pendingPDFGeneration) {
      pendingPDFGeneration();
    } else {
      // Fallback: print directly if no pending function
      printReport(previewHTML, '');
    }
  };

  // Handle preview cancel
  const handlePreviewCancel = () => {
    setPreviewDialogOpen(false);
    setPreviewHTML('');
    setPendingPDFGeneration(null);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setPeriod('monthly');
    setCustomDateRange({});
    setFilterPump('all');
    setSelectedYear(nowRef.current.getFullYear());
    setSelectedMonth(nowRef.current.getMonth());
  };

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  if (loading) {
    return <div className="p-4 md:p-6 min-h-screen flex items-center justify-center">
      <InlineLoading message="កំពុងផ្ទុកព័ត៌មានលក់..." />
    </div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 pb-24 md:pb-6">
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-3xl font-bold">ព័ត៌មានលក់</h1>
            <p className="text-xs md:text-base text-muted-foreground mt-0.5">គ្រប់គ្រងព័ត៌មានលក់សាំង</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs md:text-sm text-muted-foreground">រូបិយប៉ោយ</span>
          <Select value={currency} onValueChange={(value: 'USD' | 'KHR') => setCurrency(value)}>
            <SelectTrigger className="w-[100px] h-9 md:h-10 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD ($)</SelectItem>
              <SelectItem value="KHR">KHR (៛)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        </div>

        <Card className="bg-muted/30 border-dashed">
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {/* @ts-ignore */}
                <FiCalendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">ជ្រើសរយៈពេល</span>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground whitespace-nowrap">ប្រភេទ:</label>
                  <Select value={periodSelectValue} onValueChange={handlePeriodModeChange}>
                    <SelectTrigger className="w-[140px] h-9">
                      <SelectValue placeholder="ជ្រើសរយៈពេល" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">តាមខែ</SelectItem>
                      <SelectItem value="yearly">តាមឆ្នាំ</SelectItem>
                      <SelectItem value="custom">ផ្ទាល់ខ្លួន</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {periodSelectValue === 'monthly' && (
                  <>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-muted-foreground whitespace-nowrap">ខែ:</label>
                      <Select value={`${selectedMonth}`} onValueChange={(value) => setSelectedMonth(Number(value))}>
                        <SelectTrigger className="w-[160px] h-9">
                          <SelectValue placeholder="ជ្រើសខែ" />
                        </SelectTrigger>
                        <SelectContent>
                          {monthOptions.map((month) => (
                            <SelectItem key={month.value} value={`${month.value}`}>
                              {month.label} {selectedYear}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-muted-foreground whitespace-nowrap">ឆ្នាំ:</label>
                      <Select value={`${selectedYear}`} onValueChange={(value) => setSelectedYear(Number(value))}>
                        <SelectTrigger className="w-[120px] h-9">
                          <SelectValue placeholder="ឆ្នាំ" />
                        </SelectTrigger>
                        <SelectContent>
                          {yearOptions.map((year) => (
                            <SelectItem key={year} value={`${year}`}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {periodSelectValue === 'yearly' && (
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground whitespace-nowrap">ឆ្នាំ:</label>
                    <Select value={`${selectedYear}`} onValueChange={(value) => setSelectedYear(Number(value))}>
                      <SelectTrigger className="w-[120px] h-9">
                        <SelectValue placeholder="ជ្រើសឆ្នាំ" />
                      </SelectTrigger>
                      <SelectContent>
                        {yearOptions.map((year) => (
                          <SelectItem key={year} value={`${year}`}>
                            ឆ្នាំ {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex items-center gap-1 ml-auto">
                  <span className="text-xs text-muted-foreground mr-2">រហ័ស:</span>
                  <Button
                    size="sm"
                    variant={periodSelectValue === 'monthly' && selectedMonth === nowRef.current.getMonth() && selectedYear === nowRef.current.getFullYear() ? 'default' : 'outline'}
                    onClick={() => handleQuickAction('thisMonth')}
                    className="h-8 text-xs"
                  >
                    ខែនេះ
                  </Button>
                  <Button
                    size="sm"
                    variant={periodSelectValue === 'yearly' && selectedYear === nowRef.current.getFullYear() ? 'default' : 'outline'}
                    onClick={() => handleQuickAction('thisYear')}
                    className="h-8 text-xs"
                  >
                    ឆ្នាំនេះ
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleQuickAction('lastMonth')}
                    className="h-8 text-xs"
                  >
                    ខែមុន
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleQuickAction('lastYear')}
                    className="h-8 text-xs"
                  >
                    ឆ្នាំមុន
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:flex-1">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ស្វែងរកតាមស្តុក ប្រភេទ សរុប..."
                className="w-full sm:max-w-xs"
              />
              <Select value={filterPump} onValueChange={(value: string) => setFilterPump(value)}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="ស្តុកទាំងអស់" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ស្តុកទាំងអស់</SelectItem>
                  {allPumps.map((pump) => (
                    <SelectItem key={pump._id} value={pump._id}>
                      {pump.pumpNumber} {typeof pump.fuelTypeId === 'object' ? `- ${pump.fuelTypeId.name}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
          {selectedIds.size > 0 && (
            <>
              <Button
                variant="outline"
                onClick={() => setSelectedIds(new Set())}
                    className="h-9 md:h-10 text-xs md:text-sm"
              >
                លុបការជ្រើស
              </Button>
              <Button
                variant="destructive"
                onClick={() => setBulkDeleteDialogOpen(true)}
                    className="h-9 md:h-10 text-xs md:text-sm"
              >
                {/* @ts-ignore */}
                <FiTrash2 className="mr-2 h-4 w-4" />
                លុប ({selectedIds.size})
              </Button>
            </>
          )}
          <Button 
            variant="outline"
            onClick={() => setReportDialogOpen(true)}
                className="h-9 md:h-10 text-xs md:text-sm"
          >
            {/* @ts-ignore */}
            <FiFileText className="mr-2 h-4 w-4" />
                Report
          </Button>
          <Button 
            onClick={() => handleOpenDialog()} 
            disabled={pumps.length === 0} 
                className="h-9 md:h-10 text-xs md:text-sm"
          >
            <ReceiptIcon className="mr-2 h-4 w-4" />
                បន្ថែមព័ត៌មាន
          </Button>
        </div>
      </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
            <table className="min-w-full text-xs md:text-sm">
              <thead className="bg-muted/60">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">ស្តុកសាំង</th>
                  <th className="px-4 py-3 text-left font-semibold">ប្រភេទសាំង</th>
                  <th className="px-4 py-3 text-right font-semibold whitespace-nowrap">ចំនួនព័ត៌មាន</th>
                  <th className="px-4 py-3 text-right font-semibold whitespace-nowrap">បរិមាណ (លីត្រ)</th>
                  <th className="px-4 py-3 text-right font-semibold whitespace-nowrap">សរុបលក់</th>
                  <th className="px-4 py-3 text-right font-semibold whitespace-nowrap">បញ្ចុះតម្លៃ</th>
                  <th className="px-4 py-3 text-right font-semibold whitespace-nowrap">ចំណេញ</th>
                </tr>
              </thead>
              <tbody>
                {pumpSummaries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">
                      មិនមានទិន្នន័យសម្រាប់រយៈពេលនេះ
                    </td>
                  </tr>
                ) : (
                  pumpSummaries.map((summary) => (
                    <tr key={summary.pumpId} className="border-t">
                      <td className="px-4 py-3 font-medium">{summary.pumpNumber}</td>
                      <td className="px-4 py-3 text-muted-foreground">{summary.fuelName}</td>
                      <td className="px-4 py-3 text-right font-mono">{summary.transactionCount.toLocaleString('km-KH')}</td>
                      <td className="px-4 py-3 text-right font-mono">{`${formatLiters(summary.totalLiters)} L`}</td>
                      <td className="px-4 py-3 text-right font-mono font-semibold">{formatCurrency(summary.totalSales)}</td>
                      <td className="px-4 py-3 text-right font-mono">{summary.totalDiscount > 0 ? formatCurrency(summary.totalDiscount) : '—'}</td>
                      <td className={`px-4 py-3 text-right font-mono font-semibold ${summary.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(summary.totalProfit)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {pumpSummaries.length > 0 && (
                <tfoot className="bg-muted/40">
                  <tr className="font-semibold">
                    <td className="px-4 py-3" colSpan={2}>សរុបរួម</td>
                    <td className="px-4 py-3 text-right font-mono">{pumpSummaryTotals.transactionCount.toLocaleString('km-KH')}</td>
                    <td className="px-4 py-3 text-right font-mono">{`${formatLiters(pumpSummaryTotals.totalLiters)} L`}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatCurrency(pumpSummaryTotals.totalSales)}</td>
                    <td className="px-4 py-3 text-right font-mono">{pumpSummaryTotals.totalDiscount > 0 ? formatCurrency(pumpSummaryTotals.totalDiscount) : '—'}</td>
                    <td className={`px-4 py-3 text-right font-mono ${pumpSummaryTotals.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(pumpSummaryTotals.totalProfit)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filter Panel */}
      {showFilters && (
        <Suspense fallback={null}>
          <TransactionFilters
            showFilters={showFilters}
            onClose={() => setShowFilters(false)}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            period={period}
            onPeriodChange={handlePeriodModeChange}
            customDateRange={customDateRange}
            onCustomDateRangeChange={setCustomDateRange}
            filterPump={filterPump}
            onPumpChange={setFilterPump}
            allPumps={allPumps}
            filteredCount={filteredTransactions.length}
            onClearFilters={clearFilters}
            formatDate={formatDate}
          />
        </Suspense>
      )}

      {pumps.length === 0 && (
        <Card>
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <FuelPumpIcon className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm md:text-base">
                សូមបន្ថែមស្តុកសកម្មមុនពេលបន្ថែមព័ត៌មាន
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card >
   
        <CardContent className="p-0">
          {filteredTransactions.length === 0 ? (
            <div className="p-8 md:p-12 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <ReceiptIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm md:text-base font-medium">
                    {(transactions || []).length === 0 
                      ? 'មិនមានព័ត៌មាន' 
                      : 'មិនរកឃើញព័ត៌មានតាមតម្រង'}
                  </p>
                  {(transactions || []).length === 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      ចុចប៊ូតុង "បន្ថែមព័ត៌មាន" ដើម្បីចាប់ផ្តើម
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div>
              {Object.entries(groupedTransactions)
                .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
                .map(([date, dayTransactions]) => {
                  const dailyTotal = calculateDailyTotal(dayTransactions);
                  const dailyLiters = calculateDailyLiters(dayTransactions);
                  const dailyPurchasePrice = calculateDailyPurchasePrice(dayTransactions);
                  const dailySellingPrice = calculateDailySellingPrice(dayTransactions);
                  const dailyDiscount = calculateDailyDiscount(dayTransactions);
                  const dailyProfit = calculateDailyProfit(dayTransactions);
                  
                  const sortedTransactions = dayTransactions
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                  
                  return (
                    <DailyTransactionGroup
                      key={`${date}-${currency}`}
                      date={date}
                      transactions={sortedTransactions}
                      onEdit={handleOpenDialog}
                      onDelete={handleDeleteClick}
                      formatCurrency={formatCurrency}
                      dailyTotal={dailyTotal}
                      dailyLiters={dailyLiters}
                      dailyPurchasePrice={dailyPurchasePrice}
                      dailySellingPrice={dailySellingPrice}
                      dailyDiscount={dailyDiscount}
                      dailyProfit={dailyProfit}
                      selectedIds={selectedIds}
                      onSelectionChange={handleSelectionChange}
                      onSelectAll={(selected: boolean) => handleSelectAll(selected, sortedTransactions.map(t => t._id))}
                      currency={currency}
                    />
                  );
                })}
            </div>
          )}
          
          {/* Pagination */}
          {pagination !== null && pagination.totalPages > 1 && (
            <div className="border-t p-4 md:p-6">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
                itemsPerPageOptions={[25, 50, 100, 200]}
                showItemsPerPage={true}
                showFirstLast={true}
              />
            </div>
          )}
        </CardContent>
      </Card>
      </div>

      {dialogOpen && (
        <Suspense fallback={null}>
          <TransactionDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            editingTransaction={editingTransaction}
            pumps={pumps}
            allPumps={allPumps}
            onSuccess={handleDialogSuccess}
            getTodayDate={getTodayDate}
          />
        </Suspense>
      )}

      {deleteDialogOpen && (
        <Suspense fallback={null}>
          <DeleteTransactionDialog
            open={deleteDialogOpen}
            onOpenChange={(open) => {
              setDeleteDialogOpen(open);
              if (!open) setTransactionToDelete(null);
            }}
            onConfirm={handleDelete}
          />
        </Suspense>
      )}

      {/* Bulk Delete Dialog */}
      {bulkDeleteDialogOpen && (
        <Suspense fallback={<LoadingFallback message="កំពុងផ្ទុក..." />}>
          <DeleteTransactionDialog
            open={bulkDeleteDialogOpen}
            onOpenChange={(open) => {
              setBulkDeleteDialogOpen(open);
            }}
            onConfirm={handleBulkDelete}
            count={selectedIds.size}
          />
        </Suspense>
      )}

      {reportDialogOpen && (
        <Suspense fallback={null}>
          <ReportDialog
            open={reportDialogOpen}
            onOpenChange={setReportDialogOpen}
            reportPeriod={reportPeriod}
            onPeriodChange={(period) => {
              setReportPeriod(period);
              if (period !== 'custom') setReportDateRange({});
            }}
            reportDateRange={reportDateRange}
            onDateRangeChange={setReportDateRange}
            onGenerateCSV={generateReport}
            onGeneratePDF={generatePDFReportPreview}
            formatDateShort={formatDateShort}
          />
        </Suspense>
      )}

      {previewDialogOpen && (
        <Suspense fallback={null}>
          <PrintPreviewDialog
            open={previewDialogOpen}
            onOpenChange={setPreviewDialogOpen}
            reportHTML={previewHTML}
            onConfirm={handlePreviewConfirm}
            onCancel={handlePreviewCancel}
          />
        </Suspense>
      )}
    </div>
  );
};

export default Transactions;

