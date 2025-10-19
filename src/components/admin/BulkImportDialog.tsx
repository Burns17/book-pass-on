import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const BulkImportDialog = ({ open, onOpenChange, onSuccess }: BulkImportDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const parseCSV = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());
    const rows = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      return headers.reduce((obj: any, header, index) => {
        obj[header] = values[index];
        return obj;
      }, {});
    });
    return rows;
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Please select a CSV file");
      return;
    }

    setLoading(true);
    try {
      const text = await file.text();
      const rows = parseCSV(text);

      const { data: { user } } = await supabase.auth.getUser();

      // Process each row
      for (const row of rows) {
        // Find school - support multiple column name variations
        let schoolId;
        const schoolName = row["SCHOOL NAME"] || row["SCHOOL"] || row["school"];
        const schoolDomain = row["SCHOOL DOMAIN"] || row["DOMAIN"] || row["domain"];

        if (!schoolName) {
          throw new Error("Missing SCHOOL or SCHOOL NAME column in CSV");
        }

        // Try to find school by name first
        const { data: existingSchool } = await supabase
          .from("schools")
          .select("id")
          .ilike("name", schoolName)
          .maybeSingle();

        if (existingSchool) {
          schoolId = existingSchool.id;
        } else if (schoolDomain) {
          // Create new school only if domain is provided
          const { data: newSchool, error: schoolError } = await supabase
            .from("schools")
            .insert({ name: schoolName, domain: schoolDomain })
            .select()
            .single();

          if (schoolError) throw schoolError;
          schoolId = newSchool.id;
        } else {
          throw new Error(`School "${schoolName}" not found. Please add SCHOOL DOMAIN column or create the school first.`);
        }

        // Insert student
        const { error: studentError } = await supabase
          .from("student_registry")
          .insert({
            student_id_num: row["STUDENT ID NUM"],
            first_name: row["FIRST NAME"],
            last_name: row["LAST NAME"],
            student_email_address: row["STUDENT EMAIL ADDRESS"],
            school_id: schoolId,
            is_active: row["IS ACTIVE"]?.toUpperCase() === "TRUE",
            created_by: user?.id,
          });

        if (studentError && !studentError.message.includes("duplicate")) {
          throw studentError;
        }
      }

      toast.success(`Successfully imported ${rows.length} students`);
      onSuccess();
      onOpenChange(false);
      setFile(null);
    } catch (error: any) {
      console.error("Error importing:", error);
      toast.error(error.message || "Failed to import CSV");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bulk Import Students</DialogTitle>
          <DialogDescription>
            Upload a CSV with: STUDENT ID NUM, FIRST NAME, LAST NAME, STUDENT EMAIL ADDRESS, SCHOOL (or SCHOOL NAME), IS ACTIVE. Add SCHOOL DOMAIN if creating new schools.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="csv-file">CSV File</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
            />
          </div>
          {file && (
            <p className="text-sm text-muted-foreground">
              Selected: {file.name}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={loading || !file}>
            {loading ? "Importing..." : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
