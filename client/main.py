import argparse
import requests
import time
import json
import subprocess
import psutil
import sys
import traceback
import logging
from typing import *
from pprint import pformat

HOSTNAME: Literal["raspberrypi", "notebook"] = None
SENSOR: Optional[str] = None  # Variable to store the sensor argument value

def parse_arguments():
    parser = argparse.ArgumentParser(description='Script to send CPU temperature to a server.')
    parser.add_argument('hostname', choices=['raspberrypi', 'notebook'], help='Hostname of the device')
    parser.add_argument('-s', '--sensor', help='Sensor type (optional)')
    parser.add_argument('--debug', action='store_true', help='Enable debug mode')
    return parser.parse_args()

def setup_logging(debug):
    logger = logging.getLogger()
    logger.setLevel(logging.DEBUG if debug else logging.INFO)

class Methods:
    @staticmethod
    def raspberry_pi():
        """Get CPU temperature."""
        try: 
            # 1-wire Slave Datei lesen
            with open(f'/sys/bus/w1/devices/{SENSOR}/w1_slave', "r") as f: 
                filecontent = f.read()
                stringvalue = filecontent.split("\n")[1].split(" ")[9]
                temperature = float(stringvalue[2:]) / 1000
 
            # Temperaturwerte auslesen und konvertieren
            stringvalue = filecontent.split("\n")[1].split(" ")[9]
            temperature = float(stringvalue[2:]) / 1000
            return temperature
        except Exception as e:
            logging.error(f"Error reading CPU temperature: {traceback.format_exc()}")
            return 0
        
    @staticmethod
    def notebook():
        """Get CPU temperature."""
        try:
            # Read CPU temperature from psutil
            logging.debug(pformat(psutil.sensors_temperatures()))
            temperature = psutil.sensors_temperatures()['amdgpu'][0].current
            return temperature
        except Exception as e:
            logging.error(f"Error reading CPU temperature: {e}")
            return 0
        
        
def get_temperature():
    """Get CPU temperature."""
    if HOSTNAME == "raspberrypi":
        return Methods.raspberry_pi()
    elif HOSTNAME == "notebook":
        return Methods.notebook()

def send_temperature(temperature):
    url = "https://wwidw-backend.inuthebot.duckdns.org/set_temperature"
    payload = {"temperature": temperature, "hostname": HOSTNAME, "sensor": SENSOR}
    headers = {"Content-Type": "application/json"}

    try:
        response = requests.post(url, data=json.dumps(payload), headers=headers)
        if response.status_code == 200:
            logging.info("Temperature successfully sent: %s", temperature)
        else:
            logging.error("Error sending temperature. Status code: %s", response.status_code)
    except Exception as e:
        logging.error("Error sending temperature: %s", e)

def main():
    global HOSTNAME, SENSOR
    args = parse_arguments()
    setup_logging(args.debug)
    
    HOSTNAME = args.hostname
    SENSOR = args.sensor  # Store the sensor argument value
    
    while True:
        temperature = get_temperature()
        if temperature is not None:
            send_temperature(temperature)
        time.sleep(1)  # Wait 1 second before reading and sending the temperature again

if __name__ == "__main__":
    main()
