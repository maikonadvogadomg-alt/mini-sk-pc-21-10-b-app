/* =========================================================================
   Mini SK — 91b-publicar.js
   🚀 PUBLICAR — um botão para cada coisa (igual ao APK Builder):
   🌐 Site / PWA (GitHub Pages) · 📦 APK · 💻 .exe
   E a lista 📜 MINHAS PUBLICAÇÕES: o link fica guardado e NÃO some quando
   você sai para testar e volta (fica salvo mesmo fechando o Mini SK).
   ========================================================================= */
(function (SK) {
  'use strict';
  const fs = () => SK.fs;
  const hist = () => SK.pref.get('publicacoes', []);
  function guardar(item) { const h = hist(); h.unshift(Object.assign({ quando: Date.now(), projeto: fs().project ? fs().project.name : '' }, item)); SK.pref.set('publicacoes', h.slice(0, 80)); }
  let box = null;
  const $ = (s) => SK.$(s, box);
  function st(t, k) { const el = $('#pub-status'); if (!el) return; el.textContent = t; el.className = 'gh-status ' + (k || ''); }

  function pintarHist() {
    const el = box && $('#pub-hist'); if (!el) return;
    const h = hist();
    el.innerHTML = h.length ? h.map((x, i) =>
      '<div class="stack" style="border:1px solid var(--line2,#333);border-radius:10px;padding:8px;margin-bottom:6px">' +
      '<div class="row wrap"><b>' + ({ site: '🌐 Site / PWA', apk: '📦 APK', exe: '💻 .exe' }[x.tipo] || x.tipo) + '</b><span class="muted small">' + SK.esc(x.projeto || '') + ' · ' + new Date(x.quando).toLocaleString('pt-BR') + '</span></div>' +
      (x.link ? '<div class="small" style="overflow-wrap:anywhere"><a href="' + SK.esc(x.link) + '" target="_blank" rel="noopener">' + SK.esc(x.link) + '</a></div>' : '') +
      (x.nota ? '<div class="small muted">' + SK.esc(x.nota) + '</div>' : '') +
      '<div class="row wrap">' + (x.link ? '<a class="btn small primary" href="' + SK.esc(x.link) + '" target="_blank" rel="noopener">↗ Abrir</a><button class="btn small" data-copiar="' + i + '">📋 Copiar</button>' : '') +
      (x.acoes ? '<a class="btn small" href="' + SK.esc(x.acoes) + '" target="_blank" rel="noopener">⚙️ Ver no GitHub (Actions)</a>' : '') +
      (x.baixar ? '<a class="btn small" href="' + SK.esc(x.baixar) + '" target="_blank" rel="noopener">⬇ Onde baixar (Releases)</a>' : '') +
      '<button class="btn small" data-tirar="' + i + '">🗑</button></div></div>').join('')
      : '<p class="muted small">Nada publicado ainda. O que você publicar aqui fica guardado nesta lista.</p>';
  }

  async function publicarSite() {
    if (!fs().project) throw new Error('Abra um projeto primeiro.');
    if (!SK.github.token) throw new Error('Falta o token do GitHub: abra 🐙 GitHub, cole o token uma vez e volte aqui.');
    const nome = ($('#pub-repo').value.trim() || fs().project.name);
    if ($('#pub-pwa').checked && fs().exists('index.html') && !fs().exists('manifest.json') && !fs().exists('manifest.webmanifest')) {
      st('1/3 Deixando instalável (PWA: ícones, manifest, service worker)…');
      const n = fs().project.name;
      await SK.pwa.makeInstallable('index.html', { name: n, short: n.slice(0, 12), theme: '#0f172a', bg: '#0f172a', display: 'standalone', orientation: 'any', offline: true });
    }
    st('2/3 Mandando o projeto para o GitHub…');
    const r = await SK.github.sendTo(nome, 'Publicar site (Mini SK)', { mirror: true, includeSk: false });
    st('3/3 Ligando o site (GitHub Pages)…');
    let info = {}; try { info = await SK.github.gh('/repos/' + r.owner + '/' + r.repo); } catch {}
    const url = await SK.github.enablePages(r.owner, r.repo, info.default_branch || 'main');
    guardar({ tipo: 'site', link: url, acoes: 'https://github.com/' + r.owner + '/' + r.repo + '/actions', nota: (info.private ? '⚠ O repositório é privado: no plano grátis o site só abre se for público. ' : '') + 'O site fica pronto em 1–2 minutos. Para instalar como app: abra o link no Chrome → menu ⋮ → Instalar app.' });
    st('✅ Publicado! O link está guardado aqui embaixo (não some).', 'ok');
    pintarHist();
  }
  async function ondePegar(tipo) {
    if (!fs().project) throw new Error('Abra um projeto primeiro.');
    if (!SK.github.token) throw new Error('Falta o token do GitHub: abra 🐙 GitHub, cole o token uma vez e volte aqui.');
    const r = await SK.github.resolveRepo($('#pub-repo').value.trim() || fs().project.name);
    const base = 'https://github.com/' + r.owner + '/' + r.repo;
    guardar({ tipo, link: '', acoes: base + '/actions', baixar: base + '/releases', nota: tipo === 'apk' ? 'O APK é feito no GitHub (Actions). Quando ficar verde ✔, ele aparece em Releases ou em Artifacts.' : 'O .exe é feito no GitHub (Actions → Programa .exe para Windows). Verde ✔ → Artifacts/Releases.' });
    pintarHist();
  }

  function build(el) {
    box = el;
    const nome = fs().project ? fs().project.name : '';
    el.innerHTML =
      '<p class="muted small">Um botão para cada coisa. O resultado fica guardado em <b>📜 Minhas publicações</b> — pode sair para testar e voltar, ele não some.</p>' +
      '<label class="small">Nome no GitHub (repositório) <input class="input" id="pub-repo" placeholder="' + SK.esc(nome) + '" style="width:100%" autocapitalize="off" spellcheck="false"></label>' +
      '<div class="stack" style="margin-top:8px">' +
      '<button class="btn primary" id="pub-site" style="font-size:16px;padding:12px">🌐 Publicar como site / PWA (um toque)</button>' +
      '<label class="small"><input type="checkbox" id="pub-pwa" checked> Deixar instalável como app (cria ícones e manifest se faltar)</label>' +
      '<div class="row wrap"><button class="btn" id="pub-apk">📦 Gerar APK</button><button class="btn" id="pub-exe">💻 Gerar .exe</button></div>' +
      '<div class="small muted">📦 e 💻 abrem o painel de sempre; depois de mandar, toque em <b>📌 Guardar onde pego</b> para o link ficar aqui.</div>' +
      '<div class="row wrap"><button class="btn small" id="pub-onde-apk">📌 Guardar onde pego o APK</button><button class="btn small" id="pub-onde-exe">📌 Guardar onde pego o .exe</button></div>' +
      '</div>' +
      '<div class="gh-status" id="pub-status"></div>' +
      '<h4 style="margin:12px 0 6px">📜 Minhas publicações</h4><div id="pub-hist"></div>';
    const rodar = (fn) => fn().catch((e) => st('⚠ ' + e.message, 'error'));
    $('#pub-site').onclick = () => rodar(publicarSite);
    $('#pub-apk').onclick = () => SK.app.openSide('apk');
    $('#pub-exe').onclick = () => { SK.app.openSide('prep'); SK.toast('Marque "🖥️ Desktop: .exe" e toque em ✅ Fazer tudo; depois 🐙 GitHub → Enviar.'); };
    $('#pub-onde-apk').onclick = () => rodar(() => ondePegar('apk'));
    $('#pub-onde-exe').onclick = () => rodar(() => ondePegar('exe'));
    $('#pub-hist').addEventListener('click', async (e) => {
      const c = e.target.closest('[data-copiar]'); if (c) { const x = hist()[+c.dataset.copiar]; try { await navigator.clipboard.writeText(x.link); SK.toast('📋 Link copiado'); } catch { SK.prompt('Copie o link:', x.link); } }
      const t = e.target.closest('[data-tirar]'); if (t) { const h = hist(); h.splice(+t.dataset.tirar, 1); SK.pref.set('publicacoes', h); pintarHist(); }
    });
    pintarHist();
  }
  SK.on('project-open', () => { if (box) { const i = box.querySelector('#pub-repo'); if (i) { i.value = ''; i.placeholder = fs().project ? fs().project.name : ''; } } });
  SK.publicar = { build, publicarSite, get historico() { return hist(); } };
})(window.SK);
