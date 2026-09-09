import { useState, useRef, useEffect } from 'react';

// ============================================================
// 💾 LOCAL STORAGE
// ============================================================
const STORAGE_KEY = 'talkapulse_progress';

const defaultData = {
  onboardingCompleted: false,
  language: 'Английский',
  level: 'A1 — Начинающий',
  goal: '10 минут в день',
  interfaceLang: 'ru',
  xp: 0,
  currentStreak: 0,
  bestStreak: 0,
  lastPracticeDate: null,
  completedGrammarUnits: [],
  savedPhrases: [],
  notifEnabled: true,
};

const loadData = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...defaultData, ...JSON.parse(saved) } : defaultData;
  } catch { return defaultData; }
};

const saveData = (data) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) {}
};

// ============================================================
//  ЗВУКИ
// ============================================================
let audioContext = null;
const initAudio = () => {
  if (!audioContext) {
    try { audioContext = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
  }
  return audioContext;
};

const playSound = (type) => {
  const ctx = initAudio();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  if (type === 'correct') {
    osc.frequency.value = 880; osc.type = 'sine';
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.3);
  } else if (type === 'wrong') {
    osc.frequency.value = 220; osc.type = 'sawtooth';
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.4);
  } else if (type === 'flip') {
    osc.frequency.value = 600; osc.type = 'sine';
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.1);
  } else if (type === 'complete') {
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = freq; o.type = 'sine';
      g.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.15);
      g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.15 + 0.3);
      o.start(ctx.currentTime + i * 0.15); o.stop(ctx.currentTime + i * 0.15 + 0.3);
    });
  } else if (type === 'achievement') {
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = freq; o.type = 'sine';
      g.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.1);
      g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.2);
      o.start(ctx.currentTime + i * 0.1); o.stop(ctx.currentTime + i * 0.1 + 0.2);
    });
  }
};

// ============================================================
// 🎊 КОНФЕТТИ
// ============================================================
const Confetti = ({ active }) => {
  if (!active) return null;
  const colors = ['#1CB0F6', '#A855F7', '#EC4899', '#FF8C42', '#22C55E', '#FBBF24'];
  const pieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    color: colors[Math.floor(Math.random() * colors.length)],
    delay: Math.random() * 2,
    size: Math.random() * 10 + 5,
  }));
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {pieces.map(piece => (
        <div key={piece.id} className="confetti" style={{
          left: `${piece.left}%`,
          backgroundColor: piece.color,
          width: `${piece.size}px`,
          height: `${piece.size}px`,
          animationDelay: `${piece.delay}s`,
        }} />
      ))}
    </div>
  );
};

// ============================================================
// 🎨 ИКОНКИ
// ============================================================
const Icon = ({ d, active }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${active ? 'text-duo-blue' : 'text-duo-gray'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
  </svg>
);
const BackIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);
const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

// ============================================================
// 🌐 ПЕРЕВОДЫ
// ============================================================
const T = {
  ru: {
    home: 'Главная', practice: 'Практика', clubs: 'Клубы', progress: 'Прогресс', profile: 'Профиль',
    aiChat: 'AI-разговор', aiChatSub: 'Практика на изучаемом языке',
    startPractice: 'Начать практику', startPracticeSub: 'Карточки и грамматика',
    findClub: 'Найти клуб', findClubSub: 'Онлайн и офлайн встречи',
    hi: 'Привет', streak: 'дней подряд', aiEnd: 'Завершить',
    aiType: 'Напишите что угодно на изучаемом языке...',
    decks: 'Колоды карточек', cards: 'карточек', exercises: 'Упражнения',
    listening: 'Аудирование', speaking: 'Говорение', grammar: 'Грамматика', writing: 'Письмо',
    begin: 'Начать', startBtn: 'Старт', soon: 'Скоро',
    clubsTitle: 'Клубы', clubsSub: 'Живые сессии для практики', filterLevel: 'Уровень', filterWhen: 'Когда',
    all: 'Все', today: 'Сегодня', tomorrow: 'Завтра', thisWeek: 'Эта неделя',
    noClubs: 'Клубов сейчас нет', noClubsSub: 'Новые сессии добавляются каждый день.',
    host: 'Ведущий', timeLocal: 'Время (ваше)', place: 'Место', participants: 'Участников',
    joinOnline: 'Присоединиться', joinOffline: 'Записаться', remind: 'Напоминание',
    backToList: 'К списку клубов', online: '🌐 Онлайн', offline: '📍 Офлайн',
    more: 'Подробнее', people: 'участников',
    badges: 'Значки', streaks: 'Серии', share: 'Поделиться',
    badgesTitle: 'Значки', badgesSub: 'Ваши достижения', earned: 'Получены', inProgress: 'В процессе', locked: 'Заблокированы',
    earnedOn: 'Получен', progressLabel: 'Прогресс',
    streaksTitle: 'Серии', streaksSub: 'Регулярность обучения', currentStreak: 'Текущая серия', bestStreak: 'Лучшая серия',
    streakTip: 'Занимайтесь хотя бы 5 минут в день.', days: 'дней', practiced: 'Занятие', missed: 'Пропуск', todayLabel: 'Сегодня',
    shareTitle: 'Поделиться', shareSub: 'Выберите карточку', shareBtn: 'Поделиться', copied: 'Скопировано!',
    profileTitle: 'Профиль', xp: 'XP', settings: 'Настройки', pushNotif: 'Push-уведомления',
    interfaceLang: 'Язык интерфейса', support: 'Поддержка', supportSub: 'Есть вопрос? Напишите нам.',
    yourMessage: 'Ваше сообщение...', send: 'Отправить', sent: 'Отправлено!',
    deleteAccount: 'Удалить аккаунт', deleteWarning: 'Необратимо. Все данные будут удалены.',
    deleteConfirm: 'Удалить аккаунт?', deleteYes: 'Да, удалить', cancel: 'Отмена',
    sessionDone: 'Занятие завершено!', greatJob: 'Отличная работа',
    reviewed: 'Просмотрено', accuracy: 'Точность', timeSpent: 'Время',
    done: 'Готово', practiceMore: 'Ещё раз', tapToSee: 'Нажмите для ответа',
    again: 'Снова', good: 'Хорошо', easy: 'Легко', min: 'мин',
    welcome: 'Учите язык за минуты в день', welcomeSub: 'Короткие занятия, живые клубы, понятный прогресс.',
    start: 'Начать', haveAccount: 'Уже есть аккаунт', skip: 'Пропустить',
    whatLearn: 'Что учим?', lang: 'Язык', level: 'Уровень',
    cont: 'Продолжить', goalTitle: 'Ежедневная цель', goalSub: 'Персонализируем план.',
    firstCards: 'Первые карточки', firstCardsSub: '3 карточки для начала.',
    startNow: 'Начать', greatStart: 'Отлично!', greatStartSub: 'Первая сессия завершена.',
    goHome: 'На главную', exploreClubs: 'Клубы',
    liveClubs: 'Клубы сегодня', sessionsToday: '2 сессии вашего уровня', viewClubs: 'Смотреть',
    resetProgress: 'Сбросить прогресс', resetConfirm: 'Удалить весь прогресс?',
    savedPhrases: 'Сохранённые фразы', noSavedPhrases: 'Пока нет сохранённых фраз',
    removePhrase: 'Удалить',
  },
  en: {
    home: 'Home', practice: 'Practice', clubs: 'Clubs', progress: 'Progress', profile: 'Profile',
    aiChat: 'AI Chat', aiChatSub: 'Practice in target language',
    startPractice: 'Start practice', startPracticeSub: 'Flashcards & grammar',
    findClub: 'Find a club', findClubSub: 'Online & offline events',
    hi: 'Hi', streak: 'day streak', aiEnd: 'End',
    aiType: 'Type anything in the target language...',
    decks: 'Decks', cards: 'cards', exercises: 'Exercises',
    listening: 'Listening', speaking: 'Speaking', grammar: 'Grammar', writing: 'Writing',
    begin: 'Start', startBtn: 'Start', soon: 'Soon',
    clubsTitle: 'Clubs', clubsSub: 'Live sessions', filterLevel: 'Level', filterWhen: 'When',
    all: 'All', today: 'Today', tomorrow: 'Tomorrow', thisWeek: 'This week',
    noClubs: 'No clubs now', noClubsSub: 'New sessions added daily.',
    host: 'Host', timeLocal: 'Time', place: 'Location', participants: 'People',
    joinOnline: 'Join', joinOffline: 'Sign up', remind: 'Remind',
    backToList: 'Back', online: ' Online', offline: '📍 Offline',
    more: 'Details', people: 'people',
    badges: 'Badges', streaks: 'Streaks', share: 'Share',
    badgesTitle: 'Badges', badgesSub: 'Achievements', earned: 'Earned', inProgress: 'In progress', locked: 'Locked',
    earnedOn: 'Earned', progressLabel: 'Progress',
    streaksTitle: 'Streaks', streaksSub: 'Consistency', currentStreak: 'Current', bestStreak: 'Best',
    streakTip: 'Practice 5+ min daily.', days: 'days', practiced: 'Done', missed: 'Missed', todayLabel: 'Today',
    shareTitle: 'Share', shareSub: 'Pick a card', shareBtn: 'Share', copied: 'Copied!',
    profileTitle: 'Profile', xp: 'XP', settings: 'Settings', pushNotif: 'Push notifications',
    interfaceLang: 'Language', support: 'Support', supportSub: 'Questions? Write to us.',
    yourMessage: 'Your message...', send: 'Send', sent: 'Sent!',
    deleteAccount: 'Delete account', deleteWarning: 'Irreversible. All data deleted.',
    deleteConfirm: 'Delete account?', deleteYes: 'Yes, delete', cancel: 'Cancel',
    sessionDone: 'Done!', greatJob: 'Great job',
    reviewed: 'Reviewed', accuracy: 'Accuracy', timeSpent: 'Time',
    done: 'Done', practiceMore: 'Again', tapToSee: 'Tap for answer',
    again: 'Again', good: 'Good', easy: 'Easy', min: 'min',
    welcome: 'Learn a language in minutes', welcomeSub: 'Short practice, live clubs, clear progress.',
    start: 'Get started', haveAccount: 'Have an account', skip: 'Skip',
    whatLearn: 'What to learn?', lang: 'Language', level: 'Level',
    cont: 'Continue', goalTitle: 'Daily goal', goalSub: 'Personalize your plan.',
    firstCards: 'First flashcards', firstCardsSub: '3 cards to start.',
    startNow: 'Start', greatStart: 'Great!', greatStartSub: 'First session done.',
    goHome: 'Go home', exploreClubs: 'Clubs',
    liveClubs: 'Clubs today', sessionsToday: '2 sessions at your level', viewClubs: 'View',
    resetProgress: 'Reset progress', resetConfirm: 'Delete all progress?',
    savedPhrases: 'Saved phrases', noSavedPhrases: 'No saved phrases yet',
    removePhrase: 'Remove',
  }
};

