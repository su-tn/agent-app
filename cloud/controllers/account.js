var _ = require('underscore');

exports.commonRender = function(req, res, viewUrl, data) {
	var querySetting = new Parse.Query('Settings');
	var queryMenu = new Parse.Query('StaticPage');
	if (!data) data = {};

	queryMenu.equalTo('type', 'menu');
	queryMenu.equalTo('isPublished', true);
	queryMenu.ascending('order');
	queryMenu.find().then(function(menus) {
		querySetting.first().then(function(result) {
			if (!result) res.send(500, 'Failed loading page');
			data.menus = menus;

			var template = result.toJSON().data.template;
			var headerTemplate = template.header;
			var footerTemplate = template.footer;
			data.headerContent = _.template(headerTemplate, data);
			data.footerContent = _.template(footerTemplate, data);

			res.render(viewUrl, data);
		}, function() {
			res.send(500, 'Failed loading page');
		});
	}, function() {
		res.send(500, 'Failed loading page');
	});
}

exports.login = function(req, res) {
	var username = req.body.username;
	var redirectUrl = req.query.redirectUrl;
    console.log(redirectUrl);

	if (username) {
		Parse.User.logIn(username, req.body.password).then(function(user) {
			// Login succeeded, redirect to homepage.
			// parseExpressCookieSession will automatically set cookie.
			if (redirectUrl) {
				res.redirect(redirectUrl);
			} else if (user.get('organization')) {
				res.redirect('/org/dashboard');
			} else {
				res.redirect('/account/setting');//res.redirect('/org/search');
			}
		}, function(error) {
			// Login failed, redirect back to login form.
			console.error(error);
			exports.commonRender(req, res, 'account/index', {
				message: error.message,
                redirectUrl: redirectUrl
			});
		});
	} else {
		exports.commonRender(req, res, 'account/index', {
            redirectUrl: redirectUrl
		});
	}
};

exports.logout = function(req, res) {
    if (Parse.User.current()) {
        Parse.User.logOut();
    }
    
	res.redirect('/org/login');
};

exports.resetPassword = function(req, res) {
	var email = req.body.email;

	if (email) {
		Parse.User.requestPasswordReset(email, {
			success: function(user) {
				console.log(user);

				exports.commonRender(req, res, 'organization/message', {
					message: 'Password reset request was sent successfully. Please check your email.'
				});
			},
			error: function(error) {
				console.error(error);

				exports.commonRender(req, res, 'organization/message', {
					message: error.message
				});
			}
		});
	} else {
		exports.commonRender(req, res, 'account/resetpassword');
	}
};

exports.setting = function(req, res) {
	if (Parse.User.current()) {
		Parse.User.current().fetch().then(function(user) {
			// Render the user profile information (e.g. email, phone, etc).
			console.log(user);
            
            var configDefault = {
              "email": {
                "campaign_given": true,
                "give": true,
                "give_reach_goal": true,
                "like": true,
                "reach_goal": true,
                "share": true
              },
              "push": {
                "campaign_given": true,
                "give": true,
                "give_reach_goal": true,
                "like": true,
                "reach_goal": true,
                "share": true
              }
            };
            
            var notificationConfig = user.get('notification_config') || configDefault;
            var configEmail = notificationConfig.email;
            console.log(configEmail);
            
            var unsubcribe = true;
            if(configEmail.give || configEmail.campaign_given || configEmail.like ||
                configEmail.share || configEmail.reach_goal || configEmail.give_reach_goal) unsubcribe = false;
            
            if(req.body.give){
                
                if(req.body.unsubcribe){
                    notificationConfig.email.give = false;
                    notificationConfig.email.campaign_given = false;
                    notificationConfig.email.like = false;
                    notificationConfig.email.share = false;
                    notificationConfig.email.reach_goal = false;
                    notificationConfig.email.campaign_given = false;
                    unsubcribe = true;
                } else {
                    notificationConfig.email.give = (req.body.give == "true");
                    notificationConfig.email.campaign_given = (req.body.campaign_given == "true");
                    notificationConfig.email.like = (req.body.like == "true");
                    notificationConfig.email.share = (req.body.share == "true");
                    notificationConfig.email.reach_goal = (req.body.reach_goal == "true");
                    notificationConfig.email.give_reach_goal = (req.body.give_reach_goal == "true");
                    unsubcribe = false;
                }
                
                configEmail = notificationConfig.email;
                user.set('notification_config', notificationConfig);
                user.save().then(function(user){
                    exports.commonRender(req, res, 'account/setting', {user: user, config: configEmail, unsubcribe: unsubcribe});
                }, function(error){
                    console.error(error);
                    res.send(500, 'Save failed');
                });
                
            } else {
                exports.commonRender(req, res, 'account/setting', {user: user, config: configEmail, unsubcribe: unsubcribe});
            }
		}, function(error) {
			// Render error page.
            console.error(error);
			res.send(500, 'Failed loading user');
		});
	} else {
		res.redirect('/org/login');
	}
};