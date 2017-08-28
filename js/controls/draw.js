/**
 * Created by Shaocong on 8/22/2017.
 */
Screenshot.Control.draw = Screenshot.Control.extend({

    name: 'draw',

    initialize: function() {
        this.prevMode = this.board.getMode();
        console.log("init draw btn")

        $.each(["pencil", "text", "blur"], $.proxy(function(k, value) {
                this.$el.append('<button class="drawing-board-control-drawingmode-' + value + '-button" data-mode="' + value + '">'+value+'</button>');

        }, this));
        this.$el.on('click', 'button[data-mode]', $.proxy(function(e) {
            //init drawing control
            //set state
            var value = $(e.currentTarget).attr('data-mode');//clicked button
            var mode = this.board.getMode();
            if (mode !== value) {
                this.prevMode = mode;
                this.board.setMode(value);
            }
            e.preventDefault();

        }, this));

        this.board.ev.bind('board:mode', $.proxy(function(mode) {
            this.toggleButtons(mode);
        }, this));

        this.toggleButtons( this.board.getMode() );
    },
    toggleButtons: function(mode) {
        this.$el.find('button[data-mode]').each(function(k, item) {
            var $item = $(item);
            $item.toggleClass('active', mode === $item.attr('data-mode'));
        });
    }
});