import { StrictMode, Component, type ReactNode, type ErrorInfo } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ProgressProvider } from "./lib/context";
import "./styles.css";
import "./themes.css";
import "./worlds.css";
import "./comfort.css";
import "./picturebook.css";
import "./account.css";
class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Iqro UI error", error, info.componentStack);
  }
  render() {
    return this.state.failed ? (
      <main className="fatal-error">
        <h1>Sahifani qayta ochamizmi?</h1>
        <p>
          Kichik nosozlik yuz berdi. Saqlangan o‘qish jarayoning shu brauzerda
          qoladi.
        </p>
        <button
          className="button"
          onClick={() => window.location.assign(window.location.pathname)}
        >
          Kutubxonani ochish
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
        <App />
      </ProgressProvider>
    </ErrorBoundary>
  </StrictMode>,
);
