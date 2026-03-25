<?php
/**
 * Klini Saúde — Shortcode de Mapa Interativo de Unidades
 * ========================================================
 * Arquivo de referência para integração WordPress / Elementor.
 *
 * COMO USAR NO ELEMENTOR:
 * ─────────────────────────
 * 1. Cole o código abaixo em functions.php do seu tema (ou em um plugin custom).
 * 2. No Elementor, adicione um widget "Shortcode" e insira: [klini_unidades_map]
 * 3. Certifique-se de que Leaflet está sendo carregado (ver wp_enqueue_scripts abaixo).
 *
 * ALTERNATIVA SEM SHORTCODE:
 * ─────────────────────────
 * No Elementor, use o widget "HTML Personalizado" e cole diretamente o HTML
 * do arquivo sobre.html (section#unidades) + os scripts Leaflet no rodapé da página.
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. Enqueue Leaflet e o script do mapa
// ─────────────────────────────────────────────────────────────────────────────
add_action( 'wp_enqueue_scripts', 'klini_enqueue_map_assets' );

function klini_enqueue_map_assets() {
    // Só carrega nas páginas que usam o shortcode (ou sempre, se preferir)
    if ( ! is_page( 'sobre-nos' ) ) return;

    wp_enqueue_style(
        'leaflet',
        'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
        [],
        '1.9.4'
    );

    wp_enqueue_script(
        'leaflet',
        'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
        [],
        '1.9.4',
        true // no footer
    );

    wp_enqueue_script(
        'klini-map',
        get_template_directory_uri() . '/assets/js/klini-map.js',
        [ 'leaflet' ],
        '1.0.0',
        true
    );

    // O CSS do mapa pode estar no seu style.css do tema,
    // ou enqueued separadamente:
    // wp_enqueue_style('klini-map', get_template_directory_uri() . '/assets/css/klini-map.css');
}


// ─────────────────────────────────────────────────────────────────────────────
// 2. Registrar o shortcode [klini_unidades_map]
// ─────────────────────────────────────────────────────────────────────────────
add_shortcode( 'klini_unidades_map', 'klini_render_unidades_map' );

function klini_render_unidades_map( $atts ) {
    ob_start();
    ?>
    <div class="sb-units sb-units--map" id="unidades">

      <div class="sb-map-filters" role="group" aria-label="Filtrar unidades por tipo">
        <button class="sb-map-filter sb-map-filter--active" data-filter="all">Todas</button>
        <button class="sb-map-filter" data-filter="medical">
          <span class="sb-map-filter__dot sb-map-filter__dot--medical"></span>
          Centros Médicos
        </button>
        <button class="sb-map-filter" data-filter="physio">
          <span class="sb-map-filter__dot sb-map-filter__dot--physio"></span>
          Fisioterapia
        </button>
        <button class="sb-map-filter" data-filter="therapy">
          <span class="sb-map-filter__dot sb-map-filter__dot--therapy"></span>
          Terapias Especiais
        </button>
      </div>

      <div class="sb-map-layout">
        <div class="sb-map-layout__map" id="kliniMap"
             role="application"
             aria-label="Mapa interativo de unidades Klini"></div>
        <aside class="sb-map-layout__panel" aria-label="Informações da unidade">
          <div class="sb-map-list" id="mapUnitList" role="list"></div>
          <div class="sb-map-detail" id="mapUnitDetail" aria-live="polite" hidden></div>
        </aside>
      </div>

    </div>
    <?php
    return ob_get_clean();
}
