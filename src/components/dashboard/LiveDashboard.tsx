import { MetricCard } from "./MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Home, GraduationCap, AlertTriangle, Mic, Camera, FileText } from "lucide-react";

// Mock data - in real app this would come from Supabase real-time subscriptions
const liveStats = {
  totalSurvivors: 2741,
  newAdmissions: 34,
  safeHomes: 8,
  graduatedSurvivors: 18,
  crisisAlerts: 2,
  pendingSubmissions: 5
};

const recentSubmissions = [
  {
    id: 1,
    partner: "Nepal Program - Maria",
    type: "voice",
    content: "Monthly update from Kathmandu safe home...",
    timestamp: "2 hours ago",
    status: "processing"
  },
  {
    id: 2,
    partner: "Cambodia Program - Sophea", 
    type: "photo",
    content: "Birthday celebration photos",
    timestamp: "4 hours ago",
    status: "completed"
  },
  {
    id: 3,
    partner: "Nepal Program - Ram",
    type: "text",
    content: "Prevention workshop attendance report",
    timestamp: "6 hours ago",
    status: "completed"
  }
];

const getSubmissionIcon = (type: string) => {
  switch (type) {
    case 'voice': return <Mic className="h-4 w-4" />;
    case 'photo': return <Camera className="h-4 w-4" />;
    default: return <FileText className="h-4 w-4" />;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'processing':
      return <Badge variant="secondary" className="animate-pulse-soft">Processing</Badge>;
    case 'completed':
      return <Badge className="bg-accent-success text-accent-success-foreground">Completed</Badge>;
    default:
      return <Badge variant="outline">Pending</Badge>;
  }
};

export const LiveDashboard = () => {
  return (
    <div className="space-y-6 animate-slide-up">
      {/* Hero Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Survivors in Care"
          value={liveStats.totalSurvivors.toLocaleString()}
          subtitle="Across all programs"
          icon={<Users className="h-6 w-6" />}
          variant="primary"
          trend="up"
          trendValue="+12 this month"
        />
        
        <MetricCard
          title="New Admissions"
          value={liveStats.newAdmissions}
          subtitle="This month"
          icon={<Home className="h-6 w-6" />}
          variant="success"
          trend="up"
          trendValue="+5 from last month"
        />
        
        <MetricCard
          title="Graduations"
          value={liveStats.graduatedSurvivors}
          subtitle="Successfully reintegrated"
          icon={<GraduationCap className="h-6 w-6" />}
          trend="up"
          trendValue="+3 from last month"
        />
        
        <MetricCard
          title="Crisis Alerts"
          value={liveStats.crisisAlerts}
          subtitle="Requiring immediate attention"
          icon={<AlertTriangle className="h-6 w-6" />}
          variant="warning"
          trend="down"
          trendValue="-1 from yesterday"
        />
      </div>

      {/* Recent Submissions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-semibold">Recent Submissions</CardTitle>
          <Badge variant="outline">Live Updates</Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentSubmissions.map((submission) => (
              <div 
                key={submission.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card/50 hover:bg-card transition-colors"
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-1">
                    {getSubmissionIcon(submission.type)}
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{submission.partner}</p>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">{submission.timestamp}</span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {submission.content}
                    </p>
                  </div>
                </div>
                <div className="ml-4">
                  {getStatusBadge(submission.status)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary-light to-primary/10">
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-primary">8</div>
            <div className="text-sm text-muted-foreground">Active Safe Homes</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-accent-success/20 to-accent-success/5">
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-accent-success">15+</div>
            <div className="text-sm text-muted-foreground">Partner Organizations</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-accent-warm/20 to-accent-warm/5">
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-accent-warm">{liveStats.pendingSubmissions}</div>
            <div className="text-sm text-muted-foreground">Pending Submissions</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};