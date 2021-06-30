import { Gpio } from 'pigpio';

const RTForward = new Gpio(26, { mode: Gpio.OUTPUT });
const RTBackward = new Gpio(13, { mode: Gpio.OUTPUT });

const LTForward = new Gpio(17, { mode: Gpio.OUTPUT });
const LTBackward = new Gpio(27, { mode: Gpio.OUTPUT });

RTForward.digitalWrite(0);
RTBackward.digitalWrite(0);

LTForward.digitalWrite(0);
LTBackward.digitalWrite(0);

async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

