/* ═══════════════════════════════════════════════════════════
   ЕДИНСТВЕННЫЙ ФАЙЛ, КОТОРЫЙ НУЖНО ПРАВИТЬ

   Порядок карточек в массиве STORY = порядок в альбоме.
   Пути к файлам — относительно корня, как в примерах.
   ═══════════════════════════════════════════════════════════ */

const CFG = {
  to:    'Аня',                  // кому
  from:  'Игорь',                // от кого
  me:    'igor',                 // твой @username без собаки
  sign:  'твой Игорь',           // подпись под телеграммой

  albumTitle: 'Наш архив',
  albumSub:   'сорок карточек, четыре года, одна линия связи',
  footNote:   'продолжение следует',

  // строки телеграммы; <em>…</em> печатается штемпельным красным
  telegram: [
    'Аня тчк',
    '',
    'Связь работает четвёртый год зпт',
    'обрывов не зафиксировано тчк',
    '',
    'К настоящей телеграмме прилагается',
    '<em>опись всего важного</em> тчк',
  ],

  speed: 34,                     // мс на символ телетайпа
};


/* ── ТИПЫ КАРТОЧЕК ───────────────────────────────────────────

   { type: 'chapter', title: '2023', note: 'год, когда всё началось' }

   { type: 'note', text: 'любой текст', hand: 'подпись от руки' }

   { type: 'photo', src: 'media/photo/01.webp',
     caption: 'подпись от руки', date: 'июль 2023', tilt: -2 }

   { type: 'collage', caption: '...', date: '...',
     items: ['media/photo/a.webp', 'media/photo/b.webp'] }   // 2–4 штуки

   { type: 'video', src: 'media/video/01.mp4',
     poster: 'media/video/01.jpg', caption: '...', date: '...' }

   { type: 'vinyl', title: 'Название трека', artist: 'Исполнитель',
     year: '2023', src: 'media/audio/01.m4a',
     label: '#B03A2E',            // цвет бумажного лейбла
     note: 'играло в машине по дороге домой',
     link: 'https://...' }        // «слушать целиком», можно убрать
   ─────────────────────────────────────────────────────────── */

const STORY = [

  { type: 'chapter', title: '2023', note: 'начало передачи' },

  { type: 'photo',
    src: 'media/photo/demo-1.webp',
    caption: 'первая наша фотография',
    date: 'июль 2023',
    tilt: -1.5 },

  { type: 'note',
    text: 'Ты тогда сказала, что у меня машина громко работает. Я ответил, что это турбина. Ты не поверила.',
    hand: 'а я до сих пор помню' },

  { type: 'vinyl',
    title: 'Название трека',
    artist: 'Исполнитель',
    year: '2023',
    src: 'media/audio/demo-1.m4a',
    label: '#B03A2E',
    note: 'играло в машине по дороге домой',
    link: '' },

  { type: 'photo',
    src: 'media/photo/demo-2.webp',
    caption: 'вертикальный кадр, чтобы видеть пропорции',
    date: 'сентябрь 2023',
    tilt: 1.2 },

  { type: 'chapter', title: '2024', note: 'поездки' },

  { type: 'collage',
    caption: 'три дня, которые слиплись в один',
    date: 'май 2024',
    items: ['media/photo/demo-3.webp', 'media/photo/demo-4.webp', 'media/photo/demo-5.webp'] },

  { type: 'video',
    src: 'media/video/demo-1.mp4',
    poster: 'media/video/demo-1.jpg',
    caption: 'ты смеёшься, я снимаю',
    date: 'май 2024' },

  { type: 'vinyl',
    title: 'Второй трек',
    artist: 'Другой исполнитель',
    year: '2024',
    src: 'media/audio/demo-1.m4a',
    label: '#2E5A88',
    note: 'проверь: запуск этой останавливает первую',
    link: 'https://music.yandex.ru' },

  { type: 'photo',
    src: 'media/photo/demo-6.webp',
    caption: 'и вот мы здесь',
    date: 'март 2025',
    tilt: -0.8 },

  { type: 'note',
    text: 'Демо-карточки выше можно удалить целиком. Оставь структуру и подставь своё.',
    hand: 'служебная пометка' },

];
