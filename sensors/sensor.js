import BaseQueue from '../helpers/baseQueue.js';

/**
 * Sensor class - from software part
 * Basic functionalities for calculating driving, turning speed and distance calculation
 * Uses a buffer to reduce fluxuating values
 */
class Sensor {
    headingBuffer = new BaseQueue();
    clockBuffer = new BaseQueue();
    drivingSpeed = 0;
    turningSpeed = 0;
    previousTargetDistance = 0;
    targetDistance = 0;
    time = 0;
    clock = 0;
    heading = 0;
    previousHeading = 0;
    headingChange = 0;
    navigator;
    isDriving = false;
    isTurning = false;
    bufferSize = 50;

    constructor(
        navigator,
    ) {
        this.navigator = navigator;
    }

    /**
     * Set buffer size
     *
     * @param size
     */
    setBufferSize(size) {
        this.bufferSize = size;
    }

    /**
     * Calculate measurements
     *
     * @param heading
     * @param clock
     */
    measure(heading, clock) {
        this.updateDistance();
        this.updateTime(clock);

        // calculate speeds
        this.drivingSpeed = this.calculateSpeed(this.navigator.previousLocation.distanceTo(this.navigator.currentLocation), this.time);
        this.turningSpeed = this.calculateSpeed(this.headingChange, this.time);

        // is driving or turning
        this.isDriving = false;
        this.isTurning = false;

        if (this.drivingSpeed > 0.01) {
            this.isDriving = true;
        }
        if (this.turningSpeed > 0.01) {
            this.isTurning = true;
        }

        this.updateHeading(heading);
    }

    /**
     * Update heading
     *
     * @param heading
     */
    updateHeading(heading) {
        this.previousHeading = this.heading;

        this.headingBuffer.enqueue(heading);

        if (this.headingBuffer.size() === this.bufferSize) {
            this.headingBuffer.dequeue();

            let headingTotal = 0;
            this.headingBuffer.queue().forEach((element) => {
                headingTotal += element;
            })

            let headingMean = this.navigator.meanAngle(this.headingBuffer.queue());
            this.headingBuffer.enqueue(headingMean);
            this.headingBuffer.dequeue();
            this.heading = headingMean;
            this.headingChange = Math.abs(this.headingBuffer.queue()[0] - this.headingBuffer.queue()[48]);
        } else {
            this.heading = heading;
        }
    }

    /**
     * Update distance from current location to next target
     */
    updateDistance() {
        this.previousTargetDistance = this.targetDistance;
        this.targetDistance = this.navigator.currentLocation.distanceTo(this.navigator.targetLocation);
    }

    /**
     * Update clock for measurement speed calculations
     * @param clock
     */
    updateTime(clock) {
        this.clockBuffer.enqueue(clock);

        if (this.clockBuffer.size() === this.bufferSize) {
            this.clockBuffer.dequeue();

            let clockStart = this.clockBuffer.queue()[0];
            let clockEnd = this.clockBuffer.queue()[48];

            this.time = (clockEnd - clockStart) / 1000;
        } else {
            this.time = (clock - this.clock) / 1000;
        }
    }

    /**
     * Calculate driving speed
     *
     * @param distance
     * @param time
     * @returns {number}
     */
    calculateSpeed(distance, time) {
        return distance / time;
    }

    /**
     * Helper function for logging mesaurements
     */
    log () {
        console.log("Heading:", this.heading);
        console.log("Driving Speed:", this.drivingSpeed);
        console.log("Turning Speed:", this.turningSpeed);
        console.log("Distance to target:", this.targetDistance);
    }
}

export default Sensor;
