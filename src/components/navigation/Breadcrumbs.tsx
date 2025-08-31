import { ChevronRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
}

// Generate breadcrumbs from current path
const generateBreadcrumbs = (pathname: string): BreadcrumbItem[] => {
  const pathSegments = pathname.split('/').filter(Boolean);
  
  const breadcrumbMap: Record<string, string> = {
    dashboard: 'Dashboard',
    submit: 'Submit Update',
    reports: 'Reports',
    settings: 'Settings',
    admin: 'Administration',
    users: 'User Management',
    partner: 'Partner',
    submissions: 'Submissions',
    donor: 'Donor',
    impact: 'Impact Reports',
    help: 'Help Center',
  };

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', href: '/' }
  ];

  let currentPath = '';
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const label = breadcrumbMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
    
    breadcrumbs.push({
      label,
      href: index === pathSegments.length - 1 ? undefined : currentPath
    });
  });

  return breadcrumbs;
};

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const location = useLocation();
  const breadcrumbItems = items || generateBreadcrumbs(location.pathname);

  if (breadcrumbItems.length <= 1) return null;

  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-4">
      {breadcrumbItems.map((item, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && <ChevronRight className="h-4 w-4 mx-1" />}
          {item.href ? (
            <Link
              to={item.href}
              className="hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}