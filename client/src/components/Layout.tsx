import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { FiLogOut, FiRefreshCw } from 'react-icons/fi';
import { GasStationIcon, FuelPumpIcon, ReceiptIcon } from './icons';
import { prefetchRoute, prefetchCriticalRoutes } from '../utils/prefetch';
import { useToast } from '../hooks/use-toast';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Check if dialog is open by monitoring body class
  useEffect(() => {
    const checkDialog = () => {
      setIsDialogOpen(document.body.classList.contains('dialog-open'));
    };

    // Check initially
    checkDialog();

    // Create a MutationObserver to watch for class changes on body
    const observer = new MutationObserver(checkDialog);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  // Prefetch critical routes on mount
  useEffect(() => {
    prefetchCriticalRoutes();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleClearCache = () => {
    // Clear cached preferences but keep authentication data
    localStorage.removeItem('transactionCurrency');
    localStorage.removeItem('transactionDiscountCurrency');
    localStorage.removeItem('stockPriceCurrency');
    localStorage.removeItem('exchangeRate');
    
    // Show toast before reload
    toast({
      variant: 'success',
      title: 'ជោគជ័យ',
      description: 'បានលុប cache ដោយជោគជ័យ',
    });
    
    // Reload the page after a short delay to show the toast
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const navItems = [
    { path: '/dashboard', icon: GasStationIcon, label: 'ផ្ទាំងគ្រប់គ្រង' },
    { path: '/pumps', icon: FuelPumpIcon, label: 'ស្តុកសាំង' },
    { path: '/transactions', icon: ReceiptIcon, label: 'ព័ត៌មានលក់' },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Desktop Navigation */}
      <nav className="hidden md:block border-b">
        <div className="flex h-16 items-center px-6">
          <div className="flex items-center space-x-8">
            <h1 className="text-xl font-bold">ការាស់សាំង</h1>
            <div className="flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon as React.ComponentType<{ className?: string }>;
                const isActive = location.pathname === item.path;
                return (
                  <Link 
                    key={item.path} 
                    to={item.path}
                    onMouseEnter={() => prefetchRoute(item.path)}
                  >
                    <Button
                      variant={isActive ? 'default' : 'ghost'}
                      className="flex items-center gap-2"
                    >
                      {/* @ts-ignore */}
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" onClick={handleClearCache} title="លុប Cache">
              {/* @ts-ignore */}
              <FiRefreshCw className="mr-2 h-4 w-4" />
              <span className="hidden lg:inline">លុប Cache</span>
            </Button>
            <Button variant="ghost" onClick={handleLogout}>
              {/* @ts-ignore */}
              <FiLogOut className="mr-2 h-4 w-4" />
              ចេញ
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile Header */}
      <nav className="md:hidden border-b bg-card sticky top-0 z-50">
        <div className="flex h-14 items-center justify-between px-4">
          <h1 className="text-lg font-bold">ការាស់សាំង</h1>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={handleClearCache} title="លុប Cache">
              {/* @ts-ignore */}
              <FiRefreshCw className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              {/* @ts-ignore */}
              <FiLogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </nav>

      <main className="min-h-screen">{children}</main>

      {/* Mobile Bottom Navigation */}
      {!isDialogOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t border-border">
          <div className="grid grid-cols-3 h-16">
          {navItems.map((item) => {
            const Icon = item.icon as React.ComponentType<{ className?: string }>;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onTouchStart={() => prefetchRoute(item.path)}
                onMouseEnter={() => prefetchRoute(item.path)}
                className={`flex flex-col items-center justify-center gap-1 ${
                  isActive
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {/* @ts-ignore */}
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;

