import { visit } from "unist-util-visit";
import type { Root, Table, TableCell } from "mdast";

/**
 * Marque la première cellule de chaque ligne de corps de tableau comme un en-tête de ligne
 * (`data.hName = "th"`, `scope="row"`), pour que le rendu MDX reste accessible sans
 * réécrire chaque tableau du contenu pédagogique en HTML.
 */
export function remarkRowHeaders() {
  return (tree: Root) => {
    visit(tree, "table", (table: Table) => {
      const [, ...bodyRows] = table.children;
      for (const row of bodyRows) {
        const first = row.children[0] as TableCell | undefined;
        if (!first) continue;
        first.data = { ...first.data, hName: "th", hProperties: { scope: "row" } };
      }
    });
  };
}
