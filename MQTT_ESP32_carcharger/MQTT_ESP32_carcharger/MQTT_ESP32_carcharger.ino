/*********
  Poletto Matteo
*********/
#include <WiFi.h>
#include <PubSubClient.h>
#include <Wire.h>
#include <WiFiUdp.h>
#include <ArduinoMDNS.h>
#include "EmonLib.h"

#include <LiquidCrystal_I2C.h> // Libreria display I2C

LiquidCrystal_I2C lcd(0x3f,20,4);

int n_camp = 50; // numero di campionamenti
int pin_sct = 39;
int pin_trimmer = 35;

#define device_name "1"
#define nomeAuto "Ypsilon"
#define pin_sct_topic "39"
#define pin_trimmer_topic "35"




#define SEALEVELPRESSURE_HPA (1011.0)
#define BSZ 350
#define INTERVAL 5000
#define WCLOCK 100
#define DELTAP 26.11
#define CORRECT 2.95

#define SDA 19
#define SCL 21    

#define DESCRIPTION_REQ "query/test/#"
#define TOPIC1 "event/"device_name"/"nomeAuto"/"pin_sct_topic  // topic1 su cui pubblica i dati  gpio da cambiare con PIN input
#define TOPIC2 "event/"device_name"/"pin_trimmer_topic
#define TOPIC_SUB "event"/
#define DESC_TOPIC "desc/colonnina/corrente/gpio"  // topic su cui pubblica la descrizione

#define CLIENTID "bme3"
#define WDTO_16S 15

// Replace the next variables with your SSID/Password combination
const char* ssid =  "Vodafone-EkbcEnNbE"; //"Vodafone-EkbcEnNbE";
const char* passWifi = "ktHmenxmGJhbH4hn"; //"ktHmenxmGJhbH4hn";

char hostName[] = "carcharger";

IPAddress mqtt_server(0, 0, 0, 0);

//char* mqtt_server = "192.168.1.2";
int mqtt_port = 1883;

char* mqtt_user = "colonnina_1";
char* mqtt_pass = "admin123";


char const description[]="{\"desc\":[{\"name\":\"TM\",\"desc\":{\"field\":\"value\",\"value\":0.0}},\n{\"name\":\"P0\",\"desc\":{\"field\":\"value\",\"value\":0.0}},\n{\"name\":\"P1\",\"desc\":{\"field\":\"value\",\"value\":0.0}},\n{\"name\":\"HU\",\"desc\":{\"field\":\"value\",\"value\":0.0}},\n{\"name\":\"CO\",\"desc\":{\"field\":\"value\",\"value\":0.0}}]}";

// Add your MQTT Broker IP address, example:
//const char* mqtt_server = "192.168.1.100";

//const char* mqtt_server = "192.168.0.102";

WiFiClient clientWifi;
PubSubClient client;

WiFiUDP udp;
MDNS mdns(udp);


long lastMsg = 0;
char msg[50];
int tensione = 220.0; // Italia 230V in alcuni paesi 110V 

int pin_y = 25;
int pin_r = 32;
int pin_g = 33;

int count = 0;
int myclock = 0;

void nameFound(const char* name, IPAddress ip);

byte mac[] = { 0xDE, 0xAD, 0xBE, 0xEF, 0xFE, 0xED };
byte ip[] = { 192,168,1,177 };


// -------------------------- MQTT --------------------------

void callback(char* topic, byte* payload, unsigned int length) {
    //Serial.print("Message arrived on topic: ");
    //Serial.print(topic);
    //Serial.print(". Message: ");
    String messageTemp;
    
    for (int i = 0; i < length; i++) {
      //Serial.print((char)message[i]);
      messageTemp += (char)payload[i];
    }
    //Serial.println();
    //Serial.println(messageTemp);

    int d = messageTemp.length();

    String stato = messageTemp.substring(20, d-4);

    if (String(topic) == "event/"device_name"/stato") {
        //Serial.print("Stato: ");Serial.println(stato);
        digitalWrite(pin_y, LOW);
        digitalWrite(pin_r, LOW);
        digitalWrite(pin_g, LOW);
        
        if(stato == "libera"){
          digitalWrite(pin_g, HIGH);
        }else if(stato == "prenotata"){
          digitalWrite(pin_y, HIGH);
        }else if(stato == "occupata"){
          digitalWrite(pin_r, HIGH);
        }
        
    }else if(String(topic) == "event/"device_name"/OTPresult"){
      // prendo le stringhe etc
      // stampo su display e serial
      // {"event":[{"otpResult":"false"}]}
      String result = messageTemp.substring(24, d-4);
      //Serial.print("Result OTP:");Serial.println(result);
      printOTPresult(result);
    }
}


