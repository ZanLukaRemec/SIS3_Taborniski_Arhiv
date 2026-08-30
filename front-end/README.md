# Taborniški arhiv frontend

## Lokalni zagon

```bash
cp .env.example .env
npm install
npm run dev
```

Razvojni frontend je privzeto dostopen na `http://localhost:3000`. Spremenljivka `VITE_API_URL` določa naslov Express backenda.

## Produkcijski build

```bash
npm run build
```

Rezultat se ustvari v mapi `dist`.
