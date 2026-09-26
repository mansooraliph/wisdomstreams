import { BarChart2 } from "lucide-react";
import { ComingSoon } from "../../components/coming-soon";

export default function AnalyticsPage() {
  return (
    <ComingSoon
      icon={BarChart2}
      title="Analytics"
      description="Deep-dive analytics (watch time, traffic sources, audience demographics) need dedicated event tracking that isn't built yet. Basic totals are on the Dashboard."
      cta={{ label: "Go to dashboard", href: "/dashboard" }}
    />
  );
}
