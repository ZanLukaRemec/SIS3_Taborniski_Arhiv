import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import apiRequest from '../api'
import { formatAuthor } from '../utils/formatters'

function compareText(first, second) {
  return first.localeCompare(second, 'sl', { sensitivity: 'base' })
}

function categoryKey(report) {
  return `${report.arhivirno_leto}:${report.kategorija_id}`
}

function groupReports(reports) {
  const grouped = new Map()

  for (const report of reports) {
    const year = report.arhivirno_leto

    if (!grouped.has(year)) {
      grouped.set(year, new Map())
    }

    const categories = grouped.get(year)

    if (!categories.has(report.kategorija_id)) {
      categories.set(report.kategorija_id, {
        id: report.kategorija_id,
        name: report.kategorija_naziv,
        reports: [],
      })
    }

    categories.get(report.kategorija_id).reports.push(report)
  }

  return [...grouped.entries()]
    .sort(([firstYear], [secondYear]) => secondYear - firstYear)
    .map(([year, categories]) => ({
      year,
      categories: [...categories.values()]
        .sort((first, second) => compareText(first.name, second.name))
        .map((category) => ({
          ...category,
          reports: category.reports.sort((first, second) =>
            compareText(first.naslov, second.naslov),
          ),
        })),
    }))
}

function ArchivePage() {
  const [reports, setReports] = useState([])
  const [search, setSearch] = useState('')
  const [listView, setListView] = useState(false)
  const [openYears, setOpenYears] = useState(new Set())
  const [openCategories, setOpenCategories] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const hierarchy = useMemo(() => groupReports(reports), [reports])

  useEffect(() => {
    let active = true
    const normalizedSearch = search.trim()

    const timeout = window.setTimeout(async () => {
      setLoading(true)
      setError('')

      try {
        const params = new URLSearchParams({ status: 'arhivirano' })

        if (normalizedSearch) {
          params.set('search', normalizedSearch)
        }

        const data = await apiRequest(`/reports?${params}`)

        if (!active) {
          return
        }

        const archiveReports = Array.isArray(data.reports) ? data.reports : []
        setReports(archiveReports)

        if (normalizedSearch) {
          setOpenYears(
            new Set(archiveReports.map((report) => report.arhivirno_leto)),
          )
          setOpenCategories(
            new Set(archiveReports.map((report) => categoryKey(report))),
          )
        } else {
          setOpenYears(new Set())
          setOpenCategories(new Set())
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
  }, [search])

  function toggleYear(year) {
    setOpenYears((current) => {
      const next = new Set(current)

      if (next.has(year)) {
        next.delete(year)
      } else {
        next.add(year)
      }

      return next
    })
  }

  function toggleCategory(key) {
    setOpenCategories((current) => {
      const next = new Set(current)

      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }

      return next
    })
  }

  return (
    <section className="page-panel">
      <div className="page-heading">
        <div>
          <h1>Arhiv</h1>
          <p className="page-description">Oddana taborniška poročila</p>
        </div>
      </div>

      <div className="archive-controls">
        <label className="search-field" htmlFor="archive-search">
          Iskanje
          <input
            id="archive-search"
            type="search"
            placeholder="Naslov, vsebina, kategorija ali avtor"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>

        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={listView}
            onChange={(event) => setListView(event.target.checked)}
          />
          Prikaži kot seznam
        </label>
      </div>

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
            : 'V arhivu še ni poročil.'}
        </p>
      )}
      {!loading && !error && reports.length > 0 &&
        (listView ? (
          <ReportTable reports={reports} />
        ) : (
          <ReportHierarchy
            hierarchy={hierarchy}
            openYears={openYears}
            openCategories={openCategories}
            onToggleYear={toggleYear}
            onToggleCategory={toggleCategory}
          />
        ))}
    </section>
  )
}

function ReportHierarchy({
  hierarchy,
  openYears,
  openCategories,
  onToggleYear,
  onToggleCategory,
}) {
  return (
    <div className="report-hierarchy">
      {hierarchy.map(({ year, categories }) => {
        const yearOpen = openYears.has(year)

        return (
          <section className="year-group" key={year}>
            <button
              className="hierarchy-toggle year-toggle"
              type="button"
              aria-expanded={yearOpen}
              onClick={() => onToggleYear(year)}
            >
              {year}
            </button>

            {yearOpen && (
              <div className="category-groups">
                {categories.map((category) => {
                  const key = `${year}:${category.id}`
                  const categoryOpen = openCategories.has(key)

                  return (
                    <section className="category-group" key={key}>
                      <button
                        className="hierarchy-toggle category-toggle"
                        type="button"
                        aria-expanded={categoryOpen}
                        onClick={() => onToggleCategory(key)}
                      >
                        {category.name}
                      </button>

                      {categoryOpen && (
                        <ul className="hierarchy-reports">
                          {category.reports.map((report) => (
                            <li key={report.id}>
                              <Link to={`/reports/${report.id}`}>
                                {report.naslov}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </section>
                  )
                })}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}

function ReportTable({ reports }) {
  const sortedReports = [...reports].sort((first, second) => {
    if (first.arhivirno_leto !== second.arhivirno_leto) {
      return second.arhivirno_leto - first.arhivirno_leto
    }

    return compareText(first.naslov, second.naslov)
  })

  return (
    <div className="table-wrapper">
      <table className="report-table">
        <thead>
          <tr>
            <th>Naslov</th>
            <th>Leto</th>
            <th>Kategorija</th>
            <th>Avtor</th>
          </tr>
        </thead>
        <tbody>
          {sortedReports.map((report) => (
            <tr key={report.id}>
              <td data-label="Naslov">
                <Link to={`/reports/${report.id}`}>{report.naslov}</Link>
              </td>
              <td data-label="Leto">{report.arhivirno_leto}</td>
              <td data-label="Kategorija">{report.kategorija_naziv}</td>
              <td data-label="Avtor">{formatAuthor(report)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default ArchivePage
