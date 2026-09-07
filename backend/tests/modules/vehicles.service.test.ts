import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as vehiclesRepository from '../../src/modules/vehicles/vehicles.repository';
import * as vehiclesService from '../../src/modules/vehicles/vehicles.service';

vi.mock('../../src/modules/vehicles/vehicles.repository');

const mockRepo = vi.mocked(vehiclesRepository);

const vehiculo = {
  id: 1,
  clientId: 1,
  plate: 'ABC-123',
  brand: 'Toyota',
  model: 'Corolla',
  year: 2021,
  vin: 'VIN123456789',
  deletedAt: null,
};

const nuevoVehiculo = {
  clientId: 1,
  plate: 'ABC-123',
  brand: 'Toyota',
  model: 'Corolla',
  year: 2021,
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe('list', () => {
  it('convierte a número el filtro por propietario', async () => {
    mockRepo.findMany.mockResolvedValue({ vehicles: [], total: 0 } as never);

    await vehiclesService.list({ clientId: '5', search: 'ABC' });

    expect(mockRepo.findMany).toHaveBeenCalledWith({
      skip: 0,
      take: 20,
      search: 'ABC',
      clientId: 5,
    });
  });

  it('deja el filtro sin definir si no se envía propietario', async () => {
    mockRepo.findMany.mockResolvedValue({ vehicles: [], total: 0 } as never);

    await vehiclesService.list({});

    expect(mockRepo.findMany.mock.calls[0][0].clientId).toBeUndefined();
  });
});

describe('getById', () => {
  it('responde 404 si no existe', async () => {
    mockRepo.findById.mockResolvedValue(null as never);
    await expect(vehiclesService.getById(99)).rejects.toThrowError(
      expect.objectContaining({ statusCode: 404, message: 'Vehicle not found' }),
    );
  });
});

describe('create', () => {
  it('crea el vehículo si la placa está libre', async () => {
    mockRepo.findByPlate.mockResolvedValue(null as never);
    mockRepo.create.mockResolvedValue(vehiculo as never);

    await vehiclesService.create(nuevoVehiculo);

    expect(mockRepo.create).toHaveBeenCalledWith(nuevoVehiculo);
  });

  it('rechaza con 409 una placa ya registrada', async () => {
    mockRepo.findByPlate.mockResolvedValue(vehiculo as never);

    await expect(vehiclesService.create(nuevoVehiculo)).rejects.toThrowError(
      expect.objectContaining({ statusCode: 409, message: 'A vehicle with this plate already exists' }),
    );
  });

  it('permite reutilizar la placa de un vehículo dado de baja', async () => {
    mockRepo.findByPlate.mockResolvedValue({ ...vehiculo, deletedAt: new Date() } as never);
    mockRepo.create.mockResolvedValue(vehiculo as never);

    await expect(vehiclesService.create(nuevoVehiculo)).resolves.toBeTruthy();
  });

  it('no consulta el VIN si no se envía, porque es opcional', async () => {
    mockRepo.findByPlate.mockResolvedValue(null as never);
    mockRepo.create.mockResolvedValue(vehiculo as never);

    await vehiclesService.create(nuevoVehiculo);

    expect(mockRepo.findByVin).not.toHaveBeenCalled();
  });

  it('rechaza con 409 un VIN ya registrado', async () => {
    mockRepo.findByPlate.mockResolvedValue(null as never);
    mockRepo.findByVin.mockResolvedValue(vehiculo as never);

    await expect(
      vehiclesService.create({ ...nuevoVehiculo, vin: 'VIN123456789' }),
    ).rejects.toThrowError(
      expect.objectContaining({ message: 'A vehicle with this VIN already exists' }),
    );
  });

  it('comprueba la placa antes que el VIN', async () => {
    mockRepo.findByPlate.mockResolvedValue(vehiculo as never);

    await expect(
      vehiclesService.create({ ...nuevoVehiculo, vin: 'VIN123456789' }),
    ).rejects.toThrowError(expect.objectContaining({ statusCode: 409 }));
    expect(mockRepo.findByVin).not.toHaveBeenCalled();
  });
});

describe('update', () => {
  it('no comprueba duplicados si la placa no cambia', async () => {
    mockRepo.findById.mockResolvedValue(vehiculo as never);
    mockRepo.update.mockResolvedValue(vehiculo as never);

    await vehiclesService.update(1, { plate: 'ABC-123', brand: 'Mazda' });

    expect(mockRepo.findByPlate).not.toHaveBeenCalled();
  });

  it('rechaza con 409 si la placa nueva ya está en uso', async () => {
    mockRepo.findById.mockResolvedValue(vehiculo as never);
    mockRepo.findByPlate.mockResolvedValue({ ...vehiculo, id: 2 } as never);

    await expect(vehiclesService.update(1, { plate: 'XYZ-789' })).rejects.toThrowError(
      expect.objectContaining({ statusCode: 409 }),
    );
  });

  it('rechaza con 409 si el VIN nuevo ya está en uso', async () => {
    mockRepo.findById.mockResolvedValue(vehiculo as never);
    mockRepo.findByVin.mockResolvedValue({ ...vehiculo, id: 2 } as never);

    await expect(vehiclesService.update(1, { vin: 'OTROVIN123' })).rejects.toThrowError(
      expect.objectContaining({ message: 'A vehicle with this VIN already exists' }),
    );
  });

  it('responde 404 si el vehículo no existe', async () => {
    mockRepo.findById.mockResolvedValue(null as never);
    await expect(vehiclesService.update(99, { brand: 'Mazda' })).rejects.toThrowError(
      expect.objectContaining({ statusCode: 404 }),
    );
  });
});

describe('remove', () => {
  it('hace baja lógica', async () => {
    mockRepo.findById.mockResolvedValue(vehiculo as never);
    mockRepo.softDelete.mockResolvedValue(vehiculo as never);

    await vehiclesService.remove(1);

    expect(mockRepo.softDelete).toHaveBeenCalledWith(1);
  });
});
