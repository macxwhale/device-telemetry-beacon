
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface DeviceSearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const DeviceSearchInput = ({ value, onChange }: DeviceSearchInputProps) => {
  return (
    <div className="relative flex-1">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search devices..."
        className="pl-8"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};
