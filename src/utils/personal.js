export const ESPECIALIDADES = [
  { valor: 'agronomo', nombre: 'Agrónomo', clase: 'bg-green-100 text-green-800' },
  { valor: 'jornalero', nombre: 'Jornalero', clase: 'bg-amber-100 text-amber-800' },
  { valor: 'tecnico', nombre: 'Técnico', clase: 'bg-blue-100 text-blue-800' },
];

export const nombreEspecialidad = (valor) =>
  ESPECIALIDADES.find((e) => e.valor === valor)?.nombre ?? valor;

export const claseEspecialidad = (valor) =>
  ESPECIALIDADES.find((e) => e.valor === valor)?.clase ?? 'bg-stone-100 text-stone-600';

export const nombreCompleto = (t) => `${t.nombres} ${t.apellidos}`.trim();

export const iniciales = (t) =>
  `${t.nombres?.[0] ?? ''}${t.apellidos?.[0] ?? ''}`.toUpperCase();

// Validación de cédula ecuatoriana (algoritmo módulo 10)
export function cedulaValida(cedula) {
  if (!/^\d{10}$/.test(cedula)) return false;

  const provincia = Number(cedula.slice(0, 2));
  if ((provincia < 1 || provincia > 24) && provincia !== 30) return false;
  if (Number(cedula[2]) >= 6) return false;

  let suma = 0;
  for (let i = 0; i < 9; i += 1) {
    let n = Number(cedula[i]) * (i % 2 === 0 ? 2 : 1);
    if (n > 9) n -= 9;
    suma += n;
  }
  const verificador = (10 - (suma % 10)) % 10;
  return verificador === Number(cedula[9]);
}