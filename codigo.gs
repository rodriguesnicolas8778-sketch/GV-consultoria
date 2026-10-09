/**
 * GOLDEN VISION CONSULTORIAS — Plataforma interna
 * Google Apps Script + Google Planilhas — sem IA: nenhum dado sai do Google.
 *
 * Como instalar: veja o arquivo LEIA-ME.md.
 * Resumo: crie uma planilha vazia > Extensões > Apps Script > cole este arquivo no Código.gs.
 * A página (app.html) é buscada do GitHub. Rode a função "configurar" uma vez e implante como App da Web.
 */

/* ===================== estrutura da planilha ===================== */
const TABELAS = {
  Usuarios:       ['email', 'nome', 'papel', 'ativo'],
  Configuracoes:  ['chave', 'valor'],
  Clientes:       ['id', 'nome', 'segmento', 'status', 'responsavel', 'cnpj', 'cidade', 'contato', 'telefone', 'email', 'inicio', 'cor', 'obs', 'thumb', 'resumo', 'criado', 'atualizado', 'atualizado_por'],
  ConfigCliente:  ['cliente_id', 'cor', 'logo', 'abas', 'parecer', 'consultor', 'pasta_id', 'boletim', 'atualizado', 'atualizado_por'],
  Observacoes:    ['cliente_id', 'id', 'area', 'data', 'tipo', 'status', 'texto', 'responsavel', 'prazo', 'proxima', 'gut', 'intervencao', 'origem', 'autor', 'criado', 'atualizado', 'resolvidoEm'],
  Intervencoes:   ['cliente_id', 'id', 'titulo', 'area', 'status', 'objetivo', 'inicio', 'fim_previsto', 'concluida_em', 'responsavel', 'deficiencias', 'indicadores', 'checklist', 'resultado', 'criado', 'autor'],
  Indicadores:    ['cliente_id', 'id', 'nome', 'area', 'unidade', 'sentido', 'meta', 'limite', 'agregacao', 'ordem', 'ativo', 'criado'],
  Lancamentos:    ['cliente_id', 'data', 'indicador_id', 'indicador', 'valor', 'autor', 'atualizado'],
  Funcionarios:   ['cliente_id', 'id', 'nome', 'cargo', 'setor', 'vinculo', 'admissao', 'salario', 'telefone', 'obs', 'criado', 'atualizado'],
  SWOT:           ['cliente_id', 'id', 'quadrante', 'texto', 'origem', 'area', 'criado'],
  DadosArea:      ['cliente_id', 'area', 'campo', 'campo_nome', 'valor', 'tipo', 'atualizado'],
  Checklist:      ['cliente_id', 'area', 'item', 'item_texto', 'resposta', 'nota', 'obs_id', 'extra', 'criado'],
  Fechamentos:    ['cliente_id', 'mes', 'adequacao', 'pendencias', 'novas', 'resolvidas', 'funcionarios', 'comentario', 'fechado_em', 'fechado_por', 'detalhe'],
  Evolucao:       ['cliente_id', 'mes', 'area', 'indicador', 'valor'],
  Documentos:     ['cliente_id', 'id', 'nome', 'tipo', 'area', 'competencia', 'tamanho', 'mime', 'arquivo_id', 'notas', 'achados', 'criado', 'autor']
};
const MAX_CELULA = 45000;               // o Sheets aceita até 50 mil caracteres por célula

/* ===================== página ===================== */
// A página do app fica no GitHub (arquivo app.html). O Apps Script busca de lá a cada acesso,
// então basta atualizar o app.html no GitHub para a plataforma mudar.
// Se o GitHub não responder, usa o arquivo HTML "Index" deste projeto, se existir.
const PAGINA_GITHUB = 'https://raw.githubusercontent.com/rodriguesnicolas8778-sketch/GV-consultoria/main/app.html';

function doGet() {
  let saida = null;
  try {
    const r = UrlFetchApp.fetch(PAGINA_GITHUB, {muteHttpExceptions: true});
    if (r.getResponseCode() === 200) saida = HtmlService.createHtmlOutput(r.getContentText('UTF-8'));
  } catch (e) {}
  if (!saida) {
    try { saida = HtmlService.createTemplateFromFile('Index').evaluate(); }
    catch (e) {
      saida = HtmlService.createHtmlOutput('<div style="font-family:Arial,sans-serif;max-width:520px;margin:60px auto;line-height:1.5"><h2>Não foi possível carregar a plataforma</h2><p>O Apps Script não encontrou o arquivo <b>app.html</b> no GitHub. Confira se ele está no repositório e se o endereço em <b>PAGINA_GITHUB</b>, no Código.gs, está certo:</p><p style="word-break:break-all;color:#555">' + PAGINA_GITHUB + '</p></div>');
    }
  }
  return saida
    .setTitle('Golden Vision · Plataforma')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
}

/* ===================== instalação ===================== */
function configurar() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Rode esta função pelo Apps Script aberto a partir da planilha (Extensões > Apps Script).');
  Object.keys(TABELAS).forEach(nome => {
    let sh = ss.getSheetByName(nome);
    if (!sh) sh = ss.insertSheet(nome);
    const cab = TABELAS[nome];
    sh.getRange(1, 1, 1, cab.length).setValues([cab]).setFontWeight('bold').setBackground('#2B2A1F').setFontColor('#FFFFFF');
    sh.setFrozenRows(1);
    sh.getRange(1, 1, sh.getMaxRows(), cab.length).setNumberFormat('@');   // tudo como texto: datas não viram outro formato
  });
  const padrao = ss.getSheetByName('Página1') || ss.getSheetByName('Sheet1') || ss.getSheetByName('Planilha1');
  if (padrao && ss.getSheets().length > 1) ss.deleteSheet(padrao);

  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('PASTA_ID')) {
    const pasta = DriveApp.createFolder('Golden Vision - Plataforma (arquivos)');
    props.setProperty('PASTA_ID', pasta.getId());
  }
  const dono = Session.getEffectiveUser().getEmail();
  const us = lerTabela_('Usuarios');
  if (dono && !us.some(u => String(u.email).toLowerCase() === dono.toLowerCase())) {
    gravarTabela_('Usuarios', us.concat([{email: dono, nome: dono.split('@')[0], papel: 'admin', ativo: 'sim'}]));
  }
  Logger.log('Pronto. Agora: Implantar > Nova implantação > App da Web.');
}

