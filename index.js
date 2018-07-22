var Service, Characteristic;
var https = require("https");

module.exports = function (homebridge) {
	Service = homebridge.hap.Service;
	Characteristic = homebridge.hap.Characteristic;
	homebridge.registerAccessory("homebridge-naturemo", "NatureRemo", NatureRemoAccessory);
}


function NatureRemoAccessory(log, config) {
	this.log = log;

	// url info
	this.accessToken = config["access_token"];
	this.onId = config["on_id"];
	this.offId = config["off_id"];
	this.name = config["name"];
}

NatureRemoAccessory.prototype = {

	httpRequest: function (token, signal, callback) {
		var signalId = signal;
		var req = https.request({
    		host: "api.nature.global",
            path: "/1/signals/" + signalId + "/send",
			method: "POST",
			headers: {
                "Authorization" : "Bearer " + token,
				"accept" : "application/json",
				"Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
			}
		}, function (response) {
			callback(response);
		});
		req.on('error', function (response) {
			callback(response);
		});
		req.write(signal);
		req.end();
	},

	setPowerState: function (powerOn, callback) {
		var form;

		if (powerOn) {
			signal = this.onId;
			this.log("Setting power state to on");
		} else {
			signal = this.offId;
			this.log("Setting power state to off");
		}

		this.httpRequest(this.accessToken, signal, function (response) {
			if (response.statusCode == 200) {
				this.log('Nature Remo power function succeeded!');

				callback();
			} else {
				this.log(response.message);
				this.log('Nature Remo power function failed!');

				callback('error');
			}
		}.bind(this));
	},

	identify: function (callback) {
		this.log("Identify requested!");
		callback(); // success
	},

	getServices: function () {

		// you can OPTIONALLY create an information service if you wish to override
		// the default values for things like serial number, model, etc.
		var informationService = new Service.AccessoryInformation();

		informationService
			.setCharacteristic(Characteristic.Manufacturer, 'Nature, Inc')
			.setCharacteristic(Characteristic.Model, 'Remo')
			.setCharacteristic(Characteristic.SerialNumber, 'S/N');
	
		var switchService = new Service.Switch(this.name);

		switchService
			.getCharacteristic(Characteristic.On)
			.on('set', this.setPowerState.bind(this));

		return [informationService, switchService];
	}
};
