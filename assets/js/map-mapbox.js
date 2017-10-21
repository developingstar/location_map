var searchingComplete = false;
var map = null;
var finalRoute;
var router;
var printMap;
var defaultLocation;
var apiDisabled = false;

L.mapbox.accessToken = MAPBOX_KEY;

function createBingMap(lat, lng, zoom) {
    map.remove();

    apiDisabled = true;
    var mapOptions = {
        credentials: Lander.BING_KEY,
        center:new Microsoft.Maps.Location(lat, lng),
        zoom: zoom,
        backgroundColor:'#fff'
    };

    if(Lander.useBing7) {
        map = new Microsoft.Maps.Map(document.getElementById('map'), mapOptions);
    } else {
        map = new Microsoft.Maps.Map('#map', mapOptions);
    }
    
    $('#map').addClass('show-map');
}

function createMap(lat, lng, zoom) {
    if(map)
        map.remove();

    defaultLocation = [lat, lng];
    
    map = L.mapbox.map('map').setView([lat, lng], zoom);

    if(Lander.useMapQuestStyle) {
        var styleLayer = L.mapbox.styleLayer('mapbox://styles/tripod7/cj1gor0g8000v2rpiszlpmurg').addTo(map);
    } else {
        // var styleLayer = L.mapbox.styleLayer('mapbox://styles/mapbox/streets-v9').addTo(map);
        var styleLayer = L.mapbox.styleLayer('mapbox://styles/mapbox/satellite-v9').addTo(map);
        // 
    }

    $('#map').append('<a href="http://mapbox.com/about/maps" class="mapbox-wordmark" target="_blank">Mapbox</a>');

    styleLayer.on('error', function(e){
        // create bing map
        snlmLogError('mapbox', 'Style Layer error: '+JSON.stringify(e.error));
        createBingMap(lat, lng, zoom);
    });

    $('#map').addClass('show-map');
}

function initializeMap() {
    $("#map").html('');
    $("#print-map").html('');
    if(typeof geoip2 == 'undefined') {
        createMap(40.4019894, -88.9395026, 5);
    } else {
        geoip2.city(function(res){
            if(!res || !res.location) 
                return createMap(40.4019894, -88.9395026, 5);
            
            createMap(res.location.latitude, res.location.longitude, Lander.mapZoom);

            window.blockedCities(res.location);

            cityName = res.city.names.en;
            countryCode = res.country.iso_code;
            
            $('.js-city-name').text(cityName);
            $('.js-city-loading').hide();
            $('.js-city').show();
        }, function(err){
            createMap(40.4019894, -88.9395026, 5);
        });
    }

    setAutoCompletePlaces();
}

function displayRouteInstructions(element) {
    $(element).html('');
    $(element).append('<p>'+finalRoute.summary+'</p>');
    for(var i in finalRoute.steps) {
        $(element).append('<p>'+finalRoute.steps[i].maneuver.instruction+'</p>');
    }
}

function setOfferMap() {
    $('#map').show();

    if(!router || !router.directions)
        return;

    var directionsLayer = L.mapbox.directions.layer(router).addTo(map);
    router.fire('load', router.directions);

    if(finalRoute)
        router.selectRoute(finalRoute);

    if(router.directions.origin && router.directions.destination) {
        var ori = L.latLng(router.directions.origin.geometry.coordinates[1], router.directions.origin.geometry.coordinates[0]);
        var dest = L.latLng(router.directions.destination.geometry.coordinates[1], router.directions.destination.geometry.coordinates[0]);

        map.fitBounds(L.latLngBounds([ori, dest]));
    }
}

function initPrintMap() {
    if(printMap)
        printMap.remove();
    
    printMap = L.mapbox.map('print-map').setView([lat, lng], zoom);
    var styleLayer = L.mapbox.styleLayer('mapbox://styles/mapbox/streets-v9').addTo(map);

    styleLayer.on('ready', function() {
        styleLayer.options.attribution = "";
    }); 

    if(!router || !router.directions) {
        printMap.setView(defaultLocation, 10);
        return;
    }

    var directionsLayer = L.mapbox.directions.layer(router).addTo(printMap);
    router.fire('load', router.directions);

    if(finalRoute)
        router.selectRoute(finalRoute);
    
    if(router.directions.origin && router.directions.destination) {
        var ori = L.latLng(router.directions.origin.geometry.coordinates[1], router.directions.origin.geometry.coordinates[0]);
        var dest = L.latLng(router.directions.destination.geometry.coordinates[1], router.directions.destination.geometry.coordinates[0]);

        printMap.fitBounds(L.latLngBounds([ori, dest]));
    }
}

