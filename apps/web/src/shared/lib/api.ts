/** URL de base de l'API NestJS. Toutes les données passent par elle (Next.js ne contient aucune logique serveur). */
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
