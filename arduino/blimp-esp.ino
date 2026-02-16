// RIGHT ESP32 IS BLIMP (RECEIVES ELRS COMMANDS AND SENDS TEL)

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

  Serial.println("LEFT ready: TX CMD(12ch), RX TEL");
}

void loop() {
  static uint32_t lastCmdMs = 0;
  static uint32_t lastTelRxMs = 0;

  CmdPacket12 cmd1{};
  digitalWrite(LORA_RFSW, HIGH);
  delayMicroseconds(50);

  int rx = radio.receive((uint8_t*)&cmd1, sizeof(cmd1));


  if (rx == RADIOLIB_ERR_NONE && cmd1.magic == MAGIC && cmd1.type == TYPE_CMD) {

    bool arm  = (cmd1.flags & (1 << 0));
    bool kill = (cmd1.flags & (1 << 1));

    Serial.print("LEFT RX CMD seq="); 
    Serial.print(cmd1.seq);
    
    CmdPacket12 cmd2{};
    cmd2.magic = MAGIC;
    cmd2.type  = TYPE_CMD;
    cmd2.seq   = seq++;

    digitalWrite(LORA_RFSW, LOW);
    delayMicroseconds(50); 

    int tx = radio.transmit((uint8_t*)&cmd2, sizeof(cmd2));
    Serial.print("\nLEFT TX CMD seq="); Serial.print(cmd2.seq);
    Serial.print(" tx="); Serial.println(tx);
  }
}


