import * as clientsRepository from './clients.repository';
import { CreateClientInput, UpdateClientInput } from './clients.validator';
import { AppError } from '../../shared/utils/app-error';
import { getPaginationParams, buildPaginationMeta, getPrismaSkip } from '../../shared/types/pagination';

export async function list(query: { page?: string; limit?: string; search?: string }) {
  const { page, limit } = getPaginationParams(query);

  const { clients, total } = await clientsRepository.findMany({
    skip: getPrismaSkip(page, limit),
    take: limit,
    search: query.search,
  });

  return { clients, meta: buildPaginationMeta(page, limit, total) };
}

export async function getById(id: number) {
  const client = await clientsRepository.findById(id);
  if (!client) throw AppError.notFound('Client not found');
  return client;
}

export async function create(data: CreateClientInput) {
  const existing = await clientsRepository.findByDocumentNumber(data.documentNumber);
  if (existing && !existing.deletedAt) {
    throw AppError.conflict('A client with this document number already exists');
  }

  return clientsRepository.create(data);
}

export async function update(id: number, data: UpdateClientInput) {
  const client = await clientsRepository.findById(id);
  if (!client) throw AppError.notFound('Client not found');

  if (data.documentNumber && data.documentNumber !== client.documentNumber) {
    const existing = await clientsRepository.findByDocumentNumber(data.documentNumber);
    if (existing && !existing.deletedAt) {
      throw AppError.conflict('A client with this document number already exists');
    }
  }

  return clientsRepository.update(id, data);
}

export async function remove(id: number) {
  const client = await clientsRepository.findById(id);
  if (!client) throw AppError.notFound('Client not found');
  return clientsRepository.softDelete(id);
}
