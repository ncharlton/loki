const SerialPort = require("serialport");
const Readline = require("@serialport/parser-readline")
const nmea = require("nmea-simple");
const fs = require("fs");

const port = new SerialPort(
    '/dev/serial0',
    {
        baudRate: 9600
    }
);

const coordinates = {
    markers: [],
};

const parser = port.pipe(new Readline({ delimiter: '\r\n' }))
console.log('Port running...')

parser.on("data", line => {
    try {
        const packet = nmea.parseNmeaSentence(line);
        if (packet.sentenceId === "RMC" && packet.status === "valid") {
            console.log("Got location via RMC packet:", packet.latitude, packet.longitude);
        }
        if (packet.sentenceId === "GGA" && packet.fixType !== "none") {
            console.log("Got location via GGA packet:", packet.latitude, packet.longitude);

            console.log(packet.latitude);

            coordinates.markers.push(
                {
                    lat : packet.latitude,
                    lng : packet.longitude
                }
            )

            parser.destroy();

            fs.truncate('coordinates.json', 0, function(err) {});

            fs.appendFile('coordinates.json', JSON.stringify(coordinates), function (err) {
                if (err) {
                    console.log(err);
                } else {
                    // done
                }
            })

            //fs.writeFile('coordinates.json', JSON.stringify(coordinates), 'utf8');
        }

        if (packet.sentenceId === "APB" && packet.status === "valid") {
            console.log("Got location via APB packet:", packet.bearingLatitude, packet.bearingLongitude);
        }
        if (packet.sentenceId === "GSA") {
            console.log("There are " + packet.satellites.length + " satellites in view.");
        }
    } catch (error) {
        parser.destroy();
        console.error("Got bad packet:", line, error);
    }
});

parser.on('close', err => {
    console.log("Stream has been closed", coordinates);
})
