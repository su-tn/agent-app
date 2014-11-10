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
                    if(userType == '3') res.redirect('/dashboard-agent');
                    else res.redirect('/dashboard');
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
            user.set('timeframe', req.body.timeframe);
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
            var timeframe = req.body.timeframe;
            var price_range = req.body.price_range;
            //kind_of_client: 1(byer), 2(seller), 3(both)
            //price_range_client: 1(500-750), 2(750 - 1mili), 3(over 1mili), 4(all)
            
            user.set('kindOfClient', req.body.kind_of_client);
            if( typeof timeframe === 'string' ) {
                timeframe = [ timeframe ];
            }
            if( typeof price_range === 'string' ) {
                price_range = [ price_range ];
            }
            
            user.set('timeframeClient', timeframe);
            user.set('priceRangeClient', price_range);
            user.save().then(function(user){
                console.log(user);
                res.redirect('/dashboard-agent');
            }, function(error){
                console.log(error);
                res.render('account/signup2Agent', {error: error.message});
            })
        } else {
            console.log('not post');
            res.render('account/signup2Agent');
        }
    } else {
        res.redirect('/login?redirectUrl=signup-2-agent');
    }
};

exports.dashboard = function(req, res) {
    if(res.locals.isAuthenticated) {
        var currentUser = res.locals.user;
        if(currentUser.get('userType') == '3') res.redirect('/dashboard-agent');
        
        var timeframe = currentUser.get('timeframe');
        var priceRange = currentUser.get('priceRange');
        var importantComplaint = currentUser.get('importantComplaint');
        var firstTimeUser = currentUser.get('firstTimeUser');
        var licenceAgent = currentUser.get('licenceAgent') || [];
        var minDealClosedAgent = currentUser.get('minDealClosedAgent') || [];
        var receivedProposal = currentUser.get('receivedProposal') || [];
        var agentChosen = currentUser.get('agentChosen') || [];
        
        var queryUser = new Parse.Query('User');
        
        queryUser.equalTo('userType', '3');
        queryUser.find().then(function(agents){
            console.log(agents);
            var users = [];
            var agentSentProposalList = [];
            var agentChosenList = [];
            
            for(var i=0; i<agents.length; i++){
                var agent = agents[i].toJSON();
                var timeframeClient = agent.timeframeClient || [];
                var priceRangeClient = agent.priceRangeClient || [];
                var loan = agent.loan;
                var licenceTime = agent.licenceTime;
                var minDealClosed = agent.minDealClosed;
                var points = 0;
                
                if(timeframeClient.indexOf(timeframe) != -1) points += 20;
                if(priceRangeClient.indexOf(priceRange) != -1) points += 20;
                
                if(currentUser.get('userType') == '1'){
                    if(loan == currentUser.get('loan')) points += 10;
                } else points += 10;
                
                if(importantComplaint == agent.importantComplaint){
                    if(importantComplaint == '4') points += 10;
                    else if(importantComplaint == '3') points += 5;
                }
                
                if(firstTimeUser == agent.firstTimeUser) points += 10;
                if(licenceAgent.indexOf(licenceTime) != -1) points += 10;
                if(minDealClosedAgent.indexOf(minDealClosed) != -1) points += 10;
                
                agent.matched = Math.round(points * 100 / 90);
                if(agentChosen.indexOf(agent.objectId) != -1) agentChosenList.push(agent);
                else if(receivedProposal.indexOf(agent.objectId) != -1) agentSentProposalList.push(agent);
                else users.push(agent);
            }
            
            var users = _.sortBy(users,function(a){ return -a.matched; });
            var agentSentProposalList = _.sortBy(agentSentProposalList, function(a){ return -a.matched; });
            var agentChosenList = _.sortBy(agentChosenList, function(a){ return -a.matched; });
            console.log(users);
        
            res.render('dashboard/index', {
                agents: users,
                agentSentProposalList: agentSentProposalList,
                agentChosenList: agentChosenList
            });
        });
    } else {
        res.redirect('/login?redirectUrl=dashboard');
    }
};


