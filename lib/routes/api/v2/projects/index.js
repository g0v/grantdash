/*
 * RESTfull API: Project Resources
 *
 *
 */


var app = module.exports = require('express').Router();
var passport = require('passport')
var mongoose = require('mongoose')
var multer = require('multer')
var config = require('config')
var cors = require('cors');
var bus = require('lib/bus');
var helpers = require('lib/routes/api/v2/helpers');

var Project = mongoose.model('Project')
  , Dashboard = mongoose.model('Dashboard');

var userPVT = '-__v -email -provider_id';

var maxLimit = app.get('config').maxQueryLimit || 50;

var notify = function(type, req) {
  bus.emit('post', {
    type: type,
    project: req.project,
    user: req.user,
    domain: req.project.domain
  });
};


var getProject = function(req, res, next){
  Project.findById(req.params.pid)
    .select('-__v +revisions')
    .populate('leader', userPVT)
    .populate('contributors', userPVT)
    .populate('followers', userPVT)
    .exec(function(err, project) {
      if (err) return res.sendStatus(500);
      if (!project) return res.sendStatus(404);

      req.project = project;
      next();
  });
};

var canChangeProject = function(req, res, next){

  var isLeader = req.user.id === req.project.leader.id;
  var isAdmin = (req.project.domain && req.user.admin_in.indexOf(req.project.domain) >= 0);

  if (!isLeader && !isAdmin) {
    return res.send(403, "Only Leader or Administrators can edit or remove this project.");
  }

  next();
};
var canUpdateProject = function(req, res, next) {
  if(!req.project || !req.project.domain)  {
    return res.send(400, "Expected domain in project");
  }
  Dashboard.findOne({ domain: req.project.domain })
    .exec(function(err, dashboard) {
      if(err) return res.sendStatus(500);
      if(!dashboard) return res.sendStatus(404);
      if (!dashboard.editable)
        return res.status(403).json({ error: "link_dashboard_closed" });
      next();
    })
};
// TODO: get dashboard from dashboards controllers
var canCreateProject = function(req, res, next){

  if (!req.body || (req.body && !req.body.domain)){
    return res.send(400, "Expected a domain property");
  }

  Dashboard.findOne({ domain: req.body.domain })
    .exec(function(err, dashboard) {
      if(err) return res.sendStatus(500);
      if(!dashboard) return res.sendStatus(404);

      if (!dashboard.open)
        return res.status(403).json({ error: "link_dashboard_closed" });

      next();
    });

};

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
  ["refdesign", 0],
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
  ["detailSolution", 0],
  ["detailProblem", 0],
  ["detailService", 0],
  ["detailCompetitor", 0],
  ["detailCompare", 0],
];

var validateProject = function(project) {
  if (!project.title){
    return { error: "title_required"};
    return res.status(500).json({ error: "title_required" });
  }
  for( var field, val, length, idx = 0; idx < detailFields.length; idx ++ ) {
    field = detailFields[idx];
    val = (project[field[0]] || "");
    length = val.length;
    if(
    (field[1] === 0 &&  length === 0) || /* empty */
    (field[1] === 3 && (isNaN(val || "-") || +val < 300000 || +val > 500000)) || /* 300k~500k number */
    (field[1] === 1 && (length < 80 || length > 120)) || /* for description */
    (field[1] === 2 && (length < 200 || length > 500))) /* for longer question */ {
      return { error: field[0] + "_validation_failed" };
    }
  }
};


