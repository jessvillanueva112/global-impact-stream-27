import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, FileText } from "lucide-react";
import { useState } from "react";

const Reports = () => {
  const [activeTab, setActiveTab] = useState('reports');

  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="Reports"
        notifications={2}
      />
      
      <main className="container mx-auto px-4 py-6 pb-20 md:pb-6">
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
      </main>

      <BottomNav 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />
    </div>
  );
};

export default Reports;