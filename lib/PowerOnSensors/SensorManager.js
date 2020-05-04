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
    this.clients = new Set();;
    this.sensorDictionary = {};
  }

  createPowerOnSensor(hueClient, hueLight) {
    this.clients.add(hueClient);

    const uuid = UUIDGen.generate(hueLight.uniqueId);
    const accessory = new Accessory(hueLight.name, uuid);

    accessory.context.uniqueId = hueLight.uniqueId;
    accessory.context.cached = false;

    const sensor = new LightBulbPowerOnSensor(Service, Characteristic, hueClient, hueLight, accessory);
    this.sensorDictionary[sensor.uniqueId] = sensor;

    return accessory;
  }

  createCachedPowerOnSensor(hueClient, hueLight, accessory) {
    this.clients.add(hueClient);

    accessory.context.uniqueId = hueLight.uniqueId;
    accessory.context.cached = true;

    const sensor = new LightBulbPowerOnSensor(Service, Characteristic, hueClient, hueLight, accessory);
    this.sensorDictionary[sensor.uniqueId] = sensor;

    return accessory;
  }

  enableUpdates() {
    setInterval(this._updateSensors, 1000, this);
  }

  _updateSensors(self) {
    for (const client of self.clients) {
      client.lights.getAll()
      .then(lights => {
        for (const light of lights) {
          const sensor = self.sensorDictionary[light.uniqueId];
          if (sensor) {
            sensor.updateCharacteristics(light);
          }
        }
      });
    }
  }
}

module.exports = SensorManager;
