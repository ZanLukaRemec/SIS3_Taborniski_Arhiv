import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import apiRequest from '../api'
import ReportContent from '../components/ReportContent'

function ReportPage() {
  const { id } = useParams()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
        <Link to="/archive">Nazaj v arhiv</Link>
      </section>
    )
  }

  return (
    <section className="page-panel">
      <Link className="back-link" to="/archive">
        Nazaj v arhiv
      </Link>
      <ReportContent report={report} />
    </section>
  )
}

export default ReportPage
