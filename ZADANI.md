# Systedo PPC Checker — Projektove zadani v3.0

## Prehled projektu

PPC Checker je komplexni platforma pro spravu PPC reklamnich uctu. Kombinuje tri klicove schopnosti:

1. **Monitoring** — automaticke hlidani stavu uctu, reklam, produktu, fakturace a detekce problemu
2. **Tvorba kampani** — automaticke generovani PPC kampani z produktovych feedu (Shopping, PMax, Search)
3. **Notifikace** — okamzite Slack alerty pri problemech, denni digest, resoluce

Klicovy princip: System preventivne detekuje problemy driv, nez zpusobi financni skody, a soucasne automatizuje tvorbu a udrzbu kampani z dat, ktera uz existuji v produktovych feedech.

## Datove zdroje (API)

| API | Sluzba | Pouziti |
|-----|--------|---------|
| Google Ads API | Google Ads | Cteni + zapis kampani, ad groups, reklam, keywords, metrik, fakturace, change history |
| Merchant API | Google Merchant Center | Produktovy feed, stav produktu, feed diagnostika, ceny, dostupnost |
| Drak API | Seznam Sklik | Kampane, sestavy, inzeraty, klicova slova, statistiky, fakturace |
| Slack Web API | Slack | Odesilani notifikaci, alerty, denni digest |

## Technicky stack

| Technologie | Pouziti | Verze |
|-------------|---------|-------|
| Next.js (App Router) | Fullstack framework | 14.x+ |
| TypeScript | Typovy system | 5.x |
| Prisma | ORM + migrace | 5.x+ |
| PostgreSQL | Databaze | 15+ |
| TailwindCSS | Styling | 3.x |
| NextAuth.js | Autentizace | 4.x / 5.x |
| Slack Web API (@slack/web-api) | Notifikace | latest |
| BullMQ / node-cron | Planovane ulohy | — |
| Redis | Queue + cache | 7+ |

## Monitorovaci kontroly

System pravidelne (konfigurovatelny interval, default kazdou hodinu) kontroluje stav vsech napojenych PPC uctu.

### Kontroly reklam

| Check ID | Nazev | Severity | Logika |
|----------|-------|----------|--------|
| ads-disapproved | Zamitnute reklamy | CRITICAL | Reklama ma status DISAPPROVED nebo POLICY_VIOLATION |
| ads-limited | Omezene reklamy | HIGH | Reklama UNDER_REVIEW > 48h nebo LIMITED |
| ads-no-active | Ad group bez aktivnich reklam | HIGH | ENABLED ad group s 0 aktivnimi reklamami |
| ads-rsa-pinning | Vse pinute v RSA | MEDIUM | RSA ma vsechny pozice pinnute — limituje optimalizaci |
| ads-low-strength | Nizka sila reklamy | LOW | RSA Ad Strength = POOR |
| ads-expiring-promo | Expirace promo reklam | MEDIUM | Reklama s promotion extension expiruje do 3 dni |

### Kontroly produktu (Merchant Center)

| Check ID | Nazev | Severity | Logika |
|----------|-------|----------|--------|
| mc-disapproved | Zamitnute produkty | CRITICAL | Produkt DISAPPROVED. Alert pokud > 5% zamitnuto. |
| mc-expiring | Produkty brzy vyprsi | HIGH | Produkty s expiraci do 3 dni, feed neaktualizovan |
| mc-feed-errors | Chyby ve feedu | HIGH | Feed processing errors > 0 |
| mc-price-mismatch | Nesoulad cen | CRITICAL | Cena ve feedu != cena na webu |
| mc-account-issues | Account-level problemy | CRITICAL | MC account warning nebo suspension |
| mc-pending-spike | Narust pending produktu | MEDIUM | PENDING produkty +20% oproti predchozi kontrole |
| mc-availability | Nedostupne produkty | HIGH | Produkty oznaceny jako in_stock ale na webu out_of_stock |

### Kontroly klicovych slov

| Check ID | Nazev | Severity | Logika |
|----------|-------|----------|--------|
| kw-overlap | Prekryv keywords | HIGH | Stejne keyword ve 2+ kampaních — souperi v aukci |
| kw-negative-conflict | Konflikt s negativnimi | HIGH | Negativni KW blokuje aktivni KW |
| kw-duplicate-ag | Duplicity v ad group | MEDIUM | Stejne KW (ruzny match type) v jedne ad group |
| kw-low-qs | Nizky Quality Score | MEDIUM | QS <= 4 a > 100 impressions / 30 dni |
| kw-no-impressions | KW bez zobrazeni | LOW | Aktivni KW, 0 impressions / 30 dni |
| kw-search-terms | Problemove search terms | MEDIUM | Search terms s vysokou utratou a 0 konverzemi |

