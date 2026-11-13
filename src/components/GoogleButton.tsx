import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
type Identity = {
  accounts: {
    id: {
      initialize: (options: {
        client_id: string;
        nonce: string;
        callback: (response: { credential: string }) => void;
        auto_select: boolean;
        use_fedcm_for_prompt: boolean;
      }) => void;
      renderButton: (
        node: HTMLElement,
        options: Record<string, string | number>,
      ) => void;
      cancel: () => void;
    };
  };
};
const identity = () => (window as Window & { google?: Identity }).google;
let loading: Promise<void> | null = null;
function loadIdentity() {
  if (identity()) return Promise.resolve();
  if (!loading)
    loading = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      const timeout = window.setTimeout(() => {
        script.remove();
        loading = null;
        reject(
          new Error("Google bilan aloqa cho‘zildi. Qayta urinib ko‘ring."),
        );
      }, 15000);
      script.onload = () => {
        clearTimeout(timeout);
        resolve();
      };
      script.onerror = () => {
        clearTimeout(timeout);
        script.remove();
        loading = null;
        reject(new Error("Google hozir ochilmadi. E-mail orqali davom eting."));
      };
      document.head.append(script);
    });
  return loading;
}
export default function GoogleButton({
  onCredential,
  label = "Google orqali davom etish",
}: {
  onCredential: (credential: string) => Promise<void>;
  label?: string;
}) {
  const host = useRef<HTMLDivElement>(null),
    callback = useRef(onCredential);
  const [state, setState] = useState("loading"),
    [error, setError] = useState(""),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    callback.current = onCredential;
  }, [onCredential]);
  useEffect(() => {
    let active = true;
    setState("loading");
    setError("");
    host.current?.replaceChildren();
    void (async () => {
      try {
        const options = await api.authOptions();
        if (!active) return;
        if (!options.googleClientId || !options.nonce) {
          setState("unavailable");
          return;
        }
        await loadIdentity();
        if (!active || !host.current) return;
        identity()!.accounts.id.initialize({
          client_id: options.googleClientId,
          nonce: options.nonce,
          auto_select: false,
          use_fedcm_for_prompt: false,
          callback: (result) => {
            if (!active) return;
            setError("");
            setState("busy");
            void callback
              .current(result.credential)
              .then(() => {
                if (active) setState("ready");
              })
              .catch((e) => {
                if (active) {
                  setError(
                    e instanceof Error
                      ? e.message
                      : "Google orqali kirish bajarilmadi.",
                  );
                  setState("ready");
                }
              });
          },
        });
        identity()!.accounts.id.renderButton(host.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          width: Math.min(380, host.current.clientWidth || 280),
        });
        setState("ready");
      } catch (e) {
        if (active) {
          setError(
            e instanceof Error ? e.message : "Google hozir ishlamayapti.",
          );
          setState("error");
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [attempt]);
  return (
    <div className="google-login">
      <div
        ref={host}
        className="google-host"
        aria-label={label}
        hidden={state === "unavailable" || state === "error"}
        style={
          state === "busy" ? { pointerEvents: "none", opacity: 0.5 } : undefined
        }
      />
      {(state === "loading" ||
        state === "unavailable" ||
        state === "error") && (
        <button className="google-fallback" disabled>
          <span aria-hidden="true">G</span>
          {label}
        </button>
      )}
      {state === "unavailable" && (
        <small>
          Google orqali kirish hozircha mavjud emas. E-mail orqali davom eting.
        </small>
      )}
      {state === "busy" && <p role="status">Google akkaunti tekshirilyapti…</p>}
      {error && (
        <>
          <p className="account-error" role="alert">
            {error}
          </p>
          <button
            type="button"
            className="text-link"
            onClick={() => setAttempt((n) => n + 1)}
          >
            Google orqali qayta urinish
          </button>
        </>
      )}
    </div>
  );
}
