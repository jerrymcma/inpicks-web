import React from 'react'

export const FootballIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <span className={className} role="img" aria-label="football" style={{ fontSize: '1.25rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
    🏈
  </span>
)

export const BasketballIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <span className={className} role="img" aria-label="basketball" style={{ fontSize: '1.25rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
    🏀
  </span>
)

export const BaseballIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <span className={className} role="img" aria-label="baseball" style={{ fontSize: '1.25rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
    ⚾
  </span>
)

export const HockeyIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <span className={className} role="img" aria-label="hockey" style={{ fontSize: '1.25rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
    🏒
  </span>
)

export const CollegeBasketballIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <span className={className} role="img" aria-label="college basketball" style={{ fontSize: '1.25rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
    🏀
  </span>
)
