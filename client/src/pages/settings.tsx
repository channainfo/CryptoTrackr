import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ThemeToggle from "@/components/ThemeToggle";
import { useOnboarding } from "@/hooks/use-onboarding";
import { useToast } from "@/hooks/use-toast";
import { ConnectedWallets } from "@/components/wallet/ConnectedWallets";
import { LinkWalletCard } from "@/components/wallet/LinkWalletCard";
import { UserInformation } from "@/components/account/UserInformation";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

const Settings = () => {
  const { toast } = useToast();
  const { user, isLoading } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    username: "",
    email: user?.email || "",
    name: "", // Name is not in the user schema yet
    phone: "", // Phone is not in the user schema yet
  });

  // Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Update form when user data loads
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || "",
        email: user.email || "",
        name: "", // Name is not in the user schema yet
        phone: "", // Phone is not in the user schema yet
      });
    }
  }, [user]);
  
  // Handle profile update
  const handleProfileUpdate = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      // In a real app, you would make an API call here
      // const response = await apiRequest('/api/auth/update-profile', {
      //   method: 'POST',
      //   data: formData
      // });
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Profile Updated",
        description: "Your profile information has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "There was a problem updating your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle password update
  const handlePasswordUpdate = async () => {
    if (!passwordData.currentPassword) {
      toast({
        title: "Current Password Required",
        description: "Please enter your current password",
        variant: "destructive",
      });
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "New password and confirmation must match",
        variant: "destructive",
      });
      return;
    }
    
    if (passwordData.newPassword.length < 8) {
      toast({
        title: "Password Too Short",
        description: "New password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }
    
    setIsSaving(true);
    try {
      // In a real app, you would make an API call here
      // const response = await apiRequest('/api/auth/change-password', {
      //   method: 'POST',
      //   data: passwordData
      // });
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reset password fields
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      
      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully.",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "There was a problem updating your password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Dashboard tour
  const dashboardTour = useOnboarding("dashboard");
  // Portfolio tour
  const portfolioTour = useOnboarding("portfolio");
  // Learning tour
  const learningTour = useOnboarding("learning");
  // Transactions tour
  const transactionsTour = useOnboarding("transactions");
  // Markets tour
  const marketsTour = useOnboarding("markets");
  // Alerts tour
  const alertsTour = useOnboarding("alerts");

  const resetAllTours = () => {
    dashboardTour.resetAllTours();
    toast({
      title: "Tours Reset",
      description:
        "All feature tours have been reset. You'll see them on your next visit to each page.",
    });
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-20 md:pb-8">
      {/* Page Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-neutral-mid mt-1">
          Manage your account and application preferences
        </p>
      </div>

      <Tabs defaultValue="account" className="space-y-6">
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="wallets">Wallets</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="tours">Feature Tours</TabsTrigger>
        </TabsList>

        <TabsContent value="account">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>
                  Update your account details and personal information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoading ? (
                  <div className="h-40 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input 
                          id="name" 
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          placeholder="Enter your full name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          placeholder="Enter your email address"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input 
                          id="username" 
                          value={formData.username}
                          onChange={(e) => setFormData({...formData, username: e.target.value})}
                          disabled={!!user} // Disable if user exists (username can't be changed)
                          placeholder="Enter your username"
                        />
                        {user && (
                          <p className="text-xs text-muted-foreground">Username cannot be changed</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input 
                          id="phone" 
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          placeholder="Enter your phone number"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Change Password</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input 
                        id="current-password" 
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input 
                        id="new-password" 
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">
                        Confirm New Password
                      </Label>
                      <Input 
                        id="confirm-password" 
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between space-x-2">
                  <Button 
                    variant="outline"
                    onClick={handlePasswordUpdate}
                    disabled={isSaving || !passwordData.currentPassword}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating Password...
                      </>
                    ) : (
                      'Update Password'
                    )}
                  </Button>
                  
                  <Button 
                    onClick={handleProfileUpdate}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving Changes...
                      </>
                    ) : (
                      'Save Profile Changes'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* User Support Information Card */}
            <UserInformation />
          </div>
        </TabsContent>

        <TabsContent value="wallets">
          <div className="space-y-6">
            <ConnectedWallets />
            
            {/* Add the ability to link new wallets */}
            <LinkWalletCard />
          </div>
        </TabsContent>

        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Application Preferences</CardTitle>
              <CardDescription>
                Customize how the application works for you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-medium">Dark Mode</h3>
                    <p className="text-sm text-neutral-mid">
                      Switch between light and dark themes
                    </p>
                  </div>
                  <ThemeToggle />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-medium">Currency</h3>
                    <p className="text-sm text-neutral-mid">
                      Choose your preferred currency
                    </p>
                  </div>
                  <div className="w-32">
                    <select className="w-full rounded-md border border-gray-300 dark:border-gray-700 p-2 bg-white dark:bg-zinc-800 text-black dark:text-white">
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="JPY">JPY (¥)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-medium">Refresh Rate</h3>
                    <p className="text-sm text-neutral-mid">
                      How often to update prices
                    </p>
                  </div>
                  <div className="w-32">
                    <select className="w-full rounded-md border border-gray-300 dark:border-gray-700 p-2 bg-white dark:bg-zinc-800 text-black dark:text-white">
                      <option value="30">30 seconds</option>
                      <option value="60">1 minute</option>
                      <option value="300">5 minutes</option>
                      <option value="manual">Manual</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline">Reset to Default</Button>
                <Button>Save Preferences</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure when and how you receive alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Email Notifications</h3>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Price Alerts</p>
                      <p className="text-xs text-neutral-mid">
                        Receive alerts when prices change significantly
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Portfolio Summary</p>
                      <p className="text-xs text-neutral-mid">
                        Daily or weekly summary of your portfolio
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">News Digests</p>
                      <p className="text-xs text-neutral-mid">
                        News related to cryptocurrencies you own
                      </p>
                    </div>
                    <Switch />
                  </div>
                </div>

                <Separator />

                <h3 className="text-lg font-medium">Push Notifications</h3>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        Enable Push Notifications
                      </p>
                      <p className="text-xs text-neutral-mid">
                        Receive notifications on your device
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline">Cancel</Button>
                <Button>Save Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tours">
          <Card>
            <CardHeader>
              <CardTitle>Feature Tours Management</CardTitle>
              <CardDescription>
                Reset or restart guided tours for different sections of the
                application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">
                  Individual Feature Tours
                </h3>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Dashboard Tour</p>
                      <p className="text-xs text-neutral-mid">
                        Learn the basics of your portfolio dashboard
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={dashboardTour.resetTour}
                      disabled={!dashboardTour.hasTourBeenCompleted}
                    >
                      Reset Tour
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Portfolio Tour</p>
                      <p className="text-xs text-neutral-mid">
                        Learn about portfolio details and management
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={portfolioTour.resetTour}
                      disabled={!portfolioTour.hasTourBeenCompleted}
                    >
                      Reset Tour
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        Learning Center Tour
                      </p>
                      <p className="text-xs text-neutral-mid">
                        Learn how to use the educational resources
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={learningTour.resetTour}
                      disabled={!learningTour.hasTourBeenCompleted}
                    >
                      Reset Tour
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Transactions Tour</p>
                      <p className="text-xs text-neutral-mid">
                        Learn about transaction management
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={transactionsTour.resetTour}
                      disabled={!transactionsTour.hasTourBeenCompleted}
                    >
                      Reset Tour
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Markets Tour</p>
                      <p className="text-xs text-neutral-mid">
                        Learn how to use the market data section
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={marketsTour.resetTour}
                      disabled={!marketsTour.hasTourBeenCompleted}
                    >
                      Reset Tour
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Alerts Tour</p>
                      <p className="text-xs text-neutral-mid">
                        Learn how to set up and manage price alerts
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={alertsTour.resetTour}
                      disabled={!alertsTour.hasTourBeenCompleted}
                    >
                      Reset Tour
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-medium">Reset All Tours</h3>
                    <p className="text-sm text-neutral-mid">
                      Reset all feature tours to see them again
                    </p>
                  </div>
                  <Button onClick={resetAllTours}>Reset All Tours</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;