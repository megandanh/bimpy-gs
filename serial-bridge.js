import { SerialPort } from "serialport";
import { ReadlineParser } from "@serialport/parser-readline";
import { WebSocketServer } from "ws";

const SERIAL_PATH = process.env.SERIAL_PATH || "/dev/ttyUSB0"; // /dev/tty.usbserial-*
const BAUD = 115200;
const WS_PORT = 5177;

//serial port
const port = new SerialPort({ path: SERIAL_PATH, baudRate: BAUD });
const parser = port.pipe(new ReadlineParser({ delimiter: "\n" }));

// websocket port
const wss = new WebSocketServer({ port: WS_PORT });
const broadcast = (obj) => {
  const msg = JSON.stringify(obj);
  for (const client of wss.clients) {
    if (client.readyState === 1) client.send(msg);
  }
};

parser.on("data", (line) => {
  const s = line.trim();
  if (!s.startsWith("{")) return; 
  try {
    const data = JSON.parse(s);
    if (data.type === "ch") broadcast(data);
  } catch (e) {
    // ignore bad lines
  }
});

port.on("open", () => console.log("Serial open:", SERIAL_PATH));
wss.on("listening", () => console.log("WS listening on:", WS_PORT));