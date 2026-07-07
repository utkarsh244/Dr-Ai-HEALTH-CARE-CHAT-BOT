import React, { createContext, useContext, useState, useEffect } from "react";

const LanguageContext = createContext();

export function useLanguage() {
  return useContext(LanguageContext);
}

// ── Supported languages ────────────────────────────────────────────────────────
export const LANGUAGES = [
  { code: "en", name: "English",            flag: "🇺🇸" },
  { code: "hi", name: "हिंदी",              flag: "🇮🇳" },
  { code: "es", name: "Español",            flag: "🇪🇸" },
  { code: "fr", name: "Français",           flag: "🇫🇷" },
  { code: "de", name: "Deutsch",            flag: "🇩🇪" },
  { code: "ar", name: "العربية",            flag: "🇸🇦" },
  { code: "ru", name: "Русский",            flag: "🇷🇺" },
  { code: "ja", name: "日本語",              flag: "🇯🇵" },
  { code: "ko", name: "한국어",              flag: "🇰🇷" },
  { code: "zh-cn", name: "中文 (简体)",      flag: "🇨🇳" },
  { code: "pt", name: "Português",          flag: "🇧🇷" },
  { code: "bn", name: "বাংলা",              flag: "🇧🇩" },
  { code: "mr", name: "मराठी",              flag: "🇮🇳" },
  { code: "ta", name: "தமிழ்",              flag: "🇮🇳" },
  { code: "te", name: "తెలుగు",             flag: "🇮🇳" },
  { code: "gu", name: "ગુજરાતી",            flag: "🇮🇳" },
];

