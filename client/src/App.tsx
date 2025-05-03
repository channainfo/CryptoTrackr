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
import Alerts from "@/pages/alerts";
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
      <Route path="/learning" component={LearningPage} />
      <Route path="/learning/quiz/:id" component={QuizPage} />
      <Route path="/alerts" component={Alerts} />
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
