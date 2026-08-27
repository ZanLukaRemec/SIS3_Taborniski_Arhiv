const argon2 = require("argon2");
const express = require("express");
const authQuery = require("../db/auth_query");

const router = express.Router();

router.post("/register", async (req, res) => {
  const {
    ime,
    priimek,
    uporabnisko_ime,
    e_posta,
    geslo,
    datum_rojstva = null,
  } = req.body;

  if (!ime || !priimek || !uporabnisko_ime || !e_posta || !geslo) {
    return res.status(400).json({ message: "Manjkajo obvezni podatki" });
  }

  if (geslo.length < 6) {
    return res.status(400).json({ message: "Geslo mora imeti najmanj 6 znakov" });
  }

  try {
    const geslo_hash = await argon2.hash(geslo);
    const user = await authQuery.createUser({
      ime: ime.trim(),
      priimek: priimek.trim(),
      uporabnisko_ime: uporabnisko_ime.trim(),
      e_posta: e_posta.trim(),
      geslo_hash,
      datum_rojstva: datum_rojstva || null,
    });

    res.status(201).json({ message: "Uporabnik je ustvarjen", user });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Uporabniško ime ali e-pošta že obstaja" });
    }

    console.error(error);
    res.status(500).json({ message: "Registracija ni uspela" });
  }
});

router.post("/login", async (req, res) => {
  const { prijava, geslo } = req.body;

  if (!prijava || !geslo) {
    return res.status(400).json({ message: "Vnesi prijavo in geslo" });
  }

  try {
    const user = await authQuery.findByLogin(prijava.trim());

    if (!user || !(await argon2.verify(user.geslo_hash, geslo))) {
      return res.status(401).json({ message: "Napačna prijava ali geslo" });
    }

    const sessionUser = {
      id: user.id,
      ime: user.ime,
      priimek: user.priimek,
      uporabnisko_ime: user.uporabnisko_ime,
      e_posta: user.e_posta,
      vloge: user.vloge,
    };

    req.session.user = sessionUser;
    res.json({ message: "Prijava je uspela", user: sessionUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Prijava ni uspela" });
  }
});

router.post("/logout", (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      return res.status(500).json({ message: "Odjava ni uspela" });
    }

    res.clearCookie("taborni_arhiv_session");
    res.json({ message: "Odjava je uspela" });
  });
});

router.get("/session", (req, res) => {
  if (!req.session.user) {
    return res.json({ prijavljen: false });
  }

  res.json({ prijavljen: true, user: req.session.user });
});

module.exports = router;