// message, "event", "corrente", valCurr, "capacita", valBatt, "percentuale", val
void mkmessageCurr(char msg[], char ty[], char campo1[], float val1, char campo2[], int val2, char campo3[], int val3) {
  sprintf(msg, "{\"%s\":[{\"%s\":%.2f,\"%s\":%d,\"%s\":%d}]}", ty, campo1, val1, campo2, val2, campo3, val3);
}

void mkmessageOTP(char msg[], char ty[], char campo1[], char val1[]) {
  sprintf(msg, "{\"%s\":[{\"%s\":\"%s\"}]}", ty, campo1, val1);
}

// -------------------------- WIFI --------------------------
void setup_wifi() {
  delay(10);
  // We start by connecting to a WiFi network
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  printStuffToLCD("Connecting to ", ssid);

  WiFi.begin(ssid, passWifi);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected");
  
  printStuffToLCD("WiFi connected", "");

  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());


  printStuffToLCD("IP address: ", WiFi.localIP().toString());

  mdns.begin(WiFi.localIP(), "colonnina_1");
  mdns.setNameResolvedCallback(nameFound);
  /*clientRete.setCACert(test_root_ca);
  clientRete.setCertificate(test_client_cert); // for client verification
  clientRete.setPrivateKey(test_client_key);	// for client verification*/
}



void reconnect() {
  // Loop until we're reconnected
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    printStuffToLCD("Attempting MQTT connection...", "");

    // Attempt to connect
    if (client.connect("colonnina_1", mqtt_user, mqtt_pass)) {
      Serial.println("connected");
      lcd.setCursor(0,1);
      lcd.print("connected");
      // Subscribe
      client.subscribe("event/"device_name"/stato");
      client.subscribe("event/"device_name"/OTPresult");
    } else {
      Serial.print("failed, rc=");Serial.print(client.state());
      Serial.println(" try again in 5 seconds");

      lcd.setCursor(0,1);
      lcd.print("failed, rc=");lcd.print(client.state());
      // Wait 5 seconds before retrying
      delay(5000);
    }
  }
}

// -------------------------- LCD --------------------------

void LCDsetup(){
  Wire.begin(SDA, SCL);
  lcd.init();
  lcd.backlight();
  lcd.clear();
}

void printStuffToLCD(String first, String second){
  lcd.clear();
  lcd.setCursor(0,0);
  lcd.print(first);
  lcd.setCursor(0,1);
  lcd.print(second);
  delay(1500);
}


void printOTPresult(String result){
  lcd.clear();
  lcd.setCursor(0,0);
  lcd.print("Risultato OTP");
  lcd.setCursor(0,1);
  lcd.print(result);
  delay(1500);
}

void printValuesToLCD(double val, int perc){
   lcd.clear();
   lcd.setCursor(0,0);
   lcd.print("Pot (W): ");
   lcd.print(val*tensione);
   lcd.setCursor(0,1);
   lcd.print("Per (%): ");
   lcd.print(perc);
}



// -------------------------- SETUP --------------------------
void setup() {
  Serial.begin(9600);
  LCDsetup();


  setup_wifi();
  client.setClient(clientWifi);
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);

  pinMode(pin_y, OUTPUT);
  pinMode(pin_r, OUTPUT);
  pinMode(pin_g, OUTPUT);
 
  analogSetPinAttenuation(pin_sct, ADC_11db);
  analogSetPinAttenuation(pin_trimmer, ADC_11db);
  readCurr();

  randomSeed(0);

}


