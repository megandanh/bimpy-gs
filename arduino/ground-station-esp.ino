// LEFT ESP32 IS GS (RECIEVES TEL AND SEND ELRS COMMANDS)

#include <RadioLib.h>

#define LORA_CS     5
#define LORA_DIO1   32
#define LORA_RST    21
#define LORA_BUSY   33
#define LORA_RFSW   22

SX1262 radio = new Module(LORA_CS, LORA_DIO1, LORA_RST, LORA_BUSY);

static const uint16_t MAGIC = 0x424D;
static const uint8_t  TYPE_CMD = 1;
static const uint8_t  TYPE_TEL = 2;

#pragma pack(push, 1)
struct CmdPacket12 {
  uint16_t magic;
  uint8_t  type;      
  uint16_t seq;

  uint16_t ch[12];
  uint8_t  flags;
};

struct TelPacket {
  uint16_t magic;
  uint8_t  type;     
  uint16_t seq;

  float    pressure_pa;
  float    temp_c;
  uint16_t battery_mv;
};
#pragma pack(pop)

uint16_t seq = 0;

void setup() {
  Serial.begin(115200);
  delay(500);

  pinMode(22, OUTPUT);
  int st = radio.begin();
  radio.setSpreadingFactor(9);   
  radio.setBandwidth(125.0);    
  radio.setCodingRate(7);     
  Serial.print("LEFT begin: "); Serial.println(st);
  if (st != RADIOLIB_ERR_NONE) while (true) delay(1000);

  Serial.println("LEFT ready: RX CMD(12ch), TX TEL");
}

void loop() {
  static uint32_t lastTelMs = 0;
  static uint32_t lastCmdRxMs = 0;

  const uint32_t TEL_PERIOD_MS = 500;   
  const uint32_t GUARD_MS = 50;          

  // if (millis() - lastCmdRxMs >= TEL_PERIOD_MS) {

  lastTelMs = millis();

  CmdPacket12 cmd1{};
  cmd1.magic = MAGIC;
  cmd1.type  = TYPE_CMD;
  cmd1.seq   = seq++;

  digitalWrite(LORA_RFSW, LOW);
  delayMicroseconds(50); 

  int tx = radio.transmit((uint8_t*)&cmd1, sizeof(cmd1));
  Serial.print("\nLEFT TX CMD seq="); Serial.print(cmd1.seq);

  // Receiving/listening logic

  CmdPacket12 cmd2{};
  digitalWrite(LORA_RFSW, HIGH);

// 500 works
  int rx = radio.receive((uint8_t*)&cmd2, sizeof(cmd2), 500);
  if (rx == RADIOLIB_ERR_NONE && cmd2.magic == MAGIC && cmd2.type == TYPE_CMD) {

    Serial.print("\nLEFT RX CMD seq="); 
    Serial.print(cmd2.seq);
  }
  // }
}

