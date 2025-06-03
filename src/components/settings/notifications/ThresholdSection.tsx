
import { FC, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ThresholdSectionProps {
  batteryThreshold: number;
  offlineThreshold: number;
  onThresholdChange: (key: string, value: number) => void;
}

export const ThresholdSection: FC<ThresholdSectionProps> = memo(({
  batteryThreshold,
  offlineThreshold,
  onThresholdChange
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Alert Thresholds</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="battery-threshold">
            Battery Alert Threshold ({batteryThreshold}%)
          </Label>
          <Input
            id="battery-threshold"
            type="range"
            min="5"
            max="50"
            value={batteryThreshold}
            onChange={(e) => onThresholdChange('batteryThreshold', parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="offline-threshold">
            Offline Alert Threshold ({offlineThreshold} minutes)
          </Label>
          <Input
            id="offline-threshold"
            type="range"
            min="1"
            max="60"
            value={offlineThreshold}
            onChange={(e) => onThresholdChange('offlineThreshold', parseInt(e.target.value))}
            className="w-full"
          />
        </div>
      </CardContent>
    </Card>
  );
});

ThresholdSection.displayName = 'ThresholdSection';
