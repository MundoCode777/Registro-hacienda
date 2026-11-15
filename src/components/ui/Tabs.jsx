export default function Tabs({ tabs, activa, onChange }) {
  return (
    <div className="mb-6 flex gap-1 overflow-x-auto rounded-2xl border border-stone-200 bg-white p-1.5 shadow-sm">
      {tabs.map(({ clave, nombre, icono: Icono }) => (
        <button
          key={clave}
          onClick={() => onChange(clave)}
          className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
            activa === clave
              ? 'bg-green-700 text-white shadow-sm'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          {Icono && <Icono className="h-4 w-4" />}
          {nombre}
        </button>
      ))}
    </div>
  );
}