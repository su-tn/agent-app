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
                var priceRange = user.get('priceRange');
                
                if(!userType){
                    res.redirect('/signup-2');
                } else if (!priceRange){
                    res.redirect('/signup-2-agent');
                } else {
                    res.redirect('/dashboard');
                }
			}
		}, function(error) {
			// Login failed, redirect back to login form.
			console.error(error);
			res.render('account/index', {
				error: error.message,
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
    
	res.redirect('/login');
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
                    res.redirect('/login?redirectUrl=signup-2')
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
    //if loged
    if(res.locals.isAuthenticated){
        //if post
        if(req.body.user_type){
            var user = res.locals.user;
            //user_type: 1 - buyer, 2 - seller
            //sell_time: 1 - ASAP, 2 - 1 year, 3 -  1-2 year, 4 - 2-5 year
            //price_range: 1 - <$100,000 ... 6 - over $5,000,000
            
            user.set('userType', req.body.user_type);
            user.set('sellOrBuyTime', req.body.sell_time);
            user.set('priceRange', req.body.price_range);
            user.save().then(function(){
                res.redirect('/dashboard');
            }, function(error){
                console.error(error);
                res.render('account/signup2', {error: error.message});
            });
        } else {
            res.render('account/signup2');
        }
    } else {
        res.redirect('/login?redirectUrl=signup-2');
    }
};

exports.signupAgent = function(req, res) {
    res.render('account/signupAgent');
};

exports.signupAgentVerify = function(req, res) {
    var agent_id = req.body.agent_id;
    if(agent_id){
		var user = new Parse.User();
        var username = req.body.email;
        var password = req.body.password;
        
		user.set("username", username);
		user.set("password", password);
		user.set("email", username);
		user.set("agentId", agent_id);
		user.set("userType", '3'); //agent
        
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

exports.signup2Agent = function(req, res) {
    if(res.locals.isAuthenticated){
        if(req.body.kind_of_client){
            var user = res.locals.user;
            //kind_of_client: 1(byer), 2(seller), 3(both)
            //price_range_client: 1(500-750), 2(750 - 1mili), 3(over 1mili), 4(all)
            
            user.set('kindOfClient', req.body.kind_of_client);
            user.set('priceRange', req.body.price_range_client);
            user.save().then(function(){
                res.redirect('/dashboard');
            }, function(error){
                res.render('account/signup2Agent', {error: error.message});
            })
        } else {
            res.render('account/signup2Agent');
        }
    } else {
        res.redirect('/login?redirectUrl=signup-2-agent');
    }
};

exports.dashboard = function(req, res) {
    if(res.locals.isAuthenticated) {
        res.render('dashboard/index');
    } else {
        res.redirect('/login?redirectUrl=dashboard');
    }
};

exports.updateProfile = function(req, res) {
    if (res.locals.isAuthenticated) {
        var user = res.locals.user;
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
    } else {
        res.json({error: 'User is not login'});
    }
}

exports.updateProfileQuestion = function(req, res) {
    if (res.locals.isAuthenticated) {
        var user = res.locals.user;
        var userType = user.get('userType');
        
        //buyer and seller
        if(userType == 1 || userType == 2) {
            if(req.body.language) user.set('language', req.body.language);
            if(req.body.type_of_property) user.set('typeOfProperty', req.body.type_of_property);
            if(req.body.region_looking) user.set('regionLooking', req.body.region_looking);
            if(req.body.features_required) user.set('featuresRequired', req.body.features_required);
            if(req.body.important_target_area) user.set('importantTargetArea', req.body.important_target_area);
            if(req.body.important_price_range) user.set('importantPriceRange', req.body.important_price_range);
            if(req.body.important_type_of_property) user.set('importantTypeOfProperty', req.body.important_type_of_property);
            if(req.body.important_complaint) user.set('importantComplaint', req.body.important_complaint);
            if(req.body.special_requirement) user.set('specialRequirement', req.body.special_requirement);
        }
        
        //buyer
        if(userType == 1) {
            if(req.body.region_looking) user.set('regionLooking', req.body.region_looking);
            if(req.body.features_required) user.set('featuresRequired', req.body.features_required);
        }
        
        //seller
        if(userType == 1 && req.body.address_of_property) {
            user.set('addressOfProperty', req.body.address_of_property);
        }
        
        //agent
        if(userType == 3) {
            if(req.body.time_have_agent) user.set('timeHaveAgent', req.body.time_have_agent);
            if(req.body.time_close_deal) user.set('timeCloseDeal', req.body.time_close_deal);
            if(req.body.have_ethic_complaint) user.set('haveEthicComplaint', req.body.have_ethic_complaint);
            if(req.body.describe_complaint) user.set('describeComplaint', req.body.describe_complaint);
            if(req.body.describe_approach) user.set('describeApproach', req.body.describe_approach);
        }
        
        user.save().then(function(user){
            res.json({result: 'success'});
        }, function(error){
            console.error(error);
            res.json({error: error.message});
        })
    } else {
        res.json({error: 'User is not login'});
    }
}