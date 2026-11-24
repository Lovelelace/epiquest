import Link from "next/link";
import { DEMO_CAMPAIGN_ID } from "@/features/table";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold">EpiQuest</h1>
      <p className="mt-4 text-lg">
        Table de jeu de rôle virtuelle compatible 5e édition. Le produit est en construction.
      </p>
      <p className="mt-6">
        <Link href={`/campagnes/${DEMO_CAMPAIGN_ID}/mj`} className="font-medium underline">
          Ouvrir la table de démonstration (vue MJ)
        </Link>
      </p>
    </main>
  );
}
