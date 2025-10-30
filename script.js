// ===================== UTIL: safe query =====================
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

// ===================== MÚSICA: start no primeiro input do usuário =====================
const bgMusic = $('#background-music');
let musicStarted = false;
function startMusic() {
  if (!bgMusic || musicStarted) return;
  bgMusic.volume = 0.35;
  bgMusic.play().catch(()=>{/* autoplay bloqueado, será ativado no primeiro input */});
  musicStarted = true;
}
['click','scroll','touchstart','keydown'].forEach(e => document.addEventListener(e, startMusic, {once:true}));

// ===================== CANVAS: chuva + estrelas =====================
const canvas = $('#background');
const ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;
let W = window.innerWidth, H = window.innerHeight;
if (canvas && ctx) {
  canvas.width = W; canvas.height = H;

  const stars = Array.from({length:140}, ()=>({x:Math.random()*W, y:Math.random()*H, r:Math.random()*1.5+0.3, tw:Math.random()*2000+1000, t:Math.random()*2000}));
  const rain = Array.from({length:120}, ()=>({x:Math.random()*W, y:Math.random()*H, l:Math.random()*12+8, vy:4+Math.random()*3}));

  function resizeCanvas(){
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W; canvas.height = H;
    // opcional: reposicionar gotas/estrelas (não necessário)
  }
  window.addEventListener('resize', resizeCanvas);

  function animateBg(ts){
    ctx.clearRect(0,0,W,H);
    // estrelas (pulsando)
    stars.forEach(s => {
      const a = 0.5 + 0.5 * Math.sin((ts + s.t)/s.tw);
      ctx.globalAlpha = a;
      ctx.beginPath();
      ctx.fillStyle = "#ffffff";
      ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    // chuva
    rain.forEach(r => {
      ctx.strokeStyle = "rgba(173,216,230,0.5)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(r.x, r.y);
      ctx.lineTo(r.x, r.y + r.l);
      ctx.stroke();
      r.y += r.vy;
      r.x += 0.2; // leve drift
      if (r.y > H) { r.y = -r.l; r.x = Math.random()*W; }
      if (r.x > W) r.x = 0;
    });

    requestAnimationFrame(animateBg);
  }
  requestAnimationFrame(animateBg);
}

// ===================== FADE-IN SECTIONS & fotos =====================
const sections = $$('section');
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(en => {
    if (en.isIntersecting) en.target.classList.add('visible');
  });
}, {threshold: 0.2});
sections.forEach(s => { s.classList.add('hidden'); sectionObserver.observe(s); });

// fotos fade-in
const photos = $$('.carousel img');
const photoObserver = new IntersectionObserver((entries)=> {
  entries.forEach(en => {
    if (en.isIntersecting) en.target.classList.add('visible-photo');
  });
}, {threshold: 0.2});
photos.forEach(img => { img.classList.add('hidden-photo'); photoObserver.observe(img); });

// ===================== TIMELINE CASCATA =====================
const timelineEvents = $$('.timeline .event');
const timelineObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      timelineEvents.forEach((ev,i) => setTimeout(()=> ev.classList.add('visible-event'), i*300));
    }
  });
}, {threshold: 0.2});
timelineEvents.forEach(ev => timelineObserver.observe(ev));

// ===================== CONTADOR REGRESSIVO =====================
const timerEl = $('#timer');
const eventsList = [
  { name: "Aniversário de namoro", date: "2025-11-09T00:00:00" },
  { name: "Seu aniversário", date: "2026-04-04T00:00:00" },
  { name: "Aniversário dela", date: "2026-09-09T00:00:00" },
  { name: "Natal", date: "2025-12-25T00:00:00" },
  { name: "Ano Novo", date: "2026-01-01T00:00:00" }
];

function getNextEventObj(){
  const now = new Date();
  // map recurring events to next occurrence if needed
  const future = [];
  eventsList.forEach(e => {
    let d = new Date(e.date);
    // if date already passed this year, bump to next year
    if (d <= now) {
      d = new Date(d);
      d.setFullYear(now.getFullYear()+1);
    }
    future.push({name: e.name, date: d});
  });
  future.sort((a,b)=> a.date - b.date);
  return future[0];
}

