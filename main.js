    // ================== КНОПКА-ПЕРЕКЛЮЧАТЕЛЬ ==================
    function createToggle() {
        // Убрали класс "selector" — иначе Lampa вешает свои hover-обработчики,
        // которые генерируют событие hover:enter несколько раз за один клик.
        var $btn = $(
            '<div class="simple-button simple-button--filter vlc-toggle" ' +
                 'style="cursor:pointer;">' +
                '<span class="vlc-toggle-icon" ' +
                      'style="display:inline-flex;align-items:center;margin-right:.4em;">' +
                '</span>' +
                '<span>VLC</span>' +
            '</div>'
        );
        updateVisual($btn);

        // Только mouseup — самое надёжное для мыши.
        // click тоже может генерироваться дважды (mousedown + mouseup),
        // hover:enter — вообще генерируется при наведении.
        $btn.on('mouseup', function (e) {
            e.preventDefault();
            e.stopImmediatePropagation();

            var next = !Lampa.Storage.get(STORAGE_KEY, false);
            Lampa.Storage.set(STORAGE_KEY, next);
            updateVisual($btn);
            log('VLC:', next ? 'ВКЛ' : 'ВЫКЛ');
            notify('VLC: ' + (next ? 'ВКЛ' : 'ВЫКЛ'));

            return false;
        });

        // Отключаем все возможные побочные обработчики
        $btn.on('click mousedown hover:enter', function (e) {
            e.stopImmediatePropagation();
            return false;
        });

        return $btn;
    }
