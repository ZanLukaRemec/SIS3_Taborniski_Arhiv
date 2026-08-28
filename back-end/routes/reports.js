const express = require("express");
const reportQuery = require("../db/report_query");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
const allowedStatuses = ["osnutek", "arhivirano"];

function parsePositiveInteger(value) {
  if (value === undefined) {
    return undefined;
  }

  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

router.get("/reports", requireAuth, async (req, res) => {
  const year = parsePositiveInteger(req.query.year);
  const category = parsePositiveInteger(req.query.category);
  const status = req.query.status;
  const search = req.query.search?.trim();

  if (year === null || category === null) {
    return res.status(400).json({ message: "Leto in kategorija morata biti veljavni števili" });
  }

  if (status && !allowedStatuses.includes(status)) {
    return res.status(400).json({ message: "Neveljaven status poročila" });
  }

  try {
    const reports = await reportQuery.getReports({
      userId: req.session.user.id,
      isAdmin: req.session.user.vloge.includes("administrator"),
      year,
      category,
      status,
      search,
    });

    res.json({ reports });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Poročil ni bilo mogoče pridobiti" });
  }
});

router.get("/reports/:id", requireAuth, async (req, res) => {
  const reportId = parsePositiveInteger(req.params.id);

  if (reportId === null) {
    return res.status(400).json({ message: "Neveljaven ID poročila" });
  }

  try {
    const report = await reportQuery.getReportById({
      reportId,
      userId: req.session.user.id,
      isAdmin: req.session.user.vloge.includes("administrator"),
    });

    if (!report) {
      return res.status(404).json({ message: "Poročilo ne obstaja ali ni dostopno" });
    }

    res.json({ report });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Poročila ni bilo mogoče pridobiti" });
  }
});

router.get("/categories", requireAuth, async (req, res) => {
  try {
    const categories = await reportQuery.getCategories();
    res.json({ categories });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Kategorij ni bilo mogoče pridobiti" });
  }
});

router.get("/templates", requireAuth, async (req, res) => {
  const category = parsePositiveInteger(req.query.category);

  if (category === null) {
    return res.status(400).json({ message: "Kategorija mora biti veljavno število" });
  }

  try {
    const templates = await reportQuery.getTemplates(category);
    res.json({ templates });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Predlog ni bilo mogoče pridobiti" });
  }
});

module.exports = router;
