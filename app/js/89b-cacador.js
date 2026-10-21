/* =========================================================================
   Mini SK — 89b-cacador.js
   🐞 CAÇADOR DE ERROS (para qualquer app que você rodar aqui)
   Junta num lugar só os erros da PRÉVIA (tela), das chamadas ao SERVIDOR e dos
   TERMINAIS (⚡ Node, 📱 Termux, 💻 PC). Diz em português se é normal,
   configuração ou defeito do projeto. Copiar · baixar .md · mandar para a IA.
   O botão 🐞 vermelho aparece sozinho quando acontece um erro.
   ========================================================================= */
(function (SK) {
  'use strict';
  const lista = [], MAX = 150;
  let botao = null, painel = null;
  const esconder = (t) => String(t).replace(/AIza[0-9A-Za-z_\-]{20,}/g, 'AIza…(escondida)').replace(/\b(sk-(?:ant-|or-|proj-)?)[A-Za-z0-9_\-]{12,}/g, '$1…(escondida)').replace(/\b(gsk_|pplx-|xai-|ghp_|github_pat_)[A-Za-z0-9_\-]{10,}/g, '$1…(escondida)').replace(/(Bearer\s+)[A-Za-z0-9._\-]{12,}/gi, '$1…(escondida)').replace(/(postgres(?:ql)?:\/\/[^:\s]+:)[^@\s]+@/gi, '$1…(escondida)@');
  const REGRAS = [
    [/EADDRINUSE|address already in use|porta .* (ocupada|em uso)/i, '⚙️ Configuração', 'A PORTA já está sendo usada (um servidor ficou ligado). Pare o outro com Ctrl+C, ou feche e abra de novo.'],
    [/Cannot find module|MODULE_NOT_FOUND|ERR_MODULE_NOT_FOUND|Failed to resolve import/i, '⚙️ Configuração', 'Falta uma PEÇA (pacote). Rode  npm install. Se continuar, o pacote não está no package.json — é defeito do projeto.'],
    [/ERESOLVE|peer dep|conflicting peer/i, '⚙️ Configuração', 'Conflito de VERSÕES entre pacotes. Tente:  npm install --legacy-peer-deps'],
    [/command not found|não é reconhecido|is not recognized|not found: (node|npm|python|git)/i, '⚙️ Configuração', 'O PROGRAMA não está instalado nesse terminal (node, npm, python…). Instale e tente de novo.'],
    [/ENOENT|no such file or directory/i, '🔧 Defeito do projeto', 'Um ARQUIVO que o comando procura não existe (caminho errado, ou faltou criar).'],
    [/sem resposta|Sem resposta do servidor|Failed to fetch|Failed to parse URL|ECONNREFUSED|NetworkError|Load failed/i, '⚙️ Configuração', 'O SERVIDOR está desligado (ou caiu). Ligue o servidor (npm run dev / npm run servidor) e tente de novo.'],
    [/\b429\b|quota|RESOURCE_EXHAUSTED|rate.?limit|Too Many Requests/i, '⚙️ Configuração', 'O limite da chave da IA acabou (comum na chave grátis). Espere ou use outra chave.'],
    [/API.?key|\b401\b|\b403\b|PERMISSION_DENIED|invalid.?key|Unauthorized/i, '⚙️ Configuração', 'Problema com a CHAVE (faltando, errada ou sem permissão). Não é defeito do projeto.'],
    [/relation .* does not exist|no such table/i, '🔧 Defeito do projeto', 'O BANCO não tem a tabela que essa parte usa.'],
    [/respondeu 404|Cannot (GET|POST|PUT|PATCH|DELETE)/i, '🔧 Defeito do projeto', 'A tela chama um ENDEREÇO que o servidor não tem (falta a rota).'],
    [/respondeu 5\d\d|Internal Server Error/i, '🔧 Defeito do projeto', 'Deu erro DENTRO do servidor. Veja o erro do terminal logo antes.'],
    [/não encontrad|nao encontrad|not found/i, '✅ Normal', 'Pediu algo que não existe (ainda não foi criado ou já foi apagado). Normalmente não é defeito.'],
    [/ReferenceError|TypeError|SyntaxError|is not defined|is not a function|Cannot read prop|Unexpected token|already been declared/i, '🔧 Defeito do projeto', 'Erro no CÓDIGO (algo que o programa esperava e não existe, ou escrita errada). Mande para a IA.'],
  ];
  function explicar(x) { const t = x.de + ' ' + x.msg; for (const [re, selo, texto] of REGRAS) if (re.test(t)) return { selo, texto }; return { selo: '❓ Ver com a IA', texto: 'Não reconheci. Copie e mande para a IA.' }; }
  function anotar(de, msg) {
    msg = esconder(String(msg || '').trim()).slice(0, 1500); if (!msg) return;
    const ult = lista[lista.length - 1];
    if (ult && ult.de === de && ult.msg === msg) ult.vezes = (ult.vezes || 1) + 1;
    else { lista.push({ quando: new Date().toLocaleTimeString('pt-BR'), de, msg }); if (lista.length > MAX) lista.shift(); }
    pintarBotao(); if (painel && !painel.hidden) pintar();
  }
  // ── de onde vêm os erros ──
  window.addEventListener('message', (e) => { const d = e.data; if (d && d.sk === 'console' && d.level === 'error') anotar('🖥 Prévia', d.text); });
  const ERRO_TERM = /npm ERR!|npm error|\bERR_[A-Z_]+|Error:|error TS\d|EADDRINUSE|ENOENT|ECONNREFUSED|Cannot find module|Traceback \(most recent|SyntaxError|TypeError|ReferenceError|Unhandled|✘ \[ERROR\]|\[vite\].*(error|failed)|command not found|não é reconhecido|failed to compile/i;
  const restos = {}; const dec = new TextDecoder();
  SK.on('terminal-saida', (ev) => {
    if (!ev) return;
    let t = typeof ev.texto === 'string' ? ev.texto : dec.decode(ev.texto instanceof Uint8Array ? ev.texto : new Uint8Array(ev.texto || []), { stream: true });
    t = (restos[ev.de] || '') + t.replace(/\x1b\[[0-9;?]*[ -\/]*[@-~]|\x1b\][^\x07]*\x07/g, '').replace(/\r(?!\n)/g, '\n');
    const linhas = t.split('\n'); restos[ev.de] = linhas.pop().slice(-500);
    for (const l of linhas) if (ERRO_TERM.test(l) && !/(^|[#$>❯%]\s*)(echo|printf)\s/.test(l) && l.length < 1200) anotar(ev.de, l.trim());
  });
  // ── a tela ──
  function pintarBotao() {
    if (!botao) { botao = document.createElement('button'); botao.id = 'cacador-bt'; botao.title = 'Erros encontrados (toque para ver)'; botao.style.cssText = 'position:fixed;right:12px;bottom:72px;z-index:60;border:0;border-radius:99px;padding:10px 14px;font:700 15px system-ui;background:#dc2626;color:#fff;box-shadow:0 6px 20px rgba(0,0,0,.4);cursor:pointer'; botao.onclick = abrir; document.body.appendChild(botao); }
    const n = lista.reduce((s, x) => s + (x.vezes || 1), 0);
    botao.hidden = !n; botao.textContent = '🐞 ' + n;
  }
  function relatorio() {
    return '# 🐞 Erros encontrados — ' + (SK.fs.project ? SK.fs.project.name : '') + ' — ' + new Date().toLocaleString('pt-BR') + '\n\n' +
      lista.map((x, i) => { const e = explicar(x); return '## ' + (i + 1) + '. ' + x.de + ' · ' + x.quando + (x.vezes > 1 ? ' (' + x.vezes + ' vezes)' : '') + '\n**' + e.selo + '** — ' + e.texto + '\n```\n' + x.msg + '\n```'; }).join('\n\n') +
      '\n\n---\nPedido para a IA: estes são os erros do meu projeto. Os marcados como "🔧 Defeito do projeto" são os que preciso consertar. Me devolva o(s) arquivo(s) INTEIRO(S) consertado(s).\n';
  }
  function pintar() {
    const c = painel.querySelector('.cc-lista');
    c.innerHTML = lista.length ? lista.slice().reverse().map((x) => { const e = explicar(x); return '<div style="border:1px solid var(--line2,#334);border-radius:10px;padding:8px;margin-bottom:6px"><div class="small"><b>' + SK.esc(e.selo) + '</b> · ' + SK.esc(x.de) + ' · ' + x.quando + (x.vezes > 1 ? ' · ' + x.vezes + 'x' : '') + '</div><div class="small muted">' + SK.esc(e.texto) + '</div><pre style="white-space:pre-wrap;overflow-wrap:anywhere;font:12px/1.4 ui-monospace,monospace;margin:6px 0 0;max-height:160px;overflow:auto">' + SK.esc(x.msg) + '</pre></div>'; }).join('') : '<p class="muted">Nenhum erro por enquanto. ✅</p>';
  }
  function abrir() {
    if (!painel) {
      painel = document.createElement('div'); painel.id = 'cacador-painel';
      painel.style.cssText = 'position:fixed;inset:auto 8px 8px 8px;max-height:75vh;z-index:61;background:var(--bg2,#16213a);color:var(--fg,#e6edf8);border:1px solid var(--line2,#334);border-radius:14px;padding:10px;overflow:auto;box-shadow:0 10px 40px rgba(0,0,0,.5);max-width:720px;margin:0 auto';
      painel.innerHTML = '<div class="row wrap" style="align-items:center"><b>🐞 Caçador de erros</b><span style="flex:1"></span><button class="btn small" data-c="copiar">📋 Copiar</button><button class="btn small" data-c="baixar">⤓ .md</button><button class="btn small primary" data-c="ia">🤖 Mandar para a IA</button><button class="btn small" data-c="limpar">🧹 Limpar</button><button class="btn small" data-c="fechar">✕</button></div><p class="small muted" style="margin:6px 0">Erros da prévia, do servidor e dos terminais (Node, Termux, PC), explicados. ✅ Normal · ⚙️ Configuração · 🔧 Defeito do projeto.</p><div class="cc-lista"></div>';
      painel.addEventListener('click', async (e) => {
        const b = e.target.closest('[data-c]'); if (!b) return; const c = b.dataset.c;
        if (c === 'fechar') painel.hidden = true;
        if (c === 'limpar') { lista.length = 0; pintar(); pintarBotao(); }
        if (c === 'copiar') { try { await navigator.clipboard.writeText(relatorio()); SK.toast('📋 Erros copiados'); } catch { SK.prompt('Copie:', relatorio()); } }
        if (c === 'baixar') SK.download('erros-' + new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-') + '.md', relatorio(), 'text/markdown');
        if (c === 'ia') { SK.app.openSide('ai'); const inp = document.getElementById('ai-in'); if (inp) { inp.value = relatorio(); inp.dispatchEvent(new Event('input')); } painel.hidden = true; SK.toast('Escrevi os erros na IA — confira e toque em Enviar.'); }
      });
      document.body.appendChild(painel);
    }
    painel.hidden = false; pintar();
  }
  SK.cacador = { anotar, abrir, get lista() { return lista; }, relatorio };
})(window.SK);
