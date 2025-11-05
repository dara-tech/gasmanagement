import React from 'react';
import { Button } from '../ui/button';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import { Transaction } from '../../services/api';

interface TransactionCardProps {
  transaction: Transaction;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  formatCurrency: (amount: number) => string;
}

export const TransactionCard: React.FC<TransactionCardProps> = ({
  transaction,
  onEdit,
  onDelete,
  formatCurrency,
}) => {
  const pump = typeof transaction.pumpId === 'object' ? transaction.pumpId : null;
  const fuelType = typeof transaction.fuelTypeId === 'object' ? transaction.fuelTypeId : null;

  return (
    <div className="p-4 active:bg-accent transition-colors border-b last:border-b-0">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-base">{pump?.pumpNumber || 'N/A'}</span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-sm font-medium text-foreground">{fuelType?.name || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{transaction.liters.toFixed(2)} លីត្រ</span>
            <span>×</span>
            <span className="font-medium">${(transaction.priceOut || transaction.price || 0).toFixed(2)}</span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-bold text-lg mb-1">{formatCurrency(transaction.total)}</p>
          {(transaction.profit || 0) !== 0 && (
            <p className={`text-xs font-semibold ${(transaction.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ចំណេញ: ${(transaction.profit || 0).toFixed(2)}
            </p>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-3 text-xs mb-3 pt-3 border-t bg-muted/30 rounded-md p-2">
        <div>
          <span className="block mb-1 text-muted-foreground">តម្លៃទិញ</span>
          <span className="font-semibold text-foreground">${(transaction.priceIn || 0).toFixed(2)}</span>
        </div>
        <div>
          <span className="block mb-1 text-muted-foreground">បញ្ចុះ</span>
          <span className="font-semibold text-foreground">
            ${(transaction.discount || 0).toFixed(2)}
            {transaction.discountType === 'percentage' && (
              <span className="text-muted-foreground ml-1 font-normal">
                ({((transaction.discount || 0) / ((transaction.total || 0) + (transaction.discount || 0)) * 100).toFixed(1)}%)
              </span>
            )}
          </span>
        </div>
        <div>
          <span className="block mb-1 text-muted-foreground">ចំណេញ</span>
          <span className={`font-semibold ${(transaction.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${(transaction.profit || 0).toFixed(2)}
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-9 text-xs"
          onClick={() => onEdit(transaction)}
        >
          {/* @ts-ignore */}
          <FiEdit2 className="h-3.5 w-3.5 mr-1.5" />
          កែប្រែ
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-9 text-xs text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
          onClick={() => onDelete(transaction._id)}
        >
          {/* @ts-ignore */}
          <FiTrash2 className="h-3.5 w-3.5 mr-1.5" />
          លុប
        </Button>
      </div>
    </div>
  );
};

