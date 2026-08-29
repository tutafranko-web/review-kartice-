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
   4a. Traka napretka čitanja
   ========================================================================= */

function initProgress() {
  const bar = document.querySelector("#progress span");
  if (!bar) return;

  function update() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
    bar.style.width = (p * 100).toFixed(2) + "%";
  }

  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();
}

/* =========================================================================
   4b. Sekvenca dodira — prikovana sekcija "Kako radi"
   Skrol vodi kroz tri koraka: kartica na stolu → telefon prislonjen →
   recenzija na ekranu. Koraci se izmjenjuju, aktivni se ističe.
   ========================================================================= */

function initTapSequence() {
  const section = document.querySelector(".s-kako");
  const tap     = document.getElementById("tap");
  const steps   = [...document.querySelectorAll(".step")];
  if (!section || !tap || !steps.length) return;

  function setStep(n) {
    if (tap.dataset.step === String(n)) return;
    tap.dataset.step = n;
    steps.forEach(s => s.classList.toggle("is-on", s.dataset.step === String(n)));
  }

  /* bez skrol-animacije svi koraci stoje otvoreni, scena na zadnjem stanju */
  if (REDUCED_MOTION || typeof ScrollTrigger === "undefined") {
    steps.forEach(s => s.classList.add("is-on"));
    tap.dataset.step = "3";
    return;
  }

  setStep(1);
  steps[0].classList.add("is-on");

  ScrollTrigger.create({
    trigger: section,
    start: "top top",
    end: "bottom bottom",
    scrub: true,
    onUpdate: self => {
      const p = self.progress;
      setStep(p < 0.34 ? 1 : p < 0.67 ? 2 : 3);
    }
  });
}

/* =========================================================================
   4c. Traka djelatnosti — klizi vodoravno dok skrolaš
   ========================================================================= */

function initMarquee() {
  if (REDUCED_MOTION || typeof ScrollTrigger === "undefined") return;

  document.querySelectorAll(".marquee").forEach(wrap => {
    const row = wrap.querySelector(".marquee-row");
    if (!row) return;
    const speed = parseFloat(row.dataset.speed) || -16;

    gsap.fromTo(row,
      { xPercent: 0 },
      {
        xPercent: speed,
        ease: "none",
        scrollTrigger: { trigger: wrap, start: "top bottom", end: "bottom top", scrub: true }
      });
  });
}

/* =========================================================================
   4d. Nagib kartica proizvoda — kartica je fizički predmet
   ========================================================================= */

function initCardTilt() {
  if (REDUCED_MOTION) return;
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  document.querySelectorAll(".product-card").forEach(card => {
    const img = card.querySelector(".product-well img");
    if (!img) return;

    card.addEventListener("pointermove", e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      img.style.setProperty("--tilt-y", (x * 16).toFixed(2) + "deg");
      img.style.setProperty("--tilt-x", (-y * 12).toFixed(2) + "deg");
    });

    card.addEventListener("pointerleave", () => {
      img.style.setProperty("--tilt-y", "0deg");
      img.style.setProperty("--tilt-x", "0deg");
    });
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

  const pkgCards = [...document.querySelectorAll(".pkg-card[data-tier]")];

  /* koji paket odgovara trenutnoj količini — odgovarajuća kartica se
     osvijetli da veza između klizača i cjenika bude vidljiva */
  function markTier(qty) {
    const tier = qty > 10 ? 11 : qty >= 10 ? 10 : qty >= 5 ? 5 : 1;
    pkgCards.forEach(c => c.classList.toggle("is-match", Number(c.dataset.tier) === tier));
  }

  function update() {
    const qty   = parseInt(range.value, 10);
    const unit  = unitPriceFor(qty);
    const total = qty * unit;
    const save  = qty * BASE_PRICE - total;

    markTier(qty);
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

    /* Maketa javne Google recenzije. Statična — ništa se ne upisuje
       ni ne šalje, služi samo da vlasnik vidi što gost dobije. */
    yes: () => `
      <div class="demo-step demo-step--wide">
        <div class="mock mock--google">
          <div class="mock-bar">
            <span class="mock-dot"></span>
            <span class="mock-url">google.com/maps</span>
            <span class="mock-tag mock-tag--public">Javno</span>
          </div>
          <div class="mock-body">
            <div class="mock-head">
              <span class="mock-logo">G</span>
              <span class="mock-title">Tvoj obrt</span>
            </div>
            <div class="mock-stars mock-stars--full">★★★★★</div>
            <div class="mock-text">Odlična usluga, sve pohvale!</div>
            <div class="mock-send mock-send--google">Objavi na Googleu</div>
          </div>
        </div>
        <p class="demo-note">Zadovoljan gost ide ravno na tvoj javni Google profil i ostavlja peticu.</p>
        <span class="demo-outcome demo-outcome--yes">Javno na Googleu · diže ti rejting</span>
        <div class="demo-actions">
          <button class="demo-btn demo-btn--ghost" data-go="no">Vidi što se dogodi ako NE</button>
        </div>
      </div>`,

    /* Maketa privatne forme koja ide vlasniku na mail. Naglašeno je da
       ovo NIJE Google: druga traka, adresa primatelja, oznaka Privatno. */
    no: () => `
      <div class="demo-step demo-step--wide">
        <div class="mock mock--mail">
          <div class="mock-bar">
            <span class="mock-lock">🔒</span>
            <span class="mock-url">privatna forma — ne ide na Google</span>
            <span class="mock-tag mock-tag--private">Privatno</span>
          </div>
          <div class="mock-body">
            <div class="mock-row">
              <span class="mock-label">Šalje se na</span>
              <span class="mock-to">vlasnik@tvojobrt.hr</span>
            </div>
            <div class="mock-row">
              <span class="mock-label">Ocjena</span>
              <span class="mock-stars mock-stars--low">★★☆☆☆</span>
            </div>
            <div class="mock-row mock-row--stack">
              <span class="mock-label">Što nije bilo u redu?</span>
              <div class="mock-area">Čekali smo predugo za stolom.</div>
            </div>
            <div class="mock-send mock-send--mail">Pošalji vlasniku</div>
          </div>
        </div>
        <p class="demo-note">Nezadovoljan gost piše tebi na mail, a ne Googleu. Saznaješ što ne valja i imaš priliku popraviti — bez javne jedinice.</p>
        <span class="demo-outcome demo-outcome--no">Stiže ti na mail · ne pojavljuje se javno</span>
        <div class="demo-actions">
          <button class="demo-btn demo-btn--ghost" data-go="yes">Vidi što se dogodi ako DA</button>
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
  initProgress();
  initTapSequence();
  initMarquee();
  initCardTilt();
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
