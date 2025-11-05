import React from 'react';

interface IconProps {
  className?: string;
}

export const FuelDropletIcon: React.FC<IconProps> = ({ className = "h-5 w-5" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Fuel droplet with gradient effect */}
    <path
      d="M12 2.5C12 2.5 7.5 7 7.5 11C7.5 14.5899 10.4101 17.5 14 17.5C17.5899 17.5 20.5 14.5899 20.5 11C20.5 7 16 2.5 16 2.5"
      fill="currentColor"
      fillOpacity="0.9"
    />
    {/* Highlight */}
    <ellipse cx="13" cy="7" rx="2" ry="3" fill="white" fillOpacity="0.3" />
    {/* Outer glow */}
    <path
      d="M12 2.5C12 2.5 7.5 7 7.5 11C7.5 14.5899 10.4101 17.5 14 17.5C17.5899 17.5 20.5 14.5899 20.5 11C20.5 7 16 2.5 16 2.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

