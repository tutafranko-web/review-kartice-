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

## Uvodna animacija

Frameovi su izvučeni iz uspravnog videa (1080×1920, 16,8 s) u punoj
rezoluciji:

```bash
ffmpeg -i video.mov -vf "fps=12" -c:v libwebp -quality 82 \
  "frames/frame_%04d.webp"
```

201 frame, ~19 MB. Vezani su na skrol kroz blok visok 250vh (200vh na
mobitelu) — visina bloka izravno određuje brzinu animacije. Na mobitelu animacija zauzima cijeli ekran (ispod izbornika) i
nema nikakvog teksta; na desktopu je video u okviru telefona u sredini.
Ako se video mijenja, uskladiti `FRAME_COUNT` u `js/app.js`.

Detalji koje je lako slomiti pri izmjenama:

- `body` **ne smije** imati `overflow-x: hidden` — pretvara body u scroll
  kontejner i ubija `position: sticky`, čime animacija prestaje držati kadar.
  Vodoravni višak se rješava preko `overflow-x: clip` na `html`.
- Svi elementi u `.intro-sticky` moraju biti eksplicitno u `grid-row: 1`.
  Bez toga grid gura treću poruku u drugi red, gdje je `overflow: hidden`
  odreže.
- `FRAME_SPEED = 1.0` jer ScrollTrigger progres 1.0 pada točno u trenutku
  kad se sticky kadar otpušta.

## Dizajn

Izvorni „Nocturne" design system nije bio isporučen uz predložak. Od tokena
su poznate samo tri vrijednosti (`--color-bg`, `--color-text`,
`--color-accent`); ostale su izvedene i označene komentarom na vrhu
`css/style.css`. Ako bundle ikad stigne, zamijeniti samo `:root` blok.

Hrvatski tekst je finalan i ne prepisuje se. Poruke koje idu na WhatsApp
namjerno su bez dijakritike radi kompatibilnosti.
