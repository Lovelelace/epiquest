import { CreationWizard } from "@/features/characters/components/CreationWizard";

export default async function DraftPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-3xl font-bold">Création de personnage</h1>
      <div className="mt-6">
        <CreationWizard draftId={id} />
      </div>
    </main>
  );
}
