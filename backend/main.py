import tornado.ioloop
import tornado.web
import asyncio
import random
import traceback
import json
from typing import *
from datetime import datetime, timedelta
import math


class TemperatureHistory:
    def __init__(
        self,
        index_size: int,
        record_interval: int
    ):
        self.index_size = index_size
        self.history: List[Dict[str: int]] = []
        self._last_time_added = 0
        self.record_interval = record_interval
        
    def add(self, temperatures: List[float]):
        if (datetime.now() - self._last_time_added) < timedelta(seconds=self.record_interval):
            return
        temperature = math.mean(temperatures[-self.record_interval:])
        self.history.append(
            {
                "temperature": temperature,
                "timestamp": int(datetime.now().isoformat())
            }
        )
        if len(self.history) > self.index_size:
            self.history.pop(0)
            
    def to_dict(self, name: str):
        return {
            "name": name,
            "index_size": self.index_size,
            "record_interval": self.record_interval,
            "history": self.history
        }
        
    

class TemperatureManager:
    temperature: float = 0
    history: List[float] = []
    history_handlers: Dict[str, TemperatureHistory] = {}
    
    @classmethod
    def get_history(cls):
        return cls.history
    
    @classmethod
    def add_to_history(cls, temperature):
        cls.history.append(temperature)
        if len(cls.history) > 60*60*24*3:
            cls.history.pop(0)
    
    @classmethod
    def get_temperature(cls):
        return cls.temperature or 0
    
    @classmethod
    def get_temperature_history(cls, seconds: int):
        if len(cls.history) < seconds:
            return cls.history
        return cls.history[seconds:]
    
    @classmethod
    def set_temperature(cls, temperature):
        cls.temperature = temperature
        cls.add_to_history(temperature)
        # for k, v in cls.history.items():
        #     v.add(cls.get_history())



class TemperatureHandler(tornado.web.RequestHandler):
    async def get(self):        
        self.set_header("Content-Type", "application/json")
        self.set_header("Access-Control-Allow-Origin", "*")  # Allow requests from all origins
        
        self.write({"temperature": TemperatureManager.get_temperature()})
        
class TemperatureHistoryHandler(tornado.web.RequestHandler):
    def get(self):
        """
        Returns the temperature history for the last n seconds. 
        No time included. The newest temperature is at the end of the list.
        """
        seconds = int(self.get_argument("seconds"))

        self.set_header("Content-Type", "application/json")
        self.set_header("Access-Control-Allow-Origin", "*")  # Allow requests from all origins

        data = TemperatureManager.get_temperature_history(seconds)
        self.write({"history": data})

class SetTemperatureHandler(tornado.web.RequestHandler):
    def post(self):
        self.set_header("Content-Type", "application/json")
        self.set_header("Access-Control-Allow-Origin", "*")  # Allow requests from all origins
        temperature = None
        try:
            data = json.loads(self.request.body.decode('utf-8'))
            print(data)
            temperature = data.get('temperature')
        except Exception as e:
            print("Error processing request:", e)
            self.set_status(400)
            self.finish("Error processing request")
        #temperature = self.get_argument("temperature")
        if temperature is not None:
            TemperatureManager.set_temperature(float(temperature))
        else:
            self.set_status(400)
            self.finish("Invalid temperature")
            

        self.write({"code": 200})
        
        


def make_app():
    return tornado.web.Application([
        (r"/get_temperature", TemperatureHandler),
        (r"/set_temperature", SetTemperatureHandler),
        (r"/get_temperature_history", TemperatureHistoryHandler)
    ])

if __name__ == "__main__":
    print("Starting server...")
    app = make_app()
    app.listen(8889)
    print("Server running at http://localhost:8889/temperature")
    tornado.ioloop.IOLoop.current().start()
