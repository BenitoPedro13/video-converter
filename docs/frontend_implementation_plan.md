# Plano de Implementação do Frontend

Este documento descreve a arquitetura e o plano de implementação para o frontend da aplicação de conversão de vídeo.

## Visão Geral

O frontend será construído utilizando **Next.js** (App Router) e servirá como a interface principal para os usuários interagirem com o sistema de microsserviços através do **Gateway Service**.

## Stack Tecnológico

- **Framework**: Next.js 14+ (App Router)
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS
- **Cliente HTTP**: Axios
- **Gerenciamento de Estado**: React Context (para Auth) + Local State

## Estrutura de Diretórios Sugerida

```
apps/frontend/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/          # Página de Login
│   │   │   │   └── page.tsx
│   │   │   └── register/       # Página de Registro
│   │   │       └── page.tsx
│   │   ├── dashboard/          # Área logada (Upload/Download)
│   │   │   └── page.tsx
│   │   ├── layout.tsx          # Layout principal (Providers)
│   │   └── page.tsx            # Landing Page (Redireciona para login)
│   ├── components/
│   │   ├── ui/                 # Componentes base (Botões, Inputs, Cards)
│   │   ├── auth/               # Formulários de Login/Registro
│   │   └── converter/          # Componentes de Upload e Status
│   │       ├── file-uploader.tsx
│   │       └── status-tracker.tsx
│   ├── lib/
│   │   ├── api.ts              # Cliente Axios configurado com Interceptors
│   │   └── auth-context.tsx    # Contexto de Autenticação (Login/Logout)
│   └── types/                  # Definições de tipos TS
```

## Fluxos do Usuário e Integração com Backend

Todas as requisições devem ser feitas para o **Gateway Service**.

### 1. Autenticação

**Serviço Alvo**: Auth Service (via Gateway)

- **Registro (`/register`)**:

  - **Endpoint**: `POST /auth/register`
  - **Payload**: `{ "email": "user@example.com", "password": "securePass" }`
  - **Sucesso**: Redirecionar para Login.

- **Login (`/login`)**:
  - **Endpoint**: `POST /auth/login`
  - **Payload**: `{ "email": "user@example.com", "password": "securePass" }`
  - **Sucesso**: Recebe um JWT (`access_token`).
  - **Ação**: Armazenar o token (localStorage ou Cookie) e redirecionar para `/dashboard`.

### 2. Upload de Arquivo

**Serviço Alvo**: Converter Service (via Gateway)

- **Interface**: Página `/dashboard`.
- **Ação**: Usuário seleciona um arquivo de vídeo e clica em "Converter".
- **Endpoint**: `POST /converter/upload`
- **Headers**:
  - `Authorization: Bearer <token>`
  - `Content-Type: multipart/form-data`
- **Resposta**:
  ```json
  {
    "message": "File uploaded successfully",
    "fileId": "674...",
    "filename": "video.mp4"
  }
  ```
- **Comportamento**: O backend inicia a conversão assincronamente. O frontend deve guardar o `filename` para monitoramento.

### 3. Monitoramento de Status (Polling)

**Desafio**: O backend atual não possui WebSockets ou endpoint de status dedicado para o frontend consultar o progresso.

**Estratégia**:

1.  Após o upload, a UI entra em estado de "Processando...".
2.  O frontend inicia um **Polling** (verificação periódica) a cada 3-5 segundos.
3.  **Endpoint de Verificação**: Tentar baixar o arquivo convertido.
    - `GET /converter/download/{filename}` (onde filename é o nome original do arquivo).
4.  **Lógica**:
    - Se retornar `404 Not Found` ou erro similar -> O arquivo ainda não está pronto. Continuar aguardando.
    - Se retornar `200 OK` (ou headers de arquivo) -> A conversão foi concluída.
5.  **Atualização da UI**: Exibir botão de "Download Concluído" ou iniciar o download automaticamente.

### 4. Download do Arquivo

**Serviço Alvo**: Converter Service (via Gateway)

- **Ação**: Usuário clica para baixar o MP3.
- **Endpoint**: `GET /converter/download/{filename}`
- **Nota**: O backend converte o nome internamente para `converted-{filename}.mp3`, mas a rota espera o nome original (ou o nome que foi retornado no upload).

## Considerações de Segurança

- O Token JWT deve ser enviado no header `Authorization` em todas as requisições para rotas protegidas (`/converter/*`).
- Tratar erros de expiração de token (401) redirecionando o usuário para o login.