function finalPopupShownCallback() {
    // if($('#map-preview').length === 0)
    //     return;
    
    // var preview_map = new google.maps.Map(document.getElementById('map-preview'), {
    //     zoom: Lander.mapZoom,
    //     scrollwheel: false,
    //     navigationControl: true,
    //     mapTypeControl: false,
    //     scaleControl: true,
    //     draggable: true,
    //     center: preview_location
    //  });
}

function calculatingRoute(geoip) {
    $('#directions-holder').html('');
    $('#direction-content').html('');
    $('#print-directions').html('');

    $('#directions-error').hide();

    var success = function(response) {
        //$('#success .again').hide();
        directionsError = false;
        searchingComplete = true;

        $('#modal-directions h2').hide();
        $('#modal-directions h2.js-success-ok').show();

        $('#directions-holder').show();
        $('#directions-error').hide();
        $('#ads-sidebar-desktop').hide();

        $('.map-preview').hide();

        finalRoute = response.routes[0];

        var directionsDisplay = document.getElementById('directions-holder');
        var directionsDisplay2 = document.getElementById('direction-content');
        var directionsDisplay3 = document.getElementById('print-directions');

        displayRouteInstructions(directionsDisplay);
        displayRouteInstructions(directionsDisplay2);
        displayRouteInstructions(directionsDisplay3);

        $('.directions-routes').hide();

        if(geoip && Lander.showMapPreview) {
             $('#modal-directions h2').hide();
             $('#modal-directions h2.js-success-preview').show();

             $('#directions-holder').hide();

             $('.map-preview').show();

             //preview_location = response.routes[0].legs[0].end_location;
        }
    };

    var fail1 = function() {
        searchingComplete = true;
        directionsError = true;
        $('#modal-directions h2').hide();
        $('#modal-directions h2.js-success-no').show();

        $('#directions-holder').hide();
        //$('#directions-error').show();

        $('.directions-routes').hide();
        //$('#success .again').show();

        //$('#ads-sidebar-desktop').hide();
    };

    if(!geoip) {
        var start = document.getElementById("js-starting-location").value;
        var end = document.getElementById("js-destination").value;

        if(start == '')
            start = cityName + ', ' + countryCode;
        else if(end == '')
            end = cityName + ', ' + countryCode;
    } else {
        var start = cityName + ', ' + countryCode;
        var end = document.getElementById("js-destination-geoip").value;
    }

    if(start == '' || end == '') {
        fail1(start, end);
    } else {
        routeRequest(start, end, success, fail1);
    }
}


function routeRequest(start, end, success, fail) {
    var geocoder = L.mapbox.geocoder('mapbox.places');

    var start_point = false;
    var end_point = false;

    var requestRoute = function(point1, point2) {
        router = L.mapbox.directions();
        
        router.setOrigin(point1);
        router.setDestination(point2);

        router.on('load', function() {
            if(router.directions.routes && router.directions.routes.length > 0) {
                success(router.directions);
            } else {
                fail(start, end);
            }
        });

        router.on('error', function(e){
            snlmLogError('mapbox', 'Router Error: '+JSON.stringify(e.error[0]));
            fail(start, end);
        });

        router.query();
    };

    $('.js-print-from').text(start);
    $('.js-print-to').text(end);

    geocoder.query(start, function(err, result){
        if(err) {
            snlmLogError('mapbox', 'Geocoding error: '+JSON.stringify(result));
            start_point = 'err';
            if(end_point !== false && start_point === 'err') 
                fail(start, end);
        } else {
            start_point = result.results.features[0];
            if(start_point !== false && end_point !== false && start_point !== 'err' && end_point !== 'err') 
                requestRoute(start_point, end_point);
        }
    });

    geocoder.query(end, function(err, result){
        if(err) {
            snlmLogError('mapbox', 'Geocoding error: '+JSON.stringify(err));
            end_point = 'err';
            if(start_point !== false && end_point === 'err') 
                fail(start, end);
        } else {
            end_point = result.results.features[0];
            if(start_point !== false && end_point !== false && start_point !== 'err' && end_point !== 'err') 
                requestRoute(start_point, end_point);
        }
    });
}

$(initializeMap);