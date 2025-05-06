import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useEffect } from "react";
import { useUser } from "@/contexts/UserContext";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

import { SiEthereum, SiSolana } from "react-icons/si";
import Web3Button from "@/components/crypto/Web3Button";
import SolanaButton from "@/components/crypto/SolanaButton";
import BaseButton from "@/components/crypto/BaseButton";

// Login form schema
const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Registration form schema
const registrationSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// Type definitions
type LoginFormValues = z.infer<typeof loginSchema>;
type RegistrationFormValues = z.infer<typeof registrationSchema>;

export default function Login() {
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const { user, isLoading } = useUser();
  
  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (user && !isLoading) {
      console.log('User already logged in, redirecting to dashboard');
      setLocation('/dashboard');
    }
  }, [user, isLoading, setLocation]);

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onLoginSubmit = async (values: LoginFormValues) => {
    try {
      console.log('Logging in with:', values);
      
      // The apiRequest function already handles JSON stringification,
      // so we pass the object directly
      const response = await apiRequest("/api/auth/login", {
        method: "POST",
        data: values,
      });

      if (response) {
        // Invalidate the auth query to force a refresh
        queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
        
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
        
        // Check if there's a saved route to redirect to
        const lastRoute = localStorage.getItem('lastRoute');
        if (lastRoute) {
          localStorage.removeItem('lastRoute'); // Clear it after use
          setLocation(lastRoute);
        } else {
          setLocation("/dashboard");
        }
      }
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Invalid username or password",
        variant: "destructive",
      });
      console.error("Login error:", error);
    }
  };

  // Function for navigating to the register page
  const goToRegister = () => {
    setLocation("/register");
  };

  const handleWalletConnect = (walletType: string) => {
    toast({
      title: `${walletType} connection attempted`,
      description: "Wallet integration coming soon!",
    });
    
    // For demo purposes, log in automatically
    setTimeout(() => {
      // Invalidate the auth query to force a refresh
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      
      toast({
        title: "Demo mode",
        description: "Logged in as demo user",
      });
      
      // Check for saved route
      const lastRoute = localStorage.getItem('lastRoute');
      if (lastRoute) {
        localStorage.removeItem('lastRoute'); // Clear it after use
        setLocation(lastRoute);
      } else {
        setLocation("/dashboard");
      }
    }, 1500);
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
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>Enter your credentials to access your account</CardDescription>
          </CardHeader>
          
          <CardContent>
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" className="w-full" disabled={loginForm.formState.isSubmitting}>
                  {loginForm.formState.isSubmitting ? "Logging in..." : "Log in"}
                </Button>
                
                <div className="text-center mt-2">
                  <p className="text-sm text-muted-foreground">
                    Don't have an account?{" "}
                    <button 
                      type="button"
                      onClick={goToRegister} 
                      className="text-primary hover:underline font-medium"
                    >
                      Register here
                    </button>
                  </p>
                </div>
              </form>
            </Form>
            
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-background px-2 text-sm text-muted-foreground">or continue with</span>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <Web3Button 
                onConnect={(address) => {
                  console.log("Ethereum wallet connected:", address);
                  // Invalidate the auth query to force a refresh
                  queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
                  
                  // Check for saved route
                  const lastRoute = localStorage.getItem('lastRoute');
                  if (lastRoute) {
                    localStorage.removeItem('lastRoute'); // Clear it after use
                    setLocation(lastRoute);
                  } else {
                    setLocation("/dashboard");
                  }
                }}
                onError={(error) => {
                  console.error("Ethereum connection error:", error);
                  toast({
                    title: "Connection failed",
                    description: error.message,
                    variant: "destructive",
                  });
                }}
              />
              
              <SolanaButton 
                onConnect={(address) => {
                  console.log("Solana wallet connected:", address);
                  // Invalidate the auth query to force a refresh
                  queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
                  
                  // Check for saved route
                  const lastRoute = localStorage.getItem('lastRoute');
                  if (lastRoute) {
                    localStorage.removeItem('lastRoute'); // Clear it after use
                    setLocation(lastRoute);
                  } else {
                    setLocation("/dashboard");
                  }
                }}
                onError={(error) => {
                  console.error("Solana connection error:", error);
                  toast({
                    title: "Connection failed",
                    description: error.message,
                    variant: "destructive",
                  });
                }}
              />
              
              <BaseButton 
                onConnect={(address) => {
                  console.log("Base wallet connected:", address);
                  // Invalidate the auth query to force a refresh
                  queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
                  
                  // Check for saved route
                  const lastRoute = localStorage.getItem('lastRoute');
                  if (lastRoute) {
                    localStorage.removeItem('lastRoute'); // Clear it after use
                    setLocation(lastRoute);
                  } else {
                    setLocation("/dashboard");
                  }
                }}
                onError={(error) => {
                  console.error("Base connection error:", error);
                  toast({
                    title: "Connection failed",
                    description: error.message,
                    variant: "destructive",
                  });
                }}
              />
            </div>
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