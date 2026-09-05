const VERSAO_CACHE = "v1";

/** Chave namespaced por recurso + escopo (normalmente o id do usuário —
 * nunca compartilhar cache entre usuários diferentes no mesmo navegador). */
export function chaveCache(recurso: string, escopo: string): string {
  return `rankcrm:cache:${VERSAO_CACHE}:${recurso}:${escopo}`;
}

export function salvarCache<T>(chave: string, valor: T): void {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    // localStorage indisponível/cheio (modo privado etc.) — cache é só
    // otimização de carregamento, não afeta a funcionalidade se falhar.
  }
}

export function lerCache<T>(chave: string): T | null {
  try {
    const bruto = localStorage.getItem(chave);
    if (!bruto) return null;
    return JSON.parse(bruto) as T;
  } catch {
    return null;
  }
}