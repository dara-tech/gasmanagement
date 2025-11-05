import axios from 'axios';

// Helper function to normalize API URL - ensures it has a protocol
const getApiUrl = (): string => {
  const envUrl = process.env.REACT_APP_API_URL;
  const defaultUrl = 'https://gasmanagement.onrender.com/api';
  
  if (!envUrl) {
    return defaultUrl;
  }
  
  // If URL already has protocol, return as is
  if (envUrl.startsWith('http://') || envUrl.startsWith('https://')) {
    return envUrl;
  }
  
  // If URL is localhost or starts with a hostname, add http://
  if (envUrl.includes('localhost') || envUrl.includes('127.0.0.1')) {
    return `http://${envUrl}`;
  }
  
  // For other cases, assume https
  return `https://${envUrl}`;
};

const API_URL = getApiUrl();

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface FuelType {
  _id: string;
  name: string;
  price?: number; // Optional - used as fallback only
  unit: string;
  litersPerTon?: number;
}

export interface Pump {
  _id: string;
  pumpNumber: string;
  fuelTypeId: FuelType;
  status: 'active' | 'inactive';
  stockLiters?: number;
}

export interface Transaction {
  _id: string;
  pumpId: Pump;
  fuelTypeId: FuelType;
  liters: number;
  price: number;
  priceIn?: number;
  priceOut?: number;
  discount?: number;
  discountType?: 'amount' | 'percentage';
  profit?: number;
  total: number;
  date: string;
}

export interface StockEntry {
  _id: string;
  fuelTypeId: FuelType;
  pumpId: Pump;
  tons: number;
  liters: number;
  pricePerLiter: number;
  totalCost: number;
  date: string;
  notes?: string;
}

export interface DashboardStats {
  period: {
    total: number;
    profit: number;
    transactions: number;
    liters: number;
  };
  allTime: {
    total: number;
    profit: number;
    transactions: number;
    liters: number;
  };
  recentTransactions: Transaction[];
  periodType: string;
  dateRange: {
    from: string;
    to: string;
  };
}

// Auth API
export const authAPI = {
  login: async (username: string, password: string) => {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  },
  register: async (username: string, password: string) => {
    const response = await api.post('/auth/register', { username, password });
    return response.data;
  },
};

// Fuel Types API
export const fuelTypesAPI = {
  getAll: async (): Promise<FuelType[]> => {
    const response = await api.get('/fuel-types');
    return response.data;
  },
  getById: async (id: string): Promise<FuelType> => {
    const response = await api.get(`/fuel-types/${id}`);
    return response.data;
  },
  create: async (data: { name: string; price: number; unit?: string; litersPerTon?: number }): Promise<FuelType> => {
    const response = await api.post('/fuel-types', data);
    return response.data;
  },
  update: async (id: string, data: { name: string; price: number; unit?: string; litersPerTon?: number }): Promise<FuelType> => {
    const response = await api.put(`/fuel-types/${id}`, data);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/fuel-types/${id}`);
  },
};

// Fuel Price History API
export interface FuelPriceHistory {
  _id: string;
  fuelTypeId: string;
  price: number;
  date: string;
  notes?: string;
  isDefault?: boolean;
}

export const fuelPricesAPI = {
  getCurrent: async (fuelTypeId: string): Promise<{ price: number; date: string | null; isDefault: boolean }> => {
    const response = await api.get(`/fuel-prices/${fuelTypeId}/current`);
    return response.data;
  },
  getByDate: async (fuelTypeId: string, date: string): Promise<FuelPriceHistory & { isDefault?: boolean }> => {
    const response = await api.get(`/fuel-prices/${fuelTypeId}/date/${date}`);
    return response.data;
  },
  getAll: async (fuelTypeId: string, startDate?: string, endDate?: string): Promise<FuelPriceHistory[]> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const response = await api.get(`/fuel-prices/${fuelTypeId}${params.toString() ? `?${params.toString()}` : ''}`);
    return response.data;
  },
  setPriceForDate: async (fuelTypeId: string, data: { price: number; date: string; notes?: string }): Promise<FuelPriceHistory> => {
    const response = await api.post(`/fuel-prices/${fuelTypeId}`, data);
    return response.data;
  },
};

// Pumps API
export const pumpsAPI = {
  getAll: async (): Promise<Pump[]> => {
    const response = await api.get('/pumps');
    return response.data;
  },
  getById: async (id: string): Promise<Pump> => {
    const response = await api.get(`/pumps/${id}`);
    return response.data;
  },
  create: async (data: { pumpNumber: string; fuelTypeId: string; status?: string; stockLiters?: number }): Promise<Pump> => {
    const response = await api.post('/pumps', data);
    return response.data;
  },
  update: async (id: string, data: { pumpNumber: string; fuelTypeId: string; status?: string; stockLiters?: number }): Promise<Pump> => {
    const response = await api.put(`/pumps/${id}`, data);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/pumps/${id}`);
  },
};

