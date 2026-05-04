type TestPageProps = {
  title: string;
  description: string;
  endpoints: string[];
  notes: string[];
};

export function TestPage({
  title,
  description,
  endpoints,
  notes,
}: TestPageProps) {
  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">
          Test page
        </p>
        <h2 className="mt-3 break-words text-3xl font-semibold text-slate-950">{title}</h2>
        <p className="mt-3 max-w-2xl break-words text-sm leading-6 text-slate-600">
          {description}
        </p>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Připravené endpointy
          </p>
          <ul className="mt-3 space-y-2">
            {endpoints.map((endpoint) => (
              <li
                key={endpoint}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-sm text-slate-800 break-all"
              >
                {endpoint}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <aside className="min-w-0 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-950">Poznámky</h3>
        <ul className="mt-4 space-y-3 text-sm text-slate-700">
          {notes.map((note) => (
            <li
              key={note}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 break-words"
            >
              {note}
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
