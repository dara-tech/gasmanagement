import React from 'react';
import { Pump, FuelType } from '../../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { FuelPumpIcon } from '../icons';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import { formatPriceDisplay } from '../../utils/currency';

interface PumpsTabProps {
  pumps: Pump[];
  fuelTypes: FuelType[];
  currentPrices: Record<string, number>;
  onAdd: () => void;
  onEdit: (pump: Pump) => void;
  onDelete: (id: string) => void;
}

export const PumpsTab: React.FC<PumpsTabProps> = ({
  pumps,
  fuelTypes,
  currentPrices,
  onAdd,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button 
          onClick={onAdd} 
          disabled={fuelTypes.length === 0} 
          className="w-full sm:w-auto h-11 md:h-10 text-sm md:text-base"
        >
          <FuelPumpIcon className="mr-2 h-4 w-4" />
          បន្ថែមស្តុកសាំង
        </Button>
      </div>

      {fuelTypes.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              សូមបន្ថែមប្រភេទសាំងមុនពេលបន្ថែមស្តុកសាំង
            </p>
          </CardContent>
        </Card>
      )}

      {fuelTypes.length > 0 && (
        <>
          {/* Mobile: Card Layout */}
          <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 md:hidden">
            {pumps.map((pump) => {
              const fuelType = typeof pump.fuelTypeId === 'object' ? pump.fuelTypeId : null;
              return (
                <Card key={pump._id}>
                  <CardHeader>
                    <CardTitle className="text-base md:text-lg">ស្តុកសាំង {pump.pumpNumber}</CardTitle>
                    <CardDescription>
                      {fuelType ? fuelType.name : 'មិនមានប្រភេទសាំង'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      <p className="text-sm">
                        <span className="font-medium">ស្ថានភាព:</span>{' '}
                        <span className={pump.status === 'active' ? 'text-green-600' : 'text-red-600'}>
                          {pump.status === 'active' ? 'សកម្ម' : 'មិនសកម្ម'}
                        </span>
                      </p>
                      {fuelType && (() => {
                        const currentPrice = currentPrices[fuelType._id] || 0;
                        if (currentPrice > 0) {
                          const { usd, riel } = formatPriceDisplay(currentPrice);
                          return (
                            <p className="text-sm">
                              <span className="font-medium">តម្លៃ:</span> {usd} ({riel}) / {fuelType.unit}
                            </p>
                          );
                        }
                        return null;
                      })()}
                      <p className="text-sm">
                        <span className="font-medium">ស្តុក:</span>{' '}
                        <span className={pump.stockLiters && pump.stockLiters > 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                          {pump.stockLiters?.toFixed(2) || '0.00'} លីត្រ
                        </span>
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(pump)}
                        className="flex-1"
                      >
                        {/* @ts-ignore */}
                        <FiEdit2 className="h-4 w-4 mr-1" />
                        កែប្រែ
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onDelete(pump._id)}
                        className="flex-1"
                      >
                        {/* @ts-ignore */}
                        <FiTrash2 className="h-4 w-4 mr-1" />
                        លុប
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Desktop: Table Layout */}
          <div className="hidden md:block">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-gradient-to-r from-blue-800 to-primary text-white">
                    <TableRow>
                      <TableHead className="font-semibold w-[120px] text-white">លេខស្តុក</TableHead>
                      <TableHead className="font-semibold text-white">ប្រភេទសាំង</TableHead>
                      <TableHead className="text-center font-semibold w-[120px] text-white">ស្ថានភាព</TableHead>
                      <TableHead className="text-right font-semibold w-[120px] text-white">តម្លៃ</TableHead>
                      <TableHead className="text-right font-semibold w-[140px] text-white">ស្តុក (លីត្រ)</TableHead>
                      <TableHead className="w-[150px] text-center font-semibold text-white">សកម្មភាព</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pumps.map((pump) => {
                      const fuelType = typeof pump.fuelTypeId === 'object' ? pump.fuelTypeId : null;
                      return (
                        <TableRow key={pump._id} className="hover:bg-muted/50">
                          <TableCell className="font-medium py-3">
                            {pump.pumpNumber}
                          </TableCell>
                          <TableCell className="py-3">
                            {fuelType ? fuelType.name : 'មិនមានប្រភេទសាំង'}
                          </TableCell>
                          <TableCell className="text-center py-3">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              pump.status === 'active' 
                                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                                : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                            }`}>
                              {pump.status === 'active' ? 'សកម្ម' : 'មិនសកម្ម'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-mono py-3">
                            {fuelType ? (
                              (() => {
                                const currentPrice = currentPrices[fuelType._id] || 0;
                                if (currentPrice > 0) {
                                  const { usd, riel } = formatPriceDisplay(currentPrice);
                                  return (
                                    <div className="flex flex-col items-end">
                                      <span>{usd}/{fuelType.unit}</span>
                                      <span className="text-xs text-muted-foreground">({riel})</span>
                                    </div>
                                  );
                                }
                                return <span className="text-muted-foreground text-xs">កំណត់តាមរយៈ "កំណត់តម្លៃ"</span>;
                              })()
                            ) : '-'}
                          </TableCell>
                          <TableCell className={`text-right font-mono font-semibold py-3 ${
                            pump.stockLiters && pump.stockLiters > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {pump.stockLiters?.toFixed(2) || '0.00'}
                          </TableCell>
                          <TableCell className="py-3">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => onEdit(pump)}
                              >
                                {/* @ts-ignore */}
                                <FiEdit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                onClick={() => onDelete(pump._id)}
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
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

