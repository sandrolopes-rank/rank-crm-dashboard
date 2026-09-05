# Contexto de Handoff — Rank CRM Dashboard
> Documento para continuar o desenvolvimento em uma nova sessão de chat.
> Data: 06/09/2026 (Atualizado)

## O que é o projeto
Migração do **Rank CRM** (CRM interno da Rank My App) para um template **Shadcn Dashboard Next.js**, mantendo a mesma qualidade funcional mas aproveitando a UI pronta. A V1 foca exclusivamente em **gerenciamento de oportunidades** (cards de métrica + gráfico + tabela dinâmica na rota `/dashboard`). Todo o código em **PT-BR**. Backend **Supabase** reutilizado do projeto original.

**Stack**: Next.js 16.1.1 (App Router, TypeScript, Tailwind v4) + Supabase (Postgres + Auth com RLS) + Recharts + TanStack Table + shadcn/ui + Zustand

**Repositório**: https://github.com/sandrolopes-rank/rank-crm-dashboard

**Diretório de trabalho**: `C:\Users\Sandro\OneDrive\Área de Trabalho\Projetos\dashboard-crm-main\dashboard-crm-main\nextjs-version`

---

## O que já foi feito (commits no master)

| Commit | Etapa | Descrição |
|--------|-------|-----------|
| `2ab75c9` | Fase 0 — Preparação e Tradução | Sidebar traduzida, header/footer/busca traduzidos |
| `95b4a6f` | Fase 1 — Autenticação e Middleware | Clientes Supabase, middleware, login OAuth |
| `028f7da` | Ajuste Dashboard | UI original preservada, tradução completa PT-BR |
| `6a1872c` | Fase 2 — Layout e Navegação | Hook `usePerfil()`, sidebar condicional, logout |
| `db83103` | Fix — Mapeamento Supabase | Corrigido campo `role` vs `papel` |
| `6a0d8e5` | Refino — Engrenagem + Aparência | Ícone engrenagem admin, Theme Customizer funcional |
| `e114fe5` | **Fase 3 + Integração UI** | Motor de dados completo, integração de cards/gráfico/tabela com dados reais, correções de alinhamento e UI |

---

## Estado Atual do Projeto (Pós-Commit `e114fe5`)

### Decisões de Design Implementadas
1.  **Alinhamento da Tabela**: Todas as colunas estão alinhadas à **esquerda** (`text-left`), incluindo valores monetários e datas, seguindo preferência do usuário para uniformidade visual.
2.  **Template Preservado**: A estrutura visual do Shadcn Dashboard (Cards, Gráfico, Tabs da Tabela) foi mantida. Apenas a fonte de dados mudou de mock para Supabase.
3.  **Sidebar Limpa**: Removidos "Administração", "Configurações" e o popup "Bem-vindo". Apenas "Dashboard" e "Em Breve" permanecem.
4.  **Botão "Seção"**: Adicionado ao lado de "Personalizar Colunas" para criar novas oportunidades via modal.

### Arquivos Chave e Seus Estados
*   **`src/app/(dashboard)/dashboard/page.tsx`**: Server Component. Busca dados reais (colunas, cards, filtros, user) e passa como props.
*   **`src/app/(dashboard)/dashboard/components/data-table.tsx`**: Refatorado. Aceita colunas dinâmicas. Sem drag-and-drop. Sem checkbox. Alinhamento forçado à esquerda via classes estáticas Tailwind.
*   **`src/app/(dashboard)/dashboard/hooks/use-dynamic-columns.tsx`**: Gera `ColumnDef[]` a partir do schema do Supabase. Define alinhamento `!text-left` para todos os tipos atualmente.
*   **`src/app/(dashboard)/dashboard/components/cell-renderers/*.tsx`**: 6 componentes (Text, Currency, Select, Date, Calculation, Responsible). Todos ajustados para alinhamento à esquerda.
*   **`src/lib/cards.ts`**: Motor de cálculo puro (soma, média, contagem, série temporal, grupos).
*   **`src/lib/formula.ts`**: Parser seguro de fórmulas matemáticas com detecção de ciclo.

---

## Pendências Imediatas (Próximos Passos Autorizados)

O usuário autorizou o início das seguintes melhorias na **Tabela de Oportunidades**:

1.  **Integração de Filtros por Coluna**:
    *   *Status*: Componente `column-filter-popover.tsx` existe.
    *   *Ação*: Conectar ao estado do `useOportunidades` e aplicar filtros server-side ou client-side robusto.
2.  **Integração da Toolbar Completa**:
    *   *Status*: Componente `oportunidades-toolbar.tsx` existe (busca + exportar).
    *   *Ação*: Renderizar este componente acima da tabela no `data-table.tsx` ou `oportunidades-section.tsx`, substituindo ou complementando os botões atuais.
3.  **Indicadores Visuais (Regras)**:
    *   *Status*: Componente `rule-indicator.tsx` existe.
    *   *Ação*: Integrar nas células numéricas (`currency-cell`, `calculation-cell`) para mostrar tendências (verde/vermelho) baseado em thresholds configuráveis.
4.  **Virtualização**:
    *   *Status*: `@tanstack/react-virtual` instalado.
    *   *Ação*: Implementar no `data-table.tsx` para suportar centenas de linhas sem travar o DOM.
5.  **Cores das Badges (Select)**:
    *   *Status*: Usa paleta automática hardcoded.
    *   *Ação*: Ler a propriedade `cor` dentro do JSON `config.opcoes` da coluna no Supabase e aplicar dinamicamente.
6.  **Responsável (Fallback Melhorado)**:
    *   *Status*: Mostra ID truncado se não achar o user.
    *   *Ação*: Buscar mapa de `userId -> nome/email` no Server Component (`page.tsx`) e passar como prop para evitar N+1 queries no client.

---

## Backlog Futuro (Fases 6 e 7)

### Fase 6 — Adaptação do Gráfico/Dashboard
*   Editor inline de gráficos (admin).
*   Suporte a Barras e Rosca (usar `calcularGrupos`).
*   Configuração de eixos e agregação via UI.

### Fase 7 — Configurações (Admin)
*   Página `/configuracoes` com abas.
*   CRUD de Colunas (drag-and-drop).
*   CRUD de Cards.
*   Gestão de Usuários/Perfis.
*   Reativar link na sidebar.

---

## Credenciais e Ambiente
*   **Admin**: `admin@rankmyapp.com.br` / `senha123`
*   **Membro**: `teste@rankmyapp.com.br` / `senha123`
*   **Env**: `.env.local` em `nextjs-version` com `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`.

## Schema do Banco (Resumo)
*   `perfis`: id, email, role, status.
*   `oportunidade_colunas`: key, label, tipo, ordem, config (jsonb), eh_data_referencia.
*   `oportunidades`: owner_id, dados (jsonb).
*   `oportunidade_cards`: coluna_id, agregacao, tipo_visualizacao, filtros relacionados.

## Erros Pré-existentes (Ignorar)
*   `chart.tsx`: Erros de tipo do Recharts.
*   `tasks/data-table-toolbar.tsx`: Propriedade icon missing.