import LatLon from 'geodesy/latlon-spherical.js';
import BaseQueue from './baseQueue.js';

/**
 * Navigator class - from software part
 * Functions as a navigation system with current location and a queue containing next targets
 * Uses a buffer to reduce fluxuating values
 */
class Navigator {
    destinations = new BaseQueue;
    locations = new BaseQueue;
    currentLocation = new LatLon(0, 0);
    sourceLocation = new LatLon(0, 0);
    previousLocation = new LatLon(0, 0);
    targetLocation = new LatLon(0, 0);
    rerouteLocation = new LatLon(0, 0);
    priorRerouteTarget = new LatLon(0, 0);
    atOrigin = true;
    atSource = false;
    atTarget = false;
    atFinalDestination = false;
    bufferSize = 50;

    constructor() {}

    /**
     * Set buffer size
     *
     * @param size
     */
    setBufferSize(size) {
        this.bufferSize = size;
    }

    /**
     * Add destinations to target queue
     *
     * @param destinations
     */
    addDestinations(destinations) {
        destinations.forEach(destination => {
            this.destinations.enqueue(new LatLon(destination.latitude, destination.longitude));
        })
    }

    /**
     * Switch target to next destination
     *
     * @param overwrite
     */
    nextDestination(overwrite) {
        console.log("NEXT");
        let destination = this.destinations.dequeue();

        if (destination === undefined) {
            destination = this.currentLocation;
            this.atTarget = true;
            this.atFinalDestination = true;
        }

        if (overwrite) {
            this.sourceLocation = this.targetLocation;
        }

        this.targetLocation = destination;
    }

    /**
     * Updates current location
     *
     * @param latitude
     * @param longitude
     */
    updateCurrentLocation(latitude, longitude) {
        this.previousLocation = this.currentLocation;
        const location = new LatLon(latitude, longitude)

        this.locations.enqueue(location);

        if (this.locations.size() == 50) {
            this.locations.dequeue();

            let latTotal = 0;
            let lonTotal = 0;

            this.locations.queue().forEach((element) => {
                latTotal += element.latitude;
                lonTotal += element.longitude;
            })

            this.currentLocation = new LatLon(latTotal / this.locations.size(), lonTotal / this.locations.size());
            this.locations.enqueue(this.currentLocation);
            this.locations.dequeue();
        } else {
            this.currentLocation = location;
        }
    }

    /**
     * Sets starting locations
     *
     * @param latitude
     * @param longitude
     */
    setSourceLocation(latitude, longitude) {
        this.sourceLocation = new LatLon(latitude, longitude);
    }

    /**
     * Calculates the angle between currentLocation and targetLocation via formula
     *
     * @param sourceLocation
     * @param targetLocation
     * @returns {number}
     */
    ang(sourceLocation, targetLocation) {
        const y = targetLocation.latitude - sourceLocation.latitude;
        const x = Math.cos(Math.PI / 180 * sourceLocation.latitude) * (targetLocation.longitude - sourceLocation.longitude);
        return Math.atan2(y, x) * (180 / Math.PI);
    }

    /**
     * Calculates the angle between currentLocation and targetLocation via libary helper function
     *
     * @param sourceLocation
     * @param targetLocation
     * @returns {*}
     */
    angle(sourceLocation, targetLocation) {
        return sourceLocation.initialBearingTo(targetLocation);
    }

    /**
     * Calculates the mean angle from an array of angles
     *
     * @param angles
     * @returns {number}
     */
    meanAngle(angles) {
        let mean = 180 / Math.PI * Math.atan2(
            this.sum(angles.map(this.degToRad).map(Math.sin)) / angles.length,
            this.sum(angles.map(this.degToRad).map(Math.cos)) / angles.length,
        )

        if (mean < 0) {
            mean += 360;
        }

        return mean;
    }

    /**
     * Sum helper function
     *
     * @param items
     * @returns {number}
     */
    sum (items) {
        let sum = 0;
        items.forEach((num) => {
            sum += num;
        })

        return sum;
    }

    /**
     * Converts degrees to radius
     *
     * @param a
     * @returns {number}
     */
    degToRad(a) {
        return Math.PI / 180 * a;
    }

    /**
     * Calculates the difference between two angles
     *
     * @param angle1
     * @param angle2
     * @returns {number}
     */
    angleDiff(angle1, angle2) {
        let diff = angle2 - angle1;
        diff -= diff > 180 ? 360 : 0;
        diff += diff < -180 ? 360 : 0;
        return diff;
    }
}

export default Navigator;
