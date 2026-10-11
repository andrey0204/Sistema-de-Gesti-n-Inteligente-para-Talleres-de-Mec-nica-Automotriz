import { describe, expect, it, vi } from 'vitest'
import type { WorkOrderImage } from '@/types/models'

vi.mock('@/lib/http', () => ({ default: {} }))
import { imageUrl } from '@/api/work-order-images'

const image = { filename: 'photo.png', path: '/uploads/photo.png' } as WorkOrderImage

describe('dirección pública de las fotografías', () => {
  it('mantiene la dirección de las fotografías locales', () => {
    expect(imageUrl(image)).toBe('http://localhost:3000/uploads/photo.png')
  })

  it('utiliza la URL HTTPS de Cloudinary sin añadir la dirección del backend', () => {
    const path = 'https://res.cloudinary.com/demo/image/upload/folder/photo.png'
    expect(imageUrl({ ...image, filename: 'folder/photo', path })).toBe(path)
  })

  it('no interpreta rutas del disco como direcciones públicas', () => {
    expect(imageUrl({ ...image, path: 'C:\\uploads\\photo.png' })).toBe('http://localhost:3000/uploads/photo.png')
  })
})
