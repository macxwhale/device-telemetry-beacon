
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DeviceBatteryFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export const DeviceBatteryFilter = ({ value, onChange }: DeviceBatteryFilterProps) => {
  return (
    <Select value={value} onValueChange={onChange}>
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
