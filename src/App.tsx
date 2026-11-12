import { BookOpen } from "lucide-react";
import Shell from "./components/Shell";
import Home from "./components/Home";
import Reader from "./components/Reader";
import StoryDetails from "./components/StoryDetails";
import Quiz from "./components/Quiz";
import Progress from "./components/Progress";
import { EmptyState } from "./components/ui";
import { stories } from "./data/stories";
import { useRoute } from "./lib/context";
export default function App() {
  const path = useRoute();
  const [pathname, query] = path.split("?");
  const [, section, slug] = pathname.split("/");
  const story = stories.find(
    (s) => s.slug === slug && s.status === "published",
  );
  if (section === "read" && story)
    return <Reader key={story.id} story={story} />;
  let content;
  if (pathname === "/") content = <Home />;
  else if (section === "story" && story)
    content = (
      <StoryDetails
        key={story.id}
        story={story}
        initialTheme={new URLSearchParams(query).get("theme") || undefined}
      />
    );
  else if (section === "completed" && story)
    content = <Reader key={story.id} story={story} completed />;
  else if (section === "quiz")
    content = <Quiz key={slug || "library"} id={slug} />;
  else if (pathname === "/rewards") content = <Progress />;
  else if (pathname === "/parent") content = <Progress parent />;
  else
    content = (
      <div className="page">
        <EmptyState
          icon={<BookOpen />}
          title="Bu sahifa topilmadi"
          description="Yangi sarguzashtni kutubxonadan boshlaymizmi?"
          action={
            <a className="button" href="#/">
              Kutubxonaga qaytish
            </a>
          }
        />
      </div>
    );
  return <Shell path={pathname}>{content}</Shell>;
}
