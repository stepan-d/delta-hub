# API dokumentace — Delta Hub

## Základní konvence

### Response formát

Každý endpoint vrací JSON v jednom ze dvou tvarů:

```json
// Úspěch
{ "data": <hodnota>, "message": "volitelný text" }

// Chyba
{ "error": "popis chyby", "code": "volitelný kód" }
```

### HTTP stavové kódy

| Kód | Kdy |
|-----|-----|
| `200` | OK |
| `201` | Vytvořeno |
| `204` | Smazáno (prázdná odpověď) |
| `400` | Chybný vstup (validace) |
| `401` | Není přihlášen |
| `403` | Nemá oprávnění |
| `404` | Zdroj neexistuje |
| `409` | Konflikt (duplicita) |
| `500` | Chyba serveru |

---

## Autentizace

Auth funguje přes **httpOnly cookie `session`** (JWT, platná 7 dní).

Cookie se nastaví automaticky po úspěšném `POST /api/auth/login` nebo `POST /api/auth/register`. Prohlížeč ji posílá s každým dalším requestem automaticky — **není potřeba nic nastavovat ručně**.

```ts
// Přihlášení — prohlížeč si uloží cookie automaticky
await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'jan@skola.cz', password: 'heslo123' }),
})

// Chráněný endpoint — cookie jde s requestem sama
await fetch('/api/memes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ imageUrl: 'https://...' }),
})
```

> Pokud voláš API z jiné domény (cross-origin), přidej `credentials: 'include'` do každého fetch volání.

### Role

| Role | Popis |
|------|-------|
| `User` | Běžný přihlášený uživatel |
| `Admin` | Administrátor — přístup k admin endpointům |

V dokumentaci níže:
- **🔒 Login** = vyžaduje přihlášení (libovolný uživatel)
- **🛡️ Admin** = vyžaduje roli `Admin`
- *(prázdné)* = veřejný endpoint

---

## Auth

### `POST /api/auth/register`

Registrace nového uživatele. Nastaví session cookie.

**Body:**
```json
{
  "username": "jan_novak",
  "email": "jan@skola.cz",
  "password": "heslo1234",
  "schoolYear": 2,
  "favoriteSubject": "Matematika"
}
```

> `username`: 3–50 znaků, pouze `a-z A-Z 0-9 _`  
> `password`: 8–72 znaků  
> `schoolYear`: 1–4 (volitelné)  
> `favoriteSubject`: max 100 znaků (volitelné)

**Response `201`:**
```json
{
  "data": {
    "userId": 1,
    "username": "jan_novak",
    "email": "jan@skola.cz",
    "role": "User",
    "schoolYear": 2,
    "favoriteSubject": "Matematika",
    "createdAt": "2026-04-27T10:00:00Z"
  }
}
```

**Chyby:** `400` validace, `409` email/username již existuje

---

### `POST /api/auth/login`

Přihlášení. Nastaví session cookie.

**Body:**
```json
{ "email": "jan@skola.cz", "password": "heslo1234" }
```

**Response `200`:** stejný tvar uživatele jako register

**Chyby:** `400` validace, `401` špatné heslo nebo email

---

### `POST /api/auth/logout`

Odhlášení. Smaže cookie.

**Response `204`** (prázdná)

---

### `GET /api/auth/me` 🔒

Vrátí aktuálně přihlášeného uživatele (z JWT).

**Response `200`:**
```json
{
  "data": {
    "userId": 1,
    "username": "jan_novak",
    "email": "jan@skola.cz",
    "role": "User"
  }
}
```

---

## Users

### `GET /api/users` 🛡️ Admin

Seznam všech uživatelů.

**Response `200`:**
```json
{
  "data": [
    {
      "userId": 1,
      "username": "jan_novak",
      "email": "jan@skola.cz",
      "role": "User",
      "schoolYear": 2,
      "favoriteSubject": "Matematika",
      "createdAt": "2026-04-27T10:00:00Z"
    }
  ]
}
```

---

### `GET /api/users/[userId]` 🔒 Login (vlastní profil nebo Admin)

