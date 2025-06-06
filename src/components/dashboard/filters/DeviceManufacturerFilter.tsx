
import { useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DeviceStatus } from '@/types/telemetry';

interface DeviceManufacturerFilterProps {
  devices: DeviceStatus[];
  value: string;
  onChange: (value: string) => void;
}

export const DeviceManufacturerFilter = ({ devices, value, onChange }: DeviceManufacturerFilterProps) => {
  const manufacturers = useMemo(() => {
    const uniqueManufacturers = new Set(
      devices
        .map(device => device.manufacturer)
        .filter(manufacturer => manufacturer && manufacturer.trim() !== '')
    );
    return Array.from(uniqueManufacturers).sort();
  }, [devices]);

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