### Kontroly fakturace

| Check ID | Nazev | Severity | Logika |
|----------|-------|----------|--------|
| bill-low-balance | Nizky kredit | CRITICAL | Predplaceny kredit < 500 Kc / 20 EUR |
| bill-payment-fail | Neuspesna platba | CRITICAL | Posledni automaticka platba selhala |
| bill-card-expiring | Karta brzy vyprsi | HIGH | Platebni karta expiruje do 14 dni |
| bill-no-backup | Chybi zalozni platba | MEDIUM | Ucet ma jedinou platebni metodu |
| bill-budget-depleted | Budget vycerpan brzy | HIGH | Kampane spotrebuje 90%+ denniho budgetu pred 14:00 |
| bill-sklik-credit | Sklik — nizky kredit | CRITICAL | Sklik ucet — kredit pod limit |

### Detekce nahlych zmen

| Check ID | Nazev | Severity | Logika |
|----------|-------|----------|--------|
| chg-campaign-paused | Kampan zastavena | CRITICAL | Kampan s vydaji > X/den presla ENABLED -> PAUSED/REMOVED |
| chg-budget-spike | Zmena rozpoctu >50% | HIGH | Denni budget zmenen o >50% |
| chg-bid-spike | Zmena bidu >100% | HIGH | CPC bid nebo target CPA zmenen o >100% |
| chg-conv-drop | Propad konverzi | HIGH | Konverze -50% vs. 7denni prumer |
| chg-cpc-spike | Narust CPC | HIGH | Prum. CPC +100% vs. 7denni prumer |
| chg-access | Zmena pristupu | CRITICAL | Novy uzivatel nebo zmena opravneni na uctu |
| chg-tracking-gone | Sledovani konverzi odebrano | CRITICAL | Konverzni akce smazana nebo deaktivovana |
| chg-strategy | Zmena bidding strategie | HIGH | Bidding strategie zmenena bez planovane upravy |

### Kontroly vykonu

| Check ID | Nazev | Severity | Logika |
|----------|-------|----------|--------|
| perf-ctr-drop | Propad CTR >30% | MEDIUM | CTR kleslo >30% vs. 7denni prumer |
| perf-impr-drop | Propad zobrazeni >50% | HIGH | Impressions -50% day-over-day |
| perf-spend-anomaly | Anomalie utraty | HIGH | Denni utrata mimo 2x smerod. odchylku od 14d prumeru |
| perf-lost-is-budget | Vysoky Lost IS (budget) | MEDIUM | Search Lost Impression Share (budget) > 20% |
| perf-lost-is-rank | Vysoky Lost IS (rank) | MEDIUM | Search Lost Impression Share (rank) > 40% |

## Tvorba kampani z produktovych feedu

### Podporovane typy kampani

| Typ kampane | Platforma | Popis |
|-------------|-----------|-------|
| Shopping (Standard) | Google Ads | Standardni Shopping kampane s produktovymi skupinami |
| Performance Max | Google Ads | PMax kampane s asset groups z feedu |
| Search (DSA-like) | Google Ads | Dynamicke Search kampane z feedu |
| Search (klasicke) | Google Ads | Tradicni Search kampane |
| Produktove kampane | Sklik | Sklik produktove kampane z feedu |
| Textove kampane | Sklik | Sklik textove kampane z feedu |

### Workflow tvorby kampane

1. Uzivatel vybere produktovy feed (MC ucet) a cilovou platformu
2. Nastavi filtry — ktere produkty zahrnout (kategorie, cena, dostupnost, brand, custom labels)
3. Zvoli sablonu kampane (Shopping / PMax / Search / Produktove)
4. Konfiguruje pravidla segmentace — jak rozdelit produkty do ad groups / product groups
5. Definuje sablony reklam — placeholdery z feedu ({product_name}, {price}, {brand}...)
6. Nastavi rozpocet, bidding strategii a cileni
7. System vygeneruje preview — uzivatel zkontroluje a schvali
8. Po schvaleni system vytvori kampane pres Google Ads API / Drak API
9. System prubezne synchronizuje — nove produkty ve feedu = nove ad groups / keywords

### Segmentace produktu

