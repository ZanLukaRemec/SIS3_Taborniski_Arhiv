import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import apiRequest from '../api'
import Dialog from '../components/Dialog'
import {
  formatAuthor,
  formatStatus,
} from '../utils/formatters'

function AdminReportsPage() {
  const [reports, setReports] = useState([])
  const [search, setSearch] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [loading, setLoading] = useState(true)
  const [performingAction, setPerformingAction] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [actionError, setActionError] = useState('')
  const [pendingAction, setPendingAction] = useState(null)

  useEffect(() => {
    let active = true
    const normalizedSearch = search.trim()

    const timeout = window.setTimeout(async () => {
      setLoading(true)
      setError('')

      try {
        const params = new URLSearchParams()

        if (normalizedSearch) {
          params.set('search', normalizedSearch)
        }

        const query = params.toString()
        const data = await apiRequest(`/reports${query ? `?${query}` : ''}`)

        if (active) {
          setReports(Array.isArray(data.reports) ? data.reports : [])
        }
      } catch (requestError) {
        if (active) {
          setReports([])
          setError(requestError.message)
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }, normalizedSearch ? 250 : 0)

    return () => {
      active = false
      window.clearTimeout(timeout)
    }
  }, [refreshKey, search])

  function handleSearch(event) {
    setSearch(event.target.value)
    setSuccess('')
  }

  function requestAction(type, report) {
    setPendingAction({ type, report })
    setActionError('')
  }

  function closeDialog() {
    setPendingAction(null)
    setActionError('')
  }

  async function performAction() {
    const { type, report } = pendingAction
    const deleting = type === 'delete'
    const path = deleting
      ? `/admin/reports/${report.id}`
      : `/admin/reports/${report.id}/reopen`

    setPerformingAction(true)
    setActionError('')
    setError('')
    setSuccess('')

    try {
      const data = await apiRequest(path, {
        method: deleting ? 'DELETE' : 'POST',
      })
      setPendingAction(null)
      setSuccess(data.message)
      setRefreshKey((current) => current + 1)
    } catch (requestError) {
      setActionError(requestError.message)
    } finally {
      setPerformingAction(false)
    }
  }

  return (
    <section className="page-panel">
      <div className="page-heading">
        <div>
          <h1>Upravljanje</h1>
          <p className="page-description">Vsa poročila v sistemu</p>
        </div>
      </div>

      <div className="admin-controls">
        <label className="search-field" htmlFor="admin-search">
          Iskanje
          <input
            id="admin-search"
            type="search"
            placeholder="Naslov, vsebina, kategorija ali avtor"
            value={search}
            onChange={handleSearch}
          />
        </label>
      </div>

      {success && (
        <p className="message message-success" role="status">
          {success}
        </p>
      )}
      {error && (
        <p className="message message-error" role="alert">
          {error}
        </p>
      )}
      {loading && <p className="loading-message">Nalagam poročila …</p>}
      {!loading && !error && reports.length === 0 && (
        <p className="empty-message">
          {search.trim()
            ? 'Nobeno poročilo ne ustreza iskanju.'
            : 'V sistemu še ni poročil.'}
        </p>
      )}
      {!loading && !error && reports.length > 0 && (
        <AdminReportTable reports={reports} onAction={requestAction} />
      )}

      {pendingAction && (
        <ActionDialog
          action={pendingAction}
          error={actionError}
          working={performingAction}
          onConfirm={performAction}
          onCancel={closeDialog}
        />
      )}
    </section>
  )
}

function AdminReportTable({ reports, onAction }) {
  return (
    <div className="table-wrapper">
      <table className="report-table admin-report-table">
        <thead>
          <tr>
            <th>Naslov</th>
            <th>Avtor</th>
            <th>Leto</th>
            <th>Kategorija</th>
            <th>Status</th>
            <th>Dejanja</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => (
            <tr key={report.id}>
              <td data-label="Naslov">{report.naslov}</td>
              <td data-label="Avtor">{formatAuthor(report)}</td>
              <td data-label="Leto">{report.arhivirno_leto}</td>
              <td data-label="Kategorija">{report.kategorija_naziv}</td>
              <td data-label="Status">
                <span className={`status status-${report.status}`}>
                  {formatStatus(report.status)}
                </span>
              </td>
              <td data-label="Dejanja">
                <div className="table-actions">
                  <Link
                    className="secondary-link"
                    to={`/reports/${report.id}`}
                    state={{ from: '/admin/reports' }}
                  >
                    Poglej
                  </Link>
                  {report.status === 'arhivirano' && (
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() => onAction('reopen', report)}
                    >
                      Vrni v osnutek
                    </button>
                  )}
                  <button
                    className="warning-button"
                    type="button"
                    onClick={() => onAction('delete', report)}
                  >
                    Izbriši
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ActionDialog({ action, error, working, onConfirm, onCancel }) {
  const deleting = action.type === 'delete'
  const title = deleting ? 'Brisanje poročila' : 'Vrnitev v osnutek'
  const confirmLabel = deleting ? 'Izbriši' : 'Vrni v osnutek'
  const workingLabel = deleting ? 'Brišem …' : 'Odpiram …'

  return (
    <Dialog
      title={title}
      actions={
        <>
          <button
            className={deleting ? 'warning-button' : ''}
            type="button"
            onClick={onConfirm}
            disabled={working}
          >
            {working ? workingLabel : confirmLabel}
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={onCancel}
            disabled={working}
          >
            Prekliči
          </button>
        </>
      }
    >
      <p>
        {deleting
          ? `Ali želiš trajno izbrisati poročilo »${action.report.naslov}«?`
          : `Ali želiš poročilo »${action.report.naslov}« vrniti v osnutek?`}
      </p>
      {deleting && <p>Tega dejanja ni mogoče razveljaviti.</p>}
      {error && (
        <p className="message message-error" role="alert">
          {error}
        </p>
      )}
    </Dialog>
  )
}

export default AdminReportsPage