const LEVELS = ['A1 — Начинающий','A2 — Элементарный','B1 — Средний','B2 — Выше среднего','C1 — Продвинутый','C2 — Владение'];
const LEVELS_EN = ['A1 — Beginner','A2 — Elementary','B1 — Intermediate','B2 — Upper-Int','C1 — Advanced','C2 — Proficiency'];

// ============================================================
// 🤖 GROQ AI
// ============================================================
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'qwen-2.5-32b';

const getSystemPrompt = (targetLanguage, level) => {
  const langNames = {'Английский':'English','Испанский':'Spanish','Греческий':'Greek'};
  const targetLang = langNames[targetLanguage] || 'English';
  return `You are a friendly, patient language tutor helping a ${level} learner practice ${targetLang}.

CRITICAL RULES:
1. Respond ONLY in ${targetLang}. NEVER use Russian or any other language.
2. Keep responses SHORT: 1-2 sentences maximum.
3. Use vocabulary and grammar appropriate for ${level} level.
4. Ask ONE simple follow-up question to continue the conversation.
5. If the learner makes a mistake, gently correct it ONCE in parentheses.
6. Be encouraging but not overly enthusiastic.
7. If the learner writes in Russian, gently remind them (in ${targetLang}) to try in the target language.
8. For greetings, respond warmly. For goodbyes, respond briefly.
9. NEVER say "As an AI..." — just be a natural conversation partner.
10. Focus on practical, everyday situations.

EXAMPLE GOOD RESPONSES:
- "Hello! How are you today?"
- "I would like a coffee, please. (Perfect phrase!) What size would you like?"

EXAMPLE BAD RESPONSES (DO NOT DO THIS):
- Long paragraphs explaining grammar
- Using complex vocabulary above ${level} level
- Responding in Russian
- Multiple questions at once
- Saying "As an AI language model..."`;
};

const callGroqAI = async (messages, targetLanguage, level) => {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) return getFallbackResponse(targetLanguage);
  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: 'system', content: getSystemPrompt(targetLanguage, level) }, ...messages],
        temperature: 0.3,
        max_tokens: 150
      })
    });
    if (!response.ok) return getFallbackResponse(targetLanguage);
    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    return getFallbackResponse(targetLanguage);
  }
};

const getFallbackResponse = (targetLanguage) => {
  const fallbacks = {
    'Английский': ['Hello! How are you today?', 'That\'s interesting! Tell me more.'],
    'Испанский': ['¡Hola! ¿Cómo estás hoy?', '¡Interesante! Cuéntame más.'],
    'Греческий': ['Γεια σας! Πώς είστε σήμερα;', 'Ενδιαφέρον!']
  };
  const options = fallbacks[targetLanguage] || fallbacks['Английский'];
  return options[Math.floor(Math.random() * options.length)];
};

const levelBadge = (l) => l==='A1'?'badge-a1':l==='A2'?'badge-a2':l==='B1'?'badge-b1':l==='B2'?'badge-b2':l==='C1'?'badge-c1':'badge-c2';

// ============================================================
// 📚 ДАННЫЕ
// ============================================================
const decksData = {
  'Английский': [
    { id:'en-g', name:'Приветствия', level:'A1', cardsCount:25, cards:[
      {id:1,target:'Hello',translation:'Привет',example:'Hello, how are you?',exampleRu:'Привет, как дела?'},
      {id:2,target:'Good morning',translation:'Доброе утро',example:'Good morning!',exampleRu:'Доброе утро!'},
      {id:3,target:'Thank you',translation:'Спасибо',example:'Thank you!',exampleRu:'Спасибо!'}
    ]},
    { id:'en-f', name:'Еда и кафе', level:'A1', cardsCount:28, cards:[
      {id:1,target:'coffee',translation:'кофе',example:'A coffee, please.',exampleRu:'Кофе, пожалуйста.'},
      {id:2,target:'menu',translation:'меню',example:'Can I see the menu?',exampleRu:'Можно меню?'}
    ]},
  ],
  'Испанский': [
    { id:'es-g', name:'Приветствия', level:'A1', cardsCount:24, cards:[
      {id:1,target:'Hola',translation:'Привет',example:'Hola, ¿cómo estás?',exampleRu:'Привет, как дела?'},
      {id:2,target:'Gracias',translation:'Спасибо',example:'Muchas gracias.',exampleRu:'Большое спасибо.'}
    ]},
  ],
  'Греческий': [
    { id:'gr-g', name:'Приветствия', level:'A1', cardsCount:22, cards:[
      {id:1,target:'Γεια σου',translation:'Привет',example:'Γεια σου!',exampleRu:'Привет!'},
      {id:2,target:'Ευχαριστώ',translation:'Спасибо',example:'Ευχαριστώ πολύ.',exampleRu:'Большое спасибо.'}
    ]},
  ],
};

const clubsData = [
  { id:1, title:'Разговорный клуб', level:'A1', host:'Мария', format:'online', date:'Сегодня', dateEn:'Today', time:'19:00', desc:'Фразы для путешествий.', participants:8, city:null },
  { id:2, title:'Coffee & English', level:'A2', host:'Алексей', format:'offline', date:'Завтра', dateEn:'Tomorrow', time:'18:30', desc:'Встреча в кафе.', participants:6, city:'Москва' },
  { id:3, title:'Испанский A1', level:'A1', host:'Елена', format:'online', date:'Сегодня', dateEn:'Today', time:'20:00', desc:'Диалоги.', participants:12, city:null },
];

const badgesData = [
  { id:1, name:'Первый шаг', nameEn:'First Step', icon:'🌱', desc:'Первая сессия', descEn:'First session', status:'earned', earnedDate:'25 авг', progress:1, total:1 },
  { id:2, name:'7 дней', nameEn:'7-Day Streak', icon:'🔥', desc:'7 дней подряд', descEn:'7 days', status:'earned', earnedDate:'1 сент', progress:7, total:7 },
  { id:3, name:'100 карточек', nameEn:'100 Cards', icon:'📚', desc:'100 карточек', descEn:'100 cards', status:'progress', progress:67, total:100 },
  { id:4, name:'Мастер', nameEn:'Master', icon:'🎓', desc:'10 тем', descEn:'10 topics', status:'locked', progress:0, total:10 },
];

