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
    history_handlers: Dict[str, TemperatureHistory] = {
        "1-min-mean": TemperatureHistory(60, 60),
        "5-min-mean": TemperatureHistory(60, 300),
        "10s-mean": TemperatureHistory(60, 10)
    }
    
    @classmethod
    def get_history(cls):
        return cls.history
    
    @classmethod
    def add_to_history(cls, temperature):
        cls.history.append(temperature)
        if len(cls.history) > 1000:
            cls.history.pop(0)
            
    def get_medium(cls, seconds: int):
        """Get the medium temperature of the last n seconds."""
        return math.mean(cls.history[-seconds:])
    
    @classmethod
    def get_temperature(cls):
        json = {
            "temperature": cls.temperature or 0,
            "history": [v.to_dict(k) for k, v in cls.history_handlers.items()] 
        }
        return json
    
    @classmethod
    def set_temperature(cls, temperature):
        cls.temperature = temperature
        cls.add_to_history(temperature)
        for k, v in cls.history.items():
            v.add(cls.get_history())



class TemperatureHandler(tornado.web.RequestHandler):
    async def get(self):
        # Simulate an async operation (e.g., a database query)
        await asyncio.sleep(1)
        
        self.set_header("Content-Type", "application/json")
        self.set_header("Access-Control-Allow-Origin", "*")  # Allow requests from all origins
        
        self.write({"temperature": TemperatureManager.get_temperature()})
        
        
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
    ])

if __name__ == "__main__":
    print("Starting server...")
    app = make_app()
    app.listen(8889)
    print("Server running at http://localhost:8889/temperature")
    tornado.ioloop.IOLoop.current().start()
