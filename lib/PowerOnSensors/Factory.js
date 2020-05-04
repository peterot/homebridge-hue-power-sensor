'use strict';

const HueError = require('../HueError');
const LightBulbPowerOnSensor = require(`./LightBulbPowerOnSensor`);

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

  createPowerOnSensor(hueClient, hueAccessory) {
    const uuid = UUIDGen.generate(hueAccessory.uniqueId);
    const accessory = new Accessory(hueAccessory.name, uuid);

    accessory.context.uniqueId = hueAccessory.uniqueId;
    accessory.context.cached = false;

    const sensorAccessory = new LightBulbPowerOnSensor(Service, Characteristic, hueClient, hueAccessory, accessory);

    return accessory;
  }

  createCachedPowerOnSensor(hueClient, hueAccessory, accessory) {
    accessory.context.uniqueId = hueAccessory.uniqueId;
    accessory.context.cached = true;

    const sensorAccessory = new LightBulbPowerOnSensor(Service, Characteristic, hueClient, hueAccessory, accessory);

    return accessory;
  }

}

module.exports = Factory;
