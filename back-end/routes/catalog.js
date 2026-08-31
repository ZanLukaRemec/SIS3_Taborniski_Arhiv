const express = require("express");
const reportQuery = require("../db/report_query");
const { requireAuth } = require("../middleware/auth");
const { parsePositiveInteger } = require("../utils/report_validation");

const router = express.Router();

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
