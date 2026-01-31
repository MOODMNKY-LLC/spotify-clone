import Image from 'next/image'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'

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
          <CardTitle className="text-2xl text-white">Thank you for signing up!</CardTitle>
          <CardDescription className="text-neutral-400">Your account has been created</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-neutral-400">
            You can now sign in with your email and password. Email confirmation is disabled
            for local development, so you're ready to go.
          </p>
          <Button asChild className="w-full bg-emerald-500 hover:bg-emerald-400 text-black">
            <Link href="/auth/login">Sign in</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
