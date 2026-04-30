// LEFT ESP32 IS GS
// GS 5.0 Code — FIXED
// 240MHz ESP32 Clock

// B: disarm (up and middle 0)
// [6] >1900 is arm 

#include <RadioLib.h>
#include <Arduino.h>

#define RX2_PIN 16
#define TX2_PIN 17

#define LORA_CS     27
#define LORA_DIO1   32
#define LORA_RST    21
#define LORA_BUSY   33
#define LORA_RFSW   22 //high is receiver mode, other time is low
#define GSoutput    14 //output for GS, input for Blimp
#define GSinput     26 // FIX: was 27, conflicted with LORA_CS

static const uint8_t CRSF_ADDR_FC   = 0xC8;  // flight controller address
static const uint8_t CRSF_TYPE_CHAN  = 0x16;  // RC channels packed
static const uint8_t CRSF_TYPE_LINK = 0x14;  // link statistics
static const uint32_t CRSF_BAUD     = 420000;

static uint16_t channels[16];
static SemaphoreHandle_t channelMutex;

static uint32_t frameCount = 0;
static uint32_t errorCount = 0;
static uint32_t lastFrameMs = 0;
static uint32_t lastPrintMs = 0;

unsigned long startTime;
unsigned long stopTime;
unsigned long totalTime;
float refreshRate;
uint8_t refreshCount;
uint8_t lostPacketCount;
uint8_t lostPacketRate;
float RSSI;
float SNR;

static SemaphoreHandle_t telMutex;
static bool telValid = false;
static int32_t  tel_pressure_pa;
static uint8_t  tel_temp_f;
static uint16_t tel_battery_mv;
static uint8_t  tel_battery_a;
static uint16_t tel_used_mah;
static uint8_t  tel_batteryPer;
static int32_t  tel_gps_lat;
static int32_t  tel_gps_lon;
static uint8_t  tel_gps_sats;
static uint16_t tel_gps_spd;
static uint8_t  tel_codes;

#define ARM_CHANNEL  6   // CH7 (0-indexed) — arm switch
// #define KILL_CHANNEL 5   // CH6 (0-indexed) — kill switch
#define ARM_THRESHOLD  1900
// #define KILL_THRESHOLD 1500

#define NUM_CH_TO_SEND 12


SX1262 radio = new Module(LORA_CS, LORA_DIO1, LORA_RST, LORA_BUSY);

static const uint32_t rfswitch_pins[] =
  {LORA_RFSW, RADIOLIB_NC, RADIOLIB_NC, RADIOLIB_NC, RADIOLIB_NC};
static const Module::RfSwitchMode_t rfswitch_table[] = {
  {Module::MODE_IDLE,  {HIGH, RADIOLIB_NC}},
  {Module::MODE_RX,    {HIGH, RADIOLIB_NC}},
  {Module::MODE_TX,    {LOW, RADIOLIB_NC}},
   END_OF_MODE_TABLE,
};

TaskHandle_t RadioTaskHandle;
TaskHandle_t CrsfTaskHandle;

void IRAM_ATTR setFlag(void) {
  BaseType_t xHigherPriorityTaskWoken = pdFALSE;
  vTaskNotifyGiveFromISR(RadioTaskHandle, &xHigherPriorityTaskWoken);
  if (xHigherPriorityTaskWoken) portYIELD_FROM_ISR();
}

static const uint16_t BINDCODE = 407;

#pragma pack(push, 1)
struct CmdPacket {
  uint16_t bindCode;      //binding code
  uint8_t  arm;           //arm or disarm
  uint16_t motorX;        //motor X throttle
  uint16_t motorY;        //motor Y throttle
  uint16_t motorZ;        //motor Z throttle
  uint8_t  flags;         //flags
};

struct TelPacket {
  uint16_t bindCode;
  int32_t  pressure_pa;
  uint8_t  temp_f;        
  uint16_t battery_mv;
  uint8_t  battery_a;
  uint16_t used_mah;
  uint8_t  batteryPer;
  int32_t  gps_lat;
  int32_t  gps_lon;
  uint8_t  gps_sats;
  uint16_t gps_spd;
  uint8_t  codes;       
};
#pragma pack(pop)

uint16_t seq = 0;

