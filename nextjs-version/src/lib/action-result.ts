/**
 * Em build de produção, o Next.js troca a mensagem de qualquer erro que
 * "escape" de uma Server Action por um texto genérico (fica só um
 * "digest"), pra evitar vazar detalhes internos sem querer. Isso também
 * derruba as nossas mensagens de validação, que são pra aparecer mesmo.
 *
 * A solução (documentada pelo próprio Next: "model expected errors as
 * return values") é nunca deixar o erro escapar — cada Server Action
 * exportada roda dentro de `executarAction`, que converte qualquer `throw`
 * (inclusive de helpers internos, tipo `exigirAdmin`) num valor de retorno
 * normal. Quem chama checa `resultado.ok` em vez de usar try/catch.
 */
export type ActionResult<T = void> = { ok: true; data: T } | { ok: false; erro: string };

export async function executarAction<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    return { ok: true, data };
  } catch (err) {
    return { ok: false, erro: err instanceof Error ? err.message : "Erro inesperado." };
  }
}