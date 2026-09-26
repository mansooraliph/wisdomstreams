import { Clapperboard } from "lucide-react";
import { ComingSoon } from "../../../components/coming-soon";

export default function ShortsPage() {
  return (
    <ComingSoon
      icon={Clapperboard}
      title="Shorts"
      description="Vertical short-form video is on the roadmap and isn't available yet."
    />
  );
}
