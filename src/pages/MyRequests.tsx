import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, MessageSquare, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MyRequests = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [outgoingRequests, setOutgoingRequests] = useState<any[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>("");

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchRequests();
      fetchLocations();
    }
  }, [user]);

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from("locations")
        .select("*");
      if (error) throw error;
      setLocations(data || []);
    } catch (error: any) {
      console.error("Error loading locations:", error);
    }
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);

      // Fetch outgoing requests (requests I made)
      const { data: outgoing, error: outgoingError } = await supabase
        .from("requests")
        .select(`
          *,
          textbooks (id, title, author, photo_url, owner_id, status),
          locations (id, name)
        `)
        .eq("borrower_id", user.id)
        .order("created_at", { ascending: false });

      if (outgoingError) throw outgoingError;

      // Fetch incoming requests (requests for my books)
      // First get my textbook IDs
      const { data: myTextbooks, error: textbooksError } = await supabase
        .from("textbooks")
        .select("id")
        .eq("owner_id", user.id);

      if (textbooksError) throw textbooksError;

      const myTextbookIds = myTextbooks?.map(t => t.id) || [];

      let incoming = [];
      // Only fetch requests if user has textbooks
      if (myTextbookIds.length > 0) {
        const { data: incomingData, error: incomingError } = await supabase
          .from("requests")
          .select(`
            *,
            textbooks (id, title, author, photo_url, owner_id, status),
            locations (id, name),
            profiles!requests_borrower_id_fkey (id, first_name, last_name)
          `)
          .in("textbook_id", myTextbookIds)
          .order("created_at", { ascending: false });

        if (incomingError) throw incomingError;
        incoming = incomingData || [];
      }

      setOutgoingRequests(outgoing || []);
      setIncomingRequests(incoming);
    } catch (error: any) {
      toast.error("Error loading requests");
    } finally {
      setLoading(false);
    }
  };

  const openApproveDialog = (request: any) => {
    setSelectedRequest(request);
    setApproveDialogOpen(true);
  };

  const handleApproveRequest = async () => {
    if (!selectedLocation || !selectedRequest) {
      toast.error("Please select a pickup location");
      return;
    }

    try {
      const { error } = await supabase
        .from("requests")
        .update({ 
          status: "approved",
          location_id: selectedLocation 
        })
        .eq("id", selectedRequest.id);

      if (error) throw error;

      // Send message with pickup location
      const location = locations.find(l => l.id === selectedLocation);
      await supabase
        .from("messages")
        .insert({
          request_id: selectedRequest.id,
          from_id: user.id,
          body: `Your request has been approved! Please pick up the book at: ${location?.name}`,
        });

      toast.success("Request approved and pickup location sent!");
      setApproveDialogOpen(false);
      setSelectedRequest(null);
      setSelectedLocation("");
      fetchRequests();
    } catch (error: any) {
      toast.error("Error approving request");
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from("requests")
        .update({ status: "rejected" })
        .eq("id", requestId);

      if (error) throw error;

      toast.success("Request rejected");
      fetchRequests();
    } catch (error: any) {
      toast.error("Error rejecting request");
    }
  };

  const handleConfirmPickup = async (requestId: string, textbookId: string, borrowerId: string) => {
    try {
      const { error } = await supabase.rpc("transfer_book_ownership", {
        _request_id: requestId,
        _textbook_id: textbookId,
        _new_owner_id: borrowerId,
      });

      if (error) throw error;

      toast.success("Book ownership transferred successfully!");
      fetchRequests();
    } catch (error: any) {
      toast.error(error.message || "Error transferring book ownership");
    }
  };

  const openMessageDialog = async (request: any) => {
    setSelectedRequest(request);
    setMessageDialogOpen(true);
    await fetchMessages(request.id);
  };

  const fetchMessages = async (requestId: string) => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select(`
          *,
          profiles!messages_from_id_fkey (id, first_name, last_name)
        `)
        .eq("request_id", requestId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      toast.error("Error loading messages");
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedRequest) return;

    try {
      const { error } = await supabase
        .from("messages")
        .insert({
          request_id: selectedRequest.id,
          from_id: user.id,
          body: newMessage,
        });

      if (error) throw error;

      setNewMessage("");
      await fetchMessages(selectedRequest.id);
    } catch (error: any) {
      toast.error("Error sending message");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-accent/20 text-accent";
      case "approved":
        return "bg-secondary text-secondary-foreground";
      case "rejected":
        return "bg-muted text-muted-foreground";
      case "completed":
        return "bg-primary/20 text-primary";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-8">
          My Requests
        </h1>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading requests...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Incoming Requests */}
            <div>
              <h2 className="text-2xl font-semibold mb-4">Requests for My Books</h2>
              {incomingRequests.length === 0 ? (
                <p className="text-muted-foreground">No incoming requests</p>
              ) : (
                <div className="grid gap-4">
                  {incomingRequests.map((request) => (
                    <Card key={request.id}>
                      <CardContent className="p-6">
                        <div className="flex gap-4">
                          <div className="w-20 h-28 bg-muted rounded flex items-center justify-center flex-shrink-0">
                            {request.textbooks?.photo_url ? (
                              <img src={request.textbooks.photo_url} alt="" className="w-full h-full object-cover rounded" />
                            ) : (
                              <BookOpen className="h-8 w-8 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-semibold text-lg">{request.textbooks?.title}</h3>
                                <p className="text-sm text-muted-foreground">
                                  Requested by: {request.profiles?.first_name} {request.profiles?.last_name}
                                </p>
                                {request.locations?.name && (
                                  <p className="text-sm text-muted-foreground">
                                    Pickup: {request.locations.name}
                                  </p>
                                )}
                              </div>
                              <Badge className={getStatusColor(request.status)}>
                                {request.status}
                              </Badge>
                            </div>
                            <div className="flex gap-2">
                              {request.status === "pending" && (
                                <>
                                  <Button size="sm" onClick={() => openApproveDialog(request)}>
                                    Approve
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => handleRejectRequest(request.id)}>
                                    Reject
                                  </Button>
                                </>
                              )}
                              <Button size="sm" variant="outline" onClick={() => openMessageDialog(request)}>
                                <MessageSquare className="h-4 w-4 mr-1" />
                                Messages
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Outgoing Requests */}
            <div>
              <h2 className="text-2xl font-semibold mb-4">My Book Requests</h2>
              {outgoingRequests.length === 0 ? (
                <p className="text-muted-foreground">No outgoing requests</p>
              ) : (
                <div className="grid gap-4">
                  {outgoingRequests.map((request) => (
                    <Card key={request.id}>
                      <CardContent className="p-6">
                        <div className="flex gap-4">
                          <div className="w-20 h-28 bg-muted rounded flex items-center justify-center flex-shrink-0">
                            {request.textbooks?.photo_url ? (
                              <img src={request.textbooks.photo_url} alt="" className="w-full h-full object-cover rounded" />
                            ) : (
                              <BookOpen className="h-8 w-8 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-semibold text-lg">{request.textbooks?.title}</h3>
                                {request.locations?.name && (
                                  <p className="text-sm text-muted-foreground">
                                    Pickup: {request.locations.name}
                                  </p>
                                )}
                              </div>
                              <Badge className={getStatusColor(request.status)}>
                                {request.status}
                              </Badge>
                            </div>
                            <div className="flex gap-2">
                              {request.status === "approved" && (
                                <Button 
                                  size="sm" 
                                  onClick={() => handleConfirmPickup(request.id, request.textbooks.id, request.borrower_id)}
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-1" />
                                  Confirm Pickup
                                </Button>
                              )}
                              <Button size="sm" variant="outline" onClick={() => openMessageDialog(request)}>
                                <MessageSquare className="h-4 w-4 mr-1" />
                                Messages
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Request</DialogTitle>
            <DialogDescription>
              Select where the borrower can pick up the book
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Pickup Location</Label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleApproveRequest} className="w-full">
              Approve & Send Location
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Messages</DialogTitle>
            <DialogDescription>
              Chat about "{selectedRequest?.textbooks?.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.from_id === user.id ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        message.from_id === user.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-xs font-semibold mb-1">
                        {message.profiles?.first_name} {message.profiles?.last_name}
                      </p>
                      <p className="text-sm">{message.body}</p>
                      <p className="text-xs mt-1 opacity-70">
                        {new Date(message.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="flex gap-2">
              <Textarea
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
              <Button onClick={sendMessage}>Send</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyRequests;
