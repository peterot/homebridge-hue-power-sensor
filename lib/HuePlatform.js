'use strict';

const PLUGIN_NAME = 'homebridge-hue-power-sensor';
const PLATFORM_NAME = 'HuePowerOnSensors';
const DEFAULT_CONFIG = {
  clients: [],
  ignoreAccessories: []
};

const Huejay = require('huejay');
const PLATFORM_VERSION = require('../package.json').version;
const SensorManager = require('./PowerOnSensors/SensorManager');

/**
 * HuePlatform.
 */
class HuePlatform {
  constructor(Accessory, Service, Characteristic, UUIDGen, log, config, api) {
    this.log = log;
    this.config = Object.assign({}, DEFAULT_CONFIG, config);
    this.api = api;

    this.clients = {};
    this.cachedAccessories = [];
    this.accessories = [];
    this.services = [];

    this.sensorManager = new SensorManager(Accessory, Service, Characteristic, UUIDGen, log);

    this.log.info('HuePlatform version: ' + PLATFORM_VERSION);

    this.api.on('didFinishLaunching', this.initialize.bind(this));
  }

  initialize() {
    this._removeUnusableCachedAccessories();

    this._parseConfiguration(err => {
      if (err) {
        this.log.error(`Failed to discover Bridges, retrying after 60 seconds: '${err.message}'`);

        setTimeout(() => {
          this.initialize();
        }, 60000);

        return;
      }

      this._authenticateClients(() => {
        this._loadAccessories();
      });
    });
  }

  configureAccessory(accessory) {
    this.cachedAccessories.push(accessory);
  }

  handleConfigurationRequest(context, request, callback) {
    //
  }

  _removeUnusableCachedAccessories() {
    const usableCachedAccessories = [];

    for (const accessory of this.cachedAccessories) {
      if (accessory.context.uniqueId === undefined) {
        this.log.info(`Unregistering accessory '${accessory.displayName}'...`);

        try {
          this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
        } catch (err) {
          this.log.error(`Failed to unregister accessory '${accessory.displayName}': ${err.message}`);
        }

        continue;
      }

      if (this.config.ignoreAccessories.indexOf(accessory.context.uniqueId) !== -1) {
        this.log.info(`Ignoring accessory with ID ${accessory.context.uniqueId}...`);

        try {
          this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
        } catch (err) {
          this.log.error(`Failed to unregister accessory '${accessory.displayName}': ${err.message}`);
        }

        continue;
      }

      usableCachedAccessories.push(accessory);
    }

    this.cachedAccessories = usableCachedAccessories;
  }

  _loadAccessories() {
    this.log.info('Loading lights...');
    this._loadLights();
    this.sensorManager.enableUpdates();
  }

  _loadLights() {
    for (const bridgeId in this.clients) {
      if (!Object.prototype.hasOwnProperty.call(this.clients, bridgeId)) {
        continue;
      }

      this.log.info(`Loading lights of Bridge with ID ${bridgeId}...`);

      const client = this.clients[bridgeId];

      client.lights.getAll()
        .then(lights => {
          for (const light of lights) {
            if (light.uniqueId === undefined) {
              continue;
            }

            // console.log(`Light [${light.id}]: ${light.name}`);
            // console.log(`  Type:             ${light.type}`);
            // console.log(`  Unique ID:        ${light.uniqueId}`);
            // console.log(`  Manufacturer:     ${light.manufacturer}`);
            // console.log(`    On:         ${light.on}`);
            // console.log(`    Reachable:  ${light.reachable}`);
            // console.log();

            try {
              const accessory = this._getPlatformAccessory(client, light);

              if (accessory === undefined) {
                console.log("Platform accessory not found.");
                continue;
              }

              this._registerPlatformAccessory(accessory);
            } catch (err) {
              console.debug(err);
              this.log.debug(err.message);
            }
          }
        })
      ;
    }
  }

