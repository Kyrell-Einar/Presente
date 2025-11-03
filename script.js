/* ============================
   script.js — versão completa
   ============================ */

/* Helpers */
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

/* =========================
   MÚSICA DE FUNDO (fallback)
   ========================= */
const bgMusic = $('#bg-music'); // id do seu audio no HTML
let musicStarted = false;
function tryStartMusic() {
  if (!bgMusic || musicStarted) return;
  bgMusic.volume = 0.35;
  bgMusic.play().then(() => {
    musicStarted = true;
  }).catch(() => {
    // autoplay bloqueado: aguarda interação do usuário
    const startOnInteraction = () => {
      bgMusic.play().catch(()=>{}); // tentar tocar de novo
      musicStarted = true;
      document.removeEventListener('click', startOnInteraction);
      document.removeEventListener('touchstart', startOnInteraction);
      document.removeEventListener('scroll', startOnInteraction);
    };
    document.addEventListener('click', startOnInteraction, { once: true });
    document.addEventListener('touchstart', startOnInteraction, { once: true });
    document.addEventListener('scroll', startOnInteraction, { once: true });
  });
}
window.addEventListener('load', tryStartMusic);

/* =========================
   CANVAS: ESTRELAS + CHUVA
   ========================= */
const canvas = $('#background');
let ctx = null;
if (canvas && canvas.getContext) {
  ctx = canvas.getContext('2d');
  let W = canvas.width = window.innerWidth;
  let H = canvas.height = window.innerHeight;

  const stars = Array.from({length:140}, () => ({
    x: Math.random()*W,
    y: Math.random()*H,
    r: Math.random()*1.6 + 0.3,
    tw: Math.random()*3000 + 1000,
    to: Math.random()*3000
  }));

  const rain = Array.from({length:140}, () => ({
    x: Math.random()*W,
    y: Math.random()*H,
    l: Math.random()*14 + 8,
    vy: 4 + Math.random()*3,
    drift: (Math.random()-0.5) * 0.6
  }));

  function resizeCanvas() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    // opcional: reposicionar drops
    for (let s of stars) { s.x = Math.random()*W; s.y = Math.random()*H; }
    for (let r of rain) { r.x = Math.random()*W; r.y = Math.random()*H; }
  }
  window.addEventListener('resize', resizeCanvas);

  function draw(ts) {
    ctx.clearRect(0,0,W,H);

    // estrelas (pulsando lentamente)
    for (let s of stars) {
      const a = 0.4 + 0.6 * Math.sin((ts + s.to)/s.tw);
      ctx.globalAlpha = a;
      ctx.beginPath();
      ctx.fillStyle = "#ffffff";
      ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // chuva (linhas)
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(173,216,230,0.55)';
    for (let r of rain) {
      ctx.beginPath();
      ctx.moveTo(r.x, r.y);
      ctx.lineTo(r.x + r.drift*5, r.y + r.l);
      ctx.stroke();

      r.y += r.vy;
      r.x += r.drift;
      if (r.y > H) {
        r.y = -r.l - Math.random()*50;
        r.x = Math.random()*W;
      }
      if (r.x > W) r.x = 0;
      if (r.x < 0) r.x = W;
    }

    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
}

/* =========================
   FADE-IN DAS SEÇÕES & FOTOS
   ========================= */
const sections = $$('section');
if (sections.length) {
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) en.target.classList.add('visible');
    });
  }, { threshold: 0.2 });

  sections.forEach(s => {
    s.classList.add('hidden');
    sectionObserver.observe(s);
  });
}

const photos = $$('.carousel img');
if (photos.length) {
  const photoObserver = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) en.target.classList.add('visible-photo');
    });
  }, { threshold: 0.2 });

  photos.forEach(p => {
    p.classList.add('hidden-photo');
    photoObserver.observe(p);
  });
}

/* =========================
   TIMELINE EM CASCATA
   ========================= */
const timelineEvents = $$('.timeline .event');
if (timelineEvents.length) {
  const timelineObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        timelineEvents.forEach((ev, i) => setTimeout(()=> ev.classList.add('visible-event'), i*280));
      }
    });
  }, { threshold: 0.2 });

  timelineEvents.forEach(ev => timelineObserver.observe(ev));
}

/* =========================
   CONTADOR REGRESSIVO (próximo evento)
   ========================= */
