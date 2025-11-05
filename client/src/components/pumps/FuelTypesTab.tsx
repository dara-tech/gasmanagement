import React from 'react';
import { FuelType, Pump } from '../../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { FuelDropletIcon } from '../icons';
import { FiEdit2, FiTrash2, FiDollarSign } from 'react-icons/fi';

interface FuelTypesTabProps {
  fuelTypes: FuelType[];
  pumps: Pump[];
  onAdd: () => void;
  onEdit: (fuelType: FuelType) => void;
  onDelete: (id: string) => void;
  onSetPrice: (fuelType: FuelType) => void;
  isFuelTypeInUse: (fuelTypeId: string) => boolean;
  getPumpsUsingFuelType: (fuelTypeId: string) => Pump[];
}

export const FuelTypesTab: React.FC<FuelTypesTabProps> = ({
  fuelTypes,
  pumps,
  onAdd,
  onEdit,
  onDelete,
  onSetPrice,
  isFuelTypeInUse,
  getPumpsUsingFuelType,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={onAdd} className="w-full sm:w-auto h-11 md:h-10 text-sm md:text-base">
          <FuelDropletIcon className="mr-2 h-4 w-4" />
          បន្ថែមប្រភេទសាំង
        </Button>
      </div>

      {/* Mobile: Card Layout */}
      <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 md:hidden">
        {fuelTypes.map((fuelType) => {
          const inUse = isFuelTypeInUse(fuelType._id);
          const usingPumps = getPumpsUsingFuelType(fuelType._id);
          return (
            <Card key={fuelType._id}>
              <CardHeader>
                <CardTitle className="text-base md:text-lg flex items-center gap-2">
                  {fuelType.name}
                  {inUse && (
                    <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-2 py-0.5 rounded-full font-normal">
                      កំពុងប្រើ
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  <span>ឯកតា: {fuelType.unit}</span>
                  {fuelType.litersPerTon && (
                    <span className="block text-xs mt-1">
                      {fuelType.litersPerTon}L/តោន
                    </span>
                  )}
                  {inUse && (
                    <span className="block text-xs mt-1 text-muted-foreground">
                      ប្រើដោយ: {usingPumps.map(p => p.pumpNumber).join(', ')}
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSetPrice(fuelType)}
                    className="w-full"
                  >
                    {/* @ts-ignore */}
                    <FiDollarSign className="h-4 w-4 mr-1" />
                    កំណត់តម្លៃ
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(fuelType)}
                      className="flex-1"
                    >
                      {/* @ts-ignore */}
                      <FiEdit2 className="h-4 w-4 mr-1" />
                      កែប្រែ
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onDelete(fuelType._id)}
                      className="flex-1"
                      disabled={inUse}
                      title={inUse ? 'មិនអាចលុប - កំពុងប្រើប្រាស់' : ''}
                    >
                      {/* @ts-ignore */}
                      <FiTrash2 className="h-4 w-4 mr-1" />
                      លុប
                    </Button>
                  </div>
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
              <TableHeader className="bg-gradient-to-r from-blue-800 to-primary text-white ">
                <TableRow>
                  <TableHead className="font-semibold text-white">ឈ្មោះ</TableHead>
                  <TableHead className="font-semibold text-white">ឯកតា</TableHead>
                  <TableHead className="text-right font-semibold text-white">លីត្រ/តោន</TableHead>
                  <TableHead className="w-[150px] text-center font-semibold text-white">សកម្មភាព</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fuelTypes.map((fuelType) => {
                  const inUse = isFuelTypeInUse(fuelType._id);
                  const usingPumps = getPumpsUsingFuelType(fuelType._id);
                  return (
                    <TableRow key={fuelType._id} className="hover:bg-muted/50">
                      <TableCell className="font-medium py-3">
                        <div className="flex items-center gap-2">
                          <span>{fuelType.name}</span>
                          {inUse && (
                            <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-2 py-0.5 rounded-full">
                              កំពុងប្រើ ({usingPumps.length})
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        {fuelType.unit}
                      </TableCell>
                      <TableCell className="text-right font-mono py-3">
                        {fuelType.litersPerTon ? `${fuelType.litersPerTon}L` : '-'}
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => onSetPrice(fuelType)}
                            title="កំណត់តម្លៃ"
                          >
                            {/* @ts-ignore */}
                            <FiDollarSign className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => onEdit(fuelType)}
                          >
                            {/* @ts-ignore */}
                            <FiEdit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive disabled:opacity-50"
                            onClick={() => onDelete(fuelType._id)}
                            disabled={inUse}
                            title={inUse ? `មិនអាចលុប - ប្រើដោយ: ${usingPumps.map(p => p.pumpNumber).join(', ')}` : ''}
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
    </div>
  );
};

