# Roadmap — Evolução FLAUKI

## 1. Base de dados / segurança
- [ ] tracks: status default pending, estado needs_fix
- [ ] favorites, notifications, admin_audit_log (RLS + grants)
- [ ] contact_messages: coluna status
- [ ] rever políticas storage

## 2. Rotas e navegação
- [ ] / -> /library (Página Inicial em /home)
- [ ] login/registo -> /library (com redirect param)
- [ ] recuperação de palavra-passe (/auth + /reset-password)
- [ ] menu: Biblioteca, Início, Perfil, Submissões, Favoritos, Enviar, Admin

## 3. Envio
- [ ] "Enviar nova música", "Título da música", "Arranjado pelo:", sem descrição
- [ ] PDF 10MB obrigatório, MP3 10MB opcional
- [ ] submissão fica pendente

## 4. Biblioteca e música
- [ ] pesquisa por título/arranjado/autor + filtros (recentes, com áudio)
- [ ] página de detalhe
- [ ] leitor de áudio próprio
- [ ] favoritos

## 5. Área do utilizador
- [ ] perfil (nome, palavra-passe)
- [ ] minhas submissões com estados e correção
- [ ] notificações in-app

## 6. Administração
- [ ] secções separadas + paginação
- [ ] mensagens com estados, seleção e eliminação múltipla
- [ ] auditoria de ações

## 7. Final
- [ ] mobile-first
- [ ] typecheck/build + teste dos fluxos
