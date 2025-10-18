import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const SeedData = () => {
  const [loading, setLoading] = useState(false);

  const handleSeedData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('seed-student-data');
      
      if (error) {
        throw error;
      }

      toast.success(`Successfully seeded ${data.usersCreated} users and ${data.textbooksCreated} textbooks!`);
    } catch (error) {
      console.error('Error seeding data:', error);
      toast.error('Failed to seed data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCredentials = () => {
    const link = document.createElement('a');
    link.href = '/student-credentials.csv';
    link.download = 'student-credentials.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Downloaded credentials file!');
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="container max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Database Seeding</CardTitle>
            <CardDescription>
              Populate the database with test student accounts and sample textbooks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">Step 1: Seed Database</h3>
              <p className="text-sm text-muted-foreground">
                This will create 99 student accounts and add sample textbooks for every 3rd student.
              </p>
              <Button 
                onClick={handleSeedData} 
                disabled={loading}
                className="w-full"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? 'Seeding Database...' : 'Seed Database'}
              </Button>
            </div>

            <div className="border-t pt-4 space-y-2">
              <h3 className="font-semibold">Step 2: Download Credentials</h3>
              <p className="text-sm text-muted-foreground">
                Download a CSV file containing all student emails and passwords (Password: Student ID)
              </p>
              <Button 
                onClick={handleDownloadCredentials}
                variant="outline"
                className="w-full"
              >
                Download Credentials CSV
              </Button>
            </div>

            <div className="bg-muted p-4 rounded-lg mt-4">
              <h4 className="font-semibold mb-2">Sample Accounts:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• SimoneBrown@school.com</li>
                <li>• JamesBrown@school.com</li>
                <li>• MiaBlack@school.com</li>
                <li>• JosephineJones@school.com</li>
              </ul>
              <p className="text-sm mt-2 font-medium">All passwords: Student ID (e.g., 11110)</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SeedData;
