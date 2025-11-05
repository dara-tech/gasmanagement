import React from 'react';

interface IconProps {
  className?: string;
}

export const FuelPumpIcon: React.FC<IconProps> = ({ className = "h-5 w-5" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Pump base */}
    <rect x="6" y="2" width="5" height="18" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
    {/* Display screen */}
    <rect x="7.5" y="5" width="2" height="1.5" rx="0.3" fill="currentColor" opacity="0.6" />
    {/* Nozzle holder */}
    <rect x="13" y="4" width="6" height="12" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
    {/* Hose */}
    <path
      d="M11 11L13 11"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    {/* Nozzle */}
    <path
      d="M19 8L22 8M19 11L22 11"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    {/* Base wheels */}
    <circle cx="8" cy="21" r="1.2" fill="currentColor" />
    <circle cx="10.5" cy="21" r="1.2" fill="currentColor" />
  </svg>
);

