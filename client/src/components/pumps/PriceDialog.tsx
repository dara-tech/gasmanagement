import React, { Suspense, lazy } from 'react';
import { FuelType, FuelPriceHistory } from '../../services/api';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { InlineLoading } from '../LoadingFallback';
import { FiDollarSign, FiClock, FiCalendar } from 'react-icons/fi';

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
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  getTodayDate: () => string;
  getDatesWithPrices: () => Date[];
  formatDateToLocalString: (date: Date) => string;
  createLocalDate: (dateStr: string) => Date;
  formatDateShort: (dateString: string) => string;
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
  formatDateShort,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full md:max-w-4xl mx-2 md:mx-auto max-h-[95vh] md:max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-base md:text-xl font-bold">
            កំណត់តម្លៃ - {selectedFuelType?.name || 'Loading...'}
          </DialogTitle>
          <DialogDescription className="text-xs md:text-sm mt-1">
            កំណត់តម្លៃសម្រាប់ថ្ងៃជាក់លាក់ (តម្លៃអាចប្តូរតាមថ្ងៃ)
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="set-price" className="w-full mt-4">
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

          <TabsContent value="set-price" className="space-y-4 md:space-y-6">
            <form onSubmit={onSubmit}>
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
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">
                      $
                    </div>
                    <Input
                      id="priceValue"
                      type="number"
                      step="0.01"
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
                            <div className="relative">
                              <Input
                                id="priceValue-table"
                                type="number"
                                step="0.01"
                                min="0"
                                value={priceFormData.price}
                                onChange={(e) => {
                                  onPriceFormDataChange({ ...priceFormData, price: e.target.value });
                                }}
                                placeholder="0.00"
                                required
                                className="h-10 text-sm"
                                disabled={loadingPrice}
                              />
                              {loadingPrice && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
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

          <TabsContent value="history" className="space-y-4">
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
              <Card className="border-2">
                <CardContent className="p-0">
                  <div className="max-h-[60vh] md:max-h-[70vh] overflow-y-auto">
                    {Object.entries(groupedPriceHistory)
                      .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
                      .map(([date, prices]) => (
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
                                        ${price.price.toFixed(2)}
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
                                      <p className="font-bold text-xl text-primary">${price.price.toFixed(2)}</p>
                                      <p className="text-xs text-muted-foreground mt-0.5">/លីត្រ</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

