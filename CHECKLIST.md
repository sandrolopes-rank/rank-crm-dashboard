# Plano de Implementação — Rank CRM V1 (Template Shadcn Dashboard)

## Contexto

Migração do Rank CRM (projeto construído do zero) para o template Shadcn Dashboard Next.js, mantendo a mesma qualidade funcional mas aproveitando a UI pronta. A V1 foca exclusivamente em **gerenciamento de oportunidades** (tabela dinâmica, cards de métrica, dashboard de gráficos). As demais páginas do template (Mail, Chat, Calendar, Tasks, Users, FAQs, Pricing) serão mantidas no código-fonte mas desabilitadas visualmente (cinza/indisponível). Todo o código será traduzido para português. O backend Supabase existente será reutilizado.

---

## Fase 0 — Preparação do Template e Tradução
**Objetivo**: Limpar o template, traduzir tudo para PT-BR, desabilitar páginas não-V1, configurar ambiente.

### Tarefas
1. **Traduzir labels do template**: sidebar (`app-sidebar.tsx`), header (`site-header.tsx`), footer (`site-footer.tsx`), theme customizer, upgrade button, e todas as strings hardcoded nos componentes UI
2. **Desabilitar páginas não-V1**: Em `app-sidebar.tsx`, marcar itens Mail, Chat, Calendar, Tasks, Users, FAQs, Pricing como `disabled: true` e renderizá-los com estilo visual "indisponível" (texto cinza, cursor not-allowed, tooltip "Em breve")
3. **Remover Dashboard 2**: Manter apenas Dashboard 1 como base para adaptação
4. **Configurar `.env.local`**: Copiar variáveis do Rank CRM existente (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SECRET_KEY`)
5. **Instalar dependências adicionais**: `@supabase/supabase-js`, `@supabase/ssr` (se não estiverem no template)
6. **Verificar build**: `npm run build` limpo após tradução

### Arquivos-chave
- `src/components/app-sidebar.tsx` — navegação lateral
- `src/components/site-header.tsx` — cabeçalho
- `src/components/site-footer.tsx` — rodapé
- `src/components/theme-customizer/` — customizador de tema
- `src/app/(dashboard)/layout.tsx` — layout principal
- `.env.local` — variáveis de ambiente

---

## Fase 1 — Autenticação e Middleware
**Objetivo**: Integrar Supabase Auth com o template, manter restrição de domínio `@rankmyapp.com.br`, login e-mail/senha + Google OAuth.

### Tarefas
1. **Criar clientes Supabase**: `lib/supabase.ts` (browser), `lib/supabase-server.ts` (server), `lib/supabase-admin.ts` (service role), `lib/supabase-middleware.ts`
2. **Criar middleware**: Proteger rotas `/dashboard/*` e `/configuracoes/*`, redirecionar não-autenticados para `/login`
3. **Criar página de login**: Adaptar `src/app/(auth)/sign-in/` do template para incluir Google OAuth + campo de e-mail com hint `@rankmyapp.com.br`
4. **Criar callback OAuth**: `src/app/auth/callback/route.ts`
5. **Criar tipo de perfil**: `lib/types/perfis.ts` com roles admin/membro e status ativo/inativo
6. **Server Action de verificação de acesso**: Validar domínio e status do perfil antes de permitir entrada

### Arquivos-chave
- `src/lib/supabase*.ts` — clientes Supabase
- `src/middleware.ts` — proteção de rotas
- `src/app/(auth)/sign-in/page.tsx` — tela de login adaptada
- `src/app/auth/callback/route.ts` — callback OAuth
- `src/lib/types/perfis.ts` — tipos de usuário

### Reutilizar do Rank CRM
- Padrão de clientes Supabase (browser/server/admin/middleware)
- Trigger `check_email_domain` já existe no banco
- Callback OAuth pattern

---

## Fase 2 — Layout Autenticado e Navegação
**Objetivo**: Sidebar dinâmica baseada em permissões, header com info do usuário, estrutura de rotas protegidas.

### Tarefas
1. **Adaptar sidebar**: Itens visíveis por role (admin vê Configurações, membro não). Usar hook `usePerfil()` para buscar dados do usuário autenticado
2. **Header do usuário**: Avatar, nome, e-mail, botão de sair — adaptar componente `user-nav` existente
3. **Layout protegido**: Wrapper em `(dashboard)/layout.tsx` que verifica autenticação e carrega perfil
4. **Rota `/oportunidades`**: Criar como rota principal (substitui `/dashboard` como landing page pós-login)
5. **Rota `/configuracoes`**: Criar com guarda de admin (redirect se membro tentar acessar)

### Arquivos-chave
- `src/components/app-sidebar.tsx` — navegação condicional
- `src/components/user-nav.tsx` ou equivalente — menu do usuário
- `src/app/(dashboard)/layout.tsx` — wrapper de auth
- `src/hooks/use-perfil.ts` — hook de dados do usuário
- `src/app/(dashboard)/oportunidades/page.tsx` — nova rota
- `src/app/(dashboard)/configuracoes/layout.tsx` — guarda de admin

---

## Fase 3 — Motor de Dados (Tipos + Server Actions + Libs)
**Objetivo**: Recriar toda a lógica de negócio do Rank CRM dentro do template, com tipos, fórmulas, cards e filtros.

### Tarefas
1. **Tipos centrais**: `lib/types/oportunidades.ts` — Coluna, Oportunidade, Card, Filtro, Operador, TipoColuna, Agregacao, TipoVisualizacao
2. **ActionResult pattern**: `lib/action-result.ts` — `ActionResult<T>` + `executarAction()`
3. **Parser de fórmula**: `lib/formula.ts` — avaliação segura de `{coluna} * {outra}`, detecção de referência circular
4. **Motor de cards**: `lib/cards.ts` — `calcularCards`, `calcularSerieTempo`, `calcularGrupos`, `avaliarFiltro`
5. **Formatação**: `lib/format.ts` (moeda, número, e-mail→usuário) + `lib/oportunidade-display.ts` (formatação por tipo de coluna)
6. **Leitura de dados**: `lib/oportunidades-data.ts` — queries Supabase para colunas e oportunidades
7. **Cache local**: `lib/cache.ts` — localStorage namespaced por usuário
8. **Exportação CSV**: `lib/csv.ts` — delimitador `;`, BOM UTF-8
9. **Server Actions de oportunidades**: CRUD completo em `app/(dashboard)/oportunidades/actions.ts`
10. **Server Actions de configurações**: CRUD de colunas, cards, filtros em `app/(dashboard)/configuracoes/*/actions.ts`

### Arquivos-chave
- `src/lib/types/oportunidades.ts`
- `src/lib/action-result.ts`
- `src/lib/formula.ts`
- `src/lib/cards.ts`
- `src/lib/format.ts`
- `src/lib/oportunidade-display.ts`
- `src/lib/oportunidades-data.ts`
- `src/lib/cache.ts`
- `src/lib/csv.ts`
- `src/app/(dashboard)/oportunidades/actions.ts`
- `src/app/(dashboard)/configuracoes/colunas/actions.ts`
- `src/app/(dashboard)/configuracoes/cards/actions.ts`

### Reutilizar do Rank CRM
- Todos esses arquivos podem ser copiados quase integralmente, ajustando apenas imports e paths
- Schema do banco já existe — nenhuma migração nova necessária para V1

---

## Fase 4 — Tabela de Oportunidades
**Objetivo**: Renderizar tabela dinâmica usando TanStack Table do template, alimentada pelas colunas configuráveis.

### Tarefas
1. **Adaptar data-table do template**: Usar `src/app/(dashboard)/tasks/components/data-table.tsx` como base, modificar para aceitar colunas dinâmicas
2. **Renderização por tipo**: Texto, Monetário (R$), Cálculo (resultado formatado), Select (badge colorida), Data (formatada pt-BR)
3. **CRUD inline/modal**: Formulário de criação/edição com campos gerados dinamicamente por tipo de coluna
4. **Responsável**: Admin pode escolher owner ao criar/editar; coluna "Responsável" visível só para admin
5. **Filtros e busca**: Toolbar com filtros por coluna, busca textual
6. **Paginação server-side**: Ou client-side dependendo do volume inicial
7. **Exportação CSV**: Botão na toolbar
8. **Realtime**: Subscription Supabase para atualizações ao vivo (admin vê mudanças de todos)
9. **Loading state**: Skeleton + cache preview via `loading.tsx`

### Arquivos-chave
- `src/app/(dashboard)/oportunidades/page.tsx`
- `src/app/(dashboard)/oportunidades/components/tabela-oportunidades.tsx`
- `src/app/(dashboard)/oportunidades/components/formulario-oportunidade.tsx`
- `src/app/(dashboard)/oportunidades/components/coluna-dinamica.tsx`
- `src/app/(dashboard)/oportunidades/loading.tsx`

### Componentes do template a reutilizar
- `@tanstack/react-table` (já instalado)
- `data-table-toolbar`, `data-table-pagination`, `data-table-column-header` (de tasks/)
- Dialog/Sheet para formulário de edição
- Select, DatePicker, Input do shadcn/ui

---

## Fase 5 — Cards de Métrica
**Objetivo**: Renderizar cards configuráveis na página de Oportunidades e no Dashboard.

### Tarefas
1. **Componente CardMetrica**: Aceita config (coluna, agregação, label, ícone, filtros) e renderiza valor formatado
2. **Grid responsivo**: Layout com CSS Grid/Tailwind, adaptável a mobile
3. **Filtros condicionais**: UI para configurar múltiplos filtros com operadores por tipo de coluna
4. **Integração com motor**: Usa `calcularCards` da Fase 3

### Arquivos-chave
- `src/app/(dashboard)/oportunidades/components/cards-metrica.tsx`
- `src/components/ui/card-metrica.tsx` — componente genérico reutilizável

---

## Fase 6 — Dashboard de Gráficos
**Objetivo**: Dashboard editável com gráficos Recharts, alimentados pelo motor de cards.

### Tarefas
1. **Página `/oportunidades/dashboard`**: Layout com grid de gráficos
2. **Tipos de gráfico**: Linha (evolução mensal), Barras (vertical/horizontal), Rosca (proporção)
3. **Editor inline**: Botão "Editar dashboard" (só admin) para criar/editar/excluir gráficos na própria tela
4. **Configuração por gráfico**: Coluna de dado, agregação, coluna de data (eixo X), coluna de agrupamento (legenda/cor)
5. **Recharts integration**: Usar componentes do template (`chart-area-interactive.tsx` como referência)
6. **Dados por usuário**: RLS garante que cada um vê só seus dados; admin vê tudo

### Arquivos-chave
- `src/app/(dashboard)/oportunidades/dashboard/page.tsx`
- `src/app/(dashboard)/oportunidades/dashboard/components/editor-dashboard.tsx`
- `src/app/(dashboard)/oportunidades/dashboard/components/grafico-linha.tsx`
- `src/app/(dashboard)/oportunidades/dashboard/components/grafico-barras.tsx`
- `src/app/(dashboard)/oportunidades/dashboard/components/grafico-rosca.tsx`

### Componentes do template a reutilizar
- Recharts (já instalado, v3.6.0)
- Tabs, Select, Button do shadcn/ui
- ResponsiveContainer pattern do template

---

## Fase 7 — Configurações (Admin)
**Objetivo**: Painel administrativo completo para gerenciar colunas, cards e perfis.

### Tarefas
1. **Layout com abas**: Adaptar tabs do template para Gerador de Tabelas / Perfis e Acessos / Geral
2. **Gerador de Colunas**: CRUD de colunas com drag-and-drop (`@dnd-kit`, já instalado), preview ao vivo
3. **Gerenciador de Cards**: CRUD de cards/gráficos compartilhado com dashboard
4. **Perfis e Acessos**: Lista de usuários, ativar/desativar, convidar por e-mail, alterar papel
5. **Geral**: Placeholder para futuras configurações

### Arquivos-chave
- `src/app/(dashboard)/configuracoes/page.tsx`
- `src/app/(dashboard)/configuracoes/components/abas-configuracoes.tsx`
- `src/app/(dashboard)/configuracoes/colunas/` — gerenciador de colunas
- `src/app/(dashboard)/configuracoes/cards/` — gerenciador de cards
- `src/app/(dashboard)/configuracoes/perfis/` — gerenciamento de usuários

### Componentes do template a reutilizar
- `@dnd-kit/core`, `@dnd-kit/sortable` (já instalados)
- Tabs, Dialog, Form (react-hook-form + zod, já instalados)
- DataTable para lista de perfis

---

## Verificação Final da V1
1. `npm run build` sem erros
2. `npx tsc --noEmit` limpo
3. Testar fluxo completo no browser:
   - Login com conta `@rankmyapp.com.br`
   - Navegar até Oportunidades
   - Ver cards de métrica carregando
   - Ver tabela dinâmica renderizada
   - Exportar CSV
   - Acessar Dashboard e ver gráficos
   - Admin: acessar Configurações, criar coluna, criar card
   - Membro: confirmar que não acessa Configurações
4. Páginas desabilitadas (Mail, Chat, etc.) aparecem cinzas com tooltip
5. Tudo em português
6. Tema claro/escuro funcionando

---

## Fora do Escopo V1 (Backlog Futuro)
- B.1: Ícones editáveis nos cards
- B.3: Formato de retorno configurável (número/monetário/porcentagem)
- B.4: Estilização condicional de células + paleta de cores
- Trap de foco nos modais
- Testes automatizados
- Multi-página generalizada
- Exclusão definitiva de usuários
- E-mail de convite customizado