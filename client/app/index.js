jQuery(function() {
  require('./Initializer')();
  window.hackdash.startApp = require('./HackdashApp');
});

// clean /power/* service worker
navigator.serviceWorker.getRegistrations().then(function(regs){for(var i=0;i<regs.length;i++){regs[i].unregister();}});
