import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/navigation/BottomNav";
import { LiveDashboard } from "@/components/dashboard/LiveDashboard";
import { SubmissionForm } from "@/components/submission/SubmissionForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Users, FileText } from "lucide-react";

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <LiveDashboard />;
      case 'submit':
        return <SubmissionForm />;
      case 'reports':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Reports & Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Reports Coming Soon</h3>
                <p className="text-muted-foreground">
                  Advanced reporting and analytics features will be available in the next update.
                </p>
              </div>
            </CardContent>
          </Card>
        );
      case 'profile':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Profile & Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Profile Settings</h3>
                <p className="text-muted-foreground">
                  User profile and settings management will be available soon.
                </p>
              </div>
            </CardContent>
          </Card>
        );
      default:
        return <LiveDashboard />;
    }
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Ally Impact Hub';
      case 'submit': return 'Submit Update';
      case 'reports': return 'Reports';
      case 'profile': return 'Profile';
      default: return 'Ally Impact Hub';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        title={getPageTitle()}
        notifications={2}
      />
      
      <main className="container mx-auto px-4 py-6">
        {renderContent()}
      </main>

      <BottomNav 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />
    </div>
  );
};

export default Index;