"""
// ELRS CRSF Connection Test
// Verifies ESP32 can receive CRSF channel data from HappyModel EP2
//
// Wiring:
//   EP2 TX  →  ESP32 GPIO 16 (RX2)
//   EP2 RX  →  ESP32 GPIO 17 (TX2)  (optional for this test)
//   EP2 VCC →  5V (or 3.3V if your EP2 variant supports it)
//   EP2 GND →  GND

#include <Arduino.h>

#define RX2_PIN 16
#define TX2_PIN 17

// CRSF constants
static const uint8_t CRSF_ADDR_FC   = 0xC8;  // flight controller address
static const uint8_t CRSF_TYPE_CHAN  = 0x16;  // RC channels packed
static const uint8_t CRSF_TYPE_LINK = 0x14;  // link statistics
static const uint32_t CRSF_BAUD     = 420000;

// Decoded channels
static uint16_t channels[16];
static uint32_t frameCount = 0;
static uint32_t errorCount = 0;
static uint32_t lastFrameMs = 0;
static uint32_t lastPrintMs = 0;

// ── Arm / Kill channel mapping ──
// Adjust these to match your TX12 switch assignments
#define ARM_CHANNEL  4   // CH5 (0-indexed) — arm switch
#define KILL_CHANNEL 5   // CH6 (0-indexed) — kill switch
#define ARM_THRESHOLD  1500
#define KILL_THRESHOLD 1500

// How many channels to send to the GUI
#define NUM_CH_TO_SEND 12

// CRC8 DVB-S2 (poly 0xD5)
static uint8_t crc8_dvb_s2(const uint8_t* data, int len) {
  uint8_t crc = 0;
  for (int i = 0; i < len; i++) {
    crc ^= data[i];
    for (int b = 0; b < 8; b++) {
      crc = (crc & 0x80) ? (uint8_t)((crc << 1) ^ 0xD5) : (uint8_t)(crc << 1);
    }
  }
  return crc;
}

// Convert CRSF raw (172–1811) → µs (1000–2000)
static uint16_t crsfToUs(uint16_t v) {
  v = constrain(v, 172, 1811);
  return (uint16_t)(1000 + (long)(v - 172) * 1000L / (1811 - 172));
}

// Decode 22-byte channel payload → 16 channels
static void decodeChannels(const uint8_t* payload) {
  uint32_t bitbuf = 0;
  int bits = 0;
  int idx = 0;

  for (int i = 0; i < 22 && idx < 16; i++) {
    bitbuf |= ((uint32_t)payload[i]) << bits;
    bits += 8;
    while (bits >= 11 && idx < 16) {
      channels[idx++] = crsfToUs(bitbuf & 0x7FF);
      bitbuf >>= 11;
      bits -= 11;
    }
  }
}

// Frame collector
static uint8_t frame[64];
static int pos = 0;
static int need = 0;

void setup() {
  Serial.begin(115200);
  delay(500);

  Serial2.begin(CRSF_BAUD, SERIAL_8N1, RX2_PIN, TX2_PIN);

  for (int i = 0; i < 16; i++) channels[i] = 0;
}

void loop() {
  // Read all available bytes
  while (Serial2.available()) {
    uint8_t b = (uint8_t)Serial2.read();

    // Sync on address byte
    if (pos == 0) {
      if (b == CRSF_ADDR_FC) {
        frame[pos++] = b;
      }
      continue;
    }

    // Length byte
    if (pos == 1) {
      frame[pos++] = b;
      need = 2 + b;  // total frame size: addr + len + (len bytes)
      if (need < 4 || need > (int)sizeof(frame)) {
        pos = 0;
        need = 0;
        errorCount++;
      }
      continue;
    }

    // Collect remaining bytes
    frame[pos++] = b;

    if (need > 0 && pos >= need) {
      uint8_t len   = frame[1];
      uint8_t type  = frame[2];
      uint8_t crcRx = frame[need - 1];
      uint8_t crcCalc = crc8_dvb_s2(&frame[2], len - 1);

      if (crcCalc == crcRx) {
        frameCount++;
        lastFrameMs = millis();

        if (type == CRSF_TYPE_CHAN) {
          decodeChannels(&frame[3]);
        }
      } else {
        errorCount++;
      }

      pos = 0;
      need = 0;
    }
  }

  // Send JSON every 50ms (~20 Hz) for responsive GUI
  if (millis() - lastPrintMs >= 50) {
    lastPrintMs = millis();

    // Only send when we have received at least one valid frame
    if (frameCount == 0) return;

    bool connected = (millis() - lastFrameMs) < 500;
    bool arm  = channels[ARM_CHANNEL]  > ARM_THRESHOLD;
    bool kill = channels[KILL_CHANNEL] > KILL_THRESHOLD;

    // Build JSON: {"type":"ch","ch":[1500,1500,...],"arm":0,"kill":0,"connection":true}
    Serial.print("{\"type\":\"ch\",\"ch\":[");
    for (int i = 0; i < NUM_CH_TO_SEND; i++) {
      Serial.print(channels[i]);
      if (i < NUM_CH_TO_SEND - 1) Serial.print(",");
    }
    Serial.print("],\"arm\":");
    Serial.print(arm ? 1 : 0);
    Serial.print(",\"kill\":");
    Serial.print(kill ? 1 : 0);
    Serial.print(",\"connection\":");
    Serial.print(connected ? "true" : "false");
    Serial.println("}");
  }
}

"""