import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  RotateCcw,
  AlertTriangle,
  FileText,
  User,
  Calendar,
  Shield,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ProcessingStatus {
  id: string;
  submission_id: string;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed' | 'retry';
  retry_count: number;
  next_retry_at: string | null;
  processing_log: Array<{
    timestamp: string;
    step: string;
    status: 'started' | 'completed' | 'failed';
    message?: string;
    duration?: number;
  }>;
  created_at: string;
  updated_at: string;
  submissions: {
    content: string;
    privacy_level: string;
    character_count: number;
    partners: {
      name: string;
    };
  };
}

interface SubmissionProcessingStatusProps {
  submissionId?: string;
  showAllSubmissions?: boolean;
  refreshInterval?: number;
  className?: string;
}

const statusIcons = {
  pending: Clock,
  processing: Loader2,
  completed: CheckCircle,
  failed: XCircle,
  retry: RotateCcw
};

const statusColors = {
  pending: 'text-orange-500',
  processing: 'text-blue-500',
  completed: 'text-green-500',
  failed: 'text-red-500',
  retry: 'text-yellow-500'
};

const statusLabels = {
  pending: 'Pending',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
  retry: 'Retrying'
};

export function SubmissionProcessingStatus({
  submissionId,
  showAllSubmissions = false,
  refreshInterval = 5000,
  className = ""
}: SubmissionProcessingStatusProps) {
  const [submissions, setSubmissions] = useState<ProcessingStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubmissions();
    
    // Set up periodic refresh
    const interval = setInterval(fetchSubmissions, refreshInterval);
    
    // Set up real-time subscription
    const channel = supabase
      .channel('submission-processing-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'submissions',
          filter: submissionId ? `id=eq.${submissionId}` : undefined
        },
        () => {
          fetchSubmissions();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [submissionId, refreshInterval]);

  const fetchSubmissions = async () => {
    try {
      setError(null);
      
      let query = supabase
        .from('submissions')
        .select(`
          id,
          processing_status,
          retry_count,
          next_retry_at,
          processing_log,
          created_at,
          updated_at,
          content,
          privacy_level,
          character_count,
          partners!inner(name)
        `)
        .order('updated_at', { ascending: false });

      if (submissionId) {
        query = query.eq('id', submissionId);
      } else if (!showAllSubmissions) {
        // Show only recent submissions
        query = query.limit(10);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform data to match ProcessingStatus interface
      const transformedData = (data || []).map(item => ({
        ...item,
        submission_id: item.id,
        processing_log: Array.isArray(item.processing_log) 
          ? item.processing_log.map((entry: any) => ({
              timestamp: entry.timestamp || new Date().toISOString(),
              step: entry.step || 'Unknown',
              status: entry.status || 'started',
              message: entry.message,
              duration: entry.duration
            }))
          : [],
        submissions: {
          content: item.content,
          privacy_level: item.privacy_level,
          character_count: item.character_count,
          partners: item.partners
        }
      })) as ProcessingStatus[];

      setSubmissions(transformedData);
    } catch (err) {
      console.error('Error fetching submission status:', err);
      setError('Failed to load submission status');
    } finally {
      setLoading(false);
    }
  };

  const getProcessingProgress = (status: ProcessingStatus): number => {
    switch (status.processing_status) {
      case 'pending':
        return 0;
      case 'processing':
        return 50;
      case 'completed':
        return 100;
      case 'failed':
        return 0;
      case 'retry':
        return 25;
      default:
        return 0;
    }
  };

  const getEstimatedTimeRemaining = (status: ProcessingStatus): string => {
    if (status.processing_status === 'completed') return 'Completed';
    if (status.processing_status === 'failed') return 'Failed';
    
    if (status.next_retry_at) {
      const retryTime = new Date(status.next_retry_at);
      const now = new Date();
      if (retryTime > now) {
        return `Retry in ${formatDistanceToNow(retryTime)}`;
      }
    }

    // Estimate based on content length and processing status
    const baseTime = Math.max(30, Math.floor(status.submissions.character_count / 100));
    
    switch (status.processing_status) {
      case 'pending':
        return `~${baseTime} seconds`;
      case 'processing':
        return `~${Math.floor(baseTime / 2)} seconds`;
      case 'retry':
        return `~${baseTime * 2} seconds`;
      default:
        return 'Unknown';
    }
  };

  const renderProcessingLog = (log: ProcessingStatus['processing_log']) => {
    if (!log || log.length === 0) return null;

    return (
      <div className="space-y-2">
        <h4 className="font-medium text-sm">Processing Steps</h4>
        <ScrollArea className="h-32">
          <div className="space-y-2">
            {log.map((entry, index) => {
              const Icon = entry.status === 'completed' ? CheckCircle 
                         : entry.status === 'failed' ? XCircle 
                         : Loader2;
              
              return (
                <div key={index} className="flex items-start gap-2 text-xs">
                  <Icon className={`h-3 w-3 mt-0.5 ${
                    entry.status === 'completed' ? 'text-green-500' 
                    : entry.status === 'failed' ? 'text-red-500' 
                    : 'text-blue-500'
                  } ${entry.status === 'started' ? 'animate-spin' : ''}`} />
                  <div className="flex-1">
                    <div className="font-medium">{entry.step}</div>
                    {entry.message && (
                      <div className="text-muted-foreground">{entry.message}</div>
                    )}
                    <div className="text-muted-foreground">
                      {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                      {entry.duration && ` (${entry.duration}ms)`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    );
  };

  const renderSubmissionCard = (submission: ProcessingStatus) => {
    const StatusIcon = statusIcons[submission.processing_status];
    const progress = getProcessingProgress(submission);
    const timeRemaining = getEstimatedTimeRemaining(submission);

    return (
      <Card key={submission.id} className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base flex items-center gap-2">
                <StatusIcon className={`h-4 w-4 ${
                  submission.processing_status === 'processing' ? 'animate-spin' : ''
                } ${statusColors[submission.processing_status]}`} />
                {statusLabels[submission.processing_status]}
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-3 w-3" />
                {submission.submissions.partners.name}
                <Calendar className="h-3 w-3 ml-2" />
                {formatDistanceToNow(new Date(submission.created_at), { addSuffix: true })}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                <Shield className="h-3 w-3 mr-1" />
                {submission.submissions.privacy_level}
              </Badge>
              
              {submission.retry_count > 0 && (
                <Badge variant="secondary">
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Retry {submission.retry_count}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Processing Progress</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Estimated time: {timeRemaining}</span>
              <span>{submission.submissions.character_count} characters</span>
            </div>
          </div>

          {/* Content Preview */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <FileText className="h-3 w-3" />
              Content Preview
            </div>
            <div className="text-sm text-muted-foreground bg-muted p-2 rounded text-truncate">
              {submission.submissions.content.substring(0, 150)}
              {submission.submissions.content.length > 150 && '...'}
            </div>
          </div>

          {/* Processing Log */}
          {submission.processing_log && submission.processing_log.length > 0 && (
            <>
              <Separator />
              {renderProcessingLog(submission.processing_log)}
            </>
          )}

          {/* Error Details */}
          {submission.processing_status === 'failed' && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-red-600">
                  <AlertTriangle className="h-3 w-3" />
                  Processing Failed
                </div>
                <div className="text-sm text-muted-foreground">
                  The submission failed to process. It will be retried automatically.
                  {submission.next_retry_at && (
                    <div className="mt-1">
                      Next retry: {formatDistanceToNow(new Date(submission.next_retry_at), { addSuffix: true })}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading submission status...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="py-8">
          <div className="flex items-center justify-center text-red-600">
            <XCircle className="h-5 w-5 mr-2" />
            {error}
          </div>
          <div className="flex justify-center mt-4">
            <Button onClick={fetchSubmissions} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (submissions.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center text-muted-foreground">
          <FileText className="h-8 w-8 mx-auto mb-2" />
          No submissions found
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      {showAllSubmissions && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Submission Processing Status</h3>
          <Button onClick={fetchSubmissions} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      )}

      <div className="space-y-4">
        {submissions.map(renderSubmissionCard)}
      </div>
    </div>
  );
}