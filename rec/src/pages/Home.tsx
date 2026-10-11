import { Link } from 'react-router-dom'

const steps = ['Open the website', 'Select your bus', 'See the live location', 'Reach your stop on time']

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-10">
      <h1 className="text-4xl font-extrabold tracking-tight text-violet-900">College Bus Live Tracker</h1>
      <p className="mt-3 text-lg text-slate-600">Know where your college bus is in real time.</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link to="/buses" className="btn btn-primary">Track a Bus 📍</Link>
        <Link to="/share" className="btn btn-ghost">Share Bus Location 📡</Link>
      </div>
      <ol className="card mt-10 space-y-3">
        {steps.map((s, i) => (
          <li key={s} className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 font-bold text-violet-700">{i + 1}</span>
            <span className="font-medium">{s}</span>
          </li>
        ))}
      </ol>
      <p className="mt-6 text-sm text-slate-500">Location is shared only when a person in the bus chooses to start sharing, and they can stop at any time.</p>
    </main>
  )
}
