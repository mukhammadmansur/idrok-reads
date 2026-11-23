import { createBrowserRouter, Link, Navigate } from "react-router-dom";
import { ChildLayout } from "./layouts/ChildLayout";
import { RootLayout } from "./RootLayout";
import { RequireProfile } from "./RequireProfile";
import { NotFoundPage } from "./NotFoundPage";
import { LibraryPage } from "../features/library/LibraryPage";
import { StoryPage } from "../features/story/StoryPage";
import { ReaderPage } from "../features/reader/ReaderPage";
import { QuizLibraryPage } from "../features/quiz/QuizLibraryPage";
import { QuizPage } from "../features/quiz/QuizPage";
import { RewardsPage } from "../features/rewards/RewardsPage";
import { AccountPage } from "../features/account/AccountPage";
import { ParentLayout } from "../features/parent/ParentLayout";
import { ParentGate } from "../features/parent/ParentGate";
import { ParentDashboard } from "../features/parent/ParentDashboard";
import { ParentVideos } from "../features/parent/ParentVideos";
import { ParentSettingsTab } from "../features/parent/ParentSettingsTab";
import { ParentLogin } from "../features/parent/ParentLogin";
import { buttonClass } from "../design-system/Button";
import styles from "./RouteError.module.css";

function RouteError() {
  return (
    <main className={styles.page}>
      <h1>Sahifa ochilmadi</h1>
      <p>Kichik nosozlik yuz berdi. Kutubxonaga qaytib, yana urinib ko‘ramiz.</p>
      <Link to="/" className={buttonClass({ size: "lg" })}>
        Kutubxonaga qaytish
      </Link>
    </main>
  );
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RouteError />,
    children: [
      {
        element: <ChildLayout />,
        children: [
          {
            index: true,
            element: (
              <RequireProfile>
                <LibraryPage />
              </RequireProfile>
            ),
          },
          {
            path: "story/:slug",
            element: (
              <RequireProfile>
                <StoryPage />
              </RequireProfile>
            ),
          },
          {
            path: "quiz",
            element: (
              <RequireProfile>
                <QuizLibraryPage />
              </RequireProfile>
            ),
          },
          {
            path: "quiz/:id",
            element: (
              <RequireProfile>
                <QuizPage />
              </RequireProfile>
            ),
          },
          {
            path: "rewards",
            element: (
              <RequireProfile>
                <RewardsPage />
              </RequireProfile>
            ),
          },
          { path: "account", element: <AccountPage /> },
          { path: "account/login", element: <AccountPage /> },
          { path: "account/register", element: <AccountPage /> },
        ],
      },
      {
        path: "read/:slug",
        element: (
          <RequireProfile>
            <ReaderPage />
          </RequireProfile>
        ),
      },
      {
        path: "parent",
        element: <ParentLayout />,
        children: [
          { path: "login", element: <ParentLogin /> },
          { path: "register", element: <ParentLogin /> },
          {
            element: <ParentGate />,
            children: [
              { index: true, element: <ParentDashboard /> },
              { path: "videos", element: <ParentVideos /> },
              { path: "account", element: <ParentSettingsTab /> },
            ],
          },
          { path: "*", element: <Navigate to="/parent" replace /> },
        ],
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
