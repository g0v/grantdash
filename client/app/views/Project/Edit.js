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
    if (!this.ui.description.val().length) {
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

    var err = markdownValidator(this.ui.description.val());
    if (err) {
      this.showMarkdownError(err);
      return;
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
