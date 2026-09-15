import { Construction } from 'lucide-react';

interface PlaceholderPageProps {
  moduleName: string;
  description?: string;
}

export function PlaceholderPage({
  moduleName,
  description = 'This module is not yet implemented.',
}: PlaceholderPageProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6 text-center">
      <div className="w-12 h-12 rounded-sm bg-slate-800 border border-slate-700 flex items-center justify-center">
        <Construction className="w-6 h-6 text-slate-500" />
      </div>
      <div>
        <h1 className="text-lg font-semibold text-slate-300 mb-1">{moduleName}</h1>
        <p className="text-sm text-slate-500 max-w-xs">{description}</p>
      </div>
      <span className="text-xs text-slate-600 uppercase tracking-wider border border-slate-800 px-2 py-1 rounded-sm">
        Module not implemented yet
      </span>
    </div>
  );
}
