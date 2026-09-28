const FORMATADOR_MOEDA = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const FORMATADOR_NUMERO = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 2,
});

export function formatarMoeda(valor: number): string {
  return FORMATADOR_MOEDA.format(valor);
}

export function formatarNumero(valor: number): string {
  return FORMATADOR_NUMERO.format(valor);
}

/** Espera uma data no formato "YYYY-MM-DD" (valor de um <input type="date">). */
export function formatarData(isoDate: string): string {
  const [ano, mes, dia] = isoDate.split("-");
  if (!ano || !mes || !dia) return isoDate;
  return `${dia}/${mes}/${ano}`;
}

/** Parte antes do "@" de um e-mail — evita expor o e-mail completo na UI. */
export function usuarioDoEmail(email: string | undefined | null): string | null {
  if (!email) return null;
  return email.split("@")[0];
}

/** Iniciais (1-2 letras) derivadas da parte local do e-mail, pra usar num avatar. */
export function iniciaisDoEmail(email: string | undefined | null): string {
  const usuario = usuarioDoEmail(email);
  if (!usuario) return "?";

  const segmentos = usuario.split(/[._-]+/).filter(Boolean);
  if (segmentos.length >= 2) {
    return (segmentos[0][0] + segmentos[1][0]).toUpperCase();
  }
  return usuario.slice(0, 2).toUpperCase();
}