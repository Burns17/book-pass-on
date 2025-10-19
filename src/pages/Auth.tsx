import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { BookOpen } from "lucide-react";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const navigate = useNavigate();

  const handleVerifyStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Find school by email domain
      const emailDomain = email.split('@')[1];
      const { data: school } = await supabase
        .from('schools')
        .select('id')
        .eq('domain', emailDomain)
        .maybeSingle();

      if (!school) {
        toast.error(`Email domain @${emailDomain} is not registered. Please use your official school email.`);
        setLoading(false);
        return;
      }

      // Verify student in registry
      const { data: student, error } = await supabase
        .from('student_registry')
        .select('*')
        .eq('student_id_num', studentId)
        .eq('student_email_address', email)
        .eq('school_id', school.id)
        .eq('is_active', true)
        .maybeSingle();

      if (error || !student) {
        toast.error("We couldn't verify your Student ID and email. Please contact your school admin.");
        setLoading(false);
        return;
      }

      setFirstName(student.first_name);
      setLastName(student.last_name);
      setVerified(true);
      toast.success("Student verified! Please create your password.");
    } catch (error: any) {
      toast.error(error.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });
      if (error) throw error;
      toast.success("Password reset email sent! Check your inbox.");
      setShowForgotPassword(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Signed in successfully!");
        navigate("/dashboard");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
            },
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });
        if (error) throw error;
        toast.success("Account created! You can now sign in.");
        setIsLogin(true);
        setVerified(false);
        setStudentId("");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md shadow-[var(--shadow-card)]">
        <CardHeader className="space-y-3 text-center">
          <div className="flex justify-center">
            <div className="rounded-full bg-gradient-to-br from-primary to-secondary p-3">
              <BookOpen className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Pass It On</CardTitle>
          <CardDescription>
            {isLogin ? "Sign in to your account" : "Create your student account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showForgotPassword ? (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg text-sm">
                <p className="font-semibold mb-2">Reset Your Password</p>
                <p className="text-muted-foreground">Enter your email address and we'll send you a password reset link.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reset-email">School Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="student@school.com"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
              <div className="mt-4 text-center text-sm">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="text-primary hover:underline"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          ) : !isLogin && !verified ? (
            <form onSubmit={handleVerifyStudent} className="space-y-4">
              <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg text-sm">
                <p className="font-semibold text-lg mb-2">Step 1 of 2: Verify Student Eligibility</p>
                <p className="text-muted-foreground">Enter your Student ID and school email to verify you're registered with your school.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="studentId">Student ID Number</Label>
                <Input
                  id="studentId"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  required
                  placeholder="Enter your student ID"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Student Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="student@school.com"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Verifying..." : "Verify Eligibility"}
              </Button>
              <div className="mt-4 text-center text-sm">
                <button
                  type="button"
                  onClick={() => setIsLogin(true)}
                  className="text-primary hover:underline"
                >
                  Already have an account? Sign in
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleAuth} className="space-y-4">
              {!isLogin && verified && (
                <>
                  <div className="bg-green-50 dark:bg-green-950 border-2 border-green-500 dark:border-green-600 p-4 rounded-lg">
                    <p className="font-semibold text-lg text-green-900 dark:text-green-100 mb-2">✓ Step 1 Complete - Student Verified!</p>
                    <p className="text-green-700 dark:text-green-300 mb-3">
                      {firstName} {lastName} - {email}
                    </p>
                  </div>
                  <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg">
                    <p className="font-semibold text-lg mb-1">Step 2 of 2: Create Your Password</p>
                    <p className="text-sm text-muted-foreground">Choose a secure password for your account (minimum 6 characters).</p>
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">School Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="student@school.com"
                  disabled={!isLogin && verified}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-base font-semibold">
                  {!isLogin && verified ? "Create Your Password *" : "Password"}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder={!isLogin && verified ? "Create a password (min. 6 characters)" : "Enter your password"}
                  minLength={6}
                  className="h-12 text-base"
                />
                {!isLogin && verified && (
                  <p className="text-xs text-muted-foreground">Password must be at least 6 characters long</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Loading..." : isLogin ? "Sign In" : "Create Account"}
              </Button>
              {isLogin && (
                <div className="text-center text-sm">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
              )}
              <div className="mt-4 text-center text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setVerified(false);
                    setStudentId("");
                  }}
                  className="text-primary hover:underline"
                >
                  {isLogin ? "Need an account? Sign up" : "Already have an account? Sign in"}
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;