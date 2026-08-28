const pool = require("./connection");

function parseJson(value) {
  if (!value || typeof value !== "string") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    return null;
  }
}

async function getReports({
  userId,
  isAdmin,
  year,
  category,
  status,
  search,
}) {
  let sql = `
    SELECT
      p.id,
      p.naslov,
      p.status,
      p.ustvarjeno_dne,
      p.oddano_dne,
      p.arhivirno_leto,
      p.predloga_id,
      p.avtor_id,
      kp.id AS kategorija_id,
      kp.naziv AS kategorija_naziv,
      c.ime AS avtor_ime,
      c.priimek AS avtor_priimek
    FROM porocilo p
    JOIN clan c ON c.id = p.avtor_id
    JOIN kategorija_porocila kp ON kp.id = p.kategorija_porocila_id
    WHERE 1 = 1`;
  const params = [];

  if (!isAdmin) {
    sql += " AND (p.status = 'arhivirano' OR p.avtor_id = ?)";
    params.push(userId);
  }

  if (year !== undefined) {
    sql += " AND p.arhivirno_leto = ?";
    params.push(year);
  }

  if (category !== undefined) {
    sql += " AND p.kategorija_porocila_id = ?";
    params.push(category);
  }

  if (status) {
    sql += " AND p.status = ?";
    params.push(status);
  }

  if (search) {
    const pattern = `%${search}%`;
    sql += `
      AND (
        p.naslov LIKE ?
        OR LOWER(p.vsebina_obrazca) LIKE LOWER(?)
        OR kp.naziv LIKE ?
        OR c.ime LIKE ?
        OR c.priimek LIKE ?
      )`;
    params.push(pattern, pattern, pattern, pattern, pattern);
  }

  sql += " ORDER BY p.arhivirno_leto DESC, p.ustvarjeno_dne DESC";

  const [reports] = await pool.execute(sql, params);
  return reports;
}

async function getReportById({ reportId, userId, isAdmin }) {
  let sql = `
    SELECT
      p.id,
      p.naslov,
      p.vsebina_obrazca,
      p.status,
      p.ustvarjeno_dne,
      p.oddano_dne,
      p.arhivirno_leto,
      p.predloga_id,
      p.avtor_id,
      kp.id AS kategorija_id,
      kp.naziv AS kategorija_naziv,
      kp.opis AS kategorija_opis,
      c.ime AS avtor_ime,
      c.priimek AS avtor_priimek,
      po.struktura_obrazca
    FROM porocilo p
    JOIN clan c ON c.id = p.avtor_id
    JOIN kategorija_porocila kp ON kp.id = p.kategorija_porocila_id
    LEFT JOIN predloga_obrazca po ON po.id = p.predloga_id
    WHERE p.id = ?`;
  const params = [reportId];

  if (!isAdmin) {
    sql += " AND (p.status = 'arhivirano' OR p.avtor_id = ?)";
    params.push(userId);
  }

  const [reports] = await pool.execute(sql, params);

  if (reports.length === 0) {
    return null;
  }

  return {
    ...reports[0],
    vsebina_obrazca: parseJson(reports[0].vsebina_obrazca),
    struktura_obrazca: parseJson(reports[0].struktura_obrazca),
  };
}

async function getCategories() {
  const [categories] = await pool.execute(
    `SELECT id, naziv, opis
     FROM kategorija_porocila
     ORDER BY naziv`,
  );

  return categories;
}

async function getTemplates(categoryId) {
  let sql = `
    SELECT
      po.id,
      po.struktura_obrazca,
      po.veljavno_od,
      po.veljavno_do,
      kp.id AS kategorija_id,
      kp.naziv AS kategorija_naziv
    FROM predloga_obrazca po
    JOIN kategorija_porocila kp ON kp.id = po.kategorija_id
    WHERE po.veljavno_od <= CURRENT_DATE
      AND (po.veljavno_do IS NULL OR po.veljavno_do >= CURRENT_DATE)`;
  const params = [];

  if (categoryId !== undefined) {
    sql += " AND po.kategorija_id = ?";
    params.push(categoryId);
  }

  sql += " ORDER BY kp.naziv, po.veljavno_od DESC";

  const [templates] = await pool.execute(sql, params);
  return templates.map((template) => ({
    ...template,
    struktura_obrazca: parseJson(template.struktura_obrazca),
  }));
}

module.exports = {
  getCategories,
  getReportById,
  getReports,
  getTemplates,
};
