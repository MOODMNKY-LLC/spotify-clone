# Full Stack Spotify Clone

Explore this extensive tutorial to develop a complete Spotify clone from scratch using the latest in web development technologies. This project demonstrates the creation of a sleek, dynamic, and responsive UI, robust backend functionalities, and a seamless payment system using Stripe.

## Features

- **Song Upload**: Upload and manage your music files with ease.

- **Stripe Integration**: Enable premium subscriptions within the application using Stripe for payment processing.

- **Database Handling**: Learn to set up a Supabase project, create database schemas, and manage data with PostgreSQL.

- **Sleek User Interface**: Using Tailwind CSS, create a UI that closely resembles Spotify's sleek design.

- **Responsiveness**: This application is fully responsive and compatible with all devices.

- **Authentication**: Secure user registration and login processes with Supabase.

- **GitHub Authentication Integration**: Enable secure login using Github authentication.

- **File/Image Upload**: Upload files and images using Supabase storage.

- **Form Validation**: Efficient client form validation and handling using react-hook-form.

- **Error Handling**: Smooth server error handling with react-toast.

- **Audio Playback**: Enable song playback within the application.

- **Favorites System**: Users can mark songs as favorites.

- **Playlists / Liked Songs System**: Create and manage song playlists.

- **Advanced Player Component**: Explore the functionality of an advanced music player component.

- **Stripe Recurring Payment Integration**: Manage recurring payments and subscriptions using Stripe.

- **POST, GET, and DELETE Routes**: Learn to write and manage these crucial routes in route handlers (app/api).

- **Data Fetching**: Master fetching data in server React components by directly accessing the database without API, like magic!

- **Handling Relations**: Handle relations between Server and Child components in a real-time environment.

- **Cancelling Stripe Subscriptions**: Learn how to cancel Stripe subscriptions within the application.

## Getting Started

This project uses **pnpm**. Install dependencies and run the dev server:

```bash
pnpm install
pnpm dev
```

Other commands: `pnpm build`, `pnpm start`, `pnpm lint`.

### Environment variables

- **Local:** Copy `.env.example` to `.env.local` and fill in values (Supabase, Stripe, Spotify, Navidrome, etc.).
- **Production (Vercel):** Use the checklist in [docs/ENV_VERCEL.md](docs/ENV_VERCEL.md) to set the same variables in Vercel → Project → Settings → Environment Variables.

### Stripe subscription setup

1. Add Stripe keys to `.env.local` (from [Stripe Dashboard](https://dashboard.stripe.com/apikeys)).
2. Run the one-time setup to create the Premium product and a recurring monthly price (and optionally sync to Supabase):

   ```bash
   pnpm run stripe:setup
   ```

3. Register the webhook in Stripe: **Developers → Webhooks → Add endpoint**
   - **URL:** `https://your-domain.com/api/webhooks` (or for local testing use [Stripe CLI](https://stripe.com/docs/stripe-cli): `stripe listen --forward-to localhost:3000/api/webhooks`)
   - **Events:** `product.created`, `product.updated`, `price.created`, `price.updated`, `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy the signing secret into `.env.local` as `STRIPE_WEBHOOK_SECRET`.

## Built With

- Next.js 15
- React
- Tailwind CSS
- Supabase
- PostgreSQL
- Stripe
- react-hook-form
- react-toast

## License

This project is licensed under the terms of the MIT license.

## Contributions

Contributions, issues, and feature requests are welcome!

## Get in Touch

<b>Email: </b> tech@allanswebwork.info <br/>
<b>LinkedIn: </b> [https://www.linkedin.com/in/allanhillman/](https://www.linkedin.com/in/allanhillman/)  <br/>
<b>Website: </b> [https://allanhillman.com](https://allanhillman.com/)
