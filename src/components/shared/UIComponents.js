import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

export const Button = ({ onClick, disabled, variant = 'primary', children, style = {}, type = 'button' }) => {
  const { theme } = useTheme();

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
    cursor: 'pointer',
    gap: '8px',
    ...style,
  };

  const variants = {
    primary: {
      backgroundColor: disabled ? theme.colors.text.disabled : theme.colors.success.main,
      color: 'white',
      cursor: disabled ? 'not-allowed' : 'pointer',
    },
    secondary: {
      backgroundColor: disabled ? theme.tokens.grey[300] : theme.colors.border,
      color: disabled ? theme.colors.text.disabled : theme.colors.text.primary,
      cursor: disabled ? 'not-allowed' : 'pointer',
    },
    danger: {
      backgroundColor: theme.colors.danger.main,
      color: 'white',
      cursor: disabled ? 'not-allowed' : 'pointer',
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
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {children}
    </button>
  );
};

export const Card = ({ title, children, style = {} }) => {
  const { theme } = useTheme();
  return (
    <div style={{
      background: theme.colors.background.paper,
      borderRadius: '12px',
      boxShadow: theme.shadows.sm,
      overflow: 'hidden',
      ...style,
    }}>
      {title && (
        <div style={{
          padding: '16px 20px',
          borderBottom: `1px solid ${theme.tokens.ui.divider}`,
          background: theme.colors.background.main,
        }}>
          <h3 style={{ margin: 0, color: theme.colors.text.primary, fontSize: '18px' }}>{title}</h3>
        </div>
      )}
      <div style={{ padding: '20px' }}>
        {children}
      </div>
    </div>
  );
};

export const PageContainer = ({ children }) => {
  const { theme } = useTheme();
  return (
    <div style={{ 
      padding: '24px',
      maxWidth: '1400px',
      margin: '0 auto',
      backgroundColor: theme.colors.background.main,
      minHeight: '100vh',
      cursor: 'default',
    }}>
      {children}
    </div>
  );
};

export const PageHeader = ({ title }) => {
  const { theme } = useTheme();
  return (
    <h2 style={{ 
      color: theme.colors.text.primary,
      margin: '0 0 24px 0',
      fontSize: '24px',
      fontWeight: '600',
      borderBottom: `1px solid ${theme.tokens.ui.divider}`,
      paddingBottom: '12px',
      cursor: 'default',
    }}>
      {title}
    </h2>
  );
};

export const Input = ({ ...props }) => {
  const { theme } = useTheme();
  return (
    <input
      {...props}
      style={{
        padding: '10px 16px',
        borderRadius: '6px',
        border: `1px solid ${theme.colors.border}`,
        fontSize: '14px',
        width: '100%',
        boxSizing: 'border-box',
        cursor: props.disabled ? 'not-allowed' : 'text',
        ...props.style,
      }}
    />
  );
};

export const Select = ({ ...props }) => {
  const { theme } = useTheme();
  return (
    <div style={{ position: 'relative' }}>
      <select
        {...props}
        style={{
          padding: '10px 16px',
          borderRadius: '6px',
          border: `1px solid ${theme.colors.border}`,
          fontSize: '14px',
          backgroundColor: props.disabled ? theme.colors.background.main : theme.colors.background.paper,
          color: props.disabled ? theme.colors.text.disabled : theme.colors.text.primary,
          cursor: props.disabled ? 'not-allowed' : 'pointer',
          width: '100%',
          ...props.style,
        }}
      />
    </div>
  );
}; 