const grammarUnits = {
  'Английский': [
    { id:'en-ps', title:'Present Simple', titleEn:'Present Simple', level:'A1', desc:'Форма глагола.', descEn:'Verb forms.',
      questions:[
        {type:'multiple-choice',inst:'Выберите:',instEn:'Choose:',q:'I ___ coffee.',opts:['drink','drinks','drinking','am drink'],correct:0,expl:'I → базовая форма.',explEn:'I → base form.'},
        {type:'multiple-choice',inst:'Выберите:',instEn:'Choose:',q:'They ___ here.',opts:['lives','live','living','are live'],correct:1,expl:'They → без -s.',explEn:'They → no -s.'},
        {type:'fill-blank',inst:'Вставьте:',instEn:'Fill in:',q:'We ___ students.',answer:'are',hint:'to be',expl:'We → are.',explEn:'We → are.'},
        {type:'fill-blank',inst:'Вставьте:',instEn:'Fill in:',q:'You ___ kind.',answer:'are',hint:'to be',expl:'You → are.',explEn:'You → are.'},
        {type:'word-order',inst:'Составьте:',instEn:'Build:',words:['like','I','music'],correct:'I like music',expl:'S + V + O.',explEn:'S + V + O.'},
        {type:'word-order',inst:'Составьте:',instEn:'Build:',words:['every','work','They','day'],correct:'They work every day',expl:'Время в конце.',explEn:'Time at end.'},
      ]},
    { id:'en-art', title:'Артикли a/an/the', titleEn:'Articles', level:'A1', desc:'Правильный артикль.', descEn:'Correct article.',
      questions:[
        {type:'multiple-choice',inst:'Выберите:',instEn:'Choose:',q:'I have ___ apple.',opts:['a','an','the','—'],correct:1,expl:'Гласный → an.',explEn:'Vowel → an.'},
        {type:'multiple-choice',inst:'Выберите:',instEn:'Choose:',q:'She is ___ doctor.',opts:['a','an','the','—'],correct:0,expl:'Согласный → a.',explEn:'Consonant → a.'},
        {type:'fill-blank',inst:'Вставьте:',instEn:'Fill in:',q:'___ sun is hot.',answer:'the',hint:'уникальный',expl:'Одно солнце → the.',explEn:'One sun → the.'},
        {type:'fill-blank',inst:'Вставьте:',instEn:'Fill in:',q:'I live in ___ Moscow.',answer:'—',hint:'город',expl:'Города без артикля.',explEn:'Cities: no article.'},
        {type:'word-order',inst:'Составьте:',instEn:'Build:',words:['book','is','The','good'],correct:'The book is good',expl:'Конкретная → The.',explEn:'Specific → The.'},
        {type:'word-order',inst:'Составьте:',instEn:'Build:',words:['have','I','cat','a'],correct:'I have a cat',expl:'Неопределённый → a.',explEn:'Unspecified → a.'},
      ]},
  ],
  'Испанский': [
    { id:'es-se', title:'Ser vs Estar', titleEn:'Ser vs Estar', level:'A1', desc:'ser или estar?', descEn:'ser or estar?',
      questions:[
        {type:'multiple-choice',inst:'Выберите:',instEn:'Choose:',q:'Yo ___ estudiante.',opts:['soy','estoy','es','está'],correct:0,expl:'Профессия → ser.',explEn:'Profession → ser.'},
        {type:'multiple-choice',inst:'Выберите:',instEn:'Choose:',q:'Ella ___ cansada.',opts:['es','está','soy','estoy'],correct:1,expl:'Состояние → estar.',explEn:'State → estar.'},
        {type:'fill-blank',inst:'Вставьте:',instEn:'Fill in:',q:'Nosotros ___ de España.',answer:'somos',hint:'происхождение',expl:'Происхождение → ser.',explEn:'Origin → ser.'},
        {type:'fill-blank',inst:'Вставьте:',instEn:'Fill in:',q:'Tú ___ en Madrid.',answer:'estás',hint:'место',expl:'Место → estar.',explEn:'Location → estar.'},
        {type:'word-order',inst:'Составьте:',instEn:'Build:',words:['alto','es','Él'],correct:'Él es alto',expl:'Характеристика → ser.',explEn:'Trait → ser.'},
        {type:'word-order',inst:'Составьте:',instEn:'Build:',words:['contentos','estamos','Nosotros'],correct:'Nosotros estamos contentos',expl:'Эмоция → estar.',explEn:'Emotion → estar.'},
      ]},
  ],
  'Греческий': [
    { id:'gr-ei', title:'Είμαι', titleEn:'Είμαι', level:'A1', desc:'Спряжение είμαι.', descEn:'Conjugation.',
      questions:[
        {type:'multiple-choice',inst:'Выберите:',instEn:'Choose:',q:'Εγώ ___ φοιτητής.',opts:['είμαι','είσαι','είναι','είμαστε'],correct:0,expl:'Εγώ → είμαι.',explEn:'Εγώ → είμαι.'},
        {type:'multiple-choice',inst:'Выберите:',instEn:'Choose:',q:'Εσύ ___ καλά;',opts:['είμαι','είσαι','είναι','είστε'],correct:1,expl:'Εσύ → είσαι.',explEn:'Εσύ → είσαι.'},
        {type:'fill-blank',inst:'Вставьте:',instEn:'Fill in:',q:'Αυτός ___ δάσκαλος.',answer:'είναι',hint:'он',expl:'Αυτός → είναι.',explEn:'Αυτός → είναι.'},
        {type:'fill-blank',inst:'Вставьте:',instEn:'Fill in:',q:'Εμείς ___ φίλοι.',answer:'είμαστε',hint:'мы',expl:'Εμείς → είμαστε.',explEn:'Εμείς → είμαστε.'},
        {type:'word-order',inst:'Составьте:',instEn:'Build:',words:['από','Είμαι','Ρωσία','τη'],correct:'Είμαι από τη Ρωσία',expl:'S + είμαι + από.',explEn:'S + είμαι + από.'},
        {type:'word-order',inst:'Составьте:',instEn:'Build:',words:['Είσαι','καλός','πολύ'],correct:'Είσαι πολύ καλός',expl:'πολύ перед прил.',explEn:'πολύ before adj.'},
      ]},
  ]
};

const tabs = [
  {id:'home',d:'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'},
  {id:'practice',d:'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'},
  {id:'clubs',d:'M17 20h5v-2a3 3 0 00-5.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M15 7a3 3 0 11-6 0 3 3 0 016 0z'},
  {id:'progress',d:'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2'},
  {id:'profile',d:'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'},
];

