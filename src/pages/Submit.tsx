import { MainLayout } from "@/components/layout/MainLayout";
import { SubmissionForm } from "@/components/submission/SubmissionForm";
import { useState } from "react";

// Mock user data - replace with actual authentication
const mockUser = {
  id: "2",
  name: "Carlos Rodriguez",
  email: "carlos@partner.org",
  role: "partner" as const,
};

const Submit = () => {
  const [activeTab, setActiveTab] = useState('submit');

  const handleLogout = () => {
    console.log("Logout clicked");
  };

  return (
    <MainLayout
      title="Submit Impact Update"
      user={mockUser}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onLogout={handleLogout}
      notifications={1}
    >
      <SubmissionForm />
    </MainLayout>
  );
};

export default Submit;