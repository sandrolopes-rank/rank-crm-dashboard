# Contexto de Handoff — Rank CRM Dashboard
> Documento para continuar o desenvolvimento em uma nova sessão de chat.
> Data: 06/09/2026 (Atualizado Pós-Commit a147148)

## O que é o projeto
Migração do **Rank CRM** para um template **Shadcn Dashboard Next.js**. V1 foca em **gerenciamento de oportunidades** (cards + gráfico + tabela dinâmica em `/dashboard`). Código PT-BR. Backend Supabase.

**Stack**: Next.js 16.1.1 + Supabase + Recharts + TanStack Table/Virtual + shadcn/ui

---

## Estado Atual (Pós-Commit `a147148`)

### Melhorias Implementadas nesta Sessão
1.  **Toolbar Completa**: Integrada em `oportunidades-section.tsx`. Inclui busca debounced, contador e exportação CSV.
2.  **Virtualização**: Implementada em `data-table.tsx` usando `@tanstack/react-virtual`. Suporta grandes volumes de dados sem travar.
3.  **Responsável Otimizado**: `page.tsx` agora busca `perfisMap` e passa para a tabela. `ResponsibleCell` usa esse mapa diretamente, eliminando queries N+1 e corrigindo o fallback visual.
4.  **Cores das Badges**: `select-cell.tsx` já lê a propriedade `cor` do config JSON da coluna no Supabase.

### Arquivos Chave Modificados
*   `src/app/(dashboard)/dashboard/page.tsx`: Adicionada busca de `perfisMap`.
*   `src/app/(dashboard)/dashboard/components/oportunidades-section.tsx`: Integração da Toolbar e passagem de `perfisMap`.
*   `src/app/(dashboard)/dashboard/components/data-table.tsx`: Virtualização adicionada.
*   `src/app/(dashboard)/dashboard/components/cell-renderers/responsible-cell.tsx`: Refatorado para usar props em vez de fetch interno.
*   `src/app/(dashboard)/dashboard/hooks/use-dynamic-columns.tsx`: Atualizado para receber e repassar `perfisMap`.

---

## Pendências Imediatas (Próximos Passos)

1.  **Indicadores Visuais (Regras)**:
    *   Integrar `rule-indicator.tsx` nas células numéricas (`currency-cell`, `calculation-cell`).
    *   Definir thresholds (ex: verde se > meta, vermelho se < mínimo).
2.  **Filtros por Coluna**:
    *   Conectar `column-filter-popover.tsx` ao estado da tabela.
    *   Implementar lógica de filtragem client-side ou server-side no `useOportunidades`.
3.  **Fase 6 — Gráficos Avançados**:
    *   Suporte a Barras e Rosca.
    *   Editor inline de gráficos (admin).
4.  **Fase 7 — Configurações**:
    *   CRUD de Colunas e Cards.
    *   Gestão de Usuários.

---

## Credenciais e Ambiente
*   **Admin**: `admin@rankmyapp.com.br` / `senha123`
*   **Env**: `.env.local` em `nextjs-version`.

## Schema do Banco (Resumo)
*   `perfis`: id, email, role, status.
*   `oportunidade_colunas`: key, label, tipo, ordem, config (jsonb com `opcoes[].cor`).
*   `oportunidades`: owner_id, dados (jsonb).