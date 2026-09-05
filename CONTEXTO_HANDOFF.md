# Contexto de Handoff — Rank CRM Dashboard
> Documento para continuar o desenvolvimento em uma nova sessão de chat.
> Data: 06/09/2026 (Atualizado Pós-Commit 8d1c731)

## O que é o projeto
Migração do **Rank CRM** para um template **Shadcn Dashboard Next.js**. V1 foca em **gerenciamento de oportunidades** (cards + gráfico + tabela dinâmica em `/dashboard`). Código PT-BR. Backend Supabase.

**Stack**: Next.js 16.1.1 + Supabase + Recharts + TanStack Table/Virtual + shadcn/ui

---

## Estado Atual (Pós-Commit `8d1c731`)

### Commits no master
| Commit | Etapa | Descrição |
|--------|-------|-----------|
| `2ab75c9` | Fase 0 | Tradução e preparação do template |
| `95b4a6f` | Fase 1 | Autenticação e Middleware |
| `028f7da` | Ajuste Dashboard | UI original preservada, tradução PT-BR |
| `6a1872c` | Fase 2 | Layout, sidebar condicional, logout |
| `db83103` | Fix | Mapeamento Supabase (role vs papel) |
| `6a0d8e5` | Refino | Engrenagem admin, Aparência no dropdown |
| `e114fe5` | Fase 3 + Integração UI | Motor de dados, cards/gráfico/tabela com dados reais |
| `a147148` | Melhorias Tabela | Toolbar, Virtualização, Responsável otimizado |
| `8d1c731` | **Filtros + Responsável** | Filtros por coluna integrados, ResponsibleCell com perfisMap server-side |

### Melhorias Implementadas nesta Sessão
1.  **Filtros por Coluna**: `ColumnFilterPopover` integrado nos headers da tabela via `data-table.tsx`. Suporta operadores por tipo de coluna (eq, gt, contains, mes_atual, etc.).
2.  **Responsável Otimizado**: `ResponsibleCell` agora recebe `perfisMap` via props do Server Component (`page.tsx` → `oportunidades-section.tsx` → `use-dynamic-columns.tsx`). Elimina N+1 queries e mostra fallback robusto (parte do ID) se o usuário não for encontrado.
3.  **Virtualização**: `@tanstack/react-virtual` integrado no `data-table.tsx` com `estimateSize: 48` e `overscan: 5`.
4.  **Toolbar Completa**: Busca debounced, contador de registros, exportação CSV, botão "Nova Oportunidade".
5.  **Alinhamento por Tipo**: Headers e células alinhados conforme tipo de dado (texto→esquerda, monetário→direita, select/data→centro).
6.  **Botão "Seção"**: Adicionado ao lado de "Personalizar Colunas" para criar novas oportunidades.

### Arquivos Chave e Seus Estados
*   `src/app/(dashboard)/dashboard/page.tsx`: Server Component. Busca colunas/cards/filtros/oportunidades/user/perfisMap do Supabase.
*   `src/app/(dashboard)/dashboard/components/data-table.tsx`: Tabela dinâmica com virtualização, filtros por coluna, tabs (só "Visão Geral" ativa), paginação, botão "Seção".
*   `src/app/(dashboard)/dashboard/components/oportunidades-section.tsx`: Wrapper client-side que conecta hooks ao DataTable.
*   `src/app/(dashboard)/dashboard/hooks/use-dynamic-columns.tsx`: Converte `OportunidadeColuna[]` → `ColumnDef[]` com cell renderers por tipo e `perfisMap`.
*   `src/app/(dashboard)/dashboard/hooks/use-oportunidades.ts`: Hook de dados com cache local e paginação.
*   `src/app/(dashboard)/dashboard/components/cell-renderers/*.tsx`: 6 renderizadores (Text, Currency, Select, Date, Calculation, Responsible).
*   `src/app/(dashboard)/dashboard/components/column-filter-popover.tsx`: Popover de filtro por coluna com operadores dinâmicos.
*   `src/app/(dashboard)/dashboard/components/oportunidades-toolbar.tsx`: Barra de busca, exportar CSV, criar.
*   `src/app/(dashboard)/dashboard/components/oportunidade-modal.tsx`: Modal CRUD com preview de cálculos.
*   `src/app/(dashboard)/dashboard/components/rule-indicator.tsx`: Indicador visual baseado em regras (verde/vermelho/neutro).
*   `src/lib/cards.ts`: Motor de cálculo (calcularCards, calcularSerieTempo, calcularGrupos, avaliarFiltro).
*   `src/lib/formula.ts`: Parser seguro de fórmulas com detecção de ciclo.
*   `src/lib/types/oportunidades.ts`: Tipos centrais (Coluna, Oportunidade, Card, Filtro, Operador).

