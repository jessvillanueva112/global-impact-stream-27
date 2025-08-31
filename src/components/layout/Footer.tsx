import { Link } from "react-router-dom";
import { Heart, Github, Twitter, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Footer() {
  return (
    <footer className="border-t bg-card/50 backdrop-blur">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <span className="text-sm font-bold text-primary-foreground">AL</span>
              </div>
              <span className="text-lg font-bold text-foreground">Ally Impact Hub</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Empowering child protection worldwide through AI-powered impact tracking.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Quick Links</h3>
            <div className="flex flex-col space-y-2">
              <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Dashboard
              </Link>
              <Link to="/submit" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Submit Update
              </Link>
              <Link to="/reports" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Reports
              </Link>
            </div>
          </div>

          {/* Support */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Support</h3>
            <div className="flex flex-col space-y-2">
              <Link to="/help" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Help Center
              </Link>
              <Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Contact Us
              </Link>
              <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
            </div>
          </div>

          {/* Social Links */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Connect</h3>
            <div className="flex space-x-2">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Twitter className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Linkedin className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Github className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">
            © 2024 Ally Global Foundation. All rights reserved.
          </p>
          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2 md:mt-0">
            Made with <Heart className="h-4 w-4 text-red-500" /> for global impact
          </div>
        </div>
      </div>
    </footer>
  );
}