function getCalendarDays(y,m,pd){
  const fd=new Date(y,m,1).getDay();
  const dim=new Date(y,m+1,0).getDate();
  const t=new Date();
  const d=[];
  const o=fd===0?6:fd-1;
  for(let i=0;i<o;i++) d.push({day:null,practiced:false,isToday:false});
  for(let i=1;i<=dim;i++) d.push({day:i,practiced:pd.includes(i),isToday:t.getFullYear()===y&&t.getMonth()===m&&t.getDate()===i});
  return d;
}
const MR=['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const ME=['January','February','March','April','May','June','July','August','September','October','November','December'];
const WR=['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
const WE=['Mo','Tu','We','Th','Fr','Sa','Su'];

// ============================================================
// 🎯 ГЛАВНЫЙ КОМПОНЕНТ
// ============================================================
function App() {
  const [data, setData] = useState(loadData());
  const [lang, setLang] = useState(data.interfaceLang);
  const t = (k) => T[lang][k] || k;
  
  const [onboardingStep, setOnboardingStep] = useState(data.onboardingCompleted ? 'home' : 'welcome');
  const [activeTab, setActiveTab] = useState('home');
  const [userProfile, setUserProfile] = useState({
    language: data.language,
    level: data.level,
    goal: data.goal,
  });
  
  const [session, setSession] = useState({isActive:false,deck:null,index:0,flipped:false,reviewed:0,correct:0,start:null,done:false});
  const [practiceView, setPracticeView] = useState('decks');
  const [clubsView, setClubsView] = useState('list');
  const [selectedClub, setSelectedClub] = useState(null);
  const [clubFL, setClubFL] = useState('Все');
  const [clubFT, setClubFT] = useState('Все');
  const [progressTab, setProgressTab] = useState('badges');
  const [badgeFilter, setBadgeFilter] = useState('all');
  const [sMsg, setSMsg] = useState('');
  const [sSent, setSSent] = useState(false);
  const [delModal, setDelModal] = useState(false);
  const [resetModal, setResetModal] = useState(false);
  const [ai, setAi] = useState({isActive:false,messages:[],score:0,isComplete:false});
  const [input, setInput] = useState('');
  const chatRef = useRef(null);
  const [gr, setGr] = useState({isActive:false,view:'units',unit:null,cQ:0,answers:[],sel:null,typed:'',built:[],fb:false,ok:null,done:data.completedGrammarUnits});
  const [showConfetti, setShowConfetti] = useState(false);

  // Сохранение данных при каждом изменении
  useEffect(() => {
    saveData(data);
  }, [data]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollIntoView({behavior:'smooth'});
  }, [ai.messages]);

  const updateData = (updates) => {
    setData(prev => {
      const newData = { ...prev, ...updates };
      saveData(newData);
      return newData;
    });
  };

  const triggerConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  const markPracticeToday = () => {
    const today = new Date().toDateString();
    const last = data.lastPracticeDate ? new Date(data.lastPracticeDate).toDateString() : null;
    if (last === today) return;
    let newStreak = data.currentStreak;
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (last === yesterday) {
      newStreak = data.currentStreak + 1;
    } else {
      newStreak = 1;
    }
    updateData({
      currentStreak: newStreak,
      bestStreak: Math.max(data.bestStreak, newStreak),
      lastPracticeDate: new Date().toISOString(),
    });
  };

  // ============================================================
  // 📚 КАРТОЧКИ
  // ============================================================
  const startSession = (d) => {
    setSession({isActive:true,deck:d,index:0,flipped:false,reviewed:0,correct:0,start:Date.now(),done:false});
    setPracticeView('session');
  };
  
  const rate = (r) => {
    if(r==='good'||r==='easy'){
      setSession(s=>({...s,correct:s.correct+1}));
      playSound('correct');
    }
    if(session.index+1>=session.deck.cards.length){
      setSession(s=>({...s,done:true,reviewed:s.reviewed+1}));
      playSound('complete');
      triggerConfetti();
      markPracticeToday();
      updateData({ xp: data.xp + 10 });
    } else {
      setSession(s=>({...s,index:s.index+1,flipped:false,reviewed:s.reviewed+1}));
    }
  };
  
  const endSession = () => {
    setSession({isActive:false,deck:null,index:0,flipped:false,reviewed:0,correct:0,start:null,done:false});
    setPracticeView('decks');
  };

  // ============================================================
  // 🤖 AI
  // ============================================================
  const startChat = async () => {
    const g = {
      'Английский':'Hello! Let\'s practice English. How are you?',
      'Испанский':'¡Hola! Practiquemos español. ¿Cómo estás?',
      'Греческий':'Γεια! Ας εξασκηθούμε. Πώς είστε;'
    };
    setAi({isActive:true,messages:[{sender:'ai',text:g[userProfile.language]}],score:0,isComplete:false});
    setInput('');
  };
  
  const sendMsg = async (txt) => {
    const nm=[...ai.messages,{sender:'user',text:txt}];
    setAi(s=>({...s,messages:nm}));
    setInput('');
    setAi(s=>({...s,messages:[...s.messages,{sender:'ai',text:'...',thinking:true}]}));
    const r = await callGroqAI(
      nm.map(m=>({role:m.sender==='user'?'user':'assistant',content:m.text})),
      userProfile.language,
      userProfile.level.split(' ')[0]
    );
    setAi(s=>({
      ...s,
      messages:s.messages.filter(m=>!m.thinking).concat({sender:'ai',text:r}),
      score:Math.min(100,s.score+10)
    }));
  };

  const endAiSession = () => {
    markPracticeToday();
    updateData({ xp: data.xp + 15 });
    setAi({...ai, isComplete: true});
    triggerConfetti();
  };

  const savePhraseFromAi = (phrase) => {
    if (!data.savedPhrases.includes(phrase)) {
      updateData({ savedPhrases: [...data.savedPhrases, phrase] });
      playSound('correct');
    }
  };

  const removeSavedPhrase = (phrase) => {
    updateData({ savedPhrases: data.savedPhrases.filter(p => p !== phrase) });
  };

  // ============================================================
  // 📝 ГРАММАТИКА
  // ============================================================
  const startGr = (u) => {
    setGr({isActive:true,view:'session',unit:u,cQ:0,answers:[],sel:null,typed:'',built:[],fb:false,ok:null,done:data.completedGrammarUnits});
  };
  
  const checkGr = () => {
    const q=gr.unit.questions[gr.cQ];
    let ok=false;
    if(q.type==='multiple-choice') ok=gr.sel===q.correct;
    else if(q.type==='fill-blank') ok=gr.typed.trim().toLowerCase()===q.answer.toLowerCase();
    else if(q.type==='word-order') ok=gr.built.join(' ')===q.correct;
    if(ok) playSound('correct');
    else playSound('wrong');
    setGr(s=>({...s,fb:true,ok,answers:[...s.answers,{correct:ok}]}));
  };
  
  const nextGr = () => {
    if(gr.cQ+1>=gr.unit.questions.length){
      playSound('complete');
      setGr(s=>({...s,view:'result'}));
    } else {
      setGr(s=>({...s,cQ:s.cQ+1,sel:null,typed:'',built:[],fb:false,ok:null}));
    }
  };
  
  const exitGr = () => {
    setGr(s=>({...s,isActive:false,view:'units',unit:null}));
  };

  const finishGrammar = () => {
    const cc = gr.answers.filter(a=>a.correct).length;
    const tot = gr.unit.questions.length;
    const pct = Math.round((cc/tot)*100);
    let xp = 0;
    if (pct >= 100) xp = 25;
    else if (pct >= 90) xp = 20;
    else if (pct >= 80) xp = 15;
    let newCompleted = data.completedGrammarUnits;
    if (pct >= 80 && !data.completedGrammarUnits.includes(gr.unit.id)) {
      newCompleted = [...data.completedGrammarUnits, gr.unit.id];
      playSound('achievement');
    }
    markPracticeToday();
    updateData({
      xp: data.xp + xp,
      completedGrammarUnits: newCompleted,
    });
    setGr(s => ({ ...s, done: newCompleted }));
    if (pct >= 80) triggerConfetti();
  };

  const share = async (txt) => {
    if(navigator.share){
      try{await navigator.share({title:'Talkapulse',text:txt});}catch(e){}
    } else {
      try{await navigator.clipboard.writeText(txt);alert(t('copied'));}catch(e){alert(txt);}
    }
  };

  const levels = lang==='ru'?LEVELS:LEVELS_EN;

  const resetAllProgress = () => {
    localStorage.removeItem(STORAGE_KEY);
    setData(defaultData);
    setUserProfile({ language: 'Английский', level: LEVELS[0], goal: '10 минут в день' });
    setOnboardingStep('welcome');
    setResetModal(false);
  };

  // ============================================================
  //  ОНБОРДИНГ
  // ============================================================
  if(onboardingStep!=='home'){
    return(
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-duo-lg shadow-2xl p-8 text-center relative animate-fade-in-up border-t-[6px] border-duo-blue">
          <div className="absolute top-4 left-4 flex bg-gray-100 rounded-full p-0.5">
            <button onClick={()=>{setLang('ru');updateData({interfaceLang:'ru'});}} className={`px-3 py-1 rounded-full text-xs font-bold ${lang==='ru'?'bg-gradient-primary text-white':'text-duo-gray'}`}>RU</button>
            <button onClick={()=>{setLang('en');updateData({interfaceLang:'en'});}} className={`px-3 py-1 rounded-full text-xs font-bold ${lang==='en'?'bg-gradient-primary text-white':'text-duo-gray'}`}>EN</button>
          </div>
          {onboardingStep==='welcome'&&(<>
            <div className="text-6xl mb-6 animate-bounce-soft">🌍</div>
            <h1 className="text-2xl font-bold text-duo-text mb-3">{t('welcome')}</h1>
            <p className="text-duo-gray mb-8">{t('welcomeSub')}</p>
            <button onClick={()=>setOnboardingStep('language')} className="w-full bg-gradient-primary text-white font-bold py-4 rounded-duo hover:opacity-90 mb-3 shadow-lg btn-3d text-lg">{t('start')}</button>
            <button onClick={()=>{setOnboardingStep('home');updateData({onboardingCompleted:true});}} className="w-full bg-transparent text-duo-blue font-bold py-3 rounded-duo hover:bg-blue-50">{t('haveAccount')}</button>
          </>)}
          {onboardingStep==='language'&&(<>
            <button onClick={()=>setOnboardingStep('home')} className="absolute top-4 right-4 text-duo-blue font-bold text-sm">{t('skip')}</button>
            <h1 className="text-2xl font-bold text-duo-text mb-6 text-left mt-4">{t('whatLearn')}</h1>
            <div className="text-left mb-4">
              <label className="block text-sm font-bold text-duo-text mb-2">{t('lang')}</label>
              <div className="space-y-2">
                {[{code:'Английский',flag:'🇬🇧'},{code:'Испанский',flag:'🇪🇸'},{code:'Греческий',flag:'🇷'}].map(l=>(
                  <button key={l.code} onClick={()=>{const p={...userProfile,language:l.code};setUserProfile(p);updateData({language:l.code});}} className={`w-full border-2 rounded-duo p-3 font-bold flex items-center gap-3 ${userProfile.language===l.code?'border-duo-blue bg-blue-50 text-duo-blue':'border-gray-200 text-duo-text hover:bg-gray-50'}`}>
                    <span className="text-2xl">{l.flag}</span><span>{l.code}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="text-left mb-6">
              <label className="block text-sm font-bold text-duo-text mb-2">{t('level')}</label>
              <select value={userProfile.level} onChange={(e)=>{const p={...userProfile,level:e.target.value};setUserProfile(p);updateData({level:e.target.value});}} className="w-full border-2 border-gray-200 rounded-duo p-3 focus:border-duo-blue focus:outline-none bg-white">
                {levels.map(l=><option key={l}>{l}</option>)}
              </select>
            </div>
            <button onClick={()=>setOnboardingStep('goal')} className="w-full bg-gradient-primary text-white font-bold py-3 rounded-duo shadow-lg btn-3d">{t('cont')}</button>
          </>)}
          {onboardingStep==='goal'&&(<>
            <h1 className="text-2xl font-bold text-duo-text mb-2">{t('goalTitle')}</h1>
            <p className="text-duo-gray mb-6">{t('goalSub')}</p>
            <div className="space-y-3 mb-8 text-left">
              {['5 минут','10 минут','15 минут'].map(g=>(
                <button key={g} onClick={()=>{const p={...userProfile,goal:g};setUserProfile(p);updateData({goal:g});}} className={`w-full border-2 rounded-duo p-4 font-bold ${userProfile.goal===g?'border-accent-purple bg-purple-50 text-accent-purple':'border-gray-200 text-duo-text hover:bg-gray-50'}`}>{g}</button>
              ))}
            </div>
            <button onClick={()=>setOnboardingStep('quickwin')} className="w-full bg-gradient-primary text-white font-bold py-3 rounded-duo shadow-lg btn-3d">{t('cont')}</button>
          </>)}
          {onboardingStep==='quickwin'&&(<>
            <h1 className="text-2xl font-bold text-duo-text mb-2">{t('firstCards')}</h1>
            <p className="text-duo-gray mb-8">{t('firstCardsSub')}</p>
            <button onClick={()=>setOnboardingStep('done')} className="w-full bg-gradient-warm text-white font-bold py-3 rounded-duo shadow-lg btn-3d">{t('startNow')}</button>
          </>)}
          {onboardingStep==='done'&&(<>
            <div className="text-6xl mb-6 animate-celebrate">🎉</div>
            <h1 className="text-2xl font-bold text-duo-text mb-2">{t('greatStart')}</h1>
            <p className="text-duo-gray mb-8">{t('greatStartSub')}</p>
            <button onClick={()=>{setOnboardingStep('home');updateData({onboardingCompleted:true});triggerConfetti();}} className="w-full bg-gradient-primary text-white font-bold py-3 rounded-duo shadow-lg btn-3d mb-3">{t('goHome')}</button>
            <button onClick={()=>{setActiveTab('clubs');setOnboardingStep('home');updateData({onboardingCompleted:true});}} className="w-full bg-transparent text-accent-purple font-bold py-3 rounded-duo hover:bg-purple-50">{t('exploreClubs')}</button>
          </>)}
        </div>
      </div>
    );
  }

  // ============================================================
  //  AI ЭКРАН
  // ============================================================
  if(ai.isActive){
    return(
      <div className="flex flex-col h-screen bg-duo-bg">
        <div className="bg-gradient-warm p-4 flex items-center justify-between shadow-sm z-10">
          <button onClick={()=>setAi({...ai,isActive:false})} className="p-2 hover:bg-white/20 rounded-full text-white"><BackIcon/></button>
          <div className="text-center">
            <div className="text-sm font-bold text-white">{t('aiChat')}</div>
            <div className="text-xs text-white/80">{ai.messages.length} msg</div>
          </div>
          <button onClick={endAiSession} className="text-sm font-bold text-white hover:bg-white/20 px-3 py-1 rounded-full">{t('aiEnd')}</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {ai.messages.map((m,i)=>(
            <div key={i} className={`flex ${m.sender==='user'?'justify-end':'justify-start'} animate-slide-up`}>
              <div className={`max-w-[80%] rounded-2xl p-4 ${m.sender==='user'?'bg-gradient-primary text-white rounded-br-none':'bg-white border-2 border-gray-100 text-duo-text rounded-bl-none shadow-sm'}`}>
                <p className="text-sm leading-relaxed">{m.text}</p>
                {m.sender==='ai' && !m.thinking && i > 0 && (
                  <button onClick={()=>savePhraseFromAi(m.text)} className="mt-2 text-xs text-duo-blue hover:underline"> Save</button>
                )}
              </div>
            </div>
          ))}
          <div ref={chatRef}/>
        </div>
        {!ai.isComplete&&(
          <div className="bg-white border-t border-gray-200 p-4 pb-6">
            <div className="flex gap-2">
              <input type="text" value={input} onChange={(e)=>setInput(e.target.value)} onKeyDown={(e)=>e.key==='Enter'&&input.trim()&&sendMsg(input)} placeholder={t('aiType')} className="flex-1 border-2 border-gray-200 rounded-full px-4 py-3 focus:border-accent-purple focus:outline-none"/>
              <button onClick={()=>input.trim()&&sendMsg(input)} disabled={!input.trim()} className={`w-12 h-12 rounded-full flex items-center justify-center ${input.trim()?'bg-gradient-warm shadow-lg':'bg-gray-200'}`}>
                <SendIcon/>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================================================
  // 📝 ГРАММАТИКА
  // ============================================================
  if(gr.isActive){
    if(gr.view==='units'){
      const units=grammarUnits[userProfile.language]||[];
      return(
        <div className="flex flex-col min-h-screen bg-duo-bg">
          <div className="bg-gradient-primary p-4 flex items-center justify-between shadow-sm">
            <button onClick={exitGr} className="p-2 hover:bg-white/20 rounded-full text-white"><BackIcon/></button>
            <div className="text-center">
              <div className="text-sm font-bold text-white">{lang==='ru'?'Грамматика':'Grammar'}</div>
              <div className="text-xs text-white/80">{userProfile.level}</div>
            </div>
            <div className="w-10"/>
          </div>
          <div className="flex-1 p-6 overflow-y-auto pb-20">
            <h1 className="text-2xl font-bold text-duo-text mb-6 animate-fade-in-up">{lang==='ru'?'Юниты':'Units'}</h1>
            <div className="space-y-3">
              {units.map((u,i)=>{
                const c=gr.done.includes(u.id);
                const lk=i>0&&!gr.done.includes(units[i-1].id);
                return(
                  <button key={u.id} onClick={()=>!lk&&startGr(u)} disabled={lk} className={`w-full text-left rounded-duo p-5 shadow-sm border-2 transition-all animate-slide-up ${lk?'bg-gray-50 border-gray-200 opacity-60':c?'bg-green-50 border-accent-green':'bg-white border-gray-100 hover:border-duo-blue'}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{lk?'🔒':c?'✅':''}</span>
                      <div>
                        <h3 className="font-bold text-duo-text">{lang==='ru'?u.title:u.titleEn}</h3>
                        <div className="text-xs mt-1">
                          <span className={`inline-block px-2 py-0.5 rounded-full font-bold ${levelBadge(u.level)}`}>{u.level}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      );
    }
    if(gr.view==='session'){
      const q=gr.unit.questions[gr.cQ];
      // FIXED PROGRESS BAR
      const pr=Math.min(100, ((gr.cQ + 1) / (gr.unit?.questions?.length || 1)) * 100);
      return(
        <div className="flex flex-col min-h-screen bg-duo-bg">
          <div className="bg-white border-b border-gray-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <button onClick={exitGr} className="p-2 hover:bg-gray-100 rounded-full"><BackIcon/></button>
              <div className="text-sm font-bold">{gr.cQ+1}/{gr.unit.questions.length}</div>
              <div className="w-10"/>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-primary progress-bar-animated" style={{width:`${pr}%`}}/>
            </div>
          </div>
          <div className="flex-1 p-6 overflow-y-auto pb-20">
            <div className="bg-white rounded-duo p-6 shadow-sm border-2 border-gray-100 mb-4 animate-fade-in-up">
              <div className={`text-xs font-bold uppercase tracking-wide mb-2 px-3 py-1 rounded-full inline-block ${q.type==='multiple-choice'?'bg-duo-blue text-white':q.type==='fill-blank'?'bg-accent-green text-white':'bg-accent-orange text-white'}`}>
                {q.type==='multiple-choice'?'🎯 '+(lang==='ru'?'Выбор':'Choice'):q.type==='fill-blank'?'✍️ '+(lang==='ru'?'Пропуск':'Fill in'):'🔤 '+(lang==='ru'?'Порядок':'Order')}
              </div>
              <h2 className="text-lg font-bold mb-4">{lang==='ru'?q.inst:q.instEn}</h2>
              <p className="text-xl">{q.q}</p>
            </div>
            {q.type==='multiple-choice'&&(
              <div className="space-y-2 animate-slide-up">
                {q.opts.map((o,i)=>{
                  const s=gr.sel===i;
                  const c=gr.fb&&i===q.correct;
                  const w=gr.fb&&s&&i!==q.correct;
                  return(
                    <button key={i} onClick={()=>!gr.fb&&setGr(x=>({...x,sel:i}))} disabled={gr.fb} className={`w-full text-left p-4 rounded-duo border-2 font-bold ${c?'bg-green-100 border-accent-green text-green-700':w?'bg-red-100 border-red-500 text-red-700':s?'bg-blue-50 border-duo-blue text-duo-blue':'bg-white border-gray-200 hover:border-duo-blue'}`}>{o}</button>
                  );
                })}
              </div>
            )}
            {q.type==='fill-blank'&&(
              <div className="animate-slide-up">
                <input type="text" value={gr.typed} onChange={(e)=>setGr(x=>({...x,typed:e.target.value}))} disabled={gr.fb} className={`w-full border-2 rounded-duo p-4 text-lg font-bold focus:outline-none ${gr.fb?gr.ok?'border-accent-green bg-green-50':'border-red-500 bg-red-50':'border-gray-200 focus:border-duo-blue'}`}/>
                {gr.fb&&!gr.ok&&(
                  <div className="mt-3 p-3 bg-green-50 border-2 border-accent-green rounded-duo">
                    <div className="text-xs font-bold text-green-700">{lang==='ru'?'Ответ:':'Answer:'} <span className="text-green-900">{q.answer}</span></div>
                  </div>
                )}
                {!gr.fb&&q.hint&&(<div className="mt-3 text-sm text-duo-gray italic"> {q.hint}</div>)}
              </div>
            )}
            {q.type==='word-order'&&(
              <div className="animate-slide-up">
                <div className="min-h-[80px] bg-white border-2 border-gray-200 rounded-duo p-4 mb-4 flex flex-wrap gap-2">
                  {gr.built.length===0&&<div className="text-duo-gray italic text-sm">{lang==='ru'?'Нажимайте...':'Tap...'}</div>}
                  {gr.built.map((w,i)=>(
                    <button key={i} onClick={()=>!gr.fb&&setGr(x=>({...x,built:x.built.filter((_,j)=>j!==i)}))} disabled={gr.fb} className="bg-gradient-primary text-white font-bold px-4 py-2 rounded-full btn-3d">{w}</button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {q.words.map((w,i)=>(
                    <button key={i} onClick={()=>!gr.fb&&setGr(x=>({...x,built:[...x.built,w]}))} disabled={gr.fb} className="bg-white border-2 border-gray-300 font-bold px-4 py-2 rounded-full hover:border-duo-blue btn-3d">{w}</button>
                  ))}
                </div>
                {gr.fb&&!gr.ok&&(
                  <div className="mt-3 p-3 bg-green-50 border-2 border-accent-green rounded-duo">
                    <div className="text-xs font-bold text-green-700">{lang==='ru'?'Ответ:':'Answer:'} <span className="text-green-900">{q.correct}</span></div>
                  </div>
                )}
              </div>
            )}
            {gr.fb&&(
              <div className={`mt-6 p-4 rounded-duo animate-slide-up ${gr.ok?'bg-green-50 border-2 border-accent-green':'bg-red-50 border-2 border-red-300'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{gr.ok?'✅':'❌'}</span>
                  <span className={`font-bold ${gr.ok?'text-green-700':'text-red-700'}`}>{gr.ok?(lang==='ru'?'Отлично!':'Great!'):(lang==='ru'?'Не совсем...':'Not quite...')}</span>
                </div>
                <p className={`text-sm ${gr.ok?'text-green-800':'text-red-800'}`}>{lang==='ru'?q.expl:q.explEn}</p>
              </div>
            )}
          </div>
          <div className="bg-white border-t border-gray-200 p-4 pb-6">
            {!gr.fb?(
              <button onClick={checkGr} disabled={(q.type==='multiple-choice'&&gr.sel===null)||(q.type==='fill-blank'&&!gr.typed.trim())||(q.type==='word-order'&&gr.built.length!==q.words.length)} className={`w-full font-bold py-4 rounded-duo btn-3d ${(q.type==='multiple-choice'&&gr.sel===null)||(q.type==='fill-blank'&&!gr.typed.trim())||(q.type==='word-order'&&gr.built.length!==q.words.length)?'bg-gray-200 text-duo-gray':'bg-gradient-primary text-white shadow-lg'}`}>
                {lang==='ru'?'Проверить':'Check'}
              </button>
            ):(
              <button onClick={nextGr} className="w-full bg-gradient-primary text-white font-bold py-4 rounded-duo shadow-lg btn-3d">
                {gr.cQ+1>=gr.unit.questions.length?(lang==='ru'?'Завершить':'Finish'):(lang==='ru'?'Дальше':'Next')}
              </button>
            )}
          </div>
        </div>
      );
    }
    if(gr.view==='result'){
      useEffect(() => { finishGrammar(); }, []);
      const cc=gr.answers.filter(a=>a.correct).length;
      const tot=gr.unit.questions.length;
      const pct=Math.round((cc/tot)*100);
      let xp=0;
      if(pct>=100) xp=25; else if(pct>=90) xp=20; else if(pct>=80) xp=15;
      return(
        <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="text-6xl mb-4 animate-celebrate">{pct>=80?'🎉':'💪'}</div>
            <div className={`text-5xl font-bold rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-4 text-white shadow-xl ${pct>=90?'bg-gradient-sunny':pct>=80?'bg-gradient-fresh':'bg-gradient-warm'}`}>{pct}%</div>
            <h1 className="text-2xl font-bold mb-2">{pct>=80?(lang==='ru'?'Пройдено!':'Complete!'):(lang==='ru'?'Ещё раз':'Try again')}</h1>
            <div className="bg-white rounded-duo p-6 shadow-sm w-full mb-4">
              <div className="text-center mb-4"><div className="text-sm text-duo-gray">{cc}/{tot}</div></div>
              {xp>0&&(<div className="flex justify-between border-t pt-3"><span className="text-duo-gray">XP</span><span className="font-bold text-accent-purple">+{xp} XP 🏆</span></div>)}
            </div>
          </div>
          <div className="space-y-3">
            <button onClick={()=>startGr(gr.unit)} className="w-full bg-gradient-primary text-white font-bold py-3 rounded-duo shadow-lg btn-3d">{lang==='ru'?'Ещё раз':'Again'}</button>
            <button onClick={exitGr} className="w-full bg-transparent text-duo-blue font-bold py-3 rounded-duo hover:bg-blue-50">{lang==='ru'?'К юнитам':'Back'}</button>
          </div>
        </div>
      );
    }
  }

  // ============================================================
  // 🏠 ОСНОВНЫЕ ЭКРАНЫ
  // ============================================================
  return(
    <>
      <Confetti active={showConfetti} />
      <div className="flex flex-col min-h-screen bg-white relative overflow-hidden">
        <main className="flex-1 overflow-y-auto pb-32 bg-duo-bg">

          {activeTab==='home'&&(
            <div className="p-6">
              <div className="flex justify-between items-center mb-6 animate-fade-in-up">
                <h1 className="text-2xl font-bold text-duo-text">{t('home')}</h1>
                <div onClick={()=>setActiveTab('profile')} className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold cursor-pointer shadow-md">А</div>
              </div>
              <div className="bg-white rounded-duo p-5 shadow-sm mb-4 border-l-4 border-duo-blue animate-slide-up">
                <h2 className="font-bold text-lg mb-1">{t('hi')}, Алекс!</h2>
                <p className="text-duo-gray text-sm mb-2">{userProfile.level} • {userProfile.language}</p>
                <div className="flex items-center gap-3 text-sm">
                  <span className="font-bold text-accent-orange">🔥 {data.currentStreak} {t('streak')}</span>
                  <span className="text-duo-gray">•</span>
                  <span className="font-bold text-accent-purple">⭐ {data.xp} {t('xp')}</span>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 mb-4">
                <button onClick={()=>setActiveTab('practice')} className="bg-gradient-primary rounded-duo p-5 shadow-lg text-left hover:shadow-xl transition-all hover:scale-[1.02] animate-slide-up relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"/>
                  <div className="relative">
                    <div className="text-4xl mb-2">📚</div>
                    <h3 className="font-bold text-white text-lg mb-1">{t('startPractice')}</h3>
                    <p className="text-sm text-white/90">{t('startPracticeSub')}</p>
                  </div>
                </button>
                <button onClick={()=>setActiveTab('clubs')} className="bg-gradient-secondary rounded-duo p-5 shadow-lg text-left hover:shadow-xl transition-all hover:scale-[1.02] animate-slide-up relative overflow-hidden" style={{animationDelay:'0.1s'}}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"/>
                  <div className="relative">
                    <div className="text-4xl mb-2">👥</div>
                    <h3 className="font-bold text-white text-lg mb-1">{t('findClub')}</h3>
                    <p className="text-sm text-white/90">{t('findClubSub')}</p>
                  </div>
                </button>
                <button onClick={startChat} className="bg-gradient-warm rounded-duo p-5 shadow-lg text-left hover:shadow-xl transition-all hover:scale-[1.02] animate-slide-up relative overflow-hidden" style={{animationDelay:'0.2s'}}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"/>
                  <div className="relative">
                    <div className="text-4xl mb-2">🤖</div>
                    <h3 className="font-bold text-white text-lg mb-1">{t('aiChat')}</h3>
                    <p className="text-sm text-white/90">{t('aiChatSub')}</p>
                  </div>
                </button>
              </div>
              <div className="bg-gradient-fresh rounded-duo p-5 shadow-lg animate-slide-up relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-10 rounded-full -mr-12 -mt-12"/>
                <div className="relative">
                  <h3 className="font-bold text-white text-lg mb-1">{t('liveClubs')}</h3>
                  <p className="text-white/90 text-sm mb-3">{t('sessionsToday')}</p>
                  <button onClick={()=>setActiveTab('clubs')} className="bg-white text-accent-green font-bold px-4 py-2 rounded-duo hover:bg-green-50">{t('viewClubs')}</button>
                </div>
              </div>
            </div>
          )}

          {activeTab==='practice'&&(
            <div className="p-6">
              {session.isActive&&practiceView==='session'?(session.done?(
                <div className="min-h-screen flex flex-col items-center justify-center">
                  <div className="w-full bg-white rounded-duo p-8 shadow-sm text-center animate-fade-in-up">
                    <div className="text-6xl mb-4 animate-celebrate">🏆</div>
                    <h1 className="text-2xl font-bold mb-2">{t('sessionDone')}</h1>
                    <p className="text-duo-gray mb-6">{t('greatJob')}</p>
                    <div className="space-y-3 mb-8 text-left">
                      <div className="flex justify-between py-3 border-b"><span className="text-duo-gray">{t('reviewed')}</span><span className="font-bold">{session.reviewed}</span></div>
                      <div className="flex justify-between py-3 border-b"><span className="text-duo-gray">{t('accuracy')}</span><span className="font-bold text-duo-blue">{session.reviewed>0?Math.round((session.correct/session.reviewed)*100):0}%</span></div>
                      <div className="flex justify-between py-3 border-b"><span className="text-duo-gray">{t('timeSpent')}</span><span className="font-bold">{Math.floor((Date.now()-session.start)/60000)} {t('min')}</span></div>
                    </div>
                    <button onClick={endSession} className="w-full bg-gradient-primary text-white font-bold py-3 rounded-duo shadow-lg btn-3d mb-3">{t('done')}</button>
                    <button onClick={()=>startSession(session.deck)} className="w-full text-duo-blue font-bold py-3 rounded-duo hover:bg-blue-50">{t('practiceMore')}</button>
                  </div>
                </div>
              ):(
                <div className="flex flex-col min-h-screen">
                  <div className="bg-white border-b p-4 flex items-center justify-between">
                    <button onClick={endSession} className="p-2 hover:bg-gray-100 rounded-full"><BackIcon/></button>
                    <div className="text-center">
                      <div className="text-xs text-duo-gray">{session.deck.name}</div>
                      <div className="text-sm font-bold">{session.index+1}/{session.deck.cards.length}</div>
                    </div>
                    <div className="w-10"/>
                  </div>
                  <div className="w-full h-2 bg-gray-200">
                    {/* FIXED PROGRESS BAR */}
                    <div className="h-full bg-gradient-primary progress-bar-animated" style={{width:`${Math.min(100, ((session.index + 1) / (session.deck?.cards?.length || 1)) * 100)}%`}}/>
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center p-6">
                    <div className="flip-card w-full h-[350px] cursor-pointer" onClick={()=>{if(!session.flipped){playSound('flip');setSession(s=>({...s,flipped:true}));}}}>
                      <div className={`flip-card-inner bg-white rounded-duo shadow-md border-2 border-gray-100 h-full ${session.flipped?'flipped':''}`}>
                        <div className="flip-card-front">
                          <div className="text-3xl font-bold text-center mb-4">{session.deck.cards[session.index].target}</div>
                          <div className="text-sm text-duo-gray">{t('tapToSee')}</div>
                        </div>
                        <div className="flip-card-back bg-gradient-to-br from-blue-50 to-indigo-50">
                          <div className="text-2xl font-bold text-duo-blue mb-4">{session.deck.cards[session.index].translation}</div>
                          <div className="text-sm italic text-center mb-2">"{session.deck.cards[session.index].example}"</div>
                          <div className="text-xs text-duo-gray text-center">{session.deck.cards[session.index].exampleRu}</div>
                        </div>
                      </div>
                    </div>
                    {session.flipped&&(
                      <div className="w-full grid grid-cols-3 gap-3 mt-6 animate-slide-up">
                        <button onClick={()=>rate('again')} className="bg-white border-2 border-gray-300 font-bold py-3 rounded-duo shadow-[0_3px_0_0_#D1D5DB] btn-3d">{t('again')}</button>
                        <button onClick={()=>rate('good')} className="bg-gradient-primary text-white font-bold py-3 rounded-duo shadow-[0_3px_0_0_#1899D6] btn-3d animate-pulse-blue">{t('good')}</button>
                        <button onClick={()=>rate('easy')} className="bg-gradient-fresh text-white font-bold py-3 rounded-duo shadow-[0_3px_0_0_#16A34A] btn-3d">{t('easy')}</button>
                      </div>
                    )}
                  </div>
                </div>
              )):(
                <>
                  <h1 className="text-2xl font-bold mb-2 animate-fade-in-up">{t('practice')}</h1>
                  <p className="text-duo-gray mb-6">{userProfile.level} • {userProfile.language}</p>
                  <h2 className="font-bold text-lg mb-3">{t('decks')}</h2>
                  <div className="space-y-3 mb-8">
                    {(decksData[userProfile.language]||[]).map((d,i)=>(
                      <div key={d.id} className="bg-white rounded-duo p-4 shadow-sm border-2 border-gray-100 flex justify-between items-center animate-slide-up" style={{animationDelay:`${i*0.05}s`}}>
                        <div>
                          <div className="font-bold">{d.name}</div>
                          <div className="text-xs text-duo-gray mt-1">
                            <span className={`inline-block px-2 py-0.5 rounded-full font-bold ${levelBadge(d.level)}`}>{d.level}</span> {d.cardsCount} {t('cards')}
                          </div>
                        </div>
                        <button onClick={()=>startSession(d)} className="bg-gradient-primary text-white font-bold px-4 py-2 rounded-duo shadow-md btn-3d text-sm">{t('startBtn')}</button>
                      </div>
                    ))}
                  </div>
                  <h2 className="font-bold text-lg mb-3">{t('exercises')}</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {[{n:t('listening'),i:'',c:'bg-gradient-secondary',d:true},{n:t('speaking'),i:'🎤',c:'bg-gradient-warm',d:true},{n:t('grammar'),i:'📝',c:'bg-gradient-primary',d:false,a:()=>setGr({...gr,isActive:true,view:'units'})},{n:t('writing'),i:'✍️',c:'bg-gradient-fresh',d:true}].map((e,i)=>(
                      <button key={e.n} onClick={e.a} disabled={e.d} className={`${e.c} rounded-duo p-4 shadow-md text-left hover:shadow-lg transition-all ${e.d?'opacity-60 cursor-not-allowed':'hover:scale-105'} animate-slide-up relative overflow-hidden`} style={{animationDelay:`${i*0.05}s`}}>
                        <div className="absolute top-0 right-0 w-20 h-20 bg-white opacity-10 rounded-full -mr-10 -mt-10"/>
                        <div className="relative">
                          <div className="text-3xl mb-2">{e.i}</div>
                          <div className="font-bold text-white">{e.n}</div>
                          {e.d&&<div className="text-xs text-white/80 mt-1">{t('soon')}</div>}
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab==='clubs'&&(
            <div className="p-6">
              {clubsView==='detail'&&selectedClub?(
                <div className="animate-fade-in-up">
                  <button onClick={()=>{setClubsView('list');setSelectedClub(null);}} className="flex items-center gap-2 text-duo-gray mb-4 hover:text-duo-text">
                    <BackIcon/><span className="font-bold">{t('backToList')}</span>
                  </button>
                  <div className="bg-white rounded-duo p-6 shadow-sm border-2 border-gray-100">
                    <div className="flex gap-2 mb-3">
                      <span className={`inline-block px-3 py-1 rounded-full font-bold text-xs ${levelBadge(selectedClub.level)}`}>{selectedClub.level}</span>
                      <span className={`inline-block px-3 py-1 rounded-full font-bold text-xs text-white ${selectedClub.format==='online'?'bg-gradient-fresh':'bg-gradient-secondary'}`}>{selectedClub.format==='online'?t('online'):t('offline')}</span>
                    </div>
                    <h1 className="text-2xl font-bold mb-2">{selectedClub.title}</h1>
                    <p className="text-duo-gray text-sm mb-4">{selectedClub.desc}</p>
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold">{selectedClub.host[0]}</div>
                        <div><div className="text-xs text-duo-gray">{t('host')}</div><div className="font-bold">{selectedClub.host}</div></div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-sunny rounded-full flex items-center justify-center text-white font-bold">🕐</div>
                        <div><div className="text-xs text-duo-gray">{t('timeLocal')}</div><div className="font-bold">{lang==='en'?selectedClub.dateEn:selectedClub.date}, {selectedClub.time}</div></div>
                      </div>
                      {selectedClub.city&&(
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-secondary rounded-full flex items-center justify-center text-white font-bold">📍</div>
                          <div><div className="text-xs text-duo-gray">{t('place')}</div><div className="font-bold">{selectedClub.city}</div></div>
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-fresh rounded-full flex items-center justify-center text-white font-bold">👥</div>
                        <div><div className="text-xs text-duo-gray">{t('participants')}</div><div className="font-bold">{selectedClub.participants}</div></div>
                      </div>
                    </div>
                    <button className="w-full bg-gradient-primary text-white font-bold py-3 rounded-duo shadow-lg btn-3d mb-3">{selectedClub.format==='online'?t('joinOnline'):t('joinOffline')}</button>
                    <button className="w-full bg-transparent border-2 border-accent-purple text-accent-purple font-bold py-3 rounded-duo hover:bg-purple-50">{t('remind')}</button>
                  </div>
                </div>
              ):(
                <>
                  <h1 className="text-2xl font-bold mb-2 animate-fade-in-up">{t('clubsTitle')}</h1>
                  <p className="text-duo-gray mb-4">{t('clubsSub')}</p>
                  <div className="mb-3">
                    <div className="text-xs font-bold text-duo-gray mb-2">{t('filterLevel')}</div>
                    <div className="flex gap-2 flex-wrap">
                      {(lang==='ru'?['Все','A1','A2','B1','B2','C1','C2']:['All','A1','A2','B1','B2','C1','C2']).map(l=>(
                        <button key={l} onClick={()=>setClubFL(l)} className={`px-3 py-1.5 rounded-full text-sm font-bold ${clubFL===l?'bg-gradient-primary text-white':'bg-white border-2 border-gray-200 hover:bg-gray-50'}`}>{l}</button>
                      ))}
                    </div>
                  </div>
                  <div className="mb-6">
                    <div className="text-xs font-bold text-duo-gray mb-2">{t('filterWhen')}</div>
                    <div className="flex gap-2 flex-wrap">
                      {(lang==='ru'?['Все','Сегодня','Завтра','Эта неделя']:['All','Today','Tomorrow','This week']).map(x=>(
                        <button key={x} onClick={()=>setClubFT(x)} className={`px-3 py-1.5 rounded-full text-sm font-bold ${clubFT===x?'bg-gradient-secondary text-white':'bg-white border-2 border-gray-200 hover:bg-gray-50'}`}>{x}</button>
                      ))}
                    </div>
                  </div>
                  {clubsData.filter(c=>(clubFL==='Все'||clubFL==='All'||c.level===clubFL)&&(clubFT==='Все'||clubFT==='All'||c.date===clubFT||c.dateEn===clubFT)).length===0?(
                    <div className="text-center py-12">
                      <div className="text-5xl mb-3">🔍</div>
                      <h2 className="font-bold mb-1">{t('noClubs')}</h2>
                      <p className="text-duo-gray text-sm">{t('noClubsSub')}</p>
                    </div>
                  ):(
                    <div className="space-y-3">
                      {clubsData.filter(c=>(clubFL==='Все'||clubFL==='All'||c.level===clubFL)&&(clubFT==='Все'||clubFT==='All'||c.date===clubFT||c.dateEn===clubFT)).map((c,i)=>(
                        <div key={c.id} onClick={()=>{setSelectedClub(c);setClubsView('detail');}} className="bg-white rounded-duo p-4 shadow-sm border-2 border-gray-100 cursor-pointer hover:border-accent-purple transition-colors animate-slide-up" style={{animationDelay:`${i*0.05}s`}}>
                          <div className="flex gap-2 mb-2">
                            <span className={`inline-block px-2 py-0.5 rounded-full font-bold text-xs ${levelBadge(c.level)}`}>{c.level}</span>
                            <span className={`inline-block px-2 py-0.5 rounded-full font-bold text-xs text-white ${c.format==='online'?'bg-gradient-fresh':'bg-gradient-secondary'}`}>{c.format==='online'?t('online'):t('offline')}</span>
                          </div>
                          <h3 className="font-bold mb-1">{c.title}</h3>
                          <p className="text-sm text-duo-gray mb-2">{c.level} • {t('host')}: {c.host} • {lang==='en'?c.dateEn:c.date}, {c.time}</p>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-duo-gray">👥 {c.participants} {t('people')}</span>
                            <button className="bg-gradient-primary text-white font-bold px-4 py-1.5 rounded-duo shadow-md btn-3d text-xs">{t('more')}</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab==='progress'&&(
            <div className="p-6">
              {progressTab==='badges'&&(
                <>
                  <h1 className="text-2xl font-bold mb-2 animate-fade-in-up">{t('badgesTitle')}</h1>
                  <p className="text-duo-gray mb-4">{t('badgesSub')}</p>
                  <div className="flex gap-2 flex-wrap mb-6">
                    {[{id:'all',l:t('all')},{id:'earned',l:t('earned')},{id:'progress',l:t('inProgress')},{id:'locked',l:t('locked')}].map(f=>(
                      <button key={f.id} onClick={()=>setBadgeFilter(f.id)} className={`px-3 py-1.5 rounded-full text-sm font-bold ${badgeFilter===f.id?'bg-gradient-primary text-white':'bg-white border-2 border-gray-200'}`}>{f.l}</button>
                    ))}
                  </div>
                  <div className="space-y-3">
                    {badgesData.filter(b=>badgeFilter==='all'||b.status===badgeFilter).map((b,i)=>(
                      <div key={b.id} className={`bg-white rounded-duo p-4 shadow-sm border-2 ${b.status==='earned'?'border-accent-yellow':b.status==='locked'?'border-gray-200 opacity-60':'border-gray-100'} animate-slide-up`} style={{animationDelay:`${i*0.05}s`}}>
                        <div className="flex items-start gap-4">
                          <div className={`w-14 h-14 rounded-duo flex items-center justify-center text-3xl ${b.status==='earned'?'bg-gradient-sunny':b.status==='progress'?'bg-gradient-primary':'bg-gray-200 grayscale'}`}>{b.icon}</div>
                          <div className="flex-1">
                            <h3 className="font-bold mb-1">{lang==='en'?b.nameEn:b.name}</h3>
                            <p className="text-xs text-duo-gray mb-2">{lang==='en'?b.descEn:b.desc}</p>
                            {b.status==='earned'&&<div className="text-xs font-bold text-green-600">✓ {b.earnedDate}</div>}
                            {b.status==='progress'&&(
                              <>
                                <div className="flex justify-between text-xs mb-1"><span className="text-duo-gray">{t('progressLabel')}</span><span className="font-bold text-duo-blue">{b.progress}/{b.total}</span></div>
                                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-gradient-primary progress-bar-animated" style={{width:`${(b.progress/b.total)*100}%`}}/></div>
                              </>
                            )}
                            {b.status==='locked'&&<div className="text-xs font-bold text-duo-gray">🔒 {b.progress}/{b.total}</div>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {progressTab==='streaks'&&(
                <>
                  <h1 className="text-2xl font-bold mb-2 animate-fade-in-up">{t('streaksTitle')}</h1>
                  <p className="text-duo-gray mb-4">{t('streaksSub')}</p>
                  <div className="bg-gradient-warm rounded-duo p-5 shadow-lg mb-4 text-white animate-slide-up">
                    <div className="flex items-center justify-between mb-3">
                      <div><div className="text-sm text-white/80">{t('currentStreak')}</div><div className="text-3xl font-bold">{data.currentStreak} {t('days')} 🔥</div></div>
                      <div className="text-right"><div className="text-sm text-white/80">{t('bestStreak')}</div><div className="text-xl font-bold">{data.bestStreak} {t('days')}</div></div>
                    </div>
                    <p className="text-xs text-white/80">{t('streakTip')}</p>
                  </div>
                  {(()=>{
                    const n=new Date();const y=n.getFullYear();const m=n.getMonth();
                    const pd=[1,2,3,4,5,8,9,10,11,12,15,16,17,18,19,22,23,24,25,26,29,30,31].filter(d=>d<=new Date(y,m+1,0).getDate());
                    const cd=getCalendarDays(y,m,pd);
                    const mo=lang==='ru'?MR:ME;const wk=lang==='ru'?WR:WE;
                    return(
                      <div className="bg-white rounded-duo p-5 shadow-sm border-2 border-gray-100 animate-slide-up">
                        <div className="flex justify-between items-center mb-4"><h2 className="font-bold">{mo[m]} {y}</h2><div className="text-sm font-bold text-duo-blue">{pd.length} {t('days')}</div></div>
                        <div className="grid grid-cols-7 gap-1 mb-2">{wk.map(d=><div key={d} className="text-center text-xs font-bold text-duo-gray py-1">{d}</div>)}</div>
                        <div className="grid grid-cols-7 gap-1">{cd.map((d,i)=>(<div key={i} className={`aspect-square flex items-center justify-center rounded-lg text-sm font-bold ${d.day===null?'':d.practiced?'bg-gradient-primary text-white':d.isToday?'border-2 border-duo-blue text-duo-blue bg-blue-50':'bg-gray-100 text-duo-gray'}`}>{d.day}</div>))}</div>
                      </div>
                    );
                  })()}
                </>
              )}
              {progressTab==='share'&&(
                <>
                  <h1 className="text-2xl font-bold mb-2 animate-fade-in-up">{t('shareTitle')}</h1>
                  <p className="text-duo-gray mb-6">{t('shareSub')}</p>
                  <div className="space-y-3">
                    {[{id:1,title:`${data.currentStreak} дней 🔥`,color:'bg-gradient-warm',text:`${data.currentStreak} дней подряд в Talkapulse! 🔥`},{id:2,title:'150 карточек 📚',color:'bg-gradient-primary',text:'150 карточек за неделю! 📚'},{id:3,title:'Уровень A2 🎯',color:'bg-gradient-fresh',text:'Уровень A2!  #Talkapulse'}].map((c,i)=>(
                      <div key={c.id} className="bg-white rounded-duo p-4 shadow-sm border-2 border-gray-100 animate-slide-up" style={{animationDelay:`${i*0.1}s`}}>
                        <div className="flex items-center gap-4 mb-3">
                          <div className={`w-14 h-14 ${c.color} rounded-duo flex items-center justify-center text-white font-bold text-sm shadow-md`}>{c.title.split(' ').pop()}</div>
                          <h3 className="font-bold">{c.title}</h3>
                        </div>
                        <button onClick={()=>share(c.text)} className="w-full bg-gradient-primary text-white font-bold py-2.5 rounded-duo shadow-md btn-3d text-sm">{t('shareBtn')}</button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab==='profile'&&(
            <div className="p-6">
              <h1 className="text-2xl font-bold mb-6 animate-fade-in-up">{t('profileTitle')}</h1>
              <div className="bg-gradient-primary rounded-duo p-5 shadow-lg mb-4 flex items-center gap-4 text-white animate-slide-up">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center font-bold text-2xl">А</div>
                <div className="flex-1">
                  <h2 className="font-bold text-lg">Алекс</h2>
                  <p className="text-sm text-white/80">{userProfile.language} • {userProfile.level}</p>
                  <div className="flex gap-3 mt-1 text-sm font-bold">
                    <span>⭐ {data.xp} {t('xp')}</span>
                    <span>🔥 {data.currentStreak}</span>
                  </div>
                </div>
              </div>
              
              {data.savedPhrases.length > 0 && (
                <div className="bg-white rounded-duo p-5 shadow-sm border-2 border-gray-100 mb-4 animate-slide-up">
                  <h3 className="font-bold text-lg mb-3">💾 {t('savedPhrases')}</h3>
                  <div className="space-y-2">
                    {data.savedPhrases.map((p, i) => (
                      <div key={i} className="flex justify-between items-center bg-blue-50 rounded-duo p-3 border border-blue-100">
                        <span className="text-sm text-duo-text italic flex-1">"{p}"</span>
                        <button onClick={() => removeSavedPhrase(p)} className="ml-2 text-xs text-red-500 hover:text-red-700 font-bold">{t('removePhrase')}</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <h2 className="font-bold text-lg mb-3">{t('settings')}</h2>
              <div className="bg-white rounded-duo shadow-sm border-2 border-gray-100 mb-4 divide-y divide-gray-100 animate-slide-up">
                <div className="p-4 flex items-center justify-between">
                  <div className="font-bold text-sm">{t('pushNotif')}</div>
                  <button onClick={()=>updateData({notifEnabled:!data.notifEnabled})} className={`relative w-12 h-7 rounded-full transition-colors ${data.notifEnabled?'bg-accent-green':'bg-gray-300'}`}>
                    <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${data.notifEnabled?'translate-x-5':'translate-x-0.5'}`}/>
                  </button>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div className="font-bold text-sm">{t('interfaceLang')}</div>
                  <div className="flex bg-gray-100 rounded-full p-0.5">
                    <button onClick={()=>{setLang('ru');updateData({interfaceLang:'ru'});}} className={`px-4 py-1.5 rounded-full text-sm font-bold ${lang==='ru'?'bg-gradient-primary text-white':'text-duo-gray'}`}>RU</button>
                    <button onClick={()=>{setLang('en');updateData({interfaceLang:'en'});}} className={`px-4 py-1.5 rounded-full text-sm font-bold ${lang==='en'?'bg-gradient-primary text-white':'text-duo-gray'}`}>EN</button>
                  </div>
                </div>
              </div>
              
              <h2 className="font-bold text-lg mb-3">{t('support')}</h2>
              <div className="bg-white rounded-duo p-5 shadow-sm border-2 border-gray-100 mb-4 animate-slide-up">
                <p className="text-sm text-duo-gray mb-3">{t('supportSub')}</p>
                {sSent?(
                  <div className="text-center py-4"><div className="text-4xl mb-2 animate-celebrate">✅</div><p className="font-bold text-accent-green">{t('sent')}</p></div>
                ):(
                  <>
                    <textarea value={sMsg} onChange={(e)=>setSMsg(e.target.value)} placeholder={t('yourMessage')} className="w-full border-2 border-gray-200 rounded-duo p-3 focus:border-accent-purple focus:outline-none resize-none h-24 mb-3"/>
                    <button onClick={()=>{if(sMsg.trim())setSSent(true);}} className="w-full bg-gradient-secondary text-white font-bold py-2.5 rounded-duo shadow-md btn-3d">{t('send')}</button>
                  </>
                )}
              </div>
              
              <div className="mb-4">
                <button onClick={()=>setResetModal(true)} className="w-full bg-transparent border-2 border-orange-400 text-orange-500 font-bold py-3 rounded-duo hover:bg-orange-50">🔄 {t('resetProgress')}</button>
              </div>
              
              <div className="mt-4 mb-8">
                <button onClick={()=>setDelModal(true)} className="w-full bg-transparent border-2 border-red-400 text-red-500 font-bold py-3 rounded-duo hover:bg-red-50">{t('deleteAccount')}</button>
                <p className="text-xs text-duo-gray text-center mt-2">{t('deleteWarning')}</p>
              </div>
              
              {resetModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6 animate-fade-in-up">
                  <div className="bg-white rounded-duo p-6 w-full max-w-sm text-center">
                    <div className="text-5xl mb-4">🔄</div>
                    <h2 className="text-xl font-bold mb-2">{t('resetProgress')}</h2>
                    <p className="text-sm text-duo-gray mb-6">{t('resetConfirm')}</p>
                    <button onClick={resetAllProgress} className="w-full bg-orange-500 text-white font-bold py-3 rounded-duo hover:bg-orange-600 shadow-[0_4px_0_0_#EA580C] btn-3d mb-3">OK</button>
                    <button onClick={()=>setResetModal(false)} className="w-full text-duo-gray font-bold py-3 rounded-duo hover:bg-gray-100">{t('cancel')}</button>
                  </div>
                </div>
              )}
              
              {delModal&&(
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6 animate-fade-in-up">
                  <div className="bg-white rounded-duo p-6 w-full max-w-sm text-center">
                    <div className="text-5xl mb-4">⚠️</div>
                    <h2 className="text-xl font-bold mb-2">{t('deleteAccount')}</h2>
                    <p className="text-sm text-duo-gray mb-6">{t('deleteConfirm')}</p>
                    <button onClick={()=>{setDelModal(false);resetAllProgress();}} className="w-full bg-red-500 text-white font-bold py-3 rounded-duo hover:bg-red-600 shadow-[0_4px_0_0_#DC2626] btn-3d mb-3">{t('deleteYes')}</button>
                    <button onClick={()=>setDelModal(false)} className="w-full text-duo-gray font-bold py-3 rounded-duo hover:bg-gray-100">{t('cancel')}</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        {activeTab==='progress'&&(
          <div className="absolute bottom-16 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-12 z-10">
            {[{id:'badges',l:`🏅 ${t('badges')}`},{id:'streaks',l:`🔥 ${t('streaks')}`},{id:'share',l:`📤 ${t('share')}`}].map(x=>(
              <button key={x.id} onClick={()=>setProgressTab(x.id)} className={`flex-1 h-full text-sm font-bold ${progressTab===x.id?'text-duo-blue border-b-2 border-duo-blue':'text-duo-gray'}`}>{x.l}</button>
            ))}
          </div>
        )}

        <nav className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-16 z-10">
          {tabs.map(x=>(
            <button key={x.id} onClick={()=>{setActiveTab(x.id);if(x.id!=='clubs'){setClubsView('list');setSelectedClub(null);}}} className="flex flex-col items-center justify-center w-full h-full focus:outline-none">
              <Icon d={x.d} active={activeTab===x.id}/>
              <span className={`text-[10px] mt-1 font-bold uppercase tracking-wide ${activeTab===x.id?'text-duo-blue':'text-duo-gray'}`}>{t(x.id)}</span>
            </button>
          ))}
        </nav>
      </div>
    </>
  );
}

export default App;