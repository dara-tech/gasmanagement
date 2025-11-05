import React from 'react';

interface IconProps {
  className?: string;
}

export const GasStationIcon: React.FC<IconProps> = ({ className = "h-5 w-5" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Gas station building */}
    <rect x="3" y="4" width="18" height="16" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
    {/* Roof */}
    <path d="M3 8L12 3L21 8" stroke="currentColor" strokeWidth="1.5" fill="none" />
    {/* Windows */}
    <rect x="6" y="10" width="3" height="3" rx="0.5" stroke="currentColor" strokeWidth="1" fill="none" />
    <rect x="11" y="10" width="3" height="3" rx="0.5" stroke="currentColor" strokeWidth="1" fill="none" />
    <rect x="15" y="10" width="3" height="3" rx="0.5" stroke="currentColor" strokeWidth="1" fill="none" />
    {/* Door */}
    <rect x="10" y="15" width="4" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
    {/* Base/Foundation */}
    <rect x="2" y="19" width="20" height="2" fill="currentColor" />
  </svg>
);

