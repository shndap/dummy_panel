import React from 'react';

export const Button = ({ onClick, disabled, variant = 'primary', children, style = {}, type = 'button' }) => {
  const baseStyle = {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '500',
    border: 'none',
    borderRadius: '6px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    ...style,
  };

  const variants = {
    primary: {
      backgroundColor: disabled ? '#A0AEC0' : '#4CAF50',
      color: 'white',
    },
    secondary: {
      backgroundColor: disabled ? '#EDF2F7' : '#E2E8F0',
      color: disabled ? '#A0AEC0' : '#2D3748',
    },
    danger: {
      backgroundColor: '#ff5252',
      color: 'white',
    },
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...baseStyle,
        ...variants[variant],
      }}
    >
      {children}
    </button>
  );
};

export const Card = ({ title, children, style = {} }) => (
  <div style={{
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    overflow: 'hidden',
    ...style,
  }}>
    {title && (
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid #edf2f7',
        background: '#f8fafc',
      }}>
        <h3 style={{ margin: 0, color: '#2d3748', fontSize: '18px' }}>{title}</h3>
      </div>
    )}
    <div style={{ padding: '20px' }}>
      {children}
    </div>
  </div>
);

export const PageContainer = ({ children }) => (
  <div style={{ 
    padding: '24px',
    maxWidth: '1400px',
    margin: '0 auto',
    backgroundColor: '#f8fafc',
    minHeight: '100vh',
  }}>
    {children}
  </div>
);

export const PageHeader = ({ title }) => (
  <h2 style={{ 
    color: '#1a202c',
    margin: '0 0 24px 0',
    fontSize: '24px',
    fontWeight: '600',
    borderBottom: '2px solid #eee',
    paddingBottom: '12px',
  }}>
    {title}
  </h2>
);

export const Input = ({ ...props }) => (
  <input
    {...props}
    style={{
      padding: '10px 16px',
      borderRadius: '6px',
      border: '1px solid #e2e8f0',
      fontSize: '14px',
      width: '100%',
      ...props.style,
    }}
  />
);

export const Select = ({ ...props }) => (
  <div style={{ position: 'relative' }}>
    <select
      {...props}
      style={{
        padding: '10px 16px',
        borderRadius: '6px',
        border: '1px solid #e2e8f0',
        fontSize: '14px',
        backgroundColor: props.disabled ? '#f7fafc' : 'white',
        color: props.disabled ? '#a0aec0' : '#2d3748',
        cursor: props.disabled ? 'not-allowed' : 'pointer',
        width: '100%',
        ...props.style,
      }}
    />
  </div>
); 