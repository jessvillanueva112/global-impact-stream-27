import { Home, Plus, BarChart3, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'submit', label: 'Submit', icon: Plus },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'profile', label: 'Profile', icon: User },
];

export const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur border-t shadow-lg md:hidden">
      <div className="grid grid-cols-4 gap-1 p-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <Button
              key={item.id}
              variant={isActive ? "default" : "ghost"}
              size="sm"
              onClick={() => onTabChange(item.id)}
              className={`
                flex flex-col items-center gap-1 h-16 text-xs
                ${isActive 
                  ? 'bg-gradient-primary text-primary-foreground shadow-primary' 
                  : 'text-muted-foreground hover:text-foreground'
                }
              `}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
};