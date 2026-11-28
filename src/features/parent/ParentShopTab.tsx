import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  BadgeCheck,
  BookOpenCheck,
  BrainCircuit,
  CalendarClock,
  Check,
  Gem,
  LineChart,
  PartyPopper,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { api, type PricingPlan } from "../../lib/api";
import { useProgress } from "../../lib/context";
import styles from "./ParentShopTab.module.css";

const benefits = [
  {
    icon: BrainCircuit,
    title: "AI murabbiy",
    text: "Farzandingizning o‘qishini kuzatib, har hafta shaxsiy maslahat beradi.",
  },
  {
    icon: BookOpenCheck,
    title: "Barcha premium kitoblar",
    text: "Kitty bog‘i, Arvoh orollari va yangi to‘plamlar — hammasi obunada.",
  },
  {
    icon: Gem,
    title: "Premium olamlar",
    text: "Pushti mushukcha va Arvoh qaroqchilar dunyolari obuna bilan ochiladi.",
  },
  {
    icon: LineChart,
    title: "To‘liq hisobot",
    text: "Haftalik o‘qish xulosasi va taraqqiyot grafiklari.",
  },
];

function formatPrice(value: number) {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function childrenLabel(plan: PricingPlan) {
  if (plan.maxChildren === null) return "Cheksiz farzand";
  if (plan.maxChildren === 1) return "1 farzand uchun";
  return `${plan.maxChildren} farzand uchun`;
}

function formatDate(isoValue: string) {
  return new Date(isoValue).toLocaleDateString("uz-UZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function ParentShopTab() {
  const { subscription, purchase, setToast } = useProgress();
  const [plans, setPlans] = useState<PricingPlan[] | null>(null);
  const [error, setError] = useState("");
  const [confirmPlan, setConfirmPlan] = useState<PricingPlan | null>(null);
  const [busy, setBusy] = useState(false);
  const [successPlan, setSuccessPlan] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api
      .pricing()
      .then((result) => {
        if (active) setPlans(result.plans);
      })
      .catch((cause) => {
        if (active)
          setError(
            cause instanceof Error ? cause.message : "Tariflar yuklanmadi.",
          );
      });
    return () => {
      active = false;
    };
  }, []);

  const confirmPurchase = async () => {
    if (!confirmPlan || busy) return;
    setBusy(true);
    setError("");
    try {
      await purchase(confirmPlan.slug);
      setSuccessPlan(confirmPlan.name);
      setConfirmPlan(null);
      setToast("Obuna faollashdi — premium ochildi! 🎉");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Xarid amalga oshmadi.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.heading}>
        <span className={styles.eyebrow}>OILA UCHUN OBUNA</span>
        <h1>Obuna va do‘kon</h1>
        <p>
          Bitta obuna — barcha premium kitoblar va sehrli olamlar. Premium
          kontent bolalarga faqat obuna faol bo‘lganda ochiladi.
        </p>
      </header>

      {subscription && (
        <section className={styles.currentPlan}>
          <ShieldCheck size={22} />
          <div>
            <strong>{subscription.planName} faol</strong>
            <p>
              <CalendarClock size={14} />
              {formatDate(subscription.expiresAt)} gacha amal qiladi
            </p>
          </div>
          <span className={styles.currentBadge}>
            <Check size={14} /> Premium ochiq
          </span>
        </section>
      )}

      {error && <p className={styles.planNote}>{error}</p>}

      <div className={styles.plans}>
        {plans === null && !error
          ? [0, 1].map((key) => (
              <article key={key} className={styles.plan}>
                <h2>Tarif yuklanmoqda…</h2>
                <p className={styles.price}>
                  <small>loading</small>
                </p>
                <p className={styles.planNote}>Iltimos kuting…</p>
              </article>
            ))
          : plans?.map((plan, index) => {
              const current = subscription?.plan === plan.slug;
              return (
                <article
                  key={plan.slug}
                  style={{ "--i": index } as React.CSSProperties}
                  className={`${styles.plan} ${plan.featured ? styles.planFeatured : ""} ${styles.planEnter}`}
                >
                  {plan.featured && (
                    <span className={styles.planBadge}>
                      <Gem size={13} />
                      Tavsiya etiladi
                    </span>
                  )}
                  <h2>{plan.name}</h2>
                  <p className={styles.price}>
                    {formatPrice(plan.price)} so‘m
                    <small>{plan.period}</small>
                  </p>
                  <p className={styles.childrenTag}>
                    <Users size={14} />
                    {childrenLabel(plan)}
                  </p>
                  <p className={styles.planNote}>{plan.note}</p>
                  <button
                    type="button"
                    className={styles.buyBtn}
                    disabled={current}
                    onClick={() => setConfirmPlan(plan)}
                  >
                    {current ? (
                      <>
                        <Check size={16} /> Faol obuna
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} /> Sotib olish
                      </>
                    )}
                  </button>
                </article>
              );
            })}
      </div>

      <section className={styles.benefits} aria-labelledby="benefits-title">
        <h2 id="benefits-title">Obunaga nimalar kiradi?</h2>
        <div className={styles.benefitGrid}>
          {benefits.map((benefit) => (
            <div key={benefit.title} className={styles.benefit}>
              <span className={styles.benefitIcon}>
                <benefit.icon size={20} />
              </span>
              <div>
                <strong>{benefit.title}</strong>
                <p>{benefit.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.payment} aria-labelledby="payment-title">
        <div className={styles.paymentHead}>
          <BadgeCheck size={20} style={{ color: "var(--accent)" }} />
          <div>
            <h2 id="payment-title">To‘lov qanday amalga oshadi?</h2>
            <p>
              Hozircha demo rejim: tarifni tanlang va obuna darhol faollashadi.
              Payme va Click to‘lovlari tez orada ulanadi.
            </p>
          </div>
        </div>
      </section>

      {confirmPlan &&
        createPortal(
          <div
            className={styles.confirmBackdrop}
            role="dialog"
            aria-modal="true"
            onClick={() => !busy && setConfirmPlan(null)}
          >
            <div
              className={styles.confirmCard}
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                className={styles.confirmClose}
                onClick={() => setConfirmPlan(null)}
                aria-label="Yopish"
              >
                <X size={16} />
              </button>
              <h2>Obunani tasdiqlang</h2>
              <p className={styles.confirmPlanName}>{confirmPlan.name}</p>
              <p className={styles.confirmPrice}>
                {formatPrice(confirmPlan.price)} so‘m {confirmPlan.period}
              </p>
              <p className={styles.planNote}>{confirmPlan.note}</p>
              <button
                type="button"
                className={styles.buyBtn}
                disabled={busy}
                onClick={() => void confirmPurchase()}
              >
                {busy ? "Rasmiylashtirilmoqda…" : "Ha, sotib olaman"}
              </button>
            </div>
          </div>,
          document.body,
        )}

      {successPlan &&
        createPortal(
          <div className={styles.successOverlay}>
            <div className={styles.successCard}>
              <span className={styles.confetti} aria-hidden="true">
                {Array.from({ length: 14 }).map((_, index) => (
                  <i key={index} style={{ "--c": index } as React.CSSProperties} />
                ))}
              </span>
              <span className={styles.successCheck}>
                <Check size={40} strokeWidth={3} />
              </span>
              <h2>Tabriklaymiz!</h2>
              <p>«{successPlan}» obunasi faollashdi. Premium kitoblar va olamlar endi ochiq!</p>
              <button
                type="button"
                className={styles.buyBtn}
                onClick={() => setSuccessPlan(null)}
              >
                Ajoyib!
              </button>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
