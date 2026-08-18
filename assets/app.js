/* ═════════ движок альбома — править не нужно ═════════ */

const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready(); tg.expand();
  tg.setHeaderColor?.('#14100C');
  tg.setBackgroundColor?.('#14100C');
  tg.disableVerticalSwipes?.();
}

const $  = id => document.getElementById(id);
const el = (tag, cls) => { const n = document.createElement(tag); if (cls) n.className = cls; return n; };
const sleep  = ms => new Promise(r => setTimeout(r, ms));
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const buzz   = (k = 'light') => tg?.HapticFeedback?.impactOccurred?.(k);

const store = {
  get(k, d) { try { return localStorage.getItem(k) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
};

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
  $('shell').hidden = false;
  setMode(store.get('mode', 'scroll'));
});

/* ── ШАПКА ──────────────────────────────────────────── */
document.querySelector('.album-title').textContent = CFG.albumTitle;
document.querySelector('.album-sub').textContent   = CFG.albumSub;
document.querySelector('.foot-sign').textContent   = CFG.sign;
document.querySelector('.foot-note').textContent   = CFG.footNote;

/* ── ЕДИНЫЙ ПРОИГРЫВАТЕЛЬ ───────────────────────────── */
const audio = new Audio();
audio.preload = 'none';
let current = null;

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
  if (same && !audio.paused) { audio.pause(); record.classList.remove('playing'); buzz('soft'); return; }
  if (!same) { stopAll(); audio.src = src; }
  audio.play().then(() => {
    record.classList.add('playing');
    current = { record, fill };
    buzz('medium');
  }).catch(() => {});
}

/* ── РЕНДЕР КАРТОЧЕК ────────────────────────────────── */
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

document.addEventListener('error', e => {
  const t = e.target;
  if (t.tagName !== 'IMG' || t.id === 'lightbox-img' || !t.getAttribute('src')) return;
  const ph = el('div', 'missing');
  ph.textContent = 'нет файла: ' + t.getAttribute('src');
  t.replaceWith(ph);
}, true);

/* карточки строятся один раз и переезжают между режимами */
const CARDS = STORY.map(d => {
  const build = render[d.type];
  if (!build) { console.warn('Неизвестный тип карточки:', d.type); return null; }
  const card = el('div', 'card');
  card.appendChild(build(d));
  return card;
}).filter(Boolean);

/* ── РЕЖИМ «ЛЕНТА» ──────────────────────────────────── */
function mountScroll() {
  const feed = $('feed');
  CARDS.forEach(c => { c.classList.remove('seen'); feed.appendChild(c); });
  observeCards();
}

