import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, AlertTriangle, BookOpen } from "lucide-react";

export const AdminDashboard = () => {
  const [stats, setStats] = useState({
    activeStudents: 0,
    totalUsers: 0,
    openReports: 0,
    totalTextbooks: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Active students in registry
      const { count: activeStudents } = await supabase
        .from("student_registry")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      // Total users
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Open reports
      const { count: openReports } = await supabase
        .from("reports")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      // Total textbooks
      const { count: totalTextbooks } = await supabase
        .from("textbooks")
        .select("*", { count: "exact", head: true });

      setStats({
        activeStudents: activeStudents || 0,
        totalUsers: totalUsers || 0,
        openReports: openReports || 0,
        totalTextbooks: totalTextbooks || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Students</CardTitle>
          <UserCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeStudents}</div>
          <p className="text-xs text-muted-foreground">In student registry</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalUsers}</div>
          <p className="text-xs text-muted-foreground">Registered accounts</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Open Reports</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.openReports}</div>
          <p className="text-xs text-muted-foreground">Pending moderation</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Textbooks</CardTitle>
          <BookOpen className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalTextbooks}</div>
          <p className="text-xs text-muted-foreground">Listed on platform</p>
        </CardContent>
      </Card>
    </div>
  );
};
