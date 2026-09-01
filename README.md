# Taborniški arhiv

Šolska full-stack aplikacija za pripravo, oddajo in pregled taborniških poročil. Sistem uporablja ločena React frontend in Express backend, podatki pa se hranijo v obstoječi MySQL bazi.

- aplikacija: <http://88.200.63.148:5714>
- backend: <http://88.200.63.148:5713>

## Funkcionalnosti

- registracija, prijava, seja in odjava uporabnika;
- pregled in iskanje po arhivu oddanih poročil;
- hierarhični in seznamski prikaz arhiva;
- pregled lastnih osnutkov in oddanih poročil;
- ustvarjanje, shranjevanje in urejanje osnutkov iz predlog;
- pregled in končna oddaja poročila v arhiv;
- administratorsko ponovno odprtje in brisanje poročil.

## Tehnologije

- frontend: React, React Router, Vite in navaden CSS;
- backend: Node.js in Express;
- podatkovna baza: MySQL oziroma MariaDB;
- prijava: Express session in Argon2.

## Struktura projekta

```text
SIS3_Taborniski_Arhiv/
├── back-end/
│   ├── db/             # povezava z bazo in SQL-poizvedbe
│   ├── middleware/     # preverjanje prijave in administratorske vloge
│   ├── routes/         # prijava, poročila, katalog in administracija
│   ├── utils/          # skupna validacija poročil
│   └── index.js
└── front-end/
    └── src/
        ├── components/
        ├── context/
        ├── pages/
        └── utils/
```

## Lokalni zagon

Potrebni so Node.js, npm in dostop do pripravljene MySQL baze.

### Backend

```bash
cd back-end
cp .env.example .env
npm ci
npm start
```

V `.env` je treba nastaviti povezavo z bazo, dovoljeni naslov frontenda in skrivnost seje:

```env
PORT=5000
CLIENT_URL=http://localhost:3000
SESSION_SECRET=replace_with_a_random_value

DB_HOST=localhost
DB_PORT=3306
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=SISIII2026_89231391
```

Preverjanje backenda:

```bash
curl http://localhost:5000/
curl http://localhost:5000/health
```

### Frontend

V drugem terminalu:

```bash
cd front-end
cp .env.example .env.local
npm ci
npm run dev
```

Frontend je nato dostopen na <http://localhost:3000>. Datoteka `.env.local` določa naslov backenda:

```env
VITE_API_URL=http://localhost:5000
```

## Produkcijski zagon na študentskem strežniku

Backend uporablja vrata `5713`, frontend pa vrata `5714`.

Backend `.env` mora med drugim vsebovati:

```env
PORT=5713
CLIENT_URL=http://88.200.63.148:5714
```

Frontend `.env.local` mora vsebovati:

```env
VITE_API_URL=http://88.200.63.148:5713
```

Po namestitvi paketov se procesa zaženeta tako:

```bash
cd back-end
npm ci
nohup node index.js > backend.log 2>&1 &
```

```bash
cd front-end
npm ci
npm run build
nohup node node_modules/vite/bin/vite.js preview --host 0.0.0.0 --port 5714 > frontend.log 2>&1 &
```

Po spremembi `VITE_API_URL` je treba ponovno izdelati frontend z `npm run build`.

## Git veje

- `main` vsebuje preverjene stabilne različice;
- `develop` vsebuje razvojno različico projekta.

