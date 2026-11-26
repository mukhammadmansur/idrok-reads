import { useEffect, useState } from "react";
import {
  BadgeCheck,
  BookOpenCheck,
  BrainCircuit,
  Check,
  Clock4,
  FileUp,
  Gem,
  LineChart,
  Sparkles,
  Users,
} from "lucide-react";
import { api, type PricingPlan } from "../../lib/api";
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
    text: "Yangi kitoblar va maxsus to‘plamlar — hammasi obuna ichida.",
  },
  {
    icon: LineChart,
    title: "To‘liq hisobot",
    text: "Haftalik o‘qish xulosasi va taraqqiyot grafiklari.",
  },
  {
    icon: BadgeCheck,
    title: "Erta kirish",
    text: "Yangi kitoblar va yangiliklar birinchi bo‘lib obunachilarga.",
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

export function ParentShopTab() {
  const [plans, setPlans] = useState<PricingPlan[] | null>(null);
  const [error, setError] = useState("");

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

  return (
    <div className={styles.page}>
      <header className={styles.heading}>
        <span className={styles.eyebrow}>OILA UCHUN OBUNA</span>
        <h1>Obuna va do‘kon</h1>
        <p>
          Bitta obuna — bitta farzand uchun yetarli. Bir nechta farzand bo‘lsa,
          yuqori tarifda hammasi bitta tarifga sig‘adi. Hozircha barcha kitoblar
          bepul — to‘lov tizimi ishga tushgach ochiladi.
        </p>
      </header>

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
          : plans?.map((plan) => (
              <article
                key={plan.slug}
                className={`${styles.plan} ${plan.featured ? styles.planFeatured : ""}`}
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
                <button type="button" className={styles.buyBtn} disabled>
                  Tez orada
                </button>
              </article>
            ))}
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
          <FileUp size={20} style={{ color: "var(--accent)" }} />
          <div>
            <h2 id="payment-title">To‘lov qanday amalga oshadi?</h2>
            <p>Payme yoki Click orqali — sizga qulay usulda.</p>
          </div>
        </div>
        <ol className={styles.steps}>
          <li>
            <strong>1.</strong> Tarifni tanlab, Payme yoki Click havolasi orqali
            to‘laysiz.
          </li>
          <li>
            <strong>2.</strong> Chek yoki to‘lov skrinshotini shu yerga
            yuklaysiz.
          </li>
          <li>
            <strong>3.</strong> 24 soat ichida tasdiqlaymiz — obuna ochiladi.
          </li>
        </ol>
        <div className={styles.comingSoon}>
          <Sparkles size={16} />
          <span>
            To‘lov tizimi sozlanmoqda —{" "}
            <strong>yaqin orada ishga tushadi</strong>. Hozircha kitoblar
            bepul!
          </span>
        </div>
      </section>

      <section className={styles.shop} aria-labelledby="shop-title">
        <div className={styles.paymentHead}>
          <Clock4 size={20} style={{ color: "var(--accent)" }} />
          <div>
            <h2 id="shop-title">Pullik kitoblar</h2>
            <p>
              Maxsus to‘plamlar alohida sotiladi — obunasiz ham sotib olish
              mumkin bo‘ladi.
            </p>
          </div>
        </div>
        <p className={styles.shopNote}>
          <Check size={15} />
          Do‘kon rafi ochilgach, yangi kitoblar shu yerda ko‘rinadi.
        </p>
      </section>
    </div>
  );
}
