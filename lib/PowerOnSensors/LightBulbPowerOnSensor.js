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
    try {
      this.accessory.addService(this.Service.ContactSensor, this.light.name + " Power Sensor");
    } catch (err) {
      // Service already added.
    }

    this.id = light.id;
    this.uniqueId = light.uniqueId;
    this._updateLightState(light);

    this._updateAccessoryInformation(light);
    this._addEventListeners();
  }

  // get light() {
  //   return new Promise(resolve => {
  //     if (new Date() - this.lastUpdated > 1000) {
  //       this.client.lights.getById(this.cachedLight.id)
  //         .then(light => {
  //           this.cachedLight = light;
  //           this.lastUpdated = new Date();

  //           resolve(light);
  //         })
  //         .catch(() => {
  //           resolve(this.cachedLight);
  //         })
  //       ;
  //     } else {
  //       resolve(this.cachedLight);
  //     }
  //   });
  // }

  _updateAccessoryInformation(light) {
    this.accessory
      .getService(this.Service.AccessoryInformation)
      .updateCharacteristic(this.Characteristic.Manufacturer, light.manufacturer)
      .updateCharacteristic(this.Characteristic.Model, light.modelId)
    ;

    if (light.uniqueId) {
      this.accessory
        .getService(this.Service.AccessoryInformation)
        .updateCharacteristic(this.Characteristic.SerialNumber, light.uniqueId)
      ;
    }

    if (light.softwareVersion) {
      this.accessory
        .getService(this.Service.AccessoryInformation)
        .updateCharacteristic(this.Characteristic.FirmwareRevision, light.softwareVersion)
      ;
    }
  }

  _addEventListeners(light) {
    this.accessory
      .getService(this.Service.ContactSensor)
      .getCharacteristic(this.Characteristic.ContactSensorState)
      .on('get', callback => {
          callback(null, this._state);
      });
  }

  _updateLightState(light) {
    this._state = light.on && light.reachable;
  }

  updateCharacteristics(light) {
    this._updateLightState(light);
    this.accessory
        .getService(this.Service.ContactSensor).setCharacteristic(this.Characteristic.ContactSensorState, this._state);
    console.log(`Sensor state ` + this._state);
  }
}

module.exports = LightBulbPowerOnSensor;
