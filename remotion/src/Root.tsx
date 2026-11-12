import { Composition } from "remotion";
import { Hello } from "./Hello";

// Вертикальный формат 9:16 для Reels / TikTok
export const Root = () => (
  <Composition id="Hello" component={Hello} durationInFrames={90} fps={30} width={1080} height={1920} />
);
