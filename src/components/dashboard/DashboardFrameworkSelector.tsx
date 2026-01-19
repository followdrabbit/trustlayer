import { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Framework } from '@/lib/frameworks';

interface DashboardFrameworkSelectorProps {
  frameworks: Framework[];
  selectedIds: string[];
  onToggle: (frameworkId: string) => void;
  helpTooltip?: ReactNode;
  className?: string;
  disabled?: boolean;
}

export function DashboardFrameworkSelector({
  frameworks,
  selectedIds,
  onToggle,
  helpTooltip,
  className,
  disabled = false,
}: DashboardFrameworkSelectorProps) {
  const selectionCount = selectedIds.length;
  const isReadOnly = Boolean(disabled);
  
  return (
    <div className={cn("border-t pt-3 sm:pt-4", className)}>
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
        <span className="text-xs sm:text-sm font-medium">Frameworks em Análise</span>
        {helpTooltip}
        <span className="text-[10px] sm:text-xs text-muted-foreground">
          ({selectionCount === 0 ? 'Todos' : `${selectionCount} selecionados`})
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {frameworks.map(fw => {
          const isSelected = selectionCount === 0 || selectedIds.includes(fw.frameworkId);
          return (
            <Badge
              key={fw.frameworkId}
              variant={isSelected ? "default" : "outline"}
              className={cn(
                "transition-all duration-200 text-[10px] sm:text-xs py-0.5 px-1.5 sm:px-2",
                isReadOnly
                  ? "cursor-not-allowed opacity-60"
                  : "cursor-pointer hover:scale-105 hover:shadow-md",
                isSelected
                  ? isReadOnly
                    ? "bg-primary"
                    : "bg-primary hover:bg-primary/90"
                  : isReadOnly
                    ? "opacity-60"
                    : "opacity-50 hover:opacity-100 hover:border-primary/50"
              )}
              onClick={isReadOnly ? undefined : () => onToggle(fw.frameworkId)}
              aria-disabled={isReadOnly}
            >
              {fw.shortName}
            </Badge>
          );
        })}
      </div>

      <p className="text-[10px] sm:text-xs text-muted-foreground mt-1.5 sm:mt-2">
        {isReadOnly ? (
          "Somente leitura. Os filtros nao podem ser alterados."
        ) : (
          <>
            Clique nos frameworks acima para filtrar os dados exibidos.
            {selectionCount > 0 && ` (${selectionCount} selecionados)`}
          </>
        )}
      </p>
    </div>
  );
}
