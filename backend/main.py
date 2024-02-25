import tornado.ioloop
import tornado.web
import asyncio
import random

class TemperatureHandler(tornado.web.RequestHandler):
    async def get(self):
        # Simulate an async operation (e.g., a database query)
        await asyncio.sleep(1)
        
        self.set_header("Content-Type", "application/json")
        self.set_header("Access-Control-Allow-Origin", "*")  # Allow requests from all origins
        
        self.write({"temperature": random.uniform(-43, -42)})

def make_app():
    return tornado.web.Application([
        (r"/get_temperature", TemperatureHandler),
    ])

if __name__ == "__main__":
    app = make_app()
    app.listen(8889)
    print("Server running at http://localhost:8889/temperature")
    tornado.ioloop.IOLoop.current().start()
