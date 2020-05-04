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
    this._updateCharacteristics(this);
    this._addEventListeners();
    this._enableStateUpdates();
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

  _enableStateUpdates() {
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

module.exports = LightBulbPowerOnSensor;
