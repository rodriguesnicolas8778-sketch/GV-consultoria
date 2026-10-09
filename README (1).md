# Golden Vision · Plataforma interna

Guia completo para criar a plataforma de gestão de clientes da Golden Vision no Google (Apps Script + Planilhas + Drive).

A plataforma roda inteira dentro da conta Google da Golden Vision:
- a página é um **App da Web do Apps Script**;
- os dados ficam numa **Planilha Google**;
- os arquivos dos clientes ficam numa **pasta do Google Drive**.

Ela não usa inteligência artificial e nenhum dado de cliente sai do Google.

---

## Arquivos

| Arquivo | Onde fica | O que faz |
|---|---|---|
| `app.html` | GitHub | A página da plataforma (todas as telas e a logo). O Apps Script busca este arquivo do GitHub a cada acesso. |
| `index.html` | GitHub | Página de entrada do GitHub Pages: abre a plataforma pelo endereço github.io |
| `Codigo.gs` | GitHub e Apps Script (colado no Código.gs) | Servidor: planilha, Drive, controle de acesso e boletim |
| `README.md` | GitHub | Este guia |

### Como as peças se ligam

```
github.io/GV-consultoria  ──►  link /exec do Apps Script  ──►  busca app.html no GitHub
                                        │
                                        └──►  Planilha Google (dados) e Drive (arquivos)
```

- Para mudar a plataforma, basta atualizar o `app.html` no GitHub. Não precisa mexer no Apps Script.
- O repositório precisa ser **público** para o Apps Script conseguir ler o `app.html`. Ele contém só código; nenhum dado de cliente fica no GitHub.
- Se o seu usuário ou o nome do repositório no GitHub mudarem, atualize a linha `PAGINA_GITHUB` no `Código.gs`.

---

## Passo a passo da criação

### Passo 1. Conta Google

Use a conta da Golden Vision. O ideal é **Google Workspace**, com e-mail @seudominio.com.br, por três motivos:
- os consultores usam o app sem conseguir abrir a planilha diretamente;
- o Google informa com segurança quem está acessando;
- você tem o contrato de proteção de dados do Google, que ajuda na LGPD.

Gmail comum também funciona; veja o Passo 7.

Ative a **verificação em duas etapas** nessa conta antes de começar.

### Passo 2. Criar a planilha

1. Em sheets.google.com, crie uma planilha em branco.
2. Dê o nome **Golden Vision - Plataforma**.

### Passo 3. Abrir o Apps Script

1. Na planilha: **Extensões > Apps Script**.
2. Renomeie o projeto (no topo, "Projeto sem título") para **Golden Vision - Plataforma**.

### Passo 4. Colar o código

1. No arquivo `Código.gs` que já vem aberto, apague tudo e cole o conteúdo de **Codigo.gs**.
2. Salve (Ctrl+S).

Não é preciso criar arquivo HTML no Apps Script: a página vem do `app.html` do GitHub. Na primeira execução, o Google pede autorização para "conectar a um serviço externo"; é para buscar o `app.html`.

### Passo 5. Ajustar o fuso horário

1. **Configurações do projeto** (ícone de engrenagem à esquerda).
2. Em **Fuso horário**, escolha **(GMT-03:00) Recife** ou o da sua cidade.

É o fuso que define o "hoje" dos registros e do boletim.

### Passo 6. Rodar a configuração inicial

1. Volte para o editor e, no topo, escolha a função **configurar**.
2. Clique em **Executar**.
3. O Google pede autorização: **Revisar permissões** > escolha a conta.
4. Se aparecer "O Google não verificou este app", clique em **Avançado > Acessar Golden Vision - Plataforma (não seguro)**. O aviso aparece para todo script novo; o app é seu.
5. Autorize o acesso a planilhas, Drive, envio de e-mail e execução programada.

Ao terminar:
- a planilha ganha todas as abas (veja "Estrutura da planilha");
- no Drive aparece a pasta **Golden Vision - Plataforma (arquivos)**;
- o seu e-mail entra na aba **Usuarios** como administrador.

### Passo 7. Publicar como App da Web

**Implantar > Nova implantação > ícone de engrenagem > App da Web.**

**A) Google Workspace (recomendado)**
- Descrição: `Versão 1`
- Executar como: **Eu**
- Quem pode acessar: **Qualquer pessoa em seudominio.com.br**

**B) Contas Gmail comuns**
- Executar como: **Usuário que acessa o app da Web**
- Quem pode acessar: **Qualquer pessoa com Conta do Google**
- Compartilhe a planilha **e** a pasta "Golden Vision - Plataforma (arquivos)" como **Editor** com cada consultor, sempre por e-mail e nunca por "qualquer pessoa com o link".

