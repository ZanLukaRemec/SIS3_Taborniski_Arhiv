const pool = require("./connection");

async function findByLogin(login) {
  const [users] = await pool.execute(
    `SELECT id, ime, priimek, uporabnisko_ime, e_posta, geslo_hash
     FROM clan
     WHERE uporabnisko_ime = ? OR e_posta = ?
     LIMIT 1`,
    [login, login],
  );

  if (users.length === 0) {
    return null;
  }

  const user = users[0];
  const [roles] = await pool.execute(
    `SELECT v.naziv
     FROM dodelitev_vloge dv
     JOIN vloga v ON v.id = dv.vloga_id
     WHERE dv.clan_id = ?
       AND dv.dodeljena_dne <= CURRENT_DATE
       AND (dv.odvzeta_dne IS NULL OR dv.odvzeta_dne >= CURRENT_DATE)`,
    [user.id],
  );

  return {
    ...user,
    vloge: roles.map((role) => role.naziv),
  };
}

async function createUser({
  ime,
  priimek,
  uporabnisko_ime,
  e_posta,
  geslo_hash,
  datum_rojstva,
}) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [roles] = await connection.execute(
      "SELECT id FROM vloga WHERE naziv = 'uporabnik' LIMIT 1",
    );

    if (roles.length === 0) {
      const error = new Error("Privzeta vloga uporabnik ne obstaja");
      error.code = "MISSING_DEFAULT_ROLE";
      throw error;
    }

    const [result] = await connection.execute(
      `INSERT INTO clan
       (ime, priimek, uporabnisko_ime, e_posta, geslo_hash, datum_rojstva, vod_id)
       VALUES (?, ?, ?, ?, ?, ?, NULL)`,
      [
        ime,
        priimek,
        uporabnisko_ime,
        e_posta,
        geslo_hash,
        datum_rojstva,
      ],
    );

    await connection.execute(
      `INSERT INTO dodelitev_vloge
       (dodeljena_dne, odvzeta_dne, vloga_id, clan_id)
       VALUES (CURRENT_DATE, NULL, ?, ?)`,
      [roles[0].id, result.insertId],
    );

    await connection.commit();

    return {
      id: result.insertId,
      ime,
      priimek,
      uporabnisko_ime,
      e_posta,
      vloge: ["uporabnik"],
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  createUser,
  findByLogin,
};
