import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { TaskService } from './task.service';

/**
 * Sección 4 y 15 — Prueba unitaria de TaskService con un Prisma simulado
 * (mock). Es rápida y determinista; las pruebas e2e complementan esto con
 * una BD real, porque un mock no puede demostrar que la consulta SQL
 * realmente filtra por dueño.
 */
describe('TaskService', () => {
  const owner = { id: 1, role: 'USER' };
  const stranger = { id: 2, role: 'USER' };
  const admin = { id: 99, role: 'ADMIN' };
  const task = {
    id: 10,
    name: 'Plan tests',
    description: 'Synthetic',
    priority: false,
    completed: false,
    user_id: owner.id,
  };

  let prisma: any;
  let service: TaskService;

  beforeEach(() => {
    prisma = {
      task: {
        findMany: jest.fn().mockResolvedValue([task]),
        findFirst: jest.fn(),
        create: jest.fn().mockResolvedValue(task),
        update: jest.fn().mockResolvedValue(task),
        delete: jest.fn().mockResolvedValue(task),
      },
      logs: { create: jest.fn().mockResolvedValue({}) },
    };
    service = new TaskService(prisma);
  });

  describe('getAllTasks', () => {
    it('filtra por el dueño cuando el usuario no es ADMIN', async () => {
      await service.getAllTasks(owner);
      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { user_id: owner.id } }),
      );
    });

    it('no filtra cuando el usuario es ADMIN', async () => {
      await service.getAllTasks(admin);
      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
    });
  });

  describe('getTaskById', () => {
    it('incluye al dueño en la consulta', async () => {
      prisma.task.findFirst.mockResolvedValue(null);
      const result = await service.getTaskById(task.id, stranger);
      expect(prisma.task.findFirst).toHaveBeenCalledWith({
        where: { id: task.id, user_id: stranger.id },
      });
      expect(result).toBeNull();
    });
  });

  describe('insertTask', () => {
    it('asigna siempre el usuario autenticado como dueño', async () => {
      await service.insertTask(
        { name: 'X task', description: 'Synthetic', priority: true } as any,
        owner,
      );
      expect(prisma.task.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ user_id: owner.id }),
      });
      expect(prisma.logs.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateTask', () => {
    it('lanza NotFound si la tarea no existe o es ajena', async () => {
      prisma.task.findFirst.mockResolvedValue(null);
      await expect(
        service.updateTask(task.id, { name: 'Hacked' } as any, stranger),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.task.update).not.toHaveBeenCalled();
    });

    it('solo envía a la BD los campos permitidos (sin user_id)', async () => {
      prisma.task.findFirst.mockResolvedValue(task);
      await service.updateTask(
        task.id,
        { name: 'Renamed', user_id: stranger.id, id: 500 } as any,
        owner,
      );
      const { data } = prisma.task.update.mock.calls[0][0];
      expect(data).not.toHaveProperty('user_id', stranger.id);
      expect(data.user_id).toBeUndefined();
      expect(data.id).toBeUndefined();
      expect(data.name).toBe('Renamed');
    });

    it('defensa en profundidad: rechaza si la tarea devuelta es de otro usuario', async () => {
      prisma.task.findFirst.mockResolvedValue({ ...task, user_id: 3 });
      await expect(
        service.updateTask(task.id, { name: 'X' } as any, owner),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('delete', () => {
    it('elimina la tarea propia y registra el evento', async () => {
      prisma.task.findFirst.mockResolvedValue(task);
      await expect(service.delete(task.id, owner)).resolves.toBe(true);
      expect(prisma.task.delete).toHaveBeenCalledWith({ where: { id: task.id } });
      expect(prisma.logs.create).toHaveBeenCalled();
    });

    it('lanza NotFound para una tarea ajena', async () => {
      prisma.task.findFirst.mockResolvedValue(null);
      await expect(service.delete(task.id, stranger)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.task.delete).not.toHaveBeenCalled();
    });
  });
});
