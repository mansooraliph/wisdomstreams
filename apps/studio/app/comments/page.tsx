import { MessageSquare } from "lucide-react";
import { ComingSoon } from "../../components/coming-soon";

export default function CommentsModerationPage() {
  return (
    <ComingSoon
      icon={MessageSquare}
      title="Comments"
      description="A channel-wide held-comment queue, keyword filters, and blocked-user list aren't built yet. You can pin, delete, or reply to comments directly from each video's detail page."
      cta={{ label: "Go to content", href: "/content" }}
    />
  );
}
