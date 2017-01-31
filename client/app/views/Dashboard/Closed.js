/**
 * VIEW: DashboardClosed
 *
 */

var template = require('./templates/closed.hbs');

module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------
  className: "page-ctn project",
  template: template,

});
