import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Calendar } from '../ui/calendar';
import { FiCalendar, FiClock, FiDownload, FiFile } from 'react-icons/fi';

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportPeriod: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  onPeriodChange: (period: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom') => void;
  reportDateRange: { from?: Date; to?: Date };
  onDateRangeChange: (range: { from?: Date; to?: Date }) => void;
  onGenerateCSV: () => void;
  onGeneratePDF: () => void;
  formatDateShort: (dateString: string) => string;
}

export const ReportDialog: React.FC<ReportDialogProps> = ({
  open,
  onOpenChange,
  reportPeriod,
  onPeriodChange,
  reportDateRange,
  onDateRangeChange,
  onGenerateCSV,
  onGeneratePDF,
  formatDateShort,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full md:max-w-lg mx-2 md:mx-auto overflow-hidden overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl">របាយការណ៍</DialogTitle>
          <DialogDescription className="text-xs md:text-sm mt-1">
            ជ្រើសរើសរយៈពេលដើម្បីបង្កើតរបាយការណ៍
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 overflow-y-auto flex-1 min-h-0">
          {/* Period Selection */}
          <div className="space-y-2">
            <Label className="text-sm md:text-base">រយៈពេល</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={reportPeriod === 'daily' ? 'default' : 'outline'}
                onClick={() => onPeriodChange('daily')}
                className="h-11 md:h-10 text-sm"
              >
                {/* @ts-ignore */}
                <FiCalendar className="mr-2 h-4 w-4" />
                ថ្ងៃនេះ
              </Button>
              <Button
                type="button"
                variant={reportPeriod === 'weekly' ? 'default' : 'outline'}
                onClick={() => onPeriodChange('weekly')}
                className="h-11 md:h-10 text-sm"
              >
                {/* @ts-ignore */}
                <FiCalendar className="mr-2 h-4 w-4" />
                សប្តាហ៍នេះ
              </Button>
              <Button
                type="button"
                variant={reportPeriod === 'monthly' ? 'default' : 'outline'}
                onClick={() => onPeriodChange('monthly')}
                className="h-11 md:h-10 text-sm"
              >
                {/* @ts-ignore */}
                <FiCalendar className="mr-2 h-4 w-4" />
                ខែនេះ
              </Button>
              <Button
                type="button"
                variant={reportPeriod === 'yearly' ? 'default' : 'outline'}
                onClick={() => onPeriodChange('yearly')}
                className="h-11 md:h-10 text-sm"
              >
                {/* @ts-ignore */}
                <FiCalendar className="mr-2 h-4 w-4" />
                ឆ្នាំនេះ
              </Button>
            </div>
          </div>

          {/* Custom Date Range */}
          <div className="space-y-2">
            <Button
              type="button"
              variant={reportPeriod === 'custom' ? 'default' : 'outline'}
              onClick={() => onPeriodChange('custom')}
              className="w-full h-11 md:h-10 text-sm"
            >
              {/* @ts-ignore */}
              <FiCalendar className="mr-2 h-4 w-4" />
              ជ្រើសរើសថ្ងៃផ្ទាល់ខ្លួន
            </Button>
            
            {reportPeriod === 'custom' && (
              <div className="pt-2">
                <Label className="text-sm md:text-base mb-2 block">ជ្រើសរើសថ្ងៃ</Label>
                <div className="w-full overflow-hidden h-[500px]">
                  <Calendar
                    mode="range"
                    selected={{
                      from: reportDateRange.from,
                      to: reportDateRange.to,
                    }}
                    onSelect={(range: { from?: Date; to?: Date } | undefined) => {
                      onDateRangeChange({
                        from: range?.from,
                        to: range?.to,
                      });
                    }}
                    numberOfMonths={1}
                    captionLayout="dropdown"
                    fromYear={2020}
                    toYear={new Date().getFullYear() + 1}
                    className="rounded-md border h-full w-full"
                  />
                </div>
                {reportDateRange.from && reportDateRange.to && (
                  <div className="mt-3 p-3 bg-muted rounded-md text-sm">
                    <div className="flex items-center gap-2">
                      {/* @ts-ignore */}
                      <FiClock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">ពី:</span>
                      <span className="font-medium">{formatDateShort(reportDateRange.from.toISOString())}</span>
                      <span className="text-muted-foreground ml-2">ដល់:</span>
                      <span className="font-medium">{formatDateShort(reportDateRange.to.toISOString())}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Period Info */}
          {reportPeriod !== 'custom' && (
            <div className="p-3 bg-muted rounded-md text-sm">
              <div className="flex items-center gap-2">
                {/* @ts-ignore */}
                <FiClock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {reportPeriod === 'daily' && 'ថ្ងៃនេះ'}
                  {reportPeriod === 'weekly' && 'សប្តាហ៍នេះ (ច័ន្ទ - អាទិត្យ)'}
                  {reportPeriod === 'monthly' && 'ខែនេះ'}
                  {reportPeriod === 'yearly' && 'ឆ្នាំនេះ'}
                </span>
              </div>
            </div>
          )}
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 mt-4 flex-shrink-0">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto h-11 md:h-10 text-sm md:text-base"
          >
            បោះបង់
          </Button>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              type="button"
              variant="outline"
              onClick={onGenerateCSV}
              disabled={reportPeriod === 'custom' && (!reportDateRange.from || !reportDateRange.to)}
              className="flex-1 sm:flex-none h-11 md:h-10 text-sm md:text-base"
            >
              {/* @ts-ignore */}
              <FiDownload className="mr-2 h-4 w-4" />
              CSV
            </Button>
            <Button 
              type="button"
              onClick={onGeneratePDF}
              disabled={reportPeriod === 'custom' && (!reportDateRange.from || !reportDateRange.to)}
              className="flex-1 sm:flex-none h-11 md:h-10 text-sm md:text-base"
            >
              {/* @ts-ignore */}
              <FiFile className="mr-2 h-4 w-4" />
              PDF
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

