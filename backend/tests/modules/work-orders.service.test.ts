import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as workOrdersRepository from '../../src/modules/work-orders/work-orders.repository';
import * as workOrdersService from '../../src/modules/work-orders/work-orders.service';

vi.mock('../../src/modules/work-orders/work-orders.repository');

const mockRepo = vi.mocked(workOrdersRepository);

const ADMIN = { id: 1, role: 'ADMIN' as const };
const RECEPCION = { id: 2, role: 'RECEPTIONIST' as const };
const MECANICO = { id: 3, role: 'MECHANIC' as const };
const OTRO_MECANICO = { id: 4, role: 'MECHANIC' as const };

function orden(overrides: Partial<{ id: number; status: string; assignedToUserId: number | null }> = {}) {
  return { id: 10, status: 'PENDING', assignedToUserId: 3, ...overrides };
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe('list — visibilidad por rol', () => {
  beforeEach(() => {
    mockRepo.findMany.mockResolvedValue({ workOrders: [], total: 0 } as never);
  });

  it('al mecánico le fuerza el filtro a sus propias órdenes', async () => {
    await workOrdersService.list({}, MECANICO);
    expect(mockRepo.findMany.mock.calls[0][0].assignedToUserId).toBe(MECANICO.id);
  });

  it('el mecánico no puede espiar las órdenes de otro por query string', async () => {
    // Aunque mande ?assignedToUserId=4, el servicio lo pisa con su propio id.
    await workOrdersService.list({ assignedToUserId: '4' }, MECANICO);
    expect(mockRepo.findMany.mock.calls[0][0].assignedToUserId).toBe(MECANICO.id);
  });

  it('admin y recepción ven todas las órdenes si no filtran', async () => {
    await workOrdersService.list({}, ADMIN);
    expect(mockRepo.findMany.mock.calls[0][0].assignedToUserId).toBeUndefined();

    await workOrdersService.list({}, RECEPCION);
    expect(mockRepo.findMany.mock.calls[1][0].assignedToUserId).toBeUndefined();
  });

  it('admin sí puede filtrar por un mecánico concreto', async () => {
    await workOrdersService.list({ assignedToUserId: '3' }, ADMIN);
    expect(mockRepo.findMany.mock.calls[0][0].assignedToUserId).toBe(3);
  });

  it('convierte a número los filtros que llegan como texto en la query', async () => {
    await workOrdersService.list({ clientId: '5', vehicleId: '8', status: 'PENDING' }, ADMIN);
    expect(mockRepo.findMany.mock.calls[0][0]).toMatchObject({
      clientId: 5,
      vehicleId: 8,
      status: 'PENDING',
    });
  });
});

describe('getById', () => {
  it('devuelve la orden al mecánico asignado', async () => {
    mockRepo.findById.mockResolvedValue(orden() as never);
    await expect(workOrdersService.getById(10, MECANICO)).resolves.toMatchObject({ id: 10 });
  });

  it('responde 403 al mecánico que no la tiene asignada', async () => {
    mockRepo.findById.mockResolvedValue(orden() as never);
    await expect(workOrdersService.getById(10, OTRO_MECANICO)).rejects.toThrowError(
      expect.objectContaining({ statusCode: 403 }),
    );
  });

  it('admin y recepción la ven aunque no sea suya', async () => {
    mockRepo.findById.mockResolvedValue(orden() as never);
    await expect(workOrdersService.getById(10, ADMIN)).resolves.toBeTruthy();
    await expect(workOrdersService.getById(10, RECEPCION)).resolves.toBeTruthy();
  });

  it('responde 404 si no existe', async () => {
    mockRepo.findById.mockResolvedValue(null as never);
    await expect(workOrdersService.getById(99, ADMIN)).rejects.toThrowError(
      expect.objectContaining({ statusCode: 404 }),
    );
  });
});

describe('update', () => {
  it('impide al mecánico editar una orden ajena', async () => {
    mockRepo.findById.mockResolvedValue(orden() as never);
    await expect(workOrdersService.update(10, { diagnosis: 'x' }, OTRO_MECANICO)).rejects.toThrowError(
      expect.objectContaining({ statusCode: 403 }),
    );
    expect(mockRepo.update).not.toHaveBeenCalled();
  });

  it('permite limpiar un campo opcional enviando null', async () => {
    mockRepo.findById.mockResolvedValue(orden() as never);
    mockRepo.update.mockResolvedValue(orden() as never);

    await workOrdersService.update(10, { diagnosis: null }, ADMIN);

    expect(mockRepo.update).toHaveBeenCalledWith(10, { diagnosis: null });
  });
});

describe('create', () => {
  it('sella la orden con el usuario que la crea', async () => {
    mockRepo.create.mockResolvedValue(orden() as never);

    await workOrdersService.create({ clientId: 1, vehicleId: 2 }, 7);

    expect(mockRepo.create).toHaveBeenCalledWith({
      clientId: 1,
      vehicleId: 2,
      createdByUserId: 7,
    });
  });
});

describe('updateStatus', () => {
  it('aplica una transición válida', async () => {
    mockRepo.findById.mockResolvedValue(orden({ status: 'PENDING' }) as never);
    mockRepo.update.mockResolvedValue(orden({ status: 'DIAGNOSED' }) as never);

    await workOrdersService.updateStatus(10, 'DIAGNOSED', MECANICO);

    expect(mockRepo.update).toHaveBeenCalledWith(10, { status: 'DIAGNOSED' });
  });

  it('rechaza con 400 un salto de estado inválido', async () => {
    mockRepo.findById.mockResolvedValue(orden({ status: 'PENDING' }) as never);

    await expect(workOrdersService.updateStatus(10, 'DELIVERED', ADMIN)).rejects.toThrowError(
      expect.objectContaining({ statusCode: 400 }),
    );
    expect(mockRepo.update).not.toHaveBeenCalled();
  });

  it('el mensaje de error dice qué transiciones sí se pueden hacer', async () => {
    mockRepo.findById.mockResolvedValue(orden({ status: 'PENDING' }) as never);

    await expect(workOrdersService.updateStatus(10, 'DELIVERED', ADMIN)).rejects.toThrowError(
      /Allowed: DIAGNOSED, CANCELLED/,
    );
  });

  it('desde un estado final avisa de que no hay salida', async () => {
    mockRepo.findById.mockResolvedValue(orden({ status: 'DELIVERED' }) as never);

    await expect(workOrdersService.updateStatus(10, 'PENDING', ADMIN)).rejects.toThrowError(
      /none \(final state\)/,
    );
  });

  it('el retroceso lo permite a ADMIN y se lo niega al mecánico', async () => {
    mockRepo.findById.mockResolvedValue(orden({ status: 'IN_PROGRESS' }) as never);
    mockRepo.update.mockResolvedValue(orden() as never);

    await expect(workOrdersService.updateStatus(10, 'DIAGNOSED', ADMIN)).resolves.toBeTruthy();
    await expect(workOrdersService.updateStatus(10, 'DIAGNOSED', MECANICO)).rejects.toThrowError(
      expect.objectContaining({ statusCode: 400 }),
    );
  });

  it('comprueba la pertenencia antes que la transición', async () => {
    // Un mecánico ajeno recibe 403, no un 400 de transición: no debe poder
    // deducir en qué estado está una orden que no le corresponde.
    mockRepo.findById.mockResolvedValue(orden({ status: 'PENDING' }) as never);

    await expect(workOrdersService.updateStatus(10, 'DELIVERED', OTRO_MECANICO)).rejects.toThrowError(
      expect.objectContaining({ statusCode: 403 }),
    );
  });
});

describe('assignMechanic', () => {
  it('guarda el mecánico asignado', async () => {
    mockRepo.findById.mockResolvedValue(orden({ assignedToUserId: null }) as never);
    mockRepo.update.mockResolvedValue(orden() as never);

    await workOrdersService.assignMechanic(10, 3);

    expect(mockRepo.update).toHaveBeenCalledWith(10, { assignedToUserId: 3 });
  });

  it('responde 404 si la orden no existe', async () => {
    mockRepo.findById.mockResolvedValue(null as never);
    await expect(workOrdersService.assignMechanic(99, 3)).rejects.toThrowError(
      expect.objectContaining({ statusCode: 404 }),
    );
  });
});
