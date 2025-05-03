/**
 * Represents a cryptocurrency term definition
 */
export interface CryptoDefinition {
  /**
   * The display name of the term
   */
  term: string;
  
  /**
   * A detailed explanation of the term
   */
  definition: string;
  
  /**
   * Optional URL to learn more about the term
   */
  learnMoreUrl?: string;
}

/**
 * Collection of crypto definitions indexed by their keys
 */
export interface CryptoDefinitionDictionary {
  [key: string]: CryptoDefinition;
}

/**
 * Properties for the CryptoTerm component
 */
export interface CryptoTermProps {
  /**
   * The key of the term in the crypto definitions dictionary
   */
  termKey: string;
  
  /**
   * The content to be wrapped by the tooltip
   */
  children?: React.ReactNode;
  
  /**
   * Whether to hide the info icon
   */
  hideIcon?: boolean;
  
  /**
   * Size of the tooltip (impacts text size)
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Which side the tooltip should appear on
   */
  tooltipSide?: 'top' | 'right' | 'bottom' | 'left';
  
  /**
   * Additional CSS classes to apply
   */
  className?: string;
}