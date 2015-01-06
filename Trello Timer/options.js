function save_options() {
	$('.status').stop().hide();

	if ( $('#autoplay').prop('checked') == true ) {
		var statusAutoplay = true;
	} else {
		var statusAutoplay = false;
	}

	chrome.storage.sync.set({
		autoplay: statusAutoplay,
	}, function() {
    	$('.status').stop().fadeIn('slow');
	});
}

function restore_options() {
	chrome.storage.sync.get({
		autoplay: false,
	}, function(items) {
		console.log(items);
		if (items.autoplay == true) {
			$('#autoplay').prop('checked', true);
		} else {
			$('#autoplay').prop('checked', false);
		}
	});
}

function erro () {
	$('body').html('<p class="error">Ops... houve um erro ao carregar a página. Tente novamente.</p>');
}

$(document).ready(function() {

	$('.status').hide();

	$('#save').on('click', function(event) {
		event.preventDefault();
		save_options();
	});

	restore_options();
});