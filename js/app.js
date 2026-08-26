/* =========================================================================
   reviewcard.hr — logika stranice
   ========================================================================= */

/* -------------------------------------------------------------------------
   ⚠️  ZAMIJENITI PRIJE OBJAVE  ⚠️
   Ovo je placeholder broj iz prototipa. Dok stoji ovako, SVI gumbi na
   stranici vode u prazno i stranica ne smije ići u produkciju.
   Upisati stvarni broj — samo znamenke, s pozivnim brojem, bez + i razmaka.
   Primjer za Hrvatsku: "385991234567"
   ------------------------------------------------------------------------- */
const WHATSAPP_NUMBER = "385000000000";

/* Poruke su NAMJERNO bez dijakritike — README traži da tako ostanu radi
   kompatibilnosti s WhatsApp klijentima. Ne dodavati č, ć, ž, š, đ. */
const WA_MESSAGES = {
  hero:   "Pozdrav! Zanimaju me Google review NFC kartice.",
  crna:   "Pozdrav! Zelim naruciti CRNU Google review karticu (20 EUR).",
  plava:  "Pozdrav! Zelim naruciti PLAVU Google review karticu (20 EUR).",
  pkg1:   "Pozdrav! Zelim naruciti 1 karticu (20 EUR).",
  pkg5:   "Pozdrav! Zelim naruciti paket 5 kartica (75 EUR).",
  pkg10:  "Pozdrav! Zelim naruciti paket 10 kartica (120 EUR).",
  pkg20:  "Pozdrav! Zelim naruciti 10+ kartica - molim ponudu s kolicinskim popustom.",
  sustav: "Pozdrav! Zanima me napredni NFC sustav i ponuda.",
  close:  "Pozdrav! Kontaktiram vas putem reviewcard.hr."
};