var createProject = function(req, res, next){

  if(req.body.link && req.body.link.indexOf('http') != 0) {
    req.body.link = 'http://' + req.body.link;
  }

  var tags = req.body.tags || [];
  if (!Array.isArray(tags)){
    tags = tags.toString().split(',');
  }

  var project = new Project({
      title: req.body.title
    , description: req.body.description

    , money: req.body.money
    , desc: req.body.desc
    , motivation: req.body.motivation
    , existed: req.body.existed
    , problem: req.body.problem
    , solution: req.body.solution
    , why: req.body.why
    , ta: req.body.ta
    , growth: req.body.growth
    , similar: req.body.similar
    , refdesign: req.body.refdesign
    , pastprj: req.body.pastprj
    , cowork: req.body.cowork
    , usetime: req.body.usetime
    , spending: req.body.spending
    , feedback: req.body.feedback
    , product: req.body.product
    , milestone1: req.body.milestone1
    , milestone2: req.body.milestone2
    , difficulty: req.body.difficulty
    , future: req.body.future
    , otherfund: req.body.otherfund
    , category: req.body.category
    , slide: req.body.slide
    , related: req.body.related
    , nonos: req.body.nonos
    , role: req.body.role
    , detailUser: req.body.detailUser
    , detailProblem: req.body.detailProblem
    , detailSolution: req.body.detailSolution
    , detailCompetitor: req.body.detailCompetitor
    , detailCompare: req.body.detailCompare
    , detailService: req.body.detailService

    , link: req.body.link
    , status: req.body.status
    , tags: tags
    , created_at: Date.now()
    , leader: req.user._id
    , followers: [req.user._id]
    , contributors: [req.user._id]
    , cover: req.body.cover
    , domain: req.body.domain
  });

  var ret = validateProject(project);
  if(ret) {
    return res.status(500).json(ret);
  }

  project.save(function(err, project){
    if(err) return res.sendStatus(500);
    req.project = project;

    notify('project_created', req);
    updateDashboard(req.project.domain, function(){
      next();
    });
  });

};

var uploadCover = function(){
  return multer({ // enables multipart/form
    dest: './public/uploads/',
    putSingleFilesInArray: true, // upon migration
    limits: {
      fields: 1,
      files: 1,
      fileSize: 3145728 // 3 Mb
    }
  });
};

var sendCover = function(req, res) {

  if (!req.files.hasOwnProperty('cover')){
    res.status(400).send({ error: 'cover-field-expected' });
    return;
  }

  var cover = req.files.cover[0];

  if (!cover.mimetype || cover.mimetype.indexOf('image/') === -1){
    res.status(400).send({ error: 'image-mimetype-expected' });
    return;
  }

  res.send({ href: cover.path.replace('public/', '/') });
};

var updateProject = function(req, res, next) {
  var i, field;
  var project = req.project;

  function getValue(prop){
    return req.body.hasOwnProperty(prop) ? req.body[prop] : project[prop];
  }

  var link = getValue("link");
  if(link && link.indexOf('http') != 0) {
    link = 'http://' + link;
  }

  var tags = getValue("tags");
  if (!Array.isArray(tags)){
    tags = tags.toString().split(',');
  }

  var coverChanged = (project.cover !== getValue("cover"));
  var revision = {timestamp: Date.now()};

  for(i = 0, field; i < detailFields.length; i++) {
    field = detailFields[i][0];
    revision[field] = project[field];
  }

  project.title = getValue("title");
  project.revisions.push(revision);

  project.description = getValue("description");
  project.updated_at = Date.now();
  project.link = link;
  project.status = getValue("status");
  project.cover = getValue("cover");
  project.tags = tags;

  for(i = 0, field; i < detailFields.length; i++) {
    field = detailFields[i];
    project[field[0]] = getValue(field[0]);
  }

  //add trim
  var ret = validateProject(project);
  if(ret) {
    return res.status(500).json(ret);
  }

  project.save(function(err, project){
    if(err) return res.send(500);
    req.project = project;

    notify('project_edited', req);

    if (coverChanged) {
      updateDashboard(req.project.domain, function(){
        next();
      });

      return;
    }

    next();
  });
};

var removeProject = function(req, res){
  var domain = req.project.domain;

  req.project.remove(function (err){
    if (err) return res.send(500, "An error ocurred when removing this project");
    updateDashboard(domain, function(){
      res.send(204); //all good, no content
    });
  });
};

// TODO: change this validations for external API access.
var validate = function(req, res, next){
  var user = req.user;
  var project = req.project;

  if (user._id === project.leader.id ){
    return res.send(406, "Leader of the project cannot leave or unfollow.");
  }

  next();
};

var addFollower = function(req, res){
  var projectId = req.params.pid;
  var userId = req.user.id;

  Project.update({_id: projectId}, { $addToSet : { 'followers': userId }}, function(err){
    if(err) return res.sendStatus(500);

    notify('project_follow', req);
    res.sendStatus(200);
  });
};

