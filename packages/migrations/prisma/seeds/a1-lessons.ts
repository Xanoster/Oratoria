/**
 * Curated A1 lessons for Oratoria
 * These are pre-built lessons covering essential German basics
 */

export interface LessonSeed {
    level: string;
    title: string;
    content: LessonContent;
}

interface LessonContent {
    dialogue: Array<{ speaker: string; text: string; translation: string }>;
    pronunciationDrill: Array<{ word: string; phonetic: string; tip: string }>;
    grammarNote: { rule: string; examples: string[] };
    quiz: Array<{ type: 'cloze' | 'mcq'; question: string; answer: string; options?: string[] }>;
}

export const A1_LESSONS: LessonSeed[] = [
    {
        level: 'A1',
        title: 'Greetings and Introductions',
        content: {
            dialogue: [
                { speaker: 'Anna', text: 'Guten Tag!', translation: 'Good day!' },
                { speaker: 'Max', text: 'Hallo! Wie heißen Sie?', translation: 'Hello! What is your name?' },
                { speaker: 'Anna', text: 'Ich heiße Anna. Und Sie?', translation: 'My name is Anna. And you?' },
                { speaker: 'Max', text: 'Ich bin Max. Freut mich!', translation: 'I am Max. Nice to meet you!' },
                { speaker: 'Anna', text: 'Freut mich auch!', translation: 'Nice to meet you too!' },
            ],
            pronunciationDrill: [
                { word: 'Guten Tag', phonetic: '/ˈɡuːtn̩ taːk/', tip: 'The "g" is hard, "u" is long like "oo"' },
                { word: 'heißen', phonetic: '/ˈhaɪ̯sn̩/', tip: '"ß" sounds like a sharp "s", "ei" like English "eye"' },
                { word: 'Freut mich', phonetic: '/fʁɔɪ̯t mɪç/', tip: '"eu" sounds like "oy", "ch" is soft in "mich"' },
            ],
            grammarNote: {
                rule: 'The verb "sein" (to be): ich bin, du bist, Sie sind. "Heißen" follows regular conjugation: ich heiße, Sie heißen.',
                examples: ['Ich bin Anna.', 'Wie heißen Sie?', 'Sie sind sehr freundlich.'],
            },
            quiz: [
                { type: 'cloze', question: 'Ich ___ Anna. (to be)', answer: 'bin' },
                { type: 'mcq', question: 'How do you say "Nice to meet you"?', answer: 'Freut mich', options: ['Guten Tag', 'Freut mich', 'Auf Wiedersehen', 'Danke'] },
            ],
        },
    },
    {
        level: 'A1',
        title: 'Numbers 1-20',
        content: {
            dialogue: [
                { speaker: 'Cashier', text: 'Das macht sieben Euro.', translation: 'That will be seven euros.' },
                { speaker: 'Customer', text: 'Hier sind zehn Euro.', translation: 'Here are ten euros.' },
                { speaker: 'Cashier', text: 'Danke! Ihr Wechselgeld: drei Euro.', translation: 'Thanks! Your change: three euros.' },
                { speaker: 'Customer', text: 'Vielen Dank!', translation: 'Thank you very much!' },
            ],
            pronunciationDrill: [
                { word: 'eins', phonetic: '/aɪ̯ns/', tip: '"ei" sounds like English "eye"' },
                { word: 'zwei', phonetic: '/t͡svaɪ̯/', tip: '"z" sounds like "ts"' },
                { word: 'fünf', phonetic: '/fʏnf/', tip: '"ü" is like "ee" with rounded lips' },
                { word: 'zwanzig', phonetic: '/ˈt͡svant͡sɪç/', tip: 'Stress on first syllable' },
            ],
            grammarNote: {
                rule: 'German numbers 1-12 are unique. 13-19 add "-zehn". 20 is "zwanzig".',
                examples: ['eins, zwei, drei', 'zehn, elf, zwölf', 'dreizehn, vierzehn, fünfzehn'],
            },
            quiz: [
                { type: 'cloze', question: 'Sieben plus drei ist ___.', answer: 'zehn' },
                { type: 'mcq', question: 'What is "15" in German?', answer: 'fünfzehn', options: ['fünfzig', 'fünfzehn', 'funfzehn', 'füfzehn'] },
            ],
        },
    },
    {
        level: 'A1',
        title: 'Family Members',
        content: {
            dialogue: [
                { speaker: 'Lisa', text: 'Hast du Geschwister?', translation: 'Do you have siblings?' },
                { speaker: 'Tom', text: 'Ja, ich habe eine Schwester und einen Bruder.', translation: 'Yes, I have a sister and a brother.' },
                { speaker: 'Lisa', text: 'Wie heißen sie?', translation: 'What are their names?' },
                { speaker: 'Tom', text: 'Meine Schwester heißt Maria. Mein Bruder heißt Paul.', translation: 'My sister is called Maria. My brother is called Paul.' },
            ],
            pronunciationDrill: [
                { word: 'Mutter', phonetic: '/ˈmʊtɐ/', tip: 'Short "u", the final "er" becomes "ah"' },
                { word: 'Vater', phonetic: '/ˈfaːtɐ/', tip: '"V" sounds like "f" in German' },
                { word: 'Schwester', phonetic: '/ˈʃvɛstɐ/', tip: '"sch" sounds like English "sh"' },
            ],
            grammarNote: {
                rule: 'Possessive pronouns: mein/meine (my), dein/deine (your). "Mein" for masculine/neuter, "meine" for feminine/plural.',
                examples: ['Mein Vater', 'Meine Mutter', 'Mein Bruder', 'Meine Schwester'],
            },
            quiz: [
                { type: 'cloze', question: '___ Schwester heißt Anna. (my)', answer: 'Meine' },
                { type: 'mcq', question: 'What is "brother" in German?', answer: 'Bruder', options: ['Schwester', 'Bruder', 'Vater', 'Mutter'] },
            ],
        },
    },
    {
        level: 'A1',
        title: 'Food and Drinks',
        content: {
            dialogue: [
                { speaker: 'Waiter', text: 'Was möchten Sie trinken?', translation: 'What would you like to drink?' },
                { speaker: 'Guest', text: 'Ich möchte einen Kaffee, bitte.', translation: 'I would like a coffee, please.' },
                { speaker: 'Waiter', text: 'Und zu essen?', translation: 'And to eat?' },
                { speaker: 'Guest', text: 'Ein Brötchen mit Käse.', translation: 'A bread roll with cheese.' },
            ],
            pronunciationDrill: [
                { word: 'Kaffee', phonetic: '/kaˈfeː/', tip: 'Stress on second syllable, long "ee"' },
                { word: 'Brötchen', phonetic: '/ˈbʁøːtçən/', tip: '"ö" is like "er" with rounded lips' },
                { word: 'möchten', phonetic: '/ˈmœçtn̩/', tip: '"ö" is fronted, "ch" is soft' },
            ],
            grammarNote: {
                rule: '"Möchten" (would like) is very polite: ich möchte, du möchtest, Sie möchten.',
                examples: ['Ich möchte Wasser.', 'Möchten Sie Kaffee?', 'Was möchtest du essen?'],
            },
            quiz: [
                { type: 'cloze', question: 'Ich ___ einen Tee, bitte. (would like)', answer: 'möchte' },
                { type: 'mcq', question: 'What is "water" in German?', answer: 'Wasser', options: ['Wasser', 'Kaffee', 'Tee', 'Bier'] },
            ],
        },
    },
    {
        level: 'A1',
        title: 'Days and Time',
        content: {
            dialogue: [
                { speaker: 'A', text: 'Welcher Tag ist heute?', translation: 'What day is today?' },
                { speaker: 'B', text: 'Heute ist Montag.', translation: 'Today is Monday.' },
                { speaker: 'A', text: 'Wie spät ist es?', translation: 'What time is it?' },
                { speaker: 'B', text: 'Es ist drei Uhr.', translation: 'It is three o\'clock.' },
            ],
            pronunciationDrill: [
                { word: 'Montag', phonetic: '/ˈmoːntaːk/', tip: 'Long "o", final "g" sounds like "k"' },
                { word: 'Mittwoch', phonetic: '/ˈmɪtvɔx/', tip: '"ch" after "o" is guttural "ch"' },
                { word: 'Uhr', phonetic: '/uːɐ̯/', tip: 'Long "u", "hr" blends together' },
            ],
            grammarNote: {
                rule: 'Days of the week are masculine: der Montag, der Dienstag, etc. Time: "Es ist [number] Uhr."',
                examples: ['Am Montag', 'Es ist zehn Uhr.', 'Um drei Uhr'],
            },
            quiz: [
                { type: 'cloze', question: 'Heute ist ___.', answer: 'Montag' },
                { type: 'mcq', question: 'How do you ask "What time is it?"', answer: 'Wie spät ist es?', options: ['Wo ist es?', 'Wie spät ist es?', 'Wer ist es?', 'Was ist das?'] },
            ],
        },
    },
    {
        level: 'A1',
        title: 'Colors and Clothes',
        content: {
            dialogue: [
                { speaker: 'Seller', text: 'Kann ich Ihnen helfen?', translation: 'Can I help you?' },
                { speaker: 'Customer', text: 'Ja, ich suche ein blaues Hemd.', translation: 'Yes, I\'m looking for a blue shirt.' },
                { speaker: 'Seller', text: 'Welche Größe?', translation: 'What size?' },
                { speaker: 'Customer', text: 'Größe M, bitte.', translation: 'Size M, please.' },
            ],
            pronunciationDrill: [
                { word: 'blau', phonetic: '/blaʊ̯/', tip: '"au" sounds like "ow" in "cow"' },
                { word: 'Hemd', phonetic: '/hɛmt/', tip: 'Short "e", "d" at end sounds like "t"' },
                { word: 'grün', phonetic: '/ɡʁyːn/', tip: '"ü" is like "ee" with rounded lips' },
            ],
            grammarNote: {
                rule: 'Adjectives take endings before nouns: ein blaues Hemd (neuter), eine rote Jacke (feminine).',
                examples: ['Das blaue Hemd', 'Die rote Jacke', 'Der schwarze Hut'],
            },
            quiz: [
                { type: 'cloze', question: 'Ich suche eine ___ Jacke. (red)', answer: 'rote' },
                { type: 'mcq', question: 'What color is "grün"?', answer: 'green', options: ['red', 'blue', 'green', 'yellow'] },
            ],
        },
    },
    {
        level: 'A1',
        title: 'Directions',
        content: {
            dialogue: [
                { speaker: 'Tourist', text: 'Entschuldigung, wo ist der Bahnhof?', translation: 'Excuse me, where is the train station?' },
                { speaker: 'Local', text: 'Gehen Sie geradeaus, dann links.', translation: 'Go straight ahead, then left.' },
                { speaker: 'Tourist', text: 'Ist es weit?', translation: 'Is it far?' },
                { speaker: 'Local', text: 'Nein, etwa fünf Minuten.', translation: 'No, about five minutes.' },
            ],
            pronunciationDrill: [
                { word: 'Entschuldigung', phonetic: '/ɛntˈʃʊldɪɡʊŋ/', tip: 'Stress on second syllable' },
                { word: 'geradeaus', phonetic: '/ɡəˈʁaːdəˌʔaʊ̯s/', tip: 'Compound word: gerade + aus' },
                { word: 'links', phonetic: '/lɪŋks/', tip: '"i" is short' },
            ],
            grammarNote: {
                rule: 'Imperatives with "Sie": Gehen Sie (go), Nehmen Sie (take), Biegen Sie ab (turn).',
                examples: ['Gehen Sie links.', 'Nehmen Sie die erste Straße rechts.', 'Biegen Sie hier ab.'],
            },
            quiz: [
                { type: 'cloze', question: 'Gehen Sie ___, dann rechts. (straight)', answer: 'geradeaus' },
                { type: 'mcq', question: 'What is "right" in German?', answer: 'rechts', options: ['links', 'rechts', 'geradeaus', 'zurück'] },
            ],
        },
    },
    {
        level: 'A1',
        title: 'Weather',
        content: {
            dialogue: [
                { speaker: 'A', text: 'Wie ist das Wetter heute?', translation: 'How is the weather today?' },
                { speaker: 'B', text: 'Es ist sonnig und warm.', translation: 'It is sunny and warm.' },
                { speaker: 'A', text: 'Schön! Perfekt für einen Spaziergang.', translation: 'Nice! Perfect for a walk.' },
            ],
            pronunciationDrill: [
                { word: 'Wetter', phonetic: '/ˈvɛtɐ/', tip: '"W" sounds like "V"' },
                { word: 'sonnig', phonetic: '/ˈzɔnɪç/', tip: '"s" before vowel is "z" sound' },
                { word: 'Regen', phonetic: '/ˈʁeːɡn̩/', tip: 'Long "e", "g" before "e" is hard' },
            ],
            grammarNote: {
                rule: 'Weather expressions use "es": Es ist warm. Es regnet. Es schneit.',
                examples: ['Es ist kalt.', 'Es regnet.', 'Es ist bewölkt.'],
            },
            quiz: [
                { type: 'cloze', question: 'Es ___ heute. (is raining)', answer: 'regnet' },
                { type: 'mcq', question: 'What does "kalt" mean?', answer: 'cold', options: ['hot', 'cold', 'warm', 'sunny'] },
            ],
        },
    },
    {
        level: 'A1',
        title: 'Daily Routine',
        content: {
            dialogue: [
                { speaker: 'A', text: 'Wann stehst du auf?', translation: 'When do you get up?' },
                { speaker: 'B', text: 'Ich stehe um sieben Uhr auf.', translation: 'I get up at seven o\'clock.' },
                { speaker: 'A', text: 'Und wann gehst du ins Bett?', translation: 'And when do you go to bed?' },
                { speaker: 'B', text: 'Um elf Uhr.', translation: 'At eleven o\'clock.' },
            ],
            pronunciationDrill: [
                { word: 'aufstehen', phonetic: '/ˈaʊ̯fʃteːən/', tip: 'Separable verb: "auf" separates' },
                { word: 'frühstücken', phonetic: '/ˈfʁyːʃtʏkn̩/', tip: '"ü" is fronted' },
                { word: 'schlafen', phonetic: '/ˈʃlaːfn̩/', tip: 'Long "a", "sch" = "sh"' },
            ],
            grammarNote: {
                rule: 'Separable verbs: prefix moves to end. "Ich stehe um 7 Uhr auf." (aufstehen)',
                examples: ['Ich wache auf.', 'Er steht auf.', 'Wir gehen aus.'],
            },
            quiz: [
                { type: 'cloze', question: 'Ich stehe um sieben Uhr ___. (up)', answer: 'auf' },
                { type: 'mcq', question: 'What is "to sleep"?', answer: 'schlafen', options: ['schlafen', 'essen', 'trinken', 'gehen'] },
            ],
        },
    },
    {
        level: 'A1',
        title: 'Hobbies and Free Time',
        content: {
            dialogue: [
                { speaker: 'A', text: 'Was machst du gern in deiner Freizeit?', translation: 'What do you like to do in your free time?' },
                { speaker: 'B', text: 'Ich lese gern Bücher und höre Musik.', translation: 'I like to read books and listen to music.' },
                { speaker: 'A', text: 'Spielst du auch Fußball?', translation: 'Do you also play football?' },
                { speaker: 'B', text: 'Ja, manchmal am Wochenende.', translation: 'Yes, sometimes on the weekend.' },
            ],
            pronunciationDrill: [
                { word: 'Freizeit', phonetic: '/ˈfʁaɪ̯t͡saɪ̯t/', tip: 'Compound: frei + Zeit' },
                { word: 'Bücher', phonetic: '/ˈbyːçɐ/', tip: '"ü" like "ee" with rounded lips' },
                { word: 'Fußball', phonetic: '/ˈfuːsbal/', tip: '"ß" is sharp "s"' },
            ],
            grammarNote: {
                rule: '"Gern" after verb means "like to": Ich lese gern. Ich spiele gern Fußball.',
                examples: ['Ich koche gern.', 'Sie tanzt gern.', 'Wir reisen gern.'],
            },
            quiz: [
                { type: 'cloze', question: 'Ich spiele ___ Fußball. (like to)', answer: 'gern' },
                { type: 'mcq', question: 'What is "to read"?', answer: 'lesen', options: ['hören', 'spielen', 'lesen', 'tanzen'] },
            ],
        },
    },
];

export default A1_LESSONS;
