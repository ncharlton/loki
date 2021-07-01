import SerialPort from 'serialport';
import Readline from '@serialport/parser-readline';
import nmea from 'nmea-simple';

/**
 * Gps class
 * Reads GPS values from GPS sensor
 */
class Gps {
    constructor() {
        this.lat = 0;
        this.lng = 0;
        this.port = null;
        this.parser = null;
        this.init();
        this.read();
    }

    /**
     * Opens connection to serial port
     */
    init () {
        this.port = new SerialPort(
            '/dev/serial0',
            {
                baudRate: 9600
            }
        );

        this.parser = this.port.pipe(new Readline({ delimiter: '\r\n' }))
    }

    /**
     * Reads package data from stream
     */
    read() {
        this.parser.on("data", line => {
            try {
                const packet = nmea.parseNmeaSentence(line);

                if (packet.sentenceId === "GGA" && packet.fixType !== "none") {
                    this.lat = packet.latitude;
                    this.lng = packet.longitude;
                }
            } catch (error) {}
        });
    }

    close() {
        this.parser.destroy();
    }

    /**
     * Returns latitude
     *
     * @returns {number}
     */
    getLat () {
        return this.lat;
    }

    /**
     * Returns longitude
     *
     * @returns {number}
     */
    getLng() {
        return this.lng;
    }

    /**
     * Returns longitude and latitude as object
     *
     * @returns {{lng: number, lat: number}}
     */
    getCoordinates() {
        return {
            lat: this.lat,
            lng: this.lng
        }
    }

    /**
     * Return boolean if signal has been received
     * pass true to the function to bypass waiting for a signal
     *
     * @returns {boolean}
     */
    signalReceived(bypass = false) {
        if (bypass) {
            return true;
        }

        return (this.lat !== 0 && this.lng !== 0);
    }
}

export default Gps;
