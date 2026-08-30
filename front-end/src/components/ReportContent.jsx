import {
  formatAuthor,
  formatDate,
  formatStatus,
} from '../utils/formatters'

function formatFieldValue(field, value) {
  if (value === undefined || value === null || value === '') {
    return '—'
  }

  if (typeof value === 'boolean') {
    return value ? 'Da' : 'Ne'
  }

  if (Array.isArray(value)) {
    return value.join(', ')
  }

  if (field.type === 'date' || field.tip === 'date') {
    return formatDate(value)
  }

  if (typeof value === 'object') {
    return JSON.stringify(value)
  }

  return String(value)
}

function getFields(report) {
  const content = report.vsebina_obrazca || {}

  if (Array.isArray(report.struktura_obrazca)) {
    return report.struktura_obrazca.map((field, index) => ({
      key: field.name || index,
      label: field.label || field.name || `Polje ${index + 1}`,
      value: formatFieldValue(field, content[field.name]),
    }))
  }

  return Object.entries(content).map(([name, value]) => ({
    key: name,
    label: name,
    value: formatFieldValue({}, value),
  }))
}

function ReportContent({ report }) {
  const fields = getFields(report)
  const reportDate =
    report.status === 'arhivirano' ? report.oddano_dne : report.ustvarjeno_dne

  return (
    <article className="report-content">
      <header className="report-header">
        <h1>{report.naslov}</h1>
        <dl className="report-meta">
          <div>
            <dt>Leto</dt>
            <dd>{report.arhivirno_leto}</dd>
          </div>
          <div>
            <dt>Kategorija</dt>
            <dd>{report.kategorija_naziv}</dd>
          </div>
          <div>
            <dt>Avtor</dt>
            <dd>{formatAuthor(report)}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>
              <span className={`status status-${report.status}`}>
                {formatStatus(report.status)}
              </span>
            </dd>
          </div>
          <div>
            <dt>{report.status === 'arhivirano' ? 'Oddano' : 'Ustvarjeno'}</dt>
            <dd>{formatDate(reportDate)}</dd>
          </div>
        </dl>
      </header>

      <section className="report-fields">
        <h2>Vsebina poročila</h2>
        {fields.length === 0 ? (
          <p className="empty-message">Poročilo nima vnesene vsebine.</p>
        ) : (
          <dl>
            {fields.map((field) => (
              <div className="report-field" key={field.key}>
                <dt>{field.label}</dt>
                <dd>{field.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>
    </article>
  )
}

export default ReportContent
