<script setup lang="ts">
import { computed, watch } from 'vue'
import { useForm } from 'vee-validate'
import { z } from 'zod'
import BaseModal from '@/components/BaseModal.vue'
import { createUser, updateUser, type UpdateUserPayload } from '@/api/users'
import { getErrorCode, getErrorMessage, getFieldErrors } from '@/lib/http'
import { toTypedSchema } from '@/lib/zod-form'
import { roleLabels } from '@/lib/labels'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import type { Role, User } from '@/types/models'

const MIN_PASSWORD_LENGTH = 8

const props = defineProps<{
  open: boolean
  /** `null` para crear; un usuario para editar. */
  user: User | null
}>()

const emit = defineEmits<{ close: []; saved: [] }>()

const toast = useToast()
const auth = useAuthStore()

const isEditing = computed(() => props.user !== null)

/**
 * Cambiarse el rol a uno mismo sería perder el acceso a esta sección en el acto,
 * así que el selector se bloquea sobre la propia cuenta. El backend no lo impide.
 */
const isOwnAccount = computed(() => props.user !== null && props.user.id === auth.user?.id)

/**
 * La contraseña es obligatoria al crear y opcional al editar: dejarla vacía
 * conserva la actual, porque el backend solo la re-cifra si viene en el payload.
 */
const validationSchema = computed(() =>
  toTypedSchema(
    z.object({
      fullName: z.string().trim().min(1, 'El nombre es obligatorio'),
      email: z.email('Correo electrónico inválido'),
      role: z.enum(['ADMIN', 'RECEPTIONIST', 'MECHANIC'], { error: 'Selecciona un rol' }),
      password: isEditing.value
        ? z.union([
            z.literal(''),
            z.string().min(MIN_PASSWORD_LENGTH, `Mínimo ${MIN_PASSWORD_LENGTH} caracteres`),
          ])
        : z.string().min(MIN_PASSWORD_LENGTH, `Mínimo ${MIN_PASSWORD_LENGTH} caracteres`),
    }),
  ),
)

type UserFormValues = {
  fullName: string
  email: string
  role: Role
  password: string
}

function toFormValues(user: User | null): UserFormValues {
  return {
    fullName: user?.fullName ?? '',
    email: user?.email ?? '',
    role: user?.role ?? 'MECHANIC',
    // Nunca se precarga: el backend no devuelve la contraseña (ni cifrada).
    password: '',
  }
}

const { handleSubmit, errors, defineField, setErrors, resetForm, isSubmitting } = useForm({
  validationSchema,
  initialValues: toFormValues(null),
})

const [fullName, fullNameAttrs] = defineField('fullName')
const [email, emailAttrs] = defineField('email')
const [role, roleAttrs] = defineField('role')
const [password, passwordAttrs] = defineField('password')

// Al abrir se recarga el formulario: evita arrastrar datos del usuario anterior.
watch(
  () => props.open,
  (open) => {
    if (open) resetForm({ values: toFormValues(props.user) })
  },
  { immediate: true },
)

const onSubmit = handleSubmit(async (values) => {
  try {
    if (props.user) {
      const payload: UpdateUserPayload = {
        fullName: values.fullName,
        email: values.email,
      }
      // Solo se manda lo que de verdad cambia: una contraseña vacía significa
      // «déjala como está», y el rol propio no se puede tocar.
      if (values.password) payload.password = values.password
      if (!isOwnAccount.value) payload.role = values.role

      await updateUser(props.user.id, payload)
      toast.success('Usuario actualizado correctamente')
    } else {
      await createUser({
        fullName: values.fullName,
        email: values.email,
        role: values.role,
        password: values.password,
      })
      toast.success('Usuario creado correctamente')
    }

    emit('saved')
  } catch (error) {
    if (getErrorCode(error) === 'CONFLICT') {
      setErrors({ email: 'Ya existe un usuario con este correo' })
      return
    }

    const fieldErrors = getFieldErrors(error)
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      return
    }

    toast.error(getErrorMessage(error, 'No se pudo guardar el usuario'))
  }
})
</script>

<template>
  <BaseModal
    :open="open"
    :title="isEditing ? 'Editar usuario' : 'Nuevo usuario'"
    @close="emit('close')"
  >
    <form class="mt-4 flex flex-col gap-3" novalidate @submit="onSubmit">
      <div class="form-control">
        <label class="label" for="userFullName">
          <span class="label-text">Nombre completo *</span>
        </label>
        <input
          id="userFullName"
          v-model="fullName"
          v-bind="fullNameAttrs"
          type="text"
          class="input input-bordered w-full"
          :class="{ 'input-error': errors.fullName }"
        />
        <p v-if="errors.fullName" class="mt-1 text-sm text-error">{{ errors.fullName }}</p>
      </div>

      <div class="form-control">
        <label class="label" for="userEmail">
          <span class="label-text">Correo electrónico *</span>
        </label>
        <input
          id="userEmail"
          v-model="email"
          v-bind="emailAttrs"
          type="email"
          autocomplete="off"
          class="input input-bordered w-full"
          :class="{ 'input-error': errors.email }"
        />
        <p v-if="errors.email" class="mt-1 text-sm text-error">{{ errors.email }}</p>
      </div>

      <div class="form-control">
        <label class="label" for="userRole">
          <span class="label-text">Rol *</span>
        </label>
        <select
          id="userRole"
          v-model="role"
          v-bind="roleAttrs"
          class="select select-bordered w-full"
          :class="{ 'select-error': errors.role }"
          :disabled="isOwnAccount"
        >
          <option v-for="(label, value) in roleLabels" :key="value" :value="value">
            {{ label }}
          </option>
        </select>
        <p v-if="isOwnAccount" class="mt-1 text-sm opacity-70">
          No puedes cambiar tu propio rol: perderías el acceso a esta sección.
        </p>
        <p v-else-if="errors.role" class="mt-1 text-sm text-error">{{ errors.role }}</p>
      </div>

      <div class="form-control">
        <label class="label" for="userPassword">
          <span class="label-text">
            {{ isEditing ? 'Nueva contraseña' : 'Contraseña *' }}
          </span>
        </label>
        <input
          id="userPassword"
          v-model="password"
          v-bind="passwordAttrs"
          type="password"
          autocomplete="new-password"
          class="input input-bordered w-full"
          :class="{ 'input-error': errors.password }"
        />
        <p v-if="errors.password" class="mt-1 text-sm text-error">{{ errors.password }}</p>
        <p v-else class="mt-1 text-sm opacity-70">
          {{
            isEditing
              ? 'Déjala vacía para conservar la contraseña actual.'
              : `Mínimo ${MIN_PASSWORD_LENGTH} caracteres.`
          }}
        </p>
      </div>

      <div class="modal-action">
        <button type="button" class="btn btn-ghost" :disabled="isSubmitting" @click="emit('close')">
          Cancelar
        </button>
        <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
          <span v-if="isSubmitting" class="loading loading-spinner loading-sm"></span>
          {{ isEditing ? 'Guardar cambios' : 'Crear usuario' }}
        </button>
      </div>
    </form>
  </BaseModal>
</template>
