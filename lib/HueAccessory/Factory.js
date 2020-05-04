'use strict';

const HueError = require('../HueError');

let Accessory;
let Service;
let Characteristic;
let UUIDGen;

/**
 * Factory for Accessories.
 */
class Factory {
  /**
   * Constructor.
   */
  constructor(HBAccessory, HBService, HBCharacteristic, HBUUIDGen, log) {
    Accessory = HBAccessory;
    Service = HBService;
    Characteristic = HBCharacteristic;
    UUIDGen = HBUUIDGen;

    this.log = log;
  }

  createAccessory(hueClient, hueAccessory) {
    const uuid = UUIDGen.generate(hueAccessory.uniqueId);
    const accessory = new Accessory(hueAccessory.name, uuid);

    accessory.context.uniqueId = hueAccessory.uniqueId;
    accessory.context.cached = false;
    accessory.context.generic = false;

    this.linkHueAccessory(accessory, hueClient, hueAccessory);
    return accessory;
  }

  linkHueAccessory(accessory, hueClient, hueAccessory) {
    let Sensor = null;

    try {
      Sensor = require(`./Sensor/Type/${hueSensor.type}`);
    } catch (err) {
      Sensor = require(`./Sensor/Type/Generic`);
      accessory.context.generic = true;
    }

    const sensorAccessory = new Sensor(Service, Characteristic, hueClient, hueAccessory);
    accessory.accessory = sensorAccessory;
  }

  addSensorServicesToAccessory(accessory) {
    accessory.accessory.addServicesToAccessory(accessory);
    return accessory;
  }

  enableStateUpdates(accessory) {
    accessory.accessory.enableStateUpdates(accessory);
    return accessory;
  }
}

module.exports = Factory;
