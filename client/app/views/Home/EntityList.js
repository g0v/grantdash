/**
 * VIEW: A collection of Items for a Home Search
 *
 */

var Item = require('./Item');

module.exports = Backbone.Marionette.CollectionView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: 'entities',
  childView: Item,

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  initialize: function(options){
    // option for fixed slides & not responsive (embeds)
    this.slides = options && options.slides;
  },

  onBeforeRender: function(){
    if (this.initialized && !this.$el.is(':empty')){
      this.destroySlick();
      this.$el.empty();
    }
  },

  onRender: function(){
    var self = this;
    _.defer(function(){
      self.updateGrid();
    });
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

  initialized: false,
  destroyed: false,

  destroySlick: function(){
  },

  updateGrid: function(){

    if (this.initialized && !this.destroyed){
      this.destroySlick();
    }

    if (this.$el.is(':empty')){
      this.initialized = false;
      return;
    }

    var cols = this.slides;
    var responsive = [];

    if (!this.slides) {
      // is home page

      cols = 5;

      responsive = [1450, 1200, 1024, 750, 430].map(function(value){
        var cmode = false;
        if (value <= 430 ){
          cmode = true;
        }

        return {
          breakpoint: value,
          settings: {
            centerMode: cmode,
            slidesToShow: cols,
            slidesToScroll: cols--
          }
        };
      });

      cols = 6;
    }
    // else is embeds

    this.$el
      .off('setPosition')
      .on('setPosition', this.replaceIcons.bind(this));

    this.replaceIcons();

    this.initialized = true;
    this.destroyed = false;
  },

  replaceIcons: function(){
    $('.slick-prev', this.$el).html('<i class="fa fa-chevron-left"></i>');
    $('.slick-next', this.$el).html('<i class="fa fa-chevron-right"></i>');
  }

});