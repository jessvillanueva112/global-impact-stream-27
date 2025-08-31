import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/navigation/AppSidebar";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { User } from "@/types";
import { useIsMobile } from "@/hooks/use-mobile";

interface MainLayoutProps {
  children: ReactNode;
  title: string;
  user?: User;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onLogout?: () => void;
  showBreadcrumbs?: boolean;
  notifications?: number;
}

export function MainLayout({
  children,
  title,
  user,
  activeTab,
  onTabChange,
  onLogout,
  showBreadcrumbs = true,
  notifications = 0,
}: MainLayoutProps) {
  const isMobile = useIsMobile();

  return (
    <ErrorBoundary>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          {/* Desktop Sidebar */}
          {!isMobile && <AppSidebar user={user} />}
          
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <Header
              title={title}
              user={user}
              notifications={notifications}
              onLogout={onLogout}
            />
            
            {/* Main Content */}
            <main className="flex-1 container mx-auto px-4 py-6 pb-20 md:pb-6">
              {showBreadcrumbs && <Breadcrumbs />}
              {children}
            </main>
            
            {/* Mobile Bottom Navigation */}
            {isMobile && activeTab && onTabChange && (
              <BottomNav 
                activeTab={activeTab} 
                onTabChange={onTabChange} 
              />
            )}
          </div>
        </div>
      </SidebarProvider>
    </ErrorBoundary>
  );
}