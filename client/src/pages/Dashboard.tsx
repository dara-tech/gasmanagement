import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { dashboardAPI, DashboardStats } from '../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { FiDollarSign, FiTrendingUp, FiCalendar, FiClock, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { FuelDropletIcon, ReceiptIcon } from '../components/icons';
import { LazyCalendar } from '../components/LazyCalendar';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'>('daily');
  const [customDateRange, setCustomDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [showAllTimeStats, setShowAllTimeStats] = useState(false);
  const [showRecentTransactions, setShowRecentTransactions] = useState(false);
  const [showPeriodFilter, setShowPeriodFilter] = useState(false);

  // Use ref to prevent unnecessary re-fetches
  const isFetchingRef = useRef(false);

  const fetchStats = useCallback(async () => {
    // Prevent concurrent fetches
    if (isFetchingRef.current) return;
    
    try {
      isFetchingRef.current = true;
      setLoading(true);
      let customFrom: string | undefined;
      let customTo: string | undefined;
      
      if (period === 'custom' && customDateRange.from && customDateRange.to) {
        customFrom = customDateRange.from.toISOString().split('T')[0];
        customTo = customDateRange.to.toISOString().split('T')[0];
      }
      
      const data = await dashboardAPI.getStats(period, customFrom, customTo);
      
      // Simplified normalization
      if (data) {
        setStats({
          period: data.period || { total: 0, profit: 0, transactions: 0, liters: 0 },
          allTime: data.allTime || { total: 0, profit: 0, transactions: 0, liters: 0 },
          recentTransactions: (data.recentTransactions || []).slice(0, 10), // Limit to 10 on backend data
          periodType: data.periodType || period || 'daily',
          dateRange: data.dateRange || {
            from: new Date().toISOString(),
            to: new Date().toISOString()
          }
        });
      } else {
        setStats(null);
      }
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      setStats(null);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [period, customDateRange]);

  useEffect(() => {
    // Only fetch if not custom period or if custom period has both dates
    if (period !== 'custom' || (customDateRange.from && customDateRange.to)) {
      fetchStats();
    }
  }, [period, customDateRange, fetchStats]);

  // Memoize formatters to avoid recreating on every render
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('km-KH', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }, []);

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }, []);

  const getPeriodLabel = useMemo(() => {
    switch (period) {
      case 'daily':
        return 'ថ្ងៃនេះ';
      case 'weekly':
        return 'សប្តាហ៍នេះ';
      case 'monthly':
        return 'ខែនេះ';
      case 'yearly':
        return 'ឆ្នាំនេះ';
      case 'custom':
        if (customDateRange.from && customDateRange.to) {
          const fromStr = formatDate(customDateRange.from.toISOString());
          const toStr = formatDate(customDateRange.to.toISOString());
          return `${fromStr} - ${toStr}`;
        }
        return 'ជ្រើសរើសថ្ងៃ';
      default:
        return 'ថ្ងៃនេះ';
    }
  }, [period, customDateRange, formatDate]);

  // Show skeleton/loading state inline instead of blocking
  const isLoading = loading && !stats;

  // Memoize formatted recent transactions to avoid re-formatting on every render
  const formattedRecentTransactions = useMemo(() => {
    if (!stats?.recentTransactions || stats.recentTransactions.length === 0) {
      return [];
    }
    
    return stats.recentTransactions.slice(0, 10).map((transaction) => {
      const date = new Date(transaction.date);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const formattedDate = `${day}/${month}/${year} ${hours}:${minutes}`;
      
      return {
        ...transaction,
        formattedDate,
        formattedTotal: formatCurrency(transaction.total),
        formattedProfit: transaction.profit !== undefined ? formatCurrency(transaction.profit) : null,
      };
    });
  }, [stats?.recentTransactions, formatCurrency]);

  // Show error state if no stats after loading
  if (!loading && !stats) {
    return (
      <div className="p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>មិនមានទិន្នន័យ</CardTitle>
            <CardDescription>
              សូមពិនិត្យការតភ្ជាប់ឬសូមព្យាយាមម្តងទៀត
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => fetchStats()} className="w-full sm:w-auto">
              សាកល្បងម្តងទៀត
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Period Filter Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base md:text-lg">រយៈពេល</CardTitle>
              <CardDescription className="text-sm">ជ្រើសរើសរយៈពេលដើម្បីមើលស្ថិតិ</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPeriodFilter(!showPeriodFilter)}
              className="h-8 w-8 p-0"
            >
              {/* @ts-ignore */}
              {showPeriodFilter ? <FiChevronUp className="h-4 w-4" /> : <FiChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        {showPeriodFilter && (
        <CardContent className="space-y-4">
          {/* Period Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Button
              variant={period === 'daily' ? 'default' : 'outline'}
              onClick={() => {
                setPeriod('daily');
                setCustomDateRange({});
              }}
              className="h-11 md:h-10 text-sm"
            >
              {/* @ts-ignore */}
              <FiCalendar className="mr-2 h-4 w-4" />
              ថ្ងៃនេះ
            </Button>
            <Button
              variant={period === 'weekly' ? 'default' : 'outline'}
              onClick={() => {
                setPeriod('weekly');
                setCustomDateRange({});
              }}
              className="h-11 md:h-10 text-sm"
            >
              {/* @ts-ignore */}
              <FiCalendar className="mr-2 h-4 w-4" />
              សប្តាហ៍នេះ
            </Button>
            <Button
              variant={period === 'monthly' ? 'default' : 'outline'}
              onClick={() => {
                setPeriod('monthly');
                setCustomDateRange({});
              }}
              className="h-11 md:h-10 text-sm"
            >
              {/* @ts-ignore */}
              <FiCalendar className="mr-2 h-4 w-4" />
              ខែនេះ
            </Button>
            <Button
              variant={period === 'yearly' ? 'default' : 'outline'}
              onClick={() => {
                setPeriod('yearly');
                setCustomDateRange({});
              }}
              className="h-11 md:h-10 text-sm"
            >
              {/* @ts-ignore */}
              <FiCalendar className="mr-2 h-4 w-4" />
              ឆ្នាំនេះ
            </Button>
          </div>

          {/* Custom Date Range */}
          <div className="space-y-2">
            <Button
              variant={period === 'custom' ? 'default' : 'outline'}
              onClick={() => setPeriod('custom')}
              className="w-full h-11 md:h-10 text-sm"
            >
              {/* @ts-ignore */}
              <FiCalendar className="mr-2 h-4 w-4" />
              ជ្រើសរើសថ្ងៃផ្ទាល់ខ្លួន
            </Button>
            {period === 'custom' && (
              <div className="pt-2">
                <Label className="text-sm md:text-base mb-2 block">ជ្រើសរើសថ្ងៃ</Label>
                <div className="flex justify-center">
                  <LazyCalendar
                    mode="range"
                    selected={{
                      from: customDateRange.from,
                      to: customDateRange.to,
                    }}
                    onSelect={(range: { from?: Date; to?: Date } | undefined) => {
                      setCustomDateRange({
                        from: range?.from,
                        to: range?.to,
                      });
                    }}
                    numberOfMonths={1}
                    className="rounded-md border"
                  />
                </div>
                {customDateRange.from && customDateRange.to && (
                  <div className="mt-3 p-3 bg-muted rounded-md text-sm">
                    <div className="flex items-center gap-2">
                      {/* @ts-ignore */}
                      <FiClock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">ពី:</span>
                      <span className="font-medium">{formatDate(customDateRange.from.toISOString())}</span>
                      <span className="text-muted-foreground ml-2">ដល់:</span>
                      <span className="font-medium">{formatDate(customDateRange.to.toISOString())}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Period Info */}
          {period !== 'custom' && (
            <div className="p-3 bg-muted rounded-md text-sm">
              <div className="flex items-center gap-2">
                {/* @ts-ignore */}
                <FiClock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {period === 'daily' && 'ថ្ងៃនេះ'}
                  {period === 'weekly' && 'សប្តាហ៍នេះ (ច័ន្ទ - អាទិត្យ)'}
                  {period === 'monthly' && 'ខែនេះ'}
                  {period === 'yearly' && 'ឆ្នាំនេះ'}
                </span>
              </div>
            </div>
          )}
        </CardContent>
        )}
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Revenue Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ចំណូល</CardTitle>
            {/* @ts-ignore */}
            <FiDollarSign className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-7 w-24 bg-muted animate-pulse rounded" />
                <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                <div className="h-4 w-20 bg-muted animate-pulse rounded" />
              </div>
            ) : (
              <>
                <div className="text-xl md:text-2xl font-bold">{formatCurrency(stats?.period?.total || 0)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {getPeriodLabel}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.period?.transactions || 0} ព័ត៌មាន
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Profit Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ចំណេញ</CardTitle>
            {/* @ts-ignore */}
            <FiTrendingUp className={`h-4 w-4 md:h-5 md:w-5 ${(stats?.period?.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`} />
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-7 w-24 bg-muted animate-pulse rounded" />
                <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                <div className="h-4 w-28 bg-muted animate-pulse rounded" />
              </div>
            ) : (
              <>
                <div className={`text-xl md:text-2xl font-bold ${(stats?.period?.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(stats?.period?.profit || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {getPeriodLabel}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {(stats?.period?.total || 0) > 0 
                    ? `កម្រិតចំណេញ: ${(((stats?.period?.profit || 0) / (stats?.period?.total || 1)) * 100).toFixed(1)}%`
                    : 'មិនមានកម្រិតចំណេញ'
                  }
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Liters Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">បរិមាណសាំង</CardTitle>
            <FuelDropletIcon className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-7 w-20 bg-muted animate-pulse rounded" />
                <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                <div className="h-4 w-16 bg-muted animate-pulse rounded" />
              </div>
            ) : (
              <>
                <div className="text-xl md:text-2xl font-bold">{(stats?.period?.liters || 0).toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {getPeriodLabel}
                </p>
                <p className="text-xs text-muted-foreground mt-1">លីត្រ</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Transactions Count Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ចំនួនព័ត៌មាន</CardTitle>
            <ReceiptIcon className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-7 w-16 bg-muted animate-pulse rounded" />
                <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              </div>
            ) : (
              <>
                <div className="text-xl md:text-2xl font-bold">{stats?.period?.transactions || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {getPeriodLabel}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  សរុប: {stats?.allTime?.transactions || 0}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* All-Time Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base md:text-lg">ស្ថិតិសរុប (ទាំងអស់)</CardTitle>
              <CardDescription className="text-sm">ស្ថិតិសរុបពីពេលចាប់ផ្តើម</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllTimeStats(!showAllTimeStats)}
              className="h-8 w-8 p-0"
            >
              {/* @ts-ignore */}
              {showAllTimeStats ? <FiChevronUp className="h-4 w-4" /> : <FiChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        {showAllTimeStats && (
        <CardContent>
          {isLoading ? (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-1">
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                  <div className="h-6 w-32 bg-muted animate-pulse rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">ចំណូលសរុប</p>
                <p className="text-lg md:text-xl font-bold">{formatCurrency(stats?.allTime?.total || 0)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">ចំណេញសរុប</p>
                <p className={`text-lg md:text-xl font-bold ${(stats?.allTime?.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(stats?.allTime?.profit || 0)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">បរិមាណសរុប</p>
                <p className="text-lg md:text-xl font-bold">{(stats?.allTime?.liters || 0).toFixed(2)} លីត្រ</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">ចំនួនព័ត៌មាន</p>
                <p className="text-lg md:text-xl font-bold">{stats?.allTime?.transactions || 0}</p>
              </div>
            </div>
          )}
        </CardContent>
        )}
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base md:text-lg">ព័ត៌មានថ្មីៗ</CardTitle>
              <CardDescription className="text-sm">
                ព័ត៌មានលក់{period === 'daily' ? 'ថ្ងៃនេះ' : `សម្រាប់${getPeriodLabel}`}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRecentTransactions(!showRecentTransactions)}
              className="h-8 w-8 p-0"
            >
              {/* @ts-ignore */}
              {showRecentTransactions ? <FiChevronUp className="h-4 w-4" /> : <FiChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        {showRecentTransactions && (
        <CardContent className="p-4 md:p-6">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-3 border rounded-lg animate-pulse">
                  <div className="h-5 w-48 bg-muted rounded mb-2" />
                  <div className="h-4 w-32 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : formattedRecentTransactions.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">មិនមានព័ត៌មាន</p>
          ) : (
            <div className="space-y-2">
              {formattedRecentTransactions.map((transaction) => (
                <div
                  key={transaction._id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm md:text-base truncate">
                      ស្តុកសាំង {typeof transaction.pumpId === 'object' ? transaction.pumpId.pumpNumber : ''} - {typeof transaction.fuelTypeId === 'object' ? transaction.fuelTypeId.name : ''}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <p className="text-xs md:text-sm text-muted-foreground">
                        {transaction.liters} លីត្រ
                      </p>
                      {transaction.formattedProfit !== null && transaction.profit !== undefined && (
                        <p className={`text-xs md:text-sm font-medium ${transaction.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ចំណេញ: {transaction.formattedProfit}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-left sm:text-right w-full sm:w-auto shrink-0">
                    <p className="font-bold text-base md:text-lg">{transaction.formattedTotal}</p>
                    <p className="text-xs text-muted-foreground">
                      {transaction.formattedDate}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        )}
      </Card>
    </div>
  );
};

export default Dashboard;
