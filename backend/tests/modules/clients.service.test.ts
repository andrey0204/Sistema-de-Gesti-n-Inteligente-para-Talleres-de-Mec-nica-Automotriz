import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as clientsRepository from '../../src/modules/clients/clients.repository';
import * as clientsService from '../../src/modules/clients/clients.service';

vi.mock('../../src/modules/clients/clients.repository');

const mockRepo = vi.mocked(clientsRepository);

const cliente = {
  id: 1,
  fullName: 'Juan Perez',
  phone: '3001234567',
  documentType: 'CC' as const,
  documentNumber: '1234567890',
  deletedAt: null,
};

const nuevoCliente = {
  fullName: 'Juan Perez',
  phone: '3001234567',
  documentType: 'CC' as const,
  documentNumber: '1234567890',
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe('list', () => {
  it('traduce página y búsqueda a los parámetros del repositorio', async () => {
    mockRepo.findMany.mockResolvedValue({ clients: [], total: 0 } as never);

    await clientsService.list({ page: '2', limit: '10', search: 'perez' });

    expect(mockRepo.findMany).toHaveBeenCalledWith({ skip: 10, take: 10, search: 'perez' });
  });

  it('devuelve el meta de paginación junto al listado', async () => {
    mockRepo.findMany.mockResolvedValue({ clients: [cliente], total: 1 } as never);

    const resultado = await clientsService.list({});

    expect(resultado.meta).toEqual({ page: 1, limit: 20, total: 1, totalPages: 1 });
  });
});

describe('getById', () => {
  it('devuelve el cliente encontrado', async () => {
    mockRepo.findById.mockResolvedValue(cliente as never);
    await expect(clientsService.getById(1)).resolves.toMatchObject({ id: 1 });
  });

  it('responde 404 si no existe', async () => {
    mockRepo.findById.mockResolvedValue(null as never);
    await expect(clientsService.getById(99)).rejects.toThrowError(
      expect.objectContaining({ statusCode: 404, message: 'Client not found' }),
    );
  });
});

describe('create', () => {
  it('crea el cliente si el documento está libre', async () => {
    mockRepo.findByDocumentNumber.mockResolvedValue(null as never);
    mockRepo.create.mockResolvedValue(cliente as never);

    await clientsService.create(nuevoCliente);

    expect(mockRepo.create).toHaveBeenCalledWith(nuevoCliente);
  });

  it('rechaza con 409 un documento ya registrado', async () => {
    mockRepo.findByDocumentNumber.mockResolvedValue(cliente as never);

    await expect(clientsService.create(nuevoCliente)).rejects.toThrowError(
      expect.objectContaining({ statusCode: 409 }),
    );
    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it('permite reutilizar el documento de un cliente dado de baja', async () => {
    // Un cliente eliminado no bloquea el alta: si vuelve al taller, puede
    // registrarse de nuevo con su mismo número de documento.
    mockRepo.findByDocumentNumber.mockResolvedValue({
      ...cliente,
      deletedAt: new Date('2026-01-01'),
    } as never);
    mockRepo.create.mockResolvedValue(cliente as never);

    await expect(clientsService.create(nuevoCliente)).resolves.toBeTruthy();
    expect(mockRepo.create).toHaveBeenCalled();
  });
});

describe('update', () => {
  it('no comprueba duplicados si el documento no cambia', async () => {
    mockRepo.findById.mockResolvedValue(cliente as never);
    mockRepo.update.mockResolvedValue(cliente as never);

    await clientsService.update(1, { documentNumber: '1234567890', phone: '3009999999' });

    expect(mockRepo.findByDocumentNumber).not.toHaveBeenCalled();
  });

  it('rechaza con 409 si el documento nuevo es de otro cliente activo', async () => {
    mockRepo.findById.mockResolvedValue(cliente as never);
    mockRepo.findByDocumentNumber.mockResolvedValue({ ...cliente, id: 2 } as never);

    await expect(clientsService.update(1, { documentNumber: '9999999999' })).rejects.toThrowError(
      expect.objectContaining({ statusCode: 409 }),
    );
  });

  it('permite tomar el documento de un cliente dado de baja', async () => {
    mockRepo.findById.mockResolvedValue(cliente as never);
    mockRepo.findByDocumentNumber.mockResolvedValue({
      ...cliente,
      id: 2,
      deletedAt: new Date(),
    } as never);
    mockRepo.update.mockResolvedValue(cliente as never);

    await expect(clientsService.update(1, { documentNumber: '9999999999' })).resolves.toBeTruthy();
  });

  it('acepta null para limpiar un campo opcional', async () => {
    mockRepo.findById.mockResolvedValue(cliente as never);
    mockRepo.update.mockResolvedValue(cliente as never);

    await clientsService.update(1, { email: null, address: null });

    expect(mockRepo.update).toHaveBeenCalledWith(1, { email: null, address: null });
  });

  it('responde 404 si el cliente no existe', async () => {
    mockRepo.findById.mockResolvedValue(null as never);
    await expect(clientsService.update(99, { phone: '3001112222' })).rejects.toThrowError(
      expect.objectContaining({ statusCode: 404 }),
    );
  });
});

describe('remove', () => {
  it('hace baja lógica', async () => {
    mockRepo.findById.mockResolvedValue(cliente as never);
    mockRepo.softDelete.mockResolvedValue(cliente as never);

    await clientsService.remove(1);

    expect(mockRepo.softDelete).toHaveBeenCalledWith(1);
  });

  it('responde 404 si el cliente no existe', async () => {
    mockRepo.findById.mockResolvedValue(null as never);
    await expect(clientsService.remove(99)).rejects.toThrowError(
      expect.objectContaining({ statusCode: 404 }),
    );
  });
});
