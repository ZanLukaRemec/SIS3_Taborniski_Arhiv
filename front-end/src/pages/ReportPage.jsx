import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import apiRequest from '../api'
import ReportContent from '../components/ReportContent'

function ReportPage() {
  const { id } = useParams()
  const location = useLocation()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const backTo = location.state?.from || '/archive'
  const backLabel =
    backTo === '/my-reports' ? 'Nazaj na moja poročila' : 'Nazaj v arhiv'

  useEffect(() => {
    let active = true

    async function loadReport() {
      setLoading(true)
      setError('')

      try {
        const data = await apiRequest(`/reports/${id}`)

        if (active) {
          setReport(data.report)
        }
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

    loadReport()
    return () => {
      active = false
    }
  }, [id])

  if (loading) {
    return <p className="loading-message">Nalagam poročilo …</p>
  }

  if (error) {
    return (
      <section className="page-panel">
        <p className="message message-error" role="alert">
          {error}
        </p>
        <Link to={backTo}>{backLabel}</Link>
      </section>
    )
  }

  return (
    <section className="page-panel">
      <Link className="back-link" to={backTo}>
        {backLabel}
      </Link>
      <ReportContent report={report} />
    </section>
  )
}

export default ReportPage
