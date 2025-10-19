import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { BookOpen, LogOut, User, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useNotifications } from "@/hooks/useNotifications";

interface NavbarProps {
  user?: any;
}

const Navbar = ({ user }: NavbarProps) => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const notifications = useNotifications(user?.id);

  useEffect(() => {
    if (user) {
      checkAdminRole();
    }
  }, [user]);

  const checkAdminRole = async () => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    
    setIsAdmin(!!data);
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error signing out");
    } else {
      toast.success("Signed out successfully");
      navigate("/");
    }
  };

  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to={user ? "/school-library" : "/"} className="flex items-center gap-2 font-semibold text-lg">
          <div className="rounded-full bg-gradient-to-br from-primary to-secondary p-2">
            <BookOpen className="h-5 w-5 text-primary-foreground" />
          </div>
          Pass It On
        </Link>
        
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link to="/school-library">
                <Button variant="ghost">School Library</Button>
              </Link>
              <Link to="/my-textbooks">
                <Button variant="ghost">My Textbooks</Button>
              </Link>
              <Link to="/my-requests">
                <Button variant="ghost" className="relative">
                  Requests
                  {notifications.totalPending > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                      {notifications.totalPending}
                    </span>
                  )}
                </Button>
              </Link>
              {isAdmin && (
                <Link to="/admin">
                  <Button variant="ghost" className="gap-2">
                    <Shield className="h-4 w-4" />
                    Admin
                  </Button>
                </Link>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link to="/auth">
              <Button>Get Started</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;