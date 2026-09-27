    // ================== КНОПКА-ПЕРЕКЛЮЧАТЕЛЬ ==================
    function createToggle() {
        // Класс selector обязателен для отображения, но из-за него Lampa
        // шлёт hover:enter многократно. Ловим только mousedown — один раз на нажатие.
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

        var lastToggle = 0;

        // mousedown срабатывает ровно один раз при нажатии кнопки мыши —
        // в отличие от hover:enter (который Lampa дёргает при наведении)
        // и click (который может приходить дважды).
        $btn.on('mousedown', function (e) {
            e.preventDefault();
            e.stopImmediatePropagation();

            var now = Date.now();
            if (now - lastToggle < 400) return false;
            lastToggle = now;

            var next = !Lampa.Storage.get(STORAGE_KEY, false);
            Lampa.Storage.set(STORAGE_KEY, next);
            updateVisual($btn);
            log('VLC:', next ? 'ВКЛ' : 'ВЫКЛ');
            notify('VLC: ' + (next ? 'ВКЛ' : 'ВЫКЛ'));

            return false;
        });

        // Глушим всё остальное, что Lampa может пытаться вызвать
        $btn.on('click hover:enter mouseup', function (e) {
            e.stopImmediatePropagation();
            return false;
        });

        return $btn;
    }
