    // ================== КНОПКА-ПЕРЕКЛЮЧАТЕЛЬ ==================
    function createToggle() {
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

        var busy = false;

        // Только hover:enter — это штатное событие Lampa для клика/Enter.
        // click НЕ вешаем, иначе toggle срабатывает дважды за одно нажатие.
        $btn.on('hover:enter', function (e) {
            e.preventDefault();
            e.stopPropagation();
            if (busy) return;
            busy = true;
            setTimeout(function(){ busy = false; }, 300);

            var next = !Lampa.Storage.get(STORAGE_KEY, false);
            Lampa.Storage.set(STORAGE_KEY, next);
            updateVisual($btn);
            log('VLC:', next ? 'ВКЛ' : 'ВЫКЛ');
            notify('VLC: ' + (next ? 'ВКЛ' : 'ВЫКЛ'));
        });

        return $btn;
    }
