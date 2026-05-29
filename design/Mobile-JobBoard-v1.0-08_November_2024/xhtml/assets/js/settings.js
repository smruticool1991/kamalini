
var currentURL = window.location.href;

function dzThemeSettings()
{
	var dzThemeSettings = `<div class="offcanvas offcanvas-bottom m-3 rounded"  tabindex="-1" id="offcanvasBottom" aria-labelledby="offcanvasBottomLabel">
        <div class="offcanvas-body small">
            <ul class="theme-color-settings">
                <li>
                    <input class="filled-in" id="primary_color_1" appLogo="logo1.svg" name="theme_color" type="radio" value="color-primary" />
					<label for="primary_color_1"></label>
                    <span>Default</span>
                </li>
                <li>
					<input class="filled-in" id="primary_color_2" appLogo="logo2.svg" name="theme_color" type="radio" value="color-green" />
					<label for="primary_color_2"></label>
                    <span>Green</span>
                </li>
                <li>
                    <input class="filled-in" id="primary_color_3" appLogo="logo3.svg" name="theme_color" type="radio" value="color-blue" />
					<label for="primary_color_3"></label>
                    <span>Blue</span>
                </li>
                <li>
                    <input class="filled-in" id="primary_color_4" appLogo="logo4.svg" name="theme_color" type="radio" value="color-pink" />
					<label for="primary_color_4"></label>
                    <span>Pink</span>
                </li>
                <li>
                    <input class="filled-in" id="primary_color_5" appLogo="logo5.svg" name="theme_color" type="radio" value="color-yellow" />
					<label for="primary_color_5"></label>
                    <span>Yellow</span>
                </li>
                <li>
                    <input class="filled-in" id="primary_color_6" appLogo="logo6.svg" name="theme_color" type="radio" value="color-orange" />
					<label for="primary_color_6"></label>
                    <span>Orange</span>
                </li>
                <li>
                    <input class="filled-in" id="primary_color_7" appLogo="logo7.svg" name="theme_color" type="radio" value="color-purple" />
					<label for="primary_color_7"></label>
                    <span>Purple</span>
                </li>
                <li>
					<input class="filled-in" id="primary_color_8" appLogo="logo8.svg" name="theme_color" type="radio" value="color-red" />
					<label for="primary_color_8"></label>
                    <span>Red</span>
                </li>
                <li>
					<input class="filled-in" id="primary_color_9" appLogo="logo9.svg" name="theme_color" type="radio" value="color-lightblue" />
					<label for="primary_color_9"></label>
                    <span>Lightblue</span>
                </li>
				<li>
                    <input class="filled-in" id="primary_color_10" appLogo="logo10.svg" name="theme_color" type="radio" value="color-teal" />
					<label for="primary_color_10"></label>
                    <span>Teal</span>
                </li>
                <li>
                    <input class="filled-in" id="primary_color_11" appLogo="logo11.svg" name="theme_color" type="radio" value="color-lime" />
					<label for="primary_color_11"></label>
                    <span>Lime</span>
                </li>
                <li>
                    <input class="filled-in" id="primary_color_12" appLogo="logo12.svg" name="theme_color" type="radio" value="color-deeporange" />
					<label for="primary_color_12"></label>
                    <span>Deeporange</span>
                </li>
            </ul>
        </div>
    </div>`;
	
	//jQuery('body').append(dzThemeSettings);
}


    /* Theme Panel Save */
	var themeOption = ['themeColor','themeVersion','appLogo','themeDirection'];
	const body = $('body');
    const html = $('html');
	

/* Only For FireSlice Package Kit */	
var isCookieSet = true;
	

/* Only For FireSlice Package Kit END */	

