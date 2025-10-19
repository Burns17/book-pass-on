import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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

const AddTextbook = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    isbn: "",
    edition: "",
    condition: "",
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();
      
      setProfile(profileData);
    };

    checkUser();
  }, [navigate]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
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
      let photoUrl = null;

      // Upload photo if selected
      if (photoFile) {
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('textbook-photos')
          .upload(fileName, photoFile);

        if (uploadError) {
          console.error("Error uploading photo:", uploadError);
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('textbook-photos')
          .getPublicUrl(uploadData.path);
        
        photoUrl = publicUrl;
      }
      console.log("Adding textbook with data:", {
        owner_id: user.id,
        school_id: profile?.school_id,
        title,
        author: author || null,
        isbn: isbn || null,
        edition: edition || null,
        condition: formData.condition,
        status: "available",
      });

      const { data, error } = await supabase.from("textbooks").insert({
        owner_id: user.id,
        school_id: profile?.school_id || null,
        title,
        author: author || null,
        isbn: isbn || null,
        edition: edition || null,
        condition: formData.condition,
        status: "available",
        photo_url: photoUrl,
      });

      if (error) {
        console.error("Error inserting textbook:", error);
        throw error;
      }

      console.log("Textbook added successfully:", data);
      toast.success("Textbook added.");
      navigate("/my-textbooks");
    } catch (error: any) {
      console.error("Caught error:", error);
      toast.error(`Error adding textbook: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

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
          Back to My Books
        </Button>

        <Card className="max-w-2xl mx-auto shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="text-3xl">Add a Textbook</CardTitle>
            <CardDescription>
              Share your textbook with other students at your school
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
                  <Label htmlFor="isbn">ISBN *</Label>
                  <Input
                    id="isbn"
                    value={formData.isbn}
                    onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                    placeholder="e.g., 978-1285741550"
                    required
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

              <div className="space-y-2">
                <Label htmlFor="photo">Photo (Optional)</Label>
                <Input
                  id="photo"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                />
                {photoPreview && (
                  <div className="mt-2">
                    <img 
                      src={photoPreview} 
                      alt="Preview" 
                      className="w-full h-48 object-cover rounded-md"
                    />
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Adding..." : "Add Textbook"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddTextbook;