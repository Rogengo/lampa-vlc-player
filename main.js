/**
 * VLC Opener для Lampa
 * - Кнопка [VLC] вставляется сразу после [m3u Download]
 * - Внутри кнопки — скрытый <input type="checkbox">.
 *   Браузер сам переключает его при клике, поэтому никакие
 *   Lampa-обработчики (hover:enter и т.п.) не мешают.
 * - Состояние хранится в Lampa.Storage между сессиями.
 */
(function () {
    'use strict';
    if (window.__vlc_opener_plugin__) return;
    window.__vlc_opener_plugin__ = true;

    var STORAGE_KEY = 'vlc_opener_enabled';
    var POLL_INTERVAL = 400;
    var pollTimer = null;

    function log() {
        var a = Array.prototype.slice.call(arguments);
        a.unshift('[VLC Opener]');
        try { console.log.apply(console, a); } catch (e) {}
    }
    function notify(msg) {
        try {
            if (window.Lampa && Lampa.Noty) Lampa.Noty.show(msg);
            else log('NOTY:', msg);
        } catch (e) {}
    }

    // ================== ВИЗУАЛ ==================
    function updateVisual($btn) {
        var on = Lampa.Storage.get(STORAGE_KEY, false);
        var svg;
        if (on) {
            svg = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">' +
                    '<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>' +
                  '</svg>';
            $btn.css('background', 'rgba(120,180,255,.30)');
        } else {
            svg = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">' +
                    '<path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14' +
                          'c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>' +
                  '</svg>';
            $btn.css('background', '');
        }
        $btn.find('.vlc-toggle-icon').html(svg);
    }

    // ================== КНОПКА ==================
    function createToggle() {
        var checked = Lampa.Storage.get(STORAGE_KEY, false) ? 'checked' : '';

        // Нативный чекбокс спрятан, но переключается браузером при клике по <label>.
        // Никакие Lampa-обработчики (hover:enter, keydown и пр.) на него не влияют.
        var $btn = $(
            '<label class="simple-button simple-button--filter selector vlc-toggle" ' +
                    'style="cursor:pointer;position:relative;">' +
                '<input type="checkbox" class="vlc-toggle-input" ' + checked + ' ' +
                       'style="position:absolute;opacity:0;pointer-events:none;width:0;height:0;">' +
                '<span class="vlc-toggle-icon" ' +
                      'style="display:inline-flex;align-items:center;margin-right:.4em;">' +
                '</span>' +
                '<span>VLC</span>' +
            '</label>'
        );

        updateVisual($btn);

        // Слушаем только 'change' — его генерирует сам браузер.
        // Никакие Lampa hover-обработчики сюда не долетают.
        $btn.find('.vlc-toggle-input').on('change', function () {
            var on = this.checked;
            Lampa.Storage.set(STORAGE_KEY, on);
            updateVisual($btn);
            log('VLC:', on ? 'ВКЛ' : 'ВЫКЛ');
            notify('VLC: ' + (on ? 'ВКЛ' : 'ВЫКЛ'));
        });

        return $btn;
    }

    function removeToggle() { $('.vlc-toggle').remove(); }

    function addToggle() {
        if ($('.vlc-toggle').length) return true;
        // Вставляем строго после m3u Download — гарантированно в тот же ряд
        var $m3u = $('.m3u-btn');
        if (!$m3u.length) return false;
        $m3u.after(createToggle());
        log('Кнопка VLC добавлена после m3u-btn');
        return true;
    }

    function startPolling() {
        stopPolling();
        addToggle();
        pollTimer = setInterval(addToggle, POLL_INTERVAL);
    }
    function stopPolling() {
        if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    }

    // ================== ХУК НА PLAYER ==================
    function installHook() {
        if (!window.Lampa || !Lampa.Player || typeof Lampa.Player.play !== 'function') {
            log('Lampa.Player не готов');
            return;
        }
        var originalPlay = Lampa.Player.play;
        Lampa.Player.play = function (stream) {
            var enabled = Lampa.Storage.get(STORAGE_KEY, false);
            if (enabled && stream && stream.url) {
                var vlcUrl = 'vlc://' + stream.url;
                log('→ VLC:', vlcUrl);
                try { window.location.href = vlcUrl; }
                catch (e) { log('Не удалось:', e); }
                return;
            }
            return originalPlay.apply(this, arguments);
        };
        log('Хук установлен. Состояние:',
            Lampa.Storage.get(STORAGE_KEY, false) ? 'ВКЛ' : 'ВЫКЛ');
    }

    // ================== ИНИЦИАЛИЗАЦИЯ ==================
    function onActivity(e) {
        var t = e.type;
        var comp = (e.component || (e.object && e.object.component) || '').toString();
        if (t === 'start') {
            removeToggle();
            if (comp.indexOf('online') === -1) stopPolling();
            else startPolling();
        }
    }

    function init() {
        log('Плагин инициализирован');
        installHook();
        Lampa.Listener.follow('activity', onActivity);
    }

    if (window.appready) init();
    else Lampa.Listener.follow('app', function (e) {
        if (e.type === 'ready') init();
    });
})();