Vrátí detail uživatele. Běžný uživatel může číst pouze svůj profil.

**Response `200`:** stejný tvar jako výše

**Chyby:** `403` cizí profil, `404` uživatel neexistuje

---

### `PATCH /api/users/[userId]` 🔒 Login (vlastní profil nebo Admin)

Úprava profilu. Alespoň jedno pole je povinné.

**Body** (vše volitelné, ale alespoň jedno):
```json
{
  "username": "novy_nick",
  "email": "novy@email.cz",
  "schoolYear": 3,
  "favoriteSubject": null
}
```

**Response `200`:** aktualizovaný uživatel

**Chyby:** `400` validace, `403` cizí profil, `409` email/username obsazeno

---

### `DELETE /api/users/[userId]` 🛡️ Admin

Smazání uživatele.

**Response `204`**

---

## Memes

### `GET /api/memes`

Výpis mémů s paginací a filtrací. Pokud je uživatel přihlášen, vrátí i `likedByCurrentUser`.

**Query parametry:**

| Parametr | Typ | Výchozí | Popis |
|----------|-----|---------|-------|
| `page` | number | `1` | Stránka |
| `limit` | number | `20` | Počet (max 100) |
| `categoryId` | number | — | Filtr kategorie |
| `userId` | number | — | Filtr autora |
| `search` | string | — | Hledání v titulku (case-insensitive) |
| `tag` | string | — | Filtr tagu |
| `sort` | `newest`\|`oldest`\|`mostLiked` | `newest` | Řazení |

