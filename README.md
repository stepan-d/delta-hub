# Delta Hub

> Komunitní školní platforma pro sdílení meme obsahu, správu školního dění a moderaci komunity v jednom produktu.

Delta Hub je full-stack webová aplikace postavená nad `Next.js`, která propojuje několik oblastí běžného komunitního provozu do jednoho rozhraní:

- komunitní feed s příspěvky
- komentáře a reakce uživatelů
- kategorizaci a tagování obsahu
- nahlášení nevhodného obsahu
- správu školních akcí
- administraci a audit provozu

Cílem projektu není jen zobrazit seznam příspěvků, ale nabídnout použitelný základ pro reálnou školní nebo komunitní platformu, kterou lze dál rozvíjet. README níže je proto psaný tak, aby pomohl jak člověku, který projekt spouští poprvé, tak vývojáři, který do něj bude vstupovat později a potřebuje rychle pochopit jeho strukturu, architekturu a místa vhodná pro rozšíření.

---

## Obsah

- [1. Co je Delta Hub](#1-co-je-delta-hub)
- [2. Co aplikace umí](#2-co-aplikace-umi)
- [3. Pro koho je projekt určený](#3-pro-koho-je-projekt-urceny)
- [4. Architektura v kostce](#4-architektura-v-kostce)
- [5. Technologický stack](#5-technologicky-stack)
- [6. Struktura projektu](#6-struktura-projektu)
- [7. Jak aplikace funguje](#7-jak-aplikace-funguje)
- [8. Lokální spuštění](#8-lokalni-spusteni)
- [9. Proměnné prostředí](#9-promenne-prostredi)
- [10. Databáze a seed data](#10-databaze-a-seed-data)
- [11. Skripty](#11-skripty)
- [12. Role, oprávnění a autentizace](#12-role-opravneni-a-autentizace)
- [13. API přehled](#13-api-prehled)
- [14. Kde a jak projekt rozšiřovat](#14-kde-a-jak-projekt-rozsirovat)
- [15. Produkční nasazení](#15-produkcni-nasazeni)
- [16. Troubleshooting](#16-troubleshooting)
- [17. Poznámka k Next.js](#17-poznamka-k-nextjs)

---

## 1. Co je Delta Hub

Delta Hub je komunitní aplikace pro prostředí školy nebo menší organizované komunity. V praxi funguje jako kombinace interního feedu, jednoduchého content managementu a moderátorského nástroje.

Na uživatelské úrovni aplikace umožňuje:

- procházet komunitní obsah
- vytvářet příspěvky s obrázkem
- reagovat pomocí like
- diskutovat v komentářích
- filtrovat obsah podle kategorií a tagů
- hlásit nevhodný nebo problematický obsah

Na provozní úrovni aplikace řeší:

- evidenci uživatelů a rolí
- správu kategorií
- správu školních událostí
- zpracování reportů
- audit důležitých akcí v systému

Projekt je vhodný jako základ pro:

- školní komunitní portál
- interní studentskou platformu
- menší sociální aplikaci s moderací
- demonstrační nebo semestrální projekt s produkčněji působící strukturou

---

## 2. Co aplikace umí

### Veřejná a uživatelská část

- homepage s přehledem produktu a náhledem aktuálního komunitního obsahu
- registrace a přihlášení uživatelů
- zobrazení feedu meme příspěvků
- detail příspěvku
- komentáře pod příspěvky
- like systém
- filtrování podle kategorie, tagu a textového dotazu
- vytvoření nového příspěvku s uploadem obrázku
- profil přihlášeného uživatele

### Moderace a správa

- reportování příspěvků komunitou
- správa uživatelů
- správa příspěvků
- správa komentářů
- správa kategorií
- správa eventů
- změny stavů reportů
- audit log důležitých systémových operací

### Technické vlastnosti

- frontend a backend v jednom Next.js projektu
- REST API přes App Router route handlery
- PostgreSQL databáze přes Prisma
- session přes `httpOnly` JWT cookie
- upload obrázků do S3 kompatibilního storage
- automatické převádění obrázků do `webp`

---

## 3. Pro koho je projekt určený

README je napsaný hlavně pro tyto situace:

- přebíráš projekt po někom jiném
- chceš aplikaci rychle rozběhnout lokálně
- potřebuješ se zorientovat, kde je jaká logika
- chceš přidat novou funkci bez zbytečného hledání
- připravuješ nasazení nebo další rozvoj aplikace

Pokud si někdo přečte jen tento soubor, měl by pochopit:

- co je Delta Hub za produkt
- jaké problémy řeší
- z čeho je složený
- jak ho spustit
- kde se dělají typické změny

---

## 4. Architektura v kostce

Delta Hub je navržený jako full-stack monolit nad `Next.js`.

To v praxi znamená:

- uživatelské stránky jsou v `src/app`
- API endpointy jsou také v `src/app/api`
- business logika je oddělená do `src/lib/services`
- databázový model je v `prisma/schema.prisma`
- sdílené UI komponenty jsou v `src/components/ui`

### Tok requestu typicky vypadá takto

1. uživatel provede akci v UI
2. komponenta zavolá interní API endpoint
3. route handler ověří session a validaci vstupu
4. servisní vrstva provede business logiku
5. Prisma uloží nebo načte data z PostgreSQL
6. API vrátí JSON odpověď
7. UI aktualizuje stav a zobrazí výsledek

### Hlavní stavební vrstvy

- `UI vrstva`: stránky a React komponenty
- `API vrstva`: route handlery v App Routeru
- `Service vrstva`: aplikační logika, autorizace, uploady, audit
- `Data vrstva`: Prisma + PostgreSQL
- `Storage vrstva`: S3 nebo MinIO pro obrázky

---

## 5. Technologický stack

| Oblast | Technologie |
|---|---|
| Framework | `Next.js 16` |
| UI | `React 19` |
| Jazyk | `TypeScript` |
| Styling | `Tailwind CSS 4` |
| Databáze | `PostgreSQL` |
| ORM | `Prisma` |
| Auth | `JWT` + `httpOnly` cookie |
| Upload | `AWS SDK S3 client` |
| Obrázky | `sharp` |
| Validace | `zod` |

### Proč je tenhle stack důležitý

- `Next.js` drží frontend i backend v jednom projektu, takže vývoj je rychlejší a konzistentnější
- `Prisma` dává čitelnou datovou vrstvu a snadnější migrace
- `PostgreSQL` je vhodná pro relační model s uživateli, příspěvky, komentáři a reporty
- `sharp` řeší normalizaci a optimalizaci obrázků už při uploadu
- `JWT cookie session` drží auth flow jednoduchý bez externí auth služby

---

## 6. Struktura projektu

```text
src/
  app/
    api/                     API route handlery
    admin/                   administrační stránka
    memes/                   feed, detail a tvorba příspěvků
    events/                  přehled školních akcí
    categories/              správa nebo zobrazení kategorií
    login/                   přihlášení
    register/                registrace
    profile/                 profil uživatele
    layout.tsx               kořenový layout
    page.tsx                 homepage

  components/
    auth/                    auth UI
    home/                    homepage sekce
    layout/                  shell, navbar
    management/              admin a management panely
    memes/                   feed, detail, formuláře, typy
    ui/                      sdílené design komponenty

  lib/
    auth/                    JWT session helpery
    db/                      databázové selecty a helpery
    services/                aplikační logika
    validations/             validační schémata
    api-client.ts            klient pro volání interního API
    api-response.ts          jednotné response helpery
    prisma.ts                inicializace Prisma klienta
    logger.ts                logovací helper

prisma/
  migrations/               databázové migrace
  schema.prisma             datový model
  seed.ts                   demo seed

API.md                      detailnější API dokumentace
.env.example                vzor lokálních proměnných
```

### Jak se ve struktuře rychle zorientovat

Když chceš upravit:

- vzhled stránky: hledej v `src/app` a `src/components`
- API chování: hledej v `src/app/api`
- business pravidla: hledej v `src/lib/services`
- validace vstupu: hledej v `src/lib/validations`
- databázový model: hledej v `prisma/schema.prisma`
- seedovací data: hledej v `prisma/seed.ts`

---

## 7. Jak aplikace funguje

### 7.1 Uživatelské účty

Uživatel se může registrovat a přihlásit přes vlastní auth flow. Po úspěšném loginu nebo registraci server nastaví `httpOnly` cookie `session`, která obsahuje JWT token s identitou a rolí uživatele.

To znamená:

- frontend nepotřebuje ukládat token do `localStorage`
- session se posílá automaticky s requesty
- chráněné endpointy ověřují session na backendu

### 7.2 Meme obsah

Jádrem aplikace je feed příspěvků. Každý příspěvek může mít:

- autora
- kategorii
- název
- obrázek
- tagy
- počet like
- komentáře
- reporty od uživatelů

Feed podporuje filtrování a detail příspěvku. To je důležité i pro další rozvoj, protože právě tady se bude nejčastěji rozšiřovat produktová logika.

### 7.3 Upload obrázků

Při vytváření příspěvku se obrázek neposílá přímo do databáze, ale do objektového storage.

Současná logika:

- backend přijme soubor
- ověří velikost a MIME typ
- obrázek zpracuje přes `sharp`
- převede jej do `webp`
- uloží jej do bucketu
- do databáze se zapíše výsledná veřejná URL

To je praktické z hlediska výkonu, ceny i budoucí škálovatelnosti.

### 7.4 Moderace

Součástí produktu není jen publikace obsahu, ale i jeho kontrola.

Moderátorská a admin část řeší:

- přehled nahlášených příspěvků
- změnu stavu reportu
- správu komentářů
- správu kategorií
- správu eventů
- správu uživatelů
- audit log

Právě audit a reporty dělají z projektu něco víc než jen jednoduchý feed.

### 7.5 Eventy

Aplikace obsahuje i samostatnou oblast pro školní akce. Eventy mají vlastní CRUD logiku a mohou nést i strukturovaná metadata v JSON podobě. To je vhodné pro budoucí rozšíření bez nutnosti okamžitě překopávat schéma.

---

## 8. Lokální spuštění

### Požadavky

- `Node.js 20+`
- `npm 10+`
- dostupná `PostgreSQL` databáze
- dostupné S3 kompatibilní úložiště

### 1. Instalace závislostí

```bash
npm install
```

### 2. Vytvoření lokální konfigurace

```bash
cp .env.example .env
```

Pak doplň skutečné hodnoty.

### 3. Aplikace migrací

```bash
npx prisma migrate dev
```

Tento krok:

- vytvoří nebo aktualizuje databázové tabulky
- synchronizuje schéma s aktuálním stavem projektu

### 4. Naplnění demo daty

```bash
npm run db:seed
```

Seed je volitelný, ale pro první spuštění velmi užitečný, protože okamžitě vytvoří:

- demo uživatele
- demo kategorie
- demo příspěvky
- demo komentáře
- demo reporty
- demo eventy

### 5. Spuštění vývojového serveru

```bash
npm run dev
```

Potom otevři:

- [http://localhost:3000](http://localhost:3000)

---

## 9. Proměnné prostředí

Soubor `.env.example` obsahuje základ:

```env
DATABASE_URL=""
JWT_SECRET=

MINIO_ENDPOINT=
MINIO_REGION=
MINIO_BUCKET=
MINIO_ACCESS_KEY=
MINIO_SECRET_KEY=
MINIO_PUBLIC_BASE_URL=
MINIO_FORCE_PATH_STYLE=
```

### Popis proměnných

| Proměnná | Povinná | Význam |
|---|---|---|
| `DATABASE_URL` | ano | connection string do PostgreSQL |
| `JWT_SECRET` | ano | klíč pro podepisování session tokenů |
| `MINIO_ENDPOINT` | ano | endpoint objektového storage |
| `MINIO_REGION` | ano | region storage |
| `MINIO_BUCKET` | ano | bucket pro uploadované obrázky |
| `MINIO_ACCESS_KEY` | ano | access key ke storage |
| `MINIO_SECRET_KEY` | ano | secret key ke storage |
| `MINIO_PUBLIC_BASE_URL` | ano | veřejná URL, ze které budou obrázky dostupné |
| `MINIO_FORCE_PATH_STYLE` | ano | typicky `true` pro MinIO |

### Volitelné proměnné

| Proměnná | Význam |
|---|---|
| `DEMO_SEED_PASSWORD` | heslo pro seedovací demo účty |

### Doporučení

- pro lokální vývoj používej separátní databázi
- `JWT_SECRET` nastav na dlouhý náhodný řetězec
- před nasazením ověř, že `MINIO_PUBLIC_BASE_URL` opravdu vrací veřejně dostupné obrázky

---

## 10. Databáze a seed data

Datový model je definovaný v [prisma/schema.prisma](/Users/stepandudycha/Documents/Projekty/delta-hub/prisma/schema.prisma).

### Hlavní entity

- `User`
- `Meme`
- `MemeCategory`
- `MemeLike`
- `MemeComment`
- `MemeTag`
- `UserReport`
- `SchoolEvent`
- `AuditLog`

### Co z toho plyne architektonicky

- uživatel může vytvářet příspěvky a komentáře
- příspěvek může mít kategorii a více tagů
- příspěvek může být likovaný i reportovaný
- moderátorské akce lze auditovat
- eventy jsou oddělené od feedu, ale stále součástí stejného produktu

### Seed

Seed je v [prisma/seed.ts](/Users/stepandudycha/Documents/Projekty/delta-hub/prisma/seed.ts).

Vytváří:

- demo admin účet
- demo moderator účet
- několik běžných uživatelů
- ukázkové kategorie
- několik demo příspěvků
- demo lajky
- demo komentáře
- demo reporty
- demo eventy
- demo audit záznamy

Výchozí seed heslo:

```text
DeltaHubDemo123!
```

Pokud chceš jiné, nastav `DEMO_SEED_PASSWORD`.

---

## 11. Skripty

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run db:seed
```

### Význam skriptů

- `npm run dev`: spustí lokální vývojový server
- `npm run build`: vytvoří produkční build
- `npm run start`: spustí produkční build
- `npm run lint`: zkontroluje kvalitu kódu
- `npm run db:seed`: naplní databázi demo daty

---

## 12. Role, oprávnění a autentizace

### Auth model

Autentizace je postavená nad session cookie:

- cookie se jmenuje `session`
- je `httpOnly`
- v produkci je `secure`
- token má platnost 7 dní

### Role

| Role | Význam |
|---|---|
| `User` | běžný přihlášený uživatel |
| `Moderator` | rozšířená práva pro moderaci |
| `Admin` | plná správa systému |

### Co je dobré vědět při rozšiřování

Pokud přidáváš nový chráněný endpoint, typicky budeš řešit jednu z těchto variant:

- endpoint pro jakéhokoliv přihlášeného uživatele
- endpoint jen pro moderátora nebo admina
- endpoint jen pro admina

Tahle logika je centralizovaná v auth/service vrstvě, takže ji nerozmnožuj ručně v každém handleru, pokud to není nutné.

---

## 13. API přehled

API je umístěné v `src/app/api`.

### Hlavní oblasti endpointů

#### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

#### Uživatelé

- `GET /api/users`
- `GET /api/users/[userId]`
- `PATCH /api/users/[userId]`
- `DELETE /api/users/[userId]`

#### Memes

- `GET /api/memes`
- `POST /api/memes`
- `GET /api/memes/[memeId]`
- `PATCH /api/memes/[memeId]`
- `DELETE /api/memes/[memeId]`
- `POST /api/memes/[memeId]/like`
- `GET /api/memes/[memeId]/comments`
- `POST /api/memes/[memeId]/comments`
- `POST /api/memes/[memeId]/report`

#### Kategorie a eventy

- `GET /api/categories`
- `POST /api/categories`
- `PATCH /api/categories/[categoryId]`
- `DELETE /api/categories/[categoryId]`
- `GET /api/events`
- `POST /api/events`
- `GET /api/events/[eventId]`
- `PATCH /api/events/[eventId]`
- `DELETE /api/events/[eventId]`

#### Upload

- `POST /api/uploads/image`

#### Admin

- `GET /api/admin/reports`
- `PATCH /api/admin/reports/[reportId]`
- `GET /api/admin/comments`
- `GET /api/admin/audit-logs`
- `GET /api/admin/memes`

Kompletní response formáty a detailní dokumentace jsou v [API.md](/Users/stepandudycha/Documents/Projekty/delta-hub/API.md).

---

## 14. Kde a jak projekt rozšiřovat

Tohle bývá nejdůležitější část při přebírání projektu.

### Když chceš přidat novou stránku

Přidej route do `src/app` a podle potřeby nové komponenty do `src/components`.

### Když chceš přidat nový endpoint

1. vytvoř route handler v `src/app/api`
2. přidej nebo uprav validaci v `src/lib/validations`
3. logiku dej do `src/lib/services`
4. pokud je potřeba, uprav datový model v `prisma/schema.prisma`

### Když chceš změnit business logiku

Primárně pracuj v `src/lib/services`. UI nebo route handlery by neměly být místem, kde se začne hromadit složitá aplikační pravidla.

### Když chceš upravit data v databázi

Uprav `prisma/schema.prisma` a vytvoř migraci:

```bash
npx prisma migrate dev
```

### Když chceš rozšířit administraci

Nejdůležitější místo je `src/components/management`. Tam je soustředěná většina admin workflow.

### Když chceš přidat novou doménovou oblast

Dobrý postup je držet stejný vzor jako zbytek projektu:

1. datový model v Prisma
2. validace vstupů
3. service vrstva
4. API handler
5. UI komponenty a stránka

### Doporučení pro další rozvoj

- oddělovat business logiku od UI
- držet response formát konzistentní
- nové role a oprávnění centralizovat
- u administrace pamatovat na audit
- u nových uploadů řešit limity a sanitizaci stejně důsledně jako u obrázků

---

## 15. Produkční nasazení

### Minimální checklist před deployem

- jsou nastavené všechny env proměnné
- PostgreSQL je dostupná a zálohovaná
- bucket pro uploady existuje
- veřejná URL obrázků funguje
- `JWT_SECRET` je bezpečný a unikátní
- migrace jsou aplikované
- existuje alespoň jeden admin účet

### Doporučený postup

1. připrav produkční `.env`
2. spusť databázové migrace
3. vytvoř build
4. spusť aplikaci

```bash
npx prisma migrate deploy
npm run build
npm run start
```

### Co README záměrně neřeší do detailu

- konkrétní cloud provider
- CI/CD pipeline
- reverzní proxy konfiguraci
- monitoring stack

Tyto části závisí na cílovém prostředí. Samotná aplikace je ale na ně připravená standardním způsobem.

---

## 16. Troubleshooting

### Chyba: `JWT_SECRET environment variable is not set`

V `.env` chybí `JWT_SECRET`.

### Chyby při uploadu obrázků

Zkontroluj:

- jestli je dostupný storage endpoint
- jestli bucket existuje
- jestli jsou správné klíče
- jestli je správně nastavené `MINIO_PUBLIC_BASE_URL`

### Upload neprojde kvůli typu nebo velikosti

Backend akceptuje běžné rastrové formáty a omezuje velikost souboru. Obrázek se navíc serverově převádí do `webp`, takže je potřeba počítat s tímto workflow i při případném rozšíření upload logiky.

### Po spuštění nefunguje feed nebo admin

Nejčastější příčiny:

- nejsou aplikované migrace
- seed neběžel a chybí data
- přihlášený účet nemá odpovídající roli
- databáze nebo storage nejsou dostupné

---

## 17. Poznámka k Next.js

Projekt běží na `Next.js 16`, což je důležité při větších zásazích do aplikace. Tento projekt má v repozitáři explicitní instrukci nebrat Next.js jako "standardní starší Next", protože některé konvence a API se mohou lišit.

Před většími změnami frameworkové logiky si proto projdi relevantní materiály v:

`node_modules/next/dist/docs/`

To je důležité hlavně při práci s:

- App Routerem
- route handlery
- server/client komponentami
- novějšími konvencemi Next.js 16

---

## Shrnutí

Delta Hub je dobře rozšiřitelný základ pro komunitní školní platformu se sociálním feedem, moderací a správou doprovodného obsahu. Pokud chceš projekt dál rozvíjet, nejdůležitější je držet současné vrstvení:

- UI v komponentách
- API v route handlerech
- business logiku v service vrstvě
- datový model v Prisma schématu

Díky tomu zůstane aplikace čitelná i ve chvíli, kdy do ní přibudou další moduly nebo složitější pravidla.
