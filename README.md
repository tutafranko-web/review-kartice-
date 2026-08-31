# reviewcard.hr

Jednostranična prodajna stranica za NFC kartice za Google recenzije.

## Pokretanje

Stranica **mora** ići preko HTTP-a — otvaranje `index.html` dvoklikom (`file://`)
ne radi ispravno.

```bash
npx serve .
# ili
python -m http.server 8123
```

Zatim otvoriti `http://localhost:8123`.

## Struktura

```
index.html            devet sekcija, sav tekst
css/style.css         design tokeni + layout
js/app.js             reveal, kalkulator, demo, WhatsApp linkovi
js/vendor/            GSAP, ScrollTrigger, Lenis (samoposluženo)
assets/               kartice (png + webp u 3 sirine), fontovi, og slika
```

Bez buildera i bez ovisnosti. Sve — skripte, stilovi, fontovi, slike —
posluženo je s istog podrijetla; stranica ne poziva nijedan vanjski resurs.

## ⚠️ Prije objave

1. **WhatsApp broj** — u `js/app.js` stoji placeholder `385000000000`.
   Dok se ne zamijeni, svih devet CTA gumba vodi u prazno. Konzola upozorava.

2. **Adresa u demou** — `vlasnik@tvojobrt.hr` u `js/app.js` je ilustrativna
   i treba je zamijeniti pravom adresom vlasnika.

3. **Ako stranica dobije domenu** (npr. reviewcard.hr), zamijeniti adresu
   `https://tutafranko-web.github.io/review-kartice-/` na svim mjestima:
   `canonical`, `og:url`, `og:image`, `twitter:image`, `@id`/`url`/`image`
   u JSON-LD-u te `<loc>` i `Sitemap:` u `sitemap.xml` i `robots.txt`.
   Ostavljena kriva adresa u canonicalu znači da Google indeksira staru.

## Indeksiranje

Stranica je indeksabilna: `<meta name="robots" content="index, follow, …">`.
Prije se ondje nalazio `noindex, nofollow` (namjerno, dok je stranica bila
nedovršena) — zbog njega je Search Console javljao „URL nije dostupan
Googleu / Stranica se ne može indeksirati".

- `robots.txt` na github.io adresi **nema učinka** — tražilice ga čitaju samo
  s korijena domene, koji nije u ovom repozitoriju. Postaje djelatan tek uz
  vlastitu domenu. Dotad indeksiranje kontrolira meta tag.
- `preview.html` namjerno zadržava `noindex` — to je alat za pregled, ne
  sadržaj za tražilice.
- `sitemap.xml` se u Search Consoleu predaje punom adresom.
- JSON-LD nosi tri ponude iz sekcije Paketi (20 / 75 / 120 €). **Ako se
  cjenik promijeni, promijeniti i JSON-LD**, inače Google javlja neslaganje
  cijene na stranici i u strukturiranim podacima. Namjerno nema
  `aggregateRating` — nema stvarnih ocjena, a izmišljene su kršenje pravila.

Sekcija „Brojke koje uvjeravaju" (isporučene kartice, poslovni korisnici,
rok isporuke) uklonjena je na zahtjev. Stajala je prazna jer stvarnih brojki
nije bilo, a izmišljene se ne stavljaju. Ako brojke jednom stignu, vraća se
kao obična sekcija sa `.stats` gridom; kod je u povijesti (commit prije
uklanjanja) zajedno s `initCounters` koji ih je brojao pri skrolu.

## Brzina

Cilj je bio visoka PageSpeed ocjena. Mjereno na živoj stranici, mobilno:
Performance 99, ostale kategorije 100.

- **Slike** su WebP u tri širine (`assets/card-*-320/640/960.webp`) uz `srcset`
  i `sizes`. Izvorni `card-blue.png` (~290 kB) služio se i tamo gdje se
  prikazuje na 76 px; sada preglednik bira širinu prema mjestu prikaza.
- **Fontovi** su samoposluženi i **podskupljeni** na znakove koje stranica
  koristi (`assets/fonts/inter-*.woff2`, ~55 kB umjesto 130 kB s CDN-a). Font
  za prvi vidljivi tekst ide u `preload`.
  - ⚠️ Podskup sadrži samo znakove s popisa. Doda li se tekst sa znakom koji
    nije u njemu, iscrtat će se sustavnim fontom i odskakat. Tada ponovno
    izraditi podskup: skinuti Inter s `fonts.googleapis.com/css2?...&text=<svi
    znakovi>` (Google vraća `/l/font?kit=...`, ne `.woff2`), spremiti woff2 u
    `assets/fonts/`.
- **Biblioteke** (GSAP, ScrollTrigger, Lenis) su u `js/vendor/`, s `defer`.

Slike kartica **moraju ostati prozirne**. Vektorski izvor je `card.html`
(spremljen izvan repozitorija); u njemu `body` mora biti `transparent` —
postavi li se boja, Puppeteerov `omitBackground` je ne uklanja i kutovi kartice
ispadnu obojani (bilo je crno). WebP se radi s `-pix_fmt yuva420p`, inače
ffmpeg izgubi alfa kanal.

## Sigurnost

- **Content-Security-Policy** je u `<meta>` tagu na vrhu `index.html`, i mora
  ostati prvi jer vrijedi samo za sadržaj iza sebe. Politika je stroga
  (`default-src 'none'`, sve ostalo `'self'`). Doda li se ikad vanjski resurs
  (analitika, font ili slika s CDN-a), **ovdje mu treba dopustiti podrijetlo**,
  inače ga preglednik blokira.