Clique em **Implantar** e copie a **URL que termina em `/exec`**. Esse é o endereço da plataforma.

**Endereço pelo GitHub:** no repositório, abra o `index.html`, clique no lápis (editar) e troque `COLE_AQUI_O_LINK_EXEC` pelo link `/exec`. Salve com "Confirmar alterações". Depois, em **Configurações > Pages**, deixe a origem como a branch **main**. O endereço `https://rodriguesnicolas8778-sketch.github.io/GV-consultoria/` passa a abrir a plataforma.

### Passo 8. Liberar a equipe

Na aba **Usuarios** da planilha, uma linha por pessoa:

| email | nome | papel | ativo |
|---|---|---|---|
| voce@goldenvision.com.br | Seu nome | admin | sim |
| ana@goldenvision.com.br | Ana Souza | consultor | sim |

- **admin**: tudo, mais excluir clientes, importar backup e ligar o envio automático do boletim.
- **consultor**: todo o trabalho com os clientes.
- Para tirar o acesso de alguém, troque **ativo** para `não`.

Quem não está na lista vê a mensagem "Acesso não liberado".

### Passo 9. Primeiro acesso

1. Abra a URL `/exec`. A logo da Golden Vision já vem instalada.
2. Clique no nome **Golden Vision**, no topo da barra lateral, para conferir o nome, o complemento e a cor.
3. Clique em **Novo cliente** e cadastre a DM Construção.
4. Dentro do cliente, clique no quadrado com as iniciais para enviar a logo do cliente.

### Passo 10. Trazer os dados do app anterior (opcional)

1. No app antigo, no Claude: **Golden Vision e backup > Baixar backup de tudo**.
2. Na plataforma nova, como admin: **Golden Vision e backup > Importar backup**.

Vêm clientes, anotações, diagnósticos, funcionários, SWOT e pareceres. Os arquivos originais dos documentos não vêm junto.

---

## Estrutura do app

**Tela inicial: Clientes**
- Resumo da carteira: clientes ativos, pendências abertas e adequação média.
- Um cartão por cliente, com filtros (ativos, em pausa, encerrados, só os meus) e busca.
- **Novo cliente**: nome, segmento, consultor responsável, situação, CNPJ, cidade, contato, telefone, e-mail, início e escopo do contrato.

**Dentro de cada cliente (menu da barra lateral)**

| Grupo | Tela | Para que serve |
|---|---|---|
| | **Painel** | Visão geral: indicadores, plano de ação, intervenções, pontos principais, setores, ritmo de alimentação, SWOT e últimas anotações. Tem o registro rápido no topo. |
| Setores da empresa | **Gestão, Contabilidade, Vendas, RH, Marketing** (e as abas que você criar) | Cada setor tem quatro abas: **Diagnóstico** (dados da área e checklist com nota de adequação), **Indicadores** (números do setor), **Observações** (diário) e, no RH, **Funcionários**. |
| Gestão em tempo real | **Indicadores** | Registrar valores quando tiver o dado e ver os gráficos de evolução |
| | **Plano de ação** | Deficiências e ações com responsável, prazo e próxima ação; mostra as atrasadas |
| Intervenção | **Prioridades (GUT)** | Nota de Gravidade, Urgência e Tendência para cada deficiência; as 5 maiores são os pontos principais |
| | **Intervenções** | O que a Golden Vision está fazendo: etapas e resultado antes × depois nos indicadores e no checklist |
| Diagnóstico | **Análise SWOT** | Forças, fraquezas, oportunidades e ameaças |
| | **Documentos** | Arquivos entregues pela empresa, guardados no Drive com tipo, setor, mês e observações |
| | **Evolução mensal** | Fechamento do mês e gráficos mês a mês |
| | **Relatórios** | PDF para o cliente (veja abaixo) |

**Relatórios disponíveis**
1. Diagnóstico completo
2. Relatório do período
3. Plano de ação
4. Análise SWOT
5. Resultados das intervenções
6. Evolução mensal

Cada um pode ser **baixado em PDF**, **salvo no Drive** (na pasta do cliente) ou **baixado para imprimir**.

**Boletim**: resumo de um período (hoje, 7, 15 ou 30 dias). Pode ser copiado para o WhatsApp, enviado por e-mail na hora ou enviado automaticamente toda segunda-feira (ou todo dia).

---

## O método dentro da plataforma

1. **Diagnosticar.** Alimente cada setor quando tiver informação: checklist, dados da área, anotações, documentos e indicadores.
2. **Priorizar.** Na Matriz GUT, dê notas às deficiências. As maiores notas são os pontos principais.
3. **Intervir.** Para cada ponto principal, crie uma intervenção com:
   - objetivo;
   - etapas com responsável e prazo;
   - os indicadores e itens do checklist que vão medir o resultado.
