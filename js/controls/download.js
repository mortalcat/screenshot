/**
 * Created by Shaocong on 8/22/2017.
 */
Screenshot.Control.download = Screenshot.Control.extend({
    name: 'download',
    initialize: function() {

        this.$el.append('<button class="board-control board-control-download-button">'+this.name+'</button>');
        this.$el.on('click', '.board-control-download-button', $.proxy(function(e) {
            this.board.downloadImg();
            e.preventDefault();
        }, this));

    }


});