(function($) {
    "use strict"
	dzThemeSettings();

    //get the DOM elements from right sidebar
    const versionSelect = $('#theme_version');
	
	var getUrlParameter = function getUrlParameter(sParam) {
		var sPageURL = window.location.search.substring(1),
			sURLVariables = sPageURL.split('&'),
			sParameterName,
			i;

		for (i = 0; i < sURLVariables.length; i++) {
			sParameterName = sURLVariables[i].split('=');

			if (sParameterName[0] === sParam) {
				return sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
			}
		}
		return false;
	};
	
	var theme =  getUrlParameter('color-theme');
	var themeMode =  getUrlParameter('theme-mode');

	if(getCookie('themeVersion_value') == ""){
		var element = document.querySelector('html');
		element.setAttribute("data-bs-theme", "light");
	}
	
	jQuery('#theme-toggle').click(function(){
		if(jQuery('.dz-theme-mode').hasClass('dark')){
			jQuery('.dz-theme-mode').removeClass('dark');
			jQuery('.dz-theme-mode').addClass('light');
		}else{
			jQuery('.dz-theme-mode').removeClass('light');
			jQuery('.dz-theme-mode').addClass('dark');
		}


		if(jQuery('html').attr('data-bs-theme') == "light"){
			jQuery('html').attr('data-bs-theme','dark');
			$('.loader-screen .loader').addClass('light');
			setCookie('themeVersion_value', 'dark'); 
		}else{ 
			jQuery('html').attr('data-bs-theme','light');
			$('.loader-screen .loader').addClass('dark');
			setCookie('themeVersion_value', 'light');  
		}
	});

	// Change the theme directions
	jQuery('.direction-btn').on('change',function(){
		//console.log($(this).prop('checked'))

        if($(this).prop('checked')){
			jQuery('body').addClass('theme-rtl')
			jQuery(this).addClass('active');
            setCookie('themeDirection_value', 'rtl'); 
			$(".swiper").attr("dir", "ltr");		
			jQuery('.main-css').attr('href','assets/css/style-rtl.css')
        }else{
			jQuery('body').removeClass('theme-rtl')
			jQuery(this).removeClass('active');
            setCookie('themeDirection_value', 'ltr');  
			jQuery('.main-css').attr('href','assets/css/style.css')
        }
	});

	
	//change the primary color controller
    $('input[name="theme_color"]').on('click', function() {
		
        body.attr('data-theme-color',  this.value);
		var logoSrc = $(".app-logo").attr("src");
		const isDark = getCookie("themeVersion_value");
		if(isDark === "theme-dark"){
			$(".app-logo").attr("src", logoSrc?.split('dark')[0]+"dark/"+$(this).attr("appLogo"))
		}else{
			$(".app-logo").attr("src", logoSrc?.split('light')[0]+"light/"+$(this).attr("appLogo"))
		}
		
		if(isCookieSet){
			//console.log(22+'-'+this.value);
			setCookie('appLogo_value', $(this).attr("appLogo"));
			setCookie('themeColor_value', this.value);
		}
    });
	
	if(theme){
		body.attr('data-theme-color', theme);
		setCookie('themeColor_value', theme);
	}
	if(themeMode){
		if(themeMode == "dark"){
			setCookie('themeVersion_value', 'dark'); 
		}else if(themeMode == "light"){
			setCookie('themeVersion_value', ''); 
		}
	}
    
    
	/* Set Theme By Cookie */
		setThemePanel();
	
	
	
    
    
	
})(jQuery);


/* Cookies Function */
function setCookie(cname, cvalue, exhours) 
{
    var d = new Date();
    d.setTime(d.getTime() + (30*60*1000)); /* 30 Minutes */
    var expires = "expires="+ d.toString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) 
{
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
	//console.log('decodedCookie');
	//console.log(decodedCookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}


function setThemePanel(){
    jQuery.each(themeOption, function(index, themeOptionItem) {
		themeOptionItemValue = getCookie(themeOptionItem+'_value');
		
		/* Only For FireSlice Package Kit */
		if(!isCookieSet && themeOptionItem == 'themeColor'){
			return true;
		}
		/* Only For FireSlice Package Kit END */
			
		
		if(themeOptionItemValue != '' && themeOptionItemValue != 1){
			if(themeOptionItem == 'themeColor'){
				body.attr('data-theme-color', themeOptionItemValue);
			}else if(themeOptionItem == 'appLogo'){
				var logoSrc = $(".app-logo").attr("src");
				const isDark = getCookie("themeVersion_value");
				if(isDark === "theme-dark"){
					$(".app-logo").attr("src", logoSrc?.split('dark')[0]+"dark/"+themeOptionItemValue)
				}else{
					$(".app-logo").attr("src", logoSrc?.split('light')[0]+"light/"+themeOptionItemValue)
				}
			}else if(themeOptionItem == 'themeVersion'){
				jQuery('html').attr('data-bs-theme',themeOptionItemValue);

				if(jQuery('html').attr('data-bs-theme') == 'dark'){
					jQuery('.dz-theme-mode').removeClass('dark');
					jQuery('.dz-theme-mode').addClass('light');
					$('.loader-screen .loader').addClass('light');
				}else{
					jQuery('.dz-theme-mode').removeClass('light');
					jQuery('.dz-theme-mode').addClass('dark');
					$('.loader-screen .loader').addClass('dark');
				}

			}else if(themeOptionItem == 'themeDirection'){
				if(themeOptionItemValue === "rtl"){
					jQuery('body').addClass('theme-rtl');
					$(".swiper").attr("dir", "ltr");		
					jQuery('.main-css').attr('href','assets/css/style-rtl.css')
					jQuery(".direction-btn").addClass('active'); 
					jQuery(".direction-btn").prop('checked',true); 
				}else{
					jQuery(".direction-btn").removeClass('active'); 
					jQuery(".direction-btn").prop('checked',false); 
					jQuery('body').removeClass('theme-rtl');
					jQuery('.main-css').attr('href','assets/css/style.css')
				}
			}
		}
	});
}
/* Cookies Function End */