| Typ | Popis | Priklad |
|-----|-------|---------|
| Dle kategorie | Kazda produktova kategorie = 1 ad group | Elektronika -> AG1, Obleceni -> AG2 |
| Dle brandu | Kazda znacka = 1 ad group | Nike -> AG1, Adidas -> AG2 |
| Dle cenoveho pasma | Produkty segmentovany dle ceny | 0-500 Kc -> AG1, 500-2000 Kc -> AG2 |
| Dle custom label | Segmentace dle custom label z feedu | Label 0 = "bestseller" -> vlastni kampane |
| Dle margin/priority | Vysoko-marzove produkty = vyssi bidy | Margin > 30% -> High-priority kampane |
| Kombinace | Vice kriterii najednou | Kategorie + cenove pasmo |

### Sablony reklam (RSA priklad)

```typescript
headlines: [
  "{product_name} | {brand}",
  "Koupit {product_name} za {price}",
  "{brand} — Skladem, doruceni zdarma",
  "Sleva na {product_name}",
]
descriptions: [
  "{product_name} od {brand}. Cena od {price}. Objednejte online.",
  "Velky vyber {category}. Doprava zdarma nad 1000 Kc.",
]
```

Placeholdery: `{product_name}`, `{brand}`, `{price}`, `{category}`, `{sale_price}`, `{custom_label_N}`

### Synchronizace feedu s kampanemi

| Udalost ve feedu | Akce v kampani |
|-------------------|----------------|
| Novy produkt pridan | Vytvori novy ad group / keyword / product group |
| Produkt odebran z feedu | Pozastavi prislusny ad group (neProvadi DELETE) |
| Zmena ceny | Aktualizuje reklamni text (pokud obsahuje {price}) |
| Produkt out of stock | Pozastavi ad group / keywords |
| Zmena kategorie | Presune do spravneho ad group |
| Zmena custom label | Presegmentuje dle noveho labelu |

### Dry-run a preview

Pred kazdym zapisem do API system vzdy nejdriv vygeneruje preview:
- Pocet kampani, ad groups, reklam a keywords k vytvoreni
- Odhadovany denni rozpocet a maximalni bidy
- Ukazku vygenerovanych reklam s realnymi daty z feedu
- Warnings — prilis dlouhe titulky, chybejici data, duplicity
- Diff oproti aktualnimu stavu

## Notifikacni system (Slack)

### Format Slack zpravy

```
CRITICAL | Google Ads | Klient: Acme s.r.o.
bill-low-balance: Nizky zustatek kreditu
Zustatek: 230 Kc (limit: 500 Kc)
Ucet: 123-456-7890
Odhadovana spotreba: ~850 Kc/den
Doporuceni: Dobit kredit nebo nastavit automaticke platby
```

### Typy notifikaci

| Typ | Kdy | Popis |
|-----|-----|-------|
| Okamzity alert | CRITICAL nalezen | Posila se ihned, i behem quiet hours |
| Standardni alert | HIGH/MEDIUM nalezen | Respektuje cooldown a quiet hours |
| Resoluce | Problem vyresen | Notifikace ze drivejsi problem zmizel |
| Denni digest | Rano (konfig.) | Souhrn vsech aktivnich problemu + stats |
| Campaign created | Kampan vytvorena | Info o nove vytvorene kampani z feedu |
| Sync report | Synchronizace dokoncena | Co se zmenilo |

### Konfigurace

| Parametr | Default |
|----------|---------|
| SLACK_WEBHOOK_URL | (povinne) |
| SLACK_CHANNEL_CRITICAL | #ppc-alerts-critical |
| SLACK_CHANNEL_DEFAULT | #ppc-alerts |
| NOTIFY_MIN_SEVERITY | MEDIUM |
| NOTIFY_QUIET_HOURS | 22:00-07:00 |
| NOTIFY_COOLDOWN_MIN | 60 minut |
| NOTIFY_DIGEST_ENABLED | false |
| NOTIFY_DIGEST_TIME | 08:00 |

## Specifikace API klientu

### Google Ads API (v17+)

| Funkce | Smer | Popis |
|--------|------|-------|
| getCampaigns() | READ | Vsechny kampane uctu + status, budget, strategie |
| getAdGroups(campaignId) | READ | Ad groups vcetne bidu a stavu |
| getAds(adGroupId) | READ | Reklamy — RSA headlines/descriptions, status, policy |
| getKeywords(adGroupId) | READ | Keywords + match type, QS, metriky |
| getChangeHistory(dateRange) | READ | Historie zmen v uctu |
| getBillingInfo() | READ | Stav fakturace, kredit, platebni metody |
| getMetrics(dateRange) | READ | Clicks, Impressions, CPC, Conversions, Cost |
| getSearchTerms(dateRange) | READ | Search term report |
| createCampaign(config) | WRITE | Vytvoreni kampane z feedu dle sablony |
| createAdGroup(config) | WRITE | Vytvoreni ad group + keywords + ads |
| updateAdGroup(id, changes) | WRITE | Aktualizace pri syncu |
| pauseAdGroup(id) | WRITE | Pozastaveni AG (produkt out of stock) |

