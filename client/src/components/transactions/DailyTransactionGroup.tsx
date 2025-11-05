import React from 'react';
import { Transaction } from '../../services/api';
import { TransactionTable } from './TransactionTable';
import { TransactionCard } from './TransactionCard';
import { TableRow, TableCell } from '../ui/table';

interface DailyTransactionGroupProps {
  date: string;
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  formatCurrency: (amount: number) => string;
  dailyTotal: number;
  dailyLiters: number;
  dailyPurchasePrice: number;
  dailySellingPrice: number;
  dailyDiscount: number;
  dailyProfit: number;
  selectedIds?: Set<string>;
  onSelectionChange?: (id: string, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
  currency?: 'USD' | 'KHR';
}

export const DailyTransactionGroup: React.FC<DailyTransactionGroupProps> = ({
  date,
  transactions,
  onEdit,
  onDelete,
  formatCurrency,
  dailyTotal,
  dailyLiters,
  dailyPurchasePrice,
  dailySellingPrice,
  dailyDiscount,
  dailyProfit,
  selectedIds = new Set(),
  onSelectionChange,
  onSelectAll,
  currency = 'USD',
}) => {
  return (
    <div className="last:mb-0 border-b last:border-b-0">
      {/* Date Header */}
      <div className="bg-gradient-to-l from-blue-900 to-primary text-white p-4 md:p-5 border-b sticky top-0 z-10">
        <h3 className="font-semibold text-base md:text-lg">{date}</h3>
      </div>

      {/* Desktop: Table View */}
      <div className="hidden md:block overflow-x-auto">
        <TransactionTable
          transactions={transactions}
          onEdit={onEdit}
          formatCurrency={formatCurrency}
          selectedIds={selectedIds}
          onSelectionChange={onSelectionChange}
          onSelectAll={onSelectAll}
          currency={currency}
          footer={
            <TableRow className="bg-primary/5 hover:bg-primary/5">
              <TableCell className="w-[50px] text-center border-r"></TableCell>
              <TableCell colSpan={2} className="font-semibold py-3 border-r">
                សរុបថ្ងៃនេះ: <span className="ml-2 px-2 py-0.5 bg-primary/20 rounded text-primary font-semibold">{transactions.length}</span>
              </TableCell>
              <TableCell className="text-right w-[130px] font-mono font-semibold py-3 border-r">
                {dailyLiters.toFixed(2)}
              </TableCell>
              <TableCell className="text-right w-[110px] font-mono font-semibold py-3 text-muted-foreground border-r">
                {formatCurrency(dailyPurchasePrice)}
              </TableCell>
              <TableCell className="text-right w-[110px] font-mono font-semibold py-3 border-r">
                {formatCurrency(dailySellingPrice)}
              </TableCell>
              <TableCell className="text-right w-[120px] font-mono font-semibold py-3 border-r">
                {dailyDiscount > 0 ? formatCurrency(dailyDiscount) : '-'}
              </TableCell>
              <TableCell className={`text-right w-[110px] font-mono font-semibold py-3 border-r ${dailyProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(dailyProfit)}
              </TableCell>
              <TableCell className="text-right w-[120px] font-bold py-3 border-r">
                {formatCurrency(dailyTotal)}
              </TableCell>
              <TableCell className="w-[60px] text-center py-3">
                {/* Empty - action column removed from summary */}
              </TableCell>
            </TableRow>
          }
        />
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden divide-y">
        {transactions.map((transaction) => (
          <TransactionCard
            key={transaction._id}
            transaction={transaction}
            onEdit={onEdit}
            formatCurrency={formatCurrency}
            selected={selectedIds.has(transaction._id)}
            onSelectionChange={onSelectionChange}
            currency={currency}
          />
        ))}
      </div>

      {/* Daily Summary Row - Mobile */}
      <div className="md:hidden bg-primary/5 border-t-2 border-primary/20 p-4">
        <div className="flex flex-col gap-3">
          <span className="font-semibold text-sm">សរុបថ្ងៃនេះ:</span>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground block mb-1 text-xs">បរិមាណ</span>
              <span className="font-bold text-base">{dailyLiters.toFixed(2)} លីត្រ</span>
            </div>
            <div>
              <span className="text-muted-foreground block mb-1 text-xs">តម្លៃទិញ</span>
              <span className="font-bold text-base font-mono">{formatCurrency(dailyPurchasePrice)}</span>
            </div>
            <div>
              <span className="text-muted-foreground block mb-1 text-xs">តម្លៃលក់</span>
              <span className="font-bold text-base font-mono">{formatCurrency(dailySellingPrice)}</span>
            </div>
            <div>
              <span className="text-muted-foreground block mb-1 text-xs">បញ្ចុះតម្លៃ</span>
              <span className="font-bold text-base font-mono">{dailyDiscount > 0 ? formatCurrency(dailyDiscount) : '-'}</span>
            </div>
            <div>
              <span className="text-muted-foreground block mb-1 text-xs">ចំណេញ</span>
              <span className={`font-bold text-base font-mono ${dailyProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(dailyProfit)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block mb-1 text-xs">សរុប</span>
              <span className="font-bold text-base font-mono">{formatCurrency(dailyTotal)}</span>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground block mb-1 text-xs">ព័ត៌មាន</span>
              <span className="font-bold text-base">{transactions.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

