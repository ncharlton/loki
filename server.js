import express from 'express';
import Compass from './sensors/compass.js';
import GPS from './sensors/gps.js';
import RoverSkeleton from './helpers/rover.js';
import Navigator from './helpers/navigator.js';
import Sensor from './sensors/sensor.js';
import i2c from 'i2c-bus';
import { exec } from 'child_process';
import {TwingEnvironment, TwingLoaderFilesystem} from 'twing';
import pigpio from 'pigpio';

let loader = new TwingLoaderFilesystem('./views');
let twing = new TwingEnvironment(loader);

const app = express();


// dataset
// mode:
// 0 = straight travel looking for magnet;
// 1 = traversing travel looking for magnet
const data = {
    locations: {
        source: {
            lat: 0,
            lng: 0
        },
        current: {
            lat: 0,
            lng: 0
        },
        target: {
            lat: 0,
            lng: 0
        }
    },
    heading: 0,
    magneticValues: {
        x: 0,
        y: 0,
        z: 0
    },
    speed: {
        turning: 170,
        driving: 200
    },
    magneticFieldStrength: 0,
    wantedMagneticFieldStrength: 800,
    drivingSpeed: 0,
    turningSpeed: 0,
    rover: null,
    obstacle: null,
    mode: 0,
    drive: false,
    ticks: {
        forward: 30,
        left: 10,
        right: 10
    }
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
    scale: '4.0', /* default */
    // calibration: {
    //     offset: { x: 58.035, y: 222.285, z: -34.675000000000004 },
    //     scale: { x: 1.181444991789819, y: 0.9657718120805369, z: 8.464705882352938 }
    // }
}

function killGpios() {
    exec('sudo rm /var/run/pigpio.pid', (err, stdout, stderr) => {
        if (err) {
            //some err occurred
            console.error(err)
        } else {
            // the *entire* stdout and stderr (buffered)
            console.log(`stdout: ${stdout}`);
            console.log(`stderr: ${stderr}`);
        }
    });
}

//killGpios();

// initialize helpers
var rover = new RoverSkeleton(data.turningSpeed, data.drivingSpeed);
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
    await sleep(5000);

    var i = 0;
    var direction = 'forward';
    var lastTurningDirection = 'right';

    while (true) {
        // update speed values
        rover.setSpeeds(data.speed.turning, data.speed.driving);

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

            // update current location
            data.locations.current = gpsTracker.getCoordinates();

            // update current location in navigator
            //navigator.updateCurrentLocation(gpsTracker.getLat(), gpsTracker.getLng());

            // start measurements
            //sensor.measure(data.heading, Date.now());

        } else {
            console.log("Waiting for GPS signal ...");
        }

        // check for magnet
        if (data.magneticFieldStrength > data.wantedMagneticFieldStrength) {
            data.obstacle = gpsTracker.getCoordinates();
            data.drive = false;
        }

        /**
         * Straight line mode
         */
        if (data.mode === 0 && data.drive) {
            // adjust value for rover to sop
            rover.forwards();
        }

        /**
         * Traverse mode
         */
        if (data.mode === 1 && data.drive) {
            if (direction === 'forward') {
                if (i < data.ticks.forward) {
                    rover.forwards();
                } else {
                    i = 0;

                    if (lastTurningDirection === 'right') {
                        direction = 'left';
                    } else {
                        direction = 'right';
                    }
                }
            }

            if (direction === 'left') {
                if (i < data.ticks.left) {
                    rover.turnLeft();
                } else {
                    i = 0;
                    direction = 'forward';
                    lastTurningDirection = 'left';
                }
            }

            if (direction === 'right') {
                if (i < data.ticks.right) {
                    rover.turnRight();
                } else {
                    i = 0;
                    direction = 'forward';
                    lastTurningDirection = 'right';
                }
            }

            console.log(direction);
            console.log(i);

            i++;
        }

        if (!data.drive) {
            rover.stop();
        }

        // Update control values for api
        data.rover = rover.getControl();


        await sleep(100);
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

app.get('/mode', function(req, res) {
    console.log("Switch rover mode ...");

    if (data.mode === 0) {
        data.mode = 1;
    } else {
        data.mode = 0;
    }

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({message: 'Mode switched ...', mode: data.mode}));
})

/**
 * Emergency stop function
 */
app.get('/stop', function(req, res) {
    console.log("Rover stopped ...");
    // stop signal
    data.drive = false;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({message: 'Rover stopped ...'}));
})

app.get('/shutdown', function(req, res) {
    rover.stop();
    gpsTracker.close();

    try {
        pigpio.terminate();
    } catch (error) {}

    server.close(() => {
        console.log('Closed out remaining connections');
        process.exit(0);
    });

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({message: 'Rover shutdown ...'}));
})

app.get('/magnet/:strength', function(req, res) {
    data.wantedMagneticFieldStrength = parseInt(req.params.strength, 10);

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({message: 'Wanted magnetic field strength set ...', strength: data.wantedMagneticFieldStrength}));
})

app.get('/ticks/:forward/:left/:right', function(req, res) {
    data.ticks.forward = parseInt(req.params.forward, 10);
    data.ticks.left = parseInt(req.params.left, 10);
    data.ticks.right = parseInt(req.params.right, 10);

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({message: 'Ticks set'}));
})

app.get('/speeds/:turning/:driving', function(req, res) {
    data.speed.turning = parseInt(req.params.turning, 10);
    data.speed.driving = parseInt(req.params.driving, 10);

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({message: 'Speeds set ...'}));
})

/**
 * Emergency stop function
 */
app.get('/start', function(req, res) {
    console.log("Rover started ...");
    // start signal
    data.drive = true;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({message: 'Rover started ...'}));
})

app.get('/control', function (req, res) {
    twing.render('control.twig', {}).then((output) => {
        res.end(output);
    });
})

const server = app.listen(3000, () => console.log('Example app is listening on port 3000.'));
