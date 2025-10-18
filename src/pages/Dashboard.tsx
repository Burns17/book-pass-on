import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import TextbookCard from "@/components/TextbookCard";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [textbooks, setTextbooks] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [selectedTextbook, setSelectedTextbook] = useState<string | null>(null);
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>("");

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchTextbooks();
      fetchLocations();
    }
  }, [user, searchQuery]);

  const fetchTextbooks = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("textbooks")
        .select("*")
        .eq("status", "available")
        .neq("owner_id", user.id);

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,isbn.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setTextbooks(data || []);
    } catch (error: any) {
      toast.error("Error loading textbooks");
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from("locations")
        .select("*");
      if (error) throw error;
      setLocations(data || []);
    } catch (error: any) {
      console.error("Error loading locations:", error);
    }
  };

  const handleRequest = (textbookId: string) => {
    setSelectedTextbook(textbookId);
    setRequestDialogOpen(true);
  };

  const submitRequest = async () => {
    if (!selectedTextbook || !selectedLocation) {
      toast.error("Please select a pickup location");
      return;
    }

    try {
      const { error } = await supabase.from("requests").insert({
        borrower_id: user.id,
        textbook_id: selectedTextbook,
        location_id: selectedLocation,
        status: "pending",
      });

      if (error) throw error;

      toast.success("Request sent successfully!");
      setRequestDialogOpen(false);
      setSelectedTextbook(null);
      setSelectedLocation("");
      fetchTextbooks();
    } catch (error: any) {
      toast.error("Error sending request");
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Find Textbooks
          </h1>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search by title or ISBN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading textbooks...</p>
          </div>
        ) : textbooks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No textbooks found. Try a different search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {textbooks.map((textbook) => (
              <TextbookCard
                key={textbook.id}
                textbook={textbook}
                onRequest={handleRequest}
              />
            ))}
          </div>
        )}
      </div>

      <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Textbook</DialogTitle>
            <DialogDescription>
              Choose a pickup location to complete your request
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="location">Pickup Location</Label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={submitRequest} className="w-full">
              Send Request
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;