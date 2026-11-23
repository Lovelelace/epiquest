import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Les paquets du monorepo sont compilés dans dist/ : rien à transpiler ici.
  reactStrictMode: true,
  // Next.js ne génère pas de fichier AGENTS.md au lancement (à réactiver si vous le souhaitez).
  agentRules: false,
};

export default nextConfig;