/* ===================== acesso ===================== */
function usuarioAtual_() {
  const email = (Session.getActiveUser().getEmail() || '').toLowerCase();
  const lista = lerTabela_('Usuarios').filter(u => String(u.ativo || 'sim').toLowerCase() !== 'não' && String(u.ativo || 'sim').toLowerCase() !== 'nao');
  if (!email) throw new Error('SEM_ACESSO|Não foi possível identificar sua conta Google. Veja o LEIA-ME, item "Quem pode acessar".');
  const u = lista.find(x => String(x.email).toLowerCase() === email);
  if (!u) throw new Error('SEM_ACESSO|A conta ' + email + ' não está liberada. Peça ao administrador para incluir seu e-mail na aba Usuarios da planilha.');
  return {email: email, nome: u.nome || email.split('@')[0], papel: u.papel || 'consultor'};
}

/* ===================== leitura e escrita de tabelas ===================== */
function aba_(nome) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(nome);
  if (!sh && TABELAS[nome]) {
    // aba nova de uma atualização: cria sozinha
    sh = ss.insertSheet(nome);
    const cab = TABELAS[nome];
    sh.getRange(1, 1, 1, cab.length).setValues([cab]).setFontWeight('bold').setBackground('#2B2A1F').setFontColor('#FFFFFF');
    sh.setFrozenRows(1);
    sh.getRange(1, 1, sh.getMaxRows(), cab.length).setNumberFormat('@');
  }
  if (!sh) throw new Error('CONFIG|A aba "' + nome + '" não existe. Rode a função configurar no Apps Script.');
  const cab = TABELAS[nome];
  if (cab && !CAB_OK_[nome]) {
    const atual = sh.getRange(1, 1, 1, cab.length).getValues()[0];
    if (atual.join('|') !== cab.join('|')) sh.getRange(1, 1, 1, cab.length).setValues([cab]).setFontWeight('bold').setBackground('#2B2A1F').setFontColor('#FFFFFF');
    CAB_OK_[nome] = true;
  }
  return sh;
}
const CAB_OK_ = {};
function lerTabela_(nome) {
  const sh = aba_(nome), cab = TABELAS[nome];
  const n = sh.getLastRow() - 1;
  if (n < 1) return [];
  const vals = sh.getRange(2, 1, n, cab.length).getValues();
  return vals.filter(r => r.some(v => v !== '' && v !== null)).map(r => {
    const o = {};
    cab.forEach((c, i) => { let v = r[i]; if (v instanceof Date) v = Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd'); o[c] = v; });
    return o;
  });
}
function celula_(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'number' || typeof v === 'boolean') return v;
  let s = typeof v === 'string' ? v : JSON.stringify(v);
  if (s.length > MAX_CELULA) s = 'drive:' + salvarTextoGrande_(s);
  if (/^[=+\-@]/.test(s)) s = "'" + s;      // impede que o texto vire fórmula
  return s;
}
function gravarTabela_(nome, objs) {
  const sh = aba_(nome), cab = TABELAS[nome];
  const linhas = objs.map(o => cab.map(c => celula_(o[c])));
  const atual = Math.max(sh.getLastRow() - 1, 0);
  if (atual > 0) sh.getRange(2, 1, atual, cab.length).clearContent();
  if (linhas.length) {
    if (sh.getMaxRows() < linhas.length + 1) sh.insertRowsAfter(sh.getMaxRows(), linhas.length + 1 - sh.getMaxRows());
    sh.getRange(2, 1, linhas.length, cab.length).setNumberFormat('@').setValues(linhas);
  }
}
function substituirLinhas_(nome, remover, novas) {
  const todas = lerTabela_(nome);
  const ficam = todas.filter(o => !remover(o));
  const saem = todas.filter(remover);
  // arquivos do Drive que ficaram sem uso
  const usados = {};
  novas.forEach(o => Object.keys(o).forEach(k => { const v = String(o[k] || ''); if (v.indexOf('drive:') === 0) usados[v] = 1; if (k === 'arquivo_id') usados[v] = 1; }));
  saem.forEach(o => Object.keys(o).forEach(k => {
    const v = String(o[k] || '');
    if (!v || usados[v]) return;
    if (v.indexOf('drive:') === 0) lixeira_(v.slice(6));
    else if (k === 'arquivo_id') lixeira_(v);
  }));
  gravarTabela_(nome, ficam.concat(novas));
}
function lixeira_(id) { try { DriveApp.getFileById(id).setTrashed(true); } catch (e) {} }
function pastaRaiz_() {
  const id = PropertiesService.getScriptProperties().getProperty('PASTA_ID');
  if (!id) throw new Error('CONFIG|Rode a função configurar no Apps Script.');
  return DriveApp.getFolderById(id);
}
function pastaTextos_() {
  const r = pastaRaiz_(), it = r.getFoldersByName('_textos');
  return it.hasNext() ? it.next() : r.createFolder('_textos');
}
function salvarTextoGrande_(s) { return pastaTextos_().createFile('texto-' + Date.now() + '.txt', s, MimeType.PLAIN_TEXT).getId(); }
function valor_(v) {
  if (typeof v === 'string' && v.indexOf('drive:') === 0) { try { return DriveApp.getFileById(v.slice(6)).getBlob().getDataAsString('UTF-8'); } catch (e) { return ''; } }
  return v;
}
function json_(v, padrao) { v = valor_(v); if (v === '' || v === null || v === undefined) return padrao; try { return JSON.parse(v); } catch (e) { return padrao; } }
function str_(v) { v = valor_(v); return v === null || v === undefined ? '' : String(v); }
function trava_(fn) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) throw new Error('OCUPADO|A planilha está ocupada. Tente de novo em alguns segundos.');
  try { return fn(); } finally { lock.releaseLock(); }
}