void RadioTask(void *pvParameters) {
  TickType_t xLastWakeTime = xTaskGetTickCount();
  const TickType_t xFrequency = pdMS_TO_TICKS(100); 
  for (;;) {

    if(refreshCount == 0){
      startTime = millis();
    }

    if(refreshCount == 10){
      stopTime = millis();
    }

    CmdPacket cmd1{};
    cmd1.bindCode = BINDCODE;

    if (xSemaphoreTake(channelMutex, pdMS_TO_TICKS(5)) == pdTRUE) {
      cmd1.arm    = channels[ARM_CHANNEL] > ARM_THRESHOLD ? 1 : 0;
      cmd1.motorX = channels[0];  // CH1 — Roll / X
      cmd1.motorY = channels[1];  // CH2 — Pitch / Y
      cmd1.motorZ = channels[2];  // CH3 — Throttle / Z
      if (cmd1.motorZ < 1500) {
          cmd1.motorZ = 1500;
      }

      // cmd1.flags  = (channels[KILL_CHANNEL] > KILL_THRESHOLD) ? 0x01 : 0x00;
      xSemaphoreGive(channelMutex);


    }

    if (cmd1.motorZ < 1500) {
        cmd1.motorZ = 1500;
    }

    int tx = radio.transmit((uint8_t*)&cmd1, sizeof(cmd1));

    radio.startReceive();
    vTaskDelay(pdMS_TO_TICKS(50));
    uint16_t irq = radio.getIrqFlags();

    if (irq & RADIOLIB_SX126X_IRQ_RX_DONE) {
      TelPacket tel1{};
      int state = radio.readData((uint8_t*)&tel1, sizeof(tel1));

      if (state == RADIOLIB_ERR_NONE && tel1.bindCode == BINDCODE) {
        refreshCount++;

        // Store telemetry for GUI 
        if (xSemaphoreTake(telMutex, pdMS_TO_TICKS(5)) == pdTRUE) {
          telValid       = true;
          tel_pressure_pa = tel1.pressure_pa;
          tel_temp_f      = tel1.temp_f;
          tel_battery_mv  = tel1.battery_mv;
          tel_battery_a   = tel1.battery_a;
          tel_used_mah    = tel1.used_mah;
          tel_batteryPer  = tel1.batteryPer;
          tel_gps_lat     = tel1.gps_lat;
          tel_gps_lon     = tel1.gps_lon;
          tel_gps_sats    = tel1.gps_sats;
          tel_gps_spd     = tel1.gps_spd;
          tel_codes       = tel1.codes;
          RSSI            = radio.getRSSI();
          SNR             = radio.getSNR();
          xSemaphoreGive(telMutex);
        }

        if(refreshCount == 11){
          totalTime = stopTime - startTime;
          refreshRate = 10000.0 / totalTime;
          lostPacketRate = (100 * lostPacketCount) / (lostPacketCount + 10);
          refreshCount = 0;
          lostPacketCount = 0;
        }
      }
      else{
        lostPacketCount++;
      }
    }
    else{
      lostPacketCount++;
    }
    vTaskDelayUntil(&xLastWakeTime, xFrequency);
  }
}

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

static uint16_t crsfToUs(uint16_t v) {
  v = constrain(v, 172, 1811);
  return (uint16_t)(1000 + (long)(v - 172) * 1000L / (1811 - 172));
}

static void decodeChannels(const uint8_t* payload) {
  uint16_t tmp[16];
  uint32_t bitbuf = 0;
  int bits = 0;
  int idx = 0;

  for (int i = 0; i < 22 && idx < 16; i++) {
    bitbuf |= ((uint32_t)payload[i]) << bits;
    bits += 8;
    while (bits >= 11 && idx < 16) {
      tmp[idx++] = crsfToUs(bitbuf & 0x7FF);
      bitbuf >>= 11;
      bits -= 11;
    }
  }

  if (xSemaphoreTake(channelMutex, pdMS_TO_TICKS(5)) == pdTRUE) {
    memcpy(channels, tmp, sizeof(channels));
    xSemaphoreGive(channelMutex);
  }
}

static uint8_t frame[64];
static int pos = 0;
static int need = 0;