**Response `200`:**
```json
{
  "data": {
    "memes": [
      {
        "memeId": 1,
        "title": "Pondělní mém",
        "imageUrl": "https://...",
        "tags": {},
        "likeCount": 42,
        "createdAt": "2026-04-27T10:00:00Z",
        "categoryId": 2,
        "category": { "categoryId": 2, "name": "Školní", "description": null },
        "author": { "userId": 1, "username": "jan_novak", ... },
        "commentCount": 5,
        "likedByCurrentUser": false
      }
    ],
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

> `likedByCurrentUser` je přítomno pouze pokud je uživatel přihlášen.

---

### `POST /api/memes` 🔒 Login

Vytvoření nového méma.

**Body:**
```json
{
  "imageUrl": "https://cdn.example.com/meme.jpg",
  "title": "Pondělní mém",
  "categoryId": 2,
  "tags": { "škola": true, "pondělí": true }
}
```

> Pouze `imageUrl` je povinné.

**Response `201`:** objekt méma (stejný tvar jako v seznamu)

---

### `GET /api/memes/[memeId]`

Detail méma.

**Response `200`:** objekt méma

**Chyby:** `404`

---

### `PATCH /api/memes/[memeId]` 🔒 Login (vlastní mém nebo Admin)

Úprava méma. Alespoň jedno pole povinné.

**Body** (vše volitelné):
```json
{
  "title": "Nový titulek",
  "categoryId": 3,
  "tags": { "škola": true }
}
```

> Pole lze nastavit na `null` pro vymazání.

**Response `200`:** aktualizovaný mém

**Chyby:** `400`, `403`, `404`

---

### `DELETE /api/memes/[memeId]` 🔒 Login (vlastní mém nebo Admin)

Smazání méma.

**Response `204`**

---

## Likes

### `POST /api/memes/[memeId]/like` 🔒 Login

Toggle like — první volání přidá like, druhé ho odebere.

**Response `200`:**
```json
{
  "data": {
    "liked": true,
    "likeCount": 43
  }
}
```

---

## Comments

### `GET /api/memes/[memeId]/comments`

Komentáře k mémo, seřazené od nejstaršího.

**Response `200`:**
```json
{
  "data": [
    {
      "commentId": 1,
      "memeId": 1,
      "text": "😂",
      "createdAt": "2026-04-27T10:05:00Z",
      "author": { "userId": 1, "username": "jan_novak", ... }
    }
  ]
}
```

---

### `POST /api/memes/[memeId]/comments` 🔒 Login

Přidání komentáře.

**Body:**
```json
{ "text": "Toto je nejlepší mém!" }
```

> `text`: 1–1000 znaků

**Response `201`:** objekt komentáře

---

### `PATCH /api/memes/[memeId]/comments/[commentId]` 🔒 Login (vlastní komentář nebo Admin)

Úprava komentáře.

**Body:**
```json
{ "text": "Opravený text" }
```

**Response `200`:** aktualizovaný komentář

---

### `DELETE /api/memes/[memeId]/comments/[commentId]` 🔒 Login (vlastní komentář nebo Admin)

Smazání komentáře.

**Response `204`**

---

## Reports

### `POST /api/memes/[memeId]/report` 🔒 Login

Nahlášení méma.

**Body:**
```json
{ "reason": "Nevhodný obsah" }
```

> `reason`: 1–1000 znaků

**Response `201`:**
```json
{
  "data": {
    "reportId": 1,
    "memeId": 1,
    "reporterId": 2,
    "reason": "Nevhodný obsah",
    "status": "pending",
    "createdAt": "2026-04-27T10:10:00Z"
  }
}
```

---

### `GET /api/admin/reports` 🛡️ Admin

Seznam všech nahlášení.

**Response `200`:** pole reportů (stejný tvar jako výše)

---

### `PATCH /api/admin/reports/[reportId]` 🛡️ Admin

Aktualizace stavu nahlášení.

**Body:**
```json
{ "status": "resolved" }
```

> Povolené hodnoty: `pending`, `reviewed`, `rejected`, `resolved`

**Response `200`:** aktualizovaný report

---

## Categories

### `GET /api/categories`

Seznam všech kategorií, seřazeno abecedně.

**Response `200`:**
```json
{
  "data": [
    { "categoryId": 1, "name": "Školní", "description": "Memy ze školy" }
  ]
}
```

---

### `POST /api/categories` 🛡️ Admin

Vytvoření kategorie.

**Body:**
```json
{ "name": "Školní", "description": "Memy ze školy" }
```

> `name`: 1–50 znaků, musí být unikátní  
> `description`: volitelné

**Response `201`:** objekt kategorie

**Chyby:** `409` název již existuje

---

### `PATCH /api/categories/[categoryId]` 🛡️ Admin

Úprava kategorie.

**Body** (alespoň jedno pole):
```json
{ "name": "Nový název", "description": null }
```

**Response `200`:** aktualizovaná kategorie

**Chyby:** `404`, `409` název obsazen

---

### `DELETE /api/categories/[categoryId]` 🛡️ Admin

Smazání kategorie. Mémům v kategorii se `categoryId` nastaví na `null` — **žádný mém se nesmaže**.

**Response `204`**

---

## Events (školní akce)

### `GET /api/events`

Seznam akcí s paginací.

**Query parametry:** `page` (výchozí 1), `limit` (výchozí 20, max 100)

**Response `200`:**
```json
{
  "data": {
    "events": [
      {
        "eventId": 1,
        "name": "Školní výlet",
        "date": "2026-05-15T00:00:00Z",
        "detailsJson": { "bus": true, "cena": 500 }
      }
    ],
    "total": 10,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

> `date` a `detailsJson` mohou být `null`.

---

### `POST /api/events` 🛡️ Admin

Vytvoření akce.

**Body:**
```json
{
  "name": "Školní výlet",
  "date": "2026-05-15",
  "detailsJson": { "bus": true, "cena": 500 }
}
```

> Pouze `name` je povinné (1–150 znaků).  
> `date`: formát `YYYY-MM-DD` nebo `null`  
> `detailsJson`: libovolný JSON objekt nebo `null`

**Response `201`:** objekt akce

---

### `GET /api/events/[eventId]`

Detail akce.

**Response `200`:** objekt akce

**Chyby:** `404`

---

### `PATCH /api/events/[eventId]` 🛡️ Admin

Úprava akce. Alespoň jedno pole povinné.

**Body** (vše volitelné):
```json
{ "name": "Jiný název", "date": null, "detailsJson": null }
```

**Response `200`:** aktualizovaná akce

---

### `DELETE /api/events/[eventId]` 🛡️ Admin

Smazání akce.

**Response `204`**

---

## Audit Log

### `GET /api/admin/audit-logs` 🛡️ Admin

Historie akcí v systému.

**Query parametry:**

| Parametr | Typ | Popis |
|----------|-----|-------|
| `page` | number | Stránka (výchozí 1) |
| `limit` | number | Počet (výchozí 20, max 100) |
| `userId` | number | Filtr uživatele |
| `action` | string | Filtr akce (přesná shoda) |

**Možné hodnoty `action`:** `register`, `login`, `create_meme`, `update_meme`, `delete_meme`, `create_comment`, `delete_comment`, `report_meme`, `admin_update_report`, `create_category`, `update_category`, `delete_category`, `create_event`, `update_event`, `delete_event`

**Response `200`:**
```json
{
  "data": {
    "logs": [
      {
        "logId": 1,
        "action": "create_meme",
        "tableName": "memes",
        "recordId": 42,
        "timestamp": "2026-04-27T10:00:00Z",
        "userId": 3,
        "user": { "userId": 3, "username": "jan_novak", "email": "jan@skola.cz", "role": "User", ... }
      }
    ],
    "total": 500,
    "page": 1,
    "limit": 20,
    "totalPages": 25
  }
}
```

> `userId` a `user` mohou být `null` u systémových akcí.

---

## Přehled endpointů

| Metoda | Endpoint | Auth | Popis |
|--------|----------|------|-------|
| `POST` | `/api/auth/register` | — | Registrace |
| `POST` | `/api/auth/login` | — | Přihlášení |
| `POST` | `/api/auth/logout` | — | Odhlášení |
| `GET` | `/api/auth/me` | 🔒 | Aktuální uživatel |
| `GET` | `/api/users` | 🛡️ | Seznam uživatelů |
| `GET` | `/api/users/[id]` | 🔒 | Detail uživatele |
| `PATCH` | `/api/users/[id]` | 🔒 | Úprava uživatele |
| `DELETE` | `/api/users/[id]` | 🛡️ | Smazání uživatele |
| `GET` | `/api/memes` | — | Seznam mémů |
| `POST` | `/api/memes` | 🔒 | Vytvoření méma |
| `GET` | `/api/memes/[id]` | — | Detail méma |
| `PATCH` | `/api/memes/[id]` | 🔒 | Úprava méma |
| `DELETE` | `/api/memes/[id]` | 🔒 | Smazání méma |
| `POST` | `/api/memes/[id]/like` | 🔒 | Toggle like |
| `GET` | `/api/memes/[id]/comments` | — | Komentáře |
| `POST` | `/api/memes/[id]/comments` | 🔒 | Přidání komentáře |
| `PATCH` | `/api/memes/[id]/comments/[id]` | 🔒 | Úprava komentáře |
| `DELETE` | `/api/memes/[id]/comments/[id]` | 🔒 | Smazání komentáře |
| `POST` | `/api/memes/[id]/report` | 🔒 | Nahlášení méma |
| `GET` | `/api/admin/reports` | 🛡️ | Seznam nahlášení |
| `PATCH` | `/api/admin/reports/[id]` | 🛡️ | Aktualizace nahlášení |
| `GET` | `/api/categories` | — | Seznam kategorií |
| `POST` | `/api/categories` | 🛡️ | Vytvoření kategorie |
| `PATCH` | `/api/categories/[id]` | 🛡️ | Úprava kategorie |
| `DELETE` | `/api/categories/[id]` | 🛡️ | Smazání kategorie |
| `GET` | `/api/events` | — | Seznam akcí |
| `POST` | `/api/events` | 🛡️ | Vytvoření akce |
| `GET` | `/api/events/[id]` | — | Detail akce |
| `PATCH` | `/api/events/[id]` | 🛡️ | Úprava akce |
| `DELETE` | `/api/events/[id]` | 🛡️ | Smazání akce |
| `GET` | `/api/admin/audit-logs` | 🛡️ | Audit log |
