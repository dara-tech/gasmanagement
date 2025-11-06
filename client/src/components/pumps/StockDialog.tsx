import React from 'react';
import { StockEntry, Pump, FuelType } from '../../services/api';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { formatPriceDisplay, usdToRiel, rielToUsd, getExchangeRate } from '../../utils/currency';

interface StockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingStockEntry: StockEntry | null;
  fuelTypes: FuelType[];
  pumps: Pump[];
  formData: {
    fuelTypeId: string;
    pumpId: string;
    liters: string;
    pricePerLiter: string;
    date: string;
    notes: string;
  };
  calculatedTotalCost: number;
  onFormDataChange: (data: any) => void;
  onFuelTypeChange: (fuelTypeId: string) => void;
  onLitersChange: (liters: string) => void;
  onPriceChange: (price: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  getTodayDate: () => string;
  submitting?: boolean;
  currency?: 'USD' | 'KHR';
  onCurrencyChange?: (currency: 'USD' | 'KHR') => void;
}

export const StockDialog: React.FC<StockDialogProps> = ({
  open,
  onOpenChange,
  editingStockEntry,
  fuelTypes,
  pumps,
  formData,
  calculatedTotalCost,
  onFormDataChange,
  onFuelTypeChange,
  onLitersChange,
  onPriceChange,
  onSubmit,
  onClose,
  getTodayDate,
  submitting = false,
  currency = 'USD',
  onCurrencyChange,
}) => {
  const exchangeRate = getExchangeRate();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] md:max-w-md mx-2 md:mx-auto mb-10">
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl">
            {editingStockEntry ? 'កែប្រែស្តុក' : 'បន្ថែមស្តុក'}
          </DialogTitle>
          <DialogDescription className="text-xs md:text-sm">
            {editingStockEntry ? 'កែប្រែព័ត៌មានស្តុក' : 'បញ្ចូលព័ត៌មានស្តុកថ្មី'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => {
          e.preventDefault();
          
          // Final client-side validation before calling parent handler
          const litersStr = formData.liters?.trim() || '';
          const priceStr = formData.pricePerLiter?.trim() || '';
          
          // Prevent submission if values are empty
          if (!litersStr || litersStr === '') {
            // Focus on the input to show HTML5 validation
            const litersInput = document.getElementById('liters');
            if (litersInput) {
              litersInput.focus();
              (litersInput as HTMLInputElement).reportValidity();
            }
            return;
          }
          
          if (!priceStr || priceStr === '') {
            const priceInput = document.getElementById('pricePerLiter');
            if (priceInput) {
              priceInput.focus();
              (priceInput as HTMLInputElement).reportValidity();
            }
            return;
          }
          
          const litersValue = parseFloat(litersStr);
          const priceValue = parseFloat(priceStr);
          
          // Prevent submission if values are invalid
          if (isNaN(litersValue) || litersValue <= 0 || !isFinite(litersValue)) {
            const litersInput = document.getElementById('liters');
            if (litersInput) {
              litersInput.focus();
              (litersInput as HTMLInputElement).setCustomValidity('សូមបញ្ចូលបរិមាណលីត្រដែលត្រឹមត្រូវ');
              (litersInput as HTMLInputElement).reportValidity();
              (litersInput as HTMLInputElement).setCustomValidity('');
            }
            return;
          }
          
          if (isNaN(priceValue) || priceValue < 0 || !isFinite(priceValue)) {
            const priceInput = document.getElementById('pricePerLiter');
            if (priceInput) {
              priceInput.focus();
              (priceInput as HTMLInputElement).setCustomValidity('សូមបញ្ចូលតម្លៃទិញដែលត្រឹមត្រូវ');
              (priceInput as HTMLInputElement).reportValidity();
              (priceInput as HTMLInputElement).setCustomValidity('');
            }
            return;
          }
          
          if (!formData.fuelTypeId || !formData.pumpId) {
            return; // Let HTML5 validation show the error
          }
          
          // All validations passed, submit
          onSubmit(e);
        }}>
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
                  {fuelTypes.map((fuelType) => {
                    const priceDisplay = fuelType.price && fuelType.price > 0 
                      ? formatPriceDisplay(fuelType.price)
                      : null;
                    return (
                      <SelectItem key={fuelType._id} value={fuelType._id} className="text-sm">
                        <div className="flex flex-col gap-1 w-full">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{fuelType.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {priceDisplay 
                                ? `${priceDisplay.usd}/លីត្រ (${priceDisplay.riel})` 
                                : 'កំណត់តាមរយៈ "កំណត់តម្លៃ"'}
                            </span>
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
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
                  {pumps
                    .filter((pump) => {
                      // If a fuel type is selected, only show pumps that match it
                      if (formData.fuelTypeId) {
                        const pumpFuelTypeId = typeof pump.fuelTypeId === 'object' 
                          ? pump.fuelTypeId._id 
                          : pump.fuelTypeId;
                        return pumpFuelTypeId === formData.fuelTypeId;
                      }
                      // If no fuel type selected, show all pumps
                      return true;
                    })
                    .map((pump) => {
                      const fuelType = typeof pump.fuelTypeId === 'object' ? pump.fuelTypeId : null;
                      const stock = pump.stockLiters || 0;
                      const isSelected = pump._id === formData.pumpId;
                      return (
                        <SelectItem 
                          key={pump._id} 
                          value={pump._id} 
                          className={`text-sm ${isSelected ? 'bg-accent' : ''}`}
                        >
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
              <Label htmlFor="liters" className="text-sm md:text-base">បរិមាណ (លីត្រ)</Label>
              <Input
                id="liters"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.liters}
                onChange={(e) => {
                  const value = e.target.value;
                  // Only allow numbers and decimal point
                  if (value === '' || /^\d*\.?\d*$/.test(value)) {
                    onLitersChange(value);
                  }
                }}
                onBlur={(e) => {
                  // Validate on blur - ensure it's a valid positive number
                  const value = parseFloat(e.target.value);
                  if (isNaN(value) || value <= 0) {
                    onLitersChange('');
                  }
                }}
                placeholder="0.00"
                required
                className="h-11 md:h-10 text-base md:text-sm"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="pricePerLiter" className="text-sm md:text-base">តម្លៃទិញ (ក្នុង 1 លីត្រ)</Label>
                {onCurrencyChange && (
                  <Select value={currency} onValueChange={(value: 'USD' | 'KHR') => onCurrencyChange(value)}>
                    <SelectTrigger className="w-[100px] h-8 md:h-9 text-xs md:text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="KHR">KHR (៛)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
              <Input
                id="pricePerLiter"
                type="number"
                step={currency === 'KHR' ? '1' : '0.01'}
                min="0"
                value={formData.pricePerLiter}
                onChange={(e) => {
                  const value = e.target.value;
                  // Only allow numbers and decimal point (for USD)
                  if (currency === 'KHR') {
                    // For Riel, only allow integers
                    if (value === '' || /^\d*$/.test(value)) {
                      onPriceChange(value);
                    }
                  } else {
                    // For USD, allow decimals
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      onPriceChange(value);
                    }
                  }
                }}
                onBlur={(e) => {
                  // Validate on blur - ensure it's a valid non-negative number
                  const value = parseFloat(e.target.value);
                  if (isNaN(value) || value < 0) {
                    onPriceChange('');
                  }
                }}
                placeholder={currency === 'KHR' ? '0' : '0.00'}
                required
                className="h-11 md:h-10 text-base md:text-sm"
              />
              {formData.pricePerLiter && parseFloat(formData.pricePerLiter) > 0 && (
                <p className="text-xs text-muted-foreground">
                  {currency === 'KHR' ? (
                    <>
                      USD: <span className="font-semibold">${rielToUsd(parseFloat(formData.pricePerLiter), exchangeRate).toFixed(2)}</span>
                    </>
                  ) : (
                    <>
                      KHR: <span className="font-semibold">៛{usdToRiel(parseFloat(formData.pricePerLiter), exchangeRate).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</span>
                    </>
                  )}
                </p>
              )}
              {calculatedTotalCost > 0 && (
                <p className="text-xs text-muted-foreground">
                  សរុប: <span className="font-semibold text-foreground text-green-600">${calculatedTotalCost.toFixed(2)}</span>
                  {currency === 'KHR' && (
                    <span className="ml-2">
                      (<span className="font-semibold">៛{usdToRiel(calculatedTotalCost, exchangeRate).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</span>)
                    </span>
                  )}
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
              disabled={submitting}
              className="w-full sm:w-auto h-11 md:h-10 text-sm md:text-base"
            >
              {submitting ? (
                <>
                  <span className="mr-2 h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                  កំពុងរក្សាទុក...
                </>
              ) : (
                editingStockEntry ? 'រក្សាទុក' : 'បន្ថែម'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

