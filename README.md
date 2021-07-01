Rover Loki 2

run npm install

run sudo npm start to start the rover.

navigate to {raspberryIP}/control for control interface.

Options to set in control interface can be:
- turning speed
- driving speed
- wanted magnetic field strength => rover should stop when magnetic field strength exceeds this value
- ticks for forward, left and right turning => a tick is defined as 100ms. so 50 ticks forward should let the rover drive forward for 5 seconds. => used when mode is switched
- mode => default: 0, traverse: 1 => on button click mode switches. ticks are needed for traverse mode.

Controls:
- start => start the rover
- stop => stop the rover
- shutdown => shutdown rover

In server.js there is a data object which defines some settings. defaults can be changed there or via control interface.


---------

Calibration. (optional)

For calibrating the magnetometer run /sensors/Calibrate.js and rotate magnetometer around all axis.
The results have to be posted in server.js magnetometerOptions
