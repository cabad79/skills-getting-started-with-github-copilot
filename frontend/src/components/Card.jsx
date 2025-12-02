/**
 * Card Component
 * Modern card with header, body, and footer sections
 */

import React from 'react';

const Card = ({
  children,
  gradient = false,
  header,
  footer,
  className = '',
  ...props
}) => {
  const classes = ['card', gradient && 'card-gradient', className].filter(Boolean).join(' ');

  return (
    <div className={classes} {...props}>
      {header && <div className="card-header">{header}</div>}
      <div className="card-body">{children}</div>
      {footer && <div className="card-footer">{footer}</div>}
    </div>
  );
};

export default Card;
