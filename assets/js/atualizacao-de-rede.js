/**
 * Klini Saúde — Atualização de Rede
 * Cascade selects + search using the Klini mudancaRede API
 */
(function () {
  'use strict';

  // ── API Configuration ──────────────────────────────────────────
  var API_BASE = 'https://prd-api.klinisaude.com.br/v1/mudancaRede';
  var API_KEY  = '8yhUmz135S5TryrwBWvjCmqzpb2mOJWS';
  var ESTADO   = 'RJ'; // hardcoded — Klini operates only in Rio de Janeiro

  // Optional CORS proxy — set to '' when deployed on the same domain
  var CORS_PROXY = 'https://corsproxy.io/?';

  function apiFetch(url) {
    var opts = { headers: { 'X-ApiKey': API_KEY } };
    var finalUrl = CORS_PROXY ? CORS_PROXY + encodeURIComponent(url) : url;
    return fetch(finalUrl, opts).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  // ── DOM ────────────────────────────────────────────────────────
  var form       = document.getElementById('ar-form');
  var submitBtn  = document.getElementById('ar-submit');
  var submitText = document.getElementById('ar-submit-text');
  var clearBtn   = document.getElementById('ar-clear');

  var redeSel     = document.getElementById('rede-input');
  var municipioSel = document.getElementById('municipio-input');
  var bairroSel   = document.getElementById('bairro-input');

  var redeLoader     = document.getElementById('rede-loader');
  var municipioLoader = document.getElementById('municipio-loader');
  var bairroLoader   = document.getElementById('bairro-loader');

  var stateEmpty     = document.getElementById('ar-state-empty');
  var stateLoading   = document.getElementById('ar-state-loading');
  var stateNoResults = document.getElementById('ar-state-noresults');
  var resultsContent = document.getElementById('ar-results-content');
  var resultsCount   = document.getElementById('ar-results-count');
  var resultsFilters = document.getElementById('ar-results-filters');
  var resultsGrid    = document.getElementById('ar-grid');
  var stateReset     = document.getElementById('ar-state-reset');

  // ── Select helpers ─────────────────────────────────────────────
  function setLoading(loaderEl, selectEl, loading) {
    selectEl.disabled = true;
    if (loading) {
      loaderEl.classList.add('ar-select-wrapper--loading');
      loaderEl.classList.remove('ar-select-wrapper--ready');
    } else {
      loaderEl.classList.remove('ar-select-wrapper--loading');
      loaderEl.classList.add('ar-select-wrapper--ready');
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
    loaderEl.classList.remove('ar-select-wrapper--loading', 'ar-select-wrapper--ready');
  }

  function checkSubmitReady() {
    submitBtn.disabled = !(redeSel.value && municipioSel.value && bairroSel.value);
  }

  // ── Init — Load redes on page load ────────────────────────────
  setLoading(redeLoader, redeSel, true);

  apiFetch(API_BASE + '/redes')
    .then(function (data) {
      populate(redeSel, redeLoader, data, 'id', 'nome');
    })
    .catch(function () {
      setLoading(redeLoader, redeSel, false);
      redeSel.disabled = true;
    });

  // ── Step 1 — Rede → Municípios ────────────────────────────────
  redeSel.addEventListener('change', function () {
    var redeId = this.value;
    submitBtn.disabled = true;

    resetSel(municipioSel, municipioLoader, 'Selecione o município');
    resetSel(bairroSel, bairroLoader, 'Selecione o bairro');

    if (!redeId) return;

    setLoading(municipioLoader, municipioSel, true);

    apiFetch(API_BASE + '/municipios?redeId=' + redeId + '&estado=' + ESTADO)
      .then(function (data) {
        populate(municipioSel, municipioLoader, data, 'id', 'nome');
      })
      .catch(function () {
        setLoading(municipioLoader, municipioSel, false);
        municipioSel.disabled = true;
        showError('Erro ao carregar municípios.');
      });
  });

  // ── Step 2 — Município → Bairros ─────────────────────────────
  municipioSel.addEventListener('change', function () {
    var redeId   = redeSel.value;
    var municId  = this.value;
    submitBtn.disabled = true;

    resetSel(bairroSel, bairroLoader, 'Selecione o bairro');

    if (!municId) return;

    setLoading(bairroLoader, bairroSel, true);

    apiFetch(
      API_BASE + '/bairros?redeId=' + redeId +
      '&estado=' + ESTADO +
      '&municipioId=' + municId
    )
      .then(function (data) {
        populate(bairroSel, bairroLoader, data, 'id', 'nome');
      })
      .catch(function () {
        setLoading(bairroLoader, bairroSel, false);
        bairroSel.disabled = true;
        showError('Erro ao carregar bairros.');
      });
  });

  // ── Step 3 — Bairro selected → enable submit ──────────────────
  bairroSel.addEventListener('change', checkSubmitReady);

  // ── Form submit — Search prestadores ──────────────────────────
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    performSearch();
  });

  function performSearch() {
    var redeId  = redeSel.value;
    var municId = municipioSel.value;
    var bairroId = bairroSel.value;

    if (!redeId || !municId || !bairroId) return;

    showState('loading');
    setSubmitLoading(true);
    clearBtn.style.display = 'inline-flex';

    var url = API_BASE + '/prestadores' +
      '?redeId=' + redeId +
      '&estado=' + ESTADO +
      '&municipioId=' + municId +
      '&bairroId=' + bairroId;

    apiFetch(url)
      .then(function (data) {
        renderResults(Array.isArray(data) ? data : []);
      })
      .catch(function () {
        setSubmitLoading(false);
        showApiError();
      });
  }

  function renderResults(results) {
    setSubmitLoading(false);

    if (!results.length) {
      showState('noresults');
      return;
    }

    var total = results.length;
    resultsCount.textContent = 'Foram encontradas ' + total + ' alteraç' + (total !== 1 ? 'ões' : 'ão') + ' na sua consulta';
    resultsFilters.textContent = buildFilterSummary();

    resultsGrid.innerHTML = '';
    results.forEach(function (r) {
      resultsGrid.appendChild(buildCard(r));
    });

    showState('results');
    document.getElementById('resultados').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ── Card builders ─────────────────────────────────────────────
  function buildCard(r) {
    var tipo = (r.tipoEvento && r.tipoEvento.id) || '';
    return tipo === 'S' ? buildSubstituicaoCard(r) : buildExclusaoCard(r);
  }

  function buildExclusaoCard(r) {
    var card = document.createElement('div');
    card.className = 'ar-card ar-card--exclusao reveal';

    var p = r.prestador || {};
    var end = p.endereco || {};

    var addrLine = buildAddress(end);
    var dataTermino = p.dataTermino ? formatDate(p.dataTermino) : null;
    var dataDivulg  = r.dataDivulgacao ? formatDate(r.dataDivulgacao) : null;

    card.innerHTML =
      '<div class="ar-card__top">' +
        '<div class="ar-card__meta">' +
          '<span class="ar-badge ar-badge--exclusao">Exclusão</span>' +
          (dataDivulg ? '<span class="ar-card__date">Divulgado em ' + esc(dataDivulg) + '</span>' : '') +
        '</div>' +
      '</div>' +
      '<h3 class="ar-card__name">' + esc(p.nomeFantasia || '–') + '</h3>' +
      '<div class="ar-card__info">' +
        (p.cnpj ? detail(iconCNPJ(), 'CNPJ: ' + esc(p.cnpj)) : '') +
        (addrLine ? detail(iconPin(), esc(addrLine)) : '') +
        (end.municipio ? detail(iconCity(), esc(end.municipio) + (end.estado ? ' – ' + esc(end.estado) : '')) : '') +
      '</div>' +
      (dataTermino ?
        '<span class="ar-card__termino">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' +
          'Encerramento: ' + esc(dataTermino) +
        '</span>' : '');

    return card;
  }

  function buildSubstituicaoCard(r) {
    var card = document.createElement('div');
    card.className = 'ar-card ar-card--substituicao reveal';

    var p    = r.prestador || {};
    var sub  = r.prestadorSubstituto || {};
    var endP = p.endereco || {};
    var endS = sub.endereco || {};
    var dataDivulg = r.dataDivulgacao ? formatDate(r.dataDivulgacao) : null;

    card.innerHTML =
      '<div class="ar-card__top">' +
        '<div class="ar-card__meta">' +
          '<span class="ar-badge ar-badge--substituicao">Substituição</span>' +
          (dataDivulg ? '<span class="ar-card__date">Divulgado em ' + esc(dataDivulg) + '</span>' : '') +
        '</div>' +
      '</div>' +
      '<div class="ar-subst-body">' +
        '<div class="ar-subst-col ar-subst-col--old">' +
          '<p class="ar-subst-col__label">Prestador excluído</p>' +
          '<p class="ar-subst-col__name">' + esc(p.nomeFantasia || '–') + '</p>' +
          (p.cnpj ? '<div class="ar-card__detail">' + iconCNPJ() + '<span>CNPJ: ' + esc(p.cnpj) + '</span></div>' : '') +
          (buildAddress(endP) ? '<div class="ar-card__detail">' + iconPin() + '<span>' + esc(buildAddress(endP)) + '</span></div>' : '') +
          (endP.municipio ? '<div class="ar-card__detail">' + iconCity() + '<span>' + esc(endP.municipio) + '</span></div>' : '') +
          (p.dataTermino ? '<span class="ar-card__termino" style="margin-top:8px"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>Encerramento: ' + esc(formatDate(p.dataTermino)) + '</span>' : '') +
        '</div>' +
        '<div class="ar-subst-col ar-subst-col--new">' +
          '<p class="ar-subst-col__label">Prestador substituto</p>' +
          (sub.nomeFantasia ?
            '<p class="ar-subst-col__name">' + esc(sub.nomeFantasia) + '</p>' +
            (sub.cnpj ? '<div class="ar-card__detail">' + iconCNPJ() + '<span>CNPJ: ' + esc(sub.cnpj) + '</span></div>' : '') +
            (buildAddress(endS) ? '<div class="ar-card__detail">' + iconPin() + '<span>' + esc(buildAddress(endS)) + '</span></div>' : '') +
            (endS.municipio ? '<div class="ar-card__detail">' + iconCity() + '<span>' + esc(endS.municipio) + '</span></div>' : '')
            :
            '<p class="ar-subst-col__name" style="color:var(--klini-text-muted);font-weight:400">A ser informado</p>'
          ) +
        '</div>' +
      '</div>';

    return card;
  }

  // ── States ────────────────────────────────────────────────────
  function showState(state) {
    stateEmpty.style.display     = state === 'empty'     ? 'flex'  : 'none';
    stateLoading.style.display   = state === 'loading'   ? 'block' : 'none';
    stateNoResults.style.display = state === 'noresults' ? 'flex'  : 'none';
    resultsContent.style.display = state === 'results'   ? 'block' : 'none';
  }

  function showApiError() {
    resultsGrid.innerHTML =
      '<div class="ar-state" style="grid-column:1/-1;padding:40px 0">' +
        '<div class="ar-state__icon" aria-hidden="true">' +
          '<svg viewBox="0 0 80 80" fill="none"><circle cx="40" cy="40" r="36" fill="var(--klini-primary-100)"/>' +
          '<line x1="40" y1="28" x2="40" y2="44" stroke="var(--klini-accent-500)" stroke-width="3" stroke-linecap="round"/>' +
          '<circle cx="40" cy="52" r="2" fill="var(--klini-accent-500)"/></svg>' +
        '</div>' +
        '<h3 class="ar-state__title">Não foi possível realizar a consulta</h3>' +
        '<p class="ar-state__desc">Verifique sua conexão ou tente novamente em instantes.</p>' +
      '</div>';
    resultsCount.textContent = '';
    resultsFilters.textContent = '';
    resultsContent.style.display = 'block';
    stateLoading.style.display = 'none';
    stateEmpty.style.display = 'none';
    stateNoResults.style.display = 'none';
    setSubmitLoading(false);
    document.getElementById('resultados').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function showError(msg) {
    console.warn('[Atualização de Rede]', msg);
  }

function setSubmitLoading(loading) {
    submitBtn.classList.toggle('is-loading', loading);
    submitBtn.disabled = loading;
    submitText.textContent = loading ? 'Consultando...' : 'Consultar mudanças';
  }

  // ── Clear ─────────────────────────────────────────────────────
  clearBtn.addEventListener('click', resetForm);
  stateReset.addEventListener('click', function () {
    document.getElementById('consultar').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  function resetForm() {
    // Don't reset rede — it's loaded on init and doesn't need to reload
    redeSel.value = '';
    resetSel(municipioSel, municipioLoader, 'Selecione o município');
    resetSel(bairroSel, bairroLoader, 'Selecione o bairro');
    submitBtn.disabled = true;
    clearBtn.style.display = 'none';
    showState('empty');
    document.getElementById('consultar').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ── Helpers ───────────────────────────────────────────────────
  function buildFilterSummary() {
    var parts = [];
    var mun = municipioSel.options[municipioSel.selectedIndex];
    var bairro = bairroSel.options[bairroSel.selectedIndex];
    if (mun && mun.value) parts.push(mun.textContent);
    if (bairro && bairro.value) parts.push(bairro.textContent);
    parts.push(ESTADO);
    return parts.join(' · ');
  }

  function buildAddress(end) {
    var rua = end.logradouro || '';
    if (end.numero)      rua += ', ' + end.numero;
    if (end.complemento) rua += ' – ' + end.complemento;
    if (end.bairro)      rua += ' – ' + end.bairro;
    return rua;
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    // Accepts ISO dates like "2024-03-15" or "2024-03-15T00:00:00"
    var d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function detail(iconHtml, text) {
    return '<div class="ar-card__detail">' + iconHtml + '<span>' + text + '</span></div>';
  }

  function esc(s) {
    return String(s || '')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function iconPin() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>';
  }
  function iconCity() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>';
  }
  function iconCNPJ() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>';
  }

})();