// -------------------------- LOOP --------------------------
void loop() {

  if(mqtt_server[0] == 0) {
   // Serial.println(hostName);
    //scoperta dei servizi
    mdns.resolveName(hostName, 5000); 

    //si ripete il loop finchè non si torva il server
    //si comporta come una break, riesegue il loop
    mdns.run();
   // Serial.println(server);
    delay(6000);
  }
  else {
    //se cade la connessione, si riconnette
    if (!client.connected()) {
      client.setServer(mqtt_server, 1883);
      reconnect();
    }
  }

  
  //Serial.println("Sono nel loop");
  char message[BSZ];
  /*if(!client.connected()){
    reconnect();
  }*/


  
  
  client.loop();
 
  
  

    if(myclock > INTERVAL) {
    //pubblica il valore di un sensore ogni 5 secondi (INTERVAL)
    //Serial.println("loop");

        double media_curr = readCurr();

        int val = analogRead(pin_trimmer);
        Serial.print("Trimmer AnalogRead: ");Serial.println(val);
        if(analogRead(pin_trimmer) > 4090)val = 100;
        else if(analogRead(pin_trimmer) < 370) val = 0;
        else val = map(val,0,4096,0,100);
        
        
        // TOPIC 1 - CORRENTE
        int percBatt = val; // 10-100%
        int valBatt = 30; // in kWhr
        float pwr = media_curr*tensione;   // in W
        mkmessageCurr(message, "event", "corrente", media_curr, "capacita", valBatt, "percentuale", percBatt);
        //sprintf(message,"{\"event\":\"%d.%d\"}",(int)val, (int)(val*100)-(int)val*100);
        Serial.print("Message Topic 1 "); Serial.print(TOPIC1); Serial.print(": ");
        Serial.println(message);
        client.publish(TOPIC1 "/dati", message);
        printValuesToLCD(media_curr, percBatt);
        
        
        
        // TOPIC 2 - OTP
        String otpIn = "";
        if(Serial.available()){
          otpIn = Serial.readString();
        }

        Serial.print("OTP: ");Serial.print(otpIn);Serial.println(""); 
        if(otpIn != ""){
          char otp[50];
          otpIn.toCharArray(otp, otpIn.length());
          mkmessageOTP(message, "event", "OTP", otp);
          Serial.print("Message Topic 2 "); Serial.print(TOPIC2); Serial.print(": ");
          Serial.println(message);
          client.publish(TOPIC2 "/otp", message);
        }
    count++;
    if(count>3) count = 0;
    myclock = 0;
  }
  delay(WCLOCK);
  myclock += WCLOCK;
}
  










// -------------------------- AUSILIARIE --------------------------

double readCurr(){
  // CAMPIONAMENTO CORRENTE
  double val = analogRead(pin_sct);
  val = map(val,0,4096,0,100);
  double correnteInst =  val/100;
  //Serial.print("Val: ");Serial.println(val);
  //Serial.print("Corrente: ");Serial.println(correnteInst);
  double min_curr = 0;
  double max_curr = 0;
  double media;

  Serial.println("Campionamento.");
  for(int i = 0; i < n_camp; i++){
    val = analogRead(pin_sct);
    val = map(val,0,1023,0,100);
    //Serial.print("Val: ");Serial.println(val);
    Serial.print(".");
    correnteInst = val/100;
    media += correnteInst;

    //Serial.print("Media durante campionamento: ");Serial.println(media);

    delay(100);
  }
  Serial.println();

  media = media / n_camp;
  media -= 0.04;
  if(media < 0)media = 0;
  Serial.print("Media Corrente: ");Serial.println(media);
  return media;
}

//assegna al server l'ip della macchina scoperta (htmaster)
void nameFound(const char* name, IPAddress ip){
  Serial.print(name);Serial.print("@");
  Serial.println(ip);
  if (ip != INADDR_NONE) {
    Serial.print("The IP address for '");
    Serial.print(name);
    Serial.print("' is ");
    Serial.println(ip);
    mqtt_server = ip;
  } else {
    Serial.print("Resolving '");
    Serial.print(name);
    Serial.println("' timed out.");
  }
}
