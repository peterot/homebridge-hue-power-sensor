'use strict';

const HueError = require('../HueError');
const LightBulbPowerOnSensor = require(`./LightBulbPowerOnSensor`);

let Accessory;
let Service;
let Characteristic;
let UUIDGen;

/**
 * SensorManager for Accessories.
 */
class SensorManager {
  /**
   * Constructor.
   */
  constructor(HBAccessory, HBService, HBCharacteristic, HBUUIDGen, log) {
    Accessory = HBAccessory;
    Service = HBService;
    Characteristic = HBCharacteristic;
    UUIDGen = HBUUIDGen;

    this.log = log;
    this.sensors = [];
  }

  createPowerOnSensor(hueClient, hueLight) {
    const uuid = UUIDGen.generate(hueLight.uniqueId);
    const accessory = new Accessory(hueLight.name, uuid);

    accessory.context.uniqueId = hueLight.uniqueId;
    accessory.context.cached = false;

    this.sensors.push(new LightBulbPowerOnSensor(Service, Characteristic, hueClient, hueLight, accessory));

    return accessory;
  }

  createCachedPowerOnSensor(hueClient, hueLight, accessory) {
    accessory.context.uniqueId = hueLight.uniqueId;
    accessory.context.cached = true;

    this.sensors.push(new LightBulbPowerOnSensor(Service, Characteristic, hueClient, hueLight, accessory));

    return accessory;
  }

  enableUpdates() {
    console.log("Enabling updates");
    setInterval(this._updateSensors, 10000, this);
  }

  _updateSensors(self) {
    console.log("Updating all sensors");
    for (const sensor of self.sensors) {
      sensor.updateCharacteristics();
    }
  }
}

module.exports = SensorManager;
