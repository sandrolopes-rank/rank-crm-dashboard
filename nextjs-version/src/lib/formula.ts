import type { OportunidadeColuna, OportunidadeDados } from "@/lib/types/oportunidades";

const REFERENCIA_REGEX = /\{([a-z0-9_]+)\}/g;

export function extrairReferencias(formula: string): string[] {
  const referencias = new Set<string>();
  for (const match of formula.matchAll(REFERENCIA_REGEX)) {
    referencias.add(match[1]);
  }
  return [...referencias];
}

/** Tipos de coluna cujo valor pode ser usado numa fórmula. */
const TIPOS_NUMERICOS = new Set(["monetario", "calculo"]);

export interface ValidacaoFormula {
  valida: boolean;
  erro?: string;
}

/**
 * Valida sintaxe, referências e ausência de ciclos para a fórmula de uma
 * coluna do tipo "calculo". `colunaId` é `undefined` ao criar uma coluna
 * nova (ainda sem id).
 */
export function validarFormula(
  formula: string,
  colunaKey: string,
  todasColunas: OportunidadeColuna[]
): ValidacaoFormula {
  const texto = formula.trim();
  if (!texto) {
    return { valida: false, erro: "A fórmula não pode ficar vazia." };
  }

  const referencias = extrairReferencias(texto);
  if (referencias.length === 0) {
    return {
      valida: false,
      erro: "A fórmula precisa referenciar ao menos uma coluna, no formato {chave_da_coluna}.",
    };
  }

  const porKey = new Map(todasColunas.map((c) => [c.key, c]));

  for (const ref of referencias) {
    if (ref === colunaKey) {
      return { valida: false, erro: `A fórmula não pode referenciar a própria coluna ({${ref}}).` };
    }
    const coluna = porKey.get(ref);
    if (!coluna) {
      return { valida: false, erro: `A coluna "{${ref}}" não existe.` };
    }
    if (!TIPOS_NUMERICOS.has(coluna.tipo)) {
      return {
        valida: false,
        erro: `A coluna "${coluna.label}" ({${ref}}) não é numérica (tipo "${coluna.tipo}") e não pode ser usada em cálculos.`,
      };
    }
  }

  const ciclo = detectarCiclo(colunaKey, referencias, porKey);
  if (ciclo) {
    return {
      valida: false,
      erro: `Referência circular detectada: ${ciclo.join(" → ")}.`,
    };
  }

  try {
    const valoresFicticios = Object.fromEntries(referencias.map((r) => [r, 1]));
    avaliarFormula(texto, valoresFicticios);
  } catch {
    return { valida: false, erro: "A fórmula tem um erro de sintaxe." };
  }

  return { valida: true };
}

function detectarCiclo(
  origem: string,
  referenciasDiretas: string[],
  porKey: Map<string, OportunidadeColuna>
): string[] | null {
  function dfs(key: string, caminho: string[]): string[] | null {
    if (key === origem) {
      return [...caminho, key];
    }
    if (caminho.includes(key)) {
      // Ciclo entre colunas que não envolve `origem` — não deveria
      // acontecer (o grafo existente já foi validado nó a nó), mas evita
      // recursão infinita de qualquer forma.
      return null;
    }

    const coluna = porKey.get(key);
    if (!coluna || coluna.tipo !== "calculo") return null;

    const config = coluna.config as { formula?: string };
    if (!config.formula) return null;

    for (const proximaRef of extrairReferencias(config.formula)) {
      const encontrado = dfs(proximaRef, [...caminho, key]);
      if (encontrado) return encontrado;
    }
    return null;
  }

  for (const ref of referenciasDiretas) {
    const encontrado = dfs(ref, [origem]);
    if (encontrado) return encontrado;
  }
  return null;
}

/**
 * Resolve o valor "de exibição" de cada coluna para uma linha de
 * Oportunidade: valor bruto para tipos normais, resultado calculado (com
 * suporte a cálculo referenciando outro cálculo) para o tipo "calculo".
 * Assume que não há referência circular entre as colunas (garantido por
 * `validarFormula` no momento de criar/editar uma coluna).
 */
