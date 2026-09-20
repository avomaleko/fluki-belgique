# Evolução integrada da Biblioteca FLAUKI BELGIQUE

Plano para aplicar os 14 requisitos e as 13 melhorias sobre a aplicação existente, sem recriar nada e preservando todos os dados e músicas já cadastradas.

## Um ponto que preciso de confirmar

O item **B** pede que cada nova submissão comece como **Pendente** e aguarde aprovação do administrador. Numa conversa anterior ficou definido o contrário: **auto-aprovar tudo e publicar diretamente** (foi mesmo assim que a aplicação está hoje).

Vou seguir o item B, que é o pedido mais recente: **as novas músicas passam a ficar pendentes até o administrador aprovar**. As músicas que já existem continuam publicadas — nada desaparece. Se preferir manter a publicação imediata, diga e removo essa parte antes de começar.

## O que muda para quem usa a aplicação

### Entrada e navegação
- Ao abrir o site, a pessoa chega diretamente à **Biblioteca Musical**. A Página Inicial continua a existir e fica acessível pelo menu.
- Menu (lateral e topo) passa a mostrar: Biblioteca, Página Inicial, A minha área, Minhas submissões, Favoritos, Enviar nova música, Contacte-nos e — só para administradores — Administração.
- Entrar ou criar conta com sucesso leva sempre à Biblioteca (exceto quando a pessoa tinha começado uma ação que exigia conta; nesse caso volta a essa ação).

### Formulário de envio
- Título passa a "Enviar nova música"; "Título" passa a "Título da música"; "Autor do hino" passa a "Arranjado pelo:"; o campo Descrição é removido.
- Limites verificados antes de submeter e novamente no envio: PDF obrigatório até 10 MB, MP3 opcional até 10 MB.
- Qualquer conta autenticada pode enviar. Cada envio fica ligado a quem o enviou.

### Biblioteca e cada música
- Pesquisa por título, "Arranjado pelo" e autor; filtros por Todas, Mais recentes, categorias e Com áudio / Sem áudio; paginação e contagem mantidas.
- Cada música tem a sua página com título, arranjado pelo, categoria, PDF, áudio, data e ações (favoritar, partilhar, descarregar quando permitido, editar/eliminar para quem tem direito).
- Leitor de áudio próprio dentro da aplicação: play/pause, barra de progresso arrastável, tempo, volume e desenho pensado para telemóvel.
- Favoritos: coração em cada música e uma página "Favoritos" com tudo o que a pessoa guardou.

### A minha área
- Perfil com nome e e-mail, alteração de nome, alteração de palavra-passe, lista de favoritos e lista das músicas enviadas.
- "Minhas submissões" mostra o estado de cada envio: Pendente, Publicada, Requer correção ou Rejeitada, com o motivo escrito pelo administrador e botão para corrigir e pedir nova revisão.
- Um sino de notificações no topo avisa quando o estado de um envio muda; as notificações ficam guardadas e podem ser marcadas como lidas.

### Palavra-passe esquecida
- Ligação "Esqueci-me da palavra-passe" no acesso, envio de e-mail de reposição e uma página própria para definir a nova palavra-passe.

### Administração
- Painel reorganizado por secções: Estatísticas, Músicas, Submissões pendentes, Utilizadores, Mensagens, Categorias e Registo de atividade.
- Mensagens de contacto com estados (Nova, Em análise, Respondida, Arquivada), filtros, leitura completa, seleção múltipla com eliminação em massa e eliminação individual.
- Aprovar / pedir correção / rejeitar submissões com motivo, que chega à pessoa que enviou.
- Registo de atividade: cada ação relevante do administrador (aprovar, rejeitar, editar, eliminar, mexer em mensagens, utilizadores ou categorias) fica registada com quem fez e quando.
- Todo o painel é protegido no servidor, não apenas escondendo botões.

### Correções
- O erro ao enviar mensagem de contacto vem de o formulário tentar ler de volta a mensagem que acabou de gravar, algo que as regras de segurança (corretamente) não permitem a visitantes. Corrige-se deixando de ler de volta — sem enfraquecer as regras.
- Os ficheiros continuam visíveis e reproduzíveis por qualquer pessoa, incluindo visitantes sem conta, para as músicas publicadas.

## Parte técnica

### Migrações (compatíveis, sem apagar nada)
1. `tracks`: `description` mantém-se na base (não se apaga coluna), apenas sai do formulário. Novo default de `status` = `'pending'`; linhas existentes permanecem `approved`. Novo estado aceite: `needs_fix`.
2. Nova tabela `favorites (user_id, track_id)` com RLS estrita ao próprio utilizador.
3. Nova tabela `notifications (user_id, title, body, track_id, read_at)` — RLS: leitura/atualização só do próprio; inserção por trigger security-definer na mudança de `tracks.status`.
4. Nova tabela `admin_audit_log (actor_id, action, entity, entity_id, details, created_at)` — leitura só admin, inserção via função security-definer.
5. `contact_messages`: adicionar coluna `status` (`new|in_review|answered|archived`, default `new`), manter `is_read` para compatibilidade. Política de INSERT para `anon`/`authenticated` mantida; nenhuma política de SELECT para anónimos.
6. Grants explícitos em todas as tabelas novas (`authenticated`, `service_role`; `anon` só onde já é público).
7. Políticas de Storage revistas: leitura pública apenas de objetos de tracks `approved`; update/delete só do dono ou admin.

### Rotas
- `src/routes/index.tsx` passa a redirecionar para `/library` (`beforeLoad`), e a Página Inicial move-se para `src/routes/home.tsx` com o seu próprio `head()`.
- Novas: `profile.tsx`, `favorites.tsx`, `my-submissions.tsx`, `reset-password.tsx`.
- `auth.tsx`: aba "Recuperar", `redirect` search param, navegação pós-login para `/library`.
- `admin.tsx`: divide-se em `src/components/admin/*` (TracksPanel, PendingPanel, UsersPanel, MessagesPanel, CategoriesPanel, StatsPanel, AuditPanel) para o ficheiro deixar de ter 800 linhas.
- Auditoria: `head()` único e completo (OG/Twitter) em todas as rotas de conteúdo.

### Componentes novos
- `AudioPlayer.tsx` (leitor próprio), `FavoriteButton.tsx`, `NotificationBell.tsx`, `StatusBadge.tsx`, `DataTablePagination.tsx`.

### Segurança
- Escritas sensíveis (aprovar/rejeitar, gerir utilizadores, apagar mensagens) passam por server functions com `requireSupabaseAuth` e verificação de papel `admin` via `has_role`, além das RLS.

### Ordem de execução
1. Migrações. 2. Rotas/redireccionamento e correção do contacto. 3. Formulário de envio + fluxo pendente. 4. Detalhe da música, leitor de áudio, favoritos. 5. Perfil, submissões, notificações. 6. Painel admin com mensagens, auditoria e paginação. 7. Revisão mobile e teste das rotas principais.
