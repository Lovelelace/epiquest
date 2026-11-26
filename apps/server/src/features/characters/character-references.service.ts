import { Injectable } from "@nestjs/common";
import { SrdService } from "../srd/srd.service.js";
import type { CharacterReferences } from "./character-builder.js";
import { mapClass, mapSpecies, type SrdEntry } from "./srd-mapping.js";

export interface CharacterSlugs {
  speciesSlug: string;
  classSlug: string;
  backgroundSlug: string;
  subclassSlug: string | null;
}

function byName(entries: SrdEntry[]): Map<string, SrdEntry> {
  return new Map(entries.map((entry) => [entry.slug, entry]));
}

/** Charge depuis le SRD les données nécessaires pour calculer la fiche d'un personnage. */
@Injectable()
export class CharacterReferencesService {
  constructor(private readonly srd: SrdService) {}

  async entry(
    entity: "species" | "classes" | "backgrounds" | "subclasses",
    slug: string,
  ): Promise<SrdEntry> {
    const detail = await this.srd.get(entity, slug);
    return { slug: detail.slug, name: detail.name, data: detail.data };
  }

  async load(slugs: CharacterSlugs): Promise<CharacterReferences> {
    const [species, characterClass, background, subclass, spells, items] = await Promise.all([
      this.entry("species", slugs.speciesSlug),
      this.entry("classes", slugs.classSlug),
      this.entry("backgrounds", slugs.backgroundSlug),
      slugs.subclassSlug ? this.entry("subclasses", slugs.subclassSlug) : null,
      this.srd.listDetails("spells", { class: slugs.classSlug }),
      this.srd.listDetails("items", { kind: "equipment" }),
    ]);
    const race = species.data.race;
    const parentSlug =
      typeof race === "object" && race !== null && "index" in race && typeof race.index === "string"
        ? race.index
        : null;
    const parent = parentSlug ? await this.entry("species", parentSlug) : null;
    return {
      species,
      speciesData: mapSpecies(species, parent).species,
      characterClass,
      classData: mapClass(characterClass).classData,
      background,
      subclass,
      spells: byName(spells),
      items: byName(items),
    };
  }
}
