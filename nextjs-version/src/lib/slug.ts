const COMBINING_MARKS_START = 0x0300;
const COMBINING_MARKS_END = 0x036f;

function removeCombiningMarks(texto: string): string {
  let resultado = "";
  for (const char of texto) {
    const code = char.codePointAt(0) ?? 0;
    if (code < COMBINING_MARKS_START || code > COMBINING_MARKS_END) {
      resultado += char;
    }
  }
  return resultado;
}

export function slugify(texto: string): string {
  return removeCombiningMarks(texto.normalize("NFD"))
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);
}