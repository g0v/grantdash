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
 "§ 預計六個月內將花多少小時作這件事？需要多少經費？（30 萬到 50 萬）",
 "§ 打算如何讓社群參與以及回饋意見？",
 "§ 請說明專案結束時，會產出的開源軟體套件或開放授權文件（請條列個別元件的輸入輸出或其功能）？",
 "§ 請自行定義計畫的工作里程碑與最後的驗收標準 （若沒有達成這些標準的話，我們會不給你錢喔！)",
 "§ 未來可能進一步的發展？",
 "§ 本計畫目前是否已有、或正在申請其他的資金來源？若有，請說明申請本獎助的內容與原計畫的差異。",
 "§ 若有專案介紹的投影片，請提供：",
];

var detailFields = [
  /* name, constraint type */
  ["money", 3],
  ["desc", 1],
  ["motivation", 0],
  ["existed", 0],
  ["problem", 2],
  ["solution", 2],
  ["why", 2],
  ["ta", 2],
  ["similar", 0],
  ["refdesign",0],
  ["pastprj", 0],
  ["cowork", 0],
  ["usetime", 0],
  ["spending", 0],
  ["feedback", 0],
  ["product", 0],
  ["milestone1", 0],
  ["milestone2", 0],
  ["future", 0],
  ["otherfund", 0],
  ["category", 0],
  ["slide", 0],
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

    "money": "input[name=money]",
    "desc": "textarea[name=desc]",
    "motivation": "textarea[name=motivation]",
    "existed": "textarea[name=existed]",
    "problem": "textarea[name=problem]",
    "solution": "textarea[name=solution]",
    "why": "textarea[name=why]",
    "ta": "textarea[name=ta]",
    "similar": "textarea[name=similar]",
    "refdesign": "textarea[name=refdesign]",
    "pastprj": "textarea[name=pastprj]",
    "cowork": "textarea[name=cowork]",
    "usetime": "textarea[name=usetime]",
    "spending": "textarea[name=spending]",
    "feedback": "textarea[name=feedback]",
    "product": "textarea[name=product]",
    "milestone1": "textarea[name=milestone1]",
    "milestone2": "textarea[name=milestone2]",
    "future": "textarea[name=future]",
    "otherfund": "textarea[name=otherfund]",
    "category": "select[name=category]",
    "slide": "textarea[name=slide]",

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
    if (!(this.ui.description.val() || "").length && this.model.get('domain') !== 'news') {
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
    var field, idx, length;
    var toSave = {
      title: this.ui.title.val(),
      link: this.ui.link.val(),
      tags: this.ui.tags.val().split(','),
      status: this.ui.status.val(),
      cover: this.model.get('cover')
    };
    if(this.ui.description.length) {
      toSave.description = this.ui.description.val();
    }
    for( idx = 0; idx < detailFields.length; idx ++ ) {
      field = detailFields[idx][0];
      toSave[field] = this.ui[field].val();
    }

    this.cleanErrors();
    if (this.model.get('domain') !== 'news') {
      if(this.ui.description.length) {
        var err = markdownValidator(this.ui.description.val());
        if (err) {
          this.showMarkdownError(err);
          return;
        }
      }
      var failedFields = [], val;
      for( idx = 0; idx < detailFields.length; idx ++ ) {
        field = detailFields[idx];
        val = (this.ui[field[0]].val() || "");
        length = val.length;
        if(
        length === 0 || /* empty */
        (field[1] === 3 && (isNaN(val || "-") || +val < 300000 || +val > 500000)) || /* 300k~500k number */
        (field[1] === 1 && (length < 80 || length > 120)) || /* for description */
        (field[1] === 2 && (length < 200 || length > 500))) /* for longer question */ {
          failedFields.push(field);
        }
      }
      if(failedFields.length) {
        this.showFieldsError(failedFields);
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
    "description_invalid": __("Description is invalid"),
    "link_dashboard_closed": __("Dashboard is closed for creating projects")
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

  showFieldsError: function(fields) {
    $("#save", this.$el).button('reset');
    var msg = ["欄位不得為空", "字數需介於 80 ~ 120 字之間", "字數需介於 200 ~ 500 字之間","必須要是300000 ~ 500000 之間的數字"];
    for( var idx = 0, field; idx < fields.length; idx ++ ) {
      field = fields[idx];
      this.ui[field[0]].parents('.control-group').addClass('error');
      this.ui[field[0]].after('<span class="help-inline">' + msg[field[1]] + ', 請參考<a target="_blank" href="https://hackmd.io/AwQwrAxsBM0KYFoDscCMAzBAWAHCRARqgJzEJjpwQDMAJkmFsXNUA===">申請範例</a></span>');
    }
  },

  showMarkdownError: function(error){
    $("#save", this.$el).button('reset');

    var ctrl = 'description';
    this.ui[ctrl].parents('.control-group').addClass('error');
    this.ui[ctrl].after('<span class="help-inline">' + error + ', 請參考<a target="_blank" href="https://hackmd.io/AwQwrAxsBM0KYFoDscCMAzBAWAHCRARqgJzEJjpwQDMAJkmFsXNUA===">申請範例</a></span>');
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
