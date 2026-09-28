const BOM = String.fromCharCode(0xfeff);

function escaparCampoCsv(valor: string): string {
  if (/[;"\n\r]/.test(valor)) {
    return `"${valor.replace(/"/g, '""')}"`;
  }
  return valor;
}

/** Delimitador ";" (não ","), pra abrir corretamente no Excel em pt-BR — vírgula já é o separador decimal por lá. */
export function gerarCsv(cabecalhos: string[], linhas: string[][]): string {
  const todasLinhas = [cabecalhos, ...linhas];
  return todasLinhas.map((linha) => linha.map(escaparCampoCsv).join(";")).join("\r\n");
}

export function baixarCsv(nomeArquivo: string, cabecalhos: string[], linhas: string[][]): void {
  // BOM (byte-order mark) na frente garante acentuação correta ao abrir no Excel.
  const blob = new Blob([BOM + gerarCsv(cabecalhos, linhas)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}