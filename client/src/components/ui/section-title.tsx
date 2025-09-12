import { cn } from "@/lib/utils";

interface SectionTitleProps {
  eyebrow?: string;
  title: string;
  description?: string;
  centered?: boolean;
  className?: string;
}

export function SectionTitle({ 
  eyebrow, 
  title, 
  description, 
  centered = true,
  className 
}: SectionTitleProps) {
  return (
    <div className={cn(
      "space-y-4",
      centered && "text-center",
      className
    )}>
      {eyebrow && (
        <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          {eyebrow}
        </p>
      )}
      <h2 className="gradient-text">
        {title}
      </h2>
      {description && (
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {description}
        </p>
      )}
    </div>
  );
}