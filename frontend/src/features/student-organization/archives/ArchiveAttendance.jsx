import { useParams } from 'react-router'
import ArchiveChildPage from './ArchiveChildPage'

export default function ArchiveAttendance() {
  const { eventId } = useParams()
  return <ArchiveChildPage eventId={eventId} title="Attendance" description="The attendance log for this archived event will appear here in a later release." />
}
