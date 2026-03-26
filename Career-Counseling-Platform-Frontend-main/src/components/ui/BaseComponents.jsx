import React from 'react';
import { cn } from '../../utils/utils';

export const Button = React.forwardRef(({ className, variant = 'primary', size = 'md', ...props }, ref) => {
  const variants = {
    primary: 'bg-[var(--brand-solid)] text-white hover:opacity-90 shadow-sm',
    secondary: 'bg-[var(--success-bg)] text-[var(--success-text)] border border-[var(--success-border)] hover:opacity-80',
    outline: 'border border-[var(--border-subtle)] bg-transparent hover:bg-[var(--bg-secondary)] text-[var(--text-primary)]',
    ghost: 'bg-transparent hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
    danger: 'bg-[var(--error-bg)] text-[var(--error-text)] border border-[var(--error-border)] hover:opacity-80',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[var(--brand-solid)]/20 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
});

export const Card = ({ children, className }) => (
  <div className={cn('bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-subtle)] shadow-sm overflow-hidden transition-colors duration-300', className)}>
    {children}
  </div>
);

export const Input = React.forwardRef(({ className, size = 'md', ...props }, ref) => {
  const sizes = {
    sm: 'h-8 px-2 text-xs',
    md: 'h-10 px-3 text-sm',
    lg: 'h-12 px-4 text-base',
  };

  return (
    <input
      ref={ref}
      className={cn(
        'flex w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--brand-solid)]/20 focus:border-[var(--brand-solid)] disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300',
        sizes[size],
        className
      )}
      {...props}
    />
  );
});

export const Badge = ({ children, className, variant = 'default' }) => {
  const variants = {
    default: 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-subtle)]',
    success: 'bg-[var(--success-bg)] text-[var(--success-text)] border-[var(--success-border)]',
    warning: 'bg-[var(--warning-bg)] text-[var(--warning-text)] border-[var(--warning-border)]',
    error: 'bg-[var(--error-bg)] text-[var(--error-text)] border-[var(--error-border)]',
    info: 'bg-[var(--info-bg)] text-[var(--info-text)] border-[var(--info-border)]',
  };
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border transition-colors duration-300', variants[variant], className)}>
      {children}
    </span>
  );
};
