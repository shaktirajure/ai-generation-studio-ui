import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
  className?: string;
}

/**
 * A code display component with copy functionality.
 * Displays code in a monospace font with optional title and language label.
 * Note: This component does not include syntax highlighting - it's a simple code formatter.
 */
export function CodeBlock({ 
  code, 
  language = "javascript", 
  title, 
  className 
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  return (
    <div className={cn("code-block", className)}>
      {title && (
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-border">
          <span className="text-sm font-medium text-foreground">{title}</span>
          <span className="text-xs text-muted-foreground uppercase">{language}</span>
        </div>
      )}
      
      <pre className="overflow-x-auto whitespace-pre-wrap">
        <code className="text-sm font-mono leading-relaxed">{code}</code>
      </pre>
      
      <Button
        variant="ghost"
        size="icon"
        className="copy-button"
        onClick={copyToClipboard}
        data-testid="button-copy-code"
      >
        {copied ? (
          <Check className="h-4 w-4 text-success" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
        <span className="sr-only">
          {copied ? "Copied!" : "Copy code"}
        </span>
      </Button>
    </div>
  );
}