const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function waLink(message) {
  const num = String(WHATSAPP_NUMBER).replace(/[^0-9]/g, "");
  return `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
}

/* =========================================================================
   1. WhatsApp linkovi
   ========================================================================= */

function initWhatsApp() {
  document.querySelectorAll("[data-wa]").forEach(el => {
    const key = el.dataset.wa;
    if (WA_MESSAGES[key]) el.href = waLink(WA_MESSAGES[key]);
  });
}

/* =========================================================================
   2. Reveal na skrol
   Mehanika preuzeta iz prototipa, uključujući obje sigurnosne mreže:
   otkrivanje već vidljivih elemenata u prvom frameu, i bezuvjetni timeout
   da sadržaj nikad ne ostane nevidljiv ako observer zakaže.
   ========================================================================= */

function initReveal() {
  const els = document.querySelectorAll("[data-reveal]");

  if (REDUCED_MOTION) {
    els.forEach(el => { el.style.opacity = "1"; el.style.transform = "none"; });
    return;
  }

  els.forEach(el => {
    el.style.opacity = "0";
    el.style.transform = "translateY(20px)";
    el.style.transition = "opacity .7s ease, transform .7s ease";
  });

  const show = el => { el.style.opacity = "1"; el.style.transform = "none"; };

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { show(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    els.forEach(el => io.observe(el));
  }

  requestAnimationFrame(() => {
    els.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top < (window.innerHeight || 800) && r.bottom > 0) show(el);
    });
  });

  setTimeout(() => els.forEach(show), 400);
}

/* =========================================================================
   3. Lenis smooth scroll
   ========================================================================= */

function initLenis() {
  if (REDUCED_MOTION || typeof Lenis === "undefined") return null;

  const lenis = new Lenis({
    duration: 1.2,
    easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true
  });

  if (typeof ScrollTrigger !== "undefined") {
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(time => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  } else {
    const raf = time => { lenis.raf(time); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }

  /* anchor linkovi moraju ići kroz Lenis, inače native skok ne radi glatko */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener("click", e => {
      const target = document.querySelector(a.getAttribute("href"));
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -76 });
    });
  });

  return lenis;
}

/* =========================================================================
   4. Uvodna scroll animacija
   201 framea u punoj rezoluciji videa (1080x1920), vezanih na skrol.
   Bez teksta — samo video.
   ========================================================================= */

const FRAME_COUNT = 201;

/* ScrollTrigger je postavljen "top top" -> "bottom bottom", a sticky kadar
   je visok točno (100vh - nav). Zbog toga progres 1.0 pada u isti trenutak
   u kojem se kadar otpušta i kreće predaja heroju. Video zato smije trajati
   punom duljinom progresa — bez ubrzavanja. */
const FRAME_SPEED = 1.0;
const FRAME_PATH  = i => `frames/frame_${String(i + 1).padStart(4, "0")}.webp`;

function initIntro() {
  const stage  = document.getElementById("introStage");
  const canvas = document.getElementById("introCanvas");
  const loader = document.getElementById("introLoader");
  if (!stage || !canvas) return;

  const ctx = canvas.getContext("2d", { alpha: false });

  /* mobitel učitava svaki drugi frame — isti set datoteka, upola manje prometa */
  const isSmall = window.matchMedia("(max-width: 900px)").matches;
  const step = isSmall ? 2 : 1;
  const indices = [];
  for (let i = 0; i < FRAME_COUNT; i += step) indices.push(i);

  const frames = new Map();
  let currentKey = -1;
  let loadedCount = 0;

  /* --- veličina canvasa uz devicePixelRatio --- */
  function sizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    /* offsetWidth/Height ignoriraju transform (scale) na stageu,
       pa mjerilo skrola ne kvari razlučivost canvasa */
    canvas.width  = Math.round(stage.offsetWidth  * dpr);
    canvas.height = Math.round(stage.offsetHeight * dpr);
    if (currentKey >= 0) draw(currentKey);
  }

  /* --- crtanje: cover — na mobitelu stage nije istog omjera kao video,
     pa se video simetrično obreže da ispuni cijeli ekran --- */
  function draw(key) {
    const img = frames.get(key);
    if (!img) return;
    const cw = canvas.width, ch = canvas.height;
    const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
    ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
  }

  function loadFrame(key) {
    return new Promise(resolve => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => { frames.set(key, img); resolve(img); };
      img.onerror = () => resolve(null);
      img.src = FRAME_PATH(key);
    });
  }

  function markProgress() {
    loadedCount++;
    const pct = Math.round((loadedCount / indices.length) * 100);
    const bar = loader && loader.firstElementChild;
    if (bar) bar.style.width = pct + "%";
  }

  /* --- dvofazno učitavanje: prvih 10 odmah, ostatak u pozadini --- */
  async function preload() {
    const head = indices.slice(0, 10);
    const tail = indices.slice(10);

    await Promise.all(head.map(k => loadFrame(k).then(r => { markProgress(); return r; })));
    sizeCanvas();
    draw(indices[0]);
    currentKey = indices[0];

    /* učitavanje u serijama da preglednik ne otvori 200 zahtjeva odjednom */
    const BATCH = 12;
    for (let i = 0; i < tail.length; i += BATCH) {
      await Promise.all(
        tail.slice(i, i + BATCH).map(k => loadFrame(k).then(r => { markProgress(); return r; }))
      );
    }
    stage.classList.add("is-ready");
  }

  /* --- najbliži učitani frame, da se nikad ne crta prazno --- */
  function nearestKey(target) {
    if (frames.has(target)) return target;
    let best = -1, bestDist = Infinity;
    for (const k of frames.keys()) {
      const d = Math.abs(k - target);
      if (d < bestDist) { bestDist = d; best = k; }
    }
    return best;
  }

  function renderAt(progress) {
    const accelerated = Math.min(progress * FRAME_SPEED, 1);
    const raw = Math.min(Math.floor(accelerated * FRAME_COUNT), FRAME_COUNT - 1);
    const key = nearestKey(Math.round(raw / step) * step);
    if (key >= 0 && key !== currentKey) {
      currentKey = key;
      requestAnimationFrame(() => draw(key));
    }
  }

  window.addEventListener("resize", sizeCanvas);
  preload();

  if (REDUCED_MOTION || typeof ScrollTrigger === "undefined") return;

  ScrollTrigger.create({
    trigger: document.querySelector(".intro"),
    start: "top top",
    end: "bottom bottom",
    scrub: true,
    onUpdate: self => renderAt(self.progress)
  });
}

/* =========================================================================
   5. Kalkulator uštede
   Koristi ISKLJUČIVO tri objavljene razine iz cjenika. Iznad 10 komada
   zadržava stopu od 12 €/kom i upućuje na ponudu — ne izmišlja dublje
   popuste koje klijent nije odobrio.
   ========================================================================= */

const BASE_PRICE = 20;

function unitPriceFor(qty) {
  if (qty >= 10) return 12;
  if (qty >= 5)  return 15;
  return BASE_PRICE;
}

/* Hrvatski oblik imenice uz broj: 1 karticu · 2-4 kartice · 5+ kartica
   (iznimka su brojevi 11-14, koji uvijek idu na "kartica").
   Bez dijakritike — poruke idu na WhatsApp. */
function kartice(qty) {
  const last2 = qty % 100;
  const last1 = qty % 10;
  if (last2 >= 11 && last2 <= 14) return "kartica";
  if (last1 === 1) return "karticu";
  if (last1 >= 2 && last1 <= 4)   return "kartice";
  return "kartica";
}

function initCalculator() {
  const range = document.getElementById("calcRange");
  if (!range) return;

  const elQty   = document.getElementById("calcQty");
  const elTotal = document.getElementById("calcTotal");
  const elUnit  = document.getElementById("calcUnit");
  const elSave  = document.getElementById("calcSave");
  const elNote  = document.getElementById("calcNote");
  const elCta   = document.getElementById("calcCta");

  const eur = n => `${n.toLocaleString("hr-HR")} €`;

  function update() {
    const qty   = parseInt(range.value, 10);
    const unit  = unitPriceFor(qty);
    const total = qty * unit;
    const save  = qty * BASE_PRICE - total;

    elQty.textContent   = qty;
    elTotal.textContent = eur(total);
    elUnit.textContent  = eur(unit);
    elSave.textContent  = save > 0 ? eur(save) : "—";

    /* vizualna ispuna klizača do trenutne pozicije */
    const pct = ((qty - range.min) / (range.max - range.min)) * 100;
    range.style.background =
      `linear-gradient(to right, var(--color-accent) ${pct}%, var(--color-neutral-700) ${pct}%)`;

    if (qty > 10) {
      elNote.textContent =
        "Prikazana cijena je po stopi paketa od 10 kartica. Za veće količine dogovaramo dodatni popust — pošalji upit i javljamo ti točnu ponudu.";
      elCta.textContent = "Zatraži ponudu na WhatsApp";
      elCta.href = waLink(
        `Pozdrav! Zanima me ponuda za ${qty} ${kartice(qty)} - molim kolicinski popust.`
      );
    } else {
      if (qty >= 10)      elNote.textContent = "Najpovoljnija objavljena cijena — 12 € po kartici.";
      else if (qty >= 5)  elNote.textContent = "Uzmi 10 kartica i cijena pada na 12 € po komadu.";
      else                elNote.textContent = "Od 5 kartica cijena pada na 15 € po komadu.";
      elCta.textContent = "Naruči na WhatsApp";
      elCta.href = waLink(
        `Pozdrav! Zelim naruciti ${qty} ${kartice(qty)} (${total} EUR).`
      );
    }
  }

  range.addEventListener("input", update);
  update();
}

/* =========================================================================
   6. Demo filtra zadovoljstva
   Sve je maketa unutar stranice — ništa se ne šalje niti izlazi van.
   ========================================================================= */

function initDemo() {
  const screen = document.getElementById("demoScreen");
  if (!screen) return;

  const views = {
    start: () => `
      <div class="demo-step">
        <h4>Gost je upravo prislonio telefon</h4>
        <p>Prije nego dođe do Googlea, sustav postavi jedno pitanje. Klikni kao da si gost.</p>
        <div class="demo-actions">
          <button class="demo-btn demo-btn--ghost" data-go="ask">Pokreni demo</button>
        </div>
      </div>`,

    ask: () => `
      <div class="demo-step">
        <h4>„Jeste li zadovoljni?”</h4>
        <p>Kratko pitanje prije bilo kakve recenzije.</p>
        <div class="demo-actions">
          <button class="demo-btn demo-btn--yes" data-go="yes">Da, zadovoljan sam</button>
          <button class="demo-btn demo-btn--no" data-go="no">Ne baš</button>
        </div>
      </div>`,

    yes: () => `
      <div class="demo-step">
        <div class="demo-stars">★★★★★</div>
        <h4>Otvara se Google recenzija</h4>
        <p>Zadovoljan gost ide ravno na tvoj javni Google profil i ostavlja peticu.</p>
        <span class="demo-outcome demo-outcome--yes">Javna recenzija · diže ti rejting</span>
        <div class="demo-actions">
          <button class="demo-btn demo-btn--ghost" data-go="ask">Probaj drugi odgovor</button>
        </div>
      </div>`,

    no: () => `
      <div class="demo-step">
        <h4>Otvara se privatna forma</h4>
        <p>Nezadovoljan gost piše tebi, a ne Googleu. Saznaješ što ne valja i imaš priliku popraviti — bez javne jedinice.</p>
        <span class="demo-outcome demo-outcome--no">Privatno · ide samo tebi</span>
        <div class="demo-actions">
          <button class="demo-btn demo-btn--ghost" data-go="ask">Probaj drugi odgovor</button>
        </div>
      </div>`
  };

  function render(view) {
    screen.innerHTML = views[view]();
    if (!REDUCED_MOTION && typeof gsap !== "undefined") {
      gsap.fromTo(screen.firstElementChild,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: .35, ease: "power2.out" });
    }
  }

  screen.addEventListener("click", e => {
    const btn = e.target.closest("[data-go]");
    if (btn) render(btn.dataset.go);
  });

  render("start");
}

/* =========================================================================
   7. Brojači
   Brojevi se broje pri skrolu. Rezervirane vrijednosti (data-placeholder)
   se preskaču — ne prikazujemo izmišljene brojke kao stvarne.
   ========================================================================= */

function initCounters() {
  const nums = document.querySelectorAll(".stat-number");
  if (!nums.length || typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;

  nums.forEach(el => {
    if (el.dataset.placeholder === "true") return;

    const target = parseFloat(el.dataset.value);
    if (!Number.isFinite(target)) return;
    const decimals = parseInt(el.dataset.decimals || "0", 10);

    if (REDUCED_MOTION) { el.textContent = target.toLocaleString("hr-HR"); return; }

    gsap.fromTo(el, { textContent: 0 }, {
      textContent: target,
      duration: 2,
      ease: "power1.out",
      snap: { textContent: decimals === 0 ? 1 : 0.01 },
      scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none reverse" },
      onUpdate: function () {
        el.textContent = Number(el.textContent).toLocaleString("hr-HR");
      }
    });
  });
}

/* =========================================================================
   Pokretanje
   ========================================================================= */

function boot() {
  initWhatsApp();
  initReveal();
  initLenis();
  initIntro();
  initCalculator();
  initDemo();
  initCounters();

  if (WHATSAPP_NUMBER === "385000000000") {
    console.warn(
      "[reviewcard] WhatsApp broj je jos placeholder (385000000000). " +
      "Svi CTA gumbi vode u prazno. Zamijeni ga u js/app.js prije objave."
    );
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
