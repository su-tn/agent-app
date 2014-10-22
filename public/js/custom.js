
var searchBlog = function(e){
    var keyword = $('#search-txt').val();
    if(!keyword) return false;
    
    $('#search-form').submit();
}

var formatDate = function(format){
    $('.posted-date').each(function(i, e){
       var a = moment(new Date($(e).text())).format(format);
       $(e).text(a);
    })
}

var clearForm = function(formId){
    $(formId + ' input').val('');
    $(formId + ' textarea').val('');
    return false;
}