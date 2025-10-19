import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface AddStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const AddStudentDialog = ({ open, onOpenChange, onSuccess }: AddStudentDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [schools, setSchools] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    student_id_num: "",
    first_name: "",
    last_name: "",
    student_email_address: "",
    school_id: "",
  });

  useEffect(() => {
    if (open) {
      fetchSchools();
    }
  }, [open]);

  const fetchSchools = async () => {
    const { data } = await supabase.from("schools").select("*").order("name");
    setSchools(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.from("student_registry").insert({
        ...formData,
        created_by: user?.id,
      });

      if (error) throw error;

      toast.success("Student added to registry");
      onSuccess();
      onOpenChange(false);
      setFormData({
        student_id_num: "",
        first_name: "",
        last_name: "",
        student_email_address: "",
        school_id: "",
      });
    } catch (error: any) {
      console.error("Error adding student:", error);
      toast.error(error.message || "Failed to add student");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Student to Registry</DialogTitle>
          <DialogDescription>Add a new student who will be eligible to sign up</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="student_id_num">Student ID Number</Label>
            <Input
              id="student_id_num"
              value={formData.student_id_num}
              onChange={(e) => setFormData({ ...formData, student_id_num: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="first_name">First Name</Label>
            <Input
              id="first_name"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="last_name">Last Name</Label>
            <Input
              id="last_name"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="student_email_address">Student Email Address</Label>
            <Input
              id="student_email_address"
              type="email"
              value={formData.student_email_address}
              onChange={(e) => setFormData({ ...formData, student_email_address: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="school_id">School</Label>
            <Select value={formData.school_id} onValueChange={(value) => setFormData({ ...formData, school_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select school" />
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
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Student"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