- **Nema inline koda**: nijedan `<style>` blok, `style=` atribut ni `on*=`
  rukovatelj. Zato CSP može biti bez `'unsafe-inline'`. Male stilske izmjene
  rade se preko pomoćnih klasa (`.u-*` na vrhu `style.css`), ne inline.
- **Demo escapea unos** prije umetanja u DOM (`esc()` u `initDemo`). To je
  jedino mjesto gdje korisnički tekst ide u `innerHTML`. Provjereno s 12 XSS
  payloada — nijedan se ne izvrši; ne dirati escaping.
- **CTA gumbi imaju `href` upisan u HTML** (ne samo iz JS-a) pa odredište
  postoji i za tražilice/agente; JS ga samo osvježava iz `WHATSAPP_NUMBER` i
  javi u konzoli ako se broj u HTML-u i onaj u `app.js` raziđu.
- **`frame-ancestors` / X-Frame-Options** ne rade preko `<meta>`, samo preko
  HTTP zaglavlja. GitHub Pages ih ne dopušta, pa zaštita od uokvirenja
  (clickjacking) stiže tek s vlastitom domenom i poslužiteljem koji šalje
  zaglavlja. Za statičnu prodajnu stranicu bez prijave rizik je nizak.
- **`llms.txt`** daje asistentima i agentima sažetak ponude i cijena, uz
  izričitu napomenu da je broj rezervirano mjesto i da demo ništa ne šalje.
- **Strix penetracijski test** nije pokrenut lokalno jer traži Docker (nije
  instaliran) ili račun na app.strix.ai. Umjesto toga napadna površina —
  koja je kod statične stranice mala — ručno je provjerena: XSS, sigurnost
  vanjskih veza, sheme u `href`, miješani sadržaj, forme. Bez nalaza.

## Interakcije

Video animacija je uklonjena (i frameovi s njom). Stranicu sada nose:

**Sekvenca dodira** (`#kako`) — prikovana sekcija visoka 300vh. Kako skrolaš,
`data-step` na `#tap` ide 1 → 2 → 3: telefon se spušta prema kartici, NFC
valovi pulsiraju, pa se na ekranu pojavi recenzija sa zvjezdicama koje se
pale s odmakom. Scena je crtana CSS-om — nekoliko kB umjesto 19 MB frameova.
Koraci su prava sekvenca pa brojevi 01/02/03 nose informaciju, nisu ukras.

**Traka napretka** — tanka akcentna linija na vrhu; koliko je pročitano.

**Traka djelatnosti** (`.marquee`) — imena branši klize vodoravno na skrol.

**Kalkulator ↔ paketi** — dok vučeš klizač, odgovarajuća kartica paketa
dobiva klasu `is-match` i osvijetli se, pa je veza između klizača i cjenika
vidljiva.

**Nagib kartica** — slike proizvoda prate pokazivač (samo uređaji s mišem).

**Demo filtra zadovoljstva** (`#sustav`) — nije slika nego obrazac koji radi.
Tok: pokreni → „Jeste li zadovoljni?" → DA vodi na Google obrazac, NE na
privatnu formu. U obje grane zvjezdice su pravi gumbi, tekst se stvarno
upisuje, a gumb za slanje vodi na ekran potvrde koji prikaže upravo ono što
je upisano. Ocjena i tekst pamte se po grani (`state` u `initDemo`) pa se ne
gube pri skakanju između DA i NE.

Ništa se ne šalje niti izlazi iz stranice — oznaka „Demo — ništa se ne šalje"
stoji u zaglavlju, a obje potvrde to ponavljaju. Adresa
`vlasnik@tvojobrt.hr` je ilustrativna i treba je zamijeniti pravom.

Detalji koje je lako slomiti pri izmjenama:

- `body` **ne smije** imati `overflow-x: hidden` — pretvara body u scroll
  kontejner i ubija `position: sticky`, čime prikovana sekcija prestaje
  držati kadar. Vodoravni višak se rješava preko `overflow-x: clip` na `html`.
- `.tap-phone` se pomiče preko `bottom`, ne `transform: translateY`. Tako
  uvijek ostaje razmak iznad kartice; s translateY telefon prekrije karticu
  i izgubi se poanta da je *prislanja na* nešto.
- Visina `.s-kako` (300vh) određuje koliko skrola traje sekvenca.
- Sadržaj prikovanog okvira **mora stati** u `calc(100vh - var(--nav-h))` jer
  `.kako-sticky` ima `overflow: hidden`. Na niskim ekranima to je tijesno pa
  postoje dva stupnja: ispod 860px visine scena i razmaci se stisnu, a ispod
  720px (portrait) prikazuje se opis samo aktivnog koraka. Uvijek je otvoren
  točno jedan opis pa visina liste ostaje ista i raspored ne poskakuje. Ako
  se mijenja tekst koraka ili veličina scene, provjeriti da 3. korak
  („Otvara se recenzija") nije odrezan na 375×667.
- U demou se ocjena mijenja **na mjestu**, bez ponovnog crtanja ekrana —
  inače tekst u polju i fokus odlete pri svakom kliku na zvjezdicu.

## Dizajn

Izvorni „Nocturne" design system nije bio isporučen uz predložak. Od tokena
su poznate samo tri vrijednosti (`--color-bg`, `--color-text`,
`--color-accent`); ostale su izvedene i označene komentarom na vrhu
`css/style.css`. Ako bundle ikad stigne, zamijeniti samo `:root` blok.

Hrvatski tekst je finalan i ne prepisuje se. Poruke koje idu na WhatsApp
namjerno su bez dijakritike radi kompatibilnosti.
