import { useEffect, useRef, useState } from "react";
import { api } from "../../lib/api";
import styles from "./GoogleButton.module.css";

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

export function GoogleButton({
  onCredential,
  label = "Google orqali davom etish",
  onAvailable,
}: {
  onCredential: (credential: string) => Promise<void>;
  label?: string;
  onAvailable?: (available: boolean) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const callback = useRef(onCredential);
  const [state, setState] = useState<
    "loading" | "ready" | "busy" | "unavailable" | "error"
  >("loading");
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

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
          onAvailable?.(false);
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
              .catch((cause) => {
                if (active) {
                  setError(
                    cause instanceof Error
                      ? cause.message
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
        onAvailable?.(true);
      } catch (cause) {
        if (active) {
          setError(
            cause instanceof Error ? cause.message : "Google hozir ishlamayapti.",
          );
          setState("error");
          onAvailable?.(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [attempt, onAvailable]);

  if (state === "unavailable") return null;

  return (
    <div className={styles.wrap}>
      <div
        ref={host}
        className={styles.host}
        hidden={state === "loading" || state === "error"}
        style={state === "busy" ? { pointerEvents: "none", opacity: 0.5 } : undefined}
      />
      {(state === "loading" || state === "error") && (
        <button type="button" className={styles.fallback} disabled>
          <span aria-hidden="true">G</span>
          {label}
        </button>
      )}
      {state === "busy" && (
        <p className={styles.note} role="status">
          Google akkaunti tekshirilyapti…
        </p>
      )}
      {error && (
        <>
          <p className={styles.error} role="alert">
            {error}
          </p>
          <button
            type="button"
            className={styles.retry}
            onClick={() => setAttempt((value) => value + 1)}
          >
            Google orqali qayta urinish
          </button>
        </>
      )}
    </div>
  );
}
