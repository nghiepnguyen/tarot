import { createRoot } from "react-dom/client";
import { TarotExperience } from "@/components/tarot/TarotExperience";
import { AiUnlockPanel } from "@/components/tarot/AiUnlockPanel";
import { savedFixture } from "./actions";
createRoot(document.getElementById("root")!).render(location.search.includes("save=1") ? <TarotExperience isLoggedIn /> : <AiUnlockPanel readingId="reading-one" initialData={window.unlockFixture.initial ? savedFixture : null} />);