function updateTimer(){
  if(!timerEl) return;
  const next = getNextEventObj();
  const diff = next.date - new Date();
  if (diff <= 0) { timerEl.textContent = `${next.name} chegou!`; return; }
  const days = Math.floor(diff/(1000*60*60*24));
  const hours = Math.floor((diff%(1000*60*60*24))/(1000*60*60));
  const mins = Math.floor((diff%(1000*60*60))/(1000*60));
  const secs = Math.floor((diff%(1000*60))/1000);
  timerEl.textContent = `${next.name} em ${days}d ${hours}h ${mins}m ${secs}s`;
}
setInterval(updateTimer,1000);
updateTimer();

// ===================== CARROSSEL INFINITO (clonagem tripla) =====================
const carouselTrack = document.querySelector('.carousel-track');
if (carouselTrack) {
  const originalSlides = Array.from(carouselTrack.children);
  // se pouco slides, não triplicar
  if (originalSlides.length > 0) {
    carouselTrack.innerHTML =
      originalSlides.map(s => s.outerHTML).join('') +
      originalSlides.map(s => s.outerHTML).join('') +
      originalSlides.map(s => s.outerHTML).join('');
  }
  let allSlides = Array.from(carouselTrack.children);
  let slideWidth = allSlides[0] ? allSlides[0].getBoundingClientRect().width : 0;
  let currentIndex = originalSlides.length; // ponto inicial (grupo do meio)
  carouselTrack.style.transform = `translateX(-${currentIndex * slideWidth}px)`;

  const nextBtn = document.querySelector('.carousel .next');
  const prevBtn = document.querySelector('.carousel .prev');

  function updateCarouselPosition(animate=true){
    if (animate) carouselTrack.style.transition = 'transform 0.5s ease';
    else carouselTrack.style.transition = 'none';
    carouselTrack.style.transform = `translateX(-${currentIndex * slideWidth}px)`;
  }

  function loopFix(){
    if (currentIndex >= 2 * originalSlides.length) {
      // pula para o grupo do meio sem animação
      currentIndex = originalSlides.length;
      updateCarouselPosition(false);
    }
    if (currentIndex < originalSlides.length) {
      currentIndex = 2 * originalSlides.length - 1;
      updateCarouselPosition(false);
    }
  }

  if (nextBtn) nextBtn.addEventListener('click', ()=>{ currentIndex++; updateCarouselPosition(true); });
  if (prevBtn) prevBtn.addEventListener('click', ()=>{ currentIndex--; updateCarouselPosition(true); });

  carouselTrack.addEventListener('transitionend', loopFix);

  // resize recalcula largura
  window.addEventListener('resize', () => {
    allSlides = Array.from(carouselTrack.children);
    slideWidth = allSlides[0] ? allSlides[0].getBoundingClientRect().width : 0;
    updateCarouselPosition(false);
  });

  // auto slide (opcional)
  let carouselAuto = setInterval(()=>{ currentIndex++; updateCarouselPosition(true); }, 4500);
  // pause on hover (if needed)
  carouselTrack.addEventListener('mouseenter', ()=> clearInterval(carouselAuto));
  carouselTrack.addEventListener('mouseleave', ()=> carouselAuto = setInterval(()=>{ currentIndex++; updateCarouselPosition(true); }, 4500));

  // swipe handlers
  let startX = 0;
  carouselTrack.addEventListener('touchstart', (e)=> startX = e.touches[0].clientX);
  carouselTrack.addEventListener('touchend', (e)=>{
    const endX = e.changedTouches[0].clientX;
    if (startX - endX > 50) { currentIndex++; updateCarouselPosition(true); }
    if (endX - startX > 50) { currentIndex--; updateCarouselPosition(true); }
  });
}