/* ===================== conversão: dados do app <-> linhas ===================== */
// Cada "chave" do app vira linhas em uma ou mais abas.
function mapaChave_(escopo, chave) {
  if (escopo === 'g') {
    if (chave === 'gv') return [{aba: 'Configuracoes', remover: o => String(o.chave).indexOf('gv.') === 0}];
    if (chave === 'clientes') return [{aba: 'Clientes', remover: o => true}];
    return [];
  }
  const c = escopo;
  if (chave === 'config' || chave === 'relatorio') return [{aba: 'ConfigCliente', upsert: true}];
  if (chave === 'func') return [{aba: 'Funcionarios', remover: o => o.cliente_id === c}];
  if (chave === 'swot') return [{aba: 'SWOT', remover: o => o.cliente_id === c}];
  if (chave.indexOf('obs_') === 0) {
    const mes = chave.slice(4, 11), area = chave.slice(12);
    return [{aba: 'Observacoes', remover: o => o.cliente_id === c && o.area === area && String(o.data).slice(0, 7) === mes}];
  }
  if (chave.indexOf('diag_') === 0) {
    const area = chave.slice(5);
    return [{aba: 'DadosArea', remover: o => o.cliente_id === c && o.area === area}, {aba: 'Checklist', remover: o => o.cliente_id === c && o.area === area}];
  }
  if (chave.indexOf('doc_') === 0) {
    const id = chave.slice(4);
    return [{aba: 'Documentos', remover: o => o.cliente_id === c && o.id === id}];
  }
  return [];
}
function linhasDe_(escopo, chave, corpo, rotulos, quem) {
  const agora = new Date().toISOString(), out = {};
  const push = (aba, o) => { (out[aba] = out[aba] || []).push(o); };
  if (!corpo) return out;
  if (escopo === 'g') {
    if (chave === 'gv') Object.keys(corpo).forEach(k => push('Configuracoes', {chave: 'gv.' + k, valor: corpo[k]}));
    if (chave === 'clientes') Object.keys(corpo.items || {}).forEach(id => { const k = corpo.items[id]; push('Clientes', Object.assign({}, k, {id: id, resumo: k.resumo ? JSON.stringify(k.resumo) : '', atualizado_por: k.atualizado_por || quem})); });
    return out;
  }
  const c = escopo, it = corpo.items || {};
  if (chave === 'func') Object.keys(it).forEach(id => push('Funcionarios', Object.assign({}, it[id], {cliente_id: c, id: id})));
  if (chave === 'swot') Object.keys(it).forEach(id => push('SWOT', {cliente_id: c, id: id, quadrante: it[id].quad, texto: it[id].texto, origem: it[id].origem, area: it[id].area, criado: it[id].criado}));
  if (chave.indexOf('obs_') === 0) Object.keys(it).forEach(id => push('Observacoes', Object.assign({}, it[id], {cliente_id: c, id: id, area: it[id].secao})));
  if (chave === 'intervencoes') Object.keys(it).forEach(id => push('Intervencoes', Object.assign({}, it[id], {cliente_id: c, id: id})));
  if (chave === 'indicadores') Object.keys(it).forEach(id => push('Indicadores', Object.assign({}, it[id], {cliente_id: c, id: id, ativo: it[id].ativo === false ? 'false' : 'true'})));
  if (chave.indexOf('lanc_') === 0) {
    const nomes = {}; lerTabela_('Indicadores').filter(o => o.cliente_id === c).forEach(o => nomes[o.id] = o.nome);
    Object.keys(it).forEach(id => { const x = it[id]; push('Lancamentos', {cliente_id: c, data: x.data, indicador_id: x.ind, indicador: nomes[x.ind] || '', valor: x.v, autor: x.autor || quem, atualizado: x.em || agora}); });
  }
  if (chave === 'fechamentos') Object.keys(it).forEach(mes => {
    const f = it[mes];
    push('Fechamentos', {cliente_id: c, mes: mes, adequacao: f.adequacao, pendencias: f.pend, novas: f.novas, resolvidas: f.resolvidas, funcionarios: f.func, comentario: f.comentario, fechado_em: f.fechado_em, fechado_por: f.fechado_por, detalhe: JSON.stringify({areas: f.areas, dados: f.dados, check: f.check, ind: f.ind})});
    // tabela longa, boa para gráficos e tabelas dinâmicas na planilha
    const ev = (area, ind, v) => { if (v !== null && v !== undefined && v !== '' && !isNaN(Number(v))) push('Evolucao', {cliente_id: c, mes: mes, area: area, indicador: ind, valor: Number(v)}); };
    ev('Geral', 'Adequação média (%)', f.adequacao); ev('Geral', 'Pendências abertas', f.pend); ev('Geral', 'Anotações no mês', f.novas); ev('Geral', 'Resolvidas no mês', f.resolvidas); ev('Geral', 'Funcionários', f.func);
    Object.keys(f.areas || {}).forEach(a => { const x = f.areas[a]; ev(x.nome || a, 'Adequação (%)', x.pct); ev(x.nome || a, 'Pendências abertas', x.pend); });
    Object.keys(f.ind || {}).forEach(a => (f.ind[a] || []).forEach(i => ev((f.areas && f.areas[a] && f.areas[a].nome) || a, i.l, i.n)));
  });
  if (chave.indexOf('diag_') === 0) {
    const area = chave.slice(5), dados = corpo.dados || {}, check = corpo.check || {}, extras = corpo.extras || {};
    const rc = (rotulos && rotulos.campos) || {}, ri = (rotulos && rotulos.itens) || {};
    Object.keys(dados).forEach(k => { const v = dados[k]; if (v === null || v === undefined || v === '') return; push('DadosArea', {cliente_id: c, area: area, campo: k, campo_nome: rc[k] || '', valor: v, tipo: typeof v === 'number' ? 'n' : 's', atualizado: corpo.atualizado || agora}); });
    const ids = {}; Object.keys(check).forEach(k => ids[k] = 1); Object.keys(extras).forEach(k => ids[k] = 1);
    Object.keys(ids).forEach(k => {
      const ch = check[k] || {}, ex = extras[k];
      if (!ex && !ch.r && !ch.nota && !ch.obs) return;
      push('Checklist', {cliente_id: c, area: area, item: k, item_texto: ex ? ex.l : (ri[k] || ''), resposta: ch.r || '', nota: ch.nota || '', obs_id: ch.obs || '', extra: ex ? 'sim' : '', criado: ex ? ex.criado : ''});
    });
  }
  return out;
}

/* ===================== API chamada pela página ===================== */
function iniciar() {
  const u = usuarioAtual_();
  return {usuario: u, usuarios: lerTabela_('Usuarios').filter(x => String(x.ativo || 'sim').toLowerCase().indexOf('n') !== 0).map(x => ({email: String(x.email).toLowerCase(), nome: x.nome || String(x.email).split('@')[0]})), g: carregarGlobal_(), boletim: estadoBoletim_()};
}
function carregarGlobal() { usuarioAtual_(); return carregarGlobal_(); }
function carregarGlobal_() {
  const gv = {};
  lerTabela_('Configuracoes').forEach(o => { if (String(o.chave).indexOf('gv.') === 0) gv[String(o.chave).slice(3)] = str_(o.valor); });
  const items = {};
  lerTabela_('Clientes').forEach(o => { const k = {}; TABELAS.Clientes.forEach(c => { if (c !== 'id' && o[c] !== '') k[c] = str_(o[c]); }); k.resumo = json_(o.resumo, undefined); if (!k.resumo) delete k.resumo; items[o.id] = k; });
  const g = {clientes: {items: items}};
  if (Object.keys(gv).length) g.gv = gv;
  return g;
}

