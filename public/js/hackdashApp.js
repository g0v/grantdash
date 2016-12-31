/*! 
* Hackdash - v0.10.1
* Copyright (c) 2016 Hackdash 
*  
*/ 


(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Hackdash Application
 *
 */

var HackdashRouter = require('./HackdashRouter')
  , LoginView = require("./views/Login")
  , MessageView = require("./views/MessageBox")
  , ModalRegion = require('./views/ModalRegion');

module.exports = function(){

  var app = module.exports = new Backbone.Marionette.Application();

  function initRegions(){
    app.addRegions({
      header: "header",
      main: "#main",
      footer: "footer",
      modals: ModalRegion
    });

    app.showLogin = function(){
      var providers = window.hackdash.providers;

      app.modals.show(new LoginView({
        model: new Backbone.Model({ providers: providers })
      }));
    };

    app.showOKMessage = function(opts){
      app.modals.show(new MessageView({
        model: new Backbone.Model(opts)
      }));
    };

    app.setTitle = function(title){
      window.document.title = title + " - Hackdash";
    };
  }

  function initRouter(){
    app.router = new HackdashRouter();
    app.router.on("route", function(/*route, params*/) {
      app.previousURL = Backbone.history.fragment;
    });
    Backbone.history.start({ pushState: true });
  }

  app.addInitializer(initRegions);
  app.addInitializer(initRouter);

  window.hackdash.app = app;
  window.hackdash.app.start();

  // Add navigation for BackboneRouter to all links
  // unless they have attribute "data-bypass"
  $(window.document).on("click", "a:not([data-bypass])", function(evt) {
    var href = { prop: $(this).prop("href"), attr: $(this).attr("href") };
    var root = window.location.protocol + "//" + window.location.host + (app.root || "");

    if (href.prop && href.prop.slice(0, root.length) === root) {
      evt.preventDefault();
      Backbone.history.navigate(href.attr, { trigger: true });
    }
  });

};
},{"./HackdashRouter":2,"./views/Login":68,"./views/MessageBox":69,"./views/ModalRegion":70}],2:[function(require,module,exports){
/*
 * Hackdash Router
 */

var Dashboard = require("./models/Dashboard")
  , Project = require("./models/Project")
  , Projects = require("./models/Projects")
  , Collection = require("./models/Collection")
  , Profile = require("./models/Profile")

  , Header = require("./views/Header")
  , Footer = require("./views/Footer")

  , HomeLayout = require("./views/Home")
  , ProfileView = require("./views/Profile")
  , ProjectFullView = require("./views/Project/Full")
  , ProjectEditView = require("./views/Project/Edit")
  , DashboardView = require("./views/Dashboard")
  , CollectionView = require("./views/Collection")
  ;

module.exports = Backbone.Marionette.AppRouter.extend({

  routes : {
      "" : "showHome"
    , "login" : "showHome"

    // LANDING
    , "dashboards" : "showLandingDashboards"
    , "projects" : "showLandingProjects"
    , "users" : "showLandingUsers"
    , "collections" : "showLandingCollections"

    // APP
    , "dashboards/:dash": "showDashboard"
    , "dashboards/:dash/create": "showProjectCreate"

    , "projects/:pid/edit" : "showProjectEdit"
    , "projects/:pid" : "showProjectFull"

    , "collections/:cid" : "showCollection"

    , "users/profile": "showProfile"
    , "users/:user_id" : "showProfile"

  },

  onRoute: function(name, path){
    window._gaq.push(['_trackPageview', path]);
  },

  showHome: function(){
    this.homeView = new HomeLayout();
    var app = window.hackdash.app;
    app.type = "landing";

    app.main.show(this.homeView);
  },

  getSearchQuery: function(){
    var query = hackdash.getQueryVariable("q");
    var fetchData = {};
    if (query && query.length > 0){
      fetchData = { data: $.param({ q: query }) };
    }

    return fetchData;
  },

  showHomeSection: function(section){
    var app = window.hackdash.app;
    app.type = "landing";

    if (!this.homeView){
      var main = hackdash.app.main;
      this.homeView = new HomeLayout({
        section: section
      });

      main.show(this.homeView);
    }

    this.homeView.setSection(section);
  },

  showLandingDashboards: function(){
    this.showHomeSection("dashboards");
  },

  showLandingProjects: function(){
    this.showHomeSection("projects");
  },

  showLandingUsers: function(){
    this.showHomeSection("users");
  },

  showLandingCollections: function(){
    this.showHomeSection("collections");
  },

  showDashboard: function(dash) {

    var app = window.hackdash.app;
    app.type = "dashboard";

    app.dashboard = new Dashboard();
    app.projects = new Projects();

    if (dash){
      app.dashboard.set('domain', dash);
      app.projects.domain = dash;
    }

    app.dashboard.fetch().done(function(){
      app.projects.fetch({}, { parse: true })
        .done(function(){
          app.projects.buildShowcase(app.dashboard.get("showcase"));

          app.header.show(new Header({
            model: app.dashboard,
            collection: app.projects
          }));

          app.main.show(new DashboardView({
            model: app.dashboard,
            collection: app.projects
          }));

          app.footer.show(new Footer({
            model: app.dashboard
          }));

          app.setTitle(app.dashboard.get('title') || app.dashboard.get('domain'));

        });
    });

  },

  showProjectCreate: function(dashboard){

    var app = window.hackdash.app;
    app.type = "project";

    app.project = new Project({
      domain: dashboard
    });

    app.header.show(new Header());

    app.main.show(new ProjectEditView({
      model: app.project
    }));

    app.footer.show(new Footer({
      model: app.dashboard
    }));

    app.setTitle('Create a project');
  },

  showProjectEdit: function(pid){

    var app = window.hackdash.app;
    app.type = "project";

    app.project = new Project({ _id: pid });

    app.header.show(new Header());

    app.project.fetch().done(function(){

      app.main.show(new ProjectEditView({
        model: app.project
      }));

      app.setTitle('Edit project');
    });

    app.footer.show(new Footer({
      model: app.dashboard
    }));
  },

  showProjectFull: function(pid){

    var app = window.hackdash.app;
    app.type = "project";

    app.project = new Project({ _id: pid });

    app.project.fetch().done(function(){

      app.header.show(new Header());

      app.main.show(new ProjectFullView({
        model: app.project
      }));

      app.setTitle(app.project.get('title') || 'Project');
    });

    app.footer.show(new Footer({
      model: app.dashboard
    }));
  },

  showCollection: function(collectionId) {

    var app = window.hackdash.app;
    app.type = "collection";

    app.collection = new Collection({ _id: collectionId });

    app.collection
      .fetch({ parse: true })
      .done(function(){

        app.header.show(new Header({
          model: app.collection
        }));

        app.main.show(new CollectionView({
          model: app.collection
        }));

        app.footer.show(new Footer({
          model: app.dashboard
        }));

        app.setTitle(app.collection.get('title') || 'Collection');
      });
  },

  showProfile: function(userId) {

    var app = window.hackdash.app;
    app.type = "profile";

    if (userId && userId.indexOf('from') >= 0){
      userId = null;
    }

    if (!userId){
      if (hackdash.user){
        userId = hackdash.user._id;
      }
      else {
        window.location = "/";
      }
    }

    app.profile = new Profile({
      _id: userId
    });

    app.header.show(new Header());

    app.profile.fetch({ parse: true }).done(function(){

      app.main.show(new ProfileView({
        model: app.profile
      }));

      app.footer.show(new Footer());

      app.setTitle(app.profile.get('name') || 'Profile');
    });

  },

});

},{"./models/Collection":13,"./models/Dashboard":16,"./models/Profile":18,"./models/Project":19,"./models/Projects":20,"./views/Collection":25,"./views/Dashboard":36,"./views/Footer":45,"./views/Header":47,"./views/Home":58,"./views/Profile":75,"./views/Project/Edit":82,"./views/Project/Full":83}],3:[function(require,module,exports){

module.exports = function(){

  window.hackdash = window.hackdash || {};

  window.hackdash.getQueryVariable = function(variable){
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i=0;i<vars.length;i++) {
      var pair = vars[i].split("=");
      if(pair[0] === variable){return decodeURI(pair[1]);}
    }
    return(false);
  };

  if ($.fn.editable){
    // Set global mode for InlineEditor (X-Editable)
    $.fn.editable.defaults.mode = 'inline';
  }

  hackdash.statuses = [
    'brainstorming',
    'researching',
    'prototyping',
    'wireframing',
    'building',
    'releasing'
  ];

  var lan =
    window.navigator.languages ?
      window.navigator.languages[0] :
      (window.navigator.language || window.navigator.userLanguage || 'en-US');

  var locales = require('./locale');
  locales.setLocale(lan);

  window.__ = hackdash.i18n = locales.__;

  // Init Helpers
  require('./helpers/handlebars');
  require('./helpers/backboneOverrides');

  Placeholders.init({ live: true, hideOnFocus: true });

  Dropzone.autoDiscover = false;

  window.hackdash.apiURL = "/api/v2";
  window._gaq = window._gaq || [];

  if (window.hackdash.fbAppId){
    $.getScript('//connect.facebook.net/en_US/sdk.js', function(){
      window.FB.init({
        appId: window.hackdash.fbAppId,
        version: 'v2.3'
      });
    });
  }

};

},{"./helpers/backboneOverrides":4,"./helpers/handlebars":5,"./locale":9}],4:[function(require,module,exports){
/*
 * Backbone Global Overrides
 *
 */

// Override Backbone.sync to use the PUT HTTP method for PATCH requests
//  when doing Model#save({...}, { patch: true });

var originalSync = Backbone.sync;

Backbone.sync = function(method, model, options) {
  if (method === 'patch') {
    options.type = 'PUT';
  }

  return originalSync(method, model, options);
};

},{}],5:[function(require,module,exports){
/**
 * HELPER: Handlebars Template Helpers
 *
 */

var Handlebars = require("hbsfy/runtime");

Handlebars.registerHelper('embedCode', function() {
  var embedUrl = window.location.protocol + "//" + window.location.host;
  var template = _.template('<iframe src="<%= embedUrl %>" width="100%" height="500" frameborder="0" allowtransparency="true" title="Hackdash"></iframe>');

  return template({
    embedUrl: embedUrl
  });
});

Handlebars.registerHelper('firstLetter', function(text) {
  if (text){
    return text.charAt(0);
  }
  return "";
});

Handlebars.registerHelper('markdown', function(md) {
  if (md){
    return markdown.toHTML(md);
  }
  return "";
});

Handlebars.registerHelper('discourseUrl', function() {
  return window.hackdash.discourseUrl;
});

Handlebars.registerHelper('disqus_shortname', function() {
  return window.hackdash.disqus_shortname;
});

Handlebars.registerHelper('user', function(prop) {
  if (window.hackdash.user){
    return window.hackdash.user[prop];
  }
});

Handlebars.registerHelper('isLoggedIn', function(options) {
  if (window.hackdash.user){
    return options.fn(this);
  } else {
    return options.inverse(this);
  }
});

Handlebars.registerHelper('isDashboardView', function(options) {
  if (window.hackdash.app.type === "dashboard"){
    return options.fn(this);
  } else {
    return options.inverse(this);
  }
});

Handlebars.registerHelper('isLandingView', function(options) {
  if (window.hackdash.app.type === "landing"){
    return options.fn(this);
  } else {
    return options.inverse(this);
  }
});

Handlebars.registerHelper('isEmbed', function(options) {
  if (window.hackdash.app.source === "embed"){
    return options.fn(this);
  } else {
    return options.inverse(this);
  }
});

Handlebars.registerHelper('timeAgo', function(date) {
  if (date && moment(date).isValid()) {
    return moment(date).fromNow();
  }

  return "-";
});

Handlebars.registerHelper('formatDate', function(date) {
  if (date && moment(date).isValid()) {
    return moment(date).format("DD/MM/YYYY HH:mm");
  }

  return "-";
});

Handlebars.registerHelper('formatDateText', function(date) {
  if (date && moment(date).isValid()) {
    return moment(date).format("DD MMM YYYY, HH:mm");
  }

  return "";
});

Handlebars.registerHelper('formatDateTime', function(date) {
  if (date && moment(date).isValid()) {
    return moment(date).format("HH:mm");
  }

  return "";
});

Handlebars.registerHelper('timeFromSeconds', function(seconds) {

  function format(val){
    return (val < 10) ? "0" + val : val;
  }

  if (seconds && seconds > 0){

    var t = moment.duration(seconds * 1000),
      h = format(t.hours()),
      m = format(t.minutes()),
      s = format(t.seconds());

    return h + ":" + m + ":" + s;
  }

  return "-";
});

Handlebars.registerHelper('getProfileImage', function(user) {

  if (!user){
    return '';
  }

  var img = new window.Image();

  $(img)
    .load(function () { })
    .error(function () {
      $('.' + this.id).attr('src', '//avatars.io/' + user.provider + '/' + user.username);
    })
    .prop({
      id: 'pic-' + user._id,
      src: user.picture,
      'data-id': user._id,
      title: user.name,
      class: 'avatar tooltips pic-' + user._id,
      rel: 'tooltip'
    });

  return new Handlebars.SafeString(img.outerHTML);
});

function getProfileImageHex(user) {

  if (!user){
    return '';
  }

  var img = new window.Image();

  $(img)
    .load(function () { })
    .error(function () {
      $('.' + this.id)
        .css('background-image', 'url(//avatars.io/' + user.provider + '/' + user.username + ')');
    })
    .prop({
      src: user.picture,
      id: 'pic-' + user._id
    });

  var div = $('<div>')
    .prop({
      'data-id': user._id,
      title: user.name,
      class: 'avatar tooltips pic-' + user._id,
      rel: 'tooltip'
    })
    .css('background-image', 'url(' + user.picture + ')')
    .addClass('hexagon');

  div.append('<div class="hex-top"></div><div class="hex-bottom"></div>');

  return new Handlebars.SafeString(div[0].outerHTML);
}

Handlebars.registerHelper('getProfileImageHex', getProfileImageHex);

Handlebars.registerHelper('getMyProfileImageHex', function() {
  return getProfileImageHex(window.hackdash.user);
});

Handlebars.registerHelper('__', function(key) {
  return window.__(key);
});

Handlebars.registerHelper('each_upto', function(ary, max, options) {
    if(!ary || ary.length === 0) {
      return options.inverse(this);
    }

    var result = [];
    for(var i = 0; i < max && i < ary.length; ++i) {
      result.push(options.fn(ary[i]));
    }

    return result.join('');
});

Handlebars.registerHelper('each_upto_rnd', function(ary, max, options) {
    if(!ary || ary.length === 0) {
      return options.inverse(this);
    }

    var picks = [];
    function pick(max){
      var rnd = Math.floor(Math.random() * max);
      if (picks.indexOf(rnd) === -1) {
        picks.push(rnd);
        return rnd;
      }
      return pick(max);
    }

    var result = [];
    for(var i = 0; i < max && i < ary.length; ++i) {
      result.push( options.fn(ary[pick(ary.length)]) );
    }

    return result.join('');
});

},{"hbsfy/runtime":101}],6:[function(require,module,exports){
jQuery(function() {
  require('./Initializer')();
  window.hackdash.startApp = require('./HackdashApp');
});
},{"./HackdashApp":1,"./Initializer":3}],7:[function(require,module,exports){
/*eslint-disable */
module.exports = {
  "code": "en-US",
  "time_format": "HH:mm",
  "date_locale": "en",
  "date_format": "MM\/DD\/YYYY",
  "datetime_format": "MM\/DD\/YYYY HH:mm",
  "colloquial_date_format": "ddd Do MMMM YYYY",


/* Home Directory */

/* home.hbs */

  // "Dashboards": "Dashboards",
  "Dashboards": "Themes",
  "create now": "create now",
  "ERROR":"ERROR",
  "OGP Toolbox": "OGP Toolbox",
  "hackathon":"hackathon",
  "Collections":"Collections",
  "Projects":"Projects",
  "People":"People",
  "team":"team",
  "partners":"partners",
  "The HackDash was born":"The HackDash was born by accident and by a need. We were looking for a platform to track ideas through hackathons in the line to the <a href=\"http://mediaparty.info/\" data-bypass=\"true\" target=\"__blank\">Hacks/Hackers Media Party</a> organized by <a href=\"https://twitter.com/HacksHackersBA\" data-bypass=\"true\" target=\"__blank\">@HacksHackersBA</a> where hackers and journalists share ideas. We spread the need through Twitter and that was the context of the HackDash born. <a href=\"https://twitter.com/blejman\" data-bypass=\"true\" target=\"__blank\">@blejman</a> had an idea and <a href=\"https://twitter.com/dzajdband\" data-bypass=\"true\" target=\"__blank\">@dzajdband</a> was interested in implement that idea. So we started building the app hoping we can get to the Buenos Aires Media Party with something that doesn't suck. The Media Party Hackathon day came followed by a grateful surprise. Not only the people liked the HackDash implementation but a couple of coders added the improvement of the HackDash as a Hackaton project. After the Media Party we realized that this small app was filling a real need. Three years later, the dashboard is becoming an standard to track innovative ideas around the world.<p><a class=\"up-button\">Create your own dashboard</a>, be part of a global community.</p>",

/* collection.hbs */

/* counts.hbs */

"dashboards":"themes",
"projects":"projects",
"registered users":"registered users",
"collections":"collections",
"released projects":"released projects",

/* footer.hbs */

"up":"up",

/* search.hbs */

"Inform Progress to community.":"Inform Progress to community.",
"Upload your project to the platform.":"Upload your project to the platform.",
"find it":"find it",
"Add Collaborators to your projects.":"Add Collaborators to your projects.",
"Share your app to the world.":"Share your app to the world.",

/* tabContent.hbs */

"HEAD":"HEAD",

/* Collections directory */

/* list.hbs */

"My Collections: adding":"My Collections: adding",

/* listItem.hbs */

"View":"View",

/* Dashboard directory */

/* addAdmin.hbs */

"Warning! you will NOT":"Warning! you will NOT be able to delete this theme if you add an admin!",
"type name or username":"type name or username",
"cancel":"cancel",

/* index.hbs */

"Open dashboard website":"Open theme website",
"Share this Dashboard":"Share this Dashboard",
"Create Project":"Create Project",

/* share.hbs */

"embed this dashboard":"embed this theme",
"Slider":"Slider",
"ANY STATUS":"ANY STATUS",
"Add this dashboard to your website by coping this code below":"Add this theme to your website by coping this code below",
"By Name":"By Name",
"By Date":"By Date",
"Showcase":"Showcase",
"Share Link":"Share Link",
"Preview":"Preview",
"embedded_code":"The embedded code will show exactly what's below",


/* users.hbs */

"Add admins":"Add admins",


/* Footer directory */

/* footer.hbs */

"Export .CSV File":"Export .CSV File",
"Open":"Open",
"Close":"Close",
"Dashboard Status":"Dashboard Status",
"off":"off",

/* Header directory */

/* header.hbs */

"Log out":"Log out",
"Log in":"Log in",

/* Profile directory */

/* card.hbs */

"[ Log in to reveal e-mail ]":"[ Log in to reveal e-mail ]",

/* cardEdit.hbs */

"Edit Your Profile":"Edit Your Profile",
"all fields required":"all fields required",
"email only visible for logged in users":"email only visible for logged in users",
"about_you":"Some about you",
"saving...":"saving...",
"Save profile":"Save profile",
"Profile saved, going back to business ...":"Profile saved, going back to business ...",

/* listItem.hbs */

"Remove":"Remove",

/* profile.hbs */

"Contributions":"Contributions",
"following":"Following",

/* Project directory */

/* card.hbs */

"Join":"Join",
"Follow":"Follow",
"Leave":"Leave",
"Unfollow":"Unfollow",
"Demo":"Demo",

/* edit.hbs */

"Project Title":"Project Title",
"Import Project":"Import Project",
"GitHub":"GitHub",
"LOADING":"LOADING",
"import":"import",
"Tags":"Tags ( comma separated values )",
"Project URL Demo":"Project URL Demo",
"Save":"Save",
"Cancel":"Cancel",

/* full.hbs */

"leaving...":"leaving...",
"joining...":"joining...",
"unfollowing...":"unfollowing...",
"Followers":"Followers",
"following...":"following...",
"Share this Project":"Share this Project",
"Managed by":"Managed by",
"Contributors":"Contributors",
"Edit":"Edit",


/* share.hbs */

"embed this project":"embed this project",
"Add this project to your website by coping this code below":"Add this project to your website by coping this code below",


/* templates directory */

"Access with":"Access with",
"embed/insert":"embed/insert",


/* ----------------------- js files ------------------------ */

/* Sharer.js */

"Hacking at":"Hacking at",

/* Collection directory */

/* Collection.js */

"Collection of Hackathons Title":"Collection of Hackathons Title",
"brief description of this collection of hackathons":"brief description of this collection of hackathons",

/* List.js */

" has been added to ":" has been added to ",
" has been removed from ":" has been removed from ",

/* Dashboard directory */

/* Dashboard.js */

"Hackathon Title":"Hackathon Title",
"brief description of this hackathon":"brief description of this hackathon",
"url to hackathon site":"url to hackathon site",

/* Share.js */

"Description":"Description",
"Hackdash Logo":"Hackdash Logo",
"Progress":"Progress",
"Action Bar":"Action Bar",

/* Footer directory */

/* index.js */

"This Dashboard is open: click to close":"This Dashboard is open: click to close",
"This Dashboard is closed: click to reopen":"This Dashboard is closed: click to reopen",
"turned_off":"apagado",
"Edit Showcase":"Edit Showcase",
"Save Showcase":"Save Showcase",

/* Header directory */

/* index.js */


"Enter your keywords":"Enter your keywords",

/* Home directory */
/* index.js */

"5 to 10 chars, no spaces or special":"5 to 10 chars, no spaces or special",
"Sorry, that one is in use. Try another one.":"Sorry, that one is in use. Try another one.",

/* Profile directory */
/* CardEdit.js */

"Name is required":"Name is required",
"Email is required":"Email is required",
"Invalid Email":"Invalid Email",

/* ListItem.js */

"Only the Owner can remove this Dashboard.":"Only the Owner can remove this Dashboard.",
"Only Dashboards with ONE admin can be removed.":"Only Dashboards with ONE admin can be removed.",
"Only Dashboards without Projects can be removed.":"Only Dashboards without Projects can be removed.",
"This action will remove Dashboard ":"This action will remove Dashboard ",
". Are you sure?":". Are you sure?",
"cannot_remove_dashboard": "Cannot Remove {1} theme",

/* Projects directory */
/* Edit.js */

"Title is required":"Title is required",
"Description is required":"Description is required",
"Drop Image Here":"Drop Image Here",
"File is too big, 500 Kb is the max":"File is too big, 500 Kb is the max",
"Only jpg, png and gif are allowed":"Only jpg, png and gif are allowed",

/* Full.js */

"This project is going to be deleted. Are you sure?":"This project is going to be deleted. Are you sure?",

/* Share.js */

"Picture":"Picture",
"Title":"Title",

};

},{}],8:[function(require,module,exports){
/*eslint-disable */
module.exports = {
  "code": "es-ES",
  "time_format": "HH:mm",
  "date_locale": "es",
  "date_format": "DD\/MM\/YYYY",
  "datetime_format": "DD\/MM\/YYYY HH:mm",
  "colloquial_date_format": "ddd Do MMMM YYYY",


  /* Home Directory */

/* home.hbs */

 
  "dashboard name (5-10 chars)":"nombre del tablero (corto)",
  "Dashboards": "Tableros",
  "create now": "crear ahora",
  "ERROR":"ERROR",
  "OGP Toolbox": "OGP Toolbox",
  "hackathon":"hackatón",
  "Collections":"Colecciones",
  "Projects":"Proyectos",
  "People":"Personas",
  "team":"equipo",
  "partners":"socios",
  "The HackDash was born":"HackDash nació por accidente y por necesidad. Estábamos buscando una plataforma para hacer seguimiento de ideas durante los hackatones en la línea de <a href=\"http://mediaparty.info/\" data-bypass=\"true\" target=\"__blank\">Hacks/Hackers Media Party</a> organizado por <a href=\"https://twitter.com/HacksHackersBA\" data-bypass=\"true\" target=\"__blank\">@HacksHackersBA</a> en la que hackers y periodistas comparten ideas. Corrimos la voz de nuestra necesidad por Twitter y ese fue el contexto en el que nació HackDash. <a href=\"https://twitter.com/blejman\" data-bypass=\"true\" target=\"__blank\">@blejman</a> tuvo una idea y a <a href=\"https://twitter.com/dzajdband\" data-bypass=\"true\" target=\"__blank\">@dzajdband</a> le interesó implementar esa idea. Así que empezamos a crear la aplicación esperando llegar al Buenos Aires Media Party con algo que no fuera horrible. El día del hackatón de Media Party llegó acompañado de una grata sorpresa: No solamente HackDash le gustó a la gente, sino que también algunos programadores agregaron la mejora de HackDash como su proyecto de Hackatón. Después del Media Party nos dimos cuenta de que esta pequeña aplicación estaba cubriendo una necesidad real. Tres años después, el tablero se está convirtiendo en un estándar para hacer seguimiento de ideas innovadores alrededor del mundo.<p><a class=\"up-button\">Creá tu propio tablero</a>, sé parte de una comunidad global.</p>",

/* collection.hbs */

/* counts.hbs */

"dashboards":"tableros",
"projects":"proyectos",
"registered users":"usuarios registrados",
"collections":"colectciones",
"released projects":"proyectos lanzados",

/* footer.hbs */

"up":"subir",

/* search.hbs */

"enter keywords": "Palabras clave",
"Inform Progress to community.":"Informa el progreso a la comunidad.",
"Upload your project to the platform.":"Sube tu proyecto a la plataforma.",
"find it":"encuéntralo",
"Add Collaborators to your projects.":"Agrega colaboradores a tu proyecto.",
"Share your app to the world.":"Comparte tu aplicación con el mundo.",

/* tabContent.hbs */

"HEAD":"ENCABEZADO",

/* Collections directory */

/* list.hbs */

"My Collections: adding":"Mis colecciones: agregando",

/* listItem.hbs */

"View":"Ver",

/* Dashboard directory */

/* addAdmin.hbs */

"Warning! you will NOT":"¡Atención! ¡NO podrás eliminar este tablero si agregas un administrador!",
"type name or username":"escribe nombre o nombre de usuario",
"cancel":"cancelar",

/* index.hbs */

"Open dashboard website":"Abrir el sitio del tablero",
"Share this Dashboard":"Compartir este tablero",
"Create Project":"Crear proyecto",

/* share.hbs */

"embed this dashboard":"insertar este tablero",
"Slider":"Slider",
"ANY STATUS":"CUALQUIER ESTADO",
"Add this dashboard to your website by coping this code below":"Agrega este tablero a tu sitio web copiando el código de abajo",
"By Name":"Por nombre",
"By Date":"Por fecha",
"Showcase":"Galería",
"Share Link":"Enlace para compartir",
"Preview":"Previsualización",
"embedded_code":"El código de inserción mostrará exactamente lo que está abajo",


/* users.hbs */

"Add admins":"Agregar administradores",


/* Footer directory */

/* footer.hbs */

"Export .CSV File":"Exportar archivo .CSV",
"Open":"Abrir",
"Close":"Cerrar",
"Dashboard Status":"Estado del tablero",
"off":"apagar",

/* Header directory */

/* header.hbs */

"Log out":"Salir",
"Log in":"Ingresar",

/* Profile directory */

/* card.hbs */

"[ Log in to reveal e-mail ]":"[ Ingresa para revelar el correo ]",

/* cardEdit.hbs */

"Edit Your Profile":"Edita tu perfil",
"all fields required":"todos los campos obligatorios",
"email only visible for logged in users":"correo sólo visible para usuarios ingresados",
"about_you":"Algo sobre tí",
"saving...":"guardando...",
"Save profile":"Guardar perfil",
"Profile saved, going back to business ...":"Perfil guardado, volviendo...",

/* listItem.hbs */

"Remove":"Eliminar",

/* profile.hbs */

"Contributions":"Colaboraciones",
"following":"Siguiendo",

/* Project directory */

/* card.hbs */

"Join":"Unirse",
"Follow":"Seguir",
"Leave":"Abandonar",
"Unfollow":"Dejar de seguir",
"Demo":"Demo",

/* edit.hbs */

"Project Title":"Título del proyecto",
"Import Project":"Importar proyecto",
"GitHub":"GitHub",
"LOADING":"CARGANDO",
"import":"importar",
"Tags":"Etiquetas (valores separados por comas)",
"Project URL Demo":"URL de demo del proyecto",
"Save":"Guardar",
"Cancel":"Cancelar",

/* full.hbs */

"leaving...":"abandondando...",
"joining...":"uniéndose...",
"unfollowing...":"dejando de seguir...",
"Followers":"Followers",
"following...":"siguiendo...",
"Share this Project":"Comparte este proyecto",
"Managed by":"Administrado por",
"Contributors":"Colaboradores",
"Edit":"Editar",


/* share.hbs */

"embed this project":"inserta este proyecto",
"Add this project to your website by coping this code below":"Agrega este proyecto a tu sitio copiando el código de abajo",


/* templates directory */

"Access with":"Acceder con",
"embed/insert":"insertar",


/* ----------------------- js files ------------------------ */

/* Sharer.js */

"Hacking at":"Hackeando en",

/* Collection directory */

/* Collection.js */

"Collection of Hackathons Title":"Título de la colección de hackatones",
"brief description of this collection of hackathons":"breve descripción de esta colección de hackatones",

/* List.js */

" has been added to ":" ha sido agregado a ",
" has been removed from ":" ha sido eliminado de ",

/* Dashboard directory */

/* Dashboard.js */

"Hackathon Title":"Título de Hackatón",
"brief description of this hackathon":"breve descripción de esta hackatón",
"url to hackathon site":"url del sitio de la hackatón",

/* Share.js */

"Title":"Título",
"Description":"Descripción",
"Hackdash Logo":"Logo de Hackdash",
"Progress":"Progreso",
"Action Bar":"Barra de Acciones",

/* Footer directory */

/* index.js */

"This Dashboard is open: click to close":"Este tablero está abierto: clic para cerrar",
"This Dashboard is closed: click to reopen":"Este tablero está cerrado: clic para reabrir",
"turned_off":"apagado",
"Edit Showcase":"Editar Galería",
"Save Showcase":"Guardar Galería",

/* Header directory */

/* index.js */


"Enter your keywords":"Ingresá las palabras clave",

/* Home directory */
/* index.js */

"5 to 10 chars, no spaces or special":"5 a 10 caracteres, sin espacios o caracteres especiales",
"Sorry, that one is in use. Try another one.":"Perdón, ya está en uso. Prueba otro.",

/* Profile directory */
/* CardEdit.js */

"Name is required":"El nombre es requerido",
"Email is required":"El correo es requerido",
"Invalid Email":"Correo inválido",

/* ListItem.js */

"Only the Owner can remove this Dashboard.":"Sólo el dueño puede eliminar este tablero.",
"Only Dashboards with ONE admin can be removed.":"Sólo tableros con UN admin pueden ser eliminador",
"Only Dashboards without Projects can be removed.":"Sólo tableros sin proyectos pueden ser eliminados.",
"This action will remove Dashboard ":"Esta acción eliminará el Tablero ",
". Are you sure?":". ¿Estás seguro?",
"cannot_remove_dashboard": "No se puede eliminar el tablero {1}",

/* Projects directory */
/* Edit.js */

"Title is required":"El título es requerido",
"Description is required":"La descripción es requerida",
"Drop Image Here":"Suelta la imagen aquí",
"File is too big, 500 Kb is the max":"El archivo es muy grande, 500 Kb es el máximo",
"Only jpg, png and gif are allowed":"Sólo se permiten jpg, png y gif",

/* Full.js */

"This project is going to be deleted. Are you sure?":"Este proyecto será eliminado. ¿Estás seguro?",

/* Share.js */

"Picture":"Imagen",


};

},{}],9:[function(require,module,exports){
/*eslint no-console:0*/
var locales = {
  en: require('./en'),
  es: require('./es'),
  'zh-TW': require('./zh-TW')
};

var current = locales.en;
var _lan = 'en';

module.exports = {

  setLocale: function(lan) {
    //console.log(`i18n: setting Language [${lan}]`);
    // XXX force zh-TW for now
    lan = 'zh-TW';
    if (!locales.hasOwnProperty(lan)){

      if (lan.indexOf('-') > -1 || lan.indexOf('_') > -1){
        var parsed = lan.replace('-', '$').replace('_', '$');
        var newLan = parsed.split('$')[0];

        if (newLan && locales.hasOwnProperty(newLan)){
          lan = newLan;
        }
        else {
          var tr = 'i18n: Could not resolve Language from [${lan}] or language [${newLan}] not found';
          console.warn(tr.replace('${lan}', lan).replace('${newLan}', newLan));
          return;
        }
      }
      else {
        console.warn('i18n: Language [${lan}] not found'.replace('${lan}', lan));
        return;
      }
    }

    _lan = lan;
    current = locales[lan];
  },

  locales: function() {
    return current;
  },

  __: function() {
    var key = arguments[0];
    var params = Array.prototype.slice.call(arguments).slice(1);

    var phrase = current[key];

    if (!phrase){
      if (locales.en.hasOwnProperty(key)){
        phrase = locales.en[key];
        console.warn(
          'i18n: Key [${key}] not found for language [${_lan}]'.replace('${key}', key).replace('${_lan}', _lan));
      }
      else {
        phrase = key;
        console.error('i18n: Key [${key}] not found'.replace('${key}', key));
      }
    }

    return params.reduce(function(str, p, i) {
      return str.replace('{'+ (i+1) +'}', p);
    }, phrase);
  }

};

},{"./en":7,"./es":8,"./zh-TW":10}],10:[function(require,module,exports){
/*eslint-disable */
module.exports = {
  "code": "zh-TW",
  "time_format": "HH:mm",
  "date_locale": "en",
  "date_format": "YYYY\/MM\/DD",
  "datetime_format": "YYYY\/MM\/DD HH:mm",
  "colloquial_date_format": "ddd Do MMMM YYYY",


/* Home Directory */

/* home.hbs */

  // "Dashboards": "Dashboards",
  "Dashboards": "Themes",
  "create now": "立刻提案",
  "ERROR":"錯誤",
  "OGP Toolbox": "OGP Toolbox",
  "hackathon":"hackathon",
  "Collections":"Collections",
  "Projects":"提案",
  "People":"參與者",
  "team":"團隊",
  "partners":"夥伴",
  "The HackDash was born":"The HackDash was born by accident and by a need. We were looking for a platform to track ideas through hackathons in the line to the <a href=\"http://mediaparty.info/\" data-bypass=\"true\" target=\"__blank\">Hacks/Hackers Media Party</a> organized by <a href=\"https://twitter.com/HacksHackersBA\" data-bypass=\"true\" target=\"__blank\">@HacksHackersBA</a> where hackers and journalists share ideas. We spread the need through Twitter and that was the context of the HackDash born. <a href=\"https://twitter.com/blejman\" data-bypass=\"true\" target=\"__blank\">@blejman</a> had an idea and <a href=\"https://twitter.com/dzajdband\" data-bypass=\"true\" target=\"__blank\">@dzajdband</a> was interested in implement that idea. So we started building the app hoping we can get to the Buenos Aires Media Party with something that doesn't suck. The Media Party Hackathon day came followed by a grateful surprise. Not only the people liked the HackDash implementation but a couple of coders added the improvement of the HackDash as a Hackaton project. After the Media Party we realized that this small app was filling a real need. Three years later, the dashboard is becoming an standard to track innovative ideas around the world.<p><a class=\"up-button\">Create your own dashboard</a>, be part of a global community.</p>",

/* collection.hbs */

/* counts.hbs */

"dashboards":"themes",
"projects":"所有提案",
"registered users":"registered users",
"collections":"collections",
"released projects":"released projects",

/* footer.hbs */

"up":"up",

/* search.hbs */

"Inform Progress to community.":"向社群發表進度",
"Upload your project to the platform.":"上傳專案",
"find it":"搜尋",
"Add Collaborators to your projects.":"加入專案協作",
"Share your app to the world.":"向世界發表",

/* tabContent.hbs */

"HEAD":"HEAD",

/* Collections directory */

/* list.hbs */

"My Collections: adding":"My Collections: adding",

/* listItem.hbs */

"View":"View",

/* Dashboard directory */

/* addAdmin.hbs */

"Warning! you will NOT":"Warning! you will NOT be able to delete this theme if you add an admin!",
"type name or username":"輸入使用者名稱",
"cancel":"取消",

/* index.hbs */

"Open dashboard website":"Open theme website",
"Share this Dashboard":"分享",
"Create Project":"立刻提案",

/* share.hbs */

"embed this dashboard":"embed this theme",
"Slider":"Slider",
"ANY STATUS":"ANY STATUS",
"Add this dashboard to your website by coping this code below":"Add this theme to your website by coping this code below",
"By Name":"依名稱",
"By Date":"依日期",
"Showcase":"入選專案",
"Share Link":"分享連結",
"Preview":"預覽",
"embedded_code":"The embedded code will show exactly what's below",


/* users.hbs */

"Add admins":"Add admins",


/* Footer directory */

/* footer.hbs */

"Export .CSV File":"輸出 .CSV File",
"Open":"Open",
"Close":"Close",
"Dashboard Status":"Dashboard Status",
"off":"off",

/* Header directory */

/* header.hbs */

"Log out":"登出",
"Log in":"登入",

/* Profile directory */

/* card.hbs */

"[ Log in to reveal e-mail ]":"[登入以顯示 e-mail]",

/* cardEdit.hbs */

"Edit Your Profile":"編輯個人資料",
"all fields required":"所有欄位皆必填",
"email only visible for logged in users":"只有登入的使用者可以看到您的 Email ",
"about_you":"關於自己",
"saving...":"儲存中...",
"Save profile":"儲存個人資料",
"Profile saved, going back to business ...":"個人資料已儲存，繼續 ...",

/* listItem.hbs */

"Remove":"移除",

/* profile.hbs */

"Contributions":"貢獻",
"following":"正在追蹤",

/* Project directory */

/* card.hbs */

"Join":"加入",
"Follow":"追蹤",
"Leave":"離開",
"Unfollow":"停止追蹤",
"Demo":"展示",

/* edit.hbs */

"Project Title":"專案名稱",
"Import Project":"匯入專案",
"GitHub":"GitHub",
"LOADING":"LOADING",
"import":"輸入",
"Tags":"標籤（逗號分隔）",
"Project URL Demo":"專案展示網址",
"Save":"儲存",
"Cancel":"取消",

/* full.hbs */

"leaving...":"leaving...",
"joining...":"joining...",
"unfollowing...":"取消追蹤...",
"Followers":"關注中",
"following...":"正在追蹤",
"Share this Project":"分享這個專案",
"Proposed by":"提案人",
"Contributors":"貢獻者",
"Edit":"編輯",


/* share.hbs */

"embed this project":"內嵌這個專案",
"Add this project to your website by coping this code below":"複製下列程式碼貼到你的網站",

/* templates directory */

"Access with":"Access with",
"embed/insert":"內嵌/插入",


/* ----------------------- js files ------------------------ */

/* Sharer.js */

"Hacking at":"Hacking at",

/* Collection directory */

/* Collection.js */

"Collection of Hackathons Title":"Collection of Hackathons Title",
"brief description of this collection of hackathons":"brief description of this collection of hackathons",

/* List.js */

" has been added to ":"已被加入到",
" has been removed from ":" has been removed from ",

/* Dashboard directory */

/* Dashboard.js */

"Hackathon Title":"Hackathon Title",
"brief description of this hackathon":"brief description of this hackathon",
"url to hackathon site":"url to hackathon site",

/* Share.js */

"Description":"Description",
"Hackdash Logo":"Hackdash Logo",
"Progress":"Progress",
"Action Bar":"Action Bar",

/* Footer directory */

/* index.js */

"This Dashboard is open: click to close":"This Dashboard is open: click to close",
"This Dashboard is closed: click to reopen":"This Dashboard is closed: click to reopen",
"turned_off":"apagado",
"Edit Showcase":"Edit Showcase",
"Save Showcase":"Save Showcase",

/* Header directory */

/* index.js */


"Enter your keywords":"輸入關鍵字",

/* Home directory */
/* index.js */

"5 to 10 chars, no spaces or special":"5 到 10 個字元，不能有空格或特殊字元",
"Sorry, that one is in use. Try another one.":"抱歉，此帳號已被使用，再試別的。",

/* Profile directory */
/* CardEdit.js */

"Name is required":"名字為必填",
"Email is required":"Email 為必填",
"Invalid Email":"無效的 Email",

/* ListItem.js */

"Only the Owner can remove this Dashboard.":"Only the Owner can remove this Dashboard.",
"Only Dashboards with ONE admin can be removed.":"Only Dashboards with ONE admin can be removed.",
"Only Dashboards without Projects can be removed.":"Only Dashboards without Projects can be removed.",
"This action will remove Dashboard ":"This action will remove Dashboard ",
". Are you sure?":". Are you sure?",
"cannot_remove_dashboard": "Cannot Remove {1} theme",

/* Projects directory */
/* Edit.js */

"Title is required":"請輸入標題",
"Description is required":"請輸入敘述",
"Drop Image Here":"拖曳上傳圖像",
"File is too big, 500 Kb is the max":"檔案太大，檔案大小上限為 500 KB",
"Only jpg, png and gif are allowed":"只接受 jpg, png 和 gif 檔",

/* Full.js */

"This project is going to be deleted. Are you sure?":"你即將刪除此專案，你確定要刪除嗎？",

/* Share.js */

"Picture":"Picture",
"Title":"Title",

};

},{}],11:[function(require,module,exports){
/**
 * Collection: Administrators of a Dashboard
 *
 */

var
  Users = require('./Users'),
  User = require('./User');

module.exports = Users.extend({

  model: User,
  idAttribute: "_id",

  url: function(){
    return hackdash.apiURL + '/' + this.domain + '/admins';
  },

  addAdmin: function(userId){
    $.ajax({
      url: this.url() + '/' + userId,
      type: "POST",
      context: this
    }).done(function(user){
      this.add(user);
    });
  },

});


},{"./User":22,"./Users":23}],12:[function(require,module,exports){

module.exports = Backbone.Collection.extend({

  // when called FETCH triggers 'fetch' event.
  // That way can be set loading state on components.

  fetch: function(options) {
    this.trigger('fetch', this, options);
    return Backbone.Collection.prototype.fetch.call(this, options);
  }

});
},{}],13:[function(require,module,exports){
/**
 * MODEL: Collection (a group of Dashboards)
 *
 */

var Dashboards = require('./Dashboards');

module.exports = Backbone.Model.extend({

  idAttribute: "_id",

  urlRoot: function(){
    return hackdash.apiURL + '/collections'; 
  },

  parse: function(response){
    response.dashboards = new Dashboards(response.dashboards || []);
    return response;
  },

  addDashboard: function(dashId){
    $.ajax({
      url: this.url() + '/dashboards/' + dashId,
      type: "POST",
      context: this
    });

    this.get("dashboards").add({ _id: dashId });
  },

  removeDashboard: function(dashId){
    $.ajax({
      url: this.url() + '/dashboards/' + dashId,
      type: "DELETE",
      context: this
    });

    var result = this.get("dashboards").where({ _id: dashId});
    if (result.length > 0){
      this.get("dashboards").remove(result[0]);
    }
  },

});


},{"./Dashboards":17}],14:[function(require,module,exports){
/**
 * Collection: Collections (group of Dashboards)
 *
 */

var
  Collection = require('./Collection'),
  BaseCollection = require('./BaseCollection');

module.exports = BaseCollection.extend({

  model: Collection,

  idAttribute: "_id",

  url: function(){
    return hackdash.apiURL + '/collections';
  },

  parse: function(response){
    var whiteList = [];

    response.forEach(function(coll){
      if (coll.title && coll.dashboards.length > 0){
        whiteList.push(coll);
      }
    });

    return whiteList;
  },

  getMines: function(){
    $.ajax({
      url: this.url() + '/own',
      context: this
    }).done(function(collections){
      this.reset(collections, { parse: true });
    });
  }

});


},{"./BaseCollection":12,"./Collection":13}],15:[function(require,module,exports){

module.exports = Backbone.Model.extend({

  defaults: {
    dashboards: 0,
    projects: 0,
    users: 0,
    collections: 0,
    releases: 0
  },

  urlRoot: '/counts',

});

},{}],16:[function(require,module,exports){
/**
 * MODEL: Project
 *
 */

var Admins = require("./Admins");

module.exports = Backbone.Model.extend({

  defaults: {
    admins: null
  },

  urlRoot: function(){
    if (this.get('domain')){
      return hackdash.apiURL + '/dashboards';
    }
    else {
      throw new Error('Unkonw Dashboard domain name');
    }
  },

  idAttribute: "domain",

  initialize: function(){
    this.set("admins", new Admins());
    this.on('change:domain', this.setAdminDomains.bind(this));
    this.setAdminDomains();
  },

  setAdminDomains: function(){
    var admins = this.get("admins");
    admins.domain = this.get('domain');
    this.set("admins", admins);
  },

  isAdmin: function(){
    var user = hackdash.user;
    return user && user.admin_in.indexOf(this.get('domain')) >= 0 || false;
  },

  isOwner: function(){
    var user = hackdash.user;
    var owner = this.get('owner');
    owner = (owner && owner._id) || owner;

    return (user && user._id === owner) || false;
  },

}, {

  isAdmin: function(dashboard){
    var user = hackdash.user;
    return user && user.admin_in.indexOf(dashboard.get('domain')) >= 0 || false;
  },

  isOwner: function(dashboard){
    var user = hackdash.user;
    var owner = dashboard.get('owner');
    owner = (owner && owner._id) || owner;

    return (user && user._id === owner) || false;
  }

});


},{"./Admins":11}],17:[function(require,module,exports){
/**
 * MODEL: Dashboards
 *
 */

var BaseCollection = require('./BaseCollection');

module.exports = BaseCollection.extend({

  url: function(){
    return hackdash.apiURL + "/dashboards"; 
  },

  idAttribute: "_id", 

});


},{"./BaseCollection":12}],18:[function(require,module,exports){
/**
 * MODEL: User
 *
 */

var Projects = require("./Projects");
var Dashboards = require("./Dashboards");
var Collections = require("./Collections");

module.exports = Backbone.Model.extend({

  idAttribute: "_id",

  defaults: {
    collections: new Collections(),
    dashboards: new Collections(),
    projects: new Projects(),
    contributions: new Projects(),
    likes: new Projects()
  },

  urlRoot: function(){
    return hackdash.apiURL + '/profiles';
  },

  parse: function(response){

    response.collections = new Collections(response.collections);
    response.dashboards = new Dashboards(response.dashboards);

    response.projects = new Projects(response.projects);
    response.contributions = new Projects(response.contributions);
    response.likes = new Projects(response.likes);

    response.dashboards.each(function(dash){
      var title = dash.get('title');
      if (!title || (title && !title.length)){
        dash.set('title', dash.get('domain'));
      }
    });

    return response;
  }

});

},{"./Collections":14,"./Dashboards":17,"./Projects":20}],19:[function(require,module,exports){
/**
 * MODEL: Project
 *
 */

module.exports = Backbone.Model.extend({

  idAttribute: "_id",

  defaults: {
    active: true
  },

  urlRoot: function(){
    return hackdash.apiURL + '/projects';
  },

  doAction: function(type, res, done){
    $.ajax({
      url: this.url() + '/' + res,
      type: type,
      context: this
    }).done(done);
  },

  updateList: function(type, add){
    var list = this.get(type);
    if (!hackdash.user){
      return;
    }

    var uid = hackdash.user._id;

    function exists(){
      return _.find(list, function(usr){
        return (usr._id === uid);
      }) ? true : false;
    }

    if (add && !exists()){
      list.push(hackdash.user);
    }
    else if (!add && exists()){
      var idx = 0;
      _.each(list, function(usr, i){
        if (usr._id === uid) {
          idx = i;
        }
      });

      list.splice(idx, 1);
    }

    this.set(type, list);
    this.trigger("change");
  },

  join: function(){
    this.doAction("POST", "contributors", function(){
      this.updateList("contributors", true);
      window._gaq.push(['_trackEvent', 'Project', 'Join']);
    });
  },

  leave: function(){
    this.doAction("DELETE", "contributors", function(){
      this.updateList("contributors", false);
      window._gaq.push(['_trackEvent', 'Project', 'Leave']);
    });
  },

  follow: function(){
    this.doAction("POST", "followers", function(){
      this.updateList("followers", true);
      window._gaq.push(['_trackEvent', 'Project', 'Follow']);
    });
  },

  unfollow: function(){
    this.doAction("DELETE", "followers", function(){
      this.updateList("followers", false);
      window._gaq.push(['_trackEvent', 'Project', 'Unfollow']);
    });
  },

  toggleContribute: function(){
    if (this.isContributor()){
      return this.leave();
    }

    this.join();
  },

  toggleFollow: function(){
    if (this.isFollower()){
      return this.unfollow();
    }

    this.follow();
  },

  isContributor: function(){
    return this.userExist(this.get("contributors"));
  },

  isFollower: function(){
    return this.userExist(this.get("followers"));
  },

  userExist: function(arr){

    if (!hackdash.user){
      return false;
    }

    var uid = hackdash.user._id;
    return arr && _.find(arr, function(usr){
      return (usr._id === uid);
    }) ? true : false;
  },

});


},{}],20:[function(require,module,exports){
/**
 * Collection: Projectss
 *
 */

var
  Project = require('./Project'),
  BaseCollection = require('./BaseCollection');

var Projects = module.exports = BaseCollection.extend({

  model: Project,

  idAttribute: "_id",

  comparators: {
    title: function(a){ return a.get('title'); },
    created_at: function(a){ return -a.get('created_at'); },
    showcase: function(a){ return a.get('showcase'); }
  },

  url: function(){
    if (this.domain){
      return hackdash.apiURL + '/' + this.domain + '/projects';
    }
    return hackdash.apiURL + '/projects';
  },

  parse: function(response){

    this.allItems = response;

    if (hackdash.app.type !== "dashboard"){
      //it is not a dashboard so all projects active
      return response;
    }

    var dashboard = hackdash.app.dashboard;

    var showcase = (dashboard && dashboard.get("showcase")) || [];
    if (showcase.length === 0){
      //no showcase defined: all projects are active
      return response;
    }

    // set active property of a project from showcase mode
    // (only projects at showcase array are active ones)
    _.each(response, function(project){

      if (showcase.indexOf(project._id) >= 0){
        project.active = true;
      }
      else {
        project.active = false;
      }

    });

    return response;
  },

  runSort: function(key){
    this.comparator = this.comparators[key];
    this.sort().trigger('reset');
  },

  buildShowcase: function(showcase){
    _.each(showcase, function(id, i){
      var found = this.where({ _id: id, active: true });
      if (found.length > 0){
        found[0].set("showcase", i);
      }
    }, this);

    this.trigger("reset");
  },

  getActives: function(){
    return new Projects(
      this.filter(function(project){
        return project.get("active");
      })
    );
  },

  getInactives: function(){
    return new Projects(
      this.filter(function(project){
        return !project.get("active");
      })
    );
  },

  search: function(keywords){

    if (keywords.length === 0){
      this.reset(this.allItems);
      return;
    }

    keywords = keywords.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");

    var regex = new RegExp(keywords, 'i');
    var items = [];

    _.each(this.allItems, function(project){
      if (
        regex.test(project.title) ||
        regex.test(project.description) ||
        regex.test(project.tags.join(' '))
        ) {

          return items.push(project);
      }
    });

    this.reset(items);
  },

  getStatusCount: function(){
    var statuses = window.hackdash.statuses;
    var statusCount = {};

    _.each(statuses, function(status){
      statusCount[status] = this.where({ status: status }).length;
    }, this);

    return statusCount;
  }

});

},{"./BaseCollection":12,"./Project":19}],21:[function(require,module,exports){
/**
 * Collection of Users
 *
 */

var User = require('./User');

module.exports = Backbone.Collection.extend({

  model: User,

  idAttribute: "_id",

  url: function(){
    return hackdash.apiURL + '/users/team';
  },

});


},{"./User":22}],22:[function(require,module,exports){
/**
 * MODEL: User
 *
 */

module.exports = Backbone.Model.extend({

  idAttribute: "_id",

});

},{}],23:[function(require,module,exports){
/**
 * Collection: Users
 *
 */

var
  User = require('./User'),
  BaseCollection = require('./BaseCollection');

module.exports = BaseCollection.extend({

  model: User,

  idAttribute: "_id",

  url: function(){
    return hackdash.apiURL + '/users';
  },

});


},{"./BaseCollection":12,"./User":22}],24:[function(require,module,exports){
/**
 * VIEW: Collection Header Layout
 *
 */

var
    template = require('./templates/collection.hbs');

module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  template: template,

  ui: {
    "title": "#collection-title",
    "description": "#collection-description",
    "link": "#collection-link"
  },

  templateHelpers: {
    isAdmin: function(){
      return hackdash.user && hackdash.user._id === this.owner._id;
    }
  },

  modelEvents: {
    "change": "render"
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  onRender: function(){
    if (hackdash.user &&
        hackdash.user._id === this.model.get('owner')._id){

      this.initEditables();
    }

    $('.tooltips', this.$el).tooltip({});
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

  placeholders: {
    title: __("Collection of Hackathons Title"),
    description: __("brief description of this collection of hackathons")
  },

  initEditables: function(){
    this.initEditable("title", '<input type="text" maxlength="30">');
    this.initEditable("description", '<textarea maxlength="250"></textarea>', 'textarea');
  },

  initEditable: function(type, template, control){
    var ph = this.placeholders;
    var self = this;

    if (this.ui[type].length > 0){

      this.ui[type].editable({
        type: control || 'text',
        title: ph[type],
        emptytext: ph[type],
        placeholder: ph[type],
        tpl: template,
        success: function(response, newValue) {
          self.model.set(type, newValue);
          self.model.save();
        }
      });
    }
  },

});
},{"./templates/collection.hbs":26}],25:[function(require,module,exports){
/**
 * VIEW: Collection Dashboards Layout
 *
 */

var template = require('./templates/index.hbs')
  , CollectionView = require('./Collection')
  , DashboardsView = require('../Dashboard/Collection');

module.exports = Backbone.Marionette.LayoutView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: "page-ctn collection",
  template: template,

  regions: {
    "collection": ".coll-details",
    "dashboards": "#collection-dashboards"
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  onRender: function(){

    this.collection.show(new CollectionView({
      model: this.model
    }));

    this.dashboards.show(new DashboardsView({
      model: this.model,
      collection: this.model.get('dashboards')
    }));

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

});
},{"../Dashboard/Collection":30,"./Collection":24,"./templates/index.hbs":27}],26:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "\n  <h1>\n    <a id=\"collection-title\">"
    + escapeExpression(((helper = (helper = helpers.title || (depth0 != null ? depth0.title : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"title","hash":{},"data":data}) : helper)))
    + "</a>\n  </h1>\n\n  <p>\n    <a id=\"collection-description\">"
    + escapeExpression(((helper = (helper = helpers.description || (depth0 != null ? depth0.description : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"description","hash":{},"data":data}) : helper)))
    + "</a>\n  </p>\n\n";
},"3":function(depth0,helpers,partials,data) {
  var stack1, buffer = "\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.title : depth0), {"name":"if","hash":{},"fn":this.program(4, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.description : depth0), {"name":"if","hash":{},"fn":this.program(6, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "\n";
},"4":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "  <h1>"
    + escapeExpression(((helper = (helper = helpers.title || (depth0 != null ? depth0.title : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"title","hash":{},"data":data}) : helper)))
    + "</h1>\n";
},"6":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "  <p>"
    + escapeExpression(((helper = (helper = helpers.description || (depth0 != null ? depth0.description : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"description","hash":{},"data":data}) : helper)))
    + "</p>\n";
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, buffer = "";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.isAdmin : depth0), {"name":"if","hash":{},"fn":this.program(1, data),"inverse":this.program(3, data),"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer;
},"useData":true});

},{"hbsfy/runtime":101}],27:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  return "\n<div class=\"header\">\n  <div class=\"container\">\n    <div class=\"coll-details\"></div>\n  </div>\n</div>\n\n<div class=\"body\">\n\n  <div class=\"container\">\n    <div id=\"collection-dashboards\"></div>\n  </div>\n\n</div>\n";
  },"useData":true});

},{"hbsfy/runtime":101}],28:[function(require,module,exports){
/**
 * VIEW: A User Collection
 *
 */

var template = require('./templates/addAdmin.hbs')
  , Users = require('../../models/Users');

module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: "add-admins-modal",
  template: template,

  ui: {
    "txtUser": "#txtUser",
    "addOn": ".add-on"
  },

  events: {
    "click #save": "saveAdmin"
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  initialize: function(){
    this.users = new Users();
  },

  onRender: function(){
    this.initTypehead();
  },

  serializeData: function(){
    return _.extend({
      showAdmin: (this.collection.length > 1 ? false : true)
    }, (this.model && this.model.toJSON()) || {});
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  saveAdmin: function(){
    var selected = this.users.find(function(user){
      return user.get('selected');
    });

    if (selected){
      this.collection.addAdmin(selected.get("_id"));
      this.destroy();
    }
  },

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

  initTypehead: function(){
    var users = this.users,
      self = this,
      MIN_CHARS_FOR_SERVER_SEARCH = 3;

    this.ui.txtUser.typeahead({
      source: function(query, process){
        if (query.length >= MIN_CHARS_FOR_SERVER_SEARCH){
          users.fetch({
            data: $.param({ q: query }),
            success: function(){
              var usersIds = users.map(function(user){ return user.get('_id').toString(); });
              process(usersIds);
            }
          });
        }
        else {
          process([]);
        }
      },
      matcher: function(){
        return true;
      },
      highlighter: function(uid){
        var user = users.get(uid),
          template = _.template('<img class="avatar" src="<%= picture %>" /> <%= name %>');

        return template({
          picture: user.get('picture'),
          name: user.get('name')
        });
      },
      updater: function(uid) {
        var selectedUser = users.get(uid);
        selectedUser.set('selected', true);
        self.ui.addOn.empty().append('<img class="avatar" src="' + selectedUser.get("picture") + '" />');
        return selectedUser.get('name');
      }
    });
  }

});
},{"../../models/Users":23,"./templates/addAdmin.hbs":37}],29:[function(require,module,exports){
/**
 * VIEW: An Dashboard of HOME Search
 *
 */

var template = require('./templates/card.hbs');
var ItemView = require('../Home/Item.js');

module.exports = ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: 'entity dashboard',
  template: template,

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  getURL: function(){
    return "/dashboards/" + this.model.get("domain");
  },

  afterRender: function(){
    var list = $('.list',this.$el);
    var count = this.model.get('covers').length;

    if (count === 0){
      return;
    }

    list.addClass('grid-1');
/*
    if (count >= 4){
      list.addClass('grid-4');
    }

    switch(count){
      case 1: list.addClass('grid-1'); break;
      case 2: list.addClass('grid-2'); break;
      case 3: list.addClass('grid-3'); break;
    }
*/
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

});
},{"../Home/Item.js":53,"./templates/card.hbs":38}],30:[function(require,module,exports){
/**
 * VIEW: Dashboards
 *
 */

var Dashboard = require('./Card');

module.exports = Backbone.Marionette.CollectionView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: "entities",
  childView: Dashboard,

  gutter: 5,

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  onRender: function(){

    var self = this;
    _.defer(function(){
      self.updateGrid();
      self.refresh();
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

  updateGrid: function(){
    if (!this.wall){
      this.wall = new window.freewall(this.$el);
    }

    this.wall.reset({
      selector: '.entity',
      cellW: 200,
      cellH: 200,
      gutterY: this.gutter,
      gutterX: this.gutter,
      onResize: this.refresh.bind(this)
    });

  },

  refresh: function(){
    this.wall.fitWidth();
    this.wall.refresh();
    this.fixSize();
  },

  fixSize: function(){
    this.$el.height(this.$el.height() + this.gutter*4);
  },

});

},{"./Card":29}],31:[function(require,module,exports){
/**
 * VIEW: DashboardHeader Layout
 *
 */

var
    template = require('./templates/dashboard.hbs');

module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  template: template,

  ui: {
    "title": "#dashboard-title",
    "description": "#dashboard-description",
    "link": "#dashboard-link"
  },

  events: {
    "click .logo": "stopPropagation"
  },

  templateHelpers: {
    hackdashURL: function(){
      return "//" + hackdash.baseURL;
    },
    isAdmin: function(){
      var user = hackdash.user;
      return user && user.admin_in.indexOf(this.domain) >= 0 || false;
    }
  },

  modelEvents: {
    "change": "render"
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  onRender: function(){
    var user = hackdash.user;

    if (user){
      var isAdmin = user.admin_in.indexOf(this.model.get("domain")) >= 0;

      if (isAdmin){
        this.initEditables();
      }
    }

    $('.tooltips', this.$el).tooltip({});
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  stopPropagation: function(e){
    e.stopPropagation();
  },

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

  placeholders: {
    title: __("Hackathon Title"),
    description: __("brief description of this hackathon"),
    link: __("url to hackathon site"),
  },

  initEditables: function(){
    this.initEditable("title", '<input type="text" maxlength="30">');
    this.initEditable("description", '<textarea maxlength="250"></textarea>', 'textarea');
    this.initEditable("link");
  },

  initEditable: function(type, template, control){
    var ph = this.placeholders;
    var self = this;

    if (this.ui[type].length > 0){

      this.ui[type].editable({
        type: control || 'text',
        title: ph[type],
        emptytext: ph[type],
        placeholder: ph[type],
        tpl: template,
        success: function(response, newValue) {
          self.model.set(type, newValue);
          self.model.save();
        }
      });
    }
  },

});
},{"./templates/dashboard.hbs":39}],32:[function(require,module,exports){

var
  template = require('./templates/search.hbs');

module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: "search",
  template: template,

  ui: {
    searchbox: "#search"
  },

  events: {
    "keyup @ui.searchbox": "search",
    "click .btn-group>.btn": "sortClicked",
    "click .login": "showLogin"
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  lastSearch: "",
  currentSort: "",

  initialize: function(options){
    this.showSort = (options && options.showSort) || false;
    this.collection = options && options.collection;
    this.placeholder = (options && options.placeholder) || __("Enter your keywords");
  },

  onRender: function(){
    var query = hackdash.getQueryVariable("q");
    var sort = hackdash.getQueryVariable('sort');

    if (query && query.length > 0){
      this.ui.searchbox.val(query);
      this.search();
    }

    if (sort && sort.length > 0){
      $('input[type=radio]', this.$el)
        .parents('label')
        .removeClass('active');

      $('input[type=radio]#' + sort, this.$el)
        .parents('label')
        .addClass('active');

      this.updateSort(sort);
    }
  },

  serializeData: function(){
    return _.extend({
      showSort: this.showSort,
      placeholder: this.placeholder
    }, this.model.toJSON());
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

  sortClicked: function(e){
    e.preventDefault();
    var val = $('input[type=radio]', e.currentTarget)[0].id;
    this.updateSort(val);
  },

  updateSort: function(sort){
    this.collection.trigger("sort:" + sort);

    if (sort !== this.currentSort){
      this.currentSort = sort;
      this.updateURL();
    }
  },

  search: function(){
    var self = this;
    window.clearTimeout(this.timer);

    this.timer = window.setTimeout(function(){
      var keyword = self.ui.searchbox.val();

      if (keyword !== self.lastSearch) {
        self.lastSearch = keyword;

        self.updateURL();
        self.collection.search(keyword);

        var top = $('#dashboard-projects').offset().top;
        var offset = self.$el.parent().height();
        var pos = (top - offset >= 0 ? top - offset : 0);
        $(window).scrollTop(pos);

        var dash = hackdash.app.dashboard;
        var domain = dash && dash.get('domain') || 'unkonwn';
        window._gaq.push(['_trackEvent', 'DashSearch', domain, keyword]);
      }

    }, 300);
  },

  updateURL: function(){
    var keywords = (this.lastSearch ? 'q=' + this.lastSearch : '');
    var sort = (this.currentSort ? 'sort=' + this.currentSort : '');

    var current = decodeURI(Backbone.history.location.search);
    var fragment = Backbone.history.fragment.replace(current, "");

    var search = '?';

    if (keywords){
      search += keywords;
    }

    if (sort){
      search += (keywords ? '&' + sort : sort);
    }

    hackdash.app.router.navigate(fragment + search);
  },

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

});

},{"./templates/search.hbs":41}],33:[function(require,module,exports){
/**
 * VIEW: Login Modal
 *
 */

var template = require('./templates/share.hbs');

module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: "share",
  template: template,

  ui: {
    'prg': '#prg',
    'pic': '#pic',
    'title': '#title',
    'desc': '#desc',
    'logo': '#logo',
    'contrib': '#contrib',
    'slider': '#slider',
    'acnbar': '#acnbar',
    'searchbox': '#keywords',

    'status': 'select[name=status]',
    'preview': '.preview iframe',
    'code': '#embed-code',
    'sharelink': '.dash-share-link a'
  },

  events: {
    "click .close": "destroy",
    "click .checkbox": "onClickSetting",
    "keyup @ui.searchbox": "onKeyword",
    "click .btn-group>.btn": "sortClicked",
    "change @ui.status": "onChangeStatus",
    "change #slides": "onChangeSlider"
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  initialize: function(){
    this.embedTmpl = _.template('<iframe src="<%= url %>" width="100%" height="450" frameborder="0" allowtransparency="true" title="Hackdash"></iframe>');
  },

  onRender: function(){
    this.reloadPreview();
    $('.modal > .modal-dialog').addClass('big-modal');
  },

  serializeData: function(){
    return _.extend({
      settings: this.settings,
      pSettings: this.projectSettings,
      statuses: this.getStatuses()
    }, this.model.toJSON());
  },

  onDestroy: function(){
    $('.modal > .modal-dialog').removeClass('big-modal');
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  hiddenSettings: [],
  keywords: '',
  sorting: '',
  status: '',
  slider: 0,

  onClickSetting: function(e){
    var ele = $('input', e.currentTarget);
    var id = ele.attr('id');
    var checked = $(ele).is(':checked');
    var idx = this.hiddenSettings.indexOf(id);

    if (id === 'slider'){
      this.onChangeSlider();
      return;
    }

    if (ele.attr('disabled')){
      return;
    }

    function toggleLogo(){
      if (id === "title" && !this.ui.title.is(':checked')){
        this.ui.logo
          .attr('disabled', 'disabled')
          .parents('.checkbox').addClass('disabled');
      }
      else {
        this.ui.logo
          .attr('disabled', false)
          .parents('.checkbox').removeClass('disabled');
      }
    }

    if (checked){
      if(idx > -1){
        this.hiddenSettings.splice(idx, 1);
        this.reloadPreview();
      }

      toggleLogo.call(this);
      return;
    }

    if (idx === -1){
      this.hiddenSettings.push(id);
      this.reloadPreview();
      toggleLogo.call(this);
    }
  },

  onChangeSlider: function(){
    var checked = $("#slider", this.$el).is(':checked');
    var slides = parseInt($('#slides', this.$el).val(), 10);

    if (!slides || slides < 1){
      slides = 1;
    }
    if (slides > 6){
      slides = 6;
    }

    $('#slides', this.$el).val(slides);

    this.slider = checked ? (slides || 1) : 0;

    this.reloadPreview();
  },

  onChangeStatus: function(){
    this.status = this.ui.status.val();

    if (this.status.toLowerCase() === 'all'){
      this.status = null;
    }

    this.reloadPreview();
  },

  onKeyword: function(){
    this.keywords = this.ui.searchbox.val();
    this.reloadPreview();
  },

  sortClicked: function(e){
    e.preventDefault();
    this.sorting = $('input[type=radio]', e.currentTarget)[0].id;
    this.reloadPreview();
  },

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

  getStatuses: function(){
    var counts = hackdash.app.projects.getStatusCount();
    return _.map(counts, function(item, key){
      return { name: key, count: item };
    });
  },

  reloadPreview: function(){
    var embedUrl = window.location.protocol + "//" + window.location.host;
    var fragment = '/embed/dashboards/' + this.model.get('domain');
    var hide = 'hide=';
    var query = (this.keywords ? '&query=' + this.keywords : '');
    var sort = (this.sorting ? '&sort=' + this.sorting : '');
    var status = (this.status ? '&status=' + this.status : '');
    var slider = (this.slider > 0 ? '&slider=' + this.slider : '');

    _.each(this.hiddenSettings, function(id){
      hide += id + ',';
    }, this);

    var url = embedUrl + fragment + '?' +
      (this.hiddenSettings.length ? hide : '') + query + sort + status + slider;

    this.ui.preview.attr('src', url);
    this.ui.code.val(this.embedTmpl({ url: url }));
    this.ui.sharelink.attr({ href: url }).text(url);
  },

  settings: [{
    code: 'title',
    name: 'Title'
  }, {
    code: 'desc',
    name: 'Description'
  }, {
    code: 'logo',
    name: 'Hackdash Logo'
  }],

  projectSettings: [{
    code: 'pprg',
    name: 'Progress',
    project: true
  }, {
    code: 'ptitle',
    name: 'Title',
    project: true
  }, {
    code: 'pcontrib',
    name: 'Contributors',
    project: true
  }, {
    code: 'pacnbar',
    name: 'Action Bar',
    project: true
  }]

});
},{"./templates/share.hbs":42}],34:[function(require,module,exports){
/**
 * VIEW: User
 *
 */

var template = require('./templates/user.hbs');

module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  tagName: "li",
  template: template,

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  onRender: function(){
    $('.tooltips', this.$el).tooltip({});
  }

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

});
},{"./templates/user.hbs":43}],35:[function(require,module,exports){
/**
 * VIEW: Collection of Users
 *
 */

var template = require('./templates/users.hbs')
  , User = require('./User')
  , AddAdmin = require('./AddAdmin');

module.exports = Backbone.Marionette.CompositeView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  template: template,

  childViewContainer: "ul",
  childView: User,

  events: {
    "click a.add-admins": "showAddAdmins"
  },

  templateHelpers: {
    isAdmin: function(){
      var user = hackdash.user;
      return user && user.admin_in.indexOf(this.domain) >= 0 || false;
    }
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  onRender: function(){
    $('.tooltips', this.$el).tooltip({});
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  showAddAdmins: function(){
    hackdash.app.modals.show(new AddAdmin({
      collection: this.collection
    }));
  }

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

});
},{"./AddAdmin":28,"./User":34,"./templates/users.hbs":44}],36:[function(require,module,exports){
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
    shareLink: '.share'
  },

  events: {
    "click .share": "showShare",
    "click .login": "showLogin"
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

      this.inactives.show(new ProjectsView({
        model: this.model,
        collection: hackdash.app.projects.getInactives()
      }));

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
        var sort = hackdash.getQueryVariable('sort');
        if (!self.showcaseSort && sort){
          pView['sortBy' + sort.charAt(0).toUpperCase() + sort.slice(1)]();
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

},{"../Project/Collection":81,"../Sharer":89,"./Dashboard":31,"./Search":32,"./Users":35,"./templates/index.hbs":40}],37:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "    <p class=\"bg-warning\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Warning! you will NOT", {"name":"__","hash":{},"data":data})))
    + "</p>\n";
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, buffer = "<div class=\"modal-header\">\n  <button type=\"button\" data-dismiss=\"modal\" aria-hidden=\"true\" class=\"close\">×</button>\n  <h3>Add Dashboard Admin</h3>\n</div>\n<div class=\"modal-body\">\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.showAdmin : depth0), {"name":"if","hash":{},"fn":this.program(1, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "  <div class=\"input-group\">\n    <span class=\"input-group-addon\">\n      <i class=\"fa fa-user\"></i>\n    </span>\n    <input id=\"txtUser\" type=\"text\" class=\"form-control\" placeholder='"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "type name or username", {"name":"__","hash":{},"data":data})))
    + "' autocomplete=\"off\">\n  </div>\n</div>\n<div class=\"modal-footer\">\n  <input id=\"save\" type=\"button\" class=\"btn btn-success pull-right\" value=\"ADD\">\n  <a class=\"btn-cancel pull-left\" data-dismiss=\"modal\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "cancel", {"name":"__","hash":{},"data":data})))
    + "</a>\n</div>";
},"useData":true});

},{"hbsfy/runtime":101}],38:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(depth0,helpers,partials,data) {
  return "list";
  },"3":function(depth0,helpers,partials,data) {
  var lambda=this.lambda, escapeExpression=this.escapeExpression;
  return "  <div style=\"background-image: url("
    + escapeExpression(lambda(depth0, depth0))
    + ");\"></div>\n";
},"5":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "  <i class=\"item-letter\">"
    + escapeExpression(((helpers.firstLetter || (depth0 && depth0.firstLetter) || helperMissing).call(depth0, (depth0 != null ? depth0.title : depth0), {"name":"firstLetter","hash":{},"data":data})))
    + "</i>\n";
},"7":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "  <i class=\"item-letter\">"
    + escapeExpression(((helpers.firstLetter || (depth0 && depth0.firstLetter) || helperMissing).call(depth0, (depth0 != null ? depth0.domain : depth0), {"name":"firstLetter","hash":{},"data":data})))
    + "</i>\n";
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, helper, helperMissing=helpers.helperMissing, functionType="function", escapeExpression=this.escapeExpression, buffer = "<div class=\"cover ";
  stack1 = helpers['if'].call(depth0, ((stack1 = (depth0 != null ? depth0.covers : depth0)) != null ? stack1.length : stack1), {"name":"if","hash":{},"fn":this.program(1, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "\">\n";
  stack1 = ((helpers.each_upto_rnd || (depth0 && depth0.each_upto_rnd) || helperMissing).call(depth0, (depth0 != null ? depth0.covers : depth0), 1, {"name":"each_upto_rnd","hash":{},"fn":this.program(3, data),"inverse":this.noop,"data":data}));
  if (stack1 != null) { buffer += stack1; }
  buffer += "\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.title : depth0), {"name":"if","hash":{},"fn":this.program(5, data),"inverse":this.program(7, data),"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "</div>\n\n<div class=\"details\">\n  <div>\n    <h2>"
    + escapeExpression(((helper = (helper = helpers.title || (depth0 != null ? depth0.title : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"title","hash":{},"data":data}) : helper)))
    + "</h2>\n    <h3>"
    + escapeExpression(((helper = (helper = helpers.domain || (depth0 != null ? depth0.domain : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"domain","hash":{},"data":data}) : helper)))
    + "</h3>\n  </div>\n</div>\n\n<div class=\"action-bar text-center\">\n  <i class=\"fa fa-clock-o timer\" title=\""
    + escapeExpression(((helpers.timeAgo || (depth0 && depth0.timeAgo) || helperMissing).call(depth0, (depth0 != null ? depth0.created_at : depth0), {"name":"timeAgo","hash":{},"data":data})))
    + "\"></i>\n  <span>"
    + escapeExpression(((helper = (helper = helpers.projectsCount || (depth0 != null ? depth0.projectsCount : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"projectsCount","hash":{},"data":data}) : helper)))
    + " "
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Projects", {"name":"__","hash":{},"data":data})))
    + "</span>\n</div>";
},"useData":true});

},{"hbsfy/runtime":101}],39:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "\n  <h1>\n    <a id=\"dashboard-title\">"
    + escapeExpression(((helper = (helper = helpers.title || (depth0 != null ? depth0.title : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"title","hash":{},"data":data}) : helper)))
    + "</a>\n  </h1>\n\n  <p>\n    <a id=\"dashboard-description\">"
    + escapeExpression(((helper = (helper = helpers.description || (depth0 != null ? depth0.description : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"description","hash":{},"data":data}) : helper)))
    + "</a>\n  </p>\n\n  <p>\n    <a id=\"dashboard-link\">"
    + escapeExpression(((helper = (helper = helpers.link || (depth0 != null ? depth0.link : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"link","hash":{},"data":data}) : helper)))
    + "</a>\n  </p>\n\n";
},"3":function(depth0,helpers,partials,data) {
  var stack1, buffer = "\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.title : depth0), {"name":"if","hash":{},"fn":this.program(4, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.description : depth0), {"name":"if","hash":{},"fn":this.program(7, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "\n";
},"4":function(depth0,helpers,partials,data) {
  var stack1, helper, options, functionType="function", helperMissing=helpers.helperMissing, blockHelperMissing=helpers.blockHelperMissing, escapeExpression=this.escapeExpression, buffer = "  <h1>\n";
  stack1 = ((helper = (helper = helpers.isEmbed || (depth0 != null ? depth0.isEmbed : depth0)) != null ? helper : helperMissing),(options={"name":"isEmbed","hash":{},"fn":this.program(5, data),"inverse":this.noop,"data":data}),(typeof helper === functionType ? helper.call(depth0, options) : helper));
  if (!helpers.isEmbed) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if (stack1 != null) { buffer += stack1; }
  return buffer + "    "
    + escapeExpression(((helper = (helper = helpers.title || (depth0 != null ? depth0.title : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"title","hash":{},"data":data}) : helper)))
    + "\n  </h1>\n";
},"5":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "    <a class=\"logo\" href=\""
    + escapeExpression(((helper = (helper = helpers.hackdashURL || (depth0 != null ? depth0.hackdashURL : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"hackdashURL","hash":{},"data":data}) : helper)))
    + "\" target=\"_blank\"></a>\n";
},"7":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "  <p>"
    + escapeExpression(((helper = (helper = helpers.description || (depth0 != null ? depth0.description : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"description","hash":{},"data":data}) : helper)))
    + "</p>\n";
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1;
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.isAdmin : depth0), {"name":"if","hash":{},"fn":this.program(1, data),"inverse":this.program(3, data),"data":data});
  if (stack1 != null) { return stack1; }
  else { return ''; }
  },"useData":true});

},{"hbsfy/runtime":101}],40:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "    <a class=\"dash-details\" href=\"/dashboards/"
    + escapeExpression(((helper = (helper = helpers.domain || (depth0 != null ? depth0.domain : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"domain","hash":{},"data":data}) : helper)))
    + "\" target=\"_blank\"></a>\n";
},"3":function(depth0,helpers,partials,data) {
  return "    <div class=\"dash-details\"></div>\n";
  },"5":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "        <a class=\"link tooltips btn btn-primary\" href=\""
    + escapeExpression(((helper = (helper = helpers.link || (depth0 != null ? depth0.link : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"link","hash":{},"data":data}) : helper)))
    + "\" target=\"_blank\"\n        data-bypass data-original-title='"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Open dashboard website", {"name":"__","hash":{},"data":data})))
    + "'>\n          <i class=\"fa fa-link\"></i>\n        </a>\n";
},"7":function(depth0,helpers,partials,data) {
  var stack1, helper, options, functionType="function", helperMissing=helpers.helperMissing, blockHelperMissing=helpers.blockHelperMissing, buffer = "";
  stack1 = ((helper = (helper = helpers.isLoggedIn || (depth0 != null ? depth0.isLoggedIn : depth0)) != null ? helper : helperMissing),(options={"name":"isLoggedIn","hash":{},"fn":this.program(8, data),"inverse":this.program(10, data),"data":data}),(typeof helper === functionType ? helper.call(depth0, options) : helper));
  if (!helpers.isLoggedIn) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if (stack1 != null) { buffer += stack1; }
  return buffer;
},"8":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "        <a class=\"btn btn-primary\" href=\"/dashboards/"
    + escapeExpression(((helper = (helper = helpers.domain || (depth0 != null ? depth0.domain : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"domain","hash":{},"data":data}) : helper)))
    + "/create\">\n          <i class=\"fa fa-plus\"></i>\n          "
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Create Project", {"name":"__","hash":{},"data":data})))
    + "\n        </a>\n";
},"10":function(depth0,helpers,partials,data) {
  var helper, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, functionType="function";
  return "        <a class=\"login\" class=\"btn btn-primary\">\n          <i class=\"fa fa-plus\"></i>\n          "
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Create Project", {"name":"__","hash":{},"data":data})))
    + "\n        </a>\n        "
    + escapeExpression(((helper = (helper = helpers.endif || (depth0 != null ? depth0.endif : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"endif","hash":{},"data":data}) : helper)))
    + "\n";
},"12":function(depth0,helpers,partials,data) {
  var stack1, helper, options, functionType="function", helperMissing=helpers.helperMissing, blockHelperMissing=helpers.blockHelperMissing, buffer = "    <div class=\"dash-create\">\n      <h3 class=\"create-project\">\n        <i class=\"fa fa-plus\"></i>\n";
  stack1 = ((helper = (helper = helpers.isLoggedIn || (depth0 != null ? depth0.isLoggedIn : depth0)) != null ? helper : helperMissing),(options={"name":"isLoggedIn","hash":{},"fn":this.program(13, data),"inverse":this.program(15, data),"data":data}),(typeof helper === functionType ? helper.call(depth0, options) : helper));
  if (!helpers.isLoggedIn) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if (stack1 != null) { buffer += stack1; }
  return buffer + "      </h3>\n    </div>\n";
},"13":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "        <a href=\"/dashboards/"
    + escapeExpression(((helper = (helper = helpers.domain || (depth0 != null ? depth0.domain : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"domain","hash":{},"data":data}) : helper)))
    + "/create\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Create Project", {"name":"__","hash":{},"data":data})))
    + "</a>\n";
},"15":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "        <a class=\"login\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Create Project", {"name":"__","hash":{},"data":data})))
    + "</a>\n";
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, helper, options, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, blockHelperMissing=helpers.blockHelperMissing, buffer = "\n<div class=\"header dashboard-"
    + escapeExpression(((helper = (helper = helpers.domain || (depth0 != null ? depth0.domain : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"domain","hash":{},"data":data}) : helper)))
    + "\">\n  <div class=\"container\">\n\n";
  stack1 = ((helper = (helper = helpers.isEmbed || (depth0 != null ? depth0.isEmbed : depth0)) != null ? helper : helperMissing),(options={"name":"isEmbed","hash":{},"fn":this.program(1, data),"inverse":this.program(3, data),"data":data}),(typeof helper === functionType ? helper.call(depth0, options) : helper));
  if (!helpers.isEmbed) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if (stack1 != null) { buffer += stack1; }
  buffer += "\n    <div class=\"dash-admins\"></div>\n\n    <div class=\"dash-buttons\">\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.link : depth0), {"name":"if","hash":{},"fn":this.program(5, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "      <a class=\"share tooltips btn btn-primary\" data-original-title='"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Share this Dashboard", {"name":"__","hash":{},"data":data})))
    + "'>\n        <i class=\"fa fa-share-alt\"></i>\n      </a>\n\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.open : depth0), {"name":"if","hash":{},"fn":this.program(7, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "\n    </div>\n    <div class=\"pull-right dash-search\"></div>\n    <!--\n";
  stack1 = ((helper = (helper = helpers.isDashOpen || (depth0 != null ? depth0.isDashOpen : depth0)) != null ? helper : helperMissing),(options={"name":"isDashOpen","hash":{},"fn":this.program(12, data),"inverse":this.noop,"data":data}),(typeof helper === functionType ? helper.call(depth0, options) : helper));
  if (!helpers.isDashOpen) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if (stack1 != null) { buffer += stack1; }
  return buffer + "    -->\n  </div>\n</div>\n\n<div class=\"body dashboard-"
    + escapeExpression(((helper = (helper = helpers.domain || (depth0 != null ? depth0.domain : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"domain","hash":{},"data":data}) : helper)))
    + "\">\n\n  <div class=\"container\">\n\n    <div id=\"dashboard-projects\" class=\"section\"></div>\n    <div id=\"inactive-projects\" class=\"hide inactive-ctn\"></div>\n\n  </div>\n\n</div>\n";
},"useData":true});

},{"hbsfy/runtime":101}],41:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "<div class=\"input-group\">\n  <input id=\"search\" type=\"text\" class=\"form-control\" placeholder=\""
    + escapeExpression(((helper = (helper = helpers.placeholder || (depth0 != null ? depth0.placeholder : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"placeholder","hash":{},"data":data}) : helper)))
    + "\">\n  <span class=\"input-group-btn\">\n    <button class=\"btn btn-primary\" type=\"button\">\n      <i class=\"fa fa-search\"></i>\n    </button>\n  </span>\n</div>\n\n";
},"useData":true});

},{"hbsfy/runtime":101}],42:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "\n        <div class=\"checkbox\">\n          <label>\n            <input id=\""
    + escapeExpression(((helper = (helper = helpers.code || (depth0 != null ? depth0.code : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"code","hash":{},"data":data}) : helper)))
    + "\" type=\"checkbox\" checked> "
    + escapeExpression(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"name","hash":{},"data":data}) : helper)))
    + "\n          </label>\n        </div>\n\n";
},"3":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "\n          <div class=\"checkbox\">\n            <label>\n              <input id=\""
    + escapeExpression(((helper = (helper = helpers.code || (depth0 != null ? depth0.code : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"code","hash":{},"data":data}) : helper)))
    + "\" type=\"checkbox\" checked> "
    + escapeExpression(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"name","hash":{},"data":data}) : helper)))
    + "\n            </label>\n          </div>\n\n";
},"5":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "              <option value=\""
    + escapeExpression(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"name","hash":{},"data":data}) : helper)))
    + "\">"
    + escapeExpression(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"name","hash":{},"data":data}) : helper)))
    + " ["
    + escapeExpression(((helper = (helper = helpers.count || (depth0 != null ? depth0.count : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"count","hash":{},"data":data}) : helper)))
    + "]</option>\n";
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, helper, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, functionType="function", buffer = "<div class=\"modal-body\">\n\n  <button type=\"button\" class=\"close\" data-dismiss=\"modal\">\n    <i class=\"fa fa-close\"></i>\n  </button>\n\n  <div class=\"row\">\n    <div class=\"col-md-5 col-lg-3\">\n\n      <h1>"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "embed this dashboard", {"name":"__","hash":{},"data":data})))
    + "</h1>\n\n      <div class=\"settings\">\n\n";
  stack1 = helpers.each.call(depth0, (depth0 != null ? depth0.settings : depth0), {"name":"each","hash":{},"fn":this.program(1, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "\n        <form class=\"form-inline slider\">\n          <div class=\"form-group\">\n            <div class=\"checkbox\">\n              <label>\n                <input id=\"slider\" type=\"checkbox\">\n              </label>\n            </div>\n            <label for=\"slider\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Slider", {"name":"__","hash":{},"data":data})))
    + "</label>\n            <input id=\"slides\" type=\"number\" min=\"1\" max=\"6\" value=\"1\">\n          </div>\n        </form>\n\n        <div>\n          <h5>"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Projects", {"name":"__","hash":{},"data":data})))
    + "</h5>\n\n";
  stack1 = helpers.each.call(depth0, (depth0 != null ? depth0.pSettings : depth0), {"name":"each","hash":{},"fn":this.program(3, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "\n          <div class=\"form-group\">\n            <select name=\"status\" class=\"form-control status\" value=\""
    + escapeExpression(((helper = (helper = helpers.status || (depth0 != null ? depth0.status : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"status","hash":{},"data":data}) : helper)))
    + "\">\n              <option value=\"all\" selected=\"true\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "ANY STATUS", {"name":"__","hash":{},"data":data})))
    + "</option>\n";
  stack1 = helpers.each.call(depth0, (depth0 != null ? depth0.statuses : depth0), {"name":"each","hash":{},"fn":this.program(5, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "            </select>\n          </div>\n\n        </div>\n\n      </div>\n\n      <label class=\"get-code\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Add this dashboard to your website by coping this code below", {"name":"__","hash":{},"data":data})))
    + "</label>\n      <textarea id=\"embed-code\" onclick=\"this.focus();this.select();\" readonly=\"readonly\"></textarea>\n\n    </div>\n    <div class=\"col-md-7 col-lg-9\" style=\"position:relative;\">\n\n      <div class=\"col-xs-12 col-sm-12 share-dashboard-filters\">\n\n        <div class=\"col-xs-12 col-sm-4 col-md-4\">\n          <input id=\"keywords\" type=\"text\" class=\"form-control\" placeholder=\"keywords\">\n        </div>\n\n        <div class=\"col-xs-12 col-sm-8 col-md-8\">\n          <div class=\"btn-group pull-right\" data-toggle=\"buttons\">\n            <label class=\"btn btn-default\">\n              <input type=\"radio\" name=\"options\" id=\"name\" autocomplete=\"off\"> "
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "By Name", {"name":"__","hash":{},"data":data})))
    + "\n            </label>\n            <label class=\"btn btn-default active\">\n              <input type=\"radio\" name=\"options\" id=\"date\" autocomplete=\"off\"> "
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "By Date", {"name":"__","hash":{},"data":data})))
    + "\n            </label>\n            <label class=\"btn btn-default\">\n              <input type=\"radio\" name=\"options\" id=\"showcase\" autocomplete=\"off\"> "
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Showcase", {"name":"__","hash":{},"data":data})))
    + "\n            </label>\n          </div>\n        </div>\n\n      </div>\n\n      <div class=\"col-xs-12 dash-share-link\">\n        <h3>"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Share Link", {"name":"__","hash":{},"data":data})))
    + "</h3>\n        <a target=\"_blank\" data-bypass=\"true\"></a>\n      </div>\n\n      <div class=\"col-xs-12 dash-preview-help\">\n        <h3>"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Preview", {"name":"__","hash":{},"data":data})))
    + "</h3>\n        <p>"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "The embedded code will show exactly what's below", {"name":"__","hash":{},"data":data})))
    + "</p>\n      </div>\n\n      <div class=\"col-xs-12 preview\">\n        <iframe width=\"100%\" height=\"450\" title=\"Hackdash\" frameborder=\"0\" allowtransparency=\"true\"></iframe>\n      </div>\n    </div>\n  </div>\n\n</div>\n";
},"useData":true});

},{"hbsfy/runtime":101}],43:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "<a href=\"/users/"
    + escapeExpression(((helper = (helper = helpers._id || (depth0 != null ? depth0._id : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"_id","hash":{},"data":data}) : helper)))
    + "\">\n  "
    + escapeExpression(((helpers.getProfileImage || (depth0 && depth0.getProfileImage) || helperMissing).call(depth0, depth0, {"name":"getProfileImage","hash":{},"data":data})))
    + "\n</a>";
},"useData":true});

},{"hbsfy/runtime":101}],44:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "<a class=\"tooltips add-admins\" title='"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Add admins", {"name":"__","hash":{},"data":data})))
    + "'>\n  <i class=\"fa fa-plus\"></i>\n</a>\n";
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, buffer = "<ul></ul>\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.isAdmin : depth0), {"name":"if","hash":{},"fn":this.program(1, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer;
},"useData":true});

},{"hbsfy/runtime":101}],45:[function(require,module,exports){

var
    template = require('./templates/footer.hbs')
  , Dashboard = require('../../models/Dashboard');

module.exports = Backbone.Marionette.LayoutView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: "footer",
  template: template,

  ui: {
    "switcher": ".dashboard-btn",
    "showcaseMode": ".btn-showcase-mode",
    "createShowcase": ".btn-new-project",
    "footerToggle": ".footer-toggle-ctn",
    "up": ".up-button"
  },

  events: {
    "click .dashboard-btn": "onClickSwitcher",
    "click .btn-showcase-mode": "changeShowcaseMode",
    "click @ui.up": "goTop"
  },

  templateHelpers: {
    isAdmin: function(){
      var user = hackdash.user;
      return user && user.admin_in.indexOf(this.domain) >= 0 || false;
    },
    isDashboard: function(){
      return (hackdash.app.type === "dashboard");
    }
  },

  modelEvents: {
    "change": "render"
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  onRender: function(){
    $('.tooltips', this.$el).tooltip({});
    this.setStatics();
/*
    if (hackdash.app.type !== "dashboard"){
      this.$el.addClass('unlocked');
    }
*/
  },

  serializeData: function(){

    if (this.model && this.model instanceof Dashboard){

      var msg = __("This Dashboard is open: click to close");

      if (!this.model.get("open")) {
        msg = __("This Dashboard is closed: click to reopen");
      }

      return _.extend({
        switcherMsg: msg
      }, this.model.toJSON());
    }

    return (this.model && this.model.toJSON()) || {};
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  onClickSwitcher:function(){
    var open = true;

    if (this.ui.switcher.hasClass("dash-open")){
      open = false;
    }

    $('.tooltips', this.$el).tooltip('hide');

    this.model.set({ "open": open }, { trigger: false });
    this.model.save({ wait: true });
  },

  upBlocked: false,
  goTop: function(){

    if (!this.upBlocked){
      this.upBlocked = true;

      var body = $("html, body"), self = this;
      body.animate({ scrollTop:0 }, 1500, 'swing', function() {
        self.upBlocked = false;
      });
    }
  },

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

  changeShowcaseMode: function(){
    if (this.ui.showcaseMode.hasClass("on")){

      this.model.trigger("save:showcase");
      this.model.trigger("end:showcase");

      this.model.isShowcaseMode = false;

      this.ui.showcaseMode
        .html("<i class='btn-danger txt'>" + __("turned_off") + "</i><div>" + __("Edit Showcase") + "</div>")
        .removeClass("on");

      this.ui.createShowcase.removeClass("hide");
      this.ui.footerToggle.removeClass("hide");
    }
    else {
      this.model.isShowcaseMode = true;
      this.model.trigger("edit:showcase");

      this.ui.showcaseMode
        .text(__("Save Showcase"))
        .addClass("btn btn-success on");

      this.ui.createShowcase.addClass("hide");
      this.ui.footerToggle.addClass("hide");
    }
  },

  setStatics: function(){
    var statics = ['project', 'profile'];

    if (statics.indexOf(hackdash.app.type) > -1){
      this.$el.addClass('static');
      return;
    }

    function isAdmin(domain){
      var user = hackdash.user;
      return user && user.admin_in.indexOf(domain) >= 0 || false;
    }

    if (hackdash.app.type === 'dashboard' && !isAdmin(this.model.get('domain')) ){
      this.$el.addClass('static');
    }
  }

});

},{"../../models/Dashboard":16,"./templates/footer.hbs":46}],46:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(depth0,helpers,partials,data) {
  var stack1;
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.isAdmin : depth0), {"name":"if","hash":{},"fn":this.program(2, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { return stack1; }
  else { return ''; }
  },"2":function(depth0,helpers,partials,data) {
  return "dashboard-footer";
  },"4":function(depth0,helpers,partials,data) {
  var stack1, buffer = "";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.isAdmin : depth0), {"name":"if","hash":{},"fn":this.program(5, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer;
},"5":function(depth0,helpers,partials,data) {
  var stack1, helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, buffer = "  <div class=\"footer-dash-ctn\">\n\n\n    <div class=\"footer-toggle-ctn\">\n\n      <a href=\"/api/v2/dashboards/"
    + escapeExpression(((helper = (helper = helpers.domain || (depth0 != null ? depth0.domain : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"domain","hash":{},"data":data}) : helper)))
    + "/csv\" target=\"_blank\" data-bypass>\n        <i class=\"fa fa-download\"></i>\n        <div>"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Export .CSV File", {"name":"__","hash":{},"data":data})))
    + "</div>\n      </a>\n\n      <a data-placement=\"top\" data-original-title=\""
    + escapeExpression(((helper = (helper = helpers.switcherMsg || (depth0 != null ? depth0.switcherMsg : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"switcherMsg","hash":{},"data":data}) : helper)))
    + "\"\n        class=\"tooltips dashboard-btn ";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.open : depth0), {"name":"if","hash":{},"fn":this.program(6, data),"inverse":this.program(8, data),"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "\">\n        <i class=\"txt ";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.open : depth0), {"name":"if","hash":{},"fn":this.program(10, data),"inverse":this.program(12, data),"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "\">";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.open : depth0), {"name":"if","hash":{},"fn":this.program(14, data),"inverse":this.program(16, data),"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "</i>\n        <div>"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Dashboard Status", {"name":"__","hash":{},"data":data})))
    + "</div>\n      </a>\n\n    </div>\n\n    <a class=\"btn-showcase-mode\">\n      <i class=\"btn-danger txt\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "off", {"name":"__","hash":{},"data":data})))
    + "</i><div>"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Edit Showcase", {"name":"__","hash":{},"data":data})))
    + "</div>\n    </a>\n\n  </div>\n";
},"6":function(depth0,helpers,partials,data) {
  return "dash-open";
  },"8":function(depth0,helpers,partials,data) {
  return "dash-close";
  },"10":function(depth0,helpers,partials,data) {
  return "btn-success";
  },"12":function(depth0,helpers,partials,data) {
  return "btn-danger";
  },"14":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Open", {"name":"__","hash":{},"data":data})));
  },"16":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Close", {"name":"__","hash":{},"data":data})));
  },"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, buffer = "\n<h3 style=\"margin-right:15px;float:right\">powered by hackdash.org</h3>\n<a class=\"brand ";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.isDashboard : depth0), {"name":"if","hash":{},"fn":this.program(1, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "\">\n  <img src=\"/images/static/brand.png\" style=\"padding:13px\"/>\n</a>\n\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.isDashboard : depth0), {"name":"if","hash":{},"fn":this.program(4, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "\n";
},"useData":true});

},{"hbsfy/runtime":101}],47:[function(require,module,exports){
var
    template = require('./templates/header.hbs');
//  , Search = require('./Search');

module.exports = Backbone.Marionette.LayoutView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: "container-fluid",
  template: template,

  ui: {
    mobileMenu: ".mobile-menu",
    tabs: ".nav-tabs"
  },

  regions: {
    //"search": ".search-ctn"
  },

  events: {
    "click @ui.mobileMenu": "toggleMobileMenu",
    "click .login": "showLogin",
    "click .btn-profile": "openProfile"
  },

  modelEvents: {
    "change": "render"
  },

  templateHelpers: {
    hackdashURL: function(){
      return "//" + hackdash.baseURL;
    },
    isDashboardAdmin: function(){
      var isDashboard = (hackdash.app.type === "dashboard" ? true : false);

      var user = hackdash.user;
      return isDashboard && user && user.admin_in.indexOf(this.domain) >= 0 || false;
    }
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  onRender: function(){

    switch(hackdash.app.type){

      case "dashboard":
        /*
        this.search.show(new Search({
          showSort: true,
          placeholder: __("Enter your keywords"),
          model: this.model,
          collection: this.collection
        }));
        */
        break;
    }

    $('.tooltips', this.$el).tooltip({placement: "bottom"});
    this.$el.addClass(hackdash.app.type);
  },

  serializeData: function(){
    return _.extend({
      fromUrl: this.getURLFrom()
    }, this.model && this.model.toJSON() || {});
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  toggleMobileMenu: function(){
    if (this.ui.mobileMenu.is(':visible')){
      if (this.ui.tabs.hasClass('hidden')){
        this.ui.tabs.removeClass('hidden');
      }
      else {
        this.ui.tabs.addClass('hidden');
      }
    }
  },

  openProfile: function(e){
    e.preventDefault();

    window.fromURL = '/' + Backbone.history.fragment;

    hackdash.app.router.navigate("/users/profile", {
      trigger: true,
      replace: true
    });
  },

  showLogin: function(){
    hackdash.app.showLogin();
  },

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

  getURLFrom: function(){
    return '?from=' + window.encodeURI('/' + Backbone.history.fragment);
  }

});

},{"./templates/header.hbs":48}],48:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "        <div class=\"pull-right col-xs-3 col-md-3\">\n          <a class=\"btn-profile\">\n            "
    + escapeExpression(((helper = (helper = helpers.getMyProfileImageHex || (depth0 != null ? depth0.getMyProfileImageHex : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"getMyProfileImageHex","hash":{},"data":data}) : helper)))
    + "\n          </a>\n          <a class=\"logout\" href=\"/logout\" data-bypass>"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Log out", {"name":"__","hash":{},"data":data})))
    + "</a>\n        </div>\n";
},"3":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "        <a class=\"login\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Log in", {"name":"__","hash":{},"data":data})))
    + "</a>\n";
},"5":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "        <li class=\"dropdown my-profile\">\n          <a class=\"dropdown-toggle\" data-toggle=\"dropdown\" role=\"button\">\n            "
    + escapeExpression(((helper = (helper = helpers.getMyProfileImageHex || (depth0 != null ? depth0.getMyProfileImageHex : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"getMyProfileImageHex","hash":{},"data":data}) : helper)))
    + "\n          </a>\n          <ul class=\"dropdown-menu\">\n            <li><a class=\"btn-profile\">個人檔案</a></li>\n            <li class=\"divider\"></li>\n            <li><a href=\"/logout\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Log out", {"name":"__","hash":{},"data":data})))
    + "</a></li>\n          </ul>\n        </li>\n";
},"7":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "    <div class=\"pull-right col-xs-3 col-md-3\">\n      <a class=\"btn-profile\">\n        "
    + escapeExpression(((helper = (helper = helpers.getMyProfileImageHex || (depth0 != null ? depth0.getMyProfileImageHex : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"getMyProfileImageHex","hash":{},"data":data}) : helper)))
    + "\n      </a>\n      <a class=\"logout\" href=\"/logout\" data-bypass>"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Log out", {"name":"__","hash":{},"data":data})))
    + "</a>\n    </div>\n";
},"9":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "    <a class=\"login\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Log in", {"name":"__","hash":{},"data":data})))
    + "</a>\n";
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, helper, options, functionType="function", helperMissing=helpers.helperMissing, blockHelperMissing=helpers.blockHelperMissing, escapeExpression=this.escapeExpression, buffer = "\n<nav class=\"navbar navbar-default navbar-fixed-top\">\n  <div class=\"container-fluid\">\n    <div class=\"navbar-header\">\n      <a href=\"/\" data-bypass class=\"navbar-brand\">\n        <img src=\"/images/static/brand.png\"/><sup style=\"color:#ff9\"></sup>\n      </a>\n    </div>\n    <a class=\"btn btn-default mobile-menu visible-xs\">\n      <i class=\"fa fa-align-justify\"></i>\n    </a>\n    <div class=\"collapse navbar-collapse\">\n      <!--\n      <div class=\"col-xs-2 col-sm-1 col-md-1 col-lg-1 my-profile\">\n";
  stack1 = ((helper = (helper = helpers.isLoggedIn || (depth0 != null ? depth0.isLoggedIn : depth0)) != null ? helper : helperMissing),(options={"name":"isLoggedIn","hash":{},"fn":this.program(1, data),"inverse":this.program(3, data),"data":data}),(typeof helper === functionType ? helper.call(depth0, options) : helper));
  if (!helpers.isLoggedIn) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if (stack1 != null) { buffer += stack1; }
  buffer += "      </div>\n      -->\n      <ul class=\"nav navbar-nav navbar-right\">\n        <li><a data-scroll=\"data-scroll\" data-bypass href=\"/about\">關於 Grant</a></li>\n        <li><a data-scroll=\"data-scroll\" data-bypass href=\"/about#schedule\">活動辦法</a></li>\n        <li><a data-scroll=\"data-scroll\" data-bypass href=\"/about#faq\">常見問題</a></li>\n        <li><a data-scroll=\"data-scroll\" data-bypass href=\"/about#team\">執行團隊</a></li>\n        <li><a data-scroll=\"data-scroll\" data-bypass href=\"/about#partners\">合作夥伴</a></li>\n";
  stack1 = ((helper = (helper = helpers.isLoggedIn || (depth0 != null ? depth0.isLoggedIn : depth0)) != null ? helper : helperMissing),(options={"name":"isLoggedIn","hash":{},"fn":this.program(5, data),"inverse":this.noop,"data":data}),(typeof helper === functionType ? helper.call(depth0, options) : helper));
  if (!helpers.isLoggedIn) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if (stack1 != null) { buffer += stack1; }
  buffer += "      </ul>\n      <form class=\"navbar-form navbar-right\">\n        <a href=\"/dashboards/2017spring\" class=\"btn btn-warning\"><i class=\"fa fa-plus\"></i> 我要提案</a>\n      </form>\n    </div>\n  </div>\n</nav>\n<div class=\"hidden-xs col-sm-10 col-md-10 col-lg-10 col-sm-offset-1 col-md-offset-1 search-ctn\"></div>\n\n<!--\n<div class=\"row main-header\">\n\n  <div class=\"hidden-xs col-sm-10 col-md-10 col-lg-10 col-sm-offset-1 col-md-offset-1 search-ctn\"></div>\n\n  <div class=\"col-xs-2 col-sm-1 col-md-1 col-lg-1 my-profile\">\n";
  stack1 = ((helper = (helper = helpers.isLoggedIn || (depth0 != null ? depth0.isLoggedIn : depth0)) != null ? helper : helperMissing),(options={"name":"isLoggedIn","hash":{},"fn":this.program(7, data),"inverse":this.program(9, data),"data":data}),(typeof helper === functionType ? helper.call(depth0, options) : helper));
  if (!helpers.isLoggedIn) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if (stack1 != null) { buffer += stack1; }
  return buffer + "  </div>\n\n  <a class=\"logo\" href=\""
    + escapeExpression(((helper = (helper = helpers.hackdashURL || (depth0 != null ? depth0.hackdashURL : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"hackdashURL","hash":{},"data":data}) : helper)))
    + "\" data-bypass></a>\n\n</div>\n-->\n";
},"useData":true});

},{"hbsfy/runtime":101}],49:[function(require,module,exports){
/**
 * VIEW: A Collection of HOME Search
 *
 */

var template = require('./templates/collection.hbs');
var ItemView = require('./Item.js');

module.exports = ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: 'entity collection',
  template: template,

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  getURL: function(){
    return "/collections/" + this.model.get("_id");
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

});
},{"./Item.js":53,"./templates/collection.hbs":59}],50:[function(require,module,exports){
/**
 * VIEW: Counts of HOME
 *
 */

var template = require('./templates/counts.hbs');
var Counts = require('../../models/Counts');

module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: 'row counts',
  template: template,

  modelEvents: {
    "change": "render"
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  initialize: function(){
    this.model = new Counts();
    this.model.fetch();
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

});
},{"../../models/Counts":15,"./templates/counts.hbs":60}],51:[function(require,module,exports){
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
    this.$el.slick('unslick');

    var slick = this.$el.slick('getSlick');
    slick.$list.remove();
    slick.destroy();

    this.destroyed = true;
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

    this.$el.slick({
      centerMode: false,
      dots: false,
      autoplay: false,
      infinite: false,
      adaptiveHeight: true,
      speed: 300,
      slidesToShow: cols,
      slidesToScroll: cols,
      responsive: responsive
    });

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
},{"./Item":53}],52:[function(require,module,exports){
/**
 * VIEW: Footer
 *
 */

var template = require('./templates/footer.hbs');

module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: 'footer',
  template: template,

  ui: {
    'up': '.up-button'
  },

  events: {
    'click @ui.up': 'goTop'
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  upBlocked: false,
  goTop: function(){

    if (!this.upBlocked){
      this.upBlocked = true;

      var body = $("html, body"), self = this;
      body.animate({ scrollTop:0 }, 1500, 'swing', function() {
        self.upBlocked = false;
      });
    }
  }

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

});
},{"./templates/footer.hbs":61}],53:[function(require,module,exports){
/**
 * VIEW: An Item of HOME Search
 *
 */

var template = require('./templates/item.hbs');

module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  id: function(){ return this.model.get("_id"); },
  tagName: 'a',
  template: template,

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  // Overrided method by an Entity
  getURL: function(){ return false; },
  afterRender: function(){ },

  onRender: function(){

    var url = this.getURL();

    if (url !== false){
      this.$el.attr({ 'href': url });
    }

    if (hackdash.app.type === 'landing'){
      this.$el.attr({ 'data-bypass': true });
      $('.tooltips', this.$el).tooltip({ container: '.tab-content' });
    }
    else {
      $('.tooltips', this.$el).tooltip({ container: '.container' });
    }

    this.afterRender();
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

});
},{"./templates/item.hbs":63}],54:[function(require,module,exports){

var
  template = require('./templates/search.hbs');

module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: "landing-search",
  template: template,

  ui: {
    searchbox: "#search"
  },

  events: {
    "keyup @ui.searchbox": "search",
    "click @ui.searchbox": "moveScroll"
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  lastSearch: null,

  onRender: function(){
    var query = hackdash.getQueryVariable("q");
    if (query && query.length > 0){
      this.ui.searchbox.val(query);
      //this.lastSearch = query;
    }

    this.search();
  },

  serializeData: function(){
    return {
      showSort: this.showSort,
      placeholder: this.placeholder
    };
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  search: function(){
    var self = this;
    window.clearTimeout(this.timer);

    this.timer = window.setTimeout(function(){
      var keyword = self.ui.searchbox.val();
      var currentSearch = decodeURI(Backbone.history.location.search);
      var fragment = Backbone.history.fragment.replace(currentSearch, "");

      if (keyword !== self.lastSearch) {
        self.lastSearch = keyword;

        if (keyword.length > 0) {
          fragment = (!fragment.length ? "dashboards" : fragment);
          hackdash.app.router.navigate(fragment + "?q=" + keyword, { trigger: true });

          self.collection.fetch({
            reset: true,
            data: $.param({ q: keyword })
          });

          window._gaq.push(['_trackEvent', 'HomeSearch', fragment, keyword]);
        }
        else {
          hackdash.app.router.navigate(fragment, { trigger: true, replace: true });
          self.collection.fetch({ reset: true });
        }
      }

    }, 300);
  },

  moveScroll: function(){
    var tabs = $('.nav-tabs.landing');
    var mobileMenu = $('.mobile-menu');

    var isMobile = mobileMenu.is(':visible');

    var top = tabs.offset().top + 60;
    var offset = tabs.height();

    if (isMobile){
      top = this.ui.tabContent.offset().top;
      offset = 0;
    }

    var pos = (top - offset >= 0 ? top - offset : 0);
    
    $(window).scrollTop(pos);
  }

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

});

},{"./templates/search.hbs":64}],55:[function(require,module,exports){

var template = require("./templates/stats.hbs")
  , CountsView = require("./Counts")
  /*, FeedView = require("./Feed")*/;

module.exports = Backbone.Marionette.LayoutView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: "stats",
  template: template,

  regions:{
    "counts": ".counts-ctn",
    "feed": ".feed-ctn"
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  onRender: function(){
    this.counts.show(new CountsView());

/*
    this.feed.show(

      new FeedView({

        collection: new Backbone.Collection(
          [{
            user: {
              _id: "54909d0f7fd3d5704c0006c6",
              name: "Alvaro Graves",
              picture: "//www.gravatar.com/avatar/5d79ff6eb94d9754235c7bad525bee81?s=73"
            },
            title: "Is now a collaborator on:",
            description: "una mañana tras un sueño intranquilo Gregorio Samsa",
            created_at: "2014-12-16T20:58:55.225Z"
          },{
            user: {
              _id: "54909d0f7fd3d5704c0006c6",
              name: "Alvaro Graves",
              picture: "//www.gravatar.com/avatar/5d79ff6eb94d9754235c7bad525bee81?s=73"
            },
            title: "Is now a collaborator on:",
            description: "una mañana tras un sueño intranquilo Gregorio Samsa",
            created_at: "2014-12-16T20:58:55.225Z"
          },{
            user: {
              _id: "54909d0f7fd3d5704c0006c6",
              name: "Alvaro Graves",
              picture: "//www.gravatar.com/avatar/5d79ff6eb94d9754235c7bad525bee81?s=73"
            },
            title: "Is now a collaborator on:",
            description: "una mañana tras un sueño intranquilo Gregorio Samsa",
            created_at: "2014-12-16T20:58:55.225Z"
          },{
            user: {
              _id: "54909d0f7fd3d5704c0006c6",
              name: "Alvaro Graves",
              picture: "//www.gravatar.com/avatar/5d79ff6eb94d9754235c7bad525bee81?s=73"
            },
            title: "Is now a collaborator on:",
            description: "una mañana tras un sueño intranquilo Gregorio Samsa",
            created_at: "2014-12-16T20:58:55.225Z"
          },{
            user: {
              _id: "54909d0f7fd3d5704c0006c6",
              name: "Alvaro Graves",
              picture: "//www.gravatar.com/avatar/5d79ff6eb94d9754235c7bad525bee81?s=73"
            },
            title: "Is now a collaborator on:",
            description: "una mañana tras un sueño intranquilo Gregorio Samsa",
            created_at: "2014-12-16T20:58:55.225Z"
          },{
            user: {
              _id: "54909d0f7fd3d5704c0006c6",
              name: "Alvaro Graves",
              picture: "//www.gravatar.com/avatar/5d79ff6eb94d9754235c7bad525bee81?s=73"
            },
            title: "Is now a collaborator on:",
            description: "una mañana tras un sueño intranquilo Gregorio Samsa",
            created_at: "2014-12-16T20:58:55.225Z"
          }])

      })
    );
*/
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

});
},{"./Counts":50,"./templates/stats.hbs":65}],56:[function(require,module,exports){
/**
 * VIEW: HOME Tab Layout (Search header + collection)
 *
 */

var template = require("./templates/tabContent.hbs");

// Main Views
var
    Search = require("./Search")
  , EntityList = require("./EntityList")

// Item Views
  , ProjectItemView = require('../Project/Card')
  , DashboardItemView = require('../Dashboard/Card')
  , UserItemView = require('./User')
  , CollectionView = require('./Collection')

// List Views
  , ProjectList = EntityList.extend({ childView: ProjectItemView })
  , DashboardList = EntityList.extend({ childView: DashboardItemView })
  , UserList = EntityList.extend({ childView: UserItemView })
  , CollectionList = EntityList.extend({ childView: CollectionView })

// Collection models
  , Projects = require('../../models/Projects')
  , Dashboards = require('../../models/Dashboards')
  , Collections = require('../../models/Collections')
  , Users = require('../../models/Users');

module.exports = Backbone.Marionette.LayoutView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  template: template,

  ui: {
    "loading": '.loading'
  },

  regions: {
    "header": ".header",
    "content": ".content-place"
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  initialize: function(){
    var self = this;

    function showLoading(){
      self.ui.loading.removeClass('hidden');
    }

    this.collection.on('fetch', showLoading);

    this.collection.on('reset', function(){
      self.ui.loading.addClass('hidden');
      self.collection.off('fetch', showLoading);
    });
  },

  onRender: function(){

    if (!this.header.currentView){

      this.header.show(new Search({
        collection: this.collection
      }));

      var ListView;
      if(this.collection instanceof Projects){
        ListView = ProjectList;
      }
      else if(this.collection instanceof Dashboards){
        ListView = DashboardList;
      }
      else if(this.collection instanceof Collections){
        ListView = CollectionList;
      }
      else if(this.collection instanceof Users){
        ListView = UserList;
      }

      this.content.show(new ListView({
        collection: this.collection
      }));

    }

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

});
},{"../../models/Collections":14,"../../models/Dashboards":17,"../../models/Projects":20,"../../models/Users":23,"../Dashboard/Card":29,"../Project/Card":80,"./Collection":49,"./EntityList":51,"./Search":54,"./User":57,"./templates/tabContent.hbs":66}],57:[function(require,module,exports){
/**
 * VIEW: An Dashboard of HOME Search
 *
 */

var template = require('./templates/user.hbs');
var ItemView = require('./Item.js');

module.exports = ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: 'entity user',
  template: template,

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  getURL: function(){
    return "/users/" + this.model.get("_id");
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

});
},{"./Item.js":53,"./templates/user.hbs":67}],58:[function(require,module,exports){

var template = require("./templates/home.hbs")
  , TabContent = require("./TabContent")
  , LoginView = require("../Login")
  , StatsView = require("./Stats")
  // , TeamView = require("./Team")
  // , PartnersView = require("./Partners")
  , FooterView = require("./Footer")

  // Collections
  , Dashboards = require("../../models/Dashboards")
  , Projects = require("../../models/Projects")
  , Users = require("../../models/Users")
  , Collections = require("../../models/Collections")
  , Team = require("../../models/Team");

module.exports = Backbone.Marionette.LayoutView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  template: template,

  regions:{
    // "dashboards": "#dashboards",
    "projects": "#projects",
    "users": "#users",
    // "collections": "#collections",

    "stats": ".stats-ctn",
    // "team": ".team-ctn",
    // "partners": ".partners-ctn",
    "footer": ".footer-ctn",
  },

  ui: {
    "domain": "#domain",
    "create": "#create-dashboard",
    "errorHolder": "#new-dashboard-error",

    // "dashboards": "#dashboards",
    "projects": "#projects",
    "users": "#users",
    // "collections": "#collections",

    "tabs": ".nav-tabs.landing",
    "mobileMenu": ".mobile-menu",
    "tabContent": ".tab-content"
  },

  events: {
    // "keyup @ui.domain": "validateDomain",
    // "click @ui.domain": "checkLogin",
    // "click @ui.create": "createDashboard",
    "click .up-button": "goTop",
    "click @ui.mobileMenu": "toggleMobileMenu",
    "click .continue": "clickContiune"
  },

  lists: {
    projects: null,
    dashboards: null,
    users: null,
    collections: null
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  initialize: function(options){
    this.section = (options && options.section) || "projects";

    this.hdTeam = new Team();
    this.hdTeam.fetch();
  },

  onRender: function(){

    this.changeTab();

    if (!this.ui[this.section].hasClass("active")){
      this.ui[this.section].addClass("active");
    }

    this.stats.show(new StatsView());

    // this.team.show(new TeamView({ collection: this.hdTeam }));
    // this.partners.show(new PartnersView());

    this.footer.show(new FooterView());

    var self = this;
    _.defer(function(){
      if (self.ui.mobileMenu.is(':visible')){
        self.ui.tabs.addClass('hidden');
      }
    });
  },

  getNewList: function(type){
    switch(type){
      case "dashboards": return new Dashboards();
      case "projects": return new Projects();
      case "users": return new Users();
      case "collections": return new Collections();
    }
  },

  changeTab: function(){

    if (!this[this.section].currentView){

      this.lists[this.section] =
        this.lists[this.section] || this.getNewList(this.section);

      this[this.section].show(new TabContent({
        collection: this.lists[this.section]
      }));
    }

    this.ui[this.section].tab("show");

    if (this.ui.mobileMenu.is(':visible')){
      this.ui.tabs.addClass('hidden');
    }
  },

  toggleMobileMenu: function(){
    if (this.ui.mobileMenu.is(':visible')){
      if (this.ui.tabs.hasClass('hidden')){
        this.ui.tabs.removeClass('hidden');
      }
      else {
        this.ui.tabs.addClass('hidden');
      }
    }
  },

  clickContiune: function(){
    this.animateScroll(true);
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  setSection: function(section){
    this.section = section;
    this.changeTab();
    this.animateScroll();
  },

  errors: {
    "subdomain_invalid": __("5 to 10 chars, no spaces or special"),
    "subdomain_inuse": __("Sorry, that one is in use. Try another one.")
  },

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  checkLogin: function(){
    if (window.hackdash.user){
      return true;
    }

    var providers = window.hackdash.providers;
    var app = window.hackdash.app;

    app.modals.show(new LoginView({
      model: new Backbone.Model({ providers: providers })
    }));

    return false;
  },

  validateDomain: function(){
    if (this.checkLogin()){
      var name = this.ui.domain.val();
      this.cleanErrors();

      if(/^[a-z0-9]{5,10}$/.test(name)) {
        this.cleanErrors();
      } else {
        this.ui.errorHolder
          .removeClass('hidden')
          .text(this.errors.subdomain_invalid);
      }
    }
  },

  createDashboard: function(){
    if (this.checkLogin()){
      var domain = this.ui.domain.val();

      this.cleanErrors();

      this.ui.create.button('loading');

      var dash = new Dashboards([]);

      dash.create({ domain: domain }, {
        success: this.redirectToSubdomain.bind(this, domain),
        error: this.showError.bind(this)
      });
    }
  },

  showError: function(view, err){
    this.ui.create.button('reset');

    if (err.responseText === "OK"){
      this.redirectToSubdomain(this.ui.domain.val());
      return;
    }

    var error = JSON.parse(err.responseText).error;
    this.ui.errorHolder
      .removeClass('hidden')
      .text(this.errors[error]);
  },

  cleanErrors: function(){
    this.ui.errorHolder.addClass('hidden').text('');
  },

  goTop: function(){
    this.footer.currentView.goTop();
  },

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

  animateScroll: function(animate){
    if (this.section){

      var isMobile = this.ui.mobileMenu.is(':visible');

      var top = this.ui.tabs.offset().top + 60;
      var offset = this.ui.tabs.height();

      if (isMobile){
        top = this.ui.tabContent.offset().top;
        offset = 0;
      }

      var pos = (top - offset >= 0 ? top - offset : 0);

      if (animate){
        $("html, body").animate({ scrollTop: pos }, 1500, 'swing');
        return;
      }

      $(window).scrollTop(pos);
    }
  },

  redirectToSubdomain: function(name){
    window.location = '/dashboards/' + name;
  },

  isEnterKey: function(e){
    var key = e.keyCode || e.which;
    return (key === 13);
  }

});

},{"../../models/Collections":14,"../../models/Dashboards":17,"../../models/Projects":20,"../../models/Team":21,"../../models/Users":23,"../Login":68,"./Footer":52,"./Stats":55,"./TabContent":56,"./templates/home.hbs":62}],59:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "  <i class=\"item-letter\">"
    + escapeExpression(((helpers.firstLetter || (depth0 && depth0.firstLetter) || helperMissing).call(depth0, (depth0 != null ? depth0.title : depth0), {"name":"firstLetter","hash":{},"data":data})))
    + "</i>\n";
},"3":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "  <i class=\"item-letter\">"
    + escapeExpression(((helpers.firstLetter || (depth0 && depth0.firstLetter) || helperMissing).call(depth0, (depth0 != null ? depth0.domain : depth0), {"name":"firstLetter","hash":{},"data":data})))
    + "</i>\n";
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, lambda=this.lambda, buffer = "<div class=\"cover\">\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.title : depth0), {"name":"if","hash":{},"fn":this.program(1, data),"inverse":this.program(3, data),"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "</div>\n\n<div class=\"details\">\n  <div>\n    <h2>"
    + escapeExpression(((helper = (helper = helpers.title || (depth0 != null ? depth0.title : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"title","hash":{},"data":data}) : helper)))
    + "</h2>\n    <h3 class=\"description\">\n      "
    + escapeExpression(((helper = (helper = helpers.description || (depth0 != null ? depth0.description : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"description","hash":{},"data":data}) : helper)))
    + "\n    </h3>\n  </div>\n</div>\n\n<div class=\"action-bar text-center\">\n  <i class=\"fa fa-clock-o timer\" title=\""
    + escapeExpression(((helpers.timeAgo || (depth0 && depth0.timeAgo) || helperMissing).call(depth0, (depth0 != null ? depth0.created_at : depth0), {"name":"timeAgo","hash":{},"data":data})))
    + "\"></i>\n  <span>"
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.dashboards : depth0)) != null ? stack1.length : stack1), depth0))
    + " "
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Dashboards", {"name":"__","hash":{},"data":data})))
    + "</span>\n  <!--<span>Likes 00</span>\n  <a>Share</a>-->\n</div>";
},"useData":true});

},{"hbsfy/runtime":101}],60:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "<div class=\"col-xs-12 col-sm-4 col-md-4 user releases\">\n  <h5>"
    + escapeExpression(((helper = (helper = helpers.users || (depth0 != null ? depth0.users : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"users","hash":{},"data":data}) : helper)))
    + "</h5>\n  <h6>"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "registered users", {"name":"__","hash":{},"data":data})))
    + "</h6>\n</div>\n<div class=\"col-xs-12 col-sm-4 col-md-4 project releases\">\n  <h5>"
    + escapeExpression(((helper = (helper = helpers.projects || (depth0 != null ? depth0.projects : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"projects","hash":{},"data":data}) : helper)))
    + "</h5>\n  <h6>"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "projects", {"name":"__","hash":{},"data":data})))
    + "</h6>\n</div>\n<div class=\"col-xs-12 col-sm-4 col-md-4 dashboard releases\">\n  <h5>"
    + escapeExpression(((helper = (helper = helpers.releases || (depth0 != null ? depth0.releases : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"releases","hash":{},"data":data}) : helper)))
    + "</h5>\n  <h6>"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "released projects", {"name":"__","hash":{},"data":data})))
    + "</h6>\n</div>\n";
},"useData":true});

},{"hbsfy/runtime":101}],61:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  return "<div id=\"footer\"><br/>\n  <div class=\"text-center\"><img src=\"/images/static/g0v-invert.png\"/></div>\n  <div class=\"text-center\"><a href=\"http://github.com/g0v/\" target=\"_blank\" class=\"label label-primary\"><span>Source</span></a><span> </span><a href=\"http://hack.g0v.tw\" target=\"_blank\" class=\"label label-primary\"><span>Jothon</span></a><span> </span><a href=\"http://g0v.tw\" target=\"_blank\" class=\"label label-primary\"><span class=\"g0v\">g0v</span></a><span> </span><a href=\"http://hack.g0v.tw/transaction\" target=\"_blank\" class=\"label label-primary\">本計畫收支細項 </a><span> </span><a href=\"https://github.com/impronunciable/hackdash\" target=\"_blank\" class=\"label label-primary\">Powered By Hackdash </a></div>\n</div>\n\n";
  },"useData":true});

},{"hbsfy/runtime":101}],62:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "\n<div class=\"landing-header\">\n  <div class=\"call-action\">\n    <div id=\"landing\">\n      <div class=\"inner\">\n        <img class=\"mainlogo\" src=\"/images/static/landing-banner.svg\" style=\"width:520px;margin-top:100px;\"/>\n        <img class=\"mainlogo-sm\" src=\"/images/static/landing-banner-sm.svg\"/>\n      </div>\n      <div class=\"text-center\">\n        <a id=\"create-dashboard\" class=\"btn-xl btn btn-primary\" href=\"/dashboards/2017spring\" data-bypass=\"true\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "create now", {"name":"__","hash":{},"data":data})))
    + "</a>\n        <br/>\n        <a class=\"continue\">\n          <i class=\"fa fa-angle-down\"></i>\n        </a>\n      </div>\n\n    </div>\n  </div>\n</div>\n\n<div class=\"container-fluid\">\n  <div class=\"row\">\n    <div class=\"col-md-12 text-center\">\n\n      <a class=\"btn btn-default mobile-menu visible-xs\">\n        <i class=\"fa fa-align-justify\"></i>\n      </a>\n\n      <ul class=\"nav nav-tabs landing\" role=\"tablist\">\n\n        <!--\n        <li id=\"collection\" class=\"collection\">\n          <a href=\"#collections\" role=\"tab\" data-toggle=\"tab\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Collections", {"name":"__","hash":{},"data":data})))
    + "</a>\n        </li>\n        <li id=\"dashboard\" class=\"dashboard\">\n          <a href=\"#dashboards\" role=\"tab\" data-toggle=\"tab\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Dashboards", {"name":"__","hash":{},"data":data})))
    + "</a>\n        </li>\n        -->\n        <li id=\"project\" class=\"project\">\n          <a href=\"#projects\" role=\"tab\" data-toggle=\"tab\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Projects", {"name":"__","hash":{},"data":data})))
    + "</a>\n        </li>\n        <li id=\"user\" class=\"user\">\n          <a href=\"#users\" role=\"tab\" data-toggle=\"tab\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "People", {"name":"__","hash":{},"data":data})))
    + "</a>\n        </li>\n\n      </ul>\n\n    </div>\n  </div>\n</div>\n\n<div class=\"tab-content\">\n  <!--\n  <div role=\"tabpanel\" class=\"tab-pane\" id=\"dashboards\"></div>\n  -->\n  <div role=\"tabpanel\" class=\"tab-pane\" id=\"projects\"></div>\n  <div role=\"tabpanel\" class=\"tab-pane\" id=\"users\"></div>\n  <!--\n  <div role=\"tabpanel\" class=\"tab-pane\" id=\"collections\"></div>\n  -->\n</div>\n\n<div class=\"col-md-12 stats-ctn\"></div>\n\n<div class=\"col-md-12 footer-ctn\"></div>\n";
},"useData":true});

},{"hbsfy/runtime":101}],63:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "<div>"
    + escapeExpression(((helper = (helper = helpers._id || (depth0 != null ? depth0._id : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"_id","hash":{},"data":data}) : helper)))
    + "</div>";
},"useData":true});

},{"hbsfy/runtime":101}],64:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "<div class=\"row\">\n\n  <div class=\"hidden-xs col-sm-3 col-md-4\">\n\n    <div class=\"col-sm-12 col-md-6\">\n\n      <div class=\"media\">\n        <div class=\"media-left\">\n          <i class=\"fa fa-tasks\"></i>\n        </div>\n        <div class=\"media-body\">\n          "
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Inform Progress to community.", {"name":"__","hash":{},"data":data})))
    + "\n        </div>\n      </div>\n\n    </div>\n    <div class=\"col-sm-12 col-md-6\">\n\n      <div class=\"media\">\n        <div class=\"media-left\">\n          <i class=\"fa fa-cloud-upload\"></i>\n        </div>\n        <div class=\"media-body\">\n          "
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Upload your project to the platform.", {"name":"__","hash":{},"data":data})))
    + "\n        </div>\n      </div>\n\n    </div>\n\n  </div>\n\n  <div class=\"col-xs-12 col-sm-6 col-md-4\">\n    <div class=\"input-group\">\n      <input id=\"search\" type=\"text\" class=\"form-control\" placeholder='"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "enter keywords", {"name":"__","hash":{},"data":data})))
    + "'>\n      <span class=\"input-group-btn\">\n        <button class=\"btn btn-danger\" type=\"button\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "find it", {"name":"__","hash":{},"data":data})))
    + "</button>\n      </span>\n    </div>\n  </div>\n\n  <div class=\"hidden-xs col-sm-3 col-md-4\">\n\n    <div class=\"col-sm-12 col-md-6\">\n\n      <div class=\"media\">\n        <div class=\"media-left\">\n          <i class=\"fa fa-user-plus\"></i>\n        </div>\n        <div class=\"media-body\">\n          "
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Add Collaborators to your projects.", {"name":"__","hash":{},"data":data})))
    + "\n        </div>\n      </div>\n\n    </div>\n    <div class=\"col-sm-12 col-md-6\">\n\n      <div class=\"media\">\n        <div class=\"media-left\">\n          <i class=\"fa fa-share-alt\"></i>\n        </div>\n        <div class=\"media-body\">\n          "
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Share your app to the world.", {"name":"__","hash":{},"data":data})))
    + "\n        </div>\n      </div>\n\n    </div>\n\n  </div>\n\n</div>\n";
},"useData":true});

},{"hbsfy/runtime":101}],65:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  return "<div class=\"col-md-12 counts-ctn\"></div>\n<div class=\"col-md-6 feed-ctn hidden\"></div>";
  },"useData":true});

},{"hbsfy/runtime":101}],66:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "<div class=\"container-fluid header\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "HEAD", {"name":"__","hash":{},"data":data})))
    + "</div>\n<div class=\"content\">\n  <div class=\"content-place\"></div>\n  <div class=\"loading hidden\">\n    <i class=\"fa fa-spinner fa-pulse\"></i>\n  </div>\n</div>";
},"useData":true});

},{"hbsfy/runtime":101}],67:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "<a href=\"/users/"
    + escapeExpression(((helper = (helper = helpers._id || (depth0 != null ? depth0._id : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"_id","hash":{},"data":data}) : helper)))
    + "\" data-bypass>\n  <div class=\"cover\">\n    <div class=\"item-letter\">\n      "
    + escapeExpression(((helpers.getProfileImageHex || (depth0 && depth0.getProfileImageHex) || helperMissing).call(depth0, depth0, {"name":"getProfileImageHex","hash":{},"data":data})))
    + "\n    </div>\n  </div>\n\n  <div class=\"details\">\n    <h2>"
    + escapeExpression(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"name","hash":{},"data":data}) : helper)))
    + "</h2>\n    <div class=\"description\">"
    + escapeExpression(((helper = (helper = helpers.bio || (depth0 != null ? depth0.bio : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"bio","hash":{},"data":data}) : helper)))
    + "</div>\n  </div>\n</a>";
},"useData":true});

},{"hbsfy/runtime":101}],68:[function(require,module,exports){
/**
 * VIEW: Login Modal
 *
 */

var template = require('./templates/login.hbs');

module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: "login",
  template: template,

  events: {
    "click .close": "destroy"
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  templateHelpers: {
    redirectURL: function(){
      var url = hackdash.app.previousURL || '';
      return (url.length ? '?redirect=' + url : url);
    }
  }

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

});
},{"./templates/login.hbs":90}],69:[function(require,module,exports){
/**
 * VIEW: Login Modal
 *
 */

var template = require('./templates/messageBox.hbs');

module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: "message-box",
  template: template,

  events: {
    "click .ok": "destroy",
    "click .close": "destroy"
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

});
},{"./templates/messageBox.hbs":91}],70:[function(require,module,exports){
/**
 * REGION: ModalRegion
 * Used to manage Twitter Bootstrap Modals with Backbone Marionette Views
 */

module.exports = Backbone.Marionette.Region.extend({
  el: "#modals-container",

  constructor: function(){
    Backbone.Marionette.Region.prototype.constructor.apply(this, arguments);
    this.on("show", this.showModal, this);
  },

  getEl: function(selector){
    var $el = $(selector);
    $el.on("hidden", this.destroy);
    return $el;
  },

  showModal: function(view){
    view.on("destroy", this.hideModal, this);
    this.$el.parents('.modal').modal('show');
  },

  hideModal: function(){
    this.$el.parents('.modal').modal('hide');
  }

});

},{}],71:[function(require,module,exports){
/**
 * VIEW: ProfileCard
 *
 */

var template = require('./templates/card.hbs');

module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  template: template,

  events: {
    "click .login": "showLogin"
  },

  modelEvents:{
    "change": "render"
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  showLogin: function(){
    hackdash.app.showLogin();
  },

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

});
},{"./templates/card.hbs":76}],72:[function(require,module,exports){
/**
 * VIEW: ProfileCard Edit
 *
 */

var template = require('./templates/cardEdit.hbs');

module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  template: template,

  ui: {
    "name": "input[name=name]",
    "email": "input[name=email]",
    "bio": "textarea[name=bio]",
  },

  events: {
    "click #save": "saveProfile",
    "click #cancel": "cancel"
  },

  modelEvents:{
    "change": "render"
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  saveProfile: function(){
    var toSave = {};

    _.each(this.ui, function(ele, type){
      toSave[type] = ele.val();
    }, this);

    this.cleanErrors();

    $("#save", this.$el).button('loading');

    this.model
      .save(toSave, { patch: true, silent: true })
      .error(this.showError.bind(this));
  },

  cancel: function(){
    this.exit();
  },

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

  errors: {
    "name_required": __("Name is required"),
    "email_required": __("Email is required"),
    "email_invalid": __("Invalid Email")
  },

  exit: function(){
    window.fromURL = window.fromURL || window.hackdash.getQueryVariable('from') || '';

    if (window.fromURL){
      hackdash.app.router.navigate(window.fromURL, {
        trigger: true,
        replace: true
      });

      window.fromURL = "";
      return;
    }

    window.location = "/";
  },

  showError: function(err){
    $("#save", this.$el).button('reset');

    if (err.responseText === "OK"){

      $('#cancel').addClass('hidden');
      $('#save').addClass('hidden');
      $(".saved", this.$el).removeClass('hidden').addClass('show');

      window.clearTimeout(this.timer);
      this.timer = window.setTimeout(this.exit.bind(this), 2000);

      return;
    }

    var error = JSON.parse(err.responseText).error;

    var ctrl = error.split("_")[0];
    this.ui[ctrl].parents('.control-group').addClass('error');
    this.ui[ctrl].after('<span class="help-inline">' + this.errors[error] + '</span>');
  },

  cleanErrors: function(){
    $(".error", this.$el).removeClass("error");
    $("span.help-inline", this.$el).remove();
  }

});
},{"./templates/cardEdit.hbs":77}],73:[function(require,module,exports){
/**
 * VIEW: Profile list (collection, dashboard, project)
 *
 */

var Item = require('./ListItem');

module.exports = Backbone.Marionette.CollectionView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  tagName: "ul",
  childView: Item,

  childViewOptions: function() {
    return {
      type: this.type,
      isMyProfile: this.isMyProfile
    };
  },

  showAll: true,

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  initialize: function(options){
    this.fullList = options.collection || new Backbone.Collection();
    this.type = (options && options.type) || false;
    this.isMyProfile = (options && options.isMyProfile) || false;
  },

  onBeforeRender: function(){
    if (Array.isArray(this.fullList)){
      this.fullList = new Backbone.Collection(this.fullList);
    }

    this.collection = this.fullList;
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

});
},{"./ListItem":74}],74:[function(require,module,exports){
/**
 * VIEW: Profile Item List
 *
 */

var template = require('./templates/listItem.hbs'),
  Dashboard = require('../../models/Dashboard');

module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  tagName: "li",
  template: template,

  events: {
    "click .remove-entity": "removeEntity"
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  initialize: function(options){
    this.type = (options && options.type) || "projects";
    this.isMyProfile = (options && options.isMyProfile) || false;
  },

  serializeData: function(){
    var url,
      isProject = false,
      showDelete = false;

    switch(this.type){
      case "collections":
        url = "/collections/" + this.model.get("_id");
        break;
      case "dashboards":
        url = "/dashboards/" + this.model.get("domain");
        showDelete = this.isMyProfile && Dashboard.isAdmin(this.model);
        break;
      case "projects":
      case "contributions":
      case "likes":
        url = "/projects/" + this.model.get("_id");
        isProject = true;
        break;
    }

    var showImage = (this.type === "collections" || this.type === "dashboards" ? false : true);
    if (showImage){
      showImage = this.model.get('cover');
    }

    return _.extend({
      showImage: showImage,
      isProject: isProject,
      showDelete: showDelete,
      type: this.type,
      url: url
    }, this.model.toJSON());
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  removeEntity: function(e){
    if (this.type !== "dashboards"){
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    if (!Dashboard.isAdmin(this.model)){
      this.showMessage(__("Only the Owner can remove this Dashboard."));
      return;
    }

    if (!Dashboard.isOwner(this.model)){
      this.showMessage(__("Only Dashboards with ONE admin can be removed."));
      return;
    }

    if (this.model.get(__("projectsCount")) > 0){
      this.showMessage(__("Only Dashboards without Projects can be removed."));
      return;
    }

    if (window.confirm(__('This action will remove Dashboard ') +
      this.model.get("domain") + __('. Are you sure?'))){

        var dash = new Dashboard({ domain: this.model.get('domain') });
        dash.destroy().done(function(){
          window.location.reload();
        });
    }
  },

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

  showMessage: function(msg){
    hackdash.app.showOKMessage({
      title: __("cannot_remove_dashboard", this.model.get('domain')),
      message: msg,
      type: "danger"
    });
  }

});

},{"../../models/Dashboard":16,"./templates/listItem.hbs":78}],75:[function(require,module,exports){

var
    template = require("./templates/profile.hbs")
  , ProfileCard = require("./Card")
  , ProfileCardEdit = require("./CardEdit")
  , EntityList = require("./EntityList");

module.exports = Backbone.Marionette.LayoutView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: "page-ctn profile",
  template: template,

  regions: {
    "profileCard": ".profile-card",

    "collections": "#collections",
    "dashboards": "#dashboards",
    "projects": "#projects",
    "contributions": "#contributions",
    "likes": "#likes",
  },

  ui: {
    "collections": "#collections",
    "dashboards": "#dashboards",
    "projects": "#projects",
    "contributions": "#contributions",
    "likes": "#likes",
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  initialize: function(options){
    this.section = (options && options.section) || "dashboards";
    this.isMyProfile = (hackdash.user && this.model.get("_id") === hackdash.user._id ? true : false);
  },

  onRender: function(){

    this.changeTab();

    if (!this.ui[this.section].hasClass("active")){
      this.ui[this.section].addClass("active");
    }

    if (this.isMyProfile){
      this.profileCard.show(new ProfileCardEdit({
        model: this.model
      }));
    }
    else {
      this.profileCard.show(new ProfileCard({
        model: this.model
      }));
    }

    $('.tooltips', this.$el).tooltip({});

    $('a[data-toggle="tab"]', this.$el).on('shown.bs.tab', this.setSection.bind(this));
    $('html, body').scrollTop(0);
  },

  changeTab: function(){
    if (!this[this.section].currentView){

      this[this.section].show(new EntityList({
        collection: this.model.get(this.section),
        type: this.section,
        isMyProfile: this.isMyProfile
      }));
    }

    this.ui[this.section].tab("show");
  },

  setSection: function(e){
    this.section = e.target.parentElement.id + 's';
    this.changeTab();
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

});
},{"./Card":71,"./CardEdit":72,"./EntityList":73,"./templates/profile.hbs":79}],76:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "  <p>"
    + escapeExpression(((helper = (helper = helpers.email || (depth0 != null ? depth0.email : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"email","hash":{},"data":data}) : helper)))
    + "</p>\n";
},"3":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "  <p><a class=\"login\" style=\"color: #A8A8A8;\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "[ Log in to reveal e-mail ]", {"name":"__","hash":{},"data":data})))
    + "</a></p>\n";
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, helper, options, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, functionType="function", blockHelperMissing=helpers.blockHelperMissing, buffer = "<div class=\"cover\">"
    + escapeExpression(((helpers.getProfileImageHex || (depth0 && depth0.getProfileImageHex) || helperMissing).call(depth0, depth0, {"name":"getProfileImageHex","hash":{},"data":data})))
    + "</div>\n<h1 class=\"header\">"
    + escapeExpression(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"name","hash":{},"data":data}) : helper)))
    + "</h1>\n<div class=\"profileInfo\">\n\n";
  stack1 = ((helper = (helper = helpers.isLoggedIn || (depth0 != null ? depth0.isLoggedIn : depth0)) != null ? helper : helperMissing),(options={"name":"isLoggedIn","hash":{},"fn":this.program(1, data),"inverse":this.program(3, data),"data":data}),(typeof helper === functionType ? helper.call(depth0, options) : helper));
  if (!helpers.isLoggedIn) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if (stack1 != null) { buffer += stack1; }
  return buffer + "\n  <p>"
    + escapeExpression(((helper = (helper = helpers.bio || (depth0 != null ? depth0.bio : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"bio","hash":{},"data":data}) : helper)))
    + "</p>\n</div>\n";
},"useData":true});

},{"hbsfy/runtime":101}],77:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "      <label class=\"email-info\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "email only visible for logged in users", {"name":"__","hash":{},"data":data})))
    + "</label>\n";
},"3":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "    <a id=\"cancel\" class=\"btn-cancel pull-left\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "cancel", {"name":"__","hash":{},"data":data})))
    + "</a>\n";
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, helper, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, functionType="function", buffer = "<h1 class=\"header edit\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Edit Your Profile", {"name":"__","hash":{},"data":data})))
    + "</h1>\n\n<div class=\"cover\">"
    + escapeExpression(((helpers.getProfileImageHex || (depth0 && depth0.getProfileImageHex) || helperMissing).call(depth0, depth0, {"name":"getProfileImageHex","hash":{},"data":data})))
    + "</div>\n\n<form>\n  <div class=\"form-content\">\n    <label class=\"profile-fields-required\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "all fields required", {"name":"__","hash":{},"data":data})))
    + "</label>\n    <div class=\"form-group\">\n      <input name=\"name\" type=\"text\" placeholder=\"Name\" value=\""
    + escapeExpression(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"name","hash":{},"data":data}) : helper)))
    + "\" class=\"form-control\"/>\n    </div>\n    <div class=\"form-group\">\n      <input name=\"email\" type=\"text\" placeholder=\"Email\" value=\""
    + escapeExpression(((helper = (helper = helpers.email || (depth0 != null ? depth0.email : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"email","hash":{},"data":data}) : helper)))
    + "\" class=\"form-control\"/>\n";
  stack1 = helpers.unless.call(depth0, (depth0 != null ? depth0.email : depth0), {"name":"unless","hash":{},"fn":this.program(1, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "    </div>\n    <div class=\"form-group\">\n      <textarea name=\"bio\" placeholder='"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Some about you", {"name":"__","hash":{},"data":data})))
    + "' class=\"form-control\" rows=\"4\">"
    + escapeExpression(((helper = (helper = helpers.bio || (depth0 != null ? depth0.bio : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"bio","hash":{},"data":data}) : helper)))
    + "</textarea>\n    </div>\n  </div>\n  <div class=\"form-actions\">\n    <input id=\"save\" type=\"button\" data-loading-text='"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "saving...", {"name":"__","hash":{},"data":data})))
    + "' value='"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Save profile", {"name":"__","hash":{},"data":data})))
    + "' class=\"btn-primary pull-right\"/>\n    <label class=\"saved pull-left hidden\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Profile saved, going back to business ...", {"name":"__","hash":{},"data":data})))
    + "</label>\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.email : depth0), {"name":"if","hash":{},"fn":this.program(3, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "  </div>\n</form>";
},"useData":true});

},{"hbsfy/runtime":101}],78:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "        <div class=\"progress\" title=\""
    + escapeExpression(((helper = (helper = helpers.status || (depth0 != null ? depth0.status : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"status","hash":{},"data":data}) : helper)))
    + "\">\n          <div class=\"progress-bar progress-bar-success progress-bar-striped "
    + escapeExpression(((helper = (helper = helpers.status || (depth0 != null ? depth0.status : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"status","hash":{},"data":data}) : helper)))
    + "\" role=\"progressbar\">\n          </div>\n        </div>\n";
},"3":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "        <img src=\""
    + escapeExpression(((helper = (helper = helpers.cover || (depth0 != null ? depth0.cover : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"cover","hash":{},"data":data}) : helper)))
    + "\" style=\"width: 64px; height: 64px;\">\n";
},"5":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "        <i class=\"item-letter\">"
    + escapeExpression(((helpers.firstLetter || (depth0 && depth0.firstLetter) || helperMissing).call(depth0, (depth0 != null ? depth0.title : depth0), {"name":"firstLetter","hash":{},"data":data})))
    + "</i>\n";
},"7":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "    <button class=\"remove-entity pull-right\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Remove", {"name":"__","hash":{},"data":data})))
    + "</button>\n";
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, buffer = "<a class=\""
    + escapeExpression(((helper = (helper = helpers.type || (depth0 != null ? depth0.type : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"type","hash":{},"data":data}) : helper)))
    + "\" href=\""
    + escapeExpression(((helper = (helper = helpers.url || (depth0 != null ? depth0.url : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"url","hash":{},"data":data}) : helper)))
    + "\">\n  <div class=\"well media\">\n    <div class=\"media-left\">\n\n      <div class=\"cover\">\n\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.isProject : depth0), {"name":"if","hash":{},"fn":this.program(1, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.showImage : depth0), {"name":"if","hash":{},"fn":this.program(3, data),"inverse":this.program(5, data),"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "\n      </div>\n\n    </div>\n\n    <div class=\"media-body\">\n\n      <h4 class=\"media-heading\">"
    + escapeExpression(((helper = (helper = helpers.title || (depth0 != null ? depth0.title : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"title","hash":{},"data":data}) : helper)))
    + "</h4>\n      <p>"
    + escapeExpression(((helper = (helper = helpers.description || (depth0 != null ? depth0.description : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"description","hash":{},"data":data}) : helper)))
    + "</p>\n\n    </div>\n\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.showDelete : depth0), {"name":"if","hash":{},"fn":this.program(7, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "  </div>\n</a>";
},"useData":true});

},{"hbsfy/runtime":101}],79:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(depth0,helpers,partials,data) {
  var stack1, lambda=this.lambda, escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing;
  return "        <li id=\"collection\" class=\"collection\">\n          <a href=\"#collections\" role=\"tab\" data-toggle=\"tab\" data-bypass=\"true\">\n            <span class=\"coll-length\">"
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.collections : depth0)) != null ? stack1.length : stack1), depth0))
    + "</span>\n            <h3>"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Collections", {"name":"__","hash":{},"data":data})))
    + "</h3>\n          </a>\n        </li>\n";
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, lambda=this.lambda, escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing, buffer = "\n<div class=\"header\">\n  <div class=\"container\">\n\n    <div class=\"profile-card\"></div>\n\n    <div class=\"text-center\">\n\n      <ul class=\"nav nav-tabs\" role=\"tablist\">\n\n";
  stack1 = helpers['if'].call(depth0, ((stack1 = (depth0 != null ? depth0.collections : depth0)) != null ? stack1.length : stack1), {"name":"if","hash":{},"fn":this.program(1, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "\n        <li id=\"dashboard\" class=\"dashboard\">\n          <a href=\"#dashboards\" role=\"tab\" data-toggle=\"tab\" data-bypass=\"true\">\n            <span class=\"dash-length\">"
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.dashboards : depth0)) != null ? stack1.length : stack1), depth0))
    + "</span>\n            <h3>"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Dashboards", {"name":"__","hash":{},"data":data})))
    + "</h3>\n          </a>\n        </li>\n        <li id=\"project\" class=\"project\">\n          <a href=\"#projects\" role=\"tab\" data-toggle=\"tab\" data-bypass=\"true\">\n            <span class=\"proj-length\">"
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.projects : depth0)) != null ? stack1.length : stack1), depth0))
    + "</span>\n            <h3>"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Projects", {"name":"__","hash":{},"data":data})))
    + "</h3>\n          </a>\n        </li>\n        <li id=\"contribution\" class=\"contributions\">\n          <a href=\"#contributions\" role=\"tab\" data-toggle=\"tab\" data-bypass=\"true\">\n            <span class=\"contrib-length\">"
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.contributions : depth0)) != null ? stack1.length : stack1), depth0))
    + "</span>\n            <h3>"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Contributions", {"name":"__","hash":{},"data":data})))
    + "</h3>\n          </a>\n        </li>\n        <li id=\"like\" class=\"likes\">\n          <a href=\"#likes\" role=\"tab\" data-toggle=\"tab\" data-bypass=\"true\">\n            <span class=\"likes-length\">"
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.likes : depth0)) != null ? stack1.length : stack1), depth0))
    + "</span>\n            <h3>"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Following", {"name":"__","hash":{},"data":data})))
    + "</h3>\n          </a>\n        </li>\n\n      </ul>\n\n    </div>\n\n  </div>\n</div>\n\n<div class=\"body\">\n  <div class=\"container\">\n\n    <div class=\"tab-content\">\n      <div role=\"tabpanel\" class=\"tab-pane\" id=\"dashboards\"></div>\n      <div role=\"tabpanel\" class=\"tab-pane\" id=\"projects\"></div>\n      <div role=\"tabpanel\" class=\"tab-pane\" id=\"collections\"></div>\n      <div role=\"tabpanel\" class=\"tab-pane\" id=\"contributions\"></div>\n      <div role=\"tabpanel\" class=\"tab-pane\" id=\"likes\"></div>\n    </div>\n\n  </div>\n</div>\n";
},"useData":true});

},{"hbsfy/runtime":101}],80:[function(require,module,exports){
/**
 * VIEW: An Project of HOME Search
 *
 */

var template = require('./templates/card.hbs');
var ItemView = require('../Home/Item.js');

module.exports = ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: 'entity project',
  template: template,

  ui: {
    "switcher": ".switcher input",
    "contribute": ".contribute",
    "follow": ".follow"
  },

  events: {
    "click @ui.contribute": "onContribute",
    "click @ui.follow": "onFollow",
    "click .contributors a": "stopPropagation",
    "click .demo-link": "stopPropagation"
  },

  modelEvents: {
    "change": "render"
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  getURL: function(){

    if (this.isShowcaseMode()){
      return false;
    }

    return "/projects/" + this.model.get("_id");
  },

  afterRender: function(){
    this.$el.attr({
        "data-id": this.model.get("_id")
      , "data-name": this.model.get("title")
      , "data-date": this.model.get("created_at")
      , "data-showcase": this.model.get("showcase")
    });

    if (this.model.get("active")){
      this.$el.addClass('filter-active');
    }
    else {
      this.$el.removeClass('filter-active');
    }

    this.initSwitcher();

    if (hackdash.app.source === "embed"){
      this.$el.attr('target', '_blank');
    }
  },

  serializeData: function(){
    var me = (hackdash.user && hackdash.user._id) || '';
    var isOwner = (this.model.get('leader')._id === me ? true : false);
    var isEmbed = (window.hackdash.app.source === "embed" ? true : false);
    var contribs = this.model.get('contributors');

    var noActions = false;

    if (!isEmbed && isOwner && !this.model.get('link')){
      noActions = true;
    }

    return _.extend({
      noActions: noActions,
      isShowcaseMode: this.isShowcaseMode(),
      contributing: this.model.isContributor(),
      following: this.model.isFollower(),
      isOwner: isOwner,
      contributorsMore: contribs.length > 5 ? contribs.length-4 : 0 
    }, this.model.toJSON());
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  stopPropagation: function(e){
    e.stopPropagation();
  },

  onContribute: function(e){
    e.stopPropagation();

    if (hackdash.app.source === "embed"){
      return;
    }

    e.preventDefault();

    if (!window.hackdash.user){
      hackdash.app.showLogin();
      return;
    }

    this.ui.contribute.button('loading');
    this.model.toggleContribute();
  },

  onFollow: function(e){
    e.stopPropagation();

    if (hackdash.app.source === "embed"){
      return;
    }

    e.preventDefault();

    if (!window.hackdash.user){
      hackdash.app.showLogin();
      return;
    }

    this.ui.follow.button('loading');
    this.model.toggleFollow();
  },

  initSwitcher: function(){
    var self = this;

    if (this.ui.switcher.length > 0){
      this.ui.switcher
        .bootstrapSwitch({
          size: 'mini',
          onColor: 'success',
          offColor: 'danger',
          onSwitchChange: function(event, state){
            self.model.set("active", state);
          }
        });
    }
  },

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

  isShowcaseMode: function(){
    return hackdash.app.dashboard && hackdash.app.dashboard.isShowcaseMode;
  }

});

},{"../Home/Item.js":53,"./templates/card.hbs":85}],81:[function(require,module,exports){
/**
 * VIEW: Projects of an Instance
 *
 */

var Project = require('./Card');

module.exports = Backbone.Marionette.CollectionView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: "entities",
  childView: Project,

  collectionEvents: {
    "remove": "render",
    "sort:date": "sortByDate",
    "sort:name": "sortByName",
    "sort:showcase": "sortByShowcase"
  },

  gutter: 5,

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  initialize: function(options){
    this.showcaseMode = (options && options.showcaseMode) || false;
    this.showcaseSort = (options && options.showcaseSort) || false;
  },

  onRender: function(){
    _.defer(this.onEndRender.bind(this));
  },

  onEndRender: function(){
    this.updateGrid();
    this.refresh();
    this.trigger('ended:render');
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  updateShowcaseOrder: function(){
    var showcase = [];

    $('.entity', this.$el).sort(function (a, b) {

      var av = ( isNaN(+a.dataset.showcase) ? +a.dataset.delay : +a.dataset.showcase +1);
      var bv = ( isNaN(+b.dataset.showcase) ? +b.dataset.delay : +b.dataset.showcase +1);

      return av - bv;
    }).each(function(i, e){
      showcase.push(e.dataset.id);
    });

    return showcase;
  },

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  sortByName: function(){
    if (!this.wall){
      this.updateGrid();
    }

    this.wall.sortBy(function(a, b) {
      var at = $(a).attr('data-name').toLowerCase()
        , bt = $(b).attr('data-name').toLowerCase();

      if(at < bt) { return -1; }
      if(at > bt) { return 1; }
      return 0;

    }).filter('*');

    this.fixSize();

  },

  sortByDate: function(){
    if (!this.wall){
      this.updateGrid();
    }

    this.wall.sortBy(function(a, b) {
      var at = new Date($(a).attr('data-date'))
        , bt = new Date($(b).attr('data-date'));

      if(at > bt) { return -1; }
      if(at < bt) { return 1; }
      return 0;

    }).filter('*');

    this.fixSize();
  },

  sortByShowcase: function(){
    if (!this.wall){
      this.updateGrid();
    }

    this.wall.sortBy(function(a, b) {
      return $(a).attr('data-showcase') - $(b).attr('data-showcase');
    }).filter('.filter-active');

    this.fixSize();
  },

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

  updateGrid: function(){
    //var self = this;

    //if (!this.wall){
    //-  this.wall = new window.freewall(this.$el);
    //}
    /*
    this.wall.reset({
      draggable: this.showcaseMode,
      animate: true,
      keepOrder: false,
      selector: '.entity',
      cellW: 200,
      cellH: 300,
      gutterY: this.gutter,
      gutterX: this.gutter,
      onResize: this.refresh.bind(this),
      onComplete: function() { },
      onBlockDrop: function() {

        var cols = self.$el.attr('data-total-col');
        var pos = $(this).attr('data-position');
        var ps = pos.split('-');

        var row = parseInt(ps[0],10);
        var showcase = ((row*cols) + parseInt(ps[1],10));

        $(this).attr('data-showcase', showcase+1);
        self.model.isDirty = true;
      }
    });
    */
    if (this.showcaseMode){
      this.$el.addClass("showcase");
      this.sortByShowcase();
      return;
    }

    this.sortByDate();

  },

  refresh: function(){
    //this.wall.fitWidth();
    //this.wall.refresh();
    this.fixSize();
  },

  fixSize: function(){
    this.$el.height(this.$el.height() + this.gutter*4);
  },

});

},{"./Card":80}],82:[function(require,module,exports){
/**
 * VIEW: Project
 *
 */

var template = require('./templates/edit.hbs');
var headings = ["§ 請以 80 ~ 120 字簡短地說明這個專案",
 "§ 你過去參與過什麼開源開發計畫（open source project）？",
 "§ 這個計畫要解決什麼問題？",
 "§ 你為什麼要做這個計劃 （ 個人動機 ）？",
 "§ 你預計用什麼方式解決此問題？",
 "§ 這個計畫的目標對象是誰？",
 "§ 這個計畫預計跟什麼團體合作？",
 "§ 過去有作過相關主題的計畫嗎？",
 "§ 預計六個月內將花多少小時作這件事？",
 "§ 請自行定義計畫的工作里程碑與最後的驗收標準 （若沒有達成這些標準的話，我們會不給你錢喔！)",
 "§ 未來可能進一步的發展？",
 "§ 本計畫目前是否已有、或正在申請其他的資金來源？若有，請說明申請本獎助的內容與原計畫的差異。",
 "§ 若有專案介紹的投影片，請提供：",
];

function markdownValidator(text) {
  var parse = require("markdown-to-ast").parse;
  var expected_headings = headings.slice(0);

  var AST = parse(text);
  var current_heading;
  var has_content = {};
  for (var i in AST.children) { if (true) {
    var node = AST.children[i];
    if (node.type === "Header" && node.depth === 1) {
      if (node.children[0].raw === expected_headings[0]) {
        current_heading = expected_headings[0];
        has_content[current_heading] = false;
        expected_headings.shift();
      }
    }
    else {
      if (current_heading) {
        has_content[current_heading] = true;
      }
    }
  } }

  for (var j in headings) { if (true) {
    var heading = headings[j];
    if (has_content[heading] !== undefined) {
      if (!has_content[heading]) {
        return heading + ' is empty';
      }
    }
    else {
      return heading + ' is missing';
    }
  } }
}

module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: "page-ctn project edition",
  template: template,

  ui: {
    "title": "input[name=title]",
    "description": "textarea[name=description]",
    "link": "input[name=link]",
    "tags": "input[name=tags]",
    "status": "select[name=status]",
    "errorCover": ".error-cover"
  },

  events: {
    "keyup @ui.description": "validateDescription",
    "click #ghImportBtn": "showGhImport",
    "click #searchGh": "searchRepo",

    "click #save": "save",
    "click #cancel": "cancel"
  },

  templateHelpers: {
    getTags: function(){
      if (this.tags){
        return this.tags.join(',');
      }
    },
    statuses: function(){
      return window.hackdash.statuses;
    }
  },

  modelEvents: {
    "change": "render"
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  onShow: function(){
    if (!this.ui.description.val().length && this.model.get('domain') !== 'news') {
      this.ui.description.val( '# ' + headings.join("\n\n# ") );
    }
    this.initSelect2();
    this.initImageDrop();
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------
  validateDescription: function(){
    if (this.model.get('domain') === 'news') {
      return;
    }

    var description = this.ui.description.val();
    this.cleanErrors();

    var err = markdownValidator(description);
    if (err) {
      this.showMarkdownError(err);
    } else {
      this.cleanErrors();
    }
  },

  showGhImport: function(e){
    $(".gh-import", this.$el).removeClass('hide');
    this.ui.description.css('margin-top', '30px');
    e.preventDefault();
  },

  searchRepo: function(e){
    var $repo = $("#txt-repo", this.$el),
      $btn = $("#searchGh", this.$el),
      repo = $repo.val();

    $repo.removeClass('btn-danger');
    $btn.button('loading');

    if(repo.length) {
      $.ajax({
        url: 'https://api.github.com/repos/' + repo,
        dataType: 'json',
        contentType: 'json',
        context: this
      })
      .done(this.fillGhProjectForm)
      .error(function(){
        $repo.addClass('btn-danger');
        $btn.button('reset');
      });
    }
    else {
      $repo.addClass('btn-danger');
      $btn.button('reset');
    }

    e.preventDefault();
  },

  save: function(){

    var toSave = {
      title: this.ui.title.val(),
      description: this.ui.description.val(),
      link: this.ui.link.val(),
      tags: this.ui.tags.val().split(','),
      status: this.ui.status.val(),
      cover: this.model.get('cover')
    };

    this.cleanErrors();
    if (this.model.get('domain') !== 'news') {
      var err = markdownValidator(this.ui.description.val());
      if (err) {
        this.showMarkdownError(err);
        return;
      }
    }

    $("#save", this.$el).button('loading');

    this.model
      .save(toSave, { patch: true, silent: true })
      .success(this.redirect.bind(this))
      .error(this.showError.bind(this));
  },

  cancel: function(){
    this.redirect();
  },

  redirect: function(){
    var url = "/dashboards/" + this.model.get('domain');

    if (!this.model.isNew()){
      url = "/projects/" + this.model.get('_id');
    }

    hackdash.app.router.navigate(url, { trigger: true, replace: true });
  },

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

  errors: {
    "title_required": __("Title is required"),
    "description_required": __("Description is required"),
    "description_invalid": __("Description is invalid")
  },

  showError: function(err){
    $("#save", this.$el).button('reset');

    if (err.responseText === "OK"){
      this.redirect();
      return;
    }

    var error = JSON.parse(err.responseText).error;

    var ctrl = error.split("_")[0];
    this.ui[ctrl].parents('.control-group').addClass('error');
    this.ui[ctrl].after('<span class="help-inline">' + this.errors[error] + '</span>');
  },

  showMarkdownError: function(error){
    $("#save", this.$el).button('reset');

    var ctrl = 'description';
    this.ui[ctrl].parents('.control-group').addClass('error');
    this.ui[ctrl].after('<span class="help-inline">' + error + '</span>');
  },

  cleanErrors: function(){
    $(".error", this.$el).removeClass("error");
    $("span.help-inline", this.$el).remove();
  },

  initSelect2: function(){
    if (this.model.get('status')){
      this.ui.status.val(this.model.get('status'));
    }

    this.ui.status.select2({
      minimumResultsForSearch: 10
    });


    $('a.select2-choice').attr('href', null);

    this.ui.tags.select2({
      tags:[],
      formatNoMatches: function(){ return ''; },
      maximumInputLength: 20,
      tokenSeparators: [","]
    });
  },

  initImageDrop: function(){
    var self = this;
    var $dragdrop = $('#dragdrop', this.$el);

    var coverZone = new Dropzone("#dragdrop", {
      url: hackdash.apiURL + '/projects/cover',
      paramName: 'cover',
      maxFiles: 1,
      maxFilesize: 0.5, // MB
      acceptedFiles: 'image/jpeg,image/png,image/gif',
      uploadMultiple: false,
      clickable: true,
      dictDefaultMessage: __('Drop Image Here'),
      dictFileTooBig: __('File is too big, 500 Kb is the max'),
      dictInvalidFileType: __('Only jpg, png and gif are allowed')
    });

    coverZone.on("error", function(file, message) {
      self.ui.errorCover.removeClass('hidden').text(message);
    });

    coverZone.on("complete", function(file) {
      if (!file.accepted){
        coverZone.removeFile(file);
        return;
      }

      self.ui.errorCover.addClass('hidden').text('');

      var url = JSON.parse(file.xhr.response).href;
      self.model.set({ "cover": url }, { silent: true });

      coverZone.removeFile(file);

      $dragdrop
        .css('background-image', 'url(' + url + ')');

      $('.dz-message span', $dragdrop).css('opacity', '0.6');

    });
  },

  fillGhProjectForm: function(project) {
    this.ui.title.val(project.name);
    this.ui.description.text(project.description);
    this.ui.link.val(project.html_url);
    this.ui.tags.select2("data", [{id: project.language, text:project.language}]);
    this.ui.status.select2("val", "building");

    $("#searchGh", this.$el).button('reset');
    $("#txt-repo", this.$el).val('');
  }

});

},{"./templates/edit.hbs":86,"markdown-to-ast":125}],83:[function(require,module,exports){
/**
 * VIEW: Full Project view
 *
 */

var template = require("./templates/full.hbs")
  , Sharer = require("../Sharer");

module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  id: function(){
    return this.model.get("_id");
  },

  className: "page-ctn project",
  template: template,

  templateHelpers: {
    showActions: function(){
      if (hackdash.user && this.leader){
        return hackdash.user._id !== this.leader._id;
      }
      return false;
    },
    isAdminOrLeader: function(){
      var user = hackdash.user;
      if (this.leader && user){
        return user._id === this.leader._id || user.admin_in.indexOf(this.domain) >= 0;
      }
      return false;
    }
  },

  ui: {
    "contribute": ".contributor a",
    "follow": ".follower a",
    "shareLink": '.share'
  },

  events: {
    "click @ui.contribute": "onContribute",
    "click @ui.follow": "onFollow",
    "click .remove a": "onRemove",
    "click .login": "showLogin",
    "click .share": "showShare",
  },

  modelEvents: {
    "change": "render"
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  onRender: function(){
    this.$el.addClass(this.model.get("status"));
    $(".tooltips", this.$el).tooltip({});
    if (hackdash.discourseUrl) {
      $.getScript("/js/discourse.js");
    }
    if (hackdash.disqus_shortname) {
      $.getScript("/js/disqus.js");
    }

    $('html, body').scrollTop(0);
  },

  serializeData: function(){
    return _.extend({
      contributing: this.model.isContributor(),
      following: this.model.isFollower()
    }, this.model.toJSON());
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  onContribute: function(e){
    this.ui.contribute.button('loading');
    this.model.toggleContribute();
    e.preventDefault();
  },

  onFollow: function(e){
    this.ui.follow.button('loading');
    this.model.toggleFollow();
    e.preventDefault();
  },

  onRemove: function(){
    if (window.confirm(__("This project is going to be deleted. Are you sure?"))){
      var domain = this.model.get('domain');
      this.model.destroy();

      hackdash.app.router.navigate("/dashboards/" + domain, {
        trigger: true,
        replace: true
      });
    }
  },

  showLogin: function(){
    hackdash.app.showLogin();
  },

  showShare: function(e){
    var el = $(e.target);
    Sharer.show(el, {
      type: 'project',
      model: this.model
    });
  },

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

});
},{"../Sharer":89,"./templates/full.hbs":87}],84:[function(require,module,exports){
/**
 * VIEW: Login Modal
 *
 */

var template = require('./templates/share.hbs');

module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: "share",
  template: template,

  ui: {
    'prg': '#prg',
    'pic': '#pic',
    'title': '#title',
    'desc': '#desc',
    'contrib': '#contrib',
    'acnbar': '#acnbar',

    'preview': '.preview iframe',
    'code': '#embed-code'
  },

  events: {
    "click .close": "destroy",
    "click .checkbox": "onClickSetting"
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  initialize: function(){
    this.embedTmpl = _.template('<iframe src="<%= url %>" width="100%" height="450" frameborder="0" allowtransparency="true" title="Hackdash"></iframe>');
  },

  onRender: function(){
    this.reloadPreview();
  },

  serializeData: function(){
    return _.extend({
      settings: this.settings
    }, this.model.toJSON());
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  hiddenSettings: [],

  onClickSetting: function(e){
    var ele = $('input', e.currentTarget);
    var id = ele.attr('id');
    var checked = $(ele).is(':checked');
    var idx = this.hiddenSettings.indexOf(id);

    if (checked){
      if(idx > -1){
        this.hiddenSettings.splice(idx, 1);
        this.reloadPreview();
      }
      return;
    }

    if (idx === -1){
      this.hiddenSettings.push(id);
      this.reloadPreview();
    }
  },

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

  reloadPreview: function(){
    var embedUrl = window.location.protocol + "//" + window.location.host;
    var fragment = '/embed/projects/' + this.model.get('_id');
    var hide = '?hide=';

    _.each(this.hiddenSettings, function(id){
      hide += id + ',';
    }, this);

    var url = embedUrl + fragment + (this.hiddenSettings.length ? hide : '');

    this.ui.preview.attr('src', url);
    this.ui.code.val(this.embedTmpl({ url: url }));
  },

  settings: [{
    code: 'prg',
    name: __('Progress')
  }, {
    code: 'pic',
    name: __('Picture')
  }, {
    code: 'title',
    name: __('Title')
  }, {
    code: 'desc',
    name: __('Description')
  }, {
    code: 'contrib',
    name: __('Contributors')
  }, {
    code: 'acnbar',
    name: __('Action Bar')
  }]

});
},{"./templates/share.hbs":88}],85:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "  <div class=\"item-cover\" style=\"background-image: url("
    + escapeExpression(((helper = (helper = helpers.cover || (depth0 != null ? depth0.cover : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"cover","hash":{},"data":data}) : helper)))
    + ");\"></div>\n";
},"3":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "  <i class=\"item-letter\">"
    + escapeExpression(((helpers.firstLetter || (depth0 && depth0.firstLetter) || helperMissing).call(depth0, (depth0 != null ? depth0.title : depth0), {"name":"firstLetter","hash":{},"data":data})))
    + "</i>\n";
},"5":function(depth0,helpers,partials,data) {
  return "target=\"_blank\"";
  },"7":function(depth0,helpers,partials,data) {
  return "data-bypass";
  },"9":function(depth0,helpers,partials,data) {
  return "no-actions";
  },"11":function(depth0,helpers,partials,data,depths) {
  var stack1, helper, options, helperMissing=helpers.helperMissing, lambda=this.lambda, escapeExpression=this.escapeExpression, functionType="function", blockHelperMissing=helpers.blockHelperMissing, buffer = "\n";
  stack1 = ((helpers.each_upto || (depth0 && depth0.each_upto) || helperMissing).call(depth0, (depth0 != null ? depth0.contributors : depth0), 4, {"name":"each_upto","hash":{},"fn":this.program(12, data, depths),"inverse":this.noop,"data":data}));
  if (stack1 != null) { buffer += stack1; }
  buffer += "    <li class=\"contrib-plus\">\n      <a href=\"/projects/"
    + escapeExpression(lambda((depths[1] != null ? depths[1]._id : depths[1]), depth0))
    + "\"\n";
  stack1 = ((helper = (helper = helpers.isEmbed || (depth0 != null ? depth0.isEmbed : depth0)) != null ? helper : helperMissing),(options={"name":"isEmbed","hash":{},"fn":this.program(13, data, depths),"inverse":this.program(15, data, depths),"data":data}),(typeof helper === functionType ? helper.call(depth0, options) : helper));
  if (!helpers.isEmbed) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if (stack1 != null) { buffer += stack1; }
  return buffer + ">\n        "
    + escapeExpression(((helper = (helper = helpers.contributorsMore || (depth0 != null ? depth0.contributorsMore : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"contributorsMore","hash":{},"data":data}) : helper)))
    + "+\n      </a>\n    </li>\n\n";
},"12":function(depth0,helpers,partials,data) {
  var stack1, helper, options, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, blockHelperMissing=helpers.blockHelperMissing, buffer = "    <li>\n      <a href=\"/users/"
    + escapeExpression(((helper = (helper = helpers._id || (depth0 != null ? depth0._id : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"_id","hash":{},"data":data}) : helper)))
    + "\"\n";
  stack1 = ((helper = (helper = helpers.isEmbed || (depth0 != null ? depth0.isEmbed : depth0)) != null ? helper : helperMissing),(options={"name":"isEmbed","hash":{},"fn":this.program(13, data),"inverse":this.program(15, data),"data":data}),(typeof helper === functionType ? helper.call(depth0, options) : helper));
  if (!helpers.isEmbed) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if (stack1 != null) { buffer += stack1; }
  return buffer + ">\n        "
    + escapeExpression(((helpers.getProfileImage || (depth0 && depth0.getProfileImage) || helperMissing).call(depth0, depth0, {"name":"getProfileImage","hash":{},"data":data})))
    + "\n      </a>\n    </li>\n";
},"13":function(depth0,helpers,partials,data) {
  return "        target=\"_blank\"\n";
  },"15":function(depth0,helpers,partials,data) {
  var stack1, helper, options, functionType="function", helperMissing=helpers.helperMissing, blockHelperMissing=helpers.blockHelperMissing, buffer = "        ";
  stack1 = ((helper = (helper = helpers.isLandingView || (depth0 != null ? depth0.isLandingView : depth0)) != null ? helper : helperMissing),(options={"name":"isLandingView","hash":{},"fn":this.program(7, data),"inverse":this.noop,"data":data}),(typeof helper === functionType ? helper.call(depth0, options) : helper));
  if (!helpers.isLandingView) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if (stack1 != null) { buffer += stack1; }
  return buffer + "\n      ";
},"17":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, buffer = "\n";
  stack1 = ((helpers.each_upto || (depth0 && depth0.each_upto) || helperMissing).call(depth0, (depth0 != null ? depth0.contributors : depth0), 5, {"name":"each_upto","hash":{},"fn":this.program(12, data),"inverse":this.noop,"data":data}));
  if (stack1 != null) { buffer += stack1; }
  return buffer + "\n";
},"19":function(depth0,helpers,partials,data) {
  var stack1, helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, lambda=this.lambda;
  return "    <a href=\"/projects/"
    + escapeExpression(((helper = (helper = helpers._id || (depth0 != null ? depth0._id : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"_id","hash":{},"data":data}) : helper)))
    + "\"\n      class=\"tooltips contribute\" target=\"_blank\"\n      data-original-title=\""
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.contributors : depth0)) != null ? stack1.length : stack1), depth0))
    + " contributors\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Join", {"name":"__","hash":{},"data":data})))
    + "</a>\n    <a href=\"/projects/"
    + escapeExpression(((helper = (helper = helpers._id || (depth0 != null ? depth0._id : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"_id","hash":{},"data":data}) : helper)))
    + "\"\n      class=\"tooltips follow\" target=\"_blank\"\n      data-original-title=\""
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.followers : depth0)) != null ? stack1.length : stack1), depth0))
    + " followers\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Follow", {"name":"__","hash":{},"data":data})))
    + "</a>\n";
},"21":function(depth0,helpers,partials,data) {
  var stack1, buffer = "\n";
  stack1 = helpers.unless.call(depth0, (depth0 != null ? depth0.isOwner : depth0), {"name":"unless","hash":{},"fn":this.program(22, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "\n";
},"22":function(depth0,helpers,partials,data) {
  var stack1, buffer = "";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.contributing : depth0), {"name":"if","hash":{},"fn":this.program(23, data),"inverse":this.program(25, data),"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.following : depth0), {"name":"if","hash":{},"fn":this.program(27, data),"inverse":this.program(29, data),"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer;
},"23":function(depth0,helpers,partials,data) {
  var stack1, lambda=this.lambda, escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing;
  return "      <a\n        class=\"tooltips contribute\"\n        data-loading-text=\"leaving...\"\n        data-original-title=\""
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.contributors : depth0)) != null ? stack1.length : stack1), depth0))
    + " contributors\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Leave", {"name":"__","hash":{},"data":data})))
    + "</a>\n";
},"25":function(depth0,helpers,partials,data) {
  var stack1, lambda=this.lambda, escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing;
  return "      <a\n        class=\"tooltips contribute\"\n        data-loading-text=\"joining...\"\n        data-original-title=\""
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.contributors : depth0)) != null ? stack1.length : stack1), depth0))
    + " contributors\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Join", {"name":"__","hash":{},"data":data})))
    + "</a>\n";
},"27":function(depth0,helpers,partials,data) {
  var stack1, lambda=this.lambda, escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing;
  return "      <a\n        class=\"tooltips follow\"\n        data-loading-text=\"unfollowing...\"\n        data-original-title=\""
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.followers : depth0)) != null ? stack1.length : stack1), depth0))
    + " followers\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Unfollow", {"name":"__","hash":{},"data":data})))
    + "</a>\n";
},"29":function(depth0,helpers,partials,data) {
  var stack1, lambda=this.lambda, escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing;
  return "      <a\n        class=\"tooltips follow\"\n        data-loading-text=\"following...\"\n        data-original-title=\""
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.followers : depth0)) != null ? stack1.length : stack1), depth0))
    + " followers\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Follow", {"name":"__","hash":{},"data":data})))
    + "</a>\n";
},"31":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "  <a class=\"demo-link\" href=\""
    + escapeExpression(((helper = (helper = helpers.link || (depth0 != null ? depth0.link : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"link","hash":{},"data":data}) : helper)))
    + "\" target=\"_blank\" data-bypass>"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Demo", {"name":"__","hash":{},"data":data})))
    + "</a>\n";
},"33":function(depth0,helpers,partials,data) {
  var stack1, buffer = "";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.isShowcaseMode : depth0), {"name":"if","hash":{},"fn":this.program(34, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer;
},"34":function(depth0,helpers,partials,data) {
  var stack1, buffer = "\n  <div class=\"switcher tooltips\" data-placement=\"top\" data-original-title=\"Toggle visibility\">\n    <input type=\"checkbox\" ";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.active : depth0), {"name":"if","hash":{},"fn":this.program(35, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + " class=\"switch-small\">\n  </div>\n\n";
},"35":function(depth0,helpers,partials,data) {
  return "checked";
  },"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data,depths) {
  var stack1, helper, options, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, blockHelperMissing=helpers.blockHelperMissing, buffer = "\n<div class=\"progress\" title=\""
    + escapeExpression(((helper = (helper = helpers.status || (depth0 != null ? depth0.status : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"status","hash":{},"data":data}) : helper)))
    + "\">\n  <div class=\"progress-bar progress-bar-success progress-bar-striped "
    + escapeExpression(((helper = (helper = helpers.status || (depth0 != null ? depth0.status : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"status","hash":{},"data":data}) : helper)))
    + "\" role=\"progressbar\">\n  </div>\n</div>\n\n<div class=\"cover\">\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.cover : depth0), {"name":"if","hash":{},"fn":this.program(1, data, depths),"inverse":this.program(3, data, depths),"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "</div>\n\n<div class=\"details\">\n  <div>\n    <h2>"
    + escapeExpression(((helper = (helper = helpers.title || (depth0 != null ? depth0.title : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"title","hash":{},"data":data}) : helper)))
    + "</h2>\n    <h3><a href=\"/dashboards/"
    + escapeExpression(((helper = (helper = helpers.domain || (depth0 != null ? depth0.domain : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"domain","hash":{},"data":data}) : helper)))
    + "\"\n      ";
  stack1 = ((helper = (helper = helpers.isEmbed || (depth0 != null ? depth0.isEmbed : depth0)) != null ? helper : helperMissing),(options={"name":"isEmbed","hash":{},"fn":this.program(5, data, depths),"inverse":this.program(7, data, depths),"data":data}),(typeof helper === functionType ? helper.call(depth0, options) : helper));
  if (!helpers.isEmbed) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if (stack1 != null) { buffer += stack1; }
  buffer += ">"
    + escapeExpression(((helper = (helper = helpers.domain || (depth0 != null ? depth0.domain : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"domain","hash":{},"data":data}) : helper)))
    + "</a></h3>\n    <p class=\"description\">"
    + escapeExpression(((helper = (helper = helpers.description || (depth0 != null ? depth0.description : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"description","hash":{},"data":data}) : helper)))
    + "</p>\n  </div>\n</div>\n\n<ul class=\"contributors ";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.noActions : depth0), {"name":"if","hash":{},"fn":this.program(9, data, depths),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "\">\n\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.contributorsMore : depth0), {"name":"if","hash":{},"fn":this.program(11, data, depths),"inverse":this.program(17, data, depths),"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "</ul>\n\n<div class=\"action-bar text-right ";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.noActions : depth0), {"name":"if","hash":{},"fn":this.program(9, data, depths),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "\">\n\n  <i class=\"fa fa-clock-o timer tooltips\"\n    data-original-title=\""
    + escapeExpression(((helpers.timeAgo || (depth0 && depth0.timeAgo) || helperMissing).call(depth0, (depth0 != null ? depth0.created_at : depth0), {"name":"timeAgo","hash":{},"data":data})))
    + "\"></i>\n\n  <div class=\"action-links\">\n\n";
  stack1 = ((helper = (helper = helpers.isEmbed || (depth0 != null ? depth0.isEmbed : depth0)) != null ? helper : helperMissing),(options={"name":"isEmbed","hash":{},"fn":this.program(19, data, depths),"inverse":this.program(21, data, depths),"data":data}),(typeof helper === functionType ? helper.call(depth0, options) : helper));
  if (!helpers.isEmbed) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if (stack1 != null) { buffer += stack1; }
  buffer += "\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.link : depth0), {"name":"if","hash":{},"fn":this.program(31, data, depths),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "\n  </div>\n\n</div>\n\n";
  stack1 = ((helper = (helper = helpers.isLoggedIn || (depth0 != null ? depth0.isLoggedIn : depth0)) != null ? helper : helperMissing),(options={"name":"isLoggedIn","hash":{},"fn":this.program(33, data, depths),"inverse":this.noop,"data":data}),(typeof helper === functionType ? helper.call(depth0, options) : helper));
  if (!helpers.isLoggedIn) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if (stack1 != null) { buffer += stack1; }
  return buffer;
},"useData":true,"useDepths":true});

},{"hbsfy/runtime":101}],86:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "    <div id=\"ghImportHolder\" class=\"hidden-xs\">\n\n      <div class=\"project-link\">\n        <a id=\"ghImportBtn\" >\n          <label>"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Import Project", {"name":"__","hash":{},"data":data})))
    + "</label>\n          <div>\n            <i class=\"fa fa-github\"></i>\n            <span class=\"github\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "GitHub", {"name":"__","hash":{},"data":data})))
    + "</span>\n          </div>\n        </a>\n      </div>\n\n      <div class=\"gh-import input-group col-md-4 hide\">\n        <input id=\"txt-repo\" type=\"text\" class=\"form-control\" placeholder=\"username / repository\">\n        <span class=\"input-group-btn\">\n          <button id=\"searchGh\" class=\"btn btn-blue\" type=\"button\" data-loading-text='"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "LOADING", {"name":"__","hash":{},"data":data})))
    + "'>\n            "
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "import", {"name":"__","hash":{},"data":data})))
    + "\n          </button>\n        </span>\n      </div>\n\n    </div>\n";
},"3":function(depth0,helpers,partials,data) {
  var lambda=this.lambda, escapeExpression=this.escapeExpression;
  return "              <option value=\""
    + escapeExpression(lambda(depth0, depth0))
    + "\">"
    + escapeExpression(lambda(depth0, depth0))
    + "</option>\n";
},"5":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "          style=\"background-image: url("
    + escapeExpression(((helper = (helper = helpers.cover || (depth0 != null ? depth0.cover : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"cover","hash":{},"data":data}) : helper)))
    + ");\"\n          ";
},"7":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "          href=\"/projects/"
    + escapeExpression(((helper = (helper = helpers._id || (depth0 != null ? depth0._id : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"_id","hash":{},"data":data}) : helper)))
    + "\"\n";
},"9":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "          href=\"/dashboards/"
    + escapeExpression(((helper = (helper = helpers.domain || (depth0 != null ? depth0.domain : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"domain","hash":{},"data":data}) : helper)))
    + "\"\n";
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, helper, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, functionType="function", buffer = "\n<div class=\"header\">\n  <div class=\"container\">\n    <h1>\n      <input name=\"title\" type=\"text\" placeholder='"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Project Title", {"name":"__","hash":{},"data":data})))
    + "' value=\""
    + escapeExpression(((helper = (helper = helpers.title || (depth0 != null ? depth0.title : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"title","hash":{},"data":data}) : helper)))
    + "\" class=\"form-control\"/>\n    </h1>\n    <h3 class=\"page-link-left\">\n      <a href=\"/dashboards/"
    + escapeExpression(((helper = (helper = helpers.domain || (depth0 != null ? depth0.domain : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"domain","hash":{},"data":data}) : helper)))
    + "\">"
    + escapeExpression(((helper = (helper = helpers.domain || (depth0 != null ? depth0.domain : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"domain","hash":{},"data":data}) : helper)))
    + "</a>\n    </h3>\n  </div>\n</div>\n\n<div class=\"body\">\n  <div class=\"bg-body-entity\"></div>\n  <div class=\"container\">\n\n";
  stack1 = helpers.unless.call(depth0, (depth0 != null ? depth0._id : depth0), {"name":"unless","hash":{},"fn":this.program(1, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "\n    <div class=\"col-md-4\">\n\n      <div class=\"cover\">\n\n        <div class=\"progress\" title=\""
    + escapeExpression(((helper = (helper = helpers.status || (depth0 != null ? depth0.status : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"status","hash":{},"data":data}) : helper)))
    + "\">\n          <div class=\"status\">\n            <select name=\"status\" id=\"status\" class=\"form-control\" value=\""
    + escapeExpression(((helper = (helper = helpers.status || (depth0 != null ? depth0.status : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"status","hash":{},"data":data}) : helper)))
    + "\">\n";
  stack1 = helpers.each.call(depth0, (depth0 != null ? depth0.statuses : depth0), {"name":"each","hash":{},"fn":this.program(3, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "            </select>\n          </div>\n        </div>\n\n        <div id=\"dragdrop\" class=\"dropzone item-cover\"\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.cover : depth0), {"name":"if","hash":{},"fn":this.program(5, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += ">\n        </div>\n        <p class=\"error-cover bg-danger text-danger hidden\"></p>\n\n      </div>\n\n    </div>\n\n    <div class=\"col-md-8\">\n      <div class=\"description\">\n        <label for=\"description\"><h3>請用下方範本說明專案，不要修改井字號開頭的標頭</h3></label>\n        <textarea id=\"description\" name=\"description\" placeholder=\"Description\">"
    + escapeExpression(((helper = (helper = helpers.description || (depth0 != null ? depth0.description : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"description","hash":{},"data":data}) : helper)))
    + "</textarea>\n      </div>\n      <div class=\"tags\">\n        <input id=\"tags\" type=\"text\" name=\"tags\" placeholder='"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Tags", {"name":"__","hash":{},"data":data})))
    + "' class=\"form-control\" value=\""
    + escapeExpression(((helper = (helper = helpers.getTags || (depth0 != null ? depth0.getTags : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"getTags","hash":{},"data":data}) : helper)))
    + "\"/>\n      </div>\n      <div class=\"link\">\n        <input id=\"link\" type=\"text\" name=\"link\" placeholder='"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Project URL Demo", {"name":"__","hash":{},"data":data})))
    + "' class=\"form-control\" value=\""
    + escapeExpression(((helper = (helper = helpers.link || (depth0 != null ? depth0.link : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"link","hash":{},"data":data}) : helper)))
    + "\"/>\n      </div>\n    </div>\n\n    <div class=\"col-md-8 buttons-panel\">\n\n      <div class=\"pull-right save\">\n        <a id=\"save\" class=\"btn btn-success\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Save", {"name":"__","hash":{},"data":data})))
    + "</a>\n      </div>\n\n      <div class=\"pull-right cancel\">\n        <a id=\"cancel\" class=\"btn btn-danger\"\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0._id : depth0), {"name":"if","hash":{},"fn":this.program(7, data),"inverse":this.program(9, data),"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "        >"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Cancel", {"name":"__","hash":{},"data":data})))
    + "</a>\n      </div>\n\n    </div>\n\n  </div>\n\n</div>\n";
},"useData":true});

},{"hbsfy/runtime":101}],87:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(depth0,helpers,partials,data) {
  return "no-cover";
  },"3":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "        <div class=\"item-cover\"\n          style=\"background-image: url("
    + escapeExpression(((helper = (helper = helpers.cover || (depth0 != null ? depth0.cover : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"cover","hash":{},"data":data}) : helper)))
    + ");\"></div>\n";
},"5":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "        <i class=\"item-letter\">"
    + escapeExpression(((helpers.firstLetter || (depth0 && depth0.firstLetter) || helperMissing).call(depth0, (depth0 != null ? depth0.title : depth0), {"name":"firstLetter","hash":{},"data":data})))
    + "</i>\n";
},"7":function(depth0,helpers,partials,data) {
  var stack1, buffer = "\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.showActions : depth0), {"name":"if","hash":{},"fn":this.program(8, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "\n";
},"8":function(depth0,helpers,partials,data) {
  var stack1, buffer = "\n          <div class=\"contributor\">\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.contributing : depth0), {"name":"if","hash":{},"fn":this.program(9, data),"inverse":this.program(11, data),"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "          </div>\n          <div class=\"follower\">\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.following : depth0), {"name":"if","hash":{},"fn":this.program(13, data),"inverse":this.program(15, data),"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "          </div>\n\n";
},"9":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "            <a data-loading-text=\""
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "leaving...", {"name":"__","hash":{},"data":data})))
    + "\" class=\"btn btn-blue leave\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Leave", {"name":"__","hash":{},"data":data})))
    + "</a>\n";
},"11":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "            <a data-loading-text=\""
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "joining...", {"name":"__","hash":{},"data":data})))
    + "\" class=\"btn btn-blue join\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Join", {"name":"__","hash":{},"data":data})))
    + "</a>\n";
},"13":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "            <a data-loading-text=\""
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "unfollowing...", {"name":"__","hash":{},"data":data})))
    + "\" class=\"btn btn-blue unfollow\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Unfollow", {"name":"__","hash":{},"data":data})))
    + "</a>\n";
},"15":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "            <a data-loading-text=\""
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "following...", {"name":"__","hash":{},"data":data})))
    + "\" class=\"btn btn-blue follow\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Follow", {"name":"__","hash":{},"data":data})))
    + "</a>\n";
},"17":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "\n        <a class=\"btn btn-blue login\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Follow", {"name":"__","hash":{},"data":data})))
    + "</a>\n        <a class=\"btn btn-blue login\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Join", {"name":"__","hash":{},"data":data})))
    + "</a>\n\n";
},"19":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "          <a class=\"pull-left\" href=\"/users/"
    + escapeExpression(((helper = (helper = helpers._id || (depth0 != null ? depth0._id : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"_id","hash":{},"data":data}) : helper)))
    + "\">\n            "
    + escapeExpression(((helpers.getProfileImageHex || (depth0 && depth0.getProfileImageHex) || helperMissing).call(depth0, depth0, {"name":"getProfileImageHex","hash":{},"data":data})))
    + "\n          </a>\n";
},"21":function(depth0,helpers,partials,data) {
  var stack1, buffer = "";
  stack1 = helpers['if'].call(depth0, depth0, {"name":"if","hash":{},"fn":this.program(22, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer;
},"22":function(depth0,helpers,partials,data) {
  var lambda=this.lambda, escapeExpression=this.escapeExpression;
  return "        <li>\n          <a href=\"/projects?q="
    + escapeExpression(lambda(depth0, depth0))
    + "\" data-bypass=\"true\">"
    + escapeExpression(lambda(depth0, depth0))
    + "</a>\n        </li>\n";
},"24":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "    <div class=\"pull-right\">\n      <a href=\""
    + escapeExpression(((helper = (helper = helpers.link || (depth0 != null ? depth0.link : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"link","hash":{},"data":data}) : helper)))
    + "\" target=\"__blank\" class=\"btn btn-red\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "demo", {"name":"__","hash":{},"data":data})))
    + "</a>\n    </div>\n";
},"26":function(depth0,helpers,partials,data) {
  var stack1, buffer = "\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.isAdminOrLeader : depth0), {"name":"if","hash":{},"fn":this.program(27, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.showActions : depth0), {"name":"if","hash":{},"fn":this.program(29, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "\n";
},"27":function(depth0,helpers,partials,data) {
  var helper, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, functionType="function";
  return "      <div class=\"pull-right remove\">\n        <a class=\"btn btn-danger\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Remove", {"name":"__","hash":{},"data":data})))
    + "</a>\n      </div>\n      <div class=\"pull-right edit\">\n        <a class=\"btn btn-success\" href=\"/projects/"
    + escapeExpression(((helper = (helper = helpers._id || (depth0 != null ? depth0._id : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"_id","hash":{},"data":data}) : helper)))
    + "/edit\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Edit", {"name":"__","hash":{},"data":data})))
    + "</a>\n      </div>\n";
},"29":function(depth0,helpers,partials,data) {
  var stack1, buffer = "\n      <div class=\"pull-left bottom-buttons\">\n\n        <div class=\"pull-left contributor\">\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.contributing : depth0), {"name":"if","hash":{},"fn":this.program(30, data),"inverse":this.program(32, data),"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "        </div>\n        <div class=\"pull-left follower\">\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.following : depth0), {"name":"if","hash":{},"fn":this.program(34, data),"inverse":this.program(36, data),"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "        </div>\n\n      </div>\n";
},"30":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "          <a data-loading-text=\""
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "leaving...", {"name":"__","hash":{},"data":data})))
    + "\" class=\"btn btn-blue leave\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Leave", {"name":"__","hash":{},"data":data})))
    + "</a>\n";
},"32":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "          <a data-loading-text=\""
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "joining...", {"name":"__","hash":{},"data":data})))
    + "\" class=\"btn btn-blue join\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Join", {"name":"__","hash":{},"data":data})))
    + "</a>\n";
},"34":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "          <a data-loading-text=\""
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "unfollowing...", {"name":"__","hash":{},"data":data})))
    + "\" class=\"btn btn-blue unfollow\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Unfollow", {"name":"__","hash":{},"data":data})))
    + "</a>\n";
},"36":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "          <a data-loading-text=\""
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "following...", {"name":"__","hash":{},"data":data})))
    + "\" class=\"btn btn-blue follow\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Follow", {"name":"__","hash":{},"data":data})))
    + "</a>\n";
},"38":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "\n      <div class=\"pull-left bottom-buttons\">\n        <a class=\"btn btn-blue login follower\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Follow", {"name":"__","hash":{},"data":data})))
    + "</a>\n        <a class=\"btn btn-blue login contributor\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Join", {"name":"__","hash":{},"data":data})))
    + "</a>\n      </div>\n\n";
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, helper, options, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, blockHelperMissing=helpers.blockHelperMissing, lambda=this.lambda, buffer = "\n<div class=\"header\">\n  <div class=\"container\">\n    <h1>"
    + escapeExpression(((helper = (helper = helpers.title || (depth0 != null ? depth0.title : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"title","hash":{},"data":data}) : helper)))
    + "</h1>\n    <h3 class=\"page-link-left\">\n      <a href=\"/dashboards/"
    + escapeExpression(((helper = (helper = helpers.domain || (depth0 != null ? depth0.domain : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"domain","hash":{},"data":data}) : helper)))
    + "\">"
    + escapeExpression(((helper = (helper = helpers.domain || (depth0 != null ? depth0.domain : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"domain","hash":{},"data":data}) : helper)))
    + "</a>\n    </h3>\n  </div>\n</div>\n\n<div class=\"body\">\n  <div class=\"bg-body-entity\"></div>\n  <div class=\"container\">\n\n    <div class=\"col-md-4\">\n\n      <div class=\"cover ";
  stack1 = helpers.unless.call(depth0, (depth0 != null ? depth0.cover : depth0), {"name":"unless","hash":{},"fn":this.program(1, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "\">\n\n        <div class=\"progress\" title=\""
    + escapeExpression(((helper = (helper = helpers.status || (depth0 != null ? depth0.status : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"status","hash":{},"data":data}) : helper)))
    + "\">\n          <div class=\""
    + escapeExpression(((helper = (helper = helpers.status || (depth0 != null ? depth0.status : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"status","hash":{},"data":data}) : helper)))
    + "\"></div>\n          <div class=\"status\">"
    + escapeExpression(((helper = (helper = helpers.status || (depth0 != null ? depth0.status : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"status","hash":{},"data":data}) : helper)))
    + "</div>\n        </div>\n\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.cover : depth0), {"name":"if","hash":{},"fn":this.program(3, data),"inverse":this.program(5, data),"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "      </div>\n\n\n      <div class=\"buttons-panel top-buttons\">\n\n";
  stack1 = ((helper = (helper = helpers.isLoggedIn || (depth0 != null ? depth0.isLoggedIn : depth0)) != null ? helper : helperMissing),(options={"name":"isLoggedIn","hash":{},"fn":this.program(7, data),"inverse":this.program(17, data),"data":data}),(typeof helper === functionType ? helper.call(depth0, options) : helper));
  if (!helpers.isLoggedIn) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if (stack1 != null) { buffer += stack1; }
  buffer += "\n        <a class=\"share tooltips share-top\" data-original-title=\""
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Share this Project", {"name":"__","hash":{},"data":data})))
    + "\">\n          <i class=\"fa fa-share-alt\"></i>\n        </a>\n      </div>\n\n      <div class=\"people\">\n\n        <div class=\"clearfix\">\n          <h5>"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Proposed by", {"name":"__","hash":{},"data":data})))
    + "</h5>\n          <a class=\"pull-left\" href=\"/users/"
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.leader : depth0)) != null ? stack1._id : stack1), depth0))
    + "\">\n            "
    + escapeExpression(((helpers.getProfileImageHex || (depth0 && depth0.getProfileImageHex) || helperMissing).call(depth0, (depth0 != null ? depth0.leader : depth0), {"name":"getProfileImageHex","hash":{},"data":data})))
    + "\n          </a>\n        </div>\n\n        <div class=\"clearfix contributor\">\n          <h5>"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Contributors", {"name":"__","hash":{},"data":data})))
    + " ["
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.contributors : depth0)) != null ? stack1.length : stack1), depth0))
    + "]</h5>\n";
  stack1 = helpers.each.call(depth0, (depth0 != null ? depth0.contributors : depth0), {"name":"each","hash":{},"fn":this.program(19, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "        </div>\n\n        <div class=\"clearfix follower\">\n          <h5>"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Followers", {"name":"__","hash":{},"data":data})))
    + " ["
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.followers : depth0)) != null ? stack1.length : stack1), depth0))
    + "]</h5>\n";
  stack1 = helpers.each.call(depth0, (depth0 != null ? depth0.followers : depth0), {"name":"each","hash":{},"fn":this.program(19, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "        </div>\n\n      </div>\n\n    </div>\n\n    <div class=\"col-md-8\">\n      <div class=\"description\">\n        ";
  stack1 = ((helpers.markdown || (depth0 && depth0.markdown) || helperMissing).call(depth0, (depth0 != null ? depth0.description : depth0), {"name":"markdown","hash":{},"data":data}));
  if (stack1 != null) { buffer += stack1; }
  buffer += "\n      </div>\n      <ul class=\"tags clearfix col-md-10\">\n";
  stack1 = helpers.each.call(depth0, (depth0 != null ? depth0.tags : depth0), {"name":"each","hash":{},"fn":this.program(21, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "      </ul>\n      <div class=\"share-ctn clearfix col-md-2 share-inner\">\n        <a class=\"share tooltips\" data-original-title=\""
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Share this Project", {"name":"__","hash":{},"data":data})))
    + "\">\n          <i class=\"fa fa-share-alt\"></i>\n        </a>\n      </div>\n    </div>\n\n    <div class=\"col-md-12 buttons-panel\">\n\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.link : depth0), {"name":"if","hash":{},"fn":this.program(24, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "\n";
  stack1 = ((helper = (helper = helpers.isLoggedIn || (depth0 != null ? depth0.isLoggedIn : depth0)) != null ? helper : helperMissing),(options={"name":"isLoggedIn","hash":{},"fn":this.program(26, data),"inverse":this.program(38, data),"data":data}),(typeof helper === functionType ? helper.call(depth0, options) : helper));
  if (!helpers.isLoggedIn) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if (stack1 != null) { buffer += stack1; }
  return buffer + "    </div>\n\n  </div>\n\n  <div class=\"container discourse-ctn\" style=\"margin-top: 0px\">\n  </div>\n\n  <div class=\"container disqus-ctn\">\n    <div id=\"disqus_thread\" class=\"col-md-12\"></div>\n  </div>\n\n</div>\n";
},"useData":true});

},{"hbsfy/runtime":101}],88:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "\n        <div class=\"checkbox\">\n          <label>\n            <input id=\""
    + escapeExpression(((helper = (helper = helpers.code || (depth0 != null ? depth0.code : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"code","hash":{},"data":data}) : helper)))
    + "\" type=\"checkbox\" checked> "
    + escapeExpression(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"name","hash":{},"data":data}) : helper)))
    + "\n          </label>\n        </div>\n\n";
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, buffer = "<div class=\"modal-body\">\n\n  <button type=\"button\" class=\"close\" data-dismiss=\"modal\">\n    <i class=\"fa fa-close\"></i>\n  </button>\n\n  <div class=\"row\">\n    <div class=\"col-md-5\">\n\n      <h1>"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "embed this project", {"name":"__","hash":{},"data":data})))
    + "</h1>\n\n      <div class=\"settings\">\n\n";
  stack1 = helpers.each.call(depth0, (depth0 != null ? depth0.settings : depth0), {"name":"each","hash":{},"fn":this.program(1, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "\n      </div>\n\n      <label class=\"get-code\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Add this project to your website by coping this code below", {"name":"__","hash":{},"data":data})))
    + "</label>\n      <textarea id=\"embed-code\" onclick=\"this.focus();this.select();\" readonly=\"readonly\"></textarea>\n\n    </div>\n    <div class=\"col-md-7\" style=\"position:relative;\">\n      <div class=\"preview\">\n        <iframe width=\"100%\" height=\"450\"\n          frameborder=\"0\" allowtransparency=\"true\" title=\"Hackdash\"></iframe>\n      </div>\n    </div>\n  </div>\n\n</div>\n";
},"useData":true});

},{"hbsfy/runtime":101}],89:[function(require,module,exports){
/**
 * VIEW: Share Popover
 *
 */

var template = require('./templates/sharer.hbs'),
  DashboardEmbed = require("./Dashboard/Share"),
  ProjectEmbed = require("./Project/Share");

/*jshint scripturl:true */

var Sharer = module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  id: 'sharer-dialog',
  className: "sharer",
  template: template,

  events: {
    "click .embed": "showEmbed",
    "click .close": "destroy",

    "click .facebook": "showFBShare",
    "click .linkedin": "showLinkedInShare"
  },

  shareText: {
    dashboard: 'Hacking at ',
    project: 'Hacking '
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  initialize: function(options){
    this.type = (options && options.type) || '';
  },

  serializeData: function(){
    return _.extend({
      networks: this.getNetworks()
    }, (this.model && this.model.toJSON()) || {});
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  showEmbed: function(){
    var Share;

    switch(this.type){
      case 'dashboard': Share = DashboardEmbed; break;
      case 'project': Share = ProjectEmbed; break;
    }

    if (Share){
      hackdash.app.modals.show(new Share({
        model: this.model
      }));
    }

    this.destroy();
  },

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

  enc: function(str){
    return window.encodeURI(str);
  },

  getTwitterLink: function(){
    var link = 'https://twitter.com/intent/tweet?'
      , people = ''
      , url = 'url=' + window.location.protocol + "//" + window.location.host
      , hashtags = 'hashtags='
      , text = 'text=';

    var domain = this.model.get('domain');
    var title = this.model.get('title');

    function getPeople(list){
      return _.map(list, function(user){

        if (hackdash.user && hackdash.user._id === user._id){
          // remove me
          return '';
        }

        if (user.provider === 'twitter'){
          return '@' + user.username;
        }
        else {
          return user.name;
        }

        return '';

      }).join(' ');
    }

    if (this.type === 'dashboard'){
      people = getPeople(this.model.get('admins').toJSON());
      url += '/d/' + domain;
    }

    else if (this.type === 'project'){
      people = getPeople(this.model.get('contributors'));
      url += '/p/' + this.model.get('_id');
    }

    hashtags += ['g0v', 'civictech', domain].join(',');
    text += this.shareText[this.type] + (title || domain) + ' via ' + people;

    link += this.enc(url) + '&' + this.enc(hashtags) + '&' + this.enc(text);
    return link;
  },

  showFBShare: function(e){
    e.preventDefault();

    var people = ''
      , url = '' + window.location.protocol + "//" + window.location.host
      , text = ''
      , picture = '';

    var domain = this.model.get('domain');
    var title = this.model.get('title');

    function getPeople(list){
      return _.map(list, function(user){

        if (hackdash.user && hackdash.user._id === user._id){
          // remove me
          return '';
        }

        return user.name;

      }).join(', ');
    }

    if (this.type === 'dashboard'){
      people = getPeople(this.model.get('admins').toJSON());

      var covers = this.model.get('covers');
      picture = url + ((covers && covers.length && covers[0]) || '/images/landing-banner.png');

      url += '/d/' + domain;
    }

    else if (this.type === 'project'){
      people = getPeople(this.model.get('contributors'));

      var cover = this.model.get('cover');
      picture = url + (cover || '/images/landing-banner.png');

      url += '/p/' + this.model.get('_id');
    }

    var textShort = __('Hacking at') + ' ' + (title || domain);
    text += textShort + ' via ' + people;
    text += ' ' + ['#g0v', 'civictech', domain].join(' #');

    window.FB.ui({
      method: 'feed',
      name: textShort,
      link: url,
      picture: picture,
      caption: text
    }, function( response ) {
      console.log(response);
    });
  },

  showLinkedInShare: function(e){
    e.preventDefault();

    var link = 'https://www.linkedin.com/shareArticle?mini=true&'
      , url = 'url=' + window.location.protocol + "//" + window.location.host
      , stitle = 'title='
      , text = 'summary='
      , source = '&source=HackDash';

    var domain = this.model.get('domain');
    var title = this.model.get('title');

    if (this.type === 'dashboard'){
      url += '/d/' + domain;
    }
    else if (this.type === 'project'){
      url += '/p/' + this.model.get('_id');
    }

    var textShort = __('Hacking at') + ' ' + (title || domain);
    stitle += textShort;
    text += textShort;

    link += this.enc(url) + '&' + this.enc(stitle) + '&' + this.enc(text) + source;
    window.open(link,'LinkedIn','height=350,width=520');
  },

  getNetworks: function(){

    var networks = [{
      name: 'twitter',
      link: this.getTwitterLink()
    }];

    if (window.hackdash.fbAppId){
      networks.push({
        name: 'facebook'
      });
    }

    return networks.concat([{
      name: 'linkedin'
    }, {
      name: 'google-plus',
      link: "javascript:void(window.open('https://plus.google.com/share?url='+encodeURIComponent(location), 'Share to Google+','width=600,height=460,menubar=no,location=no,status=no'));"
    }]);

  }

}, {

  show: function(el, options){

    var sharer = new Sharer(options);
    sharer.render();

    $('body').append(sharer.$el);

    var clickOutside = function(e){
      var $target = $(e.target);
      if ($target.hasClass('share') || $target.hasClass('fa-share-alt')){
        return;
      }

      var id = '#' + sharer.$el.get(0).id;

      if(!$target.closest(id).length && $(id).is(":visible")) {
        sharer.destroy();
      }
    };

    $('html').on('click', clickOutside);

    var $el = $(el),
      offset = $el.offset(),
      mw = $(window).width(),
      elW = sharer.$el.width(),
      w = sharer.$el.width()/2 - $el.width()/2,
      h = sharer.$el.height()/2 - $el.height()/2,
      l = offset.left - w,
      t = offset.top - h;

    if (l + elW > mw){
      l -= (l + (elW*1.2)) - mw;
    }

    sharer.$el.css({
      top: t,
      left: l
    });

    sharer.on('close destroy', function(){
      sharer.$el.remove();
      $('html').off('click', clickOutside);
    });

    return sharer;
  }

});

},{"./Dashboard/Share":33,"./Project/Share":84,"./templates/sharer.hbs":92}],90:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(depth0,helpers,partials,data,depths) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, lambda=this.lambda;
  return "\n      <div class=\"col-xs-12 col-md-8 col-md-offset-2\">\n        <a href=\"/auth/"
    + escapeExpression(((helper = (helper = helpers.key || (depth0 != null ? depth0.key : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"key","hash":{},"data":data}) : helper)))
    + escapeExpression(lambda((depths[1] != null ? depths[1].redirectURL : depths[1]), depth0))
    + "\" class=\"btn btn-primary signup-btn signup-"
    + escapeExpression(((helper = (helper = helpers.key || (depth0 != null ? depth0.key : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"key","hash":{},"data":data}) : helper)))
    + "\" data-bypass>\n          <i class=\"fa "
    + escapeExpression(((helper = (helper = helpers.icon || (depth0 != null ? depth0.icon : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"icon","hash":{},"data":data}) : helper)))
    + "\"></i>"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Access with", {"name":"__","hash":{},"data":data})))
    + " "
    + escapeExpression(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"name","hash":{},"data":data}) : helper)))
    + "\n        </a>\n      </div>\n\n";
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data,depths) {
  var stack1, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, buffer = "<div class=\"modal-header\">\n  <button type=\"button\" class=\"close\" data-dismiss=\"modal\">\n    <i class=\"fa fa-close\"></i>\n  </button>\n  <h2 class=\"modal-title\">"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "Log In", {"name":"__","hash":{},"data":data})))
    + "</h2>\n</div>\n\n<div class=\"modal-body\">\n  <div class=\"row\">\n";
  stack1 = helpers.each.call(depth0, (depth0 != null ? depth0.providers : depth0), {"name":"each","hash":{},"fn":this.program(1, data, depths),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "  </div>\n</div>\n";
},"useData":true,"useDepths":true});

},{"hbsfy/runtime":101}],91:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "<div class=\"modal-header\">\n  <button type=\"button\" class=\"close\" data-dismiss=\"modal\">\n    <i class=\"fa fa-close\"></i>\n  </button>\n  <h3 class=\"modal-title\">"
    + escapeExpression(((helper = (helper = helpers.title || (depth0 != null ? depth0.title : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"title","hash":{},"data":data}) : helper)))
    + "</h3>\n</div>\n\n<div class=\"modal-body\">\n  <p class=\"bg-"
    + escapeExpression(((helper = (helper = helpers.type || (depth0 != null ? depth0.type : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"type","hash":{},"data":data}) : helper)))
    + "\">"
    + escapeExpression(((helper = (helper = helpers.message || (depth0 != null ? depth0.message : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"message","hash":{},"data":data}) : helper)))
    + "</p>\n</div>\n";
},"useData":true});

},{"hbsfy/runtime":101}],92:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(depth0,helpers,partials,data) {
  var stack1, helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, buffer = "    <li class=\""
    + escapeExpression(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"name","hash":{},"data":data}) : helper)))
    + "\">\n      <a ";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.link : depth0), {"name":"if","hash":{},"fn":this.program(2, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + ">\n        <i class=\"fa fa-"
    + escapeExpression(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"name","hash":{},"data":data}) : helper)))
    + "\"></i>\n      </a>\n    </li>\n";
},"2":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "href=\""
    + escapeExpression(((helper = (helper = helpers.link || (depth0 != null ? depth0.link : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"link","hash":{},"data":data}) : helper)))
    + "\"";
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, buffer = "<div class=\"embed\">\n  <a>"
    + escapeExpression(((helpers.__ || (depth0 && depth0.__) || helperMissing).call(depth0, "embed/insert", {"name":"__","hash":{},"data":data})))
    + "</a>\n</div>\n<div class=\"social-buttons\">\n  <ul>\n";
  stack1 = helpers.each.call(depth0, (depth0 != null ? depth0.networks : depth0), {"name":"each","hash":{},"fn":this.program(1, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "  </ul>\n</div>";
},"useData":true});

},{"hbsfy/runtime":101}],93:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],94:[function(require,module,exports){
"use strict";
/*globals Handlebars: true */
var base = require("./handlebars/base");

// Each of these augment the Handlebars object. No need to setup here.
// (This is done to easily share code between commonjs and browse envs)
var SafeString = require("./handlebars/safe-string")["default"];
var Exception = require("./handlebars/exception")["default"];
var Utils = require("./handlebars/utils");
var runtime = require("./handlebars/runtime");

// For compatibility and usage outside of module systems, make the Handlebars object a namespace
var create = function() {
  var hb = new base.HandlebarsEnvironment();

  Utils.extend(hb, base);
  hb.SafeString = SafeString;
  hb.Exception = Exception;
  hb.Utils = Utils;
  hb.escapeExpression = Utils.escapeExpression;

  hb.VM = runtime;
  hb.template = function(spec) {
    return runtime.template(spec, hb);
  };

  return hb;
};

var Handlebars = create();
Handlebars.create = create;

Handlebars['default'] = Handlebars;

exports["default"] = Handlebars;
},{"./handlebars/base":95,"./handlebars/exception":96,"./handlebars/runtime":97,"./handlebars/safe-string":98,"./handlebars/utils":99}],95:[function(require,module,exports){
"use strict";
var Utils = require("./utils");
var Exception = require("./exception")["default"];

var VERSION = "2.0.0";
exports.VERSION = VERSION;var COMPILER_REVISION = 6;
exports.COMPILER_REVISION = COMPILER_REVISION;
var REVISION_CHANGES = {
  1: '<= 1.0.rc.2', // 1.0.rc.2 is actually rev2 but doesn't report it
  2: '== 1.0.0-rc.3',
  3: '== 1.0.0-rc.4',
  4: '== 1.x.x',
  5: '== 2.0.0-alpha.x',
  6: '>= 2.0.0-beta.1'
};
exports.REVISION_CHANGES = REVISION_CHANGES;
var isArray = Utils.isArray,
    isFunction = Utils.isFunction,
    toString = Utils.toString,
    objectType = '[object Object]';

function HandlebarsEnvironment(helpers, partials) {
  this.helpers = helpers || {};
  this.partials = partials || {};

  registerDefaultHelpers(this);
}

exports.HandlebarsEnvironment = HandlebarsEnvironment;HandlebarsEnvironment.prototype = {
  constructor: HandlebarsEnvironment,

  logger: logger,
  log: log,

  registerHelper: function(name, fn) {
    if (toString.call(name) === objectType) {
      if (fn) { throw new Exception('Arg not supported with multiple helpers'); }
      Utils.extend(this.helpers, name);
    } else {
      this.helpers[name] = fn;
    }
  },
  unregisterHelper: function(name) {
    delete this.helpers[name];
  },

  registerPartial: function(name, partial) {
    if (toString.call(name) === objectType) {
      Utils.extend(this.partials,  name);
    } else {
      this.partials[name] = partial;
    }
  },
  unregisterPartial: function(name) {
    delete this.partials[name];
  }
};

function registerDefaultHelpers(instance) {
  instance.registerHelper('helperMissing', function(/* [args, ]options */) {
    if(arguments.length === 1) {
      // A missing field in a {{foo}} constuct.
      return undefined;
    } else {
      // Someone is actually trying to call something, blow up.
      throw new Exception("Missing helper: '" + arguments[arguments.length-1].name + "'");
    }
  });

  instance.registerHelper('blockHelperMissing', function(context, options) {
    var inverse = options.inverse,
        fn = options.fn;

    if(context === true) {
      return fn(this);
    } else if(context === false || context == null) {
      return inverse(this);
    } else if (isArray(context)) {
      if(context.length > 0) {
        if (options.ids) {
          options.ids = [options.name];
        }

        return instance.helpers.each(context, options);
      } else {
        return inverse(this);
      }
    } else {
      if (options.data && options.ids) {
        var data = createFrame(options.data);
        data.contextPath = Utils.appendContextPath(options.data.contextPath, options.name);
        options = {data: data};
      }

      return fn(context, options);
    }
  });

  instance.registerHelper('each', function(context, options) {
    if (!options) {
      throw new Exception('Must pass iterator to #each');
    }

    var fn = options.fn, inverse = options.inverse;
    var i = 0, ret = "", data;

    var contextPath;
    if (options.data && options.ids) {
      contextPath = Utils.appendContextPath(options.data.contextPath, options.ids[0]) + '.';
    }

    if (isFunction(context)) { context = context.call(this); }

    if (options.data) {
      data = createFrame(options.data);
    }

    if(context && typeof context === 'object') {
      if (isArray(context)) {
        for(var j = context.length; i<j; i++) {
          if (data) {
            data.index = i;
            data.first = (i === 0);
            data.last  = (i === (context.length-1));

            if (contextPath) {
              data.contextPath = contextPath + i;
            }
          }
          ret = ret + fn(context[i], { data: data });
        }
      } else {
        for(var key in context) {
          if(context.hasOwnProperty(key)) {
            if(data) {
              data.key = key;
              data.index = i;
              data.first = (i === 0);

              if (contextPath) {
                data.contextPath = contextPath + key;
              }
            }
            ret = ret + fn(context[key], {data: data});
            i++;
          }
        }
      }
    }

    if(i === 0){
      ret = inverse(this);
    }

    return ret;
  });

  instance.registerHelper('if', function(conditional, options) {
    if (isFunction(conditional)) { conditional = conditional.call(this); }

    // Default behavior is to render the positive path if the value is truthy and not empty.
    // The `includeZero` option may be set to treat the condtional as purely not empty based on the
    // behavior of isEmpty. Effectively this determines if 0 is handled by the positive path or negative.
    if ((!options.hash.includeZero && !conditional) || Utils.isEmpty(conditional)) {
      return options.inverse(this);
    } else {
      return options.fn(this);
    }
  });

  instance.registerHelper('unless', function(conditional, options) {
    return instance.helpers['if'].call(this, conditional, {fn: options.inverse, inverse: options.fn, hash: options.hash});
  });

  instance.registerHelper('with', function(context, options) {
    if (isFunction(context)) { context = context.call(this); }

    var fn = options.fn;

    if (!Utils.isEmpty(context)) {
      if (options.data && options.ids) {
        var data = createFrame(options.data);
        data.contextPath = Utils.appendContextPath(options.data.contextPath, options.ids[0]);
        options = {data:data};
      }

      return fn(context, options);
    } else {
      return options.inverse(this);
    }
  });

  instance.registerHelper('log', function(message, options) {
    var level = options.data && options.data.level != null ? parseInt(options.data.level, 10) : 1;
    instance.log(level, message);
  });

  instance.registerHelper('lookup', function(obj, field) {
    return obj && obj[field];
  });
}

var logger = {
  methodMap: { 0: 'debug', 1: 'info', 2: 'warn', 3: 'error' },

  // State enum
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  level: 3,

  // can be overridden in the host environment
  log: function(level, message) {
    if (logger.level <= level) {
      var method = logger.methodMap[level];
      if (typeof console !== 'undefined' && console[method]) {
        console[method].call(console, message);
      }
    }
  }
};
exports.logger = logger;
var log = logger.log;
exports.log = log;
var createFrame = function(object) {
  var frame = Utils.extend({}, object);
  frame._parent = object;
  return frame;
};
exports.createFrame = createFrame;
},{"./exception":96,"./utils":99}],96:[function(require,module,exports){
"use strict";

var errorProps = ['description', 'fileName', 'lineNumber', 'message', 'name', 'number', 'stack'];

function Exception(message, node) {
  var line;
  if (node && node.firstLine) {
    line = node.firstLine;

    message += ' - ' + line + ':' + node.firstColumn;
  }

  var tmp = Error.prototype.constructor.call(this, message);

  // Unfortunately errors are not enumerable in Chrome (at least), so `for prop in tmp` doesn't work.
  for (var idx = 0; idx < errorProps.length; idx++) {
    this[errorProps[idx]] = tmp[errorProps[idx]];
  }

  if (line) {
    this.lineNumber = line;
    this.column = node.firstColumn;
  }
}

Exception.prototype = new Error();

exports["default"] = Exception;
},{}],97:[function(require,module,exports){
"use strict";
var Utils = require("./utils");
var Exception = require("./exception")["default"];
var COMPILER_REVISION = require("./base").COMPILER_REVISION;
var REVISION_CHANGES = require("./base").REVISION_CHANGES;
var createFrame = require("./base").createFrame;

function checkRevision(compilerInfo) {
  var compilerRevision = compilerInfo && compilerInfo[0] || 1,
      currentRevision = COMPILER_REVISION;

  if (compilerRevision !== currentRevision) {
    if (compilerRevision < currentRevision) {
      var runtimeVersions = REVISION_CHANGES[currentRevision],
          compilerVersions = REVISION_CHANGES[compilerRevision];
      throw new Exception("Template was precompiled with an older version of Handlebars than the current runtime. "+
            "Please update your precompiler to a newer version ("+runtimeVersions+") or downgrade your runtime to an older version ("+compilerVersions+").");
    } else {
      // Use the embedded version info since the runtime doesn't know about this revision yet
      throw new Exception("Template was precompiled with a newer version of Handlebars than the current runtime. "+
            "Please update your runtime to a newer version ("+compilerInfo[1]+").");
    }
  }
}

exports.checkRevision = checkRevision;// TODO: Remove this line and break up compilePartial

function template(templateSpec, env) {
  /* istanbul ignore next */
  if (!env) {
    throw new Exception("No environment passed to template");
  }
  if (!templateSpec || !templateSpec.main) {
    throw new Exception('Unknown template object: ' + typeof templateSpec);
  }

  // Note: Using env.VM references rather than local var references throughout this section to allow
  // for external users to override these as psuedo-supported APIs.
  env.VM.checkRevision(templateSpec.compiler);

  var invokePartialWrapper = function(partial, indent, name, context, hash, helpers, partials, data, depths) {
    if (hash) {
      context = Utils.extend({}, context, hash);
    }

    var result = env.VM.invokePartial.call(this, partial, name, context, helpers, partials, data, depths);

    if (result == null && env.compile) {
      var options = { helpers: helpers, partials: partials, data: data, depths: depths };
      partials[name] = env.compile(partial, { data: data !== undefined, compat: templateSpec.compat }, env);
      result = partials[name](context, options);
    }
    if (result != null) {
      if (indent) {
        var lines = result.split('\n');
        for (var i = 0, l = lines.length; i < l; i++) {
          if (!lines[i] && i + 1 === l) {
            break;
          }

          lines[i] = indent + lines[i];
        }
        result = lines.join('\n');
      }
      return result;
    } else {
      throw new Exception("The partial " + name + " could not be compiled when running in runtime-only mode");
    }
  };

  // Just add water
  var container = {
    lookup: function(depths, name) {
      var len = depths.length;
      for (var i = 0; i < len; i++) {
        if (depths[i] && depths[i][name] != null) {
          return depths[i][name];
        }
      }
    },
    lambda: function(current, context) {
      return typeof current === 'function' ? current.call(context) : current;
    },

    escapeExpression: Utils.escapeExpression,
    invokePartial: invokePartialWrapper,

    fn: function(i) {
      return templateSpec[i];
    },

    programs: [],
    program: function(i, data, depths) {
      var programWrapper = this.programs[i],
          fn = this.fn(i);
      if (data || depths) {
        programWrapper = program(this, i, fn, data, depths);
      } else if (!programWrapper) {
        programWrapper = this.programs[i] = program(this, i, fn);
      }
      return programWrapper;
    },

    data: function(data, depth) {
      while (data && depth--) {
        data = data._parent;
      }
      return data;
    },
    merge: function(param, common) {
      var ret = param || common;

      if (param && common && (param !== common)) {
        ret = Utils.extend({}, common, param);
      }

      return ret;
    },

    noop: env.VM.noop,
    compilerInfo: templateSpec.compiler
  };

  var ret = function(context, options) {
    options = options || {};
    var data = options.data;

    ret._setup(options);
    if (!options.partial && templateSpec.useData) {
      data = initData(context, data);
    }
    var depths;
    if (templateSpec.useDepths) {
      depths = options.depths ? [context].concat(options.depths) : [context];
    }

    return templateSpec.main.call(container, context, container.helpers, container.partials, data, depths);
  };
  ret.isTop = true;

  ret._setup = function(options) {
    if (!options.partial) {
      container.helpers = container.merge(options.helpers, env.helpers);

      if (templateSpec.usePartial) {
        container.partials = container.merge(options.partials, env.partials);
      }
    } else {
      container.helpers = options.helpers;
      container.partials = options.partials;
    }
  };

  ret._child = function(i, data, depths) {
    if (templateSpec.useDepths && !depths) {
      throw new Exception('must pass parent depths');
    }

    return program(container, i, templateSpec[i], data, depths);
  };
  return ret;
}

exports.template = template;function program(container, i, fn, data, depths) {
  var prog = function(context, options) {
    options = options || {};

    return fn.call(container, context, container.helpers, container.partials, options.data || data, depths && [context].concat(depths));
  };
  prog.program = i;
  prog.depth = depths ? depths.length : 0;
  return prog;
}

exports.program = program;function invokePartial(partial, name, context, helpers, partials, data, depths) {
  var options = { partial: true, helpers: helpers, partials: partials, data: data, depths: depths };

  if(partial === undefined) {
    throw new Exception("The partial " + name + " could not be found");
  } else if(partial instanceof Function) {
    return partial(context, options);
  }
}

exports.invokePartial = invokePartial;function noop() { return ""; }

exports.noop = noop;function initData(context, data) {
  if (!data || !('root' in data)) {
    data = data ? createFrame(data) : {};
    data.root = context;
  }
  return data;
}
},{"./base":95,"./exception":96,"./utils":99}],98:[function(require,module,exports){
"use strict";
// Build out our basic SafeString type
function SafeString(string) {
  this.string = string;
}

SafeString.prototype.toString = function() {
  return "" + this.string;
};

exports["default"] = SafeString;
},{}],99:[function(require,module,exports){
"use strict";
/*jshint -W004 */
var SafeString = require("./safe-string")["default"];

var escape = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "`": "&#x60;"
};

var badChars = /[&<>"'`]/g;
var possible = /[&<>"'`]/;

function escapeChar(chr) {
  return escape[chr];
}

function extend(obj /* , ...source */) {
  for (var i = 1; i < arguments.length; i++) {
    for (var key in arguments[i]) {
      if (Object.prototype.hasOwnProperty.call(arguments[i], key)) {
        obj[key] = arguments[i][key];
      }
    }
  }

  return obj;
}

exports.extend = extend;var toString = Object.prototype.toString;
exports.toString = toString;
// Sourced from lodash
// https://github.com/bestiejs/lodash/blob/master/LICENSE.txt
var isFunction = function(value) {
  return typeof value === 'function';
};
// fallback for older versions of Chrome and Safari
/* istanbul ignore next */
if (isFunction(/x/)) {
  isFunction = function(value) {
    return typeof value === 'function' && toString.call(value) === '[object Function]';
  };
}
var isFunction;
exports.isFunction = isFunction;
/* istanbul ignore next */
var isArray = Array.isArray || function(value) {
  return (value && typeof value === 'object') ? toString.call(value) === '[object Array]' : false;
};
exports.isArray = isArray;

function escapeExpression(string) {
  // don't escape SafeStrings, since they're already safe
  if (string instanceof SafeString) {
    return string.toString();
  } else if (string == null) {
    return "";
  } else if (!string) {
    return string + '';
  }

  // Force a string conversion as this will be done by the append regardless and
  // the regex test will do this transparently behind the scenes, causing issues if
  // an object's to string has escaped characters in it.
  string = "" + string;

  if(!possible.test(string)) { return string; }
  return string.replace(badChars, escapeChar);
}

exports.escapeExpression = escapeExpression;function isEmpty(value) {
  if (!value && value !== 0) {
    return true;
  } else if (isArray(value) && value.length === 0) {
    return true;
  } else {
    return false;
  }
}

exports.isEmpty = isEmpty;function appendContextPath(contextPath, id) {
  return (contextPath ? contextPath + '.' : '') + id;
}

exports.appendContextPath = appendContextPath;
},{"./safe-string":98}],100:[function(require,module,exports){
// Create a simple path alias to allow browserify to resolve
// the runtime on a supported path.
module.exports = require('./dist/cjs/handlebars.runtime');

},{"./dist/cjs/handlebars.runtime":94}],101:[function(require,module,exports){
module.exports = require("handlebars/runtime")["default"];

},{"handlebars/runtime":100}],102:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],103:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module bail
 * @fileoverview Throw a given error.
 */

'use strict';

/* Expose. */
module.exports = bail;

/**
 * Throw a given error.
 *
 * @example
 *   bail();
 *
 * @example
 *   bail(new Error('failure'));
 *   // Error: failure
 *   //     at repl:1:6
 *   //     at REPLServer.defaultEval (repl.js:154:27)
 *   //     ...
 *
 * @param {Error?} [err] - Optional error.
 * @throws {Error} - `err`, when given.
 */
function bail(err) {
  if (err) {
    throw err;
  }
}

},{}],104:[function(require,module,exports){
"use strict";

/*
  Copyright (C) 2014 Yusuke Suzuki <utatane.tea@gmail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

function compare(v1, v2) {
  return v1 < v2;
}

function upperBound(array, value, comp) {
  if (comp === undefined) comp = compare;
  return (function () {
    var len = array.length;
    var i = 0;

    while (len) {
      var diff = len >>> 1;
      var cursor = i + diff;
      if (comp(value, array[cursor])) {
        len = diff;
      } else {
        i = cursor + 1;
        len -= diff + 1;
      }
    }
    return i;
  })();
}

function lowerBound(array, value, comp) {
  if (comp === undefined) comp = compare;
  return (function () {
    var len = array.length;
    var i = 0;

    while (len) {
      var diff = len >>> 1;
      var cursor = i + diff;
      if (comp(array[cursor], value)) {
        i = cursor + 1;
        len -= diff + 1;
      } else {
        len = diff;
      }
    }
    return i;
  })();
}

function binarySearch(array, value, comp) {
  if (comp === undefined) comp = compare;
  return (function () {
    var cursor = lowerBound(array, value, comp);
    return cursor !== array.length && !comp(value, array[cursor]);
  })();
}

exports.compare = compare;
exports.lowerBound = lowerBound;
exports.upperBound = upperBound;
exports.binarySearch = binarySearch;

},{}],105:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module ccount
 * @fileoverview Count characters.
 */

'use strict';

/* Expose. */
module.exports = ccount;

/**
 * Count how many characters `character` occur in `value`.
 *
 * @example
 *   ccount('foo(bar(baz)', '(') // 2
 *   ccount('foo(bar(baz)', ')') // 1
 *
 * @param {string} value - Content, coerced to string.
 * @param {string} character - Single character to look
 *   for.
 * @return {number} - Count.
 * @throws {Error} - when `character` is not a single
 *   character.
 */
function ccount(value, character) {
  var count = 0;
  var index;

  value = String(value);

  if (typeof character !== 'string' || character.length !== 1) {
    throw new Error('Expected character');
  }

  index = value.indexOf(character);

  while (index !== -1) {
    count++;
    index = value.indexOf(character, index + 1);
  }

  return count;
}

},{}],106:[function(require,module,exports){
module.exports={
  "nbsp": " ",
  "iexcl": "¡",
  "cent": "¢",
  "pound": "£",
  "curren": "¤",
  "yen": "¥",
  "brvbar": "¦",
  "sect": "§",
  "uml": "¨",
  "copy": "©",
  "ordf": "ª",
  "laquo": "«",
  "not": "¬",
  "shy": "­",
  "reg": "®",
  "macr": "¯",
  "deg": "°",
  "plusmn": "±",
  "sup2": "²",
  "sup3": "³",
  "acute": "´",
  "micro": "µ",
  "para": "¶",
  "middot": "·",
  "cedil": "¸",
  "sup1": "¹",
  "ordm": "º",
  "raquo": "»",
  "frac14": "¼",
  "frac12": "½",
  "frac34": "¾",
  "iquest": "¿",
  "Agrave": "À",
  "Aacute": "Á",
  "Acirc": "Â",
  "Atilde": "Ã",
  "Auml": "Ä",
  "Aring": "Å",
  "AElig": "Æ",
  "Ccedil": "Ç",
  "Egrave": "È",
  "Eacute": "É",
  "Ecirc": "Ê",
  "Euml": "Ë",
  "Igrave": "Ì",
  "Iacute": "Í",
  "Icirc": "Î",
  "Iuml": "Ï",
  "ETH": "Ð",
  "Ntilde": "Ñ",
  "Ograve": "Ò",
  "Oacute": "Ó",
  "Ocirc": "Ô",
  "Otilde": "Õ",
  "Ouml": "Ö",
  "times": "×",
  "Oslash": "Ø",
  "Ugrave": "Ù",
  "Uacute": "Ú",
  "Ucirc": "Û",
  "Uuml": "Ü",
  "Yacute": "Ý",
  "THORN": "Þ",
  "szlig": "ß",
  "agrave": "à",
  "aacute": "á",
  "acirc": "â",
  "atilde": "ã",
  "auml": "ä",
  "aring": "å",
  "aelig": "æ",
  "ccedil": "ç",
  "egrave": "è",
  "eacute": "é",
  "ecirc": "ê",
  "euml": "ë",
  "igrave": "ì",
  "iacute": "í",
  "icirc": "î",
  "iuml": "ï",
  "eth": "ð",
  "ntilde": "ñ",
  "ograve": "ò",
  "oacute": "ó",
  "ocirc": "ô",
  "otilde": "õ",
  "ouml": "ö",
  "divide": "÷",
  "oslash": "ø",
  "ugrave": "ù",
  "uacute": "ú",
  "ucirc": "û",
  "uuml": "ü",
  "yacute": "ý",
  "thorn": "þ",
  "yuml": "ÿ",
  "fnof": "ƒ",
  "Alpha": "Α",
  "Beta": "Β",
  "Gamma": "Γ",
  "Delta": "Δ",
  "Epsilon": "Ε",
  "Zeta": "Ζ",
  "Eta": "Η",
  "Theta": "Θ",
  "Iota": "Ι",
  "Kappa": "Κ",
  "Lambda": "Λ",
  "Mu": "Μ",
  "Nu": "Ν",
  "Xi": "Ξ",
  "Omicron": "Ο",
  "Pi": "Π",
  "Rho": "Ρ",
  "Sigma": "Σ",
  "Tau": "Τ",
  "Upsilon": "Υ",
  "Phi": "Φ",
  "Chi": "Χ",
  "Psi": "Ψ",
  "Omega": "Ω",
  "alpha": "α",
  "beta": "β",
  "gamma": "γ",
  "delta": "δ",
  "epsilon": "ε",
  "zeta": "ζ",
  "eta": "η",
  "theta": "θ",
  "iota": "ι",
  "kappa": "κ",
  "lambda": "λ",
  "mu": "μ",
  "nu": "ν",
  "xi": "ξ",
  "omicron": "ο",
  "pi": "π",
  "rho": "ρ",
  "sigmaf": "ς",
  "sigma": "σ",
  "tau": "τ",
  "upsilon": "υ",
  "phi": "φ",
  "chi": "χ",
  "psi": "ψ",
  "omega": "ω",
  "thetasym": "ϑ",
  "upsih": "ϒ",
  "piv": "ϖ",
  "bull": "•",
  "hellip": "…",
  "prime": "′",
  "Prime": "″",
  "oline": "‾",
  "frasl": "⁄",
  "weierp": "℘",
  "image": "ℑ",
  "real": "ℜ",
  "trade": "™",
  "alefsym": "ℵ",
  "larr": "←",
  "uarr": "↑",
  "rarr": "→",
  "darr": "↓",
  "harr": "↔",
  "crarr": "↵",
  "lArr": "⇐",
  "uArr": "⇑",
  "rArr": "⇒",
  "dArr": "⇓",
  "hArr": "⇔",
  "forall": "∀",
  "part": "∂",
  "exist": "∃",
  "empty": "∅",
  "nabla": "∇",
  "isin": "∈",
  "notin": "∉",
  "ni": "∋",
  "prod": "∏",
  "sum": "∑",
  "minus": "−",
  "lowast": "∗",
  "radic": "√",
  "prop": "∝",
  "infin": "∞",
  "ang": "∠",
  "and": "∧",
  "or": "∨",
  "cap": "∩",
  "cup": "∪",
  "int": "∫",
  "there4": "∴",
  "sim": "∼",
  "cong": "≅",
  "asymp": "≈",
  "ne": "≠",
  "equiv": "≡",
  "le": "≤",
  "ge": "≥",
  "sub": "⊂",
  "sup": "⊃",
  "nsub": "⊄",
  "sube": "⊆",
  "supe": "⊇",
  "oplus": "⊕",
  "otimes": "⊗",
  "perp": "⊥",
  "sdot": "⋅",
  "lceil": "⌈",
  "rceil": "⌉",
  "lfloor": "⌊",
  "rfloor": "⌋",
  "lang": "〈",
  "rang": "〉",
  "loz": "◊",
  "spades": "♠",
  "clubs": "♣",
  "hearts": "♥",
  "diams": "♦",
  "quot": "\"",
  "amp": "&",
  "lt": "<",
  "gt": ">",
  "OElig": "Œ",
  "oelig": "œ",
  "Scaron": "Š",
  "scaron": "š",
  "Yuml": "Ÿ",
  "circ": "ˆ",
  "tilde": "˜",
  "ensp": " ",
  "emsp": " ",
  "thinsp": " ",
  "zwnj": "‌",
  "zwj": "‍",
  "lrm": "‎",
  "rlm": "‏",
  "ndash": "–",
  "mdash": "—",
  "lsquo": "‘",
  "rsquo": "’",
  "sbquo": "‚",
  "ldquo": "“",
  "rdquo": "”",
  "bdquo": "„",
  "dagger": "†",
  "Dagger": "‡",
  "permil": "‰",
  "lsaquo": "‹",
  "rsaquo": "›",
  "euro": "€"
}

},{}],107:[function(require,module,exports){
module.exports={
  "AElig": "Æ",
  "AMP": "&",
  "Aacute": "Á",
  "Acirc": "Â",
  "Agrave": "À",
  "Aring": "Å",
  "Atilde": "Ã",
  "Auml": "Ä",
  "COPY": "©",
  "Ccedil": "Ç",
  "ETH": "Ð",
  "Eacute": "É",
  "Ecirc": "Ê",
  "Egrave": "È",
  "Euml": "Ë",
  "GT": ">",
  "Iacute": "Í",
  "Icirc": "Î",
  "Igrave": "Ì",
  "Iuml": "Ï",
  "LT": "<",
  "Ntilde": "Ñ",
  "Oacute": "Ó",
  "Ocirc": "Ô",
  "Ograve": "Ò",
  "Oslash": "Ø",
  "Otilde": "Õ",
  "Ouml": "Ö",
  "QUOT": "\"",
  "REG": "®",
  "THORN": "Þ",
  "Uacute": "Ú",
  "Ucirc": "Û",
  "Ugrave": "Ù",
  "Uuml": "Ü",
  "Yacute": "Ý",
  "aacute": "á",
  "acirc": "â",
  "acute": "´",
  "aelig": "æ",
  "agrave": "à",
  "amp": "&",
  "aring": "å",
  "atilde": "ã",
  "auml": "ä",
  "brvbar": "¦",
  "ccedil": "ç",
  "cedil": "¸",
  "cent": "¢",
  "copy": "©",
  "curren": "¤",
  "deg": "°",
  "divide": "÷",
  "eacute": "é",
  "ecirc": "ê",
  "egrave": "è",
  "eth": "ð",
  "euml": "ë",
  "frac12": "½",
  "frac14": "¼",
  "frac34": "¾",
  "gt": ">",
  "iacute": "í",
  "icirc": "î",
  "iexcl": "¡",
  "igrave": "ì",
  "iquest": "¿",
  "iuml": "ï",
  "laquo": "«",
  "lt": "<",
  "macr": "¯",
  "micro": "µ",
  "middot": "·",
  "nbsp": " ",
  "not": "¬",
  "ntilde": "ñ",
  "oacute": "ó",
  "ocirc": "ô",
  "ograve": "ò",
  "ordf": "ª",
  "ordm": "º",
  "oslash": "ø",
  "otilde": "õ",
  "ouml": "ö",
  "para": "¶",
  "plusmn": "±",
  "pound": "£",
  "quot": "\"",
  "raquo": "»",
  "reg": "®",
  "sect": "§",
  "shy": "­",
  "sup1": "¹",
  "sup2": "²",
  "sup3": "³",
  "szlig": "ß",
  "thorn": "þ",
  "times": "×",
  "uacute": "ú",
  "ucirc": "û",
  "ugrave": "ù",
  "uml": "¨",
  "uuml": "ü",
  "yacute": "ý",
  "yen": "¥",
  "yuml": "ÿ"
}

},{}],108:[function(require,module,exports){
module.exports={
  "AEli": "Æ",
  "AElig": "Æ",
  "AM": "&",
  "AMP": "&",
  "Aacut": "Á",
  "Aacute": "Á",
  "Abreve": "Ă",
  "Acir": "Â",
  "Acirc": "Â",
  "Acy": "А",
  "Afr": "𝔄",
  "Agrav": "À",
  "Agrave": "À",
  "Alpha": "Α",
  "Amacr": "Ā",
  "And": "⩓",
  "Aogon": "Ą",
  "Aopf": "𝔸",
  "ApplyFunction": "⁡",
  "Arin": "Å",
  "Aring": "Å",
  "Ascr": "𝒜",
  "Assign": "≔",
  "Atild": "Ã",
  "Atilde": "Ã",
  "Aum": "Ä",
  "Auml": "Ä",
  "Backslash": "∖",
  "Barv": "⫧",
  "Barwed": "⌆",
  "Bcy": "Б",
  "Because": "∵",
  "Bernoullis": "ℬ",
  "Beta": "Β",
  "Bfr": "𝔅",
  "Bopf": "𝔹",
  "Breve": "˘",
  "Bscr": "ℬ",
  "Bumpeq": "≎",
  "CHcy": "Ч",
  "COP": "©",
  "COPY": "©",
  "Cacute": "Ć",
  "Cap": "⋒",
  "CapitalDifferentialD": "ⅅ",
  "Cayleys": "ℭ",
  "Ccaron": "Č",
  "Ccedi": "Ç",
  "Ccedil": "Ç",
  "Ccirc": "Ĉ",
  "Cconint": "∰",
  "Cdot": "Ċ",
  "Cedilla": "¸",
  "CenterDot": "·",
  "Cfr": "ℭ",
  "Chi": "Χ",
  "CircleDot": "⊙",
  "CircleMinus": "⊖",
  "CirclePlus": "⊕",
  "CircleTimes": "⊗",
  "ClockwiseContourIntegral": "∲",
  "CloseCurlyDoubleQuote": "”",
  "CloseCurlyQuote": "’",
  "Colon": "∷",
  "Colone": "⩴",
  "Congruent": "≡",
  "Conint": "∯",
  "ContourIntegral": "∮",
  "Copf": "ℂ",
  "Coproduct": "∐",
  "CounterClockwiseContourIntegral": "∳",
  "Cross": "⨯",
  "Cscr": "𝒞",
  "Cup": "⋓",
  "CupCap": "≍",
  "DD": "ⅅ",
  "DDotrahd": "⤑",
  "DJcy": "Ђ",
  "DScy": "Ѕ",
  "DZcy": "Џ",
  "Dagger": "‡",
  "Darr": "↡",
  "Dashv": "⫤",
  "Dcaron": "Ď",
  "Dcy": "Д",
  "Del": "∇",
  "Delta": "Δ",
  "Dfr": "𝔇",
  "DiacriticalAcute": "´",
  "DiacriticalDot": "˙",
  "DiacriticalDoubleAcute": "˝",
  "DiacriticalGrave": "`",
  "DiacriticalTilde": "˜",
  "Diamond": "⋄",
  "DifferentialD": "ⅆ",
  "Dopf": "𝔻",
  "Dot": "¨",
  "DotDot": "⃜",
  "DotEqual": "≐",
  "DoubleContourIntegral": "∯",
  "DoubleDot": "¨",
  "DoubleDownArrow": "⇓",
  "DoubleLeftArrow": "⇐",
  "DoubleLeftRightArrow": "⇔",
  "DoubleLeftTee": "⫤",
  "DoubleLongLeftArrow": "⟸",
  "DoubleLongLeftRightArrow": "⟺",
  "DoubleLongRightArrow": "⟹",
  "DoubleRightArrow": "⇒",
  "DoubleRightTee": "⊨",
  "DoubleUpArrow": "⇑",
  "DoubleUpDownArrow": "⇕",
  "DoubleVerticalBar": "∥",
  "DownArrow": "↓",
  "DownArrowBar": "⤓",
  "DownArrowUpArrow": "⇵",
  "DownBreve": "̑",
  "DownLeftRightVector": "⥐",
  "DownLeftTeeVector": "⥞",
  "DownLeftVector": "↽",
  "DownLeftVectorBar": "⥖",
  "DownRightTeeVector": "⥟",
  "DownRightVector": "⇁",
  "DownRightVectorBar": "⥗",
  "DownTee": "⊤",
  "DownTeeArrow": "↧",
  "Downarrow": "⇓",
  "Dscr": "𝒟",
  "Dstrok": "Đ",
  "ENG": "Ŋ",
  "ET": "Ð",
  "ETH": "Ð",
  "Eacut": "É",
  "Eacute": "É",
  "Ecaron": "Ě",
  "Ecir": "Ê",
  "Ecirc": "Ê",
  "Ecy": "Э",
  "Edot": "Ė",
  "Efr": "𝔈",
  "Egrav": "È",
  "Egrave": "È",
  "Element": "∈",
  "Emacr": "Ē",
  "EmptySmallSquare": "◻",
  "EmptyVerySmallSquare": "▫",
  "Eogon": "Ę",
  "Eopf": "𝔼",
  "Epsilon": "Ε",
  "Equal": "⩵",
  "EqualTilde": "≂",
  "Equilibrium": "⇌",
  "Escr": "ℰ",
  "Esim": "⩳",
  "Eta": "Η",
  "Eum": "Ë",
  "Euml": "Ë",
  "Exists": "∃",
  "ExponentialE": "ⅇ",
  "Fcy": "Ф",
  "Ffr": "𝔉",
  "FilledSmallSquare": "◼",
  "FilledVerySmallSquare": "▪",
  "Fopf": "𝔽",
  "ForAll": "∀",
  "Fouriertrf": "ℱ",
  "Fscr": "ℱ",
  "GJcy": "Ѓ",
  "G": ">",
  "GT": ">",
  "Gamma": "Γ",
  "Gammad": "Ϝ",
  "Gbreve": "Ğ",
  "Gcedil": "Ģ",
  "Gcirc": "Ĝ",
  "Gcy": "Г",
  "Gdot": "Ġ",
  "Gfr": "𝔊",
  "Gg": "⋙",
  "Gopf": "𝔾",
  "GreaterEqual": "≥",
  "GreaterEqualLess": "⋛",
  "GreaterFullEqual": "≧",
  "GreaterGreater": "⪢",
  "GreaterLess": "≷",
  "GreaterSlantEqual": "⩾",
  "GreaterTilde": "≳",
  "Gscr": "𝒢",
  "Gt": "≫",
  "HARDcy": "Ъ",
  "Hacek": "ˇ",
  "Hat": "^",
  "Hcirc": "Ĥ",
  "Hfr": "ℌ",
  "HilbertSpace": "ℋ",
  "Hopf": "ℍ",
  "HorizontalLine": "─",
  "Hscr": "ℋ",
  "Hstrok": "Ħ",
  "HumpDownHump": "≎",
  "HumpEqual": "≏",
  "IEcy": "Е",
  "IJlig": "Ĳ",
  "IOcy": "Ё",
  "Iacut": "Í",
  "Iacute": "Í",
  "Icir": "Î",
  "Icirc": "Î",
  "Icy": "И",
  "Idot": "İ",
  "Ifr": "ℑ",
  "Igrav": "Ì",
  "Igrave": "Ì",
  "Im": "ℑ",
  "Imacr": "Ī",
  "ImaginaryI": "ⅈ",
  "Implies": "⇒",
  "Int": "∬",
  "Integral": "∫",
  "Intersection": "⋂",
  "InvisibleComma": "⁣",
  "InvisibleTimes": "⁢",
  "Iogon": "Į",
  "Iopf": "𝕀",
  "Iota": "Ι",
  "Iscr": "ℐ",
  "Itilde": "Ĩ",
  "Iukcy": "І",
  "Ium": "Ï",
  "Iuml": "Ï",
  "Jcirc": "Ĵ",
  "Jcy": "Й",
  "Jfr": "𝔍",
  "Jopf": "𝕁",
  "Jscr": "𝒥",
  "Jsercy": "Ј",
  "Jukcy": "Є",
  "KHcy": "Х",
  "KJcy": "Ќ",
  "Kappa": "Κ",
  "Kcedil": "Ķ",
  "Kcy": "К",
  "Kfr": "𝔎",
  "Kopf": "𝕂",
  "Kscr": "𝒦",
  "LJcy": "Љ",
  "L": "<",
  "LT": "<",
  "Lacute": "Ĺ",
  "Lambda": "Λ",
  "Lang": "⟪",
  "Laplacetrf": "ℒ",
  "Larr": "↞",
  "Lcaron": "Ľ",
  "Lcedil": "Ļ",
  "Lcy": "Л",
  "LeftAngleBracket": "⟨",
  "LeftArrow": "←",
  "LeftArrowBar": "⇤",
  "LeftArrowRightArrow": "⇆",
  "LeftCeiling": "⌈",
  "LeftDoubleBracket": "⟦",
  "LeftDownTeeVector": "⥡",
  "LeftDownVector": "⇃",
  "LeftDownVectorBar": "⥙",
  "LeftFloor": "⌊",
  "LeftRightArrow": "↔",
  "LeftRightVector": "⥎",
  "LeftTee": "⊣",
  "LeftTeeArrow": "↤",
  "LeftTeeVector": "⥚",
  "LeftTriangle": "⊲",
  "LeftTriangleBar": "⧏",
  "LeftTriangleEqual": "⊴",
  "LeftUpDownVector": "⥑",
  "LeftUpTeeVector": "⥠",
  "LeftUpVector": "↿",
  "LeftUpVectorBar": "⥘",
  "LeftVector": "↼",
  "LeftVectorBar": "⥒",
  "Leftarrow": "⇐",
  "Leftrightarrow": "⇔",
  "LessEqualGreater": "⋚",
  "LessFullEqual": "≦",
  "LessGreater": "≶",
  "LessLess": "⪡",
  "LessSlantEqual": "⩽",
  "LessTilde": "≲",
  "Lfr": "𝔏",
  "Ll": "⋘",
  "Lleftarrow": "⇚",
  "Lmidot": "Ŀ",
  "LongLeftArrow": "⟵",
  "LongLeftRightArrow": "⟷",
  "LongRightArrow": "⟶",
  "Longleftarrow": "⟸",
  "Longleftrightarrow": "⟺",
  "Longrightarrow": "⟹",
  "Lopf": "𝕃",
  "LowerLeftArrow": "↙",
  "LowerRightArrow": "↘",
  "Lscr": "ℒ",
  "Lsh": "↰",
  "Lstrok": "Ł",
  "Lt": "≪",
  "Map": "⤅",
  "Mcy": "М",
  "MediumSpace": " ",
  "Mellintrf": "ℳ",
  "Mfr": "𝔐",
  "MinusPlus": "∓",
  "Mopf": "𝕄",
  "Mscr": "ℳ",
  "Mu": "Μ",
  "NJcy": "Њ",
  "Nacute": "Ń",
  "Ncaron": "Ň",
  "Ncedil": "Ņ",
  "Ncy": "Н",
  "NegativeMediumSpace": "​",
  "NegativeThickSpace": "​",
  "NegativeThinSpace": "​",
  "NegativeVeryThinSpace": "​",
  "NestedGreaterGreater": "≫",
  "NestedLessLess": "≪",
  "NewLine": "\n",
  "Nfr": "𝔑",
  "NoBreak": "⁠",
  "NonBreakingSpace": " ",
  "Nopf": "ℕ",
  "Not": "⫬",
  "NotCongruent": "≢",
  "NotCupCap": "≭",
  "NotDoubleVerticalBar": "∦",
  "NotElement": "∉",
  "NotEqual": "≠",
  "NotEqualTilde": "≂̸",
  "NotExists": "∄",
  "NotGreater": "≯",
  "NotGreaterEqual": "≱",
  "NotGreaterFullEqual": "≧̸",
  "NotGreaterGreater": "≫̸",
  "NotGreaterLess": "≹",
  "NotGreaterSlantEqual": "⩾̸",
  "NotGreaterTilde": "≵",
  "NotHumpDownHump": "≎̸",
  "NotHumpEqual": "≏̸",
  "NotLeftTriangle": "⋪",
  "NotLeftTriangleBar": "⧏̸",
  "NotLeftTriangleEqual": "⋬",
  "NotLess": "≮",
  "NotLessEqual": "≰",
  "NotLessGreater": "≸",
  "NotLessLess": "≪̸",
  "NotLessSlantEqual": "⩽̸",
  "NotLessTilde": "≴",
  "NotNestedGreaterGreater": "⪢̸",
  "NotNestedLessLess": "⪡̸",
  "NotPrecedes": "⊀",
  "NotPrecedesEqual": "⪯̸",
  "NotPrecedesSlantEqual": "⋠",
  "NotReverseElement": "∌",
  "NotRightTriangle": "⋫",
  "NotRightTriangleBar": "⧐̸",
  "NotRightTriangleEqual": "⋭",
  "NotSquareSubset": "⊏̸",
  "NotSquareSubsetEqual": "⋢",
  "NotSquareSuperset": "⊐̸",
  "NotSquareSupersetEqual": "⋣",
  "NotSubset": "⊂⃒",
  "NotSubsetEqual": "⊈",
  "NotSucceeds": "⊁",
  "NotSucceedsEqual": "⪰̸",
  "NotSucceedsSlantEqual": "⋡",
  "NotSucceedsTilde": "≿̸",
  "NotSuperset": "⊃⃒",
  "NotSupersetEqual": "⊉",
  "NotTilde": "≁",
  "NotTildeEqual": "≄",
  "NotTildeFullEqual": "≇",
  "NotTildeTilde": "≉",
  "NotVerticalBar": "∤",
  "Nscr": "𝒩",
  "Ntild": "Ñ",
  "Ntilde": "Ñ",
  "Nu": "Ν",
  "OElig": "Œ",
  "Oacut": "Ó",
  "Oacute": "Ó",
  "Ocir": "Ô",
  "Ocirc": "Ô",
  "Ocy": "О",
  "Odblac": "Ő",
  "Ofr": "𝔒",
  "Ograv": "Ò",
  "Ograve": "Ò",
  "Omacr": "Ō",
  "Omega": "Ω",
  "Omicron": "Ο",
  "Oopf": "𝕆",
  "OpenCurlyDoubleQuote": "“",
  "OpenCurlyQuote": "‘",
  "Or": "⩔",
  "Oscr": "𝒪",
  "Oslas": "Ø",
  "Oslash": "Ø",
  "Otild": "Õ",
  "Otilde": "Õ",
  "Otimes": "⨷",
  "Oum": "Ö",
  "Ouml": "Ö",
  "OverBar": "‾",
  "OverBrace": "⏞",
  "OverBracket": "⎴",
  "OverParenthesis": "⏜",
  "PartialD": "∂",
  "Pcy": "П",
  "Pfr": "𝔓",
  "Phi": "Φ",
  "Pi": "Π",
  "PlusMinus": "±",
  "Poincareplane": "ℌ",
  "Popf": "ℙ",
  "Pr": "⪻",
  "Precedes": "≺",
  "PrecedesEqual": "⪯",
  "PrecedesSlantEqual": "≼",
  "PrecedesTilde": "≾",
  "Prime": "″",
  "Product": "∏",
  "Proportion": "∷",
  "Proportional": "∝",
  "Pscr": "𝒫",
  "Psi": "Ψ",
  "QUO": "\"",
  "QUOT": "\"",
  "Qfr": "𝔔",
  "Qopf": "ℚ",
  "Qscr": "𝒬",
  "RBarr": "⤐",
  "RE": "®",
  "REG": "®",
  "Racute": "Ŕ",
  "Rang": "⟫",
  "Rarr": "↠",
  "Rarrtl": "⤖",
  "Rcaron": "Ř",
  "Rcedil": "Ŗ",
  "Rcy": "Р",
  "Re": "ℜ",
  "ReverseElement": "∋",
  "ReverseEquilibrium": "⇋",
  "ReverseUpEquilibrium": "⥯",
  "Rfr": "ℜ",
  "Rho": "Ρ",
  "RightAngleBracket": "⟩",
  "RightArrow": "→",
  "RightArrowBar": "⇥",
  "RightArrowLeftArrow": "⇄",
  "RightCeiling": "⌉",
  "RightDoubleBracket": "⟧",
  "RightDownTeeVector": "⥝",
  "RightDownVector": "⇂",
  "RightDownVectorBar": "⥕",
  "RightFloor": "⌋",
  "RightTee": "⊢",
  "RightTeeArrow": "↦",
  "RightTeeVector": "⥛",
  "RightTriangle": "⊳",
  "RightTriangleBar": "⧐",
  "RightTriangleEqual": "⊵",
  "RightUpDownVector": "⥏",
  "RightUpTeeVector": "⥜",
  "RightUpVector": "↾",
  "RightUpVectorBar": "⥔",
  "RightVector": "⇀",
  "RightVectorBar": "⥓",
  "Rightarrow": "⇒",
  "Ropf": "ℝ",
  "RoundImplies": "⥰",
  "Rrightarrow": "⇛",
  "Rscr": "ℛ",
  "Rsh": "↱",
  "RuleDelayed": "⧴",
  "SHCHcy": "Щ",
  "SHcy": "Ш",
  "SOFTcy": "Ь",
  "Sacute": "Ś",
  "Sc": "⪼",
  "Scaron": "Š",
  "Scedil": "Ş",
  "Scirc": "Ŝ",
  "Scy": "С",
  "Sfr": "𝔖",
  "ShortDownArrow": "↓",
  "ShortLeftArrow": "←",
  "ShortRightArrow": "→",
  "ShortUpArrow": "↑",
  "Sigma": "Σ",
  "SmallCircle": "∘",
  "Sopf": "𝕊",
  "Sqrt": "√",
  "Square": "□",
  "SquareIntersection": "⊓",
  "SquareSubset": "⊏",
  "SquareSubsetEqual": "⊑",
  "SquareSuperset": "⊐",
  "SquareSupersetEqual": "⊒",
  "SquareUnion": "⊔",
  "Sscr": "𝒮",
  "Star": "⋆",
  "Sub": "⋐",
  "Subset": "⋐",
  "SubsetEqual": "⊆",
  "Succeeds": "≻",
  "SucceedsEqual": "⪰",
  "SucceedsSlantEqual": "≽",
  "SucceedsTilde": "≿",
  "SuchThat": "∋",
  "Sum": "∑",
  "Sup": "⋑",
  "Superset": "⊃",
  "SupersetEqual": "⊇",
  "Supset": "⋑",
  "THOR": "Þ",
  "THORN": "Þ",
  "TRADE": "™",
  "TSHcy": "Ћ",
  "TScy": "Ц",
  "Tab": "\t",
  "Tau": "Τ",
  "Tcaron": "Ť",
  "Tcedil": "Ţ",
  "Tcy": "Т",
  "Tfr": "𝔗",
  "Therefore": "∴",
  "Theta": "Θ",
  "ThickSpace": "  ",
  "ThinSpace": " ",
  "Tilde": "∼",
  "TildeEqual": "≃",
  "TildeFullEqual": "≅",
  "TildeTilde": "≈",
  "Topf": "𝕋",
  "TripleDot": "⃛",
  "Tscr": "𝒯",
  "Tstrok": "Ŧ",
  "Uacut": "Ú",
  "Uacute": "Ú",
  "Uarr": "↟",
  "Uarrocir": "⥉",
  "Ubrcy": "Ў",
  "Ubreve": "Ŭ",
  "Ucir": "Û",
  "Ucirc": "Û",
  "Ucy": "У",
  "Udblac": "Ű",
  "Ufr": "𝔘",
  "Ugrav": "Ù",
  "Ugrave": "Ù",
  "Umacr": "Ū",
  "UnderBar": "_",
  "UnderBrace": "⏟",
  "UnderBracket": "⎵",
  "UnderParenthesis": "⏝",
  "Union": "⋃",
  "UnionPlus": "⊎",
  "Uogon": "Ų",
  "Uopf": "𝕌",
  "UpArrow": "↑",
  "UpArrowBar": "⤒",
  "UpArrowDownArrow": "⇅",
  "UpDownArrow": "↕",
  "UpEquilibrium": "⥮",
  "UpTee": "⊥",
  "UpTeeArrow": "↥",
  "Uparrow": "⇑",
  "Updownarrow": "⇕",
  "UpperLeftArrow": "↖",
  "UpperRightArrow": "↗",
  "Upsi": "ϒ",
  "Upsilon": "Υ",
  "Uring": "Ů",
  "Uscr": "𝒰",
  "Utilde": "Ũ",
  "Uum": "Ü",
  "Uuml": "Ü",
  "VDash": "⊫",
  "Vbar": "⫫",
  "Vcy": "В",
  "Vdash": "⊩",
  "Vdashl": "⫦",
  "Vee": "⋁",
  "Verbar": "‖",
  "Vert": "‖",
  "VerticalBar": "∣",
  "VerticalLine": "|",
  "VerticalSeparator": "❘",
  "VerticalTilde": "≀",
  "VeryThinSpace": " ",
  "Vfr": "𝔙",
  "Vopf": "𝕍",
  "Vscr": "𝒱",
  "Vvdash": "⊪",
  "Wcirc": "Ŵ",
  "Wedge": "⋀",
  "Wfr": "𝔚",
  "Wopf": "𝕎",
  "Wscr": "𝒲",
  "Xfr": "𝔛",
  "Xi": "Ξ",
  "Xopf": "𝕏",
  "Xscr": "𝒳",
  "YAcy": "Я",
  "YIcy": "Ї",
  "YUcy": "Ю",
  "Yacut": "Ý",
  "Yacute": "Ý",
  "Ycirc": "Ŷ",
  "Ycy": "Ы",
  "Yfr": "𝔜",
  "Yopf": "𝕐",
  "Yscr": "𝒴",
  "Yuml": "Ÿ",
  "ZHcy": "Ж",
  "Zacute": "Ź",
  "Zcaron": "Ž",
  "Zcy": "З",
  "Zdot": "Ż",
  "ZeroWidthSpace": "​",
  "Zeta": "Ζ",
  "Zfr": "ℨ",
  "Zopf": "ℤ",
  "Zscr": "𝒵",
  "aacut": "á",
  "aacute": "á",
  "abreve": "ă",
  "ac": "∾",
  "acE": "∾̳",
  "acd": "∿",
  "acir": "â",
  "acirc": "â",
  "acut": "´",
  "acute": "´",
  "acy": "а",
  "aeli": "æ",
  "aelig": "æ",
  "af": "⁡",
  "afr": "𝔞",
  "agrav": "à",
  "agrave": "à",
  "alefsym": "ℵ",
  "aleph": "ℵ",
  "alpha": "α",
  "amacr": "ā",
  "amalg": "⨿",
  "am": "&",
  "amp": "&",
  "and": "∧",
  "andand": "⩕",
  "andd": "⩜",
  "andslope": "⩘",
  "andv": "⩚",
  "ang": "∠",
  "ange": "⦤",
  "angle": "∠",
  "angmsd": "∡",
  "angmsdaa": "⦨",
  "angmsdab": "⦩",
  "angmsdac": "⦪",
  "angmsdad": "⦫",
  "angmsdae": "⦬",
  "angmsdaf": "⦭",
  "angmsdag": "⦮",
  "angmsdah": "⦯",
  "angrt": "∟",
  "angrtvb": "⊾",
  "angrtvbd": "⦝",
  "angsph": "∢",
  "angst": "Å",
  "angzarr": "⍼",
  "aogon": "ą",
  "aopf": "𝕒",
  "ap": "≈",
  "apE": "⩰",
  "apacir": "⩯",
  "ape": "≊",
  "apid": "≋",
  "apos": "'",
  "approx": "≈",
  "approxeq": "≊",
  "arin": "å",
  "aring": "å",
  "ascr": "𝒶",
  "ast": "*",
  "asymp": "≈",
  "asympeq": "≍",
  "atild": "ã",
  "atilde": "ã",
  "aum": "ä",
  "auml": "ä",
  "awconint": "∳",
  "awint": "⨑",
  "bNot": "⫭",
  "backcong": "≌",
  "backepsilon": "϶",
  "backprime": "‵",
  "backsim": "∽",
  "backsimeq": "⋍",
  "barvee": "⊽",
  "barwed": "⌅",
  "barwedge": "⌅",
  "bbrk": "⎵",
  "bbrktbrk": "⎶",
  "bcong": "≌",
  "bcy": "б",
  "bdquo": "„",
  "becaus": "∵",
  "because": "∵",
  "bemptyv": "⦰",
  "bepsi": "϶",
  "bernou": "ℬ",
  "beta": "β",
  "beth": "ℶ",
  "between": "≬",
  "bfr": "𝔟",
  "bigcap": "⋂",
  "bigcirc": "◯",
  "bigcup": "⋃",
  "bigodot": "⨀",
  "bigoplus": "⨁",
  "bigotimes": "⨂",
  "bigsqcup": "⨆",
  "bigstar": "★",
  "bigtriangledown": "▽",
  "bigtriangleup": "△",
  "biguplus": "⨄",
  "bigvee": "⋁",
  "bigwedge": "⋀",
  "bkarow": "⤍",
  "blacklozenge": "⧫",
  "blacksquare": "▪",
  "blacktriangle": "▴",
  "blacktriangledown": "▾",
  "blacktriangleleft": "◂",
  "blacktriangleright": "▸",
  "blank": "␣",
  "blk12": "▒",
  "blk14": "░",
  "blk34": "▓",
  "block": "█",
  "bne": "=⃥",
  "bnequiv": "≡⃥",
  "bnot": "⌐",
  "bopf": "𝕓",
  "bot": "⊥",
  "bottom": "⊥",
  "bowtie": "⋈",
  "boxDL": "╗",
  "boxDR": "╔",
  "boxDl": "╖",
  "boxDr": "╓",
  "boxH": "═",
  "boxHD": "╦",
  "boxHU": "╩",
  "boxHd": "╤",
  "boxHu": "╧",
  "boxUL": "╝",
  "boxUR": "╚",
  "boxUl": "╜",
  "boxUr": "╙",
  "boxV": "║",
  "boxVH": "╬",
  "boxVL": "╣",
  "boxVR": "╠",
  "boxVh": "╫",
  "boxVl": "╢",
  "boxVr": "╟",
  "boxbox": "⧉",
  "boxdL": "╕",
  "boxdR": "╒",
  "boxdl": "┐",
  "boxdr": "┌",
  "boxh": "─",
  "boxhD": "╥",
  "boxhU": "╨",
  "boxhd": "┬",
  "boxhu": "┴",
  "boxminus": "⊟",
  "boxplus": "⊞",
  "boxtimes": "⊠",
  "boxuL": "╛",
  "boxuR": "╘",
  "boxul": "┘",
  "boxur": "└",
  "boxv": "│",
  "boxvH": "╪",
  "boxvL": "╡",
  "boxvR": "╞",
  "boxvh": "┼",
  "boxvl": "┤",
  "boxvr": "├",
  "bprime": "‵",
  "breve": "˘",
  "brvba": "¦",
  "brvbar": "¦",
  "bscr": "𝒷",
  "bsemi": "⁏",
  "bsim": "∽",
  "bsime": "⋍",
  "bsol": "\\",
  "bsolb": "⧅",
  "bsolhsub": "⟈",
  "bull": "•",
  "bullet": "•",
  "bump": "≎",
  "bumpE": "⪮",
  "bumpe": "≏",
  "bumpeq": "≏",
  "cacute": "ć",
  "cap": "∩",
  "capand": "⩄",
  "capbrcup": "⩉",
  "capcap": "⩋",
  "capcup": "⩇",
  "capdot": "⩀",
  "caps": "∩︀",
  "caret": "⁁",
  "caron": "ˇ",
  "ccaps": "⩍",
  "ccaron": "č",
  "ccedi": "ç",
  "ccedil": "ç",
  "ccirc": "ĉ",
  "ccups": "⩌",
  "ccupssm": "⩐",
  "cdot": "ċ",
  "cedi": "¸",
  "cedil": "¸",
  "cemptyv": "⦲",
  "cen": "¢",
  "cent": "¢",
  "centerdot": "·",
  "cfr": "𝔠",
  "chcy": "ч",
  "check": "✓",
  "checkmark": "✓",
  "chi": "χ",
  "cir": "○",
  "cirE": "⧃",
  "circ": "ˆ",
  "circeq": "≗",
  "circlearrowleft": "↺",
  "circlearrowright": "↻",
  "circledR": "®",
  "circledS": "Ⓢ",
  "circledast": "⊛",
  "circledcirc": "⊚",
  "circleddash": "⊝",
  "cire": "≗",
  "cirfnint": "⨐",
  "cirmid": "⫯",
  "cirscir": "⧂",
  "clubs": "♣",
  "clubsuit": "♣",
  "colon": ":",
  "colone": "≔",
  "coloneq": "≔",
  "comma": ",",
  "commat": "@",
  "comp": "∁",
  "compfn": "∘",
  "complement": "∁",
  "complexes": "ℂ",
  "cong": "≅",
  "congdot": "⩭",
  "conint": "∮",
  "copf": "𝕔",
  "coprod": "∐",
  "cop": "©",
  "copy": "©",
  "copysr": "℗",
  "crarr": "↵",
  "cross": "✗",
  "cscr": "𝒸",
  "csub": "⫏",
  "csube": "⫑",
  "csup": "⫐",
  "csupe": "⫒",
  "ctdot": "⋯",
  "cudarrl": "⤸",
  "cudarrr": "⤵",
  "cuepr": "⋞",
  "cuesc": "⋟",
  "cularr": "↶",
  "cularrp": "⤽",
  "cup": "∪",
  "cupbrcap": "⩈",
  "cupcap": "⩆",
  "cupcup": "⩊",
  "cupdot": "⊍",
  "cupor": "⩅",
  "cups": "∪︀",
  "curarr": "↷",
  "curarrm": "⤼",
  "curlyeqprec": "⋞",
  "curlyeqsucc": "⋟",
  "curlyvee": "⋎",
  "curlywedge": "⋏",
  "curre": "¤",
  "curren": "¤",
  "curvearrowleft": "↶",
  "curvearrowright": "↷",
  "cuvee": "⋎",
  "cuwed": "⋏",
  "cwconint": "∲",
  "cwint": "∱",
  "cylcty": "⌭",
  "dArr": "⇓",
  "dHar": "⥥",
  "dagger": "†",
  "daleth": "ℸ",
  "darr": "↓",
  "dash": "‐",
  "dashv": "⊣",
  "dbkarow": "⤏",
  "dblac": "˝",
  "dcaron": "ď",
  "dcy": "д",
  "dd": "ⅆ",
  "ddagger": "‡",
  "ddarr": "⇊",
  "ddotseq": "⩷",
  "de": "°",
  "deg": "°",
  "delta": "δ",
  "demptyv": "⦱",
  "dfisht": "⥿",
  "dfr": "𝔡",
  "dharl": "⇃",
  "dharr": "⇂",
  "diam": "⋄",
  "diamond": "⋄",
  "diamondsuit": "♦",
  "diams": "♦",
  "die": "¨",
  "digamma": "ϝ",
  "disin": "⋲",
  "div": "÷",
  "divid": "÷",
  "divide": "÷",
  "divideontimes": "⋇",
  "divonx": "⋇",
  "djcy": "ђ",
  "dlcorn": "⌞",
  "dlcrop": "⌍",
  "dollar": "$",
  "dopf": "𝕕",
  "dot": "˙",
  "doteq": "≐",
  "doteqdot": "≑",
  "dotminus": "∸",
  "dotplus": "∔",
  "dotsquare": "⊡",
  "doublebarwedge": "⌆",
  "downarrow": "↓",
  "downdownarrows": "⇊",
  "downharpoonleft": "⇃",
  "downharpoonright": "⇂",
  "drbkarow": "⤐",
  "drcorn": "⌟",
  "drcrop": "⌌",
  "dscr": "𝒹",
  "dscy": "ѕ",
  "dsol": "⧶",
  "dstrok": "đ",
  "dtdot": "⋱",
  "dtri": "▿",
  "dtrif": "▾",
  "duarr": "⇵",
  "duhar": "⥯",
  "dwangle": "⦦",
  "dzcy": "џ",
  "dzigrarr": "⟿",
  "eDDot": "⩷",
  "eDot": "≑",
  "eacut": "é",
  "eacute": "é",
  "easter": "⩮",
  "ecaron": "ě",
  "ecir": "ê",
  "ecirc": "ê",
  "ecolon": "≕",
  "ecy": "э",
  "edot": "ė",
  "ee": "ⅇ",
  "efDot": "≒",
  "efr": "𝔢",
  "eg": "⪚",
  "egrav": "è",
  "egrave": "è",
  "egs": "⪖",
  "egsdot": "⪘",
  "el": "⪙",
  "elinters": "⏧",
  "ell": "ℓ",
  "els": "⪕",
  "elsdot": "⪗",
  "emacr": "ē",
  "empty": "∅",
  "emptyset": "∅",
  "emptyv": "∅",
  "emsp13": " ",
  "emsp14": " ",
  "emsp": " ",
  "eng": "ŋ",
  "ensp": " ",
  "eogon": "ę",
  "eopf": "𝕖",
  "epar": "⋕",
  "eparsl": "⧣",
  "eplus": "⩱",
  "epsi": "ε",
  "epsilon": "ε",
  "epsiv": "ϵ",
  "eqcirc": "≖",
  "eqcolon": "≕",
  "eqsim": "≂",
  "eqslantgtr": "⪖",
  "eqslantless": "⪕",
  "equals": "=",
  "equest": "≟",
  "equiv": "≡",
  "equivDD": "⩸",
  "eqvparsl": "⧥",
  "erDot": "≓",
  "erarr": "⥱",
  "escr": "ℯ",
  "esdot": "≐",
  "esim": "≂",
  "eta": "η",
  "et": "ð",
  "eth": "ð",
  "eum": "ë",
  "euml": "ë",
  "euro": "€",
  "excl": "!",
  "exist": "∃",
  "expectation": "ℰ",
  "exponentiale": "ⅇ",
  "fallingdotseq": "≒",
  "fcy": "ф",
  "female": "♀",
  "ffilig": "ﬃ",
  "fflig": "ﬀ",
  "ffllig": "ﬄ",
  "ffr": "𝔣",
  "filig": "ﬁ",
  "fjlig": "fj",
  "flat": "♭",
  "fllig": "ﬂ",
  "fltns": "▱",
  "fnof": "ƒ",
  "fopf": "𝕗",
  "forall": "∀",
  "fork": "⋔",
  "forkv": "⫙",
  "fpartint": "⨍",
  "frac1": "¼",
  "frac12": "½",
  "frac13": "⅓",
  "frac14": "¼",
  "frac15": "⅕",
  "frac16": "⅙",
  "frac18": "⅛",
  "frac23": "⅔",
  "frac25": "⅖",
  "frac3": "¾",
  "frac34": "¾",
  "frac35": "⅗",
  "frac38": "⅜",
  "frac45": "⅘",
  "frac56": "⅚",
  "frac58": "⅝",
  "frac78": "⅞",
  "frasl": "⁄",
  "frown": "⌢",
  "fscr": "𝒻",
  "gE": "≧",
  "gEl": "⪌",
  "gacute": "ǵ",
  "gamma": "γ",
  "gammad": "ϝ",
  "gap": "⪆",
  "gbreve": "ğ",
  "gcirc": "ĝ",
  "gcy": "г",
  "gdot": "ġ",
  "ge": "≥",
  "gel": "⋛",
  "geq": "≥",
  "geqq": "≧",
  "geqslant": "⩾",
  "ges": "⩾",
  "gescc": "⪩",
  "gesdot": "⪀",
  "gesdoto": "⪂",
  "gesdotol": "⪄",
  "gesl": "⋛︀",
  "gesles": "⪔",
  "gfr": "𝔤",
  "gg": "≫",
  "ggg": "⋙",
  "gimel": "ℷ",
  "gjcy": "ѓ",
  "gl": "≷",
  "glE": "⪒",
  "gla": "⪥",
  "glj": "⪤",
  "gnE": "≩",
  "gnap": "⪊",
  "gnapprox": "⪊",
  "gne": "⪈",
  "gneq": "⪈",
  "gneqq": "≩",
  "gnsim": "⋧",
  "gopf": "𝕘",
  "grave": "`",
  "gscr": "ℊ",
  "gsim": "≳",
  "gsime": "⪎",
  "gsiml": "⪐",
  "g": ">",
  "gt": ">",
  "gtcc": "⪧",
  "gtcir": "⩺",
  "gtdot": "⋗",
  "gtlPar": "⦕",
  "gtquest": "⩼",
  "gtrapprox": "⪆",
  "gtrarr": "⥸",
  "gtrdot": "⋗",
  "gtreqless": "⋛",
  "gtreqqless": "⪌",
  "gtrless": "≷",
  "gtrsim": "≳",
  "gvertneqq": "≩︀",
  "gvnE": "≩︀",
  "hArr": "⇔",
  "hairsp": " ",
  "half": "½",
  "hamilt": "ℋ",
  "hardcy": "ъ",
  "harr": "↔",
  "harrcir": "⥈",
  "harrw": "↭",
  "hbar": "ℏ",
  "hcirc": "ĥ",
  "hearts": "♥",
  "heartsuit": "♥",
  "hellip": "…",
  "hercon": "⊹",
  "hfr": "𝔥",
  "hksearow": "⤥",
  "hkswarow": "⤦",
  "hoarr": "⇿",
  "homtht": "∻",
  "hookleftarrow": "↩",
  "hookrightarrow": "↪",
  "hopf": "𝕙",
  "horbar": "―",
  "hscr": "𝒽",
  "hslash": "ℏ",
  "hstrok": "ħ",
  "hybull": "⁃",
  "hyphen": "‐",
  "iacut": "í",
  "iacute": "í",
  "ic": "⁣",
  "icir": "î",
  "icirc": "î",
  "icy": "и",
  "iecy": "е",
  "iexc": "¡",
  "iexcl": "¡",
  "iff": "⇔",
  "ifr": "𝔦",
  "igrav": "ì",
  "igrave": "ì",
  "ii": "ⅈ",
  "iiiint": "⨌",
  "iiint": "∭",
  "iinfin": "⧜",
  "iiota": "℩",
  "ijlig": "ĳ",
  "imacr": "ī",
  "image": "ℑ",
  "imagline": "ℐ",
  "imagpart": "ℑ",
  "imath": "ı",
  "imof": "⊷",
  "imped": "Ƶ",
  "in": "∈",
  "incare": "℅",
  "infin": "∞",
  "infintie": "⧝",
  "inodot": "ı",
  "int": "∫",
  "intcal": "⊺",
  "integers": "ℤ",
  "intercal": "⊺",
  "intlarhk": "⨗",
  "intprod": "⨼",
  "iocy": "ё",
  "iogon": "į",
  "iopf": "𝕚",
  "iota": "ι",
  "iprod": "⨼",
  "iques": "¿",
  "iquest": "¿",
  "iscr": "𝒾",
  "isin": "∈",
  "isinE": "⋹",
  "isindot": "⋵",
  "isins": "⋴",
  "isinsv": "⋳",
  "isinv": "∈",
  "it": "⁢",
  "itilde": "ĩ",
  "iukcy": "і",
  "ium": "ï",
  "iuml": "ï",
  "jcirc": "ĵ",
  "jcy": "й",
  "jfr": "𝔧",
  "jmath": "ȷ",
  "jopf": "𝕛",
  "jscr": "𝒿",
  "jsercy": "ј",
  "jukcy": "є",
  "kappa": "κ",
  "kappav": "ϰ",
  "kcedil": "ķ",
  "kcy": "к",
  "kfr": "𝔨",
  "kgreen": "ĸ",
  "khcy": "х",
  "kjcy": "ќ",
  "kopf": "𝕜",
  "kscr": "𝓀",
  "lAarr": "⇚",
  "lArr": "⇐",
  "lAtail": "⤛",
  "lBarr": "⤎",
  "lE": "≦",
  "lEg": "⪋",
  "lHar": "⥢",
  "lacute": "ĺ",
  "laemptyv": "⦴",
  "lagran": "ℒ",
  "lambda": "λ",
  "lang": "⟨",
  "langd": "⦑",
  "langle": "⟨",
  "lap": "⪅",
  "laqu": "«",
  "laquo": "«",
  "larr": "←",
  "larrb": "⇤",
  "larrbfs": "⤟",
  "larrfs": "⤝",
  "larrhk": "↩",
  "larrlp": "↫",
  "larrpl": "⤹",
  "larrsim": "⥳",
  "larrtl": "↢",
  "lat": "⪫",
  "latail": "⤙",
  "late": "⪭",
  "lates": "⪭︀",
  "lbarr": "⤌",
  "lbbrk": "❲",
  "lbrace": "{",
  "lbrack": "[",
  "lbrke": "⦋",
  "lbrksld": "⦏",
  "lbrkslu": "⦍",
  "lcaron": "ľ",
  "lcedil": "ļ",
  "lceil": "⌈",
  "lcub": "{",
  "lcy": "л",
  "ldca": "⤶",
  "ldquo": "“",
  "ldquor": "„",
  "ldrdhar": "⥧",
  "ldrushar": "⥋",
  "ldsh": "↲",
  "le": "≤",
  "leftarrow": "←",
  "leftarrowtail": "↢",
  "leftharpoondown": "↽",
  "leftharpoonup": "↼",
  "leftleftarrows": "⇇",
  "leftrightarrow": "↔",
  "leftrightarrows": "⇆",
  "leftrightharpoons": "⇋",
  "leftrightsquigarrow": "↭",
  "leftthreetimes": "⋋",
  "leg": "⋚",
  "leq": "≤",
  "leqq": "≦",
  "leqslant": "⩽",
  "les": "⩽",
  "lescc": "⪨",
  "lesdot": "⩿",
  "lesdoto": "⪁",
  "lesdotor": "⪃",
  "lesg": "⋚︀",
  "lesges": "⪓",
  "lessapprox": "⪅",
  "lessdot": "⋖",
  "lesseqgtr": "⋚",
  "lesseqqgtr": "⪋",
  "lessgtr": "≶",
  "lesssim": "≲",
  "lfisht": "⥼",
  "lfloor": "⌊",
  "lfr": "𝔩",
  "lg": "≶",
  "lgE": "⪑",
  "lhard": "↽",
  "lharu": "↼",
  "lharul": "⥪",
  "lhblk": "▄",
  "ljcy": "љ",
  "ll": "≪",
  "llarr": "⇇",
  "llcorner": "⌞",
  "llhard": "⥫",
  "lltri": "◺",
  "lmidot": "ŀ",
  "lmoust": "⎰",
  "lmoustache": "⎰",
  "lnE": "≨",
  "lnap": "⪉",
  "lnapprox": "⪉",
  "lne": "⪇",
  "lneq": "⪇",
  "lneqq": "≨",
  "lnsim": "⋦",
  "loang": "⟬",
  "loarr": "⇽",
  "lobrk": "⟦",
  "longleftarrow": "⟵",
  "longleftrightarrow": "⟷",
  "longmapsto": "⟼",
  "longrightarrow": "⟶",
  "looparrowleft": "↫",
  "looparrowright": "↬",
  "lopar": "⦅",
  "lopf": "𝕝",
  "loplus": "⨭",
  "lotimes": "⨴",
  "lowast": "∗",
  "lowbar": "_",
  "loz": "◊",
  "lozenge": "◊",
  "lozf": "⧫",
  "lpar": "(",
  "lparlt": "⦓",
  "lrarr": "⇆",
  "lrcorner": "⌟",
  "lrhar": "⇋",
  "lrhard": "⥭",
  "lrm": "‎",
  "lrtri": "⊿",
  "lsaquo": "‹",
  "lscr": "𝓁",
  "lsh": "↰",
  "lsim": "≲",
  "lsime": "⪍",
  "lsimg": "⪏",
  "lsqb": "[",
  "lsquo": "‘",
  "lsquor": "‚",
  "lstrok": "ł",
  "l": "<",
  "lt": "<",
  "ltcc": "⪦",
  "ltcir": "⩹",
  "ltdot": "⋖",
  "lthree": "⋋",
  "ltimes": "⋉",
  "ltlarr": "⥶",
  "ltquest": "⩻",
  "ltrPar": "⦖",
  "ltri": "◃",
  "ltrie": "⊴",
  "ltrif": "◂",
  "lurdshar": "⥊",
  "luruhar": "⥦",
  "lvertneqq": "≨︀",
  "lvnE": "≨︀",
  "mDDot": "∺",
  "mac": "¯",
  "macr": "¯",
  "male": "♂",
  "malt": "✠",
  "maltese": "✠",
  "map": "↦",
  "mapsto": "↦",
  "mapstodown": "↧",
  "mapstoleft": "↤",
  "mapstoup": "↥",
  "marker": "▮",
  "mcomma": "⨩",
  "mcy": "м",
  "mdash": "—",
  "measuredangle": "∡",
  "mfr": "𝔪",
  "mho": "℧",
  "micr": "µ",
  "micro": "µ",
  "mid": "∣",
  "midast": "*",
  "midcir": "⫰",
  "middo": "·",
  "middot": "·",
  "minus": "−",
  "minusb": "⊟",
  "minusd": "∸",
  "minusdu": "⨪",
  "mlcp": "⫛",
  "mldr": "…",
  "mnplus": "∓",
  "models": "⊧",
  "mopf": "𝕞",
  "mp": "∓",
  "mscr": "𝓂",
  "mstpos": "∾",
  "mu": "μ",
  "multimap": "⊸",
  "mumap": "⊸",
  "nGg": "⋙̸",
  "nGt": "≫⃒",
  "nGtv": "≫̸",
  "nLeftarrow": "⇍",
  "nLeftrightarrow": "⇎",
  "nLl": "⋘̸",
  "nLt": "≪⃒",
  "nLtv": "≪̸",
  "nRightarrow": "⇏",
  "nVDash": "⊯",
  "nVdash": "⊮",
  "nabla": "∇",
  "nacute": "ń",
  "nang": "∠⃒",
  "nap": "≉",
  "napE": "⩰̸",
  "napid": "≋̸",
  "napos": "ŉ",
  "napprox": "≉",
  "natur": "♮",
  "natural": "♮",
  "naturals": "ℕ",
  "nbs": " ",
  "nbsp": " ",
  "nbump": "≎̸",
  "nbumpe": "≏̸",
  "ncap": "⩃",
  "ncaron": "ň",
  "ncedil": "ņ",
  "ncong": "≇",
  "ncongdot": "⩭̸",
  "ncup": "⩂",
  "ncy": "н",
  "ndash": "–",
  "ne": "≠",
  "neArr": "⇗",
  "nearhk": "⤤",
  "nearr": "↗",
  "nearrow": "↗",
  "nedot": "≐̸",
  "nequiv": "≢",
  "nesear": "⤨",
  "nesim": "≂̸",
  "nexist": "∄",
  "nexists": "∄",
  "nfr": "𝔫",
  "ngE": "≧̸",
  "nge": "≱",
  "ngeq": "≱",
  "ngeqq": "≧̸",
  "ngeqslant": "⩾̸",
  "nges": "⩾̸",
  "ngsim": "≵",
  "ngt": "≯",
  "ngtr": "≯",
  "nhArr": "⇎",
  "nharr": "↮",
  "nhpar": "⫲",
  "ni": "∋",
  "nis": "⋼",
  "nisd": "⋺",
  "niv": "∋",
  "njcy": "њ",
  "nlArr": "⇍",
  "nlE": "≦̸",
  "nlarr": "↚",
  "nldr": "‥",
  "nle": "≰",
  "nleftarrow": "↚",
  "nleftrightarrow": "↮",
  "nleq": "≰",
  "nleqq": "≦̸",
  "nleqslant": "⩽̸",
  "nles": "⩽̸",
  "nless": "≮",
  "nlsim": "≴",
  "nlt": "≮",
  "nltri": "⋪",
  "nltrie": "⋬",
  "nmid": "∤",
  "nopf": "𝕟",
  "no": "¬",
  "not": "¬",
  "notin": "∉",
  "notinE": "⋹̸",
  "notindot": "⋵̸",
  "notinva": "∉",
  "notinvb": "⋷",
  "notinvc": "⋶",
  "notni": "∌",
  "notniva": "∌",
  "notnivb": "⋾",
  "notnivc": "⋽",
  "npar": "∦",
  "nparallel": "∦",
  "nparsl": "⫽⃥",
  "npart": "∂̸",
  "npolint": "⨔",
  "npr": "⊀",
  "nprcue": "⋠",
  "npre": "⪯̸",
  "nprec": "⊀",
  "npreceq": "⪯̸",
  "nrArr": "⇏",
  "nrarr": "↛",
  "nrarrc": "⤳̸",
  "nrarrw": "↝̸",
  "nrightarrow": "↛",
  "nrtri": "⋫",
  "nrtrie": "⋭",
  "nsc": "⊁",
  "nsccue": "⋡",
  "nsce": "⪰̸",
  "nscr": "𝓃",
  "nshortmid": "∤",
  "nshortparallel": "∦",
  "nsim": "≁",
  "nsime": "≄",
  "nsimeq": "≄",
  "nsmid": "∤",
  "nspar": "∦",
  "nsqsube": "⋢",
  "nsqsupe": "⋣",
  "nsub": "⊄",
  "nsubE": "⫅̸",
  "nsube": "⊈",
  "nsubset": "⊂⃒",
  "nsubseteq": "⊈",
  "nsubseteqq": "⫅̸",
  "nsucc": "⊁",
  "nsucceq": "⪰̸",
  "nsup": "⊅",
  "nsupE": "⫆̸",
  "nsupe": "⊉",
  "nsupset": "⊃⃒",
  "nsupseteq": "⊉",
  "nsupseteqq": "⫆̸",
  "ntgl": "≹",
  "ntild": "ñ",
  "ntilde": "ñ",
  "ntlg": "≸",
  "ntriangleleft": "⋪",
  "ntrianglelefteq": "⋬",
  "ntriangleright": "⋫",
  "ntrianglerighteq": "⋭",
  "nu": "ν",
  "num": "#",
  "numero": "№",
  "numsp": " ",
  "nvDash": "⊭",
  "nvHarr": "⤄",
  "nvap": "≍⃒",
  "nvdash": "⊬",
  "nvge": "≥⃒",
  "nvgt": ">⃒",
  "nvinfin": "⧞",
  "nvlArr": "⤂",
  "nvle": "≤⃒",
  "nvlt": "<⃒",
  "nvltrie": "⊴⃒",
  "nvrArr": "⤃",
  "nvrtrie": "⊵⃒",
  "nvsim": "∼⃒",
  "nwArr": "⇖",
  "nwarhk": "⤣",
  "nwarr": "↖",
  "nwarrow": "↖",
  "nwnear": "⤧",
  "oS": "Ⓢ",
  "oacut": "ó",
  "oacute": "ó",
  "oast": "⊛",
  "ocir": "ô",
  "ocirc": "ô",
  "ocy": "о",
  "odash": "⊝",
  "odblac": "ő",
  "odiv": "⨸",
  "odot": "⊙",
  "odsold": "⦼",
  "oelig": "œ",
  "ofcir": "⦿",
  "ofr": "𝔬",
  "ogon": "˛",
  "ograv": "ò",
  "ograve": "ò",
  "ogt": "⧁",
  "ohbar": "⦵",
  "ohm": "Ω",
  "oint": "∮",
  "olarr": "↺",
  "olcir": "⦾",
  "olcross": "⦻",
  "oline": "‾",
  "olt": "⧀",
  "omacr": "ō",
  "omega": "ω",
  "omicron": "ο",
  "omid": "⦶",
  "ominus": "⊖",
  "oopf": "𝕠",
  "opar": "⦷",
  "operp": "⦹",
  "oplus": "⊕",
  "or": "∨",
  "orarr": "↻",
  "ord": "º",
  "order": "ℴ",
  "orderof": "ℴ",
  "ordf": "ª",
  "ordm": "º",
  "origof": "⊶",
  "oror": "⩖",
  "orslope": "⩗",
  "orv": "⩛",
  "oscr": "ℴ",
  "oslas": "ø",
  "oslash": "ø",
  "osol": "⊘",
  "otild": "õ",
  "otilde": "õ",
  "otimes": "⊗",
  "otimesas": "⨶",
  "oum": "ö",
  "ouml": "ö",
  "ovbar": "⌽",
  "par": "¶",
  "para": "¶",
  "parallel": "∥",
  "parsim": "⫳",
  "parsl": "⫽",
  "part": "∂",
  "pcy": "п",
  "percnt": "%",
  "period": ".",
  "permil": "‰",
  "perp": "⊥",
  "pertenk": "‱",
  "pfr": "𝔭",
  "phi": "φ",
  "phiv": "ϕ",
  "phmmat": "ℳ",
  "phone": "☎",
  "pi": "π",
  "pitchfork": "⋔",
  "piv": "ϖ",
  "planck": "ℏ",
  "planckh": "ℎ",
  "plankv": "ℏ",
  "plus": "+",
  "plusacir": "⨣",
  "plusb": "⊞",
  "pluscir": "⨢",
  "plusdo": "∔",
  "plusdu": "⨥",
  "pluse": "⩲",
  "plusm": "±",
  "plusmn": "±",
  "plussim": "⨦",
  "plustwo": "⨧",
  "pm": "±",
  "pointint": "⨕",
  "popf": "𝕡",
  "poun": "£",
  "pound": "£",
  "pr": "≺",
  "prE": "⪳",
  "prap": "⪷",
  "prcue": "≼",
  "pre": "⪯",
  "prec": "≺",
  "precapprox": "⪷",
  "preccurlyeq": "≼",
  "preceq": "⪯",
  "precnapprox": "⪹",
  "precneqq": "⪵",
  "precnsim": "⋨",
  "precsim": "≾",
  "prime": "′",
  "primes": "ℙ",
  "prnE": "⪵",
  "prnap": "⪹",
  "prnsim": "⋨",
  "prod": "∏",
  "profalar": "⌮",
  "profline": "⌒",
  "profsurf": "⌓",
  "prop": "∝",
  "propto": "∝",
  "prsim": "≾",
  "prurel": "⊰",
  "pscr": "𝓅",
  "psi": "ψ",
  "puncsp": " ",
  "qfr": "𝔮",
  "qint": "⨌",
  "qopf": "𝕢",
  "qprime": "⁗",
  "qscr": "𝓆",
  "quaternions": "ℍ",
  "quatint": "⨖",
  "quest": "?",
  "questeq": "≟",
  "quo": "\"",
  "quot": "\"",
  "rAarr": "⇛",
  "rArr": "⇒",
  "rAtail": "⤜",
  "rBarr": "⤏",
  "rHar": "⥤",
  "race": "∽̱",
  "racute": "ŕ",
  "radic": "√",
  "raemptyv": "⦳",
  "rang": "⟩",
  "rangd": "⦒",
  "range": "⦥",
  "rangle": "⟩",
  "raqu": "»",
  "raquo": "»",
  "rarr": "→",
  "rarrap": "⥵",
  "rarrb": "⇥",
  "rarrbfs": "⤠",
  "rarrc": "⤳",
  "rarrfs": "⤞",
  "rarrhk": "↪",
  "rarrlp": "↬",
  "rarrpl": "⥅",
  "rarrsim": "⥴",
  "rarrtl": "↣",
  "rarrw": "↝",
  "ratail": "⤚",
  "ratio": "∶",
  "rationals": "ℚ",
  "rbarr": "⤍",
  "rbbrk": "❳",
  "rbrace": "}",
  "rbrack": "]",
  "rbrke": "⦌",
  "rbrksld": "⦎",
  "rbrkslu": "⦐",
  "rcaron": "ř",
  "rcedil": "ŗ",
  "rceil": "⌉",
  "rcub": "}",
  "rcy": "р",
  "rdca": "⤷",
  "rdldhar": "⥩",
  "rdquo": "”",
  "rdquor": "”",
  "rdsh": "↳",
  "real": "ℜ",
  "realine": "ℛ",
  "realpart": "ℜ",
  "reals": "ℝ",
  "rect": "▭",
  "re": "®",
  "reg": "®",
  "rfisht": "⥽",
  "rfloor": "⌋",
  "rfr": "𝔯",
  "rhard": "⇁",
  "rharu": "⇀",
  "rharul": "⥬",
  "rho": "ρ",
  "rhov": "ϱ",
  "rightarrow": "→",
  "rightarrowtail": "↣",
  "rightharpoondown": "⇁",
  "rightharpoonup": "⇀",
  "rightleftarrows": "⇄",
  "rightleftharpoons": "⇌",
  "rightrightarrows": "⇉",
  "rightsquigarrow": "↝",
  "rightthreetimes": "⋌",
  "ring": "˚",
  "risingdotseq": "≓",
  "rlarr": "⇄",
  "rlhar": "⇌",
  "rlm": "‏",
  "rmoust": "⎱",
  "rmoustache": "⎱",
  "rnmid": "⫮",
  "roang": "⟭",
  "roarr": "⇾",
  "robrk": "⟧",
  "ropar": "⦆",
  "ropf": "𝕣",
  "roplus": "⨮",
  "rotimes": "⨵",
  "rpar": ")",
  "rpargt": "⦔",
  "rppolint": "⨒",
  "rrarr": "⇉",
  "rsaquo": "›",
  "rscr": "𝓇",
  "rsh": "↱",
  "rsqb": "]",
  "rsquo": "’",
  "rsquor": "’",
  "rthree": "⋌",
  "rtimes": "⋊",
  "rtri": "▹",
  "rtrie": "⊵",
  "rtrif": "▸",
  "rtriltri": "⧎",
  "ruluhar": "⥨",
  "rx": "℞",
  "sacute": "ś",
  "sbquo": "‚",
  "sc": "≻",
  "scE": "⪴",
  "scap": "⪸",
  "scaron": "š",
  "sccue": "≽",
  "sce": "⪰",
  "scedil": "ş",
  "scirc": "ŝ",
  "scnE": "⪶",
  "scnap": "⪺",
  "scnsim": "⋩",
  "scpolint": "⨓",
  "scsim": "≿",
  "scy": "с",
  "sdot": "⋅",
  "sdotb": "⊡",
  "sdote": "⩦",
  "seArr": "⇘",
  "searhk": "⤥",
  "searr": "↘",
  "searrow": "↘",
  "sec": "§",
  "sect": "§",
  "semi": ";",
  "seswar": "⤩",
  "setminus": "∖",
  "setmn": "∖",
  "sext": "✶",
  "sfr": "𝔰",
  "sfrown": "⌢",
  "sharp": "♯",
  "shchcy": "щ",
  "shcy": "ш",
  "shortmid": "∣",
  "shortparallel": "∥",
  "sh": "­",
  "shy": "­",
  "sigma": "σ",
  "sigmaf": "ς",
  "sigmav": "ς",
  "sim": "∼",
  "simdot": "⩪",
  "sime": "≃",
  "simeq": "≃",
  "simg": "⪞",
  "simgE": "⪠",
  "siml": "⪝",
  "simlE": "⪟",
  "simne": "≆",
  "simplus": "⨤",
  "simrarr": "⥲",
  "slarr": "←",
  "smallsetminus": "∖",
  "smashp": "⨳",
  "smeparsl": "⧤",
  "smid": "∣",
  "smile": "⌣",
  "smt": "⪪",
  "smte": "⪬",
  "smtes": "⪬︀",
  "softcy": "ь",
  "sol": "/",
  "solb": "⧄",
  "solbar": "⌿",
  "sopf": "𝕤",
  "spades": "♠",
  "spadesuit": "♠",
  "spar": "∥",
  "sqcap": "⊓",
  "sqcaps": "⊓︀",
  "sqcup": "⊔",
  "sqcups": "⊔︀",
  "sqsub": "⊏",
  "sqsube": "⊑",
  "sqsubset": "⊏",
  "sqsubseteq": "⊑",
  "sqsup": "⊐",
  "sqsupe": "⊒",
  "sqsupset": "⊐",
  "sqsupseteq": "⊒",
  "squ": "□",
  "square": "□",
  "squarf": "▪",
  "squf": "▪",
  "srarr": "→",
  "sscr": "𝓈",
  "ssetmn": "∖",
  "ssmile": "⌣",
  "sstarf": "⋆",
  "star": "☆",
  "starf": "★",
  "straightepsilon": "ϵ",
  "straightphi": "ϕ",
  "strns": "¯",
  "sub": "⊂",
  "subE": "⫅",
  "subdot": "⪽",
  "sube": "⊆",
  "subedot": "⫃",
  "submult": "⫁",
  "subnE": "⫋",
  "subne": "⊊",
  "subplus": "⪿",
  "subrarr": "⥹",
  "subset": "⊂",
  "subseteq": "⊆",
  "subseteqq": "⫅",
  "subsetneq": "⊊",
  "subsetneqq": "⫋",
  "subsim": "⫇",
  "subsub": "⫕",
  "subsup": "⫓",
  "succ": "≻",
  "succapprox": "⪸",
  "succcurlyeq": "≽",
  "succeq": "⪰",
  "succnapprox": "⪺",
  "succneqq": "⪶",
  "succnsim": "⋩",
  "succsim": "≿",
  "sum": "∑",
  "sung": "♪",
  "sup": "⊃",
  "sup1": "¹",
  "sup2": "²",
  "sup3": "³",
  "supE": "⫆",
  "supdot": "⪾",
  "supdsub": "⫘",
  "supe": "⊇",
  "supedot": "⫄",
  "suphsol": "⟉",
  "suphsub": "⫗",
  "suplarr": "⥻",
  "supmult": "⫂",
  "supnE": "⫌",
  "supne": "⊋",
  "supplus": "⫀",
  "supset": "⊃",
  "supseteq": "⊇",
  "supseteqq": "⫆",
  "supsetneq": "⊋",
  "supsetneqq": "⫌",
  "supsim": "⫈",
  "supsub": "⫔",
  "supsup": "⫖",
  "swArr": "⇙",
  "swarhk": "⤦",
  "swarr": "↙",
  "swarrow": "↙",
  "swnwar": "⤪",
  "szli": "ß",
  "szlig": "ß",
  "target": "⌖",
  "tau": "τ",
  "tbrk": "⎴",
  "tcaron": "ť",
  "tcedil": "ţ",
  "tcy": "т",
  "tdot": "⃛",
  "telrec": "⌕",
  "tfr": "𝔱",
  "there4": "∴",
  "therefore": "∴",
  "theta": "θ",
  "thetasym": "ϑ",
  "thetav": "ϑ",
  "thickapprox": "≈",
  "thicksim": "∼",
  "thinsp": " ",
  "thkap": "≈",
  "thksim": "∼",
  "thor": "þ",
  "thorn": "þ",
  "tilde": "˜",
  "time": "×",
  "times": "×",
  "timesb": "⊠",
  "timesbar": "⨱",
  "timesd": "⨰",
  "tint": "∭",
  "toea": "⤨",
  "top": "⊤",
  "topbot": "⌶",
  "topcir": "⫱",
  "topf": "𝕥",
  "topfork": "⫚",
  "tosa": "⤩",
  "tprime": "‴",
  "trade": "™",
  "triangle": "▵",
  "triangledown": "▿",
  "triangleleft": "◃",
  "trianglelefteq": "⊴",
  "triangleq": "≜",
  "triangleright": "▹",
  "trianglerighteq": "⊵",
  "tridot": "◬",
  "trie": "≜",
  "triminus": "⨺",
  "triplus": "⨹",
  "trisb": "⧍",
  "tritime": "⨻",
  "trpezium": "⏢",
  "tscr": "𝓉",
  "tscy": "ц",
  "tshcy": "ћ",
  "tstrok": "ŧ",
  "twixt": "≬",
  "twoheadleftarrow": "↞",
  "twoheadrightarrow": "↠",
  "uArr": "⇑",
  "uHar": "⥣",
  "uacut": "ú",
  "uacute": "ú",
  "uarr": "↑",
  "ubrcy": "ў",
  "ubreve": "ŭ",
  "ucir": "û",
  "ucirc": "û",
  "ucy": "у",
  "udarr": "⇅",
  "udblac": "ű",
  "udhar": "⥮",
  "ufisht": "⥾",
  "ufr": "𝔲",
  "ugrav": "ù",
  "ugrave": "ù",
  "uharl": "↿",
  "uharr": "↾",
  "uhblk": "▀",
  "ulcorn": "⌜",
  "ulcorner": "⌜",
  "ulcrop": "⌏",
  "ultri": "◸",
  "umacr": "ū",
  "um": "¨",
  "uml": "¨",
  "uogon": "ų",
  "uopf": "𝕦",
  "uparrow": "↑",
  "updownarrow": "↕",
  "upharpoonleft": "↿",
  "upharpoonright": "↾",
  "uplus": "⊎",
  "upsi": "υ",
  "upsih": "ϒ",
  "upsilon": "υ",
  "upuparrows": "⇈",
  "urcorn": "⌝",
  "urcorner": "⌝",
  "urcrop": "⌎",
  "uring": "ů",
  "urtri": "◹",
  "uscr": "𝓊",
  "utdot": "⋰",
  "utilde": "ũ",
  "utri": "▵",
  "utrif": "▴",
  "uuarr": "⇈",
  "uum": "ü",
  "uuml": "ü",
  "uwangle": "⦧",
  "vArr": "⇕",
  "vBar": "⫨",
  "vBarv": "⫩",
  "vDash": "⊨",
  "vangrt": "⦜",
  "varepsilon": "ϵ",
  "varkappa": "ϰ",
  "varnothing": "∅",
  "varphi": "ϕ",
  "varpi": "ϖ",
  "varpropto": "∝",
  "varr": "↕",
  "varrho": "ϱ",
  "varsigma": "ς",
  "varsubsetneq": "⊊︀",
  "varsubsetneqq": "⫋︀",
  "varsupsetneq": "⊋︀",
  "varsupsetneqq": "⫌︀",
  "vartheta": "ϑ",
  "vartriangleleft": "⊲",
  "vartriangleright": "⊳",
  "vcy": "в",
  "vdash": "⊢",
  "vee": "∨",
  "veebar": "⊻",
  "veeeq": "≚",
  "vellip": "⋮",
  "verbar": "|",
  "vert": "|",
  "vfr": "𝔳",
  "vltri": "⊲",
  "vnsub": "⊂⃒",
  "vnsup": "⊃⃒",
  "vopf": "𝕧",
  "vprop": "∝",
  "vrtri": "⊳",
  "vscr": "𝓋",
  "vsubnE": "⫋︀",
  "vsubne": "⊊︀",
  "vsupnE": "⫌︀",
  "vsupne": "⊋︀",
  "vzigzag": "⦚",
  "wcirc": "ŵ",
  "wedbar": "⩟",
  "wedge": "∧",
  "wedgeq": "≙",
  "weierp": "℘",
  "wfr": "𝔴",
  "wopf": "𝕨",
  "wp": "℘",
  "wr": "≀",
  "wreath": "≀",
  "wscr": "𝓌",
  "xcap": "⋂",
  "xcirc": "◯",
  "xcup": "⋃",
  "xdtri": "▽",
  "xfr": "𝔵",
  "xhArr": "⟺",
  "xharr": "⟷",
  "xi": "ξ",
  "xlArr": "⟸",
  "xlarr": "⟵",
  "xmap": "⟼",
  "xnis": "⋻",
  "xodot": "⨀",
  "xopf": "𝕩",
  "xoplus": "⨁",
  "xotime": "⨂",
  "xrArr": "⟹",
  "xrarr": "⟶",
  "xscr": "𝓍",
  "xsqcup": "⨆",
  "xuplus": "⨄",
  "xutri": "△",
  "xvee": "⋁",
  "xwedge": "⋀",
  "yacut": "ý",
  "yacute": "ý",
  "yacy": "я",
  "ycirc": "ŷ",
  "ycy": "ы",
  "ye": "¥",
  "yen": "¥",
  "yfr": "𝔶",
  "yicy": "ї",
  "yopf": "𝕪",
  "yscr": "𝓎",
  "yucy": "ю",
  "yum": "ÿ",
  "yuml": "ÿ",
  "zacute": "ź",
  "zcaron": "ž",
  "zcy": "з",
  "zdot": "ż",
  "zeetrf": "ℨ",
  "zeta": "ζ",
  "zfr": "𝔷",
  "zhcy": "ж",
  "zigrarr": "⇝",
  "zopf": "𝕫",
  "zscr": "𝓏",
  "zwj": "‍",
  "zwnj": "‌"
}

},{}],109:[function(require,module,exports){
module.exports={
  "0": "�",
  "128": "€",
  "130": "‚",
  "131": "ƒ",
  "132": "„",
  "133": "…",
  "134": "†",
  "135": "‡",
  "136": "ˆ",
  "137": "‰",
  "138": "Š",
  "139": "‹",
  "140": "Œ",
  "142": "Ž",
  "145": "‘",
  "146": "’",
  "147": "“",
  "148": "”",
  "149": "•",
  "150": "–",
  "151": "—",
  "152": "˜",
  "153": "™",
  "154": "š",
  "155": "›",
  "156": "œ",
  "158": "ž",
  "159": "Ÿ"
}

},{}],110:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module collapse-white-space
 * @fileoverview Replace multiple white-space characters
 *   with a single space.
 */

'use strict';

/* Expose. */
module.exports = collapse;

/**
 * Replace multiple white-space characters with a single space.
 *
 * @example
 *   collapse(' \t\nbar \nbaz\t'); // ' bar baz '
 *
 * @param {string} value - Value with uncollapsed white-space,
 *   coerced to string.
 * @return {string} - Value with collapsed white-space.
 */
function collapse(value) {
  return String(value).replace(/\s+/g, ' ');
}

},{}],111:[function(require,module,exports){
(function (process){
/**
 * This is the web browser implementation of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = require('./debug');
exports.log = log;
exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;
exports.storage = 'undefined' != typeof chrome
               && 'undefined' != typeof chrome.storage
                  ? chrome.storage.local
                  : localstorage();

/**
 * Colors.
 */

exports.colors = [
  'lightseagreen',
  'forestgreen',
  'goldenrod',
  'dodgerblue',
  'darkorchid',
  'crimson'
];

/**
 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
 * and the Firebug extension (any Firefox version) are known
 * to support "%c" CSS customizations.
 *
 * TODO: add a `localStorage` variable to explicitly enable/disable colors
 */

function useColors() {
  // NB: In an Electron preload script, document will be defined but not fully
  // initialized. Since we know we're in Chrome, we'll just detect this case
  // explicitly
  if (typeof window !== 'undefined' && window && typeof window.process !== 'undefined' && window.process.type === 'renderer') {
    return true;
  }

  // is webkit? http://stackoverflow.com/a/16459606/376773
  // document is undefined in react-native: https://github.com/facebook/react-native/pull/1632
  return (typeof document !== 'undefined' && document && 'WebkitAppearance' in document.documentElement.style) ||
    // is firebug? http://stackoverflow.com/a/398120/376773
    (typeof window !== 'undefined' && window && window.console && (console.firebug || (console.exception && console.table))) ||
    // is firefox >= v31?
    // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
    (typeof navigator !== 'undefined' && navigator && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31) ||
    // double check webkit in userAgent just in case we are in a worker
    (typeof navigator !== 'undefined' && navigator && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/));
}

/**
 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
 */

exports.formatters.j = function(v) {
  try {
    return JSON.stringify(v);
  } catch (err) {
    return '[UnexpectedJSONParseError]: ' + err.message;
  }
};


/**
 * Colorize log arguments if enabled.
 *
 * @api public
 */

function formatArgs(args) {
  var useColors = this.useColors;

  args[0] = (useColors ? '%c' : '')
    + this.namespace
    + (useColors ? ' %c' : ' ')
    + args[0]
    + (useColors ? '%c ' : ' ')
    + '+' + exports.humanize(this.diff);

  if (!useColors) return;

  var c = 'color: ' + this.color;
  args.splice(1, 0, c, 'color: inherit')

  // the final "%c" is somewhat tricky, because there could be other
  // arguments passed either before or after the %c, so we need to
  // figure out the correct index to insert the CSS into
  var index = 0;
  var lastC = 0;
  args[0].replace(/%[a-zA-Z%]/g, function(match) {
    if ('%%' === match) return;
    index++;
    if ('%c' === match) {
      // we only are interested in the *last* %c
      // (the user may have provided their own)
      lastC = index;
    }
  });

  args.splice(lastC, 0, c);
}

/**
 * Invokes `console.log()` when available.
 * No-op when `console.log` is not a "function".
 *
 * @api public
 */

function log() {
  // this hackery is required for IE8/9, where
  // the `console.log` function doesn't have 'apply'
  return 'object' === typeof console
    && console.log
    && Function.prototype.apply.call(console.log, console, arguments);
}

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */

function save(namespaces) {
  try {
    if (null == namespaces) {
      exports.storage.removeItem('debug');
    } else {
      exports.storage.debug = namespaces;
    }
  } catch(e) {}
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */

function load() {
  try {
    return exports.storage.debug;
  } catch(e) {}

  // If debug isn't set in LS, and we're in Electron, try to load $DEBUG
  if (typeof process !== 'undefined' && 'env' in process) {
    return process.env.DEBUG;
  }
}

/**
 * Enable namespaces listed in `localStorage.debug` initially.
 */

exports.enable(load());

/**
 * Localstorage attempts to return the localstorage.
 *
 * This is necessary because safari throws
 * when a user disables cookies/localstorage
 * and you attempt to access it.
 *
 * @return {LocalStorage}
 * @api private
 */

function localstorage() {
  try {
    return window.localStorage;
  } catch (e) {}
}

}).call(this,require('_process'))
},{"./debug":112,"_process":102}],112:[function(require,module,exports){

/**
 * This is the common logic for both the Node.js and web browser
 * implementations of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = createDebug.debug = createDebug.default = createDebug;
exports.coerce = coerce;
exports.disable = disable;
exports.enable = enable;
exports.enabled = enabled;
exports.humanize = require('ms');

/**
 * The currently active debug mode names, and names to skip.
 */

exports.names = [];
exports.skips = [];

/**
 * Map of special "%n" handling functions, for the debug "format" argument.
 *
 * Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
 */

exports.formatters = {};

/**
 * Previous log timestamp.
 */

var prevTime;

/**
 * Select a color.
 * @param {String} namespace
 * @return {Number}
 * @api private
 */

function selectColor(namespace) {
  var hash = 0, i;

  for (i in namespace) {
    hash  = ((hash << 5) - hash) + namespace.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }

  return exports.colors[Math.abs(hash) % exports.colors.length];
}

/**
 * Create a debugger with the given `namespace`.
 *
 * @param {String} namespace
 * @return {Function}
 * @api public
 */

function createDebug(namespace) {

  function debug() {
    // disabled?
    if (!debug.enabled) return;

    var self = debug;

    // set `diff` timestamp
    var curr = +new Date();
    var ms = curr - (prevTime || curr);
    self.diff = ms;
    self.prev = prevTime;
    self.curr = curr;
    prevTime = curr;

    // turn the `arguments` into a proper Array
    var args = new Array(arguments.length);
    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i];
    }

    args[0] = exports.coerce(args[0]);

    if ('string' !== typeof args[0]) {
      // anything else let's inspect with %O
      args.unshift('%O');
    }

    // apply any `formatters` transformations
    var index = 0;
    args[0] = args[0].replace(/%([a-zA-Z%])/g, function(match, format) {
      // if we encounter an escaped % then don't increase the array index
      if (match === '%%') return match;
      index++;
      var formatter = exports.formatters[format];
      if ('function' === typeof formatter) {
        var val = args[index];
        match = formatter.call(self, val);

        // now we need to remove `args[index]` since it's inlined in the `format`
        args.splice(index, 1);
        index--;
      }
      return match;
    });

    // apply env-specific formatting (colors, etc.)
    exports.formatArgs.call(self, args);

    var logFn = debug.log || exports.log || console.log.bind(console);
    logFn.apply(self, args);
  }

  debug.namespace = namespace;
  debug.enabled = exports.enabled(namespace);
  debug.useColors = exports.useColors();
  debug.color = selectColor(namespace);

  // env-specific initialization logic for debug instances
  if ('function' === typeof exports.init) {
    exports.init(debug);
  }

  return debug;
}

/**
 * Enables a debug mode by namespaces. This can include modes
 * separated by a colon and wildcards.
 *
 * @param {String} namespaces
 * @api public
 */

function enable(namespaces) {
  exports.save(namespaces);

  var split = (namespaces || '').split(/[\s,]+/);
  var len = split.length;

  for (var i = 0; i < len; i++) {
    if (!split[i]) continue; // ignore empty strings
    namespaces = split[i].replace(/\*/g, '.*?');
    if (namespaces[0] === '-') {
      exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
    } else {
      exports.names.push(new RegExp('^' + namespaces + '$'));
    }
  }
}

/**
 * Disable debug output.
 *
 * @api public
 */

function disable() {
  exports.enable('');
}

/**
 * Returns true if the given mode name is enabled, false otherwise.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

function enabled(name) {
  var i, len;
  for (i = 0, len = exports.skips.length; i < len; i++) {
    if (exports.skips[i].test(name)) {
      return false;
    }
  }
  for (i = 0, len = exports.names.length; i < len; i++) {
    if (exports.names[i].test(name)) {
      return true;
    }
  }
  return false;
}

/**
 * Coerce `val`.
 *
 * @param {Mixed} val
 * @return {Mixed}
 * @api private
 */

function coerce(val) {
  if (val instanceof Error) return val.stack || val.message;
  return val;
}

},{"ms":127}],113:[function(require,module,exports){
'use strict';

var hasOwn = Object.prototype.hasOwnProperty;
var toStr = Object.prototype.toString;

var isArray = function isArray(arr) {
	if (typeof Array.isArray === 'function') {
		return Array.isArray(arr);
	}

	return toStr.call(arr) === '[object Array]';
};

var isPlainObject = function isPlainObject(obj) {
	if (!obj || toStr.call(obj) !== '[object Object]') {
		return false;
	}

	var hasOwnConstructor = hasOwn.call(obj, 'constructor');
	var hasIsPrototypeOf = obj.constructor && obj.constructor.prototype && hasOwn.call(obj.constructor.prototype, 'isPrototypeOf');
	// Not own constructor property must be Object
	if (obj.constructor && !hasOwnConstructor && !hasIsPrototypeOf) {
		return false;
	}

	// Own properties are enumerated firstly, so to speed up,
	// if last one is own, then all properties are own.
	var key;
	for (key in obj) {/**/}

	return typeof key === 'undefined' || hasOwn.call(obj, key);
};

module.exports = function extend() {
	var options, name, src, copy, copyIsArray, clone,
		target = arguments[0],
		i = 1,
		length = arguments.length,
		deep = false;

	// Handle a deep copy situation
	if (typeof target === 'boolean') {
		deep = target;
		target = arguments[1] || {};
		// skip the boolean and the target
		i = 2;
	} else if ((typeof target !== 'object' && typeof target !== 'function') || target == null) {
		target = {};
	}

	for (; i < length; ++i) {
		options = arguments[i];
		// Only deal with non-null/undefined values
		if (options != null) {
			// Extend the base object
			for (name in options) {
				src = target[name];
				copy = options[name];

				// Prevent never-ending loop
				if (target !== copy) {
					// Recurse if we're merging plain objects or arrays
					if (deep && copy && (isPlainObject(copy) || (copyIsArray = isArray(copy)))) {
						if (copyIsArray) {
							copyIsArray = false;
							clone = src && isArray(src) ? src : [];
						} else {
							clone = src && isPlainObject(src) ? src : {};
						}

						// Never move original objects, clone them
						target[name] = extend(deep, clone, copy);

					// Don't bring in undefined values
					} else if (typeof copy !== 'undefined') {
						target[name] = copy;
					}
				}
			}
		}
	}

	// Return the modified object
	return target;
};


},{}],114:[function(require,module,exports){
var ERROR_MESSAGE = 'Function.prototype.bind called on incompatible ';
var slice = Array.prototype.slice;
var toStr = Object.prototype.toString;
var funcType = '[object Function]';

module.exports = function bind(that) {
    var target = this;
    if (typeof target !== 'function' || toStr.call(target) !== funcType) {
        throw new TypeError(ERROR_MESSAGE + target);
    }
    var args = slice.call(arguments, 1);

    var bound;
    var binder = function () {
        if (this instanceof bound) {
            var result = target.apply(
                this,
                args.concat(slice.call(arguments))
            );
            if (Object(result) === result) {
                return result;
            }
            return this;
        } else {
            return target.apply(
                that,
                args.concat(slice.call(arguments))
            );
        }
    };

    var boundLength = Math.max(0, target.length - args.length);
    var boundArgs = [];
    for (var i = 0; i < boundLength; i++) {
        boundArgs.push('$' + i);
    }

    bound = Function('binder', 'return function (' + boundArgs.join(',') + '){ return binder.apply(this,arguments); }')(binder);

    if (target.prototype) {
        var Empty = function Empty() {};
        Empty.prototype = target.prototype;
        bound.prototype = new Empty();
        Empty.prototype = null;
    }

    return bound;
};

},{}],115:[function(require,module,exports){
var implementation = require('./implementation');

module.exports = Function.prototype.bind || implementation;

},{"./implementation":114}],116:[function(require,module,exports){
var bind = require('function-bind');

module.exports = bind.call(Function.call, Object.prototype.hasOwnProperty);

},{"function-bind":115}],117:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],118:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2016 Titus Wormer
 * @license MIT
 * @module is-alphabetical
 * @fileoverview Check if a character is alphabetical.
 */

'use strict';

/* eslint-env commonjs */

/* Expose. */
module.exports = alphabetical;

/**
 * Check whether the given character code, or the character
 * code at the first character, is alphabetical.
 *
 * @param {string|number} character
 * @return {boolean} - Whether `character` is alphabetical.
 */
function alphabetical(character) {
  var code = typeof character === 'string' ?
    character.charCodeAt(0) : character;

  return (code >= 97 && code <= 122) || /* a-z */
    (code >= 65 && code <= 90); /* A-Z */
}

},{}],119:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2016 Titus Wormer
 * @license MIT
 * @module is-alphanumerical
 * @fileoverview Check if a character is alphanumerical.
 */

'use strict';

/* eslint-env commonjs */

/* Dependencies. */
var alphabetical = require('is-alphabetical');
var decimal = require('is-decimal');

/* Expose. */
module.exports = alphanumerical;

/**
 * Check whether the given character code, or the character
 * code at the first character, is alphanumerical.
 *
 * @param {string|number} character
 * @return {boolean} - Whether `character` is alphanumerical.
 */
function alphanumerical(character) {
  return alphabetical(character) || decimal(character);
}

},{"is-alphabetical":118,"is-decimal":120}],120:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2016 Titus Wormer
 * @license MIT
 * @module is-decimal
 * @fileoverview Check if a character is decimal.
 */

'use strict';

/* eslint-env commonjs */

/* Expose. */
module.exports = decimal;

/**
 * Check whether the given character code, or the character
 * code at the first character, is decimal.
 *
 * @param {string|number} character
 * @return {boolean} - Whether `character` is decimal.
 */
function decimal(character) {
  var code = typeof character === 'string' ?
    character.charCodeAt(0) : character;

  return code >= 48 && code <= 57; /* 0-9 */
}

},{}],121:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2016 Titus Wormer
 * @license MIT
 * @module is-hexadecimal
 * @fileoverview Check if a character is hexadecimal.
 */

'use strict';

/* eslint-env commonjs */

/* Expose. */
module.exports = hexadecimal;

/**
 * Check whether the given character code, or the character
 * code at the first character, is hexadecimal.
 *
 * @param {string|number} character
 * @return {boolean} - Whether `character` is hexadecimal.
 */
function hexadecimal(character) {
  var code = typeof character === 'string' ?
    character.charCodeAt(0) : character;

  return (code >= 97 /* a */ && code <= 102 /* z */) ||
    (code >= 65 /* A */ && code <= 70 /* Z */) ||
    (code >= 48 /* A */ && code <= 57 /* Z */);
}

},{}],122:[function(require,module,exports){
'use strict';

/**
 * Get the count of the longest repeating streak of
 * `character` in `value`.
 *
 * @example
 *   longestStreak('` foo `` bar `', '`') // 2
 *
 * @param {string} value - Content, coerced to string.
 * @param {string} character - Single character to look
 *   for.
 * @return {number} - Number of characters at the place
 *   where `character` occurs in its longest streak in
 *   `value`.
 * @throws {Error} - when `character` is not a single
 *   character.
 */
function longestStreak(value, character) {
    var count = 0;
    var maximum = 0;
    var index = -1;
    var length;

    value = String(value);
    length = value.length;

    if (typeof character !== 'string' || character.length !== 1) {
        throw new Error('Expected character');
    }

    while (++index < length) {
        if (value.charAt(index) === character) {
            count++;

            if (count > maximum) {
                maximum = count;
            }
        } else {
            count = 0;
        }
    }

    return maximum;
}

/*
 * Expose.
 */

module.exports = longestStreak;

},{}],123:[function(require,module,exports){
'use strict';

/*
 * Useful expressions.
 */

var EXPRESSION_DOT = /\./;
var EXPRESSION_LAST_DOT = /\.[^.]*$/;

/*
 * Allowed alignment values.
 */

var LEFT = 'l';
var RIGHT = 'r';
var CENTER = 'c';
var DOT = '.';
var NULL = '';

var ALLIGNMENT = [LEFT, RIGHT, CENTER, DOT, NULL];

/*
 * Characters.
 */

var COLON = ':';
var DASH = '-';
var PIPE = '|';
var SPACE = ' ';
var NEW_LINE = '\n';

/**
 * Get the length of `value`.
 *
 * @param {string} value
 * @return {number}
 */
function lengthNoop(value) {
    return String(value).length;
}

/**
 * Get a string consisting of `length` `character`s.
 *
 * @param {number} length
 * @param {string} [character=' ']
 * @return {string}
 */
function pad(length, character) {
    return Array(length + 1).join(character || SPACE);
}

/**
 * Get the position of the last dot in `value`.
 *
 * @param {string} value
 * @return {number}
 */
function dotindex(value) {
    var match = EXPRESSION_LAST_DOT.exec(value);

    return match ? match.index + 1 : value.length;
}

/**
 * Create a table from a matrix of strings.
 *
 * @param {Array.<Array.<string>>} table
 * @param {Object?} options
 * @param {boolean?} [options.rule=true]
 * @param {string?} [options.delimiter=" | "]
 * @param {string?} [options.start="| "]
 * @param {string?} [options.end=" |"]
 * @param {Array.<string>?} options.align
 * @param {function(string)?} options.stringLength
 * @return {string} Pretty table
 */
function markdownTable(table, options) {
    var settings = options || {};
    var delimiter = settings.delimiter;
    var start = settings.start;
    var end = settings.end;
    var alignment = settings.align;
    var calculateStringLength = settings.stringLength || lengthNoop;
    var cellCount = 0;
    var rowIndex = -1;
    var rowLength = table.length;
    var sizes = [];
    var align;
    var rule;
    var rows;
    var row;
    var cells;
    var index;
    var position;
    var size;
    var value;
    var spacing;
    var before;
    var after;

    alignment = alignment ? alignment.concat() : [];

    if (delimiter === null || delimiter === undefined) {
        delimiter = SPACE + PIPE + SPACE;
    }

    if (start === null || start === undefined) {
        start = PIPE + SPACE;
    }

    if (end === null || end === undefined) {
        end = SPACE + PIPE;
    }

    while (++rowIndex < rowLength) {
        row = table[rowIndex];

        index = -1;

        if (row.length > cellCount) {
            cellCount = row.length;
        }

        while (++index < cellCount) {
            position = row[index] ? dotindex(row[index]) : null;

            if (!sizes[index]) {
                sizes[index] = 3;
            }

            if (position > sizes[index]) {
                sizes[index] = position;
            }
        }
    }

    if (typeof alignment === 'string') {
        alignment = pad(cellCount, alignment).split('');
    }

    /*
     * Make sure only valid alignments are used.
     */

    index = -1;

    while (++index < cellCount) {
        align = alignment[index];

        if (typeof align === 'string') {
            align = align.charAt(0).toLowerCase();
        }

        if (ALLIGNMENT.indexOf(align) === -1) {
            align = NULL;
        }

        alignment[index] = align;
    }

    rowIndex = -1;
    rows = [];

    while (++rowIndex < rowLength) {
        row = table[rowIndex];

        index = -1;
        cells = [];

        while (++index < cellCount) {
            value = row[index];

            if (value === null || value === undefined) {
                value = '';
            } else {
                value = String(value);
            }

            if (alignment[index] !== DOT) {
                cells[index] = value;
            } else {
                position = dotindex(value);

                size = sizes[index] +
                    (EXPRESSION_DOT.test(value) ? 0 : 1) -
                    (calculateStringLength(value) - position);

                cells[index] = value + pad(size - 1);
            }
        }

        rows[rowIndex] = cells;
    }

    sizes = [];
    rowIndex = -1;

    while (++rowIndex < rowLength) {
        cells = rows[rowIndex];

        index = -1;

        while (++index < cellCount) {
            value = cells[index];

            if (!sizes[index]) {
                sizes[index] = 3;
            }

            size = calculateStringLength(value);

            if (size > sizes[index]) {
                sizes[index] = size;
            }
        }
    }

    rowIndex = -1;

    while (++rowIndex < rowLength) {
        cells = rows[rowIndex];

        index = -1;

        while (++index < cellCount) {
            value = cells[index];

            position = sizes[index] - (calculateStringLength(value) || 0);
            spacing = pad(position);

            if (alignment[index] === RIGHT || alignment[index] === DOT) {
                value = spacing + value;
            } else if (alignment[index] !== CENTER) {
                value = value + spacing;
            } else {
                position = position / 2;

                if (position % 1 === 0) {
                    before = position;
                    after = position;
                } else {
                    before = position + 0.5;
                    after = position - 0.5;
                }

                value = pad(before) + value + pad(after);
            }

            cells[index] = value;
        }

        rows[rowIndex] = cells.join(delimiter);
    }

    if (settings.rule !== false) {
        index = -1;
        rule = [];

        while (++index < cellCount) {
            align = alignment[index];

            /*
             * When `align` is left, don't add colons.
             */

            value = align === RIGHT || align === NULL ? DASH : COLON;
            value += pad(sizes[index] - 2, DASH);
            value += align !== LEFT && align !== NULL ? COLON : DASH;

            rule[index] = value;
        }

        rows.splice(1, 0, rule.join(delimiter));
    }

    return start + rows.join(end + NEW_LINE + start) + end;
}

/*
 * Expose `markdownTable`.
 */

module.exports = markdownTable;

},{}],124:[function(require,module,exports){
// LICENSE : MIT
"use strict";
// Replace key to value mapping
// This is not for Constants.
var exports = {
    "root": "Document",
    "paragraph": "Paragraph",
    "blockquote": "BlockQuote",
    "listItem": "ListItem",
    "list": "List",
    "Bullet": "Bullet", // no need?
    "heading": "Header",
    "code": "CodeBlock",
    "HtmlBlock": "Html",
    "ReferenceDef": "ReferenceDef",
    "thematicBreak": "HorizontalRule",
    // inline block
    'text': 'Str',
    'break': 'Break',
    'emphasis': 'Emphasis',
    'strong': 'Strong',
    'html': 'Html',
    'link': 'Link',
    'image': 'Image',
    'inlineCode': 'Code',
    'yaml': 'Yaml'
};
module.exports = exports;
},{}],125:[function(require,module,exports){
/*eslint-disable */
// LICENSE : MIT

"use strict";
var traverse = require('traverse');
var StructuredSource = require('structured-source');
var debug = require("debug")("markdown-to-ast");
var remarkAbstract = require("remark");
var remark = remarkAbstract();
/**
 * parse markdown text and return ast mapped location info.
 * @param {string} text
 * @returns {TxtNode}
 */
function parse(text) {
    var ast = remark.parse(text);
    var SyntaxMap = require("./mapping/markdown-syntax-map");
    var src = new StructuredSource(text);
    traverse(ast).forEach(function (node) {
        if (this.notLeaf) {
            if (node.type) {
                var replacedType = SyntaxMap[node.type];
                if (!replacedType) {
                    debug("replacedType : " + replacedType + " , node.type: " + node.type);
                } else {
                    node.type = replacedType;
                }
            }
            // map `range`, `loc` and `raw` to node
            if (node.position) {
                var position = node.position;
                var positionCompensated = {
                    start: {line: position.start.line, column: position.start.column - 1},
                    end: {line: position.end.line, column: position.end.column - 1}
                };
                var range = src.locationToRange(positionCompensated);
                node.loc = positionCompensated;
                node.range = range;
                node.raw = text.slice(range[0], range[1]);
                // Compatible for https://github.com/wooorm/unist, but hidden
                Object.defineProperty(node, "position", {
                    enumerable: false,
                    configurable: false,
                    writable: false,
                    value: position
                });

            }
        }
    });
    return ast;
}
module.exports = {
    parse: parse,
    Syntax: require("./union-syntax")
};
},{"./mapping/markdown-syntax-map":124,"./union-syntax":126,"debug":111,"remark":138,"structured-source":142,"traverse":144}],126:[function(require,module,exports){
// LICENSE : MIT
"use strict";
// public key interface
var exports = {
    "Document": "Document", // must
    "Paragraph": "Paragraph",
    "BlockQuote": "BlockQuote",
    "ListItem": "ListItem",
    "List": "List",
    "Header": "Header",
    "CodeBlock": "CodeBlock",
    "HtmlBlock": "HtmlBlock",
    "ReferenceDef": "ReferenceDef",
    "HorizontalRule": "HorizontalRule",
    // inline
    'Str': 'Str', // must
    'Break': 'Break', // must
    'Emphasis': 'Emphasis',
    'Strong': 'Strong',
    'Html': 'Html',
    'Link': 'Link',
    'Image': 'Image',
    'Code': 'Code'
};
module.exports = exports;
},{}],127:[function(require,module,exports){
/**
 * Helpers.
 */

var s = 1000
var m = s * 60
var h = m * 60
var d = h * 24
var y = d * 365.25

/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param {String|Number} val
 * @param {Object} options
 * @throws {Error} throw an error if val is not a non-empty string or a number
 * @return {String|Number}
 * @api public
 */

module.exports = function (val, options) {
  options = options || {}
  var type = typeof val
  if (type === 'string' && val.length > 0) {
    return parse(val)
  } else if (type === 'number' && isNaN(val) === false) {
    return options.long ?
			fmtLong(val) :
			fmtShort(val)
  }
  throw new Error('val is not a non-empty string or a valid number. val=' + JSON.stringify(val))
}

/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function parse(str) {
  str = String(str)
  if (str.length > 10000) {
    return
  }
  var match = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(str)
  if (!match) {
    return
  }
  var n = parseFloat(match[1])
  var type = (match[2] || 'ms').toLowerCase()
  switch (type) {
    case 'years':
    case 'year':
    case 'yrs':
    case 'yr':
    case 'y':
      return n * y
    case 'days':
    case 'day':
    case 'd':
      return n * d
    case 'hours':
    case 'hour':
    case 'hrs':
    case 'hr':
    case 'h':
      return n * h
    case 'minutes':
    case 'minute':
    case 'mins':
    case 'min':
    case 'm':
      return n * m
    case 'seconds':
    case 'second':
    case 'secs':
    case 'sec':
    case 's':
      return n * s
    case 'milliseconds':
    case 'millisecond':
    case 'msecs':
    case 'msec':
    case 'ms':
      return n
    default:
      return undefined
  }
}

/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtShort(ms) {
  if (ms >= d) {
    return Math.round(ms / d) + 'd'
  }
  if (ms >= h) {
    return Math.round(ms / h) + 'h'
  }
  if (ms >= m) {
    return Math.round(ms / m) + 'm'
  }
  if (ms >= s) {
    return Math.round(ms / s) + 's'
  }
  return ms + 'ms'
}

/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtLong(ms) {
  return plural(ms, d, 'day') ||
    plural(ms, h, 'hour') ||
    plural(ms, m, 'minute') ||
    plural(ms, s, 'second') ||
    ms + ' ms'
}

/**
 * Pluralization helper.
 */

function plural(ms, n, name) {
  if (ms < n) {
    return
  }
  if (ms < n * 1.5) {
    return Math.floor(ms / n) + ' ' + name
  }
  return Math.ceil(ms / n) + ' ' + name + 's'
}

},{}],128:[function(require,module,exports){
var wrappy = require('wrappy')
module.exports = wrappy(once)
module.exports.strict = wrappy(onceStrict)

once.proto = once(function () {
  Object.defineProperty(Function.prototype, 'once', {
    value: function () {
      return once(this)
    },
    configurable: true
  })

  Object.defineProperty(Function.prototype, 'onceStrict', {
    value: function () {
      return onceStrict(this)
    },
    configurable: true
  })
})

function once (fn) {
  var f = function () {
    if (f.called) return f.value
    f.called = true
    return f.value = fn.apply(this, arguments)
  }
  f.called = false
  return f
}

function onceStrict (fn) {
  var f = function () {
    if (f.called)
      throw new Error(f.onceError)
    f.called = true
    return f.value = fn.apply(this, arguments)
  }
  var name = fn.name || 'Function wrapped with `once`'
  f.onceError = name + " shouldn't be called more than once"
  f.called = false
  return f
}

},{"wrappy":154}],129:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module parse-entities
 * @fileoverview Parse HTML character references: fast, spec-compliant,
 *   positional information.
 */

'use strict';

/* Dependencies. */
var has = require('has');
var characterEntities = require('character-entities');
var legacy = require('character-entities-legacy');
var invalid = require('character-reference-invalid');
var decimal = require('is-decimal');
var hexadecimal = require('is-hexadecimal');
var alphanumerical = require('is-alphanumerical');

/* Expose. */
module.exports = wrapper;

/* Methods. */
var fromCharCode = String.fromCharCode;
var noop = Function.prototype;

/* Characters. */
var REPLACEMENT = '\uFFFD';
var FORM_FEED = '\f';
var AMPERSAND = '&';
var OCTOTHORP = '#';
var SEMICOLON = ';';
var NEWLINE = '\n';
var X_LOWER = 'x';
var X_UPPER = 'X';
var SPACE = ' ';
var LESS_THAN = '<';
var EQUAL = '=';
var EMPTY = '';
var TAB = '\t';

/* Default settings. */
var defaults = {
  warning: null,
  reference: null,
  text: null,
  warningContext: null,
  referenceContext: null,
  textContext: null,
  position: {},
  additional: null,
  attribute: false,
  nonTerminated: true
};

/* Reference types. */
var NAMED = 'named';
var HEXADECIMAL = 'hexadecimal';
var DECIMAL = 'decimal';

/* Map of bases. */
var BASE = {};

BASE[HEXADECIMAL] = 16;
BASE[DECIMAL] = 10;

/* Map of types to tests. Each type of character reference
 * accepts different characters. This test is used to
 * detect whether a reference has ended (as the semicolon
 * is not strictly needed). */
var TESTS = {};

TESTS[NAMED] = alphanumerical;
TESTS[DECIMAL] = decimal;
TESTS[HEXADECIMAL] = hexadecimal;

/* Warning messages. */
var NAMED_NOT_TERMINATED = 1;
var NUMERIC_NOT_TERMINATED = 2;
var NAMED_EMPTY = 3;
var NUMERIC_EMPTY = 4;
var NAMED_UNKNOWN = 5;
var NUMERIC_DISALLOWED = 6;
var NUMERIC_PROHIBITED = 7;

var NUMERIC_REFERENCE = 'Numeric character references';
var NAMED_REFERENCE = 'Named character references';
var TERMINATED = ' must be terminated by a semicolon';
var VOID = ' cannot be empty';

var MESSAGES = {};

MESSAGES[NAMED_NOT_TERMINATED] = NAMED_REFERENCE + TERMINATED;
MESSAGES[NUMERIC_NOT_TERMINATED] = NUMERIC_REFERENCE + TERMINATED;
MESSAGES[NAMED_EMPTY] = NAMED_REFERENCE + VOID;
MESSAGES[NUMERIC_EMPTY] = NUMERIC_REFERENCE + VOID;
MESSAGES[NAMED_UNKNOWN] = NAMED_REFERENCE + ' must be known';
MESSAGES[NUMERIC_DISALLOWED] = NUMERIC_REFERENCE + ' cannot be disallowed';
MESSAGES[NUMERIC_PROHIBITED] = NUMERIC_REFERENCE + ' cannot be outside the ' +
    'permissible Unicode range';

/**
 * Wrap to ensure clean parameters are given to `parse`.
 *
 * @param {string} value - Value with entities.
 * @param {Object?} [options] - Configuration.
 */
function wrapper(value, options) {
  var settings = {};
  var key;

  if (!options) {
    options = {};
  }

  for (key in defaults) {
    settings[key] = options[key] == null ? defaults[key] : options[key];
  }

  if (settings.position.indent || settings.position.start) {
    settings.indent = settings.position.indent || [];
    settings.position = settings.position.start;
  }

  return parse(value, settings);
}

/**
 * Parse entities.
 *
 * @param {string} value - Value to tokenise.
 * @param {Object?} [settings] - Configuration.
 */
function parse(value, settings) {
  var additional = settings.additional;
  var nonTerminated = settings.nonTerminated;
  var handleText = settings.text;
  var handleReference = settings.reference;
  var handleWarning = settings.warning;
  var textContext = settings.textContext;
  var referenceContext = settings.referenceContext;
  var warningContext = settings.warningContext;
  var pos = settings.position;
  var indent = settings.indent || [];
  var length = value.length;
  var index = 0;
  var lines = -1;
  var column = pos.column || 1;
  var line = pos.line || 1;
  var queue = EMPTY;
  var result = [];
  var entityCharacters;
  var terminated;
  var characters;
  var character;
  var reference;
  var following;
  var warning;
  var reason;
  var output;
  var entity;
  var begin;
  var start;
  var type;
  var test;
  var prev;
  var next;
  var diff;
  var end;

  /* Cache the current point. */
  prev = now();

  /* Wrap `handleWarning`. */
  warning = handleWarning ? parseError : noop;

  /* Ensure the algorithm walks over the first character
   * and the end (inclusive). */
  index--;
  length++;

  while (++index < length) {
    /* If the previous character was a newline. */
    if (character === NEWLINE) {
      column = indent[lines] || 1;
    }

    character = at(index);

    /* Handle anything other than an ampersand,
     * including newlines and EOF. */
    if (character !== AMPERSAND) {
      if (character === NEWLINE) {
        line++;
        lines++;
        column = 0;
      }

      if (character) {
        queue += character;
        column++;
      } else {
        flush();
      }
    } else {
      following = at(index + 1);

      /* The behaviour depends on the identity of the next
       * character. */
      if (
        following === TAB ||
        following === NEWLINE ||
        following === FORM_FEED ||
        following === SPACE ||
        following === LESS_THAN ||
        following === AMPERSAND ||
        following === EMPTY ||
        (additional && following === additional)
      ) {
        /* Not a character reference. No characters
         * are consumed, and nothing is returned.
         * This is not an error, either. */
        queue += character;
        column++;

        continue;
      }

      start = begin = end = index + 1;

      /* Numerical entity. */
      if (following !== OCTOTHORP) {
        type = NAMED;
      } else {
        end = ++begin;

        /* The behaviour further depends on the
         * character after the U+0023 NUMBER SIGN. */
        following = at(end);

        if (following === X_LOWER || following === X_UPPER) {
          /* ASCII hex digits. */
          type = HEXADECIMAL;
          end = ++begin;
        } else {
          /* ASCII digits. */
          type = DECIMAL;
        }
      }

      entityCharacters = entity = characters = EMPTY;
      test = TESTS[type];
      end--;

      while (++end < length) {
        following = at(end);

        if (!test(following)) {
          break;
        }

        characters += following;

        /* Check if we can match a legacy named
         * reference.  If so, we cache that as the
         * last viable named reference.  This
         * ensures we do not need to walk backwards
         * later. */
        if (type === NAMED && has(legacy, characters)) {
          entityCharacters = characters;
          entity = legacy[characters];
        }
      }

      terminated = at(end) === SEMICOLON;

      if (terminated) {
        end++;

        if (type === NAMED && has(characterEntities, characters)) {
          entityCharacters = characters;
          entity = characterEntities[characters];
        }
      }

      diff = 1 + end - start;

      if (!terminated && !nonTerminated) {
        /* Empty. */
      } else if (!characters) {
        /* An empty (possible) entity is valid, unless
         * its numeric (thus an ampersand followed by
         * an octothorp). */
        if (type !== NAMED) {
          warning(NUMERIC_EMPTY, diff);
        }
      } else if (type === NAMED) {
        /* An ampersand followed by anything
         * unknown, and not terminated, is invalid. */
        if (terminated && !entity) {
          warning(NAMED_UNKNOWN, 1);
        } else {
          /* If theres something after an entity
           * name which is not known, cap the
           * reference. */
          if (entityCharacters !== characters) {
            end = begin + entityCharacters.length;
            diff = 1 + end - begin;
            terminated = false;
          }

          /* If the reference is not terminated,
           * warn. */
          if (!terminated) {
            reason = entityCharacters ?
              NAMED_NOT_TERMINATED :
              NAMED_EMPTY;

            if (!settings.attribute) {
              warning(reason, diff);
            } else {
              following = at(end);

              if (following === EQUAL) {
                warning(reason, diff);
                entity = null;
              } else if (alphanumerical(following)) {
                entity = null;
              } else {
                warning(reason, diff);
              }
            }
          }
        }

        reference = entity;
      } else {
        if (!terminated) {
          /* All non-terminated numeric entities are
           * not rendered, and trigger a warning. */
          warning(NUMERIC_NOT_TERMINATED, diff);
        }

        /* When terminated and number, parse as
         * either hexadecimal or decimal. */
        reference = parseInt(characters, BASE[type]);

        /* Trigger a warning when the parsed number
         * is prohibited, and replace with
         * replacement character. */
        if (isProhibited(reference)) {
          warning(NUMERIC_PROHIBITED, diff);

          reference = REPLACEMENT;
        } else if (reference in invalid) {
          /* Trigger a warning when the parsed number
           * is disallowed, and replace by an
           * alternative. */
          warning(NUMERIC_DISALLOWED, diff);

          reference = invalid[reference];
        } else {
          /* Parse the number. */
          output = EMPTY;

          /* Trigger a warning when the parsed
           * number should not be used. */
          if (isWarning(reference)) {
            warning(NUMERIC_DISALLOWED, diff);
          }

          /* Stringify the number. */
          if (reference > 0xFFFF) {
            reference -= 0x10000;
            output += fromCharCode((reference >>> (10 & 0x3FF)) | 0xD800);
            reference = 0xDC00 | (reference & 0x3FF);
          }

          reference = output + fromCharCode(reference);
        }
      }

      /* If we could not find a reference, queue the
       * checked characters (as normal characters),
       * and move the pointer to their end. This is
       * possible because we can be certain neither
       * newlines nor ampersands are included. */
      if (!reference) {
        characters = value.slice(start - 1, end);
        queue += characters;
        column += characters.length;
        index = end - 1;
      } else {
        /* Found it! First eat the queued
         * characters as normal text, then eat
         * an entity. */
        flush();

        prev = now();
        index = end - 1;
        column += end - start + 1;
        result.push(reference);
        next = now();
        next.offset++;

        if (handleReference) {
          handleReference.call(referenceContext, reference, {
            start: prev,
            end: next
          }, value.slice(start - 1, end));
        }

        prev = next;
      }
    }
  }

  /* Return the reduced nodes, and any possible warnings. */
  return result.join(EMPTY);

  /**
   * Get current position.
   *
   * @return {Object} - Positional information of a
   *   single point.
   */
  function now() {
    return {
      line: line,
      column: column,
      offset: index + (pos.offset || 0)
    };
  }

  /**
   * “Throw” a parse-error: a warning.
   *
   * @param {number} code - Identifier of reason for
   *   failing.
   * @param {number} offset - Offset in characters from
   *   the current position point at which the
   *   parse-error ocurred, cannot point past newlines.
   */
  function parseError(code, offset) {
    var position = now();

    position.column += offset;
    position.offset += offset;

    handleWarning.call(warningContext, MESSAGES[code], position, code);
  }

  /**
   * Get character at position.
   *
   * @param {number} position - Indice of character in `value`.
   * @return {string} - Character at `position` in
   *   `value`.
   */
  function at(position) {
    return value.charAt(position);
  }

  /**
   * Flush `queue` (normal text). Macro invoked before
   * each entity and at the end of `value`.
   *
   * Does nothing when `queue` is empty.
   */
  function flush() {
    if (queue) {
      result.push(queue);

      if (handleText) {
        handleText.call(textContext, queue, {
          start: prev,
          end: now()
        });
      }

      queue = EMPTY;
    }
  }
}

/**
 * Check whether `character` is outside the permissible
 * unicode range.
 *
 * @param {number} code - Value.
 * @return {boolean} - Whether `character` is an
 *   outside the permissible unicode range.
 */
function isProhibited(code) {
  return (code >= 0xD800 && code <= 0xDFFF) || (code > 0x10FFFF);
}

/**
 * Check whether `character` is disallowed.
 *
 * @param {number} code - Value.
 * @return {boolean} - Whether `character` is disallowed.
 */
function isWarning(code) {
  if (
    (code >= 0x0001 && code <= 0x0008) ||
    code === 0x000B ||
    (code >= 0x000D && code <= 0x001F) ||
    (code >= 0x007F && code <= 0x009F) ||
    (code >= 0xFDD0 && code <= 0xFDEF) ||
    (code & 0xFFFF) === 0xFFFF ||
    (code & 0xFFFF) === 0xFFFE
  ) {
    return true;
  }

  return false;
}

},{"character-entities":108,"character-entities-legacy":107,"character-reference-invalid":109,"has":116,"is-alphanumerical":119,"is-decimal":120,"is-hexadecimal":121}],130:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015-2016 Titus Wormer
 * @license MIT
 * @module remark:parse
 * @fileoverview Markdown parser.
 */

'use strict';

/* eslint-env commonjs */

/* Dependencies. */
var unherit = require('unherit');
var Parser = require('./lib/parser.js');

/**
 * Attacher.
 *
 * @param {unified} processor - Unified processor.
 */
function parse(processor) {
    processor.Parser = unherit(Parser);
}

/* Patch `Parser`. */
parse.Parser = Parser;

/* Expose */
module.exports = parse;

},{"./lib/parser.js":134,"unherit":148}],131:[function(require,module,exports){
module.exports=[
    "article",
    "header",
    "aside",
    "hgroup",
    "blockquote",
    "hr",
    "iframe",
    "body",
    "li",
    "map",
    "button",
    "object",
    "canvas",
    "ol",
    "caption",
    "output",
    "col",
    "p",
    "colgroup",
    "pre",
    "dd",
    "progress",
    "div",
    "section",
    "dl",
    "table",
    "td",
    "dt",
    "tbody",
    "embed",
    "textarea",
    "fieldset",
    "tfoot",
    "figcaption",
    "th",
    "figure",
    "thead",
    "footer",
    "tr",
    "form",
    "ul",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "video",
    "script",
    "style"
]

},{}],132:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015-2016 Titus Wormer
 * @license MIT
 * @module remark:parse:defaults
 * @fileoverview Default options for `parse`.
 */

'use strict';

/* eslint-env commonjs */

module.exports = {
    'position': true,
    'gfm': true,
    'yaml': true,
    'commonmark': false,
    'footnotes': false,
    'pedantic': false,
    'breaks': false
};

},{}],133:[function(require,module,exports){
module.exports={
  "default": [
    "\\",
    "`",
    "*",
    "{",
    "}",
    "[",
    "]",
    "(",
    ")",
    "#",
    "+",
    "-",
    ".",
    "!",
    "_",
    ">"
  ],
  "gfm": [
    "\\",
    "`",
    "*",
    "{",
    "}",
    "[",
    "]",
    "(",
    ")",
    "#",
    "+",
    "-",
    ".",
    "!",
    "_",
    ">",
    "~",
    "|"
  ],
  "commonmark": [
    "\\",
    "`",
    "*",
    "{",
    "}",
    "[",
    "]",
    "(",
    ")",
    "#",
    "+",
    "-",
    ".",
    "!",
    "_",
    ">",
    "~",
    "|",
    "\n",
    "\"",
    "$",
    "%",
    "&",
    "'",
    ",",
    "/",
    ":",
    ";",
    "<",
    "=",
    "?",
    "@",
    "^"
  ]
}

},{}],134:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015-2016 Titus Wormer
 * @license MIT
 * @module remark:parser
 * @fileoverview Markdown parser.
 */

'use strict';

/* eslint-env commonjs */

/*
 * Dependencies.
 */

var decode = require('parse-entities');
var repeat = require('repeat-string');
var trim = require('trim');
var trimTrailingLines = require('trim-trailing-lines');
var extend = require('extend');
var vfileLocation = require('vfile-location');
var removePosition = require('unist-util-remove-position');
var collapseWhiteSpace = require('collapse-white-space');
var defaultOptions = require('./defaults.js');
var escapes = require('./escapes.json');
var blockElements = require('./block-elements.json');

/*
 * Methods.
 */

var has = {}.hasOwnProperty;

/*
 * Numeric constants.
 */

var SPACE_SIZE = 1;
var TAB_SIZE = 4;
var CODE_INDENT_LENGTH = 4;
var MIN_FENCE_COUNT = 3;
var MAX_ATX_COUNT = 6;
var MAX_LINE_HEADING_INDENT = 3;
var THEMATIC_BREAK_MARKER_COUNT = 3;
var MIN_CLOSING_HTML_NEWLINE_COUNT = 2;
var MIN_BREAK_LENGTH = 2;
var MIN_TABLE_COLUMNS = 2;
var MIN_TABLE_ROWS = 2;

/*
 * Error messages.
 */

var ERR_INFINITE_LOOP = 'Infinite loop';
var ERR_MISSING_LOCATOR = 'Missing locator: ';
var ERR_INCORRECTLY_EATEN = 'Incorrectly eaten value: please report this ' +
    'warning on http://git.io/vg5Ft';

/*
 * Expressions.
 */

var EXPRESSION_BULLET = /^([ \t]*)([*+-]|\d+[.)])( {1,4}(?! )| |\t|$|(?=\n))([^\n]*)/;
var EXPRESSION_PEDANTIC_BULLET = /^([ \t]*)([*+-]|\d+[.)])([ \t]+)/;
var EXPRESSION_INITIAL_INDENT = /^( {1,4}|\t)?/gm;
var EXPRESSION_INITIAL_TAB = /^( {4}|\t)?/gm;
var EXPRESSION_HTML_LINK_OPEN = /^<a /i;
var EXPRESSION_HTML_LINK_CLOSE = /^<\/a>/i;
var EXPRESSION_LOOSE_LIST_ITEM = /\n\n(?!\s*$)/;
var EXPRESSION_TASK_ITEM = /^\[([\ \t]|x|X)\][\ \t]/;
var EXPRESSION_LINE_BREAKS = /\r\n|\r/g;

/*
 * Characters.
 */

var C_BACKSLASH = '\\';
var C_UNDERSCORE = '_';
var C_ASTERISK = '*';
var C_TICK = '`';
var C_AT_SIGN = '@';
var C_HASH = '#';
var C_PLUS = '+';
var C_DASH = '-';
var C_DOT = '.';
var C_PIPE = '|';
var C_DOUBLE_QUOTE = '"';
var C_SINGLE_QUOTE = '\'';
var C_COMMA = ',';
var C_SLASH = '/';
var C_COLON = ':';
var C_SEMI_COLON = ';';
var C_QUESTION_MARK = '?';
var C_CARET = '^';
var C_EQUALS = '=';
var C_EXCLAMATION_MARK = '!';
var C_TILDE = '~';
var C_LT = '<';
var C_GT = '>';
var C_BRACKET_OPEN = '[';
var C_BRACKET_CLOSE = ']';
var C_PAREN_OPEN = '(';
var C_PAREN_CLOSE = ')';
var C_SPACE = ' ';
var C_FORM_FEED = '\f';
var C_NEWLINE = '\n';
var C_CARRIAGE_RETURN = '\r';
var C_TAB = '\t';
var C_VERTICAL_TAB = '\v';
var C_NO_BREAK_SPACE = '\u00a0';
var C_OGHAM_SPACE = '\u1680';
var C_MONGOLIAN_VOWEL_SEPARATOR = '\u180e';
var C_EN_QUAD = '\u2000';
var C_EM_QUAD = '\u2001';
var C_EN_SPACE = '\u2002';
var C_EM_SPACE = '\u2003';
var C_THREE_PER_EM_SPACE = '\u2004';
var C_FOUR_PER_EM_SPACE = '\u2005';
var C_SIX_PER_EM_SPACE = '\u2006';
var C_FIGURE_SPACE = '\u2007';
var C_PUNCTUATION_SPACE = '\u2008';
var C_THIN_SPACE = '\u2009';
var C_HAIR_SPACE = '\u200a';
var C_LINE_SEPARATOR = '​\u2028';
var C_PARAGRAPH_SEPARATOR = '​\u2029';
var C_NARROW_NO_BREAK_SPACE = '\u202f';
var C_IDEOGRAPHIC_SPACE = '\u3000';
var C_ZERO_WIDTH_NO_BREAK_SPACE = '\ufeff';
var C_X_LOWER = 'x';

/*
 * Character codes.
 */

var CC_A_LOWER = 'a'.charCodeAt(0);
var CC_A_UPPER = 'A'.charCodeAt(0);
var CC_Z_LOWER = 'z'.charCodeAt(0);
var CC_Z_UPPER = 'Z'.charCodeAt(0);
var CC_0 = '0'.charCodeAt(0);
var CC_9 = '9'.charCodeAt(0);

/*
 * Protocols.
 */

var HTTP_PROTOCOL = 'http://';
var HTTPS_PROTOCOL = 'https://';
var MAILTO_PROTOCOL = 'mailto:';

var PROTOCOLS = [
    HTTP_PROTOCOL,
    HTTPS_PROTOCOL,
    MAILTO_PROTOCOL
];

var PROTOCOLS_LENGTH = PROTOCOLS.length;

/*
 * Textual constants.
 */

var YAML_FENCE = repeat(C_DASH, 3);
var CODE_INDENT = repeat(C_SPACE, CODE_INDENT_LENGTH);
var EMPTY = '';
var BLOCK = 'block';
var INLINE = 'inline';
var COMMENT_START = '<!--';
var COMMENT_END = '-->';
var CDATA_START = '<![CDATA[';
var CDATA_END = ']]>';
var COMMENT_END_CHAR = COMMENT_END.charAt(0);
var CDATA_END_CHAR = CDATA_END.charAt(0);
var COMMENT_START_LENGTH = COMMENT_START.length;
var COMMENT_END_LENGTH = COMMENT_END.length;
var CDATA_START_LENGTH = CDATA_START.length;
var CDATA_END_LENGTH = CDATA_END.length;

/*
 * Node types.
 */

var T_THEMATIC_BREAK = 'thematicBreak';
var T_HTML = 'html';
var T_YAML = 'yaml';
var T_TABLE = 'table';
var T_TABLE_CELL = 'tableCell';
var T_TABLE_HEADER = 'tableRow';
var T_TABLE_ROW = 'tableRow';
var T_PARAGRAPH = 'paragraph';
var T_TEXT = 'text';
var T_CODE = 'code';
var T_LIST = 'list';
var T_LIST_ITEM = 'listItem';
var T_DEFINITION = 'definition';
var T_FOOTNOTE_DEFINITION = 'footnoteDefinition';
var T_HEADING = 'heading';
var T_BLOCKQUOTE = 'blockquote';
var T_LINK = 'link';
var T_IMAGE = 'image';
var T_FOOTNOTE = 'footnote';
var T_STRONG = 'strong';
var T_EMPHASIS = 'emphasis';
var T_DELETE = 'delete';
var T_INLINE_CODE = 'inlineCode';
var T_BREAK = 'break';
var T_ROOT = 'root';

/*
 * Available table alignments.
 */

var TABLE_ALIGN_LEFT = 'left';
var TABLE_ALIGN_CENTER = 'center';
var TABLE_ALIGN_RIGHT = 'right';
var TABLE_ALIGN_NONE = null;

/*
 * Available reference types.
 */

var REFERENCE_TYPE_SHORTCUT = 'shortcut';
var REFERENCE_TYPE_COLLAPSED = 'collapsed';
var REFERENCE_TYPE_FULL = 'full';

/*
 * A map of characters, and their column length,
 * which can be used as indentation.
 */

var INDENTATION_CHARACTERS = {};

INDENTATION_CHARACTERS[C_SPACE] = SPACE_SIZE;
INDENTATION_CHARACTERS[C_TAB] = TAB_SIZE;

/*
 * A map of characters, which can be used to mark emphasis.
 */

var EMPHASIS_MARKERS = {};

EMPHASIS_MARKERS[C_ASTERISK] = true;
EMPHASIS_MARKERS[C_UNDERSCORE] = true;

/*
 * A map of characters, which can be used to mark rules.
 */

var RULE_MARKERS = {};

RULE_MARKERS[C_ASTERISK] = true;
RULE_MARKERS[C_UNDERSCORE] = true;
RULE_MARKERS[C_DASH] = true;

/*
 * A map of characters which can be used to mark
 * list-items.
 */

var LIST_UNORDERED_MARKERS = {};

LIST_UNORDERED_MARKERS[C_ASTERISK] = true;
LIST_UNORDERED_MARKERS[C_PLUS] = true;
LIST_UNORDERED_MARKERS[C_DASH] = true;

/*
 * A map of characters which can be used to mark
 * list-items after a digit.
 */

var LIST_ORDERED_MARKERS = {};

LIST_ORDERED_MARKERS[C_DOT] = true;

/*
 * A map of characters which can be used to mark
 * list-items after a digit.
 */

var LIST_ORDERED_COMMONMARK_MARKERS = {};

LIST_ORDERED_COMMONMARK_MARKERS[C_DOT] = true;
LIST_ORDERED_COMMONMARK_MARKERS[C_PAREN_CLOSE] = true;

/*
 * A map of characters, which can be used to mark link
 * and image titles.
 */

var LINK_MARKERS = {};

LINK_MARKERS[C_DOUBLE_QUOTE] = C_DOUBLE_QUOTE;
LINK_MARKERS[C_SINGLE_QUOTE] = C_SINGLE_QUOTE;

/*
 * A map of characters, which can be used to mark link
 * and image titles in commonmark-mode.
 */

var COMMONMARK_LINK_MARKERS = {};

COMMONMARK_LINK_MARKERS[C_DOUBLE_QUOTE] = C_DOUBLE_QUOTE;
COMMONMARK_LINK_MARKERS[C_SINGLE_QUOTE] = C_SINGLE_QUOTE;
COMMONMARK_LINK_MARKERS[C_PAREN_OPEN] = C_PAREN_CLOSE;

/*
 * A map of characters which can be used to mark setext
 * headers, mapping to their corresponding depth.
 */

var SETEXT_MARKERS = {};

SETEXT_MARKERS[C_EQUALS] = 1;
SETEXT_MARKERS[C_DASH] = 2;

/*
 * A map of two functions which can create list items.
 */

var LIST_ITEM_MAP = {};

LIST_ITEM_MAP.true = renderPedanticListItem;
LIST_ITEM_MAP.false = renderNormalListItem;

/**
 * Check whether `character` is alphabetic.
 *
 * @param {string} character - Single character to check.
 * @return {boolean} - Whether `character` is alphabetic.
 */
function isAlphabetic(character) {
    var code = character.charCodeAt(0);

    return (code >= CC_A_LOWER && code <= CC_Z_LOWER) ||
        (code >= CC_A_UPPER && code <= CC_Z_UPPER);
}

/**
 * Check whether `character` is numeric.
 *
 * @param {string} character - Single character to check.
 * @return {boolean} - Whether `character` is numeric.
 */
function isNumeric(character) {
    var code = character.charCodeAt(0);

    return code >= CC_0 && code <= CC_9;
}

/**
 * Check whether `character` is a word character.
 *
 * @param {string} character - Single character to check.
 * @return {boolean} - Whether `character` is a word
 *   character.
 */
function isWordCharacter(character) {
    return character === C_UNDERSCORE ||
        isAlphabetic(character) ||
        isNumeric(character);
}

/**
 * Check whether `character` is white-space.
 *
 * @param {string} character - Single character to check.
 * @return {boolean} - Whether `character` is white-space.
 */
function isWhiteSpace(character) {
    return character === C_SPACE ||
        character === C_FORM_FEED ||
        character === C_NEWLINE ||
        character === C_CARRIAGE_RETURN ||
        character === C_TAB ||
        character === C_VERTICAL_TAB ||
        character === C_NO_BREAK_SPACE ||
        character === C_OGHAM_SPACE ||
        character === C_MONGOLIAN_VOWEL_SEPARATOR ||
        character === C_EN_QUAD ||
        character === C_EM_QUAD ||
        character === C_EN_SPACE ||
        character === C_EM_SPACE ||
        character === C_THREE_PER_EM_SPACE ||
        character === C_FOUR_PER_EM_SPACE ||
        character === C_SIX_PER_EM_SPACE ||
        character === C_FIGURE_SPACE ||
        character === C_PUNCTUATION_SPACE ||
        character === C_THIN_SPACE ||
        character === C_HAIR_SPACE ||
        character === C_LINE_SEPARATOR ||
        character === C_PARAGRAPH_SEPARATOR ||
        character === C_NARROW_NO_BREAK_SPACE ||
        character === C_IDEOGRAPHIC_SPACE ||
        character === C_ZERO_WIDTH_NO_BREAK_SPACE;
}

/**
 * Check whether `character` can be inside an unquoted
 * attribute value.
 *
 * @param {string} character - Single character to check.
 * @return {boolean} - Whether `character` can be inside
 *   an unquoted attribute value.
 */
function isUnquotedAttributeCharacter(character) {
    return character !== C_DOUBLE_QUOTE &&
        character !== C_SINGLE_QUOTE &&
        character !== C_EQUALS &&
        character !== C_LT &&
        character !== C_GT &&
        character !== C_TICK;
}

/**
 * Check whether `character` can be inside a double-quoted
 * attribute value.
 *
 * @property {string} delimiter - Closing delimiter.
 * @param {string} character - Single character to check.
 * @return {boolean} - Whether `character` can be inside
 *   a double-quoted attribute value.
 */
function isDoubleQuotedAttributeCharacter(character) {
    return character !== C_DOUBLE_QUOTE;
}

isDoubleQuotedAttributeCharacter.delimiter = C_DOUBLE_QUOTE;

/**
 * Check whether `character` can be inside a single-quoted
 * attribute value.
 *
 * @property {string} delimiter - Closing delimiter.
 * @param {string} character - Single character to check.
 * @return {boolean} - Whether `character` can be inside
 *   a single-quoted attribute value.
 */
function isSingleQuotedAttributeCharacter(character) {
    return character !== C_SINGLE_QUOTE;
}

isSingleQuotedAttributeCharacter.delimiter = C_SINGLE_QUOTE;

/**
 * Check whether `character` can be inside an enclosed
 * URI.
 *
 * @property {string} delimiter - Closing delimiter.
 * @param {string} character - Character to test.
 * @return {boolean} - Whether `character` can be inside
 *   an enclosed URI.
 */
function isEnclosedURLCharacter(character) {
    return character !== C_GT &&
        character !== C_BRACKET_OPEN &&
        character !== C_BRACKET_CLOSE;
}

isEnclosedURLCharacter.delimiter = C_GT;

/**
 * Check whether `character` can be inside an unclosed
 * URI.
 *
 * @param {string} character - Character to test.
 * @return {boolean} - Whether `character` can be inside
 *   an unclosed URI.
 */
function isUnclosedURLCharacter(character) {
    return character !== C_BRACKET_OPEN &&
        character !== C_BRACKET_CLOSE &&
        !isWhiteSpace(character);
}

/**
 * Normalize an identifier.  Collapses multiple white space
 * characters into a single space, and removes casing.
 *
 * @example
 *   normalizeIdentifier('FOO\t bar'); // 'foo bar'
 *
 * @param {string} value - Content to normalize.
 * @return {string} - Normalized content.
 */
function normalize(value) {
    return collapseWhiteSpace(value).toLowerCase();
}

/**
 * Construct a state `toggler`: a function which inverses
 * `property` in context based on its current value.
 * The by `toggler` returned function restores that value.
 *
 * @example
 *   var context = {};
 *   var key = 'foo';
 *   var val = true;
 *   context[key] = val;
 *   context.enter = toggle(key, val);
 *   context[key]; // true
 *   var exit = context.enter();
 *   context[key]; // false
 *   var nested = context.enter();
 *   context[key]; // false
 *   nested();
 *   context[key]; // false
 *   exit();
 *   context[key]; // true
 *
 * @param {string} key - Property to toggle.
 * @param {boolean} state - It's default state.
 * @return {function(): function()} - Enter.
 */
function toggle(key, state) {
    /**
     * Construct a toggler for the bound `key`.
     *
     * @return {Function} - Exit state.
     */
    function enter() {
        var self = this;
        var current = self[key];

        self[key] = !state;

        /**
         * State canceler, cancels the state, if allowed.
         */
        function exit() {
            self[key] = current;
        }

        return exit;
    }

    return enter;
}

/*
 * Define nodes of a type which can be merged.
 */

var MERGEABLE_NODES = {};

/**
 * Check whether a node is mergeable with adjacent nodes.
 *
 * @param {Object} node - Node to check.
 * @return {boolean} - Whether `node` is mergable.
 */
function mergeable(node) {
    var start;
    var end;

    if (node.type !== 'text' || !node.position) {
        return true;
    }

    start = node.position.start;
    end = node.position.end;

    /*
     * Only merge nodes which occupy the same size as their
     * `value`.
     */

    return start.line !== end.line ||
        end.column - start.column === node.value.length;
}

/**
 * Merge two text nodes: `node` into `prev`.
 *
 * @param {Object} prev - Preceding sibling.
 * @param {Object} node - Following sibling.
 * @return {Object} - `prev`.
 */
MERGEABLE_NODES.text = function (prev, node) {
    prev.value += node.value;

    return prev;
};

/**
 * Merge two blockquotes: `node` into `prev`, unless in
 * CommonMark mode.
 *
 * @param {Object} prev - Preceding sibling.
 * @param {Object} node - Following sibling.
 * @return {Object} - `prev`, or `node` in CommonMark mode.
 */
MERGEABLE_NODES.blockquote = function (prev, node) {
    if (this.options.commonmark) {
        return node;
    }

    prev.children = prev.children.concat(node.children);

    return prev;
};

/**
 * Factory to create an entity decoder.
 *
 * @param {Object} context - Context to attach to, e.g.,
 *   a parser.
 * @return {Function} - See `decode`.
 */
function decodeFactory(context) {
    /**
     * Normalize `position` to add an `indent`.
     *
     * @param {Position} position - Reference
     * @return {Position} - Augmented with `indent`.
     */
    function normalize(position) {
        return {
            'start': position,
            'indent': context.getIndent(position.line)
        };
    }

    /**
     * Handle a warning.
     *
     * @this {VFile} - Virtual file.
     * @param {string} reason - Reason for warning.
     * @param {Position} position - Place of warning.
     * @param {number} code - Code for warning.
     */
    function handleWarning(reason, position, code) {
        if (code === 3) {
            return;
        }

        context.file.warn(reason, position);
    }

    /**
     * Decode `value` (at `position`) into text-nodes.
     *
     * @param {string} value - Value to parse.
     * @param {Position} position - Position to start parsing at.
     * @param {Function} handler - Node handler.
     */
    function decoder(value, position, handler) {
        decode(value, {
            'position': normalize(position),
            'warning': handleWarning,
            'text': handler,
            'reference': handler,
            'textContext': context,
            'referenceContext': context
        });
    }

    /**
     * Decode `value` (at `position`) into a string.
     *
     * @param {string} value - Value to parse.
     * @param {Position} position - Position to start
     *   parsing at.
     * @return {string} - Plain-text.
     */
    function decodeRaw(value, position) {
        return decode(value, {
            'position': normalize(position),
            'warning': handleWarning
        });
    }

    decoder.raw = decodeRaw;

    return decoder;
}

/**
 * Factory to de-escape a value, based on a list at `key`
 * in `scope`.
 *
 * @example
 *   var scope = {escape: ['a']}
 *   var descape = descapeFactory(scope, 'escape');
 *
 * @param {Object} scope - List of escapable characters.
 * @param {string} key - Key in `map` at which the list
 *   exists.
 * @return {function(string): string} - Function which
 *   takes a value and returns its unescaped version.
 */
function descapeFactory(scope, key) {
    /**
     * De-escape a string using the expression at `key`
     * in `scope`.
     *
     * @example
     *   var scope = {escape: ['a']}
     *   var descape = descapeFactory(scope, 'escape');
     *   descape('\a \b'); // 'a \b'
     *
     * @param {string} value - Escaped string.
     * @return {string} - Unescaped string.
     */
    function descape(value) {
        var prev = 0;
        var index = value.indexOf(C_BACKSLASH);
        var escape = scope[key];
        var queue = [];
        var character;

        while (index !== -1) {
            queue.push(value.slice(prev, index));
            prev = index + 1;
            character = value.charAt(prev);

            /*
             * If the following character is not a valid escape,
             * add the slash.
             */

            if (!character || escape.indexOf(character) === -1) {
                queue.push(C_BACKSLASH);
            }

            index = value.indexOf(C_BACKSLASH, prev);
        }

        queue.push(value.slice(prev));

        return queue.join(EMPTY);
    }

    return descape;
}

/**
 * Gets indentation information for a line.
 *
 * @example
 *   getIndent('  foo');
 *   // {indent: 2, stops: {1: 0, 2: 1}}
 *
 *   getIndent('\tfoo');
 *   // {indent: 4, stops: {4: 0}}
 *
 *   getIndent('  \tfoo');
 *   // {indent: 4, stops: {1: 0, 2: 1, 4: 2}}
 *
 *   getIndent('\t  foo')
 *   // {indent: 6, stops: {4: 0, 5: 1, 6: 2}}
 *
 * @param {string} value - Indented line.
 * @return {Object} - Indetation information.
 */
function getIndent(value) {
    var index = 0;
    var indent = 0;
    var character = value.charAt(index);
    var stops = {};
    var size;

    while (character in INDENTATION_CHARACTERS) {
        size = INDENTATION_CHARACTERS[character];

        indent += size;

        if (size > 1) {
            indent = Math.floor(indent / size) * size;
        }

        stops[indent] = index;

        character = value.charAt(++index);
    }

    return {
        'indent': indent,
        'stops': stops
    };
}

/**
 * Remove the minimum indent from every line in `value`.
 * Supports both tab, spaced, and mixed indentation (as
 * well as possible).
 *
 * @example
 *   removeIndentation('  foo'); // 'foo'
 *   removeIndentation('    foo', 2); // '  foo'
 *   removeIndentation('\tfoo', 2); // '  foo'
 *   removeIndentation('  foo\n bar'); // ' foo\n bar'
 *
 * @param {string} value - Value to trim.
 * @param {number?} [maximum] - Maximum indentation
 *   to remove.
 * @return {string} - Unindented `value`.
 */
function removeIndentation(value, maximum) {
    var values = value.split(C_NEWLINE);
    var position = values.length + 1;
    var minIndent = Infinity;
    var matrix = [];
    var index;
    var indentation;
    var stops;
    var padding;

    values.unshift(repeat(C_SPACE, maximum) + C_EXCLAMATION_MARK);

    while (position--) {
        indentation = getIndent(values[position]);

        matrix[position] = indentation.stops;

        if (trim(values[position]).length === 0) {
            continue;
        }

        if (indentation.indent) {
            if (indentation.indent > 0 && indentation.indent < minIndent) {
                minIndent = indentation.indent;
            }
        } else {
            minIndent = Infinity;

            break;
        }
    }

    if (minIndent !== Infinity) {
        position = values.length;

        while (position--) {
            stops = matrix[position];
            index = minIndent;

            while (index && !(index in stops)) {
                index--;
            }

            if (
                trim(values[position]).length !== 0 &&
                minIndent &&
                index !== minIndent
            ) {
                padding = C_TAB;
            } else {
                padding = EMPTY;
            }

            values[position] = padding + values[position].slice(
                index in stops ? stops[index] + 1 : 0
            );
        }
    }

    values.shift();

    return values.join(C_NEWLINE);
}

/**
 * Tokenise a line.
 *
 * @example
 *   tokenizeNewline(eat, '\n\n');
 *
 * @param {function(string)} eat - Eater.
 * @param {string} value - Rest of content.
 * @param {boolean?} [silent] - Whether this is a dry run.
 * @return {boolean?} - `true` when matching.
 */
function tokenizeNewline(eat, value, silent) {
    var character = value.charAt(0);
    var length;
    var subvalue;
    var queue;
    var index;

    if (character !== C_NEWLINE) {
        return;
    }

    /* istanbul ignore if - never used (yet) */
    if (silent) {
        return true;
    }

    index = 1;
    length = value.length;
    subvalue = C_NEWLINE;
    queue = EMPTY;

    while (index < length) {
        character = value.charAt(index);

        if (!isWhiteSpace(character)) {
            break;
        }

        queue += character;

        if (character === C_NEWLINE) {
            subvalue += queue;
            queue = EMPTY;
        }

        index++;
    }

    eat(subvalue);
}

/**
 * Tokenise an indented code block.
 *
 * @example
 *   tokenizeIndentedCode(eat, '\tfoo');
 *
 * @param {function(string)} eat - Eater.
 * @param {string} value - Rest of content.
 * @param {boolean?} [silent] - Whether this is a dry run.
 * @return {Node?|boolean} - `code` node.
 */
function tokenizeIndentedCode(eat, value, silent) {
    var self = this;
    var index = -1;
    var length = value.length;
    var character;
    var subvalue = EMPTY;
    var content = EMPTY;
    var subvalueQueue = EMPTY;
    var contentQueue = EMPTY;
    var blankQueue;
    var indent;

    while (++index < length) {
        character = value.charAt(index);

        if (indent) {
            indent = false;

            subvalue += subvalueQueue;
            content += contentQueue;
            subvalueQueue = contentQueue = EMPTY;

            if (character === C_NEWLINE) {
                subvalueQueue = contentQueue = character;
            } else {
                subvalue += character;
                content += character;

                while (++index < length) {
                    character = value.charAt(index);

                    if (!character || character === C_NEWLINE) {
                        contentQueue = subvalueQueue = character;
                        break;
                    }

                    subvalue += character;
                    content += character;
                }
            }
        } else if (
            character === C_SPACE &&
            value.charAt(index + 1) === C_SPACE &&
            value.charAt(index + 2) === C_SPACE &&
            value.charAt(index + 3) === C_SPACE
        ) {
            subvalueQueue += CODE_INDENT;
            index += 3;
            indent = true;
        } else if (character === C_TAB) {
            subvalueQueue += character;
            indent = true;
        } else {
            blankQueue = EMPTY;

            while (character === C_TAB || character === C_SPACE) {
                blankQueue += character;
                character = value.charAt(++index);
            }

            if (character !== C_NEWLINE) {
                break;
            }

            subvalueQueue += blankQueue + character;
            contentQueue += character;
        }
    }

    if (content) {
        if (silent) {
            return true;
        }

        return eat(subvalue)(self.renderCodeBlock(content));
    }
}

/**
 * Tokenise a fenced code block.
 *
 * @example
 *   tokenizeFencedCode(eat, '```js\nfoo()\n```');
 *
 * @param {function(string)} eat - Eater.
 * @param {string} value - Rest of content.
 * @param {boolean?} [silent] - Whether this is a dry run.
 * @return {Node?|boolean} - `code` node.
 */
function tokenizeFencedCode(eat, value, silent) {
    var self = this;
    var settings = self.options;
    var length = value.length + 1;
    var index = 0;
    var subvalue = EMPTY;
    var fenceCount;
    var marker;
    var character;
    var flag;
    var queue;
    var content;
    var exdentedContent;
    var closing;
    var exdentedClosing;
    var indent;
    var now;

    if (!settings.gfm) {
        return;
    }

    /*
     * Eat initial spacing.
     */

    while (index < length) {
        character = value.charAt(index);

        if (character !== C_SPACE && character !== C_TAB) {
            break;
        }

        subvalue += character;
        index++;
    }

    indent = index; // TODO: CHECK.

    /*
     * Eat the fence.
     */

    character = value.charAt(index);

    if (character !== C_TILDE && character !== C_TICK) {
        return;
    }

    index++;
    marker = character;
    fenceCount = 1;
    subvalue += character;

    while (index < length) {
        character = value.charAt(index);

        if (character !== marker) {
            break;
        }

        subvalue += character;
        fenceCount++;
        index++;
    }

    if (fenceCount < MIN_FENCE_COUNT) {
        return;
    }

    /*
     * Eat spacing before flag.
     */

    while (index < length) {
        character = value.charAt(index);

        if (character !== C_SPACE && character !== C_TAB) {
            break;
        }

        subvalue += character;
        index++;
    }

    /*
     * Eat flag.
     */

    flag = queue = EMPTY;

    while (index < length) {
        character = value.charAt(index);

        if (
            character === C_NEWLINE ||
            character === C_TILDE ||
            character === C_TICK
        ) {
            break;
        }

        if (character === C_SPACE || character === C_TAB) {
            queue += character;
        } else {
            flag += queue + character;
            queue = EMPTY;
        }

        index++;
    }

    character = value.charAt(index);

    if (character && character !== C_NEWLINE) {
        return;
    }

    if (silent) {
        return true;
    }

    now = eat.now();
    now.column += subvalue.length;
    now.offset += subvalue.length;

    subvalue += flag;
    flag = self.decode.raw(self.descape(flag), now);

    if (queue) {
        subvalue += queue;
    }

    queue = closing = exdentedClosing = content = exdentedContent = EMPTY;

    /*
     * Eat content.
     */

    while (index < length) {
        character = value.charAt(index);
        content += closing;
        exdentedContent += exdentedClosing;
        closing = exdentedClosing = EMPTY;

        if (character !== C_NEWLINE) {
            content += character;
            exdentedClosing += character;
            index++;
            continue;
        }

        /*
         * Add the newline to `subvalue` if its the first
         * character. Otherwise, add it to the `closing`
         * queue.
         */

        if (!content) {
            subvalue += character;
        } else {
            closing += character;
            exdentedClosing += character;
        }

        queue = EMPTY;
        index++;

        while (index < length) {
            character = value.charAt(index);

            if (character !== C_SPACE) {
                break;
            }

            queue += character;
            index++;
        }

        closing += queue;
        exdentedClosing += queue.slice(indent);

        if (queue.length >= CODE_INDENT_LENGTH) {
            continue;
        }

        queue = EMPTY;

        while (index < length) {
            character = value.charAt(index);

            if (character !== marker) {
                break;
            }

            queue += character;
            index++;
        }

        closing += queue;
        exdentedClosing += queue;

        if (queue.length < fenceCount) {
            continue;
        }

        queue = EMPTY;

        while (index < length) {
            character = value.charAt(index);

            if (character !== C_SPACE && character !== C_TAB) {
                break;
            }

            closing += character;
            exdentedClosing += character;
            index++;
        }

        if (!character || character === C_NEWLINE) {
            break;
        }
    }

    subvalue += content + closing;

    return eat(subvalue)(self.renderCodeBlock(exdentedContent, flag));
}

/**
 * Tokenise an ATX-style heading.
 *
 * @example
 *   tokenizeATXHeading(eat, ' # foo');
 *
 * @param {function(string)} eat - Eater.
 * @param {string} value - Rest of content.
 * @param {boolean?} [silent] - Whether this is a dry run.
 * @return {Node?|boolean} - `heading` node.
 */
function tokenizeATXHeading(eat, value, silent) {
    var self = this;
    var settings = self.options;
    var length = value.length + 1;
    var index = -1;
    var now = eat.now();
    var subvalue = EMPTY;
    var content = EMPTY;
    var character;
    var queue;
    var depth;

    /*
     * Eat initial spacing.
     */

    while (++index < length) {
        character = value.charAt(index);

        if (character !== C_SPACE && character !== C_TAB) {
            index--;
            break;
        }

        subvalue += character;
    }

    /*
     * Eat hashes.
     */

    depth = 0;
    length = index + MAX_ATX_COUNT + 1;

    while (++index <= length) {
        character = value.charAt(index);

        if (character !== C_HASH) {
            index--;
            break;
        }

        subvalue += character;
        depth++;
    }

    if (
        !depth ||
        (!settings.pedantic && value.charAt(index + 1) === C_HASH)
    ) {
        return;
    }

    length = value.length + 1;

    /*
     * Eat intermediate white-space.
     */

    queue = EMPTY;

    while (++index < length) {
        character = value.charAt(index);

        if (character !== C_SPACE && character !== C_TAB) {
            index--;
            break;
        }

        queue += character;
    }

    /*
     * Exit when not in pedantic mode without spacing.
     */

    if (
        !settings.pedantic &&
        !queue.length &&
        character &&
        character !== C_NEWLINE
    ) {
        return;
    }

    if (silent) {
        return true;
    }

    /*
     * Eat content.
     */

    subvalue += queue;
    queue = content = EMPTY;

    while (++index < length) {
        character = value.charAt(index);

        if (!character || character === C_NEWLINE) {
            break;
        }

        if (
            character !== C_SPACE &&
            character !== C_TAB &&
            character !== C_HASH
        ) {
            content += queue + character;
            queue = EMPTY;
            continue;
        }

        while (character === C_SPACE || character === C_TAB) {
            queue += character;
            character = value.charAt(++index);
        }

        while (character === C_HASH) {
            queue += character;
            character = value.charAt(++index);
        }

        while (character === C_SPACE || character === C_TAB) {
            queue += character;
            character = value.charAt(++index);
        }

        index--;
    }

    now.column += subvalue.length;
    now.offset += subvalue.length;
    subvalue += content + queue;

    return eat(subvalue)(self.renderHeading(content, depth, now));
}

/**
 * Tokenise a Setext-style heading.
 *
 * @example
 *   tokenizeSetextHeading(eat, 'foo\n===');
 *
 * @param {function(string)} eat - Eater.
 * @param {string} value - Rest of content.
 * @param {boolean?} [silent] - Whether this is a dry run.
 * @return {Node?|boolean} - `heading` node.
 */
function tokenizeSetextHeading(eat, value, silent) {
    var self = this;
    var now = eat.now();
    var length = value.length;
    var index = -1;
    var subvalue = EMPTY;
    var content;
    var queue;
    var character;
    var marker;
    var depth;

    /*
     * Eat initial indentation.
     */

    while (++index < length) {
        character = value.charAt(index);

        if (character !== C_SPACE || index >= MAX_LINE_HEADING_INDENT) {
            index--;
            break;
        }

        subvalue += character;
    }

    /*
     * Eat content.
     */

    content = queue = EMPTY;

    while (++index < length) {
        character = value.charAt(index);

        if (character === C_NEWLINE) {
            index--;
            break;
        }

        if (character === C_SPACE || character === C_TAB) {
            queue += character;
        } else {
            content += queue + character;
            queue = EMPTY;
        }
    }

    now.column += subvalue.length;
    now.offset += subvalue.length;
    subvalue += content + queue;

    /*
     * Ensure the content is followed by a newline and a
     * valid marker.
     */

    character = value.charAt(++index);
    marker = value.charAt(++index);

    if (character !== C_NEWLINE || !SETEXT_MARKERS[marker]) {
        return;
    }

    subvalue += character;

    /*
     * Eat Setext-line.
     */

    queue = marker;
    depth = SETEXT_MARKERS[marker];

    while (++index < length) {
        character = value.charAt(index);

        if (character !== marker) {
            if (character !== C_NEWLINE) {
                return;
            }

            index--;
            break;
        }

        queue += character;
    }

    if (silent) {
        return true;
    }

    return eat(subvalue + queue)(self.renderHeading(content, depth, now));
}

/**
 * Tokenise a horizontal rule.
 *
 * @example
 *   tokenizeThematicBreak(eat, '***');
 *
 * @param {function(string)} eat - Eater.
 * @param {string} value - Rest of content.
 * @param {boolean?} [silent] - Whether this is a dry run.
 * @return {Node?|boolean} - `thematicBreak` node.
 */
function tokenizeThematicBreak(eat, value, silent) {
    var self = this;
    var index = -1;
    var length = value.length + 1;
    var subvalue = EMPTY;
    var character;
    var marker;
    var markerCount;
    var queue;

    while (++index < length) {
        character = value.charAt(index);

        if (character !== C_TAB && character !== C_SPACE) {
            break;
        }

        subvalue += character;
    }

    if (RULE_MARKERS[character] !== true) {
        return;
    }

    marker = character;
    subvalue += character;
    markerCount = 1;
    queue = EMPTY;

    while (++index < length) {
        character = value.charAt(index);

        if (character === marker) {
            markerCount++;
            subvalue += queue + marker;
            queue = EMPTY;
        } else if (character === C_SPACE) {
            queue += character;
        } else if (
            markerCount >= THEMATIC_BREAK_MARKER_COUNT &&
            (!character || character === C_NEWLINE)
        ) {
            subvalue += queue;

            if (silent) {
                return true;
            }

            return eat(subvalue)(self.renderVoid(T_THEMATIC_BREAK));
        } else {
            return;
        }
    }
}

/**
 * Tokenise a blockquote.
 *
 * @example
 *   tokenizeBlockquote(eat, '> Foo');
 *
 * @param {function(string)} eat - Eater.
 * @param {string} value - Rest of content.
 * @param {boolean?} [silent] - Whether this is a dry run.
 * @return {Node?|boolean} - `blockquote` node.
 */
function tokenizeBlockquote(eat, value, silent) {
    var self = this;
    var commonmark = self.options.commonmark;
    var now = eat.now();
    var indent = self.indent(now.line);
    var length = value.length;
    var values = [];
    var contents = [];
    var indents = [];
    var add;
    var tokenizers;
    var index = 0;
    var character;
    var rest;
    var nextIndex;
    var content;
    var line;
    var startIndex;
    var prefixed;

    while (index < length) {
        character = value.charAt(index);

        if (character !== C_SPACE && character !== C_TAB) {
            break;
        }

        index++;
    }

    if (value.charAt(index) !== C_GT) {
        return;
    }

    if (silent) {
        return true;
    }

    tokenizers = self.blockTokenizers;
    index = 0;

    while (index < length) {
        nextIndex = value.indexOf(C_NEWLINE, index);
        startIndex = index;
        prefixed = false;

        if (nextIndex === -1) {
            nextIndex = length;
        }

        while (index < length) {
            character = value.charAt(index);

            if (character !== C_SPACE && character !== C_TAB) {
                break;
            }

            index++;
        }

        if (value.charAt(index) === C_GT) {
            index++;
            prefixed = true;

            if (value.charAt(index) === C_SPACE) {
                index++;
            }
        } else {
            index = startIndex;
        }

        content = value.slice(index, nextIndex);

        if (!prefixed && !trim(content)) {
            index = startIndex;
            break;
        }

        if (!prefixed) {
            rest = value.slice(index);

            if (
                commonmark &&
                (
                    tokenizers.indentedCode.call(self, eat, rest, true) ||
                    tokenizers.fencedCode.call(self, eat, rest, true) ||
                    tokenizers.atxHeading.call(self, eat, rest, true) ||
                    tokenizers.setextHeading.call(self, eat, rest, true) ||
                    tokenizers.thematicBreak.call(self, eat, rest, true) ||
                    tokenizers.html.call(self, eat, rest, true) ||
                    tokenizers.list.call(self, eat, rest, true)
                )
            ) {
                break;
            }

            if (
                !commonmark &&
                (
                    tokenizers.definition.call(self, eat, rest, true) ||
                    tokenizers.footnote.call(self, eat, rest, true)
                )
            ) {
                break;
            }
        }

        line = startIndex === index ?
            content :
            value.slice(startIndex, nextIndex);

        indents.push(index - startIndex);
        values.push(line);
        contents.push(content);

        index = nextIndex + 1;
    }

    index = -1;
    length = indents.length;
    add = eat(values.join(C_NEWLINE));

    while (++index < length) {
        indent(indents[index]);
    }

    return add(self.renderBlockquote(contents.join(C_NEWLINE), now));
}

/**
 * Tokenise a list.
 *
 * @example
 *   tokenizeList(eat, '- Foo');
 *
 * @param {function(string)} eat - Eater.
 * @param {string} value - Rest of content.
 * @param {boolean?} [silent] - Whether this is a dry run.
 * @return {Node?|boolean} - `list` node.
 */
function tokenizeList(eat, value, silent) {
    var self = this;
    var commonmark = self.options.commonmark;
    var pedantic = self.options.pedantic;
    var tokenizers = self.blockTokenizers;
    var markers;
    var index = 0;
    var length = value.length;
    var start = null;
    var queue;
    var ordered;
    var character;
    var marker;
    var nextIndex;
    var startIndex;
    var prefixed;
    var currentMarker;
    var content;
    var line;
    var prevEmpty;
    var empty;
    var items;
    var allLines;
    var emptyLines;
    var item;
    var enterTop;
    var exitBlockquote;
    var isLoose;
    var node;
    var now;
    var end;
    var indented;
    var size;

    while (index < length) {
        character = value.charAt(index);

        if (character !== C_SPACE && character !== C_TAB) {
            break;
        }

        index++;
    }

    character = value.charAt(index);

    markers = commonmark ?
        LIST_ORDERED_COMMONMARK_MARKERS :
        LIST_ORDERED_MARKERS;

    if (LIST_UNORDERED_MARKERS[character] === true) {
        marker = character;
        ordered = false;
    } else {
        ordered = true;
        queue = EMPTY;

        while (index < length) {
            character = value.charAt(index);

            if (!isNumeric(character)) {
                break;
            }

            queue += character;
            index++;
        }

        character = value.charAt(index);

        if (!queue || markers[character] !== true) {
            return;
        }

        start = parseInt(queue, 10);
        marker = character;
    }

    character = value.charAt(++index);

    if (character !== C_SPACE && character !== C_TAB) {
        return;
    }

    if (silent) {
        return true;
    }

    index = 0;
    items = [];
    allLines = [];
    emptyLines = [];

    while (index < length) {
        nextIndex = value.indexOf(C_NEWLINE, index);
        startIndex = index;
        prefixed = false;
        indented = false;

        if (nextIndex === -1) {
            nextIndex = length;
        }

        end = index + TAB_SIZE;
        size = 0;

        while (index < length) {
            character = value.charAt(index);

            if (character === C_TAB) {
                size += TAB_SIZE - size % TAB_SIZE;
            } else if (character === C_SPACE) {
                size++;
            } else {
                break;
            }

            index++;
        }

        if (size >= TAB_SIZE) {
            indented = true;
        }

        if (item && size >= item.indent) {
            indented = true;
        }

        character = value.charAt(index);
        currentMarker = null;

        if (!indented) {
            if (LIST_UNORDERED_MARKERS[character] === true) {
                currentMarker = character;
                index++;
                size++;
            } else {
                queue = EMPTY;

                while (index < length) {
                    character = value.charAt(index);

                    if (!isNumeric(character)) {
                        break;
                    }

                    queue += character;
                    index++;
                }

                character = value.charAt(index);
                index++;

                if (queue && markers[character] === true) {
                    currentMarker = character;
                    size += queue.length + 1;
                }
            }

            if (currentMarker) {
                character = value.charAt(index);

                if (character === C_TAB) {
                    size += TAB_SIZE - size % TAB_SIZE;
                    index++;
                } else if (character === C_SPACE) {
                    end = index + TAB_SIZE;

                    while (index < end) {
                        if (value.charAt(index) !== C_SPACE) {
                            break;
                        }

                        index++;
                        size++;
                    }

                    if (index === end && value.charAt(index) === C_SPACE) {
                        index -= TAB_SIZE - 1;
                        size -= TAB_SIZE - 1;
                    }
                } else if (
                    character !== C_NEWLINE &&
                    character !== EMPTY
                ) {
                    currentMarker = null;
                }
            }
        }

        if (currentMarker) {
            if (commonmark && marker !== currentMarker) {
                break;
            }

            prefixed = true;
        } else {
            if (
                !commonmark &&
                !indented &&
                value.charAt(startIndex) === C_SPACE
            ) {
                indented = true;
            } else if (
                commonmark &&
                item
            ) {
                indented = size >= item.indent || size > TAB_SIZE;
            }

            prefixed = false;
            index = startIndex;
        }

        line = value.slice(startIndex, nextIndex);
        content = startIndex === index ? line : value.slice(index, nextIndex);

        if (currentMarker && RULE_MARKERS[currentMarker] === true) {
            if (
                tokenizers.thematicBreak.call(self, eat, line, true)
            ) {
                break;
            }
        }

        prevEmpty = empty;
        empty = !trim(content).length;

        if (indented && item) {
            item.value = item.value.concat(emptyLines, line);
            allLines = allLines.concat(emptyLines, line);
            emptyLines = [];
        } else if (prefixed) {
            if (emptyLines.length) {
                item.value.push(EMPTY);
                item.trail = emptyLines.concat();
            }

            item = {
                // 'bullet': value.slice(startIndex, index),
                'value': [line],
                'indent': size,
                'trail': []
            };

            items.push(item);
            allLines = allLines.concat(emptyLines, line);
            emptyLines = [];
        } else if (empty) {
            // TODO: disable when in pedantic-mode.
            if (prevEmpty) {
                break;
            }

            emptyLines.push(line);
        } else {
            if (prevEmpty) {
                break;
            }

            if (
                !pedantic &&
                (
                    tokenizers.fencedCode.call(self, eat, line, true) ||
                    tokenizers.thematicBreak.call(self, eat, line, true)
                )
            ) {
                break;
            }

            if (!commonmark) {
                if (
                    tokenizers.definition.call(self, eat, line, true) ||
                    tokenizers.footnote.call(self, eat, line, true)
                ) {
                    break;
                }
            }

            item.value = item.value.concat(emptyLines, line);
            allLines = allLines.concat(emptyLines, line);
            emptyLines = [];
        }

        index = nextIndex + 1;
    }

    node = eat(allLines.join(C_NEWLINE)).reset({
        'type': T_LIST,
        'ordered': ordered,
        'start': start,
        'loose': null,
        'children': []
    });

    enterTop = self.enterList();
    exitBlockquote = self.enterBlock();
    isLoose = false;
    index = -1;
    length = items.length;

    while (++index < length) {
        item = items[index].value.join(C_NEWLINE);
        now = eat.now();

        item = eat(item)(self.renderListItem(item, now), node);

        if (item.loose) {
            isLoose = true;
        }

        item = items[index].trail.join(C_NEWLINE);

        if (index !== length - 1) {
            item += C_NEWLINE;
        }

        eat(item);
    }

    enterTop();
    exitBlockquote();

    node.loose = isLoose;

    return node;
}

/**
 * Try to match comment.
 *
 * @param {string} value - Value to parse.
 * @param {Object} settings - Configuration as available on
 *   a parser.
 * @return {string?} - When applicable, the comment at the
 *   start of `value`.
 */
function eatHTMLComment(value, settings) {
    var index = COMMENT_START_LENGTH;
    var queue = COMMENT_START;
    var length = value.length;
    var commonmark = settings.commonmark;
    var character;
    var hasNonDash;

    if (value.slice(0, index) === queue) {
        while (index < length) {
            character = value.charAt(index);

            if (
                character === COMMENT_END_CHAR &&
                value.slice(index, index + COMMENT_END_LENGTH) === COMMENT_END
            ) {
                return queue + COMMENT_END;
            }

            if (commonmark) {
                if (character === C_GT && !hasNonDash) {
                    return;
                }

                if (character === C_DASH) {
                    if (value.charAt(index + 1) === C_DASH) {
                        return;
                    }
                } else {
                    hasNonDash = true;
                }
            }

            queue += character;
            index++;
        }
    }
}

/**
 * Try to match CDATA.
 *
 * @param {string} value - Value to parse.
 * @return {string?} - When applicable, the CDATA at the
 *   start of `value`.
 */
function eatHTMLCDATA(value) {
    var index = CDATA_START_LENGTH;
    var queue = value.slice(0, index);
    var length = value.length;
    var character;

    if (queue.toUpperCase() === CDATA_START) {
        while (index < length) {
            character = value.charAt(index);

            if (
                character === CDATA_END_CHAR &&
                value.slice(index, index + CDATA_END_LENGTH) === CDATA_END
            ) {
                return queue + CDATA_END;
            }

            queue += character;
            index++;
        }
    }
}

/**
 * Try to match a processing instruction.
 *
 * @param {string} value - Value to parse.
 * @return {string?} - When applicable, the processing
 *   instruction at the start of `value`.
 */
function eatHTMLProcessingInstruction(value) {
    var index = 0;
    var queue = EMPTY;
    var length = value.length;
    var character;

    if (
        value.charAt(index) === C_LT &&
        value.charAt(++index) === C_QUESTION_MARK
    ) {
        queue = C_LT + C_QUESTION_MARK;
        index++;

        while (index < length) {
            character = value.charAt(index);

            if (
                character === C_QUESTION_MARK &&
                value.charAt(index + 1) === C_GT
            ) {
                return queue + character + C_GT;
            }

            queue += character;
            index++;
        }
    }
}

/**
 * Try to match a declaration.
 *
 * @param {string} value - Value to parse.
 * @return {string?} - When applicable, the declaration at
 *   the start of `value`.
 */
function eatHTMLDeclaration(value) {
    var index = 0;
    var length = value.length;
    var queue = EMPTY;
    var subqueue = EMPTY;
    var character;

    if (
        value.charAt(index) === C_LT &&
        value.charAt(++index) === C_EXCLAMATION_MARK
    ) {
        queue = C_LT + C_EXCLAMATION_MARK;
        index++;

        /*
         * Eat as many alphabetic characters as
         * possible.
         */

        while (index < length) {
            character = value.charAt(index);

            if (!isAlphabetic(character)) {
                break;
            }

            subqueue += character;
            index++;
        }

        character = value.charAt(index);

        if (!subqueue || !isWhiteSpace(character)) {
            return;
        }

        queue += subqueue + character;
        index++;

        while (index < length) {
            character = value.charAt(index);

            if (character === C_GT) {
                return queue;
            }

            queue += character;
            index++;
        }
    }
}

/**
 * Try to match a closing tag.
 *
 * @param {string} value - Value to parse.
 * @param {boolean?} [isBlock] - Whether the tag-name
 *   must be a known block-level node to match.
 * @return {string?} - When applicable, the closing tag at
 *   the start of `value`.
 */
function eatHTMLClosingTag(value, isBlock) {
    var index = 0;
    var length = value.length;
    var queue = EMPTY;
    var subqueue = EMPTY;
    var character;

    if (
        value.charAt(index) === C_LT &&
        value.charAt(++index) === C_SLASH
    ) {
        queue = C_LT + C_SLASH;
        subqueue = character = value.charAt(++index);

        if (!isAlphabetic(character)) {
            return;
        }

        index++;

        /*
         * Eat as many alphabetic characters as
         * possible.
         */

        while (index < length) {
            character = value.charAt(index);

            if (!isAlphabetic(character) && !isNumeric(character)) {
                break;
            }

            subqueue += character;
            index++;
        }

        if (isBlock && blockElements.indexOf(subqueue.toLowerCase()) === -1) {
            return;
        }

        queue += subqueue;

        /*
         * Eat white-space.
         */

        while (index < length) {
            character = value.charAt(index);

            if (!isWhiteSpace(character)) {
                break;
            }

            queue += character;
            index++;
        }

        if (value.charAt(index) === C_GT) {
            return queue + C_GT;
        }
    }
}

/**
 * Try to match an opening tag.
 *
 * @param {string} value - Value to parse.
 * @param {boolean?} [isBlock] - Whether the tag-name
 *   must be a known block-level node to match.
 * @return {string?} - When applicable, the opening tag at
 *   the start of `value`.
 */
function eatHTMLOpeningTag(value, isBlock) {
    var index = 0;
    var length = value.length;
    var queue = EMPTY;
    var subqueue = EMPTY;
    var character = value.charAt(index);
    var hasEquals;
    var test;

    if (character === C_LT) {
        queue = character;
        subqueue = character = value.charAt(++index);

        if (!isAlphabetic(character)) {
            return;
        }

        index++;

        /*
         * Eat as many alphabetic characters as
         * possible.
         */

        while (index < length) {
            character = value.charAt(index);

            if (!isAlphabetic(character) && !isNumeric(character)) {
                break;
            }

            subqueue += character;
            index++;
        }

        if (isBlock && blockElements.indexOf(subqueue.toLowerCase()) === -1) {
            return;
        }

        queue += subqueue;
        subqueue = EMPTY;

        /*
         * Find attributes.
         */

        while (index < length) {
            /*
             * Eat white-space.
             */

            while (index < length) {
                character = value.charAt(index);

                if (!isWhiteSpace(character)) {
                    break;
                }

                subqueue += character;
                index++;
            }

            if (!subqueue) {
                break;
            }

            /*
             * Eat an attribute name.
             */

            queue += subqueue;
            subqueue = EMPTY;
            character = value.charAt(index);

            if (
                isAlphabetic(character) ||
                character === C_UNDERSCORE ||
                character === C_COLON
            ) {
                subqueue = character;
                index++;

                while (index < length) {
                    character = value.charAt(index);

                    if (
                        !isAlphabetic(character) &&
                        !isNumeric(character) &&
                        character !== C_UNDERSCORE &&
                        character !== C_COLON &&
                        character !== C_DOT &&
                        character !== C_DASH
                    ) {
                        break;
                    }

                    subqueue += character;
                    index++;
                }
            }

            if (!subqueue) {
                break;
            }

            queue += subqueue;
            subqueue = EMPTY;
            hasEquals = false;

            /*
             * Eat zero or more white-space and one
             * equals sign.
             */

            while (index < length) {
                character = value.charAt(index);

                if (!isWhiteSpace(character)) {
                    if (!hasEquals && character === C_EQUALS) {
                        hasEquals = true;
                    } else {
                        break;
                    }
                }

                subqueue += character;
                index++;
            }

            queue += subqueue;
            subqueue = EMPTY;

            if (!hasEquals) {
                queue += subqueue;
            } else {
                character = value.charAt(index);
                queue += subqueue;

                if (character === C_DOUBLE_QUOTE) {
                    test = isDoubleQuotedAttributeCharacter;
                    subqueue = character;
                    index++;
                } else if (character === C_SINGLE_QUOTE) {
                    test = isSingleQuotedAttributeCharacter;
                    subqueue = character;
                    index++;
                } else {
                    test = isUnquotedAttributeCharacter;
                    subqueue = EMPTY;
                }

                while (index < length) {
                    character = value.charAt(index);

                    if (!test(character)) {
                        break;
                    }

                    subqueue += character;
                    index++;
                }

                character = value.charAt(index);
                index++;

                if (!test.delimiter) {
                    if (!subqueue.length) {
                        return;
                    }

                    index--;
                } else if (character === test.delimiter) {
                    subqueue += character;
                } else {
                    return;
                }

                queue += subqueue;
                subqueue = EMPTY;
            }
        }

        /*
         * More white-space is already eaten by the
         * attributes subroutine.
         */

        character = value.charAt(index);

        /*
         * Eat an optional backslash (for self-closing
         * tags).
         */

        if (character === C_SLASH) {
            queue += character;
            character = value.charAt(++index);
        }

        return character === C_GT ? queue + character : null;
    }
}

/**
 * Tokenise HTML.
 *
 * @example
 *   tokenizeBlockHTML(eat, '<span>foo</span>');
 *
 * @param {function(string)} eat - Eater.
 * @param {string} value - Rest of content.
 * @param {boolean?} [silent] - Whether this is a dry run.
 * @return {Node?|boolean} - `html` node.
 */
function tokenizeBlockHTML(eat, value, silent) {
    var self = this;
    var index = 0;
    var length = value.length;
    var subvalue = EMPTY;
    var offset;
    var lineCount;
    var character;
    var queue;

    /*
     * Eat initial spacing.
     */

    while (index < length) {
        character = value.charAt(index);

        if (character !== C_TAB && character !== C_SPACE) {
            break;
        }

        subvalue += character;
        index++;
    }

    offset = index;
    value = value.slice(offset);

    /*
     * Try to eat an HTML thing.
     */

    queue = eatHTMLComment(value, self.options) ||
        eatHTMLCDATA(value) ||
        eatHTMLProcessingInstruction(value) ||
        eatHTMLDeclaration(value) ||
        eatHTMLClosingTag(value, true) ||
        eatHTMLOpeningTag(value, true);

    if (!queue) {
        return;
    }

    if (silent) {
        return true;
    }

    subvalue += queue;
    index = subvalue.length - offset;
    queue = EMPTY;

    while (index < length) {
        character = value.charAt(index);

        if (character === C_NEWLINE) {
            queue += character;
            lineCount++;
        } else if (queue.length < MIN_CLOSING_HTML_NEWLINE_COUNT) {
            subvalue += queue + character;
            queue = EMPTY;
        } else {
            break;
        }

        index++;
    }

    return eat(subvalue)(self.renderRaw(T_HTML, subvalue));
}

/**
 * Tokenise a definition.
 *
 * @example
 *   var value = '[foo]: http://example.com "Example Domain"';
 *   tokenizeDefinition(eat, value);
 *
 * @property {boolean} notInList
 * @property {boolean} notInBlock
 * @param {function(string)} eat - Eater.
 * @param {string} value - Rest of content.
 * @param {boolean?} [silent] - Whether this is a dry run.
 * @return {Node?|boolean} - `definition` node.
 */
function tokenizeDefinition(eat, value, silent) {
    var self = this;
    var commonmark = self.options.commonmark;
    var index = 0;
    var length = value.length;
    var subvalue = EMPTY;
    var beforeURL;
    var beforeTitle;
    var queue;
    var character;
    var test;
    var identifier;
    var url;
    var title;

    while (index < length) {
        character = value.charAt(index);

        if (character !== C_SPACE && character !== C_TAB) {
            break;
        }

        subvalue += character;
        index++;
    }

    character = value.charAt(index);

    if (character !== C_BRACKET_OPEN) {
        return;
    }

    index++;
    subvalue += character;
    queue = EMPTY;

    while (index < length) {
        character = value.charAt(index);

        if (character === C_BRACKET_CLOSE) {
            break;
        } else if (character === C_BACKSLASH) {
            queue += character;
            index++;
            character = value.charAt(index);
        }

        queue += character;
        index++;
    }

    if (
        !queue ||
        value.charAt(index) !== C_BRACKET_CLOSE ||
        value.charAt(index + 1) !== C_COLON
    ) {
        return;
    }

    identifier = queue;
    subvalue += queue + C_BRACKET_CLOSE + C_COLON;
    index = subvalue.length;
    queue = EMPTY;

    while (index < length) {
        character = value.charAt(index);

        if (
            character !== C_TAB &&
            character !== C_SPACE &&
            character !== C_NEWLINE
        ) {
            break;
        }

        subvalue += character;
        index++;
    }

    character = value.charAt(index);
    queue = EMPTY;
    beforeURL = subvalue;

    if (character === C_LT) {
        index++;

        while (index < length) {
            character = value.charAt(index);

            if (!isEnclosedURLCharacter(character)) {
                break;
            }

            queue += character;
            index++;
        }

        character = value.charAt(index);

        if (character !== isEnclosedURLCharacter.delimiter) {
            if (commonmark) {
                return;
            }

            index -= queue.length + 1;
            queue = EMPTY;
        } else {
            subvalue += C_LT + queue + character;
            index++;
        }
    }

    if (!queue) {
        while (index < length) {
            character = value.charAt(index);

            if (!isUnclosedURLCharacter(character)) {
                break;
            }

            queue += character;
            index++;
        }

        subvalue += queue;
    }

    if (!queue) {
        return;
    }

    url = queue;
    queue = EMPTY;

    while (index < length) {
        character = value.charAt(index);

        if (
            character !== C_TAB &&
            character !== C_SPACE &&
            character !== C_NEWLINE
        ) {
            break;
        }

        queue += character;
        index++;
    }

    character = value.charAt(index);
    test = null;

    if (character === C_DOUBLE_QUOTE) {
        test = C_DOUBLE_QUOTE;
    } else if (character === C_SINGLE_QUOTE) {
        test = C_SINGLE_QUOTE;
    } else if (character === C_PAREN_OPEN) {
        test = C_PAREN_CLOSE;
    }

    if (!test) {
        queue = EMPTY;
        index = subvalue.length;
    } else if (!queue) {
        return;
    } else {
        subvalue += queue + character;
        index = subvalue.length;
        queue = EMPTY;

        while (index < length) {
            character = value.charAt(index);

            if (character === test) {
                break;
            }

            if (character === C_NEWLINE) {
                index++;
                character = value.charAt(index);

                if (character === C_NEWLINE || character === test) {
                    return;
                }

                queue += C_NEWLINE;
            }

            queue += character;
            index++;
        }

        character = value.charAt(index);

        if (character !== test) {
            return;
        }

        beforeTitle = subvalue;
        subvalue += queue + character;
        index++;
        title = queue;
        queue = EMPTY;
    }

    while (index < length) {
        character = value.charAt(index);

        if (character !== C_TAB && character !== C_SPACE) {
            break;
        }

        subvalue += character;
        index++;
    }

    character = value.charAt(index);

    if (!character || character === C_NEWLINE) {
        if (silent) {
            return true;
        }

        beforeURL = eat(beforeURL).test().end;
        url = self.decode.raw(self.descape(url), beforeURL);

        if (title) {
            beforeTitle = eat(beforeTitle).test().end;
            title = self.decode.raw(self.descape(title), beforeTitle);
        }

        return eat(subvalue)({
            'type': T_DEFINITION,
            'identifier': normalize(identifier),
            'title': title || null,
            'url': url
        });
    }
}

tokenizeDefinition.notInList = true;
tokenizeDefinition.notInBlock = true;

/**
 * Tokenise YAML front matter.
 *
 * @example
 *   tokenizeYAMLFrontMatter(eat, '---\nfoo: bar\n---');
 *
 * @property {boolean} onlyAtStart
 * @param {function(string)} eat - Eater.
 * @param {string} value - Rest of content.
 * @param {boolean?} [silent] - Whether this is a dry run.
 * @return {Node?|boolean} - `yaml` node.
 */
function tokenizeYAMLFrontMatter(eat, value, silent) {
    var self = this;
    var subvalue;
    var content;
    var index;
    var length;
    var character;
    var queue;

    if (
        !self.options.yaml ||
        value.charAt(0) !== C_DASH ||
        value.charAt(1) !== C_DASH ||
        value.charAt(2) !== C_DASH ||
        value.charAt(3) !== C_NEWLINE
    ) {
        return;
    }

    subvalue = YAML_FENCE + C_NEWLINE;
    content = queue = EMPTY;
    index = 3;
    length = value.length;

    while (++index < length) {
        character = value.charAt(index);

        if (
            character === C_DASH &&
            (queue || !content) &&
            value.charAt(index + 1) === C_DASH &&
            value.charAt(index + 2) === C_DASH
        ) {
            /* istanbul ignore if - never used (yet) */
            if (silent) {
                return true;
            }

            subvalue += queue + YAML_FENCE;

            return eat(subvalue)(self.renderRaw(T_YAML, content));
        }

        if (character === C_NEWLINE) {
            queue += character;
        } else {
            subvalue += queue + character;
            content += queue + character;
            queue = EMPTY;
        }
    }
}

tokenizeYAMLFrontMatter.onlyAtStart = true;

/**
 * Tokenise a footnote definition.
 *
 * @example
 *   tokenizeFootnoteDefinition(eat, '[^foo]: Bar.');
 *
 * @property {boolean} notInList
 * @property {boolean} notInBlock
 * @param {function(string)} eat - Eater.
 * @param {string} value - Rest of content.
 * @param {boolean?} [silent] - Whether this is a dry run.
 * @return {Node?|boolean} - `footnoteDefinition` node.
 */
function tokenizeFootnoteDefinition(eat, value, silent) {
    var self = this;
    var index;
    var length;
    var subvalue;
    var now;
    var indent;
    var content;
    var queue;
    var subqueue;
    var character;
    var identifier;

    if (!self.options.footnotes) {
        return;
    }

    index = 0;
    length = value.length;
    subvalue = EMPTY;
    now = eat.now();
    indent = self.indent(now.line);

    while (index < length) {
        character = value.charAt(index);

        if (!isWhiteSpace(character)) {
            break;
        }

        subvalue += character;
        index++;
    }

    if (
        value.charAt(index) !== C_BRACKET_OPEN ||
        value.charAt(index + 1) !== C_CARET
    ) {
        return;
    }

    subvalue += C_BRACKET_OPEN + C_CARET;
    index = subvalue.length;
    queue = EMPTY;

    while (index < length) {
        character = value.charAt(index);

        if (character === C_BRACKET_CLOSE) {
            break;
        } else if (character === C_BACKSLASH) {
            queue += character;
            index++;
            character = value.charAt(index);
        }

        queue += character;
        index++;
    }

    if (
        !queue ||
        value.charAt(index) !== C_BRACKET_CLOSE ||
        value.charAt(index + 1) !== C_COLON
    ) {
        return;
    }

    if (silent) {
        return true;
    }

    identifier = normalize(queue);
    subvalue += queue + C_BRACKET_CLOSE + C_COLON;
    index = subvalue.length;

    while (index < length) {
        character = value.charAt(index);

        if (
            character !== C_TAB &&
            character !== C_SPACE
        ) {
            break;
        }

        subvalue += character;
        index++;
    }

    now.column += subvalue.length;
    now.offset += subvalue.length;
    queue = content = subqueue = EMPTY;

    while (index < length) {
        character = value.charAt(index);

        if (character === C_NEWLINE) {
            subqueue = character;
            index++;

            while (index < length) {
                character = value.charAt(index);

                if (character !== C_NEWLINE) {
                    break;
                }

                subqueue += character;
                index++;
            }

            queue += subqueue;
            subqueue = EMPTY;

            while (index < length) {
                character = value.charAt(index);

                if (character !== C_SPACE) {
                    break;
                }

                subqueue += character;
                index++;
            }

            if (!subqueue.length) {
                break;
            }

            queue += subqueue;
        }

        if (queue) {
            content += queue;
            queue = EMPTY;
        }

        content += character;
        index++;
    }

    subvalue += content;

    content = content.replace(EXPRESSION_INITIAL_TAB, function (line) {
        indent(line.length);

        return EMPTY;
    });

    return eat(subvalue)(
        self.renderFootnoteDefinition(identifier, content, now)
    );
}

tokenizeFootnoteDefinition.notInList = true;
tokenizeFootnoteDefinition.notInBlock = true;

/**
 * Tokenise a table.
 *
 * @example
 *   tokenizeTable(eat, ' | foo |\n | --- |\n | bar |');
 *
 * @property {boolean} notInList
 * @param {function(string)} eat - Eater.
 * @param {string} value - Rest of content.
 * @param {boolean?} [silent] - Whether this is a dry run.
 * @return {Node?|boolean} - `table` node.
 */
function tokenizeTable(eat, value, silent) {
    var self = this;
    var index;
    var alignments;
    var alignment;
    var subvalue;
    var row;
    var length;
    var lines;
    var queue;
    var character;
    var hasDash;
    var align;
    var cell;
    var preamble;
    var count;
    var opening;
    var now;
    var position;
    var lineCount;
    var line;
    var rows;
    var table;
    var lineIndex;
    var pipeIndex;
    var first;

    /*
     * Exit when not in gfm-mode.
     */

    if (!self.options.gfm) {
        return;
    }

    /*
     * Get the rows.
     * Detecting tables soon is hard, so there are some
     * checks for performance here, such as the minimum
     * number of rows, and allowed characters in the
     * alignment row.
     */

    index = lineCount = 0;
    length = value.length + 1;
    lines = [];

    while (index < length) {
        lineIndex = value.indexOf(C_NEWLINE, index);
        pipeIndex = value.indexOf(C_PIPE, index + 1);

        if (lineIndex === -1) {
            lineIndex = value.length;
        }

        if (
            pipeIndex === -1 ||
            pipeIndex > lineIndex
        ) {
            if (lineCount < MIN_TABLE_ROWS) {
                return;
            }

            break;
        }

        lines.push(value.slice(index, lineIndex));
        lineCount++;
        index = lineIndex + 1;
    }

    /*
     * Parse the alignment row.
     */

    subvalue = lines.join(C_NEWLINE);
    alignments = lines.splice(1, 1)[0] || [];
    index = 0;
    length = alignments.length;
    lineCount--;
    alignment = false;
    align = [];

    while (index < length) {
        character = alignments.charAt(index);

        if (character === C_PIPE) {
            hasDash = null;

            if (alignment === false) {
                if (first === false) {
                    return;
                }
            } else {
                align.push(alignment);
                alignment = false;
            }

            first = false;
        } else if (character === C_DASH) {
            hasDash = true;
            alignment = alignment || TABLE_ALIGN_NONE;
        } else if (character === C_COLON) {
            if (alignment === TABLE_ALIGN_LEFT) {
                alignment = TABLE_ALIGN_CENTER;
            } else if (hasDash && alignment === TABLE_ALIGN_NONE) {
                alignment = TABLE_ALIGN_RIGHT;
            } else {
                alignment = TABLE_ALIGN_LEFT;
            }
        } else if (!isWhiteSpace(character)) {
            return;
        }

        index++;
    }

    if (alignment !== false) {
        align.push(alignment);
    }

    /*
     * Exit when without enough columns.
     */

    if (align.length < MIN_TABLE_COLUMNS) {
        return;
    }

    /* istanbul ignore if - never used (yet) */
    if (silent) {
        return true;
    }

    /*
     * Parse the rows.
     */

    position = -1;
    rows = [];

    table = eat(subvalue).reset({
        'type': T_TABLE,
        'align': align,
        'children': rows
    });

    while (++position < lineCount) {
        line = lines[position];
        row = self.renderParent(position ? T_TABLE_ROW : T_TABLE_HEADER, []);

        /*
         * Eat a newline character when this is not the
         * first row.
         */

        if (position) {
            eat(C_NEWLINE);
        }

        /*
         * Eat the row.
         */

        eat(line).reset(row, table);

        length = line.length + 1;
        index = 0;
        queue = EMPTY;
        cell = EMPTY;
        preamble = true;
        count = opening = null;

        while (index < length) {
            character = line.charAt(index);

            if (character === C_TAB || character === C_SPACE) {
                if (cell) {
                    queue += character;
                } else {
                    eat(character);
                }

                index++;
                continue;
            }

            if (character === EMPTY || character === C_PIPE) {
                if (preamble) {
                    eat(character);
                } else {
                    if (character && opening) {
                        queue += character;
                        index++;
                        continue;
                    }

                    if ((cell || character) && !preamble) {
                        subvalue = cell;

                        if (queue.length > 1) {
                            if (character) {
                                subvalue += queue.slice(0, queue.length - 1);
                                queue = queue.charAt(queue.length - 1);
                            } else {
                                subvalue += queue;
                                queue = EMPTY;
                            }
                        }

                        now = eat.now();

                        eat(subvalue)(
                            self.renderInline(T_TABLE_CELL, cell, now), row
                        );
                    }

                    eat(queue + character);

                    queue = EMPTY;
                    cell = EMPTY;
                }
            } else {
                if (queue) {
                    cell += queue;
                    queue = EMPTY;
                }

                cell += character;

                if (character === C_BACKSLASH && index !== length - 2) {
                    cell += line.charAt(index + 1);
                    index++;
                }

                if (character === C_TICK) {
                    count = 1;

                    while (line.charAt(index + 1) === character) {
                        cell += character;
                        index++;
                        count++;
                    }

                    if (!opening) {
                        opening = count;
                    } else if (count >= opening) {
                        opening = 0;
                    }
                }
            }

            preamble = false;
            index++;
        }

        /*
         * Eat the alignment row.
         */

        if (!position) {
            eat(C_NEWLINE + alignments);
        }
    }

    return table;
}

tokenizeTable.notInList = true;

/**
 * Tokenise a paragraph node.
 *
 * @example
 *   tokenizeParagraph(eat, 'Foo.');
 *
 * @param {function(string)} eat - Eater.
 * @param {string} value - Rest of content.
 * @param {boolean?} [silent] - Whether this is a dry run.
 * @return {Node?|boolean} - `paragraph` node.
 */
function tokenizeParagraph(eat, value, silent) {
    var self = this;
    var settings = self.options;
    var commonmark = settings.commonmark;
    var gfm = settings.gfm;
    var tokenizers = self.blockTokenizers;
    var index = value.indexOf(C_NEWLINE);
    var length = value.length;
    var position;
    var subvalue;
    var character;
    var size;
    var now;

    while (index < length) {
        /*
         * Eat everything if there’s no following newline.
         */

        if (index === -1) {
            index = length;
            break;
        }

        /*
         * Stop if the next character is NEWLINE.
         */

        if (value.charAt(index + 1) === C_NEWLINE) {
            break;
        }

        /*
         * In commonmark-mode, following indented lines
         * are part of the paragraph.
         */

        if (commonmark) {
            size = 0;
            position = index + 1;

            while (position < length) {
                character = value.charAt(position);

                if (character === C_TAB) {
                    size = TAB_SIZE;
                    break;
                } else if (character === C_SPACE) {
                    size++;
                } else {
                    break;
                }

                position++;
            }

            if (size >= TAB_SIZE) {
                index = value.indexOf(C_NEWLINE, index + 1);
                continue;
            }
        }

        /*
         * Check if the following code contains a possible
         * block.
         */

        subvalue = value.slice(index + 1);

        if (
            tokenizers.thematicBreak.call(self, eat, subvalue, true) ||
            tokenizers.atxHeading.call(self, eat, subvalue, true) ||
            tokenizers.fencedCode.call(self, eat, subvalue, true) ||
            tokenizers.blockquote.call(self, eat, subvalue, true) ||
            tokenizers.html.call(self, eat, subvalue, true)
        ) {
            break;
        }

        /*
         * Break if the following line starts a list, when
         * already in a list, or when in commonmark, or when
         * in gfm mode and the bullet is *not* numeric.
         */

        if (
            tokenizers.list.call(self, eat, subvalue, true) &&
            (
                self.inList ||
                commonmark ||
                (gfm && !isNumeric(trim.left(subvalue).charAt(0)))
            )
        ) {
            break;
        }

        if (
            !commonmark &&
            (
                tokenizers.setextHeading.call(self, eat, subvalue, true) ||
                tokenizers.definition.call(self, eat, subvalue, true) ||
                tokenizers.footnote.call(self, eat, subvalue, true)
            )
        ) {
            break;
        }

        position = index;
        index = value.indexOf(C_NEWLINE, index + 1);

        if (index !== -1 && trim(value.slice(position, index)) === EMPTY) {
            index = position;
            break;
        }
    }

    subvalue = value.slice(0, index);

    if (trim(subvalue) === EMPTY) {
        eat(subvalue);

        return null;
    }

    /* istanbul ignore if - never used (yet) */
    if (silent) {
        return true;
    }

    now = eat.now();
    subvalue = trimTrailingLines(subvalue);

    return eat(subvalue)(self.renderInline(T_PARAGRAPH, subvalue, now));
}

/**
 * Tokenise a text node.
 *
 * @example
 *   tokenizeText(eat, 'foo');
 *
 * @param {function(string)} eat - Eater.
 * @param {string} value - Rest of content.
 * @param {boolean?} [silent] - Whether this is a dry run.
 * @return {Node?|boolean} - `text` node.
 */
function tokenizeText(eat, value, silent) {
    var self = this;
    var methods;
    var tokenizers;
    var index;
    var length;
    var subvalue;
    var position;
    var tokenizer;
    var name;
    var min;
    var now;

    /* istanbul ignore if - never used (yet) */
    if (silent) {
        return true;
    }

    methods = self.inlineMethods;
    length = methods.length;
    tokenizers = self.inlineTokenizers;
    index = -1;
    min = value.length;

    while (++index < length) {
        name = methods[index];

        if (name === 'text' || !tokenizers[name]) {
            continue;
        }

        tokenizer = tokenizers[name].locator;

        if (!tokenizer) {
            eat.file.fail(ERR_MISSING_LOCATOR + C_TICK + name + C_TICK);
            continue;
        }

        position = tokenizer.call(self, value, 1);

        if (position !== -1 && position < min) {
            min = position;
        }
    }

    subvalue = value.slice(0, min);
    now = eat.now();

    self.decode(subvalue, now, function (content, position, source) {
        eat(source || content)(self.renderRaw(T_TEXT, content));
    });
}

/**
 * Create a code-block node.
 *
 * @example
 *   renderCodeBlock('foo()', 'js', now());
 *
 * @param {string?} [value] - Code.
 * @param {string?} [language] - Optional language flag.
 * @param {Function} eat - Eater.
 * @return {Object} - `code` node.
 */
function renderCodeBlock(value, language) {
    return {
        'type': T_CODE,
        'lang': language || null,
        'value': trimTrailingLines(value || EMPTY)
    };
}

/**
 * Create a list-item using overly simple mechanics.
 *
 * @example
 *   renderPedanticListItem('- _foo_', now());
 *
 * @param {string} value - List-item.
 * @param {Object} position - List-item location.
 * @return {string} - Cleaned `value`.
 */
function renderPedanticListItem(value, position) {
    var self = this;
    var indent = self.indent(position.line);

    /**
     * A simple replacer which removed all matches,
     * and adds their length to `offset`.
     *
     * @param {string} $0 - Indentation to subtract.
     * @return {string} - An empty string.
     */
    function replacer($0) {
        indent($0.length);

        return EMPTY;
    }

    /*
     * Remove the list-item’s bullet.
     */

    value = value.replace(EXPRESSION_PEDANTIC_BULLET, replacer);

    /*
     * The initial line was also matched by the below, so
     * we reset the `line`.
     */

    indent = self.indent(position.line);

    return value.replace(EXPRESSION_INITIAL_INDENT, replacer);
}

/**
 * Create a list-item using sane mechanics.
 *
 * @example
 *   renderNormalListItem('- _foo_', now());
 *
 * @param {string} value - List-item.
 * @param {Object} position - List-item location.
 * @return {string} - Cleaned `value`.
 */
function renderNormalListItem(value, position) {
    var self = this;
    var indent = self.indent(position.line);
    var max;
    var bullet;
    var rest;
    var lines;
    var trimmedLines;
    var index;
    var length;

    /*
     * Remove the list-item’s bullet.
     */

    value = value.replace(EXPRESSION_BULLET, function ($0, $1, $2, $3, $4) {
        bullet = $1 + $2 + $3;
        rest = $4;

        /*
         * Make sure that the first nine numbered list items
         * can indent with an extra space.  That is, when
         * the bullet did not receive an extra final space.
         */

        if (Number($2) < 10 && bullet.length % 2 === 1) {
            $2 = C_SPACE + $2;
        }

        max = $1 + repeat(C_SPACE, $2.length) + $3;

        return max + rest;
    });

    lines = value.split(C_NEWLINE);

    trimmedLines = removeIndentation(
        value, getIndent(max).indent
    ).split(C_NEWLINE);

    /*
     * We replaced the initial bullet with something
     * else above, which was used to trick
     * `removeIndentation` into removing some more
     * characters when possible. However, that could
     * result in the initial line to be stripped more
     * than it should be.
     */

    trimmedLines[0] = rest;

    indent(bullet.length);

    index = 0;
    length = lines.length;

    while (++index < length) {
        indent(lines[index].length - trimmedLines[index].length);
    }

    return trimmedLines.join(C_NEWLINE);
}

/**
 * Create a list-item node.
 *
 * @example
 *   renderListItem('- _foo_', now());
 *
 * @param {Object} value - List-item.
 * @param {Object} position - List-item location.
 * @return {Object} - `listItem` node.
 */
function renderListItem(value, position) {
    var self = this;
    var checked = null;
    var node;
    var task;
    var indent;

    value = LIST_ITEM_MAP[self.options.pedantic].apply(self, arguments);

    if (self.options.gfm) {
        task = value.match(EXPRESSION_TASK_ITEM);

        if (task) {
            indent = task[0].length;
            checked = task[1].toLowerCase() === C_X_LOWER;

            self.indent(position.line)(indent);
            value = value.slice(indent);
        }
    }

    node = {
        'type': T_LIST_ITEM,
        'loose': EXPRESSION_LOOSE_LIST_ITEM.test(value) ||
            value.charAt(value.length - 1) === C_NEWLINE,
        'checked': checked
    };

    node.children = self.tokenizeBlock(value, position);

    return node;
}

/**
 * Create a footnote-definition node.
 *
 * @example
 *   renderFootnoteDefinition('1', '_foo_', now());
 *
 * @param {string} identifier - Unique reference.
 * @param {string} value - Contents
 * @param {Object} position - Definition location.
 * @return {Object} - `footnoteDefinition` node.
 */
function renderFootnoteDefinition(identifier, value, position) {
    var self = this;
    var exitBlockquote = self.enterBlock();
    var node;

    node = {
        'type': T_FOOTNOTE_DEFINITION,
        'identifier': identifier,
        'children': self.tokenizeBlock(value, position)
    };

    exitBlockquote();

    return node;
}

/**
 * Create a heading node.
 *
 * @example
 *   renderHeading('_foo_', 1, now());
 *
 * @param {string} value - Content.
 * @param {number} depth - Heading depth.
 * @param {Object} position - Heading content location.
 * @return {Object} - `heading` node
 */
function renderHeading(value, depth, position) {
    return {
        'type': T_HEADING,
        'depth': depth,
        'children': this.tokenizeInline(value, position)
    };
}

/**
 * Create a blockquote node.
 *
 * @example
 *   renderBlockquote('_foo_', eat);
 *
 * @param {string} value - Content.
 * @param {Object} now - Position.
 * @return {Object} - `blockquote` node.
 */
function renderBlockquote(value, now) {
    var self = this;
    var exitBlockquote = self.enterBlock();
    var node = {
        'type': T_BLOCKQUOTE,
        'children': self.tokenizeBlock(value, now)
    };

    exitBlockquote();

    return node;
}

/**
 * Create a void node.
 *
 * @example
 *   renderVoid('thematicBreak');
 *
 * @param {string} type - Node type.
 * @return {Object} - Node of type `type`.
 */
function renderVoid(type) {
    return {
        'type': type
    };
}

/**
 * Create a parent.
 *
 * @example
 *   renderParent('paragraph', '_foo_');
 *
 * @param {string} type - Node type.
 * @param {Array.<Object>} children - Child nodes.
 * @return {Object} - Node of type `type`.
 */
function renderParent(type, children) {
    return {
        'type': type,
        'children': children
    };
}

/**
 * Create a raw node.
 *
 * @example
 *   renderRaw('inlineCode', 'foo()');
 *
 * @param {string} type - Node type.
 * @param {string} value - Contents.
 * @return {Object} - Node of type `type`.
 */
function renderRaw(type, value) {
    return {
        'type': type,
        'value': value
    };
}

/**
 * Create a link node.
 *
 * @example
 *   renderLink(true, 'example.com', 'example', 'Example Domain', now(), eat);
 *   renderLink(false, 'fav.ico', 'example', 'Example Domain', now(), eat);
 *
 * @param {boolean} isLink - Whether linking to a document
 *   or an image.
 * @param {string} url - URI reference.
 * @param {string} content - Content.
 * @param {string?} title - Title.
 * @param {Object} position - Location of link.
 * @return {Object} - `link` or `image` node.
 */
function renderLink(isLink, url, content, title, position) {
    var self = this;
    var exitLink = self.enterLink();
    var node;

    node = {
        'type': isLink ? T_LINK : T_IMAGE,
        'title': title || null
    };

    if (isLink) {
        node.url = url;
        node.children = self.tokenizeInline(content, position);
    } else {
        node.url = url;
        node.alt = content ?
            self.decode.raw(self.descape(content), position) :
            null;
    }

    exitLink();

    return node;
}

/**
 * Create a footnote node.
 *
 * @example
 *   renderFootnote('_foo_', now());
 *
 * @param {string} value - Contents.
 * @param {Object} position - Location of footnote.
 * @return {Object} - `footnote` node.
 */
function renderFootnote(value, position) {
    return this.renderInline(T_FOOTNOTE, value, position);
}

/**
 * Add a node with inline content.
 *
 * @example
 *   renderInline('strong', '_foo_', now());
 *
 * @param {string} type - Node type.
 * @param {string} value - Contents.
 * @param {Object} position - Location of node.
 * @return {Object} - Node of type `type`.
 */
function renderInline(type, value, position) {
    return this.renderParent(type, this.tokenizeInline(value, position));
}

/**
 * Add a node with block content.
 *
 * @example
 *   renderBlock('blockquote', 'Foo.', now());
 *
 * @param {string} type - Node type.
 * @param {string} value - Contents.
 * @param {Object} position - Location of node.
 * @return {Object} - Node of type `type`.
 */
function renderBlock(type, value, position) {
    return this.renderParent(type, this.tokenizeBlock(value, position));
}

/**
 * Find a possible escape sequence.
 *
 * @example
 *   locateEscape('foo \- bar'); // 4
 *
 * @param {string} value - Value to search.
 * @param {number} fromIndex - Index to start searching at.
 * @return {number} - Location of possible escape sequence.
 */
function locateEscape(value, fromIndex) {
    return value.indexOf(C_BACKSLASH, fromIndex);
}

/**
 * Tokenise an escape sequence.
 *
 * @example
 *   tokenizeEscape(eat, '\\a');
 *
 * @property {Function} locator - Escape locator.
 * @param {function(string)} eat - Eater.
 * @param {string} value - Rest of content.
 * @param {boolean?} [silent] - Whether this is a dry run.
 * @return {Node?|boolean} - `text` or `break` node.
 */
function tokenizeEscape(eat, value, silent) {
    var self = this;
    var character;

    if (value.charAt(0) === C_BACKSLASH) {
        character = value.charAt(1);

        if (self.escape.indexOf(character) !== -1) {
            /* istanbul ignore if - never used (yet) */
            if (silent) {
                return true;
            }

            return eat(C_BACKSLASH + character)(
                character === C_NEWLINE ?
                    self.renderVoid(T_BREAK) :
                    self.renderRaw(T_TEXT, character)
            );
        }
    }
}

tokenizeEscape.locator = locateEscape;

/**
 * Find a possible auto-link.
 *
 * @example
 *   locateAutoLink('foo <bar'); // 4
 *
 * @param {string} value - Value to search.
 * @param {number} fromIndex - Index to start searching at.
 * @return {number} - Location of possible auto-link.
 */
function locateAutoLink(value, fromIndex) {
    return value.indexOf(C_LT, fromIndex);
}

/**
 * Tokenise a URL in carets.
 *
 * @example
 *   tokenizeAutoLink(eat, '<http://foo.bar>');
 *
 * @property {boolean} notInLink
 * @property {Function} locator - Auto-link locator.
 * @param {function(string)} eat - Eater.
 * @param {string} value - Rest of content.
 * @param {boolean?} [silent] - Whether this is a dry run.
 * @return {Node?|boolean} - `link` node.
 */
function tokenizeAutoLink(eat, value, silent) {
    var self;
    var subvalue;
    var length;
    var index;
    var queue;
    var character;
    var hasAtCharacter;
    var link;
    var now;
    var content;
    var tokenize;
    var node;

    if (value.charAt(0) !== C_LT) {
        return;
    }

    self = this;
    subvalue = EMPTY;
    length = value.length;
    index = 0;
    queue = EMPTY;
    hasAtCharacter = false;
    link = EMPTY;

    index++;
    subvalue = C_LT;

    while (index < length) {
        character = value.charAt(index);

        if (
            character === C_SPACE ||
            character === C_GT ||
            character === C_AT_SIGN ||
            (character === C_COLON && value.charAt(index + 1) === C_SLASH)
        ) {
            break;
        }

        queue += character;
        index++;
    }

    if (!queue) {
        return;
    }

    link += queue;
    queue = EMPTY;

    character = value.charAt(index);
    link += character;
    index++;

    if (character === C_AT_SIGN) {
        hasAtCharacter = true;
    } else {
        if (
            character !== C_COLON ||
            value.charAt(index + 1) !== C_SLASH
        ) {
            return;
        }

        link += C_SLASH;
        index++;
    }

    while (index < length) {
        character = value.charAt(index);

        if (character === C_SPACE || character === C_GT) {
            break;
        }

        queue += character;
        index++;
    }

    character = value.charAt(index);

    if (!queue || character !== C_GT) {
        return;
    }

    /* istanbul ignore if - never used (yet) */
    if (silent) {
        return true;
    }

    link += queue;
    content = link;
    subvalue += link + character;
    now = eat.now();
    now.column++;
    now.offset++;

    if (hasAtCharacter) {
        if (
            link.substr(0, MAILTO_PROTOCOL.length).toLowerCase() !==
            MAILTO_PROTOCOL
        ) {
            link = MAILTO_PROTOCOL + link;
        } else {
            content = content.substr(MAILTO_PROTOCOL.length);
            now.column += MAILTO_PROTOCOL.length;
            now.offset += MAILTO_PROTOCOL.length;
        }
    }

    /*
     * Temporarily remove support for escapes in autolinks.
     */

    tokenize = self.inlineTokenizers.escape;
    self.inlineTokenizers.escape = null;

    node = eat(subvalue)(
        self.renderLink(true, decode(link), content, null, now, eat)
    );

    self.inlineTokenizers.escape = tokenize;

    return node;
}

tokenizeAutoLink.notInLink = true;
tokenizeAutoLink.locator = locateAutoLink;

/**
 * Find a possible URL.
 *
 * @example
 *   locateURL('foo http://bar'); // 4
 *
 * @param {string} value - Value to search.
 * @param {number} fromIndex - Index to start searching at.
 * @return {number} - Location of possible URL.
 */
function locateURL(value, fromIndex) {
    var index = -1;
    var min = -1;
    var position;

    if (!this.options.gfm) {
        return -1;
    }

    while (++index < PROTOCOLS_LENGTH) {
        position = value.indexOf(PROTOCOLS[index], fromIndex);

        if (position !== -1 && (position < min || min === -1)) {
            min = position;
        }
    }

    return min;
}

/**
 * Tokenise a URL in text.
 *
 * @example
 *   tokenizeURL(eat, 'http://foo.bar');
 *
 * @property {boolean} notInLink
 * @property {Function} locator - URL locator.
 * @param {function(string)} eat - Eater.
 * @param {string} value - Rest of content.
 * @param {boolean?} [silent] - Whether this is a dry run.
 * @return {Node?|boolean} - `link` node.
 */
function tokenizeURL(eat, value, silent) {
    var self = this;
    var subvalue;
    var content;
    var character;
    var index;
    var position;
    var protocol;
    var match;
    var length;
    var queue;
    var parenCount;
    var nextCharacter;
    var now;

    if (!self.options.gfm) {
        return;
    }

    subvalue = EMPTY;
    index = -1;
    length = PROTOCOLS_LENGTH;

    while (++index < length) {
        protocol = PROTOCOLS[index];
        match = value.slice(0, protocol.length);

        if (match.toLowerCase() === protocol) {
            subvalue = match;
            break;
        }
    }

    if (!subvalue) {
        return;
    }

    index = subvalue.length;
    length = value.length;
    queue = EMPTY;
    parenCount = 0;

    while (index < length) {
        character = value.charAt(index);

        if (isWhiteSpace(character) || character === C_LT) {
            break;
        }

        if (
            character === C_DOT ||
            character === C_COMMA ||
            character === C_COLON ||
            character === C_SEMI_COLON ||
            character === C_DOUBLE_QUOTE ||
            character === C_SINGLE_QUOTE ||
            character === C_PAREN_CLOSE ||
            character === C_BRACKET_CLOSE
        ) {
            nextCharacter = value.charAt(index + 1);

            if (
                !nextCharacter ||
                isWhiteSpace(nextCharacter)
            ) {
                break;
            }
        }

        if (
            character === C_PAREN_OPEN ||
            character === C_BRACKET_OPEN
        ) {
            parenCount++;
        }

        if (
            character === C_PAREN_CLOSE ||
            character === C_BRACKET_CLOSE
        ) {
            parenCount--;

            if (parenCount < 0) {
                break;
            }
        }

        queue += character;
        index++;
    }

    if (!queue) {
        return;
    }

    subvalue += queue;
    content = subvalue;

    if (protocol === MAILTO_PROTOCOL) {
        position = queue.indexOf(C_AT_SIGN);

        if (position === -1 || position === length - 1) {
            return;
        }

        content = content.substr(MAILTO_PROTOCOL.length);
    }

    /* istanbul ignore if - never used (yet) */
    if (silent) {
        return true;
    }

    now = eat.now();

    return eat(subvalue)(
        self.renderLink(true, decode(subvalue), content, null, now, eat)
    );
}

tokenizeURL.notInLink = true;
tokenizeURL.locator = locateURL;

/**
 * Find a possible tag.
 *
 * @example
 *   locateTag('foo <bar'); // 4
 *
 * @param {string} value - Value to search.
 * @param {number} fromIndex - Index to start searching at.
 * @return {number} - Location of possible tag.
 */
function locateTag(value, fromIndex) {
    return value.indexOf(C_LT, fromIndex);
}

/**
 * Tokenise an HTML tag.
 *
 * @example
 *   tokenizeInlineHTML(eat, '<span foo="bar">');
 *
 * @property {Function} locator - Tag locator.
 * @param {function(string)} eat - Eater.
 * @param {string} value - Rest of content.
 * @param {boolean?} [silent] - Whether this is a dry run.
 * @return {Node?|boolean} - `html` node.
 */
function tokenizeInlineHTML(eat, value, silent) {
    var self = this;
    var subvalue = eatHTMLComment(value, self.options) ||
        eatHTMLCDATA(value) ||
        eatHTMLProcessingInstruction(value) ||
        eatHTMLDeclaration(value) ||
        eatHTMLClosingTag(value) ||
        eatHTMLOpeningTag(value);

    if (!subvalue) {
        return;
    }

    /* istanbul ignore if - never used (yet) */
    if (silent) {
        return true;
    }

    if (!self.inLink && EXPRESSION_HTML_LINK_OPEN.test(subvalue)) {
        self.inLink = true;
    } else if (self.inLink && EXPRESSION_HTML_LINK_CLOSE.test(subvalue)) {
        self.inLink = false;
    }

    return eat(subvalue)(self.renderRaw(T_HTML, subvalue));
}

tokenizeInlineHTML.locator = locateTag;

/**
 * Find a possible link.
 *
 * @example
 *   locateLink('foo ![bar'); // 4
 *
 * @param {string} value - Value to search.
 * @param {number} fromIndex - Index to start searching at.
 * @return {number} - Location of possible link.
 */
function locateLink(value, fromIndex) {
    var link = value.indexOf(C_BRACKET_OPEN, fromIndex);
    var image = value.indexOf(C_EXCLAMATION_MARK + C_BRACKET_OPEN, fromIndex);

    if (image === -1) {
        return link;
    }

    /*
     * Link can never be `-1` if an image is found, so we don’t need to
     * check for that :)
     */

    return link < image ? link : image;
}

/**
 * Tokenise a link.
 *
 * @example
 *   tokenizeLink(eat, '![foo](fav.ico "Favicon"));
 *
 * @property {Function} locator - Link locator.
 * @param {function(string)} eat - Eater.
 * @param {string} value - Rest of content.
 * @param {boolean?} [silent] - Whether this is a dry run.
 * @return {Node?|boolean} - `link` or `image` node.
 */
function tokenizeLink(eat, value, silent) {
    var self = this;
    var subvalue = EMPTY;
    var index = 0;
    var character = value.charAt(0);
    var commonmark = self.options.commonmark;
    var gfm = self.options.gfm;
    var closed;
    var count;
    var opening;
    var beforeURL;
    var beforeTitle;
    var subqueue;
    var openCount;
    var hasMarker;
    var markers;
    var isImage;
    var content;
    var marker;
    var length;
    var title;
    var depth;
    var queue;
    var url;
    var now;

    /*
     * Detect whether this is an image.
     */

    if (character === C_EXCLAMATION_MARK) {
        isImage = true;
        subvalue = character;
        character = value.charAt(++index);
    }

    /*
     * Eat the opening.
     */

    if (character !== C_BRACKET_OPEN) {
        return;
    }

    /*
     * Exit when this is a link and we’re already inside
     * a link.
     */

    if (!isImage && self.inLink) {
        return;
    }

    subvalue += character;
    queue = EMPTY;
    index++;

    /*
     * Eat the content.
     */

    length = value.length;
    now = eat.now();
    depth = 0;

    now.column += index;
    now.offset += index;

    while (index < length) {
        subqueue = character = value.charAt(index);

        if (character === C_TICK) {
            /* Inline-code in link content. */
            count = 1;

            while (value.charAt(index + 1) === C_TICK) {
                subqueue += character;
                index++;
                count++;
            }

            if (!opening) {
                opening = count;
            } else if (count >= opening) {
                opening = 0;
            }
        } else if (character === C_BACKSLASH) {
            /* Allow brackets to be escaped. */
            index++;
            subqueue += value.charAt(index);
        /* In GFM mode, brackets in code still count.
         * In all other modes, they don’t.  This empty
         * block prevents the next statements are
         * entered. */
        } else if ((!opening || gfm) && character === C_BRACKET_OPEN) {
            depth++;
        } else if ((!opening || gfm) && character === C_BRACKET_CLOSE) {
            if (depth) {
                depth--;
            } else {
                /* Allow white-space between content and
                 * url in GFM mode. */
                if (gfm) {
                    while (index < length) {
                        character = value.charAt(index + 1);

                        if (!isWhiteSpace(character)) {
                            break;
                        }

                        subqueue += character;
                        index++;
                    }
                }

                if (value.charAt(index + 1) !== C_PAREN_OPEN) {
                    return;
                }

                subqueue += C_PAREN_OPEN;
                closed = true;
                index++;

                break;
            }
        }

        queue += subqueue;
        subqueue = EMPTY;
        index++;
    }

    /* Eat the content closing. */
    if (!closed) {
        return;
    }

    content = queue;
    subvalue += queue + subqueue;
    index++;

    /*
     * Eat white-space.
     */

    while (index < length) {
        character = value.charAt(index);

        if (!isWhiteSpace(character)) {
            break;
        }

        subvalue += character;
        index++;
    }

    /*
     * Eat the URL.
     */

    character = value.charAt(index);
    markers = commonmark ? COMMONMARK_LINK_MARKERS : LINK_MARKERS;
    openCount = 0;
    queue = EMPTY;
    beforeURL = subvalue;

    if (character === C_LT) {
        index++;
        beforeURL += C_LT;

        while (index < length) {
            character = value.charAt(index);

            if (character === C_GT) {
                break;
            }

            if (commonmark && character === C_NEWLINE) {
                return;
            }

            queue += character;
            index++;
        }

        if (value.charAt(index) !== C_GT) {
            return;
        }

        subvalue += C_LT + queue + C_GT;
        url = queue;
        index++;
    } else {
        character = null;
        subqueue = EMPTY;

        while (index < length) {
            character = value.charAt(index);

            if (subqueue && has.call(markers, character)) {
                break;
            }

            if (isWhiteSpace(character)) {
                if (commonmark) {
                    break;
                }

                subqueue += character;
            } else {
                if (character === C_PAREN_OPEN) {
                    depth++;
                    openCount++;
                } else if (character === C_PAREN_CLOSE) {
                    if (depth === 0) {
                        break;
                    }

                    depth--;
                }

                queue += subqueue;
                subqueue = EMPTY;

                if (character === C_BACKSLASH) {
                    queue += C_BACKSLASH;
                    character = value.charAt(++index);
                }

                queue += character;
            }

            index++;
        }

        subvalue += queue;
        url = queue;
        index = subvalue.length;
    }

    /*
     * Eat white-space.
     */

    queue = EMPTY;

    while (index < length) {
        character = value.charAt(index);

        if (!isWhiteSpace(character)) {
            break;
        }

        queue += character;
        index++;
    }

    character = value.charAt(index);
    subvalue += queue;

    /*
     * Eat the title.
     */

    if (queue && has.call(markers, character)) {
        index++;
        subvalue += character;
        queue = EMPTY;
        marker = markers[character];
        beforeTitle = subvalue;

        /*
         * In commonmark-mode, things are pretty easy: the
         * marker cannot occur inside the title.
         *
         * Non-commonmark does, however, support nested
         * delimiters.
         */

        if (commonmark) {
            while (index < length) {
                character = value.charAt(index);

                if (character === marker) {
                    break;
                }

                if (character === C_BACKSLASH) {
                    queue += C_BACKSLASH;
                    character = value.charAt(++index);
                }

                index++;
                queue += character;
            }

            character = value.charAt(index);

            if (character !== marker) {
                return;
            }

            title = queue;
            subvalue += queue + character;
            index++;

            while (index < length) {
                character = value.charAt(index);

                if (!isWhiteSpace(character)) {
                    break;
                }

                subvalue += character;
                index++;
            }
        } else {
            subqueue = EMPTY;

            while (index < length) {
                character = value.charAt(index);

                if (character === marker) {
                    if (hasMarker) {
                        queue += marker + subqueue;
                        subqueue = EMPTY;
                    }

                    hasMarker = true;
                } else if (!hasMarker) {
                    queue += character;
                } else if (character === C_PAREN_CLOSE) {
                    subvalue += queue + marker + subqueue;
                    title = queue;
                    break;
                } else if (isWhiteSpace(character)) {
                    subqueue += character;
                } else {
                    queue += marker + subqueue + character;
                    subqueue = EMPTY;
                    hasMarker = false;
                }

                index++;
            }
        }
    }

    if (value.charAt(index) !== C_PAREN_CLOSE) {
        return;
    }

    /* istanbul ignore if - never used (yet) */
    if (silent) {
        return true;
    }

    subvalue += C_PAREN_CLOSE;

    url = self.decode.raw(self.descape(url), eat(beforeURL).test().end);

    if (title) {
        beforeTitle = eat(beforeTitle).test().end;
        title = self.decode.raw(self.descape(title), beforeTitle);
    }

    return eat(subvalue)(
        self.renderLink(!isImage, url, content, title, now, eat)
    );
}

tokenizeLink.locator = locateLink;

/**
 * Tokenise a reference link, image, or footnote;
 * shortcut reference link, or footnote.
 *
 * @example
 *   tokenizeReference(eat, '[foo]');
 *   tokenizeReference(eat, '[foo][]');
 *   tokenizeReference(eat, '[foo][bar]');
 *
 * @property {Function} locator - Reference locator.
 * @param {function(string)} eat - Eater.
 * @param {string} value - Rest of content.
 * @param {boolean?} [silent] - Whether this is a dry run.
 * @return {Node?|boolean} - Reference node.
 */
function tokenizeReference(eat, value, silent) {
    var self = this;
    var character = value.charAt(0);
    var index = 0;
    var length = value.length;
    var subvalue = EMPTY;
    var intro = EMPTY;
    var type = T_LINK;
    var referenceType = REFERENCE_TYPE_SHORTCUT;
    var content;
    var identifier;
    var now;
    var node;
    var exitLink;
    var queue;
    var bracketed;
    var depth;

    /*
     * Check whether we’re eating an image.
     */

    if (character === C_EXCLAMATION_MARK) {
        type = T_IMAGE;
        intro = character;
        character = value.charAt(++index);
    }

    if (character !== C_BRACKET_OPEN) {
        return;
    }

    index++;
    intro += character;
    queue = EMPTY;

    /*
     * Check whether we’re eating a footnote.
     */

    if (
        self.options.footnotes &&
        type === T_LINK &&
        value.charAt(index) === C_CARET
    ) {
        intro += C_CARET;
        index++;
        type = T_FOOTNOTE;
    }

    /*
     * Eat the text.
     */

    depth = 0;

    while (index < length) {
        character = value.charAt(index);

        if (character === C_BRACKET_OPEN) {
            bracketed = true;
            depth++;
        } else if (character === C_BRACKET_CLOSE) {
            if (!depth) {
                break;
            }

            depth--;
        }

        if (character === C_BACKSLASH) {
            queue += C_BACKSLASH;
            character = value.charAt(++index);
        }

        queue += character;
        index++;
    }

    subvalue = content = queue;
    character = value.charAt(index);

    if (character !== C_BRACKET_CLOSE) {
        return;
    }

    index++;
    subvalue += character;
    queue = EMPTY;

    while (index < length) {
        character = value.charAt(index);

        if (!isWhiteSpace(character)) {
            break;
        }

        queue += character;
        index++;
    }

    character = value.charAt(index);

    if (character !== C_BRACKET_OPEN) {
        if (!content) {
            return;
        }

        identifier = content;
    } else {
        identifier = EMPTY;
        queue += character;
        index++;

        while (index < length) {
            character = value.charAt(index);

            if (
                character === C_BRACKET_OPEN ||
                character === C_BRACKET_CLOSE
            ) {
                break;
            }

            if (character === C_BACKSLASH) {
                identifier += C_BACKSLASH;
                character = value.charAt(++index);
            }

            identifier += character;
            index++;
        }

        character = value.charAt(index);

        if (character === C_BRACKET_CLOSE) {
            queue += identifier + character;
            index++;

            referenceType = identifier ?
                REFERENCE_TYPE_FULL :
                REFERENCE_TYPE_COLLAPSED;
        } else {
            identifier = EMPTY;
        }

        subvalue += queue;
        queue = EMPTY;
    }

    /*
     * Brackets cannot be inside the identifier.
     */

    if (referenceType !== REFERENCE_TYPE_FULL && bracketed) {
        return;
    }

    /*
     * Inline footnotes cannot have an identifier.
     */

    if (type === T_FOOTNOTE && referenceType !== REFERENCE_TYPE_SHORTCUT) {
        type = T_LINK;
        intro = C_BRACKET_OPEN + C_CARET;
        content = C_CARET + content;
    }

    subvalue = intro + subvalue;

    if (type === T_LINK && self.inLink) {
        return null;
    }

    /* istanbul ignore if - never used (yet) */
    if (silent) {
        return true;
    }

    if (type === T_FOOTNOTE && content.indexOf(C_SPACE) !== -1) {
        return eat(subvalue)(self.renderFootnote(content, eat.now()));
    }

    now = eat.now();
    now.column += intro.length;
    now.offset += intro.length;
    identifier = referenceType === REFERENCE_TYPE_FULL ? identifier : content;

    node = {
        'type': type + 'Reference',
        'identifier': normalize(identifier)
    };

    if (type === T_LINK || type === T_IMAGE) {
        node.referenceType = referenceType;
    }

    if (type === T_LINK) {
        exitLink = self.enterLink();
        node.children = self.tokenizeInline(content, now);
        exitLink();
    } else if (type === T_IMAGE) {
        node.alt = self.decode.raw(self.descape(content), now) || null;
    }

    return eat(subvalue)(node);
}

tokenizeReference.locator = locateLink;

/**
 * Find a possible strong emphasis.
 *
 * @example
 *   locateStrong('foo **bar'); // 4
 *
 * @param {string} value - Value to search.
 * @param {number} fromIndex - Index to start searching at.
 * @return {number} - Location of possible strong emphasis.
 */
function locateStrong(value, fromIndex) {
    var asterisk = value.indexOf(C_ASTERISK + C_ASTERISK, fromIndex);
    var underscore = value.indexOf(C_UNDERSCORE + C_UNDERSCORE, fromIndex);

    if (underscore === -1) {
        return asterisk;
    }

    if (asterisk === -1) {
        return underscore;
    }

    return underscore < asterisk ? underscore : asterisk;
}

/**
 * Tokenise strong emphasis.
 *
 * @example
 *   tokenizeStrong(eat, '**foo**');
 *   tokenizeStrong(eat, '__foo__');
 *
 * @property {Function} locator - Strong emphasis locator.
 * @param {function(string)} eat - Eater.
 * @param {string} value - Rest of content.
 * @param {boolean?} [silent] - Whether this is a dry run.
 * @return {Node?|boolean} - `strong` node.
 */
function tokenizeStrong(eat, value, silent) {
    var self = this;
    var index = 0;
    var character = value.charAt(index);
    var now;
    var pedantic;
    var marker;
    var queue;
    var subvalue;
    var length;
    var prev;

    if (
        EMPHASIS_MARKERS[character] !== true ||
        value.charAt(++index) !== character
    ) {
        return;
    }

    pedantic = self.options.pedantic;
    marker = character;
    subvalue = marker + marker;
    length = value.length;
    index++;
    queue = character = EMPTY;

    if (pedantic && isWhiteSpace(value.charAt(index))) {
        return;
    }

    while (index < length) {
        prev = character;
        character = value.charAt(index);

        if (
            character === marker &&
            value.charAt(index + 1) === marker &&
            (!pedantic || !isWhiteSpace(prev))
        ) {
            character = value.charAt(index + 2);

            if (character !== marker) {
                if (!trim(queue)) {
                    return;
                }

                /* istanbul ignore if - never used (yet) */
                if (silent) {
                    return true;
                }

                now = eat.now();
                now.column += 2;
                now.offset += 2;

                return eat(subvalue + queue + subvalue)(
                    self.renderInline(T_STRONG, queue, now)
                );
            }
        }

        if (!pedantic && character === C_BACKSLASH) {
            queue += character;
            character = value.charAt(++index);
        }

        queue += character;
        index++;
    }
}

tokenizeStrong.locator = locateStrong;

/**
 * Find possible slight emphasis.
 *
 * @example
 *   locateEmphasis('foo *bar'); // 4
 *
 * @param {string} value - Value to search.
 * @param {number} fromIndex - Index to start searching at.
 * @return {number} - Location of possible slight emphasis.
 */
function locateEmphasis(value, fromIndex) {
    var asterisk = value.indexOf(C_ASTERISK, fromIndex);
    var underscore = value.indexOf(C_UNDERSCORE, fromIndex);

    if (underscore === -1) {
        return asterisk;
    }

    if (asterisk === -1) {
        return underscore;
    }

    return underscore < asterisk ? underscore : asterisk;
}

/**
 * Tokenise slight emphasis.
 *
 * @example
 *   tokenizeEmphasis(eat, '*foo*');
 *   tokenizeEmphasis(eat, '_foo_');
 *
 * @property {Function} locator - Slight emphasis locator.
 * @param {function(string)} eat - Eater.
 * @param {string} value - Rest of content.
 * @param {boolean?} [silent] - Whether this is a dry run.
 * @return {Node?|boolean} - `emphasis` node.
 */
function tokenizeEmphasis(eat, value, silent) {
    var self = this;
    var index = 0;
    var character = value.charAt(index);
    var now;
    var pedantic;
    var marker;
    var queue;
    var subvalue;
    var length;
    var prev;

    if (EMPHASIS_MARKERS[character] !== true) {
        return;
    }

    pedantic = self.options.pedantic;
    subvalue = marker = character;
    length = value.length;
    index++;
    queue = character = EMPTY;

    if (pedantic && isWhiteSpace(value.charAt(index))) {
        return;
    }

    while (index < length) {
        prev = character;
        character = value.charAt(index);

        if (
            character === marker &&
            (!pedantic || !isWhiteSpace(prev))
        ) {
            character = value.charAt(++index);

            if (character !== marker) {
                if (!trim(queue) || prev === marker) {
                    return;
                }

                if (
                    pedantic ||
                    marker !== C_UNDERSCORE ||
                    !isWordCharacter(character)
                ) {
                    /* istanbul ignore if - never used (yet) */
                    if (silent) {
                        return true;
                    }

                    now = eat.now();
                    now.column++;
                    now.offset++;

                    return eat(subvalue + queue + marker)(
                        self.renderInline(T_EMPHASIS, queue, now)
                    );
                }
            }

            queue += marker;
        }

        if (!pedantic && character === C_BACKSLASH) {
            queue += character;
            character = value.charAt(++index);
        }

        queue += character;
        index++;
    }
}

tokenizeEmphasis.locator = locateEmphasis;

/**
 * Find a possible deletion.
 *
 * @example
 *   locateDeletion('foo ~~bar'); // 4
 *
 * @param {string} value - Value to search.
 * @param {number} fromIndex - Index to start searching at.
 * @return {number} - Location of possible deletion.
 */
function locateDeletion(value, fromIndex) {
    return value.indexOf(C_TILDE + C_TILDE, fromIndex);
}

/**
 * Tokenise a deletion.
 *
 * @example
 *   tokenizeDeletion(eat, '~~foo~~');
 *
 * @property {Function} locator - Deletion locator.
 * @param {function(string)} eat - Eater.
 * @param {string} value - Rest of content.
 * @param {boolean?} [silent] - Whether this is a dry run.
 * @return {Node?|boolean} - `delete` node.
 */
function tokenizeDeletion(eat, value, silent) {
    var self = this;
    var character = EMPTY;
    var previous = EMPTY;
    var preceding = EMPTY;
    var subvalue = EMPTY;
    var index;
    var length;
    var now;

    if (
        !self.options.gfm ||
        value.charAt(0) !== C_TILDE ||
        value.charAt(1) !== C_TILDE ||
        isWhiteSpace(value.charAt(2))
    ) {
        return;
    }

    index = 1;
    length = value.length;
    now = eat.now();
    now.column += 2;
    now.offset += 2;

    while (++index < length) {
        character = value.charAt(index);

        if (
            character === C_TILDE &&
            previous === C_TILDE &&
            (!preceding || !isWhiteSpace(preceding))
        ) {
            /* istanbul ignore if - never used (yet) */
            if (silent) {
                return true;
            }

            return eat(C_TILDE + C_TILDE + subvalue + C_TILDE + C_TILDE)(
                self.renderInline(T_DELETE, subvalue, now)
            );
        }

        subvalue += previous;
        preceding = previous;
        previous = character;
    }
}

tokenizeDeletion.locator = locateDeletion;

/**
 * Find possible inline code.
 *
 * @example
 *   locateInlineCode('foo `bar'); // 4
 *
 * @param {string} value - Value to search.
 * @param {number} fromIndex - Index to start searching at.
 * @return {number} - Location of possible inline code.
 */
function locateInlineCode(value, fromIndex) {
    return value.indexOf(C_TICK, fromIndex);
}

/**
 * Tokenise inline code.
 *
 * @example
 *   tokenizeInlineCode(eat, '`foo()`');
 *
 * @property {Function} locator - Inline code locator.
 * @param {function(string)} eat - Eater.
 * @param {string} value - Rest of content.
 * @param {boolean?} [silent] - Whether this is a dry run.
 * @return {Node?|boolean} - `inlineCode` node.
 */
function tokenizeInlineCode(eat, value, silent) {
    var self = this;
    var length = value.length;
    var index = 0;
    var queue = EMPTY;
    var tickQueue = EMPTY;
    var contentQueue;
    var subqueue;
    var count;
    var openingCount;
    var subvalue;
    var character;
    var found;
    var next;

    while (index < length) {
        if (value.charAt(index) !== C_TICK) {
            break;
        }

        queue += C_TICK;
        index++;
    }

    if (!queue) {
        return;
    }

    subvalue = queue;
    openingCount = index;
    queue = EMPTY;
    next = value.charAt(index);
    count = 0;

    while (index < length) {
        character = next;
        next = value.charAt(index + 1);

        if (character === C_TICK) {
            count++;
            tickQueue += character;
        } else {
            count = 0;
            queue += character;
        }

        if (count && next !== C_TICK) {
            if (count === openingCount) {
                subvalue += queue + tickQueue;
                found = true;
                break;
            }

            queue += tickQueue;
            tickQueue = EMPTY;
        }

        index++;
    }

    if (!found) {
        if (openingCount % 2 !== 0) {
            return;
        }

        queue = EMPTY;
    }

    /* istanbul ignore if - never used (yet) */
    if (silent) {
        return true;
    }

    contentQueue = subqueue = EMPTY;
    length = queue.length;
    index = -1;

    while (++index < length) {
        character = queue.charAt(index);

        if (isWhiteSpace(character)) {
            subqueue += character;
            continue;
        }

        if (subqueue) {
            if (contentQueue) {
                contentQueue += subqueue;
            }

            subqueue = EMPTY;
        }

        contentQueue += character;
    }

    return eat(subvalue)(self.renderRaw(T_INLINE_CODE, contentQueue));
}

tokenizeInlineCode.locator = locateInlineCode;

/**
 * Find a possible break.
 *
 * @example
 *   locateBreak('foo   \nbar'); // 3
 *
 * @param {string} value - Value to search.
 * @param {number} fromIndex - Index to start searching at.
 * @return {number} - Location of possible break.
 */
function locateBreak(value, fromIndex) {
    var index = value.indexOf(C_NEWLINE, fromIndex);

    while (index > fromIndex) {
        if (value.charAt(index - 1) !== C_SPACE) {
            break;
        }

        index--;
    }

    return index;
}

/**
 * Tokenise a break.
 *
 * @example
 *   tokenizeBreak(eat, '  \n');
 *
 * @property {Function} locator - Break locator.
 * @param {function(string)} eat - Eater.
 * @param {string} value - Rest of content.
 * @param {boolean?} [silent] - Whether this is a dry run.
 * @return {Node?|boolean} - `break` node.
 */
function tokenizeBreak(eat, value, silent) {
    var self = this;
    var breaks = self.options.breaks;
    var length = value.length;
    var index = -1;
    var queue = EMPTY;
    var character;

    while (++index < length) {
        character = value.charAt(index);

        if (character === C_NEWLINE) {
            if (!breaks && index < MIN_BREAK_LENGTH) {
                return;
            }

            /* istanbul ignore if - never used (yet) */
            if (silent) {
                return true;
            }

            queue += character;
            return eat(queue)(self.renderVoid(T_BREAK));
        }

        if (character !== C_SPACE) {
            return;
        }

        queue += character;
    }
}

tokenizeBreak.locator = locateBreak;

/**
 * Construct a new parser.
 *
 * @example
 *   var parser = new Parser(new VFile('Foo'));
 *
 * @constructor
 * @class {Parser}
 * @param {VFile} file - File to parse.
 * @param {Object?} [options] - Passed to
 *   `Parser#setOptions()`.
 */
function Parser(file, options) {
    var self = this;

    self.file = file;
    self.inLink = false;
    self.inBlock = false;
    self.inList = false;
    self.atStart = true;
    self.toOffset = vfileLocation(file).toOffset;

    self.descape = descapeFactory(self, 'escape');
    self.decode = decodeFactory(self);

    self.options = extend({}, self.options);

    self.setOptions(options);
}

/**
 * Set options.  Does not overwrite previously set
 * options.
 *
 * @example
 *   var parser = new Parser();
 *   parser.setOptions({gfm: true});
 *
 * @this {Parser}
 * @throws {Error} - When an option is invalid.
 * @param {Object?} [options] - Parse settings.
 * @return {Parser} - `self`.
 */
Parser.prototype.setOptions = function (options) {
    var self = this;
    var current = self.options;
    var key;

    if (options === null || options === undefined) {
        options = {};
    } else if (typeof options === 'object') {
        options = extend({}, options);
    } else {
        throw new Error(
            'Invalid value `' + options + '` ' +
            'for setting `options`'
        );
    }

    for (key in defaultOptions) {
        var value = options[key];

        if (value === null || value === undefined) {
            value = current[key];
        }

        if (typeof value !== 'boolean') {
            throw new Error(
                'Invalid value `' + value + '` ' +
                'for setting `options.' + key + '`'
            );
        }

        options[key] = value;
    }

    self.options = options;

    if (options.commonmark) {
        self.escape = escapes.commonmark;
    } else if (options.gfm) {
        self.escape = escapes.gfm;
    } else {
        self.escape = escapes.default;
    }

    return self;
};

/*
 * Expose `defaults`.
 */

Parser.prototype.options = defaultOptions;

/**
 * Factory to track indentation for each line corresponding
 * to the given `start` and the number of invocations.
 *
 * @param {number} start - Starting line.
 * @return {function(offset)} - Indenter.
 */
Parser.prototype.indent = function (start) {
    var self = this;
    var line = start;

    /**
     * Intender which increments the global offset,
     * starting at the bound line, and further incrementing
     * each line for each invocation.
     *
     * @example
     *   indenter(2);
     *
     * @param {number} offset - Number to increment the
     *   offset.
     */
    function indenter(offset) {
        self.offset[line] = (self.offset[line] || 0) + offset;

        line++;
    }

    return indenter;
};

/**
 * Get found offsets starting at `start`.
 *
 * @param {number} start - Starting line.
 * @return {Array.<number>} - Offsets starting at `start`.
 */
Parser.prototype.getIndent = function (start) {
    var offset = this.offset;
    var result = [];

    while (++start) {
        if (!(start in offset)) {
            break;
        }

        result.push((offset[start] || 0) + 1);
    }

    return result;
};

/**
 * Parse the bound file.
 *
 * @example
 *   new Parser(new File('_Foo_.')).parse();
 *
 * @this {Parser}
 * @return {Object} - `root` node.
 */
Parser.prototype.parse = function () {
    var self = this;
    var value = String(self.file);
    var column = 1;
    var node;

    /*
     * Clean non-unix newlines: `\r\n` and `\r` are all
     * changed to `\n`.  This should not affect positional
     * information.
     */

    value = value.replace(EXPRESSION_LINE_BREAKS, C_NEWLINE);

    if (value.charCodeAt(0) === 0xFEFF) {
        value = value.slice(1);
        column++;
        self.offset++;
    }

    /*
     * Add an `offset` matrix, used to keep track of
     * syntax and white space indentation per line.
     */

    self.offset = {};

    node = self.renderBlock(T_ROOT, value, {
        'line': 1,
        'column': column
    });

    node.position = {
        'start': {
            'line': 1,
            'column': 1,
            'offset': 0
        }
    };

    node.position.end = self.eof || extend({}, node.position.start);

    if (!self.options.position) {
        removePosition(node);
    }

    return node;
};

/*
 * Enter and exit helpers.
 */

Parser.prototype.exitStart = toggle('atStart', true);
Parser.prototype.enterList = toggle('inList', false);
Parser.prototype.enterLink = toggle('inLink', false);
Parser.prototype.enterBlock = toggle('inBlock', false);

/*
 * Expose helpers
 */

Parser.prototype.renderRaw = renderRaw;
Parser.prototype.renderVoid = renderVoid;
Parser.prototype.renderParent = renderParent;
Parser.prototype.renderInline = renderInline;
Parser.prototype.renderBlock = renderBlock;

Parser.prototype.renderLink = renderLink;
Parser.prototype.renderCodeBlock = renderCodeBlock;
Parser.prototype.renderBlockquote = renderBlockquote;
Parser.prototype.renderListItem = renderListItem;
Parser.prototype.renderFootnoteDefinition = renderFootnoteDefinition;
Parser.prototype.renderHeading = renderHeading;
Parser.prototype.renderFootnote = renderFootnote;

/**
 * Construct a tokenizer.  This creates both
 * `tokenizeInline` and `tokenizeBlock`.
 *
 * @example
 *   Parser.prototype.tokenizeInline = tokenizeFactory('inline');
 *
 * @param {string} type - Name of parser, used to find
 *   its expressions (`%sMethods`) and tokenizers
 *   (`%Tokenizers`).
 * @return {Function} - Tokenizer.
 */
function tokenizeFactory(type) {
    /**
     * Tokenizer for a bound `type`
     *
     * @example
     *   parser = new Parser();
     *   parser.tokenizeInline('_foo_');
     *
     * @param {string} value - Content.
     * @param {Object} location - Offset at which `value`
     *   starts.
     * @return {Array.<Object>} - Nodes.
     */
    function tokenize(value, location) {
        var self = this;
        var offset = self.offset;
        var tokens = [];
        var methods = self[type + 'Methods'];
        var tokenizers = self[type + 'Tokenizers'];
        var line = location.line;
        var column = location.column;
        var add;
        var index;
        var length;
        var method;
        var name;
        var matched;
        var valueLength;

        /*
         * Trim white space only lines.
         */

        if (!value) {
            return tokens;
        }

        /**
         * Update line, column, and offset based on
         * `value`.
         *
         * @example
         *   updatePosition('foo');
         *
         * @param {string} subvalue - Subvalue to eat.
         */
        function updatePosition(subvalue) {
            var lastIndex = -1;
            var index = subvalue.indexOf(C_NEWLINE);

            while (index !== -1) {
                line++;
                lastIndex = index;
                index = subvalue.indexOf(C_NEWLINE, index + 1);
            }

            if (lastIndex === -1) {
                column += subvalue.length;
            } else {
                column = subvalue.length - lastIndex;
            }

            if (line in offset) {
                if (lastIndex !== -1) {
                    column += offset[line];
                } else if (column <= offset[line]) {
                    column = offset[line] + 1;
                }
            }
        }

        /**
         * Get offset. Called before the first character is
         * eaten to retrieve the range's offsets.
         *
         * @return {Function} - `done`, to be called when
         *   the last character is eaten.
         */
        function getOffset() {
            var indentation = [];
            var pos = line + 1;

            /**
             * Done. Called when the last character is
             * eaten to retrieve the range’s offsets.
             *
             * @return {Array.<number>} - Offset.
             */
            function done() {
                var last = line + 1;

                while (pos < last) {
                    indentation.push((offset[pos] || 0) + 1);

                    pos++;
                }

                return indentation;
            }

            return done;
        }

        /**
         * Get the current position.
         *
         * @example
         *   position = now(); // {line: 1, column: 1, offset: 0}
         *
         * @return {Object} - Current Position.
         */
        function now() {
            var pos = {
                'line': line,
                'column': column
            };

            pos.offset = self.toOffset(pos);

            return pos;
        }

        /**
         * Store position information for a node.
         *
         * @example
         *   start = now();
         *   updatePosition('foo');
         *   location = new Position(start);
         *   // {
         *   //   start: {line: 1, column: 1, offset: 0},
         *   //   end: {line: 1, column: 3, offset: 2}
         *   // }
         *
         * @param {Object} start - Starting position.
         */
        function Position(start) {
            this.start = start;
            this.end = now();
        }

        /**
         * Throw when a value is incorrectly eaten.
         * This shouldn’t happen but will throw on new,
         * incorrect rules.
         *
         * @example
         *   // When the current value is set to `foo bar`.
         *   validateEat('foo');
         *   eat('foo');
         *
         *   validateEat('bar');
         *   // throws, because the space is not eaten.
         *
         * @param {string} subvalue - Value to be eaten.
         * @throws {Error} - When `subvalue` cannot be eaten.
         */
        function validateEat(subvalue) {
            /* istanbul ignore if */
            if (value.substring(0, subvalue.length) !== subvalue) {
                self.file.fail(ERR_INCORRECTLY_EATEN, now());
            }
        }

        /**
         * Mark position and patch `node.position`.
         *
         * @example
         *   var update = position();
         *   updatePosition('foo');
         *   update({});
         *   // {
         *   //   position: {
         *   //     start: {line: 1, column: 1, offset: 0},
         *   //     end: {line: 1, column: 3, offset: 2}
         *   //   }
         *   // }
         *
         * @returns {Function} - Updater.
         */
        function position() {
            var before = now();

            /**
             * Add the position to a node.
             *
             * @example
             *   update({type: 'text', value: 'foo'});
             *
             * @param {Node} node - Node to attach position
             *   on.
             * @param {Array} [indent] - Indentation for
             *   `node`.
             * @return {Node} - `node`.
             */
            function update(node, indent) {
                var prev = node.position;
                var start = prev ? prev.start : before;
                var combined = [];
                var n = prev && prev.end.line;
                var l = before.line;

                node.position = new Position(start);

                /*
                 * If there was already a `position`, this
                 * node was merged.  Fixing `start` wasn’t
                 * hard, but the indent is different.
                 * Especially because some information, the
                 * indent between `n` and `l` wasn’t
                 * tracked.  Luckily, that space is
                 * (should be?) empty, so we can safely
                 * check for it now.
                 */

                if (prev && indent && prev.indent) {
                    combined = prev.indent;

                    if (n < l) {
                        while (++n < l) {
                            combined.push((offset[n] || 0) + 1);
                        }

                        combined.push(before.column);
                    }

                    indent = combined.concat(indent);
                }

                node.position.indent = indent || [];

                return node;
            }

            return update;
        }

        /**
         * Add `node` to `parent`s children or to `tokens`.
         * Performs merges where possible.
         *
         * @example
         *   add({});
         *
         *   add({}, {children: []});
         *
         * @param {Object} node - Node to add.
         * @param {Object} [parent] - Parent to insert into.
         * @return {Object} - Added or merged into node.
         */
        add = function (node, parent) {
            var prev;
            var children;

            if (!parent) {
                children = tokens;
            } else {
                children = parent.children;
            }

            prev = children[children.length - 1];

            if (
                prev &&
                node.type === prev.type &&
                node.type in MERGEABLE_NODES &&
                mergeable(prev) &&
                mergeable(node)
            ) {
                node = MERGEABLE_NODES[node.type].call(
                    self, prev, node
                );
            }

            if (node !== prev) {
                children.push(node);
            }

            if (self.atStart && tokens.length) {
                self.exitStart();
            }

            return node;
        };

        /**
         * Remove `subvalue` from `value`.
         * `subvalue` must be at the start of `value`.
         *
         * @example
         *   eat('foo')({type: 'text', value: 'foo'});
         *
         * @param {string} subvalue - Removed from `value`,
         *   and passed to `updatePosition`.
         * @return {Function} - Wrapper around `add`, which
         *   also adds `position` to node.
         */
        function eat(subvalue) {
            var indent = getOffset();
            var pos = position();
            var current = now();

            validateEat(subvalue);

            /**
             * Add the given arguments, add `position` to
             * the returned node, and return the node.
             *
             * @param {Object} node - Node to add.
             * @param {Object} [parent] - Node to insert into.
             * @return {Node} - Added node.
             */
            function apply(node, parent) {
                return pos(add(pos(node), parent), indent);
            }

            /**
             * Functions just like apply, but resets the
             * content:  the line and column are reversed,
             * and the eaten value is re-added.
             *
             * This is useful for nodes with a single
             * type of content, such as lists and tables.
             *
             * See `apply` above for what parameters are
             * expected.
             *
             * @return {Node} - Added node.
             */
            function reset() {
                var node = apply.apply(null, arguments);

                line = current.line;
                column = current.column;
                value = subvalue + value;

                return node;
            }

            /**
             * Test the position, after eating, and reverse
             * to a not-eaten state.
             *
             * @return {Position} - Position after eating `subvalue`.
             */
            function test() {
                var result = pos({});

                line = current.line;
                column = current.column;
                value = subvalue + value;

                return result.position;
            }

            apply.reset = reset;
            apply.test = reset.test = test;

            value = value.substring(subvalue.length);

            updatePosition(subvalue);

            indent = indent();

            return apply;
        }

        /*
         * Expose `now` on `eat`.
         */

        eat.now = now;

        /*
         * Expose `file` on `eat`.
         */

        eat.file = self.file;

        /*
         * Sync initial offset.
         */

        updatePosition(EMPTY);

        /*
         * Iterate over `value`, and iterate over all
         * tokenizers.  When one eats something, re-iterate
         * with the remaining value.  If no tokenizer eats,
         * something failed (should not happen) and an
         * exception is thrown.
         */

        while (value) {
            index = -1;
            length = methods.length;
            matched = false;

            while (++index < length) {
                name = methods[index];
                method = tokenizers[name];

                if (
                    method &&
                    (!method.onlyAtStart || self.atStart) &&
                    (!method.notInList || !self.inList) &&
                    (!method.notInBlock || !self.inBlock) &&
                    (!method.notInLink || !self.inLink)
                ) {
                    valueLength = value.length;

                    method.apply(self, [eat, value]);

                    matched = valueLength !== value.length;

                    if (matched) {
                        break;
                    }
                }
            }

            /* istanbul ignore if */
            if (!matched) {
                self.file.fail(ERR_INFINITE_LOOP, eat.now());

                /*
                 * Errors are not thrown on `File#fail`
                 * when `quiet: true`.
                 */

                break;
            }
        }

        self.eof = now();

        return tokens;
    }

    return tokenize;
}

/*
 * Expose tokenizers for block-level nodes.
 */

Parser.prototype.blockTokenizers = {
    'yamlFrontMatter': tokenizeYAMLFrontMatter,
    'newline': tokenizeNewline,
    'indentedCode': tokenizeIndentedCode,
    'fencedCode': tokenizeFencedCode,
    'blockquote': tokenizeBlockquote,
    'atxHeading': tokenizeATXHeading,
    'thematicBreak': tokenizeThematicBreak,
    'list': tokenizeList,
    'setextHeading': tokenizeSetextHeading,
    'html': tokenizeBlockHTML,
    'footnote': tokenizeFootnoteDefinition,
    'definition': tokenizeDefinition,
    'table': tokenizeTable,
    'paragraph': tokenizeParagraph
};

/*
 * Expose order in which to parse block-level nodes.
 */

Parser.prototype.blockMethods = [
    'yamlFrontMatter',
    'newline',
    'indentedCode',
    'fencedCode',
    'blockquote',
    'atxHeading',
    'thematicBreak',
    'list',
    'setextHeading',
    'html',
    'footnote',
    'definition',
    'table',
    'paragraph'
];

/**
 * Block tokenizer.
 *
 * @example
 *   var parser = new Parser();
 *   parser.tokenizeBlock('> foo.');
 *
 * @param {string} value - Content.
 * @return {Array.<Object>} - Nodes.
 */

Parser.prototype.tokenizeBlock = tokenizeFactory(BLOCK);

/*
 * Expose tokenizers for inline-level nodes.
 */

Parser.prototype.inlineTokenizers = {
    'escape': tokenizeEscape,
    'autoLink': tokenizeAutoLink,
    'url': tokenizeURL,
    'html': tokenizeInlineHTML,
    'link': tokenizeLink,
    'reference': tokenizeReference,
    'strong': tokenizeStrong,
    'emphasis': tokenizeEmphasis,
    'deletion': tokenizeDeletion,
    'code': tokenizeInlineCode,
    'break': tokenizeBreak,
    'text': tokenizeText
};

/*
 * Expose order in which to parse inline-level nodes.
 */

Parser.prototype.inlineMethods = [
    'escape',
    'autoLink',
    'url',
    'html',
    'link',
    'reference',
    'strong',
    'emphasis',
    'deletion',
    'code',
    'break',
    'text'
];

/**
 * Inline tokenizer.
 *
 * @example
 *   var parser = new Parser();
 *   parser.tokenizeInline('_foo_');
 *
 * @param {string} value - Content.
 * @return {Array.<Object>} - Nodes.
 */

Parser.prototype.tokenizeInline = tokenizeFactory(INLINE);

/*
 * Expose `tokenizeFactory` so dependencies could create
 * their own tokenizers.
 */

Parser.prototype.tokenizeFactory = tokenizeFactory;

/*
 * Expose `attacher`.
 */

module.exports = Parser;

},{"./block-elements.json":131,"./defaults.js":132,"./escapes.json":133,"collapse-white-space":110,"extend":113,"parse-entities":129,"repeat-string":139,"trim":146,"trim-trailing-lines":145,"unist-util-remove-position":150,"vfile-location":152}],135:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015-2016 Titus Wormer
 * @license MIT
 * @module remark:stringify
 * @fileoverview Markdown Compiler.
 */

'use strict';

/* eslint-env commonjs */

/* Dependencies. */
var unherit = require('unherit');
var Compiler = require('./lib/compiler.js');

/**
 * Attacher.
 *
 * @param {unified} processor - Unified processor.
 */
function stringify(processor) {
    processor.Compiler = unherit(Compiler);
}

/* Patch `Compiler`. */
stringify.Compiler = Compiler;

/* Expose. */
module.exports = stringify;

},{"./lib/compiler.js":136,"unherit":148}],136:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015-2016 Titus Wormer
 * @license MIT
 * @module remark:compiler
 * @fileoverview Markdown compiler
 */

'use strict';

/* eslint-env commonjs */

/*
 * Dependencies.
 */

var decode = require('parse-entities');
var encode = require('stringify-entities');
var table = require('markdown-table');
var repeat = require('repeat-string');
var extend = require('extend');
var ccount = require('ccount');
var longestStreak = require('longest-streak');
var defaultOptions = require('./defaults.js');

/*
 * Constants.
 */

var INDENT = 4;
var MINIMUM_CODE_FENCE_LENGTH = 3;
var YAML_FENCE_LENGTH = 3;
var MINIMUM_RULE_LENGTH = 3;
var MAILTO = 'mailto:';
var ERROR_LIST_ITEM_INDENT = 'Cannot indent code properly. See ' +
    'http://git.io/vgFvT';

/*
 * Expressions.
 */

var EXPRESSIONS_WHITE_SPACE = /\s/;

/*
 * Naive fence expression.
 */

var FENCE = /([`~])\1{2}/;

/*
 * Expression for a protocol.
 *
 * @see http://en.wikipedia.org/wiki/URI_scheme#Generic_syntax
 */

var PROTOCOL = /^[a-z][a-z+.-]+:\/?/i;

/*
 * Punctuation characters.
 */

var PUNCTUATION = /[-!"#$%&'()*+,.\/:;<=>?@\[\\\]^`{|}~_]/;

/*
 * Characters.
 */

var ANGLE_BRACKET_CLOSE = '>';
var ANGLE_BRACKET_OPEN = '<';
var ASTERISK = '*';
var BACKSLASH = '\\';
var CARET = '^';
var COLON = ':';
var SEMICOLON = ';';
var DASH = '-';
var DOT = '.';
var EMPTY = '';
var EQUALS = '=';
var EXCLAMATION_MARK = '!';
var HASH = '#';
var AMPERSAND = '&';
var LINE = '\n';
var CARRIAGE = '\r';
var FORM_FEED = '\f';
var PARENTHESIS_OPEN = '(';
var PARENTHESIS_CLOSE = ')';
var PIPE = '|';
var PLUS = '+';
var QUOTE_DOUBLE = '"';
var QUOTE_SINGLE = '\'';
var SPACE = ' ';
var TAB = '\t';
var VERTICAL_TAB = '\u000B';
var SQUARE_BRACKET_OPEN = '[';
var SQUARE_BRACKET_CLOSE = ']';
var TICK = '`';
var TILDE = '~';
var UNDERSCORE = '_';

/**
 * Check whether `character` is numeric.
 *
 * @param {string} character - Single character to check.
 * @return {boolean} - Whether `character` is numeric.
 */
function isNumeric(character) {
    return /[0-9]/.test(character);
}

/**
 * Check whether `character` is alphanumeric.
 *
 * @param {string} character - Single character to check.
 * @return {boolean} - Whether `character` is alphanumeric.
 */
function isAlphanumeric(character) {
    return /\w/.test(character) && character !== UNDERSCORE;
}

/*
 * Entities.
 */

var ENTITY_AMPERSAND = AMPERSAND + 'amp' + SEMICOLON;
var ENTITY_ANGLE_BRACKET_OPEN = AMPERSAND + 'lt' + SEMICOLON;
var ENTITY_COLON = AMPERSAND + '#x3A' + SEMICOLON;

/*
 * Character combinations.
 */

var BREAK = LINE + LINE;
var GAP = BREAK + LINE;
var DOUBLE_TILDE = TILDE + TILDE;

/*
 * Allowed entity options.
 */

var ENTITY_OPTIONS = {};

ENTITY_OPTIONS.true = true;
ENTITY_OPTIONS.false = true;
ENTITY_OPTIONS.numbers = true;
ENTITY_OPTIONS.escape = true;

/*
 * Allowed list-bullet characters.
 */

var LIST_BULLETS = {};

LIST_BULLETS[ASTERISK] = true;
LIST_BULLETS[DASH] = true;
LIST_BULLETS[PLUS] = true;

/*
 * Allowed horizontal-rule bullet characters.
 */

var THEMATIC_BREAK_BULLETS = {};

THEMATIC_BREAK_BULLETS[ASTERISK] = true;
THEMATIC_BREAK_BULLETS[DASH] = true;
THEMATIC_BREAK_BULLETS[UNDERSCORE] = true;

/*
 * Allowed emphasis characters.
 */

var EMPHASIS_MARKERS = {};

EMPHASIS_MARKERS[UNDERSCORE] = true;
EMPHASIS_MARKERS[ASTERISK] = true;

/*
 * Allowed fence markers.
 */

var FENCE_MARKERS = {};

FENCE_MARKERS[TICK] = true;
FENCE_MARKERS[TILDE] = true;

/*
 * Which method to use based on `list.ordered`.
 */

var ORDERED_MAP = {};

ORDERED_MAP.true = 'visitOrderedItems';
ORDERED_MAP.false = 'visitUnorderedItems';

/*
 * Allowed list-item-indent's.
 */

var LIST_ITEM_INDENTS = {};

var LIST_ITEM_TAB = 'tab';
var LIST_ITEM_ONE = '1';
var LIST_ITEM_MIXED = 'mixed';

LIST_ITEM_INDENTS[LIST_ITEM_ONE] = true;
LIST_ITEM_INDENTS[LIST_ITEM_TAB] = true;
LIST_ITEM_INDENTS[LIST_ITEM_MIXED] = true;

/*
 * Which checkbox to use.
 */

var CHECKBOX_MAP = {};

CHECKBOX_MAP.null = EMPTY;
CHECKBOX_MAP.undefined = EMPTY;
CHECKBOX_MAP.true = SQUARE_BRACKET_OPEN + 'x' + SQUARE_BRACKET_CLOSE + SPACE;
CHECKBOX_MAP.false = SQUARE_BRACKET_OPEN + SPACE + SQUARE_BRACKET_CLOSE +
    SPACE;

/**
 * Throw an exception with in its `message` `value`
 * and `name`.
 *
 * @param {*} value - Invalid value.
 * @param {string} name - Setting name.
 */
function raise(value, name) {
    throw new Error(
        'Invalid value `' + value + '` ' +
        'for setting `' + name + '`'
    );
}

/**
 * Validate a value to be boolean. Defaults to `def`.
 * Raises an exception with `context[name]` when not
 * a boolean.
 *
 * @example
 *   validateBoolean({foo: null}, 'foo', true) // true
 *   validateBoolean({foo: false}, 'foo', true) // false
 *   validateBoolean({foo: 'bar'}, 'foo', true) // Throws
 *
 * @throws {Error} - When a setting is neither omitted nor
 *   a boolean.
 * @param {Object} context - Settings.
 * @param {string} name - Setting name.
 * @param {boolean} def - Default value.
 */
function validateBoolean(context, name, def) {
    var value = context[name];

    if (value === null || value === undefined) {
        value = def;
    }

    if (typeof value !== 'boolean') {
        raise(value, 'options.' + name);
    }

    context[name] = value;
}

/**
 * Validate a value to be boolean. Defaults to `def`.
 * Raises an exception with `context[name]` when not
 * a boolean.
 *
 * @example
 *   validateNumber({foo: null}, 'foo', 1) // 1
 *   validateNumber({foo: 2}, 'foo', 1) // 2
 *   validateNumber({foo: 'bar'}, 'foo', 1) // Throws
 *
 * @throws {Error} - When a setting is neither omitted nor
 *   a number.
 * @param {Object} context - Settings.
 * @param {string} name - Setting name.
 * @param {number} def - Default value.
 */
function validateNumber(context, name, def) {
    var value = context[name];

    if (value === null || value === undefined) {
        value = def;
    }

    if (typeof value !== 'number' || value !== value) {
        raise(value, 'options.' + name);
    }

    context[name] = value;
}

/**
 * Validate a value to be in `map`. Defaults to `def`.
 * Raises an exception with `context[name]` when not
 * in `map`.
 *
 * @example
 *   var map = {bar: true, baz: true};
 *   validateString({foo: null}, 'foo', 'bar', map) // 'bar'
 *   validateString({foo: 'baz'}, 'foo', 'bar', map) // 'baz'
 *   validateString({foo: true}, 'foo', 'bar', map) // Throws
 *
 * @throws {Error} - When a setting is neither omitted nor
 *   in `map`.
 * @param {Object} context - Settings.
 * @param {string} name - Setting name.
 * @param {string} def - Default value.
 * @param {Object} map - Enum.
 */
function validateString(context, name, def, map) {
    var value = context[name];

    if (value === null || value === undefined) {
        value = def;
    }

    if (!(value in map)) {
        raise(value, 'options.' + name);
    }

    context[name] = value;
}

/*
 * Expose `validate`.
 */

var validate = {
    'boolean': validateBoolean,
    'string': validateString,
    'number': validateNumber
};

/**
 * Construct a state `toggler`: a function which inverses
 * `property` in context based on its current value.
 * The by `toggler` returned function restores that value.
 *
 * @example
 *   var context = {};
 *   var key = 'foo';
 *   var val = true;
 *   context[key] = val;
 *   context.enter = toggler(key, val);
 *   context[key]; // true
 *   var exit = context.enter();
 *   context[key]; // false
 *   var nested = context.enter();
 *   context[key]; // false
 *   nested();
 *   context[key]; // false
 *   exit();
 *   context[key]; // true
 *
 * @param {string} key - Property to toggle.
 * @param {boolean} state - It's default state.
 * @return {function(): function()} - Enter.
 */
function toggler(key, state) {
    /**
     * Construct a toggler for the bound `key`.
     *
     * @return {Function} - Exit state.
     */
    function enter() {
        var self = this;
        var current = self[key];

        self[key] = !state;

        /**
         * State canceler, cancels the state, if allowed.
         */
        function exit() {
            self[key] = current;
        }

        return exit;
    }

    return enter;
}

/**
 * Check whether a node is mergeable with adjacent nodes.
 *
 * @param {Object} node - Node to check.
 * @return {boolean} - Whether `node` is mergable.
 */
function mergeable(node) {
    var start;
    var end;

    if (node.type !== 'text' || !node.position) {
        return true;
    }

    start = node.position.start;
    end = node.position.end;

    /*
     * Only merge nodes which occupy the same size as their
     * `value`.
     */

    return start.line !== end.line ||
        end.column - start.column === node.value.length;
}

/**
 * Encode noop.
 * Simply returns the given value.
 *
 * @example
 *   var encode = encodeNoop();
 *   encode('AT&T') // 'AT&T'
 *
 * @param {string} value - Content.
 * @return {string} - Content, without any modifications.
 */
function encodeNoop(value) {
    return value;
}

/**
 * Factory to encode HTML entities.
 * Creates a no-operation function when `type` is
 * `'false'`, a function which encodes using named
 * references when `type` is `'true'`, and a function
 * which encodes using numbered references when `type` is
 * `'numbers'`.
 *
 * @example
 *   encodeFactory('false')('AT&T') // 'AT&T'
 *   encodeFactory('true')('AT&T') // 'AT&amp;T'
 *   encodeFactory('numbers')('AT&T') // 'ATT&#x26;T'
 *
 * @param {string} type - Either `'true'`, `'false'`, or
 *   `'numbers'`.
 * @return {function(string): string} - Function which
 *   takes a value and returns its encoded version.
 */
function encodeFactory(type) {
    var options = {};

    if (type === 'false') {
        return encodeNoop;
    }

    if (type === 'true') {
        options.useNamedReferences = true;
    }

    if (type === 'escape') {
        options.escapeOnly = options.useNamedReferences = true;
    }

    /**
     * Encode HTML entities using the bound options.
     *
     * @example
     *   // When `type` is `'true'`.
     *   encode('AT&T'); // 'AT&amp;T'
     *
     *   // When `type` is `'numbers'`.
     *   encode('AT&T'); // 'ATT&#x26;T'
     *
     * @param {string} value - Content.
     * @param {Object} [node] - Node which is compiled.
     * @return {string} - Encoded content.
     */
    function encoder(value) {
        return encode(value, options);
    }

    return encoder;
}

/**
 * Returns the length of HTML entity that is a prefix of
 * the given string (excluding the ampersand), 0 if it
 * does not start with an entity.
 *
 * @example
 *   entityPrefixLength('&copycat') // 4
 *   entityPrefixLength('&foo &amp &bar') // 0
 *
 * @param {string} value - Input string.
 * @return {number} - Length of an entity.
 */
function entityPrefixLength(value) {
    var prefix;

    /* istanbul ignore if - Currently also tested for at
     * implemention, but we keep it here because that’s
     * proper. */
    if (value.charAt(0) !== AMPERSAND) {
        return 0;
    }

    prefix = value.split(AMPERSAND, 2).join(AMPERSAND);

    return prefix.length - decode(prefix).length;
}

/**
 * Checks if a string starts with HTML entity.
 *
 * @example
 *   startsWithEntity('&copycat') // true
 *   startsWithEntity('&foo &amp &bar') // false
 *
 * @param {string} value - Value to check.
 * @return {number} - Whether `value` starts an entity.
 */
function startsWithEntity(value) {
    return entityPrefixLength(value) > 0;
}

/**
 * Check if `character` is a valid alignment row character.
 *
 * @example
 *   isAlignmentRowCharacter(':') // true
 *   isAlignmentRowCharacter('=') // false
 *
 * @param {string} character - Character to check.
 * @return {boolean} - Whether `character` is a valid
 *   alignment row character.
 */
function isAlignmentRowCharacter(character) {
    return character === COLON ||
        character === DASH ||
        character === SPACE ||
        character === PIPE;
}

/**
 * Check if `index` in `value` is inside an alignment row.
 *
 * @example
 *   isInAlignmentRow(':--:', 2) // true
 *   isInAlignmentRow(':--:\n:-*-:', 9) // false
 *
 * @param {string} value - Value to check.
 * @param {number} index - Position in `value` to check.
 * @return {boolean} - Whether `index` in `value` is in
 *   an alignment row.
 */
function isInAlignmentRow(value, index) {
    var length = value.length;
    var start = index;
    var character;

    while (++index < length) {
        character = value.charAt(index);

        if (character === LINE) {
            break;
        }

        if (!isAlignmentRowCharacter(character)) {
            return false;
        }
    }

    index = start;

    while (--index > -1) {
        character = value.charAt(index);

        if (character === LINE) {
            break;
        }

        if (!isAlignmentRowCharacter(character)) {
            return false;
        }
    }

    return true;
}

/**
 * Factory to escape characters.
 *
 * @example
 *   var escape = escapeFactory({ commonmark: true });
 *   escape('x*x', { type: 'text', value: 'x*x' }) // 'x\\*x'
 *
 * @param {Object} options - Compiler options.
 * @return {function(value, node, parent): string} - Function which
 *   takes a value and a node and (optionally) its parent and returns
 *   its escaped value.
 */
function escapeFactory(options) {
    /**
     * Escape punctuation characters in a node's value.
     *
     * @param {string} value - Value to escape.
     * @param {Object} node - Node in which `value` exists.
     * @param {Object} [parent] - Parent of `node`.
     * @return {string} - Escaped `value`.
     */
    return function escape(value, node, parent) {
        var self = this;
        var gfm = options.gfm;
        var commonmark = options.commonmark;
        var pedantic = options.pedantic;
        var siblings = parent && parent.children;
        var index = siblings && siblings.indexOf(node);
        var prev = siblings && siblings[index - 1];
        var next = siblings && siblings[index + 1];
        var length = value.length;
        var position = -1;
        var queue = [];
        var escaped = queue;
        var afterNewLine;
        var character;
        var wordCharBefore;
        var wordCharAfter;
        var offset;

        if (prev) {
            afterNewLine = prev.type === 'text' && /\n\s*$/.test(prev.value);
        } else if (parent) {
            afterNewLine = parent.type === 'paragraph';
        }

        while (++position < length) {
            character = value.charAt(position);

            if (
                character === BACKSLASH ||
                character === TICK ||
                character === ASTERISK ||
                character === SQUARE_BRACKET_OPEN ||
                (
                    character === UNDERSCORE &&
                    /*
                     * Delegate leading/trailing underscores
                     * to the multinode version below.
                     */
                    0 < position &&
                    position < length - 1 &&
                    (
                        pedantic ||
                        !isAlphanumeric(value.charAt(position - 1)) ||
                        !isAlphanumeric(value.charAt(position + 1))
                    )
                ) ||
                (self.inLink && character === SQUARE_BRACKET_CLOSE) ||
                (
                    gfm &&
                    character === PIPE &&
                    (
                        self.inTable ||
                        isInAlignmentRow(value, position)
                    )
                )
            ) {
                afterNewLine = false;
                queue.push(BACKSLASH);
            } else if (character === ANGLE_BRACKET_OPEN) {
                afterNewLine = false;

                if (commonmark) {
                    queue.push(BACKSLASH);
                } else {
                    queue.push(ENTITY_ANGLE_BRACKET_OPEN);
                    continue;
                }
            } else if (
                gfm &&
                !self.inLink &&
                character === COLON &&
                (
                    queue.slice(-6).join(EMPTY) === 'mailto' ||
                    queue.slice(-5).join(EMPTY) === 'https' ||
                    queue.slice(-4).join(EMPTY) === 'http'
                )
            ) {
                afterNewLine = false;

                if (commonmark) {
                    queue.push(BACKSLASH);
                } else {
                    queue.push(ENTITY_COLON);
                    continue;
                }
            /* istanbul ignore if - Impossible to test with
             * the current set-up.  We need tests which try
             * to force markdown content into the tree. */
            } else if (
                character === AMPERSAND &&
                startsWithEntity(value.slice(position))
            ) {
                afterNewLine = false;

                if (commonmark) {
                    queue.push(BACKSLASH);
                } else {
                    queue.push(ENTITY_AMPERSAND);
                    continue;
                }
            } else if (
                gfm &&
                character === TILDE &&
                value.charAt(position + 1) === TILDE
            ) {
                queue.push(BACKSLASH, TILDE);
                afterNewLine = false;
                position += 1;
            } else if (character === LINE) {
                afterNewLine = true;
            } else if (afterNewLine) {
                if (
                    character === ANGLE_BRACKET_CLOSE ||
                    character === HASH ||
                    LIST_BULLETS[character]
                ) {
                    queue.push(BACKSLASH);
                    afterNewLine = false;
                } else if (isNumeric(character)) {
                    offset = position + 1;

                    while (offset < length) {
                        if (!isNumeric(value.charAt(offset))) {
                            break;
                        }

                        offset++;
                    }

                    if (
                        value.charAt(offset) === DOT ||
                        (
                            commonmark &&
                            /* istanbul ignore next - hard to test :( */
                            value.charAt(offset) === PARENTHESIS_CLOSE
                        )
                    ) {
                        queue.push(value.slice(position, offset), BACKSLASH);
                        position = offset;
                        character = value.charAt(position);
                    }

                    afterNewLine = false;
                } else if (
                    character !== SPACE &&
                    character !== TAB &&
                    character !== CARRIAGE &&
                    character !== VERTICAL_TAB &&
                    character !== FORM_FEED
                ) {
                    afterNewLine = false;
                }
            }

            queue.push(character);
        }

        /*
         * Multi-node versions.
         */

        if (siblings && node.type === 'text') {
            /*
             * Check for an opening parentheses after a
             * link-reference (which can be joined by
             * white-space).
             */

            if (
                prev &&
                prev.referenceType === 'shortcut'
            ) {
                position = -1;
                length = escaped.length;

                while (++position < length) {
                    character = escaped[position];

                    if (character === SPACE || character === TAB) {
                        continue;
                    }

                    if (character === PARENTHESIS_OPEN) {
                        escaped[position] = BACKSLASH + character;
                    }

                    if (character === COLON) {
                        if (commonmark) {
                            escaped[position] = BACKSLASH + character;
                        } else {
                            escaped[position] = ENTITY_COLON;
                        }
                    }

                    break;
                }

                /*
                 * If the current node is all spaces / tabs,
                 * preceded by a shortcut, and followed by
                 * a text starting with `(`, escape it.
                 */

                if (
                    next &&
                    position === length &&
                    next.type === 'text' &&
                    next.value.charAt(0) === PARENTHESIS_OPEN
                ) {
                    escaped.push(BACKSLASH);
                }
            }

            /*
             * Ensure non-auto-links are not seen as links.
             * This pattern needs to check the preceding
             * nodes too.
             */

            if (
                gfm &&
                !self.inLink &&
                prev &&
                prev.type === 'text' &&
                value.charAt(0) === COLON
            ) {
                queue = prev.value.slice(-6);

                if (
                    queue === 'mailto' ||
                    queue.slice(-5) === 'https' ||
                    queue.slice(-4) === 'http'
                ) {
                    if (commonmark) {
                        escaped.unshift(BACKSLASH);
                    } else {
                        escaped.splice(0, 1, ENTITY_COLON);
                    }
                }
            }

            /*
             * Escape ampersand if it would otherwise
             * start an entity.
             */

            if (
                next &&
                next.type === 'text' &&
                value.slice(-1) === AMPERSAND &&
                startsWithEntity(AMPERSAND + next.value)
            ) {
                if (commonmark) {
                    escaped.splice(escaped.length - 1, 0, BACKSLASH);
                } else {
                    escaped.push('amp', SEMICOLON);
                }
            }

            /*
             * Escape double tildes in GFM.
             */

            if (
                gfm &&
                next &&
                next.type === 'text' &&
                value.slice(-1) === TILDE &&
                next.value.charAt(0) === TILDE
            ) {
                escaped.splice(escaped.length - 1, 0, BACKSLASH);
            }

            /*
             * Escape underscores, but not mid-word (unless
             * in pedantic mode).
             */

            wordCharBefore = prev &&
                prev.type === 'text' &&
                isAlphanumeric(prev.value.slice(-1))

            wordCharAfter = next &&
                next.type === 'text' &&
                isAlphanumeric(next.value.charAt(0))

            if (length <= 1) {
                if (
                    value === UNDERSCORE &&
                    (
                        pedantic ||
                        !wordCharBefore ||
                        !wordCharAfter
                    )
                ) {
                    escaped.unshift(BACKSLASH);
                }
            } else {
                if (
                    value.charAt(0) === UNDERSCORE &&
                    (
                        pedantic ||
                        !wordCharBefore ||
                        /* istanbul ignore next - only for trees */
                        !isAlphanumeric(value.charAt(1))
                    )
                ) {
                    escaped.unshift(BACKSLASH);
                }

                if (
                    value.slice(-1) === UNDERSCORE &&
                    (
                        pedantic ||
                        !wordCharAfter ||
                        /* istanbul ignore next - only for trees */
                        !isAlphanumeric(value.slice(-2).charAt(0))
                    )
                ) {
                    escaped.splice(escaped.length - 1, 0, BACKSLASH);
                }
            }
        }

        return escaped.join(EMPTY);
    };
}

/**
 * Wrap `url` in angle brackets when needed, or when
 * forced.
 *
 * In links, images, and definitions, the URL part needs
 * to be enclosed when it:
 *
 * - has a length of `0`;
 * - contains white-space;
 * - has more or less opening than closing parentheses.
 *
 * @example
 *   encloseURI('foo bar') // '<foo bar>'
 *   encloseURI('foo(bar(baz)') // '<foo(bar(baz)>'
 *   encloseURI('') // '<>'
 *   encloseURI('example.com') // 'example.com'
 *   encloseURI('example.com', true) // '<example.com>'
 *
 * @param {string} uri - URI to enclose.
 * @param {boolean?} [always] - Force enclosing.
 * @return {boolean} - Properly enclosed `uri`.
 */
function encloseURI(uri, always) {
    if (
        always ||
        !uri.length ||
        EXPRESSIONS_WHITE_SPACE.test(uri) ||
        ccount(uri, PARENTHESIS_OPEN) !== ccount(uri, PARENTHESIS_CLOSE)
    ) {
        return ANGLE_BRACKET_OPEN + uri + ANGLE_BRACKET_CLOSE;
    }

    return uri;
}

/**
 * There is currently no way to support nested delimiters
 * across Markdown.pl, CommonMark, and GitHub (RedCarpet).
 * The following code supports Markdown.pl and GitHub.
 * CommonMark is not supported when mixing double- and
 * single quotes inside a title.
 *
 * @see https://github.com/vmg/redcarpet/issues/473
 * @see https://github.com/jgm/CommonMark/issues/308
 *
 * @example
 *   encloseTitle('foo') // '"foo"'
 *   encloseTitle('foo \'bar\' baz') // '"foo \'bar\' baz"'
 *   encloseTitle('foo "bar" baz') // '\'foo "bar" baz\''
 *   encloseTitle('foo "bar" \'baz\'') // '"foo "bar" \'baz\'"'
 *
 * @param {string} title - Content.
 * @return {string} - Properly enclosed title.
 */
function encloseTitle(title) {
    var delimiter = QUOTE_DOUBLE;

    if (title.indexOf(delimiter) !== -1) {
        delimiter = QUOTE_SINGLE;
    }

    return delimiter + title + delimiter;
}

/**
 * Pad `value` with `level * INDENT` spaces.  Respects
 * lines. Ignores empty lines.
 *
 * @example
 *   pad('foo', 1) // '    foo'
 *
 * @param {string} value - Content.
 * @param {number} level - Indentation level.
 * @return {string} - Padded `value`.
 */
function pad(value, level) {
    var index;
    var padding;

    value = value.split(LINE);

    index = value.length;
    padding = repeat(SPACE, level * INDENT);

    while (index--) {
        if (value[index].length !== 0) {
            value[index] = padding + value[index];
        }
    }

    return value.join(LINE);
}

/**
 * Construct a new compiler.
 *
 * @example
 *   var compiler = new Compiler(new File('> foo.'));
 *
 * @constructor
 * @class {Compiler}
 * @param {File} file - Virtual file.
 * @param {Object?} [options] - Passed to
 *   `Compiler#setOptions()`.
 */
function Compiler(file, options) {
    var self = this;

    self.file = file;

    self.options = extend({}, self.options);

    self.setOptions(options);
}

/*
 * Cache prototype.
 */

var compilerPrototype = Compiler.prototype;

/*
 * Expose defaults.
 */

compilerPrototype.options = defaultOptions;

/*
 * Expose visitors.
 */

var visitors = compilerPrototype.visitors = {};

/*
 * Map of applicable enum's.
 */

var maps = {
    'entities': ENTITY_OPTIONS,
    'bullet': LIST_BULLETS,
    'rule': THEMATIC_BREAK_BULLETS,
    'listItemIndent': LIST_ITEM_INDENTS,
    'emphasis': EMPHASIS_MARKERS,
    'strong': EMPHASIS_MARKERS,
    'fence': FENCE_MARKERS
};

/**
 * Set options.  Does not overwrite previously set
 * options.
 *
 * @example
 *   var compiler = new Compiler();
 *   compiler.setOptions({bullet: '*'});
 *
 * @this {Compiler}
 * @throws {Error} - When an option is invalid.
 * @param {Object?} [options] - Stringify settings.
 * @return {Compiler} - `self`.
 */
compilerPrototype.setOptions = function (options) {
    var self = this;
    var current = self.options;
    var ruleRepetition;
    var key;

    if (options === null || options === undefined) {
        options = {};
    } else if (typeof options === 'object') {
        options = extend({}, options);
    } else {
        throw new Error(
            'Invalid value `' + options + '` ' +
            'for setting `options`'
        );
    }

    for (key in defaultOptions) {
        validate[typeof current[key]](
            options, key, current[key], maps[key]
        );
    }

    ruleRepetition = options.ruleRepetition;

    if (ruleRepetition && ruleRepetition < MINIMUM_RULE_LENGTH) {
        raise(ruleRepetition, 'options.ruleRepetition');
    }

    self.encode = encodeFactory(String(options.entities));
    self.escape = escapeFactory(options);

    self.options = options;

    return self;
};

/*
 * Enter and exit helpers.
 */

compilerPrototype.enterLink = toggler('inLink', false);
compilerPrototype.enterTable = toggler('inTable', false);

/**
 * Shortcut and collapsed link references need no escaping
 * and encoding during the processing of child nodes (it
 * must be implied from identifier).
 *
 * This toggler turns encoding and escaping off for shortcut
 * and collapsed references.
 *
 * Implies `enterLink`.
 *
 * @param {Compiler} compiler - Compiler instance.
 * @param {LinkReference} node - LinkReference node.
 * @return {Function} - Exit state.
 */
compilerPrototype.enterLinkReference = function (compiler, node) {
    var encode = compiler.encode;
    var escape = compiler.escape;
    var exitLink = compiler.enterLink();

    if (
        node.referenceType === 'shortcut' ||
        node.referenceType === 'collapsed'
    ) {
        compiler.encode = compiler.escape = encodeNoop;
        return function () {
            compiler.encode = encode;
            compiler.escape = escape;
            exitLink();
        };
    } else {
        return exitLink;
    }
};

/**
 * Visit a node.
 *
 * @example
 *   var compiler = new Compiler();
 *
 *   compiler.visit({
 *     type: 'strong',
 *     children: [{
 *       type: 'text',
 *       value: 'Foo'
 *     }]
 *   });
 *   // '**Foo**'
 *
 * @param {Object} node - Node.
 * @param {Object?} [parent] - `node`s parent.
 * @return {string} - Compiled `node`.
 */
compilerPrototype.visit = function (node, parent) {
    var self = this;

    /*
     * Fail on unknown nodes.
     */

    if (typeof self.visitors[node.type] !== 'function') {
        self.file.fail(
            'Missing compiler for node of type `' +
            node.type + '`: `' + node + '`',
            node
        );
    }

    return self.visitors[node.type].call(self, node, parent);
};

/**
 * Visit all children of `parent`.
 *
 * @example
 *   var compiler = new Compiler();
 *
 *   compiler.all({
 *     type: 'strong',
 *     children: [{
 *       type: 'text',
 *       value: 'Foo'
 *     },
 *     {
 *       type: 'text',
 *       value: 'Bar'
 *     }]
 *   });
 *   // ['Foo', 'Bar']
 *
 * @param {Object} parent - Parent node of children.
 * @return {Array.<string>} - List of compiled children.
 */
compilerPrototype.all = function (parent) {
    var self = this;
    var children = parent.children;
    var values = [];
    var results = [];
    var length = children.length;
    var index = 0;
    var node = children[0];
    var next;

    if (!length) {
        return values;
    }

    length++;

    while (++index < length) {
        next = children[index];

        if (
            next &&
            node.type === 'text' &&
            node.type === next.type &&
            mergeable(node) &&
            mergeable(next)
        ) {
            node.value += next.value;
        } else {
            values.push(node);
            node = next;
        }
    }

    index = -1;
    length = values.length;
    parent.children = values;

    while (++index < length) {
        results[index] = self.visit(values[index], parent);
    }

    return results;
};

/**
 * Visit ordered list items.
 *
 * Starts the list with
 * `node.start` and increments each following list item
 * bullet by one:
 *
 *     2. foo
 *     3. bar
 *
 * In `incrementListMarker: false` mode, does not increment
 * each marker and stays on `node.start`:
 *
 *     1. foo
 *     1. bar
 *
 * Adds an extra line after an item if it has
 * `loose: true`.
 *
 * @example
 *   var compiler = new Compiler();
 *
 *   compiler.visitOrderedItems({
 *     type: 'list',
 *     ordered: true,
 *     children: [{
 *       type: 'listItem',
 *       children: [{
 *         type: 'text',
 *         value: 'bar'
 *       }]
 *     }]
 *   });
 *   // '1.  bar'
 *
 * @param {Object} node - `list` node with
 *   `ordered: true`.
 * @return {string} - Markdown list.
 */
compilerPrototype.visitOrderedItems = function (node) {
    var self = this;
    var increment = self.options.incrementListMarker;
    var values = [];
    var start = node.start;
    var children = node.children;
    var length = children.length;
    var index = -1;
    var bullet;
    var fn = self.visitors.listItem;

    while (++index < length) {
        bullet = (increment ? start + index : start) + DOT;
        values[index] = fn.call(self, children[index], node, index, bullet);
    }

    return values.join(LINE);
};

/**
 * Visit unordered list items.
 *
 * Uses `options.bullet` as each item's bullet.
 *
 * Adds an extra line after an item if it has
 * `loose: true`.
 *
 * @example
 *   var compiler = new Compiler();
 *
 *   compiler.visitUnorderedItems({
 *     type: 'list',
 *     ordered: false,
 *     children: [{
 *       type: 'listItem',
 *       children: [{
 *         type: 'text',
 *         value: 'bar'
 *       }]
 *     }]
 *   });
 *   // '-   bar'
 *
 * @param {Object} node - `list` node with
 *   `ordered: false`.
 * @return {string} - Markdown list.
 */
compilerPrototype.visitUnorderedItems = function (node) {
    var self = this;
    var values = [];
    var children = node.children;
    var length = children.length;
    var index = -1;
    var bullet = self.options.bullet;
    var fn = self.visitors.listItem;

    while (++index < length) {
        values[index] = fn.call(self, children[index], node, index, bullet);
    }

    return values.join(LINE);
};

/**
 * Stringify a block node with block children (e.g., `root`
 * or `blockquote`).
 *
 * Knows about code following a list, or adjacent lists
 * with similar bullets, and places an extra newline
 * between them.
 *
 * @example
 *   var compiler = new Compiler();
 *
 *   compiler.block({
 *     type: 'root',
 *     children: [{
 *       type: 'paragraph',
 *       children: [{
 *         type: 'text',
 *         value: 'bar'
 *       }]
 *     }]
 *   });
 *   // 'bar'
 *
 * @param {Object} node - `root` node.
 * @return {string} - Markdown block content.
 */
compilerPrototype.block = function (node) {
    var self = this;
    var values = [];
    var children = node.children;
    var length = children.length;
    var index = -1;
    var child;
    var prev;

    while (++index < length) {
        child = children[index];

        if (prev) {
            /*
             * Duplicate nodes, such as a list
             * directly following another list,
             * often need multiple new lines.
             *
             * Additionally, code blocks following a list
             * might easily be mistaken for a paragraph
             * in the list itself.
             */

            if (child.type === prev.type && prev.type === 'list') {
                values.push(prev.ordered === child.ordered ? GAP : BREAK);
            } else if (
                prev.type === 'list' &&
                child.type === 'code' &&
                !child.lang
            ) {
                values.push(GAP);
            } else {
                values.push(BREAK);
            }
        }

        values.push(self.visit(child, node));

        prev = child;
    }

    return values.join(EMPTY);
};

/**
 * Stringify a root.
 *
 * Adds a final newline to ensure valid POSIX files.
 *
 * @example
 *   var compiler = new Compiler();
 *
 *   compiler.root({
 *     type: 'root',
 *     children: [{
 *       type: 'paragraph',
 *       children: [{
 *         type: 'text',
 *         value: 'bar'
 *       }]
 *     }]
 *   });
 *   // 'bar'
 *
 * @param {Object} node - `root` node.
 * @return {string} - Markdown document.
 */
visitors.root = function (node) {
    return this.block(node) + LINE;
};

/**
 * Stringify a heading.
 *
 * In `setext: true` mode and when `depth` is smaller than
 * three, creates a setext header:
 *
 *     Foo
 *     ===
 *
 * Otherwise, an ATX header is generated:
 *
 *     ### Foo
 *
 * In `closeAtx: true` mode, the header is closed with
 * hashes:
 *
 *     ### Foo ###
 *
 * @example
 *   var compiler = new Compiler();
 *
 *   compiler.heading({
 *     type: 'heading',
 *     depth: 2,
 *     children: [{
 *       type: 'strong',
 *       children: [{
 *         type: 'text',
 *         value: 'bar'
 *       }]
 *     }]
 *   });
 *   // '## **bar**'
 *
 * @param {Object} node - `heading` node.
 * @return {string} - Markdown heading.
 */
visitors.heading = function (node) {
    var self = this;
    var setext = self.options.setext;
    var closeAtx = self.options.closeAtx;
    var depth = node.depth;
    var content = self.all(node).join(EMPTY);
    var prefix;

    if (setext && depth < 3) {
        return content + LINE +
            repeat(depth === 1 ? EQUALS : DASH, content.length);
    }

    prefix = repeat(HASH, node.depth);
    content = prefix + SPACE + content;

    if (closeAtx) {
        content += SPACE + prefix;
    }

    return content;
};

/**
 * Stringify text.
 *
 * Supports named entities in `settings.encode: true` mode:
 *
 *     AT&amp;T
 *
 * Supports numbered entities in `settings.encode: numbers`
 * mode:
 *
 *     AT&#x26;T
 *
 * @example
 *   var compiler = new Compiler();
 *
 *   compiler.text({
 *     type: 'text',
 *     value: 'foo'
 *   });
 *   // 'foo'
 *
 * @param {Object} node - `text` node.
 * @param {Object} parent - Parent of `node`.
 * @return {string} - Raw markdown text.
 */
visitors.text = function (node, parent) {
    return this.encode(this.escape(node.value, node, parent), node);
};

/**
 * Stringify a paragraph.
 *
 * @example
 *   var compiler = new Compiler();
 *
 *   compiler.paragraph({
 *     type: 'paragraph',
 *     children: [{
 *       type: 'strong',
 *       children: [{
 *         type: 'text',
 *         value: 'bar'
 *       }]
 *     }]
 *   });
 *   // '**bar**'
 *
 * @param {Object} node - `paragraph` node.
 * @return {string} - Markdown paragraph.
 */
visitors.paragraph = function (node) {
    return this.all(node).join(EMPTY);
};

/**
 * Stringify a block quote.
 *
 * @example
 *   var compiler = new Compiler();
 *
 *   compiler.paragraph({
 *     type: 'blockquote',
 *     children: [{
 *       type: 'paragraph',
 *       children: [{
 *         type: 'strong',
 *         children: [{
 *           type: 'text',
 *           value: 'bar'
 *         }]
 *       }]
 *     }]
 *   });
 *   // '> **bar**'
 *
 * @param {Object} node - `blockquote` node.
 * @return {string} - Markdown block quote.
 */
visitors.blockquote = function (node) {
    var values = this.block(node).split(LINE);
    var result = [];
    var length = values.length;
    var index = -1;
    var value;

    while (++index < length) {
        value = values[index];
        result[index] = (value ? SPACE : EMPTY) + value;
    }

    return ANGLE_BRACKET_CLOSE + result.join(LINE + ANGLE_BRACKET_CLOSE);
};

/**
 * Stringify a list. See `Compiler#visitOrderedList()` and
 * `Compiler#visitUnorderedList()` for internal working.
 *
 * @example
 *   var compiler = new Compiler();
 *
 *   compiler.visitUnorderedItems({
 *     type: 'list',
 *     ordered: false,
 *     children: [{
 *       type: 'listItem',
 *       children: [{
 *         type: 'text',
 *         value: 'bar'
 *       }]
 *     }]
 *   });
 *   // '-   bar'
 *
 * @param {Object} node - `list` node.
 * @return {string} - Markdown list.
 */
visitors.list = function (node) {
    return this[ORDERED_MAP[node.ordered]](node);
};

/**
 * Stringify a list item.
 *
 * Prefixes the content with a checked checkbox when
 * `checked: true`:
 *
 *     [x] foo
 *
 * Prefixes the content with an unchecked checkbox when
 * `checked: false`:
 *
 *     [ ] foo
 *
 * @example
 *   var compiler = new Compiler();
 *
 *   compiler.listItem({
 *     type: 'listItem',
 *     checked: true,
 *     children: [{
 *       type: 'text',
 *       value: 'bar'
 *     }]
 *   }, {
 *     type: 'list',
 *     ordered: false,
 *     children: [{
 *       type: 'listItem',
 *       checked: true,
 *       children: [{
 *         type: 'text',
 *         value: 'bar'
 *       }]
 *     }]
 *   }, 0, '*');
 *   '-   [x] bar'
 *
 * @param {Object} node - `listItem` node.
 * @param {Object} parent - `list` node.
 * @param {number} position - Index of `node` in `parent`.
 * @param {string} bullet - Bullet to use.  This, and the
 *   `listItemIndent` setting define the used indent.
 * @return {string} - Markdown list item.
 */
visitors.listItem = function (node, parent, position, bullet) {
    var self = this;
    var style = self.options.listItemIndent;
    var children = node.children;
    var values = [];
    var index = -1;
    var length = children.length;
    var loose = node.loose;
    var value;
    var indent;
    var spacing;

    while (++index < length) {
        values[index] = self.visit(children[index], node);
    }

    value = CHECKBOX_MAP[node.checked] + values.join(loose ? BREAK : LINE);

    if (
        style === LIST_ITEM_ONE ||
        (style === LIST_ITEM_MIXED && value.indexOf(LINE) === -1)
    ) {
        indent = bullet.length + 1;
        spacing = SPACE;
    } else {
        indent = Math.ceil((bullet.length + 1) / INDENT) * INDENT;
        spacing = repeat(SPACE, indent - bullet.length);
    }

    value = bullet + spacing + pad(value, indent / INDENT).slice(indent);

    if (loose && parent.children.length - 1 !== position) {
        value += LINE;
    }

    return value;
};

/**
 * Stringify inline code.
 *
 * Knows about internal ticks (`\``), and ensures one more
 * tick is used to enclose the inline code:
 *
 *     ```foo ``bar`` baz```
 *
 * Even knows about inital and final ticks:
 *
 *     `` `foo ``
 *     `` foo` ``
 *
 * @example
 *   var compiler = new Compiler();
 *
 *   compiler.inlineCode({
 *     type: 'inlineCode',
 *     value: 'foo(); `bar`; baz()'
 *   });
 *   // '``foo(); `bar`; baz()``'
 *
 * @param {Object} node - `inlineCode` node.
 * @return {string} - Markdown inline code.
 */
visitors.inlineCode = function (node) {
    var value = node.value;
    var ticks = repeat(TICK, longestStreak(value, TICK) + 1);
    var start = ticks;
    var end = ticks;

    if (value.charAt(0) === TICK) {
        start += SPACE;
    }

    if (value.charAt(value.length - 1) === TICK) {
        end = SPACE + end;
    }

    return start + node.value + end;
};

/**
 * Stringify YAML front matter.
 *
 * @example
 *   var compiler = new Compiler();
 *
 *   compiler.yaml({
 *     type: 'yaml',
 *     value: 'foo: bar'
 *   });
 *   // '---\nfoo: bar\n---'
 *
 * @param {Object} node - `yaml` node.
 * @return {string} - Markdown YAML document.
 */
visitors.yaml = function (node) {
    var delimiter = repeat(DASH, YAML_FENCE_LENGTH);
    var value = node.value ? LINE + node.value : EMPTY;

    return delimiter + value + LINE + delimiter;
};

/**
 * Stringify a code block.
 *
 * Creates indented code when:
 *
 * - No language tag exists;
 * - Not in `fences: true` mode;
 * - A non-empty value exists.
 *
 * Otherwise, GFM fenced code is created:
 *
 *     ```js
 *     foo();
 *     ```
 *
 * When in ``fence: `~` `` mode, uses tildes as fences:
 *
 *     ~~~js
 *     foo();
 *     ~~~
 *
 * Knows about internal fences (Note: GitHub/Kramdown does
 * not support this):
 *
 *     ````javascript
 *     ```markdown
 *     foo
 *     ```
 *     ````
 *
 * Supports named entities in the language flag with
 * `settings.encode` mode.
 *
 * @example
 *   var compiler = new Compiler();
 *
 *   compiler.code({
 *     type: 'code',
 *     lang: 'js',
 *     value: 'fooo();'
 *   });
 *   // '```js\nfooo();\n```'
 *
 * @param {Object} node - `code` node.
 * @param {Object} parent - Parent of `node`.
 * @return {string} - Markdown code block.
 */
visitors.code = function (node, parent) {
    var self = this;
    var value = node.value;
    var options = self.options;
    var marker = options.fence;
    var language = self.encode(node.lang || EMPTY, node);
    var fence;

    /*
     * Without (needed) fences.
     */

    if (!language && !options.fences && value) {
        /*
         * Throw when pedantic, in a list item which
         * isn’t compiled using a tab.
         */

        if (
            parent &&
            parent.type === 'listItem' &&
            options.listItemIndent !== LIST_ITEM_TAB &&
            options.pedantic
        ) {
            self.file.fail(ERROR_LIST_ITEM_INDENT, node.position);
        }

        return pad(value, 1);
    }

    fence = longestStreak(value, marker) + 1;

    /*
     * Fix GFM / RedCarpet bug, where fence-like characters
     * inside fenced code can exit a code-block.
     * Yes, even when the outer fence uses different
     * characters, or is longer.
     * Thus, we can only pad the code to make it work.
     */

    if (FENCE.test(value)) {
        value = pad(value, 1);
    }

    fence = repeat(marker, Math.max(fence, MINIMUM_CODE_FENCE_LENGTH));

    return fence + language + LINE + value + LINE + fence;
};

/**
 * Stringify HTML.
 *
 * @example
 *   var compiler = new Compiler();
 *
 *   compiler.html({
 *     type: 'html',
 *     value: '<div>bar</div>'
 *   });
 *   // '<div>bar</div>'
 *
 * @param {Object} node - `html` node.
 * @return {string} - Markdown HTML.
 */
visitors.html = function (node) {
    return node.value;
};

/**
 * Stringify a horizontal rule.
 *
 * The character used is configurable by `rule`: (`'_'`)
 *
 *     ___
 *
 * The number of repititions is defined through
 * `ruleRepetition`: (`6`)
 *
 *     ******
 *
 * Whether spaces delimit each character, is configured
 * through `ruleSpaces`: (`true`)
 *
 *     * * *
 *
 * @example
 *   var compiler = new Compiler();
 *
 *   compiler.thematicBreak({
 *     type: 'thematicBreak'
 *   });
 *   // '***'
 *
 * @return {string} - Markdown rule.
 */
visitors.thematicBreak = function () {
    var options = this.options;
    var rule = repeat(options.rule, options.ruleRepetition);

    if (options.ruleSpaces) {
        rule = rule.split(EMPTY).join(SPACE);
    }

    return rule;
};

/**
 * Stringify a strong.
 *
 * The marker used is configurable by `strong`, which
 * defaults to an asterisk (`'*'`) but also accepts an
 * underscore (`'_'`):
 *
 *     _foo_
 *
 * @example
 *   var compiler = new Compiler();
 *
 *   compiler.strong({
 *     type: 'strong',
 *     children: [{
 *       type: 'text',
 *       value: 'Foo'
 *     }]
 *   });
 *   // '**Foo**'
 *
 * @param {Object} node - `strong` node.
 * @return {string} - Markdown strong-emphasised text.
 */
visitors.strong = function (node) {
    var marker = this.options.strong;

    marker = marker + marker;

    return marker + this.all(node).join(EMPTY) + marker;
};

/**
 * Stringify an emphasis.
 *
 * The marker used is configurable by `emphasis`, which
 * defaults to an underscore (`'_'`) but also accepts an
 * asterisk (`'*'`):
 *
 *     *foo*
 *
 * @example
 *   var compiler = new Compiler();
 *
 *   compiler.emphasis({
 *     type: 'emphasis',
 *     children: [{
 *       type: 'text',
 *       value: 'Foo'
 *     }]
 *   });
 *   // '_Foo_'
 *
 * @param {Object} node - `emphasis` node.
 * @return {string} - Markdown emphasised text.
 */
visitors.emphasis = function (node) {
    var marker = this.options.emphasis;

    return marker + this.all(node).join(EMPTY) + marker;
};

/**
 * Stringify a hard break.
 *
 * In Commonmark mode, trailing backslash form is used in order
 * to preserve trailing whitespace that the line may end with,
 * and also for better visibility.
 *
 * @example
 *   var compiler = new Compiler();
 *
 *   compiler.break({
 *     type: 'break'
 *   });
 *   // '  \n'
 *
 * @return {string} - Hard markdown break.
 */
visitors.break = function () {
    return this.options.commonmark ? BACKSLASH + LINE : SPACE + SPACE + LINE;
};

/**
 * Stringify a delete.
 *
 * @example
 *   var compiler = new Compiler();
 *
 *   compiler.delete({
 *     type: 'delete',
 *     children: [{
 *       type: 'text',
 *       value: 'Foo'
 *     }]
 *   });
 *   // '~~Foo~~'
 *
 * @param {Object} node - `delete` node.
 * @return {string} - Markdown strike-through.
 */
visitors.delete = function (node) {
    return DOUBLE_TILDE + this.all(node).join(EMPTY) + DOUBLE_TILDE;
};

/**
 * Stringify a link.
 *
 * When no title exists, the compiled `children` equal
 * `url`, and `url` starts with a protocol, an auto
 * link is created:
 *
 *     <http://example.com>
 *
 * Otherwise, is smart about enclosing `url` (see
 * `encloseURI()`) and `title` (see `encloseTitle()`).
 *
 *    [foo](<foo at bar dot com> 'An "example" e-mail')
 *
 * Supports named entities in the `url` and `title` when
 * in `settings.encode` mode.
 *
 * @example
 *   var compiler = new Compiler();
 *
 *   compiler.link({
 *     type: 'link',
 *     url: 'http://example.com',
 *     title: 'Example Domain',
 *     children: [{
 *       type: 'text',
 *       value: 'Foo'
 *     }]
 *   });
 *   // '[Foo](http://example.com "Example Domain")'
 *
 * @param {Object} node - `link` node.
 * @return {string} - Markdown link.
 */
visitors.link = function (node) {
    var self = this;
    var url = self.encode(node.url, node);
    var exit = self.enterLink();
    var escapedURL = self.encode(self.escape(node.url, node));
    var value = self.all(node).join(EMPTY);

    exit();

    if (
        node.title === null &&
        PROTOCOL.test(url) &&
        (escapedURL === value || escapedURL === MAILTO + value)
    ) {
        /*
         * Backslash escapes do not work in autolinks,
         * so we do not escape.
         */

        return encloseURI(self.encode(node.url), true);
    }

    url = encloseURI(url);

    if (node.title) {
        url += SPACE + encloseTitle(self.encode(self.escape(
            node.title, node
        ), node));
    }

    value = SQUARE_BRACKET_OPEN + value + SQUARE_BRACKET_CLOSE;

    value += PARENTHESIS_OPEN + url + PARENTHESIS_CLOSE;

    return value;
};

/**
 * Stringify a link label.
 *
 * Because link references are easily, mistakingly,
 * created (for example, `[foo]`), reference nodes have
 * an extra property depicting how it looked in the
 * original document, so stringification can cause minimal
 * changes.
 *
 * @example
 *   label({
 *     type: 'referenceImage',
 *     referenceType: 'full',
 *     identifier: 'foo'
 *   });
 *   // '[foo]'
 *
 *   label({
 *     type: 'referenceImage',
 *     referenceType: 'collapsed',
 *     identifier: 'foo'
 *   });
 *   // '[]'
 *
 *   label({
 *     type: 'referenceImage',
 *     referenceType: 'shortcut',
 *     identifier: 'foo'
 *   });
 *   // ''
 *
 * @param {Object} node - `linkReference` or
 *   `imageReference` node.
 * @return {string} - Markdown label reference.
 */
function label(node) {
    var value = EMPTY;
    var type = node.referenceType;

    if (type === 'full') {
        value = node.identifier;
    }

    if (type !== 'shortcut') {
        value = SQUARE_BRACKET_OPEN + value + SQUARE_BRACKET_CLOSE;
    }

    return value;
}

/**
 * For shortcut and collapsed reference links, the contents
 * is also an identifier, so we need to restore the original
 * encoding and escaping that were present in the source
 * string.
 *
 * This function takes the unescaped & unencoded value from
 * shortcut's child nodes and the identifier and encodes
 * the former according to the latter.
 *
 * @example
 *   copyIdentifierEncoding('a*b', 'a\\*b*c')
 *   // 'a\\*b*c'
 *
 * @param {string} value - Unescaped and unencoded stringified
 *   link value.
 * @param {string} identifier - Link identifier.
 * @return {string} - Encoded link value.
 */
function copyIdentifierEncoding(value, identifier) {
    var index = 0;
    var position = 0;
    var length = value.length;
    var count = identifier.length;
    var result = [];
    var start;

    while (index < length) {
        /*
         * Take next non-punctuation characters from `value`.
         */

        start = index;

        while (
            index < length &&
            !PUNCTUATION.test(value.charAt(index))
        ) {
            index += 1;
        }

        result.push(value.slice(start, index));

        /*
         * Advance `position` to the next punctuation character.
         */
        while (
            position < count &&
            !PUNCTUATION.test(identifier.charAt(position))
        ) {
            position += 1;
        }

        /*
         * Take next punctuation characters from `identifier`.
         */
        start = position;

        while (
            position < count &&
            PUNCTUATION.test(identifier.charAt(position))
        ) {
            if (identifier.charAt(position) === AMPERSAND) {
                position += entityPrefixLength(identifier.slice(position));
            }
            position += 1;
        }

        result.push(identifier.slice(start, position));

        /*
         * Advance `index` to the next non-punctuation character.
         */
        while (index < length && PUNCTUATION.test(value.charAt(index))) {
            index += 1;
        }
    }

    return result.join(EMPTY);
}

/**
 * Stringify a link reference.
 *
 * See `label()` on how reference labels are created.
 *
 * @example
 *   var compiler = new Compiler();
 *
 *   compiler.linkReference({
 *     type: 'linkReference',
 *     referenceType: 'collapsed',
 *     identifier: 'foo',
 *     children: [{
 *       type: 'text',
 *       value: 'Foo'
 *     }]
 *   });
 *   // '[Foo][]'
 *
 * @param {Object} node - `linkReference` node.
 * @return {string} - Markdown link reference.
 */
visitors.linkReference = function (node) {
    var self = this;
    var exitLinkReference = self.enterLinkReference(self, node);
    var value = self.all(node).join(EMPTY);

    exitLinkReference();

    if (
        node.referenceType === 'shortcut' ||
        node.referenceType === 'collapsed'
    ) {
        value = copyIdentifierEncoding(value, node.identifier);
    }

    return SQUARE_BRACKET_OPEN + value + SQUARE_BRACKET_CLOSE + label(node);
};

/**
 * Stringify an image reference.
 *
 * See `label()` on how reference labels are created.
 *
 * Supports named entities in the `alt` when
 * in `settings.encode` mode.
 *
 * @example
 *   var compiler = new Compiler();
 *
 *   compiler.imageReference({
 *     type: 'imageReference',
 *     referenceType: 'full',
 *     identifier: 'foo',
 *     alt: 'Foo'
 *   });
 *   // '![Foo][foo]'
 *
 * @param {Object} node - `imageReference` node.
 * @return {string} - Markdown image reference.
 */
visitors.imageReference = function (node) {
    var alt = this.encode(node.alt, node) || EMPTY;

    return EXCLAMATION_MARK +
        SQUARE_BRACKET_OPEN + alt + SQUARE_BRACKET_CLOSE +
        label(node);
};

/**
 * Stringify a footnote reference.
 *
 * @example
 *   var compiler = new Compiler();
 *
 *   compiler.footnoteReference({
 *     type: 'footnoteReference',
 *     identifier: 'foo'
 *   });
 *   // '[^foo]'
 *
 * @param {Object} node - `footnoteReference` node.
 * @return {string} - Markdown footnote reference.
 */
visitors.footnoteReference = function (node) {
    return SQUARE_BRACKET_OPEN + CARET + node.identifier +
        SQUARE_BRACKET_CLOSE;
};

/**
 * Stringify a link- or image definition.
 *
 * Is smart about enclosing `url` (see `encloseURI()`) and
 * `title` (see `encloseTitle()`).
 *
 *    [foo]: <foo at bar dot com> 'An "example" e-mail'
 *
 * @example
 *   var compiler = new Compiler();
 *
 *   compiler.definition({
 *     type: 'definition',
 *     url: 'http://example.com',
 *     title: 'Example Domain',
 *     identifier: 'foo'
 *   });
 *   // '[foo]: http://example.com "Example Domain"'
 *
 * @param {Object} node - `definition` node.
 * @return {string} - Markdown link- or image definition.
 */
visitors.definition = function (node) {
    var value = SQUARE_BRACKET_OPEN + node.identifier + SQUARE_BRACKET_CLOSE;
    var url = encloseURI(node.url);

    if (node.title) {
        url += SPACE + encloseTitle(node.title);
    }

    return value + COLON + SPACE + url;
};

/**
 * Stringify an image.
 *
 * Is smart about enclosing `url` (see `encloseURI()`) and
 * `title` (see `encloseTitle()`).
 *
 *    ![foo](</fav icon.png> 'My "favourite" icon')
 *
 * Supports named entities in `url`, `alt`, and `title`
 * when in `settings.encode` mode.
 *
 * @example
 *   var compiler = new Compiler();
 *
 *   compiler.image({
 *     type: 'image',
 *     url: 'http://example.png/favicon.png',
 *     title: 'Example Icon',
 *     alt: 'Foo'
 *   });
 *   // '![Foo](http://example.png/favicon.png "Example Icon")'
 *
 * @param {Object} node - `image` node.
 * @return {string} - Markdown image.
 */
visitors.image = function (node) {
    var url = encloseURI(this.encode(node.url, node));
    var value;

    if (node.title) {
        url += SPACE + encloseTitle(this.encode(node.title, node));
    }

    value = EXCLAMATION_MARK +
        SQUARE_BRACKET_OPEN + this.encode(node.alt || EMPTY, node) +
        SQUARE_BRACKET_CLOSE;

    value += PARENTHESIS_OPEN + url + PARENTHESIS_CLOSE;

    return value;
};

/**
 * Stringify a footnote.
 *
 * @example
 *   var compiler = new Compiler();
 *
 *   compiler.footnote({
 *     type: 'footnote',
 *     children: [{
 *       type: 'text',
 *       value: 'Foo'
 *     }]
 *   });
 *   // '[^Foo]'
 *
 * @param {Object} node - `footnote` node.
 * @return {string} - Markdown footnote.
 */
visitors.footnote = function (node) {
    return SQUARE_BRACKET_OPEN + CARET + this.all(node).join(EMPTY) +
        SQUARE_BRACKET_CLOSE;
};

/**
 * Stringify a footnote definition.
 *
 * @example
 *   var compiler = new Compiler();
 *
 *   compiler.footnoteDefinition({
 *     type: 'footnoteDefinition',
 *     identifier: 'foo',
 *     children: [{
 *       type: 'paragraph',
 *       children: [{
 *         type: 'text',
 *         value: 'bar'
 *       }]
 *     }]
 *   });
 *   // '[^foo]: bar'
 *
 * @param {Object} node - `footnoteDefinition` node.
 * @return {string} - Markdown footnote definition.
 */
visitors.footnoteDefinition = function (node) {
    var id = node.identifier.toLowerCase();

    return SQUARE_BRACKET_OPEN + CARET + id +
        SQUARE_BRACKET_CLOSE + COLON + SPACE +
        this.all(node).join(BREAK + repeat(SPACE, INDENT));
};

/**
 * Stringify table.
 *
 * Creates a fenced table by default, but not in
 * `looseTable: true` mode:
 *
 *     Foo | Bar
 *     :-: | ---
 *     Baz | Qux
 *
 * NOTE: Be careful with `looseTable: true` mode, as a
 * loose table inside an indented code block on GitHub
 * renders as an actual table!
 *
 * Creates a spaces table by default, but not in
 * `spacedTable: false`:
 *
 *     |Foo|Bar|
 *     |:-:|---|
 *     |Baz|Qux|
 *
 * @example
 *   var compiler = new Compiler();
 *
 *   compiler.table({
 *     type: 'table',
 *     align: ['center', null],
 *     children: [
 *       {
 *         type: 'tableRow',
 *         children: [
 *           {
 *             type: 'tableCell'
 *             children: [{
 *               type: 'text'
 *               value: 'Foo'
 *             }]
 *           },
 *           {
 *             type: 'tableCell'
 *             children: [{
 *               type: 'text'
 *               value: 'Bar'
 *             }]
 *           }
 *         ]
 *       },
 *       {
 *         type: 'tableRow',
 *         children: [
 *           {
 *             type: 'tableCell'
 *             children: [{
 *               type: 'text'
 *               value: 'Baz'
 *             }]
 *           },
 *           {
 *             type: 'tableCell'
 *             children: [{
 *               type: 'text'
 *               value: 'Qux'
 *             }]
 *           }
 *         ]
 *       }
 *     ]
 *   });
 *   // '| Foo | Bar |\n| :-: | --- |\n| Baz | Qux |'
 *
 * @param {Object} node - `table` node.
 * @return {string} - Markdown table.
 */
visitors.table = function (node) {
    var self = this;
    var loose = self.options.looseTable;
    var spaced = self.options.spacedTable;
    var rows = node.children;
    var index = rows.length;
    var exit = self.enterTable();
    var result = [];
    var start;

    while (index--) {
        result[index] = self.all(rows[index]);
    }

    exit();

    start = loose ? EMPTY : spaced ? PIPE + SPACE : PIPE;

    return table(result, {
        'align': node.align,
        'start': start,
        'end': start.split(EMPTY).reverse().join(EMPTY),
        'delimiter': spaced ? SPACE + PIPE + SPACE : PIPE
    });
};

/**
 * Stringify a table cell.
 *
 * @example
 *   var compiler = new Compiler();
 *
 *   compiler.tableCell({
 *     type: 'tableCell',
 *     children: [{
 *       type: 'text'
 *       value: 'Qux'
 *     }]
 *   });
 *   // 'Qux'
 *
 * @param {Object} node - `tableCell` node.
 * @return {string} - Markdown table cell.
 */
visitors.tableCell = function (node) {
    return this.all(node).join(EMPTY);
};

/**
 * Stringify the bound file.
 *
 * @example
 *   var file = new VFile('__Foo__');
 *
 *   file.namespace('mdast').tree = {
 *     type: 'strong',
 *     children: [{
 *       type: 'text',
 *       value: 'Foo'
 *     }]
 *   });
 *
 *   new Compiler(file).compile();
 *   // '**Foo**'
 *
 * @this {Compiler}
 * @param {Node} node - Syntax tree.
 * @return {string} - Markdown document.
 */
compilerPrototype.compile = function (node) {
    return this.visit(node);
};

/*
 * Expose `stringify` on `module.exports`.
 */

module.exports = Compiler;

},{"./defaults.js":137,"ccount":105,"extend":113,"longest-streak":122,"markdown-table":123,"parse-entities":129,"repeat-string":139,"stringify-entities":141}],137:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015-2016 Titus Wormer
 * @license MIT
 * @module remark:stringify:defaults
 * @fileoverview Default options for `stringify`.
 */

'use strict';

/* eslint-env commonjs */

module.exports = {
    'gfm': true,
    'commonmark': false,
    'pedantic': false,
    'entities': 'false',
    'setext': false,
    'closeAtx': false,
    'looseTable': false,
    'spacedTable': true,
    'incrementListMarker': true,
    'fences': false,
    'fence': '`',
    'bullet': '-',
    'listItemIndent': 'tab',
    'rule': '*',
    'ruleSpaces': true,
    'ruleRepetition': 3,
    'strong': '*',
    'emphasis': '_'
};

},{}],138:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015-2016 Titus Wormer
 * @license MIT
 * @module remark
 * @fileoverview Markdown processor powered by plugins.
 */

'use strict';

/* eslint-env commonjs */

/* Dependencies. */
var unified = require('unified');
var parse = require('remark-parse');
var stringify = require('remark-stringify');

/* Expose. */
module.exports = unified().use(parse).use(stringify).abstract();

},{"remark-parse":130,"remark-stringify":135,"unified":149}],139:[function(require,module,exports){
/*!
 * repeat-string <https://github.com/jonschlinkert/repeat-string>
 *
 * Copyright (c) 2014-2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

/**
 * Results cache
 */

var res = '';
var cache;

/**
 * Expose `repeat`
 */

module.exports = repeat;

/**
 * Repeat the given `string` the specified `number`
 * of times.
 *
 * **Example:**
 *
 * ```js
 * var repeat = require('repeat-string');
 * repeat('A', 5);
 * //=> AAAAA
 * ```
 *
 * @param {String} `string` The string to repeat
 * @param {Number} `number` The number of times to repeat the string
 * @return {String} Repeated string
 * @api public
 */

function repeat(str, num) {
  if (typeof str !== 'string') {
    throw new TypeError('expected a string');
  }

  // cover common, quick use cases
  if (num === 1) return str;
  if (num === 2) return str + str;

  var max = str.length * num;
  if (cache !== str || typeof cache === 'undefined') {
    cache = str;
    res = '';
  } else if (res.length >= max) {
    return res.substr(0, max);
  }

  while (max > res.length && num > 1) {
    if (num & 1) {
      res += str;
    }

    num >>= 1;
    str += str;
  }

  res += str;
  res = res.substr(0, max);
  return res;
}

},{}],140:[function(require,module,exports){
module.exports=[
  "cent",
  "copy",
  "divide",
  "gt",
  "lt",
  "not",
  "para",
  "times"
]

},{}],141:[function(require,module,exports){
'use strict';

var entities = require('character-entities-html4');
var legacy = require('character-entities-legacy');
var has = require('has');
var hexadecimal = require('is-hexadecimal');
var alphanumerical = require('is-alphanumerical');
var dangerous = require('./dangerous.json');

/* Expose. */
module.exports = encode;

encode.escape = escape;

/* List of enforced escapes. */
var escapes = ['"', '\'', '<', '>', '&', '`'];

/* Map of characters to names. */
var characters = construct();

/* Default escapes. */
var EXPRESSION_ESCAPE = toExpression(escapes);

/* Surrogate pairs. */
var EXPRESSION_SURROGATE_PAIR = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;

/* Non-ASCII characters. */
// eslint-disable-next-line no-control-regex
var EXPRESSION_BMP = /[\x01-\t\x0B\f\x0E-\x1F\x7F\x81\x8D\x8F\x90\x9D\xA0-\uFFFF]/g;

/* Encode special characters in `value`. */
function encode(value, options) {
  var settings = options || {};
  var subset = settings.subset;
  var set = subset ? toExpression(subset) : EXPRESSION_ESCAPE;
  var escapeOnly = settings.escapeOnly;
  var omit = settings.omitOptionalSemicolons;

  value = value.replace(set, function (char, pos, val) {
    return one(char, val.charAt(pos + 1), settings);
  });

  if (subset || escapeOnly) {
    return value;
  }

  return value
    .replace(EXPRESSION_SURROGATE_PAIR, function (pair, pos, val) {
      return toHexReference(
        ((pair.charCodeAt(0) - 0xD800) * 0x400) +
        pair.charCodeAt(1) - 0xDC00 + 0x10000,
        val.charAt(pos + 2),
        omit
      );
    })
    .replace(EXPRESSION_BMP, function (char, pos, val) {
      return one(char, val.charAt(pos + 1), settings);
    });
}

/* Shortcut to escape special characters in HTML. */
function escape(value) {
  return encode(value, {
    escapeOnly: true,
    useNamedReferences: true
  });
}

/* Encode `char` according to `options`. */
function one(char, next, options) {
  var shortest = options.useShortestReferences;
  var omit = options.omitOptionalSemicolons;
  var named;
  var numeric;

  if (
    (shortest || options.useNamedReferences) &&
    has(characters, char)
  ) {
    named = toNamed(characters[char], next, omit, options.attribute);
  }

  if (shortest || !named) {
    numeric = toHexReference(char.charCodeAt(0), next, omit);
  }

  if (named && (!shortest || named.length < numeric.length)) {
    return named;
  }

  return numeric;
}

/* Transform `code` into an entity. */
function toNamed(name, next, omit, attribute) {
  var value = '&' + name;

  if (
    omit &&
    has(legacy, name) &&
    dangerous.indexOf(name) === -1 &&
    (!attribute || (next && next !== '=' && !alphanumerical(next)))
  ) {
    return value;
  }

  return value + ';';
}

/* Transform `code` into a hexadecimal character reference. */
function toHexReference(code, next, omit) {
  var value = '&#x' + code.toString(16).toUpperCase();
  return omit && next && !hexadecimal(next) ? value : value + ';';
}

/* Create an expression for `characters`. */
function toExpression(characters) {
  return new RegExp('[' + characters.join('') + ']', 'g');
}

/* Construct the map. */
function construct() {
  var chars = {};
  var name;

  for (name in entities) {
    chars[entities[name]] = name;
  }

  return chars;
}

},{"./dangerous.json":140,"character-entities-html4":106,"character-entities-legacy":107,"has":116,"is-alphanumerical":119,"is-hexadecimal":121}],142:[function(require,module,exports){
"use strict";

var StructuredSource = require('./structured-source.js')["default"];


module.exports = StructuredSource;

/* vim: set sw=4 ts=4 et tw=80 : */

},{"./structured-source.js":143}],143:[function(require,module,exports){
"use strict";

var _classProps = function (child, staticProps, instanceProps) {
  if (staticProps) Object.defineProperties(child, staticProps);
  if (instanceProps) Object.defineProperties(child.prototype, instanceProps);
};

var upperBound = require('boundary').upperBound;
var Position = function Position(line, column) {
  this.line = line;
  this.column = column;
};

exports.Position = Position;
var SourceLocation = function SourceLocation(start, end) {
  this.start = start;
  this.end = end;
};

exports.SourceLocation = SourceLocation;
var StructuredSource = (function () {
  var StructuredSource =
  /**
   * @constructs StructuredSource
   * @param {string} source - source code text.
   */
  function StructuredSource(source) {
    this.indice = [0];
    var regexp = /[\r\n\u2028\u2029]/g;
    var length = source.length;
    regexp.lastIndex = 0;
    while (true) {
      var result = regexp.exec(source);
      if (!result) {
        break;
      }
      var index = result.index;
      if (source.charCodeAt(index) === 13 /* '\r' */ && source.charCodeAt(index + 1) === 10 /* '\n' */) {
        index += 1;
      }
      var nextIndex = index + 1;
      // If there's a last line terminator, we push it to the indice.
      // So use < instead of <=.
      if (length < nextIndex) {
        break;
      }
      this.indice.push(nextIndex);
      regexp.lastIndex = nextIndex;
    }
  };

  StructuredSource.prototype.locationToRange = function (loc) {
    return [this.positionToIndex(loc.start), this.positionToIndex(loc.end)];
  };

  StructuredSource.prototype.rangeToLocation = function (range) {
    return new SourceLocation(this.indexToPosition(range[0]), this.indexToPosition(range[1]));
  };

  StructuredSource.prototype.positionToIndex = function (pos) {
    // Line number starts with 1.
    // Column number starts with 0.
    var start = this.indice[pos.line - 1];
    return start + pos.column;
  };

  StructuredSource.prototype.indexToPosition = function (index) {
    var startLine = upperBound(this.indice, index);
    return new Position(startLine, index - this.indice[startLine - 1]);
  };

  _classProps(StructuredSource, null, {
    line: {
      get: function () {
        return this.indice.length;
      }
    }
  });

  return StructuredSource;
})();

exports["default"] = StructuredSource;

},{"boundary":104}],144:[function(require,module,exports){
var traverse = module.exports = function (obj) {
    return new Traverse(obj);
};

function Traverse (obj) {
    this.value = obj;
}

Traverse.prototype.get = function (ps) {
    var node = this.value;
    for (var i = 0; i < ps.length; i ++) {
        var key = ps[i];
        if (!node || !hasOwnProperty.call(node, key)) {
            node = undefined;
            break;
        }
        node = node[key];
    }
    return node;
};

Traverse.prototype.has = function (ps) {
    var node = this.value;
    for (var i = 0; i < ps.length; i ++) {
        var key = ps[i];
        if (!node || !hasOwnProperty.call(node, key)) {
            return false;
        }
        node = node[key];
    }
    return true;
};

Traverse.prototype.set = function (ps, value) {
    var node = this.value;
    for (var i = 0; i < ps.length - 1; i ++) {
        var key = ps[i];
        if (!hasOwnProperty.call(node, key)) node[key] = {};
        node = node[key];
    }
    node[ps[i]] = value;
    return value;
};

Traverse.prototype.map = function (cb) {
    return walk(this.value, cb, true);
};

Traverse.prototype.forEach = function (cb) {
    this.value = walk(this.value, cb, false);
    return this.value;
};

Traverse.prototype.reduce = function (cb, init) {
    var skip = arguments.length === 1;
    var acc = skip ? this.value : init;
    this.forEach(function (x) {
        if (!this.isRoot || !skip) {
            acc = cb.call(this, acc, x);
        }
    });
    return acc;
};

Traverse.prototype.paths = function () {
    var acc = [];
    this.forEach(function (x) {
        acc.push(this.path); 
    });
    return acc;
};

Traverse.prototype.nodes = function () {
    var acc = [];
    this.forEach(function (x) {
        acc.push(this.node);
    });
    return acc;
};

Traverse.prototype.clone = function () {
    var parents = [], nodes = [];
    
    return (function clone (src) {
        for (var i = 0; i < parents.length; i++) {
            if (parents[i] === src) {
                return nodes[i];
            }
        }
        
        if (typeof src === 'object' && src !== null) {
            var dst = copy(src);
            
            parents.push(src);
            nodes.push(dst);
            
            forEach(objectKeys(src), function (key) {
                dst[key] = clone(src[key]);
            });
            
            parents.pop();
            nodes.pop();
            return dst;
        }
        else {
            return src;
        }
    })(this.value);
};

function walk (root, cb, immutable) {
    var path = [];
    var parents = [];
    var alive = true;
    
    return (function walker (node_) {
        var node = immutable ? copy(node_) : node_;
        var modifiers = {};
        
        var keepGoing = true;
        
        var state = {
            node : node,
            node_ : node_,
            path : [].concat(path),
            parent : parents[parents.length - 1],
            parents : parents,
            key : path.slice(-1)[0],
            isRoot : path.length === 0,
            level : path.length,
            circular : null,
            update : function (x, stopHere) {
                if (!state.isRoot) {
                    state.parent.node[state.key] = x;
                }
                state.node = x;
                if (stopHere) keepGoing = false;
            },
            'delete' : function (stopHere) {
                delete state.parent.node[state.key];
                if (stopHere) keepGoing = false;
            },
            remove : function (stopHere) {
                if (isArray(state.parent.node)) {
                    state.parent.node.splice(state.key, 1);
                }
                else {
                    delete state.parent.node[state.key];
                }
                if (stopHere) keepGoing = false;
            },
            keys : null,
            before : function (f) { modifiers.before = f },
            after : function (f) { modifiers.after = f },
            pre : function (f) { modifiers.pre = f },
            post : function (f) { modifiers.post = f },
            stop : function () { alive = false },
            block : function () { keepGoing = false }
        };
        
        if (!alive) return state;
        
        function updateState() {
            if (typeof state.node === 'object' && state.node !== null) {
                if (!state.keys || state.node_ !== state.node) {
                    state.keys = objectKeys(state.node)
                }
                
                state.isLeaf = state.keys.length == 0;
                
                for (var i = 0; i < parents.length; i++) {
                    if (parents[i].node_ === node_) {
                        state.circular = parents[i];
                        break;
                    }
                }
            }
            else {
                state.isLeaf = true;
                state.keys = null;
            }
            
            state.notLeaf = !state.isLeaf;
            state.notRoot = !state.isRoot;
        }
        
        updateState();
        
        // use return values to update if defined
        var ret = cb.call(state, state.node);
        if (ret !== undefined && state.update) state.update(ret);
        
        if (modifiers.before) modifiers.before.call(state, state.node);
        
        if (!keepGoing) return state;
        
        if (typeof state.node == 'object'
        && state.node !== null && !state.circular) {
            parents.push(state);
            
            updateState();
            
            forEach(state.keys, function (key, i) {
                path.push(key);
                
                if (modifiers.pre) modifiers.pre.call(state, state.node[key], key);
                
                var child = walker(state.node[key]);
                if (immutable && hasOwnProperty.call(state.node, key)) {
                    state.node[key] = child.node;
                }
                
                child.isLast = i == state.keys.length - 1;
                child.isFirst = i == 0;
                
                if (modifiers.post) modifiers.post.call(state, child);
                
                path.pop();
            });
            parents.pop();
        }
        
        if (modifiers.after) modifiers.after.call(state, state.node);
        
        return state;
    })(root).node;
}

function copy (src) {
    if (typeof src === 'object' && src !== null) {
        var dst;
        
        if (isArray(src)) {
            dst = [];
        }
        else if (isDate(src)) {
            dst = new Date(src.getTime ? src.getTime() : src);
        }
        else if (isRegExp(src)) {
            dst = new RegExp(src);
        }
        else if (isError(src)) {
            dst = { message: src.message };
        }
        else if (isBoolean(src)) {
            dst = new Boolean(src);
        }
        else if (isNumber(src)) {
            dst = new Number(src);
        }
        else if (isString(src)) {
            dst = new String(src);
        }
        else if (Object.create && Object.getPrototypeOf) {
            dst = Object.create(Object.getPrototypeOf(src));
        }
        else if (src.constructor === Object) {
            dst = {};
        }
        else {
            var proto =
                (src.constructor && src.constructor.prototype)
                || src.__proto__
                || {}
            ;
            var T = function () {};
            T.prototype = proto;
            dst = new T;
        }
        
        forEach(objectKeys(src), function (key) {
            dst[key] = src[key];
        });
        return dst;
    }
    else return src;
}

var objectKeys = Object.keys || function keys (obj) {
    var res = [];
    for (var key in obj) res.push(key)
    return res;
};

function toS (obj) { return Object.prototype.toString.call(obj) }
function isDate (obj) { return toS(obj) === '[object Date]' }
function isRegExp (obj) { return toS(obj) === '[object RegExp]' }
function isError (obj) { return toS(obj) === '[object Error]' }
function isBoolean (obj) { return toS(obj) === '[object Boolean]' }
function isNumber (obj) { return toS(obj) === '[object Number]' }
function isString (obj) { return toS(obj) === '[object String]' }

var isArray = Array.isArray || function isArray (xs) {
    return Object.prototype.toString.call(xs) === '[object Array]';
};

var forEach = function (xs, fn) {
    if (xs.forEach) return xs.forEach(fn)
    else for (var i = 0; i < xs.length; i++) {
        fn(xs[i], i, xs);
    }
};

forEach(objectKeys(Traverse.prototype), function (key) {
    traverse[key] = function (obj) {
        var args = [].slice.call(arguments, 1);
        var t = new Traverse(obj);
        return t[key].apply(t, args);
    };
});

var hasOwnProperty = Object.hasOwnProperty || function (obj, key) {
    return key in obj;
};

},{}],145:[function(require,module,exports){
'use strict';

module.exports = trimTrailingLines;

var line = '\n';

/* Remove final newline characters from `value`. */
function trimTrailingLines(value) {
  var val = String(value);
  var index = val.length;

  while (val.charAt(--index) === line) { /* empty */ }

  return val.slice(0, index + 1);
}

},{}],146:[function(require,module,exports){

exports = module.exports = trim;

function trim(str){
  return str.replace(/^\s*|\s*$/g, '');
}

exports.left = function(str){
  return str.replace(/^\s*/, '');
};

exports.right = function(str){
  return str.replace(/\s*$/, '');
};

},{}],147:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2016 Titus Wormer
 * @license MIT
 * @module trough
 * @fileoverview Middleware.  Inspired by `segmentio/ware`,
 *   but able to change the values from transformer to
 *   transformer.
 */

'use strict';

/* Expose. */
module.exports = trough;

/* Methods. */
var slice = [].slice;

/**
 * Create new middleware.
 *
 * @return {Object} - Middlewre.
 */
function trough() {
  var fns = [];
  var middleware = {};

  middleware.run = run;
  middleware.use = use;

  return middleware;

  /**
   * Run `fns`.  Last argument must be
   * a completion handler.
   *
   * @param {...*} input - Parameters
   */
  function run() {
    var index = -1;
    var input = slice.call(arguments, 0, -1);
    var done = arguments[arguments.length - 1];

    if (typeof done !== 'function') {
      throw new Error('Expected function as last argument, not ' + done);
    }

    next.apply(null, [null].concat(input));

    return;

    /**
     * Run the next `fn`, if any.
     *
     * @param {Error?} err - Failure.
     * @param {...*} values - Other input.
     */
    function next(err) {
      var fn = fns[++index];
      var params = slice.call(arguments, 0);
      var values = params.slice(1);
      var length = input.length;
      var pos = -1;

      if (err) {
        done(err);
        return;
      }

      /* Copy non-nully input into values. */
      while (++pos < length) {
        if (values[pos] === null || values[pos] === undefined) {
          values[pos] = input[pos];
        }
      }

      input = values;

      /* Next or done. */
      if (fn) {
        wrap(fn, next).apply(null, input);
      } else {
        done.apply(null, [null].concat(input));
      }
    }
  }

  /**
   * Add `fn` to the list.
   *
   * @param {Function} fn - Anything `wrap` accepts.
   */
  function use(fn) {
    if (typeof fn !== 'function') {
      throw new Error('Expected `fn` to be a function, not ' + fn);
    }

    fns.push(fn);

    return middleware;
  }
}

/**
 * Wrap `fn`.  Can be sync or async; return a promise,
 * receive a completion handler, return new values and
 * errors.
 *
 * @param {Function} fn - Thing to wrap.
 * @param {Function} next - Completion handler.
 * @return {Function} - Wrapped `fn`.
 */
function wrap(fn, next) {
  var invoked;

  return wrapped;

  function wrapped() {
    var params = slice.call(arguments, 0);
    var callback = fn.length > params.length;
    var result;

    if (callback) {
      params.push(done);
    }

    try {
      result = fn.apply(null, params);
    } catch (err) {
      /* Well, this is quite the pickle.  `fn` received
       * a callback and invoked it (thus continuing the
       * pipeline), but later also threw an error.
       * We’re not about to restart the pipeline again,
       * so the only thing left to do is to throw the
       * thing instea. */
      if (callback && invoked) {
        throw err;
      }

      return done(err);
    }

    if (!callback) {
      if (result && typeof result.then === 'function') {
        result.then(then, done);
      } else if (result instanceof Error) {
        done(result);
      } else {
        then(result);
      }
    }
  }

  /**
   * Invoke `next`, only once.
   *
   * @param {Error?} err - Optional error.
   */
  function done() {
    if (!invoked) {
      invoked = true;

      next.apply(null, arguments);
    }
  }

  /**
   * Invoke `done` with one value.
   * Tracks if an error is passed, too.
   *
   * @param {*} value - Optional value.
   */
  function then(value) {
    done(null, value);
  }
}

},{}],148:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module unherit
 * @fileoverview Create a custom constructor which can be modified
 *   without affecting the original class.
 */

'use strict';

/* Dependencies. */
var xtend = require('xtend');
var inherits = require('inherits');

/* Expose. */
module.exports = unherit;

/**
 * Create a custom constructor which can be modified
 * without affecting the original class.
 *
 * @param {Function} Super - Super-class.
 * @return {Function} - Constructor acting like `Super`,
 *   which can be modified without affecting the original
 *   class.
 */
function unherit(Super) {
  var result;
  var key;
  var value;

  inherits(Of, Super);
  inherits(From, Of);

  /* Clone values. */
  result = Of.prototype;

  for (key in result) {
    value = result[key];

    if (value && typeof value === 'object') {
      result[key] = 'concat' in value ? value.concat() : xtend(value);
    }
  }

  return Of;

  /**
   * Constructor accepting a single argument,
   * which itself is an `arguments` object.
   */
  function From(parameters) {
    return Super.apply(this, parameters);
  }

  /**
   * Constructor accepting variadic arguments.
   */
  function Of() {
    if (!(this instanceof Of)) {
      return new From(arguments);
    }

    return Super.apply(this, arguments);
  }
}

},{"inherits":117,"xtend":155}],149:[function(require,module,exports){
(function (global){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module unified
 * @fileoverview Pluggable text processing interface.
 */

'use strict';

/* Dependencies. */
var events = require('events');
var has = require('has');
var once = require('once');
var extend = require('extend');
var bail = require('bail');
var vfile = require('vfile');
var trough = require('trough');

/* Expose an abstract processor. */
module.exports = unified().abstract();

/* Methods. */
var slice = [].slice;

/* Process pipeline. */
var pipeline = trough()
  .use(function (p, ctx) {
    ctx.tree = p.parse(ctx.file, ctx.options);
  })
  .use(function (p, ctx, next) {
    p.run(ctx.tree, ctx.file, function (err, tree, file) {
      if (err) {
        next(err);
      } else {
        ctx.tree = tree;
        ctx.file = file;
        next();
      }
    });
  })
  .use(function (p, ctx) {
    ctx.file.contents = p.stringify(ctx.tree, ctx.file, ctx.options);
  });

/**
 * Function to create the first processor.
 *
 * @return {Function} - First processor.
 */
function unified() {
  var attachers = [];
  var transformers = trough();
  var namespace = {};
  var chunks = [];
  var emitter = new events.EventEmitter();
  var ended = false;
  var concrete = true;
  var settings;
  var key;

  /**
   * Create a new processor based on the processor
   * in the current scope.
   *
   * @return {Processor} - New concrete processor based
   *   on the descendant processor.
   */
  function processor() {
    var destination = unified();
    var length = attachers.length;
    var index = -1;

    while (++index < length) {
      destination.use.apply(null, attachers[index]);
    }

    destination.data(extend(true, {}, namespace));

    return destination;
  }

  /* Mix in methods. */
  for (key in emitter) {
    processor[key] = emitter[key];
  }

  /* Helpers. */

  /**
   * Assert a parser is available.
   *
   * @param {string} name - Name of callee.
   */
  function assertParser(name) {
    if (!isParser(processor.Parser)) {
      throw new Error('Cannot `' + name + '` without `Parser`');
    }
  }

  /**
   * Assert a compiler is available.
   *
   * @param {string} name - Name of callee.
   */
  function assertCompiler(name) {
    if (!isCompiler(processor.Compiler)) {
      throw new Error('Cannot `' + name + '` without `Compiler`');
    }
  }

  /**
   * Assert the processor is concrete.
   *
   * @param {string} name - Name of callee.
   */
  function assertConcrete(name) {
    if (!concrete) {
      throw new Error(
        'Cannot ' +
        (name ? 'invoke `' + name + '` on' : 'pipe into') +
        ' abstract processor.\n' +
        'To make the processor concrete, invoke it: ' +
        'use `processor()` instead of `processor`.'
      );
    }
  }

  /**
   * Assert `node` is a Unist node.
   *
   * @param {*} node - Value to check.
   */
  function assertNode(node) {
    if (!isNode(node)) {
      throw new Error('Expected node, got `' + node + '`');
    }
  }

  /**
   * Assert, if no `done` is given, that `complete` is
   * `true`.
   *
   * @param {string} name - Name of callee.
   * @param {boolean} complete - Whether an async process
   *   is complete.
   * @param {Function?} done - Optional handler of async
   *   results.
   */
  function assertDone(name, complete, done) {
    if (!complete && !done) {
      throw new Error(
        'Expected `done` to be given to `' + name + '` ' +
        'as async plug-ins are used'
      );
    }
  }

  /* Throw as early as possible.
   * As events are triggered synchroneously, the stack
   * is preserved. */
  processor.on('pipe', function () {
    assertConcrete();
  });

  /**
   * Abstract: used to signal an abstract processor which
   * should made concrete before using.
   *
   * For example, take unified itself.  It’s abstract.
   * Plug-ins should not be added to it.  Rather, it should
   * be made concrete (by invoking it) before modifying it.
   *
   * In essence, always invoke this when exporting a
   * processor.
   *
   * @return {Processor} - The operated on processor.
   */
  function abstract() {
    concrete = false;

    return processor;
  }

  /**
   * Data management.
   *
   * Getter / setter for processor-specific informtion.
   *
   * @param {string} key - Key to get or set.
   * @param {*} value - Value to set.
   * @return {*} - Either the operator on processor in
   *   setter mode; or the value stored as `key` in
   *   getter mode.
   */
  function data(key, value) {
    assertConcrete('data');

    if (typeof key === 'string') {
      /* Set `key`. */
      if (arguments.length === 2) {
        namespace[key] = value;

        return processor;
      }

      /* Get `key`. */
      return (has(namespace, key) && namespace[key]) || null;
    }

    /* Get space. */
    if (!key) {
      return namespace;
    }

    /* Set space. */
    namespace = key;

    return processor;
  }

  /**
   * Plug-in management.
   *
   * Pass it:
   * *   an attacher and options,
   * *   a list of attachers and options for all of them;
   * *   a tuple of one attacher and options.
   * *   a matrix: list containing any of the above and
   *     matrices.
   *
   * @param {...*} value - See description.
   * @return {Processor} - The operated on processor.
   */
  function use(value) {
    var args = slice.call(arguments, 0);
    var params = args.slice(1);
    var index;
    var length;
    var transformer;

    assertConcrete('use');

    /* Multiple attachers. */
    if ('length' in value && !isFunction(value)) {
      index = -1;
      length = value.length;

      if (!isFunction(value[0])) {
        /* Matrix of things. */
        while (++index < length) {
          use(value[index]);
        }
      } else if (isFunction(value[1])) {
        /* List of things. */
        while (++index < length) {
          use.apply(null, [value[index]].concat(params));
        }
      } else {
        /* Arguments. */
        use.apply(null, value);
      }

      return processor;
    }

    /* Store attacher. */
    attachers.push(args);

    /* Single attacher. */
    transformer = value.apply(null, [processor].concat(params));

    if (isFunction(transformer)) {
      transformers.use(transformer);
    }

    return processor;
  }

  /**
   * Parse a file (in string or VFile representation)
   * into a Unist node using the `Parser` on the
   * processor.
   *
   * @param {(string|VFile)?} [file] - File to process.
   * @param {Object?} [options] - Configuration.
   * @return {Node} - Unist node.
   */
  function parse(file, options) {
    assertConcrete('parse');
    assertParser('parse');

    return new processor.Parser(vfile(file), options, processor).parse();
  }

  /**
   * Run transforms on a Unist node representation of a file
   * (in string or VFile representation).
   *
   * @param {Node} node - Unist node.
   * @param {(string|VFile)?} [file] - File representation.
   * @param {Function?} [done] - Callback.
   * @return {Node} - The given or resulting Unist node.
   */
  function run(node, file, done) {
    var complete = false;
    var result;

    assertConcrete('run');
    assertNode(node);

    result = node;

    if (!done && file && !isFile(file)) {
      done = file;
      file = null;
    }

    transformers.run(node, vfile(file), function (err, tree, file) {
      complete = true;
      result = tree || node;

      (done || bail)(err, tree, file);
    });

    assertDone('run', complete, done);

    return result;
  }

  /**
   * Stringify a Unist node representation of a file
   * (in string or VFile representation) into a string
   * using the `Compiler` on the processor.
   *
   * @param {Node} node - Unist node.
   * @param {(string|VFile)?} [file] - File representation.
   * @param {Object?} [options] - Configuration.
   * @return {string} - String representation.
   */
  function stringify(node, file, options) {
    assertConcrete('stringify');
    assertCompiler('stringify');
    assertNode(node);

    if (!options && file && !isFile(file)) {
      options = file;
      file = null;
    }

    return new processor.Compiler(vfile(file), options, processor).compile(node);
  }

  /**
   * Parse a file (in string or VFile representation)
   * into a Unist node using the `Parser` on the processor,
   * then run transforms on that node, and compile the
   * resulting node using the `Compiler` on the processor,
   * and store that result on the VFile.
   *
   * @param {(string|VFile)?} file - File representation.
   * @param {Object?} [options] - Configuration.
   * @param {Function?} [done] - Callback.
   * @return {VFile} - The given or resulting VFile.
   */
  function process(file, options, done) {
    var complete = false;

    assertConcrete('process');
    assertParser('process');
    assertCompiler('process');

    if (!done && isFunction(options)) {
      done = options;
      options = null;
    }

    file = vfile(file);

    pipeline.run(processor, {
      file: file,
      options: options || {}
    }, function (err) {
      complete = true;

      if (done) {
        done(err, file);
      } else {
        bail(err);
      }
    });

    assertDone('process', complete, done);

    return file;
  }

  /* Streams. */

  /**
   * Write a chunk into memory.
   *
   * @param {(Buffer|string)?} chunk - Value to write.
   * @param {string?} [encoding] - Encoding.
   * @param {Function?} [callback] - Callback.
   * @return {boolean} - Whether the write was succesful.
   */
  function write(chunk, encoding, callback) {
    assertConcrete('write');

    if (isFunction(encoding)) {
      callback = encoding;
      encoding = null;
    }

    if (ended) {
      throw new Error('Did not expect `write` after `end`');
    }

    chunks.push((chunk || '').toString(encoding || 'utf8'));

    if (callback) {
      callback();
    }

    /* Signal succesful write. */
    return true;
  }

  /**
   * End the writing.  Passes all arguments to a final
   * `write`.  Starts the process, which will trigger
   * `error`, with a fatal error, if any; `data`, with
   * the generated document in `string` form, if
   * succesful.  If messages are triggered during the
   * process, those are triggerd as `warning`s.
   *
   * @return {boolean} - Whether the last write was
   *   succesful.
   */
  function end() {
    assertConcrete('end');
    assertParser('end');
    assertCompiler('end');

    write.apply(null, arguments);

    ended = true;

    process(chunks.join(''), settings, function (err, file) {
      var messages = file.messages;
      var length = messages.length;
      var index = -1;

      chunks = settings = null;

      /* Trigger messages as warnings, except for fatal error. */
      while (++index < length) {
        if (messages[index] !== err) {
          processor.emit('warning', messages[index]);
        }
      }

      if (err) {
        /* Don’t enter an infinite error throwing loop. */
        global.setTimeout(function () {
          processor.emit('error', err);
        }, 4);
      } else {
        processor.emit('data', file.contents);
        processor.emit('end');
      }
    });

    return true;
  }

  /**
   * Pipe the processor into a writable stream.
   *
   * Basically `Stream#pipe`, but inlined and
   * simplified to keep the bundled size down.
   *
   * @see https://github.com/nodejs/node/blob/master/lib/stream.js#L26
   *
   * @param {Stream} dest - Writable stream.
   * @param {Object?} [options] - Processing
   *   configuration.
   * @return {Stream} - The destination stream.
   */
  function pipe(dest, options) {
    var onend = once(function () {
      if (dest.end) {
        dest.end();
      }
    });

    assertConcrete('pipe');

    settings = options || {};

    /**
     * Handle data.
     *
     * @param {*} chunk - Data to pass through.
     */
    function ondata(chunk) {
      if (dest.writable) {
        dest.write(chunk);
      }
    }

    /**
     * Clean listeners.
     */
    function cleanup() {
      processor.removeListener('data', ondata);
      processor.removeListener('end', onend);
      processor.removeListener('error', onerror);
      processor.removeListener('end', cleanup);
      processor.removeListener('close', cleanup);

      dest.removeListener('error', onerror);
      dest.removeListener('close', cleanup);
    }

    /**
     * Close dangling pipes and handle unheard errors.
     *
     * @param {Error} err - Exception.
     */
    function onerror(err) {
      var handlers = processor._events.error;

      cleanup();

      /* Cannot use `listenerCount` in node <= 0.12. */
      if (!handlers || !handlers.length || handlers === onerror) {
        throw err; /* Unhandled stream error in pipe. */
      }
    }

    processor.on('data', ondata);
    processor.on('error', onerror);
    processor.on('end', cleanup);
    processor.on('close', cleanup);

    /* If the 'end' option is not supplied, dest.end() will be
     * called when the 'end' or 'close' events are received.
     * Only dest.end() once. */
    if (!dest._isStdio && settings.end !== false) {
      processor.on('end', onend);
    }

    dest.on('error', onerror);
    dest.on('close', cleanup);

    dest.emit('pipe', processor);

    return dest;
  }

  /* Data management. */
  processor.data = data;

  /* Lock. */
  processor.abstract = abstract;

  /* Plug-ins. */
  processor.use = use;

  /* Streaming. */
  processor.writable = true;
  processor.readable = true;
  processor.write = write;
  processor.end = end;
  processor.pipe = pipe;

  /* API. */
  processor.parse = parse;
  processor.stringify = stringify;
  processor.run = run;
  processor.process = process;

  /* Expose. */
  return processor;
}

/**
 * Check if `node` is a Unist node.
 *
 * @param {*} node - Value.
 * @return {boolean} - Whether `node` is a Unist node.
 */
function isNode(node) {
  return node && typeof node.type === 'string' && node.type.length !== 0;
}

/**
 * Check if `file` is a VFile.
 *
 * @param {*} file - Value.
 * @return {boolean} - Whether `file` is a VFile.
 */
function isFile(file) {
  return file && typeof file.contents === 'string';
}

/**
 * Check if `fn` is a function.
 *
 * @param {*} fn - Value.
 * @return {boolean} - Whether `fn` is a function.
 */
function isFunction(fn) {
  return typeof fn === 'function';
}

/**
 * Check if `compiler` is a Compiler.
 *
 * @param {*} compiler - Value.
 * @return {boolean} - Whether `compiler` is a Compiler.
 */
function isCompiler(compiler) {
  return isFunction(compiler) && compiler.prototype && isFunction(compiler.prototype.compile);
}

/**
 * Check if `parser` is a Parser.
 *
 * @param {*} parser - Value.
 * @return {boolean} - Whether `parser` is a Parser.
 */
function isParser(parser) {
  return isFunction(parser) && parser.prototype && isFunction(parser.prototype.parse);
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"bail":103,"events":93,"extend":113,"has":116,"once":128,"trough":147,"vfile":153}],150:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2016 Titus Wormer
 * @license MIT
 * @module unist:util:remove-position
 * @fileoverview Remove `position`s from a unist tree.
 */

'use strict';

/* eslint-env commonjs */

/* Dependencies. */
var visit = require('unist-util-visit');

/* Expose. */
module.exports = removePosition;

/**
 * Remove `position`s from `tree`.
 *
 * @param {Node} tree - Node.
 * @return {Node} - Node without `position`s.
 */
function removePosition(node, force) {
  visit(node, force ? hard : soft);
  return node;
}

/**
 * Delete `position`.
 */
function hard(node) {
  delete node.position;
}

/**
 * Remove `position` softly.
 */
function soft(node) {
  node.position = undefined;
}

},{"unist-util-visit":151}],151:[function(require,module,exports){
'use strict';

/* Expose. */
module.exports = visit;

/* Visit. */
function visit(tree, type, visitor, reverse) {
  if (typeof type === 'function') {
    reverse = visitor;
    visitor = type;
    type = null;
  }

  one(tree);

  return;

  /* Visit a single node. */
  function one(node, index, parent) {
    var result;

    index = index || (parent ? 0 : null);

    if (!type || node.type === type) {
      result = visitor(node, index, parent || null);
    }

    if (node.children && result !== false) {
      return all(node.children, node);
    }

    return result;
  }

  /* Visit children in `parent`. */
  function all(children, parent) {
    var step = reverse ? -1 : 1;
    var max = children.length;
    var min = -1;
    var index = (reverse ? max : min) + step;
    var child;

    while (index > min && index < max) {
      child = children[index];

      if (child && one(child, index, parent) === false) {
        return false;
      }

      index += step;
    }

    return true;
  }
}

},{}],152:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2016 Titus Wormer
 * @license MIT
 * @module vfile-location
 * @fileoverview Convert between positions (line and column-based)
 *   and offsets (range-based) locations in a virtual file.
 */

'use strict';

/* Expose. */
module.exports = factory;

/**
 * Factory.
 *
 * @param {VFile|string|Buffer} file - Virtual file or document.
 */
function factory(file) {
  var contents = indices(String(file));

  return {
    toPosition: offsetToPositionFactory(contents),
    toOffset: positionToOffsetFactory(contents)
  };
}

/**
 * Factory to get the line and column-based `position` for
 * `offset` in the bound indices.
 *
 * @param {Array.<number>} indices - Indices of
 *   line-breaks in `value`.
 * @return {Function} - Bound method.
 */
function offsetToPositionFactory(indices) {
  return offsetToPosition;

  /**
   * Get the line and column-based `position` for
   * `offset` in the bound indices.
   *
   * @param {number} offset - Offset.
   * @return {Position} - Object with `line`, `column`,
   *   and `offset` properties based on the bound
   *   `indices`.  An empty object when given invalid
   *   or out of bounds input.
   */
  function offsetToPosition(offset) {
    var index = -1;
    var length = indices.length;

    if (offset < 0) {
      return {};
    }

    while (++index < length) {
      if (indices[index] > offset) {
        return {
          line: index + 1,
          column: (offset - (indices[index - 1] || 0)) + 1,
          offset: offset
        };
      }
    }

    return {};
  }
}

/**
 * Factory to get the `offset` for a line and column-based
 * `position` in the bound indices.
 *
 * @param {Array.<number>} indices - Indices of
 *   line-breaks in `value`.
 * @return {Function} - Bound method.
 */
function positionToOffsetFactory(indices) {
  return positionToOffset;

  /**
   * Get the `offset` for a line and column-based
   * `position` in the bound indices.
   *
   * @param {Position} position - Object with `line` and
   *   `column` properties.
   * @return {number} - Offset. `-1` when given invalid
   *   or out of bounds input.
   */
  function positionToOffset(position) {
    var line = position && position.line;
    var column = position && position.column;

    if (!isNaN(line) && !isNaN(column) && line - 1 in indices) {
      return ((indices[line - 2] || 0) + column - 1) || 0;
    }

    return -1;
  }
}

/**
 * Get indices of line-breaks in `value`.
 *
 * @param {string} value - Value.
 * @return {Array.<number>} - List of indices of
 *   line-breaks.
 */
function indices(value) {
  var result = [];
  var index = value.indexOf('\n');

  while (index !== -1) {
    result.push(index + 1);
    index = value.indexOf('\n', index + 1);
  }

  result.push(value.length + 1);

  return result;
}

},{}],153:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module vfile
 * @fileoverview Virtual file format to attach additional
 *   information related to processed input.  Similar to
 *   `wearefractal/vinyl`.  Additionally, `VFile` can be
 *   passed directly to ESLint formatters to visualise
 *   warnings and errors relating to a file.
 * @example
 *   var VFile = require('vfile');
 *
 *   var file = new VFile({
 *     'directory': '~',
 *     'filename': 'example',
 *     'extension': 'txt',
 *     'contents': 'Foo *bar* baz'
 *   });
 *
 *   file.toString(); // 'Foo *bar* baz'
 *   file.filePath(); // '~/example.txt'
 *
 *   file.move({'extension': 'md'});
 *   file.filePath(); // '~/example.md'
 *
 *   file.warn('Something went wrong', {'line': 2, 'column': 3});
 *   // { [~/example.md:2:3: Something went wrong]
 *   //   name: '~/example.md:2:3',
 *   //   file: '~/example.md',
 *   //   reason: 'Something went wrong',
 *   //   line: 2,
 *   //   column: 3,
 *   //   fatal: false }
 */

'use strict';

/* eslint-env commonjs */

var proto;

var SEPARATOR = '/';

try {
    SEPARATOR = require('pa' + 'th').sep;
} catch (e) { /* empty */ }

/**
 * Construct a new file message.
 *
 * Note: We cannot invoke `Error` on the created context,
 * as that adds readonly `line` and `column` attributes on
 * Safari 9, thus throwing and failing the data.
 *
 * @example
 *   var message = new VFileMessage('Whoops!');
 *
 *   message instanceof Error // true
 *
 * @constructor
 * @class {VFileMessage}
 * @param {string} reason - Reason for messaging.
 * @property {boolean} [fatal=null] - Whether the message
 *   is fatal.
 * @property {string} [name=''] - File-name and positional
 *   information.
 * @property {string} [file=''] - File-path.
 * @property {string} [reason=''] - Reason for messaging.
 * @property {number} [line=null] - Start of message.
 * @property {number} [column=null] - Start of message.
 * @property {Position|Location} [location=null] - Place of
 *   message.
 * @property {string} [stack] - Stack-trace of warning.
 */
function VFileMessage(reason) {
    this.message = reason;
}

/**
 * Inherit from `Error#`.
 */
function VFileMessagePrototype() {}

VFileMessagePrototype.prototype = Error.prototype;

proto = new VFileMessagePrototype();

VFileMessage.prototype = proto;

/*
 * Expose defaults.
 */

proto.file = proto.name = proto.reason = proto.message = proto.stack = '';
proto.fatal = proto.column = proto.line = null;

/**
 * File-related message with location information.
 *
 * @typedef {Error} VFileMessage
 * @property {string} name - (Starting) location of the
 *   message, preceded by its file-path when available,
 *   and joined by `:`. Used internally by the native
 *   `Error#toString()`.
 * @property {string} file - File-path.
 * @property {string} reason - Reason for message.
 * @property {number?} line - Line of message, when
 *   available.
 * @property {number?} column - Column of message, when
 *   available.
 * @property {string?} stack - Stack of message, when
 *   available.
 * @property {boolean?} fatal - Whether the associated file
 *   is still processable.
 */

/**
 * Stringify a position.
 *
 * @example
 *   stringify({'line': 1, 'column': 3}) // '1:3'
 *   stringify({'line': 1}) // '1:1'
 *   stringify({'column': 3}) // '1:3'
 *   stringify() // '1:1'
 *
 * @private
 * @param {Object?} [position] - Single position, like
 *   those available at `node.position.start`.
 * @return {string} - Compiled location.
 */
function stringify(position) {
    if (!position) {
        position = {};
    }

    return (position.line || 1) + ':' + (position.column || 1);
}

/**
 * ESLint's formatter API expects `filePath` to be a
 * string.  This hack supports invocation as well as
 * implicit coercion.
 *
 * @example
 *   var file = new VFile({
 *     'filename': 'example',
 *     'extension': 'txt'
 *   });
 *
 *   filePath = filePathFactory(file);
 *
 *   String(filePath); // 'example.txt'
 *   filePath(); // 'example.txt'
 *
 * @private
 * @param {VFile} file - Virtual file.
 * @return {Function} - `filePath` getter.
 */
function filePathFactory(file) {
    /**
     * Get the filename, with extension and directory, if applicable.
     *
     * @example
     *   var file = new VFile({
     *     'directory': '~',
     *     'filename': 'example',
     *     'extension': 'txt'
     *   });
     *
     *   String(file.filePath); // ~/example.txt
     *   file.filePath() // ~/example.txt
     *
     * @memberof {VFile}
     * @property {Function} toString - Itself. ESLint's
     *   formatter API expects `filePath` to be `string`.
     *   This hack supports invocation as well as implicit
     *   coercion.
     * @return {string} - If the `vFile` has a `filename`,
     *   it will be prefixed with the directory (slashed),
     *   if applicable, and suffixed with the (dotted)
     *   extension (if applicable).  Otherwise, an empty
     *   string is returned.
     */
    function filePath() {
        var directory = file.directory;
        var separator;

        if (file.filename || file.extension) {
            separator = directory.charAt(directory.length - 1);

            if (separator === '/' || separator === '\\') {
                directory = directory.slice(0, -1);
            }

            if (directory === '.') {
                directory = '';
            }

            return (directory ? directory + SEPARATOR : '') +
                file.filename +
                (file.extension ? '.' + file.extension : '');
        }

        return '';
    }

    filePath.toString = filePath;

    return filePath;
}

/**
* Get the filename with extantion.
*
* @example
*   var file = new VFile({
*     'directory': '~/foo/bar'
*     'filename': 'example',
*     'extension': 'txt'
*   });
*
*   file.basename() // example.txt
*
* @memberof {VFile}
* @return {string} - name of file with extantion.
*/
function basename() {
    var self = this;
    var extension = self.extension;

    if (self.filename || extension) {
        return self.filename + (extension ? '.' + extension : '');
    }

    return '';
}

/**
 * Construct a new file.
 *
 * @example
 *   var file = new VFile({
 *     'directory': '~',
 *     'filename': 'example',
 *     'extension': 'txt',
 *     'contents': 'Foo *bar* baz'
 *   });
 *
 *   file === VFile(file) // true
 *   file === new VFile(file) // true
 *   VFile('foo') instanceof VFile // true
 *
 * @constructor
 * @class {VFile}
 * @param {Object|VFile|string} [options] - either an
 *   options object, or the value of `contents` (both
 *   optional).  When a `file` is passed in, it's
 *   immediately returned.
 * @property {string} [contents=''] - Content of file.
 * @property {string} [directory=''] - Path to parent
 *   directory.
 * @property {string} [filename=''] - Filename.
 *   A file-path can still be generated when no filename
 *   exists.
 * @property {string} [extension=''] - Extension.
 *   A file-path can still be generated when no extension
 *   exists.
 * @property {boolean?} quiet - Whether an error created by
 *   `VFile#fail()` is returned (when truthy) or thrown
 *   (when falsey). Ensure all `messages` associated with
 *   a file are handled properly when setting this to
 *   `true`.
 * @property {Array.<VFileMessage>} messages - List of associated
 *   messages.
 */
function VFile(options) {
    var self = this;

    /*
     * No `new` operator.
     */

    if (!(self instanceof VFile)) {
        return new VFile(options);
    }

    /*
     * Given file.
     */

    if (
        options &&
        typeof options.message === 'function' &&
        typeof options.hasFailed === 'function'
    ) {
        return options;
    }

    if (!options) {
        options = {};
    } else if (typeof options === 'string') {
        options = {
            'contents': options
        };
    }

    self.contents = options.contents || '';

    self.messages = [];

    /*
     * Make sure eslint’s formatters stringify `filePath`
     * properly.
     */

    self.filePath = filePathFactory(self);

    self.history = [];

    self.move({
        'filename': options.filename,
        'directory': options.directory,
        'extension': options.extension
    });
}

/**
 * Get the value of the file.
 *
 * @example
 *   var vFile = new VFile('Foo');
 *   String(vFile); // 'Foo'
 *
 * @this {VFile}
 * @memberof {VFile}
 * @return {string} - value at the `contents` property
 *   in context.
 */
function toString() {
    return this.contents;
}

/**
 * Move a file by passing a new directory, filename,
 * and extension.  When these are not given, the default
 * values are kept.
 *
 * @example
 *   var file = new VFile({
 *     'directory': '~',
 *     'filename': 'example',
 *     'extension': 'txt',
 *     'contents': 'Foo *bar* baz'
 *   });
 *
 *   file.move({'directory': '/var/www'});
 *   file.filePath(); // '/var/www/example.txt'
 *
 *   file.move({'extension': 'md'});
 *   file.filePath(); // '/var/www/example.md'
 *
 * @this {VFile}
 * @memberof {VFile}
 * @param {Object?} [options] - Configuration.
 * @return {VFile} - Context object.
 */
function move(options) {
    var self = this;
    var before = self.filePath();
    var after;

    if (!options) {
        options = {};
    }

    self.directory = options.directory || self.directory || '';
    self.filename = options.filename || self.filename || '';
    self.extension = options.extension || self.extension || '';

    after = self.filePath();

    if (after && before !== after) {
        self.history.push(after);
    }

    return self;
}

/**
 * Create a message with `reason` at `position`.
 * When an error is passed in as `reason`, copies the
 * stack.  This does not add a message to `messages`.
 *
 * @example
 *   var file = new VFile();
 *
 *   file.message('Something went wrong');
 *   // { [1:1: Something went wrong]
 *   //   name: '1:1',
 *   //   file: '',
 *   //   reason: 'Something went wrong',
 *   //   line: null,
 *   //   column: null }
 *
 * @this {VFile}
 * @memberof {VFile}
 * @param {string|Error} reason - Reason for message.
 * @param {Node|Location|Position} [position] - Location
 *   of message in file.
 * @param {string} [ruleId] - Category of warning.
 * @return {VFileMessage} - File-related message with
 *   location information.
 */
function message(reason, position, ruleId) {
    var filePath = this.filePath();
    var range;
    var err;
    var location = {
        'start': {
            'line': null,
            'column': null
        },
        'end': {
            'line': null,
            'column': null
        }
    };

    /*
     * Node / location / position.
     */

    if (position && position.position) {
        position = position.position;
    }

    if (position && position.start) {
        range = stringify(position.start) + '-' + stringify(position.end);
        location = position;
        position = position.start;
    } else {
        range = stringify(position);

        if (position) {
            location.start = position;
            location.end.line = null;
            location.end.column = null;
        }
    }

    err = new VFileMessage(reason.message || reason);

    err.name = (filePath ? filePath + ':' : '') + range;
    err.file = filePath;
    err.reason = reason.message || reason;
    err.line = position ? position.line : null;
    err.column = position ? position.column : null;
    err.location = location;
    err.ruleId = ruleId || null;

    if (reason.stack) {
        err.stack = reason.stack;
    }

    return err;
}

/**
 * Warn. Creates a non-fatal message (see `VFile#message()`),
 * and adds it to the file's `messages` list.
 *
 * @example
 *   var file = new VFile();
 *
 *   file.warn('Something went wrong');
 *   // { [1:1: Something went wrong]
 *   //   name: '1:1',
 *   //   file: '',
 *   //   reason: 'Something went wrong',
 *   //   line: null,
 *   //   column: null,
 *   //   fatal: false }
 *
 * @see VFile#message
 * @this {VFile}
 * @memberof {VFile}
 */
function warn() {
    var err = this.message.apply(this, arguments);

    err.fatal = false;

    this.messages.push(err);

    return err;
}

/**
 * Fail. Creates a fatal message (see `VFile#message()`),
 * sets `fatal: true`, adds it to the file's
 * `messages` list.
 *
 * If `quiet` is not `true`, throws the error.
 *
 * @example
 *   var file = new VFile();
 *
 *   file.fail('Something went wrong');
 *   // 1:1: Something went wrong
 *   //     at VFile.exception (vfile/index.js:296:11)
 *   //     at VFile.fail (vfile/index.js:360:20)
 *   //     at repl:1:6
 *
 *   file.quiet = true;
 *   file.fail('Something went wrong');
 *   // { [1:1: Something went wrong]
 *   //   name: '1:1',
 *   //   file: '',
 *   //   reason: 'Something went wrong',
 *   //   line: null,
 *   //   column: null,
 *   //   fatal: true }
 *
 * @this {VFile}
 * @memberof {VFile}
 * @throws {VFileMessage} - When not `quiet: true`.
 * @param {string|Error} reason - Reason for failure.
 * @param {Node|Location|Position} [position] - Place
 *   of failure in file.
 * @return {VFileMessage} - Unless thrown, of course.
 */
function fail(reason, position) {
    var err = this.message(reason, position);

    err.fatal = true;

    this.messages.push(err);

    if (!this.quiet) {
        throw err;
    }

    return err;
}

/**
 * Check if a fatal message occurred making the file no
 * longer processable.
 *
 * @example
 *   var file = new VFile();
 *   file.quiet = true;
 *
 *   file.hasFailed(); // false
 *
 *   file.fail('Something went wrong');
 *   file.hasFailed(); // true
 *
 * @this {VFile}
 * @memberof {VFile}
 * @return {boolean} - `true` if at least one of file's
 *   `messages` has a `fatal` property set to `true`
 */
function hasFailed() {
    var messages = this.messages;
    var index = -1;
    var length = messages.length;

    while (++index < length) {
        if (messages[index].fatal) {
            return true;
        }
    }

    return false;
}

/**
 * Access metadata.
 *
 * @example
 *   var file = new VFile('Foo');
 *
 *   file.namespace('foo').bar = 'baz';
 *
 *   console.log(file.namespace('foo').bar) // 'baz';
 *
 * @this {VFile}
 * @memberof {VFile}
 * @param {string} key - Namespace key.
 * @return {Object} - Private space.
 */
function namespace(key) {
    var self = this;
    var space = self.data;

    if (!space) {
        space = self.data = {};
    }

    if (!space[key]) {
        space[key] = {};
    }

    return space[key];
}

/*
 * Methods.
 */

proto = VFile.prototype;

proto.basename = basename;
proto.move = move;
proto.toString = toString;
proto.message = message;
proto.warn = warn;
proto.fail = fail;
proto.hasFailed = hasFailed;
proto.namespace = namespace;

/*
 * Expose.
 */

module.exports = VFile;

},{}],154:[function(require,module,exports){
// Returns a wrapper function that returns a wrapped callback
// The wrapper function should do some stuff, and return a
// presumably different callback function.
// This makes sure that own properties are retained, so that
// decorations and such are not lost along the way.
module.exports = wrappy
function wrappy (fn, cb) {
  if (fn && cb) return wrappy(fn)(cb)

  if (typeof fn !== 'function')
    throw new TypeError('need wrapper function')

  Object.keys(fn).forEach(function (k) {
    wrapper[k] = fn[k]
  })

  return wrapper

  function wrapper() {
    var args = new Array(arguments.length)
    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i]
    }
    var ret = fn.apply(this, args)
    var cb = args[args.length-1]
    if (typeof ret === 'function' && ret !== cb) {
      Object.keys(cb).forEach(function (k) {
        ret[k] = cb[k]
      })
    }
    return ret
  }
}

},{}],155:[function(require,module,exports){
module.exports = extend

var hasOwnProperty = Object.prototype.hasOwnProperty;

function extend() {
    var target = {}

    for (var i = 0; i < arguments.length; i++) {
        var source = arguments[i]

        for (var key in source) {
            if (hasOwnProperty.call(source, key)) {
                target[key] = source[key]
            }
        }
    }

    return target
}

},{}]},{},[6]);