void CrsfTask(void *pvParameters) {
  uint32_t localLastPrintMs = 0;

  for (;;) {
    // Read all available CRSF bytes
    while (Serial2.available()) {
      uint8_t b = (uint8_t)Serial2.read();

      if (pos == 0) {
        if (b == CRSF_ADDR_FC) {
          frame[pos++] = b;
        }
        continue;
      }

      if (pos == 1) {
        frame[pos++] = b;
        need = 2 + b;
        if (need < 4 || need > (int)sizeof(frame)) {
          pos = 0;
          need = 0;
          errorCount++;
        }
        continue;
      }

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

    if (millis() - localLastPrintMs >= 50) {
      localLastPrintMs = millis();

      if (frameCount == 0) {
        vTaskDelay(pdMS_TO_TICKS(1));
        continue;
      }

      bool connected = (millis() - lastFrameMs) < 500;

      uint16_t ch_snap[16];
      if (xSemaphoreTake(channelMutex, pdMS_TO_TICKS(5)) == pdTRUE) {
        memcpy(ch_snap, channels, sizeof(channels));
        xSemaphoreGive(channelMutex);
      }

      bool arm  = ch_snap[ARM_CHANNEL]  > ARM_THRESHOLD;
      // bool kill = ch_snap[KILL_CHANNEL] > KILL_THRESHOLD;
      
      if (ch_snap[2] < 1500) {
        ch_snap[2] = 1500;
      }


      // Channel JSON
      Serial.print("{\"type\":\"ch\",\"ch\":[");
      for (int i = 0; i < NUM_CH_TO_SEND; i++) {
        Serial.print(ch_snap[i]);
        if (i < NUM_CH_TO_SEND - 1) Serial.print(",");
      }
      Serial.print("],\"arm\":");
      Serial.print(arm ? 1 : 0);
      // Serial.print(",\"kill\":");
      // Serial.print(kill ? 1 : 0);
      Serial.print(",\"connection\":");
      Serial.print(connected ? "true" : "false");

      if (xSemaphoreTake(telMutex, pdMS_TO_TICKS(5)) == pdTRUE) {
        if (telValid) {
          Serial.printf(
            ",\"rssi\":%.1f,\"snr\":%.1f"
            ",\"pressure\":%ld,\"temp\":%u"
            ",\"bat_mv\":%u,\"bat_a\":%u,\"bat_mah\":%u,\"bat_pct\":%u"
            ",\"gps_lat\":%ld,\"gps_lon\":%ld,\"gps_sats\":%u,\"gps_spd\":%u"
            ",\"codes\":%u",
            RSSI, SNR,
            (long)tel_pressure_pa, tel_temp_f,
            tel_battery_mv, tel_battery_a, tel_used_mah, tel_batteryPer,
            (long)tel_gps_lat, (long)tel_gps_lon, tel_gps_sats, tel_gps_spd,
            tel_codes
          );
        }
        xSemaphoreGive(telMutex);
      }

      Serial.println("}");
    }

    vTaskDelay(pdMS_TO_TICKS(1)); 
  }
}

void setup() {
  Serial.begin(115200);
  delay(500);

  refreshCount = 0;
  refreshRate = 0;
  lostPacketCount = 0;
  lostPacketRate = 0;

  channelMutex = xSemaphoreCreateMutex();
  telMutex     = xSemaphoreCreateMutex();

  int st = radio.begin();
  radio.setFrequency(915.0);
  radio.setSpreadingFactor(7);
  radio.setBandwidth(500.0);
  radio.setCodingRate(5);
  radio.setOutputPower(22);
  radio.setRfSwitchTable(rfswitch_pins, rfswitch_table);
  if (st != RADIOLIB_ERR_NONE) while (true) delay(1000);

  Serial.println("Ground Station Ready!");

  radio.setPacketReceivedAction(setFlag);

  Serial2.begin(CRSF_BAUD, SERIAL_8N1, RX2_PIN, TX2_PIN);

  for (int i = 0; i < 16; i++) channels[i] = 1500; 

  xTaskCreatePinnedToCore(RadioTask, "RadioTask", 4096, NULL, 2, &RadioTaskHandle, 1);
  xTaskCreatePinnedToCore(CrsfTask,  "CrsfTask",  4096, NULL, 1, &CrsfTaskHandle,  0);

  vTaskDelete(NULL);
}

void loop() {
}
