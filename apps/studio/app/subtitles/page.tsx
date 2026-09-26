import { Captions } from "lucide-react";
import { ComingSoon } from "../../components/coming-soon";

export default function SubtitlesPage() {
  return (
    <ComingSoon
      icon={Captions}
      title="Subtitles"
      description="Uploading SRT/VTT files and requesting auto-captions (via Mux Captions or Whisper) isn't wired up yet."
    />
  );
}
