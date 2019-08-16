/*
* MemeEditorView
* Manages form capture, model updates, and selection state of the editor form.
*/
MEME.MemeEditorView = Backbone.View.extend({

  initialize: function() {
    this.buildForms();
    this.listenTo(this.model, 'change', this.render);
    this.render();

    $('.tab').click( function(){
      $('.' + $(this).attr('data-pane')).css('display', 'block');
      $(this).css('border-bottom', '2px solid rgba(76, 78, 77, .2)');
      $(this).siblings().css('border-bottom', '2px solid rgba(76, 78, 77, .025)');
      $('.' + $(this).siblings().attr('data-pane')).css('display', 'none');
    });
  },

  contrastCheck: function(){
    var overlayRGB = hexToRgb(this.model.get('overlayColor')),
        fontRGB = hexToRgb(this.model.get('fontColor')),
        fontOverlayRGB = colorContrast(fontRGB,overlayRGB);
    if (this.model.get('backgroundColor')){
      var backgroundRGB = hexToRgb(this.model.get('backgroundColor')),
          fontBackgroundRGB = colorContrast(fontRGB,backgroundRGB);
      var backgroundPresent = true;
    }

    if ((this.model.get('overlayColor') && fontOverlayRGB < 250) || (backgroundPresent && fontBackgroundRGB < 250)) {
      alert('You\'ve selected a color combination with low contrast. For accessibility purposes, consider making a new selection');
    }

    function colorContrast(rgb1,rgb2) {
      if (rgb2){
        return (Math.max(rgb1.r,rgb2.r) - Math.min(rgb1.r,rgb2.r)) +
             (Math.max(rgb1.g,rgb2.g) - Math.min(rgb1.g,rgb2.g)) +
             (Math.max(rgb1.b,rgb2.b) - Math.min(rgb1.b,rgb2.b));
      } else {
        return 255;
      }
    }

    function hexToRgb(hex) {
      hex.length <= 4 ? hex = hex[0]+hex[1]+hex[1]+hex[2]+hex[2]+hex[3]+hex[3] : hex;
      var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    }
  },

  // Builds all form options based on model option arrays:
  buildForms: function() {
    var d = this.model.toJSON();

    function buildOptions(opts) {
      return _.reduce(opts, function(memo, opt) {
        return memo += ['<option value="', opt.hasOwnProperty('value') ? opt.value : opt, '">', opt.hasOwnProperty('text') ? opt.text : opt, '</option>'].join('');
      }, '');
    }

    if (d.textShadowEdit) {
      $('#text-shadow').parent().show();
    }

    // Build font color options:
    if (d.fontColorOpts && d.fontColorOpts.length) {
      var fontColorOpts = _.reduce(d.fontColorOpts, function(memo, opt) {
        var color = opt.hasOwnProperty('value') ? opt.value : opt;
        return memo += '<li><label><input class="m-editor__swatch" style="background-color:'+color+'" type="radio" name="font-color" value="'+color+'"></label></li>';
      }, '');

      $('#font-color').show().find('ul').append(fontColorOpts);
    }

    // Build background color options:
    if (d.backgroundColorOpts && d.backgroundColorOpts.length) {
      var backgroundColorOpts = _.reduce(d.backgroundColorOpts, function(memo, opt) {
        var color = opt.hasOwnProperty('value') ? opt.value : opt;
        return memo += '<li><label><input class="m-editor__swatch" style="background-color:'+color+'" type="radio" name="background-color" value="'+color+'"></label></li>';
      }, '');

      $('#background-color').show().find('ul').append(backgroundColorOpts);
    }

    // Build text alignment options:
    if (d.textAlignOpts && d.textAlignOpts.length) {
      $('#text-align').append(buildOptions(d.textAlignOpts)).show();
    }

    if (d.textAlignVerticalOpts && d.textAlignVerticalOpts.length) {
      $('#text-align-vertical').append(buildOptions(d.textAlignVerticalOpts)).show();
    }

    // Build font family options:
    if (d.fontFamilyOpts && d.fontFamilyOpts.length) {
      $('#font-family').append(buildOptions(d.fontFamilyOpts)).show();
    }

    // Build overlay color options:
    if (d.overlayColorOpts && d.overlayColorOpts.length) {
      var overlayOpts = _.reduce(d.overlayColorOpts, function(memo, opt) {
        var color = opt.hasOwnProperty('value') ? opt.value : opt;
        return memo += '<li><label><input class="m-editor__swatch" style="background-color:'+color+'" type="radio" name="overlay" value="'+color+'"></label></li>';
      }, '');

      $('#overlay').show().find('ul').append(overlayOpts);
    }
  },

  render: function() {
    var d = this.model.toJSON();
    this.$('#headline').val(d.headlineText);
    this.$('#background-color').val(d.backgroundColor);
    this.$('#credit').val(d.creditText);
    this.$('#image-scale').val(d.imageScale);
    this.$('#font-color').val(d.fontColor);
    this.$('#font-size').val(d.fontSize);
    this.$('#padding-scale').val(d.paddingScale);
    this.$('#font-family').val(d.fontFamily);
    this.$('#text-align').val(d.textAlign);
    this.$('#text-align-vertical').val(d.textAlignVertical);
    this.$('#text-shadow').prop('checked', d.textShadow);
    this.$('#head-uppercase').prop('checked', d.headUppercase);
    this.$('#source-uppercase').prop('checked', d.sourceUppercase);
    this.$('#overlay').find('[value="'+d.overlayColor+'"]').prop('checked', true);
    this.$('#overlay-opacity').val(d.overlayAlpha);
    this.$('#watermark-color').val(d.watermarkColor);
    this.$('#alternate-layout').val(d.alternateLayout);
    this.$('#letter-spacing').val(d.letterSpacing);
    this.$('#logo-side').val(d.logoSide);
  },

  events: {
    'input #headline': 'onHeadline',
    'input #credit': 'onCredit',
    'input #image-scale': 'onScale',
    'change #background-color': 'onBackgroundColor',
    'change #aspect-ratio': 'onAspectRatio',
    'change #file-input': 'onFileSelect',
    'change #watermark-file-input': 'onWatermark',
    'change #font-color': 'onFontColor',
    'change #font-size': 'onFontSize',
    'change #font-scale': 'onFontScale',
    'change #padding-scale': 'onPaddingScale',
    'change #font-family': 'onFontFamily',
    'change #text-align': 'onTextAlign',
    'change #text-align-vertical': 'onTextAlignVertical',
    'change #text-shadow': 'onTextShadow',
    'change #head-uppercase': 'onHeadUppercase',
    'change #source-uppercase': 'onSourceUppercase',
    'change [name="overlay"]': 'onOverlayColor',
    'change #overlay-opacity': 'onOverlayOpacity',
    'change #alternate-layout': 'onAlternateLayout',
    'change #letter-spacing': 'onLetterSpacing',
    'change #logo-side': 'onLogoSide',
    'dragover #dropzone': 'onZoneOver',
    'dragleave #dropzone': 'onZoneOut',
    'drop #dropzone': 'onZoneDrop',
    'dragover #dropzone-watermark': 'onWatermarkZoneOver',
    'dragleave #dropzone-watermark': 'onWatermarkZoneOut',
    'drop #dropzone-watermark': 'onWatermarkZoneDrop',
    'click #dropzone': 'onZoneClick',
    'click #dropzone-watermark': 'onWatermarkClick',
    'change #watermark-color': 'onWatermarkColor',
    'click #breaking-news': 'onBreakingNews',
    'input #number-of-lines': 'onNumberOfLines'
  },

  onNumberOfLines: function () {
    this.model.set('numberOfLines', this.$('#number-of-lines').val());
  },
  onBreakingNews: function () {
    this.model.set('breakingNews', this.$('#breaking-news').prop('checked'));
  },

  onCredit: function() {
    this.model.set('creditText', this.$('#credit').val());
  },

  onHeadline: function() {
    this.model.set('headlineText', this.$('#headline').val());
  },

  onBackgroundColor: function(evt){
    this.model.set('backgroundColor', this.$(evt.target).val());
    this.contrastCheck();
  },

  onTextAlign: function() {
    this.model.set('textAlign', this.$('#text-align').val());
  },

  onTextAlignVertical: function() {
    this.model.set('textAlignVertical', this.$('#text-align-vertical').val());
  },

  onTextShadow: function() {
    this.model.set('textShadow', this.$('#text-shadow').prop('checked'));
  },

  onHeadUppercase: function() {
    this.model.set('headUppercase', this.$('#head-uppercase').prop('checked'));
  },

  onSourceUppercase: function() {
    this.model.set('sourceUppercase', this.$('#source-uppercase').prop('checked'));
  },

  onFontColor: function(evt) {
    this.model.set('fontColor', this.$(evt.target).val());
    this.contrastCheck();
  },

  onFontSize: function() {
    this.model.set('fontSize', this.$('#font-size').val());
  },

  onPaddingScale: function() {
    this.model.set('paddingScale', this.$('#padding-scale').val());
  },

  onLetterSpacing: function() {
    this.model.set('letterSpacing', this.$('#letter-spacing').val());
  },

  onWatermark: function(evt) {
    console.log( evt )
    var dataTransfer = evt.target;
    if (dataTransfer) {
      this.model.loadWatermark(dataTransfer.files[0]);
    }
  },

  onLogoSide: function() {
    this.model.set('logoSide', this.$('#logo-side').val());
  },

  onScale: function() {
    this.model.set('imageScale', this.$('#image-scale').val());
  },

  onOverlayColor: function(evt) {
    this.model.set('overlayColor', this.$(evt.target).val());
    this.contrastCheck();
  },

  onOverlayOpacity: function() {
    this.model.set('overlayAlpha', this.$('#overlay-opacity').val());
  },

  getDataTransfer: function(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    return evt.originalEvent.dataTransfer || null;
  },

  onZoneOver: function(evt) {
    var dataTransfer = this.getDataTransfer(evt);
    if (dataTransfer) {
      dataTransfer.dropEffect = 'copy';
      this.$('#dropzone').addClass('pulse');
    }
  },

  onZoneOut: function(evt) {
    this.$('#dropzone').removeClass('pulse');
  },

  onWatermarkZoneOver: function(evt) {
    var dataTransfer = this.getDataTransfer(evt);
    if (dataTransfer) {
      dataTransfer.dropEffect = 'copy';
      this.$('#dropzone-watermark').addClass('pulse');
    }
  },

  onWatermarkZoneOut: function(evt) {
    this.$('#dropzone-watermark').removeClass('pulse');
  },

  onWatermarkZoneDrop: function(evt) {
    var dataTransfer = this.getDataTransfer(evt);
    if (dataTransfer) {
      this.model.loadWatermark(dataTransfer.files[0]);
      this.$('#dropzone-watermark').removeClass('pulse');
    }
  },

  onZoneDrop: function(evt) {
    var dataTransfer = this.getDataTransfer(evt),
        card = this.model;
    if (dataTransfer) {
      card.loadBackground(dataTransfer.files[0]);
      this.$('#dropzone').removeClass('pulse');
      card.background.onload = function(){
        card.set('imageSrc', card.background['src']);
      }
    }
  },

  onFileSelect: function(evt) {
    var dataTransfer = evt.target,
        card = this.model;
    if (dataTransfer) {
      card.loadBackground(dataTransfer.files[0]);
      card.background.onload = function(){
        card.set('imageSrc', card.background['src']);
      }
    }
  },

  onZoneClick: function() {
    $('#file-input').click();
  },

  onWatermarkClick: function() {
    $('#watermark-file-input').click();
  },

  onWatermarkColor: function() {
    this.model.set('watermarkColor', this.$('#watermark-color').val());
  },

  onAlternateLayout: function() {
    this.model.set('alternateLayout', this.$('#alternate-layout').val());
  }
});
