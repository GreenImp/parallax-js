/**
 * Author: lee
 * Date Created: 15/05/2012 11:36
 */

(function($, window, document){
	$.fn.parallax = function(options){
		return $.parallax(this, options);
	};

	$.extend({
		parallax:function(elements, options){
			/**
			 * Private variables
			 */
			var pluginName = 'jQuery.parallax',	// the plugin name
				objPlugin = this,				// the plugin object
				dataName = 'paralax-data',		// name to give the data attached to the window
				scrollVariableSpeed = 1000,		// the variable speed, used in scroll speed calculations
				layerCSS = {					// styles to apply to all parallax elements
					position:'fixed',
					top:0,
					left:0,
					width:'100%',
					height:'100%'
				},
				defaultLayer = {				// the default settings for a layer
					speed:{
						vertical:1,
						horizontal:1
					}
				},
				defaultOptions = {				// the default options
					scrollDirection:'both',			// the direction of scroll (vertical|horizontal|both)
					navSelector:'#nav',				// selector for the navigation menu
					scrollSpeed:3000,				// the speed of which to scroll to an element, when clicking it's navigation link (only used if navSelector is found)
					zIndexBase:1,					// the base point to start z-indexing layers from (useful if you need to start higher than 1)
					autoScroll:false,				// flag - determines whether to autoscroll the page or not
					autoScrollDelay:0,				// if autoscrolling, this is the time between each scroll (once we have reached a destination)
					autoScrollType:'points',		// the type of scrolling to use when autoscroll is activated (points == scroll through nav items in turn || horizontal || vertical)
					repeat:false,					// boolean - whether to start autoscrolling from the beginning, when we reach the end
					showScrollbars:false,			// bollean whether to show the browser's default scrollbars or not
					layers:[]						// the settings for layers
				};

			/**
			 * Public variables
			 */
			this.options = {};	// this holds the user defined plugin options


			// define the methods
			var methods = {
				/**
				 * initialises the object
				 * @param userOptions
				 */
				init:function(elements, userOptions){
					// ensure that the elements are a JQuery object
					elements = isJQueryObject(elements) ? elements : $(isJQueryObject);
					// ensure that the options are set or empty
					userOptions = userOptions || {};

					// define the options
					objPlugin.options = $.extend({}, defaultOptions, userOptions);
					// ensure that an auto-scroll speed is define; if not, default to the normal scroll speed
					objPlugin.options.autoScrollSpeed = objPlugin.options.autoScrollSpeed || objPlugin.options.scrollSpeed;

					// attach the event handlers to the navigation buttons
					$(objPlugin.options.navSelector + ' a').on('click', function(){
						return !methods['scrollTo']($(this).attr('href'));
					});

					// loop through each element and configure it's layer attributes
					elements.each(function(){
						var objThis = $(this),												// the current object
							strLayer = objThis.attr('class').match(/layer[0-9]+/) || '',	// check if a layer is defined
							intLayerNum = (strLayer != '') ? parseInt(strLayer[0].replace('layer', '')) - 1 : 0,
							objLayer = objPlugin.options.layers[intLayerNum] || defaultLayer,
							zIndex = (!isNaN(objLayer.zIndex) ? objLayer.zIndex : intLayerNum) + (objPlugin.options.zIndexBase);

						objThis
							.css($.extend({}, layerCSS, {'z-index':zIndex}))
							.data(dataName, {layer:intLayerNum});

						if(objLayer.onLoad){
							// the layer has an on load parameter define
							if(typeof objLayer.onLoad == 'function'){
								// onLoad is a custom function
								objLayer.onLoad.call(objLayer, objThis);
							}else{
								// pre-determined function string
								switch(objLayer.onLoad){
									case 'hide':
										// hide the layer
										objThis.hide();
									break;
									case 'show':
										// show the layer
										objThis.show();
									break;
									case 'fadeIn':
										// fade in the layer
										objThis.fadeIn(600);
									break;
									case 'fadeOut':
										// fade out the layer
										objThis.fadeOut(600);
									break;
								}
							}
						}
					});

					// enable the plugin
					methods['enable'](elements);

					// check if we are autoscrolling
					if(objPlugin.options.autoScroll){
						autoScroll($(objPlugin.options.navSelector + ' a'));
					}
				},
				/**
				 * enables the features
				 */
				enable:function(objElements){
					if(!objPlugin.options.showScrollbars){
						// disable the scrollbars
						$('html').css('overflow', 'hidden');
					}

					$(window)
						// attach the necessary data
						.data(
							dataName,
							{
								enabled:true,		// flag - enabled|disabled
								scrollPosition:{	// last registered scroll position of the window
									top:0,
									left:0
								}
							}
						)
						// define the scroll event
						.on('scroll',function(e){
							methods['scroll'](objElements);
						})
						// trigger the scroll event - this ensures that all layers are in the correct position.
						// this is necessary if the page has been scrolled and is then refreshed, as most
						// browsers remember the scroll position
						.scroll();
				},
				/**
				 * disables the features
				 */
				disable:function(){
					if(!objPlugin.options.showScrollbars){
						// enable the scrollbars
						$('html').css('overflow', 'auto');
					}

					$(window)
						// set the enabled flag to false
						.data(dataName, {enabled:false})
						// remove the scroll event handler
						.off('scroll');
				},
				/**
				 * carries out the parallax functionality
				 */
				scroll:function(objElements){
					var objWindow = $(window),		// the window as a JQuery object
						scrollPosition = {			// the amount scrolled top/left
							top:objWindow.scrollTop(),
							left:objWindow.scrollLeft()
						},
						previousScrollPosition = objWindow.data(dataName).scrollPosition,
						options = objPlugin.options;

					// only continue if the feature is enabled
					if(objWindow.data(dataName).enabled){
						objElements = isJQueryObject(objElements) ? objElements : $(objElements);

						// check if we are allowed to scroll vertically and horizontally - if so, check if the user scrolled
						var bolScrollVertical = ((options.scrollDirection == 'vertical') || (options.scrollDirection == 'both')) ? (previousScrollPosition.top != scrollPosition.top) : false,
							bolScrollHorizontal = ((options.scrollDirection == 'vertical') || (options.scrollDirection == 'both')) ? (previousScrollPosition.left != scrollPosition.left) : false;

						if(bolScrollVertical || bolScrollHorizontal){
							// we are scrolling
							objElements.each(function(){
								var objThis = $(this),
									objLayer = options.layers[objThis.data(dataName).layer] || defaultLayer,
									scrollSpeed = objLayer.speed;

								// ensure that the scroll speeds are valid by merging them with the defaults
								scrollSpeed = isNaN(scrollSpeed) ? $.extend({}, defaultLayer, scrollSpeed) : {vertical:scrollSpeed, horizontal:scrollSpeed};

								objThis.css({
									top:bolScrollVertical ? -(scrollPosition.top * scrollSpeed.vertical) : objThis.css('top'),
									left:bolScrollHorizontal ? -(scrollPosition.left * scrollSpeed.horizontal) : objThis.css('left')
								});
							});
						}

						// set the new window scroll position
						objWindow.data(dataName).scrollPosition.top = scrollPosition.top;
						objWindow.data(dataName).scrollPosition.left = scrollPosition.left;
					}
				},
				/**
				 * scrolls the screen to a particular navigation point.
				 * The given point can be a selector or object (JQuery or DOM)
				 *
				 * @param mixTarget
				 */
				scrollTo:function(mixTarget, speed, callback){
					// ensure that we have a jquery object
					if(!isJQueryObject(mixTarget)){
						mixTarget = $(mixTarget)
					}

					// ensure that the speed is valid
					if(typeof speed == 'function'){
						// the speed is a function - assume callback
						callback = speed;
						speed = objPlugin.options.scrollSpeed;
					}else{
						speed = parseInt(speed);
						// if speed isn't numeric or is less than one, use the default scroll speed
						// a speed of 1 is Extremely high - scrolling will complete in 1 millisecond
						if(isNaN(speed) || (speed < 1)){
							speed = objPlugin.options.scrollSpeed;
						}
					}

					// determine the scroll position
					var objWindow = $(window),																	// the window object
						scrollTop = mixTarget.offset().top + (mixTarget.height()/2) - (objWindow.height()/2),	// vertical offset
						scrollLeft = mixTarget.offset().left + (mixTarget.width()/2) - (objWindow.width()/2),	// horizontal offset
						// calculate the scroll speed, depending on the distance needed to travel
						// we start at the base of 200 then multiply that by the distance/intN
						//  increase/decrease intN to change variable speed (dependant on distance) - higher = faster
						scrollSpeedY = speed * (Math.abs(objWindow.scrollTop() - scrollTop) / scrollVariableSpeed),
						scrollSpeedX = speed * (Math.abs(objWindow.scrollLeft() - scrollLeft) / scrollVariableSpeed),
						scrollSpeed = Math.max(scrollSpeedY, scrollSpeedX);

					// scroll the page to the correct position
					$('html, body').stop(true).animate(
						{
							scrollTop:scrollTop + 'px',
							scrollLeft:scrollLeft + 'px'
						},
						scrollSpeed,
						function(){
							// set the new window scroll position
							objWindow.data(dataName).scrollPosition.top = objWindow.scrollTop();
							objWindow.data(dataName).scrollPosition.left = objWindow.scrollLeft();

							if((this == $('html').get(0)) && (typeof callback == 'function')){
								// run the callback function
								callback.call(objPlugin, mixTarget);
							}
						}
					);

					return true;
				}
			};

			/**
			 * Runs the auto-scroll functionality
			 *
			 * @param objNav
			 * @param intDelay
			 * @param count
			 */
			function autoScroll(objNav, intDelay, count){
				var baseSpeed = objPlugin.options.autoScrollSpeed,
					objWindow = $(window),
					scrollPos = 0,
					scrollSpeed = baseSpeed;

				// fetch the scroll type
				switch(objPlugin.options.autoScrollType){
					case 'horizontal':
					case 'h':
						// scroll horizontally
						scrollPos = $(document).width() - objWindow.width();
						scrollSpeed *= (Math.abs(objWindow.scrollLeft() - scrollPos) / scrollVariableSpeed);

						$('html, body').stop(true).animate(
							{
								scrollLeft:scrollPos
							},
							scrollSpeed,
							function(){
								// set the new window scroll position
								objWindow.data(dataName).scrollPosition.left = objWindow.scrollLeft();
							}
						);
					break;
					case 'vertical':
					case 'v':
						// scroll vertically
						scrollPos = $(document).height() - objWindow.height();
						scrollSpeed *= (Math.abs(objWindow.scrollTop() - scrollPos) / scrollVariableSpeed);

						$('html, body').stop(true).animate(
							{
								scrollTop:scrollPos
							},
							scrollSpeed,
							function(){
								// set the new window scroll position
								objWindow.data(dataName).scrollPosition.top = objWindow.scrollTop();
							}
						);
					break;
					case 'points':
					case 'P':
					default:
						// scroll from navigation point, to navigation point
						objNav = isJQueryObject(objNav) ? objNav : $(objNav);
						count = parseInt(count);
						if(isNaN(count)){
							count = 0;
						}

						$(window).delay(intDelay).queue(function(next){
							methods['scrollTo']($(objNav.get(count)).attr('href'), baseSpeed, function(){
								intDelay = objPlugin.options.autoScrollDelay;

								if(count+1 >= objNav.length){
									if(objPlugin.options.repeat){
										count = 0;
									}else{
										return false;
									}
								}else{
									count++;
								}
								autoScroll(objNav, intDelay, count);
							});
							next();
						});
					break;
				}
			}

			/**
			 * Takes an element and checks to see
			 * if it is a JQuery object.
			 * Returns true or false
			 *
			 * @param obj
			 * @return {Boolean}
			 */
			function isJQueryObject(obj){
				return obj instanceof jQuery;
			}

			/**
			 * handle the function arguments to determine the action
			 */
			if(arguments.length == 0){
				// no arguments - throw error
				$.error('error in ' + pluginName + ' no user defined arguments');
			}else{
				if(methods[elements]){
					// the first argument is a function call
					return methods[elements].apply(this, Array.prototype.slice.call(arguments, 1));
				}else if(typeof elements == 'object'){
					// the first element should be a list of elements
					return methods.init.apply(this, arguments);
				}else{
					$.error('Method ' +  elements.toString() + ' does not exist on ' + pluginName);
				}
			}
		}
	});
})(jQuery, window, document);