import { Composition } from "remotion";
import { Hello } from "./Hello";
import { Intro } from "./intro/Intro";

export const Root = () => (
  <>
    {/* Вертикальный формат 9:16 для Reels / TikTok */}
    <Composition id="Hello" component={Hello} durationInFrames={90} fps={30} width={1080} height={1920} />
    {/* Интро подкаста «Анти брейнрот», 15 с, 16:9. Номер эпизода: --props='{"episode":2}' */}
    <Composition id="PodcastIntro" component={Intro} durationInFrames={450} fps={30} width={1920} height={1080}
      defaultProps={{ episode: 1, photo: "intro/st/me_happy.svg" }} />
  </>
);
