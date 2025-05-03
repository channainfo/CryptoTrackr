import { Alert } from '@shared/schema';
import { AlertModel } from '../models/AlertModel';
import { TokenMarketDataModel } from '../models/TokenMarketDataModel';

interface AlertCheckResult {
  alert: Alert;
  triggered: boolean;
  currentValue: number;
  message: string;
}

export class AlertService {
  /**
   * Check all active alerts and return those that have been triggered
   */
  static async checkAllAlerts(): Promise<AlertCheckResult[]> {
    const alerts = await AlertModel.findAlertsForPriceCheck();
    const results: AlertCheckResult[] = [];

    for (const alert of alerts) {
      try {
        const result = await this.checkAlert(alert);
        results.push(result);

        // If alert was triggered, update its status
        if (result.triggered) {
          await AlertModel.markAsTriggered(alert.id);
        }
      } catch (error) {
        console.error(`Error checking alert ${alert.id}:`, error);
      }
    }

    return results;
  }

  /**
   * Check a single alert against current market conditions
   */
  static async checkAlert(alert: Alert): Promise<AlertCheckResult> {
    // Get current market data for the token
    const marketData = await TokenMarketDataModel.findByTokenId(alert.tokenId);
    
    if (!marketData) {
      return {
        alert,
        triggered: false,
        currentValue: 0,
        message: 'No market data available for this token'
      };
    }

    const result: AlertCheckResult = {
      alert,
      triggered: false,
      currentValue: 0,
      message: ''
    };

    switch (alert.alertType) {
      case 'price_above':
        result.currentValue = Number(marketData.price);
        result.triggered = result.currentValue >= Number(alert.threshold);
        result.message = result.triggered 
          ? `Price is above ${alert.threshold} (current: ${result.currentValue})`
          : `Price is still below threshold`;
        break;

      case 'price_below':
        result.currentValue = Number(marketData.price);
        result.triggered = result.currentValue <= Number(alert.threshold);
        result.message = result.triggered 
          ? `Price is below ${alert.threshold} (current: ${result.currentValue})`
          : `Price is still above threshold`;
        break;

      case 'percent_change':
        result.currentValue = Number(marketData.priceChange24h);
        result.triggered = Math.abs(result.currentValue) >= Number(alert.threshold);
        result.message = result.triggered 
          ? `24h price change of ${result.currentValue}% exceeds threshold of ${alert.threshold}%`
          : `24h price change is within threshold`;
        break;

      case 'volume_above':
        result.currentValue = Number(marketData.volume24h);
        result.triggered = result.currentValue >= Number(alert.threshold);
        result.message = result.triggered 
          ? `Volume is above ${alert.threshold} (current: ${result.currentValue})`
          : `Volume is still below threshold`;
        break;

      case 'market_cap_above':
        result.currentValue = Number(marketData.marketCap);
        result.triggered = result.currentValue >= Number(alert.threshold);
        result.message = result.triggered 
          ? `Market cap is above ${alert.threshold} (current: ${result.currentValue})`
          : `Market cap is still below threshold`;
        break;

      default:
        result.message = 'Unknown alert type';
        break;
    }

    return result;
  }

  /**
   * Generate user-friendly message for display
   */
  static getAlertTypeLabel(alertType: string): string {
    switch (alertType) {
      case 'price_above': return 'Price rises above';
      case 'price_below': return 'Price falls below';
      case 'percent_change': return 'Price changes by';
      case 'volume_above': return 'Volume exceeds';
      case 'market_cap_above': return 'Market cap exceeds';
      default: return alertType;
    }
  }

  /**
   * Format threshold value based on alert type
   */
  static formatThreshold(alertType: string, threshold: number): string {
    switch (alertType) {
      case 'percent_change': return `${threshold}%`;
      case 'volume_above':
      case 'market_cap_above':
        return threshold >= 1_000_000_000
          ? `$${(threshold / 1_000_000_000).toFixed(2)}B`
          : threshold >= 1_000_000
          ? `$${(threshold / 1_000_000).toFixed(2)}M`
          : `$${threshold.toLocaleString()}`;
      default: return `$${threshold}`;
    }
  }
}