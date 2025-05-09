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
import Login from "@/pages/login";
import Register from "@/pages/register";
import AppLayout from "@/components/layout/AppLayout";
import { TutorialProvider } from "@/contexts/TutorialContext";
import { CryptoConceptsProvider } from "@/contexts/CryptoConceptsContext";
import { useAuth } from "@/hooks/use-auth";
import { AuthProvider } from "@/hooks/use-auth";
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
      <AdminRoute path="/admin/tokens" component={TokenManagement} />
      
      {/* Fallback route */}
      <Route path="*" component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  const isAuthPage = location === '/login' || location === '/register';
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {/* Removed UserProvider as we'll only use AuthProvider */}
        <TutorialProvider>
          <CryptoConceptsProvider>
            <TooltipProvider>
              <Toaster />
              {isAuthPage ? (
                <div className="min-h-screen bg-background flex flex-col">
                  <Router />
                </div>
              ) : (
                <AppLayout>
                  <Router />
                </AppLayout>
              )}
              {!isAuthPage && (
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
