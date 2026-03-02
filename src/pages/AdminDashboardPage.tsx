type AdminDashboardPageProps = {
  onSignOut: () => void
}

export default function AdminDashboardPage({ onSignOut }: AdminDashboardPageProps) {
  return (
    <div className="min-h-[calc(100vh-3rem)] grid place-items-center py-10">
      <div className="w-full max-w-2xl">
        <section className="card">
          <h2 className="cardTitle cardTitleHero">Admin Dashboard</h2>
          <p className="cardHint">Admin authentication is active. This is a placeholder dashboard page.</p>

          <div className="actions">
            <button className="btn btnGhost" type="button" onClick={onSignOut}>
              Sign out admin
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
