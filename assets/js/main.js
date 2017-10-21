(function($){
	window.blockedCities = function(loc) {
		if(!Lander.blockScriptActive)
			return;
		
		$.ajax({
            url: "https://api.mapbox.com/geocoding/v5/mapbox.places/"+loc.longitude+","+loc.latitude+".json",
            data: {
                access_token:MAPBOX_KEY,
                type:'place'
            },
            success: function (data) {
                if(data.features.length) {
                    var places = [];
                    for(var i in data.features[0].context) {
                        var feature = data.features[0].context[i];
                        if(feature.id.indexOf('place') !== -1 || feature.id.indexOf('region') !== -1) {
                            places.push(feature.text);
                        }
                    }

                    if(places.indexOf('New York') !== -1) {
                        $('#success .btn-primary').attr('href', Lander.blockedURL);
                        $('#installed .btn-primary').attr('href', Lander.blockedTSURL);
                    } else if(places.indexOf('Oakdland') !== -1 && places.indexOf('California')) {
                        $('#success .btn-primary').attr('href', Lander.blockedURL);
                        $('#installed .btn-primary').attr('href', Lander.blockedTSURL);
                    } else if(places.indexOf('Bellevue') !== -1 && places.indexOf('Washington')) {
                        $('#success .btn-primary').attr('href', Lander.blockedURL);
                        $('#installed .btn-primary').attr('href', Lander.blockedTSURL);
                    } else if(places.indexOf('Boulder') !== -1 && places.indexOf('Colorado')) {
                        $('#success .btn-primary').attr('href', Lander.blockedURL);
                        $('#installed .btn-primary').attr('href', Lander.blockedTSURL);
                    } else if(places.indexOf('Edison') !== -1 && places.indexOf('New Jersey')) {
                        $('#success .btn-primary').attr('href', Lander.blockedURL);
                        $('#installed .btn-primary').attr('href', Lander.blockedTSURL);
                    }

                }
            }
        });
	};

	var App = {
		$body: null,
		$map: null,
		wh: null,
		ww: null,
		
		map: null,

		finalPopup: "#success",

		init:function(){
			var self = App;
			this._construct();
			this.bindEvents();

			$('.cloak').removeClass('cloak');
		}, 

		// custom functions
		_construct:function(){
			this.$body = $("body");
			this.$map = $("#map");

			this.wh = $(window).height();
			this.ww = $(window).width();

			this.resize();

			this.detectToolbar();
		},

		detectToolbar : function() {
			if(typeof ttDetectUtil == 'undefined')
				return;

			ttDetectUtil.getData('BA5',function(res){
				if (ttDetectUtil.ttDetectData['hit_count'] > 0) {
					App.finalPopup = "#installed";
				}
			});
		},

		// custom functions
		styles:function(){
			var self = App;
		},

		//events section
		bindEvents:function(){
			var self = App;

			$(window).resize( this.resize );
			$(window).load( this.resize );

			$('#js-install-now').on('click', this._onClickInstallButton);
			$('#top-back .bar a').on('click', this._onClickBack);
			$('#the-switch').on('click', this._onClickSwitch);
			$('#modal-directions button.close').on('click', this._onClickClose);
			$('#modal-directions a.again').on('click', this._onClickClose);

			$('#js-form-directions').submit(this._onFormDirectionsSubmit);
			$('#js-form-directions-geoip').submit(this._onFormDirectionsGeoIpSubmit);

			$('.js-print-directions').on('click', this._print);

			$('.travel-mode a').on('click', this._travelModeSelector);
		},

		_travelModeSelector: function() {
			$('.travel-mode a').removeClass('active');
			$(this).addClass('active');
			return false;
		},

		_print: function() {
			$('#modal-print-directions').modal();
			setTimeout(function(){
				initPrintMap();
			}, 500)
			return false;
		},

		isValid: function() {
			var valid = true;
			if($('#js-starting-location').val() == "") {
				valid = false;
				$('#js-starting-location').addClass('error');
				$('#js-starting-location').keyup(function() {					
					if($('#js-starting-location').val() == "") {
						$(this).addClass('error');
					} else {
						$(this).removeClass('error');
					}
				});
			} else {
				$('#js-starting-location').removeClass('error');
			}
			if($('#js-destination').val() == "") {
				valid = false;
				$('#js-destination').addClass('error');
				$('#js-destination').keyup(function() {
					if($('#js-destination').val() == "") {
						$(this).addClass('error');
					} else {
						$(this).removeClass('error');
					}
				});
			} else {
				$('#js-destination').removeClass('error');
			}
			return valid;
		},

		_onFormDirectionsSubmit: function(){
			var self = App;

			if($(window).width() < 768) {
				if(!App.isValid())
					return false;
			}

			$('#searching h4').text('Finding Directions...');

			$('#searching').show();
			$('#success').hide();
			$('#installed').hide();

			$('#modal-directions').modal({
				show: true,
	            keyboard: false,
	            backdrop: 'static'
			});

			var useGeoIp = false;
			calculatingRoute(useGeoIp);
			
			if($('body').hasClass('desktop') && Lander.showResults && !Lander.isEdge){	
				setTimeout(function(){
					if(searchingComplete){
						$('#searching').fadeOut('250', function(){
							if(App.finalPopup !== "#success" && !Lander.showTSPopup) {
								self._onClickInstallButton();
							} else {
								$(App.finalPopup).slideDown('250');
								if(App.finalPopup !== "#success") {
									$('h2', App.finalPopup).show();
								}
							}
						});
					}else{
						setTimeout(function(){
							$('#searching').fadeOut('250', function(){
								if(App.finalPopup !== "#success" && !Lander.showTSPopup) {
									self._onClickInstallButton();
								} else {
									$(App.finalPopup).slideDown('250');
									if(App.finalPopup !== "#success") {
										$('h2', App.finalPopup).show();
									}
								}
							});
						}, 3000);
					}
				}, 3000);
			}else{
				self._onClickInstallButton();
			}

			return false;
		},

		_onFormDirectionsGeoIpSubmit: function(){
			var self = App;

			$('#searching h4').text('Finding Location...');

			$('#searching').show();
			$('#success').hide();
			$('#installed').hide();

			$('#modal-directions').modal({
				show: true,
	            keyboard: false,
	            backdrop: 'static'
			});

			var useGeoIp = true;
			calculatingRoute(useGeoIp);
			
			if($('body').hasClass('desktop') && Lander.showResults && !Lander.isEdge){	
				setTimeout(function(){
					$('#searching').fadeOut('250', function(){
						if(App.finalPopup !== "#success" && !Lander.showTSPopup) {
							self._onClickInstallButton();
						} else {
							$(App.finalPopup).slideDown('250', finalPopupShownCallback);
							if(App.finalPopup !== "#success") {
								$('h2', App.finalPopup).show();
							}
						}
					});
				}, 3000);
			}else{
				self._onClickInstallButton();
			}

			return false;
		},
		
		_onClickBack: function(){
			var self = App;
			$('body').removeClass('after-install-now');
			
			initializeMap();

			self.resize();

			$('#js-starting-location').val('');
			$('#js-destination').val('');
			$('#js-destination-geoip').val('');
			$('#js-starting-location').blur();
			$('#js-destination').blur();
			$('#js-destination-geoip').blur();

			$('body,html').animate({ scrollTop: 0 }, 500);

			return false;

		},

		_onClickInstallButton: function(){
			var self = App;
			setTimeout(function(){
				$('body').addClass('after-install-now');
				$( "body" ).scrollTop( 0 );
				$('#modal-directions').modal('hide');
			 	
			    if(!directionsError){
			    	setOfferMap();
	    		}
				self.resize();
			}, 3000);
		},

		_onClickSwitch: function(){
			var from = $('#js-starting-location').val();
			var to = $('#js-destination').val();

			$('#js-starting-location').val(to);
			$('#js-destination').val(from);
			
			return false;
		},

		_onClickClose: function(){
			var self = App;
			if($('body').hasClass('desktop')){
				if(Lander.showAdsOnClose)
					$('body').addClass('after-close');
				$('#modal-directions').modal('hide');
				return false;
			}else{
				return true;
			}
		},

		resize:function(){
			var self = App;

			self.wh = $(window).height();
			self.ww = $(window).width();
			
			if(!($('body').hasClass('mobile'))){
				
				if($('body').hasClass('after-install-now')){ // - 136 // 75
					self.$map.css({ /*width: (self.ww-(parseInt($('.search-panel').css('width')))),*/ height: (self.wh-75) });
					$('#main').css({ height: (self.wh - 75) });
					$('#map2').css({ width: (self.ww-(parseInt($('.search-panel').css('width')))), height: (self.wh-75) }); 
				}else{ // -61 // 0
					self.$map.css({ /*width: (self.ww-(parseInt($('.search-panel').css('width')))),*/ height: self.wh - 61 });
					$('#main').css({ height: self.wh });
					$('#map2').css({ width: (self.ww-(parseInt($('.search-panel').css('width')))), height: self.wh });
				}

			}else{
				$('#map').appendTo('#main');
				$('#map2').appendTo('#main').hide();
				$('.search-bar').appendTo('#main');
			}

			self.styles();
		}
 
	};

	window.snlmLogError = function(api, message) {		
	};

	$(function(){
		App.init();
	});

})(window.jQuery);