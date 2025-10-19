import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import Fuse from "fuse.js";
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
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";

const SchoolLibrary = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [allTextbooks, setAllTextbooks] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [conditionFilter, setConditionFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [selectedTextbook, setSelectedTextbook] = useState<string | null>(null);
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [owners, setOwners] = useState<Map<string, any>>(new Map());

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
  }, [user]);

  const fetchTextbooks = async () => {
    try {
      setLoading(true);
      console.log("Fetching all textbooks for school library");
      
      const { data, error } = await supabase
        .from("textbooks")
        .select("*")
        .order("created_at", { ascending: false });

      console.log("School library query result:", { data, error });

      if (error) {
        console.error("Error fetching textbooks:", error);
        throw error;
      }
      
      const textbooksData = data || [];
      setAllTextbooks(textbooksData);

      // Fetch owner profiles
      const ownerIds = [...new Set(textbooksData.map(t => t.owner_id))];
      console.log("Fetching profiles for owners:", ownerIds);
      
      const { data: profilesData, error: profileError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", ownerIds);

      console.log("Profiles query result:", { profilesData, profileError });

      if (profilesData) {
        const ownersMap = new Map();
        profilesData.forEach(profile => {
          ownersMap.set(profile.id, profile);
        });
        setOwners(ownersMap);
      }
    } catch (error: any) {
      console.error("Caught error in fetchTextbooks:", error);
      toast.error(`Error loading textbooks: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const fuse = useMemo(() => {
    return new Fuse(allTextbooks, {
      keys: ['title', 'isbn', 'author'],
      threshold: 0.4,
      includeScore: true,
      minMatchCharLength: 2,
    });
  }, [allTextbooks]);

  const textbooks = useMemo(() => {
    let filtered = allTextbooks;

    // Search filter
    if (searchQuery.trim()) {
      const results = fuse.search(searchQuery);
      filtered = results.map(result => result.item);
    }

    // Condition filter
    if (conditionFilter !== "all") {
      filtered = filtered.filter(t => t.condition === conditionFilter);
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    return filtered;
  }, [searchQuery, conditionFilter, statusFilter, allTextbooks, fuse]);

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

  const getConditionColor = (condition?: string) => {
    switch (condition) {
      case "new":
        return "bg-secondary text-secondary-foreground";
      case "like-new":
        return "bg-primary/20 text-primary";
      case "good":
        return "bg-accent/20 text-accent";
      case "fair":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-secondary text-secondary-foreground";
      case "reserved":
        return "bg-accent/20 text-accent";
      case "lent":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getOwnerName = (ownerId: string) => {
    const owner = owners.get(ownerId);
    if (!owner) return "Unknown";
    return `${owner.first_name} ${owner.last_name.charAt(0)}.`;
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            School Library
          </h1>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search by title or ISBN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={conditionFilter} onValueChange={setConditionFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Condition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Conditions</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="like-new">Like New</SelectItem>
                <SelectItem value="good">Good</SelectItem>
                <SelectItem value="fair">Fair</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="available">Available Only</SelectItem>
                <SelectItem value="lent">Lent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading textbooks...</p>
          </div>
        ) : textbooks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {searchQuery ? "No books match your search." : "No textbooks available in your school library yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {textbooks.map((textbook) => {
              const isOwnBook = textbook.owner_id === user.id;
              
              return (
                <Card key={textbook.id} className="overflow-hidden transition-all hover:shadow-[var(--shadow-card)]">
                  <CardHeader className="p-0">
                    <div className="aspect-[3/4] bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center overflow-hidden">
                      {textbook.photo_url ? (
                        <img
                          src={textbook.photo_url}
                          alt={textbook.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <BookOpen className="h-24 w-24 text-muted-foreground/30" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-lg line-clamp-2">{textbook.title}</h3>
                      <Badge className={getStatusColor(textbook.status)}>
                        {textbook.status}
                      </Badge>
                    </div>
                    {textbook.author && (
                      <p className="text-sm text-muted-foreground">by {textbook.author}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Owner: {getOwnerName(textbook.owner_id)}
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {textbook.condition && (
                        <Badge variant="outline" className={getConditionColor(textbook.condition)}>
                          {textbook.condition}
                        </Badge>
                      )}
                      {textbook.edition && (
                        <Badge variant="outline">{textbook.edition} ed.</Badge>
                      )}
                    </div>
                    {textbook.isbn && (
                      <p className="text-xs text-muted-foreground">ISBN: {textbook.isbn}</p>
                    )}
                  </CardContent>
                  {!isOwnBook && textbook.status === "available" && (
                    <CardFooter className="p-4 pt-0">
                      <Button
                        onClick={() => handleRequest(textbook.id)}
                        className="w-full"
                        variant="default"
                      >
                        Request Book
                      </Button>
                    </CardFooter>
                  )}
                  {isOwnBook && (
                    <CardFooter className="p-4 pt-0">
                      <Button
                        onClick={() => navigate(`/edit-textbook/${textbook.id}`)}
                        className="w-full"
                        variant="outline"
                      >
                        Edit
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              );
            })}
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

export default SchoolLibrary;
