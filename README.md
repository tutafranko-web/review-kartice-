# reviewcard.hr

Jednostranična prodajna stranica za NFC kartice za Google recenzije, s uvodnom
scroll animacijom izrađenom iz videa.

## Pokretanje

Stranica **mora** ići preko HTTP-a — otvaranje `index.html` dvoklikom (`file://`)
ne učitava frameove.

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
js/app.js             animacija, kalkulator, demo, WhatsApp linkovi
assets/               izresci kartica (crna, plava)
frames/               201 webp framea uvodne animacije
```

Bez buildera i bez ovisnosti. GSAP, ScrollTrigger i Lenis učitavaju se s CDN-a.

## ⚠️ Prije objave

1. **WhatsApp broj** — u `js/app.js` stoji placeholder `385000000000`.
   Dok se ne zamijeni, svih devet CTA gumba vodi u prazno. Konzola upozorava.

2. **Sekcija „Brojke koje uvjeravaju"** je namjerno prazna, uokvirena
   narančastom crtkanom linijom. Brojke i rok isporuke nisu izmišljeni —
   treba upisati stvarne u `data-value` atribute i ukloniti klasu
   `needs-data`. Ako stvarnih brojki nema, sekciju maknuti.

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
