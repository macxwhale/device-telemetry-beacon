
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { useAutomationExecutions } from '@/hooks/useAutomation';
import { formatDistanceToNow } from 'date-fns';

export const AutomationExecutionsList = () => {
  const { data: executions = [], isLoading, refetch } = useAutomationExecutions();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'failed':
        return 'destructive';
      case 'running':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Execution History</CardTitle>
            <CardDescription>
              View the history of automation rule executions
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {executions.map((execution) => (
            <div
              key={execution.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center space-x-4">
                {getStatusIcon(execution.execution_status)}
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Rule ID: {execution.rule_id}</span>
                    <Badge variant={getStatusColor(execution.execution_status) as any}>
                      {execution.execution_status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Started {formatDistanceToNow(new Date(execution.started_at))} ago
                  </p>
                  {execution.error_message && (
                    <p className="text-sm text-red-500 mt-1">
                      Error: {execution.error_message}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  {execution.completed_at && (
                    <>Completed {formatDistanceToNow(new Date(execution.completed_at))} ago</>
                  )}
                </p>
                {execution.results && (
                  <p className="text-xs text-muted-foreground">
                    {Object.keys(execution.results).length} result(s)
                  </p>
                )}
              </div>
            </div>
          ))}
          {executions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No automation executions yet. Rules will appear here when they run.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
