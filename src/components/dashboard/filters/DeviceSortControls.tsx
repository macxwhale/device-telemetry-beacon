
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpDown } from 'lucide-react';

interface DeviceSortControlsProps {
  sortBy: 'name' | 'lastSeen' | 'battery';
  sortOrder: 'asc' | 'desc';
  onSortByChange: (value: 'name' | 'lastSeen' | 'battery') => void;
  onSortOrderToggle: () => void;
}

export const DeviceSortControls = ({ 
  sortBy, 
  sortOrder, 
  onSortByChange, 
  onSortOrderToggle 
}: DeviceSortControlsProps) => {
  const handleSortByChange = (value: string) => {
    onSortByChange(value as 'name' | 'lastSeen' | 'battery');
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Sort by:</span>
      <Select value={sortBy} onValueChange={handleSortByChange}>
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="name">Name</SelectItem>
          <SelectItem value="lastSeen">Last Seen</SelectItem>
          <SelectItem value="battery">Battery</SelectItem>
        </SelectContent>
      </Select>
      <Button
        variant="outline"
        size="sm"
        onClick={onSortOrderToggle}
        className="px-2"
      >
        <ArrowUpDown className="h-4 w-4" />
      </Button>
    </div>
  );
};