exports.dashboardAgentMatches = function(req, res) {
    if(res.locals.isAuthenticated) {
        var currentUser = res.locals.user;
        if(currentUser.get('userType') != '3') res.redirect('/dashboard');
        
        var timeframeClient = currentUser.get('timeframeClient') || [];
        var priceRangeClient = currentUser.get('priceRangeClient') || [];
        var loan = currentUser.get('loan');
        var importantComplaint = currentUser.get('importantComplaint');
        var firstTimeUser = currentUser.get('firstTimeUser');
        var licenceTime = currentUser.get('licenceTime');
        var minDealClosed = currentUser.get('minDealClosed');
        
        var queryUser = new Parse.Query('User');
        
        queryUser.exists('userType')        
        queryUser.notEqualTo('userType', '3');
        queryUser.find().then(function(results){
            console.log(results);
            
            var users = [];
            var sentProposalList = [];
            for(var i=0; i<results.length; i++){
                var user = results[i].toJSON();
                var timeframe = user.timeframe || '';
                var priceRange = user.priceRange || '0';
                var licenceAgent = user.licenceAgent || [];
                var minDealClosedAgent = user.minDealClosedAgent || [];
                var receivedProposal = user.receivedProposal || []
                var points = 0;
                
                if(timeframeClient.indexOf(timeframe) != -1) points += 20;
                if(priceRangeClient.indexOf(priceRange) != -1) points += 20;
                
                if(user.userType == '1'){
                    if(loan == user.loan) points += 10;
                } else points += 10;
                
                if(importantComplaint == user.importantComplaint){
                    if(importantComplaint == '4') points += 10;
                    else if(importantComplaint == '3') points += 5;
                }
                
                if(firstTimeUser == user.firstTimeUser) points += 10;
                if(licenceAgent.indexOf(licenceTime) != -1) points += 10;
                if(minDealClosedAgent.indexOf(minDealClosed) != -1) points += 10;
                
                user.matched = Math.round(points * 100 / 90);
                
                if(receivedProposal.indexOf(currentUser.id) != -1) sentProposalList.push(user);
                else users.push(user);
            }
            
            var users = _.sortBy(users, function(a){ return -a.matched; });
            var sentProposalList = _.sortBy(sentProposalList, function(a){ return -a.matched; });
            
            console.log(users);
            res.render('dashboard/index', {users: users, sentProposalList: sentProposalList});
        });
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
        
        if(req.body.language) user.set('language', req.body.language);
        if(req.body.important_complaint) user.set('importantComplaint', req.body.important_complaint);
        if(req.body.first_time_user) user.set('firstTimeUser', req.body.first_time_user);
        
        //buyer and seller
        if(userType == 1 || userType == 2) {
            if(req.body.important_target_area) user.set('importantTargetArea', req.body.important_target_area);
            if(req.body.important_price_range) user.set('importantPriceRange', req.body.important_price_range);
            if(req.body.features_required) user.set('featuresRequired', req.body.features_required);
            if(req.body.accomplish) user.set('accomplish', req.body.accomplish);
            if(req.body.licence_agent) user.set('licenceAgent', req.body.licence_agent);
            if(req.body.min_deal_closed) user.set('minDealClosedAgent', req.body.min_deal_closed);
        }
        
        //buyer
        if(userType == 1) {
            if(req.body.loan) user.set('loan', req.body.loan);
            if(req.body.buying_property) user.set('buyingProperty', req.body.buying_property);
        }
        
        //agent
        if(userType == 3) {
            if(req.body.loan) user.set('loan', req.body.loan);
            if(req.body.price_range) user.set('priceRangeClient', req.body.price_range);
            if(req.body.licence_time) user.set('licenceTime', req.body.licence_time);
            if(req.body.min_deal_closed) user.set('minDealClosed', req.body.min_deal_closed);
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