---

## Pendências Imediatas (Próximos Passos)

### Melhorias na Tabela (Refinamento)
1.  **Indicadores Visuais (Regras)**: Integrar `rule-indicator.tsx` nas células numéricas (`currency-cell`, `calculation-cell`) para mostrar tendências baseado em thresholds configuráveis.
2.  **Cores das Badges (Select)**: Atualmente usa paleta automática. Falta implementar a configuração de cores por opção vindo do campo `config.opcoes[].cor` da coluna no Supabase (a lógica já existe no `select-cell.tsx`, mas precisa de dados no banco).
3.  **Filtros Server-Side**: Os filtros por coluna atualmente aplicam via TanStack Table client-side. Para grandes volumes, integrar com o hook `useOportunidades` para filtrar no servidor.

### Fase 6 — Gráficos Avançados
- Suporte a Barras (vertical/horizontal) e Rosca usando `calcularGrupos()`.
- Editor inline de gráficos (admin) para criar/editar/excluir.
- Configuração por gráfico: coluna de dado, agregação, coluna de data, coluna de agrupamento.

### Fase 7 — Configurações (Admin)
- Página `/configuracoes` com abas (Gerador de Tabelas / Perfis e Acessos / Geral).
- CRUD de Colunas com drag-and-drop (`@dnd-kit`).
- CRUD de Cards compartilhado com dashboard.
- Gestão de Usuários/Perfis.
- Reativar link "Configurações" na sidebar.

---

## Credenciais e Ambiente
- **Admin**: `admin@rankmyapp.com.br` / `senha123`
- **Membro**: `teste@rankmyapp.com.br` / `senha123`
- **Env**: `.env.local` em `nextjs-version` com `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`.

## Schema do Banco (Resumo)
- `perfis`: id, email, role, status, nome.
- `oportunidade_colunas`: key, label, tipo, ordem, config (jsonb com `opcoes[].cor`), eh_data_referencia.
- `oportunidades`: owner_id, dados (jsonb), created_by, timestamps.
- `oportunidade_cards`: coluna_id, agregacao, label, ordem, tipo_visualizacao, coluna_data_id, coluna_agrupamento_id, orientacao_barra.
- `oportunidade_card_filtros`: card_id, coluna_id, operador, valores jsonb.

## Erros Pré-existentes (Ignorar)
- `src/components/ui/chart.tsx`: erros de tipo do Recharts (template original).
- `src/app/(dashboard)/tasks/components/data-table-toolbar.tsx`: propriedade `icon` missing (template original).

## Processo de Trabalho
- Trabalho faseado: cada fase só é aplicada quando solicitada explicitamente.
- `npx tsc --noEmit` limpo antes de fechar qualquer fase.
- Commits por fase com push para o repositório GitHub.
- **IMPORTANTE**: Sempre preservar a UI do template Shadcn — adaptar componentes existentes via props, nunca substituir por novos componentes sem validação prévia.
- Para rodar: `cd nextjs-version && npm run dev` (porta 3000).