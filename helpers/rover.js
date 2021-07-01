import pigpio, { Gpio } from 'pigpio';
const DRIVING_SPEED = 170;
const TURNING_SPEED = 200;
const STOP_SPEED = 0;

class Rover {
    constructor() {
        this.drivingSpeed = 0;
        pigpio.terminate();
        this.leftForward = new Gpio(26, { mode: Gpio.OUTPUT });
        this.leftBackward = new Gpio(13, { mode: Gpio.OUTPUT });
        this.rightForward = new Gpio(27, { mode: Gpio.OUTPUT });
        this.rightBackward = new Gpio(17, { mode: Gpio.OUTPUT });
        this.currentThrottle = 0;
        this.currentDirection = null;
    }

    turnLeft() {
        console.log("turning left");
        // left stop
        this.leftForward.pwmWrite(0);
        this.leftBackward.pwmWrite(0);

        // right go
        this.rightForward.pwmWrite(TURNING_SPEED);
        this.rightBackward.pwmWrite(0);

        this.currentThrottle = DRIVING_SPEED;
        this.currentDirection = 'left';
    }

    turnRight() {
        // left go
        this.leftForward.pwmWrite(TURNING_SPEED);
        this.leftBackward.pwmWrite(STOP_SPEED);

        // right stop
        this.rightForward.pwmWrite(STOP_SPEED);
        this.rightBackward.pwmWrite(STOP_SPEED);

        this.currentThrottle = DRIVING_SPEED;
        this.currentDirection = 'right';
    }

    forwards() {
        // start both
        this.leftForward.pwmWrite(DRIVING_SPEED);
        this.leftBackward.pwmWrite(STOP_SPEED);
        this.rightForward.pwmWrite(DRIVING_SPEED);
        this.rightBackward.pwmWrite(STOP_SPEED);

        this.currentThrottle = DRIVING_SPEED;
        this.currentDirection = 'forwards';
    }

    backwards() {
        // start both backwards
        //this.leftForward.pwmWrite(STOP_SPEED);
        //this.leftBackward.pwmWrite(DRIVING_SPEED);
        this.rightForward.pwmWrite(0);
        this.rightBackward.pwmWrite(250);

        this.currentThrottle = DRIVING_SPEED;
        this.currentDirection = 'backwards';
    }

    stop() {
        // stop both
        this.leftForward.pwmWrite(STOP_SPEED);
        this.leftBackward.pwmWrite(STOP_SPEED);
        this.rightForward.pwmWrite(STOP_SPEED);
        this.rightBackward.pwmWrite(STOP_SPEED);

        this.currentThrottle = STOP_SPEED;
        this.currentDirection = 'stop';
    }

    getControl() {
        return {
            throttle: this.currentThrottle,
            direction: this.currentDirection
        }
    }
}

export default Rover;
