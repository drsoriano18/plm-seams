import { useEffect } from 'react'
import { useLocation } from 'react-router'
import { getDocumentTitle } from './documentTitles'

export default function DocumentTitle() {
  const { pathname } = useLocation()
  useEffect(() => {
    document.title = getDocumentTitle(pathname)
  }, [pathname])
  return null
}
