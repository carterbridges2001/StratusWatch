import mqtt from 'mqtt';
import dotenv from 'dotenv';

dotenv.config();

// MQTT client options
const mqttOptions: mqtt.IClientOptions = {
  clientId: `stratuswatch-server-${Math.random().toString(16).substring(2, 10)}`,
  clean: true,
  connectTimeout: 4000,
  reconnectPeriod: 1000,
};

// MQTT topics to subscribe to
const MQTT_TOPIC_PREFIX = process.env.MQTT_TOPIC_PREFIX || 'stratuswatch/sensors/+';

// Create MQTT client
const client = mqtt.connect(process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883', mqttOptions);

// Connection event handlers
client.on('connect', () => {
  console.log(`Connected to MQTT broker at ${process.env.MQTT_BROKER_URL}`);
  
  // Subscribe to all sensor topics
  client.subscribe(MQTT_TOPIC_PREFIX, { qos: 0 }, (err) => {
    if (err) {
      console.error('Error subscribing to MQTT topics:', err);
      return;
    }
    console.log(`Subscribed to MQTT topics: ${MQTT_TOPIC_PREFIX}`);
  });
});

client.on('error', (error) => {
  console.error('MQTT Error:', error);
});

client.on('offline', () => {
  console.log('MQTT client is offline');});

client.on('reconnect', () => {
  console.log('Attempting to reconnect to MQTT broker...');
});

// Message handler
client.on('message', (topic, message) => {
  try {
    const payload = JSON.parse(message.toString());
    console.log(`Received message on ${topic}:`, payload);
    
    // Here we'll add code to forward the message to WebSocket clients
    // and store it in InfluxDB (in future steps)
  } catch (error) {
    console.error('Error processing MQTT message:', error);
  }
});

export default client;
