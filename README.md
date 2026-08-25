# OOO Community — redesign koncept (2026)

Nový, modernizovaný vizuální design webu OOO Community. **Není nasazený na produkci** — je to samostatná, vedlejší verze pro porovnání a rozhodnutí, jestli/kdy nahradit současný web na [open3.cz](https://open3.cz).

## Co je jinak

- Kompletně nové vizuální zpracování (typografie Inter, karty, gradient akcenty, responzivní grid) místo staré šablony Tooplate/Bootstrap 4.
- Žádné závislosti na jQuery, Bootstrap, owl-carousel ani flexslider — čistý vanilla HTML/CSS/JS, žádný build krok.
- Stejná funkčnost jako produkce (viz níže) — **žádná změna v backendu ani v Azure Functions**.

## Co je stejné (záměrně)

Tahle verze mluví se **stejným živým backendem** jako produkční open3.cz:

- `API_BASE = https://ooo-functions-....azurewebsites.net` — stejná Azure Function App
- Stejný Discord OAuth `client_id` a redirect (přihlášení funguje identicky)
- Stejný `localStorage` klíč `oooUser` — pokud jsi přihlášený na produkci, budeš přihlášený i tady (a naopak)
- Stejná byznys logika: role-gating akcí (`discord_role_required`), kontrola přihlášení a role při vstupu na detail akce (oprava z 2026-08-11), partner autocomplete, platební cyklus záloha → doplatek → zaplaceno

**Registrace a platby přes tuhle verzi jsou tedy plně funkční a zapisují se do stejného Google Sheetu jako produkce** — není to jen mockup. Otestováno naživo proti reálnému API (viz commit historie).

## Struktura

```
index.html            – úvodní stránka
akce.html              – seznam akcí (role-gating, zaplněnost)
detail-akce.html       – detail akce, registrace (Discord i Google), dotazník, platby
dotaznik.html          – vstupní dotazník pro akce typu C
admin-akce.html        – admin panel: akce a přihlášky
admin-clenove.html     – admin panel: přehled členů
admin-dotazniky.html   – admin panel: fronta dotazníků
pravidla.html          – pravidla komunity (statický obsah)
contact.html           – kontakt (statický obsah)
assets/css/style.css   – celý design systém
assets/js/auth.js      – sdílené přihlášení, identita, avatar menu
assets/js/member-modal.js  – znovupoužitelný detail člena (admin)
assets/js/profile-modal.js – vlastní profil + párování účtů
```

## Jak si to prohlédnout lokálně

Lokální server (`python -m http.server`) funguje pro statický náhled, ale API volání na `localhost` padají na CORS (jen produkční a sandboxová doména jsou povolené) — pro cokoliv, co volá backend, je spolehlivější testovat rovnou na nasazené sandbox doméně (viz Nasazení níže).

## Nasazení

Sandbox se nasazuje přes obyčejný `git push` do `golemjbc/open3-redesign` — GitHub Pages publikuje automaticky na `https://golemjbc.github.io/open3-redesign/`. Nové funkce se odsud po otestování ručně a surgicky (ne kopií celého souboru) přenášejí do `OOO-produkce/frontend` → `golemjbc/open3-novy` → open3.cz. Backend (Azure Function App `ooo-functions`) je sdílený mezi sandboxem i produkcí — nasazení backendu tedy ovlivní obě najednou.
