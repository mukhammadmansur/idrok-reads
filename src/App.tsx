import { BookOpen, RefreshCw } from "lucide-react";
import Shell from "./components/Shell";
import Home from "./components/Home";
import Reader from "./components/Reader";
import StoryDetails from "./components/StoryDetails";
import Quiz from "./components/Quiz";
import Progress from "./components/Progress";
import { EmptyState } from "./components/ui";
import { stories } from "./data/stories";
import { useRoute, useProgress } from "./lib/context";
import ParentGate, { ChildArea } from "./components/ParentGate";
import ParentDashboard from "./components/ParentDashboard";
import Account from "./components/Account";
export default function App() {
  const path = useRoute();
  const {
    user,
    selectedChildId,
    accountLoading,
    profileError,
    retrySync,
    logout,
  } = useProgress();
  if (accountLoading)
    return (
      <main className="session-loading" aria-busy="true">
        <RefreshCw size={28} />
        <p>Kutubxonani tayyorlayapmiz…</p>
      </main>
    );
  if (profileError)
    return (
      <main className="session-loading">
        <h1>Profil yuklanmadi</h1>
        <p>{profileError}</p>
        <button className="button" onClick={retrySync}>
          Qayta urinish
        </button>
        <button
          className="text-link"
          onClick={() => void logout().catch(() => retrySync())}
        >
          Akkauntdan chiqish
        </button>
      </main>
    );
  const profileKey = selectedChildId ?? "guest";
  const [pathname, query] = path.split("?");
  const [, section, slug] = pathname.split("/");
  const story = stories.find(
    (s) => s.slug === slug && s.status === "published",
  );
  if (section === "read" && story)
    return user && !selectedChildId ? (
      <Shell path="/account">
        <ParentGate>
          <Account />
        </ParentGate>
      </Shell>
    ) : (
      <ChildArea>
        <Reader key={`${profileKey}:${story.id}`} story={story} />
      </ChildArea>
    );
  let content;
  if (section === "account" || (user && !selectedChildId))
    content = <Account />;
  else if (pathname === "/") content = <Home />;
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
    content = <Quiz key={`${profileKey}:${slug || "library"}`} id={slug} />;
  else if (pathname === "/rewards") content = <Progress key={profileKey} />;
  else if (pathname === "/parent")
    content = user ? <ParentDashboard /> : <Account />;
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
  const isParent =
    section === "account" ||
    section === "parent" ||
    !!(user && !selectedChildId);
  return (
    <Shell path={pathname}>
      {isParent ? (
        user ? (
          <ParentGate key={user.id}>{content}</ParentGate>
        ) : (
          content
        )
      ) : (
        <ChildArea>{content}</ChildArea>
      )}
    </Shell>
  );
}
