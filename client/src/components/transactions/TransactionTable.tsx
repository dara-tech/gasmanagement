import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../ui/dropdown-menu';
import { FiEdit2, FiTrash2, FiMoreVertical } from 'react-icons/fi';
import { Transaction } from '../../services/api';

interface TransactionTableProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  formatCurrency: (amount: number) => string;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  onEdit,
  onDelete,
  formatCurrency,
}) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px] font-semibold">ស្តុកសាំង</TableHead>
          <TableHead className="font-semibold">ប្រភេទសាំង</TableHead>
          <TableHead className="text-right w-[130px] whitespace-nowrap font-semibold">បរិមាណ (លីត្រ)</TableHead>
          <TableHead className="text-right w-[110px] whitespace-nowrap font-semibold">តម្លៃទិញ</TableHead>
          <TableHead className="text-right w-[110px] whitespace-nowrap font-semibold">តម្លៃលក់</TableHead>
          <TableHead className="text-right w-[120px] whitespace-nowrap font-semibold">បញ្ចុះតម្លៃ</TableHead>
          <TableHead className="text-right w-[110px] whitespace-nowrap font-semibold">ចំណេញ</TableHead>
          <TableHead className="text-right w-[120px] font-semibold">សរុប</TableHead>
          <TableHead className="w-[60px] text-center font-semibold">សកម្មភាព</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((transaction) => {
          const pump = typeof transaction.pumpId === 'object' ? transaction.pumpId : null;
          const fuelType = typeof transaction.fuelTypeId === 'object' ? transaction.fuelTypeId : null;
          
          return (
            <TableRow key={transaction._id} className="hover:bg-muted/50">
              <TableCell className="font-medium py-3">
                {pump?.pumpNumber || 'N/A'}
              </TableCell>
              <TableCell className="py-3">{fuelType?.name || 'N/A'}</TableCell>
              <TableCell className="text-right font-mono py-3">
                {transaction.liters.toFixed(2)}
              </TableCell>
              <TableCell className="text-right font-mono py-3 text-muted-foreground">
                ${(transaction.priceIn || 0).toFixed(2)}
              </TableCell>
              <TableCell className="text-right font-mono py-3">
                ${(transaction.priceOut || transaction.price || 0).toFixed(2)}
              </TableCell>
              <TableCell className="text-right font-mono py-3">
                {transaction.discount && transaction.discount > 0 ? (
                  <div className="flex flex-col items-end gap-0.5">
                    <span>${(transaction.discount || 0).toFixed(2)}</span>
                    {transaction.discountType === 'percentage' && (
                      <span className="text-xs text-muted-foreground">
                        ({((transaction.discount || 0) / ((transaction.total || 0) + (transaction.discount || 0)) * 100).toFixed(1)}%)
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-muted-foreground">$0.00</span>
                )}
              </TableCell>
              <TableCell className={`text-right font-mono py-3 font-semibold ${(transaction.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${(transaction.profit || 0).toFixed(2)}
              </TableCell>
              <TableCell className="text-right font-bold py-3">
                {formatCurrency(transaction.total)}
              </TableCell>
              <TableCell className="py-3">
                <div className="flex items-center justify-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        {/* @ts-ignore */}
                        <FiMoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(transaction)}>
                        {/* @ts-ignore */}
                        <FiEdit2 className="h-4 w-4 mr-2" />
                        កែប្រែ
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onDelete(transaction._id)}
                        className="text-destructive"
                      >
                        {/* @ts-ignore */}
                        <FiTrash2 className="h-4 w-4 mr-2" />
                        លុប
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

