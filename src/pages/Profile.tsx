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
import TextbookCard from "@/components/TextbookCard";

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [schools, setSchools] = useState<any[]>([]);
  const [myTextbooks, setMyTextbooks] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    school_id: "",
    graduation_year: "",
  });

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      await fetchProfile(session.user.id);
      await fetchSchools();
      await fetchMyTextbooks(session.user.id);
    };

    checkUser();
  }, [navigate]);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          school_id: data.school_id || "",
          graduation_year: data.graduation_year?.toString() || "",
        });
      }
    } catch (error: any) {
      console.error("Error fetching profile:", error);
    }
  };

  const fetchSchools = async () => {
    try {
      const { data, error } = await supabase
        .from("schools")
        .select("*")
        .order("name");

      if (error) throw error;
      setSchools(data || []);
    } catch (error: any) {
      console.error("Error fetching schools:", error);
    }
  };

  const fetchMyTextbooks = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("textbooks")
        .select("*")
        .eq("owner_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMyTextbooks(data || []);
    } catch (error: any) {
      console.error("Error fetching textbooks:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          school_id: formData.school_id || null,
          graduation_year: formData.graduation_year ? parseInt(formData.graduation_year) : null,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Profile updated successfully!");
    } catch (error: any) {
      toast.error("Error updating profile");
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
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="max-w-4xl mx-auto space-y-8">
          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle className="text-3xl">Your Profile</CardTitle>
              <CardDescription>
                Update your information to connect with students at your school
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) =>
                        setFormData({ ...formData, first_name: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) =>
                        setFormData({ ...formData, last_name: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="school">School</Label>
                  <Select
                    value={formData.school_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, school_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your school" />
                    </SelectTrigger>
                    <SelectContent>
                      {schools.map((school) => (
                        <SelectItem key={school.id} value={school.id}>
                          {school.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="graduation_year">Graduation Year (Optional)</Label>
                  <Input
                    id="graduation_year"
                    type="number"
                    min="2020"
                    max="2030"
                    value={formData.graduation_year}
                    onChange={(e) =>
                      setFormData({ ...formData, graduation_year: e.target.value })
                    }
                    placeholder="e.g., 2025"
                  />
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Saving..." : "Save Profile"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle>Your Listed Textbooks</CardTitle>
              <CardDescription>
                Manage the textbooks you're sharing
              </CardDescription>
            </CardHeader>
            <CardContent>
              {myTextbooks.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  You haven't listed any textbooks yet.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myTextbooks.map((textbook) => (
                    <TextbookCard
                      key={textbook.id}
                      textbook={textbook}
                      showRequestButton={false}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;