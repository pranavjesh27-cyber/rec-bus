import type { BusStatus } from '../types'
import { STATUS_UI } from '../utils/status'

export default function StatusBadge({ status }: { status: BusStatus }) {
  const ui = STATUS_UI[status]
  return <span className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${ui.cls}`}>{ui.label}</span>
}
