import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { LucideAlertCircle, LucideLogIn, LucideUserPlus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { ethers } from "ethers";
import { Web3Button } from "@/components/crypto/Web3Button";
import { SolanaButton } from "@/components/crypto/SolanaButton";
import { BaseButton } from "@/components/crypto/BaseButton";

// Login form schema
const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Registration form schema
const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("login");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Handle login submission
  const onLoginSubmit = async (values: LoginFormValues) => {
    try {
      setError(null);
      const response = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username: values.username,
          password: values.password,
        }),
      });

      toast({
        title: "Login Successful",
        description: "Welcome back to Trailer!",
      });

      // Invalidate queries to refetch data with new auth
      queryClient.invalidateQueries();
      setLocation("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      setError("Invalid username or password. Please try again.");
    }
  };

  // Handle registration submission
  const onRegisterSubmit = async (values: RegisterFormValues) => {
    try {
      setError(null);
      const response = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          username: values.username,
          password: values.password,
        }),
      });

      toast({
        title: "Registration Successful",
        description: "Your account has been created. You can now login.",
      });

      // Switch to login tab after successful registration
      setActiveTab("login");
      loginForm.setValue("username", values.username);
    } catch (error) {
      console.error("Registration error:", error);
      setError("Username may already be taken. Please try a different username.");
    }
  };

  // Handle Ethereum wallet connection
  const connectEthereumWallet = async () => {
    try {
      // Check if MetaMask is installed
      if (typeof window !== 'undefined' && 'ethereum' in window) {
        // Use any to handle ethereum window object
        const ethereum = (window as any).ethereum;
        
        // Request account access
        const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
        const address = accounts[0];
        
        // Sign message to verify ownership
        // Use BrowserProvider which is the replacement for Web3Provider in ethers v6
        const provider = new ethers.BrowserProvider(ethereum);
        const signer = await provider.getSigner();
        const message = `Login to Trailer with address: ${address}`;
        const signature = await signer.signMessage(message);
        
        // Send to backend for verification
        await loginWithWallet('ethereum', address, signature);
      } else {
        toast({
          title: "Wallet Not Found",
          description: "Please install MetaMask to use this feature.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Ethereum wallet connection error:", error);
      setError("Failed to connect Ethereum wallet. Please try again.");
    }
  };

  // Handle wallet login
  const loginWithWallet = async (provider: string, walletAddress: string, signature?: string) => {
    try {
      const response = await apiRequest('/api/auth/wallet-login', {
        method: 'POST',
        body: JSON.stringify({
          provider,
          walletAddress,
          signature
        }),
      });

      toast({
        title: "Wallet Login Successful",
        description: `You're now logged in with your ${provider} wallet.`,
      });

      // Invalidate queries to refetch data with new auth
      queryClient.invalidateQueries();
      setLocation("/dashboard");
    } catch (error) {
      console.error("Wallet login error:", error);
      setError(`Failed to login with ${provider} wallet. Please try again.`);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-secondary/20 p-4 md:p-8">
      <Card className="mx-auto w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome to Trailer</CardTitle>
          <CardDescription>
            Your ultimate crypto portfolio management platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <LucideAlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
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
                          <Input type="password" placeholder="Enter your password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full" disabled={loginForm.formState.isSubmitting}>
                    <LucideLogIn className="mr-2 h-4 w-4" />
                    Log in
                  </Button>
                </form>
              </Form>
              
              <div className="my-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Web3Button provider="ethereum" onConnect={connectEthereumWallet} />
                <BaseButton onConnect={() => loginWithWallet('base', '0xDummyAddress')} />
                <SolanaButton onConnect={() => loginWithWallet('solana', '0xDummyAddress')} />
              </div>
            </TabsContent>

            <TabsContent value="register">
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <LucideAlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
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
                    <LucideUserPlus className="mr-2 h-4 w-4" />
                    Register
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex flex-col items-center justify-center">
          <p className="text-sm text-muted-foreground">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}