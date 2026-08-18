/* ═════════ движок альбома — править не нужно ═════════ */

const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready(); tg.expand();
  tg.setHeaderColor?.('#14100C');
  tg.setBackgroundColor?.('#14100C');
  tg.disableVerticalSwipes?.();      // чтобы скролл не закрывал приложение
}

const $  = id => document.getElementById(id);
const el = (tag, cls) => { const n = document.createElement(tag); if (cls) n.className = cls; return n; };
const sleep  = ms => new Promise(r => setTimeout(r, ms));
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const buzz   = (k = 'light') => tg?.HapticFeedback?.impactOccurred?.(k);

/* ── ТЕЛЕГРАММА ─────────────────────────────────────── */
$('m-to').textContent   = CFG.to;
$('m-from').textContent = 'Откуда: ' + CFG.from;
$('sign').textContent   = CFG.sign;

const text = CFG.telegram.join('\n');
const tape = $('tape');

async function type() {
  if (reduce) {
    tape.innerHTML = text.replace(/<em>/g, '<span class="em">').replace(/<\/em>/g, '</span>');
    return finish();
  }
  let out = '', i = 0;
  const caret = '<span class="caret"></span>';
  while (i < text.length) {
    if (text.startsWith('<em>', i))  { out += '<span class="em">'; i += 4; continue; }
    if (text.startsWith('</em>', i)) { out += '</span>';           i += 5; continue; }
    out += text[i];
    if (text[i] !== ' ' && text[i] !== '\n' && i % 3 === 0) buzz();
    i++;
    tape.innerHTML = out + caret;
    await sleep(text[i - 1] === '\n' ? CFG.speed * 7 : CFG.speed + Math.random() * 22);
  }
  tape.innerHTML = out;
  finish();
}

function finish() {
  setTimeout(() => {
    $('stamp').classList.add('hit');
    buzz('heavy');
    setTimeout(() => $('sign').classList.add('on'), 400);
    setTimeout(() => $('open-album').classList.add('on'), 800);
  }, reduce ? 0 : 500);
}

$('seal').addEventListener('click', () => {
  $('seal').classList.add('gone');
  $('blank').classList.add('unfold');
  buzz('medium');
  setTimeout(type, reduce ? 0 : 700);
});

$('open-album').addEventListener('click', () => {
  buzz('medium');
  $('intro').classList.add('gone');
  $('album').hidden = false;
  window.scrollTo(0, 0);
  observeCards();
});

/* ── ШАПКА АЛЬБОМА ──────────────────────────────────── */
$('album-title').textContent = CFG.albumTitle;
$('album-sub').textContent   = CFG.albumSub;
$('foot-sign').textContent   = CFG.sign;
$('foot-note').textContent   = CFG.footNote;

/* ── ЕДИНЫЙ ПРОИГРЫВАТЕЛЬ ───────────────────────────── */
const audio = new Audio();
audio.preload = 'none';
let current = null;                 // { record, fill }

function stopAll() {
  audio.pause();
  if (current) { current.record.classList.remove('playing'); current.fill.style.width = '0%'; }
  current = null;
}
audio.addEventListener('timeupdate', () => {
  if (current && audio.duration) current.fill.style.width = (audio.currentTime / audio.duration * 100) + '%';
});
audio.addEventListener('ended', stopAll);

function toggleTrack(src, record, fill) {
  const same = current && current.record === record;
  if (same && !audio.paused) {                 // пауза: диск замирает
    audio.pause();
    record.classList.remove('playing');
    buzz('soft');
    return;
  }
  if (!same) { stopAll(); audio.src = src; }
  audio.play().then(() => {
    record.classList.add('playing');
    current = { record, fill };
    buzz('medium');                            // игла опускается
  }).catch(() => {
    fill.parentElement.insertAdjacentHTML('afterend',
      '<p class="artist">Трек не загрузился</p>');
  });
}

/* ── РЕНДЕР КАРТОЧЕК ────────────────────────────────── */
const feed = $('feed');

