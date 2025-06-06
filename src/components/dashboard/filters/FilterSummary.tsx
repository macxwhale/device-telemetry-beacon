
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface FilterSummaryProps {
  searchQuery: string;
  statusFilter: 'all' | 'online' | 'offline';
  manufacturerFilter: string;
  batteryFilter: string;
  onClearFilters: () => void;
}

export const FilterSummary = ({
  searchQuery,
  statusFilter,
  manufacturerFilter,
  batteryFilter,
  onClearFilters
}: FilterSummaryProps) => {
  const activeFilters = [];
  
  if (searchQuery) {
    activeFilters.push(`Search: "${searchQuery}"`);
  }
  
  if (statusFilter !== 'all') {
    activeFilters.push(`Status: ${statusFilter}`);
  }
  
  if (manufacturerFilter !== 'all') {
    activeFilters.push(`Brand: ${manufacturerFilter}`);
  }
  
  if (batteryFilter !== 'all') {
    activeFilters.push(`Battery: ${batteryFilter}`);
  }

  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-muted-foreground">Active filters:</span>
      {activeFilters.map((filter, index) => (
        <Badge key={index} variant="secondary" className="text-xs">
          {filter}
        </Badge>
      ))}
      <Button
        variant="ghost"
        size="sm"
        onClick={onClearFilters}
        className="text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4 mr-1" />
        Clear all
      </Button>
    </div>
  );
};
