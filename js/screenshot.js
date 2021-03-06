/**
 * Created by Shaocong on 8/22/2017.
 */
window.Screenshot = typeof Screenshot !== "undefined" ? Screenshot : {};

Screenshot.board = function (id, opts) {
    this.opts = this.mergeOptions(opts);

    //TODO: check, this should be called only once
    this.id = id;
    //console.log(id)
    this.$el = $(document.getElementById(id));

    if (!this.$el.length) {
        return false;
    }

    var btnTpl = "<div id='control-panel'><button id='board-btn'>Screenshot</button></div>";
    this.$el.addClass('screenshot-board').css({position:"relative"}).append(btnTpl);

    this.dom = {
        $ctrlPnl: this.$el.find("#control-panel"),
        $shotBtn: this.$el.find("#board-btn")
    };

   // this.ctx = this.canvas && this.canvas.getContext && this.canvas.getContext('2d') ? this.canvas.getContext('2d') : null;


    this.mode = null;
    this.ev = new MicroEvent();


    this.bindShotBtn();
    this.initControls();
    this.disableCtrlBtns()
    this.ev.bind('board:shotCreated', $.proxy(this.initDrawing, this));


}

Screenshot.board.defaultOpts = {
    modes: ['pencil', 'text', 'blur'],
    controls: ['draw', 'upload', 'download', "noaCtrlblabla"],
    drawPathColor : "red",
    drawPathR: 8,
    blurR:20,
    textBoxWidth: 300,
    textBoxHeight: 50,
    textFont : '16px serif',
    textLineHeight : 20
};

