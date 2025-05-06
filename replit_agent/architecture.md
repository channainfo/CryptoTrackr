# Architecture Overview

## 1. Overview

This project is a full-stack web application for cryptocurrency portfolio tracking and management. It includes features for portfolio tracking, transaction management, market data analysis, learning resources, and tax reporting. The application follows a modern client-server architecture with a React frontend and Node.js backend.

The system is designed to provide users with a comprehensive platform to manage their cryptocurrency investments, learn about crypto concepts, set price alerts, and analyze portfolio performance. It integrates with various blockchain networks and external crypto data providers.

## 2. System Architecture

The application follows a standard web application architecture with clear separation between client and server components:

### 2.1 Frontend Architecture

- **Framework**: React with TypeScript
- **UI Components**: Custom components built with Radix UI primitives and styled with Tailwind CSS
- **State Management**: React Query for server state, React Context for application state
- **Routing**: Wouter for lightweight routing
- **Form Handling**: React Hook Form with Zod validation

The frontend is structured as a Single Page Application (SPA) with modular components and pages. It communicates with the backend through a RESTful API interface.

### 2.2 Backend Architecture

- **Framework**: Express.js with TypeScript
- **API Layer**: RESTful API endpoints
- **Database Access**: Drizzle ORM
- **Authentication**: Session-based authentication with cookies
- **File Serving**: Static file serving for client assets

The backend follows a layered architecture:
- Routes layer for handling HTTP requests
- Service layer for business logic
- Model layer for data access
- Storage layer for database interactions

### 2.3 Database Architecture

- **Database**: PostgreSQL (via Neon serverless Postgres)
- **ORM**: Drizzle ORM with schema validation
- **Migrations**: Drizzle Kit for schema migrations

The database schema includes tables for:
- Users and authentication
- Portfolios and portfolio tokens
- Transactions
- Learning modules and user progress
- Price alerts
- Historical value tracking

## 3. Key Components

### 3.1 User Authentication

- Session-based authentication using express-session
- PostgreSQL session store using connect-pg-simple
- Support for multiple authentication methods:
  - Username/password
  - Web3 wallet authentication (Ethereum, Solana, Base, Sui)
  - OAuth providers (planned)

### 3.2 Portfolio Management

- Portfolio creation and management
- Asset tracking with real-time price updates
- Transaction recording (buy/sell)
- Performance analytics
- Historical value tracking

### 3.3 Market Data

- Integration with cryptocurrency market data providers
- Real-time price and market cap information
- Historical price data for charts and analysis
- Market sentiment analysis

### 3.4 Learning Platform

- Structured learning modules with progress tracking
- Interactive quizzes
- Glossary of cryptocurrency terms
- Concept explanations

### 3.5 Alerts System

- Price alerts for specific tokens
- Customizable alert conditions
- Notification system

### 3.6 Tax and Reporting

- Transaction history tracking
- Tax calculation based on transaction data
- Exportable reports

### 3.7 Risk Assessment

- AI-powered portfolio risk analysis using OpenAI
- Diversification recommendations
- Market correlation analysis

## 4. Data Flow

1. **User Authentication Flow**:
   - User credentials are validated against the database
   - On successful authentication, a session is created and stored in PostgreSQL
   - Session ID is stored in a cookie on the client

2. **Portfolio Management Flow**:
   - User creates or selects a portfolio
   - User adds assets to portfolio through transactions
   - System calculates portfolio value based on current market prices
   - Historical values are recorded periodically for tracking performance

3. **Market Data Flow**:
   - External crypto API provides market data
   - Data is cached and processed by the backend
   - Processed data is sent to the client for display
   - Real-time updates are provided for active sessions

4. **Learning Content Flow**:
   - Admin creates learning modules and quizzes in the database
   - Users access modules and track progress
   - Quiz results are recorded and achievements are awarded

5. **Alert Processing Flow**:
   - User creates alerts with specific conditions
   - System periodically checks market data against alert conditions
   - When conditions are met, alerts are triggered
   - Triggered alerts update their status in the database

## 5. External Dependencies

### 5.1 Cryptocurrency APIs

- Integration with cryptocurrency market data providers
- Real-time price and volume data

### 5.2 Blockchain Integrations

- Ethereum integration via Web3.js
- Solana blockchain integration
- Base chain integration
- Sui blockchain integration (planned)

### 5.3 AI Services

- OpenAI integration for risk assessment and content generation
- Natural language processing for portfolio insights and recommendations

### 5.4 Frontend Libraries

- shadcn/ui component library (based on Radix UI)
- TailwindCSS for styling
- React Query for data fetching
- React Hook Form for form handling
- Zod for validation

### 5.5 Backend Libraries

- Express.js for API server
- Drizzle ORM for database access
- PostgreSQL for data storage
- connect-pg-simple for session management

## 6. Deployment Strategy

### 6.1 Build Process

- Client-side code is built using Vite
- Server-side code is bundled using esbuild
- Combined bundle is created for deployment

### 6.2 Hosting

- The application is configured to be deployed on Replit
- It supports autoscaling through Replit's deployment system
- Environment variables are used to configure different environments

### 6.3 Database

- Uses Neon serverless PostgreSQL for database hosting
- Connection pooling for efficient database access
- Environment variables for database configuration

### 6.4 Continuous Integration

- Build script defined in package.json
- Development environment uses tsx for TypeScript execution
- Production build creates optimized bundles

### 6.5 Environment Configuration

- Different configurations for development and production
- Environment variables for sensitive information
- Fallbacks for missing configuration

## 7. Security Considerations

- Session-based authentication with secure cookies
- Password hashing for user credentials
- CSRF protection through session cookies
- Input validation using Zod schemas
- Prepared statements via ORM to prevent SQL injection
- Web3 authentication for non-custodial wallet support

## 8. Future Extensibility

The architecture is designed to be extensible in several ways:

1. **Additional Authentication Methods**: The auth system supports adding new providers
2. **Blockchain Integrations**: The wallet system can be extended to support more chains
3. **Additional Learning Content**: The learning system can be expanded with new modules
4. **Enhanced Analytics**: The data model supports adding more sophisticated analytics
5. **Mobile Application**: The API design would support a mobile client in the future