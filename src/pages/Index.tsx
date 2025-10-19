import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen, Search, Users, MapPin, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/hero-image.jpg";

const Index = () => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
        <div className="container mx-auto px-4 py-20 md:py-32 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                Share Textbooks,{" "}
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Build Community
                </span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Connect with students at your school to find, share, and exchange textbooks. 
                Save money and help others succeed.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to={user ? "/school-library" : "/auth"}>
                  <Button size="lg" className="text-lg px-8">
                    {user ? "Go to School Library" : "Get Started"}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                {!user && (
                  <Link to="/auth">
                    <Button size="lg" variant="outline" className="text-lg px-8">
                      Sign In
                    </Button>
                  </Link>
                )}
              </div>
            </div>
            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-[var(--shadow-card)]">
                <img
                  src={heroImage}
                  alt="Students sharing textbooks"
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Simple, safe, and student-focused textbook sharing
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                <BookOpen className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold">List Your Books</h3>
              <p className="text-muted-foreground">
                Add textbooks you're willing to share with details and condition
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-secondary to-secondary/70 flex items-center justify-center">
                <Search className="h-8 w-8 text-secondary-foreground" />
              </div>
              <h3 className="text-xl font-semibold">Search & Find</h3>
              <p className="text-muted-foreground">
                Browse available textbooks at your school by title or ISBN
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center">
                <Users className="h-8 w-8 text-accent-foreground" />
              </div>
              <h3 className="text-xl font-semibold">Connect Safely</h3>
              <p className="text-muted-foreground">
                Request books and coordinate with verified students
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <MapPin className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold">Easy Pickup</h3>
              <p className="text-muted-foreground">
                Meet at safe school locations like the library or office
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-8 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-3xl p-12">
            <h2 className="text-4xl font-bold">Ready to Start Sharing?</h2>
            <p className="text-xl text-muted-foreground">
              Join your school community and make textbooks accessible for everyone
            </p>
            <Link to={user ? "/my-textbooks" : "/auth"}>
              <Button size="lg" className="text-lg px-12">
                {user ? "List Your First Textbook" : "Create Your Account"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
