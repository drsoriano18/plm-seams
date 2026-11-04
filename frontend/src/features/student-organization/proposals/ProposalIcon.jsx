const PATHS = {
  'arrow-left': <><path d="M19 12H5" /><path d="m11 6-6 6 6 6" /></>,
  'chevron-down': <path d="m6 9 6 6 6-6" />,
  'chevron-left': <path d="m15 6-6 6 6 6" />,
  'chevron-right': <path d="m9 6 6 6-6 6" />,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></>,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  'alert-circle': <><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
  check: <path d="m5 12 5 5 9-10" />,
  trash: <><path d="M4 7h16M10 11v6M14 11v6" /><path d="m6 7 1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13M9 7V4h6v3" /></>,
  send: <><path d="M21 3 10 14" /><path d="m21 3-7 18-4-7-7-4Z" /></>,
}

export default function ProposalIcon({ name, size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{PATHS[name]}</svg>
}
