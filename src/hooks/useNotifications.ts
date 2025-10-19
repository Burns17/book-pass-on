import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface NotificationCounts {
  incomingPendingRequests: number;
  approvedRequestsToPickup: number;
  totalPending: number;
}

export const useNotifications = (userId: string | undefined) => {
  const [counts, setCounts] = useState<NotificationCounts>({
    incomingPendingRequests: 0,
    approvedRequestsToPickup: 0,
    totalPending: 0,
  });

  useEffect(() => {
    if (!userId) return;

    const fetchCounts = async () => {
      try {
        // Get my textbook IDs
        const { data: myTextbooks } = await supabase
          .from("textbooks")
          .select("id")
          .eq("owner_id", userId);

        const myTextbookIds = myTextbooks?.map((t) => t.id) || [];
        console.log("My textbook IDs:", myTextbookIds);

        // Count incoming pending requests (for my books)
        let incomingPending = 0;
        if (myTextbookIds.length > 0) {
          const { count, error } = await supabase
            .from("requests")
            .select("*", { count: "exact", head: true })
            .in("textbook_id", myTextbookIds)
            .eq("status", "pending");
          
          if (error) {
            console.error("Error counting incoming requests:", error);
          } else {
            incomingPending = count || 0;
            console.log("Incoming pending requests:", incomingPending);
          }
        }

        // Count approved requests waiting for my pickup
        const { count: approvedCount, error: approvedError } = await supabase
          .from("requests")
          .select("*", { count: "exact", head: true })
          .eq("borrower_id", userId)
          .eq("status", "approved");

        if (approvedError) {
          console.error("Error counting approved requests:", approvedError);
        }

        const totalPending = incomingPending + (approvedCount || 0);
        console.log("Total pending notifications:", totalPending);

        setCounts({
          incomingPendingRequests: incomingPending,
          approvedRequestsToPickup: approvedCount || 0,
          totalPending,
        });
      } catch (error) {
        console.error("Error fetching notification counts:", error);
      }
    };

    fetchCounts();

    // Set up real-time subscription
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "requests",
        },
        () => {
          fetchCounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return counts;
};
