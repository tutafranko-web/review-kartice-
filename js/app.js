/* =========================================================================
   reviewcard.hr — logika stranice
   ========================================================================= */

/* -------------------------------------------------------------------------
   WhatsApp broj na koji idu svi CTA gumbi. Samo znamenke, s pozivnim brojem,
   bez + i razmaka. Prikazano +385 95 737 8710 -> ovdje 385957378710.
   Napomena: broj je zasada privremeni. Ista vrijednost mora stajati i u
   href atributima u index.html (initWhatsApp javi u konzoli ako se raziđu).
   ------------------------------------------------------------------------- */
const WHATSAPP_NUMBER = "385957378710";

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

/* Gumbi imaju href upisan i u HTML-u, da odredište postoji i bez JS-a —
   tražilice i agenti koji čitaju sirovi HTML inače ne vide kamo vode.
   Ovdje se href samo osvježava iz WHATSAPP_NUMBER. Kako se te dvije
   vrijednosti ne bi tiho razišle, neslaganje se javi u konzoli. */
function initWhatsApp() {
  let razlika = null;
  document.querySelectorAll("[data-wa]").forEach(el => {
    const key = el.dataset.wa;
    if (!WA_MESSAGES[key]) return;
    const uHtml = (el.getAttribute("href") || "").match(/wa\.me\/(\d+)/);
    if (uHtml && uHtml[1] !== String(WHATSAPP_NUMBER)) razlika = uHtml[1];
    el.href = waLink(WA_MESSAGES[key]);
  });
  if (razlika) {
    console.warn(
      "[reviewcard] Broj u HTML-u (" + razlika + ") ne odgovara broju u app.js (" +
      WHATSAPP_NUMBER + "). Posjetitelji s JS-om idu na broj iz app.js, a " +
      "tražilice i agenti citaju onaj iz HTML-a. Uskladiti oba."
    );
  }
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

const REVIEW_TEXT = "Odlična usluga, ljubazno osoblje. Rado se vraćamo!";

function initTapSequence() {
  const section = document.querySelector(".s-kako");
  const tap     = document.getElementById("tap");
  const typed   = document.getElementById("tapTyped");
  const steps   = [...document.querySelectorAll(".step")];
  if (!section || !tap || !steps.length) return;

  let typeTimer = null;

  /* tekst se ispisuje slovo po slovo tek kad gost dođe do trećeg koraka */
  function startTyping() {
    if (!typed) return;
    clearInterval(typeTimer);
    let i = 0;
    typed.textContent = "";
    typeTimer = setInterval(() => {
      typed.textContent = REVIEW_TEXT.slice(0, ++i);
      if (i >= REVIEW_TEXT.length) clearInterval(typeTimer);
    }, 45);
  }

  function stopTyping() {
    clearInterval(typeTimer);
    if (typed) typed.textContent = "";
  }

  function setStep(n) {
    if (tap.dataset.step === String(n)) return;
    tap.dataset.step = n;
    steps.forEach(s => s.classList.toggle("is-on", s.dataset.step === String(n)));
    if (n === 3) setTimeout(startTyping, 850); else stopTyping();
  }

  /* bez skrol-animacije svi koraci stoje otvoreni, scena na zadnjem stanju */
  if (REDUCED_MOTION || typeof ScrollTrigger === "undefined") {
    steps.forEach(s => s.classList.add("is-on"));
    tap.dataset.step = "3";
    if (typed) typed.textContent = REVIEW_TEXT;
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

  /* Ocjena i tekst pamte se po grani da se ne izgube kad vlasnik
     skače između DA i NE. Ništa od ovoga ne izlazi iz stranice. */
  const state = {
    yes: { rating: 5, text: "Odlična usluga, sve pohvale!" },
    no:  { rating: 2, text: "Čekali smo predugo za stolom." }
  };

  const esc = s => String(s).replace(/[&<>"]/g,
    c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* Zvjezdice su pravi gumbi — klikom se mijenja ocjena. */
  const rate = (branch, tone) => {
    const n = state[branch].rating;
    let h = `<div class="rate rate--${tone}" role="group" aria-label="Ocjena, 1 do 5">`;
    for (let i = 1; i <= 5; i++) {
      h += `<button type="button" class="rate-star${i <= n ? " is-on" : ""}"` +
           ` data-rate="${i}" data-branch="${branch}"` +
           ` aria-label="Ocijeni ${i} od 5"${i === n ? ' aria-current="true"' : ""}>★</button>`;
    }
    return h + `<span class="rate-out" data-out="${branch}">${n}/5</span></div>`;
  };

  const stars = n => "★".repeat(n) + "☆".repeat(5 - n);

  const views = {
    start: () => `
      <div class="demo-step">
        <h4>Gost je upravo prislonio telefon</h4>
        <p>Prije nego dođe do Googlea, sustav postavi jedno pitanje. Klikni kao da si gost — sve je klikabilno.</p>
        <div class="demo-actions">
          <button class="demo-btn demo-btn--ghost" data-go="ask">Pokreni demo</button>
        </div>
      </div>`,

    ask: () => `
      <div class="demo-step">
        <h4>„Jeste li zadovoljni?”</h4>
        <p>Kratko pitanje prije bilo kakve recenzije. Odgovor odlučuje gdje gost ide dalje.</p>
        <div class="demo-actions">
          <button class="demo-btn demo-btn--yes" data-go="yes">Da, zadovoljan sam</button>
          <button class="demo-btn demo-btn--no" data-go="no">Ne baš</button>
        </div>
      </div>`,

    /* Grana DA: javni Google obrazac. Ocjena i tekst se stvarno mijenjaju,
       ali gumb samo prelazi na potvrdu — ništa se ne objavljuje. */
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
            ${rate("yes", "light")}
            <textarea class="mock-input mock-input--light" data-field data-branch="yes"
              rows="2" aria-label="Tekst recenzije"
              placeholder="Napiši recenziju…">${esc(state.yes.text)}</textarea>
            <button type="button" class="mock-send mock-send--google" data-send="yes">Objavi na Googleu</button>
          </div>
        </div>
        <p class="demo-note">Zadovoljan gost ide ravno na tvoj javni Google profil. Promijeni ocjenu i tekst pa pritisni gumb.</p>
        <span class="demo-outcome demo-outcome--yes">Javno na Googleu · diže ti rejting</span>
        <div class="demo-actions">
          <button class="demo-btn demo-btn--ghost" data-go="no">Vidi što se dogodi ako NE</button>
        </div>
      </div>`,

    /* Grana NE: privatna forma vlasniku. Naglašeno je da ovo NIJE Google —
       druga traka, adresa primatelja i oznaka Privatno. */
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
              ${rate("no", "dark")}
            </div>
            <div class="mock-row mock-row--stack">
              <span class="mock-label">Što nije bilo u redu?</span>
              <textarea class="mock-input mock-input--dark" data-field data-branch="no"
                rows="2" aria-label="Opis problema"
                placeholder="Opiši što nije bilo u redu…">${esc(state.no.text)}</textarea>
            </div>
            <button type="button" class="mock-send mock-send--mail" data-send="no">Pošalji vlasniku</button>
          </div>
        </div>
        <p class="demo-note">Nezadovoljan gost piše tebi na mail, a ne Googleu. Saznaješ što ne valja i imaš priliku popraviti — bez javne jedinice.</p>
        <span class="demo-outcome demo-outcome--no">Stiže ti na mail · ne pojavljuje se javno</span>
        <div class="demo-actions">
          <button class="demo-btn demo-btn--ghost" data-go="yes">Vidi što se dogodi ako DA</button>
        </div>
      </div>`,

    yesDone: () => `
      <div class="demo-step demo-step--wide">
        <div class="mock mock--google">
          <div class="mock-bar">
            <span class="mock-dot"></span>
            <span class="mock-url">google.com/maps</span>
            <span class="mock-tag mock-tag--public">Javno</span>
          </div>
          <div class="mock-body mock-body--done">
            <span class="done-mark done-mark--yes">✓</span>
            <h5 class="done-title done-title--light">Recenzija je objavljena</h5>
            <div class="done-quote done-quote--light">
              <div class="done-stars done-stars--yes">${stars(state.yes.rating)}</div>
              <p>${esc(state.yes.text) || "<em>bez teksta</em>"}</p>
            </div>
            <p class="done-meta">Vidljiva svima na tvom Google profilu i ulazi u prosjek ocjene.</p>
          </div>
        </div>
        <p class="demo-note">Ovako izgleda kad gost potvrdi. U demou se ništa ne objavljuje.</p>
        <span class="demo-outcome demo-outcome--yes">Javno na Googleu · diže ti rejting</span>
        <div class="demo-actions">
          <button class="demo-btn demo-btn--no" data-go="no">Probaj granu NE</button>
          <button class="demo-btn demo-btn--ghost" data-go="start">Ispočetka</button>
        </div>
      </div>`,

    noDone: () => `
      <div class="demo-step demo-step--wide">
        <div class="mock mock--mail">
          <div class="mock-bar">
            <span class="mock-lock">🔒</span>
            <span class="mock-url">privatna forma — ne ide na Google</span>
            <span class="mock-tag mock-tag--private">Privatno</span>
          </div>
          <div class="mock-body mock-body--done">
            <span class="done-mark done-mark--no">✓</span>
            <h5 class="done-title">Poruka je stigla tebi na mail</h5>
            <div class="done-quote">
              <div class="done-stars done-stars--no">${stars(state.no.rating)}</div>
              <p>${esc(state.no.text) || "<em>bez teksta</em>"}</p>
            </div>
            <p class="done-meta">Poslano na <b>vlasnik@tvojobrt.hr</b> — na Googleu se ne pojavljuje ništa.</p>
          </div>
        </div>
        <p class="demo-note">Gost se ispuhao kod tebe, a rejting je ostao netaknut. U demou se ništa ne šalje.</p>
        <span class="demo-outcome demo-outcome--no">Stiže ti na mail · ne pojavljuje se javno</span>
        <div class="demo-actions">
          <button class="demo-btn demo-btn--yes" data-go="yes">Probaj granu DA</button>
          <button class="demo-btn demo-btn--ghost" data-go="start">Ispočetka</button>
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
    const go = e.target.closest("[data-go]");
    if (go) { render(go.dataset.go); return; }

    const send = e.target.closest("[data-send]");
    if (send) { render(send.dataset.send === "yes" ? "yesDone" : "noDone"); return; }

    /* Ocjena se mijenja na mjestu — bez ponovnog crtanja, da tekst
       u polju i fokus ne odlete. */
    const star = e.target.closest("[data-rate]");
    if (star) {
      const branch = star.dataset.branch;
      const n = +star.dataset.rate;
      state[branch].rating = n;
      star.parentElement.querySelectorAll(".rate-star").forEach((s, i) => {
        s.classList.toggle("is-on", i < n);
        if (i + 1 === n) s.setAttribute("aria-current", "true");
        else s.removeAttribute("aria-current");
      });
      const out = screen.querySelector(`[data-out="${branch}"]`);
      if (out) out.textContent = n + "/5";
    }
  });

  screen.addEventListener("input", e => {
    const f = e.target.closest("[data-field]");
    if (f) state[f.dataset.branch].text = f.value;
  });

  render("start");
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

  if (WHATSAPP_NUMBER === "385000000000") {
    console.warn(
      "[reviewcard] WhatsApp broj je jos placeholder (385000000000). " +
      "Svi CTA gumbi vode u prazno. Zamijeni ga u js/app.js prije objave."
    );
  } else if (!/^\d{9,15}$/.test(WHATSAPP_NUMBER)) {
    console.warn(
      "[reviewcard] WHATSAPP_NUMBER '" + WHATSAPP_NUMBER + "' nije valjan " +
      "(ocekuje se 9-15 znamenki, bez + i razmaka)."
    );
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
