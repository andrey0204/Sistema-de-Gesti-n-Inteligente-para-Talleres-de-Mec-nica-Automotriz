import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as remindersRepository from '../../src/modules/maintenance-reminders/maintenance-reminders.repository';
import * as remindersService from '../../src/modules/maintenance-reminders/maintenance-reminders.service';

vi.mock('../../src/modules/maintenance-reminders/maintenance-reminders.repository');

const mockRepo = vi.mocked(remindersRepository);

function recordatorio(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    vehicleId: 1,
    description: 'Cambio de aceite',
    scheduledDate: new Date('2026-05-15T00:00:00.000Z'),
    status: 'PENDING',
    ...overrides,
  };
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe('list', () => {
  it('pasa los filtros de estado y vehículo al repositorio', async () => {
    mockRepo.findMany.mockResolvedValue({ reminders: [], total: 0 } as never);

    await remindersService.list({ status: 'PENDING', vehicleId: '3' });

    expect(mockRepo.findMany).toHaveBeenCalledWith({
      skip: 0,
      take: 20,
      status: 'PENDING',
      vehicleId: 3,
    });
  });
});

describe('create', () => {
  it('crea el recordatorio sin comprobaciones previas', async () => {
    mockRepo.create.mockResolvedValue(recordatorio() as never);

    const datos = {
      vehicleId: 1,
      description: 'Cambio de aceite',
      scheduledDate: new Date('2026-05-15T00:00:00.000Z'),
    };
    await remindersService.create(datos as never);

    expect(mockRepo.create).toHaveBeenCalledWith(datos);
  });
});

describe('update', () => {
  it('actualiza el recordatorio existente', async () => {
    mockRepo.findById.mockResolvedValue(recordatorio() as never);
    mockRepo.update.mockResolvedValue(recordatorio() as never);

    await remindersService.update(1, { notes: 'Se adelantó' } as never);

    expect(mockRepo.update).toHaveBeenCalledWith(1, { notes: 'Se adelantó' });
  });

  it('responde 404 si no existe', async () => {
    mockRepo.findById.mockResolvedValue(null as never);
    await expect(remindersService.update(99, {} as never)).rejects.toThrowError(
      expect.objectContaining({ statusCode: 404, message: 'Reminder not found' }),
    );
  });

  it('permite marcar OVERDUE a mano, que es la única forma de asignarlo', async () => {
    // El backend no tiene tarea programada: un recordatorio vencido sigue
    // guardado como PENDING hasta que alguien lo cambia desde el formulario.
    mockRepo.findById.mockResolvedValue(recordatorio() as never);
    mockRepo.update.mockResolvedValue(recordatorio({ status: 'OVERDUE' }) as never);

    await remindersService.update(1, { status: 'OVERDUE' } as never);

    expect(mockRepo.update).toHaveBeenCalledWith(1, { status: 'OVERDUE' });
  });
});

describe('complete', () => {
  it('marca el recordatorio como completado', async () => {
    mockRepo.findById.mockResolvedValue(recordatorio() as never);
    mockRepo.update.mockResolvedValue(recordatorio({ status: 'COMPLETED' }) as never);

    await remindersService.complete(1);

    expect(mockRepo.update).toHaveBeenCalledWith(1, { status: 'COMPLETED' });
  });

  it('permite completar uno vencido', async () => {
    mockRepo.findById.mockResolvedValue(recordatorio({ status: 'OVERDUE' }) as never);
    mockRepo.update.mockResolvedValue(recordatorio({ status: 'COMPLETED' }) as never);

    await expect(remindersService.complete(1)).resolves.toBeTruthy();
  });

  it('rechaza con 400 completar uno que ya lo estaba', async () => {
    mockRepo.findById.mockResolvedValue(recordatorio({ status: 'COMPLETED' }) as never);

    await expect(remindersService.complete(1)).rejects.toThrowError(
      expect.objectContaining({ statusCode: 400, message: 'Reminder is already completed' }),
    );
    expect(mockRepo.update).not.toHaveBeenCalled();
  });

  it('responde 404 si no existe', async () => {
    mockRepo.findById.mockResolvedValue(null as never);
    await expect(remindersService.complete(99)).rejects.toThrowError(
      expect.objectContaining({ statusCode: 404 }),
    );
  });
});

describe('remove', () => {
  it('borra el recordatorio de forma definitiva, sin baja lógica', async () => {
    // A diferencia de clientes, vehículos y usuarios, los recordatorios no
    // tienen deletedAt: se eliminan de verdad.
    mockRepo.findById.mockResolvedValue(recordatorio() as never);
    mockRepo.remove.mockResolvedValue(recordatorio() as never);

    await remindersService.remove(1);

    expect(mockRepo.remove).toHaveBeenCalledWith(1);
  });

  it('responde 404 si no existe', async () => {
    mockRepo.findById.mockResolvedValue(null as never);
    await expect(remindersService.remove(99)).rejects.toThrowError(
      expect.objectContaining({ statusCode: 404 }),
    );
  });
});
