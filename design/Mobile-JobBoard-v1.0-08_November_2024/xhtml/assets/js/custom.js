/** 	=========================
	Template Name 	 : FireSlice
	Author			 : DexignZone
	Version			 : 1.0
	File Name		 : custom.js

	Core script to handle the entire theme and core functions
**/

fireslice = function(){
	
	"use strict"
	
	var screenWidth = $( window ).width();
	var screenHeight = $( window ).height();
	
	// Preloader ============
	var handlePreloader = function(){
		setTimeout(function() {
            jQuery('#preloader').fadeOut(300);
		},300);
	}
    
	// Show Pass ============
    var handleShowPass = function(){
		jQuery('.show-pass').on('click',function(){
			jQuery(this).toggleClass('active');
			if(jQuery(this).parent().find('.dz-password').attr('type') == 'password'){
				jQuery(this).parent().find('.dz-password').attr('type','text');
			}else if(jQuery(this).parent().find('.dz-password').attr('type') == 'text'){
				jQuery(this).parent().find('.dz-password').attr('type','password');
			}
		});
	}

	// Chat Box ============
	var handleChatBox = function (){
        $('.chat-btn').on('click', function() {
			
			var chatInput = $('.message-area .form-control');
			var chatMessageValue = chatInput.val();
			
			var chatEmojiArea = $('.append-media').html();
            
            var current = new Date();
            var ampm = current.getHours() >= 12 ? 'pm' : 'am';
            var actualTime = (current.getHours()% 12 +':'+current.getMinutes() +' '+ ampm);
			
			var messageEmojiHtml = '<div class="chat-content user">'+
				'<div class="message-item">'+
					'<div class="bubble">'+chatEmojiArea+'</div>'+
					'<div class="message-time">'+actualTime+'</div>'+
				'</div>'+
			'</div>';
				
			if(chatEmojiArea.length > 0){   
				$('.chat-box-area').append(messageEmojiHtml);
			}
			
			var messageHtml = '<div class="chat-content user">'+
				'<div class="message-item">'+
					'<div class="bubble">'+chatMessageValue+'</div>'+
					'<div class="message-time">'+actualTime+'</div>'+
				'</div>'+
			'</div>';
			
			if(chatMessageValue.length > 0){
				var appendMessage = $('.chat-box-area').append(messageHtml);
			}
			
			//console.log(document.body.scrollHeight)
			window.scrollTo(0, document.body.scrollHeight);
			var clearChatInput = chatInput.val('');    
			var clearChatInputE = $('.append-media').empty();     
        });
		// Trigger hidden file input when #mediaPicker is clicked
        $('#mediaPicker').on('click', function() {
            $('#hiddenFileInput').click();
        });

        // Handle file selection
        $('#hiddenFileInput').on('change', function() {
            var fileName = $(this).val().split('\\').pop();
            if (fileName) {
                var fileMessageHtml = '<div class="chat-content user">'+
                    '<div class="message-item">'+
                        '<div class="bubble">Selected file: '+ fileName +'</div>'+
                        '<div class="message-time">'+ new Date().toLocaleTimeString() +'</div>'+
                    '</div>'+
                '</div>';
                $('.chat-box-area').append(fileMessageHtml);
                window.scrollTo(0, document.body.scrollHeight);
            }
        });
    }
    
    // Page Back ============
	var handleGoBack = function(){
		$('.back-btn').on('click',function(){
			window.history.go(-1); return false
		})        
    }
    
	// Progressive Web App Modal ============
	var handleNotifyCanvas = function (){
		setTimeout(function(){
			if(getCookie('notification-modal') != '1'){	
				const myOffcanvas = document.querySelector('.notification-offcanvas');
				var bsOffcanvas = new bootstrap.Offcanvas(myOffcanvas);
				bsOffcanvas.show()
				setCookie('notification-modal','1',);
			}
		}, 5000);
	}
    
	// Light Gallery ============
	var handleLightgallery = function() {
		if(jQuery('#lightgallery').length > 0){
			lightGallery(document.getElementById('lightgallery'), {
                plugins: [lgZoom, lgThumbnail],
            });
		}
		if(jQuery('#lightgallery-2').length > 0){
			lightGallery(document.getElementById('lightgallery-2'), {
                plugins: [lgZoom, lgThumbnail],
            });
		}
		if(jQuery('#lightgallery-3').length > 0){
			lightGallery(document.getElementById('lightgallery-3'), {
                plugins: [lgZoom, lgThumbnail],
            });
		}
		
		// lightgallery by class name
		if(jQuery('.lightgallery').length > 0){
			var elements = document.getElementsByClassName('lightgallery');
			for (let item of elements) {
				lightGallery(item,{
					plugins: [lgZoom, lgThumbnail],
				})
			}
		}
	}
    
	// OTP Input ============ 
    var handleOTP = function() {
		if(jQuery('#otp').length > 0)
		$('.digit-group').find('input').each(function() {
            $(this).attr('maxlength', 1);
            $(this).on('keyup', function(e) {
                var thisVal = $(this).val();
                var parent = $($(this).parent());
                
                if(e.keyCode === 8 || e.keyCode === 37) {
                    var prev = parent.find('input#' + $(this).data('previous'));
                    
                    if(prev.length) {
                        $(prev).select();
                    }
                } else {
                    var next = parent.find('input#' + $(this).data('next'));
                    
                    if(!$.isNumeric(thisVal))
                    {
                        $(this).val('');
                        return false;
                    }

                    if(next.length) {
                        $(next).select();
                    } else {
                        if(parent.data('autosubmit')) {
                            parent.submit();
                        }
                    }
                }
            });
        });
		
	}
	
	// TouchSpin ============
	var handleTouchSpin = function (){
		if(jQuery('.stepper').length > 0){	
			$(".stepper").TouchSpin({
				initval: 1
			});
		}
	}
	
	var handlelangPicker = function(){
		if(jQuery('#offcanvasLang').length > 0)
		{
			const bsOffcanvas = new bootstrap.Offcanvas('#offcanvasLang')
			$('.confirm-lang li').on('click', function () {
				var x =  $(this).attr("data-lang")
				$('.select-lang').text(x)
				bsOffcanvas.hide();
			});
		}
		$('input[name="IcRadio"]').change(function() {
			var selectedLanguage = $(this).siblings('label').find('.name').text();
			$('.bottom-btn .language').text(selectedLanguage);
			$('.bottom-btn .btn-primary').attr('aria-label', 'Continue in ' + selectedLanguage);
		});
	}

	var appNavigateShare = function(){

		const dzShareData = {
			title: 'JobBoard',
			text: 'JobBoard - Job Search Mobile App Template ( Bootstrap + PWA )',
			url: document.location.protocol + "//" + document.location.host + "/mobile"
		}

		jQuery('#shareBtn').on('click', function() {
			if(navigator.share)
			{
				navigator.share(dzShareData);
			}
		});
	}
	
	// ImageUpload Effect ============
	var handleImageUploadEffect = function (){
		function readURL(input) {
			if (input.files && input.files[0]) {
				var reader = new FileReader();
				reader.onload = function(e) {
					$('#imagePreview').css('background-image', 'url('+e.target.result +')');
					$('#imagePreview').hide();
					$('#imagePreview').fadeIn(650);
				}
				reader.readAsDataURL(input.files[0]);
			}
		}
		$("#imageUpload").change(function() {
			readURL(this);
		});
		$('.remove-img').on('click', function() {
			var imageUrl = "images/no-img-avatar.png";
			$('.avatar-preview, #imagePreview').removeAttr('style');
			$('#imagePreview').css('background-image', 'url(' + imageUrl + ')');
		});
	}
	
	var handleRemoveContent = function(){
		$('.item-bookmark-remove, .dz-remove').click(function () {
			var cartListItem = $(this).closest('.dz-card-remove');
			cartListItem.fadeOut('fast', function () {
				cartListItem.remove();
				if ($('.dz-card-remove').length === 0) {
					$('.dz-cart-about').removeClass('d-none');
				}
			});
		});
		$('.item-bookmark').click(function () {
			$(this).toggleClass('active');
		})
	}

	var handleTagSlider = function(){
		if(jQuery('#tagSlider').length > 0){
			$('#tagSlider').grouploop({
				velocity: 1,
				forward: true,
				pauseOnHover: false,
				childNode: ".item",
				childWrapper: ".item-wrap"
			});
		}
	}
	var handleTagSlider2 = function(){
		if(jQuery('#tagSlider2').length > 0){
			$('#tagSlider2').grouploop({
				velocity: 1,
				forward: false,
				pauseOnHover: false,
				childNode: ".item",
				childWrapper: ".item-wrap"
			});
		}
	}

	/* Function ============ */
	return {
		init:function(){
			handlelangPicker();
			handleShowPass();
			handleChatBox();
			handleLightgallery();
            handleGoBack();
            handleNotifyCanvas();
			handleOTP();
			handleTouchSpin();
			handleImageUploadEffect();
			handleRemoveContent();
			handleTagSlider();
			handleTagSlider2();
		},

		load:function(){
			handlePreloader();
			appNavigateShare();
		},
		
		resize:function(){
			screenWidth = $( window ).width();
		},
	}
	
}();

/* Document.ready Start */	
jQuery(document).ready(function() {

	fireslice.init();
	
	
	$('[data-bs-toggle="popover"]').popover();
    $('.theme-dark .custom-switch input').prop('checked', true);
	
});
/* Document.ready END */

/* Window Load START */
jQuery(window).on('load',function () {
    jQuery('.loader').removeClass('animated');
	fireslice.load();
	setTimeout(function(){
		jQuery('#splashscreen').addClass('active');
	 	jQuery('#splashscreen').fadeOut(1500);
	}, 1500);
	
    $('.theme-dark .custom-switch input').prop('checked', true).addClass('active');
	
});
/*  Window Load END */

/* Window Resize START */
jQuery(window).on('resize',function () {
	
	fireslice.resize();
});
/*  Window Resize END */	