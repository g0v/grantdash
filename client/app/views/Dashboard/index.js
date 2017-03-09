/**
 * VIEW: Dashboard Projects Layout
 *
 */

var template = require('./templates/index.hbs')
  , UsersView = require('./Users')
  , DashboardView = require('./Dashboard')
  , ProjectsView = require('../Project/Collection')
  , Sharer = require("../Sharer")
  , Search = require('./Search');

module.exports = Backbone.Marionette.LayoutView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: "page-ctn dashboard",
  template: template,

  ui: {
    inactiveCtn: ".inactive-ctn",
    shareLink: '.share',
    dashboardBtn: ".btn-dashboard",
    dashboardH1: ".h1-dashboard",
    allProjectsBtn: ".btn-all-projects",
    allProjectsH1: ".h1-all-projects"
  },

  events: {
    "click .share": "showShare",
    "click .login": "showLogin",
    "click .toggle-showcase-on": "toggleShowcaseOn",
    "click .toggle-showcase-off": "toggleShowcaseOff"
  },

  regions: {
    "dashboard": ".dash-details",
    "admins": ".dash-admins",
    "projects": "#dashboard-projects",
    "inactives": "#inactive-projects",
    "search": ".dash-search"
  },

  modelEvents:{
    "edit:showcase": "onStartEditShowcase",
    "end:showcase": "onEndEditShowcase",
    "save:showcase": "onSaveEditShowcase"
  },

  templateHelpers: {
    isShowcaseMode: function() {
      console.log(hackdash);
      console.log(hackdash.app);
      console.log(hackdash.app.dashboard);
      console.log(hackdash.app.dashboard.showcaseMode);
      console.log(hackdash.app.dashboard.get("showcaseMode"));
      return hackdash.app.dashboard.showcaseMode;
    },
    isDashOpen: function(){
      var isDashboard = (hackdash.app.type === "dashboard" ? true : false);
      if (!isDashboard){
        return false;
      }
      return this.open;
    }
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  showcaseMode: false,
  showcaseSort: false,

  onRender: function(){
    var self = this;
    if(hackdash.getQueryVariable('sort') === "showcase") {
      this.showcaseMode = true;
    }
    if(this.showcaseMode) {
      this.ui.dashboardBtn.addClass("active");
      this.ui.allProjectsH1.addClass("hide");
    } else {
      this.ui.allProjectsBtn.addClass("active");
      this.ui.dashboardH1.addClass("hide");
    }

    this.search.show(new Search({
      showSort: true,
      placeholder: __("Enter your keywords"),
      model: this.model,
      collection: this.collection
    }));

    this.dashboard.show(new DashboardView({
      model: this.model
    }));

    this.model.get("admins").fetch().done(function(){
      self.admins.show(new UsersView({
        model: self.model,
        collection: self.model.get("admins")
      }));
    });

    if (this.showcaseMode){
      this.projects.show(new ProjectsView({
        model: this.model,
        collection: hackdash.app.projects.getActives(),
        showcaseMode: true
      }));

      this.ui.inactiveCtn.removeClass("hide");

      hackdash.app.projects.off("change:active").on("change:active", function(){
        self.projects.currentView.collection = hackdash.app.projects.getActives();
        self.inactives.currentView.collection = hackdash.app.projects.getInactives();

        self.model.isDirty = true;

        self.projects.currentView.render();
        self.inactives.currentView.render();
      });
    }
    else {
      this.ui.inactiveCtn.addClass("hide");

      var pView = new ProjectsView({
        model: this.model,
        collection: hackdash.app.projects,
        showcaseMode: false,
        showcaseSort: this.showcaseSort
      });

      pView.on('ended:render', function(){
        var sort = ""; //= hackdash.getQueryVariable('sort'); // this is original method.
        if (!self.showcaseSort && sort){
          pView['sortBy' + sort.charAt(0).toUpperCase() + sort.slice(1)]();
        }
        if (hackdash.discourseUrl) {
          window.discourseUrl = hackdash.discourseUrl;
          var d = document.createElement('script'),
              srcUrl = hackdash.discourseUrl + "javascripts/count.js";

          d.src = srcUrl;
          (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(d);
        }
      });

      this.projects.show(pView);
    }

    $(".tooltips", this.$el).tooltip({});
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  showLogin: function(){
    hackdash.app.showLogin();
  },

  toggleShowcaseOn: function() {
    window.location.search = "?sort=showcase";
  },

  toggleShowcaseOff: function() {
    window.location.search = "";
  },

  showShare: function(){
    Sharer.show(this.ui.shareLink, {
      type: 'dashboard',
      model: this.model
    });
  },

  onStartEditShowcase: function(){
    this.showcaseMode = true;
    this.render();
  },

  onSaveEditShowcase: function(){
    var showcase = this.projects.currentView.updateShowcaseOrder();
    this.model.save({ "showcase": showcase });

    this.model.isDirty = false;
    this.onEndEditShowcase();
  },

  onEndEditShowcase: function(){
    this.model.isShowcaseMode = false;
    this.model.trigger("change");

    this.showcaseSort = true;
    this.showcaseMode = false;
    this.render();
  },

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

});