function carregarCliente(c) { usuarioAtual_(); return carregarCliente_(c); }
function carregarCliente_(c) {
  const B = {};
  const cfg = lerTabela_('ConfigCliente').find(o => o.cliente_id === c);
  if (cfg) {
    const conf = {}; if (cfg.cor) conf.cor = str_(cfg.cor); if (cfg.logo) conf.logo = str_(cfg.logo); const abas = json_(cfg.abas, null); if (abas) conf.abas = abas;
    if (Object.keys(conf).length) B.config = conf;
    const bol = json_(cfg.boletim, null); if (bol) { B.config = B.config || {}; B.config.boletim = bol; }
    if (cfg.parecer || cfg.consultor) B.relatorio = {parecer: str_(cfg.parecer), consultor: str_(cfg.consultor)};
  }
  const func = {};
  lerTabela_('Funcionarios').filter(o => o.cliente_id === c).forEach(o => { const x = {}; TABELAS.Funcionarios.forEach(k => { if (k !== 'cliente_id' && k !== 'id') x[k] = k === 'salario' ? (o[k] === '' ? null : Number(o[k])) : str_(o[k]); }); func[o.id] = x; });
  if (Object.keys(func).length) B.func = {items: func};
  const sw = {};
  lerTabela_('SWOT').filter(o => o.cliente_id === c).forEach(o => { sw[o.id] = {quad: o.quadrante, texto: str_(o.texto), origem: o.origem || undefined, area: o.area || undefined, criado: o.criado}; });
  if (Object.keys(sw).length) B.swot = {items: sw};
  lerTabela_('Observacoes').filter(o => o.cliente_id === c).forEach(o => {
    const k = 'obs_' + String(o.data).slice(0, 7) + '_' + o.area;
    const x = {secao: o.area, data: String(o.data), texto: str_(o.texto), tipo: o.tipo, criado: o.criado};
    ['status', 'responsavel', 'prazo', 'proxima', 'intervencao', 'origem', 'autor', 'atualizado', 'resolvidoEm'].forEach(f => { if (o[f] !== '') x[f] = str_(o[f]); });
    const gut = json_(o.gut, null); if (gut) x.gut = gut;
    (B[k] = B[k] || {items: {}}).items[o.id] = x;
  });
  lerTabela_('DadosArea').filter(o => o.cliente_id === c).forEach(o => {
    const k = 'diag_' + o.area; B[k] = B[k] || {dados: {}, check: {}, extras: {}};
    B[k].dados[o.campo] = o.tipo === 'n' ? Number(o.valor) : str_(o.valor);
  });
  lerTabela_('Checklist').filter(o => o.cliente_id === c).forEach(o => {
    const k = 'diag_' + o.area; B[k] = B[k] || {dados: {}, check: {}, extras: {}};
    if (o.extra === 'sim') B[k].extras[o.item] = {l: str_(o.item_texto), criado: o.criado};
    if (o.resposta || o.nota || o.obs_id) B[k].check[o.item] = {r: o.resposta || '', nota: str_(o.nota), obs: o.obs_id || undefined};
  });
  const inds = {};
  lerTabela_('Indicadores').filter(o => o.cliente_id === c).forEach(o => { inds[o.id] = {nome: str_(o.nome), area: o.area, unidade: o.unidade || 'num', sentido: o.sentido || 'maior', meta: o.meta === '' ? null : Number(o.meta), limite: o.limite === '' ? null : Number(o.limite), agregacao: o.agregacao || 'soma', ordem: Number(o.ordem || 0), ativo: String(o.ativo) !== 'false', criado: o.criado}; });
  if (Object.keys(inds).length) B.indicadores = {items: inds};
  lerTabela_('Lancamentos').filter(o => o.cliente_id === c).forEach(o => {
    const k = 'lanc_' + String(o.data).slice(0, 7);
    (B[k] = B[k] || {items: {}}).items[o.data + '|' + o.indicador_id] = {ind: o.indicador_id, data: String(o.data), v: Number(o.valor), autor: o.autor, em: o.atualizado};
  });
  const ivs = {};
  lerTabela_('Intervencoes').filter(o => o.cliente_id === c).forEach(o => {
    const x = {}; ['titulo', 'area', 'status', 'objetivo', 'inicio', 'fim_previsto', 'concluida_em', 'responsavel', 'resultado', 'criado', 'autor'].forEach(f => { if (o[f] !== '') x[f] = str_(o[f]); });
    x.deficiencias = json_(o.deficiencias, []); x.indicadores = json_(o.indicadores, []); x.checklist = json_(o.checklist, []);
    ivs[o.id] = x;
  });
  if (Object.keys(ivs).length) B.intervencoes = {items: ivs};
  const fech = {};
  lerTabela_('Fechamentos').filter(o => o.cliente_id === c).forEach(o => {
    const det = json_(o.detalhe, {});
    fech[o.mes] = {mes: o.mes, adequacao: o.adequacao === '' ? null : Number(o.adequacao), pend: Number(o.pendencias || 0), novas: Number(o.novas || 0), resolvidas: Number(o.resolvidas || 0), func: Number(o.funcionarios || 0), comentario: str_(o.comentario), fechado_em: o.fechado_em, fechado_por: o.fechado_por, areas: det.areas || {}, dados: det.dados || {}, check: det.check || {}, ind: det.ind || {}};
  });
  if (Object.keys(fech).length) B.fechamentos = {items: fech};
  lerTabela_('Documentos').filter(o => o.cliente_id === c).forEach(o => {
    const d = {};
    ['nome', 'tipo', 'area', 'competencia', 'mime', 'criado', 'autor'].forEach(f => { if (o[f] !== '') d[f] = str_(o[f]); });
    if (o.tamanho !== '') d.tamanho = Number(o.tamanho);
    if (o.arquivo_id) d.asset = o.arquivo_id;
    d.notas = str_(o.notas); d.achados = json_(o.achados, []);
    B['doc_' + o.id] = d;
  });
  return B;
}

