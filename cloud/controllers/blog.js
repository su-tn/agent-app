var _ = require('underscore');

exports.commonRender = function(req, res, viewUrl, data){
    var queryMenu = new Parse.Query('StaticPage');
    if(!data) data = {};
    
    queryMenu.equalTo('type', 'menu');
    queryMenu.equalTo('isPublished', true);
    queryMenu.ascending('order');
    queryMenu.find().then(function(menus){
        res.render(viewUrl, data);
    },
    function() {
        res.send(500, 'Failed loading page');
    });
}

exports.blogDetail = function(req, res) {
    var query = new Parse.Query('Blog');
    var slug = req.params.slug;
    
    query.equalTo('slug', '/blog/' + slug);
    query.first().then(function(result){
        if(!result) res.send(500, 'Blog not found');
        exports.commonRender(req, res, 'blog/show', {result: result});
    },
    function() {
        res.send(500, 'Failed loading page');
    });
};

exports.blog = function(req, res) {
    var query = new Parse.Query('Blog');
    var page = req.query.page || 0;
    var offset = parseInt(page) * 5;
    
    query.limit(5);
    query.skip(offset);
    query.descending('createdAt');
    query.equalTo('isPublished', true);
    
    query.find().then(function(results){
        exports.commonRender(req, res, 'blog/index', {blogs: results,
            page: (parseInt(page) + 1)});
    },
    function() {
        res.send(500, 'Failed loading page');
    });
};

exports.searchByTag = function(req, res) {
    var query = new Parse.Query('Blog');
    var keyword = req.params.keyword;
    
    query.equalTo('tags', keyword);
    query.find().then(function(results){
        exports.commonRender(req, res, 'blog/index', {results: results, tag: keyword});
    },
    function() {
        res.send(500, 'Failed loading page');
    });
};

exports.searchByKeyword = function(req, res) {
    var query = new Parse.Query('Blog');
    var keyword = req.params.keyword;
    
    query.contains('name', keyword);
    query.find().then(function(results){
        exports.commonRender(req, res, 'blog/index', {results: results, tag: keyword});
    },
    function() {
        res.send(500, 'Failed loading page');
    });
};