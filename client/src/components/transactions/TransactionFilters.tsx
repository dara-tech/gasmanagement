import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { FiSearch, FiX, FiCalendar, FiClock } from 'react-icons/fi';
import { Pump } from '../../services/api';
import { LazyCalendar } from '../LazyCalendar';

interface TransactionFiltersProps {
  showFilters: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  onPeriodChange: (period: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom') => void;
  customDateRange: { from?: Date; to?: Date };
  onCustomDateRangeChange: (range: { from?: Date; to?: Date }) => void;
  filterPump: string;
  onPumpChange: (value: string) => void;
  allPumps: Pump[];
  filteredCount: number;
  onClearFilters: () => void;
  formatDate: (dateString: string) => string;
}

export const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  showFilters,
  onClose,
  searchQuery,
  onSearchChange,
  period,
  onPeriodChange,
  customDateRange,
  onCustomDateRangeChange,
  filterPump,
  onPumpChange,
  allPumps,
  filteredCount,
  onClearFilters,
  formatDate,
}) => {
  if (!showFilters) return null;

  const hasActiveFilters = searchQuery || period !== 'daily' || (filterPump && filterPump !== 'all');

  return (
    <Card>
      <CardHeader className="p-4 md:p-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base md:text-lg">ស្វែងរក និង តម្រង</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            {/* @ts-ignore */}
            <FiX className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-6 space-y-4">
        {/* Search Input */}
        <div className="space-y-2">
          <Label htmlFor="search">ស្វែងរក</Label>
          <div className="relative">
            {/* @ts-ignore */}
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              type="text"
              placeholder="ស្វែងរកតាម ស្តុកសាំង, ប្រភេទសាំង, លីត្រ..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 h-11 md:h-10"
            />
          </div>
        </div>

        {/* Period Filter Section */}
        <div className="space-y-4">
          <Label className="text-base">រយៈពេល</Label>
          
          {/* Period Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Button
              variant={period === 'daily' ? 'default' : 'outline'}
              onClick={() => {
                onPeriodChange('daily');
                onCustomDateRangeChange({});
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
                onPeriodChange('weekly');
                onCustomDateRangeChange({});
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
                onPeriodChange('monthly');
                onCustomDateRangeChange({});
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
                onPeriodChange('yearly');
                onCustomDateRangeChange({});
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
              onClick={() => onPeriodChange('custom')}
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
                      onCustomDateRangeChange({
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
        </div>

        {/* Pump Filter */}
        <div className="space-y-2">
          <Label htmlFor="filterPump">ស្តុកសាំង</Label>
          <Select
            value={filterPump}
            onValueChange={onPumpChange}
          >
            <SelectTrigger id="filterPump" className="h-11 md:h-10">
              <SelectValue placeholder="ជ្រើសស្តុកសាំង (ទាំងអស់)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ទាំងអស់</SelectItem>
              {allPumps.map((pump) => (
                <SelectItem key={pump._id} value={pump._id}>
                  {pump.pumpNumber}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filter Summary and Clear */}
        <div className="flex items-center justify-between pt-2 border-t">
          <p className="text-sm text-muted-foreground">
            រកឃើញ: <span className="font-bold text-foreground">{filteredCount}</span> ព័ត៌មាន
          </p>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
              className="h-9"
            >
              {/* @ts-ignore */}
              <FiX className="mr-2 h-3.5 w-3.5" />
              លុបតម្រង
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
