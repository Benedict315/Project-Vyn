# Project Vyn

Project Vyn is a Vite + React application backed by Supabase and Stellar/Soroban contract calls.

## Getting Started

1. Copy `.env.example` to `.env.local`.
2. Fill in the variables described below.
3. Install dependencies with `npm install`.
4. Start the app with `npm run dev`.

## Environment Variables

The project uses the following variables:

- `VITE_SUPABASE_PROJECT_ID`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `PUBLIC_KEY_ADMIN`
- `SECRET_KEY_ADMIN`
- `NFT_CONTRACT_ID`
- `VITE_LENDING_CONTRACT_ID`
- `PORT`

`VERCEL_OIDC_TOKEN` is created by Vercel for deployment workflows and is not required for normal local development.

## How To Get Each Value

### Supabase values

1. Open your project in the Supabase dashboard.
2. Go to Project Settings > General and copy the Project ID for `VITE_SUPABASE_PROJECT_ID`.
3. Go to Project Settings > API.
4. Copy the Project URL into `VITE_SUPABASE_URL`.
5. Copy the `anon` / publishable key into `VITE_SUPABASE_PUBLISHABLE_KEY`.

### Stellar admin keys

1. Create or reuse a dedicated Stellar testnet account for backend operations.
2. Copy the account secret into `SECRET_KEY_ADMIN`.
3. Derive the matching public key from that account and place it in `PUBLIC_KEY_ADMIN`.
4. Keep the secret out of version control. Use `.env.local` only.

### Contract IDs

1. Deploy the NFT contract to Soroban testnet.
2. Copy the contract ID from the deployment output into `NFT_CONTRACT_ID`.
3. Deploy the lending contract to Soroban testnet.
4. Copy that contract ID into `VITE_LENDING_CONTRACT_ID`.
5. If you redeploy either contract, update the value in `.env.local`.

### Local port

1. Use `PORT=3000` if you need a predictable local port.
2. If your environment already uses another port, you can change it.

## Notes For Collaborators

- Do not commit `.env.local`.
- Use `.env.example` as the reference for required variables.
- `PUBLIC_KEY_ADMIN` and `SECRET_KEY_ADMIN` must belong to the same account.
- Contract IDs are environment-specific and may change after redeployments.
