import { Transform } from 'class-transformer';

/** Recorta espacios en blanco de los extremos de un string no confiable. */
export const Trim = () =>
  Transform(({ value }) => (typeof value === 'string' ? value.trim() : value));
