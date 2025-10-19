import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle, XCircle } from "lucide-react";

interface StudentRegistryTableProps {
  students: any[];
  loading: boolean;
  onRefresh: () => void;
}

export const StudentRegistryTable = ({ students, loading, onRefresh }: StudentRegistryTableProps) => {
  const toggleStudentStatus = async (studentId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("student_registry")
        .update({ is_active: !currentStatus })
        .eq("id", studentId);

      if (error) throw error;

      toast.success(`Student ${currentStatus ? "deactivated" : "reactivated"}`);
      onRefresh();
    } catch (error: any) {
      console.error("Error toggling status:", error);
      toast.error("Failed to update student status");
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading students...</div>;
  }

  if (students.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No students found</div>;
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium">Student ID</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
            <th className="px-4 py-3 text-left text-sm font-medium">School</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.id} className="border-t hover:bg-muted/50">
              <td className="px-4 py-3 text-sm">{student.student_id_num}</td>
              <td className="px-4 py-3 text-sm">
                {student.first_name} {student.last_name}
              </td>
              <td className="px-4 py-3 text-sm">{student.student_email_address}</td>
              <td className="px-4 py-3 text-sm">{student.schools?.name}</td>
              <td className="px-4 py-3 text-sm">
                {student.is_active ? (
                  <Badge variant="default" className="gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Active
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <XCircle className="h-3 w-3" />
                    Inactive
                  </Badge>
                )}
              </td>
              <td className="px-4 py-3 text-sm">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleStudentStatus(student.id, student.is_active)}
                >
                  {student.is_active ? "Deactivate" : "Reactivate"}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
