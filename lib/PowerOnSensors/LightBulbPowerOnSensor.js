'use strict';

/**
 * LightBulbPowerOnSensor.
 */
class LightBulbPowerOnSensor {
  constructor(HBService, HBCharacteristic, client, light, accessory) {
    this.Service = HBService;
    this.Characteristic = HBCharacteristic;
    this.client = client;

    this.accessory = accessory;
    this.cachedLight = light;
    this.lastUpdated = new Date();

    this._updateAccessoryInformation();
    this._addServices();
    this.updateCharacteristics();
    this._addEventListeners();
  }

  get light() {
    return new Promise(resolve => {
      if (new Date() - this.lastUpdated > 1000) {
        this.client.lights.getById(this.cachedLight.id)
          .then(light => {
            this.cachedLight = light;
            this.lastUpdated = new Date();

            resolve(light);
          })
          .catch(() => {
            resolve(this.cachedLight);
          })
        ;
      } else {
        resolve(this.cachedLight);
      }
    });
  }

  get uniqueId() {
    return this.cachedSensor.uniqueId;
  }

  _addServices() {
    try {
      this.accessory.addService(this.Service.ContactSensor, this.cachedLight.name + " Power Sensor");
    } catch (err) {
      // Service already added.
    }
  }

  _updateAccessoryInformation() {
    this.accessory
      .getService(this.Service.AccessoryInformation)
      .updateCharacteristic(this.Characteristic.Manufacturer, this.cachedLight.manufacturer)
      .updateCharacteristic(this.Characteristic.Model, this.cachedLight.modelId)
    ;

    if (this.cachedLight.uniqueId) {
      this.accessory
        .getService(this.Service.AccessoryInformation)
        .updateCharacteristic(this.Characteristic.SerialNumber, this.cachedLight.uniqueId)
      ;
    }

    if (this.cachedLight.softwareVersion) {
      this.accessory
        .getService(this.Service.AccessoryInformation)
        .updateCharacteristic(this.Characteristic.FirmwareRevision, this.cachedLight.softwareVersion)
      ;
    }
  }

  _addEventListeners() {
    this.accessory
      .getService(this.Service.ContactSensor)
      .getCharacteristic(this.Characteristic.ContactSensorState)
      .on('get', callback => {
        this.light.then(light => {
          callback(null, this._lightOnAndReachable(light));
        });
      });
  }

  _lightOnAndReachable(light) {
    return light.on && light.reachable;
  }

  updateCharacteristics() {
    // this.accessory
    //   .getService(this.Service.ContactSensor)
    //   .updateCharacteristic(this.Characteristic.ContactSensorState, this.cachedSensor.on)
    // // ;
    // console.log(this.accessory
    //   .getService(this.Service.ContactSensor));
    this.light.then(light => {
      this.accessory
          .getService(this.Service.ContactSensor).setCharacteristic(this.Characteristic.ContactSensorState, this._lightOnAndReachable(light));
      console.log(`Sensor state ` + this._lightOnAndReachable(light));
    });
  }
}

module.exports = LightBulbPowerOnSensor;
