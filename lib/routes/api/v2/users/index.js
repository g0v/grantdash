/*
 * RESTfull API: Dashboard Resources
 *
 *
 */

var app = module.exports = require('express').Router();
var passport = require('passport');
var mongoose = require('mongoose');
var _ = require('underscore');
var config = require('config');
var cors = require('cors');
var helpers = require('lib/routes/api/v2/helpers');

var User = mongoose.model('User');
var Dashboard = mongoose.model('Dashboard');
var Project = mongoose.model('Project');
var Collection = mongoose.model('Collection');
var Draft = mongoose.model('Draft');

var teamIds = config.team || [];
var maxLimit = config.maxQueryLimit || 50;

var getInstanceAdmins = function(req, res, next){
  var domain = req.params.domain;

  User
    .find({ "admin_in": domain })
    .select('-__v -provider_id -email')
    .exec(function(err, users) {
      if(err) return res.send(500);
      req.users = users || [];
      next();
    });
};

var isDashboardAdmin = function(req, res, next){
  var domain = req.params.domain;

  var isAdmin = (req.user.admin_in.indexOf(domain) >= 0);

  if (!isAdmin) {
    return res.send(403, "Only Administrators are allowed for this action.");
  }

  next();
};

var setQuery = function(req, res, next){
  var query = req.query.q || "";

  req.limit = req.query.limit || maxLimit;

  if (req.limit > maxLimit){
    req.limit = maxLimit;
  }

  req.search_query = {};

  if (query.length === 0){
    // landing - only the ones with bio
    req.search_query.$and = [
      { bio: { $exists: true } },
      { $where: "this.bio.length>0" }
    ];
    req.limit = 100;
    req.isLanding = true;
    return next();
  }

  var regex = new RegExp(query, 'i');
  req.search_query.$or = [ { name: regex }, { username: regex }, { email: regex } ];

  next();
};

var getUser = function(req, res, next){
  User
    .findById(req.params.uid)
    .select('-__v -provider_id ' + (req.isAuthenticated() ? '' : '-email') )
    .exec(function(err, user){
      if(err) return res.sendStatus(500);
      if(!user) return res.sendStatus(404);
      req.user_profile = user.toObject();
      next();
    });
};

var getUsers = function(req, res, next){
  var sort = "name username";
  if (req.isLanding){
    sort = "-created_at " + sort;
  }

  User
    .find(req.search_query || {})
    .select('-__v -provider_id -email')
    .limit(req.limit || maxLimit)
    .sort(sort)
    .exec(function(err, users) {
      if(err) return res.send(500);
      req.users = users;
      next();
    });
};

var canUpdate = function(req, res, next){
  var isLogedInUser = req.user.id === req.params.uid;

  if (!isLogedInUser) {
    return res.send(403, "Only your own profile can be updated.");
  }

  next();
};

var addAdmin = function(req, res, next){
  var domain = req.params.domain;

  User.update({_id: req.user_profile._id }, { $addToSet : { 'admin_in': domain }}, function(err){
    if(err) return res.send(500);
    next();
  });

};

var updateUser = function(req, res){
  var user = req.user;

  //add trim

  if (!req.body.name){
    return res.send(500, { error: "name_required" });
  }

  if (user.provider) {
    if (req.body.email && req.body.email !== user.email){
      return res.send(500, { error: "email_locked" });
    }
  }
  else {
    if (req.body.email){
      return res.send(500, { error: "email_locked" });
    }
    user.email = req.body.email;
  }

  user.name = req.body.name;
  user.bio = req.body.bio;

  user.save(function(err, user){
    if(err) {
      if (err.errors.hasOwnProperty('email')){
        return res.send(500, { error: "email_invalid" });
      }

      return res.send(500);
    }

    res.send(200);
  });
};

var setCollections = function(req, res, next){

  Collection
    .find({ "owner": req.user_profile._id })
    .select('-__v')
    .exec(function(err, collections) {
      if(err) return res.send(500);
      req.user_profile.collections = collections || [];
      next();
    });
};

