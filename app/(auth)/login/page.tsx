import Link from 'next/link'
import Image from 'next/image'
import LoginForm from './login-form'

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-[#FAFBFC] p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2">
            <Link
              href="/"
              className="flex flex-col items-center gap-2 font-medium"
            >
              <div className="flex items-center justify-center">
                <Image
                  src="/logo-amikom-surakarta-1.png"
                  alt="Logo STMIK AMIKOM Surakarta"
                  width={64}
                  height={64}
                  className="h-16 w-auto"
                />
              </div>
              <span className="sr-only">STMIK AMIKOM Surakarta</span>
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-[#1A1A1E]">
              Selamat Datang Kembali!
            </h1>
            <div className="text-center text-sm text-[#5A5A6E]">
               Portal Alumni & Karir STMIK AMIKOM Surakarta
            </div>
          </div>

          <LoginForm />

          <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-[#E8E8ED]">
            <span className="relative z-10 bg-[#FAFBFC] px-2 text-[#8E8E93]">
              Atau
            </span>
          </div>

          <div className="grid gap-2 text-center text-sm text-[#5A5A6E]">
            <p>
              Hubungi admin kami{' '}
              <span className="font-medium text-[#1A1A1E]">Super Admin</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
