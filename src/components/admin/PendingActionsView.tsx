import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

interface UserWithPendingActions {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  pendingIncoming: number;
  approvedOutgoing: number;
}

export const PendingActionsView = () => {
  const [users, setUsers] = useState<UserWithPendingActions[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsersWithPendingActions();
  }, []);

  const fetchUsersWithPendingActions = async () => {
    try {
      setLoading(true);

      // Get all users
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email");

      if (!profiles) return;

      const usersWithActions: UserWithPendingActions[] = [];

      for (const profile of profiles) {
        // Get textbooks owned by this user
        const { data: textbooks } = await supabase
          .from("textbooks")
          .select("id")
          .eq("owner_id", profile.id);

        const textbookIds = textbooks?.map((t) => t.id) || [];

        // Count pending requests for their books
        let pendingIncoming = 0;
        if (textbookIds.length > 0) {
          const { count } = await supabase
            .from("requests")
            .select("*", { count: "exact", head: true })
            .in("textbook_id", textbookIds)
            .eq("status", "pending");
          pendingIncoming = count || 0;
        }

        // Count approved requests they need to pick up
        const { count: approvedOutgoing } = await supabase
          .from("requests")
          .select("*", { count: "exact", head: true })
          .eq("borrower_id", profile.id)
          .eq("status", "approved");

        // Only include users with pending actions
        if (pendingIncoming > 0 || (approvedOutgoing || 0) > 0) {
          usersWithActions.push({
            id: profile.id,
            first_name: profile.first_name,
            last_name: profile.last_name,
            email: profile.email,
            pendingIncoming,
            approvedOutgoing: approvedOutgoing || 0,
          });
        }
      }

      setUsers(usersWithActions);
    } catch (error) {
      console.error("Error fetching users with pending actions:", error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Users with Pending Actions</CardTitle>
          <CardDescription>Members who have actions to complete</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users with Pending Actions</CardTitle>
        <CardDescription>
          {users.length} {users.length === 1 ? "member has" : "members have"} actions to complete
        </CardDescription>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <p className="text-muted-foreground">No pending actions</p>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(user.first_name, user.last_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {user.first_name} {user.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {user.pendingIncoming > 0 && (
                      <Badge variant="outline" className="bg-accent/20">
                        {user.pendingIncoming} to approve
                      </Badge>
                    )}
                    {user.approvedOutgoing > 0 && (
                      <Badge variant="outline" className="bg-secondary/20">
                        {user.approvedOutgoing} to pickup
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