/** Salva uma "chave" do app. corpo = null apaga. */
function salvar(escopo, chave, corpo, rotulos) {
  const u = usuarioAtual_();
  if (escopo === 'g' && chave === 'clientes' && u.papel !== 'admin') {
    // consultores podem cadastrar e editar clientes; só não apagam clientes dos outros
  }
  return trava_(() => {
    const agora = new Date().toISOString();
    if (escopo !== 'g' && (chave === 'config' || chave === 'relatorio')) {
      const todas = lerTabela_('ConfigCliente');
      let row = todas.find(o => o.cliente_id === escopo);
      if (!row) { row = {cliente_id: escopo}; todas.push(row); }
      if (chave === 'config') { const cf = corpo || {}; row.cor = cf.cor || ''; row.logo = cf.logo || ''; row.abas = cf.abas ? JSON.stringify(cf.abas) : ''; row.boletim = cf.boletim ? JSON.stringify(cf.boletim) : ''; }
      else { const r = corpo || {}; row.parecer = r.parecer || ''; row.consultor = r.consultor || ''; }
      row.atualizado = agora; row.atualizado_por = u.email;
      gravarTabela_('ConfigCliente', todas);
      return {ok: true};
    }
    if (escopo !== 'g' && chave.indexOf('doc_') === 0) return salvarDocumento_(escopo, chave.slice(4), corpo, u);
    const linhas = linhasDe_(escopo, chave, corpo, rotulos, u.email);
    mapaChave_(escopo, chave).forEach(m => substituirLinhas_(m.aba, m.remover, linhas[m.aba] || []));
    return {ok: true};
  });
}
/** Salva ou apaga UM item (observação, funcionário, item da SWOT ou cliente) sem mexer nos outros.
 *  Assim dois consultores podem trabalhar ao mesmo tempo sem um apagar o registro do outro. */
function salvarItem(escopo, chave, id, dados) {
  const u = usuarioAtual_();
  return trava_(() => {
    let aba, remover;
    if (escopo === 'g' && chave === 'clientes') { aba = 'Clientes'; remover = o => o.id === id; }
    else if (chave === 'func') { aba = 'Funcionarios'; remover = o => o.cliente_id === escopo && o.id === id; }
    else if (chave === 'swot') { aba = 'SWOT'; remover = o => o.cliente_id === escopo && o.id === id; }
    else if (chave.indexOf('obs_') === 0) { aba = 'Observacoes'; remover = o => o.cliente_id === escopo && o.id === id; }
    else if (chave === 'indicadores') { aba = 'Indicadores'; remover = o => o.cliente_id === escopo && o.id === id; }
    else if (chave === 'intervencoes') { aba = 'Intervencoes'; remover = o => o.cliente_id === escopo && o.id === id; }
    else if (chave.indexOf('lanc_') === 0) { const p = id.split('|'); aba = 'Lancamentos'; remover = o => o.cliente_id === escopo && o.data === p[0] && o.indicador_id === p[1]; }
    else if (chave === 'fechamentos') {
      const ls = dados ? linhasDe_(escopo, chave, {items: {[id]: dados}}, null, u.email) : {};
      substituirLinhas_('Fechamentos', o => o.cliente_id === escopo && o.mes === id, ls.Fechamentos || []);
      substituirLinhas_('Evolucao', o => o.cliente_id === escopo && o.mes === id, ls.Evolucao || []);
      return {ok: true};
    }
    else throw new Error('DADOS|Tipo de item desconhecido: ' + chave);
    const linhas = dados ? (linhasDe_(escopo, chave, {items: {[id]: dados}}, null, u.email)[aba] || []) : [];
    substituirLinhas_(aba, remover, linhas);
    return {ok: true};
  });
}
function salvarDocumento_(c, id, d, u) {
  const antigo = lerTabela_('Documentos').find(o => o.cliente_id === c && o.id === id);
  if (!d) { substituirLinhas_('Documentos', o => o.cliente_id === c && o.id === id, []); return {ok: true}; }
  const row = {cliente_id: c, id: id, nome: d.nome, tipo: d.tipo, area: d.area, competencia: d.competencia, tamanho: d.tamanho, mime: d.mime,
    arquivo_id: d.asset || (antigo ? antigo.arquivo_id : ''), notas: d.notas, achados: JSON.stringify(d.achados || []), criado: d.criado, autor: d.autor || (antigo ? antigo.autor : u.email)};
  substituirLinhas_('Documentos', o => o.cliente_id === c && o.id === id, [row]);
  return {ok: true};
}

function excluirCliente(c) {
  const u = usuarioAtual_();
  if (u.papel !== 'admin') throw new Error('SEM_ACESSO|Só administradores podem excluir clientes.');
  return trava_(() => {
    ['Observacoes', 'Funcionarios', 'SWOT', 'DadosArea', 'Checklist', 'Documentos', 'Fechamentos', 'Evolucao', 'Indicadores', 'Lancamentos', 'Intervencoes'].forEach(t => substituirLinhas_(t, o => o.cliente_id === c, []));
    const cfg = lerTabela_('ConfigCliente').find(o => o.cliente_id === c);
    if (cfg && cfg.pasta_id) lixeira_Pasta_(cfg.pasta_id);
    substituirLinhas_('ConfigCliente', o => o.cliente_id === c, []);
    substituirLinhas_('Clientes', o => o.id === c, []);
    return {ok: true};
  });
}
function lixeira_Pasta_(id) { try { DriveApp.getFolderById(id).setTrashed(true); } catch (e) {} }

/* ===================== arquivos no Drive ===================== */
function pastaCliente_(c) {
  const todas = lerTabela_('ConfigCliente');
  let row = todas.find(o => o.cliente_id === c);
  if (row && row.pasta_id) { try { return DriveApp.getFolderById(row.pasta_id); } catch (e) {} }
  const cli = lerTabela_('Clientes').find(o => o.id === c);
  const pasta = pastaRaiz_().createFolder((cli ? cli.nome : 'Cliente') + ' (' + c + ')');
  if (!row) { row = {cliente_id: c}; todas.push(row); }
  row.pasta_id = pasta.getId();
  gravarTabela_('ConfigCliente', todas);
  return pasta;
}
function salvarArquivo(c, nome, mime, b64) {
  usuarioAtual_();
  return trava_(() => {
    const blob = Utilities.newBlob(Utilities.base64Decode(b64), mime || 'application/octet-stream', nome);
    return pastaCliente_(c).createFile(blob).getId();
  });
}
function salvarNoDrive(c, nome, mime, b64) {
  usuarioAtual_();
  const pasta = c ? pastaCliente_(c) : pastaRaiz_();
  const f = pasta.createFile(Utilities.newBlob(Utilities.base64Decode(b64), mime, nome));
  return f.getUrl();
}

