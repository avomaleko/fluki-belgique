# Remix of Remix of Biblioteca FLAUKI BELGIQUE

Crie uma aplicação web chamada “Biblioteca Musical - FLAUKI”.

A aplicação deve permitir aos utilizadores armazenar e organizar conteúdos em formato PDF com anexos de áudio e imagem.

---

📂 FUNCIONALIDADES

1. Upload de arquivos

- Upload de arquivos PDF (obrigatório)
- Título obrigatório
- Descrição opcional
- Categoria obrigatória
- Anexos opcionais:
  - Áudio (MP3)
  - Imagens

---

2. Categorias

- Alegria
- Adoração a Deus
- Louvor a Deus
- Súplicas ao Senhor
- Morte
- Casamento
- Alertas de Deus
- Generativas / Históricas


---

3. Visualização

- Leitor de PDF integrado na plataforma
- Reprodução de áudio dentro da interface
- Visualização de imagens anexadas

---

4. Organização

- Filtro por categoria
- Pesquisa por título
- Ordenação por nome (A-Z)

---

5. Sistema de utilizadores e permissões

👤 Utilizadores normais

- Podem visualizar todos os arquivos
- Podem reproduzir áudio e abrir PDFs
- NÃO podem enviar, editar ou eliminar arquivos

📤 Utilizadores autorizados (uploaders)

- Podem enviar arquivos PDF e anexos
- Necessitam de validação pelo administrador

🛠️ Administrador

- E-mail: manobv511@gmail.com
- Código de registo: mbm_060801
- Pode autorizar novos utilizadores para envio de arquivos
- Pode gerir permissões de upload

👁️ Utilizador anónimo

- Pode apenas visualizar e reproduzir conteúdos
- Não pode fazer upload nem alterações

---

6. Interface

- Design moderno, limpo e espiritual
- Estilo de cores azul-esverdeado (inspirado no estilo Kimbanguista)
- Modo escuro opcional
- Totalmente responsiva (mobile e desktop)

---

🎯 OBJETIVO

Criar uma biblioteca musical multimédia onde os utilizadores podem guardar, organizar e consumir conteúdos religiosos de forma intuitiva, segura e bem estruturada.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://fluki-belgique.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d05551f9-a7b6-4f70-b7b1-938849de4b9c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
