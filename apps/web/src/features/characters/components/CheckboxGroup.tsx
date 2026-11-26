"use client";

interface CheckboxOption {
  value: string;
  label: string;
  lang?: string;
}

interface CheckboxGroupProps {
  legend: string;
  /** Consigne et compteur, annoncés avec la légende. */
  hint: string;
  options: CheckboxOption[];
  selected: readonly string[];
  max: number;
  onChange: (selected: string[]) => void;
}

/** Choix multiple limité : une fois le maximum atteint, les autres cases sont désactivées. */
export function CheckboxGroup({
  legend,
  hint,
  options,
  selected,
  max,
  onChange,
}: CheckboxGroupProps) {
  const hintId = `${legend.replace(/\W+/g, "-").toLowerCase()}-hint`;
  const isFull = selected.length >= max;
  return (
    <fieldset aria-describedby={hintId}>
      <legend className="text-lg font-semibold">{legend}</legend>
      <p id={hintId} className="text-slate-700">
        {hint} ({selected.length} sur {max})
      </p>
      <ul className="mt-2 grid gap-1 sm:grid-cols-2">
        {options.map((option) => {
          const isChecked = selected.includes(option.value);
          return (
            <li key={option.value}>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isChecked}
                  disabled={!isChecked && isFull}
                  onChange={() =>
                    onChange(
                      isChecked
                        ? selected.filter((value) => value !== option.value)
                        : [...selected, option.value],
                    )
                  }
                />
                <span lang={option.lang}>{option.label}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}
