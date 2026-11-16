import { useEffect, useRef } from 'react'
import './Auth.css'

function ForgotPasswordDialog({ onClose }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  // close() restores focus to the element that opened the dialog; the native "close" event then runs onClose.
  function requestClose() { dialogRef.current?.close() }

  function handleClick(event) {
    const rect = event.currentTarget.getBoundingClientRect()
    const outside = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom
    if (event.target === event.currentTarget && outside) requestClose()
  }

  return (
    <dialog ref={dialogRef} className="auth-card auth-forgot-dialog" aria-labelledby="forgot-password-heading" onClick={handleClick} onClose={onClose}>
      <div className="auth-heading">
        <h1 id="forgot-password-heading">Forgot Password</h1>
        <p>Please head to the PLM ICTO and kindly request an administrative staff to reset your password.</p>
      </div>
      <button className="auth-submit" type="button" onClick={requestClose}>Understood</button>
    </dialog>
  )
}

export default ForgotPasswordDialog
