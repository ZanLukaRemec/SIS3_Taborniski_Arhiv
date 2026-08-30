const slovenianDate = new Intl.DateTimeFormat('sl-SI')

export function formatDate(value) {
  if (!value) {
    return '—'
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : slovenianDate.format(date)
}

export function formatStatus(status) {
  return status === 'arhivirano' ? 'Oddano' : 'Osnutek'
}

export function formatAuthor(report) {
  return `${report.avtor_ime} ${report.avtor_priimek}`
}
