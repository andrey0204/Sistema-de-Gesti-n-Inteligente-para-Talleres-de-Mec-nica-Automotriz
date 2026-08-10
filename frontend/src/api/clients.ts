import http from '@/lib/http'
import type { ApiPaginatedResponse, ApiSuccessResponse, PaginationMeta } from '@/types/api'
import type { Client, DocumentType } from '@/types/models'

export interface ListClientsParams {
  page?: number
  limit?: number
  search?: string
}

export interface CreateClientPayload {
  fullName: string
  phone: string
  documentType: DocumentType
  documentNumber: string
  /** Opcionales: se omiten si están vacíos (el backend no acepta cadena vacía). */
  email?: string
  address?: string
  notes?: string
}

/** En edición sí se admite `null` para limpiar un campo opcional. */
export type UpdateClientPayload = Partial<{
  fullName: string
  phone: string
  documentType: DocumentType
  documentNumber: string
  email: string | null
  address: string | null
  notes: string | null
}>

export interface ClientList {
  clients: Client[]
  meta: PaginationMeta
}

export async function listClients(params: ListClientsParams = {}): Promise<ClientList> {
  const { data } = await http.get<ApiPaginatedResponse<Client>>('/clients', { params })
  return { clients: data.data, meta: data.meta }
}

export async function getClient(id: number): Promise<Client> {
  const { data } = await http.get<ApiSuccessResponse<Client>>(`/clients/${id}`)
  return data.data
}

export async function createClient(payload: CreateClientPayload): Promise<Client> {
  const { data } = await http.post<ApiSuccessResponse<Client>>('/clients', payload)
  return data.data
}

export async function updateClient(id: number, payload: UpdateClientPayload): Promise<Client> {
  const { data } = await http.patch<ApiSuccessResponse<Client>>(`/clients/${id}`, payload)
  return data.data
}

export async function deleteClient(id: number): Promise<void> {
  await http.delete(`/clients/${id}`)
}
