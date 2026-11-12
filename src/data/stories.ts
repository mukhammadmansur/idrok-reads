import type { Question, Story, ThemeId } from "./types";
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
    description: "Tabiat bag‘ridagi sarguzasht.",
    symbol: "❧",
  },
  {
    id: "ice",
    name: "IceBook",
    label: "Muz saroyi",
    description: "Oppoq, sehrli bir olam.",
    symbol: "❄",
  },
  {
    id: "holo",
    name: "HoloBook",
    label: "Kelajak",
    description: "Yulduzlar sari sayohat.",
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
    pages: paragraphs.map((text, i) => ({
      text,
      illustration: art(id),
      scene: `${title}: ${i + 1}-sahifa`,
    })),
    recap: {
      kind: "animation",
      duration: 32,
      scenes: [0, 2, 4, 7].map((i) => ({
        text: paragraphs[i],
        illustration: art(id),
      })),
    },
    quiz,
  };
}
export const stories: Story[] = [
  makeStory(
    "oy-dosti",
    "Oyga maktub",
    "Kichik tulkining katta orzusi",
    "Tulki Timo har kecha Oyga qarab orzu qiladi. Bir kuni u eng uzoqdagi do‘stiga maktub yozishga qaror qildi. Ammo maktubni osmonga qanday yetkazish mumkin?",
    "Do‘stlik",
    6,
    "Oy do‘sti",
    [
      "O‘rmon chetida Timo ismli kichkina tulki yashardi. U har oqshom tepalikka chiqib, Oyning yaltirashini tomosha qilardi.",
      "Bir kecha Timo: «Oy yolg‘iz emasmikan?» deb o‘yladi. U qog‘oz olib, katta harflar bilan yozdi: «Salom, Oy! Men sen bilan do‘st bo‘lmoqchiman».",
      "Timo maktubini olib eng baland daraxtga bordi. Ammo daraxtning eng yuqori shoxi ham Oyga yetmasdi. Pastda uni quyon Lola kutib turardi.",
      "«Maktubni birga yetkazamiz», dedi Lola. Ular qog‘ozdan samolyot yasashdi. Samolyot uchdi, aylanib tushdi va yumshoq maysa ustiga qo‘ndi.",
      "Ularning yoniga boyo‘g‘li Usta uchib keldi. «Ba’zan maktub manziliga yetishi uchun konvert kerak emas. Undagi mehrni ulashish kifoya», dedi u.",
      "Timo va Lola kichik chiroq yasashdi. Ular uni uchirmay, tepalikka qo‘yishdi. Chiroqning iliq nuri barcha o‘rmon do‘stlarini bir joyga yig‘di.",
      "Do‘stlar navbat bilan o‘z orzularini aytishdi. Timo maktubini baland ovozda o‘qidi. Shu payt bulut ortidan Oy chiqib, tepalikni yoritdi.",
      "Timo kulimsiradi: «Oy meni eshitdimi, bilmayman. Lekin bugun hech kim yolg‘iz emas». O‘sha kundan do‘stlar har oqshom tepalikda uchrashadigan bo‘lishdi.",
    ],
    [
      question(
        "moon-1",
        "Timo kimga maktub yozdi?",
        ["Quyoshga", "Oyga", "Dengizga"],
        1,
        "Timo Oy yolg‘iz bo‘lmasin deb unga do‘stlik maktubini yozdi.",
      ),
      question(
        "moon-2",
        "Timo va Lola avval nimani yasashdi?",
        ["Qog‘oz samolyot", "Katta kema", "Qor odam"],
        0,
        "Ular maktubni uchirish uchun qog‘oz samolyot yasashdi.",
      ),
      question(
        "moon-3",
        "Hikoya oxirida Timoni nima quvontirdi?",
        [
          "Eng baland daraxt",
          "Yangi o‘yinchoq",
          "Do‘stlarining yonida bo‘lishi",
        ],
        2,
        "Do‘stlari yig‘ilgach, Timo hech kim yolg‘iz emasligini tushundi.",
      ),
    ],
  ),
  makeStory(
    "bulut-kemasi",
    "Bulutlar kemasi",
    "Shamol olib kelgan sarguzasht",
    "Zara va bobosi qog‘ozdan kema yasashadi. Shamolli kun ularni kutilmagan kashfiyotga yetaklaydi: katta sayohatlar kichik g‘oyalardan boshlanadi.",
    "Sarguzasht",
    5,
    "Orzular sayyohi",
    [
      "Zara derazadan suzib borayotgan bulutlarga qaradi. Bir bulut katta oq kemaga o‘xshardi. «Men ham sayohat qilaman!» dedi u.",
      "Bobosi unga katta qog‘oz uzatdi. Ular qog‘ozni ehtiyotkorlik bilan buklab, kichik kema yasashdi. Zara kemaga «Orzu» deb nom berdi.",
      "Hovlida yomg‘irdan qolgan ko‘lmak bor edi. Zara kemani suvga qo‘ydi. Ammo kema ko‘lmakning o‘rtasida to‘xtab qoldi.",
      "«Unga yelkan kerak», dedi bobosi. Zara barg topdi va ingichka cho‘pga mahkamladi. Endi kemaning yam-yashil yelkani bor edi.",
      "Shamol esdi. Kema sekin oldinga yurdi. Zara uning ortidan qadam tashlab, suv yuzidagi mayda to‘lqinlarni kuzatdi.",
      "Kichik chumoli ho‘l tosh ustida qolib ketgan edi. Zara kemani toshga yaqinlashtirdi. Chumoli bargga chiqib oldi.",
      "Kema qirg‘oqqa yetgach, chumoli maysalar orasiga yugurdi. «Bizning birinchi yo‘lovchimiz!» deb quvondi Zara.",
      "Kechqurun Zara osmondagi bulut kemaga qo‘l silkidi. U bugun uzoqqa bormadi, ammo birovga yordam berish ham katta sarguzasht ekanini bildi.",
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
    "Jasoratning rangi qanday?",
    "Kichkina kit Nuri chuqur dengizdan qo‘rqadi. Yangi do‘st va bir chimdim jasorat unga o‘z ovozini topishda yordam beradi.",
    "Tabiat",
    7,
    "Dengiz kashfiyotchisi",
    [
      "Nuri kichkina kit edi. U dengizning quyosh tushadigan qismida suzishni yaxshi ko‘rardi. Chuqur suv esa unga juda qorong‘i ko‘rinardi.",
      "Bir kuni marjonlar yonidan mayin qo‘shiq eshitildi. Nuri ovoz tomon suzdi va kichik dengiz toshbaqasi Marvaridni uchratdi.",
      "«Men uyimga qaytyapman», dedi Marvarid. «Yo‘lim chuqur suv yonidan o‘tadi. Birga suzamizmi?» Nuri biroz ikkilanib qoldi.",
      "«Qo‘rqayotganingni aytishing mumkin», dedi Marvarid. Nuri bosh irg‘adi. Ular shoshilmay, yonma-yon suzishga kelishib olishdi.",
      "Yo‘lda mayda baliqlar yaltirardi. Nuri avval ularni yulduzlar deb o‘yladi. «Qorong‘ida ham yorug‘lik bor ekan!» dedi u.",
      "Birdan dengiz oqimi kuchaydi. Marvarid tosh ortida to‘xtadi. Nuri ham sekin suzib, do‘stining yoniga bordi. Ular oqim pasayishini kutishdi.",
      "Ko‘p o‘tmay toshbaqaning uyi ko‘rindi. Marvarid rahmat aytdi. Nuri quvonchdan o‘zining birinchi uzun qo‘shig‘ini kuyladi.",
      "Nuri uyiga qaytdi. U endi har bir ishga shoshilmasligini bilardi. Jasorat qo‘rqmaslik emas, kerak bo‘lsa yordam so‘rab, kichik qadam tashlash ekan.",
    ],
    [
      question(
        "sea-1",
        "Nuri nimadan qo‘rqardi?",
        ["Chuqur suvdan", "Quyoshdan", "Marjondan"],
        0,
        "Chuqur suv Nuriga qorong‘i ko‘rinardi.",
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
        "Nuri nimani o‘rgandi?",
        [
          "Hech kimdan yordam so‘ramaslikni",
          "Doim shoshilishni",
          "Kichik qadam ham jasorat ekanini",
        ],
        2,
        "Nuri yordam so‘rash va kichik qadam tashlash ham jasoratligini bildi.",
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
