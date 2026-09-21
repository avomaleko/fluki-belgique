# Roadmap — Evolução FLAUKI

## 1. Base de dados / segurança
- [x] tracks: status default pending, estado needs_fix
- [x] favorites, notifications, admin_audit_log (RLS + grants)
- [x] contact_messages: coluna status
- [x] rever políticas storage

## 2. Rotas e navegação
- [x] / -> /library (Página Inicial em /home)
- [x] login/registo -> /library (com redirect param)
- [x] recuperação de palavra-passe (/auth + /reset-password)
- [x] menu: Biblioteca, Início, Perfil, Submissões, Favoritos, Enviar, Admin

## 3. Envio
- [x] "Enviar nova música", "Título da música", "Arranjado pelo:", sem descrição
- [x] PDF 10MB obrigatório, MP3 10MB opcional
- [x] submissão fica pendente

## 4. Biblioteca e música
- [x] pesquisa por título/arranjado/autor + filtros (recentes, com áudio)
- [x] página de detalhe
- [x] leitor de áudio próprio
- [x] favoritos

## 5. Área do utilizador
- [x] perfil (nome, palavra-passe)
- [x] minhas submissões com estados e correção
- [x] notificações in-app

## 6. Administração
- [x] secções separadas + paginação
- [x] mensagens com estados, seleção e eliminação múltipla
- [x] auditoria de ações

## 7. Final
- [x] mobile-first (testado a 390px)
- [ ] aviso de marcação `<div>` dentro de `<p>` nos separadores (gera erro de hidratação na consola)
- [ ] typecheck/build finais depois das últimas alterações
