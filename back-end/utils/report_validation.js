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

module.exports = {
  getMissingRequiredFields,
  parsePositiveInteger,
  validateReportBody,
};
