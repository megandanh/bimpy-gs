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
// ELRS CRSF Connection Test for ONLY ELRS to GCS ESP32
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

  Serial.println();
  Serial.println("==========================================");
  Serial.println("  ELRS CRSF Connection Test");
  Serial.println("  HappyModel EP2 → ESP32");
  Serial.println("==========================================");
  Serial.println();
  Serial.println("Wiring check:");
  Serial.println("  EP2 TX  → GPIO 16 (RX2)");
  Serial.println("  EP2 RX  → GPIO 17 (TX2)");
  Serial.println("  EP2 VCC → 5V");
  Serial.println("  EP2 GND → GND");
  Serial.println();
  Serial.println("Waiting for CRSF frames...");
  Serial.println();

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

        if (type == CRSF_TYPE_LINK) {
          // Link stats frame received — connection confirmed
        }
      } else {
        errorCount++;
      }

      pos = 0;
      need = 0;
    }
  }

  // Print status every 500ms
  if (millis() - lastPrintMs >= 500) {
    lastPrintMs = millis();

    Serial.println("------------------------------------------");

    if (frameCount == 0) {
      Serial.println("STATUS: NO FRAMES RECEIVED");
      Serial.println("  - Check wiring (EP2 TX → GPIO 16)");
      Serial.println("  - Is EP2 powered?");
      Serial.println("  - Is your TX (radio) on and bound?");

      // Show if we're getting any raw bytes at all
      Serial.print("  - Raw bytes on Serial2: ");
      Serial.println(Serial2.available() > 0 ? "YES (data present but no valid frames)" : "NONE");

    } else {
      uint32_t age = millis() - lastFrameMs;

      Serial.print("STATUS: CONNECTED | Frames: ");
      Serial.print(frameCount);
      Serial.print(" | Errors: ");
      Serial.print(errorCount);
      Serial.print(" | Last frame: ");
      Serial.print(age);
      Serial.println("ms ago");

      if (age > 500) {
        Serial.println("  WARNING: Stale data — TX may be off or out of range");
      }

      // Print first 8 channels
      Serial.print("  CH1-4:  ");
      for (int i = 0; i < 4; i++) {
        Serial.print(channels[i]);
        Serial.print(i < 3 ? "  " : "\n");
      }
      Serial.print("  CH5-8:  ");
      for (int i = 4; i < 8; i++) {
        Serial.print(channels[i]);
        Serial.print(i < 7 ? "  " : "\n");
      }

      // Stick movement check
      bool sticksMoved = false;
      for (int i = 0; i < 4; i++) {
        if (channels[i] < 1400 || channels[i] > 1600) {
          sticksMoved = true;
          break;
        }
      }
      Serial.print("  Sticks: ");
      Serial.println(sticksMoved ? "MOVING (input detected)" : "CENTERED");
    }
  }
}

"""