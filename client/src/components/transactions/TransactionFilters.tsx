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
import { FiSearch, FiX } from 'react-icons/fi';
import { Pump } from '../../services/api';

interface TransactionFiltersProps {
  showFilters: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filterDateFrom: string;
  onDateFromChange: (value: string) => void;
  filterDateTo: string;
  onDateToChange: (value: string) => void;
  filterPump: string;
  onPumpChange: (value: string) => void;
  allPumps: Pump[];
  filteredCount: number;
  onClearFilters: () => void;
  getTodayDate: () => string;
}

export const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  showFilters,
  onClose,
  searchQuery,
  onSearchChange,
  filterDateFrom,
  onDateFromChange,
  filterDateTo,
  onDateToChange,
  filterPump,
  onPumpChange,
  allPumps,
  filteredCount,
  onClearFilters,
  getTodayDate,
}) => {
  if (!showFilters) return null;

  const hasActiveFilters = searchQuery || filterDateFrom || filterDateTo || (filterPump && filterPump !== 'all');

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

        {/* Date Range */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="dateFrom">ពីថ្ងៃ</Label>
            <Input
              id="dateFrom"
              type="date"
              value={filterDateFrom}
              onChange={(e) => onDateFromChange(e.target.value)}
              max={getTodayDate()}
              className="h-11 md:h-10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dateTo">ដល់ថ្ងៃ</Label>
            <Input
              id="dateTo"
              type="date"
              value={filterDateTo}
              onChange={(e) => onDateToChange(e.target.value)}
              max={getTodayDate()}
              min={filterDateFrom}
              className="h-11 md:h-10"
            />
          </div>
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

