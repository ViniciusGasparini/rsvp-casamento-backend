# Backend RSVP — Vinicius & Noemia

API Node.js + Express + MongoDB Atlas para controlar a confirmação de presença por família e por convidado.

## Modelo mantido

A coleção `convidados` mantém os mesmos campos da planilha:

```text
ID
Nome
Sobrenome
ID_Familiar
Confirmacao
Filhos
F1
F2
F3
F4
F5
F6
Mensagem
Data_Confirmacao
```

- `ID_Familiar`: token compartilhado pelas pessoas do mesmo convite e usado na URL.
- `ID`: identificador individual de cada convidado.
- `Confirmacao` e `Sobrenome`: são atualizados individualmente.
- `Filhos`, `F1` a `F6`, `Mensagem` e `Data_Confirmacao`: são dados familiares e são repetidos em todos os registros daquela família para preservar a estrutura atual.
- Cada campo `F1` a `F6` é salvo como `Nome da criança | idade`.

## Segurança aplicada

- O navegador nunca recebe a conexão do MongoDB.
- O backend ignora nomes enviados pelo navegador e usa os nomes existentes no banco.
- Antes de atualizar, o backend confere se todos os IDs individuais enviados pertencem ao `ID_Familiar` da URL.
- Não é possível enviar um ID de outra família ou omitir uma pessoa do convite.
- A confirmação fica bloqueada depois do primeiro envio por padrão.
- Há limitação de requisições, CORS restrito, Helmet e limite de tamanho do JSON.
- A atualização da família usa uma transação do MongoDB para evitar gravação parcial.

## Requisitos

- Node.js 20.19 ou superior.
- Cluster MongoDB Atlas.
- Usuário de banco de dados no Atlas.

## Instalação local

No PowerShell, dentro desta pasta:

```powershell
npm install
Copy-Item .env.example .env
```

Edite o `.env` com a conexão real do Atlas.

Exemplo:

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=rsvp_casamento
ALLOWED_ORIGINS=http://127.0.0.1:5500,http://localhost:5500
ALLOW_RSVP_UPDATES=false
```

Se a senha tiver caracteres especiais, use a versão codificada na URL fornecida pelo Atlas.

## Importar a planilha CSV

O arquivo está em:

```text
data/Lista de Confirmação.csv
```

Execute:

```powershell
npm run import:csv
```

O modo padrão é seguro: atualiza nome e vínculo familiar, mas preserva sobrenomes preenchidos e confirmações já existentes.

Para substituir também as respostas pelos valores do CSV:

```powershell
npm run import:csv -- --replace-responses
```

Use `--replace-responses` somente quando tiver certeza, porque ele pode apagar respostas do banco se o CSV estiver vazio nesses campos.

## Executar

```powershell
npm run dev
```

Teste:

```text
http://localhost:3000/api/health
http://localhost:3000/api/convites/oElnry059n8QGKCU
```

## Rotas

### Saúde

```http
GET /api/health
```

### Consultar convite

```http
GET /api/convites/:familyId
```

### Registrar resposta

```http
PUT /api/convites/:familyId/resposta
Content-Type: application/json
```

Exemplo de corpo:

```json
{
  "chave": "oElnry059n8QGKCU",
  "convidados": [
    {
      "id": "1",
      "nome": "Vinicius",
      "sobrenome": "Gasparini",
      "status": "confirmado"
    },
    {
      "id": "2",
      "nome": "Noemia",
      "sobrenome": "",
      "status": "nao_comparecera"
    }
  ],
  "possuiFilhosEntre6e17": true,
  "filhos": [
    {
      "nome": "Nome da criança",
      "idade": 8
    }
  ],
  "mensagem": "Nos vemos no casamento!"
}
```

O campo `atualizadoEm` enviado pelo navegador não é usado. A data válida é criada pelo servidor.

## Publicar no Render

### Opção pelo painel

1. Crie um repositório GitHub somente para esta pasta.
2. No Render, clique em **New > Web Service**.
3. Conecte o repositório.
4. Runtime: **Node**.
5. Build Command:

```text
npm install --no-audit --no-fund
```

6. Start Command:

```text
npm start
```

7. Health Check Path:

```text
/api/health
```

8. Cadastre as variáveis:

```text
NODE_ENV=production
MONGODB_URI=...
MONGODB_DB_NAME=rsvp_casamento
ALLOWED_ORIGINS=https://SEU-PROJETO.vercel.app
ALLOW_RSVP_UPDATES=false
```

### Opção Blueprint

O arquivo `render.yaml` já está preparado. No Render, escolha **New > Blueprint**, conecte o repositório e preencha os valores secretos solicitados.

## Correção manual de uma resposta

Por padrão, uma família não pode reenviar. Para liberar temporariamente reenvios:

```text
ALLOW_RSVP_UPDATES=true
```

Depois da correção, volte para `false`. Para um controle mais rígido, prefira ajustar o documento diretamente no MongoDB Compass.
