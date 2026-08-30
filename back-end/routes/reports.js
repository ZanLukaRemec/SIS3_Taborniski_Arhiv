const express = require("express");
const reportQuery = require("../db/report_query");
const { requireAdmin, requireAuth } = require("../middleware/auth");

const router = express.Router();
const allowedStatuses = ["osnutek", "arhivirano"];

function parsePositiveInteger(value) {
  if (value === undefined) {
    return undefined;
  }

  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

function validateReportBody(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Telo zahteve mora biti JSON objekt" };
  }

  const naslov = typeof body.naslov === "string" ? body.naslov.trim() : "";
  const arhivirnoLeto = parsePositiveInteger(body.arhivirno_leto);
  const predlogaId = parsePositiveInteger(body.predloga_id);
  const kategorijaId = parsePositiveInteger(body.kategorija_id);
  const vsebinaObrazca = body.vsebina_obrazca;

  if (!naslov || naslov.length > 200) {
    return { error: "Naslov mora vsebovati od 1 do 200 znakov" };
  }

  if (arhivirnoLeto === null || arhivirnoLeto === undefined) {
    return { error: "Arhivsko leto mora biti veljavno število" };
  }

  if (predlogaId === null || predlogaId === undefined) {
    return { error: "Predloga mora biti veljavno število" };
  }

  if (kategorijaId === null || kategorijaId === undefined) {
    return { error: "Kategorija mora biti veljavno število" };
  }

  if (
    !vsebinaObrazca ||
    typeof vsebinaObrazca !== "object" ||
    Array.isArray(vsebinaObrazca)
  ) {
    return { error: "Vsebina obrazca mora biti JSON objekt" };
  }

  return {
    report: {
      naslov,
      vsebinaObrazca,
      arhivirnoLeto,
      predlogaId,
      kategorijaId,
    },
  };
}

function getMissingRequiredFields(templateFields, content) {
  if (!Array.isArray(templateFields)) {
    return null;
  }

  return templateFields
    .filter((field) => {
      if (!field.required) {
        return false;
      }

      const value = content[field.name];
      return (
        value === undefined ||
        value === null ||
        (typeof value === "string" && value.trim() === "")
      );
    })
    .map((field) => field.label || field.name);
}

async function validateTemplate(report) {
  const template = await reportQuery.getTemplateById(report.predlogaId);

  if (!template) {
    return { error: "Izbrana predloga ne obstaja ali ni več veljavna" };
  }

  if (template.kategorija_id !== report.kategorijaId) {
    return { error: "Predloga ne pripada izbrani kategoriji" };
  }

  if (!Array.isArray(template.struktura_obrazca)) {
    return { error: "Predloga nima veljavne strukture obrazca" };
  }

  return {};
}

router.post("/reports", requireAuth, async (req, res) => {
  const validation = validateReportBody(req.body);

  if (validation.error) {
    return res.status(400).json({ message: validation.error });
  }

  try {
    const templateValidation = await validateTemplate(validation.report);

    if (templateValidation.error) {
      return res.status(400).json({ message: templateValidation.error });
    }

    const reportId = await reportQuery.createDraft({
      ...validation.report,
      avtorId: req.session.user.id,
    });
    const report = await reportQuery.getReportById({
      reportId,
      userId: req.session.user.id,
      isAdmin: false,
    });

    res.status(201).json({ message: "Osnutek je ustvarjen", report });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Osnutka ni bilo mogoče ustvariti" });
  }
});

router.put("/reports/:id", requireAuth, async (req, res) => {
  const reportId = parsePositiveInteger(req.params.id);
  const validation = validateReportBody(req.body);

  if (reportId === null) {
    return res.status(400).json({ message: "Neveljaven ID poročila" });
  }

  if (validation.error) {
    return res.status(400).json({ message: validation.error });
  }

  try {
    const currentReport = await reportQuery.getReportState(reportId);

    if (!currentReport) {
      return res.status(404).json({ message: "Poročilo ne obstaja" });
    }

    if (currentReport.avtor_id !== req.session.user.id) {
      return res.status(403).json({ message: "Urejate lahko samo svoje osnutke" });
    }

    if (currentReport.status !== "osnutek") {
      return res.status(409).json({ message: "Arhiviranega poročila ni mogoče urejati" });
    }

    const templateValidation = await validateTemplate(validation.report);

    if (templateValidation.error) {
      return res.status(400).json({ message: templateValidation.error });
    }

    await reportQuery.updateDraft({ reportId, ...validation.report });
    const report = await reportQuery.getReportById({
      reportId,
      userId: req.session.user.id,
      isAdmin: false,
    });

    res.json({ message: "Osnutek je shranjen", report });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Osnutka ni bilo mogoče shraniti" });
  }
});

router.post("/reports/:id/submit", requireAuth, async (req, res) => {
  const reportId = parsePositiveInteger(req.params.id);

  if (reportId === null) {
    return res.status(400).json({ message: "Neveljaven ID poročila" });
  }

  try {
    const currentReport = await reportQuery.getReportState(reportId);

    if (!currentReport) {
      return res.status(404).json({ message: "Poročilo ne obstaja" });
    }

    if (currentReport.avtor_id !== req.session.user.id) {
      return res.status(403).json({ message: "Oddate lahko samo svoje poročilo" });
    }

    if (currentReport.status !== "osnutek") {
      return res.status(409).json({ message: "Poročilo je že arhivirano" });
    }

    const reportDraft = await reportQuery.getReportById({
      reportId,
      userId: req.session.user.id,
      isAdmin: false,
    });
    const missingFields = getMissingRequiredFields(
      reportDraft.struktura_obrazca,
      reportDraft.vsebina_obrazca,
    );

    if (missingFields === null) {
      return res.status(400).json({ message: "Predloga nima veljavne strukture obrazca" });
    }

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Manjkajo obvezna polja: ${missingFields.join(", ")}`,
      });
    }

    const submitted = await reportQuery.submitDraft(reportId);

    if (!submitted) {
      return res.status(409).json({ message: "Poročila ni bilo mogoče oddati" });
    }

    const report = await reportQuery.getReportById({
      reportId,
      userId: req.session.user.id,
      isAdmin: false,
    });

    res.json({ message: "Poročilo je oddano in arhivirano", report });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Poročila ni bilo mogoče oddati" });
  }
});

router.post("/admin/reports/:id/reopen", requireAdmin, async (req, res) => {
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

router.delete("/admin/reports/:id", requireAdmin, async (req, res) => {
  const reportId = parsePositiveInteger(req.params.id);

  if (reportId === null) {
    return res.status(400).json({ message: "Neveljaven ID poročila" });
  }

  try {
    const currentReport = await reportQuery.getReportState(reportId);

    if (!currentReport) {
      return res.status(404).json({ message: "Poročilo ne obstaja" });
    }

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
