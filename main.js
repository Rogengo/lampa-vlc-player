/**
 * VLC Opener для Lampa
 * - Кнопка [VLC] в ряду .torrent-filter
 * - Клик перехватывается на уровне document в capture-фазе —
 *   Lampa не успевает навесить свои hover-обработчики.
 * - Состояние хранится в Lampa.Storage между сессиями.
 */
(function () {
    'use strict';
    if (window.__vlc_opener_plugin__) return;
    window.__vlc_opener_plugin__ = true;

    var STORAGE_KEY = 'vlc_opener_enabled';
    var POLL_INTERVAL = 400;
    var pollTimer = null;
    var lastToggleTime = 0;

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
        // selector нужен ТОЛЬКО для CSS-отображения. Все события
        // перехватываются на document, поэтому Lampa-обработчики не помешают.
        var $btn = $(
            '<div class="simple-button simple-button--filter selector vlc-toggle" ' +
                 'style="cursor:pointer;">' +
                '<span class="vlc-toggle-icon" ' +
                      'style="display:inline-flex;align-items:center;margin-right:.4em;">' +
                '</span>' +
                '<span>VLC</span>' +
            '</div>'
        );
        updateVisual($btn);
        return $btn;
    }

    function removeToggle() { $('.vlc-toggle').remove(); }

    function addToggle() {
        var $c = $('.torrent-filter');
        if (!$c.length) return false;
        if ($c.find('.vlc-toggle').length) return true;
        $c.append(createToggle());
        log('Кнопка VLC добавлена');
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

    // ================== ГЛОБАЛЬНЫЙ ПЕРЕХВАТ КЛИКА ==================
    // Слушаем pointerdown в capture-фазе на document.
    // Это срабатывает РАНЬШЕ, чем любые обработчики на самой кнопке,
    // включая все hover:enter от HoverSwitcher в Lampa.
    function installClickInterceptor() {
        document.addEventListener('pointerdown', function (e) {
            var t = e.target;
            if (!t || !t.closest) return;
            var toggle = t.closest('.vlc-toggle');
            if (!toggle) return;

            // Это клик по нашей кнопке — перехватываем ДО Lampa
            e.preventDefault();
            e.stopImmediatePropagation();
            e.stopPropagation();

            var now = Date.now();
            if (now - lastToggleTime < 500) {
                log('Повтор отсечён');
                return;
            }
            lastToggleTime = now;

            var next = !Lampa.Storage.get(STORAGE_KEY, false);
            Lampa.Storage.set(STORAGE_KEY, next);

            // Обновить визуал всех toggle на странице
            $('.vlc-toggle').each(function () { updateVisual($(this)); });

            log('VLC:', next ? 'ВКЛ' : 'ВЫКЛ');
            notify('VLC: ' + (next ? 'ВКЛ' : 'ВЫКЛ'));
        }, true); // ← capture phase

        // Дополнительно глушим click/mouseup на кнопке, если pointerdown
        // по какой-то причине не сработал (старые браузеры)
        document.addEventListener('mousedown', function (e) {
            var t = e.target;
            if (!t || !t.closest) return;
            if (!t.closest('.vlc-toggle')) return;
            e.stopImmediatePropagation();
        }, true);

        document.addEventListener('click', function (e) {
            var t = e.target;
            if (!t || !t.closest) return;
            if (!t.closest('.vlc-toggle')) return;
            e.stopImmediatePropagation();
            e.preventDefault();
        }, true);

        log('Глобальный перехватчик клика установлен');
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
        installClickInterceptor();
        installHook();
        Lampa.Listener.follow('activity', onActivity);
    }

    if (window.appready) init();
    else Lampa.Listener.follow('app', function (e) {
        if (e.type === 'ready') init();
    });
})();
