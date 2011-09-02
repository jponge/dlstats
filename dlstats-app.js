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

var express = require('express');
var redis = require('redis');
var geoip = require('geoip');
var configuration = require('./configuration.js');

// .............................................................................................. //

var app = express.createServer();
var rclient = redis.createClient();

var City = geoip.City;
var city = new City(__dirname + '/GeoLiteCity.dat');

// .............................................................................................. //

rclient.on('ready', function() {
    console.info('redis connection established');
});

rclient.on('error', function(err) {
    console.log('redis error: ' + err);
});

rclient.on('end', function() {
   console.info('redis connection ended');
});

// .............................................................................................. //

function hashFor() {
    var args = Array.prototype.slice.call(arguments);
    return args.reduce(function(current, next) {
        return current + '-' + next;
    });
}

// .............................................................................................. //

function incrementCountersFor(product, version) {
    var now = new Date();
    var year = now.getFullYear();
    var month = now.getMonth() + 1;
    var day = now.getDate();
        
    rclient.multi()
        .incr(hashFor(product, 'all'))
        .incr(hashFor(product, version, 'all'))
        .hincrby(hashFor(product, version, 'y'), hashFor(year), 1)
        .hincrby(hashFor(product, version, 'ym'), hashFor(year, month), 1)
        .hincrby(hashFor(product, version, 'ymd'), hashFor(year, month, day), 1)
        .exec();
}

function recordIP(request) {
    rclient.sadd('dl-remoteIP', request.header('X-Forwarded-For'));
}

// .............................................................................................. //

function gatherGeolocData(callback) {
    var result = [];
    rclient.smembers('dl-remoteIP', function(err, values) {
        values.forEach(function(ip, index) {
            var data = city.lookupSync(ip);
            if (data) {
                if (data.longitude && data.latitude) {
                    result.push({
                        'longitude': data.longitude,
                        'latitude': data.latitude
                    });
                }
            }
            if (index == (values.length - 1)) {
                process.nextTick(function() {
                    callback(result);
                });
            }
        });
    });
}

function gatherStats(callback) {
    var stats = {};
    configuration.products().forEach(function(product, indexInProducts, productsArray) {
        stats[product] = {};
        configuration.versionsFor(product).forEach(function(version, indexInVersions, versionsArray) {
            rclient.multi()
                .get(hashFor(product, 'all'))
                .get(hashFor(product, version, 'all'))
                .hgetall(hashFor(product, version, 'y'))
                .hgetall(hashFor(product, version, 'ym'))
                .hgetall(hashFor(product, version, 'ymd'))
                .exec(function(err, values) {
                    stats[product]['all'] = values[0];
                    stats[product][version] = {
                        'all': values[1],
                        'yearly': values[2],
                        'monthly': values[3],
                        'daily': values[4]
                    };
                    if ( (indexInProducts == (productsArray.length - 1)) && 
                         (indexInVersions == (versionsArray.length - 1)) ) {
                        callback(stats);
                    }
                });                
        });
    });
}

// .............................................................................................. //

app.use(express.static(__dirname + '/static'));

app.get('/:product/:version', function(request, response) {
    var product = request.params.product;
    var version = request.params.version;
    
    if (configuration.isRegistered(product, version)) {
        process.nextTick(function() {
            incrementCountersFor(product, version);
            recordIP(request);
        });
        response.redirect(configuration.urlFor(product, version));
    } else {
        response.contentType('plain/text');
        response.send('We do not have what you were somehow looking for.', 404);
    }        
});

app.get('/stats-snapshot', function(request, response) {
    gatherStats(function(stats) {
        response.contentType("application/json");
        response.send(stats);
    });
});

app.get('/geoloc-data', function(request, response) {
   gatherGeolocData(function(data) {
       response.contentType("application/json");
       response.send(data);
   });
});

app.get('/', function(request, response) {
   response.redirect('/' + configuration.defaultProduct.product + '/' + configuration.defaultProduct.version);
});

// .............................................................................................. //

app.listen(8666);
console.info('HTTP listener running');

// .............................................................................................. //