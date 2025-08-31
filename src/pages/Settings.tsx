import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon, Users } from "lucide-react";
import { useState } from "react";

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="Settings"
        notifications={2}
      />
      
      <main className="container mx-auto px-4 py-6 pb-20 md:pb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
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
      </main>

      <BottomNav 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />
    </div>
  );
};

export default Settings;