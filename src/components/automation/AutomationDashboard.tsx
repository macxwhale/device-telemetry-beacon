
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  Plus, 
  Settings, 
  Zap, 
  Clock, 
  CheckCircle, 
  XCircle,
  Activity
} from 'lucide-react';
import { useAutomationRules, useAutomationExecutions } from '@/hooks/useAutomation';
import { useWebhookEndpoints } from '@/hooks/useWebhooks';
import { AutomationRuleEditor } from './AutomationRuleEditor';
import { WebhookManager } from './WebhookManager';
import { AutomationExecutionsList } from './AutomationExecutionsList';

export const AutomationDashboard = () => {
  const [showRuleEditor, setShowRuleEditor] = useState(false);
  const [selectedRule, setSelectedRule] = useState<any>(null);
  
  const { data: rules = [], isLoading: rulesLoading } = useAutomationRules();
  const { data: executions = [], isLoading: executionsLoading } = useAutomationExecutions();
  const { data: webhooks = [], isLoading: webhooksLoading } = useWebhookEndpoints();

  const stats = {
    totalRules: rules.length,
    activeRules: rules.filter(r => r.enabled).length,
    totalExecutions: executions.length,
    successfulExecutions: executions.filter(e => e.execution_status === 'completed').length,
    failedExecutions: executions.filter(e => e.execution_status === 'failed').length,
    totalWebhooks: webhooks.length,
    activeWebhooks: webhooks.filter(w => w.enabled).length,
  };

  const handleCreateRule = () => {
    setSelectedRule(null);
    setShowRuleEditor(true);
  };

  const handleEditRule = (rule: any) => {
    setSelectedRule(rule);
    setShowRuleEditor(true);
  };

  if (rulesLoading || executionsLoading || webhooksLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Automation Dashboard</h2>
          <p className="text-muted-foreground">
            Manage workflows, rules, and integrations
          </p>
        </div>
        <Button onClick={handleCreateRule}>
          <Plus className="mr-2 h-4 w-4" />
          New Rule
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rules</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRules}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeRules} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Executions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalExecutions}</div>
            <p className="text-xs text-muted-foreground">
              {stats.successfulExecutions} successful
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalExecutions > 0 
                ? Math.round((stats.successfulExecutions / stats.totalExecutions) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.failedExecutions} failed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Webhooks</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalWebhooks}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeWebhooks} active
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="rules" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rules">Automation Rules</TabsTrigger>
          <TabsTrigger value="executions">Execution History</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Automation Rules</CardTitle>
              <CardDescription>
                Create and manage automated workflows for your devices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {rule.enabled ? (
                          <Play className="h-4 w-4 text-green-500" />
                        ) : (
                          <Pause className="h-4 w-4 text-gray-400" />
                        )}
                        <div>
                          <h4 className="font-medium">{rule.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {rule.description}
                          </p>
                        </div>
                      </div>
                      <Badge variant={rule.enabled ? "default" : "secondary"}>
                        {rule.trigger_type}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={rule.enabled ? "default" : "secondary"}>
                        {rule.enabled ? "Active" : "Inactive"}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditRule(rule)}
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
                {rules.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No automation rules created yet. Click "New Rule" to get started.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="executions">
          <AutomationExecutionsList />
        </TabsContent>

        <TabsContent value="webhooks">
          <WebhookManager />
        </TabsContent>
      </Tabs>

      {showRuleEditor && (
        <AutomationRuleEditor
          rule={selectedRule}
          onClose={() => setShowRuleEditor(false)}
        />
      )}
    </div>
  );
};
