import React, { useEffect, useState, Suspense } from 'react';
import { pumpsAPI, fuelTypesAPI, stockEntriesAPI, fuelPricesAPI, Pump, FuelType, StockEntry, FuelPriceHistory } from '../services/api';
import { useToast } from '../hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { createLazyComponent } from '../utils/lazyLoad';
import { InlineLoading } from '../components/LoadingFallback';

// Eagerly load critical tab components (always visible)
import { FuelTypesTab, PumpsTab, StockEntriesTab } from '../components/pumps';

// Lazy load only dialogs (optional, only shown when user clicks)
const PumpDialog = createLazyComponent(() => import('../components/pumps').then(m => ({ default: m.PumpDialog })), 'PumpDialog');
const StockDialog = createLazyComponent(() => import('../components/pumps').then(m => ({ default: m.StockDialog })), 'StockDialog');
const FuelTypeDialog = createLazyComponent(() => import('../components/pumps').then(m => ({ default: m.FuelTypeDialog })), 'FuelTypeDialog');
const PriceDialog = createLazyComponent(() => import('../components/pumps').then(m => ({ default: m.PriceDialog })), 'PriceDialog');
const DeleteConfirmDialog = createLazyComponent(() => import('../components/pumps').then(m => ({ default: m.DeleteConfirmDialog })), 'DeleteConfirmDialog');