// ── UI Translations ────────────────────────────────────────────────────────────
export const UI_STRINGS = {
  en: {
    appTitle:         "Dr.AI",
    welcome:          "Welcome to Dr.AI",
    welcomeSub:       "Your AI healthcare companion. Share your symptoms or health concerns to get started.",
    consultation:     "Healthcare Consultation",
    placeholder:      "Ask anything...",
    you:              "You",
    doctor:           "Dr.AI",
    system:           "System",
    analyzing:        "Dr.AI is analyzing...",
    audioReady:       "Audio ready",
    imageReady:       "Image ready",
    signOut:          "Sign Out",
    newChat:          "New consultation",
    searchPlaceholder:"Search conversations...",
    noResults:        "No results found",
    tryKeyword:       "Try a different keyword",
    noConversations:  "No conversations yet",
    startNew:         "Start a new consultation",
    export:           "Export",
    selectLanguage:   "Language",
  },
  hi: {
    appTitle:         "Dr.AI",
    welcome:          "Dr.AI में आपका स्वागत है",
    welcomeSub:       "आपका AI स्वास्थ्य साथी। शुरू करने के लिए अपने लक्षण या स्वास्थ्य संबंधी चिंताएं साझा करें।",
    consultation:     "स्वास्थ्य परामर्श",
    placeholder:      "कुछ भी पूछें...",
    you:              "आप",
    doctor:           "Dr.AI",
    system:           "सिस्टम",
    analyzing:        "Dr.AI विश्लेषण कर रहा है...",
    audioReady:       "ऑडियो तैयार है",
    imageReady:       "छवि तैयार है",
    signOut:          "साइन आउट",
    newChat:          "नई परामर्श",
    searchPlaceholder:"बातचीत खोजें...",
    noResults:        "कोई परिणाम नहीं मिला",
    tryKeyword:       "कोई और कीवर्ड आज़माएं",
    noConversations:  "अभी तक कोई बातचीत नहीं",
    startNew:         "नई परामर्श शुरू करें",
    export:           "निर्यात",
    selectLanguage:   "भाषा",
  },
  es: {
    appTitle:         "Dr.AI",
    welcome:          "Bienvenido a Dr.AI",
    welcomeSub:       "Tu compañero de salud con IA. Comparte tus síntomas para comenzar.",
    consultation:     "Consulta Médica",
    placeholder:      "Pregunta lo que quieras...",
    you:              "Tú",
    doctor:           "Dr.AI",
    system:           "Sistema",
    analyzing:        "Dr.AI está analizando...",
    audioReady:       "Audio listo",
    imageReady:       "Imagen lista",
    signOut:          "Cerrar sesión",
    newChat:          "Nueva consulta",
    searchPlaceholder:"Buscar conversaciones...",
    noResults:        "No se encontraron resultados",
    tryKeyword:       "Prueba otra palabra clave",
    noConversations:  "Aún no hay conversaciones",
    startNew:         "Iniciar una nueva consulta",
    export:           "Exportar",
    selectLanguage:   "Idioma",
  },
  fr: {
    appTitle:         "Dr.AI",
    welcome:          "Bienvenue sur Dr.AI",
    welcomeSub:       "Votre compagnon de santé IA. Partagez vos symptômes pour commencer.",
    consultation:     "Consultation Médicale",
    placeholder:      "Posez n'importe quelle question...",
    you:              "Vous",
    doctor:           "Dr.AI",
    system:           "Système",
    analyzing:        "Dr.AI analyse...",
    audioReady:       "Audio prêt",
    imageReady:       "Image prête",
    signOut:          "Se déconnecter",
    newChat:          "Nouvelle consultation",
    searchPlaceholder:"Rechercher des conversations...",
    noResults:        "Aucun résultat trouvé",
    tryKeyword:       "Essayez un autre mot-clé",
    noConversations:  "Pas encore de conversations",
    startNew:         "Commencer une nouvelle consultation",
    export:           "Exporter",
    selectLanguage:   "Langue",
  },
  de: {
    appTitle:         "Dr.AI",
    welcome:          "Willkommen bei Dr.AI",
    welcomeSub:       "Ihr KI-Gesundheitsbegleiter. Teilen Sie Ihre Symptome, um zu beginnen.",
    consultation:     "Medizinische Beratung",
    placeholder:      "Stellen Sie eine Frage...",
    you:              "Sie",
    doctor:           "Dr.AI",
    system:           "System",
    analyzing:        "Dr.AI analysiert...",
    audioReady:       "Audio bereit",
    imageReady:       "Bild bereit",
    signOut:          "Abmelden",
    newChat:          "Neue Beratung",
    searchPlaceholder:"Gespräche suchen...",
    noResults:        "Keine Ergebnisse gefunden",
    tryKeyword:       "Versuchen Sie ein anderes Stichwort",
    noConversations:  "Noch keine Gespräche",
    startNew:         "Neue Beratung starten",
    export:           "Exportieren",
    selectLanguage:   "Sprache",
  },
  ar: {
    appTitle:         "Dr.AI",
    welcome:          "مرحباً بك في Dr.AI",
    welcomeSub:       "رفيقك الصحي بالذكاء الاصطناعي. شارك أعراضك للبدء.",
    consultation:     "استشارة طبية",
    placeholder:      "اسأل أي شيء...",
    you:              "أنت",
    doctor:           "Dr.AI",
    system:           "النظام",
    analyzing:        "Dr.AI يحلل...",
    audioReady:       "الصوت جاهز",
    imageReady:       "الصورة جاهزة",
    signOut:          "تسجيل الخروج",
    newChat:          "استشارة جديدة",
    searchPlaceholder:"البحث في المحادثات...",
    noResults:        "لا توجد نتائج",
    tryKeyword:       "جرب كلمة مفتاحية مختلفة",
    noConversations:  "لا توجد محادثات بعد",
    startNew:         "ابدأ استشارة جديدة",
    export:           "تصدير",
    selectLanguage:   "اللغة",
  },
  ru: {
    appTitle:         "Dr.AI",
    welcome:          "Добро пожаловать в Dr.AI",
    welcomeSub:       "Ваш ИИ-помощник по здоровью. Поделитесь симптомами, чтобы начать.",
    consultation:     "Медицинская консультация",
    placeholder:      "Задайте любой вопрос...",
    you:              "Вы",
    doctor:           "Dr.AI",
    system:           "Система",
    analyzing:        "Dr.AI анализирует...",
    audioReady:       "Аудио готово",
    imageReady:       "Изображение готово",
    signOut:          "Выйти",
    newChat:          "Новая консультация",
    searchPlaceholder:"Поиск разговоров...",
    noResults:        "Результаты не найдены",
    tryKeyword:       "Попробуйте другое ключевое слово",
    noConversations:  "Пока нет разговоров",
    startNew:         "Начать новую консультацию",
    export:           "Экспорт",
    selectLanguage:   "Язык",
  },
  // Fallback for other languages — use English
};

// Get strings for a language code, fallback to English
export function getStrings(langCode) {
  return UI_STRINGS[langCode] || UI_STRINGS["en"];
}

// ── Language Provider ──────────────────────────────────────────────────────────
export function LanguageProvider({ children }) {
  const [uiLanguage, setUiLanguage] = useState(() => {
    return localStorage.getItem("draiLanguage") || "en";
  });

  useEffect(() => {
    localStorage.setItem("draiLanguage", uiLanguage);
    // Set text direction for Arabic
    document.documentElement.setAttribute("dir", uiLanguage === "ar" ? "rtl" : "ltr");
  }, [uiLanguage]);

  const strings = getStrings(uiLanguage);

  return (
    <LanguageContext.Provider value={{ uiLanguage, setUiLanguage, strings, LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}
