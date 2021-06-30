import LatLon from 'geodesy/latlon-spherical.js';

/**
 * TraversableNet class
 * Creates a traversable net from souce location.
 */
class TraversableNet {
    sourceLocation = null;
    distanceHeightSpacing = null;
    distanceWidthSpacing = null;
    distanceBetween = null;
    repeat = null;
    navigator = null;

    constructor(navigator, location, height, width, distanceBetween, repeat = 10) {
        this.sourceLocation = location;
        this.distanceHeight = height;
        this.distanceWidth = width;
        this.distanceBetween = distanceBetween;
        this.navigator = navigator;
        this.repeat = repeat;
    }

    calculateTraversableNet() {
        const lowerDestination1 = new LatLon(this.sourceLocation.lat, this.sourceLocation.lng);
        const upperDestination1 = lowerDestination.destinationPoint(this.distanceHeightSpacing, 360);
        const lowerDestination2 = lowerDestination1.destinationPoint(this.distanceWidthSpacing, -90);
        const upperDestination2 = lowerDestination1.destinationPoint(this.distanceHeightSpacing, 360);

        const width = lowerDestination1.distanceTo(lowerDestination2);
        const itemCount = Math.floor(width / this.distanceBetween);

        const bearingLow = lowerDestination1.initialBearingTo(lowerDestination2);
        const bearingTop = upperDestination1.initialBearingTo(upperDestination2);

        const destinations = [];

        let odd = false;

        for (var i = 1; i < itemCount; i++) {
            const lower = lowerDestination1.destinationPoint(width * i, bearingLow);
            const upper = upperDestination1.destinationPoint(width * i, bearingTop);

            if (i === 1) {
                destinations.push({
                    latitude: lowerDestination1.latitude,
                    longitude: lowerDestination1.longitude,
                    label: 'L0'
                })

                destinations.push({
                    latitude: upperDestination1.latitude,
                    longitude: upperDestination1.longitude,
                    label: 'U0'
                })
            }

            if (odd) {
                destinations.push({
                    latitude: lower.latitude,
                    longitude: lower.longitude,
                    label: 'L' + i,
                })

                destinations.push({
                    latitude: upper.latitude,
                    longitude: upper.longitude,
                    label: 'U' + i,
                })

                odd = false;
            } else {
                destinations.push({
                    latitude: upper.latitude,
                    longitude: upper.longitude,
                    label: 'U' + i,
                })

                destinations.push({
                    latitude: lower.latitude,
                    longitude: lower.longitude,
                    label: 'L' + i,
                })

                odd = true;
            }

            if ((itemCount - i) === 1) {
                destinations.push({
                    latitude: upperDestination2.latitude,
                    longitude: upperDestination2.longitude,
                    label: 'UF'
                })

                destinations.push({
                    latitude: lowerDestination2.latitude,
                    longitude: lowerDestination2.longitude,
                    label: 'LF'
                })
            }
        }

        // add destinations to navigator
        this.navigator.addDestinations(destinations);
    }
}

export default TraversableNet;
