import {
  AccessoryConfig,
  AccessoryPlugin,
  API,
  CharacteristicEventTypes,
  CharacteristicGetCallback,
  CharacteristicSetCallback,
  CharacteristicValue,
  HAP,
  Logging,
  Service
} from "homebridge";

import axios from 'axios';

let hap: HAP;

export = (api: API) => {
  hap = api.hap;
  api.registerAccessory("Harbor Breeze Fan", HomeBreezeFan);
};

class Firmware {
  private readonly BaseURL: String = "http://hbfan/";
  private readonly log: Logging;

  constructor(log: Logging) {
    this.log = log;
  }

  identify(): Promise<any> {
    this.log.info("Identifying");
    return axios.get(this.BaseURL + "identify");
  }

  getActive(): Promise<any> {
    this.log.info("Getting active state");
    return axios.get(this.BaseURL + "active").then(r => r.data).then(r => r['active']);
  };

  getRotationSpeed(): Promise<any> {
    this.log.info("Getting rotation speed");
    return axios.get(this.BaseURL + "speed").then(r => r.data).then(r => r['speed']);
  };

  setActive(active: boolean) {
    this.log.info("Setting active to " + active);
    axios.get(this.BaseURL + "set_active?param=" + (active ? "1" : "0"));
  };

  setSpeed(speed: number) {
    this.log.info("Setting speed to " + speed);
    axios.get(this.BaseURL + "set_speed?param=" + speed.toString());
  };
}

class HomeBreezeFan implements AccessoryPlugin {


  private readonly log: Logging;
  private readonly name: string;
  private readonly api: Firmware;
  private readonly fanService: Service;
  private readonly informationService: Service;


  constructor(log: Logging, config: AccessoryConfig, api: API) {
    this.log = log;

    this.name = config.name;
    this.api = new Firmware(log);

    this.fanService = new hap.Service.Fanv2(this.name);
    this.fanService.getCharacteristic(hap.Characteristic.Active)
      .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
        this.api.getActive().then(active => callback(undefined, active));
      })
      .on(CharacteristicEventTypes.SET, (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
        let active: boolean = value as boolean;
        this.api.setActive(active);
        callback();
      });
    this.fanService.getCharacteristic(hap.Characteristic.RotationSpeed)
      .setProps({ minValue: 0, maxValue: 3, minStep: 1 })
      .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
        this.api.getRotationSpeed().then(speed => callback(undefined, speed));
      })
      .on(CharacteristicEventTypes.SET, (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
        let speed: number = value as number;
        this.api.setSpeed(speed);
        callback();
      });

    this.informationService = new hap.Service.AccessoryInformation()
      .setCharacteristic(hap.Characteristic.Manufacturer, "Harbor Breeze")
      .setCharacteristic(hap.Characteristic.Model, "CHQ7030T")
      .setCharacteristic(hap.Characteristic.SerialNumber, "1289")
      .setCharacteristic(hap.Characteristic.FirmwareRevision, "1.1");

    log.info("Finished initializing!");
  }

  identify(): void {
    this.api.identify();
  }

  getServices(): Service[] {
    return [
      this.informationService,
      this.fanService,
    ];
  }

}
