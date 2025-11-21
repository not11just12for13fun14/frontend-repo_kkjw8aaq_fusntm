import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { listWeights, addWeight, deleteWeight, updateWeight, listGoals, createGoal, updateGoal, deleteGoal, addMilestone, updateMilestone, deleteMilestone, personSummary } from '../lib/api'

function WeightForm({ personId, onAdded, lastWeight }){
  const [date, setDate] = useState(() => new Date().toISOString().slice(0,10))
  const [time, setTime] = useState(() => new Date().toISOString().slice(11,16))
  const [weight, setWeight] = useState(lastWeight ? Number(lastWeight).toFixed(1) : '')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(()=>{ if(lastWeight){ setWeight(Number(lastWeight).toFixed(1)) } }, [lastWeight])

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try{
      const dt = new Date(`${date}T${time}:00`)
      const payload = { datetime: dt.toISOString(), weight_kg: Number(weight), note: note || undefined }
      const res = await addWeight(personId, payload)
      onAdded(res)
      setNote('')
    } finally { setLoading(false) }
  }

  return (
    <form onSubmit={submit} className="p-4 border border-slate-200 rounded-lg bg-white grid grid-cols-2 md:grid-cols-5 gap-3">
      <div>
        <label className="block text-xs text-slate-600 mb-1">Date</label>
        <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full border rounded px-3 py-2" />
      </div>
      <div>
        <label className="block text-xs text-slate-600 mb-1">Time</label>
        <input type="time" value={time} onChange={e=>setTime(e.target.value)} className="w-full border rounded px-3 py-2" />
      </div>
      <div>
        <label className="block text-xs text-slate-600 mb-1">Weight (kg)</label>
        <input type="number" step="0.1" min="20" max="300" value={weight} onChange={e=>setWeight(e.target.value)} className="w-full border rounded px-3 py-2" />
      </div>
      <div className="md:col-span-2">
        <label className="block text-xs text-slate-600 mb-1">Note</label>
        <input value={note} onChange={e=>setNote(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="Optional" />
      </div>
      <div className="col-span-2 md:col-span-5 flex justify-end">
        <button disabled={loading} className="px-3 py-2 rounded bg-slate-900 text-white text-sm">{loading? 'Adding…':'Add entry'}</button>
      </div>
    </form>
  )
}

function EntriesTable({ entries, onDelete }){
  return (
    <div className="overflow-auto border border-slate-200 rounded-lg bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            <th className="p-2 text-left">Date/Time</th>
            <th className="p-2 text-right">Weight (kg)</th>
            <th className="p-2 text-left">Note</th>
            <th className="p-2"></th>
          </tr>
        </thead>
        <tbody>
          {entries.map(e => (
            <tr key={e.id} className="border-t">
              <td className="p-2">{new Date(e.datetime).toLocaleString()}</td>
              <td className="p-2 text-right">{Number(e.weight_kg).toFixed(1)}</td>
              <td className="p-2">{e.note||''}</td>
              <td className="p-2 text-right">
                <button onClick={()=>onDelete(e.id)} className="px-2 py-1 text-xs rounded border hover:bg-slate-50">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function LineChart({ data, trend, goal, milestones }){
  // basic SVG line chart
  if(!data || data.length===0) return <div className="text-sm text-slate-500">No entries yet.</div>
  const padding = 24
  const w = 800, h = 240
  const xs = data.map(d => new Date(d.datetime).getTime())
  const ys = data.map(d => Number(d.weight_kg))
  const minX = Math.min(...xs), maxX = Math.max(...xs)
  const minY = Math.min(...ys), maxY = Math.max(...ys)
  const xScale = (x)=> padding + ( (x-minX) / (maxX-minX || 1) ) * (w-2*padding)
  const yScale = (y)=> h-padding - ( (y-minY) / (maxY-minY || 1) ) * (h-2*padding)
  const path = xs.map((x,i)=> `${i===0?'M':'L'} ${xScale(x)} ${yScale(ys[i])}`).join(' ')

  const trendPath = trend? `M ${xScale(new Date(trend.start.x).getTime())} ${yScale(trend.start.y)} L ${xScale(new Date(trend.end.x).getTime())} ${yScale(trend.end.y)}` : null

  // goal overlay line
  let goalLines = []
  if(goal){
    const gx1 = xScale(new Date(goal.start_date).getTime())
    const gx2 = xScale(new Date(goal.end_date).getTime())
    const gy1 = yScale(goal.start_weight_kg ?? ys[0])
    const gy2 = yScale(goal.target_weight_kg)
    goalLines.push(<line key="gline" x1={gx1} y1={gy1} x2={gx2} y2={gy2} stroke="#0ea5e9" strokeDasharray="4 4" strokeWidth="2" />)
    goalLines.push(<circle key="gstart" cx={gx1} cy={gy1} r="4" fill="#0284c7" />)
    goalLines.push(<circle key="gend" cx={gx2} cy={gy2} r="4" fill="#0284c7" />)
  }

  const milestoneNodes = (milestones||[]).map(m => {
    const mx = xScale(new Date(m.target_date).getTime())
    const my = yScale(m.target_weight_kg)
    return <g key={m.id}>
      <circle cx={mx} cy={my} r="4" fill="#22c55e" />
      <text x={mx+6} y={my-6} fontSize="10" fill="#065f46">{m.title}</text>
    </g>
  })

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto bg-white border border-slate-200 rounded">
      {/* axes */}
      <line x1={padding} y1={h-padding} x2={w-padding} y2={h-padding} stroke="#e2e8f0" />
      <line x1={padding} y1={padding} x2={padding} y2={h-padding} stroke="#e2e8f0" />

      {/* weight line */}
      <path d={path} fill="none" stroke="#0f172a" strokeWidth="2" />
      {/* points */}
      {xs.map((x,i)=> <circle key={i} cx={xScale(x)} cy={yScale(ys[i])} r="3" fill="#1f2937" />)}

      {/* trend */}
      {trendPath && <path d={trendPath} fill="none" stroke="#64748b" strokeDasharray="3 3" />}

      {/* goal overlay */}
      {goalLines}

      {/* milestones */}
      {milestoneNodes}
    </svg>
  )
}

export default function PersonDetail(){
  const { id } = useParams()
  const [entries, setEntries] = useState([])
  const [summary, setSummary] = useState(null)
  const [period, setPeriod] = useState('30')

  const refresh = async () => {
    const s = await personSummary(id, period?{ period }: {})
    setSummary(s)
    setEntries(s.entries)
  }

  useEffect(()=>{ refresh() }, [id, period])

  const lastWeight = summary?.latest?.weight_kg

  const onAdded = (e) => { refresh() }
  const onDelete = async (entryId) => { await deleteWeight(entryId); refresh() }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{summary?.person?.name||'Person'}</h1>
        <div className="flex items-center gap-2 text-sm">
          <button onClick={()=>setPeriod('7')} className={`px-3 py-1.5 rounded border ${period==='7'?'bg-slate-900 text-white':'bg-white'}`}>7d</button>
          <button onClick={()=>setPeriod('30')} className={`px-3 py-1.5 rounded border ${period==='30'?'bg-slate-900 text-white':'bg-white'}`}>30d</button>
          <button onClick={()=>setPeriod('90')} className={`px-3 py-1.5 rounded border ${period==='90'?'bg-slate-900 text-white':'bg-white'}`}>90d</button>
        </div>
      </div>

      <div>
        <LineChart data={entries} trend={summary?.trend} goal={summary?.goal} milestones={summary?.milestones} />
      </div>

      <WeightForm personId={id} onAdded={onAdded} lastWeight={lastWeight} />

      <div>
        <h2 className="text-lg font-semibold mb-2">Recent entries</h2>
        <EntriesTable entries={[...entries].reverse().slice(0,20)} onDelete={onDelete} />
      </div>

      <GoalsManager personId={id} />
    </div>
  )
}

function GoalsManager({ personId }){
  const [goals, setGoals] = useState([])
  const [form, setForm] = useState({ start_date:'', end_date:'', target_weight_kg:'', lock_start_to_first_log:true })

  const load = async () => { setGoals(await listGoals(personId)) }
  useEffect(()=>{ load() }, [personId])

  const submit = async (e) => {
    e.preventDefault()
    const payload = { ...form, target_weight_kg: Number(form.target_weight_kg) }
    const g = await createGoal(personId, payload)
    setGoals(prev=>[g, ...prev])
    setForm({ start_date:'', end_date:'', target_weight_kg:'', lock_start_to_first_log:true })
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Goals</h2>
      <form onSubmit={submit} className="p-4 border border-slate-200 rounded-lg bg-white grid grid-cols-1 md:grid-cols-5 gap-3">
        <div>
          <label className="block text-xs text-slate-600 mb-1">Start date</label>
          <input type="date" value={form.start_date} onChange={e=>setForm({...form,start_date:e.target.value})} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-xs text-slate-600 mb-1">End date</label>
          <input type="date" value={form.end_date} onChange={e=>setForm({...form,end_date:e.target.value})} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-xs text-slate-600 mb-1">Target weight (kg)</label>
          <input type="number" step="0.1" min="20" max="300" value={form.target_weight_kg} onChange={e=>setForm({...form,target_weight_kg:e.target.value})} className="w-full border rounded px-3 py-2" />
        </div>
        <div className="flex items-center gap-2">
          <input id="lock" type="checkbox" checked={form.lock_start_to_first_log} onChange={e=>setForm({...form,lock_start_to_first_log:e.target.checked})} />
          <label htmlFor="lock" className="text-sm">Lock start weight to first log on/after start</label>
        </div>
        <div className="self-end flex justify-end">
          <button className="px-3 py-2 rounded bg-slate-900 text-white text-sm">Create goal</button>
        </div>
      </form>

      <div className="space-y-3">
        {goals.map(g => <GoalItem key={g.id} goal={g} onChange={load} />)}
        {goals.length===0 && <div className="text-sm text-slate-500">No goals yet.</div>}
      </div>
    </div>
  )
}

function GoalItem({ goal, onChange }){
  const [msForm, setMsForm] = useState({ title:'', target_date:'', target_weight_kg:'', note:'' })
  const add = async (e) => {
    e.preventDefault()
    await addMilestone(goal.id, { ...msForm, target_weight_kg: Number(msForm.target_weight_kg) })
    setMsForm({ title:'', target_date:'', target_weight_kg:'', note:'' })
    onChange()
  }

  return (
    <div className="p-4 border border-slate-200 rounded-lg bg-white">
      <div className="flex items-center justify-between">
        <div className="font-medium">{new Date(goal.start_date).toLocaleDateString()} → {new Date(goal.end_date).toLocaleDateString()} • Target {goal.target_weight_kg} kg</div>
        <button onClick={async()=>{ await deleteGoal(goal.id); onChange() }} className="px-2 py-1 text-xs rounded border">Delete</button>
      </div>
      <div className="mt-2 text-sm text-slate-600">Start weight: {goal.start_weight_kg??'—'}</div>

      <div className="mt-3">
        <h4 className="text-sm font-semibold mb-2">Milestones</h4>
        <div className="space-y-2">
          {goal.milestones?.map(m => (
            <div key={m.id} className="flex items-center justify-between text-sm border rounded p-2">
              <div>{m.title} • {new Date(m.target_date).toLocaleDateString()} • {m.target_weight_kg} kg</div>
              <button onClick={async()=>{ await deleteMilestone(m.id); onChange() }} className="px-2 py-1 text-xs rounded border">Delete</button>
            </div>
          ))}
          {(!goal.milestones || goal.milestones.length===0) && (
            <div className="text-xs text-slate-500">No milestones yet.</div>
          )}
        </div>

        <form onSubmit={add} className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-2">
          <input placeholder="Title" value={msForm.title} onChange={e=>setMsForm({...msForm,title:e.target.value})} className="border rounded px-3 py-2" />
          <input type="date" value={msForm.target_date} onChange={e=>setMsForm({...msForm,target_date:e.target.value})} className="border rounded px-3 py-2" />
          <input type="number" step="0.1" min="20" max="300" placeholder="Target kg" value={msForm.target_weight_kg} onChange={e=>setMsForm({...msForm,target_weight_kg:e.target.value})} className="border rounded px-3 py-2" />
          <button className="px-3 py-2 rounded bg-slate-900 text-white text-sm">Add milestone</button>
        </form>
      </div>
    </div>
  )
}
