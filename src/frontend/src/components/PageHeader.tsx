import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4 mb-6', className)}>
      <div>
        <div className="eyebrow mb-1.5">Harborline Operations</div>
        <h1 className="text-2xl font-bold text-[#071A2B] tracking-tight leading-tight">{title}</h1>
        {subtitle && (
          <p className="text-sm text-[#617080] mt-1 leading-relaxed">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0 mt-1">{actions}</div>}
    </div>
  );
}
