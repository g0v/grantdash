
var mongoose = require('mongoose');
var config = require('config');

var User = mongoose.model('User')
  , Project = mongoose.model('Project')
  , Dashboard = mongoose.model('Dashboard')
  , Collection = mongoose.model('Collection');

function checkEntityResponse(res, err, entity){
  if (err) {
    console.log(err);
    res.status(500);
    res.render('500');
    return true;
  }

  if (!entity) {
    res.status(404);
    res.render('404');
    return true;
  }
}

var hdTitle = config.title || 'HackDash';
var hdDomain = config.host;
var baseURL = 'https://' + hdDomain;

export const projects = function(req, res, next){
  res.locals.meta = {
    url: baseURL + '/projects/',
    title: "Projects",
    description: "Search projects at " + hdTitle
  };
  next();
};

/* XXX: refactor and share code with Edit.js */
var parse = require("markdown-to-ast").parse;
var headings = ["§ 請以 80 ~ 120 字簡短地說明這個專案",
 "§ 你過去參與過什麼開源開發計畫（open source project）？",
 "§ 這個計畫要解決什麼問題？",
 "§ 你為什麼要做這個計劃 （ 個人動機 ）？",
 "§ 你預計用什麼方式解決此問題？",
 "§ 這個計畫的目標對象是誰？",
 "§ 這個計畫預計跟什麼團體合作？",
 "§ 過去有作過相關主題的計畫嗎？",
 "§ 預計六個月內將花多少小時作這件事？需要多少經費？（30 萬到 50 萬）",
 "§ 請自行定義計畫的工作里程碑與最後的驗收標準 （若沒有達成這些標準的話，我們會不給你錢喔！)",
 "§ 未來可能進一步的發展？",
 "§ 本計畫目前是否已有、或正在申請其他的資金來源？若有，請說明申請本獎助的內容與原計畫的差異。",
 "§ 若有專案介紹的投影片，請提供：",
];

function getAbstract(text) {
  var expected_headings = headings.slice(0);
  var AST = parse(text);
  var current_heading;
  var has_content = {};
  var contents = {};
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
        if (!contents[current_heading]) {
          contents[current_heading] = [];
        }
        contents[current_heading].push(node);
      }
    }
  } }
  return contents[headings[0]].map(function(node) { return node.raw }).join("\n\n");
}


export const project = function(req, res, next){
  var domain = getDashboardName(req);

  Project.findById(req.params.pid, function(err, project) {
    if (checkEntityResponse(res, err, project)) return;

    req.project = project;
    res.locals.meta = {
      url: baseURL + '/projects/' + project._id,
      title: project.title,
      description: getAbstract(project.description),
      image: project.cover
    };

    Dashboard.findOne({ domain: domain }, function(err, dashboard) {
      if(!err && dashboard && dashboard.title){
        res.locals.meta.title += " - " + dashboard.title;
      }
      next();
    });
  });
};

export const dashboards = function(req, res, next){
  res.locals.meta = {
    url: baseURL,
    title: "Dashboards",
    description: "Search dashboards at " + hdTitle
  };

  next();
};

export const dashboard = function(req, res, next){
  var domain = getDashboardName(req);

  if (!domain) {
    // Home Page

    res.locals.meta = {
      url: baseURL,
      title: "g0v 公民科技創新獎助金",
      description: "總獎金 300 萬. 6 個月、每個專案 30-50 萬. 2017/1/31 提案截止",
      image: "https://grants.g0v.tw/images/static/fb_share.jpg"
    };

    return next();
  }

  Dashboard.findOne({ domain: domain }, function(err, dashboard) {
    if (checkEntityResponse(res, err, dashboard)) return;

    res.locals.meta = {
      url: baseURL + '/dashboards/' + domain,
      title: dashboard.title,
      image: "https://grants.g0v.tw/images/static/fb_share.jpg",
      description: dashboard.description
    };

    if (!dashboard.description){
      Project.findOne({ domain: domain }, function(err, project) {
        if (project && project.description){
          res.locals.meta.description = project.description;
        }
        next();
      });
    } else {
      next();
    }
  });
};

export const collections = function(req, res, next){
  res.locals.meta = {
    url: baseURL + '/collections/',
    title: "Collections",
    description: "Search collections at " + hdTitle
  };

  next();
};

export const collection = function(req, res, next){
  Collection.findById(req.params.cid, function(err, collection) {
    if (checkEntityResponse(res, err, collection)) return;

    res.locals.meta = {
      url: baseURL + '/collections/' + collection._id,
      title: collection.title,
      description: collection.description
    };

    next();
  });
};

export const users = function(req, res, next){
  res.locals.meta = {
    url: baseURL + '/users/',
    title: "People",
    description: "Search people at " + hdTitle
  };

  next();
};

export const user = function(req, res, next){
  User.findById(req.params.user_id, function(err, user){
    if (checkEntityResponse(res, err, user)) return;

    res.locals.meta = {
      url: baseURL + '/users/' + user._id,
      title: user.name,
      description: user.bio
    };

    next();
  });
};

export const check = function(){
  return function(req, res, next) {

    if (!res.locals.meta){
      res.locals.meta = {};
    }

    var metas = res.locals.meta;

    if (metas.title){
      metas.title += " - ";
    } else {
      metas.title = "";
    }

    if (!metas.image){
      metas.image = "/images/landing-banner.png";
    }

    if (!metas.url){
      metas.url = baseURL;
    }

    metas.title += hdTitle;
    metas.image =  baseURL + metas.image;

    next();
  };
};

export const getDashboardName = function(req){
  if (req.subdomains.length > 0) {
    return req.subdomains[0];
  } else if (req.params.dashboard) {
    return req.params.dashboard;
  }
  return null;
};
