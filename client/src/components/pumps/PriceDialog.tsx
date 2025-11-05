import React, { Suspense, lazy, useState, useEffect, useMemo } from 'react';
import { FuelType, FuelPriceHistory } from '../../services/api';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { InlineLoading } from '../LoadingFallback';
import { FiDollarSign, FiClock, FiCalendar, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { formatPriceDisplay } from '../../utils/currency';

// Lazy load Calendar component
const Calendar = lazy(async () => {
  const module = await import('../ui/calendar');
  return { default: module.Calendar };
});

interface PriceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedFuelType: FuelType | null;
  priceFormData: { price: string; date: string; notes: string };
  onPriceFormDataChange: (data: { price: string; date: string; notes: string }) => void;
  isUsingDefaultPrice: boolean;
  loadingPrice: boolean;
  priceHistory: FuelPriceHistory[];
  priceHistoryLoading: boolean;
  groupedPriceHistory: Record<string, FuelPriceHistory[]>;
  onDateChange: (date: string) => void;
  onSubmit: (e: React.FormEvent, convertedPrice?: number) => void;
  onClose: () => void;
  getTodayDate: () => string;
  getDatesWithPrices: () => Date[];
  formatDateToLocalString: (date: Date) => string;
  createLocalDate: (dateStr: string) => Date;
}

