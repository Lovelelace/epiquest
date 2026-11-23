import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold">EpiQuest</h1>
      <p className="mt-4 text-lg">
        Table de jeu de rôle virtuelle compatible 5e édition. Le produit est en construction.
      </p>
      <p className="mt-6">
        <Link href="/personnages/nouveau" className="text-blue-800 underline">
          Créer un personnage
        </Link>
      </p>
    </main>
  );
}
