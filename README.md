# Philips Hue Power Sensor for Homebridge

Homebridge Hue Power Sensor is a Homebridge Plugin for Philips Hue light bulbs. 

This plugin adds HomeKit support for detecting Hue light bulb power on status. To achive this the plugin creates a new binary state sensor for each bulb and these sensors can then be used to trigger HomeKit automation rules.

## Installation
Installation is easy, just execute the following command on your Homebridge host machine.

```
npm install -g homebridge-hue-power-sensor
```

## Configuration
Modify the `config.json` file of your Homebridge installation and add the following section:

```json
"platforms": [
    {
        "platform": "HuePlatform",
        "name": "Hue"
    }
]
```

### Automatic Discovery of Bridges
Homebridge Huejay will try to discover Bridges when no Bridges are specified in the configuration. Homebridge Huejay will ask for authentication after every restart of Homebridge if no credentials are listed in your `config.json`. When you press the link button of your Bridge, Homebridge Huejay will connect to your Bridge and log the credentials of the created user. It's recommended to store the credentials in your `config.json` file to let Homebridge Huejay use that credentials when Homebridge is restarted.

You don't have to store the IP of your Bridge in the configuration file. Homebridge Huejay will automatically try to find the Bridge based on the given ID.

```
[4-3-2017 16:05:33] [Hue] Found Hue Bridge with ID: 001011XXXX0XX0X0, IP: 192.168.1.2
[4-3-2017 16:05:33] [Hue] Link button not pressed. Press the link button on your Bridge to authenticate...
[4-3-2017 16:05:38] [Hue] New user created - Username: RlRpseUAXPsMlnLyHXfNPIMt-60MlX06QB5VwpP6
[4-3-2017 16:05:38] [Hue] Loading accessories...
[4-3-2017 16:05:38] [Hue] Loading sensors of Bridge with ID 001011XXXX0XX0X0...
```


```json
"platforms": [
    {
        "platform": "HuePlatform",
        "name": "Hue",
        "clients": [
            {
                "id": "001011XXXX0XX0X0",
                "username": "RlRpseUAXPsMlnLyHXfNPIMt-60MlX06QB5VwpP6"
            }
        ]
    }
]
```

### Power Sensors

By default the plugin creates a new sensor for each light attached to each of the linked bridges. The sensor will appear as a new Contact Sensor with the name `[bulb name] Power Sensor`. Contact Sensor is used as it is the simplest of the standard sensor types.

Each new sensor is 'open' when the associated light is both on and reachable (i.e. powered). The sensor is 'closed' if the light is either off or unreachable (i.e. powered down).

The sensor state is updated every second. However, the Hue bridge can take several seconds to update the reachable state for a connected accessory so there can be an annoying delay before changes are detected and correctly reflected.

### Advanced Client configuration
You may also pass advanced options to the Huejay clients. Read the [Huejay documentation](https://github.com/sqmk/huejay#client-usage) for more information about the settings.


```json
"platforms": [
    {
        "platform": "HuePlatform",
        "name": "Hue",
        "clients": [
            {
                "id": "001011XXXX0XX0X0",
                "ip": "192.168.1.2",
                "port": 80,
                "timeout": 15000,
                "username": "RlRpseUAXPsMlnLyHXfNPIMt-60MlX06QB5VwpP6"
            }
        ]
    }
]
```

### Ignoring lights
If you want to disable HomeKit support for a specific light you can add the unique ID of the light to the `ignoreAccessories` option in the configuration. If you don't know what the unique ID is of a specific light, you can look for the 'Serial Number' of the light you want to disable. Homebridge Huejay registers the unique ID of an light as the 'Serial Number' to HomeKit. You can find the 'Serial Number' at the detail view of the light you want to disable. Most of the time it looks like a MAC address.

```json
"platforms": [
    {
        "platform": "HuePlatform",
        "name": "Hue",
        "clients": [
            {
                "id": "001011XXXX0XX0X0",
                "username": "RlRpseUAXPsMlnLyHXfNPIMt-60MlX06QB5VwpP6"
            }
        ],
        "ignoreAccessories": [
            "XX:XX:XX:XX:XX:XX:XX:XX-01-0001"
        ]
    }
]
```

## Developing

When developing this plugin it can be loaded into Homebridge by executing the following command:

`./bin/homebridge -D -I -P ./homebridge-hue-power-sensor/`

If you need to clear out previously registered accessories. Simply stop Homebridge, delete the contents of you local `~.homebridge/accessories/cachedAccessories` file, then start Homebridge again as above.

## Issues
If you have any issues with the extension, please let me know via the GitHub [issues section](https://github.com/peterot/homebridge-hue-power-sensor/issues). Provide as much information as possible, including the system log, so I can try to reproduce the problem. Turn Homebridge debugging on before posting your system log. Make sure you don't post any private information like API keys or secret keys.

## Contribution
Your help is more than welcome! If you own accessories that are not supported by Homebridge Huejay at this moment, feel free to create a pull request with the implementation for other accessories. Make sure to use the same code style as used for the existing code base. Thank you!

## Acknowledgements 
This plugin is based on and forked from [Homebridge Huejay](https://github.com/raymondelooff/homebridge-huejay/).

## License & Copyright
This plugin is open-source software licensed under the GPLv3 license.
