export type PapelUsuario = "admin" | "membro"
export type StatusPerfil = "ativo" | "inativo"

export interface Perfil {
  id: string
  email: string
  nome: string | null
  papel: PapelUsuario
  status: StatusPerfil
  criado_em: string
  atualizado_em: string | null
}

export function ehAdmin(perfil: Perfil | null): boolean {
  return perfil?.papel === "admin" && perfil?.status === "ativo"
}

export function estaAtivo(perfil: Perfil | null): boolean {
  return perfil?.status === "ativo"
}