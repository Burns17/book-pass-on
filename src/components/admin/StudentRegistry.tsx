import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Upload, Search } from "lucide-react";
import { StudentRegistryTable } from "./StudentRegistryTable";
import { AddStudentDialog } from "./AddStudentDialog";
import { BulkImportDialog } from "./BulkImportDialog";

export const StudentRegistry = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("student_registry")
        .select(`
          *,
          schools (
            name,
            domain
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setStudents(data || []);
    } catch (error: any) {
      console.error("Error fetching students:", error);
      toast.error("Failed to load student registry");
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter((student) => {
    const term = searchTerm.toLowerCase();
    return (
      student.student_id_num.toLowerCase().includes(term) ||
      student.first_name.toLowerCase().includes(term) ||
      student.last_name.toLowerCase().includes(term) ||
      student.student_email_address.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Student Registry</CardTitle>
              <CardDescription>Manage eligible students for signup</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setShowImportDialog(true)} variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Bulk Import
              </Button>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Student
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by ID, name, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>

          <StudentRegistryTable 
            students={filteredStudents} 
            loading={loading}
            onRefresh={fetchStudents}
          />
        </CardContent>
      </Card>

      <AddStudentDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={fetchStudents}
      />

      <BulkImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onSuccess={fetchStudents}
      />
    </div>
  );
};
