/**
 * Klini Saúde — Rede Credenciada
 * Handles cascade selects, API calls and results rendering
 */
(function () {
  'use strict';

  // ── API Configuration ──────────────────────────────────────────
  // Endpoints from the original Klini guia médico system.
  // All calls go to the WordPress backend via admin-ajax.php or a custom REST route.
  var API = {
    base: 'https://klinisaude.com.br/wp-admin/admin-ajax.php',
    actions: {
      redes:        'klini_gm_redes',
      tiposServico: 'klini_gm_tipos_servico',
      especialidades:'klini_gm_especialidades',
      estados:      'klini_gm_estados',
      municipios:   'klini_gm_municipios',
      bairros:      'klini_gm_bairros',
      buscar:       'klini_gm_buscar'
    }
  };

  // IBGE API (public, CORS-enabled) for estados and municipios as fallback
  var IBGE = {
    estados:    'https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome',
    municipios: 'https://servicodados.ibge.gov.br/api/v1/localidades/estados/{uf}/municipios?orderBy=nome'
  };

  // ── DOM References ─────────────────────────────────────────────
  var form            = document.getElementById('rc-form');
  var submitBtn       = document.getElementById('rc-submit');
  var submitText      = document.getElementById('rc-submit-text');
  var clearBtn        = document.getElementById('rc-clear');

  var tipoProdutoSel  = document.getElementById('tipo-produto-input');
  var redeSel         = document.getElementById('rede-input');
  var tipoServicoSel  = document.getElementById('tipo-servico-input');
  var especialidadeSel= document.getElementById('especialidade-input');
  var estadoSel       = document.getElementById('estado-input');
  var municipioSel    = document.getElementById('municipio-input');
  var bairroSel       = document.getElementById('bairro-input');

  var redeLoader       = document.getElementById('rede-loader');
  var tipoServicoLoader= document.getElementById('tipo-servico-loader');
  var especialidadeLoader = document.getElementById('especialidade-loader');
  var estadoLoader     = document.getElementById('estado-loader');
  var municipioLoader  = document.getElementById('municipio-loader');
  var bairroLoader     = document.getElementById('bairro-loader');

  var stateEmpty      = document.getElementById('rc-state-empty');
  var stateLoading    = document.getElementById('rc-state-loading');
  var stateNoResults  = document.getElementById('rc-state-noresults');
  var resultsContent  = document.getElementById('rc-results-content');
  var resultsCount    = document.getElementById('rc-results-count');
  var resultsFilters  = document.getElementById('rc-results-filters');
  var resultsGrid     = document.getElementById('rc-grid');
  var pagination      = document.getElementById('rc-pagination');
  var loadMoreBtn     = document.getElementById('rc-load-more');
  var stateReset      = document.getElementById('rc-state-reset');

  // Pagination state
  var currentPage   = 1;
  var perPage       = 12;
  var allResults    = [];

  // ── Helper: API request via fetch ──────────────────────────────
  function apiPost(action, params) {
    var body = new URLSearchParams({ action: action });
    if (params) {
      Object.keys(params).forEach(function (k) {
        body.append(k, params[k]);
      });
    }
    return fetch(API.base, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString()
    }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    });
  }

  // ── Helper: select utilities ───────────────────────────────────
  function setLoading(loaderEl, selectEl, loading) {
    if (loading) {
      loaderEl.classList.add('rc-select-wrapper--loading');
      loaderEl.classList.remove('rc-select-wrapper--ready');
      selectEl.disabled = true;
    } else {
      loaderEl.classList.remove('rc-select-wrapper--loading');
      loaderEl.classList.add('rc-select-wrapper--ready');
    }
  }

  function populateSelect(selectEl, options, valueKey, labelKey) {
    var current = selectEl.value;
    // Keep placeholder
    while (selectEl.options.length > 1) {
      selectEl.remove(1);
    }
    options.forEach(function (opt) {
      var o = document.createElement('option');
      o.value = opt[valueKey] !== undefined ? opt[valueKey] : opt;
      o.textContent = opt[labelKey] !== undefined ? opt[labelKey] : opt;
      selectEl.appendChild(o);
    });
    // Restore previous value if still available
    if (current) selectEl.value = current;
  }

  function resetSelect(selectEl, loaderEl, placeholder) {
    while (selectEl.options.length > 1) selectEl.remove(1);
    selectEl.options[0].textContent = placeholder || selectEl.options[0].textContent;
    selectEl.value = '';
    selectEl.disabled = true;
    setLoading(loaderEl, selectEl, false);
    loaderEl.classList.remove('rc-select-wrapper--ready');
  }

  function checkSubmitReady() {
    var ready = tipoProdutoSel.value && redeSel.value &&
                tipoServicoSel.value && especialidadeSel.value &&
                estadoSel.value && municipioSel.value;
    submitBtn.disabled = !ready;
  }

  // ── Step 1: Load Redes when tipo-produto changes ───────────────
  tipoProdutoSel.addEventListener('change', function () {
    var tipoProduto = this.value;
    if (!tipoProduto) return;

    // Reset downstream selects
    resetSelect(redeSel, redeLoader, 'Selecione a rede');
    resetSelect(tipoServicoSel, tipoServicoLoader, 'Selecione o tipo');
    resetSelect(especialidadeSel, especialidadeLoader, 'Selecione a especialidade');
    resetSelect(estadoSel, estadoLoader, 'Selecione o estado');
    resetSelect(municipioSel, municipioLoader, 'Selecione o município');
    resetSelect(bairroSel, bairroLoader, 'Selecione o bairro');
    checkSubmitReady();

    setLoading(redeLoader, redeSel, true);

    apiPost(API.actions.redes, { tipo_produto: tipoProduto })
      .then(function (data) {
        var redes = Array.isArray(data) ? data : (data.data || []);
        populateSelect(redeSel, redes, 'value', 'label');
        redeSel.disabled = false;
        setLoading(redeLoader, redeSel, false);
        loadTiposServico(tipoProduto, null);
        loadEstados();
      })
      .catch(function () {
        // Fallback: enable rede with generic options
        populateSelect(redeSel, [
          { value: 'basica', label: 'Rede Básica' },
          { value: 'preferencial', label: 'Rede Preferencial' },
          { value: 'nacional', label: 'Rede Nacional' }
        ], 'value', 'label');
        redeSel.disabled = false;
        setLoading(redeLoader, redeSel, false);
        loadTiposServico(tipoProduto, null);
        loadEstados();
      });
  });

  // ── Step 1b: Load Tipos de Serviço ────────────────────────────
  function loadTiposServico(tipoProduto, rede) {
    setLoading(tipoServicoLoader, tipoServicoSel, true);

    apiPost(API.actions.tiposServico, { tipo_produto: tipoProduto, rede: rede || '' })
      .then(function (data) {
        var tipos = Array.isArray(data) ? data : (data.data || []);
        populateSelect(tipoServicoSel, tipos, 'value', 'label');
        tipoServicoSel.disabled = false;
        setLoading(tipoServicoLoader, tipoServicoSel, false);
      })
      .catch(function () {
        // Fallback with common service types
        var fallback = [
          { value: 'consulta', label: 'Consulta Médica' },
          { value: 'exame', label: 'Exames' },
          { value: 'terapia', label: 'Terapias' },
          { value: 'internacao', label: 'Internação' },
          { value: 'pronto-socorro', label: 'Pronto-Socorro' },
          { value: 'cirurgia', label: 'Cirurgia' }
        ];
        populateSelect(tipoServicoSel, fallback, 'value', 'label');
        tipoServicoSel.disabled = false;
        setLoading(tipoServicoLoader, tipoServicoSel, false);
      });
  }

  // When rede changes, reload tipos serviço filtered
  redeSel.addEventListener('change', function () {
    var tipoProduto = tipoProdutoSel.value;
    var rede = this.value;

    resetSelect(tipoServicoSel, tipoServicoLoader, 'Selecione o tipo');
    resetSelect(especialidadeSel, especialidadeLoader, 'Selecione a especialidade');
    checkSubmitReady();

    if (tipoProduto) loadTiposServico(tipoProduto, rede);
  });

  // ── Step 2: Load Especialidades when tipo-servico changes ──────
  tipoServicoSel.addEventListener('change', function () {
    var tipoProduto = tipoProdutoSel.value;
    var rede        = redeSel.value;
    var tipoServico = this.value;

    resetSelect(especialidadeSel, especialidadeLoader, 'Selecione a especialidade');
    checkSubmitReady();

    setLoading(especialidadeLoader, especialidadeSel, true);

    apiPost(API.actions.especialidades, {
      tipo_produto: tipoProduto,
      rede: rede,
      tipo_servico: tipoServico
    })
      .then(function (data) {
        var esp = Array.isArray(data) ? data : (data.data || []);
        populateSelect(especialidadeSel, esp, 'value', 'label');
        especialidadeSel.disabled = false;
        setLoading(especialidadeLoader, especialidadeSel, false);
      })
      .catch(function () {
        // Fallback with common medical specialties
        var fallback = [
          { value: 'clinica-geral', label: 'Clínica Geral' },
          { value: 'cardiologia', label: 'Cardiologia' },
          { value: 'dermatologia', label: 'Dermatologia' },
          { value: 'endocrinologia', label: 'Endocrinologia' },
          { value: 'ginecologia', label: 'Ginecologia e Obstetrícia' },
          { value: 'gastroenterologia', label: 'Gastroenterologia' },
          { value: 'neurologia', label: 'Neurologia' },
          { value: 'oftalmologia', label: 'Oftalmologia' },
          { value: 'ortopedia', label: 'Ortopedia e Traumatologia' },
          { value: 'otorrinolaringologia', label: 'Otorrinolaringologia' },
          { value: 'pediatria', label: 'Pediatria' },
          { value: 'psiquiatria', label: 'Psiquiatria' },
          { value: 'reumatologia', label: 'Reumatologia' },
          { value: 'urologia', label: 'Urologia' }
        ];
        populateSelect(especialidadeSel, fallback, 'value', 'label');
        especialidadeSel.disabled = false;
        setLoading(especialidadeLoader, especialidadeSel, false);
      });
  });

  especialidadeSel.addEventListener('change', checkSubmitReady);

  // ── Step 3: Load Estados via IBGE ─────────────────────────────
  function loadEstados() {
    setLoading(estadoLoader, estadoSel, true);

    fetch(IBGE.estados)
      .then(function (res) { return res.json(); })
      .then(function (data) {
        var estados = data.map(function (e) {
          return { value: e.sigla, label: e.nome + ' (' + e.sigla + ')' };
        });
        populateSelect(estadoSel, estados, 'value', 'label');
        estadoSel.disabled = false;
        setLoading(estadoLoader, estadoSel, false);
      })
      .catch(function () {
        // Hardcoded BR states as ultimate fallback
        var estados = [
          {value:'AC',label:'Acre (AC)'},{value:'AL',label:'Alagoas (AL)'},
          {value:'AP',label:'Amapá (AP)'},{value:'AM',label:'Amazonas (AM)'},
          {value:'BA',label:'Bahia (BA)'},{value:'CE',label:'Ceará (CE)'},
          {value:'DF',label:'Distrito Federal (DF)'},{value:'ES',label:'Espírito Santo (ES)'},
          {value:'GO',label:'Goiás (GO)'},{value:'MA',label:'Maranhão (MA)'},
          {value:'MT',label:'Mato Grosso (MT)'},{value:'MS',label:'Mato Grosso do Sul (MS)'},
          {value:'MG',label:'Minas Gerais (MG)'},{value:'PA',label:'Pará (PA)'},
          {value:'PB',label:'Paraíba (PB)'},{value:'PR',label:'Paraná (PR)'},
          {value:'PE',label:'Pernambuco (PE)'},{value:'PI',label:'Piauí (PI)'},
          {value:'RJ',label:'Rio de Janeiro (RJ)'},{value:'RN',label:'Rio Grande do Norte (RN)'},
          {value:'RS',label:'Rio Grande do Sul (RS)'},{value:'RO',label:'Rondônia (RO)'},
          {value:'RR',label:'Roraima (RR)'},{value:'SC',label:'Santa Catarina (SC)'},
          {value:'SP',label:'São Paulo (SP)'},{value:'SE',label:'Sergipe (SE)'},
          {value:'TO',label:'Tocantins (TO)'}
        ];
        populateSelect(estadoSel, estados, 'value', 'label');
        estadoSel.disabled = false;
        setLoading(estadoLoader, estadoSel, false);
      });
  }

  // ── Step 4: Load Municípios when estado changes ────────────────
  estadoSel.addEventListener('change', function () {
    var uf = this.value;

    resetSelect(municipioSel, municipioLoader, 'Selecione o município');
    resetSelect(bairroSel, bairroLoader, 'Selecione o bairro');
    checkSubmitReady();

    if (!uf) return;

    setLoading(municipioLoader, municipioSel, true);

    var url = IBGE.municipios.replace('{uf}', uf);
    fetch(url)
      .then(function (res) { return res.json(); })
      .then(function (data) {
        var municipios = data.map(function (m) {
          return { value: m.nome, label: m.nome };
        });
        populateSelect(municipioSel, municipios, 'value', 'label');
        municipioSel.disabled = false;
        setLoading(municipioLoader, municipioSel, false);
      })
      .catch(function () {
        municipioSel.disabled = false;
        setLoading(municipioLoader, municipioSel, false);
      });
  });

  // ── Step 5: Load Bairros when município changes ────────────────
  municipioSel.addEventListener('change', function () {
    var tipoProduto = tipoProdutoSel.value;
    var uf          = estadoSel.value;
    var municipio   = this.value;

    resetSelect(bairroSel, bairroLoader, 'Selecione o bairro');
    checkSubmitReady();

    if (!municipio) return;

    setLoading(bairroLoader, bairroSel, true);

    apiPost(API.actions.bairros, {
      tipo_produto: tipoProduto,
      estado: uf,
      municipio: municipio
    })
      .then(function (data) {
        var bairros = Array.isArray(data) ? data : (data.data || []);
        if (bairros.length) {
          populateSelect(bairroSel, bairros, 'value', 'label');
        }
        bairroSel.disabled = false;
        setLoading(bairroLoader, bairroSel, false);
      })
      .catch(function () {
        bairroSel.disabled = false;
        setLoading(bairroLoader, bairroSel, false);
      });
  });

  // ── Form submit ────────────────────────────────────────────────
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    currentPage = 1;
    allResults = [];
    performSearch();
  });

  function performSearch() {
    var params = {
      tipo_produto: tipoProdutoSel.value,
      rede:         redeSel.value,
      tipo_servico: tipoServicoSel.value,
      especialidade:especialidadeSel.value,
      estado:       estadoSel.value,
      municipio:    municipioSel.value,
      bairro:       bairroSel.value || '',
      page:         currentPage,
      per_page:     perPage
    };

    showState('loading');
    setSubmitLoading(true);
    clearBtn.style.display = 'inline-flex';

    apiPost(API.actions.buscar, params)
      .then(function (data) {
        var results = Array.isArray(data) ? data : (data.data || data.results || []);
        var total   = data.total || results.length;
        allResults  = allResults.concat(results);
        renderResults(total, results, params);
      })
      .catch(function () {
        // Could not reach Klini API — show friendly guidance
        showFallbackMessage(params);
      })
      .finally(function () {
        setSubmitLoading(false);
      });
  }

  function renderResults(total, results, params) {
    if (!results || results.length === 0) {
      showState('noresults');
      return;
    }

    resultsCount.textContent = total + ' prestador' + (total !== 1 ? 'es' : '') + ' encontrado' + (total !== 1 ? 's' : '');
    resultsFilters.textContent = buildFilterSummary(params);

    if (currentPage === 1) {
      resultsGrid.innerHTML = '';
    }

    results.forEach(function (r) {
      resultsGrid.appendChild(buildCard(r));
    });

    pagination.style.display = allResults.length < total ? 'flex' : 'none';

    showState('results');

    // Smooth scroll to results
    document.getElementById('resultados').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function buildCard(r) {
    var card = document.createElement('div');
    card.className = 'rc-card reveal';

    var tipo = r.tipo_produto === 'O' ? 'Odontológico' : 'Médico';
    var mapUrl = r.latitude && r.longitude
      ? 'https://www.google.com/maps?q=' + r.latitude + ',' + r.longitude
      : 'https://www.google.com/maps?q=' + encodeURIComponent((r.endereco || '') + ' ' + (r.municipio || '') + ' ' + (r.estado || ''));

    card.innerHTML =
      '<div class="rc-card__top">' +
        '<div class="rc-card__badges">' +
          '<span class="rc-badge rc-badge--tipo">' + tipo + '</span>' +
          (r.tipo_servico ? '<span class="rc-badge rc-badge--servico">' + esc(r.tipo_servico) + '</span>' : '') +
        '</div>' +
        '<div class="rc-card__icon" aria-hidden="true">' + iconForType(r) + '</div>' +
      '</div>' +
      '<h3 class="rc-card__name">' + esc(r.nome || r.name || 'Prestador') + '</h3>' +
      (r.especialidade ? '<p class="rc-card__specialty">' + esc(r.especialidade) + '</p>' : '') +
      '<div class="rc-card__info">' +
        (r.endereco ? '<div class="rc-card__detail"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg><span>' + esc(r.endereco) + (r.bairro ? ', ' + esc(r.bairro) : '') + '</span></div>' : '') +
        (r.municipio ? '<div class="rc-card__detail"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg><span>' + esc(r.municipio) + (r.estado ? ' – ' + esc(r.estado) : '') + '</span></div>' : '') +
        (r.telefone ? '<div class="rc-card__detail"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.13 12.63 19.79 19.79 0 0 1 1.06 4a2 2 0 0 1 1.72-2H6a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.34 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg><span>' + esc(r.telefone) + '</span></div>' : '') +
      '</div>' +
      '<div class="rc-card__footer">' +
        '<a href="' + mapUrl + '" target="_blank" rel="noopener" class="rc-card__map-link">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>' +
          'Ver no mapa' +
        '</a>' +
      '</div>';

    return card;
  }

  function iconForType(r) {
    if (r.tipo_produto === 'O') {
      return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>';
    }
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>';
  }

  function showFallbackMessage(params) {
    // Build a direct link to the original search page with params
    var queryParts = [];
    if (params.tipo_produto) queryParts.push('tipoProduto=' + encodeURIComponent(params.tipo_produto));
    if (params.estado)       queryParts.push('estado=' + encodeURIComponent(params.estado));
    if (params.municipio)    queryParts.push('municipio=' + encodeURIComponent(params.municipio));
    var url = 'https://klinisaude.com.br/rede-credenciada/' + (queryParts.length ? '?' + queryParts.join('&') : '');

    resultsGrid.innerHTML =
      '<div class="rc-state rc-state--empty" style="grid-column:1/-1;padding:40px 0">' +
        '<div class="rc-state__icon" aria-hidden="true">' +
          '<svg viewBox="0 0 80 80" fill="none"><circle cx="40" cy="40" r="36" fill="var(--klini-primary-100)"/>' +
          '<path d="M32 40h16M40 32v16" stroke="var(--klini-primary-500)" stroke-width="2.5" stroke-linecap="round"/></svg>' +
        '</div>' +
        '<h3 class="rc-state__title">Busca disponível no portal Klini</h3>' +
        '<p class="rc-state__desc" style="max-width:460px">Para visualizar os resultados completos da rede credenciada, acesse o portal oficial com os filtros já pré-selecionados.</p>' +
        '<a href="' + url + '" target="_blank" rel="noopener" class="rc-state__btn" style="text-decoration:none;display:inline-flex;align-items:center;gap:8px">' +
          'Abrir busca completa' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>' +
        '</a>' +
      '</div>';

    resultsCount.textContent = '';
    resultsFilters.textContent = '';
    pagination.style.display = 'none';
    showState('results');

    document.getElementById('resultados').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function buildFilterSummary(params) {
    var parts = [];
    if (params.especialidade) parts.push(getLabelForValue(especialidadeSel, params.especialidade));
    if (params.municipio)     parts.push(params.municipio);
    if (params.estado)        parts.push(params.estado);
    return parts.join(' · ');
  }

  function getLabelForValue(sel, val) {
    for (var i = 0; i < sel.options.length; i++) {
      if (sel.options[i].value === val) return sel.options[i].textContent;
    }
    return val;
  }

  // ── Load more ─────────────────────────────────────────────────
  loadMoreBtn.addEventListener('click', function () {
    currentPage++;
    performSearch();
  });

  // ── Clear / Reset ─────────────────────────────────────────────
  clearBtn.addEventListener('click', resetForm);
  stateReset.addEventListener('click', function () {
    document.getElementById('buscar').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  function resetForm() {
    form.reset();

    resetSelect(redeSel, redeLoader, 'Selecione a rede');
    resetSelect(tipoServicoSel, tipoServicoLoader, 'Selecione o tipo');
    resetSelect(especialidadeSel, especialidadeLoader, 'Selecione a especialidade');
    resetSelect(estadoSel, estadoLoader, 'Selecione o estado');
    resetSelect(municipioSel, municipioLoader, 'Selecione o município');
    resetSelect(bairroSel, bairroLoader, 'Selecione o bairro');

    submitBtn.disabled = true;
    clearBtn.style.display = 'none';
    allResults = [];
    currentPage = 1;

    showState('empty');
    document.getElementById('buscar').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ── State management ──────────────────────────────────────────
  function showState(state) {
    stateEmpty.style.display    = state === 'empty'     ? 'flex' : 'none';
    stateLoading.style.display  = state === 'loading'   ? 'block' : 'none';
    stateNoResults.style.display= state === 'noresults' ? 'flex' : 'none';
    resultsContent.style.display= state === 'results'   ? 'block' : 'none';
  }

  function setSubmitLoading(loading) {
    submitBtn.classList.toggle('is-loading', loading);
    submitText.textContent = loading ? 'Buscando...' : 'Buscar prestador';
  }

  // ── Utility ───────────────────────────────────────────────────
  function esc(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;');
  }

})();
