import { useState } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

import { SiEthereum, SiSolana } from "react-icons/si";

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
  const [activeTab, setActiveTab] = useState<string>("login");
  const { toast } = useToast();
  const navigate = useNavigate();

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Registration form
  const registerForm = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onLoginSubmit = async (values: LoginFormValues) => {
    try {
      const response = await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(values),
      });

      if (response) {
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
        navigate("/dashboard");
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

  const onRegisterSubmit = async (values: RegistrationFormValues) => {
    try {
      const { confirmPassword, ...userData } = values;
      const response = await apiRequest("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(userData),
      });

      if (response) {
        toast({
          title: "Registration successful",
          description: "Your account has been created. You can now log in.",
        });
        setActiveTab("login");
        loginForm.reset({
          username: values.username,
          password: "",
        });
      }
    } catch (error) {
      toast({
        title: "Registration failed",
        description: "Username may already be taken",
        variant: "destructive",
      });
      console.error("Registration error:", error);
    }
  };

  const handleWalletConnect = (walletType: string) => {
    toast({
      title: `${walletType} connection attempted`,
      description: "Wallet integration coming soon!",
    });
    
    // For demo purposes, log in automatically
    setTimeout(() => {
      toast({
        title: "Demo mode",
        description: "Logged in as demo user",
      });
      navigate("/dashboard");
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
          <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
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
                  <Button 
                    variant="outline" 
                    onClick={() => handleWalletConnect("Ethereum")}
                    className="flex items-center justify-center gap-2"
                  >
                    <SiEthereum className="h-5 w-5" />
                    <span className="sr-only md:not-sr-only md:text-sm">Ethereum</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => handleWalletConnect("Solana")}
                    className="flex items-center justify-center gap-2"
                  >
                    <SiSolana className="h-5 w-5" />
                    <span className="sr-only md:not-sr-only md:text-sm">Solana</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => handleWalletConnect("Base")}
                    className="flex items-center justify-center gap-2"
                  >
                    <SiBase className="h-5 w-5" />
                    <span className="sr-only md:not-sr-only md:text-sm">Base</span>
                  </Button>
                </div>
              </CardContent>
            </TabsContent>
            
            <TabsContent value="register">
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
                  </form>
                </Form>
              </CardContent>
            </TabsContent>
          </Tabs>
          
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