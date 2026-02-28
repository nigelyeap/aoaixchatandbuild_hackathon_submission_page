import type { Hackathon, Submission } from '../App'
import { supabase } from './supabaseClient'

type DbHackathonRow = {
  id: string
  name: string
  accepting_submissions: boolean
  starts_at: string
  ends_at: string
  created_at: string
}

type DbSubmissionRow = {
  id: string
  created_at: string
  participant_name: string
  app_name: string
  app_description: string
  problem_description: string
  app_link: string
  hackathon_id: string
  votes: number
}

function fromDbHackathon(row: DbHackathonRow): Hackathon {
  return {
    id: row.id,
    name: row.name,
    acceptingSubmissions: row.accepting_submissions,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    createdAt: row.created_at,
  }
}

function toDbHackathon(h: Hackathon): DbHackathonRow {
  return {
    id: h.id,
    name: h.name,
    accepting_submissions: h.acceptingSubmissions,
    starts_at: h.startsAt,
    ends_at: h.endsAt,
    created_at: h.createdAt,
  }
}

function fromDbSubmission(row: DbSubmissionRow): Submission {
  return {
    id: row.id,
    createdAt: row.created_at,
    participantName: row.participant_name,
    appName: row.app_name,
    appDescription: row.app_description,
    problemDescription: row.problem_description,
    appLink: row.app_link,
    hackathonId: row.hackathon_id,
    votes: row.votes,
  }
}

function toDbSubmission(s: Submission): DbSubmissionRow {
  return {
    id: s.id,
    created_at: s.createdAt,
    participant_name: s.participantName,
    app_name: s.appName,
    app_description: s.appDescription,
    problem_description: s.problemDescription,
    app_link: s.appLink,
    hackathon_id: s.hackathonId,
    votes: s.votes,
  }
}

function requireClient() {
  if (!supabase) throw new Error('Supabase is not configured.')
  return supabase
}

export async function listHackathons(): Promise<Hackathon[]> {
  const client = requireClient()
  const { data, error } = await client.from('hackathons').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return (data as DbHackathonRow[]).map(fromDbHackathon)
}

export async function upsertHackathons(rows: Hackathon[]): Promise<void> {
  if (rows.length === 0) return
  const client = requireClient()
  const payload = rows.map(toDbHackathon)
  const { error } = await client.from('hackathons').upsert(payload, { onConflict: 'id' })
  if (error) throw error
}

export async function deleteHackathons(ids: string[]): Promise<void> {
  if (ids.length === 0) return
  const client = requireClient()
  const { error } = await client.from('hackathons').delete().in('id', ids)
  if (error) throw error
}

export async function listSubmissions(): Promise<Submission[]> {
  const client = requireClient()
  const { data, error } = await client.from('submissions').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return (data as DbSubmissionRow[]).map(fromDbSubmission)
}

export async function upsertSubmissions(rows: Submission[]): Promise<void> {
  if (rows.length === 0) return
  const client = requireClient()
  const payload = rows.map(toDbSubmission)
  const { error } = await client.from('submissions').upsert(payload, { onConflict: 'id' })
  if (error) throw error
}

export async function deleteSubmissions(ids: string[]): Promise<void> {
  if (ids.length === 0) return
  const client = requireClient()
  const { error } = await client.from('submissions').delete().in('id', ids)
  if (error) throw error
}

