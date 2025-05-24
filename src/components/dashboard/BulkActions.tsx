
import { memo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Download, RefreshCw } from 'lucide-react';
import { DeviceStatus } from '@/types/telemetry';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface BulkActionsProps {
  devices: DeviceStatus[];
  selectedDevices: string[];
  onSelectionChange: (deviceIds: string[]) => void;
  onBulkDelete?: (deviceIds: string[]) => void;
  onBulkExport?: (deviceIds: string[]) => void;
}

export const BulkActions = memo(({
  devices,
  selectedDevices,
  onSelectionChange,
  onBulkDelete,
  onBulkExport
}: BulkActionsProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const isAllSelected = devices.length > 0 && selectedDevices.length === devices.length;
  const isPartialSelected = selectedDevices.length > 0 && selectedDevices.length < devices.length;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(devices.map(d => d.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleBulkDelete = () => {
    if (onBulkDelete) {
      onBulkDelete(selectedDevices);
    }
    setShowDeleteDialog(false);
    onSelectionChange([]);
  };

  const handleBulkExport = () => {
    if (onBulkExport) {
      onBulkExport(selectedDevices);
    }
  };

  if (devices.length === 0) return null;

  return (
    <>
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={isAllSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = isPartialSelected;
                  }}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm font-medium">
                  Select All ({devices.length})
                </span>
              </div>
              
              {selectedDevices.length > 0 && (
                <Badge variant="secondary">
                  {selectedDevices.length} selected
                </Badge>
              )}
            </div>

            {selectedDevices.length > 0 && (
              <div className="flex items-center gap-2">
                {onBulkExport && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkExport}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                )}
                
                {onBulkDelete && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Devices</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedDevices.length} device(s)? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});

BulkActions.displayName = 'BulkActions';
