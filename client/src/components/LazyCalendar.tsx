import React, { Suspense } from 'react';
import { createLazyComponent } from '../utils/lazyLoad';
import { InlineLoading } from './LoadingFallback';
import type { DayPickerProps } from 'react-day-picker';

// Lazy load the Calendar component
const Calendar = createLazyComponent(
  async () => {
    const module = await import('./ui/calendar');
    return { default: module.Calendar };
  },
  'Calendar'
);

// Define props interface that matches Calendar usage
interface LazyCalendarProps {
  fallback?: React.ReactNode;
  mode?: 'single' | 'multiple' | 'range';
  selected?: Date | Date[] | { from?: Date; to?: Date };
  onSelect?: (range: { from?: Date; to?: Date } | undefined) => void;
  [key: string]: any; // Allow other DayPicker props
}

/**
 * Lazy loaded Calendar component
 * Only loads when rendered, improving initial page load performance
 */
export const LazyCalendar: React.FC<LazyCalendarProps> = ({ 
  fallback = <InlineLoading message="កំពុងផ្ទុកប្រតិទិន..." />,
  onSelect,
  mode = 'range',
  ...props 
}) => {
  // Convert our custom onSelect to DayPicker's onSelect
  const dayPickerOnSelect = onSelect 
    ? (range: any) => {
        if (range && typeof range === 'object' && 'from' in range && 'to' in range) {
          onSelect({ from: range.from, to: range.to });
        } else {
          onSelect(undefined);
        }
      }
    : undefined;

  // Spread props first, then override with specific props
  // This ensures mode and onSelect are properly set
  // Use type assertion since DayPickerProps is a union type that changes based on mode
  return (
    <Suspense fallback={fallback}>
      <Calendar {...(props as any)} mode={mode} onSelect={dayPickerOnSelect} />
    </Suspense>
  );
};
