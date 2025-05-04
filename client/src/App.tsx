import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Portfolio from "@/pages/portfolio";
import PortfolioDetail from "@/pages/portfolio-detail";
import TokenDetail from "@/pages/token-detail";
import Transactions from "@/pages/transactions";
import Markets from "@/pages/markets";
import Settings from "@/pages/settings";
import TaxReport from "@/pages/tax-report";
import BudgetPlanner from "@/pages/budget-planner";
import LearningPage from "@/pages/learning";
import QuizPage from "@/pages/learning/quiz";
import GlossaryPage from "@/pages/learning/glossary";
import Alerts from "@/pages/alerts";
import Analytics from "@/pages/analytics";
import Achievements from "@/pages/achievements";
import AppLayout from "@/components/layout/AppLayout";
import { TutorialProvider } from "@/contexts/TutorialContext";
import { Tutorial, TutorialButton } from "@/components/tutorial";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/portfolio" component={Portfolio} />
      <Route path="/portfolio/:id" component={PortfolioDetail} />
      <Route path="/token/:portfolioTokenId" component={TokenDetail} />
      <Route path="/transactions" component={Transactions} />
      <Route path="/markets" component={Markets} />
      <Route path="/settings" component={Settings} />
      <Route path="/tax-report" component={TaxReport} />
      <Route path="/budget-planner" component={BudgetPlanner} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/learning" component={LearningPage} />
      <Route path="/learning/module/:id">
        {params => {
          // Import directly to avoid dynamic import issues
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
      <Route path="/learning/quiz/:id">
        {params => <QuizPage params={params} />}
      </Route>
      <Route path="/learning/glossary" component={GlossaryPage} />
      <Route path="/alerts" component={Alerts} />
      <Route path="/achievements" component={Achievements} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TutorialProvider>
        <TooltipProvider>
          <Toaster />
          <AppLayout>
            <Router />
          </AppLayout>
          <Tutorial />
          <TutorialButton />
        </TooltipProvider>
      </TutorialProvider>
    </QueryClientProvider>
  );
}

export default App;
