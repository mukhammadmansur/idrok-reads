import {
  ArrowRight,
  BookOpen,
  Check,
  Crown,
  LockKeyhole,
  Medal,
  MessageCircleQuestion,
  Sparkles,
  Star,
  Trophy,
} from "lucide-react";
import { Link } from "react-router-dom";
import { buttonClass } from "../../design-system/Button";
import { PageIntro } from "../../design-system/PageIntro";
import { ProgressBar } from "../../design-system/ProgressBar";
import { stories } from "../../content";
import { useProgress } from "../../lib/context";
import styles from "./RewardsPage.module.css";

const milestones = [
  {
    count: 1,
    title: "Birinchi qadam",
    note: "Bitta hikoyani oxirigacha o‘qiding.",
    icon: Star,
  },
  {
    count: 2,
    title: "Ishqiboz kitobxon",
    note: "Ikki hikoya — ikki yangi olam.",
    icon: Sparkles,
  },
  {
    count: 3,
    title: "Hikoyalar ustasi",
    note: "Kutubxonadagi barcha hikoyalar seniki.",
    icon: Crown,
  },
];

export function RewardsPage() {
  const { progress, children: profiles, selectedChildId } = useProgress();
  const child = profiles.find((profile) => profile.id === selectedChildId);
  const completed = stories.filter(
    (story) => progress.reading[story.id]?.completedAt,
  );
  const count = completed.length;
  const next = milestones.find((milestone) => milestone.count > count);
  const percent = Math.round((count / milestones[milestones.length - 1].count) * 100);

  return (
    <div className={styles.page}>
      <PageIntro
        eyebrow="SENING YUTUQLARING"
        title="Har bir sahifa — yangi yulduz"
        description="Nishonlar shoshilmasdan ochiladi. Eng muhimi — o‘qishdan zavq olish."
        actions={
          <span className={styles.stat}>
            <Trophy size={16} />
            {count} / {milestones[milestones.length - 1].count} nishon
          </span>
        }
      />

      <section className={styles.hero} aria-labelledby="reward-progress">
        <div className={styles.heroTop}>
          <span className={styles.heroIcon}>
            <Medal size={36} strokeWidth={1.5} />
          </span>
          <div>
            <span className={styles.eyebrow}>
              {child ? `${child.name.toLocaleUpperCase()}NING YO‘LI` : "SENING YO‘LING"}
            </span>
            <h2 id="reward-progress">
              {next
                ? `Keyingi maqsad: ${next.title}`
                : "Barcha asosiy nishonlar ochilgan!"}
            </h2>
            <p>
              {next
                ? `${next.count} ta hikoya tugatishga ${next.count - count} ta qoldi.`
                : "Endi savollarni yechib, bilimingni ham sinab ko‘rishing mumkin."}
            </p>
          </div>
          <span className={styles.bigCount}>
            {count}
            <small> / {milestones[milestones.length - 1].count}</small>
          </span>
        </div>
        <ProgressBar
          value={count}
          max={milestones[milestones.length - 1].count}
          label="Nishonlar jarayoni"
        />
        <div className={styles.heroFooter}>
          <span>{percent}% yo‘l bosildi</span>
          <Link to="/" className={styles.heroLink}>
            {completed.length ? "Yana hikoya tanlash" : "Birinchi hikoyani tanlash"}
            <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      <section aria-labelledby="milestones-title" className={styles.section}>
        <div className={styles.sectionHead}>
          <div>
            <h2 id="milestones-title">Bosqichlar</h2>
            <p>Har bir tugatilgan hikoya yangi nishon olib keladi.</p>
          </div>
        </div>
        <div className={styles.milestones}>
          {milestones.map((milestone) => {
            const unlocked = count >= milestone.count;
            const Icon = milestone.icon;
            return (
              <article
                key={milestone.count}
                className={`${styles.milestone} ${
                  unlocked ? styles.unlocked : ""
                } ${next?.count === milestone.count ? styles.current : ""}`}
              >
                <span className={styles.milestoneIcon}>
                  {unlocked ? <Icon size={24} /> : <LockKeyhole size={22} />}
                </span>
                <div>
                  <span className={styles.milestoneCount}>
                    {milestone.count} ta hikoya
                  </span>
                  <h3>{milestone.title}</h3>
                  <p>{milestone.note}</p>
                </div>
                <span className={styles.milestoneState}>
                  {unlocked ? (
                    <Check size={17} aria-hidden="true" />
                  ) : (
                    <LockKeyhole size={15} aria-hidden="true" />
                  )}
                  <span className="sr-only">
                    {unlocked ? "Ochilgan" : "Hali yopiq"}
                  </span>
                </span>
              </article>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="badges-title" className={styles.section}>
        <div className={styles.sectionHead}>
          <div>
            <h2 id="badges-title">Hikoya nishonlari</h2>
            <p>Har bir hikoyaning o‘z mukofoti bor.</p>
          </div>
          <span className={styles.count}>{count} ta ochilgan</span>
        </div>
        <div className={styles.badges}>
          {stories.map((story) => {
            const record = progress.reading[story.id];
            const unlocked = !!record?.completedAt;
            const storyPercent = unlocked
              ? 100
              : record
                ? Math.round(((record.page + 1) / story.pages.length) * 100)
                : 0;
            return (
              <article
                key={story.id}
                className={`${styles.badge} ${unlocked ? styles.badgeOpen : ""}`}
              >
                <div className={styles.badgeTop}>
                  <img src={story.cover} alt="" loading="lazy" />
                  <span className={styles.badgeMedal}>
                    {unlocked ? <Medal size={22} /> : <LockKeyhole size={18} />}
                  </span>
                </div>
                <div className={styles.badgeBody}>
                  <span className={styles.badgeLabel}>NISHON</span>
                  <h3>{story.reward}</h3>
                  <p className={styles.badgeStory}>{story.title}</p>
                  <ProgressBar
                    value={storyPercent}
                    max={100}
                    label={`${story.title} nishoniga yetish`}
                  />
                  <div className={styles.badgeFooter}>
                    <span>
                      {unlocked
                        ? "Ochilgan"
                        : record
                          ? `${storyPercent}% o‘qildi`
                          : "Hali boshlanmagan"}
                    </span>
                    <Link
                      to={unlocked ? `/story/${story.slug}` : `/read/${story.slug}`}
                      className={styles.badgeLink}
                    >
                      {unlocked ? "Qayta o‘qish" : "O‘qishni boshlash"}
                      <ArrowRight size={15} />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className={styles.quiz}>
        <span className={styles.quizIcon}>
          <MessageCircleQuestion size={26} />
        </span>
        <div>
          <h2>Bilimingni ham sinab ko‘r</h2>
          <p>Umumiy savollar hamma uchun ochiq. Kitob savollari esa o‘qilgandan keyin.</p>
        </div>
        <Link to="/quiz" className={buttonClass({ size: "lg" })}>
          <span>Savol-javob</span>
          <ArrowRight size={18} />
        </Link>
      </section>

      <p className={styles.note}>
        <BookOpen size={16} />
        {next
          ? `Keyingi nishon uchun yana ${next.count - count} ta hikoya kerak.`
          : "Kutubxonadagi barcha hikoyalar o‘qildi. Ajoyib ish!"}
      </p>
    </div>
  );
}
