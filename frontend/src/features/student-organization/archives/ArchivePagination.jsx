import ArchiveIcon from './ArchiveIcon'
import { PAGE_SIZE, pageCount, pageItems, rangeLabel } from './archiveFilters.js'

export default function ArchivePagination({ page, total, onPage }) {
  const pages = pageCount(total)
  return <div className="organization-archive-pagination">
    <p className="organization-archive-range" aria-live="polite">{rangeLabel(page, total)}</p>
    <div className="organization-archive-pager">
      <span className="organization-archive-per-page">{PAGE_SIZE} per page</span>
      <nav aria-label="Archived events pages">
        <button type="button" onClick={() => onPage(page - 1)} disabled={page <= 1} aria-label="Previous page"><ArchiveIcon name="chevron-left" /></button>
        {pageItems(page, pages).map((item, index) => item === 'gap'
          ? <span key={`gap-${index}`} className="organization-archive-gap" aria-hidden="true">…</span>
          : <button key={item} type="button" onClick={() => onPage(item)} aria-label={`Page ${item}`} aria-current={item === page ? 'page' : undefined} className={item === page ? 'is-current' : undefined}>{item}</button>)}
        <button type="button" onClick={() => onPage(page + 1)} disabled={page >= pages} aria-label="Next page"><ArchiveIcon name="chevron-right" /></button>
      </nav>
    </div>
  </div>
}
