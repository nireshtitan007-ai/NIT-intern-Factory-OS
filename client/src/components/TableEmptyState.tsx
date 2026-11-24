import React, { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

interface TableEmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export const TableEmptyState: React.FC<TableEmptyStateProps> = ({
  icon,
  title,
  description,
  action
}) => {
  return (
    <div className="py-12 px-4 text-center space-y-3">
      <div className="w-12 h-12 rounded-2xl bg-cream-100 text-charcoal-400 flex items-center justify-center mx-auto">
        {icon || <Inbox className="w-6 h-6" />}
      </div>
      <div>
        <h4 className="font-bold text-xs text-charcoal-800">{title}</h4>
        <p className="text-xs text-charcoal-500 max-w-sm mx-auto mt-0.5 leading-relaxed">{description}</p>
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
};
