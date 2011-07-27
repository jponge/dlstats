# DLStats - A NodeJS Product Downloads Stats System #

This is a simple tool to track the downloads of a set of products. What it does is that it maintains a list of products, versions and the corresponding download URL for each of them.

Published URLs are of the form `/:product/:version`. Each HTTP GET request triggers a redirection to the true download URL, and the application increases stats for this product and version. It was originally built to power the [IzPack project](http://izpack.org/) downloads system. Example URLs include [http://get.izpack.org/izpack/4.3.4](http://get.izpack.org/izpack/4.3.4) and [http://get.izpack.org/izpack/5.0.0-beta8](http://get.izpack.org/izpack/5.0.0-beta8).

Stats are maintained using an efficient in-memory [Redis](http://redis.io/) database. It should be noted that the application is resilient to database problems as users are always redirected to the true download URL even if the download hit cannot be tracked for some reason.

A minimalistic stats viewer is available with geolocation capabilities. REST/JSON interfaces are available for integration with third-party clients.

## License ##

Copyright (c) 2011 Julien Ponge

* [Web contact](http://julien.ponge.info/)
* [Email contact](mailto:julien.ponge@gmail.com)

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see [http://www.gnu.org/licenses/](http://www.gnu.org/licenses/).

## Requirements ##

The tool requires a [NodeJS](http://nodejs.org/) runtime and a [Redis](http://redis.io/) database.

Strong requirements:

* `npm install express -g`
* `npm install hiredis redis -g`
* GeoIP C libraries from MaxMind
* GeoLiteCity.dat database file from http://geolite.maxmind.com/download/geoip/database/
* `npm install geoip -g`

Suggestion for your deployments:

* `npm install supervisor -g`

## Configuration ##

All configuration happens in the upper section of `configuration.js`. Rename `configuration.js.template` to `configuration.js and you should be ready to go. A self-explanatory example would be as follows:

    var configuration = {
        products: {
            'izpack': {
                '4.3.4': 'http://dist.codehaus.org/izpack/releases/4.3.4/IzPack-install-4.3.4.jar',
                '5.0.0-beta7': 'http://dist.codehaus.org/izpack/releases/5.0.0-beta7/izpack-dist-5.0.0-beta7-installer.jar',
                '5.0.0-beta8': 'http://dist.codehaus.org/izpack/releases/5.0.0-beta8/izpack-dist-5.0.0-beta8-installer.jar'
            }
        },
        defaultProduct: {
            'product': 'izpack',
            'version': '5.0.0-beta8'
        }
    };

The `defaultProduct` entry is for URLs with no product and version fragments. In this example, [http://get.izpack.org/](http://get.izpack.org/) is equivalent to [http://get.izpack.org/izpack/5.0.0-beta8](http://get.izpack.org/izpack/5.0.0-beta8).

## Deployment ##

You have so many options... it all depends on the traffic that your download center gets, and how precise the collected data should be.

In most configurations a single NodeJS instance coupled with a single Redis instance will be just fine. If you have more elaborated needs them you will have to launch a cluster of NodeJS instances and a Redis cluster.

The configuration of each is out of the scope of this document. **Please do not ask for support from this project regarding deployment and configuration of NodeJS, your favorite HTTP server and Redis.**

### HTTP server ###

Best is having a frontal server acting as a proxy / load balancer. The application runs a **HTTP listener on port 8666** by default. Note that for the geolocalization to work, your frontal server should define a **X-Forwarded-For** header, otherwise the application will not pick the client IP address but the one of your frontal server.

As far as I am concerned, I am using Lighttpd as a frontal proxy.

You may also secure the stats access. With Lighttpd, I used a configuration similar to:

    auth.backend = "htpasswd"
    auth.backend.htpasswd.userfile = "/etc/lighttpd/user.htpasswd"
    auth.require = (
            "/stats-viewer/" =>
                    ( "method" => "basic",
                    "realm"  => "Stats",
                    "require" => "valid-user"
            ),
            "/stats-snapshot" =>
                    ( "method" => "basic",
                    "realm"  => "Stats",
                    "require" => "valid-user"
            ),
            "/geoloc-data" =>
                    ( "method" => "basic",
                    "realm"  => "Stats",
                    "require" => "valid-user"
            )
    )

### Redis ###

How and how often Redis snapshots its in-memory dataset has a direct impact on performance versus the potentiality of loosing data.

As far as I am concerned I snapshot every 10 seconds when at least 1 key was changed, so my `redis.conf` contains this entry:

    save 10 1

This application will typically manipulate a relatively small dataset, hence it should easily fit into memory and I/O should be very fast.

## How you can help ##

* Improve the code there and there, fixing potential bugs, improving performance, and adding functionality.
* **Provide a better stats viewer** (HTML5 fancy app anyone?).

## Q&A ##

**Why NodeJS while you are notoriously a Java guy?**

NodeJS fills all the requirements for a lightweight / thin HTTP handler application. I also wanted to try NodeJS. Picking a technology that ticks the marks is actually a good thing. Being religious on platforms is not.

**Cool, so would you recommend NodeJS for my next enterprise development?**

No, unless you understand how event loops and continuations work. Pick NodeJS for an application or for part of an application only if you actually know why your current software stack is a lesser choice. The fact that NodeJS is hyped is not a valid reason.

**Why Redis and not X, Y, or a relational database?**

Redis is fast as it is in-memory. Managing counters is easy with it. You may loose a few downloads if the server went to crash, but you can easily tune Redis to lower the risk.

**Why the AGPL? My corporate policies prohibit it!**

I am no GNU fan to be honest, and I am more enclined towards liberal software licenses. The AGPL fixes the networked applications licensing loopholes that would allow some to make interesting modifications without ever giving back.

If that is really an issue and you have money then please make an offer. I may change to the Apache Software License version 2.0 for everybody if you have convincing arguments.

**Did you choose the AGPL to avoid people making money out this project?**

No, and you can make money as long as you respect the terms of the AGPL. Again, make me a convincing offer and I'll get rid of it.

**Will you accept my patch / pull request?**

As long as it makes sense to me both technically and functionally then yes of course.
