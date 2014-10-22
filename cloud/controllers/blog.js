var _ = require('underscore');
var moment = require('moment');
    
var Blog = Parse.Object.extend('Blog');
var Tag = Parse.Object.extend('Tags');

exports.commonRender = function(req, res, viewUrl, data){
    var queryTag = new Parse.Query(Tag);
    var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    
    if(!data) data = {};
    
    queryTag.ascending('createdAt');
    queryTag.find().then(function(tags){
        data.months = months;
        data.tags = tags;
        res.render(viewUrl, data);
    },
    function() {
        res.send(500, 'Failed loading page');
    });
}

exports.blogDetail = function(req, res) {
    var query = new Parse.Query(Blog);
    var slug = req.params.slug;
    
    query.equalTo('slug', '/blog/' + slug);
    query.first().then(function(result){
        if(!result) res.send(500, 'Blog not found');
        exports.commonRender(req, res, 'blog/show', {result: result})
    },
    function() {
        res.send(500, 'Failed loading page');
    });
};

exports.blog = function(req, res) {
    var query = new Parse.Query(Blog);
    var page = req.query.page || 0;
    var offset = parseInt(page) * 5;
    
    query.limit(5);
    query.skip(offset);
    query.descending('createdAt');
    query.equalTo('isPublished', true);
    
    query.find().then(function(results){
        exports.commonRender(req, res, 'blog/index', {blogs: results});
    },
    function() {
        res.send(500, 'Failed loading page');
    });
};

exports.searchByTag = function(req, res) {
    var query = new Parse.Query(Blog);
    var tag = req.params.tag;
    console.log('tag', tag);
    
    query.equalTo('tags', tag);
    query.descending('createdAt');
    query.equalTo('isPublished', true);
    query.find().then(function(results){
        exports.commonRender(req, res, 'blog/index', {blogs: results, tag: tag});
    },
    function() {
        res.send(500, 'Failed loading page');
    });
};

exports.searchByName = function(req, res) {
    var queryTag = new Parse.Query(Tag);
    var query = new Parse.Query(Blog);
    var keyword = req.body.keyword;
    
    if(keyword){
        query.contains('searchName', keyword);
    }
    
    query.descending('createdAt');
    query.equalTo('isPublished', true);
    query.find().then(function(results){
        exports.commonRender(req, res, 'blog/index', {blogs: results, keyword: keyword});
    },
    function() {
        res.send(500, 'Failed loading page');
    });
};

exports.searchByArchive = function(req, res) {
    var queryTag = new Parse.Query(Tag);
    var query = new Parse.Query(Blog);
    var archive = req.params.archive;
    if(archive){
        archive = parseInt(archive);
        var currentYear = (new Date()).getFullYear();
        var firstMonth = new Date(currentYear + ' ' + archive + ' ' + 1);
        var lastMonth = new Date(currentYear + ' ' + (archive + 1) + ' ' + 1);
        console.log(archive, firstMonth, lastMonth);
         
        query.greaterThanOrEqualTo('postedAt', firstMonth);
        query.lessThan('postedAt', lastMonth);
    }
    
    query.descending('createdAt');
    query.equalTo('isPublished', true);
    query.find().then(function(results){
        exports.commonRender(req, res, 'blog/index', {blogs: results, archive: archive});
    },
    function() {
        res.send(500, 'Failed loading page');
    });
};