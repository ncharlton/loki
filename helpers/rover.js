import pigpio, { Gpio } from 'pigpio';
const STOP_SPEED = 0;

class Rover {
    constructor(turningSpeed, drivingSpeed) {
        this.drivingSpeed = 0;
        pigpio.terminate();
        this.leftForward = new Gpio(26, { mode: Gpio.OUTPUT });
        this.leftBackward = new Gpio(13, { mode: Gpio.OUTPUT });
        this.rightForward = new Gpio(27, { mode: Gpio.OUTPUT });
        this.rightBackward = new Gpio(17, { mode: Gpio.OUTPUT });
        this.currentThrottle = 0;
        this.currentDirection = null;

        this.setSpeeds(turningSpeed, drivingSpeed)
    }

    setSpeeds(turningSpeed, drivingSpeed) {
        this.turningSpeed = turningSpeed;
        this.drivingSpeed = drivingSpeed;
    }

    turnLeft() {
        console.log("turning left");
        // left stop
        this.leftForward.pwmWrite(0);
        this.leftBackward.pwmWrite(0);

        // right go
        this.rightForward.pwmWrite(this.turningSpeed);
        this.rightBackward.pwmWrite(0);

        this.currentThrottle = this.drivingSpeed;
        this.currentDirection = 'left';
    }

    turnRight() {
        // left go
        this.leftForward.pwmWrite(this.turningSpeed);
        this.leftBackward.pwmWrite(STOP_SPEED);

        // right stop
        this.rightForward.pwmWrite(STOP_SPEED);
        this.rightBackward.pwmWrite(STOP_SPEED);

        this.currentThrottle = this.drivingSpeed;
        this.currentDirection = 'right';
    }

    forwards() {
        // start both
        this.leftForward.pwmWrite(this.drivingSpeed);
        this.leftBackward.pwmWrite(STOP_SPEED);
        this.rightForward.pwmWrite(this.drivingSpeed);
        this.rightBackward.pwmWrite(STOP_SPEED);

        this.currentThrottle = this.drivingSpeed;
        this.currentDirection = 'forwards';
    }

    backwards() {
        // // start both backwards
        // //this.leftForward.pwmWrite(STOP_SPEED);
        // //this.leftBackward.pwmWrite(this.drivingSpeed);
        // this.rightForward.pwmWrite(0);
        // this.rightBackward.pwmWrite(250);
        //
        // this.currentThrottle = this.drivingSpeed;
        // this.currentDirection = 'backwards';
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
            direction: this.currentDirection,
            drivingSpeed: this.drivingSpeed,
            turningSpeed: this.turningSpeed
        }
    }
}

export default Rover;