  _getPlatformAccessory(client, hueLight) {
    let platformAccessory;

    for (const cachedAccessory of this.cachedAccessories) {
      if (cachedAccessory.context.uniqueId === hueLight.uniqueId) {
        this.log.debug(`Using cached accessory for light with ID '${hueLight.uniqueId}'...`);

        platformAccessory = this.sensorManager.createCachedPowerOnSensor(client, hueLight, cachedAccessory);
      }
    }

    if (this.config.ignoreAccessories.indexOf(hueLight.uniqueId) !== -1) {
      this.log.info(`Ignoring light with ID ${hueLight.uniqueId}...`);

      if (platformAccessory !== undefined) {
        try {
          this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [platformAccessory]);
        } catch (err) {
          this.log.error(`Failed to unregister accessory with ID '${hueLight.uniqueId}': ${err.message}`);
        }
      }

      return;
    }

    if (platformAccessory === undefined) {
      platformAccessory = this.sensorManager.createPowerOnSensor(client, hueLight);
    }

    return platformAccessory;
  }

  _registerPlatformAccessory(accessory) {
    if (!accessory.context.cached) {
      this.log.info(`Registering accessory '${accessory.displayName}'...`);
      accessory.context.cached = true;

      this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
    }
  }

  _authenticateClients(callback) {
    const promises = [];

    for (const bridgeId in this.clients) {
      if (!Object.prototype.hasOwnProperty.call(this.clients, bridgeId)) {
        continue;
      }

      const client = this.clients[bridgeId];

      promises.push(this._authenticateClient(client));
    }

    Promise.all(promises)
      .then(() => {
        callback();
      })
      .catch(err => {
        this.log.warn(`Could not authenticate one or more clients: ${err.message}`);

        callback();
      })
    ;
  }

  _authenticateClient(client) {
    return new Promise((resolve, reject) => {
      client.bridge.isAuthenticated()
        .then(() => {
          client.bridge.get()
            .then(bridge => {
              this.log.info(`Authenticated on Bridge '${bridge.name}' with ID ${bridge.id}`);

              resolve();
            })
            .catch(() => {
              this.log.info(`Authenticated on Bridge`);

              resolve();
            })
          ;
        })
        .catch(() => {
          this.log.info(`Not authenticated. Press the link button on your Bridge to authenticate...`);

          this._createUser(client, err => {
            return err ? reject(err) : resolve();
          });
        })
      ;
    });
  }

  _createUser(client, callback) {
    const user = new client.users.User();

    user.deviceType = `homebridge-huejay`;

    client.users.create(user)
      .then(user => {
        this.log.info(`Created new user - Username: ${user.username}`);

        client.username = user.username;

        callback();
      })
      .catch(err => {
        if (err.type === 101) {
          this.log.debug('Link button not pressed, retrying...');

          setTimeout(() => {
            this._createUser(client, callback);
          }, 1000);

          return;
        }

        callback(err);
      })
    ;
  }

  _discover(callback) {
    this.log.info('Searching for Hue Bridges...');

    Huejay.discover()
      .then(bridges => {
        if (bridges.length === 0) {
          this.log.info('No Hue Bridges were found...');

          callback();
          return;
        }

        for (const bridge of bridges) {
          this.log.info(`Found Hue Bridge with ID: ${bridge.id}, IP: ${bridge.ip}`);

          let clientConfig = {
            id: bridge.id,
            ip: bridge.ip
          };

          for (const savedConfig of this.config.clients) {
            if (savedConfig.id === bridge.id) {
              this.log.info(`Using existing configuration for Bridge with ID ${bridge.id}`);

              clientConfig = Object.assign(clientConfig, savedConfig);

              continue;
            }
          }

          this._createClient(clientConfig);
        }

        callback();
      })
      .catch(err => {
        callback(err);
      })
    ;
  }

  _parseConfiguration(callback) {
    for (const clientConfig of this.config.clients) {
      if (clientConfig.id === undefined) {
        this.log.warn('Make sure every Bridge in the configuration has an ID!');

        continue;
      }
    }

    this._discover(callback);
  }

  _createClient(clientConfig) {
    const config = {
      host: clientConfig.ip
    };

    if (clientConfig.port !== undefined) {
      config.port = clientConfig.port;
    }

    if (clientConfig.username !== undefined) {
      config.username = clientConfig.username;
    }

    if (clientConfig.timeout !== undefined) {
      config.timeout = clientConfig.timeout;
    }

    const client = new Huejay.Client(config);
    this.clients[clientConfig.id] = client;

    return client;
  }
}

module.exports = {
  pluginName: PLUGIN_NAME,
  platformName: PLATFORM_NAME,
  platformVersion: PLATFORM_VERSION,
  HuePlatform
};
