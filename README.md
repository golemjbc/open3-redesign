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
index.html          – úvodní stránka
akce.html            – seznam akcí (role-gating)
detail-akce.html     – detail akce, registrace, platby
pravidla.html        – pravidla komunity (statický obsah)
contact.html         – kontakt (statický obsah)
assets/css/style.css – celý design systém
assets/js/auth.js    – sdílená Discord OAuth logika
```

## Jak si to prohlédnout lokálně

```
cd OOO-web-redesign
python -m http.server 8000
```
a otevřít `http://localhost:8000`.

## Nasazení

Zatím žádné. Až bude design schválený, dá se nasadit stejným způsobem jako `open3-novy` (GitHub Pages) — buď nahrazením obsahu toho repa, nebo přes vlastní doménu/subdoménu pro A/B porovnání.
