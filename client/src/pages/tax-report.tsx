import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { ChevronLeft, FileDown, Settings, Filter, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { apiRequest } from '@/lib/queryClient';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';

// Types
interface TaxableTransaction {
  id: string;
  date: string;
  type: 'buy' | 'sell';
  symbol: string;
  amount: number;
  price: number;
  costBasis: number;
  proceeds: number;
  gainLoss: number;
  holdingPeriod: number;
  isLongTerm: boolean;
}

interface TaxSummary {
  taxYear: string;
  totalTransactions: number;
  shortTermGains: number;
  longTermGains: number;
  totalGains: number;
  totalTaxableAmount: number;
  estimatedTax: number;
  costBasis: number;
  proceeds: number;
  byAsset: {
    [symbol: string]: {
      totalGains: number;
      shortTermGains: number;
      longTermGains: number;
      transactions: number;
    }
  }
}

// Tax rates (simplified)
const TAX_BRACKETS = {
  SHORT_TERM: [
    { rate: 0.1, upTo: 10275 },
    { rate: 0.12, upTo: 41775 },
    { rate: 0.22, upTo: 89075 },
    { rate: 0.24, upTo: 170050 },
    { rate: 0.32, upTo: 215950 },
    { rate: 0.35, upTo: 539900 },
    { rate: 0.37, upTo: Infinity }
  ],
  LONG_TERM: [
    { rate: 0, upTo: 41675 },
    { rate: 0.15, upTo: 459750 },
    { rate: 0.20, upTo: Infinity }
  ]
};

export default function TaxReport() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [taxYear, setTaxYear] = useState<string>(new Date().getFullYear().toString());
  const [taxableIncome, setTaxableIncome] = useState<string>("50000");
  const [filingStatus, setFilingStatus] = useState<string>("single");
  const [taxMethod, setTaxMethod] = useState<string>("fifo");
  const [transactions, setTransactions] = useState<TaxableTransaction[]>([]);
  const [taxSummary, setTaxSummary] = useState<TaxSummary | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');

  // Generate available tax years (current year and previous 5 years)
  const currentYear = new Date().getFullYear();
  const availableTaxYears = Array.from({ length: 6 }, (_, i) => (currentYear - i).toString());

  // Calculate tax data
  const calculateTaxData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch transactions for the selected year
      const response = await apiRequest({
        url: `/api/tax/calculate?year=${taxYear}&method=${taxMethod}&income=${taxableIncome}&status=${filingStatus}`,
        method: 'GET'
      });
      
      if (response.transactions && response.summary) {
        setTransactions(response.transactions);
        setTaxSummary(response.summary);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error calculating tax data:', error);
      toast({
        title: 'Error',
        description: 'Failed to calculate tax data. Please try again.',
        variant: 'destructive'
      });
      
      // Generate placeholder data if API not yet implemented
      generatePlaceholderData();
    } finally {
      setIsLoading(false);
    }
  };

  // Generate placeholder data when the API is not available yet
  const generatePlaceholderData = () => {
    // This is temporary until the backend is implemented
    const symbols = ['BTC', 'ETH', 'XRP', 'DOT', 'SOL'];
    const mockTransactions: TaxableTransaction[] = [];
    
    // Generate 10-20 random transactions
    const count = Math.floor(Math.random() * 10) + 10;
    
    for (let i = 0; i < count; i++) {
      const type = Math.random() > 0.5 ? 'buy' : 'sell';
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      const amount = parseFloat((Math.random() * 10).toFixed(4));
      const price = parseFloat((Math.random() * 50000).toFixed(2));
      const costBasis = type === 'buy' ? price * amount : 0;
      const proceeds = type === 'sell' ? price * amount : 0;
      const gainLoss = proceeds - (type === 'sell' ? price * amount * 0.8 : 0); // Simulate some gain/loss
      const holdingPeriod = Math.floor(Math.random() * 500);
      const isLongTerm = holdingPeriod > 365;
      
      mockTransactions.push({
        id: `tx-${i}`,
        date: new Date(parseInt(taxYear), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
        type,
        symbol,
        amount,
        price,
        costBasis,
        proceeds,
        gainLoss,
        holdingPeriod,
        isLongTerm
      });
    }
    
    // Sort by date
    mockTransactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Calculate summary
    const summary: TaxSummary = {
      taxYear,
      totalTransactions: mockTransactions.length,
      shortTermGains: 0,
      longTermGains: 0,
      totalGains: 0,
      totalTaxableAmount: 0,
      estimatedTax: 0,
      costBasis: 0,
      proceeds: 0,
      byAsset: {}
    };
    
    // Initialize asset summaries
    symbols.forEach(symbol => {
      summary.byAsset[symbol] = {
        totalGains: 0,
        shortTermGains: 0,
        longTermGains: 0,
        transactions: 0
      };
    });
    
    // Calculate summary values
    mockTransactions.forEach(tx => {
      if (tx.type === 'sell') {
        if (tx.isLongTerm) {
          summary.longTermGains += tx.gainLoss;
        } else {
          summary.shortTermGains += tx.gainLoss;
        }
        
        if (!summary.byAsset[tx.symbol]) {
          summary.byAsset[tx.symbol] = {
            totalGains: 0,
            shortTermGains: 0,
            longTermGains: 0,
            transactions: 0
          };
        }
        
        summary.byAsset[tx.symbol].totalGains += tx.gainLoss;
        if (tx.isLongTerm) {
          summary.byAsset[tx.symbol].longTermGains += tx.gainLoss;
        } else {
          summary.byAsset[tx.symbol].shortTermGains += tx.gainLoss;
        }
      }
      
      summary.costBasis += tx.costBasis;
      summary.proceeds += tx.proceeds;
      summary.byAsset[tx.symbol].transactions++;
    });
    
    summary.totalGains = summary.shortTermGains + summary.longTermGains;
    
    // Estimate tax (simplified)
    const estimatedShortTermTax = calculateEstimatedTax(summary.shortTermGains, 'SHORT_TERM');
    const estimatedLongTermTax = calculateEstimatedTax(summary.longTermGains, 'LONG_TERM');
    summary.estimatedTax = estimatedShortTermTax + estimatedLongTermTax;
    summary.totalTaxableAmount = summary.totalGains;
    
    setTransactions(mockTransactions);
    setTaxSummary(summary);
  };
  
  // Calculate estimated tax based on bracket
  const calculateEstimatedTax = (income: number, type: 'SHORT_TERM' | 'LONG_TERM'): number => {
    if (income <= 0) return 0;
    
    const brackets = TAX_BRACKETS[type];
    let remainingIncome = income;
    let tax = 0;
    let prevThreshold = 0;
    
    for (const bracket of brackets) {
      const taxableInThisBracket = Math.min(bracket.upTo - prevThreshold, remainingIncome);
      tax += taxableInThisBracket * bracket.rate;
      remainingIncome -= taxableInThisBracket;
      prevThreshold = bracket.upTo;
      
      if (remainingIncome <= 0) break;
    }
    
    return tax;
  };

  // Export tax report as CSV
  const exportTaxReport = () => {
    if (!transactions.length || !taxSummary) return;
    
    setIsExporting(true);
    
    try {
      // Create CSV header and content
      const header = 'Date,Type,Symbol,Amount,Price,Cost Basis,Proceeds,Gain/Loss,Holding Period (Days),Term\n';
      
      const csvContent = transactions.map(tx => {
        const date = new Date(tx.date).toLocaleDateString();
        return `${date},${tx.type},${tx.symbol},${tx.amount},${tx.price.toFixed(2)},${tx.costBasis.toFixed(2)},${tx.proceeds.toFixed(2)},${tx.gainLoss.toFixed(2)},${tx.holdingPeriod},${tx.isLongTerm ? 'Long-Term' : 'Short-Term'}`;
      }).join('\n');
      
      // Create blob and download
      const blob = new Blob([header + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `crypto-tax-report-${taxYear}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'Success',
        description: 'Tax report has been downloaded successfully',
      });
    } catch (error) {
      console.error('Error exporting tax report:', error);
      toast({
        title: 'Error',
        description: 'Failed to export tax report',
        variant: 'destructive'
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Apply settings and recalculate
  const applySettings = () => {
    setIsSettingsOpen(false);
    calculateTaxData();
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // Initial calculation
  useEffect(() => {
    calculateTaxData();
  }, []);

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div className="flex items-center mb-4 md:mb-0">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mr-2" 
            onClick={() => navigate("/dashboard")}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h2 className="text-2xl font-bold">Tax Reporting</h2>
        </div>
        
        <div className="flex space-x-2">
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Tax Settings
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tax Settings</DialogTitle>
                <DialogDescription>
                  Customize your tax calculation parameters.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="tax-year">Tax Year</Label>
                  <Select
                    value={taxYear}
                    onValueChange={setTaxYear}
                  >
                    <SelectTrigger id="tax-year">
                      <SelectValue placeholder="Select tax year" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTaxYears.map((year) => (
                        <SelectItem key={year} value={year}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tax-method">Calculation Method</Label>
                  <Select
                    value={taxMethod}
                    onValueChange={setTaxMethod}
                  >
                    <SelectTrigger id="tax-method">
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fifo">FIFO (First In, First Out)</SelectItem>
                      <SelectItem value="lifo">LIFO (Last In, First Out)</SelectItem>
                      <SelectItem value="hifo">HIFO (Highest In, First Out)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="filing-status">Filing Status</Label>
                  <Select
                    value={filingStatus}
                    onValueChange={setFilingStatus}
                  >
                    <SelectTrigger id="filing-status">
                      <SelectValue placeholder="Select filing status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="joint">Married Filing Jointly</SelectItem>
                      <SelectItem value="separate">Married Filing Separately</SelectItem>
                      <SelectItem value="head">Head of Household</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="taxable-income">Additional Taxable Income</Label>
                  <Input
                    id="taxable-income"
                    type="number"
                    value={taxableIncome}
                    onChange={(e) => setTaxableIncome(e.target.value)}
                    placeholder="Enter other income"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={applySettings}>
                  Apply Settings
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Button 
            variant="default" 
            size="sm"
            onClick={exportTaxReport}
            disabled={isExporting || !transactions.length}
          >
            {isExporting ? (
              <>Exporting...</>
            ) : (
              <>
                <FileDown className="h-4 w-4 mr-2" />
                Export Report
              </>
            )}
          </Button>
        </div>
      </div>
      
      {/* Tax report content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Progress value={45} className="w-1/3 mb-4" />
          <p className="text-center text-muted-foreground">
            Calculating your crypto tax report...
          </p>
        </div>
      ) : taxSummary ? (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="byAsset">By Asset</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="summary" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Tax Summary for {taxSummary.taxYear}</CardTitle>
                  <CardDescription>
                    Overview of your cryptocurrency tax liability
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Transactions:</span>
                      <span className="font-medium">{taxSummary.totalTransactions}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Short-Term Gains:</span>
                      <span className={`font-medium ${taxSummary.shortTermGains >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${taxSummary.shortTermGains.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Long-Term Gains:</span>
                      <span className={`font-medium ${taxSummary.longTermGains >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${taxSummary.longTermGains.toFixed(2)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Gains:</span>
                      <span className={`font-medium ${taxSummary.totalGains >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${taxSummary.totalGains.toFixed(2)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cost Basis:</span>
                      <span className="font-medium">${taxSummary.costBasis.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Proceeds:</span>
                      <span className="font-medium">${taxSummary.proceeds.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Estimated Tax</CardTitle>
                  <CardDescription>
                    Based on your {filingStatus} filing status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Taxable Amount:</span>
                        <span className="font-medium">${taxSummary.totalTaxableAmount.toFixed(2)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Estimated Tax:</span>
                        <span className="font-bold text-xl">${taxSummary.estimatedTax.toFixed(2)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Effective Tax Rate:</span>
                        <span className="font-medium">
                          {taxSummary.totalTaxableAmount > 0 
                            ? (taxSummary.estimatedTax / taxSummary.totalTaxableAmount * 100).toFixed(2) 
                            : '0.00'}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="bg-muted p-3 rounded-md text-sm text-muted-foreground">
                      <p>
                        This is only an estimate. Please consult with a tax professional for accurate tax advice.
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => setIsSettingsOpen(true)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Adjust Tax Settings
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="byAsset" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tax Breakdown by Asset</CardTitle>
                <CardDescription>
                  View your tax liability for each cryptocurrency
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset</TableHead>
                      <TableHead>Transactions</TableHead>
                      <TableHead>Short-Term Gains</TableHead>
                      <TableHead>Long-Term Gains</TableHead>
                      <TableHead className="text-right">Total Gains</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(taxSummary.byAsset).map(([symbol, data]) => (
                      <TableRow key={symbol}>
                        <TableCell className="font-medium">{symbol}</TableCell>
                        <TableCell>{data.transactions}</TableCell>
                        <TableCell className={data.shortTermGains >= 0 ? 'text-green-600' : 'text-red-600'}>
                          ${data.shortTermGains.toFixed(2)}
                        </TableCell>
                        <TableCell className={data.longTermGains >= 0 ? 'text-green-600' : 'text-red-600'}>
                          ${data.longTermGains.toFixed(2)}
                        </TableCell>
                        <TableCell className={`text-right ${data.totalGains >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${data.totalGains.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="transactions" className="space-y-4">
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <div>
                  <CardTitle>Taxable Transactions</CardTitle>
                  <CardDescription>
                    Detailed list of all relevant transactions for {taxSummary.taxYear}
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={exportTaxReport}
                  disabled={isExporting}
                >
                  {isExporting ? 'Exporting...' : 'Export as CSV'}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Asset</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Cost Basis</TableHead>
                        <TableHead>Proceeds</TableHead>
                        <TableHead className="text-right">Gain/Loss</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell>{new Date(tx.date).toLocaleDateString()}</TableCell>
                          <TableCell className={tx.type === 'buy' ? 'text-green-600' : 'text-orange-600'}>
                            {tx.type.toUpperCase()}
                          </TableCell>
                          <TableCell>{tx.symbol}</TableCell>
                          <TableCell>{tx.amount.toFixed(4)}</TableCell>
                          <TableCell>${tx.price.toFixed(2)}</TableCell>
                          <TableCell>${tx.costBasis.toFixed(2)}</TableCell>
                          <TableCell>${tx.proceeds.toFixed(2)}</TableCell>
                          <TableCell className={`text-right ${tx.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${tx.gainLoss.toFixed(2)}
                            <br />
                            <span className="text-xs text-muted-foreground">
                              {tx.isLongTerm ? 'Long-Term' : 'Short-Term'}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-center text-muted-foreground mb-4">
            No tax data available. Please check your transaction history or try different settings.
          </p>
          <Button onClick={() => setIsSettingsOpen(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Configure Tax Settings
          </Button>
        </div>
      )}
    </div>
  );
}