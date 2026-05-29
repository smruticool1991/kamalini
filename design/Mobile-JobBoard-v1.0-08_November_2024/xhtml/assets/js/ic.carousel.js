/** 	=========================
	Template Name 	 : FireSlice
	Author			 : DexignZone
	Version			 : 1.0
	File Name		 : custom.js

	Core script to handle the entire theme and core functions
**/

/* JavaScript Document */
jQuery(document).ready(function() {
    'use strict';

	// Get Started ==========
	if(jQuery('.welcome-swiper').length > 0){
		var swiper = new Swiper('.welcome-swiper', {
			speed: 1000,
			spaceBetween: 0,
			parallax: true,
			loop:true,
			//autoplay: {
			//	delay: 2500,
			//},
			pagination: {
                el: ".swiper-pagination",
                clickable: false,
			},
			navigation: {
				nextEl: ".swiper-button-next",
				prevEl: ".swiper-button-prev",
			},
		});
	}

	if(jQuery('.banner-swiper').length > 0){
		var bannerSwiper = new Swiper('.banner-swiper', {
			speed: 1000,
			slidesPerView: "auto",
			spaceBetween: 10,
			loop:true,
			// autoplay: {
			// 	delay: 1500,
			// },
		});
	}

	// CategorySlide ==========
	if(jQuery('.category-slide').length > 0){
		var swiper = new Swiper('.category-slide', {
			speed: 1000,
			slidesPerView: "auto",
			spaceBetween: 5,
		});
	}

	// FilterSwiper ==========
	if(jQuery('.filter-swiper').length > 0){
		var swiper = new Swiper('.filter-swiper', {
			speed: 1000,
			slidesPerView: "auto",
			spaceBetween: 5,
		});
	}
	
	// companySwiper ==========
	if(jQuery('.company-swiper').length > 0){
		var swiper = new Swiper('.company-swiper', {
			speed: 1000,
			slidesPerView: 1.1,
			spaceBetween: 10,
		});
	}
});
/* Document .ready END */