import http from '@/lib/http'
import type { ApiSuccessResponse } from '@/types/api'
import type { WorkOrderImage } from '@/types/models'

/**
 * Imágenes de una orden. Subir está permitido a los tres roles; borrar, solo a
 * ADMIN. El campo `path` que devuelve el backend es la ruta en su disco, así
 * que la URL pública se arma con `imageUrl()` a partir de `filename`.
 */

const uploadsUrl = import.meta.env.VITE_UPLOADS_URL ?? 'http://localhost:3000/uploads'

export function imageUrl(image: WorkOrderImage): string {
  return `${uploadsUrl}/${image.filename}`
}

export async function listImages(workOrderId: number): Promise<WorkOrderImage[]> {
  const { data } = await http.get<ApiSuccessResponse<WorkOrderImage[]>>(
    `/work-orders/${workOrderId}/images`,
  )
  return data.data
}

/** El backend espera `multipart/form-data` con el archivo en el campo `image`. */
export async function uploadImage(workOrderId: number, file: File): Promise<WorkOrderImage> {
  const formData = new FormData()
  formData.append('image', file)

  const { data } = await http.post<ApiSuccessResponse<WorkOrderImage>>(
    `/work-orders/${workOrderId}/images`,
    formData,
  )
  return data.data
}

export async function deleteImage(workOrderId: number, id: number): Promise<void> {
  await http.delete(`/work-orders/${workOrderId}/images/${id}`)
}
