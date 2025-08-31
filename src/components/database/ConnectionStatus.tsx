import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { testConnection } from '@/utils/supabase';
import { DatabaseConnectionStatus } from '@/types/database';
import { Database, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

export const ConnectionStatus = () => {
  const [status, setStatus] = useState<DatabaseConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkConnection();
  }, []);

  const handleRefresh = () => {
    checkConnection();
  };

  const checkConnection = async () => {
    setLoading(true);
    try {
      const result = await testConnection();
      setStatus(result);
    } catch (error) {
      setStatus({
        success: false,
        message: 'Failed to test connection',
        data: null
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Database className="h-4 w-4" />
          Database Connection
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={loading}
          className="h-8 w-8 p-0"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2">
          {loading ? (
            <>
              <div className="h-2 w-2 bg-muted animate-pulse rounded-full" />
              <span className="text-sm text-muted-foreground">Testing connection...</span>
            </>
          ) : (
            <>
              {status?.success ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              <Badge variant={status?.success ? "default" : "destructive"}>
                {status?.success ? "Connected" : "Disconnected"}
              </Badge>
            </>
          )}
        </div>
        {status && (
          <p className="text-xs text-muted-foreground mt-2">
            {status.message}
          </p>
        )}
      </CardContent>
    </Card>
  );
};