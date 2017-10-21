function highlightWords($element) {  
    $element.data('ui-autocomplete')._renderItem = function( ul, item ) {
        switch(Lander.highlightWordsStyle) {
            case 'all':
                var newText = String(item.value).replace(
                    new RegExp(this.term.trim(), "gi"),
                    "<strong>$&</strong>");

                return $("<li></li>")
                        .data("item.autocomplete", item)
                        .append(newText)
                        .appendTo(ul);
            case 'beginning':
                var newText = String(item.value).replace(
                    new RegExp('^'+this.term.trim(), "gi"),
                    "<strong>$&</strong>");

                return $("<li></li>")
                        .data("item.autocomplete", item)
                        .append(newText)
                        .appendTo(ul);
            case 'address':
                var newText1 = String(item.value).replace(new RegExp('^.+?,', 'gi'), '<strong>$&</strong>');
                var newText = newText1.replace(new RegExp('^<strong>'+this.term.trim(), 'gi'), '<strong>$&</strong>');

                return $("<li></li>")
                        .data("item.autocomplete", item)
                        .append(newText)
                        .appendTo(ul);
        }
    };
}

function smartMapBoxAutoComplete($element, lat, lng) {
    var params = {
        access_token:MAPBOX_KEY,
        proximity:lng+','+lat,
        autocomplete:true
    };
    if(MAPBOX_ONLY_PLACES) 
        params.types = 'place,poi,poi.landmark';
    
    $element.autocomplete({
        source: function (request, response) {
            $.ajax({
                url: "https://api.mapbox.com/geocoding/v5/mapbox.places/"+request.term+".json",
                data: params,
                success: function (data) {
                    if(data.features && data.features.length > 0) {
                        response($.map(data.features, function(item){
                            return {
                                data: item,
                                label: item.place_name,
                                value: item.place_name
                            }
                        }));
                    }
                }
            });
        },
        minLength: 1
    });

    if(Lander.highlightWords && Lander.highlightWordsStyle !== "none") {
        highlightWords($element);
    }
}

function _setMapBoxAutoComplete(lat, lng) {
    $.ajax({
        url: "https://api.mapbox.com/geocoding/v5/mapbox.places/New York.json",
        data: {
            access_token:MAPBOX_KEY,
            proximity:lng+','+lat,
            autocomplete:true
        },
        success: function (data) {
            smartMapBoxAutoComplete($("#js-starting-location"), lat, lng);
            smartMapBoxAutoComplete($("#js-destination"), lat, lng);
            smartMapBoxAutoComplete($("#js-destination-geoip"), lat, lng);
        }, 
        error: function (xhr, error) {
            snlmLogError('mapbox', 'Autocomplete error: '+xhr.statusText);
            smartStreetAutoComplete($("#js-starting-location"));
            smartStreetAutoComplete($("#js-destination"));
            smartStreetAutoComplete($("#js-destination-geoip"));            
        }
    });
}

function setMapBoxAutoComplete(found) {
    if(typeof geoip2 == 'undefined') {
        _setMapBoxAutoComplete(40.4019894, -88.9395026);
    } else {
        geoip2.city(function(res){
            if(!res || !res.location) 
                return _setMapBoxAutoComplete(40.4019894, -88.9395026);
            
            _setMapBoxAutoComplete(res.location.latitude, res.location.longitude);
        }, function(err){
            _setMapBoxAutoComplete(40.4019894, -88.9395026);
        });
    }
}

function smartStreetAutoComplete($element) {
    $element.autocomplete({
        source: function (request, response) {
            $.ajax({
                url: "https://autocomplete-api.smartystreets.com/suggest",
                data: {
                    'auth-id':'15392090925738463',
                    prefix: request.term,
                    geolocate:true,
                    geolocate_precision:'state',
                    suggestions:6
                },
                success: function (data) {
                    if(data.suggestions && data.suggestions.length > 0) {
                        response($.map(data.suggestions, function(item){
                            return {
                                data: item,
                                label: item.text,
                                value: item.text
                            }
                        }));
                    }
                }
            });
        },
        minLength: 1
    });

    if(Lander.highlightWords && Lander.highlightWordsStyle !== "none") {
        highlightWords($element);
    }
}

function setSmartStreetAutoComplete(found) {
    smartStreetAutoComplete($("#js-starting-location"));
    smartStreetAutoComplete($("#js-destination"));
    smartStreetAutoComplete($("#js-destination-geoip"));
}

function hereComAutoComplete($element, lat, lng) {
    $element.autocomplete({
        source: function (request, response) {
            $.ajax({
                url: "https://places.demo.api.here.com/places/v1/autosuggest",
                data: {
                    at:lat+','+lng,
                    q:request.term,
                    app_id:HERE_APP,
                    app_code:HERE_CODE,
                    results_types:'address,place',
                    size:10,
                    tf:'plain'
                },
                success: function (data) {
                    if(data.results && data.results.length > 0) {
                        response($.map(data.results, function(item){
                          var label = item.title.replace(/\n/ig, ' ');
                          if(item.vicinity) 
                            label += ', ' + item.vicinity.replace(/\n/ig, ' ');
                          
                            return {
                                data: item,
                                label: label,
                                value: label
                            }
                        }));
                    }
                }
            });
        },
        minLength: 1
    });

    if(Lander.highlightWords && Lander.highlightWordsStyle !== "none") {
        highlightWords($element);
    }
}

