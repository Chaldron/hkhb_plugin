"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const axios_1 = __importDefault(require("axios"));
let hap;
class Firmware {
    constructor(log) {
        this.BaseURL = "http://hbfan/";
        this.log = log;
    }
    identify() {
        this.log.info("Identifying");
        return axios_1.default.get(this.BaseURL + "identify");
    }
    getActive() {
        this.log.info("Getting active state");
        return axios_1.default.get(this.BaseURL + "active").then(r => r.data).then(r => r['active']);
    }
    ;
    getRotationSpeed() {
        this.log.info("Getting rotation speed");
        return axios_1.default.get(this.BaseURL + "speed").then(r => r.data).then(r => r['speed']);
    }
    ;
    setActive(active) {
        this.log.info("Setting active to " + active);
        axios_1.default.get(this.BaseURL + "set_active?param=" + (active ? "1" : "0"));
    }
    ;
    setSpeed(speed) {
        this.log.info("Setting speed to " + speed);
        axios_1.default.get(this.BaseURL + "set_speed?param=" + speed.toString());
    }
    ;
}
class HomeBreezeFan {
    constructor(log, config, api) {
        this.log = log;
        this.name = config.name;
        this.api = new Firmware(log);
        this.fanService = new hap.Service.Fanv2(this.name);
        this.fanService.getCharacteristic(hap.Characteristic.Active)
            .on("get" /* GET */, (callback) => {
            this.api.getActive().then(active => callback(undefined, active));
        })
            .on("set" /* SET */, (value, callback) => {
            let active = value;
            this.api.setActive(active);
            callback();
        });
        this.fanService.getCharacteristic(hap.Characteristic.RotationSpeed)
            .setProps({ minValue: 0, maxValue: 3, minStep: 1 })
            .on("get" /* GET */, (callback) => {
            this.api.getRotationSpeed().then(speed => callback(undefined, speed));
        })
            .on("set" /* SET */, (value, callback) => {
            let speed = value;
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
    identify() {
        this.api.identify();
    }
    getServices() {
        return [
            this.informationService,
            this.fanService,
        ];
    }
}
module.exports = (api) => {
    hap = api.hap;
    api.registerAccessory("Harbor Breeze Fan", HomeBreezeFan);
};
//# sourceMappingURL=accessory.js.map