Screenshot.board.prototype = {

    mergeOptions: function (opts) {
        opts = $.extend({}, Screenshot.board.defaultOpts, opts);
        return opts;
    },
    shotBtnClickHandler: function () {
        var boardP = this;
        //console.log(boardP)
        html2canvas(document.body).then(function (canvas) {//append canvas to board section
            //console.log(boardP);
            boardP.$el.append(canvas);
            boardP.dom.$canvas = $("canvas")[0];
            $("canvas").css({"border": "1px solid red"});
            //boardP.state.shotCreated = true;
            boardP.ev.trigger('board:shotCreated');

            //add two more canvas for intermediate steps for bluring
            //TODO: css this to make it invisible
            boardP.$el.append("<canvas id='blurCanvas' width=300 height=300></canvas>");
            boardP.$el.append("<canvas id='saveCanvas' width=300 height=300></canvas>");

            boardP.dom.$blurCanvas = $("#blurCanvas")[0];
            boardP.dom.$saveCanvas = $("#saveCanvas")[0];
            boardP.width = boardP.dom.$blurCanvas.width = boardP.dom.$saveCanvas.width  = boardP.dom.$canvas.width;
            boardP.height = boardP.dom.$blurCanvas.height =boardP.dom.$saveCanvas.height= boardP.dom.$canvas.height;
            boardP.ctx  = boardP.dom.$canvas.getContext("2d");
            boardP.blurctx  = boardP.dom.$blurCanvas.getContext("2d");
            boardP.savectx  = boardP.dom.$saveCanvas.getContext("2d");
            boardP.savectx.drawImage(boardP.dom.$canvas,0,0);
        })
    },


    bindShotBtn: function () {
        this.dom.$shotBtn.click($.proxy(this.shotBtnClickHandler, this));
    },


    setMode: function (newMode) {
        this.mode = newMode;
        this.ev.trigger('board:mode', this.mode);

    },

    getMode: function () {
        return this.mode;
    },


    initControls: function () {
        this.controls = [];
        if (!this.opts.controls.length || !Screenshot.Control) return false;
        for (var i = 0; i < this.opts.controls.length; i++) {
            var c = null;
            if (typeof this.opts.controls[i] == "string")
                c = window['Screenshot']['Control'][this.opts.controls[i]] ? new window['Screenshot']['Control'][this.opts.controls[i]](this) : null;
            else if (typeof this.opts.controls[i] == "object") {
                for (var controlName in this.opts.controls[i]) break;
                c = new window['Screenshot']['Control'][controlName](this, this.opts.controls[i][controlName]);
            }
            if (c) {
                this.addControl(c);
            }
        }
    },

    addControl: function (control) {
        this.dom.$ctrlPnl.append(control.$el);

        if (!this.controls)
            this.controls = [];
        this.controls.push(control);
        this.dom.$ctrlPnl.removeClass('drawing-board-controls-hidden');
    },

    initDrawing: function () {
        this.enableCtrlBtns();
        this.downflag = false,
        this.prevX = 0,
        this.currX = 0,
        this.prevY = 0,
        this.currY = 0,
        //this.dot_flag = false;
        this.dom.$canvas.addEventListener("mousemove", $.proxy(function (e) {
            this.drawHandler('move', e)
        }, this), false);
        this.dom.$canvas.addEventListener("mousedown", $.proxy(function (e) {
            this.drawHandler('down', e)
        }, this), false);
        this.dom.$canvas.addEventListener("mouseup", $.proxy(function (e) {
            this.drawHandler('up', e)
        }, this), false);
        this.dom.$canvas.addEventListener("mouseout", $.proxy(function (e) {
            this.drawHandler('out', e)
        }, this), false);
    },
    enableCtrlBtns : function () {
        this.dom.$ctrlPnl.find(".board-control").each(function () {
                $( this ).prop('disabled', false);
            });
    },
    disableCtrlBtns: function () {
        this.dom.$ctrlPnl.find(".board-control").each(function () {
            $( this ).prop('disabled', true);
        });
    },

    drawText : function (boxLeft, boxTop, content) {
        if(!content || content ===""){
            console.log("no content. no draw");
            return;
        }
        this.ctx.font = this.opts.textFont;
        //caculate and draw each line
        var y = boxTop + this.opts.textBoxHeight / 2 + this.opts.textLineHeight/2;
        this.wrapText(this.ctx, content, boxLeft, y, this.opts.textBoxWidth, this.opts.textLineHeight);

    },
    wrapText : function(context, text, x, y, maxWidth, lineHeight) {
        var words = text.split(' ');
        var line = '';
        for(var n = 0; n < words.length; n++) {
            var testLine = line + words[n] + ' ';
            var metrics = context.measureText(testLine);
            var testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
                context.fillText(line, x, y);
                line = words[n] + ' ';
                y += lineHeight;
            }
            else {
                line = testLine;
            }
        }
        context.fillText(line, x, y);
    },
    drawHandler: function (res, e) {
        e.preventDefault();
        e.stopPropagation();
        var mode =this.getMode();
        switch (res) {
            case "down":

                this.updateXY(e);
                //update flag
                this.downflag = true;
                //clear tempCanvas
                if(mode === "blur") {
                    this.blurctx.clearRect(0, 0, this.width, this.height);
                    this.savectx.drawImage(this.dom.$canvas, 0, 0);
                }

                break;
            case "up":
               this.downflag = false;
               console.log("up")

               switch(mode){
                   case "blur":
                       //update graph only when blur mode
                       this.blurctx.save();
                       this.blurctx.globalCompositeOperation = "source-in";
                       this.blurctx.drawImage(this.dom.$saveCanvas, 0, 0);//TODO: here, change img to updated one
                       this.blurctx.restore();
                       boxBlurCanvasRGBA("blurCanvas", 0, 0, this.width, this.height, 4, 0);
                       this.savectx.drawImage(this.dom.$blurCanvas, 0, 0);
                       this.ctx.clearRect(0, 0, this.width, this.height);
                       this.ctx.drawImage(this.dom.$saveCanvas, 0, 0);

                       break;

                   case "text":
                       //TODO: check position not exceed canvas
                       //append a textBox
                       var  textBoxTpl = "<div class='textBox'><p class='text'></p></div>";
                       this.$el.append(textBoxTpl);
                       var domText  =  this.$el.find(".textBox");
                       domText.attr("contenteditable", "true").height(this.opts.textBoxHeight)
                           .width(this.opts.textBoxWidth)
                           .css({position:"absolute",left: this.getXYreBoard(e).x, top: this.getXYreBoard(e).y, "border-style": "solid" });
                       domText.focus();
                       var boxLeft  = this.getXYreCanvas(e).x;
                       var boxTop  = this.getXYreCanvas(e).y;

                       var boardP = this;
                       domText.bind('blur', function () {
                          this.remove();
                           boardP.drawText(boxLeft, boxTop, $(this).text());
                       }).bind('click', function (e) {
                           e.stopPropagation();
                       })
                          // .bind('input', function () {});

               }
                break;
            case "out":
                console.log("out")
                this.downflag = false;

                break;
            case "move":
                if(this.downflag ){
                    this.updateXY(e);
                    if(mode === "pencil"){
                        console.log("Draw")

                        this.drawPath(this.ctx, this.opts.drawPathColor, this.opts.drawPathR);
                    }else
                    if(mode === "blur"){
                        this.drawPath(this.ctx, this.opts.drawPathColor, this.opts.blurR);
                        this.drawPath(this.blurctx, this.opts.drawPathColor, this.opts.blurR);

                    }
                }

                break;
        }
    },


    updateXY : function (e) {
        //record mouse pos
        var viewportOffset = this.dom.$canvas.getBoundingClientRect();
        this.prevX = this.currX;
        this.prevY = this.currY;
        this.currX = e.clientX - viewportOffset.left;
        this.currY = e.clientY - viewportOffset.top;
    },

    getXYreBoard : function (e) {
        //console.log(this.$el);
        var viewportOffset = this.$el[0].getBoundingClientRect();
        var currX = e.clientX - viewportOffset.left;
        var currY = e.clientY - viewportOffset.top;
        return{x: currX, y: currY};
    },
    getXYreCanvas : function (coord) {
       // console.log(this.$el);
        var viewportOffset = this.dom.$canvas.getBoundingClientRect();
        var currX = coord.x - viewportOffset.left;
        var currY = coord.y  - viewportOffset.top;
        return{x: currX, y: currY};
    },

    drawPath: function(ctx, color, r) {
   ctx.beginPath();
       ctx.moveTo( this.prevX,  this.prevY);
       ctx.lineTo(this.currX, this.currY);
        ctx.strokeStyle = color;
       ctx.lineWidth = r;
        ctx.stroke();
        ctx.closePath();
},
    downloadImg: function() {
        var img = this.getImg();
        img = img.replace("image/png", "image/octet-stream");
        window.location.href = img;
    },	getImg: function() {
        console.log(this.dom.$canvas)
        return this.dom.$canvas.toDataURL("image/png");
    }

};
