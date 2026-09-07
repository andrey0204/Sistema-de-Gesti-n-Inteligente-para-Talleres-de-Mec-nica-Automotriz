import { describe, it, expect } from 'vitest';
import {
  canTransition,
  getAllowedTransitions,
} from '../../src/modules/work-orders/work-orders.state-machine';

describe('canTransition — avance normal del flujo', () => {
  it.each([
    ['PENDING', 'DIAGNOSED'],
    ['DIAGNOSED', 'IN_PROGRESS'],
    ['IN_PROGRESS', 'COMPLETED'],
    ['COMPLETED', 'DELIVERED'],
  ] as const)('permite %s → %s a cualquier rol', (from, to) => {
    expect(canTransition(from, to, 'MECHANIC')).toBe(true);
    expect(canTransition(from, to, 'RECEPTIONIST')).toBe(true);
    expect(canTransition(from, to, 'ADMIN')).toBe(true);
  });

  it.each(['PENDING', 'DIAGNOSED', 'IN_PROGRESS', 'COMPLETED'] as const)(
    'permite cancelar desde %s',
    (from) => {
      expect(canTransition(from, 'CANCELLED', 'MECHANIC')).toBe(true);
    },
  );

  it('no permite saltarse pasos intermedios', () => {
    expect(canTransition('PENDING', 'IN_PROGRESS', 'ADMIN')).toBe(false);
    expect(canTransition('PENDING', 'DELIVERED', 'ADMIN')).toBe(false);
    expect(canTransition('DIAGNOSED', 'COMPLETED', 'ADMIN')).toBe(false);
  });

  it('no permite quedarse en el mismo estado', () => {
    expect(canTransition('IN_PROGRESS', 'IN_PROGRESS', 'ADMIN')).toBe(false);
  });
});

describe('canTransition — estados finales', () => {
  it.each(['DELIVERED', 'CANCELLED'] as const)('desde %s no se sale ni siendo ADMIN', (from) => {
    expect(canTransition(from, 'PENDING', 'ADMIN')).toBe(false);
    expect(canTransition(from, 'IN_PROGRESS', 'ADMIN')).toBe(false);
    expect(getAllowedTransitions(from, 'ADMIN')).toEqual([]);
  });
});

describe('canTransition — retrocesos reservados a ADMIN', () => {
  it.each([
    ['DIAGNOSED', 'PENDING'],
    ['IN_PROGRESS', 'DIAGNOSED'],
    ['COMPLETED', 'IN_PROGRESS'],
  ] as const)('ADMIN puede retroceder %s → %s', (from, to) => {
    expect(canTransition(from, to, 'ADMIN')).toBe(true);
  });

  it.each([
    ['DIAGNOSED', 'PENDING'],
    ['IN_PROGRESS', 'DIAGNOSED'],
    ['COMPLETED', 'IN_PROGRESS'],
  ] as const)('MECHANIC y RECEPTIONIST no pueden retroceder %s → %s', (from, to) => {
    expect(canTransition(from, to, 'MECHANIC')).toBe(false);
    expect(canTransition(from, to, 'RECEPTIONIST')).toBe(false);
  });

  it('un retroceso de más de un paso no existe ni para ADMIN', () => {
    expect(canTransition('COMPLETED', 'PENDING', 'ADMIN')).toBe(false);
  });
});

describe('getAllowedTransitions', () => {
  it('para un no-ADMIN devuelve solo el avance y la cancelación', () => {
    expect(getAllowedTransitions('DIAGNOSED', 'MECHANIC')).toEqual(['IN_PROGRESS', 'CANCELLED']);
  });

  it('para ADMIN añade el retroceso al final de la lista', () => {
    expect(getAllowedTransitions('DIAGNOSED', 'ADMIN')).toEqual([
      'IN_PROGRESS',
      'CANCELLED',
      'PENDING',
    ]);
  });

  it('PENDING no tiene retroceso porque es el estado inicial', () => {
    expect(getAllowedTransitions('PENDING', 'ADMIN')).toEqual(['DIAGNOSED', 'CANCELLED']);
  });

  it('todo lo que devuelve es aceptado por canTransition', () => {
    const estados = ['PENDING', 'DIAGNOSED', 'IN_PROGRESS', 'COMPLETED', 'DELIVERED', 'CANCELLED'] as const;
    const roles = ['ADMIN', 'RECEPTIONIST', 'MECHANIC'] as const;
    for (const estado of estados) {
      for (const rol of roles) {
        for (const destino of getAllowedTransitions(estado, rol)) {
          expect(canTransition(estado, destino, rol)).toBe(true);
        }
      }
    }
  });
});
