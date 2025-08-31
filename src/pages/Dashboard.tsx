import { MainLayout } from "@/components/layout/MainLayout";
import { LiveDashboard } from "@/components/dashboard/LiveDashboard";
import { useState } from "react";

// Mock user data - replace with actual authentication
const mockUser = {
  id: "1",
  name: "Sarah Johnson",
  email: "sarah@allyimpact.org",
  role: "admin" as const,
};

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleLogout = () => {
    // Implement logout logic
    console.log("Logout clicked");
  };

  return (
    <MainLayout
      title="Impact Dashboard"
      user={mockUser}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onLogout={handleLogout}
      notifications={2}
    >
      <LiveDashboard />
    </MainLayout>
  );
};

export default Dashboard;