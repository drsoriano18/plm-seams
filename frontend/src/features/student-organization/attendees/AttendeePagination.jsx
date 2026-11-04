import AttendeeIcon from './AttendeeIcon'
import { PAGE_SIZES, pageItems, rangeBounds } from './attendeeModel.js'

export default function AttendeePagination({ page, pages, total, size, confirmed, waitlisted, readOnly = false, onPage, onSize }) {
  const { start, end } = rangeBounds(page, total, size)
  return <div className="organization-attendees-footer">
    <p className="organization-attendees-showing">
      {total === 0 ? 'Showing 0 of 0 total records' : <>Showing <b>{start}{'\u2013'}{end}</b> of <b>{total}</b> total records</>}
      <i aria-hidden="true" />
      <span>{readOnly ? `${confirmed} registered, ${waitlisted} waitlisted` : `${confirmed} Confirmed / Reg, ${waitlisted} Waitlisted Pool`}</span>
    </p>
    <div className="organization-attendees-pager">
      <label htmlFor="organization-attendees-rows">Rows:</label>
      <div className="organization-attendees-rows-select">
        <select id="organization-attendees-rows" value={size} onChange={(event) => onSize(Number(event.target.value))}>
          {PAGE_SIZES.map((n) => <option key={n} value={n}>{n} per page</option>)}
        </select>
        <AttendeeIcon name="chevron-down" size={12} />
      </div>
      <nav aria-label="Attendee pages">
        <button type="button" aria-label="Previous page" disabled={page <= 1} onClick={() => onPage(page - 1)}><AttendeeIcon name="chevron-left" size={14} /></button>
        {pageItems(page, pages).map((item, index) => item === 'gap'
          ? <span key={`gap-${index}`} className="organization-attendees-gap" aria-hidden="true">{'\u2026'}</span>
          : <button key={item} type="button" aria-label={`Page ${item}`} aria-current={item === page ? 'page' : undefined} className={item === page ? 'is-current' : ''} onClick={() => onPage(item)}>{item}</button>)}
        <button type="button" aria-label="Next page" disabled={page >= pages} onClick={() => onPage(page + 1)}><AttendeeIcon name="chevron-right" size={14} /></button>
      </nav>
    </div>
  </div>
}
