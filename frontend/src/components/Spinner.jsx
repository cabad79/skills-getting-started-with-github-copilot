/**
 * Spinner Component
 * Loading spinner with customizable size
 */

import React from 'react';

const Spinner = ({ size = 'md', className = '' }) => {
  const sizeMap = {
    sm: '1rem',
    md: '2rem',
    lg: '3rem',
    xl: '4rem'
  };

  return (
    <div
      className={`spinner ${className}`}
      style={{
        width: sizeMap[size],
        height: sizeMap[size]
      }}
      role="status"
      aria-label="Loading"
    />
  );
};

export default Spinner;
