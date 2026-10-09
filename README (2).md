# Golden Vision · Plataforma

Plataforma de consultoria da Golden Vision, no mesmo modelo do Maartec Financeiro:

- **O app** (todas as telas) fica aqui no **GitHub Pages** e pode ser instalado no celular e no computador como aplicativo.
- **O servidor** é um Google Apps Script ligado a uma Planilha Google. Ele guarda os dados na planilha, os arquivos no Google Drive e protege o acesso com **e-mail + PIN** de cada pessoa da equipe.

```
App (GitHub Pages)  ──►  servidor /exec (Apps Script)  ──►  Planilha Google (dados) + Drive (arquivos)
```

## Arquivos deste repositório

| Arquivo | O que é |
|---|---|
| `index.html` | O app inteiro |
| `manifest.webmanifest`, `sw.js` | Permitem instalar como aplicativo e abrir mais rápido |
| `icone-192.png`, `icone-512.png`, `apple-touch-icon.png` | Ícones do aplicativo |
| `Codigo.gs` | O servidor. Uma cópia fica aqui; o que vale é o que está colado no Apps Script |

---

## Instalação (uma vez só)

### 1. Servidor (Google)
1. Crie uma Planilha Google nova, por exemplo **Golden Vision — dados**.
2. Abra **Extensões > Apps Script**, apague o que estiver lá e cole **todo** o `Codigo.gs`.
3. No começo do código, troque:
   - `ADMIN_EMAIL` pelo seu e-mail;
   - `PIN_INICIAL` pelo seu PIN (4 a 12 números).

   Salve com **Ctrl+S**.
4. Em **Configurações do projeto** (engrenagem), ajuste o **Fuso horário** para o da sua cidade (ex.: Recife).
5. No topo do editor, escolha a função **configurar** e clique em **Executar**. Autorize o acesso quando o Google pedir. Se aparecer "O Google não verificou este app", clique em **Avançado > Acessar**.
6. Clique em **Implantar > Nova implantação > App da Web**:
   - Executar como: **Eu**
   - Quem pode acessar: **Qualquer pessoa**
7. Clique em **Implantar** e copie o endereço que termina em **/exec**.

"Qualquer pessoa" só quer dizer que o app consegue falar com o servidor. Os dados continuam protegidos: o servidor só responde para quem entrou com e-mail e PIN válidos.

### 2. App (GitHub Pages)
1. Suba todos os arquivos deste repositório (já estão aqui).
2. Em **Configurações > Pages**, deixe a origem como a branch **main**, pasta **/ (root)**.
3. O app fica em: `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`

### 3. Primeiro acesso
1. Abra o endereço do GitHub Pages.
2. Cole o endereço **/exec** do servidor. Isso só é preciso uma vez em cada aparelho.
3. Entre com o e-mail e o PIN que você colocou no código.
4. Para instalar como aplicativo:
   - **Celular:** menu do navegador > **Adicionar à tela inicial**.
   - **Computador:** ícone de instalar, na barra de endereço do Chrome.

Para ninguém precisar colar o endereço /exec, abra o `index.html` aqui no GitHub, procure `SERVIDOR_PADRAO = ""` e coloque o endereço entre as aspas.

---

## Equipe e PINs

- O administrador cadastra as pessoas no app: clique no nome **Golden Vision** (topo da barra lateral) > **Equipe** > **Adicionar pessoa**, com nome, e-mail, papel e PIN inicial.
- Cada pessoa pode trocar o próprio PIN em **Golden Vision > Meu PIN**.
- Para tirar o acesso de alguém: **Equipe > Editar** e desmarque **Acesso ativo**.
- **Esqueceu o PIN de administrador?** No Apps Script, mude `PIN_INICIAL`, salve e execute **configurar** de novo. Isso também desconecta todos os aparelhos.
- Depois de 8 tentativas erradas, o e-mail fica bloqueado por 15 minutos.

## Onde ficam os dados

- **Planilha, aba `dados`:** uma linha por documento do app, com as colunas escopo (cliente), chave, resumo, data, quem salvou e o conteúdo. Textos grandes ocupam mais de uma linha (coluna "parte").
- **Planilha, aba `usuarios`:** e-mail, nome, papel e o PIN protegido. O PIN nunca fica guardado em texto aberto.
- **Google Drive, pasta "Golden Vision — arquivos dos clientes":** documentos enviados e PDFs salvos, com uma subpasta por cliente.
- **Histórico:** na planilha, **Arquivo > Histórico de versões**.
- **Backup:** no app, **Golden Vision > Baixar backup de tudo**.

## Boletim automático

- **Na janela Boletim (administrador):** ligue o envio, toda segunda-feira (resumo da semana) ou todo dia, no horário escolhido.
- **Em cada cliente:** marque "Enviar este boletim automaticamente" e informe os e-mails.

Os e-mails saem da conta Google que instalou o servidor.

## Atualizar depois

- **Mudou o app:** suba o `index.html` novo aqui no GitHub. Em 1 a 2 minutos o app atualiza; se ainda aparecer a versão antiga, recarregue com Ctrl+F5.
- **Mudou o servidor:** cole o `Codigo.gs` novo no Apps Script, salve e vá em **Implantar > Gerenciar implantações > lápis > Versão: Nova versão > Implantar**. O endereço /exec continua o mesmo.

## Problemas comuns

| Problema | O que fazer |
|---|---|
| "O servidor respondeu de um jeito inesperado" | Confira se o endereço termina em /exec e se a implantação está como "Qualquer pessoa" |
| "Servidor ainda não configurado" | Execute a função **configurar** no Apps Script |
| "E-mail ou PIN incorreto" | Confira o e-mail cadastrado; o administrador pode definir um PIN novo em Equipe |
| Mudei o código do servidor e nada mudou | Publique uma **Nova versão** em Gerenciar implantações |
| App mostra versão antiga | Ctrl+F5, ou feche e abra o app instalado |