var setDashboards = function(req, res, next){

  Dashboard
    .find({ "domain": { $in: req.user_profile.admin_in } })
    .select('-__v')
    .exec(function(err, dashboards) {
      if(err) return res.send(500);
      req.user_profile.dashboards = dashboards || [];
      next();
    });

};

var setProjects = function(req, res, next){

  Project
    .find({ "leader": req.user_profile._id })
    .select('-__v')
    .exec(function(err, projects) {
      if(err) return res.send(500);
      req.user_profile.projects = projects || [];
      next();
    });
};

var setContributions = function(req, res, next){
  var uid = req.user_profile._id;

  Project
    .find({ "leader": { $ne: uid } , "contributors": uid })
    .select('-__v')
    .exec(function(err, projects) {
      if(err) return res.send(500);
      req.user_profile.contributions = projects || [];
      next();
    });

};

var setLikes = function(req, res, next){
  var uid = req.user_profile._id;

  Project
    .find({ "leader": { $ne: uid }, "followers": uid })
    .select('-__v')
    .exec(function(err, projects) {
      if(err) return res.send(500);
      req.user_profile.likes = projects || [];
      next();
    });

};

var getTeam = function(req, res, next){
  req.users = [];

  if (teamIds.length > 0){

    User
      .find({ _id: { $in: teamIds } })
      .select("_id name picture bio provider username")
      .exec(function(err, users) {
        if(err)
          return res.send(500, "could not retrieve team users");

        req.users = [];

        users.forEach(function(user){
          var idx = teamIds.indexOf(user._id.toString());
          req.users[idx] = user;
        });

        next();
      });

    return;
  }

  next();
};

var sendUser = function(req, res){
  res.send(req.user_profile);
};

var sendUsers = function(req, res){
  res.send(req.users);
};

var sendDraft = function(req, res){
  Draft
    .find({ "id": req.user._id }) 
    .exec(function(err, draft) {
      if(err) return res.send(500);
      res.send(JSON.stringify({draft: draft[0].draft}));
    });
};

var updateDraft = function(req, res){
  Draft 
    .findOne({ "id": req.user._id }) 
    .exec(function(err, draft) {
      if(err) {
        var draft = new Draft({
          id: req.user._id,
          draft: req.body.draft,
        });
        draft.save(function(err, draft){
            res.send(200);
            return;
        });
        return;
      }
      draft.draft = req.body.draft;
      draft.save();
      res.send(200);
    });
};

app.get('/:domain/draft', sendDraft);
app.post('/:domain/draft', updateDraft);

app.get('/:domain/admins', cors(), getInstanceAdmins, sendUsers);
app.post('/:domain/admins/:uid', helpers.isAuth, isDashboardAdmin, getUser, addAdmin, sendUser);

app.get('/users', cors(), setQuery, getUsers, sendUsers);

app.get('/users/team', getTeam, sendUsers);
app.get('/users/:uid', cors(), getUser, sendUser);

app.get('/profiles/:uid', cors(), getUser, setCollections, setDashboards, setProjects, setContributions, setLikes, sendUser);
app.put('/profiles/:uid', helpers.isAuth, getUser, canUpdate, updateUser);

if (config.discourseSsoSecret) {
  var discourseSso = require('sso-discourse');
  var sign = discourseSso.sso(config.discourseSsoSecret);
  app.get('/sso', function(req, res) {
    if (!req.isAuthenticated()) {
      var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
      return res.redirect(`/login?redirect=${encodeURIComponent(fullUrl)}`);
    }
    var {sso, sig} = req.query;
    if (sso && sig) {
      var user = req.user;
      var login = {
          email: user.email,
          username: user.email,
          name: user.name,
          external_id: user._id.toString(),
          avatar_url: user.picture
        };
      var signed = sign(login, {sso, sig});
      console.log('signing sso auth for', login, 'got', signed);
      return res.redirect(`${config.discourseUrl}session/sso_login?sso=${signed.sso}&sig=${signed.sig}`);
    }
    return res.redirect('/');
  });
}
