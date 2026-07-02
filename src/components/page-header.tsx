import { BackToDashboard } from "@/components/back-to-dashboard";

type PageHeaderProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  showBack?: boolean;
};

export function PageHeader({ title, description, action, showBack = true }: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="animate-slide-up space-y-3">
        {showBack && <BackToDashboard />}
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          {description && <p className="mt-1 text-muted-foreground">{description}</p>}
        </div>
      </div>
      {action && <div className="animate-slide-up shrink-0">{action}</div>}
    </div>
  );
}
