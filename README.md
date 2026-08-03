# Studek MKT Analytics

Plataforma full-stack para monitorar, analisar e comparar perfis públicos do Instagram. A aplicação mantém snapshots históricos, métricas por coleta e dados normalizados de posts sem expor o token da Apify ao navegador.

## Recursos implementados

- Login JWT com usuário administrador inicial, bcrypt, rate limit, Helmet e validação Zod.
- Cadastro, edição, busca, ativação e remoção de perfis.
- Coletas assíncronas pelo Actor `apify/instagram-scraper`, com atualização, retry e cancelamento.
- Importação transacional de perfil, posts, métricas e hashtags; deduplicação e preservação do histórico.
- Dashboard geral e individual, gráficos de audiência, formatos e ranking de conteúdo.
- Comparação de dois ou mais perfis e grupos salvos.
- Exportação CSV de posts e comparações.
- MySQL 8.4 com `utf8mb4`, índices, volume persistente e health checks.
- Interface responsiva para desktop, tablet e celular.

## Desenvolvimento local

Requisitos: Node.js 22+ e MySQL 8.

1. Copie `.env.example` para `.env` e ajuste as credenciais. Para banco remoto, prefira `DATABASE_URL=mysql://usuario:senha@host:porta/banco`. Para MySQL local, deixe `DATABASE_URL` vazia, use `DB_HOST=localhost` e `FRONTEND_URL=http://localhost:5173`.
2. Crie o banco e o usuário definidos no `.env`. As tabelas e o administrador serão criados automaticamente na inicialização.
3. Instale e execute:

```bash
npm install
npm run dev
```

Frontend: `http://localhost:5173`. API: `http://localhost:3000`. O login inicial usa `ADMIN_EMAIL` e `ADMIN_PASSWORD`.

## Docker Compose

Crie o `.env` antes de subir os containers:

```bash
docker compose up --build -d
```

A aplicação estará em `http://localhost:3000`. O MySQL não publica porta no host e persiste seus dados no volume `instagram_mysql_data`.

## Configuração da Apify

Defina `APIFY_TOKEN` apenas no ambiente do backend. Uma coleta completa inicia duas execuções (detalhes e posts), salva os respectivos `runId` e `datasetId` e acompanha ambas automaticamente. Quando uma execução termina, o dataset é importado em uma transação MySQL. O botão **Atualizar** também permite uma consulta imediata. O payload usa `directUrls`, `resultsType`, `resultsLimit`, `onlyPostsNewerThan`, `addParentData` e `addProfileStatistics`.

No dashboard individual, o botão **Atualizar Instagram** inicia o Actor diretamente, acompanha as execuções de detalhes e publicações e atualiza os gráficos assim que o dataset retornado pela Apify é processado. Não é necessário baixar ou importar arquivos manualmente.

## Publicação no EasyPanel

1. Crie um serviço MySQL com a imagem `mysql:8.4`, porta interna `3306` e volume em `/var/lib/mysql`.
2. Configure `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD` e `MYSQL_ROOT_PASSWORD` nesse serviço.
3. Crie o serviço da aplicação a partir deste repositório e do `Dockerfile`. Use porta interna `3000` e health check `/api/health`.
4. Configure `DB_HOST` com o nome interno do serviço MySQL, além de `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `APIFY_TOKEN`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` e `FRONTEND_URL`.
5. Não exponha o serviço MySQL publicamente. Publique somente a aplicação por domínio HTTPS.

## Comandos de verificação

```bash
npm run typecheck
npm test
npm run build
```

## API principal

Os endpoints ficam sob `/api`: autenticação, perfis, coletas, dashboard, histórico, hashtags, comparações, grupos e exportação. Exceto `/api/health` e `/api/auth/login`, todos exigem `Authorization: Bearer <token>`.