/* ===================== importação (backup da versão anterior) ===================== */
function importar(backup) {
  const u = usuarioAtual_();
  if (u.papel !== 'admin') throw new Error('SEM_ACESSO|Só administradores podem restaurar backup.');
  if (!backup || !backup.global) throw new Error('DADOS|Arquivo de backup inválido.');
  return trava_(() => {
    const acum = {}, add = r => Object.keys(r).forEach(t => acum[t] = (acum[t] || []).concat(r[t]));
    Object.keys(backup.global).forEach(k => add(linhasDe_('g', k, backup.global[k], null, u.email)));
    const cfgRows = [];
    Object.keys(backup.clientes || {}).forEach(c => {
      const dados = backup.clientes[c] || {};
      const cf = dados.config || {}, rl = dados.relatorio || {};
      cfgRows.push({cliente_id: c, cor: cf.cor || '', logo: cf.logo || '', abas: cf.abas ? JSON.stringify(cf.abas) : '', boletim: cf.boletim ? JSON.stringify(cf.boletim) : '', parecer: rl.parecer || '', consultor: rl.consultor || '', atualizado: new Date().toISOString(), atualizado_por: u.email});
      Object.keys(dados).forEach(k => {
        if (k === 'config' || k === 'relatorio') return;
        if (k.indexOf('doc_') === 0) {
          const d = dados[k];
          add({Documentos: [{cliente_id: c, id: k.slice(4), nome: d.nome, tipo: d.tipo, area: d.area, competencia: d.competencia || String(d.criado || '').slice(0, 7), tamanho: d.tamanho, mime: d.mime, arquivo_id: '', notas: d.notas || d.analise || '', achados: JSON.stringify((d.achados || []).filter(a => a.obs)), criado: d.criado, autor: u.email}]});
          return;
        }
        add(linhasDe_(c, k, dados[k], null, u.email));
      });
    });
    acum.ConfigCliente = cfgRows;
    ['Clientes', 'ConfigCliente', 'Observacoes', 'Funcionarios', 'SWOT', 'DadosArea', 'Checklist', 'Documentos', 'Fechamentos', 'Evolucao', 'Indicadores', 'Lancamentos', 'Intervencoes'].forEach(t => gravarTabela_(t, acum[t] || []));
    const gvRows = acum.Configuracoes || [];
    substituirLinhas_('Configuracoes', o => String(o.chave).indexOf('gv.') === 0, gvRows);
    return {ok: true, clientes: Object.keys(backup.clientes || {}).length};
  });
}

