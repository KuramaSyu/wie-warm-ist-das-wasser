import requests
import time
import json
import subprocess

def get_temperature():
    # Hier sollte der Code stehen, um die Temperatur vom Raspberry Pi auszulesen.
    # Da dies je nachdem, welcher Sensor verwendet wird, variieren kann, verwenden wir hier ein Beispiel.
    # In diesem Beispiel nehmen wir an, dass die Temperatur über das Kommandozeilenprogramm 'vcgencmd' ausgelesen werden kann.
    # Du musst diesen Teil entsprechend anpassen, um die Temperatur korrekt auszulesen.
    return 5
    # try:
    #     temperature = subprocess.check_output(["vcgencmd", "measure_temp"]).decode("utf-8")
    #     temperature = float(temperature.split('=')[1].split('\'')[0])
    #     return temperature
    # except Exception as e:
    #     print("Fehler beim Lesen der Temperatur:", e)
    #     return None

def send_temperature(temperature):
    url = "https://wwidw-backend.inuthebot.duckdns.org/set_temperature"
    payload = {"temperature": temperature}
    headers = {"Content-Type": "application/json"}

    try:
        response = requests.post(url, data=json.dumps(payload), headers=headers)
        if response.status_code == 200:
            print("Temperatur erfolgreich gesendet:", temperature)
        else:
            print("Fehler beim Senden der Temperatur. Statuscode:", response.status_code)
    except Exception as e:
        print("Fehler beim Senden der Temperatur:", e)

def main():
    while True:
        temperature = get_temperature()
        if temperature is not None:
            send_temperature(temperature)
        time.sleep(1)  # Warte 1 Sekunde vor dem nächsten Auslesen und Senden der Temperatur

if __name__ == "__main__":
    main()