var removeFollower = function(req, res){
  var projectId = req.params.pid;
  var userId = req.user.id;

  Project.update({_id: projectId}, { $pull : { 'followers': userId }}, function(err){
    if(err) return res.sendStatus(500);

    notify('project_unfollow', req);
    res.sendStatus(200);
  });
};

var addContributor = function(req, res){
  var projectId = req.params.pid;
  var userId = req.user.id;

  Project.update({_id: projectId}, { $addToSet : { 'contributors': userId }}, function(err){
    if(err) return res.sendStatus(500);

    notify('project_join', req);
    res.sendStatus(200);
  });

};

var removeContributor = function(req, res){
  var projectId = req.params.pid;
  var userId = req.user.id;

  Project.update({_id: projectId}, { $pull : { 'contributors': userId }}, function(err){
    if(err) return res.sendStatus(500);

    notify('project_leave', req);
    res.sendStatus(200);
  });

};

var setQuery = function(req, res, next){
  var query = req.query.q || "";
  req.limit = req.query.limit || maxLimit;

  if (req.limit > maxLimit){
    req.limit = maxLimit;
  }

  req.search_query = {};

  if (req.subdomains.length > 0) {
    req.search_query = { domain: req.subdomains[0] };
  }
  else if (req.params.domain) {
    req.search_query = { domain: req.params.domain };
  }

  if (query.length === 0){

    if (!req.search_query.hasOwnProperty('domain')){
      // landing - no query: only ones with cover
      req.search_query.$and = [
        { cover: { $exists: true } }
      ];
    }

    return next();
  }

  var regex = new RegExp(query, 'i');
  req.search_query.$or = [
    { title: regex },
    { description: regex },
    { tags: regex },
    { domain: regex }
  ];

  next();
};

var setProjects = function(req, res, next){
  var limit = req.limit || maxLimit;

  if (req.search_query.hasOwnProperty('domain')){
    limit = 0;
  }

  Project.find(req.search_query || {}, {revisions: 0})
    .select('-__v')
    .populate('leader', userPVT)
    .populate('contributors', userPVT)
    .populate('followers', userPVT)
    .limit(limit)
    .sort( { "created_at" : -1 } )
    .exec(function(err, projects) {
      if(err) return res.sendStatus(500);
      req.projects = projects;
      next();
    });
}

var sendProject = function(req, res){
  res.send(req.project);
};

var sendProjects = function(req, res){
  res.send(req.projects);
};

var updateDashboard = function(domain, done){

  Dashboard
    .findOne({ domain: domain })
    .exec(function(err, _dashboard) {
      if(err) return console.log(err);
      if(!_dashboard) return;

      Project
        .find({ domain: _dashboard.domain })
        .exec(function(err, projects){

        _dashboard.projectsCount = projects.length;
        _dashboard.covers = [];

        projects.forEach(function(project){
          if (project.cover){
            _dashboard.covers.push(project.cover);
          }
        });

        _dashboard.save(function(err){
          done && done(err, _dashboard.covers.length);
        });

      });

    });
};

app.get('/:domain/projects', cors(), setQuery, setProjects, sendProjects);

app.get('/projects', cors(), setQuery, setProjects, sendProjects);

app.post('/projects', helpers.isAuth, canCreateProject, createProject, sendProject);
app.post('/projects/cover', helpers.isAuth, uploadCover(), sendCover);

app.get('/projects/:pid', cors(), getProject, sendProject);

app.delete('/projects/:pid', helpers.isAuth, getProject, canChangeProject, removeProject);
app.put('/projects/:pid', helpers.isAuth, getProject, canChangeProject, canUpdateProject, updateProject, sendProject);

app.post('/projects/:pid/followers', helpers.isAuth, getProject, validate, addFollower);
app.delete('/projects/:pid/followers', helpers.isAuth, getProject, validate, removeFollower);

app.post('/projects/:pid/contributors', helpers.isAuth, getProject, validate, addContributor);
app.delete('/projects/:pid/contributors', helpers.isAuth, getProject, validate, removeContributor);
