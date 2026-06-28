'use client'

import { useEffect, useState } from 'react'
import { collection, getDocs, getDoc, doc, query, where, limit, orderBy, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface FirebaseCategory {
  id: string
  name: string
  description?: string
  icon?: string
  color?: string
  jobCount?: number
}

export interface FirebaseJob {
  id: string
  title: string
  company: string
  companyId?: string
  location: string
  salary?: string
  currency?: string
  description?: string
  requirements?: string
  category?: string
  experience?: string
  jobType?: string
  skills?: string[]
  status?: string
  createdAt?: string
  deadline?: string
  companyWebsite?: string
  companyEmail?: string
  companySize?: string
  companyIndustry?: string
}

export interface FirebaseCompany {
  id: string
  name: string
  industry?: string
  location?: string
  website?: string
  email?: string
  size?: string
  description?: string
  status?: string
}

export interface FirebaseReview {
  id: string
  companyId: string
  name: string
  email?: string
  rating: number
  review: string
  createdAt?: Timestamp | string | null
}

// ─── Job Categories ──────────────────────────────────────────────────────────

export function useFirebaseCategories() {
  const [categories, setCategories] = useState<FirebaseCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCategories() {
      try {
        const snap = await getDocs(collection(db, 'jobCategories'))
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as FirebaseCategory))
        data.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
        setCategories(data)
      } catch (err) {
        console.error('Error fetching categories:', err)
        setError('Failed to load categories')
      } finally {
        setLoading(false)
      }
    }
    fetchCategories()
  }, [])

  return { categories, loading, error }
}

// ─── All Jobs (approved) ─────────────────────────────────────────────────────

export function useFirebaseJobs(limitCount = 12) {
  const [jobs, setJobs] = useState<FirebaseJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchJobs() {
      try {
        const q = query(
          collection(db, 'jobs'),
          where('status', '==', 'approved'),
          limit(limitCount)
        )
        const snap = await getDocs(q)
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as FirebaseJob))
        setJobs(data)
      } catch (err) {
        console.error('Error fetching jobs:', err)
        setError('Failed to load jobs')
      } finally {
        setLoading(false)
      }
    }
    fetchJobs()
  }, [limitCount])

  return { jobs, loading, error }
}

// ─── All Jobs (no limit) — for counting purposes ──────────────────────────────

export function useFirebaseAllJobs() {
  const [jobs, setJobs] = useState<FirebaseJob[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAll() {
      try {
        const q = query(
          collection(db, 'jobs'),
          where('status', '==', 'approved')
        )
        const snap = await getDocs(q)
        setJobs(snap.docs.map(d => ({ id: d.id, ...d.data() } as FirebaseJob)))
      } catch (err) {
        console.error('Error fetching all jobs:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  return { jobs, loading }
}

// ─── Single Job by ID ────────────────────────────────────────────────────────

export function useFirebaseJob(jobId: string) {
  const [job, setJob] = useState<FirebaseJob | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!jobId) return
    async function fetchJob() {
      try {
        const snap = await getDoc(doc(db, 'jobs', jobId))
        if (snap.exists()) {
          setJob({ id: snap.id, ...snap.data() } as FirebaseJob)
        } else {
          setError('Job not found')
        }
      } catch (err) {
        console.error('Error fetching job:', err)
        setError('Failed to load job')
      } finally {
        setLoading(false)
      }
    }
    fetchJob()
  }, [jobId])

  return { job, loading, error }
}

// ─── Companies (active) ──────────────────────────────────────────────────────

export function useFirebaseCompanies(limitCount = 12) {
  const [companies, setCompanies] = useState<FirebaseCompany[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCompanies() {
      try {
        const q = query(
          collection(db, 'companies'),
          where('status', '==', 'active'),
          limit(limitCount)
        )
        const snap = await getDocs(q)
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as FirebaseCompany))
        data.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
        setCompanies(data)
      } catch (err) {
        console.error('Error fetching companies:', err)
        setError('Failed to load companies')
      } finally {
        setLoading(false)
      }
    }
    fetchCompanies()
  }, [limitCount])

  return { companies, loading, error }
}

// ─── Single Company by ID ─────────────────────────────────────────────────────

export function useFirebaseCompany(companyId: string) {
  const [company, setCompany] = useState<FirebaseCompany | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!companyId) return
    async function fetchCompany() {
      try {
        const snap = await getDoc(doc(db, 'companies', companyId))
        if (snap.exists()) {
          setCompany({ id: snap.id, ...snap.data() } as FirebaseCompany)
        } else {
          setError('Company not found')
        }
      } catch (err) {
        console.error('Error fetching company:', err)
        setError('Failed to load company')
      } finally {
        setLoading(false)
      }
    }
    fetchCompany()
  }, [companyId])

  return { company, loading, error }
}

// ─── Reviews for a Company ────────────────────────────────────────────────────

export function useFirebaseReviews(companyId: string) {
  const [reviews, setReviews] = useState<FirebaseReview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = async () => {
    if (!companyId) return
    setLoading(true)
    try {
      const q = query(
        collection(db, 'reviews'),
        where('companyId', '==', companyId),
        orderBy('createdAt', 'desc')
      )
      const snap = await getDocs(q)
      setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() } as FirebaseReview)))
    } catch (err: any) {
      // If index not ready yet, fall back without orderBy
      try {
        const q2 = query(collection(db, 'reviews'), where('companyId', '==', companyId))
        const snap2 = await getDocs(q2)
        const data = snap2.docs.map(d => ({ id: d.id, ...d.data() } as FirebaseReview))
        data.sort((a, b) => {
          const at = (a.createdAt as Timestamp)?.toMillis?.() ?? 0
          const bt = (b.createdAt as Timestamp)?.toMillis?.() ?? 0
          return bt - at
        })
        setReviews(data)
      } catch (err2) {
        console.error('Error fetching reviews:', err2)
        setError('Failed to load reviews')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refetch() }, [companyId])

  return { reviews, loading, error, refetch }
}

// ─── Add a Review ─────────────────────────────────────────────────────────────

export async function addFirebaseReview(
  companyId: string,
  data: { name: string; email: string; rating: number; review: string }
) {
  await addDoc(collection(db, 'reviews'), {
    companyId,
    ...data,
    createdAt: serverTimestamp(),
  })
}
