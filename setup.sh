#!/bin/sh

set -eu

echo "Menjalankan setup project Tara Plastic POS..."

if [ ! -f package.json ]; then
  npm create vite@latest . -- --template react-ts
fi

npm install react@18 react-dom@18 @supabase/supabase-js react-router-dom@6 zustand react-hook-form @hookform/resolvers zod recharts react-to-print xlsx date-fns
npm install -D tailwindcss@3 postcss autoprefixer @types/node @types/react@18 @types/react-dom@18

if [ ! -f tailwind.config.js ] || [ ! -f postcss.config.js ]; then
  npx tailwindcss init -p
fi

if [ ! -f supabase/config.toml ]; then
  supabase init
fi

echo "Setup selesai. Jalankan 'supabase start' lalu isi VITE_SUPABASE_ANON_KEY di .env.local."
