'use strict';

const AbstractSensor = require('../AbstractSensor');

/**
 * Generic Sensor.
 */
class Unknown extends AbstractSensor {
  get services() {
    return [
      this.Service.ContactSensor
    ];
  }

  updateCharacteristics() {
    this._updateCharacteristics(this);
  }

  addEventListeners() {
    this.accessory
      .getService(this.Service.ContactSensor)
      .getCharacteristic(this.Characteristic.ContactSensorState)
      .on('get', callback => {
        this.light.then(light => {
          callback(null, this._lightOnAndReachable(light));
        });
      });
  }

  enableStateUpdates() {
    console.log("Enabling updates");
    setInterval(this._updateCharacteristics, 10000, this);
  }

  _lightOnAndReachable(light) {
    return light.on && light.reachable;
  }

  _updateCharacteristics(self) {
    // this.accessory
    //   .getService(this.Service.ContactSensor)
    //   .updateCharacteristic(this.Characteristic.ContactSensorState, this.cachedSensor.on)
    // // ;
    // console.log(this.accessory
    //   .getService(this.Service.ContactSensor));
    self.light.then(light => {
      self.accessory
          .getService(self.Service.ContactSensor).setCharacteristic(self.Characteristic.ContactSensorState, self._lightOnAndReachable(light));
      console.log(`Sensor state ` + self._lightOnAndReachable(light));
    });
  }
}

module.exports = Unknown;
