import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Button } from '../ui/button';
import { FiMoreVertical } from 'react-icons/fi';
import { Transaction } from '../../services/api';
import { formatPriceDisplay } from '../../utils/currency';

interface TransactionTableProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  formatCurrency: (amount: number) => string;
  selectedIds?: Set<string>;
  onSelectionChange?: (id: string, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
  footer?: React.ReactNode;
  currency?: 'USD' | 'KHR';
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  onEdit,
  formatCurrency,
  selectedIds = new Set(),
  onSelectionChange,
  onSelectAll,
  footer,
  currency = 'USD',
}) => {
  const allSelected = transactions.length > 0 && transactions.every(t => selectedIds.has(t._id));
  const someSelected = transactions.some(t => selectedIds.has(t._id));

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[50px] text-center border-r">
            {onSelectAll && (
              <input
                type="checkbox"
                checked={allSelected}
                ref={(input) => {
                  if (input) input.indeterminate = someSelected && !allSelected;
                }}
                onChange={(e) => onSelectAll(e.target.checked)}
                className="h-4 w-4 cursor-pointer"
                aria-label="ជ្រើសទាំងអស់"
                title="ជ្រើសទាំងអស់"
              />
            )}
          </TableHead>
          <TableHead className="w-[100px] font-semibold border-r">ស្តុកសាំង</TableHead>
          <TableHead className="font-semibold border-r">ប្រភេទសាំង</TableHead>
          <TableHead className="text-right w-[130px] whitespace-nowrap font-semibold border-r">បរិមាណ (លីត្រ)</TableHead>
          <TableHead className="text-right w-[110px] whitespace-nowrap font-semibold border-r">តម្លៃទិញ</TableHead>
          <TableHead className="text-right w-[110px] whitespace-nowrap font-semibold border-r">តម្លៃលក់</TableHead>
          <TableHead className="text-right w-[120px] whitespace-nowrap font-semibold border-r">បញ្ចុះតម្លៃ</TableHead>
          <TableHead className="text-right w-[110px] whitespace-nowrap font-semibold border-r">ចំណេញ</TableHead>
          <TableHead className="text-right w-[120px] font-semibold border-r">សរុប</TableHead>
          <TableHead className="w-[60px] text-center font-semibold">សកម្មភាព</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((transaction) => {
          const pump = typeof transaction.pumpId === 'object' ? transaction.pumpId : null;
          const fuelType = typeof transaction.fuelTypeId === 'object' ? transaction.fuelTypeId : null;
          
          return (
            <TableRow key={transaction._id} className="hover:bg-muted/50">
              <TableCell className="text-center border-r py-3">
                {onSelectionChange && (
                  <input
                    type="checkbox"
                    checked={selectedIds.has(transaction._id)}
                    onChange={(e) => onSelectionChange(transaction._id, e.target.checked)}
                    className="h-4 w-4 cursor-pointer"
                    aria-label={`ជ្រើសព័ត៌មាន ${pump?.pumpNumber || ''}`}
                    title={`ជ្រើសព័ត៌មាន ${pump?.pumpNumber || ''}`}
                  />
                )}
              </TableCell>
              <TableCell className="font-medium py-3 border-r">
                {pump?.pumpNumber || 'N/A'}
              </TableCell>
              <TableCell className="py-3 border-r">{fuelType?.name || 'N/A'}</TableCell>
              <TableCell className="text-right font-mono py-3 border-r">
                {transaction.liters.toFixed(2)}
              </TableCell>
              <TableCell className="text-right font-mono py-3 text-muted-foreground border-r">
                {(() => {
                  const price = transaction.priceIn || 0;
                  if (price > 0) {
                    const { primary } = formatPriceDisplay(price, undefined, currency);
                    return <span>{primary}</span>;
                  }
                  return <span>{currency === 'KHR' ? '៛0' : '$0.00'}</span>;
                })()}
              </TableCell>
              <TableCell className="text-right font-mono py-3 border-r">
                {(() => {
                  const price = transaction.priceOut || transaction.price || 0;
                  if (price > 0) {
                    const { primary } = formatPriceDisplay(price, undefined, currency);
                    return <span>{primary}</span>;
                  }
                  return <span>{currency === 'KHR' ? '៛0' : '$0.00'}</span>;
                })()}
              </TableCell>
              <TableCell className="text-right font-mono py-3 border-r">
                {transaction.discount && transaction.discount > 0 ? (
                  <div className="flex flex-col items-end gap-0.5">
                    {(() => {
                      const { primary } = formatPriceDisplay(transaction.discount, undefined, currency);
                      return <span>{primary}</span>;
                    })()}
                    {transaction.discountType === 'percentage' && (
                      <span className="text-xs text-muted-foreground">
                        ({((transaction.discount || 0) / ((transaction.total || 0) + (transaction.discount || 0)) * 100).toFixed(1)}%)
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-muted-foreground">{currency === 'KHR' ? '៛0' : '$0.00'}</span>
                )}
              </TableCell>
              <TableCell className={`text-right font-mono py-3 font-semibold border-r ${(transaction.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(() => {
                  const profit = transaction.profit || 0;
                  if (profit !== 0) {
                    const { primary } = formatPriceDisplay(profit, undefined, currency);
                    return <span>{primary}</span>;
                  }
                  return <span>{currency === 'KHR' ? '៛0' : '$0.00'}</span>;
                })()}
              </TableCell>
              <TableCell className="text-right font-bold py-3 border-r">
                {formatCurrency(transaction.total)}
              </TableCell>
              <TableCell className="py-3">
                <div className="flex items-center justify-center">
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
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
      {footer && (
        <TableFooter>
          {footer}
        </TableFooter>
      )}
    </Table>
  );
};