const timerEl = $('#timer');
const eventsList = [
  { name: "Aniversário de namoro", date: "2025-11-09T00:00:00" },
  { name: "Seu aniversário", date: "2026-04-04T00:00:00" },
  { name: "Aniversário dela", date: "2026-09-09T00:00:00" },
  { name: "Natal", date: "2025-12-25T00:00:00" },
  { name: "Ano Novo", date: "2026-01-01T00:00:00" }
];

function getNextEventObj() {
  const now = new Date();
  const future = eventsList.map(e => {
    const d = new Date(e.date);
    // if already passed this year, set next year
    if (d <= now) {
      d.setFullYear(now.getFullYear() + 1);
    }
    return { name: e.name, date: d };
  }).sort((a,b) => a.date - b.date);
  return future[0];
}

function updateTimer() {
  if (!timerEl) return;
  const ev = getNextEventObj();
  const diff = ev.date - new Date();
  if (diff <= 0) { timerEl.textContent = `${ev.name} chegou!`; return; }
  const days = Math.floor(diff / (1000*60*60*24));
  const hours = Math.floor((diff % (1000*60*60*24)) / (1000*60*60));
  const mins = Math.floor((diff % (1000*60*60)) / (1000*60));
  const secs = Math.floor((diff % (1000*60)) / 1000);
  timerEl.textContent = `${ev.name} em ${days}d ${hours}h ${mins}m ${secs}s`;
}
setInterval(updateTimer, 1000);
updateTimer();

/* =========================
   CARROSSEL INFINITO (clonagem tripla + swipe)
   ========================= */
const carouselTrack = $('.carousel-track');
if (carouselTrack) {
  const originalSlides = Array.from(carouselTrack.children);
  if (originalSlides.length === 0) {
    // nada a fazer
  } else {
    // cria 3 grupos (para looping infinito)
    carouselTrack.innerHTML =
      originalSlides.map(n => n.outerHTML).join('') +
      originalSlides.map(n => n.outerHTML).join('') +
      originalSlides.map(n => n.outerHTML).join('');
    let allSlides = Array.from(carouselTrack.children);
    let slideWidth = allSlides[0].getBoundingClientRect().width;
    let currentIndex = originalSlides.length; // começo no grupo do meio
    carouselTrack.style.transform = `translateX(-${currentIndex * slideWidth}px)`;

    const nextBtn = $('.carousel .next');
    const prevBtn = $('.carousel .prev');

    function setPosition(animate=true) {
      carouselTrack.style.transition = animate ? 'transform 0.5s ease' : 'none';
      carouselTrack.style.transform = `translateX(-${currentIndex * slideWidth}px)`;
    }

    function loopFix() {
      // se passar limite, pular sem animação para o centro
      if (currentIndex >= 2 * originalSlides.length) {
        currentIndex = originalSlides.length;
        setPosition(false);
      }
      if (currentIndex < originalSlides.length) {
        currentIndex = 2 * originalSlides.length - 1;
        setPosition(false);
      }
    }

    if (nextBtn) nextBtn.addEventListener('click', () => { currentIndex++; setPosition(true); });
    if (prevBtn) prevBtn.addEventListener('click', () => { currentIndex--; setPosition(true); });

    carouselTrack.addEventListener('transitionend', loopFix);

    // auto slide
    let auto = setInterval(()=> { currentIndex++; setPosition(true); }, 4500);
    carouselTrack.addEventListener('mouseenter', ()=> clearInterval(auto));
    carouselTrack.addEventListener('mouseleave', ()=> auto = setInterval(()=> { currentIndex++; setPosition(true); }, 4500));

    // swipe mobile
    let startX = 0;
    carouselTrack.addEventListener('touchstart', e => { startX = e.touches[0].clientX; });
    carouselTrack.addEventListener('touchend', e => {
      const endX = e.changedTouches[0].clientX;
      if (startX - endX > 50) { currentIndex++; setPosition(true); }
      if (endX - startX > 50) { currentIndex--; setPosition(true); }
    });

    // ajustar em resize
    window.addEventListener('resize', () => {
      allSlides = Array.from(carouselTrack.children);
      slideWidth = allSlides[0] ? allSlides[0].getBoundingClientRect().width : slideWidth;
      setPosition(false);
    });
  }
}

/* =========================
   CORAÇÕES AO CLICAR (efeito) + efeito duplo clique nas fotos
   ========================= */
