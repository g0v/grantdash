/**
 * VIEW: Full Project view
 *
 */

var template = require("./templates/full.hbs")
  , Sharer = require("../Sharer");


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
  ["growth", 2],
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
  ["difficulty", 0],
  ["future", 0],
  ["otherfund", 0],
  ["category", 0],
  ["slide", 4],
  ["related", 0],
  ["nonos", 0],
  ["role", 0],
  ["detailUser", 0],
  ["detailService", 0],
  ["detailCompetitor", 0],
  ["detailProblem", 0],
  ["detailCompare", 0],
  ["detailSolution", 0]
];


var fieldTitles = {
 "money":  "你需要多少錢？ ( 30 ~ 50 萬之間 ) ",
 "desc":  "請以 80 ~ 120 字、簡短且非專業人士也能理解的方式介紹此專案",
 "motivation":  "你為什麼要做這個計劃 （ 個人動機 ）？",
 "existed":  "這是一個現有的計畫嗎？若是，請說明是否為開源及提供網址",
 "nonos": "本專案是否有非開源元件？", 
 "detailUser": "使用者族群",
 "detailProblem": "要解決的問題",
 "detailService": "提供的服務",
 "detailSolution": "如何解決問題",
 "detailCompetitor": "現有的解決方式",
 "detailCompare": "差別與區分不同",
 "problem": "這個計畫要解決什麼問題？ ( 200 ~ 500 字 ) ",
 "solution": "你預計用什麼方式解決此問題？ (200 ~ 500 字 ) ",
 "why": "為什麼你的方法可以解決此問題？ (200 ~ 500 字 ) ",
 "ta": "請列出這個計畫的目標對象，他們的需求、情境與使用動機 (200-500 字) ",
 "growth": "請說明你如何讓目標用戶知道這個服務並完成其第一次使用，以及在他有需求時願意再來用這個服務？(200-500字)",
 "similar": "是否已有相似的專案，本計劃的差異與不可取代性為何？",
 "related": "過去有作過相關主題的計畫嗎？",
 "refdesign": "請提供本計劃的示意圖或介面設計草圖 ( 請以連結方式提供圖片 ) ",
 "pastprj": "過去作過什麼開源開發計畫（open source project）？ (可提供 GitHub 帳號) ",
 "cowork": "這個計畫預計跟什麼團體合作？",
 "usetime": "預計六個月內將花多少小時作這件事？",
 "spending": "獎助金預計如何使用（大略比例）？",
 "feedback": "打算如何讓社群參與以及回饋意見？",
 "product": "請說明本專案會產出的開源軟體套件或開放授權文件 (請條列個別元件的輸入輸出或其功能) ",
 "milestone1": "請說明計畫期中的工作里程碑與驗收給付標準",
 "milestone2": "請說明計畫期末的工作里程碑與驗收標準",
 "difficulty": "你覺得這個提案可能會面臨的困難有哪些，你又會如何解決這些困難？",
 "future": "計畫結束後未來可能進一步的發展？",
 "otherfund": "本計畫目前是否已有、或正在申請其他的資金來源？若有，請說明申請本獎助的內容與其他計畫的差異",
 "category": "依獎助金的主題方向畫分的話，本計畫屬於哪個分類?",
 "slide": "若有專案介紹的投影片，請提供",
 "role": "請簡介參與人員及提案者在專案中的角色(例如：developer、PM)，以及團隊背景介紹",
};

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
    "click .revisions a": "showRevision",
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

  showRevision: function(e){
    var idx = +$(e.target).attr("data-idx");
    var head = $("#projectRevisionDiff .modal-header h4");
    var body = $("#projectRevisionDiff .modal-body")[0];
    head.text("版本 " + (idx + 1));
    body.innerHTML = "";

    function diff(field, value) {
      var div = document.createElement("div");
      var h3 = document.createElement("h3");
      h3.innerText = fieldTitles[field];
      div.appendChild(h3);
      body.appendChild(div);
      JsDiff.diffChars("" + value.old, "" + value.cur).map(function(part) {
        var span = document.createElement("span");
        span.className = "pre-wrap " + (part.added ? "added" : (part.removed ? "removed" : ""));
        span.innerText = part.value;
        div.appendChild(span);
      });
    }
    for(var i = 0, field, value = {}; i < detailFields.length; i++ ) {
      field = detailFields[i][0];
      value = {
        cur: this.model.attributes.revisions[idx][field],
        old: this.model.attributes.revisions[idx ? idx - 1 : idx][field]
      };
      diff(field, value);
    }
    $("#projectRevisionDiff").modal("show");
},

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

});
