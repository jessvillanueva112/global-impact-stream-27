import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/navigation/BottomNav";
import { LiveDashboard } from "@/components/dashboard/LiveDashboard";
import { useState } from "react";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="Ally Impact Hub"
        notifications={2}
      />
      
      <main className="container mx-auto px-4 py-6 pb-20 md:pb-6">
        <LiveDashboard />
      </main>

      <BottomNav 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />
    </div>
  );
};

export default Dashboard;