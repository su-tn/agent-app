var express = require('express');
var moment = require('moment');
var _ = require('underscore');
var md5 = require('cloud/libs/md5.js');
var parseExpressHttpsRedirect = require('parse-express-https-redirect');
var parseExpressCookieSession = require('parse-express-cookie-session');

// Controller code in separate files.
var homeController = require('cloud/controllers/home.js');
var accountController = require('cloud/controllers/account.js');
var blogController = require('cloud/controllers/blog.js');
var adminController = require('cloud/controllers/admin.js');

// Required for initializing Express app in Cloud Code.
var app = express();

// We will use HTTP basic auth to protect some routes (e.g. adding a new blog post)
var basicAuth = express.basicAuth('admin','suisui123');

// The information showed about the poster
var userEmail = 'YOUR_EMAIL';
var userDisplayName = 'YOUR_DISPLAY_NAME';
var userDescription = 'YOUR_DESCRIPTION';

// Instead of using basicAuth, you can also implement your own cookie-based
// user session management using the express.cookieSession middleware
// (not shown here).

// Global app configuration section
app.set('views', 'cloud/views');
app.set('view engine', 'ejs');  // Switch to Jade by replacing ejs with jade here.

// In your middleware setup...
app.use(parseExpressHttpsRedirect());  // Require user to be on HTTPS.
app.use(express.cookieParser('SE&#G89d'));
app.use(parseExpressCookieSession({ cookie: { maxAge: 3600000 } }));

app.use(express.bodyParser());
app.use(express.methodOverride());
 

// Note that we do not write app.use(basicAuth) here because we want some routes
// (e.g. display all blog posts) to be accessible to the public.

// You can use app.locals to store helper methods so that they are accessible
// from templates.
app.locals._ = _;
app.locals.hex_md5 = md5.hex_md5;
app.locals.userEmail = userEmail;
app.locals.userDisplayName = userDisplayName;
app.locals.userDescription = userDescription;
app.locals.formatTime = function(time) {
  return moment(time).format('MMMM Do YYYY, h:mm a');
};
// Generate a snippet of the given text with the given length, rounded up to the
// nearest word.
app.locals.snippet = function(text, length) {
  if (text.length < length) {
    return text;
  } else {
    var regEx = new RegExp("^.{" + length + "}[^ ]*");
    return regEx.exec(text)[0] + "...";
  }
};

// Show all posts on homepage
app.get('/', homeController.index);
app.get('/contact-us', homeController.contact);
app.post('/contact-us', homeController.contact);

app.get('/signup-1', accountController.signup1);
app.post('/signup-1', accountController.signup1);
app.get('/signup-2', accountController.signup2);
app.post('/signup-2', accountController.signup2);
app.get('/signup-agent', accountController.signupAgent);
app.get('/signup-agent-verify', accountController.signupAgentVerify);
app.post('/signup-agent-verify', accountController.signupAgentVerify);
app.get('/signup-2-agent', accountController.signup2Agent);

app.get('/login', accountController.login);
app.post('/login', accountController.login);
app.get('/logout', accountController.logout);
app.get('/dash-matches', accountController.dashMatches);

app.get('/blog', blogController.blog);
app.get('/blog/search/tag/:tag', blogController.searchByTag);
app.get('/blog/search/archive/:archive', blogController.searchByArchive);
app.post('/blog/search/name', blogController.searchByName);
app.get('/blog/:slug', blogController.blogDetail);

app.get('/:slug', homeController.showPage);

// Route for admin pages
app.get('/app/admin', basicAuth, adminController.index);

// Required for initializing Express app in Cloud Code.
app.listen();