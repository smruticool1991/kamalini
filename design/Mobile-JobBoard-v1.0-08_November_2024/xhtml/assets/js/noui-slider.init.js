var FireSlicetUiSlider = function(){
	
	"use strict"
	
	/* Range ============ */
	var rangeslider = function(){
		
		function priceRangeSlider(elementId) {
			if($("#"+elementId).length > 0 ) {
				var tooltipSlider = document.getElementById(elementId);
				
				var formatForSlider = {
					from: function (formattedValue) {
						return Number(formattedValue);
					},
					to: function(numericValue) {
						return Math.round(numericValue);
					}
				};

				noUiSlider.create(tooltipSlider, {
					start: [50, 270],
					connect: true,
					format: formatForSlider,
					tooltips: [wNumb({decimals: 1}), true],
					range: {
						'min': 0,
						'max': 300
					}
				});
			}
		}
		priceRangeSlider("slider-tooltips");
	}
	/* Function ============ */
	return{
		
		init:function(){
			rangeslider();
		},
		
		load:function(){
			
		},
		
		resize:function(){
			
		},
		
	}

}();

/* Document.ready Start */	
jQuery(document).ready(function() {
	'use strict';
	FireSlicetUiSlider.init();
});
/* Document.ready END */

/* Window Load START */
jQuery(window).on('load',function () {
	'use strict'; 
	FireSlicetUiSlider.load();
});
/*  Window Load END */

/* Window Resize START */
jQuery(window).on('resize',function () {
	'use strict'; 
	FireSlicetUiSlider.resize();
});
/*  Window Resize END */