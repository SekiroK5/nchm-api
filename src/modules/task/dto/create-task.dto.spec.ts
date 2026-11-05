import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateTaskDto } from './create-task.dto';
import { UpdateTaskDto } from './update-task.dto';

/**
 * Sección 4 y 8 — Pruebas unitarias de las reglas de validación de tareas,
 * aisladas de la red y de la BD, usando particiones de equivalencia y
 * análisis de valores límite.
 */
async function errorsFor(cls: any, body: Record<string, unknown>) {
  const dto = plainToInstance(cls, body);
  const errors = await validate(dto as object);
  return { dto, fields: errors.map((e) => e.property) };
}

const valid = { name: 'Plan tests', description: 'Synthetic', priority: false };

describe('CreateTaskDto', () => {
  it('acepta una tarea típica', async () => {
    expect((await errorsFor(CreateTaskDto, valid)).fields).toEqual([]);
  });

  it('recorta espacios del título', async () => {
    const { dto, fields } = await errorsFor(CreateTaskDto, {
      ...valid,
      name: '  Plan tests  ',
    });
    expect(fields).toEqual([]);
    expect((dto as CreateTaskDto).name).toBe('Plan tests');
  });

  it.each([
    ['vacío', '', false],
    ['solo espacios', '     ', false],
    ['2 caracteres', 'ab', false],
    ['3 caracteres', 'abc', true],
    ['3 caracteres rodeados de espacios', '  abc  ', true],
    ['100 caracteres', 'a'.repeat(100), true],
    ['101 caracteres', 'a'.repeat(101), false],
    ['número', 42, false],
    ['null', null, false],
  ])('título %s → válido=%s', async (_label, name, ok) => {
    const { fields } = await errorsFor(CreateTaskDto, { ...valid, name });
    expect(fields.includes('name')).toBe(!ok);
  });

  it.each([
    ['250 caracteres', 'd'.repeat(250), true],
    ['251 caracteres', 'd'.repeat(251), false],
  ])('descripción %s → válido=%s', async (_label, description, ok) => {
    const { fields } = await errorsFor(CreateTaskDto, { ...valid, description });
    expect(fields.includes('description')).toBe(!ok);
  });

  it('rechaza una prioridad que no es booleana', async () => {
    const { fields } = await errorsFor(CreateTaskDto, { ...valid, priority: 'yes' });
    expect(fields).toContain('priority');
  });
});

describe('UpdateTaskDto', () => {
  it('permite actualizaciones parciales', async () => {
    expect((await errorsFor(UpdateTaskDto, { completed: true })).fields).toEqual([]);
  });

  it('usa el mismo límite de descripción que al crear (250)', async () => {
    const ok = await errorsFor(UpdateTaskDto, { description: 'd'.repeat(250) });
    const tooLong = await errorsFor(UpdateTaskDto, { description: 'd'.repeat(251) });
    expect(ok.fields).toEqual([]);
    expect(tooLong.fields).toContain('description');
  });

  it('rechaza un título solo con espacios', async () => {
    const { fields } = await errorsFor(UpdateTaskDto, { name: '    ' });
    expect(fields).toContain('name');
  });
});
