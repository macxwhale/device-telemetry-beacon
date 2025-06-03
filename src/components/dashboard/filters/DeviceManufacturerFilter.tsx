
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DeviceManufacturerFilterProps {
  manufacturers: string[];
  value: string;
  onChange: (value: string) => void;
}

export const DeviceManufacturerFilter = ({ manufacturers, value, onChange }: DeviceManufacturerFilterProps) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full sm:w-40">
        <SelectValue placeholder="Manufacturer" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Brands</SelectItem>
        {manufacturers.map(manufacturer => (
          <SelectItem key={manufacturer} value={manufacturer}>
            {manufacturer}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
