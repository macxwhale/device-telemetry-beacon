
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DeviceStatusFilterProps {
  value: 'all' | 'online' | 'offline';
  onChange: (value: 'all' | 'online' | 'offline') => void;
}

export const DeviceStatusFilter = ({ value, onChange }: DeviceStatusFilterProps) => {
  const handleChange = (newValue: string) => {
    onChange(newValue as 'all' | 'online' | 'offline');
  };

  return (
    <Select value={value} onValueChange={handleChange}>
      <SelectTrigger className="w-full sm:w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Status</SelectItem>
        <SelectItem value="online">Online</SelectItem>
        <SelectItem value="offline">Offline</SelectItem>
      </SelectContent>
    </Select>
  );
};