// Transactions API
export interface PaginatedTransactionsResponse {
  transactions: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export const transactionsAPI = {
  getAll: async (page?: number, limit?: number, filters?: { startDate?: string; endDate?: string; pumpId?: string }): Promise<Transaction[] | PaginatedTransactionsResponse> => {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.pumpId) params.append('pumpId', filters.pumpId);
    
    const queryString = params.toString();
    const response = await api.get(`/transactions${queryString ? `?${queryString}` : ''}`);
    
    // If pagination params are provided, return paginated response
    if (page || limit) {
      return response.data;
    }
    
    // Backward compatibility: if no pagination params, return array directly
    // Handle both old format (array) and new format (object with transactions array)
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data.transactions || [];
  },
  
  getPaginated: async (page: number = 1, limit: number = 50, filters?: { startDate?: string; endDate?: string; pumpId?: string }): Promise<PaginatedTransactionsResponse> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.pumpId) params.append('pumpId', filters.pumpId);
    
    const response = await api.get(`/transactions?${params.toString()}`);
    
    // Ensure response has the correct structure
    if (response.data && response.data.transactions) {
      return response.data;
    }
    
    // If response is an array (backward compatibility), convert to paginated format
    if (Array.isArray(response.data)) {
      return {
        transactions: response.data,
        pagination: {
          page: 1,
          limit: response.data.length,
          total: response.data.length,
          totalPages: 1,
          hasMore: false
        }
      };
    }
    
    // Default empty response
    return {
      transactions: [],
      pagination: {
        page: 1,
        limit,
        total: 0,
        totalPages: 0,
        hasMore: false
      }
    };
  },
  getById: async (id: string): Promise<Transaction> => {
    const response = await api.get(`/transactions/${id}`);
    return response.data;
  },
  create: async (data: { pumpId: string; fuelTypeId: string; liters: number; date?: string; discount?: number; discountType?: 'amount' | 'percentage' }): Promise<Transaction> => {
    const response = await api.post('/transactions', data);
    return response.data;
  },
  update: async (id: string, data: { pumpId: string; fuelTypeId: string; liters: number; date?: string; discount?: number; discountType?: 'amount' | 'percentage' }): Promise<Transaction> => {
    const response = await api.put(`/transactions/${id}`, data);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/transactions/${id}`);
  },
};

// Stock Entries API
export const stockEntriesAPI = {
  getAll: async (): Promise<StockEntry[]> => {
    const response = await api.get('/stock-entries');
    return response.data;
  },
  getById: async (id: string): Promise<StockEntry> => {
    const response = await api.get(`/stock-entries/${id}`);
    return response.data;
  },
  create: async (data: { fuelTypeId: string; pumpId: string; tons: number; pricePerLiter: number; date?: string; notes?: string }): Promise<StockEntry> => {
    const response = await api.post('/stock-entries', data);
    return response.data;
  },
  update: async (id: string, data: { fuelTypeId?: string; pumpId?: string; tons?: number; pricePerLiter?: number; date?: string; notes?: string }): Promise<StockEntry> => {
    const response = await api.put(`/stock-entries/${id}`, data);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/stock-entries/${id}`);
  },
};

// Dashboard API
export const dashboardAPI = {
  getStats: async (period?: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom', customFrom?: string, customTo?: string): Promise<DashboardStats> => {
    const params = new URLSearchParams();
    if (period) {
      params.append('period', period);
    }
    if (customFrom) {
      params.append('customFrom', customFrom);
    }
    if (customTo) {
      params.append('customTo', customTo);
    }
    const queryString = params.toString();
    const response = await api.get(`/dashboard${queryString ? `?${queryString}` : ''}`);
    return response.data;
  },
};

export default api;
