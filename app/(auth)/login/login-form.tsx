'use client'

import { useFormState } from 'react-dom'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { login, type LoginState } from '@/lib/auth-actions'
import { useFormStatus } from 'react-dom'
import { Eye, EyeOff } from 'lucide-react'

import { Input } from '@/components/ui/input'

function SubmitButton({ isRedirecting }: { isRedirecting: boolean }) {
  const { pending } = useFormStatus()
  const disabled = pending || isRedirecting
  return (
    <button
      type="submit"
      disabled={disabled}
      className="w-full rounded-lg bg-amikom-purple px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-amikom-purple-hover hover:text-amikom-jonquil-warm active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? 'Masuk...' : isRedirecting ? 'Mengalihkan...' : 'Masuk'}
    </button>
  )
}

export default function LoginForm() {
  const router = useRouter()
  const initialState: LoginState = { error: null, redirectTo: null }
  const [state, formAction] = useFormState(login, initialState)
  const [showPassword, setShowPassword] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    if (state?.redirectTo) {
      setIsRedirecting(true)
      router.push(state.redirectTo)
    }
  }, [state?.redirectTo, router])

  return (
    <form action={formAction}>
      <div className="flex flex-col gap-6">
        <div className="grid gap-2">
          <label
            htmlFor="email"
            className="text-sm font-medium leading-none text-[#1A1A1E]"
          >
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="email@amikomsolo.ac.id"
            required
            className="rounded-lg border-[#E8E8ED] bg-white text-[#1A1A1E] placeholder:text-[#8E8E93] focus-visible:ring-amikom-purple/20"
          />
        </div>

        <div className="grid gap-2">
          <label
            htmlFor="password"
            className="text-sm font-medium leading-none text-[#1A1A1E]"
          >
            Kata Sandi
          </label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Masukkan kata sandi Anda"
              required
              className="rounded-lg border-[#E8E8ED] bg-white pr-10 text-[#1A1A1E] placeholder:text-[#8E8E93] focus-visible:ring-amikom-purple/20"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8E8E93] hover:text-[#1A1A1E] transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {state?.error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {state.error}
          </div>
        )}

        <SubmitButton isRedirecting={isRedirecting} />
      </div>
    </form>
  )
}
