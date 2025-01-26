/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['ypdpgnrybnobsvgjjygc.supabase.co'], // Замініть на ваш домен Supabase
  }
}

module.exports = nextConfig 