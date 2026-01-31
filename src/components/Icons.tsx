import React from 'react'

export const FootballIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M15.6 11.6c-1.8-1.8-4.5-1.8-6.3 0" />
    <path d="M12 12l.01.01" />
    <path d="M16.6 3.6c-4.7-4.7-12.4-4.7-17.1 0 4.7 4.7 4.7 12.4 0 17.1 4.7 4.7 12.4 4.7 17.1 0-4.7-4.7-4.7-12.4 0-17.1Z" />
    <path d="M4.5 16.5l3-3" />
    <path d="M15 6l1.5-1.5" />
  </svg>
)

export const BasketballIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a14.5 14.5 0 0 0 0 20" />
    <path d="M2 12a14.5 14.5 0 0 0 20 0" />
    <path d="M4.5 4.5 19.5 19.5" />
    <path d="M4.5 19.5 19.5 4.5" />
  </svg>
)