function _setHereComAutoComplete(lat, lng) {
    $.ajax({
        url:'https://places.demo.api.here.com/places/v1/autosuggest',
        data: {
            at:lat+','+lng,
            q:'Canada',
            app_id:HERE_APP,
            app_code:HERE_CODE,
            results_types:'address,place',
            size:10,
            tf:'plain'
        },
        success:function(response) {
            hereComAutoComplete($("#js-starting-location"), lat, lng);
            hereComAutoComplete($("#js-destination"), lat, lng);
            hereComAutoComplete($("#js-destination-geoip"), lat, lng);
        },
        error:function(error) {
            smartStreetAutoComplete($("#js-starting-location"));
            smartStreetAutoComplete($("#js-destination"));
            smartStreetAutoComplete($("#js-destination-geoip"));
        }
    });
}

function setHereComAutoComplete(found) {
    if(typeof geoip2 == 'undefined') {
        _setHereComAutoComplete(40.4019894, -88.9395026);
    } else {
        geoip2.city(function(res){
            if(!res || !res.location) 
                return _setHereComAutoComplete(40.4019894, -88.9395026, 5);
            
            _setHereComAutoComplete(res.location.latitude, res.location.longitude);
        }, function(err){
            _setHereComAutoComplete(40.4019894, -88.9395026, 5);
        });
    }
}

function setGoogleAutoComplete() {
    var addr = document.getElementById('js-starting-location');
    new google.maps.places.Autocomplete(addr);

    var addr2 = document.getElementById('js-destination');
    new google.maps.places.Autocomplete(addr2);

    var addr3 = document.getElementById('js-destination-geoip');
    new google.maps.places.Autocomplete(addr3);

}

function bingAutoComplete($element){
    $element.autocomplete({
        source: function (request, response) {
            $.ajax({
                url: "http://dev.virtualearth.net/REST/v1/Locations",
                dataType: "jsonp",
                data: {
                    key: Lander.BING_KEY,
                    q: request.term
                },
                jsonp: "jsonp",
                success: function (data) {
                    var result = data.resourceSets[0];
                    if (result) {
                        if (result.estimatedTotal > 0) {
                            response($.map(result.resources, function (item) {
                                return {
                                    data: item,
                                    label: item.name + ' (' + item.address.countryRegion + ')',
                                    value: item.name
                                }
                            }));
                        }
                    }
                }
            });
        },
        minLength: 1
    });

    if(Lander.highlightWords && Lander.highlightWordsStyle !== "none") {
        highlightWords($element);
    }
}

function _setBingAutoComplete(found) {
    bingAutoComplete($("#js-starting-location"));
    bingAutoComplete($("#js-destination"));
    bingAutoComplete($("#js-destination-geoip"));
}

function setGoogleAutoComplete() {
    var addr = document.getElementById('js-starting-location');
    new google.maps.places.Autocomplete(addr);

    var addr2 = document.getElementById('js-destination');
    new google.maps.places.Autocomplete(addr2);

    var addr3 = document.getElementById('js-destination-geoip');
    new google.maps.places.Autocomplete(addr3);

}

function _setGoogleAutoComplete(found) {
    if(!found) {
        if(useHereCom) {
            setHereComAutoComplete();
        } else if(useSmartyStreets) {
            setSmartStreetAutoComplete();
        } else {
            setGoogleAutoComplete();
        }
    } else {
        setGoogleAutoComplete();
    }
}

function setBingAutoComplete() {
    $.ajax({
        url: "http://dev.virtualearth.net/REST/v1/Locations",
        dataType: "jsonp",
        data: {
            key: Lander.BING_KEY,
            q: 'New York, NY'
        },
        jsonp: "jsonp",
        success: function (data) {
            if(data.authenticationResultCode == 'DeniedCredentials') {
                $('#map').addClass('bingoff');
                setGoogleAutoComplete();
            } else {
                _setBingAutoComplete();
            }
        }
    });
}

function setNoAutoComplete(found) {
    return;
}

function setAutoCompletePlacesByAPI(default_action, api, found) {
    var providers = ['here', 'bing', 'smart', 'mapbox'];
    var provider_actions = {
        google:_setGoogleAutoComplete,
        here:setHereComAutoComplete,
        bing:_setBingAutoComplete,
        smart:setSmartStreetAutoComplete,
        mapbox:setMapBoxAutoComplete,
        none:setNoAutoComplete
    };

    var remaining = providers.filter(function(item){
        return item !== api;
    });
    
    if(autocompleteAPI === api || autocompleteAPI === 'default') {
        return default_action(found);
    } else {
        for(var i in remaining) {
            if(remaining[i] === autocompleteAPI) 
                return provider_actions[remaining[i]]();
        }
        return provider_actions.none();
    }
}

function setAutoCompletePlaces(found) {
    if(mapsAPI === 'google')
        initializeMap();

    var provider_actions = {
        here:setHereComAutoComplete,
        bing:_setBingAutoComplete,
        google:_setGoogleAutoComplete,
        mapbox:setMapBoxAutoComplete,
    };

    return setAutoCompletePlacesByAPI(provider_actions[mapsAPI], mapsAPI, found);
}