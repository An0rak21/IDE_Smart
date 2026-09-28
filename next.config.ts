import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Le contenu pédagogique est lu depuis le disque au runtime (fs), pas via import :
  // sans ceci, le traçage de fichiers de Vercel n'embarque pas /content dans le bundle serverless.
  outputFileTracingIncludes: {
    "/**": ["./content/**"],
  },
};

export default nextConfig;
