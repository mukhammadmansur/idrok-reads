import { StrictMode, Component, type ReactNode, type ErrorInfo } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./app/router";
import { ProgressProvider } from "./lib/context";
import "./styles/tokens.css";
import "./styles/global.css";

class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("IdrokReads UI error", error, info.componentStack);
  }
  render() {
    return this.state.failed ? (
      <main className="fatal-error">
        <h1>Sahifani qayta ochamizmi?</h1>
        <p>
          Kichik nosozlik yuz berdi. Saqlangan o‘qish jarayoning shu brauzerda
          qoladi.
        </p>
        <button className="button" onClick={() => window.location.reload()}>
          Sahifani yangilash
        </button>
      </main>
    ) : (
      this.props.children
    );
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <ProgressProvider>
        <RouterProvider router={router} />
      </ProgressProvider>
    </ErrorBoundary>
  </StrictMode>,
);
