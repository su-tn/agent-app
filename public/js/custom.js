
var searchBlog = function(e){
    var keyword = $('#search-txt').val();
    if(!keyword) return false;
    
    $('#search-form').submit();
}

var clearForm = function(formId){
    $(formId + ' input:not(.hidden-input)').val('');
    $(formId + ' textarea').val('');
    $("input[type=checkbox]").attr("checked", false);
    //$("input[type=radio]").attr("checked", false);
    return false;
}

function validateEmail(email) { 
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

var signup1 = function(){
    $('form input').removeClass('error');
    $('.error').hide();
    
    var email = $('#email').val();
    var confirmEmail = $('#confirm-email').val();
    var password = $('#password').val();
    
    if (!email) {
        $('#email').addClass('error');
        $('#email').next('.error').text('Email is required').show();
        return;
    }
    
    if(!validateEmail(email)){
        $('#email').addClass('error');
        $('#email').next('.error').text('Email is not valid').show();
        return;
    }
    
    if (!confirmEmail) {
        $('#confirm-email').addClass('error');
        $('#confirm-email').next('.error').text('Confirm email is required').show();
        return;
    }
    
    if(confirmEmail != email){
        $('#confirm-email').addClass('error');
        $('#confirm-email').next('.error').text('Confirm email does not match').show();
        return;
    }
    
    if (!password) {
        $('#password').addClass('error');
        $('#password').next('.error').text('Password is required').show();
        return;
    }
    
    if(password.length < 6){
        $('#password').addClass('error');
        $('#password').next('.error').text('Password must be greater than or equal 6 characters').show();
        return;
    }
    
    $.post('/signup-1',{email: email, password: password}, function(res){
        if(res.error) {
            $('#email').addClass('error');
            $('#email').next('.error').text(res.error).show();
            return;
        } else {
            window.location.href='/signup-2';
        } 
    })
}

var submitLogin = function(){
    $('form input').removeClass('error');
    $('.error').hide();
    
    var email = $('#email').val();
    var password = $('#password').val();
    
    if (!email) {
        $('#email').addClass('error');
        $('#email').next('.error').text('Email is required').show();
        return;
    }
    
    if(!validateEmail(email)){
        $('#email').addClass('error');
        $('#email').next('.error').text('Email is not valid').show();
        return;
    }
    
    if (!password) {
        $('#password').addClass('error');
        $('#password').next('.error').text('Password is required').show();
        return;
    }
}

var signupAgentVerify = function(){
    $('form input').removeClass('error');
    $('.error').hide();
    
    var agentId = $('#agent-id').val();
    var email = $('#email').val();
    var confirmEmail = $('#confirm-email').val();
    var password = $('#password').val();
    
    if (!agentId) {
        $('#agent-id').addClass('error');
        $('#agent-id').next('.error').text('Agent ID is required').show();
        return;
    }
    
    if (!email) {
        $('#email').addClass('error');
        $('#email').next('.error').text('Email is required').show();
        return;
    }
    
    if(!validateEmail(email)){
        $('#email').addClass('error');
        $('#email').next('.error').text('Email is not valid').show();
        return;
    }
    
    if (!confirmEmail) {
        $('#confirm-email').addClass('error');
        $('#confirm-email').next('.error').text('Confirm email is required').show();
        return;
    }
    
    if(confirmEmail != email){
        $('#confirm-email').addClass('error');
        $('#confirm-email').next('.error').text('Confirm email does not match').show();
        return;
    }
    
    if (!password) {
        $('#password').addClass('error');
        $('#password').next('.error').text('Password is required').show();
        return;
    }
    
    $.post('/signup-agent-verify',{agent_id: agentId, email: email, password: password}, function(res){
        if(res.error) {
            $('#email').addClass('error');
            $('#email').next('.error').text(res.error).show();
            return;
        } else {
            window.location.href='/signup-2-agent';
        } 
    })
}

var updateProfile = function(){
    $('.error').text('');
    $('.loading_content').show();
    var data = {
        firstName: $('#first-name').val(),
        lastName: $('#last-name').val(),
        agentId: $('#agent-id').val(),
        password: $('#password').val()
    }
    
    $.post('account/update-profile', data, function(res){
        console.log(res);
        $('.loading_content').hide();
        if(res.error) $('.error').text(res.error);
    })
}

var updateProfileQuestion = function(){
    $('.error').text('');
    $('.loading_content').show();
    
    $.post('account/update-profile-question', $('#dash_qs_form').serialize(), function(res){
        console.log(res);
        $('.loading_content').hide();
        if(res.error) $('.error').text(res.error);
    })
}

$(function(){
    $('.show-tooltip').tooltip();
})