import type { ButtonHTMLAttributes, HTMLAttributes, PropsWithChildren, ReactNode } from 'react';
import { clsx } from 'clsx';

export function Button({
  className,
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} className={clsx('cg-button', className)} {...props} />;
}

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={clsx('cg-badge', className)} {...props} />;
}

export function Card({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={clsx('cg-card', className)} {...props} />;
}

export function EmptyState({
  icon,
  title,
  children,
}: PropsWithChildren<{ icon?: ReactNode; title: string }>) {
  return (
    <div className="cg-empty" role="status">
      {icon}
      <h3>{title}</h3>
      <div>{children}</div>
    </div>
  );
}