### Merchant API (Google Merchant Center)

| Funkce | Smer | Popis |
|--------|------|-------|
| getProducts(filters?) | READ | Produkty z feedu — nazev, cena, dostupnost, kategorie, labels |
| getProductStatus() | READ | Stav produktu (approved/disapproved/pending) |
| getProductDiagnostics() | READ | Diagnostika problemu na urovni produktu |
| getFeedDiagnostics() | READ | Diagnostika feedu — chyby, warnings |
| getAccountIssues() | READ | Account-level problemy a warnings |

### Drak API (Seznam Sklik)

| Funkce | Smer | Popis |
|--------|------|-------|
| getCampaigns() | READ | Vsechny kampane Sklik uctu |
| getGroups(campaignId) | READ | Sestavy (ad groups) |
| getAds(groupId) | READ | Inzeraty — textove, produktove |
| getKeywords(groupId) | READ | Klicova slova + match type |
| getReport(dateRange) | READ | Statistiky kampani / sestav |
| getBillingInfo() | READ | Stav kreditu Sklik uctu |
| createCampaign(config) | WRITE | Vytvoreni kampane z feedu |
| createGroup(config) | WRITE | Vytvoreni sestavy + inzeratu + KW |
| updateGroup(id, changes) | WRITE | Aktualizace sestavy pri syncu feedu |

### Spolecne pozadavky na vsechny klienty

- Rate limiting — exponential backoff, respektovani API limitu
- Retry logika — automaticke opakovani pri 429/500/503 (max 3 pokusy)
- Timeout — konfigurovatelny (default 30s)
- Error handling — typovane chyby, logovani, graceful degradation
- Credentials — vse pres env vars, zadne hardcoded secrets
- Caching — Redis cache pro opakovane dotazy (TTL dle typu dat)
- Pagination — automaticke prochazeni vsech stranek
- Logging — strukturovane logy (request ID, duration, status)

## Databazove schema (Prisma)

### Hlavni entity

| Model | Ucel | Klicove vztahy |
|-------|------|----------------|
| User | Uzivatele systemu | Projects (N:M), role (admin/auditor/client) |
| Project | PPC projekt / klient | Accounts (1:N), CampaignTemplates (1:N) |
| AdAccount | Napojeny reklamni ucet (GAds/Sklik) | Project (N:1), platform, credentials ref |
| MerchantAccount | Napojeny Merchant Center | Project (N:1), feed config |
| CheckRun | Jeden beh monitorovacich kontrol | Project (N:1), Findings (1:N), timestamp |
| Finding | Jednotlivy nalez z kontroly | CheckRun (N:1), check_id, severity, data JSON |
| Alert | Odeslana Slack notifikace | Finding (N:1), stav (sent/resolved), timestamp |
| CampaignTemplate | Sablona pro generovani kampani z feedu | Project (N:1), typ, segmentace, sablony reklam |
| GeneratedCampaign | Kampan vytvorena z feedu | Template (N:1), external_id, sync stav |
| SyncLog | Log synchronizace feedu s kampanemi | GeneratedCampaign (N:1), changes JSON |
| CheckConfig | Konfigurace kontrol pro projekt | Project (N:1), prahy, enabled checks |

### Enum typy

| Enum | Hodnoty |
|------|---------|
| Platform | GOOGLE_ADS, SKLIK |
| Severity | CRITICAL, HIGH, MEDIUM, LOW, INFO |
| AlertStatus | ACTIVE, RESOLVED, MUTED |
| CampaignType | SHOPPING, PMAX, SEARCH, SEARCH_DSA, SKLIK_PRODUCT, SKLIK_TEXT |
| SyncAction | CREATED, UPDATED, PAUSED, RESUMED, REMOVED |
| UserRole | ADMIN, AUDITOR, CLIENT |

## Struktura projektu

