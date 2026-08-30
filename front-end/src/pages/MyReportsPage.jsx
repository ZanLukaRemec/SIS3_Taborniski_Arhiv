import { useContext, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import apiRequest from '../api'
import AuthContext from '../context/auth'
import { formatDate } from '../utils/formatters'

function sortByDate(reports, field) {
  return [...reports].sort(
    (first, second) =>
      new Date(second[field]).getTime() - new Date(first[field]).getTime(),
  )
}

function MyReportsPage() {
  const { user } = useContext(AuthContext)
  const location = useLocation()
  const navigate = useNavigate()
  const [drafts, setDrafts] = useState([])
  const [submittedReports, setSubmittedReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage] = useState(location.state?.success || '')

  useEffect(() => {
    if (location.state?.success) {
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [location.pathname, location.state?.success, navigate])

  useEffect(() => {
    let active = true

    async function loadReports() {
      setLoading(true)
      setError('')

      try {
        const data = await apiRequest('/reports')

        if (!active) {
          return
        }

        const reports = Array.isArray(data.reports) ? data.reports : []
        const ownReports = reports.filter(
          (report) => String(report.avtor_id) === String(user.id),
        )

        setDrafts(
          sortByDate(
            ownReports.filter((report) => report.status === 'osnutek'),
            'ustvarjeno_dne',
          ),
        )
        setSubmittedReports(
          sortByDate(
            ownReports.filter((report) => report.status === 'arhivirano'),
            'oddano_dne',
          ),
        )
      } catch (requestError) {
        if (active) {
          setError(requestError.message)
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadReports()
    return () => {
      active = false
    }
  }, [user.id])

  return (
    <section className="page-panel">
      <div className="page-heading">
        <div>
          <h1>Moja poročila</h1>
          <p className="page-description">
            Tvoji osnutki in že oddana poročila
          </p>
        </div>
        <Link className="button-link" to="/reports/new">
          Novo poročilo
        </Link>
      </div>

      {successMessage && (
        <p className="message message-success" role="status">
          {successMessage}
        </p>
      )}
      {error && (
        <p className="message message-error" role="alert">
          {error}
        </p>
      )}
      {loading ? (
        <p className="loading-message">Nalagam poročila …</p>
      ) : (
        !error && (
          <div className="my-report-sections">
            <ReportSection
              title="Osnutki"
              reports={drafts}
              emptyMessage="Nimaš shranjenih osnutkov."
              actionLabel="Uredi"
              actionPath={(report) => `/reports/${report.id}/edit`}
              dateField="ustvarjeno_dne"
              dateLabel="Ustvarjeno"
            />
            <ReportSection
              title="Oddana poročila"
              reports={submittedReports}
              emptyMessage="Nimaš še oddanih poročil."
              actionLabel="Poglej"
              actionPath={(report) => `/reports/${report.id}`}
              dateField="oddano_dne"
              dateLabel="Oddano"
            />
          </div>
        )
      )}
    </section>
  )
}

function ReportSection({
  title,
  reports,
  emptyMessage,
  actionLabel,
  actionPath,
  dateField,
  dateLabel,
}) {
  return (
    <section className="my-report-section">
      <h2>{title}</h2>

      {reports.length === 0 ? (
        <p className="empty-message">{emptyMessage}</p>
      ) : (
        <ul className="my-report-list">
          {reports.map((report) => (
            <li className="my-report-item" key={report.id}>
              <div>
                <h3>{report.naslov}</h3>
                <p>
                  {report.kategorija_naziv} · {report.arhivirno_leto}
                </p>
                <p>
                  {dateLabel}: {formatDate(report[dateField])}
                </p>
              </div>
              <Link
                className="secondary-link"
                to={actionPath(report)}
                state={{ from: '/my-reports' }}
              >
                {actionLabel}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default MyReportsPage
