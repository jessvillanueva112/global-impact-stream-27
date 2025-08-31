import { Home, Plus, BarChart3, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard' },
  { id: 'submit', label: 'Submit', icon: Plus, path: '/submit' },
  { id: 'reports', label: 'Reports', icon: BarChart3, path: '/reports' },
  { id: 'profile', label: 'Profile', icon: User, path: '/settings' },
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
              asChild
              className={`
                flex flex-col items-center gap-1 h-16 text-xs
                ${isActive 
                  ? 'bg-gradient-primary text-primary-foreground shadow-primary' 
                  : 'text-muted-foreground hover:text-foreground'
                }
              `}
            >
              <Link to={item.path} onClick={() => onTabChange(item.id)}>
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            </Button>
          );
        })}
      </div>
    </div>
  );
};