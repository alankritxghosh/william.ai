"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
}

// Patterns that indicate sensitive information in error messages
const SENSITIVE_PATTERNS = [
  /api[_-]?key/gi,
  /token/gi,
  /password/gi,
  /secret/gi,
  /credential/gi,
  /\/Users\/[^\s]+/gi,
  /\/home\/[^\s]+/gi,
  /C:\\Users\\[^\s]+/gi,
  /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  /mongodb(\+srv)?:\/\/[^\s]+/gi,
  /postgres(ql)?:\/\/[^\s]+/gi,
  /at\s+[^\s]+\s+\([^)]+:\d+:\d+\)/g,
];

/**
 * Check if error message contains sensitive information
 */
function containsSensitiveInfo(message: string): boolean {
  return SENSITIVE_PATTERNS.some(pattern => pattern.test(message));
}

/**
 * Get a safe, user-friendly error message
 */
function getSafeErrorMessage(error: Error | null): string {
  if (!error) return "An unexpected error occurred.";
  
  const message = error.message;
  
  // If message contains sensitive info, don't display it
  if (containsSensitiveInfo(message)) {
    return "An unexpected error occurred. Our team has been notified.";
  }
  
  // If message is too long (might be a stack trace), truncate
  if (message.length > 150) {
    return "An unexpected error occurred. Please try again.";
  }
  
  // Check for common safe error types
  const safePatterns = [
    /network|connection|timeout|offline/i,
    /not found|404/i,
    /unauthorized|403|401/i,
    /rate limit|too many/i,
    /validation|invalid/i,
  ];
  
  for (const pattern of safePatterns) {
    if (pattern.test(message)) {
      return message; // These are generally safe to show
    }
  }
  
  // For other errors, show generic message
  return "Something went wrong. Please try again.";
}

/**
 * Generate a random error ID for tracking
 */
function generateErrorId(): string {
  return `ERR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorId: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { 
      hasError: true, 
      error,
      errorId: generateErrorId(),
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error securely (server-side would use proper logging service)
    // In production, this would be sent to Sentry or similar
    if (process.env.NODE_ENV === "development") {
      console.error("[ErrorBoundary] Caught error:", {
        errorId: this.state.errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      });
    } else {
      // In production, only log error ID and sanitized info
      console.error("[ErrorBoundary] Error:", this.state.errorId);
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorId: null });
  };

  public render() {
    if (this.state.hasError) {
      const safeMessage = getSafeErrorMessage(this.state.error);
      const isDevelopment = process.env.NODE_ENV === "development";
      
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle>Something went wrong</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                {safeMessage}
              </p>
              
              {/* Error ID for support reference */}
              {this.state.errorId && (
                <p className="text-xs text-muted-foreground">
                  Error ID: <code className="bg-muted px-1 py-0.5 rounded">{this.state.errorId}</code>
                </p>
              )}
              
              {/* Debug info - only in development */}
              {isDevelopment && this.state.error && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground flex items-center gap-1">
                    Debug Info (dev only)
                  </summary>
                  <div className="mt-2 p-3 bg-muted rounded-lg font-mono overflow-auto max-h-48">
                    <p className="font-bold mb-2">{this.state.error.name}</p>
                    <p className="mb-2">{this.state.error.message}</p>
                    {this.state.error.stack && (
                      <pre className="text-[10px] whitespace-pre-wrap opacity-70">
                        {this.state.error.stack}
                      </pre>
                    )}
                  </div>
                </details>
              )}
              
              <div className="flex gap-4">
                <Button onClick={this.handleReset}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Link href="/dashboard">
                  <Button variant="outline">
                    <Home className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
