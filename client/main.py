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
import csv
from datetime import datetime
import GPUtil
import json
data = None
with open("config.json") as f:
    print(f"read {f.name}")
    data = json.load(f)

if not data:
    raise Exception("Config file not found in root directory. ")

ENDPOINT: str|None = data.get("BACKEND_URL")
if not ENDPOINT:
    raise Exception("Backend URL not found in config.json in root directory. ")

HOSTNAME: Literal["raspberrypi", "notebook", "nvidea"] = None
SENSOR: Optional[str] = None  # Variable to store the sensor argument value
OUTPUT_FILE = "output.csv"  # Default output file
def parse_arguments():
    parser = argparse.ArgumentParser(description='Script to send CPU temperature to a server.')
    parser.add_argument('hostname', choices=['raspberrypi', 'notebook', 'nvidea'], help='Hostname of the device')
    parser.add_argument('-s', '--sensor', help='Sensor type (optional)')
    parser.add_argument('-o', '--output', default=OUTPUT_FILE, help='Output CSV file')
    parser.add_argument('--debug', action='store_true', help='Enable debug mode')
    parser.add_argument('--endpoint', default=ENDPOINT, help='Endpoint to send temperature data to')
    return parser.parse_args()

def setup_logging(debug):
    logger = logging.getLogger()
    logger.setLevel(logging.DEBUG if debug else logging.INFO)

class Methods:
    @staticmethod
    def raspberry_pi():
        """Get CPU temperature of a specific sensor on Raspberry Pi measured in Celsius."""
        try: 
            # 1-wire Slave Datei lesen
            print("raed raspberry pi")
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
            print("read notebook")
            print(f"temperature:{pformat(psutil.sensors_temperatures())}")
            temperature = psutil.sensors_temperatures()['amdgpu'][0].current
            return temperature
        except Exception as e:
            logging.error(f"Error reading CPU temperature: {e}")
            return 0
        
    @staticmethod
    def nvidea():
        """Get GPU temperature of a nvidea card."""
        gpu = GPUtil.getGPUs()[0]
        return gpu.temperature
        
        
def get_temperature():
    """Get CPU temperature."""
    if HOSTNAME == "raspberrypi":
        return Methods.raspberry_pi()
    elif HOSTNAME == "notebook":
        return Methods.notebook()
    elif HOSTNAME == "nvidea":
        return Methods.nvidea()

def send_temperature(temperature):
    url = f"{ENDPOINT}/set_temperature"
    payload = {"temperature": temperature, "hostname": HOSTNAME}
    headers = {"Content-Type": "application/json"}

    try:
        response = requests.post(url, data=json.dumps(payload), headers=headers)
        if response.status_code == 200:
            logging.info("Temperature successfully sent: %s", temperature)
        else:
            logging.error("Error sending temperature. Status code: %s", response.status_code)
    except Exception as e:
        logging.error("Error sending temperature: %s", e)

def write_to_csv(data):
    with open(OUTPUT_FILE, mode='a', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(data)

def main():
    global HOSTNAME, SENSOR, OUTPUT_FILE
    args = parse_arguments()
    setup_logging(args.debug)
    ENDPOINT = args.endpoint
    HOSTNAME = args.hostname
    SENSOR = args.sensor
    OUTPUT_FILE = args.output
    
    while True:
        temperatures = []
        for _ in range(60):
            temperature = get_temperature()
            if temperature is not None:
                temperatures.append(temperature)
            send_temperature(temperature)
            time.sleep(1)  # Wait 1 second before reading the temperature again
        
        if temperatures:
            average_temperature = sum(temperatures) / len(temperatures)
            iso_time = datetime.utcnow().isoformat()
            data = [HOSTNAME, SENSOR, iso_time, round(average_temperature, 2)]
            logging.info(f"Write to CSV: {data}")
            write_to_csv(data)

if __name__ == "__main__":
    main()
