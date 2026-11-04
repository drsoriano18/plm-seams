import EventsIcon from './EventsIcon'
import { pageItems, rangeLabel } from './eventState.js'

export default function EventPagination({ page, pages, total, onPage }) {
  return <div className="organization-events-pagination">
    <p className="organization-events-range" aria-live="polite">{rangeLabel(page, total)}</p>
    <nav aria-label="Approved events pages">
      <button type="button" onClick={() => onPage(page - 1)} disabled={page <= 1} aria-label="Previous page"><EventsIcon name="chevron-left" /></button>
      {pageItems(page, pages).map((item, index) => item === 'gap'
        ? <span key={`gap-${index}`} className="organization-events-gap" aria-hidden="true">&hellip;</span>
        : <button key={item} type="button" onClick={() => onPage(item)} aria-label={`Page ${item}`} aria-current={item === page ? 'page' : undefined} className={item === page ? 'is-current' : undefined}>{item}</button>)}
      <button type="button" onClick={() => onPage(page + 1)} disabled={page >= pages} aria-label="Next page"><EventsIcon name="chevron-right" /></button>
    </nav>
  </div>
}
