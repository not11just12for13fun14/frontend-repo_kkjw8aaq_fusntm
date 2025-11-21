import { useEffect, useMemo, useState } from 'react'
import { listPersons, createPerson, personSummary } from '../lib/api'
import { Link } from 'react-router-dom'

function PersonCard({ p, onClick }){
  const [summary, setSummary] = useState(null)
  useEffect(() => {
    personSummary(p.id, { period: '7' }).then(setSummary).catch(()=>{})
  }, [p.id])
  return (
    <Link to={`/person/${p.id}`} className="block p-4 rounded-lg border border-slate-200 hover:border-slate-300 bg-white shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium text-slate-900">{p.name}{p.nickname?` (${p.nickname})`:''}</div>
          <div className="text-xs text-slate-500">Created {new Date(p.created_at).toLocaleDateString()}</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-semibold">{summary?.latest? `${Number(summary.latest.weight_kg).toFixed(1)} kg`:'—'}</div>
          <div className={`text-xs ${summary?.change7>0? 'text-red-600': 'text-emerald-600'}`}>{summary?.change7!=null? `${summary.change7>0?'+':''}${summary.change7.toFixed(1)} kg / 7d`:''}</div>
        </div>
      </div>
      {summary?.goal && (
        <div className="mt-3 text-xs text-slate-600">
          Active goal • {new Date(summary.goal.start_date).toLocaleDateString()} → {new Date(summary.goal.end_date).toLocaleDateString()} • Target {summary.goal.target_weight_kg} kg
        </div>
      )}
    </Link>
  )
}

export default function Dashboard(){
  const [persons, setPersons] = useState([])
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ name:'', nickname:'', starting_weight_kg:'', height_cm:'', date_of_birth:'' })

  useEffect(() => { listPersons().then(setPersons) }, [])

  const submit = async (e) => {
    e.preventDefault()
    const payload = { ...form }
    if(payload.starting_weight_kg==='') delete payload.starting_weight_kg
    if(payload.height_cm==='') delete payload.height_cm
    if(payload.date_of_birth==='') delete payload.date_of_birth
    const p = await createPerson(payload)
    setPersons(prev => [...prev, p])
    setShowNew(false)
    setForm({ name:'', nickname:'', starting_weight_kg:'', height_cm:'', date_of_birth:'' })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Your people</h1>
        <button onClick={() => setShowNew(s=>!s)} className="px-3 py-2 text-sm rounded bg-slate-900 text-white">Add person</button>
      </div>

      {showNew && (
        <form onSubmit={submit} className="mb-6 p-4 border border-slate-200 rounded-lg bg-white grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-600 mb-1">Name</label>
            <input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Nickname (optional)</label>
            <input value={form.nickname} onChange={e=>setForm({...form,nickname:e.target.value})} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Starting weight (kg)</label>
            <input type="number" step="0.1" min="20" max="300" value={form.starting_weight_kg} onChange={e=>setForm({...form,starting_weight_kg:e.target.value})} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Height (cm)</label>
            <input type="number" step="0.1" min="50" max="250" value={form.height_cm} onChange={e=>setForm({...form,height_cm:e.target.value})} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Date of birth</label>
            <input type="date" value={form.date_of_birth} onChange={e=>setForm({...form,date_of_birth:e.target.value})} className="w-full border rounded px-3 py-2" />
          </div>
          <div className="self-end flex gap-2">
            <button type="button" onClick={()=>setShowNew(false)} className="px-3 py-2 text-sm rounded border">Cancel</button>
            <button className="px-3 py-2 text-sm rounded bg-slate-900 text-white">Create</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {persons.map(p => <PersonCard key={p.id} p={p} />)}
        {persons.length===0 && (
          <div className="p-6 border border-dashed rounded-lg text-slate-600 text-sm">No persons yet. Create one to start tracking.</div>
        )}
      </div>
    </div>
  )
}
