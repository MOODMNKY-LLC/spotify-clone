import Image from 'next/image'
import { LoginForm } from '@/components/login-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-background p-6 md:p-10">
      <Card className="w-full max-w-sm border-neutral-700 bg-neutral-800">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <Image
              src="/images/mnky-muzik-app-icon.png"
              alt="MNKY MUZIK"
              width={80}
              height={80}
              className="rounded-xl"
            />
          </div>
          <CardTitle className="text-2xl text-white">Welcome back</CardTitle>
          <CardDescription className="text-neutral-400">Sign in to your account to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm embedded />
        </CardContent>
      </Card>
    </div>
  )
}
