import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Shield, Users, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { ConnectionStatus } from "@/components/database/ConnectionStatus";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Hero Section */}
      <header className="relative">
        <nav className="flex items-center justify-between p-6">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
              <span className="text-sm font-bold text-white">AL</span>
            </div>
            <span className="text-xl font-bold text-white">Ally Impact Hub</span>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
              <Link to="/auth">Sign In</Link>
            </Button>
            <Button asChild className="bg-white text-primary hover:bg-white/90">
              <Link to="/dashboard">Demo</Link>
            </Button>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero Content */}
        <section className="px-6 py-20 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Mobile Impact Tracking for 
            <span className="block text-accent-warm">Child Protection</span>
          </h1>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            AI-powered platform with voice recording, auto-translation, and real-time dashboards 
            for tracking impact in child protection programs worldwide.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
              <Link to="/auth">Get Started</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
              <Link to="/dashboard">View Demo</Link>
            </Button>
          </div>
        </section>

        {/* Features Section */}
        <section className="px-6 py-16 bg-white">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
              Powerful Features for Maximum Impact
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="text-center">
                <CardHeader>
                  <Heart className="h-8 w-8 text-primary mx-auto mb-2" />
                  <CardTitle>Voice Recording</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Record impact stories in any language with automatic transcription
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <Shield className="h-8 w-8 text-accent-success mx-auto mb-2" />
                  <CardTitle>Auto Translation</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Break language barriers with AI-powered translation across 100+ languages
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <BarChart3 className="h-8 w-8 text-accent-warm mx-auto mb-2" />
                  <CardTitle>Real-time Dashboard</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Visualize impact metrics and track progress across all programs
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <Users className="h-8 w-8 text-primary mx-auto mb-2" />
                  <CardTitle>Mobile First</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Optimized for field workers with offline capabilities and responsive design
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-6 py-16 bg-secondary">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4 text-foreground">
              Ready to Transform Your Impact Tracking?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of organizations using Ally Impact Hub to measure and amplify their impact.
            </p>
            <Button asChild size="lg" className="bg-gradient-primary text-primary-foreground shadow-primary">
              <Link to="/auth">Start Your Journey</Link>
            </Button>
          </div>
        </section>

        {/* Connection Status */}
        <section className="px-6 py-12 bg-background">
          <div className="max-w-6xl mx-auto flex justify-center">
            <ConnectionStatus />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="px-6 py-8 bg-foreground text-white">
        <div className="max-w-6xl mx-auto text-center">
          <p>&copy; 2025 Ally Global Foundation. Empowering child protection worldwide.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;