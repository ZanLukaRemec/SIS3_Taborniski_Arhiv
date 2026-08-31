const express = require("express");
const reportQuery = require("../db/report_query");
const { requireAdmin } = require("../middleware/auth");
const { parsePositiveInteger } = require("../utils/report_validation");

const router = express.Router();

router.post("/reports/:id/reopen", requireAdmin, async (req, res) => {
  const reportId = parsePositiveInteger(req.params.id);

  if (reportId === null) {
    return res.status(400).json({ message: "Neveljaven ID poročila" });
  }

  try {
    const currentReport = await reportQuery.getReportState(reportId);

    if (!currentReport) {
      return res.status(404).json({ message: "Poročilo ne obstaja" });
    }

    if (currentReport.status !== "arhivirano") {
      return res.status(409).json({ message: "Ponovno je mogoče odpreti samo arhivirano poročilo" });
    }

    const reopened = await reportQuery.reopenReport({
      reportId,
      adminId: req.session.user.id,
    });

    if (!reopened) {
      return res.status(409).json({ message: "Poročila ni bilo mogoče ponovno odpreti" });
    }

    const report = await reportQuery.getReportById({
      reportId,
      userId: req.session.user.id,
      isAdmin: true,
    });

    res.json({ message: "Poročilo je ponovno odprto", report });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Poročila ni bilo mogoče ponovno odpreti" });
  }
});

router.delete("/reports/:id", requireAdmin, async (req, res) => {
  const reportId = parsePositiveInteger(req.params.id);

  if (reportId === null) {
    return res.status(400).json({ message: "Neveljaven ID poročila" });
  }

  try {
    const deleted = await reportQuery.deleteReport({
      reportId,
      adminId: req.session.user.id,
    });

    if (!deleted) {
      return res.status(404).json({ message: "Poročilo ne obstaja" });
    }

    res.json({ message: "Poročilo je izbrisano" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Poročila ni bilo mogoče izbrisati" });
  }
});

module.exports = router;