// ===================== CORAÇÕES NO CLIQUE E CLIQUE NAS FOTOS =====================
const clickSound = $('#click-sound');
document.body.addEventListener('click', (e) => {
  if (clickSound) { clickSound.currentTime = 0; clickSound.play().catch(()=>{}); }
  const heart = document.createElement('div');
  heart.textContent = '💖';
  Object.assign(heart.style, {
    position: 'absolute',
    left: (e.pageX - 12) + 'px',
    top: (e.pageY - 12) + 'px',
    fontSize: '1.6rem',
    pointerEvents: 'none',
    transition: 'all 0.9s ease-out',
    zIndex: 9999
  });
  document.body.appendChild(heart);
  requestAnimationFrame(()=> {
    heart.style.top = (e.pageY - 60) + 'px';
    heart.style.opacity = '0';
  });
  setTimeout(()=> heart.remove(), 900);
});

// double-click heart on photos
photos.forEach(img => {
  img.addEventListener('dblclick', (e)=>{
    const rect = img.getBoundingClientRect();
    const heart = document.createElement('div');
    heart.textContent = '💘';
    Object.assign(heart.style, {
      position: 'absolute',
      left: (rect.left + rect.width/2 - 20) + 'px',
      top: (rect.top + rect.height/2 - 20) + 'px',
      fontSize: '2rem',
      pointerEvents: 'none',
      transition: 'all 1s ease-out',
      zIndex: 9999
    });
    document.body.appendChild(heart);
    requestAnimationFrame(()=> {
      heart.style.top = (parseFloat(heart.style.top) - 60) + 'px';
      heart.style.opacity = '0';
    });
    setTimeout(()=> heart.remove(), 1000);
  });
});

// ===================== EASTER EGG (5 cliques no header) =====================
let headerClicks = 0;
const headerEl = document.querySelector('.header');
if (headerEl) {
  headerEl.addEventListener('click', ()=>{
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

// ===================== POEMA: digitação por parágrafo (inicia quando visível) =====================
const poemContainer = document.querySelector('.poem-text');
if (poemContainer) {
  // pega os parágrafos originais, guarda e limpa o container
  const paras = Array.from(poemContainer.querySelectorAll('p')).map(p => p.innerHTML.trim());
  poemContainer.innerHTML = '';

  // função que digita um parágrafo com pausas naturais
  const CHAR_DELAY = 48; // ms por caractere (velocidade média brasileira)
  const PUNCT_PAUSE = 220; // pausa extra após .,!?
  const PARA_PAUSE = 600; // pausa entre parágrafos

  async function typeParagraphHtml(htmlText){
    // transform HTML entities/newlines into plain sequence, but keep <br> if present
    // we'll treat <br> as newline instantly
    const tmp = document.createElement('div');
    tmp.innerHTML = htmlText;
    // get text nodes and <br> represented as '\n'
    const nodes = [];
    tmp.childNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) nodes.push(node.textContent);
      else if (node.nodeType === Node.ELEMENT_NODE && node.tagName.toLowerCase() === 'br') nodes.push('\n');
      else nodes.push(node.textContent || '');
    });
    const full = nodes.join('');
    const p = document.createElement('p');
    poemContainer.appendChild(p);

    for (let i=0;i<full.length;i++){
      const ch = full[i];
      if (ch === '\n') p.innerHTML += '<br>';
      else p.textContent += ch;
      // pausa extra em pontuação final
      const baseDelay = CHAR_DELAY;
      const extra = (ch === '.' || ch === '!' || ch === '?') ? PUNCT_PAUSE : ((ch === ',') ? 80 : 0);
      await new Promise(r => setTimeout(r, baseDelay + extra));
    }
  }

  // Observer para só começar quando a seção do poema aparecer
  const poemObserver = new IntersectionObserver(async (entries, obs) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        // digita parágrafo por parágrafo
        for (let i=0;i<paras.length;i++){
          await typeParagraphHtml(paras[i]);
          // pausa entre parágrafos
          await new Promise(r => setTimeout(r, PARA_PAUSE));
        }
        obs.unobserve(entry.target);
      }
    }
  }, {threshold: 0.2});
  poemObserver.observe(poemContainer);
}

// ===================== fallback: garantir música ao load (se permitido) =====================
window.addEventListener('load', ()=> {
  // tenta tocar (alguns navegadores permitem)
  if (bgMusic && !musicStarted) {
    bgMusic.play().then(()=> musicStarted = true).catch(()=>{/* ok - espera input do usuário */});
  }
});