const clickSound = $('#click-sound'); // opcional; verifica existência
document.body.addEventListener('click', (e) => {
  if (clickSound) { try { clickSound.currentTime = 0; clickSound.play().catch(()=>{}); } catch(_){} }
  const heart = document.createElement('div');
  heart.textContent = '💖';
  Object.assign(heart.style, {
    position: 'absolute',
    left: (e.pageX - 15) + 'px',
    top: (e.pageY - 15) + 'px',
    fontSize: '1.6rem',
    pointerEvents: 'none',
    transition: 'all 0.9s ease-out',
    zIndex: 9999
  });
  document.body.appendChild(heart);
  requestAnimationFrame(() => {
    heart.style.top = (e.pageY - 70) + 'px';
    heart.style.opacity = '0';
  });
  setTimeout(()=> heart.remove(), 900);
});

photos.forEach(img => {
  img.addEventListener('dblclick', () => {
    const rect = img.getBoundingClientRect();
    const heart = document.createElement('div');
    heart.textContent = '💘';
    Object.assign(heart.style, {
      position: 'absolute',
      left: (rect.left + rect.width/2 - 18) + 'px',
      top: (rect.top + rect.height/2 - 18) + 'px',
      fontSize: '2rem',
      pointerEvents: 'none',
      transition: 'all 1s ease-out',
      zIndex: 9999
    });
    document.body.appendChild(heart);
    requestAnimationFrame(()=> {
      heart.style.top = (parseFloat(heart.style.top) - 80) + 'px';
      heart.style.opacity = '0';
    });
    setTimeout(()=> heart.remove(), 1000);
  });
});

/* =========================
   EASTER EGG (5 cliques no header)
   ========================= */
let headerClicks = 0;
const headerEl = $('.header');
if (headerEl) {
  headerEl.addEventListener('click', () => {
    headerClicks++;
    if (headerClicks === 5) {
      const egg = $('#easter-egg');
      if (egg) {
        egg.style.display = 'block';
        setTimeout(()=> egg.style.display = 'none', 3000);
      }
      headerClicks = 0;
    }
  });
}

/* =========================
   POEMA: digitação por parágrafo com pausas naturais
   ========================= */
const poemContainer = $('#poem-text');
if (poemContainer) {
  // se já houver <p> no HTML, usa cada um; caso contrário, tenta quebrar por \n\n
  let paras = Array.from(poemContainer.querySelectorAll('p')).map(p => p.innerHTML.trim());
  if (paras.length === 0) {
    const raw = poemContainer.textContent.trim();
    paras = raw.length ? raw.split(/\n\s*\n/) : [];
  }
  // limpa container antes de digitar
  poemContainer.innerHTML = '';

  const CHAR_DELAY = 48; // ms por caractere (ajustável)
  const PUNCT_PAUSE_EXTRA = 200; // pausa extra após . ! ?
  const PARA_PAUSE = 700; // pausa entre parágrafos

  // função que digita HTML simples (mantém <br>)
  async function typeParagraphHtml(htmlText) {
    // converte html simples em sequência de caracteres, tratando <br> como '\n'
    const tmp = document.createElement('div');
    tmp.innerHTML = htmlText;
    // extrair conteúdo com marcação <br> convertida para '\n'
    const nodes = [];
    tmp.childNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) nodes.push(node.textContent);
      else if (node.nodeType === Node.ELEMENT_NODE && node.tagName.toLowerCase() === 'br') nodes.push('\n');
      else nodes.push(node.textContent || '');
    });
    const full = nodes.join('');

    const p = document.createElement('p');
    poemContainer.appendChild(p);

    for (let i=0;i<full.length;i++) {
      const ch = full.charAt(i);
      if (ch === '\n') {
        p.innerHTML += '<br>';
      } else {
        p.textContent += ch;
      }
      // pausa extra em pontuação
      let extra = 0;
      if (ch === '.' || ch === '!' || ch === '?') extra = PUNCT_PAUSE_EXTRA;
      else if (ch === ',') extra = 80;
      await new Promise(r => setTimeout(r, CHAR_DELAY + extra));
    }
  }

  // Observer para iniciar quando o container aparecer na viewport
  const poemObserver = new IntersectionObserver(async (entries, obs) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        for (let i=0;i<paras.length;i++) {
          await typeParagraphHtml(paras[i]);
          await new Promise(r => setTimeout(r, PARA_PAUSE));
        }
        obs.unobserve(entry.target);
      }
    }
  }, { threshold: 0.2 });

  poemObserver.observe(poemContainer);
}

/* =========================
   TENTAR INICIAR MÚSICA NOVAMENTE NO LOAD (caso permitido)
   ========================= */
window.addEventListener('load', () => {
  if (bgMusic && !musicStarted) {
    bgMusic.play().then(()=> musicStarted = true).catch(()=>{ /* ok, será ativado por interação */ });
  }
});
