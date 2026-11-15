export default function PageHeader({ icono: Icono, titulo, descripcion }) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-700">
        <Icono className="h-6 w-6" />
      </div>
      <div>
        <h1 className="text-2xl font-extrabold">{titulo}</h1>
        <p className="text-sm text-stone-500">{descripcion}</p>
      </div>
    </div>
  );
}