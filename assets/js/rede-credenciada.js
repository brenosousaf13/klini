/**
 * Klini Saúde — Rede Credenciada
 * Cascade selects + search using the real Klini API endpoints
 */
(function () {
  'use strict';

  // ── API Configuration ──────────────────────────────────────────
  var API_ODONTO = 'https://klinisaude.com.br/wp-json/guiaMedico/v1';
  var API_TASY   = 'https://prd-medicalguideservice.klinisaude.com.br';
  var TASY_KEY   = 'UG7JqAQzcAuXJlvKqOa8dBqoTzHvw2vO';

  // Optional CORS proxy — set to '' to call APIs directly (same-origin or CORS-enabled)
  // Example: 'https://corsproxy.io/?' or a self-hosted proxy URL
  var CORS_PROXY = 'https://corsproxy.io/?';

  function apiBase(tipoProduto) {
    return tipoProduto === 'O' ? API_ODONTO : API_TASY + '/v1/guiamedico';
  }

  function apiFetch(url, tipoProduto) {
    var opts = { headers: {} };
    if (tipoProduto !== 'O') opts.headers['X-ApiKey'] = TASY_KEY;
    var finalUrl = CORS_PROXY ? CORS_PROXY + encodeURIComponent(url) : url;
    return fetch(finalUrl, opts).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  // ── DOM ────────────────────────────────────────────────────────
  var form             = document.getElementById('rc-form');
  var submitBtn        = document.getElementById('rc-submit');
  var submitText       = document.getElementById('rc-submit-text');
  var clearBtn         = document.getElementById('rc-clear');

  var tipoProdutoSel   = document.getElementById('tipo-produto-input');
  var redeSel          = document.getElementById('rede-input');
  var tipoServicoSel   = document.getElementById('tipo-servico-input');
  var especialidadeSel = document.getElementById('especialidade-input');
  var estadoSel        = document.getElementById('estado-input');
  var municipioSel     = document.getElementById('municipio-input');
  var bairroSel        = document.getElementById('bairro-input');

  var redeLoader        = document.getElementById('rede-loader');
  var tipoServicoLoader = document.getElementById('tipo-servico-loader');
  var espLoader         = document.getElementById('especialidade-loader');
  var estadoLoader      = document.getElementById('estado-loader');
  var municipioLoader   = document.getElementById('municipio-loader');
  var bairroLoader      = document.getElementById('bairro-loader');

  var stateEmpty      = document.getElementById('rc-state-empty');
  var stateLoading    = document.getElementById('rc-state-loading');
  var stateNoResults  = document.getElementById('rc-state-noresults');
  var resultsContent  = document.getElementById('rc-results-content');
  var resultsCount    = document.getElementById('rc-results-count');
  var resultsFilters  = document.getElementById('rc-results-filters');
  var resultsGrid     = document.getElementById('rc-grid');
  var pagination      = document.getElementById('rc-pagination');
  var stateReset      = document.getElementById('rc-state-reset');

  // ── Select helpers ─────────────────────────────────────────────
  function setLoading(loaderEl, selectEl, loading) {
    selectEl.disabled = true;
    if (loading) {
      loaderEl.classList.add('rc-select-wrapper--loading');
      loaderEl.classList.remove('rc-select-wrapper--ready');
    } else {
      loaderEl.classList.remove('rc-select-wrapper--loading');
      loaderEl.classList.add('rc-select-wrapper--ready');
    }
  }

  function populate(selectEl, loaderEl, items, valueKey, labelKey) {
    while (selectEl.options.length > 1) selectEl.remove(1);
    items.forEach(function (item) {
      var o = document.createElement('option');
      o.value = item[valueKey];
      o.textContent = item[labelKey];
      selectEl.appendChild(o);
    });
    selectEl.disabled = false;
    setLoading(loaderEl, selectEl, false);
  }

  function resetSel(selectEl, loaderEl, placeholder) {
    while (selectEl.options.length > 1) selectEl.remove(1);
    selectEl.options[0].textContent = placeholder;
    selectEl.value = '';
    selectEl.disabled = true;
    loaderEl.classList.remove('rc-select-wrapper--loading', 'rc-select-wrapper--ready');
  }

  function checkSubmitReady() {
    submitBtn.disabled = !(
      tipoProdutoSel.value &&
      redeSel.value &&
      tipoServicoSel.value &&
      especialidadeSel.value &&
      estadoSel.value &&
      municipioSel.value
    );
  }

  // ── Step 1 — Tipo de Produto → Redes ──────────────────────────
  tipoProdutoSel.addEventListener('change', function () {
    var tp = this.value;
    submitBtn.disabled = true;

    resetSel(redeSel,        redeLoader,        'Selecione a rede');
    resetSel(tipoServicoSel, tipoServicoLoader, 'Selecione o tipo');
    resetSel(especialidadeSel, espLoader,       'Selecione a especialidade');
    resetSel(estadoSel,      estadoLoader,      'Selecione o estado');
    resetSel(municipioSel,   municipioLoader,   'Selecione o município');
    resetSel(bairroSel,      bairroLoader,      'Selecione o bairro');

    setLoading(redeLoader, redeSel, true);

    apiFetch(apiBase(tp) + '/redes?tipoProduto=' + tp, tp)
      .then(function (data) {
        hideCorsWarning();
        populate(redeSel, redeLoader, data, 'id', 'nome');
      })
      .catch(function () {
        setLoading(redeLoader, redeSel, false);
        redeSel.disabled = true;
        showCorsWarning(tp);
      });
  });

  // ── Step 2 — Rede → Tipos de Serviço ──────────────────────────
  redeSel.addEventListener('change', function () {
    var tp   = tipoProdutoSel.value;
    var rede = this.value;
    submitBtn.disabled = true;

    resetSel(tipoServicoSel, tipoServicoLoader, 'Selecione o tipo');
    resetSel(especialidadeSel, espLoader,       'Selecione a especialidade');
    resetSel(estadoSel,      estadoLoader,      'Selecione o estado');
    resetSel(municipioSel,   municipioLoader,   'Selecione o município');
    resetSel(bairroSel,      bairroLoader,      'Selecione o bairro');

    setLoading(tipoServicoLoader, tipoServicoSel, true);

    // Note: Odonto uses "tipoServicos", Tasy uses "tiposervicos"
    var endpoint = tp === 'O' ? '/tipoServicos' : '/tiposervicos';
    apiFetch(apiBase(tp) + endpoint + '?redeId=' + rede + '&tipoProduto=' + tp, tp)
      .then(function (data) {
        populate(tipoServicoSel, tipoServicoLoader, data, 'id', 'nome');
      })
      .catch(function () {
        setLoading(tipoServicoLoader, tipoServicoSel, false);
        tipoServicoSel.disabled = true;
        showError('Erro ao carregar tipos de serviço.');
      });
  });

  // ── Step 3 — Tipo de Serviço → Especialidades ─────────────────
  tipoServicoSel.addEventListener('change', function () {
    var tp       = tipoProdutoSel.value;
    var rede     = redeSel.value;
    var tipoServ = this.value;
    submitBtn.disabled = true;

    resetSel(especialidadeSel, espLoader,     'Selecione a especialidade');
    resetSel(estadoSel,        estadoLoader,  'Selecione o estado');
    resetSel(municipioSel,     municipioLoader,'Selecione o município');
    resetSel(bairroSel,        bairroLoader,  'Selecione o bairro');

    setLoading(espLoader, especialidadeSel, true);

    apiFetch(
      apiBase(tp) + '/especialidades?redeId=' + rede +
      '&tipoServicoId=' + tipoServ + '&tipoProduto=' + tp, tp
    )
      .then(function (data) {
        populate(especialidadeSel, espLoader, data, 'id', 'nome');
      })
      .catch(function () {
        setLoading(espLoader, especialidadeSel, false);
        especialidadeSel.disabled = true;
        showError('Erro ao carregar especialidades.');
      });
  });

  // ── Step 4 — Especialidade → Estados ──────────────────────────
  especialidadeSel.addEventListener('change', function () {
    var tp     = tipoProdutoSel.value;
    var rede   = redeSel.value;
    var tipoS  = tipoServicoSel.value;
    var espId  = this.value;
    submitBtn.disabled = true;

    resetSel(estadoSel,    estadoLoader,   'Selecione o estado');
    resetSel(municipioSel, municipioLoader,'Selecione o município');
    resetSel(bairroSel,    bairroLoader,   'Selecione o bairro');

    setLoading(estadoLoader, estadoSel, true);

    apiFetch(
      apiBase(tp) + '/estados?redeId=' + rede +
      '&tipoServicoId=' + tipoS + '&especialidadeId=' + espId + '&tipoProduto=' + tp, tp
    )
      .then(function (data) {
        // Estados return {sigla, sigla} — value and label are both the sigla
        populate(estadoSel, estadoLoader, data, 'sigla', 'sigla');
      })
      .catch(function () {
        setLoading(estadoLoader, estadoSel, false);
        estadoSel.disabled = true;
        showError('Erro ao carregar estados.');
      });
  });

  // ── Step 5 — Estado → Municípios ──────────────────────────────
  estadoSel.addEventListener('change', function () {
    var tp     = tipoProdutoSel.value;
    var rede   = redeSel.value;
    var tipoS  = tipoServicoSel.value;
    var espId  = especialidadeSel.value;
    var estado = this.value;
    submitBtn.disabled = true;

    resetSel(municipioSel, municipioLoader, 'Selecione o município');
    resetSel(bairroSel,    bairroLoader,    'Selecione o bairro');

    setLoading(municipioLoader, municipioSel, true);

    apiFetch(
      apiBase(tp) + '/municipios?redeId=' + rede +
      '&tipoServicoId=' + tipoS + '&especialidadeId=' + espId +
      '&estado=' + estado + '&tipoProduto=' + tp, tp
    )
      .then(function (data) {
        populate(municipioSel, municipioLoader, data, 'id', 'nome');
      })
      .catch(function () {
        setLoading(municipioLoader, municipioSel, false);
        municipioSel.disabled = true;
        showError('Erro ao carregar municípios.');
      });
  });

  // ── Step 6 — Município → Bairros + Habilita busca ─────────────
  municipioSel.addEventListener('change', function () {
    var tp       = tipoProdutoSel.value;
    var rede     = redeSel.value;
    var tipoS    = tipoServicoSel.value;
    var espId    = especialidadeSel.value;
    var estado   = estadoSel.value;
    var municId  = this.value;

    // Enable submit as soon as municipio is selected (bairro is optional)
    checkSubmitReady();

    resetSel(bairroSel, bairroLoader, 'Selecione o bairro');
    setLoading(bairroLoader, bairroSel, true);

    apiFetch(
      apiBase(tp) + '/bairros?redeId=' + rede +
      '&tipoServicoId=' + tipoS + '&especialidadeId=' + espId +
      '&estado=' + estado + '&municipioId=' + municId + '&tipoProduto=' + tp, tp
    )
      .then(function (data) {
        populate(bairroSel, bairroLoader, data, 'id', 'nome');
      })
      .catch(function () {
        setLoading(bairroLoader, bairroSel, false);
        bairroSel.disabled = true;
        // Not an error — bairro is optional
      });
  });

  // Bairro selection also fine (submit already enabled)
  bairroSel.addEventListener('change', checkSubmitReady);

  // ── Form submit — Search prestadores ──────────────────────────
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    performSearch();
  });

  function performSearch() {
    var tp      = tipoProdutoSel.value;
    var rede    = redeSel.value;
    var tipoS   = tipoServicoSel.value;
    var espId   = especialidadeSel.value;
    var estado  = estadoSel.value;
    var municId = municipioSel.value;
    var bairroId= bairroSel.value || '';

    if (!tp || !rede || !tipoS || !espId || !municId) return;

    showState('loading');
    setSubmitLoading(true);
    clearBtn.style.display = 'inline-flex';

    var url = apiBase(tp) + '/prestadores?redeId=' + rede +
      '&tipoServicoId=' + tipoS +
      '&estado=' + estado +
      '&especialidadeId=' + espId +
      '&municipioId=' + municId +
      '&tipoProduto=' + tp;

    if (bairroId) url += '&bairro=' + bairroId;

    apiFetch(url, tp)
      .then(function (data) {
        renderResults(Array.isArray(data) ? data : []);
      })
      .catch(function () {
        setSubmitLoading(false);
        showState('error');
      });
  }

  function renderResults(results) {
    setSubmitLoading(false);

    if (!results.length) {
      showState('noresults');
      return;
    }

    var total = results.length;
    resultsCount.textContent = 'Foram encontrados ' + total + ' prestador' + (total !== 1 ? 'es' : '') + ' na sua busca';
    resultsFilters.textContent = buildFilterSummary();

    resultsGrid.innerHTML = '';
    results.forEach(function (r) {
      resultsGrid.appendChild(buildCard(r));
    });

    pagination.style.display = 'none';
    showState('results');
    document.getElementById('resultados').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function buildCard(r) {
    var card = document.createElement('div');
    card.className = 'rc-card reveal';

    // Address
    var end = r.endereco || {};
    var linhas = [];
    var rua = end.logradouro || '';
    if (end.numero)     rua += ', ' + end.numero;
    if (end.complemento) rua += ' – ' + end.complemento;
    if (end.bairro)     rua += ' – ' + end.bairro;
    if (rua) linhas.push(rua);
    if (end.municipio)  linhas.push(end.municipio + (end.estado ? ' – ' + end.estado : ''));

    // Phone
    var contato = r.contato || {};
    var telefone = contato.whatsapp || contato.telefone || '';

    // Map link
    var mapQ = [
      end.logradouro, end.numero, end.bairro, end.municipio
    ].filter(Boolean).join(', ').replace(/\s+/g, '+');
    var mapUrl = 'https://www.google.com/maps/search/' + encodeURIComponent(mapQ || (end.municipio || ''));

    // Rede própria badge
    var redePropria = (r.tipoRede && r.tipoRede.id === 'P');

    card.innerHTML =
      '<div class="rc-card__top">' +
        '<div class="rc-card__badges">' +
          '<span class="rc-badge rc-badge--tipo">' + esc(tipoProdutoSel.options[tipoProdutoSel.selectedIndex].text) + '</span>' +
          (r.tipoServico && r.tipoServico.nome ? '<span class="rc-badge rc-badge--servico">' + esc(r.tipoServico.nome) + '</span>' : '') +
          (redePropria ? '<span class="rc-badge rc-badge--klini">Rede Própria</span>' : '') +
        '</div>' +
        '<div class="rc-card__icon" aria-hidden="true">' + iconSVG() + '</div>' +
      '</div>' +
      '<h3 class="rc-card__name">' + esc(r.nomeFantasia || '–') + '</h3>' +
      (r.especialidade && r.especialidade.nome ? '<p class="rc-card__specialty">' + esc(r.especialidade.nome) + '</p>' : '') +
      '<div class="rc-card__info">' +
        (r.cnpj ? detail(iconCNPJ(), 'CNPJ: ' + esc(r.cnpj)) : '') +
        (r.tipoRede && r.tipoRede.nome ? detail(iconRede(), 'Tipo de rede: ' + esc(r.tipoRede.nome)) : '') +
        (linhas[0] ? detail(iconPin(), esc(linhas[0])) : '') +
        (linhas[1] ? detail(iconCity(), esc(linhas[1])) : '') +
        (telefone   ? detail(iconPhone(), esc(telefone)) : '') +
      '</div>' +
      '<div class="rc-card__footer">' +
        '<a href="' + mapUrl + '" target="_blank" rel="noopener" class="rc-card__map-link">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>' +
          'Ver no mapa' +
        '</a>' +
        (telefone ?
          '<a href="tel:' + esc(telefone.replace(/\D/g,'')) + '" class="rc-card__map-link">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.13 12.63 19.79 19.79 0 0 1 1.06 4a2 2 0 0 1 1.72-2H6a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.34 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>' +
            'Ligar' +
          '</a>' : '') +
      '</div>';

    return card;
  }

  // ── States ────────────────────────────────────────────────────
  function showState(state) {
    stateEmpty.style.display     = state === 'empty'     ? 'flex'  : 'none';
    stateLoading.style.display   = state === 'loading'   ? 'block' : 'none';
    stateNoResults.style.display = state === 'noresults' ? 'flex'  : 'none';
    resultsContent.style.display = state === 'results'   ? 'block' : 'none';

    if (state === 'error') {
      showApiError();
    }
  }

  function showApiError() {
    resultsGrid.innerHTML =
      '<div class="rc-state" style="grid-column:1/-1;padding:40px 0">' +
        '<div class="rc-state__icon" aria-hidden="true">' +
          '<svg viewBox="0 0 80 80" fill="none"><circle cx="40" cy="40" r="36" fill="var(--klini-primary-100)"/>' +
          '<line x1="40" y1="28" x2="40" y2="44" stroke="var(--klini-accent-500)" stroke-width="3" stroke-linecap="round"/>' +
          '<circle cx="40" cy="52" r="2" fill="var(--klini-accent-500)"/></svg>' +
        '</div>' +
        '<h3 class="rc-state__title">Não foi possível realizar a busca</h3>' +
        '<p class="rc-state__desc" style="max-width:420px">Verifique sua conexão ou tente novamente. Você também pode acessar a busca diretamente no portal Klini.</p>' +
        '<a href="https://klinisaude.com.br/rede-credenciada/" target="_blank" rel="noopener" class="rc-state__btn" style="text-decoration:none;margin-top:8px;display:inline-flex;align-items:center;gap:8px">' +
          'Abrir portal de busca' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>' +
        '</a>' +
      '</div>';
    resultsCount.textContent = '';
    resultsFilters.textContent = '';
    pagination.style.display = 'none';
    resultsContent.style.display = 'block';
    stateLoading.style.display = 'none';
    stateEmpty.style.display = 'none';
    stateNoResults.style.display = 'none';
    setSubmitLoading(false);
    document.getElementById('resultados').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function showError(msg) {
    console.warn('[Rede Credenciada]', msg);
  }

  // ── CORS warning banner ────────────────────────────────────────
  function showCorsWarning(tipoProduto) {
    var banner = document.getElementById('rc-cors-warning');
    if (banner) { banner.style.display = 'flex'; return; }

    banner = document.createElement('div');
    banner.id = 'rc-cors-warning';
    banner.className = 'rc-cors-banner';
    banner.innerHTML =
      '<div class="rc-cors-banner__icon" aria-hidden="true">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>' +
      '</div>' +
      '<div class="rc-cors-banner__body">' +
        '<strong>Busca indisponível neste ambiente</strong>' +
        '<span>A API de rede credenciada só aceita requisições do domínio oficial. ' +
        'Para usar a busca completa, acesse diretamente pelo portal Klini.</span>' +
      '</div>' +
      '<a href="https://klinisaude.com.br/rede-credenciada/" target="_blank" rel="noopener" class="rc-cors-banner__btn">' +
        'Abrir busca completa' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>' +
      '</a>';

    var card = document.querySelector('.rc-search__card');
    if (card) card.insertAdjacentElement('afterend', banner);
  }

  function hideCorsWarning() {
    var banner = document.getElementById('rc-cors-warning');
    if (banner) banner.style.display = 'none';
  }

  function setSubmitLoading(loading) {
    submitBtn.classList.toggle('is-loading', loading);
    submitBtn.disabled = loading;
    submitText.textContent = loading ? 'Buscando...' : 'Buscar prestador';
  }

  // ── Clear ─────────────────────────────────────────────────────
  clearBtn.addEventListener('click', resetForm);
  stateReset.addEventListener('click', function () {
    document.getElementById('buscar').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  function resetForm() {
    form.reset();
    resetSel(redeSel,          redeLoader,        'Selecione a rede');
    resetSel(tipoServicoSel,   tipoServicoLoader, 'Selecione o tipo');
    resetSel(especialidadeSel, espLoader,         'Selecione a especialidade');
    resetSel(estadoSel,        estadoLoader,      'Selecione o estado');
    resetSel(municipioSel,     municipioLoader,   'Selecione o município');
    resetSel(bairroSel,        bairroLoader,      'Selecione o bairro');
    submitBtn.disabled = true;
    clearBtn.style.display = 'none';
    showState('empty');
    document.getElementById('buscar').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ── Helpers ───────────────────────────────────────────────────
  function buildFilterSummary() {
    var parts = [];
    var esp = especialidadeSel.options[especialidadeSel.selectedIndex];
    var mun = municipioSel.options[municipioSel.selectedIndex];
    if (esp && esp.value) parts.push(esp.textContent);
    if (mun && mun.value) parts.push(mun.textContent);
    if (estadoSel.value)  parts.push(estadoSel.value);
    return parts.join(' · ');
  }

  function detail(iconHtml, text) {
    return '<div class="rc-card__detail">' + iconHtml + '<span>' + text + '</span></div>';
  }

  function esc(s) {
    return String(s || '')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function iconSVG() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>';
  }
  function iconPin() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>';
  }
  function iconCity() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>';
  }
  function iconPhone() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.13 12.63 19.79 19.79 0 0 1 1.06 4a2 2 0 0 1 1.72-2H6a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.34 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>';
  }
  function iconCNPJ() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>';
  }
  function iconRede() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>';
  }

  // ── Fix duplicate fetch call (clean up the accidental double) ──
  // (the two apiFetch calls in performSearch need to be consolidated)

})();
