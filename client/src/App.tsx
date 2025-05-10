import React from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Portfolio from "@/pages/portfolio";
import PortfolioDetail from "@/pages/portfolio-detail";
import TokenDetailWithCryptoConceptsProvider from "@/pages/token-detail";
import Transactions from "@/pages/transactions";
import Markets from "@/pages/markets";
import Settings from "@/pages/settings";
import Profile from "@/pages/profile";
import TaxReport from "@/pages/tax-report";
import BudgetPlanner from "@/pages/budget-planner";
import LearningPage from "@/pages/learning";
import QuizPage from "@/pages/learning/quiz";
import GlossaryPage from "@/pages/learning/glossary";
import CryptoConceptsPage from "@/pages/learning/crypto-concepts";
import Alerts from "@/pages/alerts";
import Analytics from "@/pages/analytics";
import Achievements from "@/pages/achievements";
import TokenManagement from "@/pages/admin/token-management";
import UsersManagementPage from "@/pages/admin/users-management";
import AdminDashboard from "@/pages/admin/dashboard";
import LearningModulesManagement from "@/pages/admin/learning-modules";
import AlertsManagement from "@/pages/admin/alerts";
import AchievementsManagement from "@/pages/admin/achievements";
import WalletsManagement from "@/pages/admin/wallets";
import PortfoliosManagement from "@/pages/admin/portfolios";
import TransactionsManagement from "@/pages/admin/transactions";
import MarketDataManagement from "@/pages/admin/market-data";
import Login from "@/pages/login";
import Register from "@/pages/register";
import AppLayout from "@/components/layout/AppLayout";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { TutorialProvider } from "@/contexts/TutorialContext";
import { CryptoConceptsProvider } from "@/contexts/CryptoConceptsContext";
import { useAuth } from "@/hooks/use-auth";
import { AuthProvider } from "@/hooks/use-auth";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { Tutorial, TutorialButton } from "@/components/tutorial";
import CryptoConceptPopup from "@/components/tutorial/CryptoConceptPopup";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";

