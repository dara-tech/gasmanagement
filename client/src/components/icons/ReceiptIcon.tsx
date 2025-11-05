import React from 'react';

interface IconProps {
  className?: string;
}

export const ReceiptIcon: React.FC<IconProps> = ({ className = "h-5 w-5" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Receipt paper */}
    <path
      d="M5 2H19C20.1046 2 21 2.89543 21 4V22L18 20L15 22L12 20L9 22L6 20L3 22V4C3 2.89543 3.89543 2 5 2Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    {/* Receipt lines */}
    <path
      d="M8 7H16"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M8 11H16"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M8 15H13"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    {/* Perforated edges */}
    <circle cx="6" cy="5" r="0.5" fill="currentColor" />
    <circle cx="6" cy="9" r="0.5" fill="currentColor" />
    <circle cx="6" cy="13" r="0.5" fill="currentColor" />
    <circle cx="6" cy="17" r="0.5" fill="currentColor" />
    <circle cx="18" cy="5" r="0.5" fill="currentColor" />
    <circle cx="18" cy="9" r="0.5" fill="currentColor" />
    <circle cx="18" cy="13" r="0.5" fill="currentColor" />
    <circle cx="18" cy="17" r="0.5" fill="currentColor" />
  </svg>
);

