import { useEffect, useRef } from "react"
import { useBodyScrollLock } from '@/hooks/use-body-scroll-lock'

/** Maps controlled open state to native modal APIs; callers handle close events. */
export function useNativeDialog(open: boolean) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  useBodyScrollLock(open)

  useEffect(() => {
    const dialog = dialogRef.current

    if (!dialog) return

    if (open && !dialog.open) {
      dialog.showModal()
      return
    }

    if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  return dialogRef
}
