/* ==========================================================================
   KLINI SAÚDE — Mapa Interativo de Unidades
   Dependência: Leaflet.js 1.9.4 (carregado antes deste script)

   ELEMENTOR / WORDPRESS:
   ─────────────────────
   Para recriar no WordPress, registre o shortcode via
   assets/klini-map-shortcode.php e enqueue:
     wp_enqueue_style('leaflet', 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
     wp_enqueue_script('leaflet', 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js', [], null, true);
     wp_enqueue_script('klini-map', get_template_directory_uri() . '/assets/js/klini-map.js', ['leaflet'], null, true);
   ========================================================================== */

(function () {
  'use strict';

  /* -------------------------------------------------------------------------
     DADOS DAS UNIDADES
     Para adicionar/editar unidades, altere apenas este array.
     Os campos lat/lng são coordenadas geográficas (Google Maps > botão direito > copiar).
     ------------------------------------------------------------------------- */
  var UNITS = [
    /* ── Centros Médicos ── */
    {
      id: 'barra',
      type: 'medical',
      label: 'Centro Médico',
      name: 'Klini Barra da Tijuca',
      neighborhood: 'Barra da Tijuca',
      zone: 'Zona Oeste, RJ',
      address: 'Av. das Américas, 3200 — Sala 114',
      phone: '(21) 3055-0790',
      hours: 'Seg–Sex: 7h às 19h | Sáb: 8h às 13h',
      lat: -22.9984,
      lng: -43.3650
    },
    {
      id: 'centro',
      type: 'medical',
      label: 'Centro Médico',
      name: 'Klini Centro',
      neighborhood: 'Centro',
      zone: 'Rio de Janeiro',
      address: 'Rua do Catete, 311',
      phone: '(21) 3055-0790',
      hours: 'Seg–Sex: 7h às 19h',
      lat: -22.9288,
      lng: -43.1770
    },
    {
      id: 'tijuca',
      type: 'medical',
      label: 'Centro Médico',
      name: 'Klini Tijuca',
      neighborhood: 'Tijuca',
      zone: 'Zona Norte, RJ',
      address: 'Rua Conde de Bonfim, 678',
      phone: '(21) 3055-0790',
      hours: 'Seg–Sex: 7h às 19h | Sáb: 8h às 13h',
      lat: -22.9254,
      lng: -43.2417
    },
    {
      id: 'madureira',
      type: 'medical',
      label: 'Centro Médico',
      name: 'Klini Madureira',
      neighborhood: 'Madureira',
      zone: 'Zona Norte, RJ',
      address: 'Rua Carolina Machado, 50',
      phone: '(21) 3055-0790',
      hours: 'Seg–Sex: 7h às 18h',
      lat: -22.8775,
      lng: -43.3360
    },
    {
      id: 'nova-iguacu',
      type: 'medical',
      label: 'Centro Médico',
      name: 'Klini Nova Iguaçu',
      neighborhood: 'Nova Iguaçu',
      zone: 'Baixada Fluminense',
      address: 'Av. Abílio Augusto Távora, 1ª Travessa',
      phone: '(21) 3055-0790',
      hours: 'Seg–Sex: 7h às 18h',
      lat: -22.7592,
      lng: -43.4490
    },
    {
      id: 'angra',
      type: 'medical',
      label: 'Centro Médico',
      name: 'Klini Angra dos Reis',
      neighborhood: 'Angra dos Reis',
      zone: 'Costa Verde',
      address: 'Av. Raul Pompeia, 180',
      phone: '(21) 3055-0790',
      hours: 'Seg–Sex: 7h às 17h',
      lat: -23.0062,
      lng: -44.3190
    },
    /* ── Fisioterapia ── */
    {
      id: 'fisio-campo-grande',
      type: 'physio',
      label: 'Fisioterapia',
      name: 'Fisioterapia Campo Grande',
      neighborhood: 'Campo Grande',
      zone: 'Zona Oeste, RJ',
      address: 'Estrada do Mendanha, 555',
      phone: '(21) 3055-0790',
      hours: 'Seg–Sex: 7h às 19h',
      lat: -22.9012,
      lng: -43.5630
    },
    {
      id: 'fisio-madureira',
      type: 'physio',
      label: 'Fisioterapia',
      name: 'Fisioterapia Madureira',
      neighborhood: 'Madureira',
      zone: 'Zona Norte, RJ',
      address: 'Rua Carolina Machado, 52',
      phone: '(21) 3055-0790',
      hours: 'Seg–Sex: 7h às 19h',
      lat: -22.8790,
      lng: -43.3380
    },
    {
      id: 'fisio-rio-comprido',
      type: 'physio',
      label: 'Fisioterapia',
      name: 'Fisioterapia Rio Comprido',
      neighborhood: 'Rio Comprido',
      zone: 'Centro, RJ',
      address: 'Rua Haddock Lobo, 200',
      phone: '(21) 3055-0790',
      hours: 'Seg–Sex: 7h às 18h',
      lat: -22.9222,
      lng: -43.1995
    },
    /* ── Terapias Especiais ── */
    {
      id: 'integra-bangu',
      type: 'therapy',
      label: 'Terapias Especiais',
      name: 'Integra+ Bangu',
      neighborhood: 'Bangu',
      zone: 'Zona Oeste, RJ',
      address: 'Rua Fonseca, 72',
      phone: '(21) 3055-0790',
      hours: 'Seg–Sex: 8h às 18h',
      lat: -22.8760,
      lng: -43.4610
    },
    {
      id: 'integra-campo-grande',
      type: 'therapy',
      label: 'Terapias Especiais',
      name: 'Integra+ Campo Grande',
      neighborhood: 'Campo Grande',
      zone: 'Zona Oeste, RJ',
      address: 'Estrada do Mendanha, 557',
      phone: '(21) 3055-0790',
      hours: 'Seg–Sex: 8h às 18h',
      lat: -22.9032,
      lng: -43.5655
    }
  ];

  /* -------------------------------------------------------------------------
     INICIALIZAÇÃO
     ------------------------------------------------------------------------- */
  var mapEl      = document.getElementById('kliniMap');
  var listEl     = document.getElementById('mapUnitList');
  var detailEl   = document.getElementById('mapUnitDetail');
  var welcomeEl  = document.getElementById('mapWelcome');
  var hintEl     = document.getElementById('mapHint');

  if (!mapEl || typeof L === 'undefined') return;

  /* Centro do mapa (RJ) */
  var map = L.map('kliniMap', {
    center: [-22.93, -43.38],
    zoom: 10,
    zoomControl: true,
    scrollWheelZoom: false
  });

  function showHint() { if (hintEl) hintEl.style.display = 'flex'; }
  function hideHint() { if (hintEl) hintEl.style.display = 'none'; }

  /* Três estados do painel lateral: welcome | list | detail */
  function showWelcome() {
    if (welcomeEl) welcomeEl.style.display = 'flex';
    listEl.style.display  = 'none';
    detailEl.style.display = 'none';
  }
  function showList() {
    if (welcomeEl) welcomeEl.style.display = 'none';
    listEl.style.display   = 'block';
    detailEl.style.display = 'none';
  }
  function showDetail() {
    if (welcomeEl) welcomeEl.style.display = 'none';
    listEl.style.display   = 'none';
    detailEl.style.display = 'block';
  }

  /* Tiles CartoDB Positron — limpos e sem API key */
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map);

  /* -------------------------------------------------------------------------
     MARCADORES
     ------------------------------------------------------------------------- */
  var markers     = {};   // id → L.marker
  var markerEls   = {};   // id → div element (para animar)
  var activeId    = null;
  var activeFilter = 'all';

  function makeIcon(type, isActive) {
    var el = document.createElement('div');
    el.className = 'klini-marker klini-marker--' + type + (isActive ? ' klini-marker--active' : '');
    return L.divIcon({
      html: el.outerHTML,
      className: '',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -34]
    });
  }

  UNITS.forEach(function (unit) {
    var marker = L.marker([unit.lat, unit.lng], {
      icon: makeIcon(unit.type, false),
      title: unit.name
    }).addTo(map);

    marker.bindPopup(
      '<div class="klini-popup">' +
        '<p class="klini-popup__name">' + unit.name + '</p>' +
        '<p class="klini-popup__loc">' + unit.neighborhood + ' — ' + unit.zone + '</p>' +
      '</div>',
      { closeButton: true, maxWidth: 240 }
    );

    marker.on('click', function () {
      selectUnit(unit.id);
    });

    markers[unit.id] = marker;
  });

  /* -------------------------------------------------------------------------
     LISTA LATERAL
     ------------------------------------------------------------------------- */
  function renderList(filter) {
    listEl.innerHTML = '';
    var filtered = UNITS.filter(function (u) {
      return filter === 'all' || u.type === filter;
    });

    if (filtered.length === 0) {
      listEl.innerHTML = '<p class="sb-map-list__empty">Nenhuma unidade encontrada para este filtro.</p>';
      return;
    }

    filtered.forEach(function (unit) {
      var btn = document.createElement('button');
      btn.className = 'sb-map-list-item' + (unit.id === activeId ? ' sb-map-list-item--active' : '');
      btn.setAttribute('data-id', unit.id);
      btn.setAttribute('role', 'listitem');
      btn.innerHTML =
        '<div class="sb-map-list-item__pin sb-map-list-item__pin--' + unit.type + '">' +
          iconSvg(unit.type) +
        '</div>' +
        '<div class="sb-map-list-item__info">' +
          '<p class="sb-map-list-item__name">' + unit.name + '</p>' +
          '<p class="sb-map-list-item__loc">' + unit.neighborhood + ' — ' + unit.zone + '</p>' +
        '</div>' +
        '<svg class="sb-map-list-item__arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>';

      btn.addEventListener('click', function () {
        selectUnit(unit.id);
      });

      listEl.appendChild(btn);
    });
  }

  /* -------------------------------------------------------------------------
     DETALHE DA UNIDADE
     ------------------------------------------------------------------------- */
  function renderDetail(unit) {
    detailEl.innerHTML =
      '<button class="sb-map-detail__back" id="mapDetailBack">' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>' +
        'Ver todas as unidades' +
      '</button>' +
      '<div class="sb-map-detail__body">' +
        '<div class="sb-map-detail__tag sb-map-detail__tag--' + unit.type + '">' +
          iconSvg(unit.type) + ' ' + unit.label +
        '</div>' +
        '<h3 class="sb-map-detail__name">' + unit.name + '</h3>' +

        '<div class="sb-map-detail__row">' +
          '<svg class="sb-map-detail__row-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>' +
          '<p class="sb-map-detail__row-text"><strong>Endereço</strong>' + unit.address + ' — ' + unit.neighborhood + ', ' + unit.zone + '</p>' +
        '</div>' +

        '<div class="sb-map-detail__row">' +
          '<svg class="sb-map-detail__row-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>' +
          '<p class="sb-map-detail__row-text"><strong>Telefone</strong>' + unit.phone + '</p>' +
        '</div>' +

        '<div class="sb-map-detail__row">' +
          '<svg class="sb-map-detail__row-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' +
          '<p class="sb-map-detail__row-text"><strong>Horário</strong>' + unit.hours + '</p>' +
        '</div>' +

        '<div class="sb-map-detail__actions">' +
          '<a href="https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(unit.name + ' ' + unit.address + ' Rio de Janeiro') + '" target="_blank" rel="noopener" class="btn btn--primary btn--sm">Como chegar</a>' +
          '<a href="https://wa.me/552130550790" target="_blank" rel="noopener" class="btn btn--outline btn--sm">Falar no WhatsApp</a>' +
        '</div>' +
      '</div>';

    document.getElementById('mapDetailBack').addEventListener('click', function () {
      deselectUnit();
    });
  }

  /* -------------------------------------------------------------------------
     SELECIONAR / DESSELECIONAR UNIDADE
     ------------------------------------------------------------------------- */
  function selectUnit(id) {
    /* atualiza marcador anterior */
    if (activeId && markers[activeId]) {
      var prevUnit = UNITS.find(function (u) { return u.id === activeId; });
      markers[activeId].setIcon(makeIcon(prevUnit.type, false));
    }

    activeId = id;
    var unit = UNITS.find(function (u) { return u.id === id; });
    if (!unit) return;

    /* atualiza marcador ativo */
    markers[id].setIcon(makeIcon(unit.type, true));
    map.flyTo([unit.lat, unit.lng], 14, { animate: true, duration: 0.8 });
    markers[id].openPopup();

    /* atualiza lista */
    document.querySelectorAll('.sb-map-list-item').forEach(function (el) {
      el.classList.toggle('sb-map-list-item--active', el.getAttribute('data-id') === id);
    });

    /* mostra detalhe */
    hideHint();
    showDetail();
    renderDetail(unit);

    /* no mobile, scroll suave para o painel */
    if (window.innerWidth < 900) {
      setTimeout(function () {
        detailEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 400);
    }
  }

  function deselectUnit() {
    if (activeId && markers[activeId]) {
      var prevUnit = UNITS.find(function (u) { return u.id === activeId; });
      markers[activeId].setIcon(makeIcon(prevUnit.type, false));
      markers[activeId].closePopup();
    }
    activeId = null;
    showHint();
    if (activeFilter === 'all') {
      showWelcome();
    } else {
      showList();
    }
    renderList(activeFilter);
    map.flyTo([-22.93, -43.38], 10, { animate: true, duration: 0.8 });
  }

  /* -------------------------------------------------------------------------
     FILTROS
     ------------------------------------------------------------------------- */
  document.querySelectorAll('.sb-map-filter').forEach(function (btn) {
    btn.addEventListener('click', function () {
      activeFilter = this.getAttribute('data-filter');

      document.querySelectorAll('.sb-map-filter').forEach(function (b) {
        b.classList.toggle('sb-map-filter--active', b === btn);
      });

      /* reset marcador ativo antes de limpar activeId */
      if (activeId && markers[activeId]) {
        var prevUnit = UNITS.find(function (u) { return u.id === activeId; });
        markers[activeId].setIcon(makeIcon(prevUnit.type, false));
        markers[activeId].closePopup();
      }

      /* esconde/mostra marcadores no mapa */
      UNITS.forEach(function (unit) {
        var show = activeFilter === 'all' || unit.type === activeFilter;
        if (show) {
          if (!map.hasLayer(markers[unit.id])) markers[unit.id].addTo(map);
        } else {
          if (map.hasLayer(markers[unit.id])) map.removeLayer(markers[unit.id]);
        }
      });

      /* voa de volta para o centro quando "Todas" */
      if (activeFilter === 'all') {
        map.flyTo([-22.93, -43.38], 10, { animate: true, duration: 0.8 });
      }

      /* volta para a lista ou welcome */
      activeId = null;
      showHint();
      if (activeFilter === 'all') {
        showWelcome();
      } else {
        showList();
      }
      renderList(activeFilter);
    });
  });

  /* -------------------------------------------------------------------------
     HELPERS
     ------------------------------------------------------------------------- */
  function iconSvg(type) {
    if (type === 'medical') {
      return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 12h-6l-2 7L9 5l-2 7H3"/></svg>';
    }
    if (type === 'physio') {
      return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="5" r="2"/><path d="M12 7v6M9 13l-2 5M15 13l2 5M9 17h6"/></svg>';
    }
    return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';
  }

  /* Render inicial */
  showHint();
  showWelcome();
  renderList('all');

  /* Força invalidação do tamanho do mapa após qualquer animação de fade-in */
  setTimeout(function () { map.invalidateSize(); }, 400);

}());