function Router() {
  return (
    <Switch>
      {/* Public routes for authentication */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      {/* Protected routes that require authentication */}
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      <ProtectedRoute path="/portfolio" component={Portfolio} />
      <ProtectedRoute path="/portfolio/:id" component={PortfolioDetail} />
      <ProtectedRoute path="/token/:portfolioTokenId" component={TokenDetailWithCryptoConceptsProvider} />
      <ProtectedRoute path="/transactions" component={Transactions} />
      <ProtectedRoute path="/markets" component={Markets} />
      <ProtectedRoute path="/settings" component={Settings} />
      {/* Redirect /profile to /settings */}
      <Route path="/profile">
        {() => {
          const [, setLocation] = useLocation();
          React.useEffect(() => {
            setLocation('/settings');
          }, [setLocation]);
          return null;
        }}
      </Route>
      <ProtectedRoute path="/tax-report" component={TaxReport} />
      <ProtectedRoute path="/budget-planner" component={BudgetPlanner} />
      <ProtectedRoute path="/analytics" component={Analytics} />
      <ProtectedRoute path="/learning" component={LearningPage} />
      
      {/* Protected route with dynamic parameters using render prop pattern */}
      <Route path="/learning/module/:id">
        {params => {
          // First check auth through our protected route logic
          const { user, isLoading } = useAuth();
          const [, setLocation] = useLocation();
          
          if (isLoading) {
            return (
              <div className="p-8 flex justify-center items-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            );
          }
          
          if (!user) {
            setLocation('/login');
            return null;
          }
          
          // User is authenticated, load the module detail
          const ModuleDetail = React.lazy(() => import("@/pages/learning/module/[id].tsx"));
          return (
            <React.Suspense fallback={<div className="p-8 flex justify-center items-center min-h-[50vh]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>}>
              <ModuleDetail id={params.id} />
            </React.Suspense>
          );
        }}
      </Route>
      
      {/* Protected route with dynamic parameters */}
      <Route path="/learning/quiz/:id">
        {params => {
          // First check auth
          const { user, isLoading } = useAuth();
          const [, setLocation] = useLocation();
          
          if (isLoading) {
            return (
              <div className="p-8 flex justify-center items-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            );
          }
          
          if (!user) {
            setLocation('/login');
            return null;
          }
          
          // User is authenticated, render quiz page
          return <QuizPage params={params} />;
        }}
      </Route>
      
      <ProtectedRoute path="/learning/glossary" component={GlossaryPage} />
      <ProtectedRoute path="/learning/crypto-concepts" component={CryptoConceptsPage} />
      <ProtectedRoute path="/alerts" component={Alerts} />
      <ProtectedRoute path="/achievements" component={Achievements} />
      
      {/* Admin routes */}
      <AdminRoute path="/admin" component={() => (
        <AdminLayout>
          <AdminDashboard />
        </AdminLayout>
      )} />
      <AdminRoute path="/admin/dashboard" component={() => (
        <AdminLayout>
          <AdminDashboard />
        </AdminLayout>
      )} />
      <AdminRoute path="/admin/token-management" component={() => (
        <AdminLayout>
          <TokenManagement />
        </AdminLayout>
      )} />
      <AdminRoute path="/admin/tokens" component={() => (
        <AdminLayout>
          <TokenManagement />
        </AdminLayout>
      )} />
      <AdminRoute path="/admin/users-management" component={() => (
        <AdminLayout>
          <UsersManagementPage />
        </AdminLayout>
      )} />
      <AdminRoute path="/admin/users" component={() => (
        <AdminLayout>
          <UsersManagementPage />
        </AdminLayout>
      )} />
      <AdminRoute path="/admin/learning-modules" component={() => (
        <AdminLayout>
          <LearningModulesManagement />
        </AdminLayout>
      )} />
      <AdminRoute path="/admin/alerts" component={() => (
        <AdminLayout>
          <AlertsManagement />
        </AdminLayout>
      )} />
      <AdminRoute path="/admin/achievements" component={() => (
        <AdminLayout>
          <AchievementsManagement />
        </AdminLayout>
      )} />
      <AdminRoute path="/admin/wallets" component={() => (
        <AdminLayout>
          <WalletsManagement />
        </AdminLayout>
      )} />
      <AdminRoute path="/admin/portfolios" component={() => (
        <AdminLayout>
          <PortfoliosManagement />
        </AdminLayout>
      )} />
      <AdminRoute path="/admin/transactions" component={() => (
        <AdminLayout>
          <TransactionsManagement />
        </AdminLayout>
      )} />
      <AdminRoute path="/admin/market-data" component={() => (
        <AdminLayout>
          <MarketDataManagement />
        </AdminLayout>
      )} />
      
      {/* Fallback route */}
      <Route path="*" component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  const isAuthPage = location === '/login' || location === '/register';
  const isAdminPage = location.startsWith('/admin');
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TutorialProvider>
          <CryptoConceptsProvider>
            <TooltipProvider>
              <Toaster />
              {isAuthPage ? (
                // Auth pages (login/register) with no sidebar
                <div className="min-h-screen bg-background flex flex-col">
                  <Router />
                </div>
              ) : isAdminPage ? (
                // Admin pages have their own layout with AdminSidebar
                // The AdminLayout is applied directly in each admin page component
                <div className="min-h-screen bg-background">
                  <Router />
                </div>
              ) : (
                // Regular user pages use AppLayout with normal sidebar
                <AppLayout>
                  <Router />
                </AppLayout>
              )}
              
              {/* Only show tutorial components on regular user pages */}
              {!isAuthPage && !isAdminPage && (
                <>
                  <Tutorial />
                  <TutorialButton />
                  <CryptoConceptPopup />
                </>
              )}
            </TooltipProvider>
          </CryptoConceptsProvider>
        </TutorialProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
