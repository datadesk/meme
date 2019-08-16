/*
* MemeCanvasView
* Manages the creation, rendering, and download of the Meme image.
*/
MEME.MemeCanvasView = Backbone.View.extend({
  changelog: undefined,

  initialize: function() {
    var canvas = document.createElement('canvas');
    var $container = MEME.$('#meme-canvas');

    // Display canvas, if enabled:
    if (canvas && canvas.getContext) {
      $container.html(canvas);
      this.canvas = canvas;
      this.setDownload();
      this.render();
    } else {
      $container.html(this.$('noscript').html());
    }

    // Listen to model for changes, and re-render in response:
    this.listenTo(this.model, 'change', this.render );
  },

  setDownload: function() {
    var a = document.createElement('a');
    if (typeof a.download == 'undefined') {
      this.$el.append('<p class="m-canvas__download-note">Right-click button and select "Download Linked File..." to save image.</p>');
    }
  },

  render: function() {
    // Return early if there is no valid canvas to render:
    if (!this.canvas) return;

    if (JSON.stringify(this.changelog) === JSON.stringify(this.model.changedAttributes())) {
      //_.debounce(this.render, 1000);
      return;
    } else {
      this.changelog = this.model.changedAttributes();
    }

    // Collect model data:
    var m = this.model;
    var d = this.model.toJSON();
    var ctx = this.canvas.getContext('2d');
    var thumbBuffer = 30;
    var padding = Math.round(d.width * d.paddingRatio + thumbBuffer);

    // Reset canvas display:
    switch(d.aspectRatio){
      case 'twitter':
        d.width = 1024;
        d.height = 512;
        break;
      case 'facebook':
        d.width = 1200;
        d.height = 630;
        break;
      case 'instagram':
        d.width = 1080;
        d.height = 1080;
        break;
      case 'pinterest':
        d.width = 736;
        d.height = 1128;
      default:
        break;
    }

    this.canvas.width = d.width;
    this.canvas.height = d.height;
    ctx.clearRect(0, 0, d.width, d.height);

    function renderBackground(ctx) {
      // Base height and width:
      var bh = m.background.height;
      var bw = m.background.width;

      if (bh && bw) {
        // Transformed height and width:
        // Set the base position if null
        var th = bh * d.imageScale;
        var tw = bw * d.imageScale;
        var cx = d.backgroundPosition.x || d.width / 2;
        var cy = d.backgroundPosition.y || d.height / 2;

        ctx.drawImage(m.background, 0, 0, bw, bh, cx-(tw/2), cy-(th/2), tw, th);
      }
    }

    function renderBackgroundColor(ctx) {
      if (d.backgroundColor){
          ctx.fillStyle = d.backgroundColor;
          ctx.fillRect(0, 0, d.width, d.height);
        }
    }

    function renderOverlay(ctx) {
      if (d.overlayColor) {
        ctx.save();
        ctx.globalAlpha = d.overlayAlpha;
        ctx.fillStyle = d.overlayColor;
        ctx.fillRect(0, 0, d.width, d.height);
        ctx.globalAlpha = 1;
        ctx.restore();
      }
    }

    function renderHeadline(ctx) {
      var maxWidth = Math.round(d.width * 0.75);
      var x = padding;
      var y = padding;

      // don't want to do things this way but since we're using artificial italics we have no other choice
      if (d.fontFamily == 'DINNextLTPro-BoldCondensed' || d.fontFamily == 'Harriet display'){
        d.fontStyle = 'bold italic';
      } else if (d.fontFamily == 'Gotham SSm A, Gotham SSm B'){
        d.fontStyle = '';
      }
      d.fontFamily = 'Benton Gothic Regular';

      ctx.font = (d.fontStyle ? d.fontStyle+' ' : '')+ d.fontSize + 'pt ' + d.fontFamily;
      ctx.fillStyle = d.fontColor;
      ctx.textBaseline = 'top';

      // Text shadow:
      if (d.textShadow) {
        ctx.shadowColor = "#666";
        ctx.shadowOffsetX = -2;
        ctx.shadowOffsetY = 1;
        ctx.shadowBlur = 10;
      }

      var partialText = 0;
      if (d.alternateLayout == 'left-right'){
        partialText = (d.width / 2) - (padding * 2);
      }

      // Text alignment:
      if (d.textAlign == 'center') {
        ctx.textAlign = 'center';
        x = d.width / 2;
        maxWidth = d.width - d.width / 3;

      } else if (d.textAlign == 'right' ) {
        ctx.textAlign = 'right';
        x = d.width - padding;
        maxWidth -= partialText;

      } else {
        ctx.textAlign = 'left';
        maxWidth -= partialText;
      }

      var paddingScale = parseInt(d.paddingScale);

      ctx.textBaseline = 'Align bottom';

      var curLine = d.headlineText,
          curLineSplit,
          matches = curLine.match(/\*[^\*_]+\*|_[^\*_]+_|\*_[^\*_]+_\*|_\*[^\*_]+\*_/g),
          sorted = [],
          sortedDict = {};

      if(matches){
        _.each(matches, function(d){
          var d3 = d;
          if(d.match(/\*_[^\*_]+_\*|_\*[^\*_]+\*_/g)){
            d3 = d3.replace('_*', '%');
            d3 = d3.replace('*_', '%');
            d3 = d3.split(' ').join('% %');
            sorted.unshift(d);
          } else {
            if(d.match(/\*[^\*_]+\*/g)){
              d3 = d.split(' ').join('* *');
            } else {
              d3 = d.split(' ').join('_ _');
            }
            sorted.push(d);
          }
          var d2 = '⦁'+d3+'⦁';
          sortedDict[d] = d2;
        })

        _.each(sorted, function(d){
          curLine = curLine.replace(d, sortedDict[d]);
        })

        curLineSplit = curLine.split(/\s/);
      }

      var words = d.headlineText.split(' ');

      var line  = '';

      var noSp = '',
          hairSp = ' ',
          thinSp = ' ',
          midSp = ' ',
          lgSp = ' ';

      var letterSpacingArr = [noSp,hairSp,thinSp,midSp,lgSp];
      var tempWords = [];


      for (var j = 0; j < words.length; j++){
        for (var i = 0; i < words[j].length; i++){
          tempWords.push(words[j][i]);
          tempWords.push(letterSpacingArr[d.letterSpacing]);
        }
        tempWords.push('&nbsp;');
      }

      var newWord = '',
          newWordArray = [],
          spaceArray = [];
      for (var k = 0; k < tempWords.length; k++){
        if (tempWords[k] == '&nbsp;'){
          newWordArray.push(newWord);
          newWordArray.push('&nbsp;');
          newWord = '';
        } else {
          newWord += tempWords[k];
        }
      }

      words = newWordArray;
      if(typeof curLineSplit !== 'undefined'){
        words = curLineSplit;

        for (var n = 0; n < words.length; n++) {
            spaceArray.push(' ');
        }

        words = _.flatten(_.zip(words, spaceArray));

        words = _.flatten(_.map(words, function(d){
          return d.split(/⦁/);
        }));

      }

      function renderCustomText() {
        ctx.font = currentStyle + ' ' + d.fontSize + 'pt ' + d.fontFamily;
        ctx.fillText(currentWord, currentWidth+padding, y);
        currentWidth += ctx.measureText(currentWord).width;
      }

      if (d.textAlign == 'left') {
        var currentWidth = 0;
        var currentWord = '';
        var styles = ['bold','italic','bold italic'];
        var styleCodes = ['*','_','*_'];
        var styleCodeLength = ['1','1','2'];
        var currentStyle = '';
        var rendered = false;
        const fontSizeRatio = d.fontSize * 1.5;


        y = d.height - 125

        if ( d.numberOfLines > 0 ) {
          y -= d.fontSize * d.numberOfLines;
        }


        for (var n = 0; n < words.length; n++) {


          rendered = false;
          if (d.headUppercase){
            currentWord = currentWord.toUpperCase();
          }
          currentWord = words[n];
          if (currentWord == '&nbsp;') {
            currentWord = ' ';
          }
          if (currentWidth >= maxWidth) {
            currentWidth = 0;
            y += Math.round(fontSizeRatio);
          } else if (currentWord.toLowerCase() == '\\n') {
            currentWidth = 0;
            y += Math.round(fontSizeRatio);
            n++;
          } else if (currentWidth <= ctx.measureText(' ').width && currentWord == ' ') {
            n++;
          } else {
            /*
            for (var s = 0; s < styles.length; s++){
              if (currentWord.substring(0,styleCodeLength[s]) == styleCodes[s] && currentWord[currentWord.length-styleCodeLength[s]] == styleCodes[s]){
                currentStyle = styles[s];
                currentWord = currentWord.substring(styleCodeLength[s],currentWord.length-styleCodeLength[s]);
                renderCustomText();
                currentStyle = '';
                rendered = true;
              } else if (currentWord.substring(0,styleCodeLength[s]) == styleCodes[s]){
                currentStyle = styles[s];
                currentWord = currentWord.substring(styleCodeLength[s],currentWord.length-styleCodeLength[s]);
                renderCustomText();
                rendered = true;
              } else if (currentStyle == styles[s] && currentWord[currentWord.length-styleCodeLength[s]] == styleCodes[s]){
                currentStyle = styles[s];
                currentWord = currentWord.substring(styleCodeLength[s],currentWord.length-styleCodeLength[s]);
                renderCustomText();
                currentStyle = '';
                rendered = true;
              }
            }
            if (!rendered){
              renderCustomText();
            }
            */
            if (currentWord[0] == '%' && currentWord[currentWord.length-1] == '%') {
              ctx.font = 'bold italic '+ d.fontSize + 'pt ' + d.fontFamily;
              ctx.fillText(currentWord.substring(1,currentWord.length-1), currentWidth+padding, y);
              currentWidth += ctx.measureText(currentWord.substring(1,currentWord.length-1)).width;
            }
            else if (currentWord[0] == '*' && currentWord[currentWord.length-1] == '*') {
              ctx.font = 'bold '+ d.fontSize + 'pt ' + d.fontFamily;
              ctx.fillText(currentWord.substring(1,currentWord.length-1), currentWidth+padding, y);
              currentWidth += ctx.measureText(currentWord.substring(1,currentWord.length-1)).width;
            } else if (currentWord[0] == '_' && currentWord[currentWord.length-1] == '_') {
              ctx.font = 'italic '+ d.fontSize + 'pt ' + d.fontFamily;
              ctx.fillText(currentWord.substring(1,currentWord.length-1), currentWidth+padding, y);
              currentWidth += ctx.measureText(currentWord.substring(1,currentWord.length-1)).width;
            } else if (currentStyle == 'bold' || currentStyle == 'italic'){
              ctx.font = currentStyle + ' '+ d.fontSize + 'pt ' + d.fontFamily;
              ctx.fillText(currentWord.substring(1,currentWord.length-1), currentWidth+padding, y);
              currentWidth += ctx.measureText(currentWord.substring(1,currentWord.length-1)).width;
            } else {
              ctx.font = (d.fontStyle ? d.fontStyle+' ' : '') + d.fontSize + 'pt ' + d.fontFamily;
              ctx.fillText(currentWord, currentWidth+padding, y);
              currentWidth += ctx.measureText(currentWord).width;
            }
          }
        }
      } else {
        var line  = '';

        for (var n = 0; n < words.length; n++) {
          if (words[n] != '&nbsp;') {
            var testLine  = line + words[n];
            var metrics   = ctx.measureText( testLine );
            var testWidth = metrics.width;

            if (testWidth > maxWidth && n > 0) {
              ctx.fillText(line, x, y);
              line = words[n] + ' ';
              y += Math.round(d.fontSize * 1.5);
            }
            else {
              line = testLine + ' ';
            }
          }
        }

        // Text transform:
        if (d.headUppercase){
          line = line.toUpperCase();
        }

        ctx.fillText(line, x, y);
      }
      ctx.shadowColor = 'transparent';
    }

    function renderPartialBackground(ctx) {
      // to-do: handle re-drawing of background over image
      if (d.alternateLayout == 'left-right'){
        ctx.fillStyle = d.backgroundColor;
        ctx.fillRect(0, 0, Math.round(d.width * 0.5), d.height);
      }
    }

    function renderCredit(ctx) {
			if ( d.creditFont ) {
				d.fontFamily = d.creditFont;
			}
      ctx.textBaseline = 'bottom';
      ctx.textAlign = 'left';
      ctx.fillStyle = d.fontColor;
      ctx.font = 'normal '+ d.creditSize +'pt '+ d.fontFamily;
      if (d.sourceUppercase){
          d.creditText = d.creditText.toUpperCase();
      }
      ctx.fillText(d.creditText, padding, d.height - padding);
    }

    function renderWatermark(ctx) {

      if (d.watermarkColor != 'default'){
        if (d.watermarkColor == 'light'){
          m.watermark.src = d.watermarkSrc;
        } else {
          m.watermark.src = d.watermarkDark;
        }
      }

      // Base & transformed height and width:
      var bw, bh, tw, th;
      bh = th = m.watermark.height;
      bw = tw = m.watermark.width;

      if (bh && bw) {
        // Calculate watermark maximum width:
        var mw = d.width * d.watermarkMaxWidthRatio;

        // Constrain transformed height based on maximum allowed width:
        if (mw < bw) {
          th = bh * (mw / bw);
          tw = mw;
        }

        ctx.globalAlpha = d.watermarkAlpha;
        ctx.drawImage(m.watermark, 0, 0, bw, bh, d.width-padding-tw, padding, tw, th);
        ctx.globalAlpha = 1;
      }
    }

    function renderBreakingNews (ctx) {
      // Create red background banner
      ctx.fillStyle = '#e02227';
      ctx.fillRect(0, 0, d.width, 50)
      // Add breaking news text
      ctx.textBaseline = 'center';
      ctx.textAlign = 'left';
      ctx.fillStyle = 'white';
      ctx.font = '600 14pt Open Sans';
      ctx.fillText('BREAKING NEWS', padding, 35);
    }

    renderBackgroundColor(ctx);
    if (d.alternateLayout != 'no-image'){
      renderBackground(ctx);
    }
    renderOverlay(ctx);
    renderPartialBackground(ctx);
    renderHeadline(ctx);
    renderWatermark(ctx);
    renderCredit(ctx);
    if (d.breakingNews) {
      renderBreakingNews(ctx)
    }

    var data = this.canvas.toDataURL(); //.replace('image/png', 'image/octet-stream');
    this.$('#meme-download').attr({
      'href': data,
      'download': (d.downloadName || 'share') + '.png'
    });

    // Enable drag cursor while canvas has artwork:
    this.canvas.style.cursor = this.model.background.width ? 'move' : 'default';
  },

  events: {
    'mousedown canvas': 'onDrag'
  },

  // Performs drag-and-drop on the background image placement:
  onDrag: function(evt) {
    evt.preventDefault();

    // Return early if there is no background image:
    if (!this.model.hasBackground()) return;

    // Configure drag settings:
    var model = this.model;
    var d = model.toJSON();
    var iw = model.background.width * d.imageScale / 2;
    var ih = model.background.height * d.imageScale / 2;
    var origin = {x: evt.clientX, y: evt.clientY};
    var start = d.backgroundPosition;
    start.x = start.x || d.width / 2;
    start.y = start.y || d.height / 2;

    // Create update function with draggable constraints:
    function update(evt) {
      evt.preventDefault();
      model.set('backgroundPosition', {
        x: Math.max(d.width-iw, Math.min(start.x - (origin.x - evt.clientX), iw)),
        y: Math.max(d.height-ih, Math.min(start.y - (origin.y - evt.clientY), ih))
      });
    }

    // Perform drag sequence:
    var $doc = MEME.$(document)
      .on('mousemove.drag', update)
      .on('mouseup.drag', function(evt) {
        $doc.off('mouseup.drag mousemove.drag');
        update(evt);
      });
  }
});
