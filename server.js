import express from 'express';
import Compass from './sensors/compass.js';
import GPS from './sensors/gps.js';
import RoverSkeleton from './helpers/rover.js';
import Navigator from './helpers/navigator.js';
import Sensor from './sensors/sensor.js';
import TraversableNet from './helpers/traversableNet.js';
import i2c from 'i2c-bus';

const app = express();

// dataset
// mode:
// 0 = straight travel looking for magnet;
// 1 = traversing travel looking for magnet
const data = {
    locations: {
        source: null,
        current: null,
        target: null
    },
    heading: 0,
    magneticValues: null,
    magneticFieldStrength: 0,
    drivingSpeed: 0,
    turningSpeed: 0,
    rover: null,
    obstacle: null,
    mode: 0
}

/*
* Run Calibrate.js and insert calibrations
 */
const magnetometerOptions = {
    i2c: i2c,

    /*
     * The sample rate (Hz), must be one of '0.75', '1.5', '3', '7.5',
     * '15', '30', or '75'.  Default is '15' Hz (samples per second).
     */
    sampleRate: '15', /* default */

    /*
     * The declination, in degrees.  If this is provided the result
     * will be true north, as opposed to magnetic north. See the
     * following link: https://www.npmjs.com/package/geomagnetism
     */
    declination: 4.48156,

    /*
     * The scale range to use.  See pp13 of the technical documentation.
     * Different expected magnetic intensities  require different scales.
     */
    scale: '0.88', /* default */
    calibration: {
        offset: { x: 58.035, y: 222.285, z: -34.675000000000004 },
        scale: { x: 1.181444991789819, y: 0.9657718120805369, z: 8.464705882352938 }
    }
}

// initialize helpers
var rover = new RoverSkeleton();
var compass = new Compass(1);
var gpsTracker = new GPS();
const navigator = new Navigator();
const sensor = new Sensor(navigator);

// start search for gps singal
gpsTracker.read();

/**
 * Loop
 * @returns {Promise<void>}
 */
async function go() {
    console.log("Execution starts in 5 seconds ...")
    await sleep(5000);
    console.log ("Execution started");

    var drive = false;
    var i = 0;

    while (true) {
        // magnetic field strength
        compass.getRawValues(function (err, vals) {
            data.magneticValues = vals;
            data.magneticFieldStrength = Math.sqrt(vals.x * vals.x + vals.y * vals.y + vals.z * vals.z);
        });

        // heading
        compass.getHeadingDegrees('x', 'y', function (err, heading) {
            data.heading = heading - 90;
        });


        // if gps signal has been received
        if (gpsTracker.signalReceived(true)) {
            // set source location
            if (data.locations.source == null) {
                data.locations.source = gpsTracker.getCoordinates();
            }

            // udpate current location
            data.locations.current = gpsTracker.getCoordinates();

            // update current location
            navigator.updateCurrentLocation(gpsTracker.getLat(), gpsTracker.getLng());

            // start mesaurements
            sensor.measure(data.heading, Date.now());

            // go signal for rover
            drive = true;

        } else {
            console.log("Waiting for GPS signal ...");
        }


        /**
         * Straight line mode
         */
        if (data.mode === 0) {
            if (data.magneticFieldStength > 800) {
                drive = false;
                data.obstacle = gpsTracker.getCoordinates();
                console.log("STOP");
            }

            if (drive) {
                //rover.stop();
            } else {
                //rover.stop();
            }
        }

        /**
         * Traverse mode
         */
        if (data.mode === 1) {
            var net = new TraversableNet(navigator, data.locations.source, 1, 1, 0.1, 10);
        }

        // Update control values for api
        data.rover = rover.getControl();

        // emergency stop
        i++;
        if (i > 100) {
            rover.stop();
        }

        await sleep(1000);
    }
}

async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

go();



/**
 * API
 */
app.get('/', function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
});

app.listen(3000, () => console.log('Example app is listening on port 3000.'));
