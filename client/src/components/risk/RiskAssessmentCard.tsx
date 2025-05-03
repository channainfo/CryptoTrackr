import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RiskAssessmentResponse } from "@/hooks/useRiskAssessment";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle, Info, TrendingDown, TrendingUp } from "lucide-react";

interface RiskAssessmentCardProps {
  data: RiskAssessmentResponse;
  isLoading: boolean;
  className?: string;
  compact?: boolean;
}

// Helper to get color based on risk level
const getRiskColor = (level: string) => {
  switch (level) {
    case "low":
      return "bg-green-600";
    case "medium":
      return "bg-yellow-500";
    case "high":
      return "bg-orange-500";
    case "very_high":
      return "bg-red-600";
    default:
      return "bg-blue-500";
  }
};

// Helper to get color based on impact
const getImpactColor = (impact: string) => {
  switch (impact) {
    case "positive":
      return "bg-green-600 text-white";
    case "negative":
      return "bg-red-600 text-white";
    case "neutral":
      return "bg-gray-500 text-white";
    default:
      return "bg-blue-500 text-white";
  }
};

// Helper to get priority badge color
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "high":
      return "bg-red-600 text-white";
    case "medium":
      return "bg-yellow-500 text-white";
    case "low":
      return "bg-blue-500 text-white";
    default:
      return "bg-gray-500 text-white";
  }
};

const RiskAssessmentCard: React.FC<RiskAssessmentCardProps> = ({
  data,
  isLoading,
  className,
  compact = false,
}) => {
  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <div className="animate-pulse bg-gray-200 h-6 w-1/3 rounded"></div>
          </CardTitle>
          <CardDescription className="animate-pulse bg-gray-200 h-4 w-2/3 rounded mt-2"></CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="animate-pulse bg-gray-200 h-20 w-full rounded"></div>
            <div className="animate-pulse bg-gray-200 h-40 w-full rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <AlertTriangle className={cn("w-5 h-5", 
            data.overallRisk.level === "low" ? "text-green-600" :
            data.overallRisk.level === "medium" ? "text-yellow-500" :
            data.overallRisk.level === "high" ? "text-orange-500" :
            "text-red-600"
          )} />
          Risk Assessment
          <Badge className={cn("ml-auto", getRiskColor(data.overallRisk.level))}>
            {data.overallRisk.level.replace("_", " ").toUpperCase()}
          </Badge>
        </CardTitle>
        <CardDescription>
          {data.overallRisk.summary}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Risk Score */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="text-sm font-medium">Overall Risk Score</div>
              <div className="text-sm font-bold">
                {data.overallRisk.score}/10
              </div>
            </div>
            <Progress
              value={data.overallRisk.score * 10}
              className={cn(
                "h-2",
                data.overallRisk.score <= 3 ? "bg-green-600/20" :
                data.overallRisk.score <= 6 ? "bg-yellow-500/20" :
                data.overallRisk.score <= 8 ? "bg-orange-500/20" :
                "bg-red-600/20"
              )}
            />
          </div>

          {/* Diversification */}
          {!compact && (
            <>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="text-sm font-medium">Diversification Score</div>
                  <div className="text-sm font-bold">
                    {data.diversificationScore}/10
                  </div>
                </div>
                <Progress
                  value={data.diversificationScore * 10}
                  className={cn(
                    "h-2",
                    data.diversificationScore >= 7 ? "bg-green-600/20" :
                    data.diversificationScore >= 4 ? "bg-yellow-500/20" :
                    "bg-red-600/20"
                  )}
                />
              </div>

              <Separator />
            </>
          )}

          {/* Risk Factors */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Key Risk Factors</h3>
            <ScrollArea className={compact ? "h-32" : "h-56"}>
              <div className="space-y-2">
                {data.factors.map((factor, index) => (
                  <div key={index} className="rounded-lg border p-3 text-sm">
                    <div className="flex justify-between items-center mb-1">
                      <div className="font-semibold">{factor.name}</div>
                      <Badge className={cn("text-xs", getImpactColor(factor.impact))}>
                        {factor.impact === "positive" ? <TrendingUp className="mr-1 h-3 w-3" /> : 
                         factor.impact === "negative" ? <TrendingDown className="mr-1 h-3 w-3" /> :
                         <Info className="mr-1 h-3 w-3" />}
                        {factor.impact.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-xs">{factor.description}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Recommendations */}
          {!compact && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Recommendations</h3>
                <ScrollArea className="h-40">
                  <div className="space-y-2">
                    {data.recommendations.map((rec, index) => (
                      <div key={index} className="rounded-lg border p-3 text-sm">
                        <div className="flex justify-between items-center mb-1">
                          <div className="font-semibold flex items-center gap-1">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            {rec.action}
                          </div>
                          <Badge className={cn("text-xs", getPriorityColor(rec.priority))}>
                            {rec.priority.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-xs">{rec.reasoning}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </>
          )}

          {/* Market Insights (only in expanded view) */}
          {!compact && (
            <>
              <Separator />
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-semibold">Volatility: </span>
                  <span className="text-muted-foreground">{data.volatilityAssessment}</span>
                </div>
                <div>
                  <span className="font-semibold">Market Correlation: </span>
                  <span className="text-muted-foreground">{data.marketCorrelation}</span>
                </div>
              </div>
            </>
          )}
          
          {/* Last updated */}
          <div className="text-xs text-muted-foreground mt-4">
            Last updated: {new Date(data.timestamp).toLocaleString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RiskAssessmentCard;