"use client";

import type { SrdOption } from "../api";

interface OptionListProps {
  name: string;
  legend: string;
  options: SrdOption[];
  value: string | null;
  onChange: (slug: string) => void;
}

/** Choix unique parmi des options : boutons radio natifs, utilisables au clavier (flèches). */
export function OptionList({ name, legend, options, value, onChange }: OptionListProps) {
  return (
    <fieldset>
      <legend className="text-lg font-semibold">{legend}</legend>
      <ul className="mt-2 grid gap-2 sm:grid-cols-2">
        {options.map((option) => (
          <li key={option.slug}>
            <label className="flex cursor-pointer items-center gap-2 rounded border border-slate-400 px-3 py-2 has-[:checked]:border-blue-700 has-[:checked]:bg-blue-50 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-blue-700">
              <input
                type="radio"
                name={name}
                value={option.slug}
                checked={value === option.slug}
                onChange={() => onChange(option.slug)}
              />
              <span lang="en">{option.name}</span>
            </label>
          </li>
        ))}
      </ul>
    </fieldset>
  );
}
