import { describe, it, expect } from 'vitest';
import { createUserSchema, updateUserSchema } from '../../src/modules/users/users.validator';
import { createClientSchema, updateClientSchema, clientIdParamSchema } from '../../src/modules/clients/clients.validator';
import { createWorkOrderSchema, updateWorkOrderSchema, updateStatusSchema } from '../../src/modules/work-orders/work-orders.validator';

describe('createUserSchema', () => {
  const valido = {
    email: 'nuevo@workshop.com',
    password: 'Admin123!',
    fullName: 'Nuevo Usuario',
    role: 'MECHANIC',
  };

  it('acepta un usuario completo', () => {
    expect(createUserSchema.safeParse(valido).success).toBe(true);
  });

  it('exige un email con formato válido', () => {
    expect(createUserSchema.safeParse({ ...valido, email: 'sin-arroba' }).success).toBe(false);
  });

  it('exige al menos 8 caracteres de contraseña', () => {
    expect(createUserSchema.safeParse({ ...valido, password: '1234567' }).success).toBe(false);
    expect(createUserSchema.safeParse({ ...valido, password: '12345678' }).success).toBe(true);
  });

  it('solo admite los tres roles del sistema', () => {
    for (const role of ['ADMIN', 'RECEPTIONIST', 'MECHANIC']) {
      expect(createUserSchema.safeParse({ ...valido, role }).success).toBe(true);
    }
    expect(createUserSchema.safeParse({ ...valido, role: 'SUPERADMIN' }).success).toBe(false);
  });

  it('al crear, la contraseña es obligatoria', () => {
    const { password, ...sinPassword } = valido;
    expect(createUserSchema.safeParse(sinPassword).success).toBe(false);
  });

  it('rechaza un nombre vacío', () => {
    expect(createUserSchema.safeParse({ ...valido, fullName: '' }).success).toBe(false);
  });
});

describe('updateUserSchema', () => {
  it('acepta un payload vacío: todos los campos son opcionales', () => {
    expect(updateUserSchema.safeParse({}).success).toBe(true);
  });

  it('al editar, la contraseña es opcional pero sigue teniendo mínimo 8', () => {
    // Así el formulario puede dejarla en blanco para conservar la actual,
    // sin permitir por ello una contraseña débil cuando sí se cambia.
    expect(updateUserSchema.safeParse({ fullName: 'Solo el nombre' }).success).toBe(true);
    expect(updateUserSchema.safeParse({ password: 'corta' }).success).toBe(false);
  });

  it('no acepta cadena vacía como contraseña: hay que omitir el campo', () => {
    expect(updateUserSchema.safeParse({ password: '' }).success).toBe(false);
  });
});

describe('createClientSchema', () => {
  const valido = {
    fullName: 'Juan Perez',
    phone: '3001234567',
    documentType: 'CC',
    documentNumber: '1234567890',
  };

  it('acepta un cliente con solo los campos obligatorios', () => {
    expect(createClientSchema.safeParse(valido).success).toBe(true);
  });

  it.each(['CC', 'CE', 'NIT', 'PASSPORT'])('acepta el tipo de documento %s', (documentType) => {
    expect(createClientSchema.safeParse({ ...valido, documentType }).success).toBe(true);
  });

  it('rechaza un tipo de documento inventado', () => {
    expect(createClientSchema.safeParse({ ...valido, documentType: 'TI' }).success).toBe(false);
  });

  it('al crear, un opcional NO admite cadena vacía: hay que omitirlo', () => {
    // Este es el detalle del contrato que obliga al frontend a limpiar el
    // payload antes de enviarlo en el alta.
    expect(createClientSchema.safeParse({ ...valido, email: '' }).success).toBe(false);
  });

  it('al crear, un opcional tampoco admite null', () => {
    expect(createClientSchema.safeParse({ ...valido, email: null }).success).toBe(false);
  });
});

describe('updateClientSchema', () => {
  it('al editar sí admite null, que es como se limpia un campo', () => {
    const resultado = updateClientSchema.safeParse({ email: null, address: null, notes: null });
    expect(resultado.success).toBe(true);
  });

  it('al editar, un email con formato malo se sigue rechazando', () => {
    expect(updateClientSchema.safeParse({ email: 'malo' }).success).toBe(false);
  });
});

describe('clientIdParamSchema', () => {
  it('convierte el id de la URL, que siempre llega como texto', () => {
    const resultado = clientIdParamSchema.safeParse({ id: '42' });
    expect(resultado.success && resultado.data.id).toBe(42);
  });

  it.each(['0', '-1', '1.5', 'abc'])('rechaza el id %s', (id) => {
    expect(clientIdParamSchema.safeParse({ id }).success).toBe(false);
  });
});

describe('createWorkOrderSchema', () => {
  it('exige cliente y vehículo', () => {
    expect(createWorkOrderSchema.safeParse({ clientId: 1, vehicleId: 2 }).success).toBe(true);
    expect(createWorkOrderSchema.safeParse({ clientId: 1 }).success).toBe(false);
  });

  it('acepta kilometraje 0 pero no negativo', () => {
    expect(createWorkOrderSchema.safeParse({ clientId: 1, vehicleId: 2, mileageAtReception: 0 }).success).toBe(true);
    expect(createWorkOrderSchema.safeParse({ clientId: 1, vehicleId: 2, mileageAtReception: -1 }).success).toBe(false);
  });

  it('espera números, no los strings que vendrían de un formulario sin convertir', () => {
    expect(createWorkOrderSchema.safeParse({ clientId: '1', vehicleId: '2' }).success).toBe(false);
  });
});

describe('updateWorkOrderSchema', () => {
  it('acepta costos con decimales y también 0', () => {
    expect(updateWorkOrderSchema.safeParse({ estimatedCost: 150000.5 }).success).toBe(true);
    expect(updateWorkOrderSchema.safeParse({ finalCost: 0 }).success).toBe(true);
  });

  it('rechaza un costo negativo', () => {
    expect(updateWorkOrderSchema.safeParse({ finalCost: -1 }).success).toBe(false);
  });

  it('admite null para borrar un costo ya guardado', () => {
    expect(updateWorkOrderSchema.safeParse({ estimatedCost: null }).success).toBe(true);
  });

  it('no permite cambiar el estado por esta vía', () => {
    // El estado tiene su propio endpoint porque pasa por la máquina de estados.
    const resultado = updateWorkOrderSchema.safeParse({ status: 'DELIVERED' });
    expect(resultado.success && 'status' in resultado.data).toBe(false);
  });
});

describe('updateStatusSchema', () => {
  it.each(['PENDING', 'DIAGNOSED', 'IN_PROGRESS', 'COMPLETED', 'DELIVERED', 'CANCELLED'])(
    'acepta el estado %s',
    (status) => {
      expect(updateStatusSchema.safeParse({ status }).success).toBe(true);
    },
  );

  it('rechaza un estado que no existe', () => {
    expect(updateStatusSchema.safeParse({ status: 'PAUSED' }).success).toBe(false);
  });
});
