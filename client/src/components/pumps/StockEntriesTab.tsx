import React, { useState, useMemo } from 'react';
import { StockEntry } from '../../services/api';
import { Card, CardContent} from '../ui/card';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Pagination } from '../ui/pagination';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';

interface StockEntriesTabProps {
  stockEntries: StockEntry[];
  pumps: any[];
  fuelTypes: any[];
  onAdd: () => void;
  onEdit: (entry: StockEntry) => void;
  onDelete: (id: string) => void;
  formatDate: (dateString: string) => string;
}

export const StockEntriesTab: React.FC<StockEntriesTabProps> = ({
  stockEntries,
  pumps,
  fuelTypes,
  onAdd,
  onEdit,
  onDelete,
  formatDate,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Sort stock entries by date (newest first)
  const sortedEntries = useMemo(() => {
    return [...stockEntries].sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [stockEntries]);

  // Calculate pagination
  const totalPages = Math.ceil(sortedEntries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedEntries = sortedEntries.slice(startIndex, endIndex);

  // Reset to page 1 when items per page changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button 
          onClick={onAdd} 
          disabled={pumps.length === 0 || fuelTypes.length === 0} 
          className="w-full sm:w-auto h-11 md:h-10 text-sm md:text-base"
        >
          {/* @ts-ignore */}
          <FiPlus className="mr-2 h-4 w-4" />
          បន្ថែមស្តុក
        </Button>
      </div>

      {pumps.length === 0 || fuelTypes.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              សូមបន្ថែមប្រភេទសាំង និងស្តុកសាំងមុនពេលបន្ថែមស្តុក
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
   
          <CardContent className="p-0">
            {stockEntries.length === 0 ? (
              <p className="text-muted-foreground p-6 text-center text-sm">
                មិនមានស្តុក
              </p>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="md:hidden space-y-2 p-2">
                  {paginatedEntries.map((entry) => {
                    const pump = typeof entry.pumpId === 'object' ? entry.pumpId : null;
                    const fuelType = typeof entry.fuelTypeId === 'object' ? entry.fuelTypeId : null;
                    
                    return (
                      <Card key={entry._id} className="p-3">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-semibold text-sm">{formatDate(entry.date)}</p>
                              <p className="text-xs text-muted-foreground">
                                {pump?.pumpNumber || 'N/A'} • {fuelType?.name || 'N/A'}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => onEdit(entry)}
                              >
                                {/* @ts-ignore */}
                                <FiEdit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                onClick={() => onDelete(entry._id)}
                              >
                                {/* @ts-ignore */}
                                <FiTrash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                            <div>
                              <p className="text-xs text-muted-foreground">លីត្រ</p>
                              <p className="font-mono text-sm font-semibold">{entry.liters.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">តម្លៃ/លីត្រ</p>
                              <p className="font-mono text-sm">
                                {entry.pricePerLiter ? `$${entry.pricePerLiter.toFixed(2)}` : 'N/A'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">សរុប</p>
                              <p className="font-mono text-sm font-semibold text-green-600">
                                {entry.totalCost ? `$${entry.totalCost.toFixed(2)}` : 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gradient-to-r from-blue-800 to-primary text-white">
                      <TableRow>
                        <TableHead className="w-[100px] text-white">ថ្ងៃ</TableHead>
                        <TableHead className="w-[100px] text-white">ស្តុកសាំង</TableHead>
                        <TableHead className="text-white">ប្រភេទសាំង</TableHead>
                        <TableHead className="text-right w-[120px] text-white">លីត្រ</TableHead>
                        <TableHead className="text-right w-[120px] text-white">តម្លៃ/លីត្រ</TableHead>
                        <TableHead className="text-right w-[140px] text-white">សរុប</TableHead>
                        <TableHead className="w-[100px] text-center text-white">សកម្មភាព</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedEntries.map((entry) => {
                        const pump = typeof entry.pumpId === 'object' ? entry.pumpId : null;
                        const fuelType = typeof entry.fuelTypeId === 'object' ? entry.fuelTypeId : null;
                        
                        return (
                          <TableRow key={entry._id}>
                            <TableCell className="font-medium">
                              {formatDate(entry.date)}
                            </TableCell>
                            <TableCell>
                              {pump?.pumpNumber || 'N/A'}
                            </TableCell>
                            <TableCell>{fuelType?.name || 'N/A'}</TableCell>
                            <TableCell className="text-right font-mono">
                              {entry.liters.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {entry.pricePerLiter ? `$${entry.pricePerLiter.toFixed(2)}` : 'N/A'}
                            </TableCell>
                            <TableCell className="text-right font-mono font-semibold">
                              {entry.totalCost ? `$${entry.totalCost.toFixed(2)}` : 'N/A'}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => onEdit(entry)}
                                >
                                  {/* @ts-ignore */}
                                  <FiEdit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                  onClick={() => onDelete(entry._id)}
                                >
                                  {/* @ts-ignore */}
                                  <FiTrash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
            
            {/* Pagination */}
            {sortedEntries.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={sortedEntries.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
                itemsPerPageOptions={[10, 20, 50, 100]}
                showItemsPerPage={true}
                showFirstLast={true}
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