export function resolverValoresLinha(
  colunas: OportunidadeColuna[],
  dados: OportunidadeDados
): Record<string, number | string | null> {
  const porKey = new Map(colunas.map((c) => [c.key, c]));
  const cache = new Map<string, number | string | null>();

  function resolver(key: string): number | string | null {
    if (cache.has(key)) return cache.get(key) ?? null;

    const coluna = porKey.get(key);
    if (!coluna) return null;

    if (coluna.tipo !== "calculo") {
      const valor = dados[key] ?? null;
      cache.set(key, valor);
      return valor;
    }

    const formula = (coluna.config as { formula?: string }).formula ?? "";
    const valoresNumericos: Record<string, number> = {};
    for (const ref of extrairReferencias(formula)) {
      const valorRef = resolver(ref);
      valoresNumericos[ref] = typeof valorRef === "number" ? valorRef : Number(valorRef) || 0;
    }

    let resultado: number | null;
    try {
      resultado = avaliarFormula(formula, valoresNumericos);
    } catch {
      resultado = null;
    }
    cache.set(key, resultado);
    return resultado;
  }

  const resultado: Record<string, number | string | null> = {};
  for (const coluna of colunas) {
    resultado[coluna.key] = resolver(coluna.key);
  }
  return resultado;
}

/**
 * Avalia uma fórmula como `{a} * {b} / 2` substituindo as referências pelos
 * valores fornecidos e resolvendo a expressão aritmética com um parser
 * próprio (sem `eval`/`Function`, então não executa código arbitrário).
 */
export function avaliarFormula(formula: string, valores: Record<string, number>): number {
  const substituida = formula.replace(REFERENCIA_REGEX, (_, key: string) => {
    const valor = valores[key];
    if (typeof valor !== "number" || Number.isNaN(valor)) return "0";
    return `(${valor})`;
  });

  return new ExpressaoParser(substituida).parse();
}

/** Parser recursivo-descendente para expressões com + - * / ( ) e números. */
class ExpressaoParser {
  private pos = 0;
  private readonly texto: string;

  constructor(texto: string) {
    this.texto = texto;
  }

  parse(): number {
    const valor = this.parseExpressao();
    this.pularEspacos();
    if (this.pos < this.texto.length) {
      throw new Error(`Caractere inesperado em "${this.texto.slice(this.pos)}"`);
    }
    return valor;
  }

  private parseExpressao(): number {
    let valor = this.parseTermo();
    for (;;) {
      this.pularEspacos();
      const op = this.texto[this.pos];
      if (op === "+" || op === "-") {
        this.pos++;
        const proximo = this.parseTermo();
        valor = op === "+" ? valor + proximo : valor - proximo;
      } else {
        break;
      }
    }
    return valor;
  }

  private parseTermo(): number {
    let valor = this.parseFator();
    for (;;) {
      this.pularEspacos();
      const op = this.texto[this.pos];
      if (op === "*" || op === "/") {
        this.pos++;
        const proximo = this.parseFator();
        if (op === "/") {
          if (proximo === 0) throw new Error("Divisão por zero");
          valor = valor / proximo;
        } else {
          valor = valor * proximo;
        }
      } else {
        break;
      }
    }
    return valor;
  }

  private parseFator(): number {
    this.pularEspacos();
    const char = this.texto[this.pos];

    if (char === "+" || char === "-") {
      this.pos++;
      return char === "-" ? -this.parseFator() : this.parseFator();
    }

    if (char === "(") {
      this.pos++;
      const valor = this.parseExpressao();
      this.pularEspacos();
      if (this.texto[this.pos] !== ")") throw new Error("Parêntese não fechado");
      this.pos++;
      return valor;
    }

    const inicio = this.pos;
    while (this.pos < this.texto.length && /[0-9.]/.test(this.texto[this.pos])) {
      this.pos++;
    }
    if (this.pos === inicio) {
      throw new Error(`Número esperado em "${this.texto.slice(this.pos)}"`);
    }
    return Number(this.texto.slice(inicio, this.pos));
  }

  private pularEspacos() {
    while (this.texto[this.pos] === " ") this.pos++;
  }
}