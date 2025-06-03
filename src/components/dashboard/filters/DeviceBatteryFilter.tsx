
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DeviceBatteryFilterProps {
  value: 'all' | 'low' | 'normal';
  onChange: (value: 'all' | 'low' | 'normal') => void;
}

export const DeviceBatteryFilter = ({ value, onChange }: DeviceBatteryFilterProps) => {
  const handleChange = (newValue: string) => {
    onChange(newValue as 'all' | 'low' | 'normal');
  };

  return (
    <Select value={value} onValueChange={handleChange}>
      <SelectTrigger className="w-full sm:w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Battery</SelectItem>
        <SelectItem value="low">Low Battery</SelectItem>
        <SelectItem value="normal">Normal</SelectItem>
      </SelectContent>
    </Select>
  );
};
