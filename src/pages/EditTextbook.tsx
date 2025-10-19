import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

const EditTextbook = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    isbn: "",
    edition: "",
    condition: "",
  });

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      await fetchTextbook(session.user.id);
    };

    checkUser();
  }, [navigate, id]);

  const fetchTextbook = async (userId: string) => {
    try {
      setFetchingData(true);
      const { data, error } = await supabase
        .from("textbooks")
        .select("*")
        .eq("id", id)
        .eq("owner_id", userId)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          title: data.title || "",
          author: data.author || "",
          isbn: data.isbn || "",
          edition: data.edition || "",
          condition: data.condition || "",
        });
      }
    } catch (error: any) {
      toast.error("Error loading textbook or you don't have permission");
      navigate("/my-textbooks");
    } finally {
      setFetchingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate inputs
    const title = formData.title.trim();
    const author = formData.author.trim();
    const isbn = formData.isbn.trim();
    const edition = formData.edition.trim();

    if (title.length === 0 || title.length > 200) {
      toast.error("Title must be between 1 and 200 characters");
      return;
    }
    if (author && author.length > 100) {
      toast.error("Author name must be 100 characters or less");
      return;
    }
    if (isbn && (isbn.length < 10 || isbn.length > 17 || !/^[0-9-]+$/.test(isbn))) {
      toast.error("ISBN must be 10-17 characters and contain only numbers and hyphens");
      return;
    }
    if (edition && edition.length > 50) {
      toast.error("Edition must be 50 characters or less");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("textbooks")
        .update({
          title,
          author: author || null,
          isbn: isbn || null,
          edition: edition || null,
          condition: formData.condition,
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Changes saved.");
      navigate("/my-textbooks");
    } catch (error: any) {
      toast.error("Error updating textbook");
    } finally {
      setLoading(false);
    }
  };

  if (!user || fetchingData) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/my-textbooks")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to My Textbooks
        </Button>

        <Card className="max-w-2xl mx-auto shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="text-3xl">Edit Textbook</CardTitle>
            <CardDescription>
              Update your textbook information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Book Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="e.g., Calculus: Early Transcendentals"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="author">Author</Label>
                <Input
                  id="author"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  placeholder="e.g., James Stewart"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="isbn">ISBN</Label>
                  <Input
                    id="isbn"
                    value={formData.isbn}
                    onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                    placeholder="e.g., 978-1285741550"
                  />
                  <p className="text-xs text-muted-foreground">
                    You'll find the ISBN near the barcode on the back.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edition">Edition</Label>
                  <Input
                    id="edition"
                    value={formData.edition}
                    onChange={(e) => setFormData({ ...formData, edition: e.target.value })}
                    placeholder="e.g., 8th"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="condition">Condition *</Label>
                <Select
                  value={formData.condition}
                  onValueChange={(value) => setFormData({ ...formData, condition: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="like-new">Like New</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EditTextbook;
