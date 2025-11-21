const BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
let TOKEN = null

export function setAuthToken(token){
  TOKEN = token
  localStorage.setItem('token', token)
}
export function clearAuthToken(){
  TOKEN = null
  localStorage.removeItem('token')
}
export function isAuthed(){
  return !!localStorage.getItem('token')
}

async function req(path, opts={}){
  const headers = { 'Content-Type': 'application/json', ...(opts.headers||{}) }
  const token = localStorage.getItem('token')
  if(token){ headers['Authorization'] = `Bearer ${token}` }
  const res = await fetch(`${BASE}${path}`, { ...opts, headers })
  if(!res.ok){
    const text = await res.text()
    throw new Error(text || 'Request failed')
  }
  const ct = res.headers.get('content-type')||''
  if(ct.includes('application/json')) return res.json()
  return res.text()
}

// Auth
export async function signup(email, password){
  const user = await req('/auth/signup', { method:'POST', body: JSON.stringify({ email, password }) })
  // immediately log in
  const form = new URLSearchParams()
  form.set('username', email)
  form.set('password', password)
  const res = await fetch(`${BASE}/auth/login`, { method:'POST', body: form })
  const data = await res.json()
  if(!res.ok) throw new Error(data.detail||'Login failed')
  setAuthToken(data.access_token)
  return getMe()
}
export async function login(email, password){
  const form = new URLSearchParams()
  form.set('username', email)
  form.set('password', password)
  const res = await fetch(`${BASE}/auth/login`, { method:'POST', body: form })
  const data = await res.json()
  if(!res.ok) throw new Error(data.detail||'Login failed')
  setAuthToken(data.access_token)
  return getMe()
}
export async function getMe(){
  return req('/me')
}

// Persons
export const listPersons = () => req('/persons')
export const createPerson = (payload) => req('/persons', { method:'POST', body: JSON.stringify(payload) })
export const updatePerson = (id, payload) => req(`/persons/${id}`, { method:'PUT', body: JSON.stringify(payload) })
export const deletePerson = (id) => req(`/persons/${id}`, { method:'DELETE' })

// Weights
export const listWeights = (personId, params={}) => {
  const qs = new URLSearchParams(params).toString()
  const suffix = qs?`?${qs}`:''
  return req(`/persons/${personId}/weights${suffix}`)
}
export const addWeight = (personId, payload) => req(`/persons/${personId}/weights`, { method:'POST', body: JSON.stringify(payload) })
export const updateWeight = (id, payload) => req(`/weights/${id}`, { method:'PUT', body: JSON.stringify(payload) })
export const deleteWeight = (id) => req(`/weights/${id}`, { method:'DELETE' })

// Goals
export const listGoals = (personId) => req(`/persons/${personId}/goals`)
export const createGoal = (personId, payload) => req(`/persons/${personId}/goals`, { method:'POST', body: JSON.stringify(payload) })
export const updateGoal = (id, payload) => req(`/goals/${id}`, { method:'PUT', body: JSON.stringify(payload) })
export const deleteGoal = (id) => req(`/goals/${id}`, { method:'DELETE' })

// Milestones
export const addMilestone = (goalId, payload) => req(`/goals/${goalId}/milestones`, { method:'POST', body: JSON.stringify(payload) })
export const updateMilestone = (id, payload) => req(`/milestones/${id}`, { method:'PUT', body: JSON.stringify(payload) })
export const deleteMilestone = (id) => req(`/milestones/${id}`, { method:'DELETE' })

// Summary
export const personSummary = (personId, params={}) => {
  const qs = new URLSearchParams(params).toString()
  const suffix = qs?`?${qs}`:''
  return req(`/persons/${personId}/summary${suffix}`)
}