const render = {

  chapter(d) {
    const c = el('div', 'chapter');
    c.innerHTML = `<h3>${d.title}</h3>${d.note ? `<p class="eyebrow">${d.note}</p>` : ''}<div class="bar"></div>`;
    return c;
  },

  note(d) {
    const s = el('div', 'sheet');
    s.innerHTML = `<p class="note-text">${d.text}</p>${d.hand ? `<p class="note-hand">${d.hand}</p>` : ''}`;
    return s;
  },

  photo(d) {
    const s = el('div', 'sheet');
    if (d.tilt) s.style.transform = `rotate(${d.tilt}deg)`;
    const box = el('div', 'photo-frame');
    const img = el('img');
    img.src = d.src; img.alt = d.caption || ''; img.loading = 'lazy';
    box.appendChild(img);
    box.addEventListener('click', () => openLightbox(d.src));
    s.appendChild(box);
    s.insertAdjacentHTML('beforeend', caption(d));
    s.insertAdjacentHTML('beforeend', '<i class="corner tl"></i><i class="corner br"></i>');
    return s;
  },

  collage(d) {
    const s = el('div', 'sheet');
    const g = el('div', 'collage n' + Math.min(d.items.length, 4));
    d.items.slice(0, 4).forEach(src => {
      const img = el('img');
      img.src = src; img.alt = ''; img.loading = 'lazy';
      img.addEventListener('click', () => openLightbox(src));
      g.appendChild(img);
    });
    s.appendChild(g);
    s.insertAdjacentHTML('beforeend', caption(d));
    return s;
  },

  video(d) {
    const s = el('div', 'sheet');
    const box = el('div', 'video-box');
    box.innerHTML = `<img src="${d.poster}" alt="" loading="lazy"><div class="play"><span>&#9654;</span></div>`;
    box.addEventListener('click', function once() {
      stopAll();
      box.removeEventListener('click', once);
      box.innerHTML = '';
      const v = el('video');
      v.src = d.src; v.controls = true; v.playsInline = true; v.autoplay = true; v.poster = d.poster;
      box.appendChild(v);
      buzz('medium');
    });
    s.appendChild(box);
    s.insertAdjacentHTML('beforeend', caption(d));
    return s;
  },

  vinyl(d) {
    const s = el('div', 'sheet vinyl-card');

    const tt = el('div', 'turntable');
    const rec = el('div', 'record');
    const lab = el('div', 'label');
    lab.style.background = d.label || '#B03A2E';
    lab.innerHTML = `${d.year || ''}<i></i>`;
    rec.appendChild(lab);
    const arm = el('div', 'tonearm');
    tt.append(rec, arm);

    const meta = el('div', 'vinyl-meta');
    meta.innerHTML =
      `<h4>${d.title}</h4>` +
      `<p class="artist">${d.artist || ''}</p>` +
      (d.note ? `<p class="note">${d.note}</p>` : '') +
      `<div class="bar-wrap"><div class="bar-fill"></div></div>` +
      (d.link ? `<a href="${d.link}" target="_blank" rel="noopener">Слушать целиком</a>` : '');

    const fill = meta.querySelector('.bar-fill');
    tt.addEventListener('click', () => toggleTrack(d.src, rec, fill));

    s.append(tt, meta);
    return s;
  },
};

function caption(d) {
  if (!d.caption && !d.date) return '';
  return `<div class="cap"><span class="hand">${d.caption || ''}</span>` +
         `<span class="date">${d.date || ''}</span></div>`;
}

/* подсказка при сборке: сразу видно, какой файл не подложен */
document.addEventListener('error', e => {
  const t = e.target;
  if (t.tagName !== 'IMG') return;
  const ph = el('div', 'missing');
  ph.textContent = 'нет файла: ' + t.getAttribute('src');
  t.replaceWith(ph);
}, true);

STORY.forEach(d => {
  const build = render[d.type];
  if (!build) { console.warn('Неизвестный тип карточки:', d.type); return; }
  const card = el('div', 'card');
  card.appendChild(build(d));
  feed.appendChild(card);
});

/* ── ПОЯВЛЕНИЕ ПРИ СКРОЛЛЕ ──────────────────────────── */
function observeCards() {
  const cards = document.querySelectorAll('.card:not(.seen)');
  if (reduce || !('IntersectionObserver' in window)) {
    cards.forEach(c => c.classList.add('seen'));
    return;
  }
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('seen'); obs.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -12% 0px' });
  cards.forEach(c => io.observe(c));
}

/* ── ПРОСМОТР ФОТО ──────────────────────────────────── */
const lb = $('lightbox');
function openLightbox(src) {
  $('lightbox-img').src = src;
  lb.hidden = false;
  document.body.style.overflow = 'hidden';
  tg?.BackButton?.show();
}
function closeLightbox() {
  lb.hidden = true;
  $('lightbox-img').src = '';
  document.body.style.overflow = '';
  tg?.BackButton?.hide();
}
lb.addEventListener('click', closeLightbox);
tg?.BackButton?.onClick?.(closeLightbox);
