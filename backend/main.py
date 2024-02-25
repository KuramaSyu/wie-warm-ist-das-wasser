import tornado.ioloop
import tornado.web
import asyncio
import random
import traceback
import json

class TemperatureManager:
    temperature: float = 0
    
    @classmethod
    def get_temperature(cls):
        return cls.temperature or random.uniform(-43, -42)
    
    @classmethod
    def set_temperature(cls, temperature):
        cls.temperature = temperature



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
