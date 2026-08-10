<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useForm } from 'vee-validate'
import { z } from 'zod'
import { toTypedSchema } from '@/lib/zod-form'
import { getErrorMessage, getFieldErrors } from '@/lib/http'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const serverError = ref('')

const validationSchema = toTypedSchema(
  z.object({
    email: z.email('Correo electrónico inválido'),
    password: z.string().min(1, 'La contraseña es obligatoria'),
  }),
)

const { handleSubmit, errors, defineField, setErrors, isSubmitting } = useForm({
  validationSchema,
  initialValues: { email: '', password: '' },
})

const [email, emailAttrs] = defineField('email')
const [password, passwordAttrs] = defineField('password')

const onSubmit = handleSubmit(async (values) => {
  serverError.value = ''
  try {
    await auth.login(values)
    const redirect = route.query.redirect
    await router.push(typeof redirect === 'string' ? redirect : { name: 'dashboard' })
  } catch (error) {
    const fieldErrors = getFieldErrors(error)
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
    } else {
      serverError.value = getErrorMessage(error, 'No se pudo iniciar sesión')
    }
  }
})
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-base-200 p-4">
    <div class="card w-full max-w-md bg-base-100 shadow-xl">
      <div class="card-body">
        <div class="mb-2 text-center">
          <div class="text-4xl">🔧</div>
          <h1 class="mt-2 text-2xl font-bold">Taller Mecánico</h1>
          <p class="text-sm opacity-60">Ingresa con tu cuenta para continuar</p>
        </div>

        <div v-if="serverError" role="alert" class="alert alert-error">
          <span>{{ serverError }}</span>
        </div>

        <form class="mt-2 flex flex-col gap-3" novalidate @submit="onSubmit">
          <div class="form-control">
            <label class="label" for="email">
              <span class="label-text">Correo electrónico</span>
            </label>
            <input
              id="email"
              v-model="email"
              v-bind="emailAttrs"
              type="email"
              autocomplete="email"
              placeholder="admin@workshop.com"
              class="input input-bordered w-full"
              :class="{ 'input-error': errors.email }"
            />
            <p v-if="errors.email" class="mt-1 text-sm text-error">{{ errors.email }}</p>
          </div>

          <div class="form-control">
            <label class="label" for="password">
              <span class="label-text">Contraseña</span>
            </label>
            <input
              id="password"
              v-model="password"
              v-bind="passwordAttrs"
              type="password"
              autocomplete="current-password"
              placeholder="••••••••"
              class="input input-bordered w-full"
              :class="{ 'input-error': errors.password }"
            />
            <p v-if="errors.password" class="mt-1 text-sm text-error">{{ errors.password }}</p>
          </div>

          <button type="submit" class="btn btn-primary mt-2" :disabled="isSubmitting">
            <span v-if="isSubmitting" class="loading loading-spinner loading-sm"></span>
            {{ isSubmitting ? 'Ingresando…' : 'Ingresar' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
