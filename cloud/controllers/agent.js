var _ = require('underscore');
var TappedAgent = Parse.Object.extend('TappedAgent');
var ReviewAgent = Parse.Object.extend('ReviewAgent');


exports.tapAgent = function(req, res) {
    var agentId = req.body.agentId;
    var queryUser = new Parse.Query(Parse.User);
    
    if(res.locals.isAuthenticated) {
        var user = res.locals.user;
        var agentTapped = user.get('agentTapped') || [];
        Parse.Cloud.useMasterKey();
        
        if(agentTapped.length == 3){
            res.json({error: 'You has been tapped 3 agents'});
        } else if(agentTapped.indexOf(agentId) != -1){
            res.json({error: 'You was tapped this Agent'});
        } else {
            queryUser.get(agentId).then(function(agent){
                if(!agent) res.json({error: 'Agent does not exist'});
                
                agent.addUnique('tappedBy', user.id);
                agent.save().then(function(agent){
                    console.log('updated agent');
                    var tapAgent = new TappedAgent();
                    tapAgent.set('agent', agent);
                    tapAgent.set('tappedBy', user);
                    
                    tapAgent.save().then(function(tapAgent){
                        res.json({success: 'success'});
                        
                    }, function(error){
                        console.error(error);
                        res.json({error: error.message});
                    });
                    
                }, function(error){
                    console.error(error);
                    res.json({error: error.message});
                })
            }, function(error){
                console.error(error);
                res.json({error: error.message});
            })
        }
    } else {
        res.json({error: 'User is not login'});
    }
}

exports.sendProposal = function(req, res) {
    var userId = req.body.user_id;
    var queryUser = new Parse.Query(Parse.User);
    var queryTappedAgent = new Parse.Query(TappedAgent);
    
    if(res.locals.isAuthenticated) {
        var user = res.locals.user;
        var sentProposal = user.get('sentProposal') || [];
        Parse.Cloud.useMasterKey();
        
        queryUser.get(userId).then(function(result){
            if(!result) res.json({error: 'User does not exist'});
            console.log(result);
            
            queryTappedAgent.equalTo('agent', user);
            queryTappedAgent.equalTo('tappedBy', result);
            queryTappedAgent.first().then(function(tappedAgent){
                if(!tappedAgent) res.json({error: ''});
                console.log(tappedAgent);
                
                tappedAgent.set('comment', req.body.comment);
                tappedAgent.set('file', req.body.file);
                
                tappedAgent.save().then(function(tappedAgent){
                    
                    result.addUnique('receivedProposal', user.id);
                    
                    result.save().then(function(result){
                        console.log(result);
                        user.addUnique('sentProposal', result.id);
                        
                        user.save().then(function(user){
                            console.log(user);
                            res.json({success: 'success'});
                        }, function(error){
                            console.error(error);
                            res.json({error: error.message});
                        });
                    }, function(error){
                        console.error(error);
                        res.json({error: error.message});
                    });
                }, function(error){
                    console.error(error);
                    res.json({error: error.message});
                });
            }, function(error){
                console.error(error);
                res.json({error: error.message});
            });
        }, function(error){
            console.error(error);
            res.json({error: error.message});
        })
    } else {
        res.json({error: 'User is not login'});
    }
}

exports.viewProposal = function(req, res) {
    var agentId = req.body.agentId;
    var queryUser = new Parse.Query(Parse.User);
    var queryTapped = new Parse.Query(TappedAgent);
    
    if(res.locals.isAuthenticated) {
        var user = res.locals.user;
        
        queryUser.get(agentId).then(function(agent){
            if(!agent) res.json({error: 'Agent does not exist'});
            queryTapped.equalTo('agent', agent);
            queryTapped.equalTo('tappedBy', user);
            
            queryTapped.first().then(function(proposal){
                if(!proposal) res.json({error: 'Proposal does not exist'});
                
                res.json({agent: agent.toJSON(), proposal: proposal.toJSON()});
            }, function(error){
                console.error(error);
                res.json({error: error.message});
            });
        }, function(error){
            console.error(error);
            res.json({error: error.message});
        })
    } else {
        res.json({error: 'User is not login'});
    }
}

exports.chosenAgent = function(req, res) {
    var agentId = req.body.agentId;
    if(!agentId){
        return res.json({error: 'Agent Id is required'});
    }
    
    var queryUser = new Parse.Query(Parse.User);
    
    if(res.locals.isAuthenticated) {
        var user = res.locals.user;
        
        queryUser.get(agentId).then(function(agent){
            if(!agent) res.json({error: 'Agent does not exist'});
            user.addUnique('agentChosen', agent.id);
            
            user.save().then(function(user){
                res.json({success: 'success'});
            }, function(error){
                console.error(error);
                res.json({error: error.message});
            });
        }, function(error){
            console.error(error);
            res.json({error: error.message});
        })
    } else {
        res.json({error: 'User is not login'});
    }
}

exports.reviewAgent = function(req, res) {
    var agentId = req.body.agentId;
    if(!agentId){
        return res.json({error: 'Agent Id is required'});
    }
    
    var queryUser = new Parse.Query(Parse.User);
    var queryReviewAgent = new Parse.Query(ReviewAgent);
    
    if(res.locals.isAuthenticated) {
        var user = res.locals.user;
        
        queryUser.get(agentId).then(function(result){
            if(!result) res.json({error: 'Agent does not exist'});
            var agent = result.toJSON();
            var rate = agent.rate || {rating: 0, noUserRated: 0};
            console.log(rate);
            
            agent.rating = Math.round((rate.rating / rate.noUserRated)) || 0;
            console.log(agent.rating);
            res.render('dashboard/_reviewAgent', {agent: agent});
        }, function(error){
            console.error(error);
            res.json({error: error.message});
        })
    } else {
        res.json({error: 'User is not login'});
    }
}

exports.submitReviewAgent = function(req, res) {
    var agentId = req.body.agentId;
    var rating = parseInt(req.body.rating);
    var review = new ReviewAgent();
    
    if(!agentId){
        return res.json({error: 'Agent Id is required'});
    }
    
    var queryUser = new Parse.Query(Parse.User);
    
    if(res.locals.isAuthenticated) {
        var user = res.locals.user;
        Parse.Cloud.useMasterKey();
        
        queryUser.get(agentId).then(function(agent){
            if(!agent) res.json({error: 'Agent does not exist'});
            
            review.set('agent', agent);
            review.set('reviewBy', user);
            review.set('comment', req.body.comment);
            if(req.body.rating) review.set('rate', rating)
            
            review.save().then(function(review){
                if(req.body.rating){
                    var rate = agent.get('rate') || {rating: 0, noUserRated: 0};
                    
                    agent.set('rate', {rating: (rate.rating + rating), noUserRated: (rate.noUserRated + 1)});
                    agent.save().then(function(agent){
                        res.json({success: 'success'});
                    }, function(error){
                        console.error(error);
                        res.json({error: error.message});
                    });
                } else {
                    console.error(error);
                    res.json({error: error.message});
                }
            }, function(error){
                console.error(error);
                res.json({error: error.message});
            });
        }, function(error){
            console.error(error);
            res.json({error: error.message});
        })
    } else {
        res.json({error: 'User is not login'});
    }
}