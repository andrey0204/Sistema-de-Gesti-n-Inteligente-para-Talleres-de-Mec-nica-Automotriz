import { describe, it, expect } from 'vitest';
import { AppError } from '../../src/shared/utils/app-error';

describe('AppError', () => {
  it('sigue siendo un Error nativo pese a extender una clase', () => {
    // Object.setPrototypeOf en el constructor existe justamente para que este
    // instanceof funcione al compilar a ES5/CommonJS. Si alguien lo quita, el
    // error-handler dejaría de reconocer los errores y todo saldría como 500.
    const error = AppError.notFound();
    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(Error);
  });

  it('guarda código y estado del constructor genérico', () => {
    const error = new AppError(418, 'Soy una tetera', 'TEAPOT', { rfc: 2324 });
    expect(error.statusCode).toBe(418);
    expect(error.message).toBe('Soy una tetera');
    expect(error.code).toBe('TEAPOT');
    expect(error.details).toEqual({ rfc: 2324 });
  });

  it('usa INTERNAL_ERROR como código por defecto', () => {
    expect(new AppError(500, 'Ups').code).toBe('INTERNAL_ERROR');
  });

  it.each([
    ['badRequest', AppError.badRequest('x'), 400, 'BAD_REQUEST'],
    ['unauthorized', AppError.unauthorized(), 401, 'UNAUTHORIZED'],
    ['forbidden', AppError.forbidden(), 403, 'FORBIDDEN'],
    ['notFound', AppError.notFound(), 404, 'NOT_FOUND'],
    ['conflict', AppError.conflict('x'), 409, 'CONFLICT'],
    ['validationError', AppError.validationError('x'), 422, 'VALIDATION_ERROR'],
  ])('%s produce %i con el código correcto', (_name, error, statusCode, code) => {
    expect(error.statusCode).toBe(statusCode);
    expect(error.code).toBe(code);
  });

  it('las factorías sin argumentos traen un mensaje por defecto', () => {
    expect(AppError.unauthorized().message).toBe('Unauthorized');
    expect(AppError.forbidden().message).toBe('Forbidden');
    expect(AppError.notFound().message).toBe('Resource not found');
  });

  it('deja pasar los details a las factorías que los aceptan', () => {
    const details = [{ field: 'body.email', message: 'Invalid email address' }];
    expect(AppError.validationError('Validation failed', details).details).toEqual(details);
  });
});
