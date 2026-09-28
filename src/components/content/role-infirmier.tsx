import { Children, isValidElement, type ReactElement, type ReactNode } from "react";

function textOf(node: ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement(node)) return textOf((node.props as { children?: ReactNode }).children);
  return "";
}

// Regroupe les enfants MDX en sections, une par titre `###` (Avant / Pendant / Éducation).
function splitSections(children: ReactNode) {
  const sections: { title: string; content: ReactNode[] }[] = [];
  for (const child of Children.toArray(children)) {
    if (isValidElement(child) && (child as ReactElement).type === "h3") {
      sections.push({ title: textOf(child), content: [] });
      continue;
    }
    if (sections.length === 0) continue;
    sections[sections.length - 1].content.push(child);
  }
  return sections;
}

export function RoleInfirmier({ children }: { children: ReactNode }) {
  const sections = splitSections(children);
  return (
    <div className="my-6 rounded-xl border border-mint-line bg-white p-5">
      <p className="font-display text-lg font-medium text-ink">Rôle infirmier</p>
      <div className="mt-4 grid gap-6 sm:grid-cols-3">
        {sections.map((s) => (
          <div key={s.title}>
            <h3 className="text-sm font-bold uppercase tracking-wide text-teal">{s.title}</h3>
            <div className="mt-2 space-y-2 text-sm text-ink-soft [&_li]:mt-1 [&_ul]:list-disc [&_ul]:pl-5">
              {s.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
