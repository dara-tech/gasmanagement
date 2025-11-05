import React from 'react';
import { StockEntry, Pump, FuelType } from '../../services/api';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface StockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingStockEntry: StockEntry | null;
  fuelTypes: FuelType[];
  pumps: Pump[];
  formData: {
    fuelTypeId: string;
    pumpId: string;
    tons: string;
    pricePerLiter: string;
    date: string;
    notes: string;
  };
  calculatedLiters: number;
  calculatedTotalCost: number;
  onFormDataChange: (data: any) => void;
  onFuelTypeChange: (fuelTypeId: string) => void;
  onTonsChange: (tons: string) => void;
  onPriceChange: (price: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  getTodayDate: () => string;
}

export const StockDialog: React.FC<StockDialogProps> = ({
  open,
  onOpenChange,
  editingStockEntry,
  fuelTypes,
  pumps,
  formData,
  calculatedLiters,
  calculatedTotalCost,
  onFormDataChange,
  onFuelTypeChange,
  onTonsChange,
  onPriceChange,
  onSubmit,
  onClose,
  getTodayDate,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] md:max-w-md mx-2 md:mx-auto mb-10">
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl">
            {editingStockEntry ? 'កែប្រែស្តុក' : 'បន្ថែមស្តុក'}
          </DialogTitle>
          <DialogDescription className="text-xs md:text-sm">
            {editingStockEntry ? 'កែប្រែព័ត៌មានស្តុក' : 'បញ្ចូលព័ត៌មានស្តុកថ្មី (តោន → លីត្រ)'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit}>
          <div className="space-y-4 py-2 md:py-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="text-sm md:text-base">ថ្ងៃ</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => onFormDataChange({ ...formData, date: e.target.value })}
                max={getTodayDate()}
                className="h-11 md:h-10 text-base md:text-sm"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fuelTypeId" className="text-sm md:text-base">ប្រភេទសាំង</Label>
              <Select
                value={formData.fuelTypeId || undefined}
                onValueChange={onFuelTypeChange}
              >
                <SelectTrigger id="fuelTypeId" aria-label="ប្រភេទសាំង" className="h-11 md:h-10 text-sm md:text-base">
                  <SelectValue placeholder="ជ្រើសប្រភេទសាំង" />
                </SelectTrigger>
                <SelectContent>
                  {fuelTypes.map((fuelType) => (
                    <SelectItem key={fuelType._id} value={fuelType._id} className="text-sm">
                      <div className="flex flex-col gap-1 w-full">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{fuelType.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {fuelType.price && fuelType.price > 0 
                              ? `$${fuelType.price.toFixed(2)}/លីត្រ` 
                              : 'កំណត់តាមរយៈ "កំណត់តម្លៃ"'}
                          </span>
                        </div>
                        {fuelType.litersPerTon && (
                          <div className="text-xs text-muted-foreground">
                            {fuelType.litersPerTon}L/តោន
                          </div>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pumpId" className="text-sm md:text-base">ស្តុកសាំង</Label>
              <Select
                value={formData.pumpId || undefined}
                onValueChange={(value) => onFormDataChange({ ...formData, pumpId: value })}
              >
                <SelectTrigger id="pumpId" aria-label="ស្តុកសាំង" className="h-11 md:h-10 text-sm md:text-base">
                  <SelectValue placeholder="ជ្រើសស្តុកសាំង" />
                </SelectTrigger>
                <SelectContent>
                  {pumps.map((pump) => {
                    const fuelType = typeof pump.fuelTypeId === 'object' ? pump.fuelTypeId : null;
                    const stock = pump.stockLiters || 0;
                    return (
                      <SelectItem key={pump._id} value={pump._id} className="text-sm">
                        <div className="flex flex-col gap-1 w-full">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{pump.pumpNumber} - {fuelType?.name || 'N/A'}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">ស្តុក: {stock.toFixed(2)}L</span>
                            {pump.status === 'inactive' && <span className="text-orange-600">(មិនសកម្ម)</span>}
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tons" className="text-sm md:text-base">បរិមាណ (តោន)</Label>
              <Input
                id="tons"
                type="number"
                step="0.01"
                min="0"
                value={formData.tons}
                onChange={(e) => onTonsChange(e.target.value)}
                placeholder="0.00"
                required
                className="h-11 md:h-10 text-base md:text-sm"
              />
              {calculatedLiters > 0 && (
                <p className="text-xs text-muted-foreground">
                  ស្មើនឹង: <span className="font-semibold text-foreground">{calculatedLiters.toFixed(2)} លីត្រ</span>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="pricePerLiter" className="text-sm md:text-base">តម្លៃទិញ (ក្នុង 1 លីត្រ)</Label>
              <Input
                id="pricePerLiter"
                type="number"
                step="0.01"
                min="0"
                value={formData.pricePerLiter}
                onChange={(e) => onPriceChange(e.target.value)}
                placeholder="0.00"
                required
                className="h-11 md:h-10 text-base md:text-sm"
              />
              {calculatedTotalCost > 0 && (
                <p className="text-xs text-muted-foreground">
                  សរុប: <span className="font-semibold text-foreground text-green-600">${calculatedTotalCost.toFixed(2)}</span>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm md:text-base">ចំណាំ (បន្ថែម)</Label>
              <Input
                id="notes"
                type="text"
                value={formData.notes}
                onChange={(e) => onFormDataChange({ ...formData, notes: e.target.value })}
                placeholder="ចំណាំ..."
                className="h-11 md:h-10 text-base md:text-sm"
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="w-full sm:w-auto h-11 md:h-10 text-sm md:text-base"
            >
              បោះបង់
            </Button>
            <Button 
              type="submit"
              className="w-full sm:w-auto h-11 md:h-10 text-sm md:text-base"
            >
              {editingStockEntry ? 'រក្សាទុក' : 'បន្ថែម'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

