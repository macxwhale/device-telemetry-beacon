
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpDown } from 'lucide-react';

interface DeviceSortControlsProps {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSortByChange: (value: string) => void;
  onSortOrderChange: (value: 'asc' | 'desc') => void;
}

export const DeviceSortControls = ({ 
  sortBy, 
  sortOrder, 
  onSortByChange, 
  onSortOrderChange 
}: DeviceSortControlsProps) => {
  const toggleSortOrder = () => {
    onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={sortBy} onValueChange={onSortByChange}>
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
        onClick={toggleSortOrder}
        className="px-2"
      >
        <ArrowUpDown className="h-4 w-4" />
      </Button>
    </div>
  );
};
