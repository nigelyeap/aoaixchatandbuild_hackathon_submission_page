import { useMemo, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { Hackathon, Submission } from '../App'

type AdminDashboardPageProps = {
  onSignOut: () => void
  submissions: Submission[]
  setSubmissions: Dispatch<SetStateAction<Submission[]>>
  hackathons: Hackathon[]
}

export default function AdminDashboardPage({
  onSignOut,
  submissions,
  setSubmissions,
  hackathons,
}: AdminDashboardPageProps) {
  const [pendingDeletion, setPendingDeletion] = useState<Submission | null>(null)

  const groupedSubmissions = useMemo(() => {
    const byHackathon = new Map<string, Submission[]>()
    for (const hackathon of hackathons) byHackathon.set(hackathon.id, [])
    for (const submission of submissions) {
      const list = byHackathon.get(submission.hackathonId)
      if (!list) continue
      list.push(submission)
    }
    for (const list of byHackathon.values()) {
      list.sort((a, b) => b.votes - a.votes)
    }
    return byHackathon
  }, [hackathons, submissions])

  function deleteSubmission(submissionId: string) {
    setSubmissions((prev) => prev.filter((submission) => submission.id !== submissionId))
  }

  return (
    <div className="min-h-[calc(100vh-3rem)] py-10">
      <div className="mx-auto w-full max-w-6xl px-6 grid gap-6">
        <section className="card">
          <h2 className="cardTitle cardTitleHero">Admin Dashboard</h2>
          <p className="cardHint">Delete submissions from any hackathon.</p>

          <div className="actions">
            <button className="btn btnGhost" type="button" onClick={onSignOut}>
              Sign out admin
            </button>
          </div>
        </section>

        {hackathons.map((hackathon) => {
          const rows = groupedSubmissions.get(hackathon.id) ?? []
          return (
            <section className="card" key={hackathon.id}>
              <h3 className="cardTitle">{hackathon.name}</h3>
              {rows.length === 0 ? (
                <div className="empty">No submissions in this hackathon.</div>
              ) : (
                <div className="tableWrap">
                  <table className="adminTable">
                    <thead>
                      <tr>
                        <th>App Name</th>
                        <th>Participant</th>
                        <th>URL</th>
                        <th>Votes</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((submission) => (
                        <tr key={submission.id}>
                          <td>{submission.appName}</td>
                          <td>{submission.participantName}</td>
                          <td>
                            <a className="link" href={submission.appLink} target="_blank" rel="noopener noreferrer">
                              Open app
                            </a>
                          </td>
                          <td>{submission.votes}</td>
                          <td>
                            <button className="btn btnGhost" type="button" onClick={() => setPendingDeletion(submission)}>
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )
        })}
      </div>

      {pendingDeletion && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl border border-white/20 bg-slate-900/95 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.6)]">
            <h3 className="cardTitle cardTitleHero">Confirm deletion</h3>
            <p className="cardHint mt-3">
              Delete <span className="font-black text-slate-100">{pendingDeletion.appName}</span> by{' '}
              <span className="font-black text-slate-100">{pendingDeletion.participantName}</span>? This cannot be undone.
            </p>
            <div className="actions mt-6">
              <button
                className="btn"
                type="button"
                onClick={() => {
                  deleteSubmission(pendingDeletion.id)
                  setPendingDeletion(null)
                }}
              >
                Yes, delete
              </button>
              <button className="btn btnGhost" type="button" onClick={() => setPendingDeletion(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
