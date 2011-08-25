// .............................................................................................. //
// DLStats - A NodeJS Product Downloads Stats System
// Copyright (c) 2011 Julien Ponge
// 
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// 
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
// 
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.
// .............................................................................................. //

function go() {
    
    installGUIHandlers();
    
    getData(function(stats) {
        $.each(stats, function(product, productStats) {
            $('#global-stats > tbody').append(
                $('<tr><td>' + product + '</td><td>' + productStats.all + '</td></tr>')
            );
            $.each(productStats, function(version, versionStats) {
                if (version != 'all') {
                    $('#version-stats > tbody').append(
                        $('<tr><td>' + product + '</td><td>' + 
                          version + '</td><td>' + versionStats.all + '</td></tr>')
                    );
                    $.each(versionStats.yearly, function(year, value) {
                        $('#yearly-stats > tbody').append(
                            $('<tr><td>' + year + '</td><td>' + product + '</td><td>' +
                              version + '</td><td>' + value + '</td></tr>')
                        );
                    });                    
                    $.each(versionStats.monthly, function(month, value) {
                        $('#monthly-stats > tbody').append(
                            $('<tr><td>' + month + '</td><td>' + product + '</td><td>' +
                              version + '</td><td>' + value + '</td></tr>')
                        );
                    });
                    $.each(versionStats.daily, function(day, value) {
                        $('#daily-stats > tbody').append(
                            $('<tr><td>' + day + '</td><td>' + product + '</td><td>' +
                              version + '</td><td>' + value + '</td></tr>')
                        );
                    });
                }
            });
        });
    });
    
    getMap(function(map, points) {
        $('#spinner > h3 > span').text('Loaded!');
        $('#spinner').fadeOut(3000);
        var image = '/stats-viewer/spot-32.png';
        points.forEach(function(point) {
            var marker = new google.maps.Marker({
                position: new google.maps.LatLng(point.latitude, point.longitude), 
                map: map, 
                icon: image
            });
        });
    });
}

// .............................................................................................. //

function installGUIHandlers() {
    var views = [
        '#map', '#global-stats', '#version-stats', '#yearly-stats', '#monthly-stats', '#daily-stats'
    ];
    var buttons = [
        '#map-button', '#global-button', '#version-button', '#yearly-button', '#monthly-button', '#daily-button'
    ];
    var activeMainView = '#map';
    var activeButton = '#map-button';
    buttons.forEach(function(button, index) {
        $(button + ' > a').click(function() {
            $(activeButton).removeClass('active');
            $(button).addClass('active');
            $(activeMainView).fadeOut('fast', function() {
                $(views[index]).fadeIn('fast');
                activeButton = button;
                activeMainView = views[index];
            });
        });
    });
}

// .............................................................................................. //

function getMap(callback) {
    var latlng = new google.maps.LatLng(45.759723, 4.842223);
    var myOptions = {
        zoom: 3,
        center: latlng,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    var map = new google.maps.Map(document.getElementById('map'), myOptions);
    
    $.getJSON('/geoloc-data', function(data) {
        callback(map, data);
    });
}

// .............................................................................................. //

function getData(callback) {
    $.getJSON('/stats-snapshot', function(stats) {
        callback(stats);
    });
}

// .............................................................................................. //