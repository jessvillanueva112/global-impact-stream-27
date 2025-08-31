import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/navigation/BottomNav";
import { SubmissionForm } from "@/components/submission/SubmissionForm";
import { useState } from "react";

const Submit = () => {
  const [activeTab, setActiveTab] = useState('submit');

  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="Submit Update"
        notifications={2}
      />
      
      <main className="container mx-auto px-4 py-6 pb-20 md:pb-6">
        <SubmissionForm />
      </main>

      <BottomNav 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />
    </div>
  );
};

export default Submit;