import { Composition } from "remotion";
import { Hello } from "./Hello";
import { Intro } from "./intro/Intro";
import { Episode } from "./episode/Episode";
import ep1 from "./episode/data/ep1.json";
import {Reel} from "./reels/Reel";
import reels from "./reels/data/reels.json";

export const Root = () => (
  <>
    {/* Вертикальный формат 9:16 для Reels / TikTok */}
    <Composition id="Hello" component={Hello} durationInFrames={90} fps={30} width={1080} height={1920} />
    {/* Интро подкаста «Анти брейнрот», 15 с, 16:9. Номер эпизода: --props='{"episode":2}' */}
    <Composition id="PodcastIntro" component={Intro} durationInFrames={450} fps={30} width={1920} height={1080}
      defaultProps={{ episode: 1, photo: "intro/st/me_happy.svg" }} />
    {/* Эпизод 1: «Тайм-менеджмент — это не про календарь». aroll.mp4 и photo.jpg лежат в public/ (не в git) */}
    <Composition id="Episode1" component={Episode} durationInFrames={Math.round(ep1.total * 30)} fps={30} width={1920} height={1080}
      defaultProps={{ aroll: "ep1/aroll.mp4", photo: "intro/photo.jpg", episode: 1 }} />
    {/* Рилсы из эпизода 1: 1080×1920, таймлайн и графика в reels/data/reels.json */}
    {reels.map((r) => (
      <Composition key={r.id} id={`Reel-${r.id}`} component={Reel} durationInFrames={Math.ceil(r.dur * 30)} fps={30} width={1080} height={1920} defaultProps={{id: r.id}} />
    ))}
  </>
);
