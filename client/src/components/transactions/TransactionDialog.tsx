import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Transaction, Pump, fuelPricesAPI } from '../../services/api';
import { useToast } from '../../hooks/use-toast';
import { transactionsAPI } from '../../services/api';
import { usdToRiel, rielToUsd, getExchangeRate } from '../../utils/currency';

interface TransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTransaction: Transaction | null;
  pumps: Pump[];
  allPumps: Pump[];
  onSuccess: () => void;
  getTodayDate: () => string;
}

export const TransactionDialog: React.FC<TransactionDialogProps> = ({
  open,
  onOpenChange,
  editingTransaction,
  pumps,
  allPumps,
  onSuccess,
  getTodayDate,
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    pumpId: '',
    liters: '',
    date: '',
    discount: '',
    discountType: 'amount' as 'amount' | 'percentage',
  });
  const [discountCurrency, setDiscountCurrency] = useState<'USD' | 'KHR'>(() => {
    const saved = localStorage.getItem('transactionDiscountCurrency');
    return (saved === 'KHR' || saved === 'USD') ? saved : 'USD';
  });
  const [calculatedTotal, setCalculatedTotal] = useState(0);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const exchangeRate = getExchangeRate();

  useEffect(() => {
    if (editingTransaction) {
      const pump = typeof editingTransaction.pumpId === 'object' ? editingTransaction.pumpId : null;
      const transactionDate = new Date(editingTransaction.date);
      const dateStr = transactionDate.toISOString().split('T')[0];
      let discountValue = (editingTransaction.discount || 0).toString();
      if (editingTransaction.discountType === 'percentage' && editingTransaction.discount && editingTransaction.total) {
        const percentage = ((editingTransaction.discount / (editingTransaction.total + editingTransaction.discount)) * 100);
        discountValue = percentage.toFixed(1);
      }
      
      // Use the transaction's priceOut when editing
      const transactionPrice = editingTransaction.priceOut || editingTransaction.price || null;
      setCurrentPrice(transactionPrice);
      
      // Convert discount to selected currency if it's an amount (not percentage)
      if (editingTransaction.discountType === 'amount' && editingTransaction.discount) {
        if (discountCurrency === 'KHR') {
          discountValue = usdToRiel(editingTransaction.discount, exchangeRate).toFixed(0);
        } else {
          discountValue = editingTransaction.discount.toFixed(2);
        }
      }
      
      setFormData({
        pumpId: pump?._id || '',
        liters: editingTransaction.liters.toString(),
        date: dateStr,
        discount: discountValue,
        discountType: editingTransaction.discountType || 'amount',
      });
      calculateTotal(pump?._id || '', editingTransaction.liters.toString(), dateStr);
    } else {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      setFormData({
        pumpId: '',
        liters: '',
        date: dateStr,
        discount: '',
        discountType: 'amount',
      });
      setCalculatedTotal(0);
      setCurrentPrice(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingTransaction, open]);

  const calculateTotal = async (pumpId: string, liters: string, date?: string) => {
    if (!pumpId || !liters) {
      setCalculatedTotal(0);
      setCurrentPrice(null);
      return;
    }

    let pump = pumps.find(p => p._id === pumpId);
    if (!pump) {
      pump = allPumps.find(p => p._id === pumpId);
    }

    if (pump && typeof pump.fuelTypeId === 'object') {
      const fuelTypeId = pump.fuelTypeId._id;
      const selectedDate = date || formData.date;
      
      try {
        // Fetch price history for the selected date
        const priceHistory = await fuelPricesAPI.getByDate(fuelTypeId, selectedDate);
        const price = priceHistory.price || pump.fuelTypeId.price || 0;
        setCurrentPrice(price);
        const total = parseFloat(liters) * price;
        setCalculatedTotal(isNaN(total) ? 0 : total);
      } catch (error) {
        // Fallback to default price if price history fetch fails
        const price = pump.fuelTypeId.price || 0;
        setCurrentPrice(price);
        const total = parseFloat(liters) * price;
        setCalculatedTotal(isNaN(total) ? 0 : total);
      }
    }
  };

  // Save currency preference
  useEffect(() => {
    localStorage.setItem('transactionDiscountCurrency', discountCurrency);
  }, [discountCurrency]);

  const handlePumpChange = (pumpId: string) => {
    setFormData({ ...formData, pumpId });
    calculateTotal(pumpId, formData.liters, formData.date);
  };

  const handleLitersChange = (liters: string) => {
    setFormData({ ...formData, liters });
    calculateTotal(formData.pumpId, liters, formData.date);
  };

  const handleDateChange = (date: string) => {
    setFormData({ ...formData, date });
    if (formData.pumpId && formData.liters) {
      calculateTotal(formData.pumpId, formData.liters, date);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('km-KH', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatRiel = (amount: number) => {
    return new Intl.NumberFormat('km-KH', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return; // Prevent double submission
    
    setSubmitting(true);
    try {
      const pumpList = editingTransaction ? allPumps : pumps;
      const pump = pumpList.find(p => p._id === formData.pumpId);
      if (!pump || typeof pump.fuelTypeId !== 'object') {
        toast({
          variant: 'destructive',
          title: 'កំហុស',
          description: 'មិនឃើញស្តុកសាំង',
        });
        return;
      }

      const transactionLiters = parseFloat(formData.liters);
      if (isNaN(transactionLiters) || transactionLiters <= 0) {
        toast({
          variant: 'destructive',
          title: 'កំហុស',
          description: 'សូមបញ្ចូលបរិមាណដែលត្រឹមត្រូវ',
        });
        return;
      }

      // Validate stock availability
      if (!editingTransaction) {
        const availableStock = pump.stockLiters || 0;
        if (transactionLiters > availableStock) {
          toast({
            variant: 'destructive',
            title: 'ស្តុកមិនគ្រប់គ្រាន់',
            description: `ស្តុកមាន: ${availableStock.toFixed(2)} លីត្រ, ត្រូវការ: ${transactionLiters.toFixed(2)} លីត្រ`,
          });
          return;
        }
      } else {
        const oldLiters = editingTransaction.liters;
        const stockDifference = oldLiters - transactionLiters;
        
        if (stockDifference < 0) {
          const neededStock = Math.abs(stockDifference);
          const availableStock = pump.stockLiters || 0;
          if (neededStock > availableStock) {
            toast({
              variant: 'destructive',
              title: 'ស្តុកមិនគ្រប់គ្រាន់',
              description: `ស្តុកមាន: ${availableStock.toFixed(2)} លីត្រ, ត្រូវការ: ${neededStock.toFixed(2)} លីត្រ`,
            });
            return;
          }
        }
      }

      const transactionDate = formData.date
        ? new Date(`${formData.date}T12:00:00`)
        : new Date();

      // Convert discount to USD if it's in KHR
      let discountValue = parseFloat(formData.discount) || 0;
      if (formData.discountType === 'amount' && discountCurrency === 'KHR') {
        discountValue = rielToUsd(discountValue, exchangeRate);
      }

      if (editingTransaction) {
        await transactionsAPI.update(editingTransaction._id, {
          pumpId: formData.pumpId,
          fuelTypeId: pump.fuelTypeId._id,
          liters: transactionLiters,
          date: transactionDate.toISOString(),
          discount: discountValue,
          discountType: formData.discountType,
        });
      } else {
        await transactionsAPI.create({
          pumpId: formData.pumpId,
          fuelTypeId: pump.fuelTypeId._id,
          liters: transactionLiters,
          date: transactionDate.toISOString(),
          discount: discountValue,
          discountType: formData.discountType,
        });
      }
      
      onOpenChange(false);
      onSuccess();
      toast({
        variant: 'success',
        title: 'ជោគជ័យ',
        description: editingTransaction ? 'កែប្រែព័ត៌មានដោយជោគជ័យ' : 'បន្ថែមព័ត៌មានដោយជោគជ័យ',
      });
    } catch (error: any) {
      console.error('Error saving transaction:', error);
      const errorMessage = error?.response?.data?.message || 'មានកំហុសក្នុងការរក្សាទុកព័ត៌មាន';
      toast({
        variant: 'destructive',
        title: 'កំហុស',
        description: errorMessage,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    setFormData({
      pumpId: '',
      liters: '',
      date: dateStr,
      discount: '',
      discountType: 'amount',
    });
    setCalculatedTotal(0);
    setCurrentPrice(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] md:max-w-md mx-2 md:mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl">
            {editingTransaction ? 'កែប្រែព័ត៌មាន' : 'បន្ថែមព័ត៌មាន'}
          </DialogTitle>
          <DialogDescription className="text-xs md:text-sm mt-1">
            {editingTransaction ? 'កែប្រែព័ត៌មានលក់' : 'បញ្ចូលព័ត៌មានលក់ថ្មី'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Date Input */}
            <div className="space-y-2">
              <Label htmlFor="date" className="text-sm md:text-base">ថ្ងៃ</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleDateChange(e.target.value)}
                max={getTodayDate()}
                className="h-11 md:h-10 text-base md:text-sm"
                required
              />
              <p className="text-xs text-muted-foreground">អាចបញ្ចូលព័ត៌មានពីមុន</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="pumpId" className="text-sm md:text-base">ស្តុកសាំង</Label>
              <Select
                value={formData.pumpId || undefined}
                onValueChange={(value) => handlePumpChange(value)}
              >
                <SelectTrigger id="pumpId" aria-label="ស្តុកសាំង" className="h-11 md:h-10 text-sm md:text-base">
                  <SelectValue placeholder="ជ្រើសស្តុកសាំង" />
                </SelectTrigger>
                <SelectContent>
                  {(editingTransaction ? allPumps : pumps).map((pump) => {
                    const fuelType = typeof pump.fuelTypeId === 'object' ? pump.fuelTypeId : null;
                    const stock = pump.stockLiters || 0;
                    return (
                      <SelectItem key={pump._id} value={pump._id} className="text-sm">
                        <div className="flex flex-col gap-1 w-full">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{pump.pumpNumber} - {fuelType?.name || 'N/A'}</span>
                            <span className="text-xs text-muted-foreground">${fuelType?.price?.toFixed(2) || '0.00'}</span>
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
                min="0"
                value={formData.liters}
                onChange={(e) => handleLitersChange(e.target.value)}
                placeholder="0.00"
                required
                className="h-11 md:h-10 text-base md:text-sm"
              />
              {formData.pumpId && (() => {
                const selectedPump = (editingTransaction ? allPumps : pumps).find(p => p._id === formData.pumpId);
                const availableStock = selectedPump?.stockLiters || 0;
                const transactionLiters = parseFloat(formData.liters) || 0;
                const isExceeding = !editingTransaction && transactionLiters > availableStock;
                const isExceedingEdit = editingTransaction && transactionLiters > availableStock + editingTransaction.liters;
                
                return (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      ស្តុកមាន: <span className={availableStock > 0 ? 'font-semibold text-green-600' : 'font-semibold text-red-600'}>
                        {availableStock.toFixed(2)} លីត្រ
                      </span>
                    </p>
                    {isExceeding && (
                      <p className="text-xs text-red-600 font-medium">
                        ⚠️ ស្តុកមិនគ្រប់គ្រាន់! ត្រូវការ: {transactionLiters.toFixed(2)} លីត្រ
                      </p>
                    )}
                    {isExceedingEdit && (
                      <p className="text-xs text-red-600 font-medium">
                        ⚠️ ការកែប្រែនេះនឹងលើសស្តុក!
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>
            <div className="space-y-2">
              <Label htmlFor="discount" className="text-sm md:text-base">បញ្ចុះតម្លៃ (បន្ថែម)</Label>
              <div className="flex gap-2">
                <Select
                  value={formData.discountType}
                  onValueChange={(value: 'amount' | 'percentage') => {
                    setFormData({ ...formData, discountType: value, discount: '' });
                  }}
                >
                  <SelectTrigger className="w-[120px] h-11 md:h-10 text-sm md:text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="amount">ចំនួន</SelectItem>
                    <SelectItem value="percentage">% (ភាគរយ)</SelectItem>
                  </SelectContent>
                </Select>
                {formData.discountType === 'amount' && (
                  <Select
                    value={discountCurrency}
                    onValueChange={(value: 'USD' | 'KHR') => {
                      setDiscountCurrency(value);
                      // Convert existing discount when currency changes
                      if (formData.discount) {
                        const currentDiscount = parseFloat(formData.discount);
                        if (!isNaN(currentDiscount)) {
                          if (value === 'KHR') {
                            // Convert USD to KHR
                            const usdValue = discountCurrency === 'USD' ? currentDiscount : rielToUsd(currentDiscount, exchangeRate);
                            setFormData({ ...formData, discount: usdToRiel(usdValue, exchangeRate).toFixed(0) });
                          } else {
                            // Convert KHR to USD
                            const khrValue = discountCurrency === 'KHR' ? currentDiscount : usdToRiel(currentDiscount, exchangeRate);
                            setFormData({ ...formData, discount: rielToUsd(khrValue, exchangeRate).toFixed(2) });
                          }
                        }
                      }
                    }}
                  >
                    <SelectTrigger className="w-[100px] h-11 md:h-10 text-sm md:text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="KHR">KHR (៛)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                <Input
                  id="discount"
                  type="number"
                  step={formData.discountType === 'percentage' ? '0.1' : (discountCurrency === 'KHR' ? '1' : '0.01')}
                  min="0"
                  max={formData.discountType === 'percentage' ? '100' : undefined}
                  value={formData.discount}
                  onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                  placeholder={formData.discountType === 'percentage' ? '0.0' : (discountCurrency === 'KHR' ? '0' : '0.00')}
                  className="flex-1 h-11 md:h-10 text-base md:text-sm"
                />
              </div>
              {formData.discountType === 'amount' && formData.discount && (
                <p className="text-xs text-muted-foreground">
                  {discountCurrency === 'KHR' 
                    ? `≈ $${rielToUsd(parseFloat(formData.discount) || 0, exchangeRate).toFixed(2)}` 
                    : `≈ ${usdToRiel(parseFloat(formData.discount) || 0, exchangeRate).toFixed(0)}៛`}
                </p>
              )}
            </div>
            {calculatedTotal > 0 && (
              <div className="p-4 bg-muted rounded-lg border">
                <div className="space-y-3">
                  {currentPrice !== null && formData.pumpId && (
                    <div className="flex items-center justify-between text-xs text-muted-foreground pb-2 border-b">
                      <span>តម្លៃសម្រាប់ថ្ងៃនេះ:</span>
                      <span className="font-semibold">
                        {formatCurrency(currentPrice)}/លីត្រ
                        <span className="ml-2 text-[10px] text-muted-foreground">
                          ({formatRiel(usdToRiel(currentPrice, exchangeRate))}៛/លីត្រ)
                        </span>
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm md:text-base">សរុបមុនបញ្ចុះ:</span>
                    <span className="text-lg md:text-xl font-bold">
                      {formatCurrency(calculatedTotal)}
                      <span className="ml-2 text-xs text-muted-foreground font-normal">
                        ({formatRiel(usdToRiel(calculatedTotal, exchangeRate))}៛)
                      </span>
                    </span>
                  </div>
                  {parseFloat(formData.discount || '0') > 0 && (() => {
                    const discountValue = parseFloat(formData.discount) || 0;
                    let discountAmount = 0;
                    if (formData.discountType === 'percentage') {
                      discountAmount = (calculatedTotal * discountValue) / 100;
                    } else {
                      // Convert KHR to USD for calculation
                      if (discountCurrency === 'KHR') {
                        discountAmount = rielToUsd(discountValue, exchangeRate);
                      } else {
                        discountAmount = discountValue;
                      }
                    }
                    const finalTotal = Math.max(0, calculatedTotal - discountAmount);
                    
                    return (
                      <>
                        <div className="flex items-center justify-between text-sm pt-2 border-t">
                          <span className="text-muted-foreground">
                            បញ្ចុះតម្លៃ {formData.discountType === 'percentage' ? `(${discountValue.toFixed(1)}%)` : ''}:
                          </span>
                          <span className="font-semibold text-red-600">
                            -{formatCurrency(discountAmount)}
                            <span className="ml-2 text-xs text-muted-foreground font-normal">
                              (-{formatRiel(usdToRiel(discountAmount, exchangeRate))}៛)
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="font-semibold text-sm md:text-base">សរុប:</span>
                          <span className="text-xl md:text-2xl font-bold">
                            {formatCurrency(finalTotal)}
                            <span className="ml-2 text-xs text-muted-foreground font-normal">
                              ({formatRiel(usdToRiel(finalTotal, exchangeRate))}៛)
                            </span>
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 mt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
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
                editingTransaction ? 'រក្សាទុក' : 'បន្ថែម'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

