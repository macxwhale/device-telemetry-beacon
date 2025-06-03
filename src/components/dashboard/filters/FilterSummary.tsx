
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Filter, X } from 'lucide-react';

interface FilterSummaryProps {
  totalDevices: number;
  filteredDevices: number;
  activeFiltersCount: number;
  onClearFilters: () => void;
}

export const FilterSummary = ({
  totalDevices,
  filteredDevices,
  activeFiltersCount,
  onClearFilters
}: FilterSummaryProps) => {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {filteredDevices} of {totalDevices} devices
        </span>
        {activeFiltersCount > 0 && (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Filter className="h-3 w-3" />
            {activeFiltersCount}
          </Badge>
        )}
      </div>
      
      {activeFiltersCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
};
