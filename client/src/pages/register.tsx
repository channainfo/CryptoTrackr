import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

// Registration form schema
const registrationSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// Type definition
type RegistrationFormValues = z.infer<typeof registrationSchema>;

export default function Register() {
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const { user, isLoading, registerMutation } = useAuth();
  
  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (user && !isLoading) {
      console.log('User already logged in, redirecting to dashboard');
      setLocation('/dashboard');
    }
  }, [user, isLoading, setLocation]);

  // Registration form
  const registerForm = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onRegisterSubmit = async (values: RegistrationFormValues) => {
    try {
      const { confirmPassword, ...userData } = values;
      console.log('Registering with data:', userData);
      
      // Use the registerMutation from useAuth hook
      await registerMutation.mutateAsync(userData);
      
      // Registration success is handled by the onSuccess callback in the mutation
      // The toast and redirect are handled there
      
      // Check if there's a saved route to redirect to
      const lastRoute = localStorage.getItem('lastRoute');
      if (lastRoute) {
        localStorage.removeItem('lastRoute'); // Clear it after use
        setLocation(lastRoute);
      } else {
        setLocation("/dashboard");
      }
    } catch (error) {
      // Error handling is done in the mutation's onError callback
      console.error("Registration error:", error);
    }
  };

  // Function for navigating to the login page
  const goToLogin = () => {
    setLocation("/login");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-primary/5 p-4">
      <div className="absolute inset-0 bg-grid-white/10 bg-[size:var(--grid-size)_var(--grid-size)] [--grid-size:100px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black_40%,transparent_100%)]"></div>
      
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent">Trailer</h1>
          <p className="text-lg text-muted-foreground mt-2">Crypto Portfolio Management</p>
        </div>
        
        <Card className="border border-border/40 shadow-lg backdrop-blur-sm bg-background/80">
          <CardHeader>
            <CardTitle>Create an account</CardTitle>
            <CardDescription>Sign up to manage your crypto portfolio</CardDescription>
          </CardHeader>
          
          <CardContent>
            <Form {...registerForm}>
              <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                <FormField
                  control={registerForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Choose a username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={registerForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Create a password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={registerForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Confirm your password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" className="w-full" disabled={registerForm.formState.isSubmitting}>
                  {registerForm.formState.isSubmitting ? "Creating account..." : "Create account"}
                </Button>

                <div className="text-center mt-2">
                  <p className="text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <button 
                      type="button"
                      onClick={goToLogin} 
                      className="text-primary hover:underline font-medium"
                    >
                      Log in here
                    </button>
                  </p>
                </div>
              </form>
            </Form>
          </CardContent>
          
          <CardFooter className="flex justify-center border-t px-6 py-4">
            <p className="text-xs text-muted-foreground">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}