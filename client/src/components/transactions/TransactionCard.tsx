import React from 'react';
import { Button } from '../ui/button';
import { FiMoreVertical } from 'react-icons/fi';
import { Transaction } from '../../services/api';
import { formatPriceDisplay } from '../../utils/currency';

interface TransactionCardProps {
  transaction: Transaction;
  onEdit: (transaction: Transaction) => void;
  formatCurrency: (amount: number) => string;
  selected?: boolean;
  onSelectionChange?: (id: string, selected: boolean) => void;
  currency?: 'USD' | 'KHR';
}

export const TransactionCard: React.FC<TransactionCardProps> = ({
  transaction,
  onEdit,
  formatCurrency,
  selected = false,
  onSelectionChange,
  currency = 'USD',
}) => {
  const pump = typeof transaction.pumpId === 'object' ? transaction.pumpId : null;
  const fuelType = typeof transaction.fuelTypeId === 'object' ? transaction.fuelTypeId : null;

  return (
    <div className={`p-4 active:bg-accent transition-colors border-b last:border-b-0 ${selected ? 'bg-primary/5' : ''}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        {onSelectionChange && (
          <div className="flex-shrink-0 pt-1">
            <input
              type="checkbox"
              checked={selected}
              onChange={(e) => onSelectionChange(transaction._id, e.target.checked)}
              className="h-4 w-4 cursor-pointer"
              aria-label={`ជ្រើសព័ត៌មាន ${pump?.pumpNumber || ''}`}
              title={`ជ្រើសព័ត៌មាន ${pump?.pumpNumber || ''}`}
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-base">{pump?.pumpNumber || 'N/A'}</span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-sm font-medium text-foreground">{fuelType?.name || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{transaction.liters.toFixed(2)} លីត្រ</span>
            <span>×</span>
            {(() => {
              const price = transaction.priceOut || transaction.price || 0;
              if (price > 0) {
                const { primary } = formatPriceDisplay(price, undefined, currency);
                return (
                  <span className="font-medium">{primary}</span>
                );
              }
              return <span className="font-medium">{currency === 'KHR' ? '៛0' : '$0.00'}</span>;
            })()}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-bold text-lg mb-1">{formatCurrency(transaction.total)}</p>
          {(transaction.profit || 0) !== 0 && (() => {
            const profit = transaction.profit || 0;
            const { primary } = formatPriceDisplay(profit, undefined, currency);
            return (
              <p className={`text-xs font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ចំណេញ: {primary}
              </p>
            );
          })()}
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-3 text-xs mb-3 pt-3 border-t bg-muted/30 rounded-md p-2">
        <div>
          <span className="block mb-1 text-muted-foreground">តម្លៃទិញ</span>
          {(() => {
            const price = transaction.priceIn || 0;
            if (price > 0) {
              const { primary } = formatPriceDisplay(price, undefined, currency);
              return (
                <span className="font-semibold text-foreground">{primary}</span>
              );
            }
            return <span className="font-semibold text-foreground">{currency === 'KHR' ? '៛0' : '$0.00'}</span>;
          })()}
        </div>
        <div>
          <span className="block mb-1 text-muted-foreground">បញ្ចុះ</span>
          {(() => {
            const discount = transaction.discount || 0;
            if (discount > 0) {
              const { primary } = formatPriceDisplay(discount, undefined, currency);
              return (
                <span className="font-semibold text-foreground">
                  {primary}
                  {transaction.discountType === 'percentage' && (
                    <span className="text-muted-foreground ml-1 font-normal">
                      ({((discount) / ((transaction.total || 0) + discount) * 100).toFixed(1)}%)
                    </span>
                  )}
                </span>
              );
            }
            return <span className="font-semibold text-foreground">{currency === 'KHR' ? '៛0' : '$0.00'}</span>;
          })()}
        </div>
        <div>
          <span className="block mb-1 text-muted-foreground">ចំណេញ</span>
          {(() => {
            const profit = transaction.profit || 0;
            if (profit !== 0) {
              const { primary } = formatPriceDisplay(profit, undefined, currency);
              return (
                <span className={`font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{primary}</span>
              );
            }
            return <span className="font-semibold text-foreground">{currency === 'KHR' ? '៛0' : '$0.00'}</span>;
          })()}
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => onEdit(transaction)}
          aria-label="កែប្រែ"
          title="កែប្រែ"
        >
          {/* @ts-ignore */}
          <FiMoreVertical className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