4. **Medir o resultado.** A plataforma compara automaticamente antes × depois e monta o relatório **Resultados das intervenções** para o cliente.

### Rotina sugerida

| Quando | O que fazer |
|---|---|
| Sempre que tiver informação | Anotar no setor, registrar o valor do indicador, guardar documentos |
| Toda semana | Revisar o plano de ação e as etapas das intervenções; o boletim semanal chega na segunda |
| Toda mês | Revisar o checklist e os dados dos setores; **Fechar o mês** em Evolução mensal; entregar o relatório ao cliente |
| A cada novo diagnóstico | Atualizar as notas GUT e escolher as próximas intervenções |

---

## Estrutura da planilha

Cada aba é uma tabela. Os registros de cada cliente se ligam pela coluna `cliente_id`.

| Aba | O que guarda |
|---|---|
| Usuarios | Quem pode acessar e o papel de cada um |
| Configuracoes | Nome, cor e logo da Golden Vision; horário do boletim automático |
| Clientes | Cadastro dos clientes e o resumo que aparece nos cartões |
| ConfigCliente | Cor, logo, abas, parecer, consultor, pasta do Drive e boletim de cada cliente |
| Observacoes | Diário: deficiências, pontos positivos, ações e anotações, com responsável, prazo, nota GUT e intervenção |
| DadosArea | Dados de cada setor (faturamento, orçamentos, regime etc.) |
| Checklist | Respostas do checklist (Sim, Parcial, Não, N/A) com observação |
| Indicadores | Cadastro dos indicadores, com meta e limite |
| Lancamentos | Cada valor registrado: cliente, data, indicador, valor e quem registrou |
| Intervencoes | Intervenções, com objetivo, datas, indicadores e checklist ligados e resultado |
| Funcionarios | Equipe de cada cliente |
| SWOT | Itens da análise SWOT |
| Documentos | Documentos guardados (o arquivo fica no Drive) |
| Fechamentos | Uma linha por cliente e mês fechado |
| Evolucao | Uma linha por cliente, mês, setor e indicador; serve para gráficos e tabelas dinâmicas no Sheets |

**Regras para editar à mão:**
- não renomeie abas nem colunas;
- não altere as colunas `id` e `cliente_id`;
- textos acima de 45 mil caracteres vão automaticamente para a pasta `_textos` do Drive, e a célula fica com `drive:` mais um código;
- se algo der errado, use **Arquivo > Histórico de versões** na planilha.

---

## Atualizar a plataforma depois

- **Mudou só a página (`app.html`)**: suba o arquivo novo no GitHub. A plataforma muda em poucos minutos, sem mexer no Apps Script.
- **Mudou o `Codigo.gs`**: cole no Apps Script, salve e publique uma nova versão (**Implantar > Gerenciar implantações** > lápis > **Versão: Nova versão** > **Implantar**).

A URL continua a mesma. Abas novas da planilha são criadas sozinhas no primeiro uso.

---

## Segurança: checklist

- [ ] Verificação em duas etapas em todas as contas Google da equipe.
- [ ] Planilha e pasta do Drive **nunca** compartilhadas por link público.
- [ ] Aba Usuarios revisada sempre que alguém entra ou sai da equipe.
- [ ] Backup em arquivo de vez em quando (**Golden Vision e backup > Baixar backup de tudo**), guardado em local protegido.
- [ ] Contrato com cada cliente prevendo o armazenamento dos dados e documentos dele no Google Drive da Golden Vision (LGPD).

---

## Problemas comuns

| Problema | O que fazer |
|---|---|
| "Acesso não liberado" | Incluir o e-mail na aba Usuarios, com ativo = sim |
| "Não foi possível identificar sua conta Google" | Com Gmail comum, publicar como "Usuário que acessa o app" (Passo 7, opção B) |
| "A aba X não existe" | Rodar a função **configurar** de novo; ela não apaga dados |
| Mudei o código e nada mudou | Publicar uma **Nova versão** em Gerenciar implantações |
| O boletim automático não chega | O admin precisa ligar o envio na janela Boletim; o cliente precisa estar marcado com e-mails; conferir o fuso horário |
| Data dos registros um dia errado | Conferir o fuso horário nas Configurações do projeto |

## Limites

- Documentos até 25 MB por arquivo.
- E-mails do boletim: cerca de 100 destinatários por dia em contas Gmail e 1.500 no Workspace.
- A tela confere a planilha a cada minuto para mostrar o que os colegas registraram.
- A página baixa da internet só fontes do Google e o gerador de PDF. Nenhum dado de cliente sai do Google.
