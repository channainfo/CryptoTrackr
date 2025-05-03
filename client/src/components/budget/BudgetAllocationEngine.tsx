import React, { useState } from 'react';
import { 
  Calculator, 
  DollarSign, 
  TrendingUp, 
  ShieldAlert, 
  CreditCard, 
  Wallet, 
  LineChart, 
  Clock, 
  RefreshCw,
  Hourglass,
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

// Types for the budget allocation engine
interface BudgetAllocation {
  category: string;
  percentage: number;
  amount: number;
  description: string;
  icon: React.ReactNode;
}

interface FinancialGoal {
  id: string;
  name: string;
  timeframe: 'short' | 'medium' | 'long';
}

interface BudgetAllocationEngineProps {
  portfolioId?: string;
  marketSentiment?: {
    score: number;
    mood: string;
  };
}

export default function BudgetAllocationEngine({ 
  portfolioId, 
  marketSentiment 
}: BudgetAllocationEngineProps) {
  const { toast } = useToast();
  const [monthlyIncome, setMonthlyIncome] = useState<number>(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState<number>(0);
  const [investmentAmount, setInvestmentAmount] = useState<number>(0);
  const [riskTolerance, setRiskTolerance] = useState<number>(3); // 1-5 scale
  const [financialGoal, setFinancialGoal] = useState<string>('growth');
  const [timeHorizon, setTimeHorizon] = useState<string>('medium');
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [budgetAllocations, setBudgetAllocations] = useState<BudgetAllocation[] | null>(null);
  const [emergencyFundMonths, setEmergencyFundMonths] = useState<number>(6);
  
  // Available funds calculation
  const availableFunds = Math.max(0, monthlyIncome - monthlyExpenses);
  
  // Description for risk tolerance levels
  const getRiskDescription = (level: number): string => {
    switch(level) {
      case 1: return 'Very conservative - Prioritize capital preservation';
      case 2: return 'Conservative - Low risk, stable returns';
      case 3: return 'Moderate - Balanced risk and returns';
      case 4: return 'Growth oriented - Higher risk for better returns';
      case 5: return 'Aggressive - Maximum growth potential with high risk';
      default: return 'Moderate - Balanced risk and returns';
    }
  };
  
  // Financial goal options
  const financialGoals: FinancialGoal[] = [
    { id: 'emergency', name: 'Build Emergency Fund', timeframe: 'short' },
    { id: 'growth', name: 'Long-term Growth', timeframe: 'long' },
    { id: 'passive', name: 'Passive Income', timeframe: 'medium' },
    { id: 'retirement', name: 'Retirement Planning', timeframe: 'long' },
    { id: 'shortterm', name: 'Short-term Gains', timeframe: 'short' },
  ];
  
  // Time horizon options
  const timeHorizons = [
    { id: 'short', name: 'Short (< 1 year)' },
    { id: 'medium', name: 'Medium (1-5 years)' },
    { id: 'long', name: 'Long (5+ years)' },
  ];
  
  // Calculate the recommended emergency fund amount
  const emergencyFundTarget = monthlyExpenses * emergencyFundMonths;
  
  // Calculate recommended budget allocations
  const calculateAllocations = () => {
    setIsCalculating(true);
    
    // Simulate a calculation delay
    setTimeout(() => {
      try {
        // Get market conditions factor (0.7 to 1.3 based on sentiment)
        const marketFactor = marketSentiment 
          ? 0.7 + (marketSentiment.score / 100) * 0.6 
          : 1;
          
        // Risk-based allocation percentages
        const cryptoPercentage = calculateCryptoPercentage();
        
        // Calculate the recommended amount to invest in crypto
        const recommendedInvestment = Math.round(availableFunds * cryptoPercentage * marketFactor);
        setInvestmentAmount(recommendedInvestment);
        
        // Distribution among different categories
        const allocations = generateAllocations(recommendedInvestment);
        setBudgetAllocations(allocations);
      } catch (error) {
        console.error('Error calculating budget allocations:', error);
        toast({
          variant: 'destructive',
          title: 'Calculation Error',
          description: 'There was an error calculating your budget allocations. Please try again.',
        });
      } finally {
        setIsCalculating(false);
      }
    }, 1500);
  };
  
  // Calculate the percentage of available funds to allocate to crypto based on risk profile and goals
  const calculateCryptoPercentage = (): number => {
    // Base percentage based on risk tolerance (5% to 25%)
    let basePercentage = 0.05 + (riskTolerance - 1) * 0.05;
    
    // Adjust based on financial goal
    switch(financialGoal) {
      case 'emergency':
        basePercentage *= 0.5; // Reduce allocation if building emergency fund
        break;
      case 'growth':
        basePercentage *= 1.2; // Increase allocation for long-term growth
        break;
      case 'passive':
        basePercentage *= 1.1; // Slightly increase for passive income
        break;
      case 'retirement':
        basePercentage *= 1.0; // Keep as is for retirement
        break;
      case 'shortterm':
        basePercentage *= 0.8; // Reduce for short-term goals (higher liquidity)
        break;
    }
    
    // Adjust based on time horizon
    switch(timeHorizon) {
      case 'short':
        basePercentage *= 0.7; // Reduce for short-term
        break;
      case 'medium':
        basePercentage *= 1.0; // No change for medium-term
        break;
      case 'long':
        basePercentage *= 1.3; // Increase for long-term
        break;
    }
    
    // Cap the percentage between 5% and 35%
    return Math.min(0.35, Math.max(0.05, basePercentage));
  };
  
  // Generate specific allocations based on the total crypto investment amount
  const generateAllocations = (amount: number): BudgetAllocation[] => {
    if (amount <= 0) return [];
    
    // Determine risk-based allocation distribution
    let stableCoinPercentage, bluechipPercentage, altcoinPercentage, emergencyPercentage;
    
    switch(riskTolerance) {
      case 1: // Very conservative
        stableCoinPercentage = 0.60;
        bluechipPercentage = 0.30;
        altcoinPercentage = 0.05;
        emergencyPercentage = 0.05;
        break;
      case 2: // Conservative
        stableCoinPercentage = 0.45;
        bluechipPercentage = 0.40;
        altcoinPercentage = 0.10;
        emergencyPercentage = 0.05;
        break;
      case 3: // Moderate
        stableCoinPercentage = 0.30;
        bluechipPercentage = 0.45;
        altcoinPercentage = 0.20;
        emergencyPercentage = 0.05;
        break;
      case 4: // Growth
        stableCoinPercentage = 0.15;
        bluechipPercentage = 0.50;
        altcoinPercentage = 0.30;
        emergencyPercentage = 0.05;
        break;
      case 5: // Aggressive
        stableCoinPercentage = 0.05;
        bluechipPercentage = 0.45;
        altcoinPercentage = 0.45;
        emergencyPercentage = 0.05;
        break;
      default: // Default to moderate
        stableCoinPercentage = 0.30;
        bluechipPercentage = 0.45;
        altcoinPercentage = 0.20;
        emergencyPercentage = 0.05;
    }
    
    // Create allocation categories
    return [
      {
        category: 'Stablecoins',
        percentage: stableCoinPercentage * 100,
        amount: Math.round(amount * stableCoinPercentage),
        description: 'Low-risk stable assets like USDC, USDT, DAI',
        icon: <ShieldAlert className="h-4 w-4" />
      },
      {
        category: 'Blue-chip Cryptocurrencies',
        percentage: bluechipPercentage * 100,
        amount: Math.round(amount * bluechipPercentage),
        description: 'Established cryptocurrencies like BTC, ETH',
        icon: <TrendingUp className="h-4 w-4" />
      },
      {
        category: 'Alternative Cryptocurrencies',
        percentage: altcoinPercentage * 100,
        amount: Math.round(amount * altcoinPercentage),
        description: 'Growth-oriented altcoins with higher potential returns',
        icon: <LineChart className="h-4 w-4" />
      },
      {
        category: 'Cash Reserve',
        percentage: emergencyPercentage * 100,
        amount: Math.round(amount * emergencyPercentage),
        description: 'Keep some funds liquid for opportunities or emergencies',
        icon: <Wallet className="h-4 w-4" />
      }
    ];
  };
  
  // Calculate the investable amount after setting aside for emergency fund
  const calculateInvestableAmount = () => {
    const surplus = availableFunds;
    
    // If user doesn't have enough emergency fund yet, allocate more towards it
    const currentEmergencyFund = 0; // This would come from user data in a real app
    const emergencyFundGap = Math.max(0, emergencyFundTarget - currentEmergencyFund);
    
    if (emergencyFundGap > 0) {
      // Allocate at least 50% towards emergency fund if there's a gap
      return Math.max(0, surplus - Math.max(emergencyFundGap * 0.5, surplus * 0.5));
    }
    
    // If emergency fund is sufficient, all surplus can be invested
    return surplus;
  };
  
  // Get recommendations based on market sentiment
  const getMarketRecommendation = (): string => {
    if (!marketSentiment) return 'Market data unavailable. Consider a balanced approach.';
    
    const { score, mood } = marketSentiment;
    
    if (score < 30) {
      return 'Market shows extreme fear. Consider dollar-cost averaging and focusing on blue-chip assets.';
    } else if (score < 45) {
      return 'Market shows fear. Good time for cautious accumulation of quality assets.';
    } else if (score < 55) {
      return 'Market is neutral. Maintain your regular investment schedule.';
    } else if (score < 70) {
      return 'Market shows greed. Consider reducing risk and taking some profits.';
    } else {
      return 'Market shows extreme greed. High risk of correction. Consider moving some funds to stablecoins.';
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Budget Allocation Engine</CardTitle>
            <CardDescription>Optimize your crypto investment strategy</CardDescription>
          </div>
          <Calculator className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Income and Expenses Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="monthly-income">Monthly Income ($)</Label>
            <div className="relative">
              <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="monthly-income"
                type="number"
                min="0"
                className="pl-8"
                placeholder="0"
                value={monthlyIncome || ''}
                onChange={(e) => setMonthlyIncome(Number(e.target.value))}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="monthly-expenses">Monthly Expenses ($)</Label>
            <div className="relative">
              <CreditCard className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="monthly-expenses"
                type="number"
                min="0"
                className="pl-8"
                placeholder="0"
                value={monthlyExpenses || ''}
                onChange={(e) => setMonthlyExpenses(Number(e.target.value))}
              />
            </div>
          </div>
        </div>
        
        {/* Available Funds */}
        <div className="pt-2">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium">Available Monthly Funds</span>
            <span className="font-semibold">${availableFunds.toLocaleString()}</span>
          </div>
          <Progress
            value={availableFunds > 0 ? (availableFunds / monthlyIncome) * 100 : 0}
            className="h-2"
          />
          <p className="text-xs text-muted-foreground mt-1">
            {availableFunds > 0 
              ? `${((availableFunds / monthlyIncome) * 100).toFixed(0)}% of income available for allocation` 
              : 'Enter your income and expenses to calculate available funds'}
          </p>
        </div>
        
        {/* Emergency Fund Target */}
        <div className="pt-2">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium">Emergency Fund Target</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center cursor-help">
                    <span className="font-semibold">${emergencyFundTarget.toLocaleString()}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Your emergency fund should cover {emergencyFundMonths} months of expenses.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Slider
                value={[emergencyFundMonths]}
                min={3}
                max={12}
                step={1}
                onValueChange={(value) => setEmergencyFundMonths(value[0])}
              />
            </div>
            <div className="w-12 text-center text-sm">
              {emergencyFundMonths} mo
            </div>
          </div>
        </div>
        
        {/* Risk Tolerance */}
        <div className="pt-2">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium">Risk Tolerance</span>
            <Badge variant="outline">
              {riskTolerance === 1 ? 'Very Conservative' : 
               riskTolerance === 2 ? 'Conservative' :
               riskTolerance === 3 ? 'Moderate' :
               riskTolerance === 4 ? 'Growth' : 'Aggressive'}
            </Badge>
          </div>
          <Slider
            value={[riskTolerance]}
            min={1}
            max={5}
            step={1}
            onValueChange={(value) => setRiskTolerance(value[0])}
            className="my-4"
          />
          <p className="text-xs text-muted-foreground mt-1">
            {getRiskDescription(riskTolerance)}
          </p>
        </div>
        
        {/* Financial Goal */}
        <div className="space-y-2 pt-2">
          <Label htmlFor="financial-goal">Investment Goal</Label>
          <Select
            value={financialGoal}
            onValueChange={setFinancialGoal}
          >
            <SelectTrigger id="financial-goal">
              <SelectValue placeholder="Select your primary financial goal" />
            </SelectTrigger>
            <SelectContent>
              {financialGoals.map((goal) => (
                <SelectItem key={goal.id} value={goal.id}>
                  {goal.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Time Horizon */}
        <div className="space-y-2 pt-2">
          <Label htmlFor="time-horizon">Investment Timeframe</Label>
          <Select
            value={timeHorizon}
            onValueChange={setTimeHorizon}
          >
            <SelectTrigger id="time-horizon">
              <SelectValue placeholder="Select your investment timeframe" />
            </SelectTrigger>
            <SelectContent>
              {timeHorizons.map((horizon) => (
                <SelectItem key={horizon.id} value={horizon.id}>
                  {horizon.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Market Sentiment */}
        {marketSentiment && (
          <div className="pt-2">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Current Market Recommendation</span>
            </div>
            <p className="text-sm mt-1 p-2 border rounded-md bg-muted/50">
              {getMarketRecommendation()}
            </p>
          </div>
        )}
        
        {/* Calculate Button */}
        <Button 
          onClick={calculateAllocations} 
          className="w-full"
          disabled={isCalculating || monthlyIncome <= 0 || monthlyExpenses <= 0 || availableFunds <= 0}
        >
          {isCalculating ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Calculating Recommendations...
            </>
          ) : (
            <>
              <Calculator className="mr-2 h-4 w-4" />
              Calculate Optimal Allocation
            </>
          )}
        </Button>
        
        {/* Results */}
        {budgetAllocations && budgetAllocations.length > 0 && (
          <div className="mt-4 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Recommended Monthly Crypto Investment</h3>
              <span className="font-bold text-xl">${investmentAmount.toLocaleString()}</span>
            </div>
            
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Suggested Allocation</h4>
              
              {budgetAllocations.map((allocation, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      {allocation.icon}
                      <span>{allocation.category}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{allocation.percentage.toFixed(0)}%</Badge>
                      <span className="font-medium">${allocation.amount.toLocaleString()}</span>
                    </div>
                  </div>
                  <Progress value={allocation.percentage} className="h-1" />
                  <p className="text-xs text-muted-foreground">{allocation.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex flex-col items-start text-xs text-muted-foreground">
        <p>Recommendations are based on your financial profile, goals, and current market conditions.</p>
        <p className="mt-1">Always do your own research before making investment decisions.</p>
      </CardFooter>
    </Card>
  );
}