export const PriceDialog: React.FC<PriceDialogProps> = ({
  open,
  onOpenChange,
  selectedFuelType,
  priceFormData,
  onPriceFormDataChange,
  isUsingDefaultPrice,
  loadingPrice,
  priceHistory,
  priceHistoryLoading,
  groupedPriceHistory,
  onDateChange,
  onSubmit,
  onClose,
  getTodayDate,
  getDatesWithPrices,
  formatDateToLocalString,
  createLocalDate,

}) => {
  const [currency, setCurrency] = useState<'USD' | 'KHR'>('USD');
  const [exchangeRate, setExchangeRate] = useState<string>(() => {
    const saved = localStorage.getItem('exchangeRate');
    return saved || '4000';
  });

  // Save exchange rate to localStorage when it changes
  useEffect(() => {
    if (exchangeRate) {
      localStorage.setItem('exchangeRate', exchangeRate);
    }
  }, [exchangeRate]);

  // Reset currency to USD when dialog opens (prices are stored in USD)
  // Only reset when dialog opens, not when price changes (user might want to switch to KHR)
  useEffect(() => {
    if (open) {
      setCurrency('USD');
    }
  }, [open]); // Only reset when dialog opens

  // Pagination state for price history
  const [historyPage, setHistoryPage] = useState(1);
  const [historyItemsPerPage, setHistoryItemsPerPage] = useState(10);

  // Get sorted and grouped price history
  const sortedGroupedHistory = useMemo(() => {
    const grouped = { ...groupedPriceHistory };
    return Object.entries(grouped)
      .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime());
  }, [groupedPriceHistory]);

  // Paginate the grouped history
  const totalHistoryPages = Math.ceil(sortedGroupedHistory.length / historyItemsPerPage);
  const startHistoryIndex = (historyPage - 1) * historyItemsPerPage;
  const endHistoryIndex = startHistoryIndex + historyItemsPerPage;
  const paginatedHistory = sortedGroupedHistory.slice(startHistoryIndex, endHistoryIndex);

  // Reset to page 1 when items per page changes
  useEffect(() => {
    setHistoryPage(1);
  }, [historyItemsPerPage]);

  // Convert price when currency changes
  const handleCurrencyChange = (newCurrency: 'USD' | 'KHR') => {
    if (!priceFormData.price) {
      setCurrency(newCurrency);
      return;
    }

    const currentPrice = parseFloat(priceFormData.price) || 0;
    const rate = parseFloat(exchangeRate) || 4000;

    if (currency === 'USD' && newCurrency === 'KHR') {
      // Convert USD to KHR
      const rielPrice = currentPrice * rate;
      onPriceFormDataChange({ ...priceFormData, price: rielPrice.toFixed(2) });
    } else if (currency === 'KHR' && newCurrency === 'USD') {
      // Convert KHR to USD
      const usdPrice = currentPrice / rate;
      onPriceFormDataChange({ ...priceFormData, price: usdPrice.toFixed(2) });
    }
    setCurrency(newCurrency);
  };

  // Calculate equivalent price in the other currency
  const getEquivalentPrice = (): string => {
    if (!priceFormData.price) return '0.00';
    const currentPrice = parseFloat(priceFormData.price) || 0;
    const rate = parseFloat(exchangeRate) || 4000;

    if (currency === 'USD') {
      const rielPrice = currentPrice * rate;
      return rielPrice.toFixed(2);
    } else {
      const usdPrice = currentPrice / rate;
      return usdPrice.toFixed(2);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} >
      <DialogContent className="w-full md:max-w-2xl mx-2 md:mx-auto flex flex-col overflow-y-auto">
        <div className="mb-4 flex-shrink-0">
          <DialogHeader>
          <DialogTitle className="text-base md:text-xl font-bold">
            កំណត់តម្លៃ - {selectedFuelType?.name || 'Loading...'}
          </DialogTitle>
          <DialogDescription className="text-xs md:text-sm mt-1">
            កំណត់តម្លៃសម្រាប់ថ្ងៃជាក់លាក់ (តម្លៃអាចប្តូរតាមថ្ងៃ)
          </DialogDescription>
          </DialogHeader>
        </div>
        
        <Tabs defaultValue="set-price" className="w-full flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="set-price">
              {/* @ts-ignore */}
              <FiDollarSign className="mr-2 h-4 w-4" />
              កំណត់តម្លៃ
            </TabsTrigger>
            <TabsTrigger value="history">
              {/* @ts-ignore */}
              <FiClock className="mr-2 h-4 w-4" />
              ប្រវត្តិតម្លៃ
            </TabsTrigger>
          </TabsList>

          <TabsContent value="set-price" className="space-y-4 md:space-y-6 flex-1 overflow-y-auto">
            <form onSubmit={async (e) => {
              e.preventDefault();
              const priceValue = parseFloat(priceFormData.price) || 0;
              
              // Validate price range (USD: 0.1 - 10 per liter, KHR: 100 - 50000 per liter)
              if (currency === 'USD') {
                if (priceValue < 0.1 || priceValue > 10) {
                  // Show validation error
                  const errorMsg = 'តម្លៃត្រូវតែចន្លោះពី $0.10 ដល់ $10.00 ក្នុង ១ លីត្រ';
                  window.alert(errorMsg);
                  return;
                }
              } else if (currency === 'KHR') {
                if (priceValue < 100 || priceValue > 50000) {
                  const errorMsg = 'តម្លៃត្រូវតែចន្លោះពី ៛100 ដល់ ៛50,000 ក្នុង ១ លីត្រ';
                  window.alert(errorMsg);
                  return;
                }
              }
              
              // Convert price to USD before submitting if in KHR
              let priceToSubmit = priceValue; // Default to current price
              
              if (currency === 'KHR' && priceFormData.price) {
                const rielPrice = priceValue;
                const rate = parseFloat(exchangeRate) || 4000;
                const usdPrice = rielPrice / rate;
                
                // Validate converted USD price
                if (usdPrice < 0.1 || usdPrice > 10) {
                  const errorMsg = `តម្លៃបម្លែងទៅ USD: $${usdPrice.toFixed(2)} មិនត្រឹមត្រូវទេ។ សូមពិនិត្យតម្លៃឬអត្រាប្តូរប្រាក់។`;
                  window.alert(errorMsg);
                  return;
                }
                
                // Update form data with USD price for display
                const updatedFormData = { ...priceFormData, price: usdPrice.toFixed(2) };
                onPriceFormDataChange(updatedFormData);
                
                // Use the converted USD price for submission
                priceToSubmit = usdPrice;
              }
              
              // Submit the form with the converted price (in USD)
              onSubmit(e, priceToSubmit);
            }}>
              {/* Mobile: Optimized Form Layout */}
              <div className="md:hidden space-y-5 py-2">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="priceDate" className="text-sm font-semibold">ថ្ងៃ</Label>
                    {priceFormData.date && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(priceFormData.date).toLocaleDateString('km-KH', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    )}
                  </div>
                  <Input
                    id="priceDate"
                    type="date"
                    value={priceFormData.date}
                    onChange={(e) => onDateChange(e.target.value)}
                    max={getTodayDate()}
                    className="h-12 text-base w-full"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">ជ្រើសថ្ងៃ</Label>
                  <Card className="w-full border-2 overflow-hidden">
                    <CardContent className="p-2 md:p-3">
                      <div className="overflow-x-auto -mx-2 px-2">
                        <Suspense fallback={<InlineLoading message="កំពុងផ្ទុកប្រតិទិន..." />}>
                          <Calendar
                            mode="single"
                            selected={priceFormData.date ? createLocalDate(priceFormData.date) : undefined}
                            defaultMonth={priceFormData.date ? createLocalDate(priceFormData.date) : new Date()}
                            onSelect={(date: Date | undefined) => {
                              if (date) {
                                const dateStr = formatDateToLocalString(date);
                                onDateChange(dateStr);
                              }
                            }}
                            disabled={(date) => date > new Date()}
                            modifiers={{
                              hasPrice: getDatesWithPrices()
                            }}
                            modifiersClassNames={{
                              hasPrice: 'text-red-500 font-bold rounded-none'
                            }}
                            className="w-full"
                            captionLayout="dropdown"
                            fromYear={2020}
                            toYear={new Date().getFullYear() + 1}
                          />
                        </Suspense>
                      </div>
                      {getDatesWithPrices().length > 0 && (
                        <div className="mt-2 pt-2 border-t">
                          <p className="text-xs text-muted-foreground text-center">
                            <span className="inline-block w-2.5 h-2.5 text-red-500 border-2 border-red-500 rounded mr-1.5 align-middle"></span>
                            ថ្ងៃដែលមានតម្លៃរួចហើយ
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-3 bg-muted/30 p-4 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="priceValue" className="text-base font-semibold">
                      តម្លៃ (ក្នុង ១ លីត្រ)
                    </Label>
                    {isUsingDefaultPrice && !loadingPrice && (
                      <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-2 py-0.5 rounded-full">
                        តម្លៃដើម
                      </span>
                    )}
                  </div>
                  
                  {/* Currency Selection */}
                  <div className="flex items-center gap-2">
                    <Select value={currency} onValueChange={(value: 'USD' | 'KHR') => handleCurrencyChange(value)}>
                      <SelectTrigger className="w-[100px] h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="KHR">KHR (៛)</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <div className="flex-1">

                      <Input
                        id="exchangeRate"
                        type="number"
                        step="1"
                        min="1"
                        value={exchangeRate}
                        onChange={(e) => setExchangeRate(e.target.value)}
                        className="h-10 text-sm"
                        placeholder="4000"
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">
                      {currency === 'USD' ? '$' : '៛'}
                    </div>
                    <Input
                      id="priceValue"
                      type="number"
                      step={currency === 'USD' ? '0.01' : '1'}
                      min="0"
                      value={priceFormData.price}
                      onChange={(e) => {
                        onPriceFormDataChange({ ...priceFormData, price: e.target.value });
                      }}
                      placeholder="0.00"
                      required
                      className="h-14 text-lg font-semibold pl-8 pr-12"
                      disabled={loadingPrice}
                    />
                    {loadingPrice && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent"></div>
                      </div>
                    )}
                  </div>
                  
                  {/* Show equivalent price */}
                  {priceFormData.price && parseFloat(priceFormData.price) > 0 && (
                    <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                      <span className="font-medium">
                        {currency === 'USD' ? '៛' : '$'}{getEquivalentPrice()}
                      </span>
                      <span className="ml-1">
                        {currency === 'USD' ? '(រៀល)' : '(ដុល្លារ)'}
                      </span>
                    </div>
                  )}
                  
                  {isUsingDefaultPrice && !loadingPrice && (
                    <p className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                      💡 តម្លៃនេះគឺជាតម្លៃដើម។ កែប្រែតម្លៃនិងរក្សាទុកដើម្បីកំណត់តម្លៃសម្រាប់ថ្ងៃនេះ។
                    </p>
                  )}
                  {loadingPrice && (
                    <p className="text-xs text-muted-foreground text-center">
                      កំពុងផ្ទុកតម្លៃ...
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priceNotes" className="text-sm font-medium text-muted-foreground">
                    ចំណាំ (ជម្រើស)
                  </Label>
                  <Input
                    id="priceNotes"
                    type="text"
                    value={priceFormData.notes}
                    onChange={(e) => onPriceFormDataChange({ ...priceFormData, notes: e.target.value })}
                    placeholder="បញ្ចូលចំណាំ..."
                    className="h-11 text-base"
                  />
                </div>
              </div>

              {/* Desktop: Table Layout */}
              <div className="hidden md:block py-4">
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="font-semibold w-[200px]">ចំណងជើង</TableHead>
                          <TableHead className="font-semibold">តម្លៃ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow className="hover:bg-muted/50">
                          <TableCell className="font-medium py-3">
                            <Label htmlFor="priceDate-table" className="text-sm">ថ្ងៃ</Label>
                            <p className="text-xs text-muted-foreground mt-1">
                              អាចកំណត់តម្លៃសម្រាប់ថ្ងៃនេះ ឬថ្ងៃមុន
                            </p>
                          </TableCell>
                          <TableCell className="py-3">
                            <div className="space-y-3">
                              <Input
                                id="priceDate-table"
                                type="date"
                                value={priceFormData.date}
                                onChange={(e) => onDateChange(e.target.value)}
                                max={getTodayDate()}
                                className="h-10 text-sm"
                                required
                              />
                              <Card className="w-full max-w-[350px]">
                                <CardContent className="p-3">
                                  <Suspense fallback={<InlineLoading message="កំពុងផ្ទុកប្រតិទិន..." />}>
                                    <Calendar
                                      mode="single"
                                      selected={priceFormData.date ? createLocalDate(priceFormData.date) : undefined}
                                      defaultMonth={priceFormData.date ? createLocalDate(priceFormData.date) : new Date()}
                                      onSelect={(date: Date | undefined) => {
                                        if (date) {
                                          const dateStr = formatDateToLocalString(date);
                                          onDateChange(dateStr);
                                        }
                                      }}
                                      disabled={(date) => date > new Date()}
                                      modifiers={{
                                        hasPrice: getDatesWithPrices()
                                      }}
                                      modifiersClassNames={{
                                        hasPrice: 'text-red-500 font-bold rounded-none'
                                      }}
                                      className="w-full"
                                      captionLayout="dropdown"
                                      fromYear={2020}
                                      toYear={new Date().getFullYear() + 1}
                                    />
                                  </Suspense>
                                  {getDatesWithPrices().length > 0 && (
                                    <div className="mt-3 pt-3 border-t">
                                      <p className="text-xs text-muted-foreground text-center">
                                        <span className="inline-block w-2.5 h-2.5 text-red-500 border-2 border-red-500 rounded mr-1.5 align-middle"></span>
                                        ថ្ងៃដែលមានតម្លៃរួចហើយ
                                      </p>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            </div>
                          </TableCell>
                        </TableRow>
                        <TableRow className="hover:bg-muted/50">
                          <TableCell className="font-medium py-3">
                            <Label htmlFor="priceValue-table" className="text-sm">
                              តម្លៃ (ក្នុង ១ លីត្រ)
                              {isUsingDefaultPrice && (
                                <span className="ml-2 text-xs text-muted-foreground font-normal block mt-1">
                                  (តម្លៃដើម - អាចកែប្រែ)
                                </span>
                              )}
                            </Label>
                          </TableCell>
                          <TableCell className="py-3">
                            <div className="space-y-3">
                              {/* Currency Selection */}
                              <div className="flex items-center gap-2">
                                <Select value={currency} onValueChange={(value: 'USD' | 'KHR') => handleCurrencyChange(value)}>
                                  <SelectTrigger className="w-[120px] h-10">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="USD">USD ($)</SelectItem>
                                    <SelectItem value="KHR">KHR (៛)</SelectItem>
                                  </SelectContent>
                                </Select>
                                
                                <div className="flex-1">

                                  <Input
                                    id="exchangeRate-table"
                                    type="number"
                                    step="1"
                                    min="1"
                                    value={exchangeRate}
                                    onChange={(e) => setExchangeRate(e.target.value)}
                                    className="h-10 text-sm"
                                    placeholder="4000"
                                  />
                                </div>
                              </div>
                              
                              <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">
                                  {currency === 'USD' ? '$' : '៛'}
                                </div>
                                <Input
                                  id="priceValue-table"
                                  type="number"
                                  step={currency === 'USD' ? '0.01' : '1'}
                                  min="0"
                                  value={priceFormData.price}
                                  onChange={(e) => {
                                    onPriceFormDataChange({ ...priceFormData, price: e.target.value });
                                  }}
                                  placeholder="0.00"
                                  required
                                  className="h-10 text-sm pl-8"
                                  disabled={loadingPrice}
                                />
                                {loadingPrice && (
                                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                  </div>
                                )}
                              </div>
                              
                              {/* Show equivalent price */}
                              {priceFormData.price && parseFloat(priceFormData.price) > 0 && (
                                <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                                  <span className="font-medium">
                                    {currency === 'USD' ? '៛' : '$'}{getEquivalentPrice()}
                                  </span>
                                  <span className="ml-1">
                                    {currency === 'USD' ? '(រៀល)' : '(ដុល្លារ)'}
                                  </span>
                                </div>
                              )}
                            </div>
                            {isUsingDefaultPrice && !loadingPrice && (
                              <p className="text-xs text-muted-foreground mt-2">
                                💡 តម្លៃនេះគឺជាតម្លៃដើម។ កែប្រែតម្លៃនិងរក្សាទុកដើម្បីកំណត់តម្លៃសម្រាប់ថ្ងៃនេះ។
                              </p>
                            )}
                            {loadingPrice && (
                              <p className="text-xs text-muted-foreground mt-2">
                                កំពុងផ្ទុកតម្លៃ...
                              </p>
                            )}
                          </TableCell>
                        </TableRow>
                        <TableRow className="hover:bg-muted/50">
                          <TableCell className="font-medium py-3">
                            <Label htmlFor="priceNotes-table" className="text-sm">ចំណាំ (បន្ថែម)</Label>
                          </TableCell>
                          <TableCell className="py-3">
                            <Input
                              id="priceNotes-table"
                              type="text"
                              value={priceFormData.notes}
                              onChange={(e) => onPriceFormDataChange({ ...priceFormData, notes: e.target.value })}
                              placeholder="ចំណាំ..."
                              className="h-10 text-sm"
                            />
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>

              <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0 mt-6 md:mt-4 pt-4 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose}
                  className="w-full sm:w-auto h-12 md:h-10 text-base md:text-sm font-medium"
                >
                  បោះបង់
                </Button>
                <Button 
                  type="submit"
                  className="w-full sm:w-auto h-12 md:h-10 text-base md:text-sm font-semibold"
                >
                  {/* @ts-ignore */}
                  <FiDollarSign className="mr-2 h-4 w-4" />
                  រក្សាទុកតម្លៃ
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="history" className="space-y-4 flex-1 flex flex-col min-h-0">
            {priceHistoryLoading ? (
              <div className="p-6 md:p-8 text-center text-muted-foreground">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-2"></div>
                <p>កំពុងផ្ទុក...</p>
              </div>
            ) : priceHistory.length === 0 ? (
              <div className="p-6 md:p-8 text-center">
                <div className="text-4xl mb-3">📅</div>
                <p className="text-muted-foreground font-medium">មិនមានប្រវត្តិតម្លៃ</p>
                <p className="text-xs text-muted-foreground mt-2">តម្លៃដំបូងនឹងបង្ហាញនៅទីនេះ</p>
              </div>
            ) : (
              <Card className="border-2 flex-1 flex flex-col min-h-0">
                <CardContent className="p-0 flex-1 flex flex-col min-h-0">
                  <div className="flex-1 overflow-y-auto min-h-0">
                    {paginatedHistory.map(([date, prices]) => (
                        <div key={date} className="last:mb-0 border-b last:border-b-0">
                          <div className="bg-muted/50 p-3 md:p-5 border-b sticky top-0 z-10">
                            <div className="flex items-center gap-2">
                              {/* @ts-ignore */}
                              <FiCalendar className="h-4 w-4 text-muted-foreground" />
                              <h3 className="font-semibold text-sm md:text-lg">{date}</h3>
                              <span className="text-xs text-muted-foreground ml-auto">
                                ({prices.length} {prices.length === 1 ? 'តម្លៃ' : 'តម្លៃ'})
                              </span>
                            </div>
                          </div>

                          <div className="hidden md:block overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="font-semibold">ពេលវេលា</TableHead>
                                  <TableHead className="text-right font-semibold">តម្លៃ</TableHead>
                                  <TableHead className="font-semibold">ចំណាំ</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {prices
                                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                  .map((price) => (
                                    <TableRow key={price._id} className="hover:bg-muted/50">
                                      <TableCell className="font-medium py-3">
                                        {new Date(price.date).toLocaleTimeString('km-KH', {
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </TableCell>
                                      <TableCell className="text-right font-bold py-3">
                                        {(() => {
                                          const { usd, riel } = formatPriceDisplay(price.price, parseFloat(exchangeRate));
                                          return (
                                            <div className="flex flex-col items-end">
                                              <span>{usd}</span>
                                              <span className="text-xs text-muted-foreground">({riel})</span>
                                            </div>
                                          );
                                        })()}
                                      </TableCell>
                                      <TableCell className="py-3 text-muted-foreground">
                                        {price.notes || '-'}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                              </TableBody>
                            </Table>
                          </div>

                          <div className="md:hidden divide-y">
                            {prices
                              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                              .map((price) => (
                                <div
                                  key={price._id}
                                  className="p-4 active:bg-accent transition-colors border-b last:border-b-0 bg-card"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-2">
                                        {/* @ts-ignore */}
                                        <FiClock className="h-4 w-4 text-primary" />
                                        <span className="text-sm font-medium text-foreground">
                                          {new Date(price.date).toLocaleTimeString('km-KH', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })}
                                        </span>
                                      </div>
                                      {price.notes && (
                                        <p className="text-xs text-muted-foreground mt-1 bg-muted/50 p-2 rounded">
                                          {price.notes}
                                        </p>
                                      )}
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                      {(() => {
                                        const { usd, riel } = formatPriceDisplay(price.price, parseFloat(exchangeRate));
                                        return (
                                          <>
                                            <p className="font-bold text-xl text-primary">{usd}</p>
                                            <p className="text-xs text-muted-foreground">{riel}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">/លីត្រ</p>
                                          </>
                                        );
                                      })()}
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      ))}
                  </div>
                  
                  {/* Custom Pagination for price history */}
                 
                </CardContent>

              </Card>
              
            )}
             {sortedGroupedHistory.length > 0 && (
                    <div className="border-t flex-shrink-0 w-full bg-background p-4">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        {/* Items info and per page selector */}
                        <div className="flex items-center gap-3">
                        
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground whitespace-nowrap">បង្ហាញ:</span>
                            <Select
                              value={historyItemsPerPage?.toString() || '10'}
                              onValueChange={(value) => setHistoryItemsPerPage(parseInt(value, 10))}
                            >
                              <SelectTrigger className="h-9 w-[80px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {[5, 10, 20, 50].map((option) => (
                                  <SelectItem key={option} value={option.toString()}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Page navigation */}
                        {totalHistoryPages > 1 && (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9 w-9 p-0"
                              onClick={() => setHistoryPage(prev => Math.max(1, prev - 1))}
                              disabled={historyPage === 1}
                              title="មុន"
                            >
                              {/* @ts-ignore */}
                              <FiChevronLeft className="h-4 w-4" />
                            </Button>
                            
                            <div className="flex items-center gap-1">
                              {Array.from({ length: Math.min(5, totalHistoryPages) }, (_, i) => {
                                let pageNum: number;
                                if (totalHistoryPages <= 5) {
                                  pageNum = i + 1;
                                } else if (historyPage <= 3) {
                                  pageNum = i + 1;
                                } else if (historyPage >= totalHistoryPages - 2) {
                                  pageNum = totalHistoryPages - 4 + i;
                                } else {
                                  pageNum = historyPage - 2 + i;
                                }
                                
                                return (
                                  <Button
                                    key={pageNum}
                                    variant={historyPage === pageNum ? 'default' : 'outline'}
                                    size="sm"
                                    className={`h-9 min-w-[36px] px-3 ${historyPage === pageNum ? 'bg-primary text-primary-foreground' : ''}`}
                                    onClick={() => setHistoryPage(pageNum)}
                                  >
                                    {pageNum}
                                  </Button>
                                );
                              })}
                            </div>

                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9 w-9 p-0"
                              onClick={() => setHistoryPage(prev => Math.min(totalHistoryPages, prev + 1))}
                              disabled={historyPage === totalHistoryPages}
                              title="បន្ទាប់"
                            >
                              {/* @ts-ignore */}
                              <FiChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

