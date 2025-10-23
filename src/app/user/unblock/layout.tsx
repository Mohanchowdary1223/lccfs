export const dynamic = 'force-dynamic'

export default function UnblockLayout({ children }: { children: React.ReactNode }) {
  // This layout intentionally omits navbars so blocked users cannot access other navigation
  return (
    <div>
      {children}
    </div>
  )
}
