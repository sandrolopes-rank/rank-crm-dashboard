import { formatarData, formatarMoeda, formatarNumero } from "@/lib/format";
import type { OportunidadeColuna } from "@/lib/types/oportunidades";

export function renderizarValorOportunidade(
  coluna: OportunidadeColuna,
  valor: number | string | null
): string {
  if (valor === null || valor === undefined || valor === "") return "—";

  switch (coluna.tipo) {
    case "monetario":
      return formatarMoeda(Number(valor));
    case "calculo":
      return typeof valor === "number" ? formatarNumero(valor) : "—";
    case "data":
      return formatarData(String(valor));
    case "select": {
      const opcoes = (coluna.config as { opcoes?: { id: string; label: string }[] }).opcoes ?? [];
      return opcoes.find((o) => o.id === valor)?.label ?? "—";
    }
    default:
      return String(valor);
  }
}