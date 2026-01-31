import Image from 'next/image'
import { ForgotPasswordForm } from '@/components/forgot-password-form'
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
          <CardTitle className="text-2xl text-white">Reset your password</CardTitle>
          <CardDescription className="text-neutral-400">
            Type in your email and we&apos;ll send you a link to reset your password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ForgotPasswordForm embedded />
        </CardContent>
      </Card>
    </div>
  )
}
