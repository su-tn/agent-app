var _ = require('underscore');

exports.login = function(req, res) {
	var username = req.body.email;
	var redirectUrl = req.query.redirectUrl;
    console.log(redirectUrl);

	if (username) {
		Parse.User.logIn(username, req.body.password).then(function(user) {
			// Login succeeded, redirect to homepage.
			// parseExpressCookieSession will automatically set cookie.
            if (redirectUrl) {
            	res.redirect(redirectUrl);
            } else {
                var userType = user.get('userType');
                
                if(userType == 1){   //buyer
                    res.redirect('/dash-buyer');
                } else if(userType == 2){   //seller
                    res.redirect('/dash-seller');
                } else if(userType == 3){   //agent
                    res.redirect('/dash-agent');
                } else {
                    res.redirect('/signup-2');
                }
			}
		}, function(error) {
			// Login failed, redirect back to login form.
			console.error(error);
			res.render('account/index', {
				message: error.message,
                redirectUrl: redirectUrl
			});
		});
	} else {
		res.render('account/index', {
            redirectUrl: redirectUrl
		});
	}
};

exports.logout = function(req, res) {
    if (Parse.User.current()) {
        Parse.User.logOut();
    }
    
	res.redirect('/');
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

exports.updateProfile = function(req, res) {
    if (Parse.User.current()) {
		Parse.User.current().fetch().then(function(user) {
			console.log(user);
            if(req.body.firstName) user.set('firstName', req.body.firstName);
            if(req.body.lastName) user.set('lastName', req.body.lastName);
            if(req.body.agentId) user.set('agentId', req.body.agentId);
            if(req.body.password) user.set('password', req.body.password);
            user.save().then(function(user){
                res.json({result: 'success'});
            }, function(error){
                console.error(error);
                res.json({error: error.message});
            })
        })
    } else {
        res.json({error: 'User is not login'});
    }
}

exports.signup1 = function(req, res) {
    if(req.body.email){
		var user = new Parse.User();
        var username = req.body.email;
        var password =req.body.password;
        
		user.set("username", username);
		user.set("password", password);
		user.set("email", username);
        
		user.signUp(null, {
			success: function(user) {
			 
				Parse.Cloud.run('signUpEmailNotify', {
					email_to: username
				});
                
                Parse.User.logIn(username, password).then(function(user) {
    				res.json({
    				    success: "success"
    				});
        		}, function(error) {
        			console.error(error);
        		});
			},
			error: function(user, error) {
				console.error("Error: " + error.code + " " + error.message);
				res.json({
				    error: error.message
				});
			}
		});
    } else {
        res.render('account/signup1');
    }
};

exports.signup2 = function(req, res) {
    if (Parse.User.current()) {
		Parse.User.current().fetch().then(function(user) {
			console.log(user);
            
            if(req.body.user_type){
                //user_type: 1 - buyer, 2 - seller
                //sell_time: 1 - ASAP, 2 - 1 year, 3 -  1-2 year, 4 - 2-5 year
                //price_range: 1 - <$100,000 ... 6 - over $5,000,000
                
                user.set('userType', req.body.user_type);
                user.set('sellTime', req.body.sell_time);
                user.set('priceRange', req.body.price_range);
                user.save().then(function(){
                    res.redirect('/dash-matches');
                }, function(error){
                    console.error(error);
                    res.render('account/signup2', {isAuthenticated: true, error: error.message});
                });
            } else {
                res.render('account/signup2', {isAuthenticated: true});
            }
        });
    } else {
        res.redirect('signup-1');
    }

};

exports.signupAgent = function(req, res) {
    res.render('account/signupAgent');
};

exports.signup2Agent = function(req, res) {
    if(req.body.user_type){
        res.redirect('/dash-matches');
    } else {
        res.render('account/signup2Agent');
    }
};

exports.signupAgentVerify = function(req, res) {
    if(req.body.agent_id){
		var user = new Parse.User();
        
        var agent_id = req.body.agent_id;
        var username = req.body.email;
        var password =req.body.password;
        
		user.set("username", username);
		user.set("password", password);
		user.set("email", username);
		user.set("agentId", agent_id);
        
		user.signUp(null, {
			success: function(user) {
			 
				Parse.Cloud.run('signUpEmailNotify', {
					email_to: username
				});
                
                Parse.User.logIn(username, password).then(function(user) {
    				res.json({
    				    success: "success"
    				});
        		}, function(error) {
        			console.error(error);
        		});
			},
			error: function(user, error) {
				console.error("Error: " + error.code + " " + error.message);
				res.json({
				    error: error.message
				});
			}
		});
    } else {
        res.render('account/signupAgentVerify');
    }
};

exports.dashSeller = function(req, res) {
    if(res.locals.isAuthenticated == true) {
        res.render('dashboard/dashSeller', {isAuthenticated: true});
    } else {
        res.redirect('login');
    }
};

exports.dashBuyer = function(req, res) {
    if(res.locals.isAuthenticated == true) {
        res.render('dashboard/dashBuyer', {isAuthenticated: true});
    } else {
        res.redirect('login');
    }
};

exports.dashAgent = function(req, res) {
    if(res.locals.isAuthenticated == true) {
        res.render('dashboard/dashAgent', {isAuthenticated: true});
    } else {
        res.redirect('login');
    }
};
