/**
 * VLC Player Plugin для Lampa
 * Добавляет VLC в список внешних плееров и открывает видео через vlc://
 * Версия: 1.0
 */
(function () {
    'use strict';

    // Защита от повторной загрузки
    if (window.__vlc_player_plugin__) return;
    window.__vlc_player_plugin__ = true;

    function log() {
        var args = Array.prototype.slice.call(arguments);
        args.unshift('[VLC Player]');
        try { console.log.apply(console, args); } catch (e) {}
    }

    // ================================================================
    // 1. ДОБАВЛЯЕМ VLC В НАСТРОЙКИ ПЛЕЕРА
    // ================================================================
    function registerVlcSettings() {
        if (!window.Lampa || !Lampa.SettingsApi) return;

        // Регистрируем VLC как опцию в компоненте 'player'
        Lampa.SettingsApi.addParam({
            component: 'player', // Добавляем в раздел "Плеер"
            param: {
                name: 'vlc_player', // Внутренний идентификатор
                type: 'select',     // Тип поля - выпадающий список
                values: {
                    'vlc': 'VLC'
                },
                default: 'vlc'
            },
            field: 'player', // К какой настройке привязать
            onchange: function (value) {
                log('Выбран плеер:', value);
                // Сохраняем выбор пользователя в хранилище Lampa
                Lampa.Storage.set('selected_player', value);
            }
        });

        log('VLC добавлен в настройки плеера');
    }

    // ================================================================
    // 2. ПЕРЕХВАТ ЗАПУСКА ВИДЕО
    // ================================================================
    function hookPlayer() {
        if (!window.Lampa || !Lampa.Player) return;

        var originalPlay = Lampa.Player.play;

        Lampa.Player.play = function (stream) {
            // Читаем настройку, которую установили в registerVlcSettings
            var selectedPlayer = Lampa.Storage.get('selected_player', '');

            // Если пользователь выбрал VLC и есть ссылка на видео
            if (selectedPlayer === 'vlc' && stream && stream.url) {
                var vlcUrl = 'vlc://' + encodeURIComponent(stream.url);
                log('Открываю VLC с URL:', vlcUrl);
                
                // Перенаправляем браузер на URL-схему VLC
                window.location.href = vlcUrl;
                
                // Не вызываем оригинальный плеер
                return;
            }

            // Для всех остальных случаев - стандартное поведение
            return originalPlay.apply(this, arguments);
        };

        log('Перехватчик Lampa.Player.play установлен');
    }

    // ================================================================
    // 3. ИНИЦИАЛИЗАЦИЯ
    // ================================================================
    function init() {
        log('Плагин загружен, инициализация...');
        registerVlcSettings();
        hookPlayer();
    }

    // Ждём полной загрузки Lampa
    if (window.appready) {
        init();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') init();
        });
    }
})();
