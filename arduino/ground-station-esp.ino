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
  Serial.print("RIGHT begin: "); Serial.println(st);
  if (st != RADIOLIB_ERR_NONE) while (true) delay(1000);

  Serial.println("RIGHT ready: RX CMD(12ch), TX TEL");
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
  Serial.print("\nRIGHT TX CMD seq="); Serial.print(cmd1.seq);

  // Receiving/listening logic

  CmdPacket12 cmd2{};
  digitalWrite(LORA_RFSW, HIGH);


// 500 works
  int rx = radio.receive((uint8_t*)&cmd2, sizeof(cmd2), 500);


  if (rx == RADIOLIB_ERR_NONE && cmd2.magic == MAGIC && cmd2.type == TYPE_CMD) {

    Serial.print("\nRIGHT RX CMD seq="); 
    Serial.print(cmd2.seq);
  }
  // }
}