```
ppc-checker/
├─ prisma/
│  ├─ schema.prisma
│  └─ migrations/
├─ src/
│  ├─ app/                         # Next.js App Router
│  │  ├─ (auth)/                  # Login, register
│  │  ├─ dashboard/               # Hlavni prehled
│  │  ├─ projects/[id]/           # Detail projektu
│  │  ├─ campaigns/               # Tvorba kampani z feedu
│  │  │  ├─ create/              # Wizard pro tvorbu
│  │  │  ├─ templates/           # Sprava sablon
│  │  │  └─ sync/                # Prehled synchronizace
│  │  ├─ monitoring/              # Monitoring dashboard
│  │  │  ├─ findings/            # Seznam nalezu
│  │  │  └─ alerts/              # Historie alertu
│  │  ├─ settings/                # Nastaveni projektu
│  │  └─ api/                     # API routes
│  ├─ clients/                     # API klienti
│  │  ├─ google-ads/              # Google Ads API klient
│  │  ├─ merchant/                # Merchant Center klient
│  │  ├─ sklik/                   # Drak API (Sklik) klient
│  │  └─ slack/                   # Slack notifikacni klient
│  ├─ checks/                      # Monitorovaci kontroly
│  │  ├─ ads/                     # Kontroly reklam
│  │  ├─ products/                # Kontroly produktu (MC)
│  │  ├─ keywords/                # Kontroly KW
│  │  ├─ billing/                 # Kontroly fakturace
│  │  ├─ changes/                 # Detekce nahlych zmen
│  │  ├─ performance/             # Kontroly vykonu
│  │  └─ runner.ts                # Orchestrace vsech kontrol
│  ├─ campaign-builder/            # Tvorba kampani z feedu
│  │  ├─ templates/               # Sablony kampani
│  │  ├─ segmentation/            # Logika segmentace
│  │  ├─ generator/               # Generovani struktury
│  │  ├─ sync/                    # Synchronizace feed -> kampane
│  │  └─ preview/                 # Preview + dry-run
│  ├─ notifications/               # Notifikacni system
│  │  ├─ slack.ts                 # Slack message builder
│  │  ├─ digest.ts                # Denni digest
│  │  └─ resolver.ts              # Resoluce alertu
│  ├─ jobs/                        # Background jobs
│  │  ├─ check-runner.job.ts      # Pravidelne kontroly (cron)
│  │  ├─ feed-sync.job.ts         # Synchronizace feedu
│  │  └─ digest.job.ts            # Denni digest
│  ├─ components/                  # React komponenty
│  ├─ middleware/                  # Auth + RBAC middleware
│  ├─ lib/                         # Utility, helpers
│  └─ db/                          # DB helpers, Prisma client
├─ package.json
├─ next.config.js
├─ tailwind.config.js
├─ docker-compose.yml
└─ .env.example
```

## Faze projektu a milestony

### Faze 1 — Zaklad
Zakladni infrastruktura: Next.js setup, Prisma, auth, zakladni UI, napojeni na API.

### Faze 2 — Monitoring & Notifikace

| Milestone | Obsah |
|-----------|-------|
| M1: Monitorovaci engine | Runner, zakladnich 10 checku (ads, billing, changes), cron job |
| M2: Vsechny kontroly | Kompletni sada 30+ checku vcetne MC, keywords, performance |
| M3: Slack notifikace | Alert builder, cooldown, quiet hours, resoluce, digest |
| M4: Monitoring dashboard | UI pro findings, alerty, konfigurace checku |

### Faze 3 — Tvorba kampani z feedu

| Milestone | Obsah |
|-----------|-------|
| M5: Campaign builder zaklad | Wizard UI, sablony, segmentace, preview/dry-run |
| M6: Google Ads kampane | Shopping + PMax + Search generovani a upload |
| M7: Sklik kampane | Produktove + textove kampane pres Drak API |
| M8: Feed synchronizace | Automaticky sync feed -> kampane, CRUD operace |

### Faze 4 — Polish & Deploy

| Milestone | Obsah |
|-----------|-------|
| M9: Testy a dokumentace | Unit testy checku, integracni testy API klientu, docs |
| M10: Docker + deploy | Docker Compose, CI/CD, staging/prod |

## Akceptacni kriteria

- Vsechny CRITICAL a HIGH nalezy z auditu opraveny
- TypeScript strict mode bez chyb
- Unit testy pro vsechny checky a campaign builder (min. 80% coverage)
- API klienti maji retry logiku, rate limiting a error handling
- Slack notifikace funguji end-to-end (alert + resoluce + digest)
- Campaign builder: dry-run + preview + upload funguji pro vsechny typy
- Feed synchronizace automaticky aktualizuje kampane
- RBAC implementovan na vsech chranenych routes
- Prisma migrace jsou reverzibilni
- Build prochazi bez chyb (next build)
