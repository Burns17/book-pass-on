import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, RotateCcw } from "lucide-react";
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

const BorrowedBooks = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [borrowedBooks, setBorrowedBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<any>(null);

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
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchBorrowedBooks();
    }
  }, [user]);

  const fetchBorrowedBooks = async () => {
    try {
      setLoading(true);

      // Fetch completed requests where user is borrower
      const { data, error } = await supabase
        .from("requests")
        .select(`
          *,
          textbooks (id, title, author, photo_url, condition, owner_id, status),
          locations (id, name),
          profiles!requests_borrower_id_fkey (id, first_name, last_name)
        `)
        .eq("borrower_id", user.id)
        .eq("status", "completed")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBorrowedBooks(data || []);
    } catch (error: any) {
      toast.error("Error loading borrowed books");
    } finally {
      setLoading(false);
    }
  };

  const handleReturnBook = async () => {
    if (!selectedBook) return;

    try {
      // Mark request as returned
      const { error: requestError } = await supabase
        .from("requests")
        .update({ status: "returned" })
        .eq("id", selectedBook.id);

      if (requestError) throw requestError;

      // Make textbook available again
      const { error: textbookError } = await supabase
        .from("textbooks")
        .update({ status: "available" })
        .eq("id", selectedBook.textbooks.id);

      if (textbookError) throw textbookError;

      toast.success("Book returned successfully!");
      setReturnDialogOpen(false);
      setSelectedBook(null);
      fetchBorrowedBooks();
    } catch (error: any) {
      toast.error("Error returning book");
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

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-8">
          Books I'm Borrowing
        </h1>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading borrowed books...</p>
          </div>
        ) : borrowedBooks.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent className="pt-6">
              <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-muted-foreground mb-4">
                You're not currently borrowing any books.
              </p>
              <Button onClick={() => navigate("/school-library")}>
                Browse Library
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {borrowedBooks.map((request) => (
              <Card key={request.id} className="overflow-hidden transition-all hover:shadow-[var(--shadow-card)]">
                <CardHeader className="p-0">
                  <div className="aspect-[3/4] bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center overflow-hidden">
                    {request.textbooks?.photo_url ? (
                      <img
                        src={request.textbooks.photo_url}
                        alt={request.textbooks.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <BookOpen className="h-24 w-24 text-muted-foreground/30" />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-2">
                  <h3 className="font-semibold text-lg line-clamp-2">{request.textbooks?.title}</h3>
                  {request.textbooks?.author && (
                    <p className="text-sm text-muted-foreground">by {request.textbooks.author}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Picked up from: {request.locations?.name}
                  </p>
                  {request.textbooks?.condition && (
                    <Badge variant="outline" className={getConditionColor(request.textbooks.condition)}>
                      {request.textbooks.condition}
                    </Badge>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => {
                      setSelectedBook(request);
                      setReturnDialogOpen(true);
                    }}
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Return Book
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Return Book</AlertDialogTitle>
            <AlertDialogDescription>
              Confirm that you've returned "{selectedBook?.textbooks?.title}" to the owner?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReturnBook}>Confirm Return</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BorrowedBooks;
