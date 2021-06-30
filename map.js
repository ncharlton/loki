const express = require('express');
const {TwingEnvironment, TwingLoaderFilesystem} = require('twing');
let loader = new TwingLoaderFilesystem('./views');
let twing = new TwingEnvironment(loader);
const fs = require('fs');

const app = express();


app.get('/', function (req, res) {
    let coordinates = [];

    if (fs.existsSync('coordinates.json')) {
        let rawdata = fs.readFileSync('coordinates.json');
        coordinates = JSON.parse(rawdata);

    } else {
        console.log(".json doesnt exist");
    }

    console.log("Markers", coordinates.markers);

    twing.render('map.twig', {'coordinates': coordinates.markers, 'name': 'test'}).then((output) => {
        res.end(output);
    });
});

app.listen(3000, () => console.log('Example app is listening on port 3000.'));
