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

var assert = require('assert');
var configuration = require('../configuration.js');

// .............................................................................................. //

assert.deepEqual( configuration.products(), ['izpack'] );
assert.deepEqual( configuration.versionsFor('izpack'), ['4.3.4', '5.0.0-beta7'] );

assert.ok( configuration.isRegistered('izpack', '4.3.4') );
assert.ok( !configuration.isRegistered('izpack', '7.0.0') );

assert.equal( configuration.urlFor('izpack', '4.3.4'), 'http://dist.codehaus.org/izpack/releases/4.3.4/IzPack-install-4.3.4.jar' );

// .............................................................................................. //