/* ===================== boletim do dia ===================== */
const ABAS_NOMES_ = {gestao: 'Gestão', contabilidade: 'Contabilidade', vendas: 'Vendas', rh: 'RH', marketing: 'Marketing'};
const TIPOS_ = {def: 'Deficiência', pos: 'Ponto positivo', acao: 'Ação sugerida', nota: 'Anotação'};
function esc_(s) { return String(s === null || s === undefined ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'})[c]); }
function hoje_() { return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd'); }
function somaDias_(d, n) { const p = d.split('-').map(Number), x = new Date(Date.UTC(p[0], p[1] - 1, p[2] + n)); return x.toISOString().slice(0, 10); }
function fmtD_(d) { const p = String(d || '').split('-'); return p.length === 3 ? p[2] + '/' + p[1] : ''; }
function num_(n, casas) {
  const neg = Number(n) < 0, f = Math.pow(10, casas), t = Math.round(Math.abs(Number(n)) * f), int = Math.floor(t / f);
  const dec = casas ? String(t % f).padStart(casas, '0') : '';
  return (neg ? '-' : '') + String(int).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (casas ? ',' + dec : '');
}
function fmtVal_(ind, v) { if (v === null || v === undefined || v === '' || isNaN(v)) return '–'; return ind.unidade === 'brl' ? 'R$ ' + num_(v, 2) : ind.unidade === 'pct' ? num_(v, Number(v) % 1 ? 1 : 0) + '%' : num_(v, Number(v) % 1 ? 1 : 0); }
function statusInd_(ind, v) {
  if (v === null || v === undefined || v === '' || isNaN(v)) return 'vazio';
  if (ind.meta === null || ind.meta === undefined || ind.meta === '') return 'neutro';
  const meta = Number(ind.meta), lim = ind.limite === '' || ind.limite === null || ind.limite === undefined ? null : Number(ind.limite);
  if (ind.sentido === 'menor') return v <= meta ? 'ok' : (lim !== null && v > lim ? 'critico' : 'atencao');
  return v >= meta ? 'ok' : (lim !== null && v < lim ? 'critico' : 'atencao');
}
function montarBoletim_(c, dia, dias) {
  dia = dia || hoje_(); dias = Math.max(1, Number(dias) || 1);
  const ini = somaDias_(dia, -(dias - 1)), noPeriodo = d => String(d) >= ini && String(d) <= dia, periodoTxt = dias === 1 ? 'do dia ' + fmtD_(dia) : 'de ' + fmtD_(ini) + ' a ' + fmtD_(dia);
  const cli = lerTabela_('Clientes').find(o => o.id === c) || {nome: 'Cliente'};
  const cfg = lerTabela_('ConfigCliente').find(o => o.cliente_id === c) || {};
  const abas = json_(cfg.abas, null), nomeArea = a => { const x = (abas || []).find(y => y.id === a); return x ? x.nome : (ABAS_NOMES_[a] || a); };
  const gvNome = (lerTabela_('Configuracoes').find(o => o.chave === 'gv.nome') || {}).valor || 'Golden Vision';
  const inds = lerTabela_('Indicadores').filter(o => o.cliente_id === c && String(o.ativo) !== 'false').map(o => ({id: o.id, nome: str_(o.nome), area: o.area, unidade: o.unidade || 'num', sentido: o.sentido || 'maior', meta: o.meta === '' ? null : Number(o.meta), limite: o.limite === '' ? null : Number(o.limite), ordem: Number(o.ordem || 0)})).sort((a, b) => a.ordem - b.ordem);
  const hist = {}; lerTabela_('Lancamentos').filter(o => o.cliente_id === c && String(o.data) <= dia).forEach(o => (hist[o.indicador_id] = hist[o.indicador_id] || []).push({d: String(o.data), v: Number(o.valor)}));
  Object.keys(hist).forEach(k => hist[k].sort((a, b) => a.d.localeCompare(b.d)));
  const obs = lerTabela_('Observacoes').filter(o => o.cliente_id === c);
  const pend = o => (o.tipo === 'def' || o.tipo === 'acao') && o.status !== 'resolvido';
  const linhas = inds.map(i => {
    const h = hist[i.id] || [], ul = h[h.length - 1] || null, v = ul ? ul.v : null, st = statusInd_(i, v);
    let fora = 0; for (let k = h.length - 1; k >= 0; k--) { const s2 = statusInd_(i, h[k].v); if (s2 === 'ok' || s2 === 'neutro') break; fora++; }
    const ant = h.length > 1 ? h[h.length - 2].v : null;
    return {i: i, v: v, st: st, fora: fora, ant: ant, data: ul ? ul.d : null, novo: ul ? noPeriodo(ul.d) : false};
  });
  const foraMeta = linhas.filter(l => l.st === 'atencao' || l.st === 'critico');
  const novas = obs.filter(o => noPeriodo(o.data));
  const resolvidas = obs.filter(o => o.resolvidoEm && noPeriodo(o.resolvidoEm));
  const vencidas = obs.filter(o => pend(o) && o.prazo && String(o.prazo) < dia).sort((a, b) => String(a.prazo).localeCompare(String(b.prazo)));
  const semana = obs.filter(o => pend(o) && o.prazo && String(o.prazo) >= dia && String(o.prazo) <= somaDias_(dia, 7)).sort((a, b) => String(a.prazo).localeCompare(String(b.prazo)));
  const atualizados = linhas.filter(l => l.novo).length;
  const COR = {ok: '#2E7A4E', atencao: '#C98A1E', critico: '#B4372B', neutro: '#7A8480', vazio: '#C9D0CD'};
  const EMO = {ok: '🟢', atencao: '🟡', critico: '🔴', neutro: '⚪', vazio: '▫️'};
  const metaTxt = i => i.meta === null ? '' : (i.sentido === 'menor' ? 'máx. ' : 'meta ') + fmtVal_(i, i.meta);
  const assunto = 'Boletim ' + periodoTxt + ' · ' + cli.nome;
  const T = ['*Boletim ' + periodoTxt + ' · ' + cli.nome + '*'];
  if (inds.length) { T.push('', '*Indicadores (último valor)*'); linhas.forEach(l => T.push(EMO[l.st] + ' ' + l.i.nome + ': ' + (l.v === null ? 'sem registro' : fmtVal_(l.i, l.v) + ' em ' + fmtD_(l.data)) + (metaTxt(l.i) ? ' (' + metaTxt(l.i) + ')' : '') + (l.fora > 1 ? ' · fora da meta nos últimos ' + l.fora + ' registros' : ''))); }
  if (vencidas.length) { T.push('', '*Ações atrasadas (' + vencidas.length + ')*'); vencidas.slice(0, 8).forEach(o => T.push('• ' + str_(o.texto).slice(0, 120) + ' — ' + (o.responsavel ? str_(o.responsavel) + ', ' : '') + 'prazo ' + fmtD_(o.prazo))); }
  if (semana.length) { T.push('', '*Vencem nos próximos 7 dias (' + semana.length + ')*'); semana.slice(0, 8).forEach(o => T.push('• ' + str_(o.texto).slice(0, 120) + ' — ' + (o.responsavel ? str_(o.responsavel) + ', ' : '') + fmtD_(o.prazo))); }
  if (novas.length) { T.push('', '*Registrado ' + (dias === 1 ? 'hoje' : 'no período') + ' (' + novas.length + ')*'); novas.slice(0, 10).forEach(o => T.push('• ' + (TIPOS_[o.tipo] || 'Anotação') + ' (' + nomeArea(o.area) + '): ' + str_(o.texto).slice(0, 140))); }
  if (resolvidas.length) { T.push('', '*Resolvido ' + (dias === 1 ? 'hoje' : 'no período') + ' (' + resolvidas.length + ')*'); resolvidas.slice(0, 8).forEach(o => T.push('✔ ' + str_(o.texto).slice(0, 120))); }
  const vazio = !inds.length && !novas.length && !vencidas.length && !semana.length && !resolvidas.length;
  if (vazio) T.push('', 'Nenhum registro no período.');
  T.push('', '_' + gvNome + '_');
  const sec = (tit, corpo) => '<h3 style="font:700 15px Arial,sans-serif;color:#16201C;margin:22px 0 8px">' + tit + '</h3>' + corpo;
  const li = (txt, meta, cor) => '<tr><td style="padding:7px 0;border-bottom:1px solid #EEF1EF;font:14px Arial,sans-serif;color:#1B2420">' + (cor ? '<span style="display:inline-block;width:8px;height:8px;border-radius:4px;background:' + cor + ';margin-right:8px"></span>' : '') + esc_(txt) + (meta ? '<div style="font-size:12px;color:#5F6A66;margin-top:2px">' + esc_(meta) + '</div>' : '') + '</td></tr>';
  const tab = rows => '<table style="width:100%;border-collapse:collapse">' + rows + '</table>';
  let H = '<div style="max-width:620px;margin:0 auto;font-family:Arial,sans-serif;color:#1B2420">';
  H += '<div style="background:#1F2420;color:#fff;border-radius:14px;padding:18px 20px"><div style="font-size:12px;opacity:.7">' + esc_(gvNome) + '</div><div style="font:800 20px Arial,sans-serif;margin-top:2px">Boletim ' + periodoTxt + '</div><div style="font-size:14px;opacity:.85">' + esc_(cli.nome) + '</div></div>';
  const resumo = [[foraMeta.length, 'fora da meta', foraMeta.length ? '#B4372B' : '#2E7A4E'], [vencidas.length, 'ações atrasadas', vencidas.length ? '#B4372B' : '#2E7A4E'], [novas.length, dias === 1 ? 'registros hoje' : 'registros no período', '#1E5A8A'], [resolvidas.length, dias === 1 ? 'resolvidos hoje' : 'resolvidos no período', '#2E7A4E']];
  H += '<table style="width:100%;margin-top:12px;border-collapse:separate;border-spacing:6px 0"><tr>' + resumo.map(r => '<td style="background:#F4F6F5;border-radius:10px;padding:10px;text-align:center"><div style="font:800 22px Arial,sans-serif;color:' + r[2] + '">' + r[0] + '</div><div style="font-size:11.5px;color:#5F6A66">' + r[1] + '</div></td>').join('') + '</tr></table>';
  if (inds.length) H += sec('Indicadores <span style="font:400 12px Arial;color:#5F6A66">(último valor · ' + atualizados + ' atualizado' + (atualizados === 1 ? '' : 's') + (dias === 1 ? ' hoje' : ' no período') + ')</span>', tab(linhas.map(l => '<tr><td style="padding:8px 0;border-bottom:1px solid #EEF1EF;font-size:14px"><span style="display:inline-block;width:10px;height:10px;border-radius:5px;background:' + COR[l.st] + ';margin-right:8px"></span>' + esc_(l.i.nome) + '<div style="font-size:12px;color:#5F6A66;margin-left:18px">' + esc_(nomeArea(l.i.area)) + (metaTxt(l.i) ? ' · ' + esc_(metaTxt(l.i)) : '') + (l.data ? ' · ' + fmtD_(l.data) : '') + (l.fora > 1 ? ' · <b style="color:#B4372B">fora da meta nos últimos ' + l.fora + ' registros</b>' : '') + '</div></td><td style="padding:8px 0;border-bottom:1px solid #EEF1EF;text-align:right;font:700 15px Arial,sans-serif;white-space:nowrap">' + (l.v === null ? '<span style="color:#7A8480;font-weight:400;font-size:13px">sem registro</span>' : esc_(fmtVal_(l.i, l.v))) + (l.ant !== null && l.v !== null ? '<div style="font:400 11.5px Arial;color:#7A8480">antes: ' + esc_(fmtVal_(l.i, l.ant)) + '</div>' : '') + '</td></tr>').join('')));
  if (vencidas.length) H += sec('Ações atrasadas', tab(vencidas.slice(0, 10).map(o => li(str_(o.texto), nomeArea(o.area) + (o.responsavel ? ' · ' + str_(o.responsavel) : '') + ' · prazo ' + fmtD_(o.prazo) + (o.proxima ? ' · próxima ação: ' + str_(o.proxima) : ''), '#B4372B')).join('')));
  if (semana.length) H += sec('Vencem nos próximos 7 dias', tab(semana.slice(0, 10).map(o => li(str_(o.texto), nomeArea(o.area) + (o.responsavel ? ' · ' + str_(o.responsavel) : '') + ' · ' + fmtD_(o.prazo), '#C98A1E')).join('')));
  if (novas.length) H += sec(dias === 1 ? 'Registrado hoje' : 'Registrado no período', tab(novas.slice(0, 12).map(o => li(str_(o.texto), (TIPOS_[o.tipo] || 'Anotação') + ' · ' + nomeArea(o.area), {def: '#B5530A', pos: '#2E7A4E', acao: '#2F5FA8'}[o.tipo] || '#7A8480')).join('')));
  if (resolvidas.length) H += sec(dias === 1 ? 'Resolvido hoje' : 'Resolvido no período', tab(resolvidas.slice(0, 10).map(o => li(str_(o.texto), nomeArea(o.area), '#2E7A4E')).join('')));
  if (vazio) H += '<p style="font-size:14px;color:#5F6A66;margin-top:18px">Nenhum registro no período.</p>';
  H += '<p style="font-size:11.5px;color:#7A8480;margin-top:24px;border-top:1px solid #E3E7E5;padding-top:10px">Enviado pela plataforma ' + esc_(gvNome) + '.</p></div>';
  return {assunto: assunto, html: H, texto: T.join('\n')};
}
function previaBoletim(c, dias) { usuarioAtual_(); return montarBoletim_(c, null, dias); }
function enviarBoletimAgora(c, emails, dias) {
  usuarioAtual_();
  const para = String(emails || '').split(/[,;\s]+/).filter(e => /@/.test(e)).join(',');
  if (!para) throw new Error('DADOS|Informe pelo menos um e-mail.');
  const b = montarBoletim_(c, null, dias);
  MailApp.sendEmail({to: para, subject: b.assunto, htmlBody: b.html, body: b.texto, name: 'Golden Vision Consultorias'});
  return {ok: true, para: para};
}
function estadoBoletim_() {
  const conf = {}; lerTabela_('Configuracoes').forEach(o => { if (String(o.chave).indexOf('boletim.') === 0) conf[String(o.chave).slice(8)] = String(o.valor); });
  let ativo = false; try { ativo = ScriptApp.getProjectTriggers().some(t => t.getHandlerFunction() === 'enviarBoletins'); } catch (e) {}
  return {ativo: ativo, hora: conf.hora ? Number(conf.hora) : 18, uteis: conf.uteis !== 'false', freq: conf.freq === 'diario' ? 'diario' : 'semanal'};
}
function agendarBoletim(hora, uteis, ligar, freq) {
  const u = usuarioAtual_();
  if (u.papel !== 'admin') throw new Error('SEM_ACESSO|Só administradores podem ligar o envio automático.');
  ScriptApp.getProjectTriggers().forEach(t => { if (t.getHandlerFunction() === 'enviarBoletins') ScriptApp.deleteTrigger(t); });
  freq = freq === 'diario' ? 'diario' : 'semanal';
  if (ligar && freq === 'diario') ScriptApp.newTrigger('enviarBoletins').timeBased().everyDays(1).atHour(Number(hora)).create();
  if (ligar && freq === 'semanal') ScriptApp.newTrigger('enviarBoletins').timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(Number(hora)).create();
  trava_(() => substituirLinhas_('Configuracoes', o => String(o.chave).indexOf('boletim.') === 0, [{chave: 'boletim.hora', valor: String(hora)}, {chave: 'boletim.uteis', valor: uteis ? 'true' : 'false'}, {chave: 'boletim.freq', valor: freq}]));
  return estadoBoletim_();
}
/** Roda sozinho no horário escolhido (gatilho criado por agendarBoletim): todo dia ou toda segunda-feira. */
function enviarBoletins() {
  const est = estadoBoletim_(), dow = Number(Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'u'));
  if (est.freq === 'diario' && est.uteis && dow >= 6) return;
  const dias = est.freq === 'semanal' ? 7 : (dow === 1 && est.uteis ? 3 : 1);
  const ativos = {}; lerTabela_('Clientes').forEach(o => { if ((o.status || 'ativo') === 'ativo') ativos[o.id] = true; });
  lerTabela_('ConfigCliente').forEach(cfg => {
    const bol = json_(cfg.boletim, null);
    if (!bol || !bol.ativo || !ativos[cfg.cliente_id]) return;
    const para = String(bol.emails || '').split(/[,;\s]+/).filter(e => /@/.test(e)).join(',');
    if (!para) return;
    try { const b = montarBoletim_(cfg.cliente_id, null, dias); MailApp.sendEmail({to: para, subject: b.assunto, htmlBody: b.html, body: b.texto, name: 'Golden Vision Consultorias'}); }
    catch (e) { console.error('Boletim ' + cfg.cliente_id + ': ' + e.message); }
  });
}
