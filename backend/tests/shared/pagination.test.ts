import { describe, it, expect } from 'vitest';
import {
  getPaginationParams,
  buildPaginationMeta,
  getPrismaSkip,
} from '../../src/shared/types/pagination';

describe('getPaginationParams', () => {
  it('aplica los valores por defecto cuando la query viene vacía', () => {
    expect(getPaginationParams({})).toEqual({ page: 1, limit: 20 });
  });

  it('convierte los valores de la query, que llegan como string', () => {
    expect(getPaginationParams({ page: '3', limit: '50' })).toEqual({ page: 3, limit: 50 });
  });

  it('limita el tamaño de página a 100 para que nadie pueda pedir la tabla entera', () => {
    expect(getPaginationParams({ limit: '500' }).limit).toBe(100);
  });

  it('sube a 1 los valores negativos en vez de generar un skip negativo', () => {
    expect(getPaginationParams({ page: '-5', limit: '-5' })).toEqual({ page: 1, limit: 1 });
  });

  it('trata el 0 como ausencia de valor y usa el valor por defecto', () => {
    // parseInt('0') es 0, que es falsy, así que el `|| valor` de la función
    // lo sustituye por el defecto. No es un bug: 0 no es una página ni un
    // tamaño válido, pero conviene dejarlo fijado porque no es lo que se
    // esperaría a primera vista.
    expect(getPaginationParams({ page: '0', limit: '0' })).toEqual({ page: 1, limit: 20 });
  });

  it('cae en los valores por defecto si la query trae basura no numérica', () => {
    expect(getPaginationParams({ page: 'abc', limit: 'xyz' })).toEqual({ page: 1, limit: 20 });
  });

  it('trunca los decimales en lugar de fallar', () => {
    expect(getPaginationParams({ page: '2.9' }).page).toBe(2);
  });
});

describe('buildPaginationMeta', () => {
  it('redondea totalPages hacia arriba: 21 registros de 20 en 20 son 2 páginas', () => {
    expect(buildPaginationMeta(1, 20, 21)).toEqual({
      page: 1,
      limit: 20,
      total: 21,
      totalPages: 2,
    });
  });

  it('devuelve 0 páginas cuando no hay registros', () => {
    expect(buildPaginationMeta(1, 20, 0).totalPages).toBe(0);
  });

  it('devuelve 1 página cuando el total cabe justo', () => {
    expect(buildPaginationMeta(1, 20, 20).totalPages).toBe(1);
  });
});

describe('getPrismaSkip', () => {
  it('la primera página no se salta ningún registro', () => {
    expect(getPrismaSkip(1, 20)).toBe(0);
  });

  it('la tercera página de 20 en 20 se salta 40', () => {
    expect(getPrismaSkip(3, 20)).toBe(40);
  });
});