const Pumps: React.FC = () => {
  const { toast } = useToast();
  const [pumps, setPumps] = useState<Pump[]>([]);
  const [fuelTypes, setFuelTypes] = useState<FuelType[]>([]);
  const [stockEntries, setStockEntries] = useState<StockEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Check if a fuel type is being used by any pump
  const isFuelTypeInUse = (fuelTypeId: string): boolean => {
    return pumps.some(pump => {
      const pumpFuelTypeId = typeof pump.fuelTypeId === 'object' ? pump.fuelTypeId._id : pump.fuelTypeId;
      return pumpFuelTypeId === fuelTypeId;
    });
  };

  // Get pumps using a specific fuel type
  const getPumpsUsingFuelType = (fuelTypeId: string): Pump[] => {
    return pumps.filter(pump => {
      const pumpFuelTypeId = typeof pump.fuelTypeId === 'object' ? pump.fuelTypeId._id : pump.fuelTypeId;
      return pumpFuelTypeId === fuelTypeId;
    });
  };
  
  // Pump management states
  const [pumpDialogOpen, setPumpDialogOpen] = useState(false);
  const [editingPump, setEditingPump] = useState<Pump | null>(null);
  const [pumpDeleteDialogOpen, setPumpDeleteDialogOpen] = useState(false);
  const [pumpToDelete, setPumpToDelete] = useState<string | null>(null);
  const [pumpFormData, setPumpFormData] = useState({ 
    pumpNumber: '', 
    fuelTypeId: '', 
    status: 'active'
  });

  // Stock entry states
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [editingStockEntry, setEditingStockEntry] = useState<StockEntry | null>(null);
  const [stockDeleteDialogOpen, setStockDeleteDialogOpen] = useState(false);
  const [stockEntryToDelete, setStockEntryToDelete] = useState<string | null>(null);
  const [submittingStock, setSubmittingStock] = useState(false);
  const [stockFormData, setStockFormData] = useState({ 
    fuelTypeId: '', 
    pumpId: '',
    liters: '',
    pricePerLiter: '',
    date: '',
    notes: ''
  });
  const [calculatedTotalCost, setCalculatedTotalCost] = useState(0);

  // Fuel type management states
  const [fuelTypeDialogOpen, setFuelTypeDialogOpen] = useState(false);
  const [editingFuelType, setEditingFuelType] = useState<FuelType | null>(null);
  const [fuelTypeDeleteDialogOpen, setFuelTypeDeleteDialogOpen] = useState(false);
  const [fuelTypeToDelete, setFuelTypeToDelete] = useState<string | null>(null);
  const [fuelTypeFormData, setFuelTypeFormData] = useState({ 
    name: '', 
    unit: 'liter' 
  });

  // Price management states
  const [priceDialogOpen, setPriceDialogOpen] = useState(false);
  const [selectedFuelType, setSelectedFuelType] = useState<FuelType | null>(null);
  const [priceFormData, setPriceFormData] = useState({ price: '', date: '', notes: '' });
  const [isUsingDefaultPrice, setIsUsingDefaultPrice] = useState(false);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [priceHistory, setPriceHistory] = useState<FuelPriceHistory[]>([]);
  const [priceHistoryLoading, setPriceHistoryLoading] = useState(false);
  const [currentPrices, setCurrentPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchData();
  }, []);

  // Recalculate total cost when liters or price changes
  useEffect(() => {
    if (stockFormData.liters && stockFormData.pricePerLiter) {
      const liters = parseFloat(stockFormData.liters) || 0;
      const price = parseFloat(stockFormData.pricePerLiter) || 0;
      const totalCost = liters * price;
      setCalculatedTotalCost(isNaN(totalCost) ? 0 : totalCost);
    } else {
      setCalculatedTotalCost(0);
    }
  }, [stockFormData.liters, stockFormData.pricePerLiter]);

  // Fetch price history when fuel type is selected in price dialog
  useEffect(() => {
    if (selectedFuelType && priceDialogOpen) {
      fetchPriceHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFuelType, priceDialogOpen]);

  const fetchData = async () => {
    try {
      const [pumpsData, fuelTypesData, stockEntriesData] = await Promise.all([
        pumpsAPI.getAll(),
        fuelTypesAPI.getAll(),
        stockEntriesAPI.getAll(),
      ]);
      setPumps(pumpsData);
      setFuelTypes(fuelTypesData);
      setStockEntries(stockEntriesData);
      
      // Fetch current prices for all fuel types (silently fail if no prices exist)
      const pricePromises = fuelTypesData.map(async (fuelType) => {
        try {
          const priceData = await fuelPricesAPI.getCurrent(fuelType._id);
          return { id: fuelType._id, price: priceData.price };
        } catch (error: any) {
          // 404 is expected if no price history exists - use default price
          if (error?.response?.status === 404) {
            return { id: fuelType._id, price: fuelType.price || 0 };
          }
          // For other errors, still use default price but log
          console.warn(`Error fetching price for ${fuelType.name}:`, error?.response?.status || error);
          return { id: fuelType._id, price: fuelType.price || 0 };
        }
      });
      const prices = await Promise.all(pricePromises);
      const priceMap: Record<string, number> = {};
      prices.forEach(({ id, price }) => {
        priceMap[id] = price;
      });
      setCurrentPrices(priceMap);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ========== Pump Management Functions ==========
  const handleOpenPumpDialog = (pump?: Pump) => {
    if (pump) {
      setEditingPump(pump);
      setPumpFormData({
        pumpNumber: pump.pumpNumber,
        fuelTypeId: typeof pump.fuelTypeId === 'object' ? pump.fuelTypeId._id : pump.fuelTypeId,
        status: pump.status,
      });
    } else {
      setEditingPump(null);
      setPumpFormData({ 
        pumpNumber: '', 
        fuelTypeId: '', 
        status: 'active'
      });
    }
    setPumpDialogOpen(true);
  };

  const handleClosePumpDialog = () => {
    setPumpDialogOpen(false);
    setEditingPump(null);
    setPumpFormData({ 
      pumpNumber: '', 
      fuelTypeId: '', 
      status: 'active'
    });
  };

  const handlePumpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPump) {
        await pumpsAPI.update(editingPump._id, {
          pumpNumber: pumpFormData.pumpNumber,
          fuelTypeId: pumpFormData.fuelTypeId,
          status: pumpFormData.status,
        });
      } else {
        await pumpsAPI.create({
          pumpNumber: pumpFormData.pumpNumber,
          fuelTypeId: pumpFormData.fuelTypeId,
          status: pumpFormData.status,
        });
      }
      handleClosePumpDialog();
      fetchData();
      toast({
        variant: 'success',
        title: 'ជោគជ័យ',
        description: editingPump ? 'កែប្រែស្តុកសាំងដោយជោគជ័យ' : 'បន្ថែមស្តុកសាំងដោយជោគជ័យ',
      });
    } catch (error) {
      console.error('Error saving pump:', error);
      toast({
        variant: 'destructive',
        title: 'កំហុស',
        description: 'មានកំហុសក្នុងការរក្សាទុក',
      });
    }
  };

  const handlePumpDeleteClick = (id: string) => {
    setPumpToDelete(id);
    setPumpDeleteDialogOpen(true);
  };

  const handlePumpDelete = async () => {
    if (!pumpToDelete) return;
    
    try {
      await pumpsAPI.delete(pumpToDelete);
      fetchData();
      setPumpDeleteDialogOpen(false);
      setPumpToDelete(null);
      toast({
        variant: 'success',
        title: 'ជោគជ័យ',
        description: 'លុបស្តុកសាំងដោយជោគជ័យ',
      });
    } catch (error) {
      console.error('Error deleting pump:', error);
      toast({
        variant: 'destructive',
        title: 'កំហុស',
        description: 'មានកំហុសក្នុងការលុប',
      });
    }
  };

  // ========== Stock Entry Functions ==========
  const handleOpenStockDialog = (stockEntry?: StockEntry) => {
    if (stockEntry) {
      setEditingStockEntry(stockEntry);
      const fuelType = typeof stockEntry.fuelTypeId === 'object' ? stockEntry.fuelTypeId : null;
      const pump = typeof stockEntry.pumpId === 'object' ? stockEntry.pumpId : null;
      const entryDate = new Date(stockEntry.date);
      const dateStr = entryDate.toISOString().split('T')[0];
      setStockFormData({
        fuelTypeId: fuelType?._id || '',
        pumpId: pump?._id || '',
        liters: stockEntry.liters.toString(),
        pricePerLiter: stockEntry.pricePerLiter?.toString() || '',
        date: dateStr,
        notes: stockEntry.notes || '',
      });
    } else {
      setEditingStockEntry(null);
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      setStockFormData({ 
        fuelTypeId: '', 
        pumpId: '',
        liters: '',
        pricePerLiter: '',
        date: dateStr,
        notes: ''
      });
      setCalculatedTotalCost(0);
    }
    setStockDialogOpen(true);
  };

  const handleCloseStockDialog = () => {
    setStockDialogOpen(false);
    setEditingStockEntry(null);
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    setStockFormData({ 
      fuelTypeId: '', 
      pumpId: '',
      liters: '',
      pricePerLiter: '',
      date: dateStr,
      notes: ''
    });
    setCalculatedTotalCost(0);
  };

  const handleFuelTypeChange = (fuelTypeId: string) => {
    // Update fuel type
    const updatedFormData = { ...stockFormData, fuelTypeId };
    
    // Smart detection: Auto-select the first pump that uses this fuel type
    // Only auto-select if no pump is currently selected or if the current pump doesn't match
    if (!stockFormData.pumpId || stockFormData.pumpId === '') {
      // Find pumps that use this fuel type
      const matchingPumps = getPumpsUsingFuelType(fuelTypeId);
      
      // Auto-select the first matching pump (prefer active pumps)
      const activePump = matchingPumps.find(pump => pump.status === 'active');
      const pumpToSelect = activePump || matchingPumps[0];
      
      if (pumpToSelect) {
        updatedFormData.pumpId = pumpToSelect._id;
      }
    } else {
      // Check if currently selected pump matches the fuel type
      const currentPump = pumps.find(p => p._id === stockFormData.pumpId);
      if (currentPump) {
        const pumpFuelTypeId = typeof currentPump.fuelTypeId === 'object' 
          ? currentPump.fuelTypeId._id 
          : currentPump.fuelTypeId;
        
        // If current pump doesn't match, auto-select a matching one
        if (pumpFuelTypeId !== fuelTypeId) {
          const matchingPumps = getPumpsUsingFuelType(fuelTypeId);
          const activePump = matchingPumps.find(pump => pump.status === 'active');
          const pumpToSelect = activePump || matchingPumps[0];
          
          if (pumpToSelect) {
            updatedFormData.pumpId = pumpToSelect._id;
          } else {
            // No matching pump found, clear the selection
            updatedFormData.pumpId = '';
          }
        }
      }
    }
    
    setStockFormData(updatedFormData);
  };

  const handleLitersChange = (liters: string) => {
    setStockFormData({ ...stockFormData, liters });
  };

  const handlePriceChange = (price: string) => {
    setStockFormData({ ...stockFormData, pricePerLiter: price });
  };


  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingStock) return; // Prevent double submission
    
    setSubmittingStock(true);
    
    // Optimistic update: Update pump stock immediately for better UX
    const pump = pumps.find(p => p._id === stockFormData.pumpId);
    
    if (pump && !editingStockEntry) {
      const litersValue = parseFloat(stockFormData.liters) || 0;
      // Optimistically update pump stock
      setPumps(prevPumps => prevPumps.map(p => 
        p._id === pump._id 
          ? { ...p, stockLiters: (p.stockLiters || 0) + litersValue }
          : p
      ));
    }
    
    try {
      // Validate and convert to numbers - ensure we have valid inputs
      // Double-check that values are not empty or invalid
      const litersStr = stockFormData.liters?.trim() || '';
      const priceStr = stockFormData.pricePerLiter?.trim() || '';
      
      if (!litersStr || litersStr === '') {
        toast({
          variant: 'destructive',
          title: 'កំហុស',
          description: 'សូមបញ្ចូលបរិមាណលីត្រ',
        });
        return;
      }
      
      if (!priceStr || priceStr === '') {
        toast({
          variant: 'destructive',
          title: 'កំហុស',
          description: 'សូមបញ្ចូលតម្លៃទិញ',
        });
        return;
      }
      
      // Parse and validate numbers
      const liters = parseFloat(litersStr);
      const pricePerLiter = parseFloat(priceStr);
      
      // Strict validation - ensure they are actual numbers, not NaN
      if (typeof liters !== 'number' || isNaN(liters) || liters <= 0 || !isFinite(liters)) {
        toast({
          variant: 'destructive',
          title: 'កំហុស',
          description: 'សូមបញ្ចូលបរិមាណលីត្រដែលត្រឹមត្រូវ (ត្រូវការលេខធំជាង ០)',
        });
        return;
      }

      if (typeof pricePerLiter !== 'number' || isNaN(pricePerLiter) || pricePerLiter < 0 || !isFinite(pricePerLiter)) {
        toast({
          variant: 'destructive',
          title: 'កំហុស',
          description: 'សូមបញ្ចូលតម្លៃទិញដែលត្រឹមត្រូវ (ត្រូវការលេខធំជាងឬស្មើ ០)',
        });
        return;
      }

      if (!stockFormData.fuelTypeId || !stockFormData.pumpId) {
        toast({
          variant: 'destructive',
          title: 'កំហុស',
          description: 'សូមជ្រើសប្រភេទសាំង និងស្តុកសាំង',
        });
        return;
      }

      const stockDate = stockFormData.date
        ? new Date(`${stockFormData.date}T12:00:00`)
        : new Date();

      // liters and pricePerLiter are already validated numbers from above
      // Create data object with proper types - ensuring numbers are explicitly typed
      const stockData: {
        fuelTypeId: string;
        pumpId: string;
        liters: number;
        pricePerLiter: number;
        date: string;
        notes: string;
      } = {
        fuelTypeId: String(stockFormData.fuelTypeId).trim(),
        pumpId: String(stockFormData.pumpId).trim(),
        liters: Number(liters), // Explicitly ensure number type
        pricePerLiter: Number(pricePerLiter), // Explicitly ensure number type
        date: stockDate.toISOString(),
        notes: (stockFormData.notes || '').trim()
      };

      if (editingStockEntry) {
        await stockEntriesAPI.update(editingStockEntry._id, stockData);
      } else {
        await stockEntriesAPI.create(stockData);
      }
      handleCloseStockDialog();
      fetchData();
      toast({
        variant: 'success',
        title: 'ជោគជ័យ',
        description: editingStockEntry ? 'កែប្រែស្តុកដោយជោគជ័យ' : 'បន្ថែមស្តុកដោយជោគជ័យ',
      });
    } catch (error: any) {
      // Get detailed error message
      let errorMessage = 'មានកំហុសក្នុងការរក្សាទុក';
      const errorData = error?.response?.data;
      
      if (errorData) {
        // Check for validation errors object
        if (errorData.errors && typeof errorData.errors === 'object') {
          const errorList = Object.entries(errorData.errors)
            .map(([field, msg]) => `${field}: ${msg}`)
            .join(', ');
          errorMessage = errorList || errorData.message || errorMessage;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.validationError) {
          errorMessage = errorData.validationError;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        variant: 'destructive',
        title: 'កំហុស',
        description: errorMessage,
      });
      
      // Revert optimistic update on error
      if (pump && !editingStockEntry) {
        const litersValue = parseFloat(stockFormData.liters) || 0;
        setPumps(prevPumps => prevPumps.map(p => 
          p._id === pump._id 
            ? { ...p, stockLiters: Math.max(0, (p.stockLiters || 0) - litersValue) }
            : p
        ));
      }
    } finally {
      setSubmittingStock(false);
    }
  };

  const handleStockDeleteClick = (id: string) => {
    setStockEntryToDelete(id);
    setStockDeleteDialogOpen(true);
  };

  const handleStockDelete = async () => {
    if (!stockEntryToDelete) return;
    
    // Find the stock entry to delete for optimistic update
    const stockEntry = stockEntries.find(se => se._id === stockEntryToDelete);
    const pump = stockEntry && typeof stockEntry.pumpId === 'object' 
      ? pumps.find(p => p._id === stockEntry.pumpId._id)
      : null;
    
    // Optimistic update: Remove from list and update pump stock immediately
    if (stockEntry && pump) {
      const litersToRestore = stockEntry.liters;
      // Remove from list immediately
      setStockEntries(prev => prev.filter(se => se._id !== stockEntryToDelete));
      // Optimistically restore pump stock
      setPumps(prevPumps => prevPumps.map(p => 
        p._id === pump._id 
          ? { ...p, stockLiters: Math.max(0, (p.stockLiters || 0) - litersToRestore) }
          : p
      ));
    }
    
    setStockDeleteDialogOpen(false);
    const entryIdToDelete = stockEntryToDelete;
    setStockEntryToDelete(null);
    
    try {
      await stockEntriesAPI.delete(entryIdToDelete);
      // Refresh to get accurate data
      await fetchData();
      toast({
        variant: 'success',
        title: 'ជោគជ័យ',
        description: 'លុបស្តុកដោយជោគជ័យ',
      });
    } catch (error) {
      console.error('Error deleting stock entry:', error);
      // Revert optimistic update on error
      if (stockEntry) {
        setStockEntries(prev => [...prev, stockEntry].sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        ));
      }
      if (pump && stockEntry) {
        const litersToRestore = stockEntry.liters;
        setPumps(prevPumps => prevPumps.map(p => 
          p._id === pump._id 
            ? { ...p, stockLiters: (p.stockLiters || 0) + litersToRestore }
            : p
        ));
      }
      toast({
        variant: 'destructive',
        title: 'កំហុស',
        description: 'មានកំហុសក្នុងការលុប',
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper function to format date in YYYY-MM-DD format using local timezone
  const formatDateToLocalString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper function to create a Date object from YYYY-MM-DD string at local midnight
  const createLocalDate = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  };

  // ========== Fuel Type Management Functions ==========
  const handleOpenFuelTypeDialog = (fuelType?: FuelType) => {
    if (fuelType) {
      setEditingFuelType(fuelType);
      setFuelTypeFormData({
        name: fuelType.name,
        unit: fuelType.unit || 'liter',
      });
    } else {
      setEditingFuelType(null);
      setFuelTypeFormData({ name: '', unit: 'liter' });
    }
    setFuelTypeDialogOpen(true);
  };

  const handleCloseFuelTypeDialog = () => {
    setFuelTypeDialogOpen(false);
    setEditingFuelType(null);
    setFuelTypeFormData({ name: '', unit: 'liter' });
  };

  const handleFuelTypeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingFuelType) {
        await fuelTypesAPI.update(editingFuelType._id, {
          name: fuelTypeFormData.name,
          price: 0, // No default price - managed via date-based pricing
          unit: fuelTypeFormData.unit,
        });
      } else {
        await fuelTypesAPI.create({
          name: fuelTypeFormData.name,
          price: 0, // No default price - managed via date-based pricing
          unit: fuelTypeFormData.unit,
        });
      }
      handleCloseFuelTypeDialog();
      fetchData();
      toast({
        variant: 'success',
        title: 'ជោគជ័យ',
        description: editingFuelType ? 'កែប្រែប្រភេទសាំងដោយជោគជ័យ' : 'បន្ថែមប្រភេទសាំងដោយជោគជ័យ',
      });
    } catch (error) {
      console.error('Error saving fuel type:', error);
      toast({
        variant: 'destructive',
        title: 'កំហុស',
        description: 'មានកំហុសក្នុងការរក្សាទុក',
      });
    }
  };

  const handleFuelTypeDeleteClick = (id: string) => {
    setFuelTypeToDelete(id);
    setFuelTypeDeleteDialogOpen(true);
  };

  const handleFuelTypeDelete = async () => {
    if (!fuelTypeToDelete) return;
    
    // Check if fuel type is in use
    if (isFuelTypeInUse(fuelTypeToDelete)) {
      const usingPumps = getPumpsUsingFuelType(fuelTypeToDelete);
      const pumpNumbers = usingPumps.map(p => p.pumpNumber).join(', ');
      toast({
        variant: 'destructive',
        title: 'មិនអាចលុប',
        description: `ប្រភេទសាំងនេះកំពុងត្រូវបានប្រើប្រាស់ដោយស្តុកសាំង: ${pumpNumbers}. សូមលុបឬកែប្រែស្តុកសាំងមុន។`,
      });
      setFuelTypeDeleteDialogOpen(false);
      setFuelTypeToDelete(null);
      return;
    }
    
    try {
      await fuelTypesAPI.delete(fuelTypeToDelete);
      fetchData();
      setFuelTypeDeleteDialogOpen(false);
      setFuelTypeToDelete(null);
      toast({
        variant: 'success',
        title: 'ជោគជ័យ',
        description: 'លុបប្រភេទសាំងដោយជោគជ័យ',
      });
    } catch (error: any) {
      console.error('Error deleting fuel type:', error);
      const errorMessage = error?.response?.data?.message || 'មានកំហុសក្នុងការលុប';
      toast({
        variant: 'destructive',
        title: 'កំហុស',
        description: errorMessage,
      });
    }
  };

  // ========== Price Management Functions ==========
  const handleOpenPriceDialog = async (fuelType: FuelType) => {
    setSelectedFuelType(fuelType);
    const today = getTodayDate();
    
    // Set fuel type and open dialog immediately
    setPriceDialogOpen(true);
    
    // Set initial form data
    const initialPrice = currentPrices[fuelType._id] || fuelType.price || 0;
    setPriceFormData({
      price: initialPrice.toString(),
      date: today,
      notes: ''
    });
    setIsUsingDefaultPrice(true);
    
    // Fetch price history first so calendar can highlight dates
    try {
      const history = await fuelPricesAPI.getAll(fuelType._id);
      setPriceHistory(history);
    } catch (error: any) {
      // 404 is expected if no price history exists - just use empty array
      if (error?.response?.status === 404) {
        setPriceHistory([]);
      } else {
        console.error('Error fetching price history:', error);
        setPriceHistory([]);
      }
    }
    
    // Fetch price for today
    try {
      const priceData = await fuelPricesAPI.getByDate(fuelType._id, today);
      setPriceFormData({
        price: priceData.price.toString(),
        date: today,
        notes: priceData.notes || ''
      });
      setIsUsingDefaultPrice(priceData.isDefault || false);
    } catch (error: any) {
      // 404 is expected if no price for today - use default price
      if (error?.response?.status === 404) {
        // Keep the initial price we already set
        setIsUsingDefaultPrice(true);
      } else {
        console.error('Error fetching price for today:', error);
        setIsUsingDefaultPrice(true);
      }
    }
  };

  const handleDateChange = async (selectedDate: string) => {
    if (!selectedDate || !selectedFuelType) return;
    
    setPriceFormData(prev => ({ ...prev, date: selectedDate }));
    setLoadingPrice(true);
    
    try {
      const priceData = await fuelPricesAPI.getByDate(selectedFuelType._id, selectedDate);
      setPriceFormData(prev => ({
        ...prev,
        date: selectedDate,
        price: priceData.price.toString(),
        notes: priceData.notes || ''
      }));
      setIsUsingDefaultPrice(priceData.isDefault || false);
    } catch (error: any) {
      // 404 is expected if no price for this date - use default price
      const defaultPrice = (selectedFuelType?.price && selectedFuelType.price > 0) ? selectedFuelType.price : (currentPrices[selectedFuelType?._id || ''] || 0);
      setPriceFormData(prev => ({
        ...prev,
        date: selectedDate,
        price: defaultPrice.toString(),
        notes: ''
      }));
      setIsUsingDefaultPrice(true);
      // Only log non-404 errors
      if (error?.response?.status !== 404) {
        console.error('Error fetching price for date:', error);
      }
    } finally {
      setLoadingPrice(false);
    }
  };

  const handleClosePriceDialog = () => {
    setPriceDialogOpen(false);
    setSelectedFuelType(null);
    setPriceFormData({ price: '', date: '', notes: '' });
    setIsUsingDefaultPrice(false);
    setPriceHistory([]);
  };

  const handlePriceSubmit = async (e: React.FormEvent, convertedPrice?: number) => {
    e.preventDefault();
    if (!selectedFuelType) return;

    // Use the converted price if provided, otherwise use priceFormData.price
    // The PriceDialog component converts KHR to USD and passes it directly
    const priceToSave = convertedPrice !== undefined ? convertedPrice : parseFloat(priceFormData.price);
    const savedDate = priceFormData.date;

    if (isNaN(priceToSave) || priceToSave <= 0) {
      toast({
        variant: 'destructive',
        title: 'កំហុស',
        description: 'សូមបញ្ចូលតម្លៃដែលត្រឹមត្រូវ',
      });
      return;
    }

    try {
      await fuelPricesAPI.setPriceForDate(selectedFuelType._id, {
        price: priceToSave, // Already in USD (converted if needed)
        date: priceFormData.date,
        notes: priceFormData.notes
      });
      
      const dateStr = savedDate ? (() => {
        const date = new Date(savedDate);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      })() : '';
      toast({
        variant: 'success',
        title: 'ជោគជ័យ',
        description: dateStr 
          ? `$${priceToSave.toFixed(2)} សម្រាប់ថ្ងៃ ${dateStr} ដោយជោគជ័យ`
          : 'កំណត់តម្លៃដោយជោគជ័យ',
      });
      
      handleClosePriceDialog();
      await fetchData();
    } catch (error: any) {
      // Only log actual errors (not expected 404s)
      if (error?.response?.status !== 404) {
        console.error('Error setting price:', error);
      }
      toast({
        variant: 'destructive',
        title: 'កំហុស',
        description: error?.response?.data?.message || 'មានកំហុសក្នុងការរក្សាទុកតម្លៃ',
      });
    }
  };

  const fetchPriceHistory = async () => {
    if (!selectedFuelType) return;
    
    try {
      setPriceHistoryLoading(true);
      const history = await fuelPricesAPI.getAll(selectedFuelType._id);
      setPriceHistory(history);
    } catch (error: any) {
      // 404 is expected if no price history exists - just use empty array
      if (error?.response?.status === 404) {
        setPriceHistory([]);
      } else {
        console.error('Error fetching price history:', error);
        setPriceHistory([]);
      }
    } finally {
      setPriceHistoryLoading(false);
    }
  };

  const getDatesWithPrices = () => {
    if (!priceHistory || priceHistory.length === 0) return [];
    return priceHistory.map(price => {
      // Use the same parsing logic as formatDateShort to ensure consistency
      // Create Date object from the date string (same as history display)
      const dateObj = typeof price.date === 'string' ? new Date(price.date) : (price.date as Date);
      // Get local date components (same as formatDateShort uses for display)
      const year = dateObj.getFullYear();
      const month = dateObj.getMonth();
      const day = dateObj.getDate();
      // Create date at local midnight using these local components
      // This matches how the history displays dates, ensuring consistency
      const date = new Date(year, month, day, 0, 0, 0, 0);
      return date;
    });
  };

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const groupedPriceHistory = priceHistory.reduce((acc, price) => {
    const dateKey = formatDateShort(price.date);
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(price);
    return acc;
  }, {} as Record<string, FuelPriceHistory[]>);

  if (loading) {
    return <div className="p-4 md:p-6 min-h-screen flex items-center justify-center">
      <InlineLoading message="កំពុងផ្ទុកស្តុកសាំង..." />
    </div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl md:text-3xl font-bold">ស្តុកសាំង</h1>
          <p className="text-xs md:text-base text-muted-foreground mt-0.5">គ្រប់គ្រងស្តុកសាំង និងបន្ថែមស្តុក</p>
        </div>
      </div>
      <Tabs defaultValue="fuel-types" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-3 md:mb-4 h-auto gap-0.5 md:gap-1">
          <TabsTrigger 
            value="fuel-types" 
            className="text-[11px] sm:text-xs md:text-sm lg:text-base py-2 md:py-1.5 px-1 sm:px-2 md:px-3 whitespace-nowrap overflow-hidden text-ellipsis min-h-[2.75rem] md:min-h-0 data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            <span className="hidden sm:inline">ប្រភេទសាំង</span>
            <span className="sm:hidden">ប្រភេទ</span>
          </TabsTrigger>
          <TabsTrigger 
            value="pumps" 
            className="text-[11px] sm:text-xs md:text-sm lg:text-base py-2 md:py-1.5 px-1 sm:px-2 md:px-3 whitespace-nowrap overflow-hidden text-ellipsis min-h-[2.75rem] md:min-h-0 data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            <span className="hidden sm:inline">គ្រប់គ្រងស្តុកសាំង</span>
            <span className="sm:hidden">ស្តុក</span>
          </TabsTrigger>
          <TabsTrigger 
            value="stock" 
            className="text-[11px] sm:text-xs md:text-sm lg:text-base py-2 md:py-1.5 px-1 sm:px-2 md:px-3 whitespace-nowrap overflow-hidden text-ellipsis min-h-[2.75rem] md:min-h-0 data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            <span className="hidden sm:inline">បន្ថែមស្តុក</span>
            <span className="sm:hidden">បន្ថែម</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Fuel Types */}
        <TabsContent value="fuel-types" className="space-y-4">
          <FuelTypesTab
              fuelTypes={fuelTypes}
              pumps={pumps}
              onAdd={() => handleOpenFuelTypeDialog()}
              onEdit={handleOpenFuelTypeDialog}
              onDelete={handleFuelTypeDeleteClick}
              onSetPrice={handleOpenPriceDialog}
              isFuelTypeInUse={isFuelTypeInUse}
              getPumpsUsingFuelType={getPumpsUsingFuelType}
            />
        </TabsContent>

        {/* Tab 1: Pump Management */}
        <TabsContent value="pumps" className="space-y-4">
          <PumpsTab
              pumps={pumps}
              fuelTypes={fuelTypes}
              currentPrices={currentPrices}
              onAdd={() => handleOpenPumpDialog()}
              onEdit={handleOpenPumpDialog}
              onDelete={handlePumpDeleteClick}
            />
        </TabsContent>

        {/* Tab 2: Stock Entries */}
        <TabsContent value="stock" className="space-y-4">
          <StockEntriesTab
              stockEntries={stockEntries}
              pumps={pumps}
              fuelTypes={fuelTypes}
              onAdd={() => handleOpenStockDialog()}
              onEdit={handleOpenStockDialog}
              onDelete={handleStockDeleteClick}
              formatDate={formatDate}
            />
        </TabsContent>
      </Tabs>

      {/* Pump Management Dialog */}
      <Suspense fallback={null}>
        <PumpDialog
          open={pumpDialogOpen}
          onOpenChange={setPumpDialogOpen}
          editingPump={editingPump}
          fuelTypes={fuelTypes}
          formData={pumpFormData}
          onFormDataChange={setPumpFormData}
          onSubmit={handlePumpSubmit}
          onClose={handleClosePumpDialog}
        />
      </Suspense>

      {/* Pump Delete Dialog */}
      <Suspense fallback={null}>
        <DeleteConfirmDialog
          open={pumpDeleteDialogOpen}
          onOpenChange={setPumpDeleteDialogOpen}
          title="លុបស្តុកសាំង"
          description="តើអ្នកពិតជាចង់លុបស្តុកសាំងនេះមែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។"
          onConfirm={handlePumpDelete}
          onCancel={() => {
                  setPumpDeleteDialogOpen(false);
                  setPumpToDelete(null);
                }}
        />
      </Suspense>

      {/* Stock Entry Dialog */}
      <Suspense fallback={null}>
        <StockDialog
          open={stockDialogOpen}
          onOpenChange={setStockDialogOpen}
          editingStockEntry={editingStockEntry}
          fuelTypes={fuelTypes}
          pumps={pumps}
        formData={stockFormData}
        calculatedTotalCost={calculatedTotalCost}
        onFormDataChange={setStockFormData}
        onFuelTypeChange={handleFuelTypeChange}
        onLitersChange={handleLitersChange}
        onPriceChange={handlePriceChange}
          onSubmit={handleStockSubmit}
          onClose={handleCloseStockDialog}
          getTodayDate={getTodayDate}
          submitting={submittingStock}
        />
      </Suspense>

      {/* Stock Delete Dialog */}
      <Suspense fallback={null}>
        <DeleteConfirmDialog
          open={stockDeleteDialogOpen}
          onOpenChange={setStockDeleteDialogOpen}
          title="លុបស្តុក"
          description="តើអ្នកពិតជាចង់លុបស្តុកនេះមែនទេ? សកម្មភាពនេះនឹងកាត់បន្ថយស្តុកពីស្តុកសាំង។"
          onConfirm={handleStockDelete}
          onCancel={() => {
                  setStockDeleteDialogOpen(false);
                  setStockEntryToDelete(null);
                }}
        />
      </Suspense>

      {/* Fuel Type Dialog */}
      <Suspense fallback={null}>
        <FuelTypeDialog
          open={fuelTypeDialogOpen}
          onOpenChange={setFuelTypeDialogOpen}
          editingFuelType={editingFuelType}
          formData={fuelTypeFormData}
          onFormDataChange={setFuelTypeFormData}
          onSubmit={handleFuelTypeSubmit}
          onClose={handleCloseFuelTypeDialog}
        />
      </Suspense>

      {/* Fuel Type Delete Dialog */}
      <Suspense fallback={null}>
        <DeleteConfirmDialog
          open={fuelTypeDeleteDialogOpen}
          onOpenChange={setFuelTypeDeleteDialogOpen}
          title="លុបប្រភេទសាំង"
          description={
            fuelTypeToDelete && isFuelTypeInUse(fuelTypeToDelete) ? (
                  <div className="space-y-2">
                    <p className="text-destructive font-medium">
                      ⚠️ មិនអាចលុបប្រភេទសាំងនេះ!
                    </p>
                    <p>
                      ប្រភេទសាំងនេះកំពុងត្រូវបានប្រើប្រាស់ដោយស្តុកសាំងដូចខាងក្រោម:
                    </p>
                    <ul className="list-disc list-inside space-y-1 mt-2">
                      {getPumpsUsingFuelType(fuelTypeToDelete).map(pump => (
                        <li key={pump._id} className="text-sm">
                          <span className="font-medium">ស្តុកសាំង {pump.pumpNumber}</span>
                          {pump.status === 'inactive' && (
                            <span className="text-muted-foreground ml-2">(មិនសកម្ម)</span>
                          )}
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-muted-foreground mt-2">
                      សូមលុបឬកែប្រែស្តុកសាំងទាំងនេះមុនពេលលុបប្រភេទសាំង។
                    </p>
                  </div>
                ) : (
                  <p>តើអ្នកពិតជាចង់លុបប្រភេទសាំងនេះមែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។</p>
            )
          }
          onConfirm={handleFuelTypeDelete}
          onCancel={() => {
                  setFuelTypeDeleteDialogOpen(false);
                  setFuelTypeToDelete(null);
                }}
          confirmLabel={fuelTypeToDelete && isFuelTypeInUse(fuelTypeToDelete) ? undefined : 'លុប'}
        />
      </Suspense>

      {/* Price Dialog */}
      <Suspense fallback={null}>
        <PriceDialog
          open={priceDialogOpen}
          onOpenChange={(open) => {
          setPriceDialogOpen(open);
          if (!open) {
            handleClosePriceDialog();
          }
          }}
          selectedFuelType={selectedFuelType}
          priceFormData={priceFormData}
          onPriceFormDataChange={(data) => {
            setPriceFormData(data);
            setIsUsingDefaultPrice(false);
          }}
          isUsingDefaultPrice={isUsingDefaultPrice}
          loadingPrice={loadingPrice}
          priceHistory={priceHistory}
          priceHistoryLoading={priceHistoryLoading}
          groupedPriceHistory={groupedPriceHistory}
          onDateChange={handleDateChange}
          onSubmit={handlePriceSubmit}
          onClose={handleClosePriceDialog}
          getTodayDate={getTodayDate}
          getDatesWithPrices={getDatesWithPrices}
          formatDateToLocalString={formatDateToLocalString}
          createLocalDate={createLocalDate}
        />
      </Suspense>
    </div>
  );
};

export default Pumps;
