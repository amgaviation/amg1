import { PortalScreenshotFrame } from "@/components/site/portal-screenshot-frame";
import { cn } from "@/lib/utils";
import { IMG } from "@/lib/site-media";

export function PortalDashboardStack({
  priority,
  className,
}: {
  priority?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("relative mx-auto w-full max-w-5xl pb-0 sm:pb-20", className)}>
      <PortalScreenshotFrame
        src={IMG.portalClientDashboard}
        alt="AMG Connect client dashboard preview with sample support status data"
        priority={priority}
        className="relative z-10 w-full sm:w-[84%] sm:mx-0"
      />
      <PortalScreenshotFrame
        src={IMG.portalCrewDashboard}
        alt="AMG Connect crew dashboard preview with sample assignment and credential data"
        priority={priority}
        className="relative z-20 mt-4 w-full sm:absolute sm:bottom-0 sm:right-0 sm:mt-0 sm:w-[48%] sm:mx-0"
      />
    </div>
  );
}
