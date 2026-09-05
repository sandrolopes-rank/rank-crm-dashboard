# Contexto de Handoff — Rank CRM Dashboard
> Documento para continuar o desenvolvimento em uma nova sessão de chat.
> Data: 05/09/2026

## O que é o projeto
Migração do **Rank CRM** (CRM interno da Rank My App) para um template **Shadcn Dashboard Next.js**, mantendo a mesma qualidade funcional mas aproveitando a UI pronta. A V1 foca exclusivamente em **gerenciamento de oportunidades** (cards de métrica + gráfico + tabela dinâmica na rota `/dashboard`). Todo o código em **PT-BR**. Backend **Supabase** reutilizado do projeto original.

**Stack**: Next.js 16.1.1 (App Router, TypeScript, Tailwind v4) + Supabase (Postgres + Auth com RLS) + Recharts + TanStack Table + shadcn/ui + Zustand

**Repositório**: https://github.com/sandrolopes-rank/rank-crm-dashboard

**Diretório de trabalho**: `C:\Users\Sandro\OneDrive\Área de Trabalho\Projetos\dashboard-crm-main\dashboard-crm-main\nextjs-version`

---

## O que já foi feito (commits no master)

| Commit | Etapa | Descrição |
|--------|-------|-----------|
| `2ab75c9` | Fase 0 — Preparação e Tradução | Sidebar traduzida (Dashboard, Administração, Em Breve), itens desabilitados com estilo visual, header/footer/notificação/busca traduzidos, botão "Upgrade to Pro" desativado, Command Search atualizado |
| `95b4a6f` | Fase 1 — Autenticação e Middleware | Clientes Supabase (browser/server/admin/middleware) usando `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, middleware protegendo rotas, página de login com e-mail/senha + Google OAuth (`hd: rankmyapp.com.br`), callback OAuth, tipos de perfil, componente Alert |
| `028f7da` | Ajuste Dashboard | UI original do template preservada (cards + gráfico + tabela em `/dashboard`), sidebar reestruturada, tradução completa PT-BR de todos os elementos, rotas corrigidas para `/dashboard` |
| `6a1872c` | Fase 2 — Layout e Navegação | Hook `usePerfil()`, sidebar condicional por role, logout funcional em `nav-user.tsx`, dados reais do usuário, rota `/configuracoes` com guarda de admin |
| `db83103` | Fix — Mapeamento Supabase | Corrigido campo `role` vs `papel` na tabela `perfis` (schema real usa `role`, não `papel`) |
| `6a0d8e5` | Refino — Engrenagem + Aparência | Ícone de engrenagem no header (só admin) → `/configuracoes`, "Aparência" no dropdown do perfil (abre Theme Customizer), botão flutuante laranja removido, "Configurações" removida da sidebar |

---

## Estado atual dos arquivos-chave

### `src/components/app-sidebar.tsx`
- Usa `usePerfil()` para dados reais do usuário
- Destrutura `onOpenCustomizer` separadamente de `...props` para não vazar para o DOM
- Passa `onOpenCustomizer` para `<NavUser>`
- Grupos de navegação: "Dashboard" (Oportunidades → `/dashboard`), "Em Breve" (itens disabled)
- **Administração/Configurações REMOVIDOS** da sidebar nesta sessão
- **SidebarNotification (popup "Bem-vindo") REMOVIDO** nesta sessão

### `src/components/nav-user.tsx`
- Dropdown com "Aparência" (ícone Palette) e "Sair" (ícone LogOut)
- "Aparência" usa `onSelect` com `setTimeout(() => onOpenCustomizer?.(), 300)` para abrir o Theme Customizer após o dropdown fechar
- Trigger usa `<div role="button">` em vez de `<SidebarMenuButton>` para evitar conflito de foco com Radix DropdownMenu
- "Sair" chama `supabase.auth.signOut()` e redireciona para `/login`

### `src/app/(dashboard)/layout.tsx`
- Envolve tudo com `SidebarConfigProvider` (necessário para o Theme Customizer funcionar)
- Gerencia estado `themeCustomizerOpen` com `useState`
- Passa `onOpenCustomizer={() => setThemeCustomizerOpen(true)}` para `<AppSidebar>`
- Renderiza `<ThemeCustomizer open={themeCustomizerOpen} onOpenChange={setThemeCustomizerOpen} />`

### `src/components/site-header.tsx`
- Ícone de engrenagem (Settings) ao lado do ModeToggle, visível só para admins
- Link para `/configuracoes`
- Busca global (⌘K) traduzida

### `src/hooks/use-perfil.ts`
- Busca dados na tabela `perfis` do Supabase
- Fallback: `data.papel ?? data.role` (schema real usa `role`)
- Retorna `{ perfil, loading }`

### `src/lib/types/perfis.ts`
- Tipos: `PapelUsuario`, `StatusPerfil`, `Perfil`
- Helpers: `ehAdmin()`, `estaAtivo()`

### `src/app/(dashboard)/configuracoes/page.tsx`
- Guarda de admin client-side (redirect para `/dashboard` se membro acessar)
- Placeholder para Fase 7

---

## Fase 3 — Motor de Dados (CONCLUÍDA)

Todos os entregáveis foram migrados do projeto original e validados com `tsc --noEmit`:

| # | Arquivo | Descrição |
|---|---------|-----------|
| 1 | `src/lib/types/oportunidades.ts` | Tipos centrais (Coluna, Oportunidade, Card, Filtro, Operador) |
| 2 | `src/lib/action-result.ts` | ActionResult pattern para Server Actions |
| 3 | `src/lib/formula.ts` | Parser de fórmula + detecção de referência circular |
| 4 | `src/lib/cards.ts` | Motor de cards (calcularCards, calcularSerieTempo, calcularGrupos, avaliarFiltro) |
| 5 | `src/lib/format.ts` | Formatação BRL, números, datas, iniciais |
| 6 | `src/lib/oportunidade-display.ts` | Renderização de valores por tipo de coluna |
| 7 | `src/lib/oportunidades-data.ts` | Leitura de dados do Supabase (colunas, cards, filtros) |
| 8 | `src/lib/cache.ts` | Cache local via localStorage namespaced |
| 9 | `src/lib/csv.ts` | Exportação CSV com delimitador `;` e BOM UTF-8 |
| 10 | `src/lib/slug.ts` | Geração de slugs seguros para keys de colunas |
| 11 | `src/app/(dashboard)/configuracoes/colunas/actions.ts` | CRUD de colunas (criar, atualizar, excluir, reordenar) |
| 12 | `src/app/(dashboard)/configuracoes/colunas/cards-actions.ts` | CRUD de cards + filtros (criar, atualizar, excluir, reordenar) |
| 13 | `src/app/(dashboard)/oportunidades/actions.ts` | CRUD de oportunidades (criar, atualizar, excluir) |

---

## Fase 4/5 — Integração de Dados Reais no Template (CONCLUÍDA)

A abordagem foi **adaptar os componentes existentes do template** para receber dados reais via props, sem substituir a estrutura visual.

### SectionCards (`src/app/(dashboard)/dashboard/components/section-cards.tsx`)
- Recebe `cards?: CardCalculado[]` via props
- Renderiza dinamicamente mantendo layout visual do template (grid responsivo, Card/Badge/CardHeader shadcn)
- Se vazio, mostra placeholder "Nenhum card configurado"
- Indicador visual heurístico: valor > 0 → TrendingUp, = 0 → Minus

### ChartAreaInteractive (`src/app/(dashboard)/dashboard/components/chart-area-interactive.tsx`)
- Recebe `serieTemporal?: PontoSerieTempo[]`, `titulo?: string`, `labelColuna?: string` via props
- Usa AreaChart com gradiente (mesma estilização do template)
- ToggleGroup/Select de período filtram client-side os últimos N meses da série
- Se vazio, mostra "Sem dados para o período selecionado"

### DataTable (`src/app/(dashboard)/dashboard/components/data-table.tsx`)
- **Refatorado** para aceitar `columns: ColumnDef<TData>[]` e `data: TData[]` genéricos via props
- **Drag-and-drop (@dnd-kit) REMOVIDO**
- **Checkbox de seleção REMOVIDO**
- Mantém estrutura de tabs: "Visão Geral" ativa, outras 3 desabilitadas com tooltip "Em breve"
- Mantém paginação, dropdown "Personalizar Colunas", toolbar visual do template
- Traduções PT-BR aplicadas ("Nenhum resultado encontrado", "Linhas por página", etc.)

### OportunidadesSection (`src/app/(dashboard)/dashboard/components/oportunidades-section.tsx`)
- Wrapper client-side criado nesta sessão
- Conecta `useOportunidades` + `useDynamicColumns` ao `DataTable`
- Recebe `colunas`, `userId`, `isAdmin` como props do Server Component

### use-dynamic-columns.tsx (`src/app/(dashboard)/dashboard/hooks/use-dynamic-columns.tsx`)
- Converte `OportunidadeColuna[]` → `ColumnDef<Oportunidade>[]`
- **Coluna "Responsável" inserida na posição 0** (apenas para admin)
- Cell renderers por tipo: TextCell, CurrencyCell, SelectCell, DateCell, CalculationCell, ResponsibleCell
- Todas as células usam `flex items-center h-full` para alinhamento vertical centralizado

### Cell Renderers (`src/app/(dashboard)/dashboard/components/cell-renderers/`)
- **text-cell.tsx**: Truncado com tooltip, edição inline no clique
- **currency-cell.tsx**: Formatação BRL alinhada à direita, máscara numérica inline
- **select-cell.tsx**: Badge colorida (paleta automática ou cor configurada), Select dropdown inline
- **date-cell.tsx**: Formato MM/AAAA, input type="month" inline
- **calculation-cell.tsx**: Somente leitura, itálico + text-muted-foreground
- **responsible-cell.tsx**: Avatar + nome, Select para reatribuir (admin only)

### Page (`src/app/(dashboard)/dashboard/page.tsx`)
- Server Component que busca colunas/cards/filtros/oportunidades/user do Supabase
- Chama `calcularCards()` e `calcularSerieTempo()` do motor da Fase 3
- Passa props para `<SectionCards>`, `<ChartAreaInteractive>` e `<OportunidadesSection>`

---

## Alterações feitas nesta sessão (não commitadas)

| Arquivo | Mudança |
|---------|---------|
| `src/components/ui/sidebar.tsx` | Desestruturação de `onOpenCustomizer` para evitar vazamento de prop para DOM |
| `src/components/nav-user.tsx` | Trigger trocado para `<div role="button">`, delay de 300ms no onSelect |
| `src/components/app-sidebar.tsx` | Administração/Configurações removidos, SidebarNotification removido, import limpo |
| `src/components/section-cards.tsx` | Adaptado para receber `CardCalculado[]` via props |
| `src/components/chart-area-interactive.tsx` | Adaptado para receber `PontoSerieTempo[]` via props |
| `src/components/data-table.tsx` | Refatorado para columns/data genéricos, dnd-kit e checkbox removidos, **botão "+ Seção" adicionado** |
| `src/components/oportunidades-section.tsx` | Novo wrapper client-side, **integra modal de criação via botão "+ Seção"** |
| `src/app/(dashboard)/dashboard/page.tsx` | Integrado com dados reais do Supabase |
| `src/app/(dashboard)/dashboard/hooks/use-oportunidades.ts` | Novo hook de dados com cache e paginação |
| `src/app/(dashboard)/dashboard/hooks/use-dynamic-columns.tsx` | Novo hook de colunas dinâmicas, Responsável na posição 0 |
| `src/app/(dashboard)/dashboard/components/cell-renderers/*.tsx` | 6 novos cell renderers com alinhamento vertical centralizado |
| `src/app/(dashboard)/dashboard/components/rule-indicator.tsx` | Novo indicador visual baseado em regras |
| `src/app/(dashboard)/dashboard/components/oportunidades-toolbar.tsx` | Nova toolbar (não usada atualmente, criada na Fase 4 inicial) |
| `src/app/(dashboard)/dashboard/components/oportunidade-modal.tsx` | Novo modal CRUD, **agora integrado ao botão "+ Seção"** |
| `src/app/(dashboard)/dashboard/components/column-filter-popover.tsx` | Novo filtro por coluna (não usado atualmente, criado na Fase 4 inicial) |

### Botão "+ Seção" (Adicionado nesta sessão)
- Localizado no `data-table.tsx`, ao lado do botão "Personalizar Colunas"
- Ícone `Plus` da lucide-react
- Texto: "+ Seção" (responsivo: mostra apenas ícone em mobile)
- Callback `onAddNew` passado via props do `OportunidadesSection`
- Abre o `OportunidadeModal` para criar nova oportunidade
- Funcionalidade completa: clique → modal abre → preenche dados → salva → tabela atualiza

---

## Backlog pendente (Fases futuras)

### Fase 6 — Adaptação do Gráfico/Dashboard (PARCIALMENTE FEITO)
- O ChartAreaInteractive já recebe dados reais via `calcularSerieTempo()`
- Pendente: editor inline (só admin) para criar/editar/excluir gráficos
- Pendente: suporte a tipos Barras (vertical/horizontal) e Rosca via `calcularGrupos()`
- Pendente: configuração por gráfico (coluna de dado, agregação, coluna de data, coluna de agrupamento)

### Fase 7 — Configurações (Admin)
- Layout com abas: Gerador de Tabelas / Perfis e Acessos / Geral
- Gerador de Colunas: CRUD com drag-and-drop (`@dnd-kit`)
- Gerenciador de Cards: CRUD compartilhado com dashboard
- Perfis e Acessos: lista de usuários, ativar/desativar, convidar por e-mail, alterar papel
- **Nota**: A rota `/configuracoes` existe mas está vazia (placeholder). O link na sidebar foi removido nesta sessão mas pode ser readicionado quando a Fase 7 começar.

### Melhorias pendentes na tabela
- Integrar filtros por coluna (`column-filter-popover.tsx`) com busca server-side no hook `useOportunidades`
- Integrar modal de criação/edição (`oportunidade-modal.tsx`) no toolbar ou em ação de linha
- Integrar toolbar completa (`oportunidades-toolbar.tsx`) com busca global e exportação CSV
- Adicionar indicadores visuais baseados em regras (`rule-indicator.tsx`) nas células numéricas
- Virtualização com `@tanstack/react-virtual` (instalado mas não integrado ao DataTable atual)
- Cores das badges do Select configuráveis por opção (atualmente usa paleta automática)

---

## Fora do escopo V1 (backlog futuro)
- B.1: Ícones editáveis nos cards
- B.3: Formato de retorno configurável (número/monetário/porcentagem)
- B.4: Estilização condicional de células + paleta de cores
- Trap de foco nos modais
- Testes automatizados
- Exclusão definitiva de usuários
- E-mail de convite customizado

---

## Credenciais de teste (Supabase)
- `admin@rankmyapp.com.br` / `senha123` (role: admin)
- `teste@rankmyapp.com.br` / `senha123` (role: membro)

## Variáveis de ambiente
Arquivo `.env.local` na pasta `nextjs-version`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (nota: NÃO é `ANON_KEY`)
- `SUPABASE_SECRET_KEY`

## Processo de trabalho
- Trabalho faseado: cada fase só é aplicada quando solicitada explicitamente
- Ao final de cada fase: testar via browser automatizado, validar sem pendências antes de avançar
- `npx tsc --noEmit` e `npm run lint` limpos antes de fechar qualquer fase
- Commits por fase com push para o repositório GitHub
- Documentar tudo neste arquivo conforme as fases avançam
- **IMPORTANTE**: Sempre preservar a UI do template Shadcn — adaptar componentes existentes via props, nunca substituir por novos componentes

## Schema do banco (tabelas principais)
- `perfis` — `id`, `email`, `role` (admin/membro), `status` (ativo/inativo), `created_at`
- `oportunidade_colunas` — `key`, `label`, `tipo`, `ordem`, `config` jsonb, `obrigatorio`, `eh_data_referencia`
- `oportunidades` — `owner_id`, `created_by`, `dados` jsonb, timestamps
- `oportunidade_cards` — `coluna_id`, `agregacao`, `label`, `ordem`, `tipo_visualizacao`, `coluna_data_id`, `coluna_agrupamento_id`, `orientacao_barra`
- `oportunidade_card_filtros` — `card_id`, `coluna_id`, `operador`, `valores` jsonb

RLS em todas: leitura liberada a todo autenticado (exceto dados de outro `owner_id`, que só admin lê), escrita de metadados só para admin, escrita de linhas só para o próprio dono ou admin.

## Erros pré-existentes (não relacionados ao projeto)
- `src/components/ui/chart.tsx` — erros de tipo do Recharts (template original)
- `src/app/(dashboard)/tasks/components/data-table-toolbar.tsx` — propriedade `icon` não existe (template original)
- Estes erros não afetam o funcionamento do dashboard e podem ser ignorados