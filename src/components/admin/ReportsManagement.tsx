import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const ReportsManagement = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("reports")
        .select(`
          *,
          reporter:profiles!reporter_id(first_name, last_name, email)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error: any) {
      console.error("Error fetching reports:", error);
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const updateReportStatus = async (reportId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("reports")
        .update({ status: newStatus })
        .eq("id", reportId);

      if (error) throw error;

      toast.success(`Report ${newStatus}`);
      fetchReports();
    } catch (error: any) {
      console.error("Error updating report:", error);
      toast.error("Failed to update report status");
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading reports...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reports Management</CardTitle>
        <CardDescription>Review and moderate user reports</CardDescription>
      </CardHeader>
      <CardContent>
        {reports.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No reports found</div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={report.status === "pending" ? "default" : "secondary"}>
                        {report.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {report.target_type}
                      </span>
                    </div>
                    <p className="text-sm font-medium">
                      Reported by: {report.reporter?.first_name} {report.reporter?.last_name}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {report.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateReportStatus(report.id, "resolved")}
                        >
                          Resolve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateReportStatus(report.id, "dismissed")}
                        >
                          Dismiss
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium">Reason:</p>
                  <p className="text-sm text-muted-foreground">{report.reason}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(report.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
