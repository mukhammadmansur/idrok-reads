import { ArrowLeft, Compass } from "lucide-react";
import { Link } from "react-router-dom";
import { buttonClass } from "../design-system/Button";
import styles from "./NotFoundPage.module.css";

export function NotFoundPage() {
  return (
    <div className={styles.page}>
      <span className={styles.icon}>
        <Compass size={34} />
      </span>
      <h1>Bu sahifa topilmadi</h1>
      <p>Ehtimol, u boshqa olamga ko‘chib ketgan. Kutubxonadan yangidan boshlaymizmi?</p>
      <Link to="/" className={buttonClass({ size: "lg" })}>
        <ArrowLeft size={20} />
        <span>Kutubxonaga qaytish</span>
      </Link>
    </div>
  );
}
