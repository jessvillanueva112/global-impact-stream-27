import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  BarChart3,
  PieChart,
  Calendar,
  Users,
  FileText,
  Shield
} from 'lucide-react';
import { submissionService, type SubmissionAnalytics } from '@/services/submissionService';

interface ValidationDashboardProps {
  partnerId?: string;
  dateRange?: { start: string; end: string };
}

export const ValidationDashboard: React.FC<ValidationDashboardProps> = ({
  partnerId,
  dateRange
}) => {
  const [analytics, setAnalytics] = useState<SubmissionAnalytics | null>(null);
  const [validationStats, setValidationStats] = useState({
    totalValidations: 1247,
    passRate: 87.3,
    avgConfidenceScore: 0.89,
    topErrors: [
      { code: 'survivor_count_mismatch', count: 23, message: 'Survivor count calculation errors' },
      { code: 'future_date', count: 18, message: 'Future dates in reports' },
      { code: 'character_limit_exceeded', count: 12, message: 'Text length exceeded limits' },
      { code: 'required_field', count: 8, message: 'Missing required fields' }
    ],
    trendData: [
      { date: '2024-01-01', passed: 45, failed: 8 },
      { date: '2024-01-02', passed: 52, failed: 6 },
      { date: '2024-01-03', passed: 48, failed: 9 },
      { date: '2024-01-04', passed: 61, failed: 4 },
      { date: '2024-01-05', passed: 58, failed: 7 },
      { date: '2024-01-06', passed: 44, failed: 11 },
      { date: '2024-01-07', passed: 67, failed: 3 }
    ]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [partnerId, dateRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await submissionService.getSubmissionAnalytics(dateRange);
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getErrorSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
    }
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const calculateTrend = (data: any[]) => {
    if (data.length < 2) return 0;
    const latest = data[data.length - 1];
    const previous = data[data.length - 2];
    const latestRate = latest.passed / (latest.passed + latest.failed);
    const previousRate = previous.passed / (previous.passed + previous.failed);
    return ((latestRate - previousRate) * 100);
  };

  const trend = calculateTrend(validationStats.trendData);

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-6 w-48 bg-muted rounded" />
                <div className="h-20 w-full bg-muted rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Validations</p>
                <p className="text-2xl font-bold">{validationStats.totalValidations.toLocaleString()}</p>
              </div>
              <Shield className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pass Rate</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{formatPercentage(validationStats.passRate)}</p>
                  {trend > 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                </div>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <Progress value={validationStats.passRate} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Confidence</p>
                <p className="text-2xl font-bold">{(validationStats.avgConfidenceScore * 100).toFixed(1)}%</p>
              </div>
              <Activity className="h-8 w-8 text-purple-500" />
            </div>
            <Progress value={validationStats.avgConfidenceScore * 100} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Errors</p>
                <p className="text-2xl font-bold">
                  {validationStats.topErrors.reduce((sum, error) => sum + error.count, 0)}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="errors">Error Analysis</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="rules">Validation Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Validation Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Validation Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded" />
                      <span className="text-sm">Passed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{formatPercentage(validationStats.passRate)}</span>
                    </div>
                  </div>
                  <Progress value={validationStats.passRate} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded" />
                      <span className="text-sm">Failed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{formatPercentage(100 - validationStats.passRate)}</span>
                    </div>
                  </div>
                  <Progress value={100 - validationStats.passRate} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Validation Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {validationStats.trendData.slice(-5).map((day, index) => {
                    const total = day.passed + day.failed;
                    const passRate = total > 0 ? (day.passed / total) * 100 : 0;
                    
                    return (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-20 text-sm text-muted-foreground">
                          {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                        <div className="flex-1">
                          <Progress value={passRate} className="h-2" />
                        </div>
                        <div className="w-16 text-sm font-medium text-right">
                          {formatPercentage(passRate)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="errors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Top Validation Errors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {validationStats.topErrors.map((error, index) => (
                  <div key={error.code} className={`p-4 rounded-lg border ${getErrorSeverityColor('medium')}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">#{index + 1}</span>
                        <span className="font-medium">{error.message}</span>
                      </div>
                      <Badge variant="outline">{error.count} occurrences</Badge>
                    </div>
                    <div className="text-sm opacity-80">
                      Error Code: <code className="bg-white/20 px-1 py-0.5 rounded">{error.code}</code>
                    </div>
                    <div className="mt-2">
                      <Progress 
                        value={(error.count / Math.max(...validationStats.topErrors.map(e => e.count))) * 100} 
                        className="h-1" 
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Recommendations</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Review data entry training for survivor count calculations</li>
                  <li>• Implement date validation in partner interfaces</li>
                  <li>• Add character count indicators to text fields</li>
                  <li>• Create validation checklists for common scenarios</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Validation Trends (Last 7 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {validationStats.trendData.map((day, index) => {
                  const total = day.passed + day.failed;
                  const passRate = total > 0 ? (day.passed / total) * 100 : 0;
                  
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>{new Date(day.date).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-green-600">{day.passed} passed</span>
                          <span className="text-red-600">{day.failed} failed</span>
                          <span className="font-medium">{formatPercentage(passRate)}</span>
                        </div>
                      </div>
                      <Progress value={passRate} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Validation Rules</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: 'Required Fields', status: 'active', severity: 'high' },
                    { name: 'Survivor Count Logic', status: 'active', severity: 'high' },
                    { name: 'Date Range Validation', status: 'active', severity: 'medium' },
                    { name: 'Character Limits', status: 'active', severity: 'low' },
                    { name: 'Data Consistency', status: 'active', severity: 'medium' },
                    { name: 'Duplicate Detection', status: 'active', severity: 'low' }
                  ].map((rule, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="font-medium">{rule.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={rule.severity === 'high' ? 'destructive' : 
                                      rule.severity === 'medium' ? 'default' : 'secondary'}>
                          {rule.severity}
                        </Badge>
                        <Badge variant="outline">{rule.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rule Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Validation rules help ensure data quality and consistency across all submissions.
                    Rules can be customized per submission type and partner requirements.
                  </AlertDescription>
                </Alert>
                
                <div className="mt-4 space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Export Rule Configuration
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Rule Review
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="h-4 w-4 mr-2" />
                    Partner-Specific Rules
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};