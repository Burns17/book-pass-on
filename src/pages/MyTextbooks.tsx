import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MyTextbooks = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [textbooks, setTextbooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTextbook, setSelectedTextbook] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      await fetchMyTextbooks(session.user.id);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchMyTextbooks = async (userId: string) => {
    try {
      setLoading(true);
      console.log("Fetching textbooks for user:", userId);
      
      const { data, error } = await supabase
        .from("textbooks")
        .select("*")
        .eq("owner_id", userId)
        .order("created_at", { ascending: false });

      console.log("Textbooks query result:", { data, error });

      if (error) {
        console.error("Error fetching textbooks:", error);
        throw error;
      }
      
      setTextbooks(data || []);
    } catch (error: any) {
      console.error("Caught error in fetchMyTextbooks:", error);
      toast.error(`Error loading textbooks: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (textbookId: string, currentStatus: string) => {
    const newStatus = currentStatus === "available" ? "lent" : "available";
    
    try {
      const { error } = await supabase
        .from("textbooks")
        .update({ status: newStatus })
        .eq("id", textbookId);

      if (error) throw error;

      toast.success(`Status updated to ${newStatus}`);
      if (user) fetchMyTextbooks(user.id);
    } catch (error: any) {
      toast.error("Error updating status");
    }
  };

  const handleDelete = async () => {
    if (!selectedTextbook) return;

    try {
      const { error } = await supabase
        .from("textbooks")
        .delete()
        .eq("id", selectedTextbook);

      if (error) throw error;

      toast.success("Textbook removed.");
      setDeleteDialogOpen(false);
      setSelectedTextbook(null);
      if (user) fetchMyTextbooks(user.id);
    } catch (error: any) {
      toast.error("Error deleting textbook");
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
    return status === "available" 
      ? "bg-secondary text-secondary-foreground" 
      : "bg-muted text-muted-foreground";
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            My Books
          </h1>
          <Button onClick={() => navigate("/add-textbook")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Textbook
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading your textbooks...</p>
          </div>
        ) : textbooks.length === 0 ? (
          <Card className="text-center py-12 shadow-[var(--shadow-card)]">
            <CardContent className="pt-6">
              <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-muted-foreground mb-4">
                You haven't added any books yet. Add your first one!
              </p>
              <Button onClick={() => navigate("/add-textbook")}>
                <Plus className="mr-2 h-4 w-4" />
                Add Textbook
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {textbooks.map((textbook) => (
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
                <CardFooter className="p-4 pt-0 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate(`/edit-textbook/${textbook.id}`)}
                  >
                    <Pencil className="mr-1 h-3 w-3" />
                    Edit
                  </Button>
                  <Select
                    value={textbook.status}
                    onValueChange={(value) => handleToggleStatus(textbook.id, textbook.status)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="lent">Unavailable</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedTextbook(textbook.id);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Textbook</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this textbook? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MyTextbooks;
