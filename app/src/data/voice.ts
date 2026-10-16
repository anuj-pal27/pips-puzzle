// What the narrator says at each stop of the Jalebi Express, in that stop's own language (STORY.md).
// The words on screen stay in English (levels.ts); this is the same story, spoken the way a friend there
// would say it, with a happy hello first. One cheerful female voice reads every language.
//
// After changing a line, run `npm run voice` (scripts/make-voice.ts) to make the audio again.
// Plain data, so the script can read it.

/** Sarvam's language codes. Rajasthan and the Hills have no voice of their own, so they use Hindi with local words. */
export type VoiceLang = 'hi-IN' | 'pa-IN' | 'gu-IN' | 'mr-IN' | 'ml-IN' | 'ta-IN' | 'bn-IN';

export type LevelVoice = {
  level: number;
  lang: VoiceLang;
  hello: string; // a happy greeting before the story card is read
  story: string[]; // the story card's lines (levels.ts `story`)
  yay: string; // a happy word before the finale line
  done: string; // levels.ts `done`
  gift: string; // levels.ts `gift`
};

export const LEVEL_VOICES: LevelVoice[] = [
  {
    level: 1,
    lang: 'hi-IN',
    hello: 'नमस्ते दोस्तों!',
    story: [
      'दिवाली आने वाली है, और जलेबी जंक्शन पर दोस्ती का मेला लगने वाला है!',
      'पिप को एक बढ़िया बात सूझी: चलो, भारत के हर कोने से एक दोस्त को बुलाते हैं!',
      'सब लोग जलेबियाँ बाँध लो! जलेबी एक्सप्रेस इंतज़ार कर रही है!',
    ],
    yay: 'चलो चलो!',
    done: 'सब लोग ट्रेन में बैठ जाओ!',
    gift: 'अगला स्टेशन: पंजाब के सुनहरे खेत!',
  },
  {
    level: 2,
    lang: 'pa-IN',
    hello: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ ਜੀ! ਬੱਲੇ ਬੱਲੇ!',
    story: [
      'ਛੁਕ ਛੁਕ! ਗੱਡੀ ਪੰਜਾਬ ਆ ਗਈ, ਜਿੱਥੇ ਸਰ੍ਹੋਂ ਦੇ ਪੀਲੇ-ਪੀਲੇ ਖੇਤ ਚਮਕ ਰਹੇ ਹਨ।',
      'ਢਮ, ਢਮ, ਢਮ! ਅੱਜ ਵਿਸਾਖੀ ਹੈ, ਫ਼ਸਲਾਂ ਦਾ ਤਿਉਹਾਰ!',
      'ਭੋਲੂ ਝੋਟਾ ਆਪਣਾ ਢੋਲ ਵਜਾ ਰਿਹਾ ਹੈ। ਆਓ, ਰਲ਼ ਕੇ ਭੰਗੜਾ ਪਾਈਏ!',
    ],
    yay: 'ਬੱਲੇ ਬੱਲੇ!',
    done: 'ਭੋਲੂ ਮੇਲੇ ਵਿੱਚ ਆ ਰਿਹਾ ਹੈ!',
    gift: 'ਉਹ ਨੱਚਣ ਲਈ ਆਪਣਾ ਢੋਲ ਲਿਆ ਰਿਹਾ ਹੈ!',
  },
  {
    level: 3,
    lang: 'hi-IN', // Hindi with Rajasthani greetings: "Khamma ghani! Padharo mhare des!"
    hello: 'खम्मा घणी! पधारो म्हारे देस!',
    story: [
      'रेत के टीलों के पार, ट्रेन राजस्थान के एक रंग-बिरंगे मेले में पहुँची।',
      'यहाँ कठपुतलियाँ हैं, गाना-बजाना है, और सजे-धजे ऊँट हैं!',
      'केसर ऊँटनी अपनी लंबी-लंबी पलकें झपका कर नमस्ते कर रही है।',
    ],
    yay: 'घणो चोखो!',
    done: 'केसर मेले में आ रही है!',
    gift: 'वह कठपुतली का खेल दिखाने के लिए कठपुतलियाँ ला रही है।',
  },
  {
    level: 4,
    lang: 'gu-IN',
    hello: 'કેમ છો, મિત્રો! ઉત્તરાયણની ખૂબ ખૂબ શુભેચ્છા!',
    story: [
      'ગુજરાતમાં ઉત્તરાયણ છે, અને આખું આકાશ પતંગોથી ભરાઈ ગયું છે!',
      'બધા ધાબા પર ચડ્યા છે, અને ફાફડા-જલેબી ખાઈ રહ્યા છે.',
      'રાજા સિંહ છેક ગીરના જંગલથી પતંગ ચગાવવા આવ્યો છે!',
    ],
    yay: 'કાઈ પો છે!',
    done: 'રાજા મેળામાં આવી રહ્યો છે!',
    gift: 'એ રંગબેરંગી પતંગો લઈને આવી રહ્યો છે!',
  },
  {
    level: 5,
    lang: 'mr-IN',
    hello: 'गणपती बाप्पा मोरया!',
    story: [
      'रिमझिम रिमझिम! समुद्राकाठच्या गजबजलेल्या मुंबईत पाऊस पडतोय.',
      'आज गणेश चतुर्थी आहे, आणि चिक्की उंदरीण गोड गोड मोदक बनवतेय.',
      'चला, छत्री घ्या आणि लोकल पकडा!',
    ],
    yay: 'मस्तच!',
    done: 'चिक्की मेळ्याला येतेय!',
    gift: 'ती मोदकांचा मोठ्ठा डबा घेऊन येतेय!',
  },
  {
    level: 6,
    lang: 'ml-IN',
    hello: 'നമസ്കാരം! എല്ലാവർക്കും ഓണാശംസകൾ!',
    story: [
      'തെങ്ങിൻതോപ്പുകളും ശാന്തമായ കായലുകളും കടന്ന് ട്രെയിൻ കേരളത്തിൽ എത്തി.',
      'ഓണം വന്നേ! വീടുകളിലെല്ലാം പൂക്കളം ഒരുക്കുകയാണ്.',
      'അപ്പു ആന വള്ളംകളി കണ്ട് ആർപ്പുവിളിക്കുകയാണ്!',
    ],
    yay: 'അടിപൊളി!',
    done: 'അപ്പു മേളയ്ക്ക് വരുന്നുണ്ട്!',
    gift: 'പൂക്കളമിടാൻ അവൻ പൂക്കളുമായി വരുന്നു!',
  },
  {
    level: 7,
    lang: 'ta-IN',
    hello: 'வணக்கம் நண்பர்களே!',
    story: [
      'காலை வணக்கம், தமிழ்நாடு! சூரிய ஒளியில் கோயில் கோபுரங்கள் ஜொலிக்கின்றன.',
      'இன்று பொங்கல்! பானையில் பொங்கல் பொங்கி வழிகிறது. பொங்கலோ பொங்கல்!',
      'நம் நண்பன் மயில், வாசலில் அழகான கோலம் போட்டிருக்கிறான்.',
    ],
    yay: 'ஹைய்யா!',
    done: 'மயில் திருவிழாவுக்கு வருகிறான்!',
    gift: 'எல்லோருக்கும் இனிப்பான கரும்பு கொண்டு வருகிறான்!',
  },
  {
    level: 8,
    lang: 'bn-IN',
    hello: 'নমস্কার বন্ধুরা! শুভ পুজো!',
    story: [
      'ঝিক ঝিক! ট্রেন বিশাল হাওড়া ব্রিজ পেরিয়ে কলকাতায় এসে পৌঁছল।',
      'এখন দুর্গাপুজো, আর গোটা শহর আলোয় সেজে উঠেছে!',
      'আমাদের বাঘা এসেছে সুন্দরবন থেকে। ও একটু লাজুক, তাই ওকে হাসিমুখে হ্যালো বলো!',
    ],
    yay: 'দারুণ!',
    done: 'বাঘা মেলায় আসছে!',
    gift: 'ও আনছে এক হাঁড়ি নরম তুলতুলে রসগোল্লা!',
  },
  {
    level: 9,
    lang: 'hi-IN', // Hindi with Nepali words, as spoken in Darjeeling and Sikkim: "Namaste saathiharu! Pahadma swagat chha!"
    hello: 'नमस्ते साथीहरू! पहाडमा स्वागत छ!',
    story: [
      'छुक छुक, छुक छुक! एक छोटी-सी टॉय ट्रेन पहाड़ों पर चढ़ रही है।',
      'यहाँ चाय के बागान हैं, बर्फ़ीले पहाड़ हैं, और रुई जैसे बादल हैं।',
      'मोमो लाल पांडा चोटी पर मोमोज़ की टोकरी लेकर इंतज़ार कर रही है।',
    ],
    yay: 'धेरै राम्रो!',
    done: 'मोमो मेले में आ रही है!',
    gift: 'वह गरमा-गरम मोमोज़ ला रही है!',
  },
  {
    level: 10,
    lang: 'hi-IN',
    hello: 'शुभ दीपावली!',
    story: [
      'जलेबी एक्सप्रेस घर लौट आई, ठीक दिवाली पर!',
      'सारे नए दोस्त यहाँ हैं, और हर दोस्त कोई तोहफ़ा लाया है।',
      'दीये जलाओ! दोस्ती का मेला शुरू होने वाला है!',
    ],
    yay: 'वाह वाह!',
    done: 'दिवाली की ढेर सारी शुभकामनाएँ!',
    gift: 'हर दोस्त, बड़ी तस्वीर का एक टुकड़ा है।',
  },
];

/** One audio file each: the story card ('story-2') and the level's finale ('done-2'). */
export type VoiceClip = `story-${number}` | `done-${number}`;

/** The words read in each clip. */
export function voiceScripts(): { clip: VoiceClip; lang: VoiceLang; text: string }[] {
  return LEVEL_VOICES.flatMap((v) => [
    { clip: `story-${v.level}` as const, lang: v.lang, text: [v.hello, ...v.story].join(' ') },
    { clip: `done-${v.level}` as const, lang: v.lang, text: [v.yay, v.done, v.gift].join(' ') },
  ]);
}
