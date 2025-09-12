# AI Content Generation Platform

## Overview

This is a full-stack web application for AI-powered content generation, built with React (frontend) and Express.js (backend). The platform allows users to generate various types of AI content including images, 3D models, and videos through a modern web interface. The system uses a credit-based model where users consume credits for each generation job and can track their usage through a comprehensive dashboard.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Framework**: shadcn/ui components built on top of Radix UI primitives for accessibility
- **Styling**: Tailwind CSS with custom design system and CSS variables for theming
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Form Handling**: React Hook Form with Zod schema validation for type-safe forms

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules for modern JavaScript features
- **API Design**: RESTful API with `/api` prefix and webhook endpoints for external integrations
- **Development Setup**: Hot reload with Vite integration for seamless development experience
- **Error Handling**: Centralized error handling middleware with proper HTTP status codes
- **Logging**: Request/response logging with timing metrics for API endpoints

### Data Storage Solutions
- **Database**: PostgreSQL configured through Drizzle ORM for type-safe database operations
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Schema Management**: Drizzle Kit for migrations and schema versioning
- **Development Storage**: In-memory storage for development and testing
- **Data Models**: Users with credit system, Jobs with status tracking, and typed schemas using Zod

### Authentication and Authorization
- **Demo Mode**: Currently uses a demo user system with server-controlled user identification
- **Session Management**: Express sessions with PostgreSQL session store for production scalability
- **Credit System**: Server-side credit validation and consumption to prevent client-side manipulation
- **Security**: Input validation using Zod schemas and proper error handling

### External Dependencies
- **Database**: Neon Database (PostgreSQL) for production data storage
- **UI Components**: Radix UI primitives for accessible component foundation
- **Styling**: Tailwind CSS for utility-first styling approach
- **Date Handling**: date-fns for consistent date formatting and manipulation
- **Development Tools**: Replit integration for cloud development environment
- **Build System**: esbuild for fast server-side bundling in production