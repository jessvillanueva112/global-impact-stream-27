import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Filter, 
  Calendar,
  FileText,
  Mic,
  Camera,
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye,
  Edit3,
  MoreHorizontal,
  Download,
  Archive
} from 'lucide-react';
import { submissionService } from '@/services/submissionService';
import { useToast } from '@/hooks/use-toast';

interface Submission {
  id: string;
  content: string;
  submissionType: string;
  privacyLevel: string;
  processingStatus: string;
  createdAt: string;
  updatedAt: string;
  mediaFiles?: any;
  partnerName?: string;
  urgencyLevel?: string;
  characterCount?: number;
}

interface SubmissionHistoryProps {
  partnerId?: string;
  showAllPartners?: boolean;
}

export const SubmissionHistory = ({
  partnerId,
  showAllPartners = false
}) => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedSubmissions, setSelectedSubmissions] = useState<string[]>([]);

  const { toast } = useToast();

  useEffect(() => {
    loadSubmissions();
  }, [currentPage, selectedStatus, selectedType, dateRange, searchTerm, partnerId]);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      
      const filter = {
        ...(selectedStatus !== 'all' && { status: [selectedStatus] }),
        ...(selectedType !== 'all' && { submissionType: [selectedType] }),
        ...(searchTerm && { search: searchTerm }),
        ...(partnerId && { partnerId })
      };

      const result = await submissionService.getSubmissions(filter, currentPage, 20);
      setSubmissions(result.submissions);
      setTotalPages(Math.ceil(result.total / result.pageSize));
    } catch (error) {
      console.error('Failed to load submissions:', error);
      toast({
        title: "Error",
        description: "Failed to load submissions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'default',
      processing: 'secondary',
      failed: 'destructive',
      pending: 'outline'
    };
    
    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getSubmissionTypeIcon = (type: string) => {
    if (type?.includes('voice')) return <Mic className="h-4 w-4" />;
    if (type?.includes('photo')) return <Camera className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const getUrgencyBadge = (urgencyLevel: string) => {
    const colors = {
      low: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100',
      medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-100',
      high: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-100',
      critical: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${colors[urgencyLevel] || colors.medium}`}>
        {urgencyLevel?.toUpperCase() || 'MEDIUM'}
      </span>
    );
  };

  const handleBulkAction = async (action: string) => {
    if (selectedSubmissions.length === 0) {
      toast({
        title: "No selections",
        description: "Please select submissions to perform bulk actions.",
        variant: "destructive"
      });
      return;
    }

    try {
      switch (action) {
        case 'archive':
          await submissionService.bulkUpdateSubmissions(selectedSubmissions, { archived: true });
          toast({
            title: "Success",
            description: `${selectedSubmissions.length} submissions archived.`
          });
          break;
        case 'export':
          // Implement export functionality
          toast({
            title: "Export started",
            description: "Your submissions are being exported."
          });
          break;
        default:
          break;
      }
      
      setSelectedSubmissions([]);
      loadSubmissions();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to perform bulk action. Please try again.",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Submission History</CardTitle>
            {selectedSubmissions.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedSubmissions.length} selected
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleBulkAction('archive')}
                >
                  <Archive className="h-4 w-4 mr-1" />
                  Archive
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleBulkAction('export')}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search submissions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="general_report">General Report</SelectItem>
                  <SelectItem value="survivor_report">Survivor Report</SelectItem>
                  <SelectItem value="crisis_report">Crisis Report</SelectItem>
                  <SelectItem value="monthly_summary">Monthly Summary</SelectItem>
                  <SelectItem value="story_submission">Impact Story</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submissions List */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-4 w-4 bg-muted rounded" />
                      <div className="h-4 w-32 bg-muted rounded" />
                      <div className="h-6 w-20 bg-muted rounded" />
                    </div>
                    <div className="h-4 w-full bg-muted rounded" />
                    <div className="h-4 w-3/4 bg-muted rounded" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : submissions.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No submissions found</h3>
              <p className="text-muted-foreground">
                {searchTerm || selectedStatus !== 'all' || selectedType !== 'all'
                  ? 'Try adjusting your filters to see more results.'
                  : 'Create your first submission to get started.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          submissions.map((submission) => (
            <Card key={submission.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Selection Checkbox */}
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={selectedSubmissions.includes(submission.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedSubmissions([...selectedSubmissions, submission.id]);
                      } else {
                        setSelectedSubmissions(selectedSubmissions.filter(id => id !== submission.id));
                      }
                    }}
                  />

                  {/* Content */}
                  <div className="flex-1 space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getSubmissionTypeIcon(submission.submissionType)}
                        <span className="font-medium">
                          {submission.submissionType?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'General Report'}
                        </span>
                        {getStatusBadge(submission.processingStatus)}
                        {submission.urgencyLevel && getUrgencyBadge(submission.urgencyLevel)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {formatDate(submission.createdAt)}
                      </div>
                    </div>

                    {/* Content Preview */}
                    <div className="space-y-2">
                      <p className="text-sm line-clamp-2">
                        {submission.content.length > 150 
                          ? `${submission.content.substring(0, 150)}...`
                          : submission.content
                        }
                      </p>
                      
                      {/* Media indicators */}
                      {submission.mediaFiles && (
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {submission.mediaFiles.audio && (
                            <div className="flex items-center gap-1">
                              <Mic className="h-3 w-3" />
                              Voice recording
                            </div>
                          )}
                          {submission.mediaFiles.images && (
                            <div className="flex items-center gap-1">
                              <Camera className="h-3 w-3" />
                              {submission.mediaFiles.images.length} image(s)
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {showAllPartners && submission.partnerName && (
                          <span>Partner: {submission.partnerName}</span>
                        )}
                        <span>Privacy: {submission.privacyLevel}</span>
                        {submission.characterCount && (
                          <span>{submission.characterCount.toLocaleString()} characters</span>
                        )}
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Status Icon */}
                  <div className="mt-1">
                    {getStatusIcon(submission.processingStatus)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          
          <div className="flex items-center gap-1">
            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              const page = i + 1;
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="w-8 h-8 p-0"
                >
                  {page}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};