function observeCards() {
  const cards = document.querySelectorAll('#feed .card:not(.seen)');
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

/* ── РЕЖИМ «КНИГА» ──────────────────────────────────── */
const book = $('book');
let pages = [];
let idx = 0;

function mountBook() {
  book.innerHTML = '';
  pages = CARDS.map((card, i) => {
    const page = el('div', 'page');
    const front = el('div', 'face face-front');
    const back  = el('div', 'face face-back');
    const shade = el('div', 'shade');
    card.classList.add('seen');
    front.appendChild(card);
    page.append(back, front, shade);
    page.dataset.i = i;
    book.appendChild(page);
    return page;
  });
  idx = Math.min(idx, pages.length - 1);
  layout(true);
}

function layout(instant) {
  pages.forEach((p, i) => {
    const flipped = i < idx;
    p.classList.toggle('anim', !instant && !reduce);
    p.style.zIndex = flipped ? i : 1000 - i;
    p.style.transform = `rotateY(${flipped ? -180 : 0}deg)`;
    p.querySelector('.shade').style.opacity = flipped ? 0 : 0;
    // держим в DOM только соседей
    p.classList.toggle('off', Math.abs(i - idx) > 1);
  });
  const face = pages[idx]?.querySelector('.face-front');
  if (face) { face.scrollTop = 0; addMoreHint(face); }
  $('pageno').textContent = (idx + 1) + ' / ' + pages.length;
  $('prev').disabled = idx === 0;
  $('next').disabled = idx === pages.length - 1;
}

function addMoreHint(face) {
  face.querySelector('.more')?.remove();
  requestAnimationFrame(() => {
    if (face.scrollHeight - face.clientHeight < 40) return;
    const m = el('div', 'more');
    m.textContent = '↓';
    face.appendChild(m);
    face.addEventListener('scroll', () => m.remove(), { once: true });
  });
}

function goTo(n) {
  n = Math.max(0, Math.min(pages.length - 1, n));
  if (n === idx) return;
  idx = n;
  buzz('light');
  layout(false);
}

$('next').addEventListener('click', () => goTo(idx + 1));
$('prev').addEventListener('click', () => goTo(idx - 1));

/* ── ЖЕСТ: горизонталь листает, вертикаль скроллит ──── */
let g = null;

book.addEventListener('touchstart', e => {
  if (!$('lightbox').hidden || e.touches.length !== 1) return;
  const t = e.touches[0];
  g = { x0: t.clientX, y0: t.clientY, axis: null, page: null, dir: 0, t0: Date.now() };
}, { passive: true });

book.addEventListener('touchmove', e => {
  if (!g || e.touches.length !== 1) return;
  const t = e.touches[0];
  const dx = t.clientX - g.x0, dy = t.clientY - g.y0;

  if (!g.axis) {
    if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
    g.axis = Math.abs(dx) > Math.abs(dy) * 1.2 ? 'x' : 'y';
    if (g.axis === 'x') {
      g.dir = dx < 0 ? 1 : -1;
      const target = g.dir === 1 ? idx : idx - 1;
      if (target < 0 || target > pages.length - 1) { g = null; return; }
      g.page = pages[target];
      g.page.classList.remove('anim');
    }
  }
  if (g.axis !== 'x') return;          // вертикаль — отдаём нативному скроллу

  e.preventDefault();
  const w = book.clientWidth || 1;
  let deg = g.dir === 1
    ? Math.max(-180, Math.min(0, dx / w * 180))
    : Math.max(-180, Math.min(0, -180 + dx / w * 180));
  g.page.style.transform = `rotateY(${deg}deg)`;
  g.page.querySelector('.shade').style.opacity = Math.min(.75, Math.abs(deg) / 180 * .9);
}, { passive: false });

book.addEventListener('touchend', () => {
  if (!g) return;
  if (g.axis === 'x' && g.page) {
    const m = /rotateY\((-?[\d.]+)deg\)/.exec(g.page.style.transform);
    const deg = m ? parseFloat(m[1]) : 0;
    const fast = Date.now() - g.t0 < 260;
    g.page.classList.add('anim');
    g.page.querySelector('.shade').style.opacity = 0;
    const past = Math.abs(deg) > 90;
    if (g.dir === 1) (past || (fast && deg < -20)) ? goTo(idx + 1) : layout(false);
    else             (!past || (fast && deg > -160)) ? goTo(idx - 1) : layout(false);
  }
  g = null;
});

/* ── ПЕРЕКЛЮЧАТЕЛЬ РЕЖИМОВ ──────────────────────────── */
let mode = null;

function setMode(m) {
  if (m === mode) return;
  mode = m;
  store.set('mode', m);
  const bookOn = m === 'book';
  $('book-mode').hidden = !bookOn;
  $('scroll-mode').hidden = bookOn;
  document.body.style.overflow = bookOn ? 'hidden' : '';
  $('mode-toggle').textContent = bookOn ? 'Лента' : 'Страницы';
  if (bookOn) mountBook(); else { mountScroll(); window.scrollTo(0, 0); }
}

$('mode-toggle').addEventListener('click', () => {
  buzz('medium');
  setMode(mode === 'book' ? 'scroll' : 'book');
});

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
  $('lightbox-img').removeAttribute('src');
  document.body.style.overflow = mode === 'book' ? 'hidden' : '';
  tg?.BackButton?.hide();
}
lb.addEventListener('click', closeLightbox);
tg?.BackButton?.onClick?.(closeLightbox);

/* клавиатура — для проверки на компьютере */
document.addEventListener('keydown', e => {
  if (mode !== 'book') return;
  if (e.key === 'ArrowRight') goTo(idx + 1);
  if (e.key === 'ArrowLeft')  goTo(idx - 1);
});
