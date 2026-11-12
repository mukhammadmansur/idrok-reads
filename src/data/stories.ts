import { storyVideos } from "./videos";
import type { Question, Story, ThemeId, ReadingBlock } from "./types";
export const themes: {
  id: ThemeId;
  name: string;
  label: string;
  description: string;
  symbol: string;
}[] = [
  {
    id: "classic",
    name: "ClassicBook",
    label: "Klassik",
    description: "Iliq sahifalar. Sokin mutolaa.",
    symbol: "☀",
  },
  {
    id: "forest",
    name: "ForestBook",
    label: "O‘rmon",
    description: "Sehrli o‘rmon bag‘rida.",
    symbol: "❧",
  },
  {
    id: "ice",
    name: "IceBook",
    label: "Muz saroyi",
    description: "Muz saroyiga sayohat.",
    symbol: "❄",
  },
  {
    id: "holo",
    name: "HoloBook",
    label: "Kelajak",
    description: "Neon shahar va fazoviy kemalar.",
    symbol: "✧",
  },
];
const question = (
  id: string,
  prompt: string,
  options: string[],
  answer: number,
  explanation: string,
): Question => ({ id, prompt, options, answer, explanation });
const art = (name: string) => `/art/${name}.svg`;
type StoryScene = {
  page: number;
  src: string;
  alt: string;
  side: 0 | 1;
  before?: boolean;
};
const scene = (
  page: number,
  name: string,
  alt: string,
  side: 0 | 1,
  before = false,
): StoryScene => ({ page, src: `/art/${name}.webp`, alt, side, before });
const sceneArt: Record<string, StoryScene[]> = {
  "oy-dosti": [
    scene(
      0,
      "picture-moon-opening",
      "Tulkixon maysali tepalikda Oyga qarab turibdi.",
      0,
    ),
    scene(
      5,
      "picture-moon-lantern",
      "Tulkixon va Quyonvoy chiroqni tepalikdagi yerga qo‘yishyapti.",
      0,
    ),
    scene(
      1,
      "moon-letter",
      "Tulkixon deraza yonida Oyga do‘stlik maktubini yozyapti.",
      0,
    ),
    scene(
      2,
      "moon-tree",
      "Tulkixon daraxt shoxida maktubini ushlab turibdi, Quyonvoy esa pastda kutyapti.",
      1,
      true,
    ),
    scene(
      3,
      "moon-paper-plane",
      "Tulkixon va Quyonvoy maysalar ustida qog‘oz samolyot yasashyapti.",
      1,
    ),
    scene(
      4,
      "picture-moon-owl",
      "Boyo‘g‘li bobo Tulkixon va Quyonvoyga mehr ulashish haqida gapiryapti.",
      0,
      true,
    ),
    scene(
      6,
      "picture-moon-gathering",
      "Tulkixon maktubini o‘qiyapti, o‘rmon do‘stlari yerdagi chiroq atrofida tinglashyapti.",
      1,
    ),
    scene(
      7,
      "picture-moon-gathering",
      "Tulkixon, Quyonvoy va do‘stlari Oy nurida birga: endi hech kim yolg‘iz emas.",
      0,
      true,
    ),
  ],
  "bulut-kemasi": [
    scene(
      0,
      "picture-cloud-opening",
      "Zara deraza yonida kemaga o‘xshagan bulutni tomosha qilyapti.",
      0,
    ),
    scene(
      2,
      "picture-cloud-puddle",
      "Zara oq qog‘oz kemani hovlidagi ko‘lmakka qo‘yyapti.",
      0,
    ),
    scene(
      4,
      "picture-cloud-wind",
      "Shamol barg yelkanli kemani suryapti, Zara uni kuzatib yuribdi.",
      0,
    ),
    scene(
      1,
      "cloud-folding",
      "Zara va bobosi stol yonida qog‘ozdan kema buklashyapti.",
      0,
    ),
    scene(
      3,
      "cloud-sail",
      "Bobosi Zaraga yelkan haqida tushuntiryapti, Zara barg va cho‘pni ushlab turibdi.",
      1,
      true,
    ),
    scene(
      5,
      "cloud-ant-rescue",
      "Yashil barg yelkanli qog‘oz kema ho‘l toshda qolgan chumolini qutqaryapti.",
      0,
    ),
    scene(
      6,
      "cloud-passenger",
      "Zara birinchi yo‘lovchisini kuzatyapti: chumoli kemadan xavfsiz maysaga tushyapti.",
      1,
    ),
    scene(
      7,
      "picture-cloud-goodbye",
      "Zara va bobosi kechki osmonda kemaga o‘xshagan bulutga qo‘l silkishyapti.",
      0,
      true,
    ),
  ],
  "dengiz-siri": [
    scene(
      0,
      "picture-sea-opening",
      "Kitvoy quyosh tushgan suvda marjonlar ustidan suzyapti.",
      0,
    ),
    scene(
      7,
      "picture-sea-home",
      "Kitvoy tanish marjonlar yonidagi uyiga xursand qaytyapti.",
      0,
    ),
    scene(
      1,
      "picture-sea-meeting",
      "Kitvoy marjonlar yonida qo‘shiq aytayotgan Toshbaqacha bilan tanishyapti.",
      1,
    ),
    scene(
      2,
      "sea-courage",
      "Toshbaqacha Kitvoyni birga suzishga taklif qilyapti, Kitvoy esa ikkilanib turibdi.",
      0,
      true,
    ),
    scene(
      3,
      "sea-courage",
      "Toshbaqacha qo‘rqayotgan Kitvoyni mehr bilan qo‘llab-quvvatlayapti.",
      1,
    ),
    scene(
      4,
      "picture-sea-lights",
      "Kitvoy va Toshbaqacha yulduzlarga o‘xshab yaltiragan mayda baliqlarni tomosha qilishyapti.",
      0,
      true,
    ),
    scene(
      5,
      "sea-friends",
      "Kichkina kit Kitvoy va toshbaqa Toshbaqacha xavfsiz tosh yonida oqim tinishini kutishyapti.",
      1,
    ),
    scene(
      6,
      "sea-song",
      "Toshbaqacha uyiga yetib kelib rahmat aytyapti, Kitvoy quvonchdan kuylayapti.",
      0,
    ),
  ],
};
function makeStory(
  id: string,
  title: string,
  subtitle: string,
  description: string,
  category: string,
  minutes: number,
  reward: string,
  paragraphs: string[],
  quiz: Question[],
): Story {
  return {
    id,
    slug: id,
    title,
    subtitle,
    description,
    category,
    minutes,
    reward,
    cover: art(id),
    age: [6, 10],
    difficulty: "Oson o‘qish",
    themes: ["classic", "forest", "ice", "holo"],
    status: "published",
    pages: paragraphs.map((text, i) => {
      // A complete passage has one obvious place to read. Pictures can change
      // sides, but a sentence or dialogue is never split across the spine.
      const textSide: 0 | 1 = i % 3 === 1 ? 0 : 1;
      const imageSide = textSide === 0 ? 1 : 0;
      const leaves: [ReadingBlock[], ReadingBlock[]] = [[], []];
      if (i === 0)
        leaves[textSide].push({ type: "heading", text: "Bir bor ekan..." });
      leaves[textSide].push({ type: "text", text });
      const pageScene = sceneArt[id]?.find((scene) => scene.page === i);
      const illustration = pageScene?.src;
      if (pageScene)
        leaves[imageSide].push({
          type: "illustration",
          src: pageScene.src,
          alt: pageScene.alt,
        });
      return { text, leaves, illustration, scene: `${title}: ${i + 1}-sahifa` };
    }),
    recap: {
      kind: "youtube",
      ...storyVideos[id],
      poster: sceneArt[id]?.at(-1)?.src ?? art(id),
      demo: true,
    },
    quiz,
  };
}
export const stories: Story[] = [
  makeStory(
    "oy-dosti",
    "Oyga maktub",
    "Kichik tulkining katta orzusi",
    "Tulkixon Oyga xat yozdi. Quyonvoy unga yordam beradi. Xat Oyga yetib borarmikan?",
    "Do‘stlik",
    6,
    "Oy do‘sti",
    [
      "O‘rmonda Tulkixon yashardi. U har kecha Oyga qarardi. Oy juda chiroyli edi.",
      "Tulkixon Oyga xat yozdi: «Salom, Oy! Men sen bilan do‘st bo‘laman. Sen ham meni ko‘ryapsanmi?»",
      "Tulkixon xatini olib daraxtga chiqdi. Lekin Oy juda uzoqda edi. Quyonvoy pastda uni kutdi.",
      "«Birga urinib ko‘ramiz!» dedi Quyonvoy. Ular qog‘oz samolyot yasashdi. Samolyot uchdi-da, maysaga qo‘ndi.",
      "Boyo‘g‘li bobo uchib keldi. «Do‘stlaring yoningda-ku! Ularni ham xursand qil», dedi u.",
      "Tulkixon va Quyonvoy chiroq yasashdi. Uni tepalikka qo‘yishdi. Do‘stlari yorug‘likni ko‘rib, yonlariga kelishdi.",
      "Tulkixon xatini do‘stlariga o‘qib berdi. Hamma uni tingladi. Shu payt Oy bulut ortidan chiqdi.",
      "«Do‘stlarim yonimda. Men yolg‘iz emasman!» dedi Tulkixon. Ular har kecha shu yerda uchrashadigan bo‘lishdi.",
    ],
    [
      question(
        "moon-1",
        "Tulkixon kimga maktub yozdi?",
        ["Quyoshga", "Oyga", "Dengizga"],
        1,
        "Tulkixon Oy yolg‘iz bo‘lmasin deb unga do‘stlik maktubini yozdi.",
      ),
      question(
        "moon-2",
        "Tulkixon va Quyonvoy avval nimani yasashdi?",
        ["Qog‘oz samolyot", "Katta kema", "Qor odam"],
        0,
        "Ular maktubni uchirish uchun qog‘oz samolyot yasashdi.",
      ),
      question(
        "moon-3",
        "Hikoya oxirida Tulkixonni nima quvontirdi?",
        [
          "Eng baland daraxt",
          "Yangi o‘yinchoq",
          "Do‘stlarining yonida bo‘lishi",
        ],
        2,
        "Do‘stlari yig‘ilgach, Tulkixon hech kim yolg‘iz emasligini tushundi.",
      ),
    ],
  ),
  makeStory(
    "bulut-kemasi",
    "Bulutlar kemasi",
    "Shamol olib kelgan sarguzasht",
    "Zara bobosi bilan qog‘oz kema yasaydi. Kichik kema bir chumoliga yordam beradi.",
    "Sarguzasht",
    5,
    "Orzular sayyohi",
    [
      "Zara osmonga qaradi. Bulut oppoq kemaga o‘xshardi. «Men ham kema yasayman!» dedi u.",
      "Zara bobosi bilan qog‘ozni bukladi. Kichik kema tayyor bo‘ldi. Ular kemaga «Orzu» deb nom qo‘yishdi.",
      "Zara kemani ko‘lmakka qo‘ydi. Kema suvda turib qoldi. U hali suzmayotgan edi.",
      "«Unga yelkan yasaymiz», dedi bobosi. Zara bargni cho‘pga taqdi. Yashil yelkan tayyor bo‘ldi.",
      "Shamol esdi. Kema sekin suza boshladi. Zara quvonib, uning yonidan yurdi.",
      "Tosh ustida chumoli qolib ketgan edi. Zara kemani unga yaqin olib bordi. Chumoli kemaga chiqdi.",
      "Kema qirg‘oqqa yetdi. Chumoli maysaga tushdi. «Birinchi yo‘lovchimizni qutqardik!» dedi Zara.",
      "Zara bulut kemaga qo‘l silkidi. Bugun u chumoliga yordam berdi. Bobosi ham undan xursand bo‘ldi.",
    ],
    [
      question(
        "cloud-1",
        "Zara kemasiga qanday nom berdi?",
        ["Yulduz", "Orzu", "Quyosh"],
        1,
        "Zara kichik kemasiga «Orzu» deb nom berdi.",
      ),
      question(
        "cloud-2",
        "Yelkan nimadan yasaldi?",
        ["Bargdan", "Toshdan", "Muzdan"],
        0,
        "Zara yashil bargni cho‘pga mahkamladi.",
      ),
      question(
        "cloud-3",
        "Zara kimga yordam berdi?",
        ["Kapalakka", "Baliqqa", "Chumoliga"],
        2,
        "Kema ho‘l toshda qolgan chumolini qirg‘oqqa olib bordi.",
      ),
    ],
  ),
  makeStory(
    "dengiz-siri",
    "Dengizning kichik siri",
    "Do‘sting bilan qo‘rqinch ham kichrayadi",
    "Kitvoy chuqur suvdan qo‘rqadi. Toshbaqacha yonida bo‘lsa, u dadilroq suzadi.",
    "Tabiat",
    7,
    "Dengiz kashfiyotchisi",
    [
      "Kitvoy kichkina kit edi. U yorug‘ suvda o‘ynardi. Chuqur suvdan esa qo‘rqardi.",
      "Bir kuni Kitvoy qo‘shiq eshitdi. Uni Toshbaqacha aytayotgan edi. Ikkovi do‘st bo‘lib qolishdi.",
      "«Uyimga birga suzamizmi?» dedi Toshbaqacha. «Yo‘lda chuqur suv bor». Kitvoy biroz qo‘rqdi.",
      "«Qo‘rqsang, menga ayt. Yonimda suz», dedi Toshbaqacha. Ular sekin suzib ketishdi.",
      "Mayda baliqlar yaltirab turardi. «Qara, suvda ham yulduzlar bor!» dedi Kitvoy. Endi u kamroq qo‘rqardi.",
      "Suv tez oqa boshladi. Do‘stlar tosh ortiga o‘tishdi. Suv tinchiguncha birga kutishdi.",
      "Toshbaqacha uyiga yetdi. «Rahmat, do‘stim!» dedi u. Kitvoy xursand bo‘lib qo‘shiq aytdi.",
      "Kitvoy uyiga qaytdi. U bugun do‘sti bilan yangi joyga bordi. Qo‘rqqanda yordam so‘rash mumkinligini bildi.",
    ],
    [
      question(
        "sea-1",
        "Kitvoy nimadan qo‘rqardi?",
        ["Chuqur suvdan", "Quyoshdan", "Marjondan"],
        0,
        "Chuqur suv Kitvoyga qorong‘i ko‘rinardi.",
      ),
      question(
        "sea-2",
        "Oqim kuchayganda do‘stlar nima qilishdi?",
        ["Shoshilib suzishdi", "Tosh ortida kutishdi", "Ajralib ketishdi"],
        1,
        "Ular xavfsiz joyda oqim pasayishini kutishdi.",
      ),
      question(
        "sea-3",
        "Kitvoy nimani o‘rgandi?",
        [
          "Hech kimdan yordam so‘ramaslikni",
          "Doim shoshilishni",
          "Kichik qadam ham jasorat ekanini",
        ],
        2,
        "Kitvoy yordam so‘rash va kichik qadam tashlash ham jasoratligini bildi.",
      ),
    ],
  ),
];
export const generalQuiz: Question[] = [
  question(
    "general-1",
    "O‘simlik o‘sishi uchun nimalar kerak?",
    ["Faqat qorong‘ilik", "Suv va quyosh nuri", "Faqat toshlar"],
    1,
    "Suv va quyosh nuri o‘simliklarning o‘sishiga yordam beradi.",
  ),
  question(
    "general-2",
    "Do‘sting xafa bo‘lsa, nima qilish mumkin?",
    ["Uni tinglash", "Ustidan kulish", "Gapini bo‘lish"],
    0,
    "Tinglash va mehr ko‘rsatish do‘stimizga yordam beradi.",
  ),
  question(
    "general-3",
    "Qaysi hayvon dengizda yashaydi?",
    ["Tulki", "Quyon", "Kit"],
    2,
    "Kit — dengizda yashaydigan sutemizuvchi hayvon.",
  ),
];
