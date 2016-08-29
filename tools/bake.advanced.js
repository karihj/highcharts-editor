/******************************************************************************

Copyright (c) 2016, Highsoft

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

******************************************************************************/

/* Take a fresh API dump and bake it into the sources */

var apiDumpURL = 'http://api.highcharts.com/highcharts/option/dump.json',
    request = require('request'),
    fs = require('fs'), 
    license = fs.readFileSync(__dirname + '/../LICENSE')
;

require('colors');

console.log('Higcharts Advanced Options Updater'.green);
console.log('Fetching latest API dump...'.bold);

function setAttr (obj, path, value) {
    var current = obj,
        res = false
    ;

    if (highed.isArr(obj)) {
        obj.forEach(function (thing) {
            highed.setAttr(thing, path, value);
        });
        return;
    }

    path.forEach(function(p, i) {
        if (i === path.length - 1) {    
            current[p] = value;
            res = current[p];                 
        } else {
            if (typeof current[p] === 'undefined') {
                current = current[p] = {};
            } else {
                current = current[p];                       
            }
        }
    });

    return res;
}

function writeMeta(data) {
    var body = [
        '/*',
        license,
        '*/',
        'highed.meta.optionsAdvanced = ',
        data,
        ';'
    ].join('\n');

   fs.writeFile(__dirname + '/../src/meta/highed.meta.options.advanced.js', body, function (err) {
        return err && console.log('[error]'.red, err); 
   });
}

function process(data) {
    var tree = {
        children: {},
        entries: []
    };

    try {
        data = JSON.parse(data);
    } catch(e) {
        console.log('[error]'.red, e);
        return false;
    }

    data.forEach(function (entry) {
        var parent = entry.parent || 'global',
            current = tree,
            path,
            nitm
        ;

        path = parent.replace(/\-\-/g, '.').replace(/\-/g, '.').split('.');

        path.forEach(function(p, i) {
            if (i === path.length - 1) {                  

                current.children[p] = current.children[p] || {
                    entries: [],
                    children: []
                };

                current.children[p].entries.push({
                    id: entry.name,
                    shortName: entry.name.substr(entry.name.lastIndexOf('-') + 1),
                    dataType: (entry.returnType || '').toLowerCase(),
                    description: entry.description
                });

            } else {
                if (typeof current.children[p] === 'undefined') {

                    current.children[p] = {
                        entries: [],
                        children: {}
                    };

                    current = current.children[p];
                } else {
                    current = current.children[p];                       
                }
            }
        });

    });

    return JSON.stringify(tree, undefined, 2);
}

request(apiDumpURL, function (error, response, body) {
    console.log('API Fetched, transforming...'.bold);
    if (error) {
        console.log('[error]'.red, error);
    } else {
       writeMeta(process(body));
    }
});