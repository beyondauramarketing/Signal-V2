import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      nav: {
        product: "Product",
        howItWorks: "How it works",
        analyzeMessage: "Analyze message",
        history: "History",
        notifications: "Notifications",
        settings: "Settings",
        signIn: "Sign In",
        profile: "Profile / Sign In",
        toggleLanguage: "Switch to Hindi"
      },
      landing: {
        heroTitle: "Understand the pressure in a message.",
        heroSubtitle: "Paste a message to spot red flags, understand what feels off, and get a safer reply you can actually send. Protect your boundaries without the usual anxiety.",
        analyzeButton: "Analyze a message",
        exampleButton: "Try an example",
        privacyNote: "Private by default. No login required.",
        exampleAnalysis: "Example analysis",
        riskLevel: "Risk level",
        whyItFeelsOff: "Why it feels off",
        suggestedReply: "Suggested reply",
        whereItHelps: "Where it helps",
        whereItHelpsSubtitle: "Useful for work, housing, buying, selling, and personal conversations.",
        useCases: {
          recruiter: "Recruiter offers",
          landlord: "Landlord requests",
          freelance: "Freelance client terms",
          marketplace: "Marketplace listings",
          personal: "Personal agreements"
        },
        howItWorks: "How it works",
        howItWorksSubtitle: "Paste the message, review the signals, and choose a reply that protects your boundaries.",
        steps: {
          oneTitle: "Paste the message",
          oneDesc: "Add a message, email, or chat that feels pushy, unclear, or off.",
          twoTitle: "Review the signals",
          twoDesc: "See the pressure points, quoted evidence, and overall risk level.",
          threeTitle: "Use a safer reply",
          threeDesc: "Start with a calmer draft and adjust the tone to fit the situation."
        },
        whatYouGet: "What you get",
        whatYouGetSubtitle: "Designed to bring objective clarity and confidence to uncomfortable digital threads.",
        features: {
          risk: "Risk level",
          riskDesc: "A calculated score from 0 to 100 identifying the intensity of the pressure.",
          whyOff: "Why it feels off",
          whyOffDesc: "An explanation of the underlying communication tricks or emotional traps.",
          evidence: "Quoted evidence",
          evidenceDesc: "Specific highlighted text showing exactly where pressure is applied.",
          reply: "Suggested reply",
          replyDesc: "Multiple tone options to reply firmly and clearly without escalating friction."
        },
        finalCtaTitle: "See what the message is really asking from you.",
        finalCtaSubtitle: "Get a clearer read on pressure, boundaries, and reply options in a few seconds.",
        footerDescription: "Private message analysis with explainable feedback.",
        footerNote: "Results are guidance, not professional advice. Suggestions represent communication recommendations; always make final judgments on transactions and contracts yourself. All content is processed securely and is never stored on a server."
      }
    }
  },
  hi: {
    translation: {
      nav: {
        product: "उत्पाद",
        howItWorks: "यह कैसे काम करता है",
        analyzeMessage: "संदेश का विश्लेषण करें",
        history: "इतिहास",
        notifications: "सूचनाएँ",
        settings: "सेटिंग्स",
        signIn: "साइन इन",
        profile: "प्रोफ़ाइल / साइन इन",
        toggleLanguage: "अंग्रेज़ी पर स्विच करें"
      },
      landing: {
        heroTitle: "एक संदेश में दबाव को समझें।",
        heroSubtitle: "एक संदेश चिपकाएँ ताकि लाल झंडे दिखें, महसूस हो रहा है क्या गलत है, और ऐसा सुरक्षित जवाब मिले जिसे आप वास्तव में भेज सकें। अपनी सीमाओं की रक्षा करें बिना आम चिंता के।",
        analyzeButton: "एक संदेश का विश्लेषण करें",
        exampleButton: "एक उदाहरण आज़माएँ",
        privacyNote: "डिफ़ॉल्ट रूप से निजी। कोई लॉगिन आवश्यक नहीं।",
        exampleAnalysis: "उदाहरण विश्लेषण",
        riskLevel: "जोखिम स्तर",
        whyItFeelsOff: "यह क्यों गलत लगता है",
        suggestedReply: "सुझावित उत्तर",
        whereItHelps: "यह कहाँ मदद करता है",
        whereItHelpsSubtitle: "काम, मकान, खरीद-बिक्री और व्यक्तिगत वार्तालापों के लिए उपयोगी।",
        useCases: {
          recruiter: "रिक्रूटर ऑफ़र",
          landlord: "मकान मालिक की मांगें",
          freelance: "फ़्रीलांस ग्राहक की शर्तें",
          marketplace: "मार्केटप्लेस लिस्टिंग",
          personal: "व्यक्तिगत सहमति"
        },
        howItWorks: "यह कैसे काम करता है",
        howItWorksSubtitle: "संदेश डालें, संकेतों की समीक्षा करें, और एक ऐसा जवाब चुनें जो आपकी सीमाओं की रक्षा करे।",
        steps: {
          oneTitle: "संदेश डालें",
          oneDesc: "एक ऐसा संदेश, ईमेल या चैट जोड़ें जो दबावपूर्ण, अस्पष्ट या असहज लगे।",
          twoTitle: "संकेतों की समीक्षा करें",
          twoDesc: "दबाव के बिंदुओं, उद्धृत साक्ष्य और कुल जोखिम स्तर को देखें।",
          threeTitle: "एक सुरक्षित उत्तर का उपयोग करें",
          threeDesc: "एक शांत प्रारूप से शुरू करें और स्थिति के अनुसार स्वर समायोजित करें।"
        },
        whatYouGet: "आपको क्या मिलता है",
        whatYouGetSubtitle: "असुविधाजनक डिजिटल थ्रेड्स पर वस्तुनिष्ठ स्पष्टता और आत्मविश्वास लाने के लिए डिज़ाइन किया गया।",
        features: {
          risk: "जोखिम स्तर",
          riskDesc: "0 से 100 तक का एक गणना किया गया स्कोर, जो दबाव की तीव्रता को पहचानता है।",
          whyOff: "यह क्यों गलत लगता है",
          whyOffDesc: "संचार की अंतर्निहित चालों या भावनात्मक जालों की व्याख्या।",
          evidence: "उद्धृत साक्ष्य",
          evidenceDesc: "विशिष्ट हाइलाइट किया गया पाठ जिससे यह स्पष्ट हो जाता है कि दबाव कहाँ लगाया जा रहा है।",
          reply: "सुझावित उत्तर",
          replyDesc: "कठोर और स्पष्ट रूप से उत्तर देने के लिए कई स्वर विकल्प।"
        },
        finalCtaTitle: "देखें कि संदेश आपसे वास्तव में क्या मांग रहा है।",
        finalCtaSubtitle: "कुछ ही सेकंड में दबाव, सीमाओं और उत्तर विकल्पों पर स्पष्ट पढ़ाई प्राप्त करें।",
        footerDescription: "व्याख्यायित प्रतिक्रिया के साथ निजी संदेश विश्लेषण।",
        footerNote: "परिणाम मार्गदर्शन हैं, पेशेवर सलाह नहीं। सुझाव संचार सिफ़ारिशें हैं; लेनदेन और अनुबंधों पर अंतिम निर्णय आप स्वयं करें। सभी सामग्री सुरक्षित रूप से संसाधित होती है और सर्वर पर कभी संग्रहीत नहीं की जाती।"
      }
    }
  }
};

const savedLanguage = typeof window !== "undefined" ? window.localStorage.getItem("dogesh-language") : null;
const browserLanguage = typeof navigator !== "undefined" ? navigator.language.split("-")[0] : "en";
const initialLanguage = savedLanguage || (browserLanguage === "hi" ? "hi" : "en");

i18n.use(initReactI18next).init({
  resources,
  lng: initialLanguage,
  fallbackLng: "en",
  interpolation: {
    escapeValue: false
  },
  supportedLngs: ["en", "hi"]
});

i18n.on("languageChanged", (lng) => {
  if (typeof document !== "undefined") {
    document.documentElement.lang = lng;
  }
  if (typeof window !== "undefined") {
    window.localStorage.setItem("dogesh-language", lng);
  }
});

export default i18n;
